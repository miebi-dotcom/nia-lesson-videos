app.beginUndoGroup("fixvid");
for (var n = 0; n < DATA.ids.length; n++) {
  var c = app.project.itemByID(DATA.ids[n]);
  for (var i = 1; i <= c.numLayers; i++) {
    var L = c.layer(i);
    if (L.name.indexOf(".mp4") < 0) continue;
    var p = L.property("ADBE Transform Group").property("ADBE Position"), v = p.value;
    R.done.push(c.name + " " + L.name.substr(0, 8) + " y " + v[1].toFixed(1) + " keys " + p.numKeys);
    if (p.numKeys == 0 && Math.abs(v[1] - 540) > 1) p.setValue([v[0], 540, v[2]]);
  }
}
app.endUndoGroup();
