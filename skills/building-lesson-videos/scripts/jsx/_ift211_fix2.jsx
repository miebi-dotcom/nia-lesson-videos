var main = byId(DATA.mainId);
app.beginUndoGroup("S03 rebuild: bar over green code clip");
function layerByName(c, nm) { for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name === nm) return c.layer(j); return null; }
var old = layerByName(main, DATA.oldLayer);
if (old) { var oc = old.source; old.remove(); if (oc) oc.remove(); R.done.push("removed old S03 scene"); }
var ex = layerByName(main, "S03 BG green code"); if (ex) ex.remove();
var item = importOnce(DATA.clip, false, folderNamed(DATA.assetsFolder, true));
var bar = layerByName(main, DATA.barLayer);
var L = main.layers.add(item);
L.name = "S03 BG green code";
var s = Math.max(main.width / item.width, main.height / item.height) * 100;
tg(L).property("ADBE Scale").setValue([s, s, 100]);
L.startTime = DATA.t; L.inPoint = DATA.t; L.outPoint = DATA.t + DATA.D;
tg(L).property("ADBE Scale").expression = "var p=linear(time,inPoint,outPoint,0,1); value*(1+0.05*p)";
var op = tg(L).property("ADBE Opacity");
op.setValueAtTime(DATA.t, 0); op.setValueAtTime(DATA.t + 0.6, 100); op.setValueAtTime(DATA.t + DATA.D - 0.6, 100); op.setValueAtTime(DATA.t + DATA.D, 0);
if (bar) L.moveAfter(bar);
R.done.push("green clip " + item.width + "x" + item.height + " dur " + item.duration);
app.endUndoGroup();
