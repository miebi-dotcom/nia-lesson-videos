// DATA: {main, items:[{layer, src, name, text}]}  swaps old caption layers for Phase 11 bar comps trimmed to the old duration
app.beginUndoGroup("swapcaps");
var main = app.project.itemByID(DATA.main);
var folder = null;
for (var i = 1; i <= app.project.numItems; i++) { var f = app.project.item(i); if (f instanceof FolderItem && f.name == "CHS224 scenes") folder = f; }
var olds = [];
for (var n = 0; n < DATA.items.length; n++) olds.push(main.layer(DATA.items[n].layer));
for (var n = 0; n < DATA.items.length; n++) {
  var it = DATA.items[n], old = olds[n];
  var st = old.inPoint, D = old.outPoint - old.inPoint;
  var src = app.project.itemByID(it.src);
  var dup = src.duplicate(); dup.name = it.name; if (folder) dup.parentFolder = folder;
  var endT = 16.5, shiftBy = D - endT;
  dup.duration = Math.max(D, 1);
  for (var li = 1; li <= dup.numLayers; li++) {
    var L = dup.layer(li);
    var props = [L.property("ADBE Transform Group").property("ADBE Position"), L.property("ADBE Transform Group").property("ADBE Opacity"), L.property("ADBE Transform Group").property("ADBE Scale")];
    for (var p = 0; p < props.length; p++) {
      var pr = props[p];
      for (var k = pr.numKeys; k >= 1; k--) {
        if (pr.keyTime(k) > 8) { var t = pr.keyTime(k), v = pr.keyValue(k); pr.removeKey(k); pr.setValueAtTime(t + shiftBy, v); }
      }
    }
    if (L.outPoint > D) L.outPoint = D;
    try {
      var tp = L.property("ADBE Text Properties");
      if (tp) { var pd = tp.property("ADBE Text Document"), td = pd.value; td.text = it.text; pd.setValue(td); }
    } catch (e) {}
  }
  var nl = main.layers.add(dup);
  nl.startTime = st; nl.inPoint = st; nl.outPoint = st + D;
  nl.moveBefore(old);
  nl.name = it.name;
  R.done.push(it.name + " @" + st.toFixed(2) + " D=" + D.toFixed(2) + " replacing " + old.name);
}
for (var n = 0; n < olds.length; n++) olds[n].remove();
app.endUndoGroup();
