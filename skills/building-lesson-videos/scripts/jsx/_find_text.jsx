var pats = DATA.pats;
for (var i = 1; i <= app.project.numItems; i++) {
  var it = app.project.item(i);
  if (!(it instanceof CompItem)) continue;
  for (var j = 1; j <= it.numLayers; j++) {
    var L = it.layer(j);
    var tp = L.property("ADBE Text Properties");
    if (!tp) continue;
    var t = "";
    try { t = L.property("ADBE Text Properties").property("ADBE Text Document").value.text; } catch (e) { continue; }
    for (var k = 0; k < pats.length; k++) {
      if (t.toLowerCase().indexOf(pats[k].toLowerCase()) >= 0) { R.done.push(pats[k] + " || comp " + it.id + " " + it.name + " || L" + j + " " + L.name + " || " + t.replace(/[\r\n]+/g, " / ")); break; }
    }
  }
}
