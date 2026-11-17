# After Effects gotchas (each one cost real time once)

## Contents
- Running scripts
- Comps, layers and names
- Timing and time remap
- Text
- Images and placeholders
- PSD imports
- Rendering and QC

## Running scripts
- **A syntax error opens a modal dialog in AE and blocks every later script** (and the Higgsfield/MCP bridge) until someone clicks OK. `ae_run.ps1` syntax-checks with Node and lints reserved-word keys first; keep it that way. If AE stops answering and there is no result file, ask the user to look for a dialog and click OK.
- **ExtendScript reserved words cannot be object keys**: `{in: 1}` or `{out: 2}` is a syntax error. Use `inPt`, `outPt`.
- **Old ES3 reserved words cannot be variable names either** (`final`, `int`, `char`, `goto`, `native`, `static`, `public`...): modern JS allows them, so Node's check passes, but AE stops with "Illegal use of reserved word" (a blocking dialog). `ae_run.ps1` refuses such scripts before sending.
- ExtendScript is ES3: no `JSON`, no `let`/`const`/arrow functions, no `Array.prototype.forEach`. Results go out with `toSource()`; input comes in as the injected `DATA` literal.
- Never put placeholder tokens in comments of `lib.jsx`: the runner substitutes them everywhere.
- `-r` scripts queue while AE is busy (rendering, previewing, a dialog open). A 2-minute silence usually means a dialog.
- Wrap every change in one `app.beginUndoGroup` so the user can undo a whole step with one Ctrl+Z.
- **Keep only one After Effects version open.** `-r` scripts go to the newest running instance: with AE 2025 (the lesson) and AE 2026 both open, every script went to 2026, which had opened a "(converted)" copy and sat on Warning / Resolve Fonts prompts, so nothing reached the real project. `ae_run.ps1` prints a note when several AE windows exist; ask the user to close the extra one.
- **No chained ternaries** (`a ? X : b ? Y : Z`): ExtendScript returned `Y` for a true `a` (centre justification came out right-aligned; transitions were classed as text). Use `if/else` or a lookup object. `ae_run.ps1` refuses chained ternaries.
- Regexes with `^` inside an alternation (`/^IN |^OUT /`) are unreliable in ExtendScript: test each anchor separately (`s.indexOf("IN ") === 0`).
- Backslash escapes typed through the shell into a generated script can arrive as raw control characters (a literal CR inside a regex = syntax error). Edit JSX with the file tools, not `sed`/heredocs.

## Comps, layers and names
- **Template projects reuse comp names heavily** (`MPH-logo` x15, `IMAGE_PLACEHOLDER_002` x15). Always address comps by **item ID**. Tools that work by name only (the Higgsfield MCP) hit the first match.
- Use unique scene comp names (prefix with the cue id) so name lookups stay safe.
- `layer.duplicate()` inserts the copy directly above the original and **shifts the indices of every layer below**. Do index-based edits first, duplicate last.
- Swapping an image renames that layer (to the new file name). Address it by index afterwards.
- Layer `parent = null` in a script compensates the transform using the current time; use `setParentWithJump(null)` and then reset the transform explicitly.
- Setting `layer.inPoint` can drag `outPoint` along (the layer keeps its length): store the out point and set it back (`polish_motion.jsx` does).
- Layer motion blur renders only when the comp's Motion Blur switch is on too; `apply_anim.jsx` and `polish_motion.jsx` turn both on.
- Moving layers with `moveToBeginning()` changes compositing for layers that overlap in time: `organize_timeline.jsx` keeps same-role overlapping layers in their old order, lifts transitions above whatever overlaps them, and lists any remaining `flips`.

## Timing and time remap
- **Removing every time-remap key switches time remapping off** (and the property becomes "hidden": `setValueAtTime` then throws). Add the new keys first, then remove the old ones. `lib.jsx: remapFit` does this.
- Keyframe times on layer properties are in **comp time**, not layer time.
- Presets with an animate-out must be fitted with time remap (intro, stretched hold, exit at the end). Presets that only build in can simply be extended. `inspect_presets.jsx` reports which, but **verify the exit visually**: one preset had a stray opacity key at 16.3 s while the real exit ended at 13.45 s, which made the bar leave 3 s early.
- Keys inside a remapped comp (highlights, bullet timing) must be placed at the *remapped* time: `mapThroughRemap`.
- Two markers on the same frame overwrite each other: nudge one by a frame (`add_markers.jsx` does).
- The tutor recording can be 25 fps while the template presets are 24 fps. That is fine; keep the main comp at the recording's rate.

