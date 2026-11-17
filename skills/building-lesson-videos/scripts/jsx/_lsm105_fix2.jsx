var c = compByName("S19 Stages native");
var done = [];
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j), p = L.name.substr(0, 3);
    if (p === "027" || p === "028" || p === "029" || p === "030" || p === "036") { L.enabled = false; done.push("hid " + L.name); }
}
var main = byId(DATA.mainId);
for (var k = 1; k <= main.numLayers; k++) {
    var M = main.layer(k);
    if (M.source && DATA.inPts[M.source.name] !== undefined) {
        var o = M.outPoint; M.inPoint = DATA.inPts[M.source.name]; M.outPoint = o; done.push(M.source.name + " in " + M.inPoint);
    }
}
R.done = done;
