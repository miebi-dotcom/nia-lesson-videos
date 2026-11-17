// Arrange the main comp the way human animators lay out a lesson, so anyone can pick the project up:
// every scene's layers sit together (its transitions, text/overlays, pictures, background), scenes are
// stacked as a staircase (latest scene at the top, earliest just above the tutor), long base layers (tutor
// footage, full-length backgrounds) stay at the bottom, and layers get a label colour per role.
// Safe to re-run after every build step. One undo step. Nothing is deleted or retimed.
// DATA: { "mainId": 507,
//         "dryRun": false,                         true = report the new order without moving anything
//         "rename": true,                          transitions renamed "<scene> TR tutor>graphic" / "graphic>tutor"
//         "labels": {"transition": 11, "text": 2, "graphic": 8, "background": 12, "tutor": 9, "base": 12, "cover": 10},
//         "textPattern": "...", "backgroundPattern": "...", "transitionPattern": "..."   regex overrides }
// Scene of a layer: the "S12" / "S07a" prefix of its name (also after "IN "/"OUT "), else the last scene
// marker ("S12 ..." comment) at or before the layer's key moment (transitions: their full-cover middle).
// Order inside a scene, top to bottom: transitions, text/overlays, pictures/graphics, backgrounds; later
// layers above earlier ones, but layers of the same role that overlap in time keep their current order.
var main = byId(DATA.mainId);
if (!main) throw new Error("mainId not found");
var LAB = { transition: 11, text: 2, graphic: 8, background: 12, tutor: 9, base: 12, cover: 10 };
if (DATA.labels) for (var k in DATA.labels) LAB[k] = DATA.labels[k];
// (no ^ inside alternations and no chained ?: below: ExtendScript mis-evaluates both, see gotchas)
var reTr = new RegExp(DATA.transitionPattern || "\\bTR\\b|transition|wipe", "i");
var reTxt = new RegExp(DATA.textPattern || "\\b(text|OST|title|bullets?|terms?|tag|lower third|bar|heading|highlight|HL|caption|label|chip|pill|quote|definition)\\b", "i");
var reBg = new RegExp(DATA.backgroundPattern || "background|\\bbg\\b|\\bsolid\\b", "i");
var rePic = /\(asset|native\b|placeholder|image|photo/i;   // designed pictures/diagrams, even if named "... tags"
var D = main.duration;

// scene markers
var marks = [];
var mk = main.markerProperty;
for (var i = 1; i <= mk.numKeys; i++) {
    var m = /^\s*(S\d+)/.exec(mk.keyValue(i).comment);
    if (m) marks.push([mk.keyTime(i), m[1]]);
}
function sceneAt(t) { var s = null; for (var i = 0; i < marks.length; i++) if (marks[i][0] <= t + 0.05) s = marks[i][1]; return s; }
function num(s) { return parseInt(s.replace(/\D/g, ""), 10); }

var rows = [], base = [];
for (var i = 1; i <= main.numLayers; i++) {
    var L = main.layer(i), nm = L.name, src = L.source ? L.source.name : "";
    var r = { L: L, idx: i, inP: L.inPoint, outP: L.outPoint, name: nm };
    var span = L.outPoint - L.inPoint;
    var isFoot = L.source && !(L.source instanceof CompItem) && L.hasAudio;
    if (span >= 0.8 * D || (isFoot && span >= 0.5 * D)) {         // tutor footage, full-length backgrounds
        r.role = (isFoot && L.hasVideo) ? "tutor" : "base"; base.push(r); continue;
    }
    var isIn = nm.indexOf("IN ") === 0, isOut = nm.indexOf("OUT ") === 0;
    var tr = isIn || isOut || reTr.test(nm) || reTr.test(src);
    if (tr) r.role = "transition";
    else if (reBg.test(nm) || reBg.test(src)) r.role = "background";
    else if (rePic.test(nm)) r.role = "graphic";
    else if (reTxt.test(nm) || reTxt.test(src)) r.role = "text";
    else r.role = "graphic";
    var m = /^(?:IN |OUT )?(S\d+)/.exec(nm);
    var key = tr ? (L.inPoint + L.outPoint) / 2 : L.inPoint;
    r.scene = m ? m[1] : sceneAt(key);
    if (!r.scene) { r.scene = "S00"; if (r.role === "graphic") r.role = "cover"; }
    r.dir = "";
    if (isIn) r.dir = "graphic>tutor";
    if (isOut) r.dir = "tutor>graphic";
    rows.push(r);
}

// group by scene, scenes ordered by their first moment
var groups = {}, order = [];
for (var i = 0; i < rows.length; i++) {
    var g = groups[rows[i].scene];
    if (!g) { g = groups[rows[i].scene] = { id: rows[i].scene, start: 1e9, rows: [] }; order.push(g); }
    g.rows.push(rows[i]);
    if (rows[i].role !== "transition") g.start = Math.min(g.start, rows[i].inP);
}
for (var i = 0; i < order.length; i++) if (order[i].start === 1e9) order[i].start = order[i].rows[0].inP;
order.sort(function (a, b) { return a.start !== b.start ? b.start - a.start : num(b.id) - num(a.id); });   // latest scene on top

var RANK = { transition: 0, text: 1, graphic: 2, cover: 2, background: 3 };
function overlap(a, b) { return a.inP < b.outP - 0.01 && b.inP < a.outP - 0.01; }
function before(a, b) {   // true when a should sit above b
    if (RANK[a.role] !== RANK[b.role]) return RANK[a.role] < RANK[b.role];
    if (overlap(a, b)) return a.idx < b.idx;       // same role, on screen together: keep the current stacking
    return a.inP > b.inP;                          // otherwise later above earlier (staircase)
}
var stack = [];
for (var gi = 0; gi < order.length; gi++) {
    var rs = order[gi].rows.slice(0);
    for (var a = 1; a < rs.length; a++) {        // insertion sort (comparator is not a strict total order)
        var x = rs[a], b = a - 1;
        while (b >= 0 && before(x, rs[b])) { rs[b + 1] = rs[b]; b--; }
        rs[b + 1] = x;
    }
    stack = stack.concat(rs);
}
base.sort(function (a, b) { return a.idx - b.idx; });
stack = stack.concat(base);

// a transition must cover everything on screen during its wipe: if a layer of a later scene overlaps it
// (an overlay that starts as the wipe ends), lift the transition just above the highest such layer
var lifted = [];
for (var a = 0; a < stack.length; a++) {
    var T = stack[a];
    if (T.role !== "transition") continue;
    var top = -1;
    for (var b = 0; b < a; b++) if (stack[b].role !== "transition" && stack[b].L.enabled && overlap(T, stack[b])) { top = b; break; }
    if (top >= 0) { stack.splice(a, 1); stack.splice(top, 0, T); lifted.push(T.name.substr(0, 30) + " above " + stack[top + 1].name.substr(0, 30)); }
}

// compositing check: pairs that overlap in time, both visible, and swap stacking order
var flips = [];
for (var a = 0; a < stack.length; a++) for (var b = a + 1; b < stack.length; b++) {
    var A = stack[a], B = stack[b];
    if (A.idx > B.idx && overlap(A, B) && A.L.enabled && B.L.enabled && A.role !== "transition" && B.role !== "transition")
        flips.push(A.name.substr(0, 28) + " now ABOVE " + B.name.substr(0, 28) + " (" + Math.round(Math.max(A.inP, B.inP) * 100) / 100 + "-" + Math.round(Math.min(A.outP, B.outP) * 100) / 100 + "s)");
}
// transitions must cover everything on screen at their moment
var hidden = [];
for (var a = 0; a < stack.length; a++) {
    if (stack[a].role !== "transition") continue;
    for (var b = 0; b < a; b++) {
        var X = stack[b];
        if (X.role !== "transition" && X.L.enabled && overlap(stack[a], X) && X.L.source && X.L.source.width >= main.width * 0.9)
            hidden.push(stack[a].name.substr(0, 30) + " is under " + X.name.substr(0, 30));
    }
}

R.order = [];
for (var i = 0; i < stack.length; i++) R.order.push((stack[i].scene || "base") + " | " + stack[i].role + " | " + stack[i].name.substr(0, 40));
R.flips = flips; R.transitionsHidden = hidden; R.transitionsLifted = lifted;
if (!DATA.dryRun) {
    app.beginUndoGroup("Organize timeline by scene");
    for (var i = stack.length - 1; i >= 0; i--) {
        var r = stack[i], L = r.L, lk = L.locked;
        if (lk) L.locked = false;
        L.moveToBeginning();
        if (LAB[r.role] !== undefined) L.label = LAB[r.role];
        if (DATA.rename !== false && r.role === "transition" && r.dir) L.name = r.scene + " TR " + r.dir;
        if (lk) L.locked = true;
    }
    app.endUndoGroup();
    R.done.push(main.name + ": " + rows.length + " layers grouped into " + order.length + " scenes (latest on top), " + base.length + " base layers kept at the bottom");
} else R.done.push("dry run: nothing moved");
if (flips.length) R.warnings.push(flips.length + " overlapping pairs changed stacking order: check those moments in QC (see flips)");
if (hidden.length) R.warnings.push("transitions not on top of everything at their moment: " + hidden.join("; "));
