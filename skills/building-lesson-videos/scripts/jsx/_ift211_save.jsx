// Save the open project as a NEW file (first call) or save in place if it is already that file.
var f = new File(DATA.path);
if (app.project.file && app.project.file.fsName === f.fsName) { app.project.save(); R.done.push("saved " + f.fsName); }
else if (f.exists && !DATA.first) { throw new Error("target exists and is not the open project: " + f.fsName); }
else { app.project.save(f); R.done.push("saved as " + f.fsName); }
