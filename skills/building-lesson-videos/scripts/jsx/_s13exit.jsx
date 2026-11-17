app.beginUndoGroup("s13exit");
var c = app.project.itemByID(6478);
for (var n = 8; n <= 10; n++) { var L = c.layer(n), p = L.property("ADBE Transform Group").property("ADBE Position");
  if (p.numKeys != 4) { R.warnings.push("keys " + L.name); continue; }
  var v3 = p.keyValue(3), i3 = p.keyInTemporalEase(3), o3 = p.keyOutTemporalEase(3);
  var t = p.keyTime(3);
  p.removeKey(3); var nk = p.addKey(11.85); p.setValueAtKey(nk, v3);
  try { p.setTemporalEaseAtKey(nk, i3, o3); } catch (e) {}
  R.done.push(L.name + " keys " + p.numKeys + " k3 " + p.keyTime(3).toFixed(2));
}
app.endUndoGroup();
