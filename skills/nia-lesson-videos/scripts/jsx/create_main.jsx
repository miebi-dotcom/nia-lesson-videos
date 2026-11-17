// Create the lesson's main comp (1920x1080, 25 fps, the NIA delivery rate) with the tutor recording on it.
// DATA: { "name": "CSC1101_Y1_01_02 MAIN", "footageId": 6824, "folder": "CSC1101 build", "tutorStart": 0 }
// The user then drops the NIA intro ("Intro and Lower third Template") at 0; afterwards shift the tutor and the markers
// with shift_tutor_markers.jsx so the tutor is already underneath when the intro's wipe reveals it (CSC1101: 8.0 s).
var nm = DATA.name, existing = compByName(nm);
if (existing) { R.mainId = existing.id; R.done.push("main comp already exists: " + nm); }
else {
    var foot = byId(DATA.footageId);
    if (!foot) throw new Error("footage " + DATA.footageId + " not found");
    app.beginUndoGroup("New main comp");
    try {
        var st = DATA.tutorStart || 0;
        var c = app.project.items.addComp(nm, 1920, 1080, 1, foot.duration + st, 25);
        c.parentFolder = folderNamed(DATA.folder, true);
        var L = c.layers.add(foot);
        L.name = "TUTOR (" + foot.name.replace(/\.[a-z0-9]+$/i, "") + ")";
        L.startTime = st;
        R.mainId = c.id;
        R.done.push("created " + nm + " dur " + r2(c.duration) + "; footage fps " + foot.frameRate + "; hasAudio " + foot.hasAudio);
    } finally { app.endUndoGroup(); }
    c.openInViewer();
}
