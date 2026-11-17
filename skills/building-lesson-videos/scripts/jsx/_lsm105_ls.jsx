var c = byId(DATA.compId), o = [];
for (var j = 1; j <= c.numLayers; j++) { var L = c.layer(j); o.push(j + " " + L.name + " [" + L.inPoint.toFixed(1) + "-" + L.outPoint.toFixed(1) + "]"); }
R.done = o;
