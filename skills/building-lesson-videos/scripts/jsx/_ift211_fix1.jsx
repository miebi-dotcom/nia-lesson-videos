// Fix pass: tutor shifts for side-panel scenes, photo-scene backgrounds, S10 code reveal.
var main = byId(DATA.mainId);
app.beginUndoGroup("Build fix pass 1");
function layerByName(c, nm) { for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name === nm) return c.layer(j); return null; }
// remove earlier backgrounds
for (var j = main.numLayers; j >= 1; j--) if (main.layer(j).name.indexOf(" BG ") > 0) main.layer(j).remove();
var bgComp = byId(DATA.bgId);
var photos = DATA.photos;
for (var i = 0; i < photos.length; i++) {
    var sl = layerByName(main, photos[i]);
    if (!sl) { R.warnings.push("scene layer not found: " + photos[i]); continue; }
    var bg = main.layers.add(bgComp);
    bg.name = photos[i].split(" ")[0] + " BG blue";
    bg.startTime = sl.inPoint; bg.inPoint = sl.inPoint; bg.outPoint = sl.outPoint;
    bg.moveAfter(sl);
    R.done.push("bg under " + photos[i]);
}
// tutor shift
var tut = layerByName(main, "video");
var pos = tg(tut).property("ADBE Position");
while (pos.numKeys > 0) pos.removeKey(1);
var base = pos.value;
for (var k = 0; k < DATA.shifts.length; k++) {
    var a = DATA.shifts[k][0], b = DATA.shifts[k][1], dx = DATA.dx;
    pos.setValueAtTime(a - 0.6, [base[0], base[1]]);
    pos.setValueAtTime(a + 0.5, [base[0] + dx, base[1]]);
    pos.setValueAtTime(b - 0.5, [base[0] + dx, base[1]]);
    pos.setValueAtTime(b + 0.6, [base[0], base[1]]);
}
for (var q = 1; q <= pos.numKeys; q++) {
    var e = new KeyframeEase(0, 75);
    pos.setTemporalEaseAtKey(q, [e], [e]);
}
R.done.push("tutor shifts: " + DATA.shifts.length);
// S10 code reveal
var s10 = compByName("S10 Code diagram (ai)");
if (s10) {
    for (var n = 1; n <= s10.numLayers; n++) {
        var L = s10.layer(n);
        if (L.effect("Linear Wipe") ) continue;
        var sc = tg(L).property("ADBE Scale"); sc.setValue([DATA.s10scale, DATA.s10scale, 100]);
        var fx = L.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
        fx.property("ADBE Linear Wipe-0001").setValueAtTime(0, 100);
        fx.property("ADBE Linear Wipe-0001").setValueAtTime(DATA.s10reveal, 0);
        fx.property("ADBE Linear Wipe-0002").setValue(180);
        fx.property("ADBE Linear Wipe-0003").setValue(60);
    }
    R.done.push("S10 wipe + scale");
}
app.endUndoGroup();
