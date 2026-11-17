var c = compByName(DATA.name); R.id = c.id; R.l = [];
for (var j = 1; j <= c.numLayers; j++) { var L = c.layer(j); if (L.source && L.source.file !== undefined) R.l.push(j + " | " + L.name + " | " + L.source.name + " | missing=" + L.source.footageMissing + " | " + L.inPoint.toFixed(1) + "-" + L.outPoint.toFixed(1) + " en=" + L.enabled + " tr=" + (L.timeRemapEnabled)); }
