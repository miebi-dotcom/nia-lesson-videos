// Mechanical polish fixes for one comp (references/motion-polish.md, passes 2 and 4). One undo step.
// Only touches keyframes, eases, resting values and motion-blur switches of the layers in this comp:
// never the inside of template precomps, never timing (when things happen stays exactly as it was).
// DATA: { "compId": 1694,
//         "fix": ["snap", "ease", "rest", "trim", "blur"],   any subset (default all)
//         "skip": "regex of layer names to leave alone",
//         "fastPx": 30 }
//   snap : keys on sub-frames move to the nearest whole frame (skipped if a key already sits there)
//   ease : linear keys, the default 33/33 Easy Ease and uniform symmetric eases become the signature curves:
//          entrance (opacity/scale from 0) = "in", exit (to 0) = "out", anything else = "move".
//          Left alone: hold keys, expressions, time remap, slow constant rotation/scrolling (mechanical by intent).
//   rest : a scale that settles just off 100% (99.7) lands on 100; resting text position on whole pixels (unparented)
//   trim : a layer invisible before its entrance (opacity/scale/draw-on start at 0) starts at its entrance
//   blur : motion blur on layers moving faster than fastPx px/frame, and the comp switch on
var c = byId(DATA.compId);
if (!c) throw new Error("compId not found");
var fd = c.frameDuration, FAST = DATA.fastPx || 30, skip = DATA.skip ? new RegExp(DATA.skip, "i") : null;
var F = {}, fx = DATA.fix || ["snap", "ease", "rest", "trim", "blur"];
for (var i = 0; i < fx.length; i++) F[fx[i]] = true;
var log = { snap: 0, ease: 0, rest: 0, trim: 0, blur: 0 }, notes = [];

function keyed(group, out) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p = group.property(i);
        if (!p) continue;
        if (p.propertyType === PropertyType.PROPERTY) { if (p.numKeys > 0 && p.matchName !== "ADBE Marker" && p.matchName !== "ADBE Time Remapping") out.push(p); }
        else if (p.numProperties) keyed(p, out);
    }
    return out;
}
function mag(v) {         // size of a value; for x/y/z arrays only x and y (scale's z is always 100)
    if (!(v instanceof Array)) return v;
    var n = Math.min(v.length, 2), s = 0;
    for (var i = 0; i < n; i++) s += Math.abs(v[i]);
    return s / n;
}
function modeOf(p) {
    var a = mag(p.keyValue(1)), b = mag(p.keyValue(p.numKeys));
    var fades = p.matchName === "ADBE Opacity" || p.matchName === "ADBE Scale" || p.matchName === "ADBE Text Percent Offset" ||
                p.matchName === "ADBE Vector Trim End" || p.matchName === "ADBE Vector Trim Start";
    if (p.matchName === "ADBE Text Percent Offset" || p.matchName === "ADBE Vector Trim End") return "in";
    if (fades && a < 5 && b > a) return "in";
    if (fades && b < 5 && a > b) return "out";
    return "move";
}
// A property needs the signature curve when it has linear keys, the default 33/33 Easy Ease, or no shape:
// its start (first key, outgoing) eases about as much as its landing (last key, incoming), so an entrance
// doesn't read as fast-out / soft-landing. Judge BEFORE snapping (moving keys disturbs eases).
function needsEase(p) {
    if (p.expressionEnabled || p.numKeys < 2) return false;
    for (var k = 1; k <= p.numKeys; k++) {
        var ki = p.keyInInterpolationType(k), ko = p.keyOutInterpolationType(k);
        if (ki === KeyframeInterpolationType.HOLD || ko === KeyframeInterpolationType.HOLD) return false;
        if ((k > 1 && ki === KeyframeInterpolationType.LINEAR) || (k < p.numKeys && ko === KeyframeInterpolationType.LINEAR)) return true;
        var ie = p.keyInTemporalEase(k)[0].influence, oe = p.keyOutTemporalEase(k)[0].influence;
        if (Math.abs(ie - 33.33) < 0.5 && Math.abs(oe - 33.33) < 0.5) return true;
    }
    var firstOut = p.keyOutTemporalEase(1)[0].influence, lastIn = p.keyInTemporalEase(p.numKeys)[0].influence;
    return Math.abs(firstOut - lastIn) < 5;
}
function mechanical(p) {   // slow constant rotation / scroll over a long span: linear on purpose
    if (p.numKeys !== 2) return false;
    var span = p.keyTime(2) - p.keyTime(1);
    return span > 2 && (p.matchName === "ADBE Rotate Z" || p.matchName === "ADBE Position");
}

