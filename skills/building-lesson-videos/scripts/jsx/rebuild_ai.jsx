// Rebuild an Illustrator file as native After Effects layers from ai_extract.py's elements.json:
// shape layers (exact paths, fills, strokes, dashes), live text layers, and the embedded images.
// Every element is a real, separately animatable layer. The only masks are Illustrator's own clipping masks
// (rounded photo cards, circular crops), on the clipped layer itself so they move with it.
// Re-running with the same comp name replaces the earlier rebuild wherever it is used.
// DATA: { "elements": "<OUT_DIR>/elements.json", "comp": "S09 Single Window (asset 5) REBUILT",
//         "fps": 24, "duration": 30, "folder": "Rebuilt AI scenes",
//         "replace": 9878,               optional: comp id whose main-comp layers get this comp instead
//         "mainId": 8812, "keepOld": "Replaced AI scenes" (folder for the replaced comp),
//         "fontMap": {"AfacadFlux-Regular": "Afacad-Regular"},
//         "layersOut": "<OUT_DIR>/layers.json" }   bounds file for choreograph.py ("layers": ...)
function readJSON(p) { var f = new File(p); f.encoding = "UTF-8"; f.open("r"); var t = f.read(); f.close(); return eval("(" + t + ")"); }
var E = readJSON(DATA.elements);
var W = Math.round(E.width), H = Math.round(E.height), fps = DATA.fps || 25;
var dir = new File(DATA.elements).parent;
var old = DATA.replace ? byId(DATA.replace) : null;
// re-running: an unused earlier rebuild is deleted; one already placed in other comps is swapped out, then deleted
var existing = compByName(DATA.comp), dropOld = null;
if (existing) {
    if (existing.usedIn.length) { if (!old || old === existing) { old = existing; dropOld = existing; } existing.name = existing.name + " (previous)"; }
    else existing.remove();
}
var dur = DATA.duration || (old ? old.duration : 30);
var folder = folderNamed(DATA.folder || "Rebuilt AI scenes", true);
var imgF = folderNamed((DATA.folder || "Rebuilt AI scenes") + " images", true);
var c = app.project.items.addComp(DATA.comp, W, H, 1, dur, fps);
c.parentFolder = folder;
var CAP = [1, 2, 3], JOIN = [1, 2, 3];   // PDF butt/round/square -> AE 1/2/3 ; miter/round/bevel -> 1/2/3
var out = {}, warn = [];


// Illustrator transparency-group opacity and clipping masks. The mask lives in layer space so it travels with
// the layer when it is animated. toLayer maps an artboard point into the layer; scl maps a tangent.
function applyCtx(L, e, toLayer, scl) {
    if (e.groupOpacity !== undefined) {
        var op = tg(L).property("ADBE Opacity");
        op.setValue(op.value * e.groupOpacity);
    }
    if (!e.clip) return;
    var mp = L.property("ADBE Mask Parade");
    for (var s = 0; s < e.clip.length; s++) {
        var sp = e.clip[s], sh = new Shape(), v = [], ii = [], oo = [];
        for (var k = 0; k < sp.v.length; k++) { v.push(toLayer(sp.v[k])); ii.push(scl(sp.i[k])); oo.push(scl(sp.o[k])); }
        sh.vertices = v; sh.inTangents = ii; sh.outTangents = oo; sh.closed = true;
        var m = mp.addProperty("ADBE Mask Atom");
        m.name = "clip " + (s + 1);
        m.property("ADBE Mask Shape").setValue(sh);
    }
}
var ID = function (p) { return [p[0], p[1]]; };

function uniq(n) { var b = n, i = 2; while (out[n]) { n = b + " " + i; i++; } return n; }

