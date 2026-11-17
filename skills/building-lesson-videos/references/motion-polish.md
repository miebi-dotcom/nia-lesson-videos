# Motion polish: from functional to professionally finished

Review and improve how a built scene MOVES, the way a senior motion designer would. Keep the layout, brand, fonts, colours and content exactly as designed; change timing, curves, text animation and finishing details. Every first build gets this pass (step 10), and so does any comp the user asks you to "polish", "review the animation", or "make it feel better".

## Contents
- Working method (audit → spec → four passes → verify → report)
- The motion system (timing scale, curves, direction, stagger, hierarchy)
- Text animation standard
- Motion principles in After Effects terms
- Attention-to-detail checklist (what the tools check, what you check by eye)
- Constraints
- Report format

## Working method
Work in this order; structure first, detail last, because re-timing after detail work throws the detail away.

1. **Audit first** (read-only): `audit_motion.jsx {"compId": <id>, "outFile": "<work>/audit_<cue>.json"}`. It lists every animated layer (in/out frames, every key with its frame, interpolation and ease influences) and flags checklist problems. Read the counts, open the report for the flagged layers, and note what each animated layer is meant to communicate.
2. **Write the motion spec** for the lesson (5–8 lines in your notes or the catalogue): the timing scale in frames at this comp's fps, the signature curve, entry direction, stagger, what overshoots and what doesn't. Every later fix follows it, so the lesson moves as one system.
3. **Fix in passes**:
   - **Pass 1, timing and choreography**: when things happen, in what order, how long they hold. Re-time in the beats (`choreograph.py`) rather than by hand, so timing stays tied to the narration.
   - **Pass 2, easing and curves**: `polish_motion.jsx {"compId": <id>, "fix": ["snap", "ease"]}` replaces linear keys, default 33/33 Easy Ease and shapeless symmetric eases with the signature curves, and snaps keys to whole frames.
   - **Pass 3, text**: labels and titles enter with a Text Animator cascade, not as a moving block (choreograph `label` beats do this; re-run the beats for text the audit flags `wholeLayerText`). Check hold times (`readTime`).
   - **Pass 4, secondary motion and finish**: `polish_motion.jsx {"compId": <id>, "fix": ["rest", "trim", "blur"]}`, then overshoot/settle, follow-through and arcs where they add life.
4. **Verify**: audit again (aim for zero mechanical issues), render frames at each entrance's start, middle and settle (`qc_frames.jsx`), and compare the settled frame with the design: polish must not move anything at rest.
5. **Report** (format at the end).

## The motion system
**Timing scale.** A few durations, used everywhere (frames at 24/25 fps; scale for other rates):

| Size | Frames | Use |
|---|---|---|
| Micro | 6–10 | highlights, arrowheads landing, dots, accents |
| Standard | 12–18 | text in, cards/icons popping, element entrances |
| Large | 20–30 | scene transitions, big reveals, long connectors |

Exits run at 60–70% of the matching entrance and are quieter (less distance, no overshoot).

**Curves.** Nothing on screen moves linearly unless the motion is mechanical (constant rotation, scrolling). The signature curves (`signatureEase` in `lib.jsx`, used by `apply_anim.jsx` and `polish_motion.jsx`):
- **Entrance** (ease-out: fast start, long soft landing): first key outgoing influence 10%, landing key incoming 85%.
- **Exit** (ease-in: gentle start, fast departure): 85% out, 10% in.
- **Move between two on-screen states**: asymmetric 40% out / 85% in, never the symmetric F9 default.
- Overshoot/settle keys in between: 60% in / 35% out, so the bounce stays soft.
Reuse these so the piece reads as one system; deviate only on purpose (and note it in the spec).

**Direction logic.** Content enters along the reading direction (left to right, bottom to top) or from where it logically comes from (a connector draws from its source, a satellite flies out from its hub), and leaves the way it came or continues forward. One direction scheme per lesson.

**Stagger.** Related elements arrive one after another with a constant offset: 2–4 frames per character group or word, 4–8 frames per line, list item or card. Keep the same offset for the same kind of element across the lesson.

**Hierarchy.** The most important element moves first or with the most emphasis (container, then subject, then supporting detail). Supporting elements move less: shorter distance, smaller scale change, shorter duration.

