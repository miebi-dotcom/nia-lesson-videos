// Key the green screen on the enabled tutor layers of the video comp (Keylight). DATA: {compId, layers:[idx...] or "enabled", color:[r,g,b]}
var c = byId(DATA.compId);
app.beginUndoGroup("Key tutor (Keylight)");
var n = 0, probe = null;
for (var j = 1; j <= c.numLayers; j++) {
    var L = c.layer(j);
    if (!L.enabled || !L.source || !L.hasVideo) continue;
    if (L.source.name.indexOf("A018") !== 0) continue;
    if (DATA.only && j !== DATA.only) continue;
    var fx = L.property("ADBE Effect Parade");
    var ex = fx.property("Keylight (1.2)");
    if (ex) ex.remove();
    var k = fx.addProperty("Keylight 906");
    k.name = "Keylight (1.2)";
    if (!probe) { probe = []; for (var p = 1; p <= k.numProperties; p++) probe.push(p + ":" + k.property(p).name + "/" + k.property(p).matchName); }
    try { k.property("Screen Colour").setValue(DATA.color); } catch (e) { R.warnings.push("screen colour: " + e); }
    try { k.property("Screen Gain").setValue(DATA.gain); } catch (e) { R.warnings.push("gain: " + e); }
    try { k.property("Screen Balance").setValue(DATA.balance); } catch (e) {}
    try { k.property("Clip Black").setValue(DATA.clipBlack); k.property("Clip White").setValue(DATA.clipWhite); } catch (e) { R.warnings.push("clip: " + e); }
    n++;
}
R.done.push("keyed layers: " + n); R.probe = probe;
app.endUndoGroup();
