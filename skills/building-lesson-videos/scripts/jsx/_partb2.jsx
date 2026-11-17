app.beginUndoGroup("partb2");
var main = app.project.itemByID(4638), card = app.project.itemByID(7006);
function find(prefix) { for (var i = 1; i <= main.numLayers; i++) if (main.layer(i).name.indexOf(prefix) == 0) return main.layer(i); return null; }
var outT = find("OUT S23"), inT = find("IN S20");
var o2 = outT.duplicate(); o2.name = "OUT PART B card"; o2.startTime = 247.23;
var i2 = inT.duplicate(); i2.name = "IN PART B card"; i2.startTime = 253.42;
var cl = main.layers.add(card); cl.name = "PART B card"; cl.startTime = 248.0; cl.inPoint = 248.0; cl.outPoint = 254.2;
cl.moveBefore(find("S28 Collaboration"));
o2.moveBefore(main.layer(1).index == 1 ? main.layer(2) : main.layer(1));
i2.moveBefore(main.layer(2));
var mk = new MarkerValue("PART B - cut"); main.markerProperty.setValueAtTime(248.0, mk);
R.done.push("out " + o2.inPoint.toFixed(2) + "-" + o2.outPoint.toFixed(2) + " in " + i2.inPoint.toFixed(2) + "-" + i2.outPoint.toFixed(2) + " card " + cl.inPoint + "-" + cl.outPoint);
app.endUndoGroup();
