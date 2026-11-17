// Remove every scene a previous build_scenes run placed (so a re-planned build starts clean).
// DATA: { "mainId": 1822, "scenesFolder": "IRS101 scenes", "prefix": "S" }
// Removes main-comp layers whose source comp lives in the scenes folder, then those comps. One undo group.
var main = byId(DATA.mainId);
if (!main) throw new Error("main comp " + DATA.mainId + " not found");
var sf = folderNamed(DATA.scenesFolder, false);
if (!sf) throw new Error("scenes folder not found: " + DATA.scenesFolder);
app.beginUndoGroup("Clean scenes");
var nl = 0, nc = 0;
for (var j = main.numLayers; j >= 1; j--) {
    var L = main.layer(j);
    if (L.source && L.source.parentFolder === sf) { L.remove(); nl++; }
}
for (var i = sf.numItems; i >= 1; i--) {
    var it = sf.item(i);
    if (it instanceof CompItem) { it.remove(); nc++; }
}
app.endUndoGroup();
R.done.push("removed " + nl + " layers and " + nc + " comps");
