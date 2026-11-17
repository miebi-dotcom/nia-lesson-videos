// Dump transform keys of layers in a comp. DATA: {"comp": "name", "layers": [8, 7]}
var c = compByName(DATA.comp);
if (!c) throw new Error("comp not found");
for (var i = 0; i < DATA.layers.length; i++) {
    var L = c.layer(DATA.layers[i]), o = { name: L.name, inP: L.inPoint, outP: L.outPoint, dur: c.duration };
    var g = tg(L);
    var props = ["ADBE Position", "ADBE Scale", "ADBE Anchor Point"];
    for (var p = 0; p < props.length; p++) {
        var pr = g.property(props[p]); o[props[p]] = { v: pr.value, expr: pr.expression, keys: [] };
        for (var k = 1; k <= pr.numKeys; k++) o[props[p]].keys.push([pr.keyTime(k), pr.keyValue(k)]);
    }
    R.done.push(o);
}
