app.beginUndoGroup("sidelist");
var src = app.project.itemByID(6500), dup = src.duplicate();
dup.name = "S19 Tertiary facilities (side list)"; dup.parentFolder = src.parentFolder;
// drop the photo and video (right-hand picture): keep the list panel over the tutor
for (var i = dup.numLayers; i >= 1; i--) { var L = dup.layer(i); if (L.name == "8 where highly.jpg" || L.name.indexOf(".mp4") > 0) L.remove(); }
function setT(i, t) { var pd = dup.layer(i).property("ADBE Text Properties").property("ADBE Text Document"), td = pd.value; td.text = t; pd.setValue(td); }
setT(2, "Tertiary-level facilities"); setT(3, "Federal medical centres"); setT(5, "University teaching hospitals"); setT(7, "Specialist hospitals");
R.done.push("dup " + dup.id + " layers " + dup.numLayers);
app.endUndoGroup();
