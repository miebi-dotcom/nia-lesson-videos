var main = byId(DATA.mainId), L = null;
for (var j = 1; j <= main.numLayers; j++) if (main.layer(j).source && main.layer(j).source.id === 2) L = main.layer(j);
var p = L.property("ADBE Transform Group").property("ADBE Position"), v = p.value, dx = DATA.dx;
var t0 = DATA.t0, t1 = DATA.t1, a = [v[0], v[1]], b = [v[0] + dx, v[1]];
p.setValueAtTime(t0, a); p.setValueAtTime(t0 + 1.4, b); p.setValueAtTime(t1 - 1.6, b); p.setValueAtTime(t1, a);
for (var k = 1; k <= 4; k++) {
    var oi = (k === 1 || k === 3) ? 12 : 33, ii = (k === 2 || k === 4) ? 88 : 33;
    try { p.setTemporalEaseAtKey(k, [new KeyframeEase(0, ii)], [new KeyframeEase(0, oi)]); } catch (e) {
        try { p.setTemporalEaseAtKey(k, [new KeyframeEase(0, ii), new KeyframeEase(0, ii)], [new KeyframeEase(0, oi), new KeyframeEase(0, oi)]); } catch (e2) {}
    }
}
L.motionBlur = true; main.motionBlur = true;
R.done = ["tutor b shifted " + dx + " px from " + a + " (keys " + p.numKeys + ")"];
