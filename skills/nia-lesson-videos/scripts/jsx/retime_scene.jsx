// Re-time one rebuilt diagram comp so it follows the narration (proven on CSC1101 S09a, S12c, S14b). One undo step.
// DATA: {"compName": "...",
//        "lines": {"<prefix>": [start, dur]},   connector draws from its path's FIRST vertex (source) to the last:
//                                                Trim Start 0, Trim End 0->100, entrance ease
//        "pops":  {"<prefix>": t}}               move the layer so its first key is at t (cards, arrowheads, labels)
// Layers that ran to the comp end keep running to the comp end after a move.
app.beginUndoGroup("Retime " + DATA.compName);
try {
    var c = compByName(DATA.compName);
    if (!c) throw new Error("comp not found: " + DATA.compName);
    function byPrefix(pfx) {
        var hits = [];
        for (var j = 1; j <= c.numLayers; j++) { var n = c.layer(j).name; if (n === pfx || n.indexOf(pfx + " ") === 0) hits.push(c.layer(j)); }
        return hits;
    }
    function firstKey(g, d) {
        var best = null;
        for (var i = 1; i <= g.numProperties; i++) {
            var p = g.property(i);
            if (p.propertyType === PropertyType.PROPERTY) { if (p.numKeys > 0 && (best === null || p.keyTime(1) < best)) best = p.keyTime(1); }
            else if (d < 10) { var b = firstKey(p, d + 1); if (b !== null && (best === null || b < best)) best = b; }
        }
        return best;
    }
    function findAll(g, mn, acc, d) {
        for (var i = 1; i <= g.numProperties; i++) {
            var p = g.property(i);
            if (p.matchName === mn) acc.push(p);
            if (p.propertyType !== PropertyType.PROPERTY && d < 10) findAll(p, mn, acc, d + 1);
        }
    }
    var pops = DATA.pops || {}, lines = DATA.lines || {};
    for (var key in pops) {
        var Ls = byPrefix(key);
        if (Ls.length !== 1) { R.warnings.push("pop " + key + ": " + Ls.length + " layers"); continue; }
        var L = Ls[0], fk = firstKey(L, 0);
        if (fk === null) { R.warnings.push(key + ": no keys"); continue; }
        var toEnd = L.outPoint >= c.duration - 0.05;
        L.startTime = L.startTime + (pops[key] - fk);
        if (toEnd) L.outPoint = c.duration;
        R.done.push("pop " + key + " " + r2(fk) + "->" + r2(pops[key]));
    }
    var EIN = [new KeyframeEase(0, 10)], EOUT = [new KeyframeEase(0, 85)];
    for (var k2 in lines) {
        var Lr = byPrefix(k2);
        if (Lr.length !== 1) { R.warnings.push("line " + k2 + ": " + Lr.length + " layers"); continue; }
        var trims = []; findAll(Lr[0].property("ADBE Root Vectors Group"), "ADBE Vector Filter - Trim", trims, 0);
        if (!trims.length) { R.warnings.push(k2 + ": no trim"); continue; }
        var T = trims[0], s = T.property("ADBE Vector Trim Start"), e = T.property("ADBE Vector Trim End");
        while (s.numKeys) s.removeKey(1);
        while (e.numKeys) e.removeKey(1);
        s.setValue(0);
        var t0 = lines[k2][0], t1 = t0 + lines[k2][1];
        e.setValueAtTime(t0, 0); e.setValueAtTime(t1, 100);
        e.setTemporalEaseAtKey(1, EIN, EIN);
        e.setTemporalEaseAtKey(2, EOUT, EOUT);
        if (Lr[0].inPoint > t0) Lr[0].inPoint = t0;
        R.done.push("line " + k2 + " " + r2(t0) + "-" + r2(t1));
    }
} finally { app.endUndoGroup(); }
