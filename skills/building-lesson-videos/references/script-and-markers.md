# Reading the script and marking the timeline

## Contents
- Script conventions
- Extract the rows
- Transcribe the tutor
- Write cues.json
- Align and add markers
- Checkpoint

## Script conventions
Lesson scripts are a two-column table: **Transcript/Audio** (what the tutor says) and **Animation/Visual** (what is on screen).

| Visual column says (wording varies by writer) | Meaning |
|---|---|
| Show the tutor / Show Tutor / Tutor on Screen | tutor on screen, no graphic |
| On-screen text: X / Text on screen: X | short text over the tutor - or, when it is a heading/list next to an Animation, the text for that scene |
| Text: / Texts: X | full-screen text graphic (heading, bullets, definition) |
| Animation: / Image: X | scene built from the matching asset |
| Tutor on Screen + Text on screen + Animation in one row | tutor first with the text, then the asset scene when the narration reaches it |
| (empty) | usually the tutor; flag it in the report |

Scripts may start with a metadata table (date, course, author, reviewers, word count) and end with comments, a lesson description, tags, references and an end-of-lesson question table. None of it is narration: `extract_script.py` drops everything before the narration table's header row and from "End-of-lesson questions" / "Comments:" on, and skips pages without a table.

- **Highlight colours link narration to screen**: a phrase highlighted in the narration and an item highlighted in the same colour on screen means "reveal or highlight that item when the phrase is spoken". Scripts may also say so explicitly ("highlighted words should be highlighted in the video").
- **Quiz/question boxes** (large filled boxes, usually purple) are not part of the video: skip them.
- **Cut** followed by a new **Topic** is a section break inside the same recording (the tutor says "welcome back"). Mark it with a CUT marker; no new intro.
- **Assets** are named by scene number + the first words of the narration line: `12a Primary health care.jpg`, `5_A Single Window system.ai`. JPG/PNG alone = photos for image placeholders; PSD or AI = designed diagram layouts to animate (an AI often comes with a same-named PNG: that PNG is just its flattened preview - animate the AI, use the PNG to check fidelity). Watch for duplicated numbers (two "8"s) and match by the words instead.

## Extract the rows
```
python scripts/extract_script.py "<script>.pdf" <work>/script
```
Read `<work>/script/script_rows.md`. Rows that continue on the next page appear as two rows: merge them mentally. Look at the `page_XX.png` renders when the script embeds reference images (they show what the designer intended).

Note problems to report later: asset numbering clashes, labels in assets that don't match the script, missing assets.

## Transcribe the tutor
```
python scripts/transcribe.py "<tutor video>" <work>/transcript.json --terms "<acronyms, names, programme names from the script>"
```
Takes ~6 minutes on CPU for a 9-minute video; run it in the background while you read the script. Then read `<work>/transcript.txt`: check whether the tutor followed the script (retakes, skipped or reworded lines). Anchors must use the **spoken** words.

## Write cues.json
One entry per script row, in spoken order (skip quiz boxes). Use the first 4-6 distinctive spoken words as the anchor. Highlights are the phrases that should appear/emphasise on screen, in spoken order.

```json
[
 {"id": "S01", "kind": "TUTOR", "label": "Show the tutor (tutor name lower third)", "anchor": "hello and welcome to this lesson"},
 {"id": "S02", "kind": "ON-SCREEN TEXT", "label": "How primary healthcare is delivered", "anchor": "in this lesson we will look"},
 {"id": "S03", "kind": "TEXT", "label": "Lesson objectives (6 bullets)", "anchor": "by the end of the lesson",
  "highlights": ["explain nigerias three tier", "the responsibilities of the different", "distinguish primary secondary"]},
 {"id": "S06", "kind": "ASSET", "label": "ASSET 1 (psd): Health services - 3 icons", "anchor": "these services include",
  "highlights": ["health promotion and prevention", "treatment", "rehabilitation and palliative"]},
 {"id": "CUT", "kind": "CUT", "label": "Topic: Roles of the government (show the tutor)", "anchor": "hello and welcome back"}
]
```
Put the asset number and type in the label (`ASSET 9 (psd): ...`): the marker names become the build plan the user reads.

## Align and add markers
```
python scripts/align_cues.py <work>/cues.json <work>/transcript.json <work>/markers.json --offset <tutor startTime>
powershell -File scripts/ae_run.ps1 -Script jsx/add_markers.jsx -DataFile <work>/markers_data.json
```
`markers_data.json` = `{"compId": <main comp id>, "replace": true, "markers": <contents of markers.json>}`.
Fix any "not found" anchor by copying the wording from transcript.txt and rerun; `replace: true` swaps out the previous cue markers.

Marker colours: green = tutor, aqua = on-screen text, red = full-screen text, blue = asset scene, purple = CUT, yellow = highlight (one per phrase, on the spoken frame). Row markers span until the next row.

Also write a cue sheet the user can open (CSV with timecode, duration, cue, highlights) next to the work files.

## Checkpoint
Tell the user the markers are in, how many rows/highlights, the CUT time, and anything odd (rows with no direction, reworded lines, asset issues). Let them scrub the timeline before building scenes.
