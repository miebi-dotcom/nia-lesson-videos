var main = byId(DATA.mainId), bgc = byId(DATA.bgId);
app.beginUndoGroup("Tutor backdrop");
for (var j = main.numLayers; j >= 1; j--) if (main.layer(j).name === DATA.name) main.layer(j).remove();
var L = main.layers.add(bgc);
L.name = DATA.name; L.startTime = 0; L.inPoint = 0; L.outPoint = main.duration;
L.moveToEnd();
R.done.push("backdrop at index " + L.index + " of " + main.numLayers);
app.endUndoGroup();
