// Build an on-brand transition comp when the user hasn't supplied one. The cover moment is exact by
// construction and returned as R.cover (use it as inCover/outCover in place_transitions.jsx).
// DATA: { "name": "TR panels navy-red", "style": "panels" | "iris",
//         "colors": [[0.03,0.19,0.30], [0.90,0.22,0.20], [1,1,1]],   2-4 brand colours, applied back to front
//         "direction": "left" | "right" | "up" | "down"   (panels: travel direction),
//         "skew": 14,                                     (panels: degrees; 0 = straight edges)
//         "origin": [0, 1080],                            (iris: where the circle grows from, comp px)
//         "speed": 1.0,                                   (>1 faster, <1 slower)
//         "width": 1920, "height": 1080, "fps": 25, "folder": "Transitions" }
// panels: full-frame colour panels sweep in one after another (front panel last), hold, sweep out the same
//         way in the same order - the screen is fully covered between the first arrival and the last exit.
// iris:   colour discs grow from the origin one after another, then a hole grows from the same point and
//         reveals the next shot through them.
var W = DATA.width || 1920, H = DATA.height || 1080, fps = DATA.fps || 25, sp = DATA.speed || 1;
var cols = DATA.colors && DATA.colors.length ? DATA.colors : [[0.03, 0.19, 0.30], [0.9, 0.22, 0.2]];
var style = DATA.style || "panels";
var travel = 0.45 / sp, stag = 0.07 / sp, hold = 0.12 / sp;
var n = cols.length;
var coverStart = travel, coverEnd = travel + (n - 1) * stag + hold;   // first panel in .. last panel starts out
var total = coverEnd + (n - 1) * 0 + travel + (n - 1) * stag + 0.05;
var c = app.project.items.addComp(DATA.name || ("TR " + style), W, H, 1, Math.ceil(total * fps + 2) / fps, fps);
if (DATA.folder) c.parentFolder = folderNamed(DATA.folder, true);

function rectLayer(comp, name, w, h, col, skew) {
    var L = comp.layers.addShape(); L.name = name;
    var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var v = g.property("ADBE Vectors Group");
    v.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([w, h]);
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col);
    if (skew) g.property("ADBE Vector Transform Group").property("ADBE Vector Skew").setValue(skew);
    return L;
}
function ellipseLayer(comp, name, d, col) {
    var L = comp.layers.addShape(); L.name = name;
    var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var v = g.property("ADBE Vectors Group");
    v.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([d, d]);
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col);
    return L;
}
function key(p, list, inf) { for (var i = 0; i < list.length; i++) p.setValueAtTime(list[i][0], list[i][1]); easeAll(p, inf || 75); }

app.beginUndoGroup("Make transition " + c.name);
if (style === "panels") {
    var dir = DATA.direction || "left", sk = DATA.skew === undefined ? 14 : DATA.skew;
    var horiz = (dir === "left" || dir === "right"), sgn = (dir === "left" || dir === "up") ? -1 : 1;
    var extra = sk ? Math.abs(Math.tan(sk * Math.PI / 180)) * (horiz ? H : W) + 40 : 40;   // skewed panels need to be wider
    var pw = horiz ? W + extra : W + 40, ph = horiz ? H + 40 : H + extra;
    var span = horiz ? W + pw : H + ph;
    for (var i = 0; i < n; i++) {
        var L = rectLayer(c, "panel " + (i + 1), pw, ph, cols[i], horiz ? sk : 0);
        var p = tg(L).property("ADBE Position");
        var mid = [W / 2, H / 2];
        var before = horiz ? [W / 2 - sgn * span / 2 - sgn * 0, H / 2] : [W / 2, H / 2 - sgn * span / 2];
        var after = horiz ? [W / 2 + sgn * span / 2, H / 2] : [W / 2, H / 2 + sgn * span / 2];
        // enter from the side opposite the travel direction, leave toward it
        var tIn = i * stag, tOut = coverEnd + i * stag;
        key(p, [[tIn, before], [tIn + travel, mid], [tOut, mid], [tOut + travel, after]], 80);
    }
} else if (style === "iris") {
    var o = DATA.origin || [0, H];
    var far = 0;
    var corners = [[0, 0], [W, 0], [0, H], [W, H]];
    for (var q = 0; q < 4; q++) far = Math.max(far, Math.sqrt(Math.pow(corners[q][0] - o[0], 2) + Math.pow(corners[q][1] - o[1], 2)));
    var D = far * 2 + 20;
    // the discs live in a sub-comp so one inverted matte (the hole) can reveal through all of them
    var sub = app.project.items.addComp(c.name + " discs", W, H, 1, c.duration, fps);
    sub.parentFolder = c.parentFolder;
    for (var i = 0; i < n; i++) {
        var L = ellipseLayer(sub, "disc " + (i + 1), D, cols[i]);
        tg(L).property("ADBE Position").setValue(o);
        var t0 = i * stag;
        key(tg(L).property("ADBE Scale"), [[t0, [0, 0, 100]], [t0 + travel, [100, 100, 100]]], 70);
    }
    var cover = c.layers.add(sub);
    var hole = ellipseLayer(c, "hole", D, [1, 1, 1]);
    tg(hole).property("ADBE Position").setValue(o);
    key(tg(hole).property("ADBE Scale"), [[coverEnd, [0, 0, 100]], [coverEnd + travel + (n - 1) * stag, [100, 100, 100]]], 70);
    hole.moveBefore(cover);
    cover.trackMatteType = TrackMatteType.ALPHA_INVERTED;
    coverStart = travel + (n - 1) * stag;   // every disc fully grown
    if (coverStart >= coverEnd) { coverEnd = coverStart + hold; }
}
app.endUndoGroup();
R.compId = c.id; R.name = c.name; R.duration = r2(c.duration);
R.cover = r2((coverStart + coverEnd) / 2);
R.coverWindow = [r2(coverStart), r2(coverEnd)];
R.done.push(c.name + ": " + style + ", " + n + " colours, cover at " + R.cover + "s (fully covered " + r2(coverStart) + "-" + r2(coverEnd) + ")");
