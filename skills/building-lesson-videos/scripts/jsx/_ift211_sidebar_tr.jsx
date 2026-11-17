// NIA Transition 2 on the side-bar entry (S20; S04 already has one from the green clip), tutor slides over while the frame is covered.
var main = byId(DATA.mainId), TR = byId(DATA.trId);
app.beginUndoGroup("Side bar transition + tutor move under cover");
function layerByName(c, nm) { for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name === nm) return c.layer(j); return null; }
var ref = null;
for (var j = 1; j <= main.numLayers; j++) if (main.layer(j).source === TR) { ref = main.layer(j); break; }
var old = layerByName(main, DATA.name); if (old) old.remove();
var L = main.layers.add(TR);
L.name = DATA.name;
L.startTime = DATA.cut - DATA.cover;
L.inPoint = DATA.cut - DATA.cover; L.outPoint = DATA.cut - DATA.cover + TR.duration;
if (ref) { L.label = ref.label; L.audioEnabled = false; }
L.moveToBeginning();
// tutor keys: slide while covered (cover window ~ cut-0.6 .. cut+0.6)
var tut = layerByName(main, "video");
var pos = tg(tut).property("ADBE Position");
var base = pos.valueAtTime(0, false);
var keys = [];
for (var q = 1; q <= pos.numKeys; q++) keys.push([pos.keyTime(q), pos.keyValue(q)]);
while (pos.numKeys > 0) pos.removeKey(1);
// drop old slide-in keys for the shifts listed, re-add under cover
var drop = DATA.dropTimes, out = [];
for (var i = 0; i < keys.length; i++) { var kill = false; for (var d = 0; d < drop.length; d++) if (Math.abs(keys[i][0] - drop[d]) < 0.02) kill = true; if (!kill) out.push(keys[i]); }
for (var i = 0; i < out.length; i++) pos.setValueAtTime(out[i][0], out[i][1]);
for (var s = 0; s < DATA.slides.length; s++) {
    var c = DATA.slides[s];
    pos.setValueAtTime(c - 0.3, [base[0], base[1]]);
    pos.setValueAtTime(c + 0.3, [base[0] + DATA.dx, base[1]]);
}
for (var q = 1; q <= pos.numKeys; q++) { var e = new KeyframeEase(0, 75); pos.setTemporalEaseAtKey(q, [e], [e]); }
R.done.push("added " + DATA.name + " @" + L.inPoint.toFixed(2) + "; tutor keys " + pos.numKeys);
app.endUndoGroup();
