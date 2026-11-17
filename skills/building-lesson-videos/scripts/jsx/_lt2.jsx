app.beginUndoGroup("lt2");
var main = app.project.itemByID(4638), src = null;
for (var i = 1; i <= main.numLayers; i++) if (main.layer(i).name == "S01 Tutor lower third") src = main.layer(i);
var d = src.duplicate(); d.name = "S24 Tutor lower third (after PART B)";
var dur = src.outPoint - src.inPoint, off = src.inPoint - src.startTime;
d.startTime = DATA.t - off; d.inPoint = DATA.t; d.outPoint = DATA.t + dur;
R.done.push(d.name + " " + d.inPoint.toFixed(2) + "-" + d.outPoint.toFixed(2) + " idx " + d.index);
app.endUndoGroup();
