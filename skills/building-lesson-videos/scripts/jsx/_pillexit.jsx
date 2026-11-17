app.beginUndoGroup("pillexit");
var main = app.project.itemByID(4638);
for (var i = 1; i <= main.numLayers; i++) { var ML = main.layer(i);
  if (ML.name.indexOf("OST ") != 0 || ML.source.id == 6204 || ML.source.name != ML.name) continue;
  var c = ML.source, D = ML.outPoint - ML.inPoint;
  var trim = c.layer(4).property("ADBE Root Vectors Group").property("Trim Paths 1");
  var st = trim.property("Start"), en = trim.property("End");
  st.removeKey(4); st.removeKey(3); en.removeKey(4); en.removeKey(3);
  st.setValueAtTime(D - 0.95, 0); st.setValueAtTime(D - 0.05, 50); en.setValueAtTime(D - 0.95, 100); en.setValueAtTime(D - 0.05, 50);
  c.duration = Math.max(c.duration, D);
  R.done.push(ML.name + " exit " + (D - 0.95).toFixed(2) + "-" + (D - 0.05).toFixed(2));
}
app.endUndoGroup();
