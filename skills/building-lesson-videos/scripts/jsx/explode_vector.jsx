// Split Illustrator artwork into one shape layer per element so each piece can be animated on its own.
// Illustrator files often import as 1-2 layers (only TOP-LEVEL Illustrator layers become AE layers):
// this converts the art layer(s) to shapes and puts every top-level shape group on its own layer.
// DATA: { "comp": "S05 Single Window", "layers": ["Layer 2"] (optional: default = every vector layer that
//         is not a full-frame background), "minArea": 4, "outFile": "C:/work/layers_S05.json" }
// Writes outFile in the same format as layer_bboxes.py: { name: {bb:[x0,y0,x1,y1], kind:"shape", index} }
// (comp pixels), for choreograph.py ("layers": outFile). Original vector layers are left in place, disabled.
// Embedded raster images inside the .ai do not convert: they stay in the original layer (re-enabled as "raster rest").
var c = DATA.compId ? byId(DATA.compId) : compByName(DATA.comp);
if (!c) throw new Error("comp not found");
var cmd = app.findMenuCommandId("Create Shapes from Vector Layer");
if (!cmd) throw new Error("menu command 'Create Shapes from Vector Layer' not found");
c.openInViewer();

function compBox(L) {
    // comp-space bbox of a layer (unrotated, unparented): comp = position + s * (p - anchor)
    var r = L.sourceRectAtTime(0, false), t3 = tg(L), a = t3.property("ADBE Anchor Point").value, p = t3.property("ADBE Position").value, s = t3.property("ADBE Scale").value;
    var x0 = p[0] + s[0] / 100 * (r.left - a[0]), y0 = p[1] + s[1] / 100 * (r.top - a[1]);
    return [r2(x0), r2(y0), r2(x0 + s[0] / 100 * r.width), r2(y0 + s[1] / 100 * r.height)];
}

var targets = [];
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j);
    if (!L.source || !L.source.file || !/\.(ai|eps|pdf)$/i.test(L.source.file.name)) continue;
    if (DATA.layers && DATA.layers.length) { var want = false; for (var q = 0; q < DATA.layers.length; q++) if (DATA.layers[q] === L.name) want = true; if (!want) continue; }
    targets.push(L);
}
if (!targets.length) throw new Error("no vector layers to explode");
// default: never convert the bottom-most vector layer when there are several - it is almost always the
// background (textures/gradients vanish in shape conversion). Pass DATA.layers to choose explicitly.
if (!(DATA.layers && DATA.layers.length) && targets.length > 1) {
    var bottom = targets[targets.length - 1];
    R.warnings.push("kept '" + bottom.name + "' as the background (not converted); pass DATA.layers to override");
    targets.pop();
}
var out = {}, made = 0, minA = DATA.minArea || 4;
app.beginUndoGroup("Explode vector artwork: " + c.name);
for (var t = 0; t < targets.length; t++) {
    var V = targets[t];
    // (a vector footage layer always reports the whole artboard as its bounds, so backgrounds are
    //  detected after conversion, per group)
    for (var k = 1; k <= c.numLayers; k++) c.layer(k).selected = false;
    V.selected = true;
    app.executeCommand(cmd);
    var S = c.selectedLayers.length ? c.selectedLayers[0] : null;
    if (!S || !(S instanceof ShapeLayer)) { R.warnings.push(V.name + ": conversion produced no shape layer (raster art?)"); V.enabled = true; continue; }
    V.enabled = false;
    var root = S.property("ADBE Root Vectors Group");
    // a single wrapper group (common): explode its children instead
    var path = [];
    while (root.numProperties === 1 && root.property(1).matchName === "ADBE Vector Group") { path.push(1); root = root.property(1).property("ADBE Vectors Group"); }
    var n = root.numProperties;
    for (var g = 1; g <= n; g++) {
        var grp = root.property(g);
        if (grp.matchName !== "ADBE Vector Group") continue;
        var D2 = S.duplicate();
        var r2root = D2.property("ADBE Root Vectors Group");
        for (var pi = 0; pi < path.length; pi++) r2root = r2root.property(path[pi]).property("ADBE Vectors Group");
        for (var x = r2root.numProperties; x >= 1; x--) if (x !== g) r2root.property(x).remove();
        var bb = compBox(D2);
        if ((bb[2] - bb[0]) * (bb[3] - bb[1]) < minA) { D2.remove(); continue; }
        D2.name = V.name + " " + ("00" + g).slice(-3) + " " + grp.name.substr(0, 20);
        D2.enabled = true;
        var full = bb[0] <= 2 && bb[1] <= 2 && bb[2] >= c.width - 2 && bb[3] >= c.height - 2;
        out[D2.name] = { bb: bb, kind: full ? "vector" : "shape", index: D2.index, fullFrame: full };
        made++;
    }
    S.remove();
}
app.endUndoGroup();
// re-read indices (duplicates shift them)
for (var nm in out) { var LL = layerNamed(c, nm); if (LL) out[nm].index = LL.index; }
// optional fidelity check: render the exploded result and the original art, for vector_patch_plan.py
if (DATA.compareOut) {
    var cdir = new Folder(DATA.compareOut);
    if (cdir.exists && cdir.getFiles("*.png").length) cdir = new Folder(DATA.compareOut + "_" + (new Date().getTime()));
    cdir.create();
    var resWas = c.resolutionFactor; c.resolutionFactor = [1, 1];
    var tt = c.duration - 1 / c.frameRate;
    function snap(fname) { var ff = new File(cdir.fsName + "/" + fname); renderFrame(c, tt, ff); return ff.fsName; }
    R.exploded = snap("exploded.png");
    var exl = [];
    for (var nm2 in out) { var L2 = layerNamed(c, nm2); if (L2 && !out[nm2].fullFrame && L2 instanceof ShapeLayer) { exl.push(L2); L2.enabled = false; } }
    for (var t2 = 0; t2 < targets.length; t2++) targets[t2].enabled = true;
    R.original = snap("original.png");
    for (var t2 = 0; t2 < targets.length; t2++) targets[t2].enabled = false;
    for (var e2 = 0; e2 < exl.length; e2++) exl[e2].enabled = true;
    c.resolutionFactor = resWas;
    R.compareDir = cdir.fsName;
}
if (DATA.outFile) { var f = new File(DATA.outFile); f.encoding = "UTF-8"; f.open("w"); f.write(toJSON(out)); f.close(); }
R.done.push(made + " element layers created" + (DATA.outFile ? ", bounds written to " + DATA.outFile : ""));
R.layers = out;
