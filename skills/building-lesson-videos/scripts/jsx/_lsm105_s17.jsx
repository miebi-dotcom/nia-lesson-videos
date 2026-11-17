// S17: nine standards list over the tutor, one word per spoken beat (native shapes + text).
var main = byId(DATA.mainId);
var T0 = DATA.t, D = DATA.D, FPS = main.frameRate;
var old = compByName("S17 OST Nine standards");
if (old) {
    for (var j = main.numLayers; j >= 1; j--) if (main.layer(j).source === old) main.layer(j).remove();
    old.remove();
}
app.beginUndoGroup("S17 nine standards");
var c = app.project.items.addComp("S17 OST Nine standards", 1920, 1080, 1, D, FPS);
c.parentFolder = folderNamed("LSM105 scenes", true);
var NAVY = [0.039, 0.165, 0.278], RED = [0.9, 0.24, 0.2], WHITE = [1, 1, 1];

function ease(p, outInf, inInf) {
    var n = p.numKeys, i, e1, e2, tryArr = [[1], [1, 1], [1, 1, 1]];
    for (i = 1; i <= n; i++) {
        var oi = (i === n) ? 33 : outInf, ii = (i === 1) ? 33 : inInf;
        for (var a = 0; a < tryArr.length; a++) {
            try {
                var ins = [], outs = [];
                for (var d = 0; d < tryArr[a].length; d++) { ins.push(new KeyframeEase(0, ii)); outs.push(new KeyframeEase(0, oi)); }
                p.setTemporalEaseAtKey(i, ins, outs);
                break;
            } catch (e) { }
        }
    }
}
function anim(p, times, vals, outInf, inInf) {
    for (var i = 0; i < times.length; i++) p.setValueAtTime(times[i], vals[i]);
    ease(p, outInf || 15, inInf || 88);
}
function shape(name, kind, size, col, rnd) {
    var L = c.layers.addShape(); L.name = name;
    var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var v = g.property("ADBE Vectors Group");
    if (kind === "rect") {
        var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue(size);
        if (rnd) r.property("ADBE Vector Rect Roundness").setValue(rnd);
    } else if (kind === "tri") {
        var s = v.addProperty("ADBE Vector Shape - Star"); s.property("ADBE Vector Star Type").setValue(2);
        s.property("ADBE Vector Star Points").setValue(3); s.property("ADBE Vector Star Outer Radius").setValue(size);
        s.property("ADBE Vector Star Rotation").setValue(90);
    }
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col);
    return L;
}
function txt(name, str, font, size, col) {
    var L = c.layers.addText(str); L.name = name;
    var p = L.property("ADBE Text Properties").property("ADBE Text Document"), td = p.value;
    td.resetCharStyle(); td.font = font; td.fontSize = size; td.fillColor = col; td.applyFill = true; td.applyStroke = false;
    td.justification = ParagraphJustification.LEFT_JUSTIFY;
    p.setValue(td);
    return L;
}
var PX = 70, PW = 600, PY = 130, PH = 800, CX = PX + PW / 2, CY = PY + PH / 2;
var tin = DATA.panelIn - T0, tout = D - 0.55;
// panel
var panel = shape("panel", "rect", [PW, PH], NAVY, 28);
panel.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);
panel.property("ADBE Transform Group").property("ADBE Opacity").setValue(96);
var pp = panel.property("ADBE Transform Group").property("ADBE Position");
anim(pp, [tin, tin + 0.6, tout, tout + 0.5], [[CX - 760, CY], [CX, CY], [CX, CY], [CX - 760, CY]], 15, 88);
var bar = shape("accent bar", "rect", [10, PH - 60], RED, 5);
bar.property("ADBE Transform Group").property("ADBE Position").setValue([PX + 22, CY]);
// heading
var head = txt("heading", "Effective thinking must be:", "Manrope-ExtraBold", 40, WHITE);
head.property("ADBE Transform Group").property("ADBE Position").setValue([PX + 60, PY + 82]);
var ho = head.property("ADBE Transform Group").property("ADBE Opacity");
anim(ho, [tin + 0.5, tin + 0.9], [0, 100]);
// items
var words = DATA.words, rowH = 66, y0 = PY + 170;
for (var i = 0; i < words.length; i++) {
    var ty = words[i][1] - T0 - 0.12, y = y0 + rowH * i;
    var tri = shape("arrow " + words[i][0], "tri", 15, RED, 0);
    tri.property("ADBE Transform Group").property("ADBE Position").setValue([PX + 68, y]);
    var t = txt("word " + words[i][0], words[i][0], "Manrope-Bold", 42, WHITE);
    var tp = t.property("ADBE Transform Group").property("ADBE Position");
    tp.setValue([PX + 108, y + 14]);
    var to = t.property("ADBE Transform Group").property("ADBE Opacity"), ao = tri.property("ADBE Transform Group").property("ADBE Opacity");
    var nxt = (i + 1 < words.length) ? words[i + 1][1] - T0 - 0.12 : null;
    if (nxt !== null) { anim(to, [ty, ty + 0.35, nxt, nxt + 0.4], [0, 100, 100, 62]); anim(ao, [ty, ty + 0.35, nxt, nxt + 0.4], [0, 100, 100, 62]); }
    else { anim(to, [ty, ty + 0.35], [0, 100]); anim(ao, [ty, ty + 0.35], [0, 100]); }
    // slide in from the left: relative to the parent's position
    anim(t.property("ADBE Transform Group").property("ADBE Position"), [ty, ty + 0.45], [[PX + 108 - 46, y + 14], [PX + 108, y + 14]]);
    anim(tri.property("ADBE Transform Group").property("ADBE Scale"), [ty, ty + 0.2, ty + 0.4], [[0, 0], [130, 130], [100, 100]], 15, 80);
}
for (var q = 1; q <= c.numLayers; q++) {
    var QL = c.layer(q);
    if (QL.name === "panel") continue;
    var op = QL.property("ADBE Transform Group").property("ADBE Opacity");
    var vq = op.valueAtTime(tout, false);
    op.setValueAtTime(tout, vq); op.setValueAtTime(tout + 0.3, 0);
}
var lay = main.layers.add(c);
lay.startTime = T0; lay.inPoint = T0; lay.outPoint = T0 + D;
lay.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540]);
lay.motionBlur = true; c.motionBlur = true;
app.endUndoGroup();
R.done = ["S17 built on main at " + T0 + " +" + D];
