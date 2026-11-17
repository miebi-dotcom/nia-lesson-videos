# Animating designed diagram assets (PSD and Illustrator)

Designers build each diagram from many pieces (outer ring, inner disc, glyph, label, connector line, label pill, table cells, dots) precisely so each piece can move. **Animate every piece on its own, in a staggered build timed to the narration.** Popping a whole icon group in as one block looks flat; the user called that lazy. This is the quality bar for every diagram scene.

## Contents
- Step 1: get one layer per element (PSD as imported; Illustrator: SVG export rebuilt natively; .ai and explode+patch as fallbacks)
- Step 2: write the beats
- Step 3: generate, apply, check
- The motion standard

## Step 1: get one layer per element
The asset is already imported and placed as a scene (`"layered": "<file>"` in scenes.json). Then:

**PSD** → nothing to do: every PSD layer is an AE layer. Positions come straight from the file:
`python scripts/choreograph.py --list "<file>.psd"`. Beats use `"psd": "<file>.psd"`.

**Illustrator → SVG export → native rebuild (the default).** Never animate masked crops of the art: masks cut lines and arrows into fragments, carry background boxes along, and let icons drift off their cards (users rejected exactly that). Rebuild the artwork from its vector data instead: every line becomes a real stroked path (drawn on with Trim Paths), every label live text, every photo its own layer.

**Get SVGs.** For each `<file>.ai` look for `<file>.svg` beside it. Missing ones: ask the user to export them (one message listing the files), with these settings. Keep the `.ai` and the `.png` export in the same folder: they are used too.
> Illustrator: **File > Export > Export As…**, format **SVG**, "Use Artboards" on. Options: Styling **Internal CSS** · Font **SVG** (not "Convert to Outlines": live text stays editable) · Images **Embed** · Object IDs **Layer Names** · Decimal **2** · Minify **off** · Responsive **off**.
> Ask the designer to keep each diagram element (connector + its dot + its arrowhead, a card, a label) in its own named layer or group: the rebuild animates by those groups.

Why SVG: the designer's groups and layer names survive (`group` on every element), circles and rounded rectangles stay exact, dashes are explicit, text keeps its line breaks, and photos sit where Illustrator shows them (the PDF stream inside an `.ai` can be stale, see below).
```
powershell -File scripts/rebuild_check.ps1 -Src "<file>.svg" -Work "<work>/rebuild/<cue>" -Comp "<cue> <name> native"
        -Duration <scene length> [-Replace <placed comp id> -MainId <main comp id>]
```
`svg_extract.py` prints every designer group with its elements and each label's font and alignment: read it, it is the map for writing beats. Fonts missing from the SVG's CSS (Illustrator sometimes drops them) are borrowed from the `.ai`, weights matched against the PNG export; label positions are aligned to the export's ink. Gradient fills are approximated by their average colour (reported as a note).

**Fallback: the `.ai` itself** (the user can't export SVG): `-Src "<file>.ai"` runs `ai_extract.py` (paths with exact beziers, fills, strokes, dashes, caps; text by paragraph with font weight matched by ink density; embedded images with transparency; Illustrator clipping masks and transparency-group opacity), then `png_anchor.py` (see below), then `rebuild_ai.jsx` (shape / text / image layers in paint order, clips as masks that travel with their layer, group opacity as layer opacity), renders a frame and compares it with the designer's PNG export.
Either way:
- **Pass ≤ ~3% pixels differing** (`compare.png`: the PNG export on top, rebuild below, differences outlined). Typical: 0.5–3% (text anti-aliasing and photo resampling); strong (>80) differences under ~1%. Look at the outlined areas: a whole element outlined is a real miss.
- **`-Replace`** swaps the rebuilt comp into the main comp in place of the placed scene comp (timing, scale and main-comp moves kept; old comp moved to "Replaced AI scenes"). **Re-running** with the same `-Comp` name replaces the earlier rebuild everywhere it is used, so fixes never need manual re-placing (re-apply the beats afterwards: animation lives on the layers).
- **The .ai's PDF stream can be stale**: on one lesson, photos sat 280–720 px away from where Illustrator and the PNG export show them, and a clip cut a photo card to a strip. When `<file>.png` sits next to `<file>.ai`, `png_anchor.py` finds every photo in the export (masked colour match, so transparent renders match too) and moves it and its clip there. **The PNG export is the design of record**; the compare uses it.
- `layers.json` (written by the rebuild) is the beats' `"layers"` file; names are `NNN <what it is>` ("011 dashed line 333x152", "024 text Logistics Co.", "008 image 336x283 clipped"), plus `group` for SVG sources (also in each AE layer's comment).

