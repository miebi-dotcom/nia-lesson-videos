function walk(f, d) {
  for (var i = 1; i <= f.numItems; i++) {
    var it = f.item(i), s = d + it.id + " " + it.name;
    if (it instanceof FolderItem) { R.done.push(s + "/"); walk(it, d + "  "); }
    else if (it instanceof CompItem) R.done.push(s + " [comp " + it.duration.toFixed(1) + "s " + it.numLayers + "L]");
    else R.done.push(s);
  }
}
for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof FolderItem && it.id == DATA.id) walk(it, ""); }
