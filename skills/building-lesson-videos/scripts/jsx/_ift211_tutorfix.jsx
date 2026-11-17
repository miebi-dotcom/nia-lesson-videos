// Tutor offset for side-panel scenes: slide right as the panel arrives, return as the panel EXITS (last EXIT s of the scene).
var main = byId(DATA.mainId);
app.beginUndoGroup("Tutor returns with side bar exit");
function layerByName(c, nm) { for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name === nm) return c.layer(j); return null; }
var tut = layerByName(main, "video");
var pos = tg(tut).property("ADBE Position");
while (pos.numKeys > 0) pos.removeKey(1);
var base = pos.value;
for (var k = 0; k < DATA.shifts.length; k++) {
    var a = DATA.shifts[k][0], b = DATA.shifts[k][1], dx = DATA.dx;
    pos.setValueAtTime(a - 0.6, [base[0], base[1]]);
    pos.setValueAtTime(a + 0.5, [base[0] + dx, base[1]]);
    pos.setValueAtTime(b - DATA.exitLen, [base[0] + dx, base[1]]);
    pos.setValueAtTime(b - DATA.exitLen + 1.0, [base[0], base[1]]);
}
for (var q = 1; q <= pos.numKeys; q++) { var e = new KeyframeEase(0, 75); pos.setTemporalEaseAtKey(q, [e], [e]); }
R.done.push("tutor keys: " + pos.numKeys);
// report transition layers
R.tr = [];
for (var j = 1; j <= main.numLayers; j++) { var L = main.layer(j); if (L.source && /Transition/i.test(L.source.name)) R.tr.push(L.name + " <- " + L.source.name + " @" + L.inPoint.toFixed(2)); }
app.endUndoGroup();
