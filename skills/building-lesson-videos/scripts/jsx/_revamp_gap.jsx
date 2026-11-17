app.beginUndoGroup("Revamp: gap frame");
var main = byId(6851), names = ["BAR PATCH 3", "NIA LOGO BAR 3"];
for (var i = 0; i < names.length; i++) {
  var L = main.layer(names[i]); var d = L.duplicate();
  var out = L.outPoint; L.outPoint = 112.0; d.inPoint = 112.0 + 1 / 30; d.outPoint = out;
  d.name = names[i] + " b";
}
app.endUndoGroup();
