// Asset-to-asset whip transition (used between consecutive full-screen b-roll stills / diagram scenes; NOT for tutor cuts).
// One adjustment layer per cut: Motion Tile (mirror edges) slides Tile Center +/-shift, flipping sign on the cut frame,
// plus a horizontal Fast Box Blur (Repeat Edge Pixels) peaking at the cut. Directional Blur is not used: it leaves transparent edges.
// Proven on CSC1101 (26 cuts). Generalised 2026-11-17: the "full-screen text scene" exception is now DATA.belowOverlaysPattern.
// DATA: { "mainId": 6825, "tutorSourceId": 6824, "trId": 12948,      tutor footage id; tutor transition comp id (both skipped)
//         "overlayPattern": " OST |lower third|logo",             layers that are overlays, never whip-cut points
//         "belowOverlaysPattern": "Objectives",                    optional: full-screen text scenes to keep below the overlays
//         "half": 6, "shift": 640, "blur": 90, "dryRun": true }    frames either side of the cut, px, px; dryRun lists the cuts only
var main = byId(DATA.mainId), fps = Math.round(1 / main.frameDuration), HALF = DATA.half || 6, SHIFT = DATA.shift || 640, BLUR = DATA.blur || 90;
var over = new RegExp(DATA.overlayPattern, "i");
function fr(t) { return Math.round(t * fps); }
// 1) find full-screen scene intervals
var iv = [];
for (var j = 1; j <= main.numLayers; j++) { var L = main.layer(j);
  if (!L.enabled || !L.source || L.hasVideo === false) continue;
  if (L.source.id === DATA.tutorSourceId || L.source.id === DATA.trId) continue;
  var nm = L.source.name; if (over.test(nm) || L.source.width < main.width * 0.9) continue;
  if (L.name.indexOf("FX whip") === 0) continue;
  iv.push([L.inPoint, L.outPoint, nm]); }
iv.sort(function (a, b) { return a[0] - b[0]; });
var cuts = [];
for (var i = 1; i < iv.length; i++) if (iv[i][0] <= iv[i - 1][1] + 0.1) cuts.push(iv[i][0]);
R.cuts = cuts; R.count = cuts.length;
if (!DATA.dryRun) {
  app.beginUndoGroup("FX whip transitions");
  for (var j2 = main.numLayers; j2 >= 1; j2--) if (main.layer(j2).name.indexOf("FX whip") === 0) main.layer(j2).remove();
  // keep every overlay (OST bars, lower thirds) above the FX layers: scenes that are full-screen go below the lowest overlay
  var lowestOver = null; for (var q = 1; q <= main.numLayers; q++) { var Lq = main.layer(q); if (Lq.source && / OST /.test(Lq.source.name)) lowestOver = Lq; }
  if (DATA.belowOverlaysPattern && lowestOver) { var reBelow = new RegExp(DATA.belowOverlaysPattern, "i");
    for (var q2 = main.numLayers; q2 >= 1; q2--) { var Ls = main.layer(q2); if (Ls.source && reBelow.test(Ls.source.name) && Ls.index < lowestOver.index) Ls.moveAfter(lowestOver); } }
  for (var k = 0; k < cuts.length; k++) {
    var f0 = fr(cuts[k]), t = f0 / fps, h = HALF / fps, one = 1 / fps;
    var A = main.layers.addSolid([1, 1, 1], "FX whip @" + t.toFixed(2), main.width, main.height, 1); A.adjustmentLayer = true;
    A.startTime = t - h; A.inPoint = t - h; A.outPoint = t + h;
    if (lowestOver) A.moveAfter(lowestOver);
    var fx = A.property("ADBE Effect Parade");
    var mt = fx.addProperty("ADBE Tile"); mt.name = "Whip slide";
    mt.property("Tile Width").setValue(100); mt.property("Tile Height").setValue(100);
    mt.property("Output Width").setValue(100); mt.property("Output Height").setValue(100);
    mt.property("Mirror Edges").setValue(1);
    var tc = mt.property("Tile Center"), cx = main.width / 2, cy = main.height / 2;
    var kt = [t - h, t - one, t, t + h], kv = [cx, cx + SHIFT, cx - SHIFT, cx];
    for (var a = 0; a < 4; a++) tc.setValueAtTime(kt[a], [kv[a], cy]);
    var bl = fx.addProperty("ADBE Box Blur2"); bl.name = "Whip blur";
    bl.property("Blur Dimensions").setValue(2); bl.property("Iterations").setValue(3); bl.property("Repeat Edge Pixels").setValue(1);
    var br = bl.property("Blur Radius"), bv = [0, BLUR, BLUR, 0];
    for (var b = 0; b < 4; b++) br.setValueAtTime(kt[b], bv[b]);
    var props = [tc, br];
    for (var p = 0; p < 2; p++) { var pr = props[p], dims = (p === 0 ? 2 : 1);
      var E = function (inf) { var arr = []; for (var d = 0; d < dims; d++) arr.push(new KeyframeEase(0, inf)); return arr; };
      try {
        pr.setTemporalEaseAtKey(1, E(85), E(85)); pr.setTemporalEaseAtKey(2, E(10), E(10));
        pr.setTemporalEaseAtKey(3, E(10), E(10)); pr.setTemporalEaseAtKey(4, E(85), E(85));
      } catch (e) { R.warnings.push("ease " + e.toString()); } }
    A.label = 9;
  }
  app.endUndoGroup();
}
