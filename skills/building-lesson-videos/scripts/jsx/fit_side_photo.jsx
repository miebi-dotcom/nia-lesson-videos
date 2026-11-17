// Side-panel presets crop the photo to the preset's old slot (zoomed ~120%). Make the photo cover the full frame instead:
// scale to cover 1920x1080 and re-centre the position keys so the LAST key (panel gone) is the frame centre.
// DATA: { "fix": [ {"comp": "S14 Side bullets 10a", "layer": 8} ] }
app.beginUndoGroup("Fit side photos");
for (var i = 0; i < DATA.fix.length; i++) {
    var c = compByName(DATA.fix[i].comp);
    if (!c) { R.warnings.push("comp not found: " + DATA.fix[i].comp); continue; }
    var L = c.layer(DATA.fix[i].layer), g = tg(L);
    var w = L.source.width, h = L.source.height, s = Math.max(1920 / w, 1080 / h) * 100;
    g.property("ADBE Scale").setValue([s, s, 100]);
    var pp = g.property("ADBE Position"), n = pp.numKeys;
    if (n >= 2) {
        var finalX = pp.keyValue(n)[0], dx = 960 - finalX;
        for (var k = 1; k <= n; k++) { var v = pp.keyValue(k); pp.setValueAtKey(k, [v[0] + dx, 540, 0]); }
    } else pp.setValue([960, 540, 0]);
    R.done.push(c.name + ": " + L.name + " scale " + Math.round(s * 10) / 10);
}
app.endUndoGroup();
