app.beginUndoGroup("sidelist2");
var main = app.project.itemByID(4638), c = app.project.itemByID(7030);
c.duration = 14;
var sh = [[4, 5, 0.64], [6, 7, 1.16]];
for (var n = 0; n < sh.length; n++) { c.layer(sh[n][0]).startTime += sh[n][2]; c.layer(sh[n][1]).startTime += sh[n][2]; }
var ref = null, olds = [];
for (var i = 1; i <= main.numLayers; i++) { var L = main.layer(i); if (L.name.indexOf("S19 OST ") == 0) olds.push(L); }
ref = olds[0];
var nl = main.layers.add(c); nl.name = "S19 Tertiary facilities (side list)";
nl.startTime = 224.50; nl.inPoint = 225.0; nl.outPoint = 232.9;
nl.moveBefore(ref);
for (var k = 0; k < olds.length; k++) olds[k].remove();
R.done.push(nl.name + " idx " + nl.index + " " + nl.inPoint.toFixed(2) + "-" + nl.outPoint.toFixed(2) + " removed " + olds.length);
app.endUndoGroup();
