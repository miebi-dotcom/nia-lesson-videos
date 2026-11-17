// Apply per-layer animation planned by choreograph.py to a layered asset comp (PSD, Illustrator, shapes,
// text - any mix). One undo step; safe to re-run: earlier animation is removed first.
// DATA: { "comp": "S26 ...", "ops": [ {L, anchor:[cx,cy], keys:{position|scale|opacity|rotation: [[t, v], ...]}, expr, wipe} ] }
//   anchor = the comp-space point the layer should pivot around (its own bbox centre / edge).
//   position keys are comp-space positions of that pivot; scale and opacity keys are relative (100 = resting).
//
// Pivoting without moving the art: for an unrotated, unparented layer, a layer-space point P shows at
//   comp = position + s * (P - anchor)        (s = scale / 100, per axis)
// so to pivot around comp point C:  anchor' = anchor + (C - position) / s,  position' = C.
// This holds for document-sized PSD/AI layers (anchor = centre), live text (anchor in text space) and shapes.
var c = compByName(DATA.comp);
if (!c) throw new Error("comp not found: " + DATA.comp);
var MAP = { position: "ADBE Position", scale: "ADBE Scale", opacity: "ADBE Opacity", rotation: "ADBE Rotate Z" };
app.beginUndoGroup("Animate layered scene: " + c.name);

// 1. clean: unparent old controller nulls, drop keys/expressions/wipes, keep each property at its
//    FINAL keyed value (the resting state every earlier animation ended on)
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j), t3 = tg(L);
    for (var key in MAP) {
        var p = t3.property(MAP[key]);
        if (p.canSetExpression && p.expression) p.expression = "";
        if (p.numKeys > 0) { var rest = p.keyValue(p.numKeys); while (p.numKeys > 0) p.removeKey(1); p.setValue(rest); }
    }
    var fx = L.property("ADBE Effect Parade");
    for (var f = fx.numProperties; f >= 1; f--) if (fx.property(f).matchName === "ADBE Linear Wipe") fx.property(f).remove();
    if (L instanceof ShapeLayer) {
        var rv = L.property("ADBE Root Vectors Group");
        for (var q = rv.numProperties; q >= 1; q--) if (rv.property(q).name === "anim trim") rv.property(q).remove();
    }
    if (L instanceof TextLayer) {
        var ta = L.property("ADBE Text Properties").property("ADBE Text Animators");
        for (var q = ta.numProperties; q >= 1; q--) if (ta.property(q).name === "anim text") ta.property(q).remove();
    }
}

// Text entrance with a Text Animator + Range Selector (per character / word / line), so type cascades in
// instead of the whole layer moving. The animator holds the "from" state (dy below, transparent, optional
// blur/tracking); a Ramp Up selector sweeps Offset -100 -> 100 so units resolve one after another.
// Based on: characters for short labels (<= 12 chars), lines for 3+ line blocks, words otherwise.
function textEntrance(L, t0, dur, dy, opts) {
    opts = opts || {};
    var txt = String(L.property("Source Text").value.text), lines = txt.split(/[\r\n\u0003]/).length;
    var words = txt.replace(/^\s+|\s+$/g, "").split(/\s+/).length;
    var based = opts.based;      // if/else, not chained ?: (ExtendScript bug)
    if (!based) { if (txt.length <= 12) based = "characters"; else if (lines >= 3) based = "lines"; else based = "words"; }
    var units = words;
    if (based === "characters") units = txt.length; else if (based === "lines") units = lines;
    if (!dur) dur = Math.min(0.6, Math.max(0.4, 0.3 + 0.03 * units));
    var anim = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    anim.name = "anim text";
    var props = anim.property("ADBE Text Animator Properties");
    props.addProperty("ADBE Text Position 3D").setValue([0, dy, 0]);
    props.addProperty("ADBE Text Opacity").setValue(0);
    if (opts.blur) props.addProperty("ADBE Text Blur").setValue([opts.blur, opts.blur]);
    if (opts.tracking) props.addProperty("ADBE Text Tracking Amount").setValue(opts.tracking);
    var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var adv = sel.property("ADBE Text Range Advanced");
    var TYPE = { characters: 1, words: 3, lines: 4 };
    adv.property("ADBE Text Range Type2").setValue(TYPE[based]);
    adv.property("ADBE Text Range Shape").setValue(2);          // Ramp Up
    adv.property("ADBE Text Levels Max Ease").setValue(50);     // Ease High
    adv.property("ADBE Text Levels Min Ease").setValue(50);     // Ease Low
    var off = sel.property("ADBE Text Percent Offset");
    off.setValueAtTime(snapT(c, t0), -100);
    off.setValueAtTime(snapT(c, t0 + dur), 100);
    signatureEase(off, "in");
    return based;
}
// now everything is static at rest: unparent WITH compensation (positions converted back to comp space)
for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).parent) c.layer(j).parent = null;
for (var j = c.numLayers; j >= 1; j--) if (c.layer(j).nullLayer && c.layer(j).name.indexOf("ctrl ") === 0) c.layer(j).remove();

