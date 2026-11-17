# Diagram scenes: rebuild, labels, gradients, arrows, timing

How NIA diagram assets become animated scenes. The rebuild and choreography tools are the old skill's
(`building-lesson-videos/references/asset-animation.md`: read it for the tool details). This file holds what the NIA
practice build (CSC1101, Nov 2026) added on top, much of it from user corrections.
Tags: [U] the user said it · [A] found while building · [?] still open.

## Contents
1. Which route for which asset
2. Rebuild an SVG
3. Labels: real Inter text
4. Gradients and scrims
5. Beats tied to the narration
6. Arrows: direction and timing (the rules)
7. Checking and fixing a scene (line_audit + retime_scene)
8. Entrances, photo+overlay pairs, hub-and-spoke

## 1. Which route for which asset
| Asset | Route |
|---|---|
| `.ai` with a same-named `.svg` beside it | Rebuild natively from the SVG (`rebuild_check.ps1`), animate per element. |
| `.ai` that only holds a photo (with or without an overlay) | No SVG on purpose: becomes b-roll video later. Until then a still with a slow push-in (`place_stills.jsx`). [U] |
| Layered `.psd` | The old skill's PSD route: import layered, animate per layer (`asset-animation.md`). Not exercised on an NIA lesson yet. [?] |
| PNG only (no SVG, no layers) | Cannot be animated per element: ask the user for the SVG/PSD; a still with push-in meanwhile. |
| Graphs, plots, curves, sign charts (maths lessons) | **Untested on NIA.** Expect curves to draw on with Trim Paths from left to right along the axis, points/dots to pop as named; confirm the approach with the user on the first such scene. [?] |

Match assets by content, not by file name: in CSC1101 `07 Priorities decide.png` was the photo and `... B.png` the diagram. [A]

## 2. Rebuild an SVG
- Text in NIA SVG exports is outlined (paths), so labels are not live text after the rebuild; the designer's `.ai` still
  holds the live text (section 3). Group names (`Layer_35`, `_x30_3_Input_connectors`) are the beat targets. [A]
- Every element must belong to a beat, or it sits on screen from frame 0. [A]
- Put the designer's PNG next to the SVG so the fidelity compare runs. [A]
- Big rebuilds (500+ paths) take about 5 min: run with a long timeout; the runner may report "no result after 300 s" while
  the comp still gets built. [A]
- Two layers with the same name collapse into one entry in layers.json and one stays un-animated: rename duplicates. [A]
- The SVG export carries SF Fourche (the designer did not switch fonts): titles rebuild in capitals and too wide. Shrink
  titles to the designer's width and keep them out of the logo zone (x 1625-1835, y 88-165). [U]

## 3. Labels: real Inter text [U]
Small diagram labels must be readable live text: **Inter Bold** for box/node labels, **Inter Medium** for the rest,
wording and placement exactly as in the designer's asset (the PNG is the reference).
- `scripts/labels_from_ai.py <ai> <compId> <scene> fix_<scene>.json [--dry]` → `fix_labels.jsx` (run dry first).
- Approved sizes (pilot S06): designer size x 0.86, floor 13-16 px; box labels Bold 24 (leading 27), small labels Medium 18,
  subtitle Medium 20. The designer's own sizes were rejected as too big. Text is shrunk to fit its box, never spilled.
- fix_labels moves the old per-glyph shapes into a disabled "<scene> old outlined labels (hidden)" precomp.
- Pitfalls [A]:
  - Do NOT filter glyphs by `sourceRectAtTime` at t=0: boxes that pop from 0% scale report 0x0 and get swept into the
    hidden precomp. Filter by layer name ("<colour> shape WxH" = glyph) or measure at a settled time (`nameFilter`).
  - ai_extract merges side-by-side lines of one text object (table columns, "CPU domain"/"Device domain"): split using
    the PNG / pymupdf per-span boxes before applying.
  - Overlapping labels in the .ai (white text under a yellow highlight): delete or fade the hidden one.
