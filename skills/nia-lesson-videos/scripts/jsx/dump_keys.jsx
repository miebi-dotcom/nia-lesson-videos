// Read-only. For every layer of a comp: index | name | on/OFF | in point | first-last key time and which properties are keyed.
// DATA: { "compName": "S03 Data flow (asset 02) native" }   or   { "compId": 6843 }
// Use it to see when each card, arrowhead, line and label of a rebuilt diagram appears before re-timing anything.
var c = DATA.compId ? byId(DATA.compId) : compByName(DATA.compName);
if (!c) throw new Error("comp not found");
R.id = c.id; R.dur = r2(c.duration); R.layers = [];
function scan(g, acc, d) {
    for (var i = 1; i <= g.numProperties; i++) {
        var p = g.property(i);
        if (p.propertyType === PropertyType.PROPERTY) {
            if (p.numKeys > 0) acc.push([p.keyTime(1), p.keyTime(p.numKeys), p.matchName]);
        } else if (d < 8) scan(p, acc, d + 1);
    }
}
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j), acc = [];
    scan(L, acc, 0);
    var f = 1e9, l = -1, props = [];
    for (var a = 0; a < acc.length; a++) { f = Math.min(f, acc[a][0]); l = Math.max(l, acc[a][1]); props.push(acc[a][2].replace("ADBE ", "")); }
    R.layers.push(j + " | " + L.name + " | " + (L.enabled ? "on" : "OFF") + " | in " + r2(L.inPoint) + " | out " + r2(L.outPoint) +
        " | keys " + (acc.length ? r2(f) + "-" + r2(l) + " " + props.join(",") : "none") + (L.parent ? " | parent " + L.parent.index : ""));
}
