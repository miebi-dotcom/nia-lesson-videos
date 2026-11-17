// post-fix: remove obsolete S18 pill, scale S13 stack
var main = byId(DATA.mainId);
var done = [];
for (var j = main.numLayers; j >= 1; j--) {
    var L = main.layer(j), n = L.name;
    if (L.source && (L.source.name === "S18 OST Clear and precise")) { L.remove(); done.push("removed " + n); continue; }
}
for (var j2 = 1; j2 <= main.numLayers; j2++) {
    var M = main.layer(j2);
    if (M.source && M.source.name.indexOf("S13 OST ") === 0) {
        var idx = DATA.order[M.source.name.replace("S13 OST ", "")];
        var t = tg(M);
        t.property("ADBE Anchor Point").setValue([589, 1012]);
        t.property("ADBE Scale").setValue([80, 80, 100]);
        t.property("ADBE Position").setValue([60, 1012 - 136 * (4 - idx)]);
        done.push("scaled " + M.source.name);
    }
}
R.done = done;
