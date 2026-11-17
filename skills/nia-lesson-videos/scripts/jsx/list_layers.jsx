// Read-only. List the layers of one or more comps.
// DATA: { "ids": [6825] }   or   { "names": ["CSC1101_Y1_01_02 MAIN"] }
// Per layer: index | name | source (comp/footage id + name, or text + font + size) | in-out | OFF | parent.
// Use it before any timeline change: never move or edit layers the user placed (their intro, their samples).
R.comps = [];
var list = [];
if (DATA.ids) for (var a = 0; a < DATA.ids.length; a++) list.push(byId(DATA.ids[a]));
if (DATA.names) for (var b = 0; b < DATA.names.length; b++) list.push(compByName(DATA.names[b]));
for (var n = 0; n < list.length; n++) {
    var c = list[n];
    if (!c) { R.warnings.push("comp " + n + " not found"); continue; }
    var o = { id: c.id, name: c.name, dur: r2(c.duration), fps: r2(c.frameRate), w: c.width, h: c.height, layers: [] };
    for (var j = 1; j <= c.numLayers; j++) {
        var L = c.layer(j), src = "";
        if (L.source) {
            src = (L.source instanceof CompItem ? "comp " : "src ") + L.source.id + " " + L.source.name;
        } else if (L instanceof TextLayer) {
            var td = L.property("Source Text").value;
            src = "text '" + String(td.text).substr(0, 60).replace(/[\r\n]+/g, " / ") + "' font " + td.font + " " + Math.round(td.fontSize);
        } else {
            src = L.matchName;
        }
        o.layers.push(j + " | " + L.name + " | " + src + " | " + r2(L.inPoint) + "-" + r2(L.outPoint) + (L.enabled ? "" : " | OFF") + (L.parent ? " | parent " + L.parent.index : ""));
    }
    R.comps.push(o);
}
