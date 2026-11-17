R.comps = [];
for (var n = 0; n < DATA.ids.length; n++) {
  var c = byId(DATA.ids[n]); var o = {id:c.id, name:c.name, dur:c.duration, w:c.width, h:c.height, layers:[]};
  for (var j = 1; j <= c.numLayers; j++) { var L = c.layer(j);
    o.layers.push(j + " | " + L.name + " | " + L.constructor.name + " | src=" + (L.source ? L.source.name + "#" + L.source.id : "-") + " | " + L.inPoint.toFixed(2) + "-" + L.outPoint.toFixed(2) + " | en=" + L.enabled); }
  R.comps.push(o); }