## Text
- **Fixed-width bars**: many lower-bar/text-bar presets have a fixed width. Long text gets clipped by the bar's matte. "Move to increase left/right" nulls may not drive anything (broken expressions). Fit by **reducing font size** (`fitWidth`), shorten the wording only as a last resort and tell the user.
- Some mattes measure 0 px wide via script (animated shape at that time). Size those by eye from a QC frame.
- **Animation Composer text animators reveal per line and can silently drop lines**: a 3-line bullet showed only 2 lines. Keep bullets to what the preset was designed for (usually 2 lines), lower the font a little, and let the paragraph box wrap naturally (no manual `\r`).
- `TextDocument.boxTextSize` is read-only here: a too-small paragraph box can only be fixed by font size.
- Set `justification` (and font, size, leading) on the TextDocument **before** putting multi-line text into it, in the same `setValue`; `rebuild_ai.jsx` creates the layer with "x", styles it, then sets `td.text`.
- New text layers duplicated from a preset keep its animators, so they animate in like the original.

## Images and placeholders
- **Frames and mattes are often parented to the photo layer**, and the photo may start at a negative time (−65.6 s). Rescaling or replacing it with a different-size image moves/shrinks the frame and can make the layer end before the scene starts (blank scene). Swap through a **holder comp** of the old source's exact size and long enough (`-startTime + scene length`), keep scale at its original value, reset in/out. `build_scenes.jsx` does this automatically.
- Do not import the same file twice: reuse existing footage items (`importOnce`).

## PSD imports
- Import PSDs as **Composition** (layers at document size). Every layer then sits at the frame centre with anchor = centre; to scale a piece around itself, set its anchor *and* position to the piece's bbox centre (from psd-tools).
- **Some PSD type layers import as live AE text layers**: their anchor is in text space and they arrive scaled (~59%). Resetting them to 960,540 / 100% throws them into a corner at the wrong size. `apply_anim.jsx` sizes them to the PSD box and anchors them at the text's own centre.
- Typos and wrong labels inside PSD artwork cannot be fixed by script. Report them to the user with the exact layer name.

## Illustrator imports
- **Work from the SVG export** (references/asset-animation.md has the export settings). In SVGs from Illustrator: text style classes can lack `font-family` (the extractor borrows it from the `.ai`); per-letter kerning lives in `letter-spacing` classes that AE does not reproduce, so labels are aligned to the PNG export's ink; text exported as outlines ("Convert to Outlines") arrives as shapes, not editable text, so ask for **Font: SVG**.
- **Rebuild artwork natively (`rebuild_check.ps1`) instead of importing and masking the .ai.** Masked crops broke lines/arrows into pieces and separated icons from their cards.
- **The PDF-compatible stream inside an .ai can disagree with Illustrator**: images 280–720 px off, a clip that cut a photo card to a 118 px strip. Trust the designer's PNG export; `png_anchor.py` re-anchors images to it. Faded images (group opacity) are skipped by the matcher: check them in `compare.png`.
- Illustrator text is often a **variable font** whose PostScript name ("Manrope-ExtraLight") does not say the drawn weight: `ai_extract.py` matches installed static weights by ink density. Text uses ligatures ("Data ﬂow" with U+FB02); layer names keep them.
- **Only top-level Illustrator layers become AE layers.** Many files arrive as "background + everything else". Rebuild instead; explode (`explode_vector.jsx`) only as a fallback.
- Illustrator footage layers report the **whole artboard** as their bounds: measure pieces by rendering (`render_layers.jsx`) or after converting to shapes, never with `sourceRectAtTime` on the footage layer.
- "Create Shapes from Vector Layer" **loses embedded images (grey boxes), live text and some dashes**, and destroys textured backgrounds. Never convert the background layer; always run the fidelity check and patch (`vector_patch_plan.py` + `split_regions.jsx`).
- Artboards can be small (e.g. 480x270): the builder scales the scene to fit and turns on collapse transformations; vector layers get Continuously Rasterize so pops stay sharp.
- After Effects' **Linear Wipe works in each layer's own space**: fine on document-sized PSD layers, wrong on shape layers and masked copies (pieces showed before their beat). Connectors are drawn on with a scale stretch instead.

## Rendering and QC
- `CompItem.saveFrameToPng` renders asynchronously; `renderFrame()` in lib.jsx waits until the file is written (ExtendScript can report a stale 0-byte size, so readers also retry). Frames stay on the machine.
- **Frames follow the comp's preview resolution** (Half/Quarter): QC and measurement renders force Full resolution and restore it, otherwise bounds come out at ¼ scale.
- **Re-rendering into a folder that already holds PNGs can silently produce nothing** (and long waits): every render goes into a fresh folder (`<outDir>_<timestamp>`); the script result reports the actual `outDir`.
- The Higgsfield MCP `ae_export_frame` uploads frames to a public URL (expires in about a day). Prefer local QC for client material.
- Transparent areas render as black in contact sheets.
