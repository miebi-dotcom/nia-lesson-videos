// S19: spotlight build on top of the per-element choreography (glow, orbit, travelling pulse, ripples, dim/lift, number bump).
var c = compByName("S19 Stages native"), cols = DATA.cols, N = DATA.names, i, j, o = [];
app.beginUndoGroup("S19 fx");
for (j = c.numLayers; j >= 1; j--) if (c.layer(j).name.indexOf("FX ") === 0) c.layer(j).remove();
var LIGHT = [0.45, 0.75, 1], WHITE = [1, 1, 1];
function LY(p3) { return c.layer(N[p3]); }
function ease(p, oi, ii) {
    var n = p.numKeys, k, a, tr = [[1], [1, 1], [1, 1, 1]];
    for (k = 1; k <= n; k++) {
        var o1 = (k === n) ? 33 : oi, i1 = (k === 1) ? 33 : ii;
        for (a = 0; a < tr.length; a++) {
            try {
                var ins = [], outs = [];
                for (var d = 0; d < tr[a].length; d++) { ins.push(new KeyframeEase(0, i1)); outs.push(new KeyframeEase(0, o1)); }
                p.setTemporalEaseAtKey(k, ins, outs); break;
            } catch (e) { }
        }
    }
}
function keys(p, ts, vs, oi, ii) { for (var k = 0; k < ts.length; k++) p.setValueAtTime(ts[k], vs[k]); ease(p, oi || 20, ii || 80); }
function opKeys(L, ts, vs) { // append to existing opacity keys
    var p = L.property("ADBE Transform Group").property("ADBE Opacity");
    for (var k = 0; k < ts.length; k++) p.setValueAtTime(ts[k], vs[k]);
    for (var q = 1; q <= p.numKeys; q++) {
        if (p.keyTime(q) >= ts[0] - 0.001) { try { p.setTemporalEaseAtKey(q, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]); } catch (e) { } }
    }
}
function ell(name, d, fill, stroke, sw, cx, cy) {
    var L = c.layers.addShape(); L.name = "FX " + name;
    var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group");
    var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([d, d]);
    if (fill) v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);
    if (stroke) { var s = v.addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(stroke); s.property("ADBE Vector Stroke Width").setValue(sw); }
    L.property("ADBE Transform Group").property("ADBE Position").setValue([cx, cy]);
    L.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);
    return L;
}
function pad(L, d) {
    var v = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
    var g = v.addProperty("ADBE Vector Group"), gv = g.property("ADBE Vectors Group");
    var r = gv.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([d, d]);
    var f = gv.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Opacity").setValue(0);
}
function blur(L, b) { var f = L.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2"); f.property(1).setValue(b); }
function TF(L) { return L.property("ADBE Transform Group"); }
// stage times from the dring pop
var ts = [];
for (i = 0; i < 5; i++) { var op = LY(cols[i].dring).property("ADBE Transform Group").property("ADBE Opacity"); ts.push(op.numKeys ? op.keyTime(1) : 20 + 8 * i); }
var tf = Math.min(c.duration - 1.2, ts[4] + 7);
var DOWN = 289, T0 = 2.15, T1 = 3.0, k;
for (i = 0; i < 5; i++) {
    var gl0 = [cols[i].plate, cols[i].num].concat(cols[i].ring), q;
    for (q = 0; q < gl0.length; q++) {
        var PL = LY(gl0[q]), pp = TF(PL).property("ADBE Position"), v0;
        try { v0 = pp.value; } catch (e0) { pp.expression = ""; v0 = pp.value; }
        var s0 = T0 + 0.07 * i, s1 = T1 + 0.07 * i;
        pp.setValueAtTime(s0 - 0.5, [v0[0], v0[1] - DOWN]); pp.setValueAtTime(s0, [v0[0], v0[1] - DOWN]); pp.setValueAtTime(s1, [v0[0], v0[1]]);
        try { for (var kk = 1; kk <= 3; kk++) pp.setTemporalEaseAtKey(kk, [new KeyframeEase(0, kk === 3 ? 90 : 33)], [new KeyframeEase(0, kk === 2 ? 14 : 33)]); } catch (e1) { }
    }
}
for (i = 0; i < 5; i++) {
    var C = cols[i], t = ts[i], tn = (i < 4) ? ts[i + 1] : tf, icx = C.icx, icy = C.icy, r = C.r, dx = C.dx, dy = C.dy;
    // glow behind icon
    var gl = ell("glow " + (i + 1), 2.1 * r, LIGHT, null, 0, icx, icy); pad(gl, 4.2 * r); blur(gl, 55);
    keys(TF(gl).property("ADBE Opacity"), [t - 0.01, t + 0.35, tn, tn + 0.5], [0, 70, 70, 0]);
    keys(TF(gl).property("ADBE Scale"), [t - 0.01, t + 0.6], [[60, 60], [112, 112]]);
    // icon ripple
    var rp = ell("ripple icon " + (i + 1), 2 * r, null, LIGHT, 5, icx, icy);
    keys(TF(rp).property("ADBE Opacity"), [t, t + 0.12, t + 1.0], [0, 85, 0], 15, 70);
    keys(TF(rp).property("ADBE Scale"), [t, t + 1.0], [[88, 88], [185, 185]], 10, 85);
    // orbiting dot with two trailing dots
    var sizes = [15, 11, 8], lag = [0, 0.32, 0.6], op0 = [100, 65, 38];
    for (j = 0; j < 3; j++) {
        var ob = ell("orbit " + (i + 1) + "." + (j + 1), sizes[j], WHITE, null, 0, icx, icy);
        ob.property("ADBE Transform Group").property("ADBE Position").expression =
            "var a=(time-" + t.toFixed(3) + ")*4.6-1.57-" + lag[j] + "; [" + icx.toFixed(2) + "+" + (r + 3).toFixed(1) + "*Math.cos(a), " + icy.toFixed(2) + "+" + (r + 3).toFixed(1) + "*Math.sin(a)]";
        keys(TF(ob).property("ADBE Opacity"), [t + 0.3, t + 0.6, tn, tn + 0.35], [0, op0[j], op0[j], 0]);
        if (j === 0) blur(ob, 1.5);
    }
    // ripple at spine dot
    var rd = ell("ripple dot " + (i + 1), 50, null, LIGHT, 4, dx, dy);
    keys(TF(rd).property("ADBE Opacity"), [t - 0.58, t - 0.48, t + 0.3], [0, 90, 0], 15, 70);
    keys(TF(rd).property("ADBE Scale"), [t - 0.58, t + 0.3], [[40, 40], [250, 250]], 10, 85);
    // number bump
    var nb = LY(C.num), sp = TF(nb).property("ADBE Scale");
    sp.setValueAtTime(t + 0.1, [100, 100, 100]); sp.setValueAtTime(t + 0.3, [124, 124, 100]); sp.setValueAtTime(t + 0.8, [100, 100, 100]);
    ease(sp, 20, 80);
    // spotlight: dim columns that are not the one being spoken
    var all = [C.plate, C.num].concat(C.ring), m;
    for (m = 0; m < all.length; m++) {
        var L = LY(all[m]), tt = [], vv = [];
        if (i >= 1) { tt.push(ts[0] + 0.0, ts[0] + 0.5, t, t + 0.45); vv.push(100, 50, 50, 100); }
        else { tt.push(); }
        if (i < 4) { tt.push(tn, tn + 0.5); vv.push(100, 50); }
        tt.push(tf, tf + 0.6); vv.push((i < 4) ? 50 : 100, 100);
        opKeys(L, tt, vv);
    }
    var txs = [C.dring, C.icon, C.title, C.desc, C.line].concat(C.dot);
    for (m = 0; m < txs.length; m++) {
        var L2 = LY(txs[m]), dm = (m === 2 || m === 3) ? 62 : 50, tt2 = [], vv2 = [];
        if (i < 4) { tt2.push(tn, tn + 0.5); vv2.push(100, dm); tt2.push(tf, tf + 0.6); vv2.push(dm, 100); }
        if (tt2.length) opKeys(L2, tt2, vv2);
    }
}
// glows and ripples sit under the artwork, above the backdrop
var bg = LY("002");
for (j = c.numLayers; j >= 1; j--) { var Q = c.layer(j); if (Q.name.indexOf("FX glow") === 0) Q.moveBefore(bg); }
app.endUndoGroup();
R.done = ["ts " + ts.join(", "), "tf " + tf];
