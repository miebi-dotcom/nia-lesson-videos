app.beginUndoGroup("partb");
var src = app.project.itemByID(1699), dup = src.duplicate(); dup.name = "PART B card";
dup.parentFolder = app.project.itemByID(DATA.folder);
function setT(i, t) { var pd = dup.layer(i).property("ADBE Text Properties").property("ADBE Text Document"), td = pd.value; td.text = t; pd.setValue(td); }
setT(1, "PART B"); setT(2, "Primary health care and the Nigerian health system"); setT(3, "Roles of the government in\rprimary health care");
R.done.push("dup " + dup.id + " " + dup.duration);
app.endUndoGroup();
