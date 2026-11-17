// Render every visible layer of a layered asset comp on its own, so its outline can be measured
// (layer_bboxes.py). Needed for Illustrator imports and any layer whose source is document-sized
// (AE only reports the full artboard as its bounds). Run on the freshly imported comp, before animating.
// DATA: { "compId": 123 (or "comp": "name"), "outDir": "C:/work/layers_S06", "time": 0 }
// Writes one PNG per layer + manifest.json  [{ "file", "name", "index", "type", "w", "h" }]
var c = DATA.compId ? byId(DATA.compId) : compByName(DATA.comp);
if (!c) throw new Error("comp not found");
// always render into a fresh folder: overwriting/deleting earlier renders makes saveFrameToPng silently skip
var dir = new Folder(DATA.outDir);
if (dir.exists && dir.getFiles("*.png").length) dir = new Folder(DATA.outDir + "_" + (new Date().getTime()));
dir.create();
R.outDir = dir.fsName;
var t = DATA.time || 0, states = [], man = [];
// renders follow the comp's preview resolution (e.g. Quarter): force Full while measuring
var resWas = c.resolutionFactor;
c.resolutionFactor = [1, 1];
for (var j = 1; j <= c.numLayers; j++) states.push(c.layer(j).enabled);
try {
    for (var j = 1; j <= c.numLayers; j++) {
        var L = c.layer(j);
        if (!states[j - 1] || !L.hasVideo || L.adjustmentLayer || L.nullLayer) continue;
        for (var q = 1; q <= c.numLayers; q++) c.layer(q).enabled = (q === j);
        var f = new File(dir.fsName + "/layer_" + ("00" + j).slice(-3) + ".png");
        if (!renderFrame(c, t, f)) { R.warnings.push("no render for layer " + j + " " + L.name); continue; }
        var type = "other";   // if/else: ExtendScript mis-evaluates chained ?: (see gotchas)
        if (L instanceof TextLayer) type = "text";
        else if (L instanceof ShapeLayer) type = "shape";
        else if (L.source && L.source.file) type = /\.ai$|\.eps$|\.pdf$/i.test(L.source.file.name) ? "vector" : "footage";
        man.push({ file: f.fsName, name: L.name, index: j, type: type, w: c.width, h: c.height });
    }
} finally {
    for (var j = 1; j <= c.numLayers; j++) c.layer(j).enabled = states[j - 1];
    c.resolutionFactor = resWas;
}
var mf = new File(dir.fsName + "/manifest.json");
mf.encoding = "UTF-8"; mf.open("w"); mf.write(toJSON(man)); mf.close();
R.done.push(man.length + " layers rendered to " + dir.fsName);
