var m = byId(DATA.mainId), a, b, j;
for (j = 1; j <= m.numLayers; j++) { if (m.layer(j).name === "S18 OST Specific") a = m.layer(j); if (m.layer(j).name === "S18 OST Vague") b = m.layer(j); }
a.moveBefore(b);
R.done = ["moved"];
