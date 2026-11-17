app.beginUndoGroup("settext");
var c = app.project.itemByID(DATA.id);
for (var i = 0; i < DATA.items.length; i++) {
  var it = DATA.items[i], L = c.layer(it.layer);
  var pr = L.property("ADBE Text Properties").property("ADBE Text Document");
  var td = pr.value; td.text = it.text; pr.setValue(td);
  R.done.push(L.name + " -> " + pr.value.text);
}
app.endUndoGroup();
