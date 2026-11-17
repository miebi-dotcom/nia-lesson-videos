// Place existing scene comps on the main comp at given times.
// DATA: { "mainId": 6825, "scenes": [ {"compId": 7028, "name": "S04 Controller and driver", "t": 74.88, "D": 16.16} ] }
var main = byId(DATA.mainId);
if (!main) throw new Error("main not found");
app.beginUndoGroup("Place rebuilt scenes");
for (var i = 0; i < DATA.scenes.length; i++) {
    var s = DATA.scenes[i], c = byId(s.compId);
    if (!c) { R.warnings.push("comp missing " + s.compId); continue; }
    for (var j = main.numLayers; j >= 1; j--) { var o = main.layer(j); if (o.name === s.name) o.remove(); }
    var L = main.layers.add(c);
    L.name = s.name;
    L.startTime = s.t;
    L.inPoint = s.t;
    L.outPoint = s.t + s.D;
    R.done.push("placed " + s.name + " " + s.t + "-" + (s.t + s.D));
}
app.endUndoGroup();
