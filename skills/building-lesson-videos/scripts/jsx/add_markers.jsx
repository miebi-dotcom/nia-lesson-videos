// Write cue markers onto the main comp (one undo step).
// DATA: { "compId": 4638, "replace": true, "markers": [ {t, c, label, d}, ... ] }  (output of align_cues.py)
// replace: first remove markers this workflow made before (comments starting "S<n> ", "CUT | " or "   - ").
// Two markers on the same frame overwrite each other, so a clash is nudged one frame later.
var c = byId(DATA.compId);
if (!c) throw new Error("comp " + DATA.compId + " not found");
var mp = c.markerProperty, fr = 1 / c.frameRate;
app.beginUndoGroup("Lesson cue markers");
if (DATA.replace) {
    var removed = 0;
    for (var k = mp.numKeys; k >= 1; k--) {
        if (/^(S\d+[a-z]? |CUT \| |   - )/.test(mp.keyValue(k).comment)) { mp.removeKey(k); removed++; }
    }
    R.done.push("removed " + removed + " old cue markers");
}
var used = {};
for (var i = 0; i < DATA.markers.length; i++) {
    var m = DATA.markers[i], t = m.t;
    var key = Math.round(t / fr);
    while (used[key]) { key++; }
    used[key] = true;
    t = key * fr;
    var mv = new MarkerValue(m.c);
    if (m.d && m.d > 0) mv.duration = m.d;
    try { mv.label = m.label; } catch (e) {}
    mp.setValueAtTime(t, mv);
}
app.endUndoGroup();
R.done.push("markers now on comp: " + mp.numKeys);
