// Image sets (assets named 5, 5b, 5c ...): put them in ONE scene and transition between the images with effects.
// Run after build_scenes.jsx has built the scene with the FIRST image only (its length = the whole set).
// The next images are added inside the scene's photo holder (so the preset's frame, push-in and exit stay) or,
// when the scene has no holder, straight into the scene comp on top.
// DATA: { "mainId": 1823, "assetsFolder": "CHS228 assets",
//         "remove": ["S08b CHW home visit (asset 5b)"],      old separate scenes to delete (layers + comps)
//         "dur": 0.7, "lead": 0.3,                           transition length (main-comp s) and how early it starts before "t"
//         "sets": [ { "scene": "S08 CHW home visit (assets 5, 5b)",
//                     "images": [ { "file": "D:/a/5b.png", "t": 121.84, "fx": "linearL" } ] } ] }
// fx: "linearL" (soft wipe, left to right), "linearU" (soft wipe, bottom to top), "radial" (circular scale wipe from the
//     centre), "zoom" (cross-dissolve with a push-through). t = main-comp time of the word that introduces the image.
// The incoming image settles from 108% and then keeps the slow push-in. Time-remapped scenes are handled: the transition
// is placed and timed through the remap, so it lasts "dur" on screen.
var main = byId(DATA.mainId);
if (!main) throw new Error("main comp not found");
var assetsF = folderNamed(DATA.assetsFolder || "image sets", true);
var DUR = DATA.dur || 0.7, LEAD = (DATA.lead === undefined) ? 0.3 : DATA.lead;
app.beginUndoGroup("Image set transitions");

function ease1(prop) {
    var e = new KeyframeEase(0, 75);
    for (var k = 1; k <= prop.numKeys; k++) prop.setTemporalEaseAtKey(k, [e], [e]);
}
function findScene(name) {
    for (var j = 1; j <= main.numLayers; j++) { var L = main.layer(j); if (L.source instanceof CompItem && L.source.name === name) return L; }
    return null;
}
var rem = DATA.remove || [];
for (var i = 0; i < rem.length; i++) {
    for (var j = main.numLayers; j >= 1; j--) { var L0 = main.layer(j); if (L0.source && L0.source.name === rem[i]) L0.remove(); }
    var oc = compByName(rem[i]);
    if (oc) oc.remove();
    R.done.push("removed " + rem[i]);
}

for (var s = 0; s < DATA.sets.length; s++) {
    var set = DATA.sets[s], ml = findScene(set.scene);
    if (!ml) { R.errors.push("scene not found: " + set.scene); continue; }
    var sc = ml.source, hl = null;
    for (var j = 1; j <= sc.numLayers; j++) { var Lh = sc.layer(j); if (Lh.source && Lh.source.name.indexOf("HOLDER") >= 0) { hl = Lh; break; } }
    var target = hl ? hl.source : sc;
    var tp = ml.timeRemapEnabled ? ml.property("ADBE Time Remapping") : null;
    for (var n = 0; n < set.images.length; n++) {
        var im = set.images[n], t0 = im.t - LEAD, t1 = t0 + DUR, ct, ct1;
        if (tp) { ct = tp.valueAtTime(t0, false); ct1 = tp.valueAtTime(t1, false); }
        else { ct = t0 - ml.startTime; ct1 = t1 - ml.startTime; }
        var dc = Math.max(0.12, ct1 - ct), ht = hl ? ct - hl.startTime : ct;
        var win = Math.max(1, sc.duration - ct);
        var item = importOnce(im.file, false, assetsF);
        for (var q = target.numLayers; q >= 1; q--) if (target.layer(q).source === item) target.layer(q).remove();   // re-runs replace
        var nl = target.layers.add(item);
        nl.moveToBeginning();
        var sv = Math.max(target.width / item.width, target.height / item.height) * 100;
        nl.property("ADBE Transform Group").property("ADBE Scale").setValue([sv, sv, 100]);
        nl.startTime = ht;
        nl.outPoint = target.duration;
        nl.name = item.name;
        nl.property("ADBE Transform Group").property("ADBE Scale").expression =
            "var q=clamp((time-inPoint)/" + r2(dc) + ",0,1); var z=1+0.08*Math.pow(1-q,3); " +
            "var p=linear(time,inPoint,inPoint+" + r2(win) + ",0,1); value*z*(1+0.07*(1-Math.pow(1-p,2)))";
        var fx = im.fx || "linearL", ef, pr;
        if (fx === "linearL" || fx === "linearU") {
            ef = nl.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
            ef.property("Wipe Angle").setValue(fx === "linearL" ? 90 : 0);
            ef.property("Feather").setValue(120);
            pr = ef.property("Transition Completion");
        } else if (fx === "radial") {
            ef = nl.property("ADBE Effect Parade").addProperty("CC Radial ScaleWipe");
            ef.property("Center").setValue([target.width / 2, target.height / 2]);
            pr = ef.property("Completion");
        } else {
            pr = nl.property("ADBE Transform Group").property("ADBE Opacity");
        }
        var full = (fx === "zoom") ? 100 : ((pr.maxValue <= 1) ? 1 : 100);   // wipe completions are 0-1 or 0-100
        if (fx === "zoom") { pr.setValueAtTime(ht, 0); pr.setValueAtTime(ht + dc, full); }
        else { pr.setValueAtTime(ht, full); pr.setValueAtTime(ht + dc, 0); }
        ease1(pr);
        R.done.push(set.scene + ": " + item.name + " in at " + r2(t0) + " main s (" + fx + ", " + r2(dc) + " s scene time)" + (hl ? " [holder]" : " [scene]"));
    }
}
app.endUndoGroup();
