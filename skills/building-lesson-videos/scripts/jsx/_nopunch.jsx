app.beginUndoGroup("nopunch");
var c = app.project.itemByID(5422);
var idx = [4,15,16,12,13,1,2,9,10,3,6,7];
for (var n = 0; n < idx.length; n++) {
  var L = c.layer(idx[n]), t = L.property("ADBE Transform Group"), sc = t.property("ADBE Scale"), op = t.property("ADBE Opacity");
  if (sc.numKeys != 3) { R.warnings.push("skip " + L.name); continue; }
  var t0 = sc.keyTime(1), t2 = sc.keyTime(3);
  while (sc.numKeys > 0) sc.removeKey(1);
  sc.setValueAtTime(t0, [88, 88, 100]); sc.setValueAtTime(t2 + 0.1, [100, 100, 100]);
  for (var k = 1; k <= 2; k++) sc.setTemporalEaseAtKey(k, [new KeyframeEase(0, 60), new KeyframeEase(0, 60), new KeyframeEase(0, 60)], [new KeyframeEase(0, 60), new KeyframeEase(0, 60), new KeyframeEase(0, 60)]);
  if (op.numKeys == 0) { op.setValueAtTime(t0, 0); op.setValueAtTime(t0 + 0.25, 100); }
  R.done.push(L.name + " fixed");
}
app.endUndoGroup();
