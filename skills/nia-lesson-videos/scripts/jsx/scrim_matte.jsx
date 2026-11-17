// Restore a soft gradient scrim that the SVG rebuild flattened into a solid rect (dark side panel over a photo, tinted panels).
// Adds a white solid "Scrim ramp matte" with Gradient Ramp (black at x0 -> white at x1) and sets it as the scrim's LUMA track matte,
// then sets the scrim's final opacity. One undo step. Generalised from CSC1101 (S07a/b, S08b, S17a/b/c).
// DATA: { "items": [ { "comp": "S07a Polling oven (asset 05B) native", "layerPrefix": "002 black rect",
//                      "x0": 900, "x1": 1500, "maxOp": 85 } ] }   (comp may be a name or an id)
// Solve x0/x1/maxOp by comparing the designer PNG with a no-scrim render: alpha(x) = 1 - lum_png / lum_photo
// (median over rows clear of overlays). Linear Wipe does NOT work on shape layers (they span the whole comp).
app.beginUndoGroup("Scrim gradient mattes");
try {
    for (var k = 0; k < DATA.items.length; k++) {
        var it = DATA.items[k], c = (typeof it.comp === "number") ? byId(it.comp) : compByName(it.comp);
        if (!c) { R.errors.push("comp not found: " + it.comp); continue; }
        var pfx = it.layerPrefix || "002 black rect", tgt = null;
        for (var i = c.numLayers; i >= 1; i--) if (c.layer(i).name === "Scrim ramp matte") c.layer(i).remove();
        for (var j = 1; j <= c.numLayers; j++) if (c.layer(j).name.indexOf(pfx) === 0) tgt = c.layer(j);
        if (!tgt) { R.errors.push("no layer starting '" + pfx + "' in " + c.name); continue; }
        var m = c.layers.addSolid([1, 1, 1], "Scrim ramp matte", c.width, c.height, 1);
        m.moveBefore(tgt);
        var rp = m.property("ADBE Effect Parade").addProperty("ADBE Ramp");
        rp.property("ADBE Ramp-0001").setValue([it.x0, c.height / 2]); rp.property("ADBE Ramp-0002").setValue([0, 0, 0, 1]);
        rp.property("ADBE Ramp-0003").setValue([it.x1, c.height / 2]); rp.property("ADBE Ramp-0004").setValue([1, 1, 1, 1]);
        tgt.setTrackMatte(m, TrackMatteType.LUMA);
        var op = tg(tgt).property("ADBE Opacity");
        if (op.numKeys > 0) op.setValueAtKey(op.numKeys, it.maxOp); else op.setValue(it.maxOp);
        R.done.push(c.name + ": ramp " + it.x0 + "->" + it.x1 + ", max opacity " + it.maxOp);
    }
} finally { app.endUndoGroup(); }
