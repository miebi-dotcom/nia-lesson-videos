// Make a tightened copy of a template shape transition (e.g. "NIA Transition 2", 3.17 s concentric arcs) for tutor cuts:
// speeds it up and cuts most of the static full-cover hold, so it covers fully for a moment and clears quickly.
// Generalised from the CSC1101 build (there: speed 1.25, cover 0.84-1.92 s of the source -> fully covered at 0.76 s, clears by ~1.6 s).
// DATA: { "sourceName": "NIA Transition 2", "name": "NIA Transition 2 tight", "speed": 1.25,
//         "coverStart": 0.84, "coverEnd": 1.92, "hold": 0.10, "fps": 25 }
//   coverStart/coverEnd = the source's fully-covered window (measure it: qc_frames across the source + measure_coverage.py).
// Returns the new comp id and its cover time; pass that as inCover/outCover to place_transitions.jsx.
// Not re-run since generalising: check the result in QC frames.
var src = DATA.sourceId ? byId(DATA.sourceId) : compByName(DATA.sourceName);
if (!src) throw new Error("source transition not found");
var sp = DATA.speed || 1.25, c0 = DATA.coverStart, c1 = DATA.coverEnd, hold = (DATA.hold === undefined ? 0.10 : DATA.hold), fps = DATA.fps || 25;
var K = [[0, 0], [c0 / sp, c0], [c0 / sp + hold, c1], [c0 / sp + hold + (src.duration - c1) / sp, src.duration - 0.04]];
var total = K[3][0];
app.beginUndoGroup("Tight transition");
try {
    var existing = compByName(DATA.name);
    if (existing) throw new Error("comp already exists: " + DATA.name + " (rename or delete it first)");
    var c = app.project.items.addComp(DATA.name, src.width, src.height, 1, Math.ceil(total * fps + 1) / fps, fps);
    c.parentFolder = src.parentFolder;
    var L = c.layers.add(src);
    L.timeRemapEnabled = true;
    var tr = L.property("ADBE Time Remapping");
    for (var i = 0; i < K.length; i++) tr.setValueAtTime(K[i][0], K[i][1]);
    for (var k = tr.numKeys; k >= 1; k--) {   // drop the default keys that are not ours (never remove all: it disables remapping)
        var t = tr.keyTime(k), mine = false;
        for (var j = 0; j < K.length; j++) if (Math.abs(K[j][0] - t) < 0.001) mine = true;
        if (!mine) tr.removeKey(k);
    }
    for (var k2 = 1; k2 <= tr.numKeys; k2++) tr.setInterpolationTypeAtKey(k2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    L.outPoint = c.duration;
    R.id = c.id; R.cover = r2(c0 / sp + hold / 2);
    R.done.push("tight comp " + c.name + " id " + c.id + " dur " + r2(c.duration) + " cover ~" + R.cover + " s");
} finally { app.endUndoGroup(); }
