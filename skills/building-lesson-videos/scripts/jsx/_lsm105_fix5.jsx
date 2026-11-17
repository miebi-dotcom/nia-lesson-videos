var main = byId(DATA.mainId), cov = null, tut = null;
for (var j = 1; j <= main.numLayers; j++) { var L = main.layer(j); if (L.name === "cover page" || (L.source && L.source.name === "cover page")) cov = L; if (L.name.indexOf("a_1080p.mp4") >= 0) tut = L; }
cov.moveBefore(tut);
R.done = ["cover page now directly above tutor a: index " + cov.index + " tutor " + tut.index];
