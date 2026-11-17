var c = app.project.itemByID(DATA.id);
for (var i = 1; i <= c.numLayers; i++) {
  var L = c.layer(i), s = i + "|" + L.name + "|" + L.inPoint.toFixed(2) + "-" + L.outPoint.toFixed(2) + "|" + (L.enabled?"on":"off");
  try { var t = L.property("ADBE Text Properties").property("ADBE Text Document").value; s += "|TEXT:" + t.text.replace(/[\r\n]+/g, " / ") + "|" + t.font + "|" + t.fontSize; } catch (e) {}
  if (L.source && !(L.source instanceof CompItem === false)) s += "|comp#" + L.source.id;
  R.done.push(s);
}
