# Building scenes from the markers

## Contents
- Plan first
- The plan file
- Patterns that work
- Build, check, fix
- Timeline layout for human animators
- Placement rules

## Plan first
Write `<work>/scenes.json` from the markers and the catalogue, then show the user a short table (cue, time, preset, asset, text) **before building** unless they asked you to go ahead. Get preset layer indices and timing from `inspect_presets.jsx`, never from memory.

## The plan file
Full field list is in the header of `scripts/jsx/build_scenes.jsx`. Minimal examples:

```json
{"mainId": 4638, "scenesFolder": "CHS224 scenes", "assetsFolder": "CHS224 assets", "holdersFolder": "CHS224 image holders",
 "scenes": [
  {"name": "S03 Lesson objectives", "preset": 519, "t": 23.92, "D": 28.5,
   "texts": {"13": "Lesson objectives", "12": "Explain Nigeria's three-tier health system.", "10": "..."},
   "retime": [[11, 12, 1.0], [9, 10, 4.6]], "disable": [1, 2]},
  {"name": "S05 Blue bar definition", "preset": 4049, "t": 56.04, "D": 20.66,
   "fit": {"mode": "remap", "hold": [1.42, 12.42], "end": 13.45},
   "texts": {"1": "Primary health care delivery refers to ..."}, "fontSize": {"1": 44},
   "highlights": [{"layer": 1, "phrase": "comprehensive", "t": 61.96, "color": [1, 1, 0]}]},
  {"name": "S10 Outreach (asset 4)", "preset": 4100, "t": 116.12, "D": 13.78,
   "fit": {"mode": "remap", "hold": [1.75, 6.33], "end": 8.46},
   "images": {"3": "D:/.../4 But not everyone.jpg"}, "pushIn": 0.07},
  {"name": "S06 Health services (asset 1)", "layered": "D:/.../1 These services include.psd", "t": 76.7, "D": 7.58},
  {"name": "S07 Eto system (asset 3)", "preset": 8228, "t": 120.0, "D": 12, "fillShape": {"8": "D:/.../3_A digital port uses.png"}, "pushIn": 0.07},
  {"name": "S14 Sustainability (asset 9)", "preset": 8331, "t": 300.0, "D": 10, "nested": {"2": {"images": {"2": "D:/.../9_Sustainability is also.png"}}}, "pushIn": 0.07},
  {"name": "S09 OST Health posts", "preset": 4034, "t": 107.08, "D": 9.04,
   "fit": {"mode": "remap", "hold": [1.96, 5.54], "end": 8.62}, "texts": {"2": "Health posts"}, "fitWidth": {"2": 780}, "dy": -220}
 ]}
```
- `t`/`D`: from the row marker (start, duration) or a highlight marker (for items that appear on a word).
- `retime` rel times: highlight time − scene start − 0.15 s (text lands just as the word is spoken). Never earlier than the preset's own panel/heading arrival.
- `highlights[].t` and `retime` use the marker times from markers.json; the builder maps them through any time remap.
- Re-running with the same scene `name` replaces that scene, so iterate freely.
- Layer indices always refer to the original preset as `inspect_presets.jsx` reports it.

### Image slots: three kinds (inspect_presets.jsx reports which)
| Slot | Looks like | Plan key |
|---|---|---|
| footage layer (a photo/colour-bar image, often with a matte or a parented frame) | `images: {"idx": file}` - holder comp used automatically when frames are parented to it |
| shape layer (purple box, or named "Replace Image here"; also unnamed white/rounded squares in grids) | `fillShape: {"idx": file}` - photo goes under the shape, shape becomes its matte; sized to the largest extent the shape reaches |
| nested comp (e.g. "Replace asset here") shared by several presets | `nested: {"idx": {"images": {...}, "fillShape": {...}, "texts": {...}}}` - the scene gets its own copy of the nested comp first |
Never edit a shared nested comp in place: every scene using it would change. Confirm slots against the preset's preview frame: inspection can miss unnamed placeholders and can flag text mattes as slots.

