app.beginUndoGroup("retime");
var main = app.project.itemByID(4638);
function find(prefix) { for (var i = 1; i <= main.numLayers; i++) if (main.layer(i).name.indexOf(prefix) == 0) return main.layer(i); return null; }
function shiftTrans(prefix, d) { var L = find(prefix); if (!L) { R.errors.push("no " + prefix); return; } L.startTime += d; R.done.push(L.name + " now " + L.inPoint.toFixed(2) + "-" + L.outPoint.toFixed(2)); }
function setIn(prefix, t) { var L = find(prefix); if (!L) { R.errors.push("no " + prefix); return; } var o = L.outPoint; L.inPoint = t; L.outPoint = o; R.done.push(L.name + " in " + L.inPoint.toFixed(2) + " out " + L.outPoint.toFixed(2)); }
function setOut(prefix, t) { var L = find(prefix); if (!L) { R.errors.push("no " + prefix); return; } L.outPoint = t; R.done.push(L.name + " out " + L.outPoint.toFixed(2)); }
for (var n = 0; n < DATA.ops.length; n++) { var o = DATA.ops[n]; if (o.k == "shift") shiftTrans(o.p, o.v); if (o.k == "in") setIn(o.p, o.v); if (o.k == "out") setOut(o.p, o.v); }
app.endUndoGroup();
