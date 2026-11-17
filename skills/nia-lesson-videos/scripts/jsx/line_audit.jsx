// Read-only. Audit connector lines in rebuilt diagram comps: draw direction and arrowhead timing.
// DATA: { "comps": ["S09a Priority diagram (asset 07B) native"], "tipRadius": 30 }
// For each enabled open-path shape layer with keyed Trim Paths:
//   mode       fromSTART = grows from the path's first vertex (Trim End keyed), fromEND = grows from the last vertex (Trim Start 100->0)
//   start/end  first and last vertex in comp space, with the nearest small polygon/ellipse (arrowhead or end dot) and when it pops
//   verdict    "reversed"   arrowhead only at the end but the line grows from the end (it grows out of its own arrowhead)
//              "tip early"  arrowhead pops more than 0.35 s before the line arrives
//              "tip late"   arrowhead pops more than 0.35 s after the line arrives
//              "check"      no arrowhead at either end: direction cannot be inferred (decoration or a joining line)
//              "short"      under DATA.minLength px (default 40): a tick, pin or text stroke, not a connector (never flagged)
//   A line that shares its arrowhead with another (two lines converging) shows "tip early" when the other line lands first:
//   expected, not a fault.
// The fix tool is retime_scene.jsx ("lines" draw from the first vertex, "pops" move arrowheads).
R.out = [];
function findAll(g, mn, acc, d) {
    for (var i = 1; i <= g.numProperties; i++) {
        var p = g.property(i);
        if (p.matchName === mn) acc.push(p);
        if (p.propertyType !== PropertyType.PROPERTY && d < 10) findAll(p, mn, acc, d + 1);
    }
}
function fk(g, d) {
    var b = null;
    for (var i = 1; i <= g.numProperties; i++) {
        var p = g.property(i);
        if (p.propertyType === PropertyType.PROPERTY) { if (p.numKeys && (b === null || p.keyTime(1) < b)) b = p.keyTime(1); }
        else if (d < 10) { var x = fk(p, d + 1); if (x !== null && (b === null || x < b)) b = x; }
    }
    return b;
}
function xf(L, v) {   // layer space -> comp space (no rotation; scale about the anchor)
    var t = tg(L), a = t.property("ADBE Anchor Point").value, p = t.property("ADBE Position").value, s = t.property("ADBE Scale").value;
    return [p[0] + (v[0] - a[0]) * s[0] / 100, p[1] + (v[1] - a[1]) * s[1] / 100];
}
var RAD = DATA.tipRadius || 30;
for (var n = 0; n < DATA.comps.length; n++) {
    var c = compByName(DATA.comps[n]);
    if (!c) { R.warnings.push("no comp " + DATA.comps[n]); continue; }
    var tips = [];
    for (var j = 1; j <= c.numLayers; j++) {
        var L = c.layer(j);
        if (!L.enabled || !(L instanceof ShapeLayer)) continue;
        if (!/polygon|ellipse|circle/i.test(L.name)) continue;
        var r = L.sourceRectAtTime(c.duration - 0.01, false);   // measure at a settled time: popping layers are 0x0 at t=0
        var ctr = xf(L, [r.left + r.width / 2, r.top + r.height / 2]);
        if (r.width < 40 && r.height < 40) tips.push({ name: L.name.substr(0, 3), x: ctr[0], y: ctr[1], t: fk(L, 0) });
    }
    var lines = [], flagged = 0;
    for (var j2 = 1; j2 <= c.numLayers; j2++) {
        var L2 = c.layer(j2);
        if (!L2.enabled || !(L2 instanceof ShapeLayer)) continue;
        var paths = [], trims = [];
        findAll(L2.property("ADBE Root Vectors Group"), "ADBE Vector Shape", paths, 0);
        findAll(L2.property("ADBE Root Vectors Group"), "ADBE Vector Filter - Trim", trims, 0);
        if (paths.length !== 1 || !trims.length || paths[0].value.closed) continue;
        var s = trims[0].property("ADBE Vector Trim Start"), e = trims[0].property("ADBE Vector Trim End");
        var mode = "", t0 = null, t1 = null;
        if (s.numKeys >= 2 && s.keyValue(1) > s.keyValue(s.numKeys)) { mode = "fromEND"; t0 = s.keyTime(1); t1 = s.keyTime(s.numKeys); }
        else if (e.numKeys >= 2) { mode = "fromSTART"; t0 = e.keyTime(1); t1 = e.keyTime(e.numKeys); }
        else continue;
        var v = paths[0].value.vertices, A = xf(L2, v[0]), B = xf(L2, v[v.length - 1]);
        var len = 0;
        for (var vi = 1; vi < v.length; vi++) { var P0 = xf(L2, v[vi - 1]), P1 = xf(L2, v[vi]); len += Math.sqrt(Math.pow(P1[0] - P0[0], 2) + Math.pow(P1[1] - P0[1], 2)); }
        if (len < (DATA.minLength || 40)) {   // ticks, pins and outlined-text strokes are not connectors
            lines.push(L2.name.substr(0, 3) + " | short | " + mode + " " + r2(t0) + "-" + r2(t1) + " | " + Math.round(len) + " px, not a connector");
            continue;
        }
        var near = function (P) {
            var best = null, bd = 1e9;
            for (var q = 0; q < tips.length; q++) { var d = Math.sqrt(Math.pow(tips[q].x - P[0], 2) + Math.pow(tips[q].y - P[1], 2)); if (d < bd) { bd = d; best = tips[q]; } }
            if (best && bd <= RAD) return { name: best.name, t: best.t, d: Math.round(bd) };
            return null;
        };
        var ta = near(A), tb = near(B), verdict = "ok";
        var tipAtEnd = tb && !ta, tipAtStart = ta && !tb;
        if ((tipAtEnd && mode === "fromEND") || (tipAtStart && mode === "fromSTART")) verdict = "reversed";
        else if (!ta && !tb) verdict = "check";
        else {
            var tip = tipAtStart ? ta : tb;
            if (tip && tip.t !== null) {
                if (tip.t < t1 - 0.35) verdict = "tip early";
                else if (tip.t > t1 + 0.35) verdict = "tip late";
            }
        }
        if (verdict !== "ok" && verdict !== "check") flagged++;
        var fmt = function (o) { return o ? o.name + "@" + r2(o.t) + "(" + o.d + "px)" : "-"; };
        lines.push(L2.name.substr(0, 3) + " | " + verdict + " | " + mode + " " + r2(t0) + "-" + r2(t1) +
            " | start(" + Math.round(A[0]) + "," + Math.round(A[1]) + ") tip:" + fmt(ta) +
            " | end(" + Math.round(B[0]) + "," + Math.round(B[1]) + ") tip:" + fmt(tb));
    }
    R.out.push({ comp: c.name, dur: r2(c.duration), flagged: flagged, lines: lines });
}