function addPath(e) {
    var L = c.layers.addShape();
    L.name = uniq(e.name);
    tg(L).property("ADBE Anchor Point").setValue([0, 0]);
    tg(L).property("ADBE Position").setValue([0, 0]);
    var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    g.name = "art";
    var v = g.property("ADBE Vectors Group");
    for (var s = 0; s < e.subpaths.length; s++) {
        var sp = e.subpaths[s], sh = new Shape();
        sh.vertices = sp.v; sh.inTangents = sp.i; sh.outTangents = sp.o; sh.closed = sp.closed;
        v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
    }
    if (e.fill) {
        var fl = v.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(e.fill);
        fl.property("ADBE Vector Fill Opacity").setValue(Math.round((e.fillOpacity === undefined ? 1 : e.fillOpacity) * 100));
        try { fl.property("ADBE Vector Fill Rule").setValue(e.evenOdd ? 2 : 1); } catch (x) {}
    }
    if (e.stroke && e.width > 0) {
        var st = v.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue(e.stroke);
        st.property("ADBE Vector Stroke Width").setValue(e.width);
        st.property("ADBE Vector Stroke Opacity").setValue(Math.round((e.strokeOpacity === undefined ? 1 : e.strokeOpacity) * 100));
        try { st.property("ADBE Vector Stroke Line Cap").setValue(CAP[e.cap] || 1); } catch (x) {}
        try { st.property("ADBE Vector Stroke Line Join").setValue(JOIN[e.join] || 1); } catch (x) {}
        if (e.dashes && e.dashes.pattern.length) {
            var ds = st.property("ADBE Vector Stroke Dashes"), pat = e.dashes.pattern;
            if (pat.length === 1) pat = [pat[0], pat[0]];
            ds.addProperty("ADBE Vector Stroke Dash 1").setValue(pat[0]);
            ds.addProperty("ADBE Vector Stroke Gap 1").setValue(pat[1]);
            if (e.dashes.offset) ds.addProperty("ADBE Vector Stroke Offset").setValue(e.dashes.offset);
        }
    }
    applyCtx(L, e, ID, ID);
    out[L.name] = { bb: e.bb, kind: e.role === "line" ? "line" : "shape", p0: e.p0, p1: e.p1 };
    return L;
}

function setFont(td, ps) {
    var tries = [ps];
    if (DATA.fontMap && DATA.fontMap[ps]) tries.unshift(DATA.fontMap[ps]);
    tries.push(ps.replace(/Flux/, ""));
    for (var i = 0; i < tries.length; i++) { try { td.font = tries[i]; if (td.font === tries[i]) return tries[i]; } catch (x) {} }
    return null;
}

function addText(e) {
    // justification must be on the document BEFORE the text goes in: set on an existing multi-line text,
    // AE centres only the first line
    var L = c.layers.addText("x");
    L.name = uniq(e.name);
    var st = L.property("Source Text"), td = st.value;
    var used = (e.fontAE ? setFont(td, e.fontAE) : null) || setFont(td, e.font);
    if (!used) warn.push("font not found: " + (e.fontAE || e.font) + " (text '" + e.text.substr(0, 20) + "')");
    td.fontSize = e.size;
    td.applyFill = true; td.fillColor = e.color || [1, 1, 1]; td.applyStroke = false;
    // no nested ?: here - ExtendScript evaluated  a ? X : b ? Y : Z  to Y for a true (centre came out right-aligned)
    var JUST = { center: ParagraphJustification.CENTER_JUSTIFY, right: ParagraphJustification.RIGHT_JUSTIFY, left: ParagraphJustification.LEFT_JUSTIFY };
    td.justification = JUST[e.just] || JUST.left;
    td.tracking = 0;
    try { td.autoLeading = false; td.leading = e.leading; } catch (x) {}
    td.text = e.text.replace(/\r/g, "\u0003");   // soft line breaks: one paragraph
    st.setValue(td);
    tg(L).property("ADBE Anchor Point").setValue([0, 0]);
    tg(L).property("ADBE Position").setValue(e.anchor);
    // align the rendered text to the Illustrator box horizontally (left / centre / right edge);
    // the baseline from the file is already exact. SVG anchors are pen positions, which is what AE uses: no nudge
    if (!e.penAnchor) try {
        var rr = L.sourceRectAtTime(0, false), pos = e.anchor;
        var aeL = pos[0] + rr.left, aeR = aeL + rr.width, bx0 = e.bb[0], bx1 = e.bb[2], dx = 0;
        if (e.just === "center") dx = (bx0 + bx1) / 2 - (aeL + aeR) / 2;
        else if (e.just === "right") dx = bx1 - aeR;
        else dx = bx0 - aeL;
        if (Math.abs(dx) > 0.5 && Math.abs(dx) < 400) tg(L).property("ADBE Position").setValue([pos[0] + dx, pos[1]]);
    } catch (x) {}
    if (e.opacity !== undefined && e.opacity < 1) tg(L).property("ADBE Opacity").setValue(e.opacity * 100);
    var tp = tg(L).property("ADBE Position").value;
    applyCtx(L, e, function (p) { return [p[0] - tp[0], p[1] - tp[1]]; }, ID);
    out[L.name] = { bb: e.bb, kind: "type" };
    return L;
}

