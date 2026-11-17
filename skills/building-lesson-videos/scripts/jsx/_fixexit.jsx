app.beginUndoGroup("fixexit");
var main = app.project.itemByID(4638);
for (var i = 1; i <= main.numLayers; i++) {
  var ML = main.layer(i);
  if (ML.name.indexOf("S29 White bar") != 0 && ML.name.indexOf("S30 Red bar") != 0) continue;
  var c = ML.source, D = ML.outPoint - ML.inPoint;
  var L = null;
  for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name == "Textplaceholder") L = c.layer(j);
  var pos = L.property("ADBE Transform Group").property("ADBE Position"), op = L.property("ADBE Transform Group").property("ADBE Opacity");
  var info = "pos keys " + pos.numKeys + " op keys " + op.numKeys;
  // exit keys are the last two of each
  var pv3 = pos.keyValue(3), pv4 = pos.keyValue(4), ov3 = op.keyValue(3), ov4 = op.keyValue(4);
  pos.removeKey(4); pos.removeKey(3); op.removeKey(4); op.removeKey(3);
  pos.setValueAtTime(D - 1.26, pv3); pos.setValueAtTime(D - 0.3, pv4);
  op.setValueAtTime(D - 0.25, ov3); op.setValueAtTime(D - 0.05, ov4);
  R.done.push(ML.name + " D=" + D.toFixed(2) + " " + info);
}
app.endUndoGroup();
