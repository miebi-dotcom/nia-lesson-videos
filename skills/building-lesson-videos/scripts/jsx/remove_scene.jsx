// Remove named scenes (main-comp layers + their comps). DATA: { "mainId": 1822, "names": ["S19 Photo 13a"] }
var main = byId(DATA.mainId);
app.beginUndoGroup("Remove scenes");
for (var n = 0; n < DATA.names.length; n++) {
    for (var j = main.numLayers; j >= 1; j--) { var L = main.layer(j); if (L.source && L.source.name === DATA.names[n]) L.remove(); }
    var c = compByName(DATA.names[n]); if (c) c.remove();
    R.done.push("removed " + DATA.names[n]);
}
app.endUndoGroup();