## Patterns that work
- **Overlay names contain " OST "** (e.g. `S02 OST How PHC is delivered`): the transition placer uses that to know the tutor is still visible.
- **Name every layer with its scene id first** (`S07 OST ...`, `S07a Filmed (asset 4a)`): the timeline organiser groups by that prefix (markers are the fallback).
- **Tutor name lower third** at the first tutor row, ~8 s, placeholder "TUTOR NAME" until the user supplies it.
- **Several short items spoken in a row** → one bar per item, `t` = its highlight, all ending at the row end, stacked with `dy` (−220, −110, 0).
- **Definition / long sentence** → text box over the tutor + `highlights` per keyword (script colours by default: yellow [1,1,0], green [0,1,0], cyan [0,1,1], magenta [1,0,1]).
- **List or points + photo** → side-panel bullets preset: `retime` bullets to speech, `heading` copied from a bullet, `moveKeys` to push the panel exit to the scene end. If the script gives only a heading but the narration lists points, write short bullets from the narration and tell the user they came from the narration.
- **Bullet list without a photo** → full-screen bullet preset, bullets re-timed, unused pairs disabled.
- **Photos** → `pushIn: 0.07` everywhere: no still image should sit frozen.
- **Diagram assets (PSD or AI)** → `"layered"` scene here, then animate per layer (references/asset-animation.md). Small Illustrator artboards are scaled to fit and kept sharp (collapse transformations).

## Build, check, fix
```
powershell -File scripts/ae_run.ps1 -Script jsx/build_scenes.jsx -DataFile <work>/scenes.json -Timeout 300
```
Then QC every scene: `qc_frames.jsx` on the main comp at each scene's settled moment (≈ start + 70% of its intro, and once near its end), tile with `contact_sheet.py`, and look. Check:
- text fully visible (not clipped by a bar, not missing a line), sensible size
- photos fill their frames (not small, not offset, not blank)
- bullets appear when spoken; nothing exits before the narration moves on
- overlays are on top of the right things

Fix in the plan and rebuild only the affected scenes (a plan file with just those scenes). Typical fixes: `fitWidth`/`fontSize` for clipped text, holder issues (gotchas.md), wrong hold/end (look at the preset across time), heading `dy`.

## Timeline layout for human animators
Animators pick these projects up after you, so the main comp must read the way they lay it out by hand: each scene's image placeholder, text, transitions and background **together**, scenes stacked as a **staircase** in time order (latest scene at the top of the stack, earliest just above the tutor), and layers colour-coded by role. Builders add layers on top in step order (all transitions together, all text together), so after every build step (scenes, diagrams, transitions) run:
```
ae_run.ps1 -Script jsx/organize_timeline.jsx -DataFile <work>/organize.json      {"mainId": <main comp id>}
```
- Inside a scene, top to bottom: transitions, text/overlays, pictures/graphics, background. Long base layers (tutor footage, full-length backgrounds) stay at the bottom.
- Label colours: transitions orange, text yellow, pictures blue, backgrounds brown, tutor green, cover purple (`labels` overrides).
- Transitions are renamed `S07 TR tutor>graphic` / `S07 TR graphic>tutor` and are lifted above anything that overlaps their wipe, so they always cover the cut.
- It moves layers only: no timing or visibility changes. Its `flips` list names any overlapping pair whose stacking order changed (normally none). If it reports some, check those moments in QC.
- Run `"dryRun": true` first on a project you haven't organised before, and read the order it reports.

## Placement rules
- Never delete or alter the user's own layers without asking; if the user dropped a template on the timeline as an example, say you'll replace it with a filled copy. Re-stacking them with `organize_timeline.jsx` is expected (it changes order only, never timing or content).
- Leave the tutor layer and the user's intro untouched.
- One undo group per build run; never save the project unless asked.
