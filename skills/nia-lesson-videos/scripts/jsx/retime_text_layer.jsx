// Re-time an already built and polished text overlay (pill, wave bar) on the main comp without rebuilding it,
// so its entrance lands on the spoken word and its exit plays after the phrase ends. One undo step.
// Proven on CSC1101 S08 (2026-11-17). Rebuilding with build_scenes.jsx instead would lose the polish pass.
// DATA: { "mainId": 6825, "layerName": "S08 OST Request save state handler return",
//         "start": 201.64,        new layer start (comp s) = word time - (how long after its start the preset lands)
//         "holdSrc": 3.0,         a source time inside the preset's static hold (after the entrance keys)
//         "exitSrc": 4.79,        source time where the preset's exit keys begin
//         "exitStartComp": 212.8, comp time the exit should begin (about 1-1.5 s after the phrase ends)
//         "endSrc": 5.6 }         source time just after the exit finishes
// Find holdSrc/exitSrc with dump_keys.jsx on the overlay's comp. The static middle is stretched with time remapping.
app.beginUndoGroup("Retime text overlay");
try {
    var main = byId(DATA.mainId), L = null;
    if (!main) throw new Error("main comp not found");
    for (var j = 1; j <= main.numLayers; j++) if (main.layer(j).name === DATA.layerName) L = main.layer(j);
    if (!L) throw new Error("layer not found: " + DATA.layerName);
    R.before = [r2(L.inPoint), r2(L.outPoint)];
    L.startTime = DATA.start;
    L.timeRemapEnabled = true;
    var tr = L.property("ADBE Time Remapping");
    var tHold = DATA.exitStartComp - (DATA.exitSrc - DATA.holdSrc);
    var tEnd = DATA.exitStartComp + (DATA.endSrc - DATA.exitSrc);
    var want = [[DATA.start, 0], [DATA.start + DATA.holdSrc, DATA.holdSrc], [tHold, DATA.holdSrc], [tEnd, DATA.endSrc]];
    // add the new keys first: removing every time-remap key switches time remapping off ("property is hidden")
    for (var w = 0; w < want.length; w++) tr.setValueAtTime(want[w][0], want[w][1]);
    for (var k = tr.numKeys; k >= 1; k--) {
        var kt = tr.keyTime(k), keep = false;
        for (var w2 = 0; w2 < want.length; w2++) if (Math.abs(kt - want[w2][0]) < 0.001) keep = true;
        if (!keep) tr.removeKey(k);
    }
    for (var k2 = 1; k2 <= tr.numKeys; k2++) tr.setInterpolationTypeAtKey(k2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    L.inPoint = DATA.start;
    L.outPoint = tEnd;
    R.after = [r2(L.inPoint), r2(L.outPoint)];
    R.done.push(DATA.layerName + ": exit " + r2(DATA.exitStartComp) + "-" + r2(tEnd) + " s");
} finally { app.endUndoGroup(); }
