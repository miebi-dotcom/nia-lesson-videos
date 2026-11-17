// Motion audit (references/motion-polish.md, "Audit first"): inventory every animated layer of a comp and
// check it against the attention-to-detail checklist. Read-only.
// DATA: { "compId": 1694, "outFile": "<work>/audit_S05.json",     full report (inventory + issues) as JSON
//         "fastPx": 30,          px per frame above which a moving layer needs motion blur
//         "readRate": 0.35 }     seconds per word a text must stay readable (plus 1 s)
// Result: counts per issue type and the first 40 issues; the full list goes to outFile.
var c = byId(DATA.compId);
if (!c) throw new Error("compId not found");
var fd = c.frameDuration, fps = Math.round(1 / fd * 100) / 100, FAST = DATA.fastPx || 30, RATE = DATA.readRate || 0.35;
var inv = [], issues = [], count = {};
function fr(t) { return Math.round(t / fd * 100) / 100; }
function add(type, L, prop, at, msg) {
    count[type] = (count[type] || 0) + 1;
    issues.push({ type: type, layer: L.name, index: L.index, prop: prop, frame: at === null ? null : fr(at), msg: msg });
}
function animated(group, path, out) {      // every keyed property under a group
    for (var i = 1; i <= group.numProperties; i++) {
        var p = group.property(i);
        if (!p) continue;
        var nm = path ? path + " > " + p.name : p.name;
        if (p.propertyType === PropertyType.PROPERTY) {
            if (p.numKeys > 0 && p.matchName !== "ADBE Marker") out.push({ p: p, path: nm });
        } else if (p.numProperties) animated(p, nm, out);
    }
    return out;
}
function trimmed(L) {     // a line being drawn on (Trim Paths keyed): an opacity flip under it is invisible
    if (!(L instanceof ShapeLayer)) return false;
    var rv = L.property("ADBE Root Vectors Group");
    for (var i = 1; i <= rv.numProperties; i++) if (rv.property(i).matchName === "ADBE Vector Filter - Trim") return true;
    return false;
}
function vlen(a) { if (!(a instanceof Array)) return Math.abs(a); var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s); }
function diff(a, b) { if (!(a instanceof Array)) return b - a; var r = []; for (var i = 0; i < a.length; i++) r.push(b[i] - a[i]); return r; }

