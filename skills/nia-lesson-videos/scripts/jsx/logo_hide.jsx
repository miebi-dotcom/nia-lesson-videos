// Fade the NIA logo bug out for stretches where an asset puts artwork in the logo zone (x 1625-1835, y 88-165),
// e.g. recap icons designed top right. One undo step. Generalised from the CSC1101 recap fix.
// DATA: { "mainId": 6825, "layerName": "NIA logo bug", "ranges": [[479.2, 512.4]], "fade": 0.4 }
// Re-running replaces all opacity keys on the logo. Check the frames afterwards: the logo must be fully off while the art is there.
var main = byId(DATA.mainId), L = null;
if (!main) throw new Error("main comp not found");
for (var i = 1; i <= main.numLayers; i++) if (main.layer(i).name === (DATA.layerName || "NIA logo bug")) L = main.layer(i);
if (!L) throw new Error("logo layer not found");
var F = DATA.fade || 0.4;
app.beginUndoGroup("Logo hide");
try {
    var op = tg(L).property("ADBE Opacity");
    while (op.numKeys) op.removeKey(1);
    for (var k = 0; k < DATA.ranges.length; k++) {
        var a = DATA.ranges[k][0], b = DATA.ranges[k][1];
        op.setValueAtTime(snapT(main, a - F), 100); op.setValueAtTime(snapT(main, a), 0);
        op.setValueAtTime(snapT(main, b), 0); op.setValueAtTime(snapT(main, b + F), 100);
    }
    signatureEase(op, "move");
    R.done.push("logo opacity keys " + op.numKeys);
} finally { app.endUndoGroup(); }
