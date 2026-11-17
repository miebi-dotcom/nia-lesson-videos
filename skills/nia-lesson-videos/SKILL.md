---
name: nia-lesson-videos
description: >-
  Builds, reviews and fixes NIA University tutor lesson videos in Adobe After Effects with the NIA template ("NIA motion
  craft.aep", presets in "*all pre set": cover and lower third, pills, yellow wave bar, lists, summary, timeline, NIA
  transitions). Turns a script PDF, the tutor recording and the designer's assets (.ai/.svg, .psd, photos) into a timed
  lesson in the NIA style - script-only on-screen text landing on the spoken words, diagrams rebuilt and animated per
  element with arrows that follow the narration, b-roll with push-ins, varied transitions - then reviews it against the
  NIA style and fixes what the user points at. Use it whenever the user mentions NIA, NIA University, an NIA
  lesson/course code (e.g. CSC_1101, BCS 1104), the NIA template, or asks to build, animate, time, review, "check
  against the training", or fix scenes/arrows/text timing in an NIA video, even without naming the skill. For other
  clients' lessons (MIVA and similar) use building-lesson-videos instead.
---

# NIA lesson videos in After Effects

Builds NIA University lesson videos the way the NIA animators do (learned from three finished NIA lessons and one full
practice build, CSC1101, Nov 2026), on top of the general pipeline of the **building-lesson-videos** skill. That skill
provides the runner, most build scripts and their references; this one adds the NIA look, the NIA preset map, the user's
house rules, and the fixes that the practice build needed. Never edit building-lesson-videos itself.

## Requirements
- Windows, After Effects 2023+ open with the lesson project; the NIA template imported (or open) in it.
- **Both skills installed side by side** in the skills folder. Every AE script, from either skill, runs through the old
  skill's runner, which prepends its `jsx/lib.jsx` helpers:
  ```
  OLD=${CLAUDE_SKILL_DIR}/../building-lesson-videos/scripts
  powershell -NoProfile -ExecutionPolicy Bypass -File $OLD/ae_run.ps1 -Script <script.jsx> -DataFile <data.json> [-Timeout 300]
  ```
  `-Script jsx/<name>.jsx` runs an old-skill script; for this skill's scripts pass the full path
  `${CLAUDE_SKILL_DIR}/scripts/jsx/<name>.jsx`.
- Python 3 with pymupdf, psd-tools, faster-whisper, numpy, pillow; ffmpeg. First use on a machine: the old skill's
  `setup_check.ps1`.
- Work files go in `<lesson folder>/_build/` (cues, transcript, plans, data files, QC frames).

## House rules (from the user; they override the training videos and the old skill's defaults)
1. **On-screen text comes only from the script**: its `Text:` / `Animation:` / `Image:` directions, or text already in an
   asset. Never invent captions, pills, headings or summaries, never rephrase. If a scene seems to need text the script
   lacks, ask. Before adding text or reporting it missing, quote the script row (a cue label you wrote is not script text).
