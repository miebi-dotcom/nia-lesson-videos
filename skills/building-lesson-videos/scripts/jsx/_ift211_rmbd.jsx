var c = byId(6824);
app.beginUndoGroup("Remove redundant backdrop");
for (var j = c.numLayers; j >= 1; j--) if (c.layer(j).name === "BASE tutor backdrop (swap me)") { c.layer(j).remove(); R.done.push("removed"); }
app.endUndoGroup();
