var c = app.project.itemByID(6204);
function walk(g, pre) { for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); if (p.propertyType == PropertyType.PROPERTY) { var s = pre + p.name; try { var v = p.value; s += "=" + ((v instanceof Array) ? "[" + v.join(",") + "]" : (v.vertices ? "path v" + v.vertices.length + " " + v.vertices.join("|") : v)); } catch (e) {} if (p.expression) s += " EXPR:" + p.expression; if (p.numKeys) s += " keys" + p.numKeys; R.done.push(s); } else walk(p, pre + p.name + "/"); } }
walk(c.layer(DATA.l).property("ADBE Root Vectors Group"), "");
