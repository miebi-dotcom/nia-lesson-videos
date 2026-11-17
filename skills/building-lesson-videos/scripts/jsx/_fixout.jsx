app.beginUndoGroup("fixout");
var main = app.project.itemByID(4638);
for (var i = 1; i <= main.numLayers; i++) { var ML = main.layer(i);
  var want = null;
  if (ML.name == "OST Environmental health officers") want = 405.84;
  if (ML.name == "OST Roles of primary health care team") want = 375.60;
  if (want === null) continue;
  ML.source.duration = 30; ML.outPoint = want; R.done.push(ML.name + " out " + ML.outPoint);
}
app.endUndoGroup();