**Fallback: explode + patch** (only when the rebuild can't represent something, e.g. gradient meshes/effects reported as `shade`, or no PDF-compatible stream). Measure multi-layer files in AE:
```
render_layers.jsx {"comp": "<scene comp>", "outDir": "<work>/layers_<cue>"}     (prints outDir)
python scripts/layer_bboxes.py <outDir> <work>/layers_<cue>.json
```
Files that imported as 1–2 layers (only TOP-LEVEL Illustrator layers become AE layers) can be split in AE:
1. Explode the art into shape layers, with a fidelity check (the bottom-most layer is kept as the background):
   ```
   explode_vector.jsx {"comp": "<scene comp>", "outFile": "<work>/layers_<cue>.json", "compareOut": "<work>/cmp_<cue>"}
   ```
2. Shape conversion loses **embedded images (they become grey boxes)** and **live text (it disappears)**, and can drop some dashes. Find and patch those regions:
   ```
   python scripts/vector_patch_plan.py <compareDir>/original.png <compareDir>/exploded.png <work>/layers_<cue>.json <work>/patch_<cue>.json
   split_regions.jsx {"comp": ..., "source": "<art layer name, e.g. Layer 2>", "remove": <plan.remove>, "regions": <plan.patches>,
                      "layersIn": "<work>/layers_<cue>.json", "layersOut": "<work>/layers_<cue>.json"}
   ```
   Each patch is a copy of the original art masked to that region, so photos, icons and text look exactly as designed.
3. **Verify**: render the scene's final frame and compare it with the asset's PNG preview / the original render: they must look identical. Then make a labelled map to identify the pieces:
   ```
   qc_frames.jsx (final frame)  →  python scripts/label_layers.py <frame.png> <work>/layers_<cue>.json <work>/map_<cue>.png
   ```
   Read the map: numbers ("Layer 2 027 …", "patch 06") ↔ what each piece is (ring, icon, label, connector, arrowhead).

Embedded raster images that are the whole diagram (e.g. a photo composite with a few vector labels) can't be split into more than "photo + labels": animate the photo as one piece (push-in) and the labels/pins individually.

## Step 2: write the beats
`<work>/beats_<cue>.json` (full format in the header of `scripts/choreograph.py`). A complete file for an SVG scene:
```json
{
 "comp": "S12 Blockchain (asset 7) native",
 "layers": "<work>/rebuild/S12/layers.json",
 "sceneStart": 336.13, "duration": 43.34,
 "transcript": "<work>/transcript.json", "offset": 3.29,
 "beats": [
  {"group": "Layer 8", "phrase": "blockchain", "kind": "auto", "peak": 112},
  {"group": "Layer 3", "phrase": "blockchain", "kind": "auto", "delay": 0.1},
  {"group": ["Layer 12", "Layer 7"], "phrase": "between parties", "kind": "auto"},
  {"group": ["Layer 11", "Layer 5"], "phrase": "between parties", "kind": "auto", "delay": 0.2},
  {"group": ["Layer 20", "Layer 16"], "phrase": "recording cargo", "kind": "auto"},
  {"group": ["Layer 19", "Layer 14"], "phrase": "recording cargo", "kind": "auto", "delay": 0.15}
 ]
}
```
- `sceneStart` = where the scene comp's time 0 sits in the main comp (the scene layer's start time; for an unplaced test comp, the narration time it stands for). `offset` = the tutor layer's start in the main comp. `duration` = scene length.
- **Phrases**: matched against the transcript (`transcript.py` output: a list of segments, each with `words: [{w, s, e}]` in tutor-clip seconds), ignoring case, spaces and punctuation. The search starts at `sceneStart` and moves forward: each beat searches from the previous beat's match, so list beats in spoken order and a repeated word ("blockchain" said twice) resolves to the next occurrence. Beats may share a phrase; `"delay"` adds seconds after the match. `"at"` gives seconds into the scene instead.
- **Generic narration** (the elements are never named: "four organisations", "between parties"): stagger the elements on the phrase that introduces them with `delay` 0.15–0.25 s apart, or spread them across the sentence's words. Don't invent links between a word and the wrong element.
- **Which groups belong together**: `svg_extract.py` prints "related groups" (`Layer 7 sits on Layer 12`; `Layer 20 connector: starts at Layer 16, ends at Layer 8`). Put a label group with the group it sits on, and a connector with the dot/halo group at its start.
- **Group by element**: ring + disc + glyph + its label = one `icon` beat; a table row's cell + dot + text = one `row` beat; connectors and arrowheads = `line` beats.
- Give each beat the phrase that introduces it (from the transcript) or `"at"` seconds.
- `base`: what is on screen when the scene opens (panels, table headers, the hub of a radial diagram). `hub`: radial diagrams' hub ring, so satellites fly out from it.
- Roles are auto-detected for PSDs. For explode+patch pieces pass them: `"labels": [...]` (text/patches with words), `"pills": [...]`, `"lines": [...]`; for tables `"panels"`, `"headerCells"`, and per row `"cells"`.
- **SVG sources: write `auto` beats by designer group.** One beat per thing the narration introduces, naming the group(s) that make it up; `auto` picks each element's motion from what it is:
  ```json
  {"group": "Layer 8", "phrase": "blockchain", "kind": "auto", "peak": 112},
  {"group": ["Layer 12", "Layer 7"], "phrase": "between parties", "kind": "auto"},
  {"group": ["Layer 11", "Layer 5"], "phrase": "between parties", "kind": "auto", "delay": 0.2},
  {"group": ["Layer 20", "Layer 16"], "phrase": "recording cargo", "kind": "auto"}
  ```
  - containers and pictures pop, largest first (`peak`, `rot`, `gap`)
  - each **line draws on with Trim Paths** from its start: the end with a round dot (dots/halos there pop first); else the end without an arrowhead (`"from"` overrides)
  - arrowheads and end caps land as the line reaches them
  - leftover small pieces pop; text rises last (`dy`)
  - pieces lying inside a container of the same beat are **parented** to it automatically (a label on its card, an icon in its disc)
  - Combine groups that belong together (a card group + its label group; a connector group + the halo group at its start). Several beats can share a phrase: stagger them with `"delay"`. `layers` can be listed too, and the other kinds still work for special moves.