2. **Fix only what the user points at.** A comment on one scene changes that scene. If the same fault is likely elsewhere,
   scan read-only and ask; never re-run every scene as a side effect. A comment that names a behaviour ("arrows go the
   wrong way") fixes that behaviour and lists the scenes touched.
3. **Never move or edit layers the user placed** (their intro at 0, samples). List the layers before any timeline change.
4. **Missing assets are supplied later.** Build with what exists, mark what is missing, carry on.
5. **Build the whole video first, then apply changes.** Don't stop to polish each step.
6. **Never save the project unless asked.** Each script is one undo step; say when a fix takes more than one.
7. **Log every user correction or insight** with a date and [U]/[A] tag in the project's notes file
   (`NIA style study/SKILL-NOTES.md` if it exists, else `<lesson>/_build/NOTES.md`), so this skill can be updated from it.

## Before building: inputs and questions
Get the lesson folder: script PDF, tutor footage, asset folder (`.ai` + `.svg`, `.psd`, `.png`, photos). Then ask, in one
message, only what isn't clear from the files:
- **Cameras**: one wide camera, or a wide + side close-up? The training lessons cut between two angles (wide as the base
  for the whole lesson, close-up inserts on top, set-extension plates in a 3500 px tutor comp); CSC1101 had one camera.
  If two, ask who chooses the close-up moments.
- **Intro**: has the user placed `Intro and Lower third Template` at 0? Tutor's name and role for the lower third?
- **Missing SVGs** for `.ai` diagrams (photo-only `.ai` files have none on purpose).
- Open style choices (offer a default, let the user pick): objectives as numbered list or icon grid; a script sentence
  in a pill vs the wave bar; which transition at each tutor cut.

## Workflow
Copy this checklist into your reply and keep it updated:
```
- [ ] 1. Project probe, NIA presets resolved
- [ ] 2. Script rows, transcript, cues, markers  -> user checkpoint
- [ ] 3. Main comp, intro offset, logo, intro title
- [ ] 4. Scene plan (script text only)           -> user checkpoint
- [ ] 5. Diagram scenes rebuilt and labelled
- [ ] 6. Diagram scenes animated to the narration, arrows audited
- [ ] 7. Text presets, b-roll stills, recap
- [ ] 8. Transitions (varied)
- [ ] 9. Motion polish
- [ ] 10. Review against the NIA style, fixes, report
```

**1. Probe.** `probe_project.jsx` (old). Resolve presets **by name** with `inspect_presets.jsx {"folderId": <"*all pre set">}`:
IDs differ between projects. Preset map and how to fill each one: [references/nia-template.md](references/nia-template.md).

**2. Script, transcript, cues, markers.** Exactly the old pipeline ([building-lesson-videos/references/script-and-markers.md](../building-lesson-videos/references/script-and-markers.md)):
`extract_script.py` → `transcribe.py --terms "<names>"` (start early, in the background) → `cues.json` from the rows →
`align_cues.py --offset <tutor start>` → `add_markers.jsx`. Checkpoint with the user.

**3. Main comp.** `create_main.jsx` (25 fps). After the user places the intro at 0, move the tutor and markers with
`shift_tutor_markers.jsx {"by": <offset>, "keepSourceIds": [<intro id>]}` so the tutor is already underneath when the
intro's wipe reveals it (CSC1101: 8.0 s; not a fixed 10 s). Every marker time = spoken time + offset.
Then `place_logo.jsx` (the persistent logo bug; needed if the intro layer is trimmed) and `set_intro_title.jsx` with the
script's title row. Lower-third name/role stay placeholders until supplied.

**4. Scene plan.** Write `<work>/scene-plan.md`: one row per script row with time, NIA treatment (preset / rebuilt diagram /
b-roll), asset, the **exact script text** (or "none in script"), and the words each element lands on. Use the scene
catalogue in [references/nia-style.md](references/nia-style.md) section 4 for treatments and the timing rules in its
section 3. List open points (missing assets, style choices). Show it before building.

**5. Diagrams: rebuild and label.** Route per asset type, SVG rebuild, Inter labels from the `.ai`, gradient scrims:
[references/diagrams-and-arrows.md](references/diagrams-and-arrows.md) sections 1-4. Place rebuilt comps with
`place_scenes.jsx`.

**6. Diagrams: animate to the narration.** Beats from the transcript (old `choreograph.py` + `apply_anim.jsx`), labels
with `label_cascade.jsx`. Then **audit every diagram's arrows** with `line_audit.jsx` and fix with `retime_scene.jsx`:
arrows grow source → target, only after the source exists, arrowheads land with their lines, targets arrive as the line
lands, stages move with their phrase. Rules and method: diagrams-and-arrows.md sections 5-7. This is the step the user
checks most closely.

**7. Text presets, stills, recap.** `build_scenes.jsx` (old) for pills, wave bars, lists, summary, with the NIA slot
indices in nia-template.md. Photos as full-screen stills with a slow push-in (`place_stills.jsx`; the user converts them to
video later). Where an asset puts art in the logo zone (e.g. recap icons), `logo_hide.jsx`.

**8. Transitions.** Vary them; colour-band wipe only at section breaks; whips between consecutive full-screen assets;
propose per cut, get approval: [references/transitions.md](references/transitions.md).

**9. Motion polish.** The old skill's polish pass on every animated comp (`audit_motion.jsx` → `polish_motion.jsx`,
[motion-polish.md](../building-lesson-videos/references/motion-polish.md)); every image and title gets a real entrance
before its first narrated element; no still frozen for 10 s. Leave the inside of NIA presets alone.

