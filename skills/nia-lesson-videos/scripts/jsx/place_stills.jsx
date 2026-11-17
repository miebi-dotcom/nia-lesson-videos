// Full-screen b-roll stills on the main comp, each with a slow push-in, placed just above the tutor layer.
// DATA: { "mainId": 6825, "assetsFolder": "...", "tutorSourceId": 6824, "stills": [ {"name": "...", "path": "D:/x.png", "t": 12.3, "D": 1.2, "push": 0.07} ] }
var main = byId(DATA.mainId);
var assetsF = folderNamed(DATA.assetsFolder, true);
var tutor = null;
for (var i = 1; i <= main.numLayers; i++) if (main.layer(i).source && main.layer(i).source.id === DATA.tutorSourceId) tutor = main.layer(i);
if (!tutor) throw new Error("tutor layer not found");
var PUSH = "var p=linear(time,inPoint,outPoint,0,1); value*(1+%A*(1-Math.pow(1-p,2)))";
app.beginUndoGroup("Place b-roll stills");
for (var k = 0; k < DATA.stills.length; k++) {
    var s = DATA.stills[k];
    for (var j = main.numLayers; j >= 1; j--) if (main.layer(j).name === s.name) main.layer(j).remove();
    var item = importOnce(s.path, false, assetsF);
    var L = main.layers.add(item);
    L.name = s.name;
    var sc = Math.max(1920 / item.width, 1080 / item.height) * 100;
    L.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540]);
    L.property("ADBE Transform Group").property("ADBE Scale").setValue([sc, sc, 100]);
    L.startTime = s.t; L.inPoint = s.t; L.outPoint = s.t + s.D;
    L.property("ADBE Transform Group").property("ADBE Scale").expression = PUSH.replace("%A", (s.push === undefined ? 0.07 : s.push));
    L.moveBefore(tutor);
    R.done.push("still " + s.name + " " + s.t + "-" + (s.t + s.D) + " scale " + Math.round(sc));
}
app.endUndoGroup();
