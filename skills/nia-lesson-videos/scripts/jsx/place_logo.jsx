// Persistent NIA logo bug on the main comp, top right, from when the intro's own logo appears to the end.
// Needed because a user-trimmed intro layer no longer carries the logo. One undo step.
// Generalised from the CSC1101 build (values there: logo comp 492x181, anchor 246,90.5, position 1730.36,127.1, scale 42, start 7.2).
// DATA: { "mainId": 6825, "logoName": "logo", "start": 7.2,
//         "position": [1730.36, 127.105], "scale": 42, "anchor": [246, 90.5] }   (logoId may replace logoName)
var m = byId(DATA.mainId), src = DATA.logoId ? byId(DATA.logoId) : compByName(DATA.logoName || "logo");
if (!m || !src) throw new Error("main comp or logo comp not found");
app.beginUndoGroup("Logo bug");
try {
    for (var j = m.numLayers; j >= 1; j--) if (m.layer(j).name === "NIA logo bug") m.layer(j).remove();
    var L = m.layers.add(src);
    L.name = "NIA logo bug";
    L.startTime = DATA.start; L.inPoint = DATA.start; L.outPoint = m.duration;
    var t = L.property("ADBE Transform Group");
    var an = DATA.anchor || [src.width / 2, src.height / 2];
    t.property("ADBE Anchor Point").setValue([an[0], an[1], 0]);
    var pos = DATA.position || [1730.36, 127.105];
    t.property("ADBE Position").setValue([pos[0], pos[1], 0]);
    var sc = DATA.scale || 42;
    t.property("ADBE Scale").setValue([sc, sc, 100]);
    L.moveToBeginning();
    R.done.push("logo placed " + r2(L.inPoint) + "-" + r2(L.outPoint));
} finally { app.endUndoGroup(); }