## Text animation standard
Animate type with Text Animators and Range Selectors, not by keyframing the whole layer, whenever per-character/word/line motion helps reading. `apply_anim.jsx` (`textEntrance`) builds this for every `label` beat on a live text layer:
- Animator "anim text": Position Y +dy (default 22 px) and Opacity 0 as the "from" state.
- Range Selector: **Based On** characters for short labels (≤ 12 characters), words for sentences, lines for 3+ line blocks; **Shape Ramp Up**, **Ease High/Low 50** so the cascade is smooth, not a hard wipe; **Offset** keyed −100 → 100 with the entrance curve, so timing changes in one place.
- Duration 0.4–0.6 s depending on the number of units. Body text must never take longer than 0.6 s to arrive.
- Other entrance styles, for titles only and consistently: soft focus (Blur 8–15 → 0 with opacity; pass `"blur": 10` in the beat's text options), tracking settle (+20–50 → 0; `"tracking": 30`), or a matte reveal behind a line. Randomize Order only for decorative type, never for text that must be read.

**Readability.**
- Text stays still and fully readable for about 0.35 s per word plus 1 s. The audit flags shorter holds as `readTime`. Never animate text while it should be read: no wiggle, drift or loops on body copy.
- Exits are faster and quieter than entrances.
- After the cascade settles, kerning, leading and baseline must be exactly as designed. Check the settled frame.

**Emphasis.** A highlighted keyword (colour, underline, box, scale bump) lands on the spoken word, within ±2 frames (transcript word times). Use a short pop (100 → 105–108 → 100) or a bar drawn on with Trim Paths or a scale from its left anchor.

**Anchor points are deliberate.** Left-aligned text scales from the left, centred titles from the centre, underline bars from their start point. A wrong anchor is a bug: it makes things swing or grow from the wrong place.

## Motion principles in After Effects terms
- **Anticipation**: big moves get a 2–4 frame counter-move before the main action (a card dips 4 px before rising).
- **Overshoot and settle**: things that arrive with energy (cards, icons, pills) pass the target by 5–10% and settle, with at most 1–2 settles. Text and lines don't overshoot; they glide.
- **Follow-through and overlap**: children lag their parent by a few frames (parent to the container, then offset the child's keys, or `valueAtTime(time - delay)`).
- **Arcs**: long position moves travel on a slight arc (spatial bezier handles). Set spatial interpolation to linear when the path should be straight, so auto-bezier doesn't overshoot sideways.
- **Spatial vs temporal**: check both the motion path shape and the speed graph.
- **Separate dimensions** when X and Y need different easing (quick X slide, softer Y settle).
- **Continuity**: one element's exit leads the eye to the next element's entrance. Know where the viewer looks at every moment.
- **Breathing room**: at most 1–2 focal animations at a time; leave holds.

## Attention-to-detail checklist
| Check | Audit flag | Fix |
|---|---|---|
| No accidental linear keys | `linear` | `polish ease` |
| No default symmetric Easy Ease / shapeless eases | `defaultEase`, `symmetricEase` | `polish ease` |
| Keys on whole frames only | `subframe` | `polish snap` |
| No one-frame pops (unless a hard cut is intended) | `pop`, `hardIn` | by hand: give it an entrance, or confirm the cut |
| In/out points tight; no invisible layers lingering | `lingering` | `polish trim` |
| Short opacity ramps, tied to the move (no muddy half-transparent states) | n/a | choreograph does this (opacity full at ~70% of the move); check by eye |
| Motion blur on fast movers, comp switch on (180° shutter) | `noMotionBlur`, `compBlurOff` | `polish blur` |
| Scale settles at exactly 100%; text rests on whole pixels | `restScale`, `restSubpixel` | `polish rest` |
| Same stagger for the same kind of element | n/a | beats (`gap`); check by eye |
| Trim Paths draw-ons eased; round caps where the design uses them | `linear` on Trim | `polish ease`; caps come from the design |
| No collisions or elements passing behind others mid-move | n/a | QC frames mid-move |
| Text inside title-safe (10% margins) | `titleSafe` | report: layout is the designer's call |
| Reveals land on, or 0–4 frames before, the spoken word, never after | n/a | beats (`delay`, phrase choice); check against the transcript |
| Transitions consistent in style and duration | n/a | references/transitions.md |
| Clean last frame of every section (nothing mid-move at a cut) | n/a | QC frame on each cut |
| Text enters with an animator cascade, not as a block | `wholeLayerText` | re-run the `label` beat |

## Constraints
- Keep the design: fonts, colours, layout, brand assets, content and the designer's text box positions.
- Prefer non-destructive changes: keyframes, eases, animators, expressions on control sliders for values that repeat (stagger delay, overshoot amount), so they can be tuned in one place.
- Keep layer names clean and descriptive, and label colours by role (`organize_timeline.jsx` does this in the main comp).
- No new effects or decoration outside the template's style: improve motion, not visual noise.
- If a change would alter meaning or timing against the narration, flag it to the user before applying it.

## Report format
After each pass:
1. **Issues found**: layer, property, frame range, what's wrong.
2. **Fix applied**: the exact change (e.g. "024 text Logistics Co. > Text > anim text > Range Selector Offset: −100→100 over frames 156–168, entrance curve 10/85, Based On Words").
3. **Reasoning**: one line on the principle.
4. **Verification**: frames checked, audit counts before → after.
End with what improved, what remains, and anything that needs a human decision.
