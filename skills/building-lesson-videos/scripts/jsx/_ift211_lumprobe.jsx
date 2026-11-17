var c = byId(6878);
app.beginUndoGroup("Grade probe");
var old = null; for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name === "TUTOR GRADE") old = c.layer(j);
var L = old;
if (!L) { L = c.layers.addSolid([1,1,1], "TUTOR GRADE", c.width, c.height, 1, c.duration); L.adjustmentLayer = true; L.moveToBeginning(); }
var fx = L.property("ADBE Effect Parade");
var lum = fx.property("Lumetri Color");
if (!lum) lum = fx.addProperty("ADBE Lumetri");
R.names = [];
for (var p = 1; p <= lum.numProperties; p++) { var q = lum.property(p); R.names.push(p + ":" + q.name + "|" + q.matchName + "|" + q.propertyType); }
app.endUndoGroup();
