// Split a single art layer into element layers by region: each region becomes a copy of the source
// layer with a rectangular mask (exact original look: photos, icons, live text all preserved).
// Used after explode_vector.jsx + vector_patch_plan.py (patches for what shape conversion lost), or on
// its own for any one-layer artwork (regions chosen from a labelled frame).
// DATA: { "comp": "S05 Single Window", "source": "Layer 2", "remove": ["Layer 2 002 Group 2"],
//         "regions": [{"name": "patch 01", "bb": [x0, y0, x1, y1]}],
//         "layersIn": "C:/work/layers_S05.json", "layersOut": "C:/work/layers_S05.json" }
// layersIn/layersOut: the bounds file is updated (removed layers dropped, regions added as kind "pixel").
var c = compByName(DATA.comp);
if (!c) throw new Error("comp not found: " + DATA.comp);
var src = layerNamed(c, DATA.source);
if (!src) throw new Error("source layer not found: " + DATA.source);
var info = {};
if (DATA.layersIn) {
    var fi = new File(DATA.layersIn); fi.encoding = "UTF-8"; fi.open("r"); var txt = fi.read(); fi.close();
    info = eval("(" + txt + ")");   // JSON is valid JS object syntax
}
app.beginUndoGroup("Split art into regions: " + c.name);
var removed = 0;
if (DATA.remove) for (var i = 0; i < DATA.remove.length; i++) {
    var L = layerNamed(c, DATA.remove[i]);
    if (L) { L.remove(); removed++; }
    delete info[DATA.remove[i]];
}
var made = 0;
for (var r = 0; r < DATA.regions.length; r++) {
    var g = DATA.regions[r], b = g.bb;
    var D = src.duplicate();
    D.name = g.name; D.enabled = true;
    // mask vertices are in layer space: map comp -> layer (unrotated): p = anchor + (comp - position) / s
    var t3 = tg(D), a = t3.property("ADBE Anchor Point").value, p = t3.property("ADBE Position").value, s = t3.property("ADBE Scale").value;
    function L2(x, y) { return [a[0] + (x - p[0]) / (s[0] / 100), a[1] + (y - p[1]) / (s[1] / 100)]; }
    var shp = new Shape();
    shp.vertices = [L2(b[0], b[1]), L2(b[2], b[1]), L2(b[2], b[3]), L2(b[0], b[3])];
    shp.closed = true;
    var mk = D.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    mk.property("ADBE Mask Shape").setValue(shp);
    D.moveToBeginning();   // patches sit above the exploded shapes
    info[g.name] = { bb: b, kind: "pixel", index: D.index };
    made++;
}
src.enabled = false;
app.endUndoGroup();
for (var nm in info) { var LL = layerNamed(c, nm); if (LL) info[nm].index = LL.index; }
if (DATA.layersOut) { var fo = new File(DATA.layersOut); fo.encoding = "UTF-8"; fo.open("w"); fo.write(toJSON(info)); fo.close(); }
R.done.push(removed + " wrong shape layers removed, " + made + " region layers created");
