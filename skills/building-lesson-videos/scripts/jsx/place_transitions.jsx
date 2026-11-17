// Place tutor in/out transitions on every cut between the tutor and a full-screen graphic.
// DATA: { "mainId": 4638, "tutorSourceId": 4637,
//         "inCompId": 1100,  "inCover": 0.78,     transition used when the tutor COMES ON (graphic -> tutor)
//         "outCompId": 6561, "outCover": 0.77,    transition used when the tutor GOES OFF (tutor -> graphic)
//         "overlayPattern": " OST |lower third|Blue bar",   source-name regex of layers that sit OVER the tutor
//         "tutorSourceIds": [4637, 4640]   optional: several tutor clips back to back (replaces tutorSourceId)
//         "fullscreenPattern": "S02 Record"   optional regex: scenes narrower than the frame (small artboards) that still count as full-screen
//         "ignorePattern": "" }                   optional regex of layers to ignore entirely
// Full-screen layers that touch (gap < 0.1 s) are merged into one block, so back-to-back graphics get no
// transition. Each transition is placed so its full-cover frame lands exactly on the cut.
// Existing instances of both transition comps on the main comp are removed first (safe to re-run).
var main = byId(DATA.mainId), TIN = byId(DATA.inCompId), TOUT = byId(DATA.outCompId), tutor = byId(DATA.tutorSourceId), tutors = [tutor];
if (DATA.tutorSourceIds) { tutors = []; for (var q = 0; q < DATA.tutorSourceIds.length; q++) tutors.push(byId(DATA.tutorSourceIds[q])); }
function isTutor(src) { for (var q = 0; q < tutors.length; q++) if (tutors[q] === src) return true; return false; }
if (!main || !TIN || !TOUT || !tutor) throw new Error("check mainId / inCompId / outCompId / tutorSourceId");
var over = new RegExp(DATA.overlayPattern || "$^", "i"), ign = DATA.ignorePattern ? new RegExp(DATA.ignorePattern, "i") : null;
var force = DATA.fullscreenPattern ? new RegExp(DATA.fullscreenPattern, "i") : null;   // small-artboard scenes that still fill the screen
app.beginUndoGroup("Tutor in/out transitions");
for (var j = main.numLayers; j >= 1; j--) { var L = main.layer(j); if (L.source === TIN || L.source === TOUT) L.remove(); }
var iv = [], tStart = 0, tEnd = 0;
for (var j = 1; j <= main.numLayers; j++) {
    var L = main.layer(j);
    if (!L.enabled || !L.source || L.hasVideo === false) continue;
    if (isTutor(L.source)) { if (tEnd === 0 || L.inPoint < tStart) tStart = L.inPoint; if (L.outPoint > tEnd) tEnd = L.outPoint; continue; }
    var nm = L.source.name;
    if (over.test(nm) || (ign && ign.test(nm)) || (L.source.width < main.width * 0.9 && !(force && force.test(nm)))) continue;
    iv.push([L.inPoint, L.outPoint, nm]);
}
iv.sort(function (a, b) { return a[0] - b[0]; });
var blocks = [];
for (var i = 0; i < iv.length; i++) {
    var b = blocks[blocks.length - 1];
    if (b && iv[i][0] <= b[1] + 0.1) { b[1] = Math.max(b[1], iv[i][1]); b[2].push(iv[i][2]); }
    else blocks.push([iv[i][0], iv[i][1], [iv[i][2]]]);
}
R.blocks = []; R.placed = [];
for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    R.blocks.push(r2(b[0]) + "-" + r2(b[1]) + " " + b[2].join(" + ").substr(0, 80));
    if (b[0] > tStart + 0.5 && b[0] < tEnd) {         // tutor -> graphic
        var L = main.layers.add(TOUT); L.startTime = b[0] - DATA.outCover; L.outPoint = L.startTime + TOUT.duration;
        L.name = "OUT " + b[2][0].substr(0, 24); R.placed.push("OUT @" + r2(b[0]));
    }
    if (b[1] < tEnd - 0.5 && b[1] >= tStart) {         // graphic -> tutor (includes an intro before the tutor)
        var L2 = main.layers.add(TIN); L2.startTime = b[1] - DATA.inCover; L2.outPoint = L2.startTime + TIN.duration;
        L2.name = "IN " + b[2][b[2].length - 1].substr(0, 24); R.placed.push("IN  @" + r2(b[1]));
    }
}
app.endUndoGroup();
R.done.push(R.placed.length + " transitions placed");
