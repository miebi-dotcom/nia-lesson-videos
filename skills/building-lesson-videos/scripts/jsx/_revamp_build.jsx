app.beginUndoGroup("Revamp: intro + logo");
var cover = byId(5).duplicate();
cover.name = "COVER INTRO - revamp";
cover.duration = DATA.coverDur;
var vid = byId(6824), logoSrc = byId(6610);
var vdur = vid.duration;
var main = app.project.items.addComp("REVAMP MAIN", 1920, 1080, 1, DATA.coverDur + vdur, 30);
var vL = main.layers.add(vid); vL.startTime = DATA.coverDur; vL.name = "LESSON VIDEO";
var cL = main.layers.add(cover); cL.startTime = 0; cL.name = "COVER INTRO";
cL.outPoint = DATA.coverDur;
// badge covering the old M
var b = main.layers.addShape(); b.name = "LOGO BADGE";
var g = b.property("Contents").addProperty("ADBE Vector Group");
var rc = g.property("Contents").addProperty("ADBE Vector Shape - Rect");
rc.property("ADBE Vector Rect Size").setValue([190, 80]);
rc.property("ADBE Vector Rect Roundness").setValue(14);
var fl = g.property("Contents").addProperty("ADBE Vector Graphic - Fill");
fl.property("ADBE Vector Fill Color").setValue([0.039, 0.192, 0.325]);
b.property("ADBE Transform Group").property("ADBE Position").setValue([1800, 84]);
var lg = main.layers.add(logoSrc); lg.name = "NIA LOGO";
lg.property("ADBE Transform Group").property("ADBE Scale").setValue([30, 30]);
lg.property("ADBE Transform Group").property("ADBE Position").setValue([1800, 84]);
var ls = [b, lg];
for (var i = 0; i < ls.length; i++) {
  ls[i].startTime = 0; ls[i].inPoint = DATA.coverDur; ls[i].outPoint = main.duration;
  var op = ls[i].property("ADBE Transform Group").property("ADBE Opacity");
  op.setValueAtTime(DATA.coverDur, 0); op.setValueAtTime(DATA.coverDur + 0.6, 100);
}
app.endUndoGroup();
R.mainId = main.id; R.coverId = cover.id; R.dur = main.duration;
