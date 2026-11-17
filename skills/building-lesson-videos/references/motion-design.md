# Motion design: finishing every scene to taste

Motion graphics is the heart of this work. Placing presets on markers is only the first pass: every scene should feel designed, timed to the voice, and consistent with the template's own motion language. Read this before building scenes, and run the review at the end on every scene.

## Contents
- Principles
- Numbers that work
- Match the template's motion language
- Scene rhythm with the narration
- Transitions (supplied or created)
- The finish review (run on every scene)

## Principles
1. **Motion follows meaning.** Every element arrives when the tutor introduces it, not before, never all at once. Speech is the timeline.
2. **Hierarchy through order.** Containers first (panel, frame, background), then the main subject (icon, photo, heading), then supporting detail (labels, captions, connectors). The eye should always know where to look.
3. **Overlap, don't queue.** Start the next element while the previous one is settling (offsets of 0.05–0.12 s). Strict one-after-another reads mechanical.
4. **Ease everything, asymmetrically.** No linear moves on screen and no default symmetric Easy Ease. Entrances start fast and land softly; exits start gently and leave fast. Things that "land" (icons, pills, cards) get a small overshoot and settle. Text and lines don't overshoot; they glide.
5. **Settle, then breathe.** After a build, hold still long enough to read (about 0.35 s per word of on-screen text, plus 1 s). Keep a little life in long holds: a slow push on photos and backgrounds, a gentle float on icons, never jitter.
6. **Consistency.** Within a lesson, the same kind of element always moves the same way (all labels rise, all connectors draw from their source, all photos push in). Variety comes from composition, not random motion styles.
7. **Restraint.** One signature move per scene is better than five competing ones. If a scene feels busy, remove motion before adding more.
8. **Exits matter.** Elements that leave mid-scene should leave faster than they arrived (about 60% of the entry time) and in a direction that makes sense (toward where the story goes next).

## Numbers that work
Frames at 24/25 fps (scale for other rates). Curves are the signature curves of references/motion-polish.md: entrances 10% out / 85% in, exits 85/10, on-screen moves 40/85, never the symmetric 33/33 default.

| Move | Duration | Curve | Notes |
|---|---|---|---|
| Icon / card pop | 12–14 f | entrance, overshoot 108–122% | glyph lags its ring by 3–5 f, slight rotation settle |
| Text entrance | 10–15 f | entrance, no overshoot | Text Animator cascade per character/word/line, 20–40 px rise, opacity tied to the move |
| Connector draw-on | 12–20 f | entrance (Trim Paths) | from the source toward the target; arrowhead lands on arrival (6–8 f) |
| Panel / pill stretch | 10–15 f | entrance | from the edge it is anchored to |
| Stagger between siblings | 2–4 f per word, 4–8 f per item | | lists, rows, figures, cards |
| Exit | 60–70% of the entrance | exit | quieter: less distance, no overshoot |
| Photo push-in | whole scene | expression | 5–8% over the scene |
| Background drift | whole scene | expression | ≤ 6% |
| Lead before the word | 0–4 f | | elements land on or just before the spoken word, never after |

`choreograph.py` + `apply_anim.jsx` produce these (keys snapped to whole frames, motion blur on movers). Use them as the reference when you adjust anything by hand, and run the polish pass (references/motion-polish.md) on every scene.

## Match the template's motion language
Before building, watch how the template's presets move (QC frames across a preset's intro, or the showreel): do things slide or scale? From which side? Snappy or soft? Do they use motion trails or chevrons? Your own animation (diagrams, headings you add, transitions you create) should use the same direction, speed and accents, so the video feels like one piece. Note the motion language in the catalogue (one or two lines).

## Scene rhythm with the narration
- A scene starts on its marker; its main element lands with the first key word, its details on theirs.
- Don't let a full-screen graphic outstay the narration about it. If the tutor moves on and the next row is "show the tutor", end the graphic and cut back.
- Very short rows (under ~3 s) rarely deserve a full-screen graphic; prefer an overlay on the tutor or merge with the neighbouring scene.
- Long rows (over ~15 s) need a second beat: reveal remaining items, push in, or highlight the element being discussed, so the screen keeps pace with the voice.
- Overlays on the tutor (text bars, lower thirds) must not cover the tutor's face; keep them in the lower third or to the side the template uses.

## Transitions (supplied or created)
Every cut between the tutor and a full-screen graphic gets a transition whose full-cover frame lands on the cut (references/transitions.md). If the user supplied transition comps, use them. **If not, create them** in the template's style:
```
make_transition.jsx {"name": "TR in iris", "style": "iris", "colors": [<brand colours>], "origin": [0, 1080]}
make_transition.jsx {"name": "TR out panels", "style": "panels", "colors": [<brand colours>], "direction": "left", "skew": 14}
```
- Take the colours from the template (backgrounds, accent bars, brand red/navy...): 2–3 colours, the one that ends on top last.
- Pick a style that echoes the template's motifs: angled panels for templates with chevrons/slants, straight panels for boxy layouts, iris for round/badge-like designs. Match the direction to the template's motion (if bars slide in from the left, panels should travel the same way).
- Use one style for "tutor comes on" and a related but distinct one for "tutor goes off" (e.g. panels in, panels the other direction out; or iris in, panels out). Keep them under ~1.5 s.
- The result reports `cover` (exact full-cover time): pass it as `inCover`/`outCover` to `place_transitions.jsx`.
- Check them in QC like everything else, and tell the user they were created (they may prefer their own).

## The finish review (run on every scene)
Render 4–6 frames per scene (start, mid-build, settled, end) and check each point. Fix before moving on:
- [ ] Every element appears when the narration reaches it; nothing early, nothing late.
- [ ] Build order shows hierarchy (container, subject, detail), with overlapping offsets, not a queue.
- [ ] All moves eased; overshoot only on things that land; text glides.
- [ ] Final state is exactly the design: nothing shifted, clipped, overlapping, or the wrong size.
- [ ] Text fully readable: not clipped by a bar, not missing a line, held long enough to read.
- [ ] Something keeps the long holds alive (push-in or float), never a frozen 10-second still.
- [ ] Same element types move the same way as in the rest of the lesson.
- [ ] The scene leaves when the narration moves on, and the transition hides the cut.
- [ ] Nothing covers the tutor's face; overlays sit where the template puts them.
