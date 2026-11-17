var c = compByName("S13 OST Side bar bullets"), o = [];
for (var j = 1; j <= c.numLayers; j++) {
  var L = c.layer(j), s = "";
  try { s += " pos " + L.property("ADBE Transform Group").property("ADBE Position").value; } catch (e0) {}
  try { var td = L.property("ADBE Text Properties").property("ADBE Text Document").value; s += " |" + td.text + "|" + td.fontSize + "|" + td.boxText; } catch (e) {}
  o.push(j + " " + L.name + " in " + Math.round(L.inPoint * 100) / 100 + " st " + Math.round(L.startTime * 100) / 100 + " en " + L.enabled + s);
}
o.push("dur " + c.duration);
R.done = o;
