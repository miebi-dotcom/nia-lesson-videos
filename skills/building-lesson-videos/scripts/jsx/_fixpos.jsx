app.beginUndoGroup("fixpos");
var main = app.project.itemByID(4638);
for (var i = 1; i <= main.numLayers; i++) { var ML = main.layer(i);
  if (ML.name.indexOf("S30 Red bar") != 0 && ML.name.indexOf("S29 White") != 0) continue;
  var c = ML.source, L = null;
  for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name == "Textplaceholder") L = c.layer(j);
  var p = L.property("ADBE Transform Group").property("ADBE Position");
  while (p.numKeys > 2) p.removeKey(p.numKeys);
  R.done.push(ML.name + " keys " + p.numKeys);
}
app.endUndoGroup();
