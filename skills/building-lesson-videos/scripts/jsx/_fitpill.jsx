app.beginUndoGroup("fitpill");
var main = app.project.itemByID(4638);
for (var i = 1; i <= main.numLayers; i++) { var ML = main.layer(i);
  if (ML.name.indexOf("OST ") != 0 || !ML.source || ML.source.id == 6204) continue;
  var c = ML.source; if (c.name.indexOf("OST ") != 0) continue;
  if (c.name != ML.name) continue;
  var L = c.layer(1), T = L.property("ADBE Transform Group");
  var r = L.sourceRectAtTime(1.5, false), sc = T.property("ADBE Scale").value[0] / 100, W = r.width * sc;
  var pad = 118, cx = 953.43, pillW = W + 2 * pad;
  var n2 = c.layer(2).property("ADBE Transform Group").property("ADBE Position"), n3 = c.layer(3).property("ADBE Transform Group").property("ADBE Position");
  n2.setValue([cx - pillW / 2, n2.value[1], 0]); n3.setValue([cx + pillW / 2, n3.value[1], 0]);
  var p = T.property("ADBE Position"), v = p.value;
  p.setValue([cx - W / 2 - 1620.57 - r.left * sc, v[1], v[2]]);
  R.done.push(c.name + " W=" + W.toFixed(0) + " pill=" + pillW.toFixed(0));
}
app.endUndoGroup();
