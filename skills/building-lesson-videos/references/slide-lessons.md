> **Superseded.** Slide lessons now have their own skill, `slide-lesson-videos` (PDF colours, British English / sentence case / punctuation rules, three quality gates, a lesson spec and ready scripts). Use that skill for any slide lesson. This page is kept only as the original background.

# Slide lessons (no tutor, no audio)

Some lessons have no tutor recording: a slide deck (formerly made in Google Vids) rebuilt in After Effects. Each PDF page becomes one animated slide that builds in, holds long enough to read, then wipes to the next. **There is no audio to time against**: the audio track is added after the video is done, by someone else. Never ask for audio, never transcribe, never place speech markers.

## Contents
- Recognising a slide lesson
- Inputs
- What changes from the tutor workflow
- Workflow
- Timing (measured from a finished lesson)
- Building the slides
- Report

## Recognising a slide lesson
Treat the lesson as a slide lesson when any of these hold, and confirm it with the user in one line before step 2:
- The user says so: "slide lesson", "Google Vids", "no tutor", "the audio is added later".
- `probe_project.jsx` returns `lessonType: "slides"`: no long video layer, but full-frame comps named or foldered "Slide…". It also lists `introOutro`, `transitionComps` and `demoComps`.
- The lesson folder has a slide-deck PDF (one slide per page, large title on each page) and no tutor video.

If the probe finds both a long video and slide comps, ask: the animator's footage can include b-roll clips longer than 60 s.

## Inputs
All of these come from the animator or the lesson folder:
- **Slide PDF**: the content. All on-screen text comes from it.
- **After Effects template**, already open and saved into the lesson folder by the user. Templates differ between programmes: never assume layer numbers or IDs. Get them from the catalogue and the probe.
- **Images and videos** for the slides, named so each can be matched to its slide. Match by the slide/page number in the file name first, then by words from the slide title. List anything unmatched or doubtful and ask. **Do not extract pictures from the PDF** when the animator supplied them.

## What changes from the tutor workflow
| Tutor workflow | Slide lesson |
|---|---|
| 3. script rows (`extract_script.py`) | `extract_slides.py`: per-page title + text blocks |
| 4–5. transcribe, align cues, markers checkpoint | skipped: no audio. The scene plan is the only checkpoint before building |
| Times from the narration | Times from read time (below) |
| 8. PSD / SVG diagrams | only if the animator supplies layered artwork |
| 9. tutor in/out transitions | one template wipe on **every** slide-to-slide cut |
| House rules: tutor name, keep tutor visible, push-in on every still | don't apply. Keep the template's own motion for images |

Still apply: never save, one undo group per step, QC frames after every step, text never clipped, organise the timeline, motion polish on anything you animate yourself.

## Workflow
Use this checklist instead of the main one:
```
- [ ] 1. Inputs, probe, lesson type confirmed
- [ ] 2. Template catalogue (find or build)
- [ ] 3. Slides read, text fixed, images/videos matched
- [ ] 4. Scene plan -> user checkpoint
- [ ] 5. Main comp + intro built and QC'd
- [ ] 6. Slides built and QC'd
- [ ] 7. Wipes placed between slides, outro, QC'd
- [ ] 8. Polish, timeline organised, final pass and report
```

**1. Inputs and probe.** Run `probe_project.jsx`. Confirm the lesson type. List the image/video files.

**2. Template catalogue.** Find a saved `template-catalogue-*.md` for this template, or build one (references/template-library.md) with the slide comps as the "presets". For each slide comp record: card style and background colour, text slots (title, card header, bullets 1–n, course name, any footer) with layer indices from `inspect_presets.jsx`, the image slot (often a nested image comp), and the build timing (when each slot animates in). Also record the intro and outro comps, the wipe comp(s) and how the template's demo/assembled comp layers them (look at it: it is the animator's own example of a finished sequence). Templates can lack layouts a deck needs (e.g. a red card on a beige background, a slide with no card header, a paragraph instead of bullets, icon grids): note each gap, and per slide say how you will cover it (swap the background element, hide the header slot and move bullets up) or ask the user.

**3. Read the slides.**
```
python ${CLAUDE_SKILL_DIR}/scripts/extract_slides.py <slides.pdf> <work>/slides
```
Read `slides.md` and look at the `page_XX.png` renders. Page 1 is normally the intro (lesson title, course name), the last page the outro ("Thank you"). Fix the text against the renders: exports drop letters ("maer" for "matter", "dierent" for "different") and join a note paragraph to the last bullet. Repeated course names and small footers are template slots, not slide content. Match each slide to its image/video.

**4. Scene plan (checkpoint).** One row per page: page, slide comp (by name), background/variant, title, card header, bullets or paragraph, image/video file, duration, and anything the template can't do as-is. Show it and wait for approval. Durations are the user's to change.

**5–6. Build.** See "Building the slides".

**7. Wipes and outro.** Place the template's wipe so its full-cover frame lands on each cut between consecutive slides (measure the cover frame with QC frames, as in references/transitions.md), stacked the way the template's demo comp does it (e.g. a colour band plus a matte layer). There is no bundled script for this yet: write a small one (one undo group, IDs from the probe) and keep it in the work folder. Then the outro.

**8. Finish.** `organize_timeline.jsx`, a QC sheet at every slide's settled moment plus every cut, `audit_motion.jsx` on anything you keyed yourself, then the report.

## Timing (measured from a finished lesson)
Measured from MPH8416_IP_S4_01 (4 min 37 s, about 22 slides). Use these as defaults and show the result in the plan:
- **Wipe**: about 1.5 s, from slide to slide.
- **After the wipe**: the title builds in and is read alone for about 2 s.
- **Cards / bullets**: each builds in over about 1 s, the next starting 0.1–0.3 s after the previous one lands.
- **Settled hold**: 3–6 s on the finished slide before the next wipe. Give text-heavy slides (long paragraphs, references) the long end, and say which slides you lengthened.
- **Wipe to wipe**: 8–20 s per slide, typically about 12 s. The longest (about 20 s) was the first content slide, a long paragraph on one card: text-heavy slides get the time.
- **Intro** (title card): about 9 s before the first wipe. **Outro** ("Thank you"): comes in through a lighter transition, builds, then holds about 6–8 s to the end.

A template's own bullet in-points are often spaced for narration (e.g. 2.2 s apart): tighten them to the rhythm above with `retime` (`[i, i, rel]` for a text-only bullet at layer i), keeping the template's animators.

## Building the slides
1. **Main comp**: `new_main_comp.jsx` with `{"name": "<code> MAIN", "likeId": <demo comp id>, "duration": <sum of the plan + 5>}` → `mainId`.
2. **Every slide is a scene for `build_scenes.jsx`** (references/scene-building.md): `preset` = the slide comp's ID, `t`/`D` from the plan (each slide starts where the previous one's wipe covers the frame), `texts` by layer index from the catalogue, the picture through `images` or `nested` (image slots are usually a nested image comp: the scene gets its own copy), `disable` for unused bullet slots, `fit: {"mode": "extend"}` for build-only slides, `retime` for bullet timing. Name scenes `S<page> <title>`, e.g. `S05 Liberal Feminist Theory`.
3. Build **2–3 slides first**, QC them, fix, then the rest.
4. Videos from the animator go in the image slot like stills; check their length covers the slide (loop or freeze the last frame if not, and say so).
5. Long text: fit by font size (`fitWidth` / `fontSize`), never let it clip the card.

## Report
Use the main report format. Under "Needs you" always list: the audio track is still to be added (not part of this build), any slides whose images were missing or guessed, and the template gaps you worked around.
