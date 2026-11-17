var c = app.project.itemByID(DATA.id);
for (var i = 1; i <= c.numLayers; i++) {
    var L = c.layer(i), o = i + "|" + L.name + "|" + L.inPoint.toFixed(2) + "-" + L.outPoint.toFixed(2) + "|" + (L.enabled ? "on" : "off");
    if (L.source) o += "|src:" + L.source.name + "#" + L.source.id;
    R.done.push(o);
}
