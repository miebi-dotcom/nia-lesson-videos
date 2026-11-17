// DATA: {items:[{comp,layer,orig,text,bboxW,just:"left"|"center",hide:true}]}
app.beginUndoGroup("raster2text");
function easeKeys(p) {
  for (var k = 1; k <= p.numKeys; k++) {
    try {
      var d = (p.propertyValueType == PropertyValueType.ThreeD_SPATIAL || p.propertyValueType == PropertyValueType.TwoD_SPATIAL) ? 1 : 1;
      p.setTemporalEaseAtKey(k, [new KeyframeEase(0, 40)], [new KeyframeEase(0, 40)]);
    } catch (e) {}
  }
}
for (var n = 0; n < DATA.items.length; n++) {
  var it = DATA.items[n], c = app.project.itemByID(it.comp), L = c.layer(it.layer);
  var ap = L.property("ADBE Transform Group").property("ADBE Anchor Point").value;
  var pos = L.property("ADBE Transform Group").property("ADBE Position");
  var op = L.property("ADBE Transform Group").property("ADBE Opacity");
  var T = c.layers.addText(it.orig);
  var tp = T.property("ADBE Text Properties").property("ADBE Text Document");
  var td = tp.value;
  td.resetCharStyle(); td.font = "Manrope-Regular"; td.fontSize = 33.333; td.fillColor = [1, 1, 1]; td.applyFill = true; td.applyStroke = false;
  td.justification = (it.just == "center") ? ParagraphJustification.CENTER_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
  td.text = it.orig; tp.setValue(td);
  var r = T.sourceRectAtTime(0, false);
  var size = 33.333 * (it.bboxW / r.width);
  td = tp.value; td.fontSize = size; td.text = it.text; tp.setValue(td);
  r = T.sourceRectAtTime(0, false);
  var cy = r.top + r.height / 2, tAnchor, shift;
  if (it.just == "center") { tAnchor = [r.left + r.width / 2, cy]; shift = [0, 0]; }
  else { tAnchor = [r.left, cy]; shift = [(ap[0] - it.bboxW / 2) - ap[0], 0]; }
  T.property("ADBE Transform Group").property("ADBE Anchor Point").setValue(tAnchor);
  var tpos = T.property("ADBE Transform Group").property("ADBE Position");
  if (pos.numKeys > 0) {
    for (var k = 1; k <= pos.numKeys; k++) { var v = pos.keyValue(k); tpos.setValueAtTime(pos.keyTime(k), [v[0] + shift[0], v[1], 0]); }
    easeKeys(tpos);
  } else { var v0 = pos.value; tpos.setValue([v0[0] + shift[0], v0[1], 0]); }
  var top_ = T.property("ADBE Transform Group").property("ADBE Opacity");
  if (op.numKeys > 0) { for (var k2 = 1; k2 <= op.numKeys; k2++) top_.setValueAtTime(op.keyTime(k2), op.keyValue(k2)); easeKeys(top_); }
  T.inPoint = L.inPoint; T.outPoint = L.outPoint; T.startTime = L.startTime;
  T.name = "TXT " + it.text;
  T.moveBefore(L);
  if (it.hide) L.enabled = false;
  R.done.push(it.text + " size " + size.toFixed(1) + " w " + r.width.toFixed(0));
}
app.endUndoGroup();