app.beginUndoGroup("Polish motion: " + c.name);
var anyBlur = false;
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j);
    if (skip && skip.test(L.name)) continue;
    var lk = L.locked; if (lk) L.locked = false;
    var props = keyed(L, []), maxSpeed = 0;
    for (var q = 0; q < props.length; q++) {
        var p = props[q];
        var reEase = F.ease && needsEase(p) && !mechanical(p);     // decided on the original eases
        if (F.snap) {
            for (var k = p.numKeys; k >= 1; k--) {
                var t = p.keyTime(k), nt = Math.round(t / fd) * fd;
                if (Math.abs(t - nt) < fd * 0.01) continue;
                var clash = false;
                for (var m = 1; m <= p.numKeys; m++) if (m !== k && Math.abs(p.keyTime(m) - nt) < fd * 0.01) clash = true;
                if (clash) { notes.push(L.name + " > " + p.name + ": sub-frame key at " + Math.round(t / fd * 100) / 100 + "f left (a key already sits on that frame)"); continue; }
                moveKeys(p, [k], [nt]); log.snap++;
            }
        }
        if (reEase) { signatureEase(p, modeOf(p)); log.ease++; }
        if (p.matchName === "ADBE Position" && p.numKeys > 1) {
            for (var k = 2; k <= p.numKeys; k++) {
                var dt = (p.keyTime(k) - p.keyTime(k - 1)) / fd, a = p.keyValue(k - 1), b = p.keyValue(k);
                if (dt > 0) maxSpeed = Math.max(maxSpeed, Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)) / dt * 1.6);
            }
        }
        if (F.rest && p.matchName === "ADBE Scale") {        // only settles that miss 100%: other values are layout sizes
            var v = p.keyValue(p.numKeys), r = [v[0], v[1], v.length > 2 ? v[2] : 100], ch = false;
            for (var d = 0; d < 2; d++) if (Math.abs(v[d] - 100) > 0.001 && Math.abs(v[d] - 100) < 1) { r[d] = 100; ch = true; }
            if (ch) { p.setValueAtKey(p.numKeys, r); log.rest++; }
        }
        if (F.rest && p.matchName === "ADBE Position" && L instanceof TextLayer && !L.parent) {
            var v = p.keyValue(p.numKeys), r = [Math.round(v[0]), Math.round(v[1])];
            if (v.length > 2) r.push(v[2]);
            if (Math.abs(v[0] - r[0]) > 0.001 || Math.abs(v[1] - r[1]) > 0.001) { p.setValueAtKey(p.numKeys, r); log.rest++; }
        }
    }
    if (F.rest && L instanceof TextLayer && !L.parent) {           // static text: whole pixels too
        var pp = tg(L).property("ADBE Position");
        if (pp.numKeys === 0 && !pp.dimensionsSeparated) { var v = pp.value; if (Math.abs(v[0] - Math.round(v[0])) > 0.001 || Math.abs(v[1] - Math.round(v[1])) > 0.001) { pp.setValue([Math.round(v[0]), Math.round(v[1])]); log.rest++; } }
    }
    if (F.trim) {
        // invisible before its entrance (opacity / scale / draw-on all start at 0): start the layer there
        var appear = null, hiddenStart = props.length > 0 && !L.isTrackMatte;   // never trim a matte source
        for (var q = 0; q < props.length; q++) {
            var p = props[q], mn = p.matchName;
            if (mn !== "ADBE Opacity" && mn !== "ADBE Scale" && mn !== "ADBE Vector Trim End" && mn !== "ADBE Text Percent Offset") continue;
            var v0 = p.keyValue(1), z = mn === "ADBE Text Percent Offset" ? v0 <= -99 : mag(v0) < 0.5;
            if (!z) { hiddenStart = false; break; }
            appear = appear === null ? p.keyTime(1) : Math.min(appear, p.keyTime(1));
        }
        if (hiddenStart && appear !== null && appear - L.inPoint > fd * 1.5) {
            var keepOut = L.outPoint;                 // setting inPoint can drag the out point along: restore it
            L.inPoint = Math.round(appear / fd) * fd;
            if (Math.abs(L.outPoint - keepOut) > fd * 0.5) L.outPoint = keepOut;
            log.trim++;
        }
    }
    if (F.blur && maxSpeed > FAST && !L.motionBlur) { L.motionBlur = true; log.blur++; }
    if (L.motionBlur) anyBlur = true;
    if (lk) L.locked = true;
}
if (F.blur && anyBlur && !c.motionBlur) { c.motionBlur = true; notes.push("comp motion blur switch turned on"); }
app.endUndoGroup();
R.fixed = log; R.notes = notes;
R.done.push(c.name + ": snapped " + log.snap + " keys, re-eased " + log.ease + " properties, " + log.rest + " resting values, trimmed " + log.trim + " in points, motion blur on " + log.blur + " layers");
