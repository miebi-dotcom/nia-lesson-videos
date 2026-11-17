var c = app.project.itemByID(DATA.id);
for (var i = 1; i <= c.numLayers; i++) { var L = c.layer(i), s = i + " " + L.name.substr(0,25) + " " + L.inPoint.toFixed(1) + "-" + L.outPoint.toFixed(1);
  var t = L.property("ADBE Transform Group"), names = ["ADBE Opacity", "ADBE Position"];
  for (var p = 0; p < 2; p++) { var pr = t.property(names[p]); if (pr.numKeys) { s += " " + pr.name + ":"; for (var k = 1; k <= pr.numKeys; k++) { var v = pr.keyValue(k); s += pr.keyTime(k).toFixed(2) + "=" + (v instanceof Array ? v[0].toFixed(0) + "/" + v[1].toFixed(0) : v) + ","; } } }
  R.done.push(s); }