- Then `label_cascade.jsx {"ids":[...], "dyLabel": 14, "dyTitle": 22}`: every live label/title enters with a Text
  Animator cascade (untimed labels take their container's first key + 0.25 s).
- All Caps: set from ExtendScript (`resetCharStyle()` then `allCaps = false`) it stays off. Text made through the
  higgsfield-ae tools inherits the Character panel's sticky All Caps and no tool can switch it off: ask the user to
  untick it (TT) on those layers. [A]

## 4. Gradients and scrims [U]
The SVG rebuild flattens soft gradient panels (the dark side panel that carries chart text over a photo; tinted panels)
into solid rects ("002 black rect"). Any big `none`/`black` rect in a rebuilt comp is a flattened gradient: compare with
the PNG. Fix with `scrim_matte.jsx` (Gradient Ramp solid as LUMA matte; solve x0/x1/opacity from the PNG vs a no-scrim
render). Fade the scrim in before the text and chart items. Linear Wipe does not work on shape layers. [A]

## 5. Beats tied to the narration
- Each element lands on the word that names it, or up to 0.5 s before (training rule, `nia-style.md` section 3).
- Build hierarchy: title → container → subject → detail; overlap starts by 0.05-0.12 s.
- When the narration never names the diagram's elements (CSC1101 S12c), assign groups to build beats by REGION
  (columns/rows of the layout) and tie each region to a spoken phrase; labels land 0.5-1.7 s after their art, never before. [A]
- A diagram that teaches a flow: build the parts first, then highlight each as it is named (training: input → process →
  output → feedback pills turn yellow in turn).
- Long rows (> 15 s) need a second beat; nothing frozen for 10 s.

## 6. Arrows: direction and timing (the rules) [U + A]
The user rejected four CSC1101 diagrams because "the animation does not follow the narration, especially the arrows".
1. **An arrow grows from its source to its target.** Read the path: rebuilt connectors usually START at the source vertex,
   so draw with Trim Start 0, Trim End 0→100. Never assume; the first build used Trim Start 100→0 on such paths, which
   grows out of the arrowhead backwards.
2. **It starts only after its source exists** (source card/row first key + about 0.3 s).
3. **The arrowhead lands with the line**: pop it at the line's end time - 0.08 s. Arrowheads belong to the line, never to a
   card's beat (the first build popped them up to 3 s early or 4 s late).
4. **The target arrives as the line lands** (pop it then, about 0.05-0.55 s after). If the target is a hub not yet named in
   the narration (CSC1101 S03's controller), bring it in as the first arrow reaches it, and say so to the user.
5. **Arrows that belong to a labelled stage move with that stage's phrase** (arcs + arrowheads + icon + label together).
6. Only lines of 40 px or more are connectors; tiny strokes are outlined text. Long spine connectors (400 px+) draw with
   their first beat and take longer (1.4 s); short ones draw at the beat of their later end, 0.8 s.
7. Shared arrowheads (two lines converging on one tip) pop with the first line that arrives.

## 7. Checking and fixing a scene
1. `line_audit.jsx {"comps": ["<scene> native"], "tipRadius": 30}` → per line: verdict (reversed / tip early / tip late /
   check / ok), draw mode and times, both ends and the arrowhead near each end with its pop time.
2. `dump_keys.jsx {"compName": "<scene> native"}` → when every card, label and arrowhead appears.
3. Narration words in the scene's local time (transcript word times + offset - scene start).
4. Write `retime_<scene>.json` and run `retime_scene.jsx`:
   `{"compName": "...", "lines": {"002": [5.5, 0.8]}, "pops": {"005": 6.3, "023": 6.45, "Label - Controller": 6.8}}`
   ("lines" draw from the path's first vertex; "pops" move a layer so its first key is at t; layers that ran to the comp
   end keep running to the end: moving `startTime` alone also moves the out point and made cards vanish.)
5. Re-run line_audit (only expected flags left, e.g. shared arrowheads) and render QC frames every 0.25-0.4 s through the
   scene; check that nothing disappears early.
6. Fix only the scene the user named. If the same fault is likely elsewhere, scan read-only (line_audit) and ask. [U]

## 8. Entrances, photo+overlay pairs, hub-and-spoke [U]
- Every image and title needs a real entrance before the first narrated element (title: text-animator reveal; photo:
  deliberate scale/slide), so a scene never looks static while waiting for its first beat.
- Photo+overlay pairs where both stills carry the overlay: first still photo only; the overlay appears when the narration
  introduces it.
- Hub-and-spoke diagram (CSC1101 interfaces: UART/SPI/I2C/USB/PCIe): hub first, then each spoke name as spoken, then its
  arrow, then its device card. The user asked for this on that one scene: offer it for other hub diagrams, don't impose it.
