// Add live text captions inside a scene comp, each rising + fading in at its own time (comp seconds).
// DATA: { "comp": "S22 Side by side (asset 15)", "font": "Manrope-Bold", "size": 54, "color": [1,1,1],
//         "captions": [ {"text": "Dutch Republic", "x": 500, "y": 880, "at": 2.2} ] }
var c = compByName(DATA.comp);
if (!c) throw new Error("comp not found: " + DATA.comp);
app.beginUndoGroup("Captions " + DATA.comp);
for (var rj = c.numLayers; rj >= 1; rj--) if (c.layer(rj).name.indexOf("caption ") === 0) c.layer(rj).remove();
function textEntrance(L, t0, dy) {
    var txt = String(L.property("Source Text").value.text), based = txt.length <= 12 ? "characters" : "words";
    var units = based === "characters" ? txt.length : txt.replace(/^\s+|\s+$/g, "").split(/\s+/).length;
    var dur = Math.min(0.6, Math.max(0.4, 0.3 + 0.03 * units));
    var anim = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    anim.name = "anim text";
    var props = anim.property("ADBE Text Animator Properties");
    props.addProperty("ADBE Text Position 3D").setValue([0, dy, 0]);
    props.addProperty("ADBE Text Opacity").setValue(0);
    var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var adv = sel.property("ADBE Text Range Advanced");
    adv.property("ADBE Text Range Type2").setValue(based === "characters" ? 1 : 3);
    adv.property("ADBE Text Range Shape").setValue(2);
    adv.property("ADBE Text Levels Max Ease").setValue(50);
    adv.property("ADBE Text Levels Min Ease").setValue(50);
    var off = sel.property("ADBE Text Percent Offset");
    off.setValueAtTime(snapT(c, t0), -100);
    off.setValueAtTime(snapT(c, t0 + dur), 100);
    signatureEase(off, "in");
}
for (var i = 0; i < DATA.captions.length; i++) {
    var cp = DATA.captions[i];
    var L = c.layers.addText("x");
    var st = L.property("Source Text"), td = st.value;
    td.fontSize = DATA.size || 54; td.fillColor = DATA.color || [1, 1, 1]; td.applyFill = true;
    td.justification = ParagraphJustification.CENTER_JUSTIFY;
    try { td.font = DATA.font || "Manrope-Bold"; } catch (e) { R.warnings.push("font not set"); }
    td.text = cp.text; st.setValue(td);
    L.name = "caption " + cp.text;
    var at = snapT(c, cp.at), d = 0.5;
    tg(L).property("ADBE Position").setValue([cp.x, cp.y]);
    textEntrance(L, at, 24);
    L.inPoint = at - 0.04; L.outPoint = c.duration;
    L.motionBlur = true;
}
c.motionBlur = true;
app.endUndoGroup();
R.done.push("captions added: " + DATA.captions.length);
