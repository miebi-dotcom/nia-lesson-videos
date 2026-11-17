# Final review against the NIA style, and the QC tools

Run this after the build and after every round of fixes. It is the review that caught the CSC1101 problems (2026-11-17).
Render real frames; never judge from small contact-sheet tiles alone (text that looks tiny in a 240 px tile was fine at
full size, while a clipped pill only showed at full size).

## 1. Overview pass
- `qc_frames.jsx` on the main comp every 3 s (172 frames for 8.5 min; run in the background, ~10 min), tile with the old
  skill's `contact_sheet.py` or any tiler, and look at every sheet. Read 4-6 key frames at full size.
- qc_frames into an existing folder silently renders nothing: new folder per call.

## 2. Checklist (each item is something a real build got wrong)
| Check | How |
|---|---|
| Intro cover shows the lesson title, not template placeholder text | Frame at ~4 s. Fix: `set_intro_title.jsx`. |
| Lower third has the real name/role (or the user knows it is still "TUTOR NAME") | Frame at ~12 s. |
| Every on-screen text is the script's wording, nothing invented, nothing missing | Compare each text layer with the script rows (quote the row). A cue label is not script text. |
| Every overlay lands on its words (≤ 0.5 s early, never late) | `ost_timing_audit.py` (below). |
| Diagram arrows grow source → target, arrowheads land with their lines, nothing appears before its source | `line_audit.jsx` per diagram comp + QC frames through the scene. |
| No element disappears before its scene ends | QC frames near each scene's end (moved layers keep their old out point). |
| Nothing covers the logo (x 1625-1835, y 88-165); logo present from the intro to the end | Frames at recap / any top-right art; `logo_hide.jsx` where needed. |
| Text is not clipped, cut by its bar, or drifting out of frame | Full-size frames; the training renders had headings drifting off the top. |
| Pills hold 1-4 words at training size (~30-35 px text, bar hugging the text) | Sentences in a pill are an open question: ask. |
| Transitions vary; the colour-band wipe only at section breaks | List of transition layers on the main comp. |
| No dead screen > ~1 s at a scene start; no frozen still > ~10 s | Overview sheets. |
| Tutor is never alone for more than ~30 s when the script has graphics for that stretch | Overview sheets + scene plan. |

## 3. Overlay timing audit
```
python ${CLAUDE_SKILL_DIR}/scripts/ost_timing_audit.py <work>/transcript.json <work>/ost_check.json --offset <tutor start>
```
`ost_check.json`: one entry per overlay layer from `list_layers.jsx`: `{"layer", "start" (in point), "lands_after"
(pill ~1.4-1.5 s, wave bar ~1.0 s), "phrase", "after" (optional, to skip earlier occurrences)}`. The phrase must START
with the word the text should land on (the scene plan's "land on" words), in the transcript's spelling: the tool
measures from its first word, so a phrase that starts earlier in the sentence reports a false "late".
Tested on CSC1101 (2026-11-17): it found the S16 formula bar landing ~4 s before "Take a 1MB delivery".
Fix early/late overlays without rebuilding them: `retime_text_layer.jsx` (stretches the preset's static middle with
time remapping, keeps its polish).

## 4. Report
Write `<lesson>/REVIEW-<date>.md`: what matches, a table of what does not (time, what, training/rule, severity), smaller
notes; then fix only what the user approves, and append "Fixes applied" to the same file.
