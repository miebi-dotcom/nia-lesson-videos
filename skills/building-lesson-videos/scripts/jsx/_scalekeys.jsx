var c = app.project.itemByID(DATA.id);
for (var i = 1; i <= c.numLayers; i++) { var L = c.layer(i), t = L.property("ADBE Transform Group"), s = i + " " + L.name + " " + L.inPoint.toFixed(1) + "-" + L.outPoint.toFixed(1);
  var ps = ["ADBE Scale", "ADBE Position"];
  for (var p = 0; p < 2; p++) { var pr = t.property(ps[p]); if (pr.numKeys > 0) { s += " " + pr.name + ":"; for (var k = 1; k <= pr.numKeys; k++) { var v = pr.keyValue(k); s += pr.keyTime(k).toFixed(2) + "=" + v[0].toFixed(0) + "/" + v[1].toFixed(0) + ","; } } }
  R.done.push(s); }
