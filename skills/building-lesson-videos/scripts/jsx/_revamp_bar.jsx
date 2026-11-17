app.beginUndoGroup("Revamp: bar logo");
var main = byId(DATA.mainId), logoSrc = byId(6610);
for (var i = 0; i < DATA.ranges.length; i++) {
  var a = DATA.ranges[i][0] + DATA.off - 0.2, z = DATA.ranges[i][1] + DATA.off + 0.1;
  var b = main.layers.addShape(); b.name = "BAR PATCH " + (i + 1);
  var g = b.property("Contents").addProperty("ADBE Vector Group");
  var rc = g.property("Contents").addProperty("ADBE Vector Shape - Rect");
  rc.property("ADBE Vector Rect Size").setValue([110, 100]);
  var fl = g.property("Contents").addProperty("ADBE Vector Graphic - Fill");
  fl.property("ADBE Vector Fill Color").setValue([5 / 255, 39 / 255, 63 / 255]);
  b.property("ADBE Transform Group").property("ADBE Position").setValue([88, 970]);
  var lg = main.layers.add(logoSrc); lg.name = "NIA LOGO BAR " + (i + 1);
  lg.property("ADBE Transform Group").property("ADBE Scale").setValue([17, 17]);
  lg.property("ADBE Transform Group").property("ADBE Position").setValue([88, 970]);
  var ls = [b, lg];
  for (var k = 0; k < 2; k++) { ls[k].startTime = 0; ls[k].inPoint = a; ls[k].outPoint = z; }
}
app.endUndoGroup();