// 2. apply
var n = 0, missing = [], blurred = false;
for (var i = 0; i < DATA.ops.length; i++) {
    var o = DATA.ops[i], L = layerNamed(c, o.L);
    if (!L && /#\d+$/.test(o.L)) L = c.layer(parseInt(o.L.split("#").pop(), 10));   // "name #index" from layer_bboxes
    if (!L) { missing.push(o.L); continue; }
    var t3 = tg(L), ap = t3.property("ADBE Anchor Point"), pp = t3.property("ADBE Position"), sp = t3.property("ADBE Scale");
    var sv = sp.value, sx = sv[0] / 100, sy = sv[1] / 100, restOp = t3.property("ADBE Opacity").value / 100;
    if (o.anchor && sx !== 0 && sy !== 0) {
        var a0 = ap.value, p0 = pp.value;
        ap.setValue([a0[0] + (o.anchor[0] - p0[0]) / sx, a0[1] + (o.anchor[1] - p0[1]) / sy]);
        pp.setValue([o.anchor[0], o.anchor[1]]);
    }
    var keys = o.keys || {};
    if (o.text) {
        if (L instanceof TextLayer) { textEntrance(L, o.text.t, o.text.dur, o.text.dy, o.text); keys = {}; }
        else keys = o.text.fallback || keys;        // PSD/footage "text": move the whole layer instead
    }
    for (var key in keys) {
        var p = t3.property(MAP[key]), ks = keys[key];
        for (var k = 0; k < ks.length; k++) {
            var v = ks[k][1];
            if (key === "scale") v = [v[0] * sx, v[1] * sy, 100];   // relative to the layer's resting scale
            if (key === "opacity") v = v * restOp;                  // and to its resting opacity (e.g. a 49% halo)
            p.setValueAtTime(snapT(c, ks[k][0]), v);                // whole frames only
        }
        signatureEase(p, o.mode || "in");                           // entrances: fast out, long soft landing
        if (key !== "opacity") { L.motionBlur = true; blurred = true; }
    }
    for (var key in o.expr) t3.property(MAP[key]).expression = o.expr[key];
    if (o.wipe) {
        var fx = L.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
        fx.property(2).setValue(270);
        var cp = fx.property(1);
        for (var k = 0; k < o.wipe.length; k++) cp.setValueAtTime(o.wipe[k][0], o.wipe[k][1]);
        easeAll(cp, 55);
    }
    if (o.trim && L instanceof ShapeLayer) {
        // draw-on along the path (dashes stay dashes); reversed = from the path's last point
        var trm = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Trim");
        trm.name = "anim trim";
        var tk = o.trim.keys;
        if (o.trim.reverse) {
            trm.property("ADBE Vector Trim End").setValue(100);
            var sP = trm.property("ADBE Vector Trim Start");
            sP.setValueAtTime(snapT(c, tk[0][0]), 100); sP.setValueAtTime(snapT(c, tk[1][0]), 0); signatureEase(sP, "in");
        } else {
            var eP = trm.property("ADBE Vector Trim End");
            eP.setValueAtTime(snapT(c, tk[0][0]), 0); eP.setValueAtTime(snapT(c, tk[1][0]), 100); signatureEase(eP, "in");
        }
    }
    if (o.parent) {
        // keep the child attached to its container: convert its comp-space positions into the parent's space
        var P = layerNamed(c, o.parent);
        if (P) {
            var pt = tg(P), pp2 = pt.property("ADBE Position"), pa = pt.property("ADBE Anchor Point"), ps = pt.property("ADBE Scale");
            var restP = pp2.numKeys ? pp2.keyValue(pp2.numKeys) : pp2.value, restA = pa.value, restS = ps.numKeys ? ps.keyValue(ps.numKeys) : ps.value;
            var toP = function (v) { return [(v[0] - restP[0]) / (restS[0] / 100) + restA[0], (v[1] - restP[1]) / (restS[1] / 100) + restA[1]]; };
            var cpos = t3.property("ADBE Position");
            if (cpos.numKeys) { for (var k = 1; k <= cpos.numKeys; k++) cpos.setValueAtKey(k, toP(cpos.keyValue(k))); }
            else cpos.setValue(toP(cpos.value));
            var cs = t3.property("ADBE Scale"), inv = function (v) { return [v[0] * 100 / restS[0], v[1] * 100 / restS[1], 100]; };
            if (cs.numKeys) { for (var k = 1; k <= cs.numKeys; k++) cs.setValueAtKey(k, inv(cs.keyValue(k))); } else cs.setValue(inv(cs.value));
            L.setParentWithJump(P);
        } else R.warnings.push(o.L + ": parent not found " + o.parent);
    }
    n++;
}
if (blurred) c.motionBlur = true;          // layer switches only render with the comp switch on (180 deg shutter)
app.endUndoGroup();
R.done.push(c.name + ": " + n + " layers animated");
if (missing.length) R.warnings.push("layers not found in comp: " + missing.join(", "));
