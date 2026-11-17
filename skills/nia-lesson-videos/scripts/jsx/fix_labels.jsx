// Replace outlined per-glyph label shapes with live Inter text (S06 approach).
// DATA: { comp:6843, scene:"S03", dryRun:true, labels:[{text,color,bb:[x0,y0,x1,y1],size}], skipTitle:true }
// Labels come from the designer's .ai (comp coords = artboard coords, 1920x1080).
// Tier rule (calibrated on S06: 27.9->Bold 24, 20.9->Medium 18, subtitle 25.1->Medium 20): scale 0.86, floor 16.
var c = app.project.itemByID(DATA.comp);
if (!c) throw new Error("comp not found");
var PAD = 5;
function cc(L) {   // comp-space centre of a layer's ink
    var T = L.property("ADBE Transform Group");
    var r = L.sourceRectAtTime(0, false), an = T.property("ADBE Anchor Point").value, p = T.property("ADBE Position").value;
    var sc = T.property("ADBE Scale").value;
    return [p[0] + (r.left + r.width / 2 - an[0]) * sc[0] / 100, p[1] + (r.top + r.height / 2 - an[1]) * sc[1] / 100, r.width * sc[0] / 100, r.height * sc[1] / 100];
}
var gc = DATA.glyphComp ? app.project.itemByID(DATA.glyphComp) : c;
var shapes = [];
for (var i = 1; i <= gc.numLayers; i++) {
    var L = gc.layer(i);
    if (L instanceof ShapeLayer && (!DATA.nameFilter || L.name.indexOf(" shape ") >= 0)) { var g = cc(L); shapes.push({ L: L, x: g[0], y: g[1], w: g[2], h: g[3] }); }
}
var used = {}, plan = [], toHide = [], moved = [];
function outside(q, bb) {   // distance of a point outside a box (0 when inside)
    var dx = Math.max(bb[0] - q.x, 0, q.x - bb[2]), dy = Math.max(bb[1] - q.y, 0, q.y - bb[3]);
    return Math.max(dx, dy);
}
var assign = [];
for (var s0 = 0; s0 < shapes.length; s0++) {
    var best = -1, bd = 1e9, q0 = shapes[s0];
    if (q0.w > 70 || q0.h > 45) { assign.push(-1); continue; }
    for (var n0 = 0; n0 < DATA.labels.length; n0++) {
        var dd = outside(q0, DATA.labels[n0].bb);
        if (dd < bd) { bd = dd; best = n0; }
    }
    assign.push(bd <= PAD ? best : -1);
}
for (var n = 0; n < DATA.labels.length; n++) {
    var lb = DATA.labels[n], bb = lb.bb, got = [], t0 = 1e9;
    for (var s = 0; s < shapes.length; s++) {
        if (assign[s] === n) got.push(shapes[s]);
    }
    var op0 = null;
    for (var g2 = 0; g2 < got.length; g2++) {
        var o = got[g2].L.property("ADBE Transform Group").property("ADBE Opacity");
        if (o.numKeys > 0 && o.keyTime(1) < t0) t0 = o.keyTime(1);
    }
    var letters = lb.text.replace(/[\s\r]/g, "").length;
    plan.push({ text: lb.text, glyphs: got.length, letters: letters, t0: t0 > 1e8 ? null : t0 });
    R.done.push(lb.text.replace(/\r/g, "/") + " | glyph shapes " + got.length + " / letters " + letters + " | fades in " + (t0 > 1e8 ? "static" : t0.toFixed(2)) + " | designer " + lb.size.toFixed(1));
    for (var g3 = 0; g3 < got.length; g3++) { used[got[g3].L.index] = true; toHide.push(got[g3].L.index); moved.push(got[g3].L.name); }
    lb._t0 = t0 > 1e8 ? null : t0;
}
R.moved = moved;
if (DATA.dryRun) { R.done.push("DRY RUN: " + toHide.length + " glyph layers would be hidden"); }
else {
    app.beginUndoGroup("fix labels " + DATA.scene);
    var rmn = DATA.removeNames || (DATA.removeName ? [DATA.removeName] : []); for (var ri = 0; ri < rmn.length; ri++) { for (var rm = c.numLayers; rm >= 1; rm--) { if (c.layer(rm) instanceof TextLayer && c.layer(rm).name.indexOf(rmn[ri]) === 0) { R.done.push("removed " + c.layer(rm).name); c.layer(rm).remove(); } } }
    var topIdx = 1;
    for (var m = 0; m < DATA.labels.length; m++) {
        var lb2 = DATA.labels[m];
        var bold = lb2.bold;
        var size = Math.max(16, Math.round(lb2.size * 0.86));
        var T = c.layers.addText("x");
        var tp = T.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tp.value;
        td.resetCharStyle();
        td.font = bold ? "Inter-Bold" : "Inter-Medium";
        td.fontSize = size;
        td.fillColor = lb2.color; td.applyFill = true; td.applyStroke = false;
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        try { td.allCaps = false; td.smallCaps = false; } catch (e1) {}
        if (lb2.text.indexOf(String.fromCharCode(13)) >= 0) { try { td.leading = Math.round(size * 1.15); } catch (e2) {} }
        td.text = lb2.text;
        tp.setValue(td);
        var chk = tp.value;
        if (chk.allCaps) R.warnings.push(lb2.text + ": All Caps still on");
        var r = T.sourceRectAtTime(0, false);
        var bbw = lb2.bb[2] - lb2.bb[0];
        if (r.width > bbw * 1.12 && size > 13) {     // fit by font size first: never spill past the designer's box
            var ns = Math.max(13, Math.floor(size * bbw * 1.12 / r.width));
            var td3 = tp.value; td3.fontSize = ns; tp.setValue(td3);
            r = T.sourceRectAtTime(0, false);
            R.warnings.push(lb2.text.replace(/\r/g, "/") + ": shrunk " + size + " -> " + ns + " px to fit its box");
        }
        T.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
        T.property("ADBE Transform Group").property("ADBE Position").setValue([(lb2.bb[0] + lb2.bb[2]) / 2, (lb2.bb[1] + lb2.bb[3]) / 2]);
        T.name = "Label - " + lb2.text.replace(/[\r\n]+/g, " ").substr(0, 40);
        T.startTime = 0; T.inPoint = 0; T.outPoint = c.duration;
        var op = T.property("ADBE Transform Group").property("ADBE Opacity");
        if (lb2._t0 !== null) {
            op.setValueAtTime(lb2._t0, 0); op.setValueAtTime(lb2._t0 + 0.32, 100);
            for (var k = 1; k <= 2; k++) { try { op.setTemporalEaseAtKey(k, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]); } catch (e3) {} }
        }
        T.moveToBeginning();
        if (r.width > (lb2.bb[2] - lb2.bb[0]) * 1.35) R.warnings.push(lb2.text.replace(/\r/g, "/") + ": text " + Math.round(r.width) + " px vs designer box " + Math.round(lb2.bb[2] - lb2.bb[0]));
    }
    // hide the old outlined glyphs in a precomp, like S06
    var ids = [];
    if (!DATA.glyphComp) for (var h = 0; h < toHide.length; h++) ids.push(c.layer(toHide[h] + DATA.labels.length).index);
    ids.sort(function (a, b) { return a - b; });
    if (ids.length) {
        var pc = c.layers.precompose(ids, DATA.scene + " old outlined labels (hidden)", true);
        try { pc.parentFolder = c.parentFolder; } catch (e4) {}
        for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).source === pc) { c.layer(j).enabled = false; R.done.push("precomp id " + pc.id); }
    }
    app.endUndoGroup();
}
