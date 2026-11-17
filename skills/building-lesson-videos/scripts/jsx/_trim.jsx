var c = app.project.itemByID(6204);
for (var li = 1; li <= c.numLayers; li++) { var L = c.layer(li); var s = li + " " + L.name + " " + L.inPoint.toFixed(2) + "-" + L.outPoint.toFixed(2);
 var o = L.property("ADBE Transform Group").property("ADBE Opacity"); if (o.numKeys) { s += " opKeys:"; for (var k = 1; k <= o.numKeys; k++) s += o.keyTime(k).toFixed(2) + "=" + o.keyValue(k) + ","; }
 var rv = L.property("ADBE Root Vectors Group"); if (rv) { try { var tp = rv.property("ADBE Vector Filter - Trim") || null; } catch (e) {} }
 R.done.push(s); }
function walk(g, pre) { for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); if (p.propertyType == PropertyType.PROPERTY) { if (p.numKeys && p.name.indexOf("Path") < 0) { var s = pre + p.name + ":"; for (var k = 1; k <= p.numKeys; k++) s += p.keyTime(k).toFixed(2) + "=" + p.keyValue(k) + ","; R.done.push(s); } } else walk(p, pre + p.name + "/"); } }
walk(c.layer(4).property("ADBE Root Vectors Group"), "L4/");
