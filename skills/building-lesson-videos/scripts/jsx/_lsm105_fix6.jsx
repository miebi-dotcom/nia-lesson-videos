var main = byId(DATA.mainId), n = 0;
for (var j = main.numLayers; j >= 1; j--) { var L = main.layer(j); if (L.source && (L.source.id === 4179 || L.source.id === 4195)) { L.remove(); n++; } }
R.done = ["removed " + n + " old transition layers"];
