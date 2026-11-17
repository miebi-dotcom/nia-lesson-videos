// Refine Keylight on the A018 tutor layers. DATA: {compId, only?, p:{ "0015": v, ... }}  (property suffix after "Keylight 906-")
var c = byId(DATA.compId);
app.beginUndoGroup("Tune key");
var n = 0;
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j);
    if (!L.enabled || !L.source || L.source.name.indexOf("A018") !== 0) continue;
    if (DATA.only && j !== DATA.only) continue;
    var k = L.property("ADBE Effect Parade").property("Keylight (1.2)");
    if (!k) { R.warnings.push("no keylight on " + j); continue; }
    for (var key in DATA.p) { try { k.property("Keylight 906-" + key).setValue(DATA.p[key]); } catch (e) { R.warnings.push(j + " " + key + ": " + e); } }
    n++;
}
R.done.push("tuned " + n);
app.endUndoGroup();
