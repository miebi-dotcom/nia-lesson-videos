function dumpProp(p, pre, out) {
  if (p.propertyType == PropertyType.PROPERTY) {
    var s = pre + p.name + " = ";
    try { s += (p.value instanceof Array) ? "[" + p.value.join(",") + "]" : (p.value.toString ? p.value.toString() : p.value); } catch (e) { s += "?"; }
    if (p.expression) s += " EXPR:" + p.expression;
    if (p.numKeys) { s += " KEYS:"; for (var k = 1; k <= p.numKeys; k++) s += "(" + p.keyTime(k).toFixed(2) + ":" + (p.keyValue(k) instanceof Array ? "[" + p.keyValue(k).join(",") + "]" : p.keyValue(k)) + ")"; }
    out.push(s);
  } else { for (var i = 1; i <= p.numProperties; i++) dumpProp(p.property(i), pre + p.name + "/", out); }
}
var c = app.project.itemByID(DATA.id);
for (var a = 0; a < DATA.layers.length; a++) {
  var L = c.layer(DATA.layers[a]);
  R.done.push("== L" + L.index + " " + L.name + " parent:" + (L.parent ? L.parent.name : "none") + " " + L.inPoint + "-" + L.outPoint + " effects:" + L.property("ADBE Effect Parade").numProperties);
  dumpProp(L.property("ADBE Transform Group"), "", R.done);
  var ef = L.property("ADBE Effect Parade");
  for (var e = 1; e <= ef.numProperties; e++) dumpProp(ef.property(e), "FX/", R.done);
}