var anyBlur = false;
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j);
    if (!L.enabled && !(L.isTrackMatte)) continue;
    var props = animated(L, "", []);
    var ltype = "footage";       // if/else, not chained ?: (ExtendScript bug)
    if (L instanceof TextLayer) ltype = "text"; else if (L instanceof ShapeLayer) ltype = "shape"; else if (L.source instanceof CompItem) ltype = "precomp";
    var row = { index: j, name: L.name, inF: fr(L.inPoint), outF: fr(L.outPoint), type: ltype, props: [] };
    var moving = false, maxSpeed = 0, firstKey = 1e9, lastKey = -1;
    for (var q = 0; q < props.length; q++) {
        var p = props[q].p, nm = props[q].path, keys = [];
        if (p.matchName === "ADBE Time Remapping") continue;            // remap keys are timing, not motion
        var uniform = p.numKeys > 1, inf0 = null;
        for (var k = 1; k <= p.numKeys; k++) {
            var t = p.keyTime(k), ki = p.keyInInterpolationType(k), ko = p.keyOutInterpolationType(k);
            firstKey = Math.min(firstKey, t); lastKey = Math.max(lastKey, t);
            var ie = null, oe = null;
            try { ie = p.keyInTemporalEase(k)[0]; oe = p.keyOutTemporalEase(k)[0]; } catch (e) {}
            var kt = "bez";
            if (ki === KeyframeInterpolationType.LINEAR) kt = "lin"; else if (ki === KeyframeInterpolationType.HOLD) kt = "hold";
            keys.push([fr(t), kt, ie ? Math.round(ie.influence) : null, oe ? Math.round(oe.influence) : null]);
            if (Math.abs(t / fd - Math.round(t / fd)) > 0.01) add("subframe", L, nm, t, "key between frames (frame " + fr(t) + ")");
            var linear = (k > 1 && ki === KeyframeInterpolationType.LINEAR) || (k < p.numKeys && ko === KeyframeInterpolationType.LINEAR);
            if (linear && !p.expressionEnabled) add("linear", L, nm, t, "linear keyframe (no ease)");
            if (ie && oe && ki === KeyframeInterpolationType.BEZIER && Math.abs(ie.influence - 33.33) < 0.5 && Math.abs(oe.influence - 33.33) < 0.5)
                add("defaultEase", L, nm, t, "default symmetric Easy Ease (33/33)");
            var pair = ie && oe ? Math.round(ie.influence) + "/" + Math.round(oe.influence) : null;
            if (k === 1) inf0 = pair; else if (pair !== inf0) uniform = false;
            if (k > 1) {
                var dt = t - p.keyTime(k - 1);
                if (dt > 0 && (p.matchName === "ADBE Position" || p.matchName === "ADBE Position_0" || p.matchName === "ADBE Position_1")) {
                    var sp = vlen(diff(p.keyValue(k - 1), p.keyValue(k))) / (dt / fd);
                    maxSpeed = Math.max(maxSpeed, sp * 1.6);                // eased peak speed is ~1.6x the average
                    moving = true;
                }
                if (dt > 0 && dt < fd * 1.5 && p.matchName === "ADBE Opacity" && Math.abs(p.keyValue(k) - p.keyValue(k - 1)) >= 90 && !trimmed(L))
                    add("pop", L, nm, t, "opacity jumps " + Math.round(p.keyValue(k - 1)) + "->" + Math.round(p.keyValue(k)) + " in one frame");
            }
        }
        // no shape: the start eases about as much as the landing (an entrance should be fast-out, soft landing)
        if (p.numKeys >= 2 && !p.expressionEnabled) {
            try {
                var fo = p.keyOutTemporalEase(1)[0].influence, li = p.keyInTemporalEase(p.numKeys)[0].influence;
                if (p.keyOutInterpolationType(1) === KeyframeInterpolationType.BEZIER && Math.abs(fo - li) < 5 && !(Math.abs(fo - 33.33) < 0.5))
                    add("symmetricEase", L, nm, null, "start and landing eased the same (" + Math.round(fo) + "/" + Math.round(li) + "): no entrance/exit shape");
            } catch (e) {}
        }
        if (p.matchName === "ADBE Scale") {
            var rv = p.keyValue(p.numKeys);
            // a settle that misses 100% (99.7, 100.3). Other non-whole rests are layout sizes (a photo fitted at 95.6%)
            for (var d = 0; d < 2; d++) if (Math.abs(rv[d] - 100) > 0.05 && Math.abs(rv[d] - 100) < 1) { add("restScale", L, nm, p.keyTime(p.numKeys), "settles at " + Math.round(rv[d] * 100) / 100 + "% instead of 100%"); break; }
            moving = true;
        }
        if (p.matchName === "ADBE Rotate Z") moving = true;
        if (L instanceof TextLayer && p.matchName === "ADBE Position" && !L.parent) {
            var pv = p.keyValue(p.numKeys);
            if (Math.abs(pv[0] - Math.round(pv[0])) > 0.05 || Math.abs(pv[1] - Math.round(pv[1])) > 0.05)
                add("restSubpixel", L, nm, p.keyTime(p.numKeys), "text rests on a sub-pixel position (" + Math.round(pv[0] * 100) / 100 + ", " + Math.round(pv[1] * 100) / 100 + ")");
        }
        row.props.push({ path: nm, keys: keys, expr: p.expressionEnabled ? 1 : 0 });
    }
    if (L.motionBlur) anyBlur = true;
    if (moving && maxSpeed > FAST && !L.motionBlur) add("noMotionBlur", L, "Motion Blur", null, "moves up to ~" + Math.round(maxSpeed) + " px/frame without motion blur");
    // pops on with no entrance, mid-comp
    if (props.length === 0 && L.inPoint > c.workAreaStart + fd && L.inPoint < c.duration - fd && !(L.source instanceof CompItem))
        add("hardIn", L, "in point", L.inPoint, "appears on one frame with no entrance (intended hard cut?)");
    // invisible lingering before the entrance
    var op = tg(L).property("ADBE Opacity");
    if (op.numKeys && op.keyValue(1) === 0 && op.keyTime(1) - L.inPoint > 1) add("lingering", L, "in point", L.inPoint, "layer sits invisible for " + Math.round((op.keyTime(1) - L.inPoint) * 10) / 10 + " s before its entrance: trim the in point");
    // readability: text visible long enough after its entrance
    if (L instanceof TextLayer) {
        var txt = String(L.property("Source Text").value.text), words = txt.replace(/^\s+|\s+$/g, "").split(/\s+/).length;
        var settled = lastKey >= 0 ? Math.max(lastKey, L.inPoint) : L.inPoint, need = words * RATE + 1;
        if (L.outPoint - settled < need && L.outPoint < c.duration - fd) add("readTime", L, "out point", L.outPoint, "readable " + Math.round((L.outPoint - settled) * 10) / 10 + " s, needs ~" + Math.round(need * 10) / 10 + " s for " + words + " words");
        // title safe (10% margins), at rest, unparented and unrotated only
        if (!L.parent) {
            try {
                var r = L.sourceRectAtTime(L.outPoint - fd, false), pos = tg(L).property("ADBE Position").valueAtTime(L.outPoint - fd, false);
                var an = tg(L).property("ADBE Anchor Point").value, sc = tg(L).property("ADBE Scale").value;
                var x0 = pos[0] + (r.left - an[0]) * sc[0] / 100, x1 = x0 + r.width * sc[0] / 100, y0 = pos[1] + (r.top - an[1]) * sc[1] / 100, y1 = y0 + r.height * sc[1] / 100;
                if (x0 < c.width * 0.1 || x1 > c.width * 0.9 || y0 < c.height * 0.1 || y1 > c.height * 0.9) add("titleSafe", L, "position", null, "text reaches outside the title-safe area (10% margins)");
            } catch (e) {}
        }
        var ta = L.property("ADBE Text Properties").property("ADBE Text Animators");
        var hasPos = false;
        for (var q = 0; q < props.length; q++) if (props[q].p.matchName === "ADBE Position" || props[q].p.matchName === "ADBE Opacity") hasPos = true;
        if (hasPos && ta.numProperties === 0 && txt.length > 12) add("wholeLayerText", L, "Transform", null, "text enters as a whole layer: a Text Animator cascade (words/lines) reads better");
    }
    inv.push(row);
}
if (anyBlur && !c.motionBlur) add("compBlurOff", { name: c.name, index: 0 }, "comp Motion Blur", null, "layers have motion blur but the comp switch is off (nothing renders)");

if (DATA.outFile) { var f = new File(DATA.outFile); f.encoding = "UTF-8"; f.open("w"); f.write(toJSON({ comp: c.name, fps: fps, inventory: inv, issues: issues })); f.close(); }
R.comp = c.name; R.fps = fps; R.layersAnimated = 0;
for (var i = 0; i < inv.length; i++) if (inv[i].props.length) R.layersAnimated++;
R.counts = count; R.issues = issues.slice(0, 40);
R.done.push(c.name + ": " + issues.length + " issues in " + inv.length + " layers" + (DATA.outFile ? " (full report: " + DATA.outFile + ")" : ""));
