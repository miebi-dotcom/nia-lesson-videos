app.beginUndoGroup("Revamp: speed transitions");
var main = byId(DATA.mainId);
for (var i = 0; i < DATA.cuts.length; i++) {
  var L = main.layer(DATA.cuts[i][1]);
  L.stretch = DATA.stretch;
  L.startTime = DATA.cuts[i][0] - DATA.cover * DATA.stretch / 100;
  R.done.push(L.name + " " + L.inPoint.toFixed(2) + "-" + L.outPoint.toFixed(2));
}
app.endUndoGroup();