function addImage(e) {
    if (!e.file) { warn.push("image not extracted: " + e.name); return null; }
    var it = importOnce(e.file, false, imgF);
    var L = c.layers.add(it);
    L.name = uniq(e.name);
    var bw = e.bb[2] - e.bb[0], bh = e.bb[3] - e.bb[1];
    var rotA = Math.abs(e.rotation || 0) % 90, offAxis = Math.min(rotA, 90 - rotA) > 3;
    if (offAxis && e.ew) {
        // turned off-axis: real rotation about the image centre (bounding-box placement would stretch it)
        var rs = e.ew / it.width * 100, rsy = e.eh / it.height * 100 * (e.mirror ? -1 : 1);
        var rc = e.cxy, th = (e.rotation || 0) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
        tg(L).property("ADBE Scale").setValue([rs, rsy, 100]);
        tg(L).property("ADBE Rotate Z").setValue(e.rotation);
        tg(L).property("ADBE Position").setValue([rc[0], rc[1]]);
        L.outPoint = c.duration;
        var rax = it.width / 2, ray = it.height / 2, rkx = rs / 100, rky = rsy / 100;
        applyCtx(L, e, function (p) { var dx = p[0] - rc[0], dy = p[1] - rc[1]; return [(dx * cs + dy * sn) / rkx + rax, (-dx * sn + dy * cs) / rky + ray]; },
                 function (p) { return [(p[0] * cs + p[1] * sn) / rkx, (-p[0] * sn + p[1] * cs) / rky]; });
        out[L.name] = { bb: e.bb, kind: "pixel", fullFrame: false };
        return L;
    }
    if (Math.abs(e.rotation || 0) > 0.5) warn.push(e.name + ": rotated image (" + e.rotation + " deg) placed by its bounding box - check QC");
    var sx = bw / it.width * 100 * (e.flipX ? -1 : 1), sy = bh / it.height * 100 * (e.flipY ? -1 : 1);
    tg(L).property("ADBE Scale").setValue([sx, sy, 100]);
    tg(L).property("ADBE Position").setValue([(e.bb[0] + e.bb[2]) / 2, (e.bb[1] + e.bb[3]) / 2]);
    L.outPoint = c.duration;
    var cx = (e.bb[0] + e.bb[2]) / 2, cy = (e.bb[1] + e.bb[3]) / 2, ax = it.width / 2, ay = it.height / 2, kx = sx / 100, ky = sy / 100;
    applyCtx(L, e, function (p) { return [(p[0] - cx) / kx + ax, (p[1] - cy) / ky + ay]; }, function (p) { return [p[0] / kx, p[1] / ky]; });
    var vb = e.clipBB ? [Math.max(e.bb[0], e.clipBB[0]), Math.max(e.bb[1], e.clipBB[1]), Math.min(e.bb[2], e.clipBB[2]), Math.min(e.bb[3], e.clipBB[3])] : e.bb;
    out[L.name] = { bb: vb, kind: "pixel", fullFrame: (bw >= W - 2 && bh >= H - 2) };
    return L;
}

app.beginUndoGroup("Rebuild AI: " + DATA.comp);
var made = 0;
for (var i = 0; i < E.elements.length; i++) {
    var e = E.elements[i], L = null;
    try {
        if (e.kind === "path") L = addPath(e);
        else if (e.kind === "text") L = addText(e);
        else if (e.kind === "image") L = addImage(e);
        else if (e.kind === "shade") warn.push("gradient region " + e.bb.join(",") + " not rebuilt as vector - compare with the reference");
        if (L) {
            L.outPoint = c.duration; made++;
            // SVG sources keep the designer's grouping: choreograph.py "auto" beats animate a group as one unit
            if (e.group) { out[L.name].group = e.group; L.comment = "group: " + (e.groupPath || e.group); }
        }
    } catch (ex) { warn.push(e.name + ": " + ex.toString()); }
}
// layers were added on top in paint order, so the stack already matches Illustrator's
for (var nm in out) { var LL = layerNamed(c, nm); if (LL) out[nm].index = LL.index; }
if (DATA.layersOut) { var fo = new File(DATA.layersOut); fo.encoding = "UTF-8"; fo.open("w"); fo.write(toJSON(out)); fo.close(); }
if (old && (DATA.mainId || dropOld)) {
    var hosts = dropOld ? old.usedIn : [byId(DATA.mainId)], swapped = 0;
    for (var h = 0; h < hosts.length; h++)
        for (var j = 1; j <= hosts[h].numLayers; j++) if (hosts[h].layer(j).source === old) { hosts[h].layer(j).replaceSource(c, false); swapped++; }
    if (dropOld) { dropOld.remove(); R.done.push("replaced the earlier rebuild in " + swapped + " layer(s)"); }
    else {
        if (DATA.keepOld) old.parentFolder = folderNamed(DATA.keepOld, true);
        R.done.push("swapped into " + swapped + " main-comp layer(s); old comp kept in '" + (DATA.keepOld || old.parentFolder.name) + "'");
    }
}
app.endUndoGroup();
R.compId = c.id;
R.done.push(c.name + ": " + made + " native layers (" + W + "x" + H + ")");
R.warnings = R.warnings.concat(warn);
