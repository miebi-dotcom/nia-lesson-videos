---
name: building-lesson-videos
description: Assembles e-learning lesson videos in Adobe After Effects from the client's template comps, for two kinds of lesson. Tutor lessons (script PDF + tutor recording + assets) - transcribes locally, marks script cues, fills and times presets to the narration, animates PSD/SVG diagrams per element, places tutor in/out transitions. Slide lessons (Google Vids style, no tutor, no audio) - a slide-deck PDF, the animator's template and images/videos become animated slides timed to read time, with wipes between. Both get a senior motion-design polish pass, an organised timeline and QC frames at every step. Use whenever the user wants to build, animate, time, polish or fix a lesson/course video in After Effects - e.g. "transcribe and add markers", "place the comps to the timestamps", "animate the PSDs", "add the tutor transitions", "build the slide lesson", "turn this Google Vids deck into an AE video", "polish the motion", "tidy the timeline", "catalogue our presets" - even if they don't name the skill.
---

# Building lesson videos in After Effects

Turns a lesson script + tutor recording + assets into a finished After Effects timeline built from the client's template library. The work is done by bundled scripts run inside the user's open After Effects; your job is reading the script, making the creative/placement decisions, running the steps, and checking every result visually.

## Requirements
- Windows, After Effects 2023+ **open with the lesson project** (tutor lessons: the user prepares the cover/intro and the main comp timing first; slide lessons: the animator's template, saved into the lesson folder).
- Python 3 with `pymupdf psd-tools faster-whisper numpy pillow`, ffmpeg, Node.js (optional: syntax-checks scripts before they reach AE). **First use on a machine**: run `powershell -NoProfile -ExecutionPolicy Bypass -File ${CLAUDE_SKILL_DIR}/scripts/setup_check.ps1` (add `-Install` to install what is missing, after asking the user) and fix anything it reports before starting.
- Scripts live in `${CLAUDE_SKILL_DIR}/scripts/`. Keep working files (cues, transcript, plans, QC frames) in a work folder such as `<lesson folder>/_build/` so steps can be re-run.

## Running After Effects scripts
Every AE operation goes through one runner:
```
powershell -NoProfile -ExecutionPolicy Bypass -File ${CLAUDE_SKILL_DIR}/scripts/ae_run.ps1 -Script jsx/<script>.jsx -DataFile <input.json> [-Timeout 300]
```
- Input: write a JSON file (forward slashes in paths); it arrives in the script as `DATA`. Each script documents its input at the top: read that header before use.
- Output: a `toSource()` object with `done`, `warnings`, `errors` plus script-specific fields. Act on `errors` and `warnings`.
- If it times out with no result, After Effects is blocked, almost always by a dialog: ask the user to click OK, then fix the cause (references/gotchas.md).
- Address comps and footage by **item ID** (template projects reuse names). Get IDs from `probe_project.jsx`.
- Each script wraps its changes in one undo group. **Never save the project** unless the user asks.

## Motion design comes first
This is motion-graphics work: the user judges the result on how it moves and feels, not on whether presets sit on markers. Read [references/motion-design.md](references/motion-design.md) before building scenes and match the template's own motion language. Every animated scene then gets the senior motion-designer **polish pass** of [references/motion-polish.md](references/motion-polish.md) (audit, motion spec, timing → curves → text → finish, verify, report): asymmetric signature curves instead of default eases, keys on whole frames, text entering through Text Animator cascades, reads held long enough, motion blur on movers. When something feels flat, busy or mechanical, fix it, even if nothing is technically "wrong".

## House rules (defaults; the user's instructions and the library catalogue override them)
- The user makes the cover page/intro, supplies the tutor's name, and converts photos to videos when wanted: leave those to them and use placeholders ("TUTOR NAME", image holders they can swap into).
- Skip quiz/question boxes in the script. A "Cut" is a section break: a CUT marker, no new intro.
- Use the assets creatively: script directions are the minimum. Turn narrated lists into bullets, time every reveal to the spoken word, give every still photo a slow push-in.
- Keep the tutor visible for long definitions (text box over the tutor, keywords highlighted as spoken) rather than covering them with a full-screen card.
- Animate diagram assets (PSD or Illustrator) **per element** (references/asset-animation.md). Grouped "pop the whole icon" animation is below the bar.
- **Illustrator artwork comes in as SVG.** For every `.ai`, look for a same-named `.svg` beside it; if any are missing, ask the user to export them (settings in references/asset-animation.md) before step 8. The SVG is rebuilt as native layers (`rebuild_check.ps1`): lines draw on with Trim Paths, arrowheads land on arrival, icons and labels stay parented to their cards. Never animate masked crops of the art. Use the `.ai` itself only if the user can't export.
- Text must never be clipped: fit by font size first, reword only as a last resort and say so.
- Ask before deleting or replacing layers the user placed; report anything you changed outside the plan.
- **Leave a timeline a human animator can pick up**: after each build step run `organize_timeline.jsx`, so every scene's placeholder, text, transitions and background sit together, scenes stack as a time-ordered staircase (latest on top), and labels are colour-coded by role (references/scene-building.md).

## Two kinds of lesson: decide first
- **Tutor lesson**: a tutor recording drives the timing. Use the workflow below.
- **Slide lesson** (formerly Google Vids): a slide-deck PDF, the animator's slide template and their images/videos, **no tutor and no audio** (the audio track is added after the video is done). Follow [references/slide-lessons.md](references/slide-lessons.md) instead: it replaces transcription, markers and tutor transitions with read-time timing and slide-to-slide wipes.

Decide from the user's words ("slide lesson", "Google Vids", "no tutor") and from `probe_project.jsx` (`lessonType`: `"tutor"` when a comp holds a long video, `"slides"` when there are slide comps and no long video). Confirm the type with the user in one line when it isn't stated. The tutor-only house rules below (tutor name, keep the tutor visible) don't apply to slide lessons.

## Workflow (tutor lessons)
Copy this checklist into your reply and keep it updated:
```
- [ ] 1. Inputs and project probe
- [ ] 2. Template catalogue (find or build)
- [ ] 3. Script rows extracted, asset issues noted
- [ ] 4. Tutor transcribed
- [ ] 5. Cues aligned, markers on the timeline -> user checkpoint
- [ ] 6. Scene plan -> user checkpoint
- [ ] 7. Scenes built and QC'd
- [ ] 8. Diagram scenes (PSD / SVG) rebuilt per element, animated, QC'd
- [ ] 9. Tutor in/out transitions placed and QC'd
- [ ] 10. Motion polish pass on every animated comp; timeline organised
- [ ] 11. Final pass and report
```

**1. Inputs and project probe.** Get the lesson folder (script PDF, tutor video, asset folder). List the assets: for each `.ai` without a same-named `.svg`, ask the user now to export SVGs (they can do it while you transcribe and mark). Run `probe_project.jsx`: note the main comp ID, the tutor layer (`tutorSourceId`, `startTime` = the offset used everywhere), the preset folder, and existing markers/scenes. If there are several candidate main comps, ask which one.

**2. Template catalogue.** Find a saved `template-catalogue-*.md` (lesson folder, its parent, or this skill's references), or build one with the user. → [references/template-library.md](references/template-library.md)

**3–5. Script, transcript, markers.** Extract rows, transcribe (start it early, in the background: ~6 min), write `cues.json` from the rows using the **spoken** wording, align, add colour-coded markers and a cue sheet. → [references/script-and-markers.md](references/script-and-markers.md). Checkpoint: tell the user what's marked and what looks odd; let them review before building.

**6–7. Scenes.** Plan each row as a scene (preset, asset, text, timing), show the plan, build with `build_scenes.jsx`, then QC every scene and fix. Organise the timeline (`organize_timeline.jsx`). → [references/scene-building.md](references/scene-building.md)

**8. Diagram scenes.** Get one layer per element (PSD: as imported; Illustrator: rebuild the SVG natively, checked against the designer's PNG export, ≤ ~3% difference). Write beats from the narration: for SVG sources, mostly `auto` beats naming the designer's groups (each element animates by type); otherwise draw / pop / label / parents. Generate and apply the choreography, QC across time. → [references/asset-animation.md](references/asset-animation.md)

**9. Transitions.** Use the user's transition comps if supplied; otherwise create on-brand ones with `make_transition.jsx` (motion-design.md). Measure or read each one's full-cover frame and place one per tutor↔graphic cut, then organise the timeline again. → [references/transitions.md](references/transitions.md)

**10. Motion polish.** For every comp you animated (diagram scenes, headings, highlights): `audit_motion.jsx` → write the motion spec → fix in passes (re-time in the beats; `polish_motion.jsx` for curves, whole frames, resting values, tight in-points, motion blur; text cascades for any `wholeLayerText`) → audit again (zero mechanical issues) and check the settled frame is unchanged. Leave the inside of template presets alone: their motion is the template's design. → [references/motion-polish.md](references/motion-polish.md)

**11. Final pass and report.** QC sheet at every scene's settled moment plus every cut; run the finish review (motion-design.md) across the whole lesson (consistency between scenes, pacing against the voice). Run `organize_timeline.jsx` one last time. Then report (template below).

## Checking your work (do this after every build step)
Render frames locally and look at them. Nothing is uploaded:
```
ae_run.ps1 -Script jsx/qc_frames.jsx -DataFile qc.json      {"compId": .., "times": [..], "outDir": "<work>/qc_<step>", "prefix": "S03"}
python ${CLAUDE_SKILL_DIR}/scripts/contact_sheet.py <work>/qc_<step>/sheet.png <work>/qc_<step>/*.png
```
Then read the sheet image. Fix what's wrong before moving on; most first builds need one or two fixes (clipped text, a wrong hold window, a heading collision). → [references/gotchas.md](references/gotchas.md) lists every trap met so far: read it before your first build in a session.

## Report format
```
## <Lesson code>: <what was done this round>
- Done: <scenes built / animated / transitions placed, counts>
- Needs you: <tutor name, image→video swaps, approvals>
- Asset problems: <typos, wrong labels, numbering clashes - with file and layer names>
- Motion polish: <per comp: audit issues before → after, what was re-timed or re-eased, anything left for a human decision>
- Timeline: <organised by scene, label colours; any flips to check>
- Changes outside the plan: <anything replaced or removed, text shortened>
- Not saved: the project is unsaved; each step is one undo.
```
