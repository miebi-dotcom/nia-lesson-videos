# Cataloguing a template library

Every client has its own preset library (a folder of template comps in the project, e.g. `#All preset`). Before planning scenes you need to know, for each preset: what it is for, what can be filled (text slots, image slots), and how it animates (build-only vs. animate-out). Catalogue once per library and save it, so later lessons start from the catalogue.

## Contents
- Find a saved catalogue
- Build a catalogue
- What a catalogue entry contains
- Choosing presets for script directions
- Ask the user

## Find a saved catalogue
Look for `template-catalogue-*.md` in the lesson folder, its parent and grandparent folders (catalogues are shared by all lessons of a phase, e.g. `PHASE 11\POST\template-catalogue-mscm.md` for `PHASE 11\POST\SHORT\<lesson>`), any path the user gives, and this skill's `references/` folder. A catalogue is tied to a library, not a project: IDs differ between projects, so **re-resolve IDs** with `probe_project.jsx` / `inspect_presets.jsx` in the current project and match by name + folder.

## Build a catalogue
1. `probe_project.jsx` → find the preset folder (ask the user if unclear) and any showreel/preview comp that plays every preset in sequence (very useful).
2. `inspect_presets.jsx` with `{"folderId": <id>}` → text slots, image slots (with parenting warnings), nested comps, timing and `suggestedFit`.
3. Look at every preset: render QC frames with `qc_frames.jsx` (from the showreel if there is one: in a showreel each preset usually plays from its in-point until the next one starts, with a logo layer over everything; otherwise each preset comp at ~70% of its intro). Image slots are marked by colour-bar test patterns, purple boxes, or "Replace image/asset here" comps, depending on the library; black/transparent areas are where the tutor footage shows through.
4. Write `template-catalogue-<library>.md` in the lesson's parent folder using the entry format below, then **review it with the user**: names are often unclear ("Icon 2 Done use" turned out to mean "don't use"), some presets are retired, and the user knows the intended use of each. Offer to rename confusing comps (by ID) with their approval.

## What a catalogue entry contains
```
### Bullet 6 (dark) / Bullet 6 light
- Use: heading + up to 6 bullets, full screen (light = white background)
- Text slots: heading layer 13; bullets text 12,10,8,6,4,2 with arrow shapes 11,9,7,5,3,1 (pairs)
- Images: none   (otherwise: layer + slot kind - footage / shape / nested, see scene-building.md)
- Timing: build-only (extend). Bullets can be re-timed to speech by shifting each shape+text pair.
- Notes: paragraph boxes ~52pt; AC line reveal - keep bullets to 2 lines
```
Also record brand facts: colours, fonts, logo bug, whether backgrounds animate, and the transition comps to use for the tutor in/out.

Build the catalogue with the user the first time a library is used, then save it next to the lessons so every later lesson reuses it.

## Choosing presets for script directions
Typical mapping (confirm against the library and the user's rules):

| Direction | Good fit |
|---|---|
| Tutor intro | intro/cover comp (the user often builds this) + tutor name lower third |
| On-screen text (short) | text-bar preset over the tutor; several items spoken in a row → stack one bar per item, each appearing on its word |
| Long definition / sentence to read | text box preset over the tutor (tutor stays visible), keyword highlights on the spoken words |
| Heading on its own | text-bar over the tutor, or a full-screen statement preset |
| Bullet list, no image | full-screen bullet preset, bullets timed to speech |
| Short list / points + photo | side-panel-with-bullets preset (panel can exit to reveal the photo at the end) |
| Single photo | general image placeholder (full screen, slow push-in) |
| Two photos compared | two-image preset with heading + caption each |
| People / profiles | profile-frame presets |
| Quote | quote card preset |
| Designed diagram (PSD / AI) | import it and animate per element (references/asset-animation.md) |

Use the assets creatively: a direction is a minimum, not a ceiling (e.g. turn a narrated list into bullets beside the photo even if the script only gives a heading).

## Ask the user
When a library has no obvious preset for a direction, or two presets look equivalent, ask which they prefer and record the answer in the catalogue's rules section so the question isn't asked again.
