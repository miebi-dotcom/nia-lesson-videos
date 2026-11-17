var c = byId(6824); R.l = [];
for (var j = Math.max(1, c.numLayers - 4); j <= c.numLayers; j++) { var L = c.layer(j); R.l.push(j + " | " + L.name + " | en=" + L.enabled + " | " + L.inPoint.toFixed(1) + "-" + L.outPoint.toFixed(1)); }
