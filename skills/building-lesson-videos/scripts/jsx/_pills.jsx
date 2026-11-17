app.beginUndoGroup("pills");
var main = app.project.itemByID(4638), src = app.project.itemByID(6204), folder = src.parentFolder;
var olds = [], texts = [];
for (var i = 1; i <= main.numLayers; i++) { var ML = main.layer(i);
  if (ML.name.indexOf("S30 Red bar ") == 0) { olds.push(ML); texts.push(ML.name.substr(12)); }
  if (ML.name.indexOf("S29 White bar") == 0) { olds.push(ML); texts.push("Roles of primary health care team"); } }
var oldComps = [];
for (var n = 0; n < olds.length; n++) {
  var old = olds[n], st = old.inPoint, D = old.outPoint - old.inPoint;
  oldComps.push(old.source);
  var dup = src.duplicate(); dup.name = "OST " + texts[n]; dup.parentFolder = folder;
  var tl = dup.layer(1), pd = tl.property("ADBE Text Properties").property("ADBE Text Document"), td = pd.value; td.text = texts[n]; pd.setValue(td);
  var nl = main.layers.add(dup); nl.startTime = st; nl.inPoint = st; nl.outPoint = st + D;
  nl.moveBefore(old); nl.name = "OST " + texts[n];
  R.done.push(nl.name + " @" + st.toFixed(2) + " D=" + D.toFixed(2));
}
for (var n = 0; n < olds.length; n++) olds[n].remove();
for (var n = 0; n < oldComps.length; n++) { try { oldComps[n].remove(); } catch (e) {} }
app.endUndoGroup();
