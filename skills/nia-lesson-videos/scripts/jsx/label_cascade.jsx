// Convert block-animated text layers (opacity/position/scale keys) into Text Animator cascades.
// DATA: { ids: [comp ids], dyLabel: 14, dyTitle: 22 }
var c = null;
function textEntrance(L, t0, dur, dy, opts) {
    opts = opts || {};
    var txt = String(L.property("Source Text").value.text), lines = txt.split(/[\r\n\u0003]/).length;
    var words = txt.replace(/^\s+|\s+$/g, "").split(/\s+/).length;
    var based = opts.based;
    if (!based) { if (txt.length <= 12) based = "characters"; else if (lines >= 3) based = "lines"; else based = "words"; }
    var units = words;
    if (based === "characters") units = txt.length; else if (based === "lines") units = lines;
    if (!dur) dur = Math.min(0.6, Math.max(0.4, 0.3 + 0.03 * units));
    var anim = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    anim.name = "anim text";
    var props = anim.property("ADBE Text Animator Properties");
    props.addProperty("ADBE Text Position 3D").setValue([0, dy, 0]);
    props.addProperty("ADBE Text Opacity").setValue(0);
    var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var adv = sel.property("ADBE Text Range Advanced");
    var TYPE = { characters: 1, words: 3, lines: 4 };
    adv.property("ADBE Text Range Type2").setValue(TYPE[based]);
    adv.property("ADBE Text Range Shape").setValue(2);
    adv.property("ADBE Text Levels Max Ease").setValue(50);
    adv.property("ADBE Text Levels Min Ease").setValue(50);
    var off = sel.property("ADBE Text Percent Offset");
    off.setValueAtTime(snapT(c, t0), -100);
    off.setValueAtTime(snapT(c, t0 + dur), 100);
    signatureEase(off, "in");
    return based;
}
function cb(L) { var T = tg(L), r = L.sourceRectAtTime(0, false), an = T.property("ADBE Anchor Point").value, p = T.property("ADBE Position").value, sc = T.property("ADBE Scale").value;
    var x0 = p[0] + (r.left - an[0]) * sc[0] / 100, y0 = p[1] + (r.top - an[1]) * sc[1] / 100; return [x0, y0, x0 + r.width * sc[0] / 100, y0 + r.height * sc[1] / 100]; }
function containerTime(comp, lab) {   // first key of the smallest animated element that contains this label's centre
    var b = cb(lab), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, best = null, bestA = 1e12;
    for (var i = 1; i <= comp.numLayers; i++) { var Q = comp.layer(i); if (Q instanceof TextLayer || Q === lab) continue;
        if (Q.name.indexOf("outlined labels") >= 0) continue;
        var T = tg(Q), t0 = null, ns = ["ADBE Opacity", "ADBE Scale", "ADBE Position"];
        for (var p = 0; p < 3; p++) { var pr = T.property(ns[p]); if (pr.numKeys > 0 && (t0 === null || pr.keyTime(1) < t0)) t0 = pr.keyTime(1); }
        if (t0 === null) continue;
        var q = cb(Q), w = q[2] - q[0], h = q[3] - q[1];
        if (w > 1200 && h > 800) continue;
        if (cx >= q[0] - 4 && cx <= q[2] + 4 && cy >= q[1] - 4 && cy <= q[3] + 4 && w * h < bestA) { bestA = w * h; best = t0; } }
    return best; }
app.beginUndoGroup("Text cascades");
var done = 0, skipped = 0;
for (var k = 0; k < DATA.ids.length; k++) {
    c = byId(DATA.ids[k]);
    if (!c) { R.errors.push("comp " + DATA.ids[k] + " not found"); continue; }
    var n = 0;
    for (var i = 1; i <= c.numLayers; i++) {
        var L = c.layer(i);
        if (!(L instanceof TextLayer)) continue;
        var ta = L.property("ADBE Text Properties").property("ADBE Text Animators"), has = false;
        for (var q = 1; q <= ta.numProperties; q++) if (ta.property(q).name === "anim text") has = true;
        if (has) { skipped++; continue; }
        var T = tg(L), t0 = null, rests = {};
        var names = ["ADBE Opacity", "ADBE Position", "ADBE Scale"];
        for (var p = 0; p < 3; p++) {
            var pr = T.property(names[p]);
            if (pr.numKeys > 0) { if (t0 === null || pr.keyTime(1) < t0) t0 = pr.keyTime(1); rests[names[p]] = pr.keyValue(pr.numKeys); }
        }
        if (t0 === null && L.name.indexOf("Label - ") === 0) { t0 = containerTime(c, L); if (t0 !== null) t0 += 0.25; }
        if (t0 === null && DATA.useInPoint && L.enabled) t0 = L.inPoint;
        if (t0 === null) { skipped++; continue; }
        for (var p2 = 0; p2 < 3; p2++) {
            var pr2 = T.property(names[p2]);
            if (pr2.numKeys > 0) { var rv = rests[names[p2]]; while (pr2.numKeys > 0) pr2.removeKey(1); pr2.setValue(rv); }
        }
        var isLabel = L.name.indexOf("Label - ") === 0;
        textEntrance(L, t0, null, isLabel ? DATA.dyLabel : DATA.dyTitle, {});
        L.motionBlur = true;
        n++; done++;
    }
    c.motionBlur = true;
    R.done.push(c.name + ": " + n + " text layers -> cascade");
}
R.done.push("total " + done + ", skipped " + skipped);
app.endUndoGroup();
