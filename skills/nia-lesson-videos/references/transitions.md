# Transitions for NIA lessons

**The user's direction [U, 2026-11-16]:** do not put the same shape wipe at every tutor ↔ graphic cut. That is what the
old skill and the training videos do, and it looks repetitive and unprofessional. Use a varied, motion-graphics-driven
set chosen per moment; keep the signature colour-band wipe for rare, important breaks (a CUT / section change).
**Still open [?]:** the research into professional transition practice and a written palette + selection rules. Until that
is done, propose transitions per cut in the scene plan and let the user approve them.

## What exists and has been used
| Transition | Where | How |
|---|---|---|
| Colour-band wipe (`NIA transition 2`, 7.75 s, bands then yellow/green S-split then reveal) | Section breaks (CUT rows), rarely | Place its full-cover frame on the cut (old skill `place_transitions.jsx`, coverage via `measure_coverage.py`). |
| Concentric arcs, tightened (`NIA Transition 2` → `make_tight_transition.jsx`: fully covered at ~0.76 s, clears by ~1.6 s) | Some tutor ↔ graphic cuts | Same placement. In CSC1101 it was used at all 10 tutor cuts, and the review flagged that as the repetition the user asked to avoid: mix it with other choices. |
| Whip (`fx_whip.jsx`: Motion Tile slide ±640 px + horizontal Fast Box Blur peaking at the cut, ±6 frames) | Between consecutive full-screen b-roll stills / diagram scenes | Adjustment layers sit under the text overlays and the logo so those never whip. Run with `"dryRun": true` first to list the cuts. |
| Straight cut | Between b-roll clips that illustrate a spoken list; between tutor angles | Nothing to place. |

## Seen in the training videos (candidates for the palette)
- Light leak / flash (warm orange-pink leak over a 8-10 frame cross-dissolve): tutor ↔ b-roll, into section titles.
- Slide-up reveal (b-roll slides up and off, about 15 frames, uncovering a navy graphics scene).
- Glitch / pixel dissolve (about 15 frames) between captioned b-roll clips.
- Card moves: full-screen clip shrinks into a card; next card grows from a point (see `nia-style.md` 4.12).
- Tutor plate slides in from the right with a curved edge after the title card.

## Gotchas
- A transition must reach full cover to hide a cut; measure it (alpha when the comp is transparent).
- Template media may be offline in the user's copy: colour bars inside a transition comp mean missing footage, not a bad build.
- Effect property references go invalid after adding a second effect: re-fetch by name before easing. Tile Center and
  Blur Radius take ONE KeyframeEase element. The motion audit flags first-key-out == last-key-in influences as symmetric.
