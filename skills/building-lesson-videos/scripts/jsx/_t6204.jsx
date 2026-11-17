var c = app.project.itemByID(DATA.id), L = c.layer(1), T = L.property("ADBE Transform Group");
function g(p) { try { var v = p.value; return (v instanceof Array) ? "[" + v.join(",") + "]" : v; } catch (e) { return "?"; } }
var td = L.property("ADBE Text Properties").property("ADBE Text Document").value;
R.done.push("just " + td.justification + " size " + td.fontSize);
try { var r = L.sourceRectAtTime(1.5, false); R.done.push("rect " + [r.left, r.top, r.width, r.height].join(",")); } catch (e) { R.done.push("rect err " + e); }
R.done.push("pos " + g(T.property("ADBE Position")) + " anchor " + g(T.property("ADBE Anchor Point")) + " scale " + g(T.property("ADBE Scale")));
R.done.push("pos expr: " + T.property("ADBE Position").expression + " keys " + T.property("ADBE Position").numKeys);
if (L.parent) R.done.push("parent " + L.parent.name + " ppos " + g(L.parent.property("ADBE Transform Group").property("ADBE Position")) + " panch " + g(L.parent.property("ADBE Transform Group").property("ADBE Anchor Point")) + " pscale " + g(L.parent.property("ADBE Transform Group").property("ADBE Scale")));
var ef = L.property("ADBE Effect Parade"); for (var i = 1; i <= ef.numProperties; i++) R.done.push("fx " + ef.property(i).name);