**10. Review and report.** Run the review in [references/review-and-qc.md](references/review-and-qc.md): overview frames,
the checklist, `ost_timing_audit.py` for every overlay, `line_audit.jsx` for every diagram. Write the review file, fix
only what the user approves, report.

## Checking your work
After every build step render frames (`qc_frames.jsx`, new folder each call) and look at them at full size for text and
clipping; tile them to judge timing. Read [references/gotchas.md](references/gotchas.md) (and the old skill's gotchas)
before the first build in a session.

## This skill's scripts
| Script | Does | Status |
|---|---|---|
| `jsx/list_layers.jsx`, `jsx/dump_keys.jsx`, `jsx/line_audit.jsx` | Read-only: layers; key times per layer; arrow direction/arrowhead audit | proven |
| `jsx/retime_scene.jsx` | Re-time a diagram: lines drawn source→target, layers moved to new first-key times | proven (S09a, S12c, S14b) |
| `jsx/retime_text_layer.jsx` | Move a polished overlay onto its words, stretch its hold with time remap | proven (S08) |
| `jsx/set_intro_title.jsx` | Script title on a per-lesson copy of the cover | proven |
| `jsx/fix_labels.jsx` + `labels_from_ai.py` | Outlined glyph labels → live Inter text from the designer's .ai | proven (the .py reproduces the build's S03 data exactly) |
| `jsx/label_cascade.jsx` | Text Animator cascades on every live label/title | proven |
| `jsx/place_scenes.jsx`, `jsx/place_stills.jsx`, `jsx/create_main.jsx` | Place rebuilt comps; stills with push-in; main comp | proven |
| `jsx/fx_whip.jsx` | Whip transitions between consecutive full-screen assets | proven (dry run finds the build's 26 cuts) |
| `jsx/shift_tutor_markers.jsx`, `jsx/place_logo.jsx`, `jsx/logo_hide.jsx`, `jsx/scrim_matte.jsx`, `jsx/make_tight_transition.jsx` | Intro offset; logo bug; logo fade; gradient scrims; tight transition | generalised from proven project scripts, not re-run in this form: QC the first use |
| `ost_timing_audit.py` | Overlay landing time vs its spoken phrase | new |

## Report format
```
## <Lesson code>: <what was done this round>
- Done: <scenes built / fixed, counts>
- Needs you: <tutor name, missing assets, style choices, approvals>
- Script text: <every on-screen text and its script row; anything the script lacks>
- Review: <what matches the NIA style, what doesn't (time, what, severity)>
- Changes outside the plan: <anything else touched, and why>
- Not saved: the project is unsaved; undo steps per fix: <n>.
```

## References
- [nia-style.md](references/nia-style.md): NIA look, palette, fonts, structure, timing rules, 21 scene types with motion.
- [nia-template.md](references/nia-template.md): the NIA preset map and how to fill each preset.
- [diagrams-and-arrows.md](references/diagrams-and-arrows.md): asset routes, SVG rebuild, Inter labels, scrims, beats, arrow rules.
- [transitions.md](references/transitions.md): what to use where; the open transition palette.
- [review-and-qc.md](references/review-and-qc.md): the final review checklist and QC tools.
- [gotchas.md](references/gotchas.md): NIA-specific traps.
- `assets/reference-frames/`: one still per NIA scene type from the training videos.
