var main = app.project.itemByID(4638);
for (var i = 1; i <= main.numLayers; i++) { var ML = main.layer(i);
  if (ML.name.indexOf("S30 Red bar") != 0 && ML.name.indexOf("S29 White") != 0) continue;
  var c = ML.source; var s = ML.name + " D=" + c.duration.toFixed(2) + " mainOp=" + ML.property("ADBE Transform Group").property("ADBE Opacity").value + " mainKeys=" + ML.property("ADBE Transform Group").property("ADBE Opacity").numKeys;
  for (var j = 1; j <= c.numLayers; j++) { var L = c.layer(j), o = L.property("ADBE Transform Group").property("ADBE Opacity");
    s += " | " + L.name.substr(0, 12) + " op@mid " + o.valueAtTime(c.duration / 2, false) + " keys:"; for (var k = 1; k <= o.numKeys; k++) s += o.keyTime(k).toFixed(2) + "=" + o.keyValue(k) + ","; }
  R.done.push(s); }
