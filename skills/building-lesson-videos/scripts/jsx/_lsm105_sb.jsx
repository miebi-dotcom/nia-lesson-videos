var c = compByName("S13 OST Side bar bullets"), main = byId(DATA.mainId), log = [];
var head = null, t3 = null;
for (var j = 1; j <= c.numLayers; j++) { var L = c.layer(j); if (L.name.indexOf("When we open") === 0) head = L; if (L.name.indexOf("In universities") === 0) t3 = L; }
var hp = head.property("ADBE Transform Group").property("ADBE Position"), bp = t3.property("ADBE Transform Group").property("ADBE Position");
log.push("head expr " + hp.expression + " | bullet expr " + bp.expression + " keys " + hp.numKeys + "/" + bp.numKeys);
hp.expression = ""; hp.setValue([DATA.x, DATA.headY]);
var scene0 = DATA.t, words = DATA.words, base = [DATA.x];
for (var i = 0; i < words.length; i++) {
    var L2 = (i === 0) ? t3 : t3.duplicate();
    var p = L2.property("ADBE Text Properties").property("ADBE Text Document"), td = p.value;
    td.text = words[i][0]; td.fontSize = DATA.size; td.font = "Manrope-Bold";
    p.setValue(td);
    var pp2 = L2.property("ADBE Transform Group").property("ADBE Position"); pp2.expression = ""; pp2.setValue([base[0], DATA.y0 + DATA.gap * i]);
    var rel = words[i][1] - scene0 - 0.25;
    L2.startTime = rel - 1.17 + 1.17 - 1.17 + 1.17 - 0; // placeholder, fixed below
    L2.startTime = rel;
    L2.outPoint = c.duration;
    L2.name = "bullet " + words[i][0];
    log.push(words[i][0] + " start " + L2.startTime);
}
// remove the five stacked pill scenes
var n = 0;
for (var k = main.numLayers; k >= 1; k--) { var M = main.layer(k); if (M.source && /^S13 OST (Curious|Open minded|Truth-seeking|Systematic|Honest)$/.test(M.source.name)) { M.remove(); n++; } }
log.push("removed pills " + n);
R.done = log;
