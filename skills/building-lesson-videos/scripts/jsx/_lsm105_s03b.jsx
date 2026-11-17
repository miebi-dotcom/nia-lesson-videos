var pc = compByName("S03 Walk into your shop (1A-1B-1C)"), A, B, C, j, k;
for (j = 1; j <= pc.numLayers; j++) { var n = pc.layer(j).name; if (n.indexOf("1A") > 0) A = pc.layer(j); if (n.indexOf("1B") > 0) B = pc.layer(j); if (n.indexOf("1C") > 0) C = pc.layer(j); }
app.beginUndoGroup("S03 retime");
var OV = DATA.ov;
function remap(L, keys) {
    var tr = L.property("ADBE Time Remapping"), i;
    for (i = 0; i < keys.length; i++) tr.setValueAtTime(keys[i][0], keys[i][1]);
    for (i = tr.numKeys; i >= 1; i--) { var t = tr.keyTime(i), keep = false; for (var q = 0; q < keys.length; q++) if (Math.abs(keys[q][0] - t) < 0.001) keep = true; if (!keep) tr.removeKey(i); }
}
function clean(L) {
    var e = L.property("ADBE Effect Parade");
    for (var i = e.numProperties; i >= 1; i--) if (e.property(i).name.indexOf("Transition") === 0) e.property(i).remove();
    var op = L.property("ADBE Transform Group").property("ADBE Opacity");
    for (i = op.numKeys; i >= 1; i--) op.removeKey(i);
    op.setValue(100);
}
clean(A); clean(B); clean(C);
var bIn = B.inPoint, cIn = C.inPoint;
A.outPoint = bIn + OV; B.outPoint = cIn + OV;
remap(A, [[A.inPoint, 0], [A.inPoint + 1.75, 1.75], [bIn + OV, 6.33]]);
remap(B, [[bIn, 1.75], [cIn + OV, 6.33]]);
remap(C, [[cIn, 1.75], [cIn + 3.27, 6.33], [C.outPoint, 8.46]]);
function fx(L, name, a, b, t0, t1) {
    var e = L.property("ADBE Effect Parade").addProperty("ADBE Motion Blur"); e.name = name;
    var len = e.property(2); e.property(1).setValue(0);
    len.setValueAtTime(t0, a); len.setValueAtTime(t1, b);
    try { len.setTemporalEaseAtKey(1, [new KeyframeEase(0, 70)], [new KeyframeEase(0, 70)]); len.setTemporalEaseAtKey(2, [new KeyframeEase(0, 70)], [new KeyframeEase(0, 70)]); } catch (x) { }
}
function pair(out, inc) {
    var t0 = inc.inPoint, t1 = t0 + OV;
    var op = inc.property("ADBE Transform Group").property("ADBE Opacity");
    op.setValueAtTime(t0, 0); op.setValueAtTime(t1, 100);
    fx(inc, "Transition blur in", 150, 0, t0, t1);
    fx(out, "Transition blur out", 0, 150, t0, t1);
}
pair(A, B); pair(B, C);
app.endUndoGroup();
R.done = ["A " + A.inPoint + "-" + A.outPoint, "B " + B.inPoint + "-" + B.outPoint, "C " + C.inPoint + "-" + C.outPoint];
