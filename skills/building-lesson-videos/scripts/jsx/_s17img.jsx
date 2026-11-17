app.beginUndoGroup("s17img");
var main = app.project.itemByID(4638), fi = null;
for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof FootageItem && it.name == "12c Primary health care.jpg") { fi = it; break; } }
if (!fi) throw new Error("footage not found");
var S17 = null; for (var j = 1; j <= main.numLayers; j++) if (main.layer(j).name == "S17 Primary-level services") S17 = main.layer(j);
var L = main.layers.add(fi); L.name = "S17 image Primary health centre";
var W = 800, H = 520, cx = 1380, cy = 745;
var sc = Math.max(W / fi.width, H / fi.height) * 100;
var t = L.property("ADBE Transform Group");
t.property("ADBE Scale").setValue([sc, sc, 100]);
t.property("ADBE Position").setValue([cx, cy, 0]);
// rounded mask in layer space around the centre of the source
var k = sc / 100, hw = W / 2 / k, hh = H / 2 / k, r = 26 / k, c0 = 0.5523 * r, ax = fi.width / 2, ay = fi.height / 2;
var x0 = ax - hw, x1 = ax + hw, y0 = ay - hh, y1 = ay + hh;
var sh = new Shape();
sh.vertices = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
sh.inTangents = [[-c0, 0], [0, 0], [0, -c0], [0, 0], [c0, 0], [0, 0], [0, c0], [0, 0]];
sh.outTangents = [[0, 0], [c0, 0], [0, 0], [0, c0], [0, 0], [-c0, 0], [0, 0], [0, -c0]];
sh.closed = true;
var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.property("ADBE Mask Shape").setValue(sh);
var st = 186.8, en = S17.outPoint;
L.startTime = 0; L.inPoint = st; L.outPoint = en;
var pos = t.property("ADBE Position"), op = t.property("ADBE Opacity"), scp = t.property("ADBE Scale");
pos.setValueAtTime(st, [cx + 60, cy, 0]); pos.setValueAtTime(st + 0.7, [cx, cy, 0]);
op.setValueAtTime(st, 0); op.setValueAtTime(st + 0.5, 100);
scp.setValueAtTime(st + 0.7, [sc, sc, 100]); scp.setValueAtTime(en - 0.5, [sc * 1.07, sc * 1.07, 100]);
for (var q = 1; q <= 2; q++) { pos.setTemporalEaseAtKey(q, [new KeyframeEase(0, 70)], [new KeyframeEase(0, 70)]); }
L.motionBlur = true;
L.moveBefore(S17);
R.done.push("img " + fi.width + "x" + fi.height + " scale " + sc.toFixed(1) + " idx " + L.index);
app.endUndoGroup();
