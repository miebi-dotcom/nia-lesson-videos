var c = app.project.itemByID(DATA.id);
R.done.push("comp " + c.width + "x" + c.height);
function g(p) { try { var v = p.value; return (v instanceof Array) ? "[" + v.join(",") + "]" : v; } catch (e) { return "?"; } }
for (var i = 1; i <= c.numLayers; i++) { var L = c.layer(i); var s = i + " " + L.name + " en:" + L.enabled;
  try { s += " src " + L.source.width + "x" + L.source.height; } catch (e) {}
  var t = L.property("ADBE Transform Group"); s += " pos " + g(t.property("ADBE Position")) + " scale " + g(t.property("ADBE Scale")) + " anchor " + g(t.property("ADBE Anchor Point")) + " parent " + (L.parent ? L.parent.name : "-") + " matte " + L.trackMatteType + " in " + L.inPoint.toFixed(2) + "-" + L.outPoint.toFixed(2);
  R.done.push(s); }
