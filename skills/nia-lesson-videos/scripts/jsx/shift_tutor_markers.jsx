// Move every layer EXCEPT the user's intro, and all comp markers, by DATA.by seconds; then fit the comp to the tutor's end.
// Use it after the user drops the intro at 0, so the tutor starts where the intro's wipe reveals it. One undo step.
// DATA: { "compId": 6825, "by": 8.0, "keepSourceIds": [57] }   keepSourceIds = sources of layers the user placed (the intro)
// List the layers first (list_layers.jsx): in CSC1101 a shift written for one layer also moved the user's intro.
var c = byId(DATA.compId);
if (!c) throw new Error("comp not found");
var keep = {};
var ks = DATA.keepSourceIds || (DATA.keepSourceId ? [DATA.keepSourceId] : []);
for (var q = 0; q < ks.length; q++) keep[ks[q]] = true;
var by = DATA.by;
app.beginUndoGroup("Move tutor and markers by " + by + " s");
try {
    for (var i = 1; i <= c.numLayers; i++) {
        var L = c.layer(i);
        if (L.source && keep[L.source.id]) { R.done.push("kept " + L.name); continue; }
        L.startTime = L.startTime + by;
        R.done.push("moved " + L.name + " to " + r2(L.startTime));
    }
    var mp = c.markerProperty, store = [];
    for (var k = 1; k <= mp.numKeys; k++) store.push({ t: mp.keyTime(k), v: mp.keyValue(k) });
    for (var k2 = mp.numKeys; k2 >= 1; k2--) mp.removeKey(k2);
    for (var j = 0; j < store.length; j++) mp.setValueAtTime(store[j].t + by, store[j].v);
    var tutorOut = 0;
    for (var m = 1; m <= c.numLayers; m++) { var Lm = c.layer(m); if (!(Lm.source && keep[Lm.source.id])) tutorOut = Math.max(tutorOut, Lm.outPoint); }
    c.duration = tutorOut;
    R.done.push("markers shifted: " + store.length + "; comp duration " + r2(c.duration));
} finally { app.endUndoGroup(); }
