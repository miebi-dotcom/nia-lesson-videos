app.beginUndoGroup("off"); var c = app.project.itemByID(DATA.id); c.layer(DATA.layer).enabled = false; R.done.push(c.layer(DATA.layer).name); app.endUndoGroup();
