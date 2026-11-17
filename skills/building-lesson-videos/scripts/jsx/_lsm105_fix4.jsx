var c = compByName("S19 Stages native");
var src = null, dst = null, d37 = null;
for (var j = 1; j <= c.numLayers; j++) { var p = c.layer(j).name.substr(0, 3); if (p === "021") src = c.layer(j); if (p === "035") dst = c.layer(j); if (p === "037") d37 = c.layer(j); }
var sp = src.property("ADBE Text Properties").property("ADBE Text Document"), sd = sp.value;
var info = [sd.font, sd.fontSize, sd.fauxBold ? 1 : 0, sd.fillColor.toString()];
var dp = dst.property("ADBE Text Properties").property("ADBE Text Document"), dd = dp.value;
info.push("035:", dd.font, dd.fontSize, dd.fillColor.toString());
var d2 = d37.property("ADBE Text Properties").property("ADBE Text Document").value;
info.push("037:", d2.font, d2.fontSize, d2.fillColor.toString());
dd.font = sd.font; dd.fontSize = sd.fontSize; dd.fauxBold = sd.fauxBold;
dp.setValue(dd);
R.done = info;
