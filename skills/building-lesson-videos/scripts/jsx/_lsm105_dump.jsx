var pc = compByName("S03 Walk into your shop (1A-1B-1C)"), o = [], j, k;
for (j = 1; j <= pc.numLayers; j++) { var L = pc.layer(j); var tr = L.property("ADBE Time Remapping"); var s = L.name + " start " + L.startTime.toFixed(2) + " in " + L.inPoint.toFixed(2) + " out " + L.outPoint.toFixed(2) + " srcdur " + L.source.duration.toFixed(2) + " remap:";
 if (tr && tr.numKeys) for (k = 1; k <= tr.numKeys; k++) s += " (" + tr.keyTime(k).toFixed(2) + "->" + tr.keyValue(k).toFixed(2) + ")"; else s += " none";
 o.push(s);
 var sc = L.property("ADBE Transform Group").property("ADBE Scale"); s = "  scale keys " + sc.numKeys; for (k = 1; k <= sc.numKeys; k++) s += " (" + sc.keyTime(k).toFixed(2) + ":" + sc.keyValue(k)[0].toFixed(1) + ")"; o.push(s); }
R.done = o;
