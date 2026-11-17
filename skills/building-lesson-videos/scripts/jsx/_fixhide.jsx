app.beginUndoGroup("fixhide");
var c = app.project.itemByID(5472);
for (var i = 1; i <= c.numLayers; i++) {
  var L = c.layer(i), n = L.name, off = false;
  if (n == "Arm of government" || n == "Responsible" || n == "Poor facilities,\r" || n.indexOf("Poor facilities") == 0 && n.length > 15 && n.indexOf("TXT") != 0 || n == "Shortage of staff." || n == "Low health literacy.") off = true;
  if (n.indexOf("Poor facilities") == 0 && n.indexOf("TXT") != 0) off = true;
  L.enabled = !off;
  if (n.indexOf("TXT") == 0) L.enabled = true;
  R.done.push(i + "|" + n.replace(/[\r\n]/g, "~") + "|" + (L.enabled ? "on" : "off"));
}
app.endUndoGroup();
