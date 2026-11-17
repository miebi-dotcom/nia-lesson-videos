app.beginUndoGroup("s35head");
var c = app.project.itemByID(5472);
c.layer(22).enabled = false; c.layer(15).enabled = false;
var T = c.layers.addText("Barriers to primary health utilisation");
var tp = T.property("ADBE Text Properties").property("ADBE Text Document"), td = tp.value;
td.resetCharStyle(); td.font = "Manrope-Bold"; td.fontSize = 46; td.fillColor = [1,1,1]; td.applyFill = true; td.applyStroke = false;
td.justification = ParagraphJustification.CENTER_JUSTIFY; tp.setValue(td);
var r = T.sourceRectAtTime(0, false);
T.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([r.left + r.width/2, r.top + r.height/2]);
var pos = T.property("ADBE Transform Group").property("ADBE Position");
pos.setValueAtTime(0.5, [968, 118]); pos.setValueAtTime(1.0, [968, 98]);
var op = T.property("ADBE Transform Group").property("ADBE Opacity");
op.setValueAtTime(0.5, 0); op.setValueAtTime(0.9, 100);
for (var k = 1; k <= 2; k++) { pos.setTemporalEaseAtKey(k, [new KeyframeEase(0,40)], [new KeyframeEase(0,40)]); op.setTemporalEaseAtKey(k, [new KeyframeEase(0,40)], [new KeyframeEase(0,40)]); }
T.name = "TXT Barriers heading";
R.done.push("w " + r.width);
app.endUndoGroup();
