app.beginUndoGroup("tutorslide");
var m = app.project.itemByID(4638), L = m.layer(70), p = L.property("ADBE Transform Group").property("ADBE Position");
var ts = [[224.5, 960], [226.12, 1392], [231.9, 1392], [232.9, 960]];
for (var i = 0; i < ts.length; i++) p.setValueAtTime(ts[i][0], [ts[i][1], 540, 0]);
for (var k = 1; k <= p.numKeys; k++) { var t = p.keyTime(k); if (t > 224 && t < 233) { try { p.setTemporalEaseAtKey(k, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]); } catch (e) {} } }
// panel exit: compress to 1s so it leaves with the tutor
var c = app.project.itemByID(7030), sb = c.layer(8), sp = sb.property("ADBE Transform Group").property("ADBE Position");
var v3 = sp.keyValue(3), v4 = sp.keyValue(4), e3i = sp.keyInTemporalEase(3), e3o = sp.keyOutTemporalEase(3), e4i = sp.keyInTemporalEase(4), e4o = sp.keyOutTemporalEase(4);
sp.removeKey(4); sp.removeKey(3);
var a = sp.addKey(7.4), b = sp.addKey(8.4); sp.setValueAtKey(a, v3); sp.setValueAtKey(b, v4);
try { sp.setTemporalEaseAtKey(a, e3i, e3o); sp.setTemporalEaseAtKey(b, e4i, e4o); } catch (e) { R.warnings.push("ease"); }
var s = ""; for (var q = 1; q <= p.numKeys; q++) s += p.keyTime(q).toFixed(2) + "=" + p.keyValue(q)[0] + ",";
var s2 = ""; for (q = 1; q <= sp.numKeys; q++) s2 += sp.keyTime(q).toFixed(2) + "=" + sp.keyValue(q)[0].toFixed(0) + ",";
R.done.push("tutor " + s); R.done.push("panel " + s2);
app.endUndoGroup();
