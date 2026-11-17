app.beginUndoGroup("fixop");
var main = app.project.itemByID(4638);
for (var i = 1; i <= main.numLayers; i++) { var ML = main.layer(i);
  if (ML.name.indexOf("S30 Red bar") != 0 && ML.name.indexOf("S29 White") != 0) continue;
  var c = ML.source, D = c.duration, L = null;
  for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name == "Textplaceholder") L = c.layer(j);
  var o = L.property("ADBE Transform Group").property("ADBE Opacity");
  while (o.numKeys > 0) o.removeKey(1);
  o.setValueAtTime(0.21, 0); o.setValueAtTime(0.42, 100);   // intro only, stays solid to the end
  var p = L.property("ADBE Transform Group").property("ADBE Position"), s = "";
  for (var k = 1; k <= p.numKeys; k++) s += p.keyTime(k).toFixed(2) + "=" + p.keyValue(k)[1].toFixed(0) + ",";
  R.done.push(ML.name + " pos " + s);
}
app.endUndoGroup();
