var c = byId(6878);
app.beginUndoGroup("Tutor grade");
var L = null; for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name === "TUTOR GRADE") L = c.layer(j);
if (!L) throw new Error("TUTOR GRADE layer missing");
var lum = L.property("ADBE Effect Parade").property("Lumetri Color");
for (var key in DATA.p) { try { lum.property("ADBE Lumetri-" + key).setValue(DATA.p[key]); } catch (e) { R.warnings.push(key + ": " + e); } }
lum.enabled = DATA.on;
R.done.push("grade set, on=" + DATA.on);
app.endUndoGroup();
