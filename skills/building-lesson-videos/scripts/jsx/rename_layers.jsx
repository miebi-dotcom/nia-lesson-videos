// Rename scene layers + their comps. DATA: {"mainId": 1822, "from": " TXT ", "to": " pill "}
var main = byId(DATA.mainId);
app.beginUndoGroup("Rename scenes");
var n = 0;
for (var j = 1; j <= main.numLayers; j++) {
    var L = main.layer(j);
    if (L.name.indexOf(DATA.from) >= 0) {
        var nn = L.name.split(DATA.from).join(DATA.to);
        if (L.source && L.source instanceof CompItem && L.source.name === L.name) L.source.name = nn;
        L.name = nn; n++;
    }
}
app.endUndoGroup();
R.done.push("renamed " + n);
