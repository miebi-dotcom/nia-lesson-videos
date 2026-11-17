app.beginUndoGroup("Revamp: NIA transitions");
var main = byId(DATA.mainId), tr = byId(DATA.trId);
for (var i = 0; i < DATA.cuts.length; i++) {
  var L = main.layers.add(tr);
  L.name = DATA.cuts[i][1];
  L.startTime = DATA.cuts[i][0] - DATA.cover;
  L.moveToBeginning();
  R.done.push(L.name + " @ " + L.startTime.toFixed(2));
}
app.endUndoGroup();
