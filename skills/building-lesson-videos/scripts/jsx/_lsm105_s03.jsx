// Combine S03a/b/c into one comp with blur-dissolve transitions in the overlaps.
var main = byId(DATA.mainId), idx = [], names = ["(asset 1A)", "(asset 1B)", "(asset 1C)"], k, j;
app.beginUndoGroup("S03 combine");
for (k = 0; k < 3; k++) for (j = 1; j <= main.numLayers; j++) if (main.layer(j).name.indexOf(names[k]) >= 0 && main.layer(j).name.indexOf("S03") === 0) idx.push(j);
var lbl = main.layer(idx[0]).label;
main.layers.precompose(idx, "S03 Walk into your shop (1A-1B-1C)", true);
var pc = compByName("S03 Walk into your shop (1A-1B-1C)");
pc.parentFolder = folderNamed("LSM105 scenes", true);
var A, B, C;
for (j = 1; j <= pc.numLayers; j++) { var n = pc.layer(j).name; if (n.indexOf("1A") > 0) A = pc.layer(j); if (n.indexOf("1B") > 0) B = pc.layer(j); if (n.indexOf("1C") > 0) C = pc.layer(j); }
function fx(L, name, a, b, t0, t1, mx) {
    var e = L.property("ADBE Effect Parade").addProperty("ADBE Motion Blur");
    e.name = name;
    var len = e.property(2), dir = e.property(1);
    dir.setValue(0);
    len.setValueAtTime(t0, a); len.setValueAtTime(t1, b);
    var ks = [new KeyframeEase(0, 70)], ke = [new KeyframeEase(0, 70)];
    try { len.setTemporalEaseAtKey(1, ks, ke); len.setTemporalEaseAtKey(2, ks, ke); } catch (x) { }
}
function pair(out, inc) {
    var t0 = inc.inPoint, t1 = out.outPoint;
    var op = inc.property("ADBE Transform Group").property("ADBE Opacity");
    op.setValueAtTime(t0, 0); op.setValueAtTime(t1, 100);
    fx(inc, "Transition blur in", 120, 0, t0, t1);
    fx(out, "Transition blur out", 0, 120, t0, t1);
    inc.moveToBeginning ? 0 : 0;
    return [t0, t1];
}
var r1 = pair(A, B), r2 = pair(B, C);
// make sure order is c over b over a
C.moveToBeginning(); B.moveAfter(C); A.moveToEnd();
for (j = 1; j <= main.numLayers; j++) if (main.layer(j).source === pc) { main.layer(j).label = lbl; main.layer(j).motionBlur = true; }
pc.motionBlur = true;
app.endUndoGroup();
R.done = ["overlaps " + r1.join("-") + " , " + r2.join("-"), "comp id " + pc.id + " dur " + pc.duration];
