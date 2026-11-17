var m = app.project.itemByID(4638), L = m.layer(70), p = L.property("ADBE Transform Group").property("ADBE Position");
for (var k = 1; k <= p.numKeys; k++) R.done.push(p.keyTime(k).toFixed(2) + " = " + p.keyValue(k).join(","));
var o = L.property("ADBE Transform Group").property("ADBE Opacity"); R.done.push("opkeys " + o.numKeys);
for (var i = 1; i <= m.numLayers; i++) { var Q = m.layer(i); if (Q.inPoint < 233 && Q.outPoint > 224 && Q.index < 70) R.done.push(i + " " + Q.name + " " + Q.inPoint.toFixed(1) + "-" + Q.outPoint.toFixed(1)); }
