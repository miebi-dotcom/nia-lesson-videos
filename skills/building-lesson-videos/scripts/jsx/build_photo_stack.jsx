// One scene comp holding SEVERAL photos of the same asset (13a, 13b, ...): the first fills the frame, each later one
// slides in over it at its own time. Photos get the same inset rounded frame and slow push-in as the "image place holder" preset.
// DATA: { "mainId": 1822, "scenesFolder": "IRS101 scenes", "assetsFolder": "IRS101 assets", "bg": 593,
//         "name": "S19 Photos (asset 13)", "t": 388.52, "D": 35.62,
//         "photos": [ {"path": "D:/a.jpg", "at": 0}, {"path": "D:/b.jpg", "at": 14.7} ],      at = seconds into the scene
//         "frame": {"x": 960, "y": 513, "w": 1792, "h": 983, "r": 28}, "pushIn": 0.07, "slide": 0.7 }
// Re-running with the same name replaces the earlier scene. One undo group.
var main = byId(DATA.mainId);
if (!main) throw new Error("main comp " + DATA.mainId + " not found");
var scenesF = folderNamed(DATA.scenesFolder, true), assetsF = folderNamed(DATA.assetsFolder, true);
var fr = DATA.frame || { x: 960, y: 513, w: 1792, h: 983, r: 28 };
var push = (DATA.pushIn === undefined) ? 0.07 : DATA.pushIn, slide = DATA.slide || 0.7;
app.beginUndoGroup("Photo stack " + DATA.name);
for (var j = main.numLayers; j >= 1; j--) { var ol = main.layer(j); if (ol.source && ol.source.name === DATA.name) ol.remove(); }
var old = compByName(DATA.name);
if (old && old.parentFolder === scenesF) old.remove();
var c = app.project.items.addComp(DATA.name, 1920, 1080, 1, DATA.D, main.frameRate);
c.parentFolder = scenesF;
var bg = byId(DATA.bg);
if (bg) { var bl = c.layers.add(bg); bl.name = "background"; bl.outPoint = DATA.D; }
for (var i = 0; i < DATA.photos.length; i++) {
    var ph = DATA.photos[i], item = importOnce(ph.path, false, assetsF);
    var at = snapT(c, ph.at || 0);
    var L = c.layers.add(item);
    L.name = item.name.replace(/\.[a-z0-9]+$/i, "");
    var s = Math.max(fr.w / item.width, fr.h / item.height) * 100;
    tg(L).property("ADBE Position").setValue([fr.x, fr.y]);
    tg(L).property("ADBE Scale").setValue([s, s, 100]);
    L.inPoint = at; L.outPoint = DATA.D;
    var m = c.layers.addShape();
    m.name = L.name + " frame";
    var grp = m.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var rc = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    rc.property("ADBE Vector Rect Size").setValue([fr.w, fr.h]);
    rc.property("ADBE Vector Rect Roundness").setValue(fr.r);
    rc.property("ADBE Vector Rect Position").setValue([fr.x, fr.y]);
    grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    tg(m).property("ADBE Position").setValue([0, 0]);
    m.inPoint = at; m.outPoint = DATA.D;
    m.moveBefore(L);
    L.setTrackMatte(m, TrackMatteType.ALPHA);
    if (push) tg(L).property("ADBE Scale").expression = "var p=linear(time,inPoint,outPoint,0,1); value*(1+" + push + "*(1-Math.pow(1-p,2)))";
    if (at > 0.05) {
        var pp = tg(L).property("ADBE Position"), mp = tg(m).property("ADBE Position");
        pp.setValueAtTime(at, [fr.x + 1950, fr.y]); pp.setValueAtTime(at + slide, [fr.x, fr.y]);
        mp.setValueAtTime(at, [1950, 0]); mp.setValueAtTime(at + slide, [0, 0]);
        signatureEase(pp, "in"); signatureEase(mp, "in");
    }
    L.motionBlur = true; m.motionBlur = true;
    R.done.push(DATA.name + ": " + L.name + " at " + at + "s");
}
c.motionBlur = true;
var sl = main.layers.add(c);
sl.startTime = DATA.t; sl.inPoint = DATA.t; sl.outPoint = DATA.t + DATA.D;
sl.name = DATA.name;
app.endUndoGroup();
