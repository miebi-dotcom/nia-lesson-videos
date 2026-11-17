// finds the lesson footage item, its file, size, and any comps using it
var f = byId(6824);
if (!f) throw new Error("item 6824 not found");
R.name = f.name;
R.file = f.file ? f.file.fsName : null;
R.size = f.width + "x" + f.height; R.dur = f.duration; R.fps = f.frameRate;
R.hasAudio = f.hasAudio;
R.usedIn = [];
for (var i = 1; i <= app.project.numItems; i++) {
    var it = app.project.item(i);
    if (it instanceof CompItem) {
        for (var j = 1; j <= it.numLayers; j++) {
            var L = it.layer(j);
            if (L.source && L.source.id == 6824) R.usedIn.push(it.id + ":" + it.name + " layer " + j + " " + L.name + " in=" + L.inPoint + " out=" + L.outPoint);
        }
    }
}
R.activeItem = app.project.activeItem ? app.project.activeItem.name : null;
R.numItems = app.project.numItems;
