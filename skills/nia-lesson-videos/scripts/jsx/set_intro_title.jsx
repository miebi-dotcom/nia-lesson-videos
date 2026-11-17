// Put the script's lesson title on the NIA intro cover. One undo step. Proven on CSC1101 (2026-11-17).
// The cover comp ("cover page 2") is shared with the template showreel and deck, so the lesson gets its own copy,
// swapped into the intro comp. The title is ONE text layer coloured per character: line 1 yellow, the rest white.
// DATA: { "introName": "Intro and Lower third Template", "coverName": "cover page 2", "titleLayer": 11,
//         "lines": ["Input and", "Output", "Systems"], "copyName": "cover page 2 CSC1101" }
// (introId / coverId may be given instead of the names.) Check titleLayer with list_layers.jsx first.
app.beginUndoGroup("Intro title");
try {
    var intro = DATA.introId ? byId(DATA.introId) : compByName(DATA.introName);
    var cover = DATA.coverId ? byId(DATA.coverId) : compByName(DATA.coverName);
    if (!intro || !cover) throw new Error("intro or cover comp not found");
    var copy = compByName(DATA.copyName);
    if (!copy) { copy = cover.duplicate(); copy.name = DATA.copyName; }
    var swapped = 0;
    for (var j = 1; j <= intro.numLayers; j++) {
        var L = intro.layer(j);
        if (L.source && L.source.id === cover.id) { L.replaceSource(copy, false); swapped++; }
    }
    R.swapped = swapped;
    var T = copy.layer(DATA.titleLayer);
    if (!(T instanceof TextLayer)) throw new Error("layer " + DATA.titleLayer + " of " + copy.name + " is not a text layer");
    var st = T.property("Source Text"), td = st.value;
    var yellow = td.characterRange(0, 1).fillColor, white = [1, 1, 1];
    td.text = DATA.lines.join("\r");
    st.setValue(td);
    td = st.value;   // setting the text resets per-character styles: re-apply the colours
    var n = td.text.length, first = DATA.lines[0].length;
    td.characterRange(0, first).fillColor = yellow;
    if (n > first) td.characterRange(first, n).fillColor = white;
    st.setValue(td);
    R.text = st.value.text;
    R.copyId = copy.id;
    R.done.push("title set in " + copy.name + " (layer " + DATA.titleLayer + "), swapped into " + intro.name + " x" + swapped);
} finally { app.endUndoGroup(); }