- **Other native kinds (also for `.ai`-sourced rebuilds, which have no groups), chosen by what each element IS**:
  - `draw` for every line, connector, dashed link and curve (Trim Paths draw-on from the end nearest `"from"`; dashes stay dashes), with its arrowheads/end dots in `"tips"` so they pop as the line arrives. Never pop or scale a line.
  - `pop` for cards, discs, halos, photos and icons (`"rot"` for a settle on icons, `"gap"` to stagger several).
  - `label` for text (rises + fades; `"delay"` to land after its card).
  - `spin` for rings/orbits that should keep turning.
  - `"parents": {"icon": "card", "card text": "card"}` for everything that sits ON a container, so it scales and moves with it (an icon must never move apart from its card).
  - Several beats may share one phrase; offset them with `"delay"` (card → icon +0.2 s → labels +0.45 s).
  - Example (sensor card → data lines → analytics card):
    ```json
    "parents": {"006 image 174x189": "004 cyan shape 317x173", "019 text Sensors": "004 cyan shape 317x173"},
    "beats": [
      {"layers": ["004 cyan shape 317x173"], "phrase": "sensors provide", "kind": "pop", "peak": 108},
      {"layers": ["006 image 174x189"], "phrase": "sensors provide", "kind": "pop", "peak": 118, "rot": -6, "delay": 0.2},
      {"layers": ["019 text Sensors", "018 text Storage tank B-12"], "phrase": "sensors provide", "kind": "label", "dy": 16, "delay": 0.45, "gap": 0.12},
      {"layers": ["010 dashed line 191x192", "012 dashed line 191x192"], "phrase": "applications", "kind": "draw",
       "dur": 0.9, "gap": 0.12, "from": [597, 590], "tips": ["011 white shape 9x15", "013 white shape 9x15"]},
      {"layers": ["002 red shape 440x241"], "phrase": "depend", "kind": "pop", "peak": 107}
    ]
    ```
- Follow the narration's order, not the layout's (three tiers built bottom-up because the tutor says "primary, secondary and tertiary").
- Wrong or duplicated labels in the artwork: animate the slot where the spoken item belongs and report the label to the user.

## Step 3: generate, apply, check
```
python scripts/choreograph.py <work>/beats_<cue>.json <work>/ops_<cue>.json
ae_run.ps1 -Script jsx/apply_anim.jsx -DataFile <work>/ops_<cue>.json
```
`apply_anim.jsx` is safe to re-run (it restores each layer's resting state first) and works on any mix of PSD layers, live text, shape layers and masked patches. Render 6–9 QC frames: before the first beat (nothing should show early), during two builds (to see the stagger), and the final state (everything exactly where the design put it).

## The motion standard
`choreograph.py` implements this; adjust there if the user wants a different feel.
- **Icon**: ring springs in (scale 0→112→100) → disc +0.07 s → glyph +0.16 s with a rotation settle (−14° → +3° → 0) and overshoot 122 → label rises 22 px and fades in. Glyphs then float gently (±5 px).
- **Hub-and-spoke**: hub first; each satellite flies from 55% of the way toward the hub out to its place.
- **Picture + connector + pill**: picture drops with a small bounce, connector draws out from its starting edge (scale from the left for wide pieces, from the top for tall ones), pill stretches open, then its text fades in.
- **Tables**: panel unfolds from the top, header cells stretch from the left in sequence, header text slides in; per row: cell stretches open, dot pops (140%), text slides in from the left on the spoken word.
- **Groups of small figures**: drop in one after another (0.07 s apart).
- **Background texture**: slow 6% push (an expression, so re-runs don't compound).
- **Native (rebuilt .ai)**: lines draw on in 0.6–0.9 s, arrowheads pop (135%) on arrival; cards pop 105–112%, their icon follows 0.2 s later with a small rotation settle, labels rise last. Scale and opacity keys are relative to the layer's resting values, so a 49%-opacity halo pops back to 49%, not 100%.
