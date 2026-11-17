# NIA look, structure, timing and scene catalogue

Learned from three finished human-made NIA lessons (NIA_IS_SC_01, NIA_IS_SC_02, NIA_NDM_SC_01; 1920x1080, 25 fps).
Tags: [M] measured from frames/transcripts, [E] estimated from 12.5 fps frame bursts (durations about ±2 frames), [?] unknown.
Reference stills of each scene type: `assets/reference-frames/` (file name = scene type + source video + mm:ss).

**Read this first: two rules from the user override what the training videos did.**
1. **On-screen text comes only from the script** (its `Text:` / `Animation:` / `Image:` directions, or text already inside an asset).
   The training videos used edited and paraphrased captions and pills; do NOT copy that habit. Never invent pills, captions,
   headings or summaries, and never rephrase the script's wording. A cue label you wrote is not script text: quote the script
   row before adding text or reporting it missing.
2. **Transitions must vary.** The training videos use the colour-band wipe at nearly every tutor cut; the user finds that
   repetitive. See `transitions.md`.

## Contents
- 1 Global look · 2 Lesson structure · 3 Timing against the narration · 4 Scene-type catalogue (4.1-4.21)
- 5 Motion character · 6 Mistakes in the human renders

## 1. Global look

- **Canvas** [M]: navy background with large, soft diagonal wave bands in a lighter navy. The bands look static. Navy is `#0E324D` (darker areas) to `#0E3654` (lighter bands).
- **Palette** [M]:

  | Name | Hex | Used for |
  |---|---|---|
  | Yellow | `#F1BC16` | Main accent: pills, wave bar, headings, quote mark, timeline tags |
  | Green | `#69C392` | Labels and tags, number chips, list dividers |
  | Red | `#DF302C` | Accents, flow-diagram nodes, corner triangles |
  | Cyan | about `#38D8F0` | Corner triangles, wave-bar edge, transition band |

  Text on yellow or green is navy. Text on navy is white, and headings are yellow.
- **Logo** [M]: "nia UNIVERSITY" (multicoloured wave mark plus white wordmark), top right, about x 1625–1835 and y 88–165. It stays on screen over everything, including b-roll and the coloured wipes. It is absent only on the title card, which has its own small logo.
- **Type** [M, from the template]:
  - **SF Fourche** for display: titles, SUMMARY, section titles, the tutor name, headings.
  - **Inter** for text, in Regular, SemiBold, Bold and Italic: pills, body, chips and quotes.
  - **Myriad Pro Italic** for the italic lines: wave-bar text and the cover subtitle.
  - Text presets animate with **Animation Composer** ("AC") animators.
- **Corner triangle** [M]: every rounded image card has a bevelled bottom-right corner filled by a solid right triangle. It is usually yellow, sometimes cyan or red. Inside one sequence of cards, the colour rotates.
- **Nothing sits still** [M]: b-roll is always moving video. Many clips are AI-animated stills (gentle parallax, small morphs). Photos never appear as frozen images.
- **Camera cutting** [M]: every video cuts between two tutor angles. One is a centred **wide** (tutor in an armchair, lounge set). The other is a **side close-up** (tutor framed right, lamp on the left). The cuts happen independently of the graphics, about every 10–40 s, often at a sentence or idea change.
- **How the animators built the cutting** [M, from `TUTOR MAIN` in the imported `NIA_IS_SC_02.aep`]: a 3500×1080 comp.
  - The **wide camera** (`20250903_C87xx`, 4 clips) is the base for the whole lesson, trimmed into many pieces (pause/retake cuts).
  - A **"Front extension.png"** plate extends the set left and right, so the wide can slide sideways (as in the summary layout) without showing an edge.
  - The **close-up camera** (`C04xx`) is laid on top as 7 inserts of about 10–25 s, each with a **"Side extension.png"** plate.
  - The main comp then uses this tutor comp as one layer.

## 2. Lesson structure (same in all three)

1. **Opener, 0–10 s**: a stock or AI clip, then the **title card**. Then a cut to the tutor wide.
2. **Tutor intro** with the **lower third** (about 10 s, during the self-introduction).
3. **Hook**: everyday examples as full-screen b-roll, one clip per example.
4. **Objectives**: in IS_SC_02 and NDM. IS_SC_01 has none.
5. **Body**: tutor (wide or close-up) alternating with graphics scenes, about 20–40 graphics per lesson.
   - Section changes in NDM use **section-title cards**.
   - A "question for you" moment appears near the end of the body.
6. **Summary**: navy panel on the left, tutor on the right, numbered points that appear as spoken.
7. **Recap visuals**: reuses the lesson's earlier graphics.
8. **Outro**: tutor wide with no graphics for the last 10–20 s ("see you in the next lesson").

## 3. Timing against the narration [M, from the transcripts]

- **Things land on the word.** A graphic or text element finishes its entrance on the spoken keyword, or up to about 0.5 s before it. It is never late.
  - "Intelligent systems" pill: 53.1 s.
  - Traits icons land about 0.5 s before each word ("Autonomous" spoken 234.7 s).
  - Summary items appear as each point starts.
- **Build first, then highlight.** In the flow diagram, every node builds while the tutor introduces the idea ("Every system has four things", 84 s). Then each node turns yellow as it is named ("Inputs, processes, outputs and feedback", 88–92 s).
- **B-roll illustrates literally.** Each example gets its own clip, cut about 0–1.5 s after the phrase starts: phone alarm, Google Maps, Spotify, washing machine, traffic light, Siri, Tesla, MYCIN, spam filter, drone and so on.
- **(Training videos only, overridden by the script-text rule above) On-screen text was edited, not verbatim.**
  - Spellings are corrected. The transcript says "Rasser and Novick"; the screen says "Russell & Norvig".
  - Text is rephrased. Spoken "what actually makes *them* intelligent?" becomes on-screen "What actually makes *a system* intelligent?"
  - Wave-bar text is a tidy one-sentence summary of what was said.
- **Holds** [E]: pills stay about 4–5 s. The lower third stays about 10 s. Full-screen graphics stay for as long as the narration is on that idea, often 10–30 s, with items added on later words.
- **Tutor time**: no lesson goes more than about 30 s without the tutor or a graphic changing. The opener and outro are mostly plain tutor.
- **NDM confirms the same rules.**
  - The pills "Resource constraints / Informal markets / Partnership" land as spoken (about 76–80 s).
  - Objectives tiles appear on "1… 2… 3… 4…" (104–126 s).
  - The definition bars land at 138 s and 150 s.
  - The question pill lands at 168 s, with the text corrected: spoken "any of this" becomes "any of these?".
  - Challenge pills land at 605, 619 and 647 s.

## 4. Scene-type catalogue

Durations are in **frames at 25 fps** [E]. Positions are on the 1920×1080 canvas [M].

### 4.1 Title card
- **Trigger**: start of the video, about 1.3–10 s. Example: IS01 0:00–0:10, NDM 0:00–0:05.
- **Layout**: a navy panel (with the wave texture) covers the left ~60%. The title is in 3–4 lines of the display font: the first lines white, the key term yellow. A small "nia UNIVERSITY" logo sits top left of the panel. In NDM, a small course label with a yellow bar sits bottom left. The opener clip keeps playing on the right.
- **In**: the panel slides in from the left with a curved, shadowed leading edge (about 24 f, fast-out / slow-in). The title lines slide in from the left, staggered 3–4 f per line.
- **Out**: the tutor wide slides in from the right as a full-height plate with a curved edge, covering the title in about 10 f. The corner logo appears as it lands.

### 4.2 Tutor lower third
- **Trigger**: the tutor's self-introduction. In IS01 it runs 20.0–31.8 s; the name is spoken at 25.4 s.
- **Layout**:
  - nia wave mark: x 115–222, y 880–980.
  - Name: display caps, white, about 40 px, at x 268, y 905.
  - Title: text font, white, about 30 px, underneath.
  - On the right: a thin yellow vertical line at x 1318, then the course name in italic, white, two lines, at x 1360.
- **In** (about 2.5 s in total): the wave mark draws on stroke by stroke (yellow first, then green, cyan and red, about 20 f). The name wipes on left to right (about 15 f). The title fades up after it. The yellow divider grows, then the course name appears.
- **Out** (about 2.8 s): the reverse. The text wipes off right to left, and the mark un-draws down to a yellow squiggle that shrinks away.

### 4.3 Keyword pill
- **Trigger**: a key term, said over the tutor or over b-roll. Examples: "Intelligent systems", "Traditional system", "Is it intelligent?", "Bias", "The AI Act". The text is sentence case.
- **Layout**: a yellow rectangle with a small downward pointer notch at bottom centre, and bold navy text. It sits bottom centre over the wide (y about 1020–1060), or bottom centre under a card. Width hugs the text.
- **In** (about 8 f): a thin green line appears at full width, a yellow layer follows, then the bar grows upward from that line while the text rises into it through a mask.
- **Out** (about 8 f): it collapses back down to the line and disappears.

### 4.4 Stacked pills (list over the tutor)
- **Trigger**: a spoken list of 2–4 short items. Examples: History / Practical applications / Pressing ethical questions (IS02 1:18); Resource constraints / Informal markets / Partnership (NDM 1:18).
- **Layout**: pills stacked down the left side, top left, over the close-up or the wide. Spacing is about 70–80 px.
- **In**: each pill uses the 4.3 entrance on its own word, about 1–2 s apart. They stay until the list is finished, then all leave together.

### 4.5 Italic question or remark over the tutor
- **Trigger**: a rhetorical question ("What actually makes a system intelligent?", "Question for you!").
- **Layout**: white italic text on the left third of the side close-up, two lines, about 34 px, with a soft shadow. There is no box.
- **In**: words fade in one after another over about 15 f.

### 4.6 Navy panel over the tutor (side text)
- **Trigger**: a list or question discussed while the tutor stays on screen. Examples: "01 Is negotiation in Africa peculiar?" (NDM 4:04); a quote-mark question (NDM 6:02, IS02 8:18); "Crops and livelihoods…" (IS02 7:54).
- **Layout**: a navy panel fades in from the left, covering about 45–50%, with a feathered right edge, over the close-up or the wide. Text is on the left: green "01" chips with white bold text, or a green quote mark with italic text.
- **In**: the panel fades in over about 10 f. The chip pops. The text types on letter by letter (about 12–15 characters/s).

### 4.7 Summary
- **Trigger**: "So let's recap / in summary".
- **Layout**:
  - Navy panel on the left (about 52%) with a feathered edge. The tutor wide is re-framed to the right half by about +28% of the width.
  - "SUMMARY": display font, yellow, about 60 px, at x 137, y 280.
  - Numbered green chips ("01", navy text) at x 137, 98×74 px.
  - Point text: white bold, about 36 px, at x 340.
- **In**: the panel and the tutor shift happen together in about 8 f. The heading glitches or blurs in. The chip pops. The text lines reveal word by word.
- **Later**: each further point (02, 03, 04) is added on its own spoken point.

### 4.8 Objectives grid
- **Trigger**: "By the end of this lesson…". Examples: IS02 1:30–1:57, NDM 1:44–2:15.
- **Layout**:
  - A 3D gold target with a dart on the right (about x 1600, y 590), with "Objectives" in the display font below it.
  - A 2×2 grid of tiles to its left, filled in the order 01 yellow, 02 green, 03 red, 04 yellow. The grid is about 1150×725 px.
  - Each tile has a number ("01."), a small white 3D icon top right, and navy text.
  - The background is navy (IS02) or a darkened, blurred b-roll still (NDM).
- **In**:
  - Target: pops with an overshoot and the label wipes in.
  - Each tile grows in two steps: first a thin bar growing out from the edge it is attached to (about 5 f), then the height opens (about 5 f).
  - Then the number and icon appear and the text types on.
  - Each tile starts on its objective being read.
- **Out**: the whole grid slides up and off in about 10 f.

### 4.9 Flow / process diagram
- **Trigger**: an explained system or process. Example: input → process → output → feedback (IS01 1:23).
- **Layout** [M]: white line icons above tag-shaped pills (one corner cut). Pills are green, red or yellow, with dotted connectors and small node dots. The diagram sits upper centre-left. A small section label sits top left.
- **In**:
  - The b-roll slides up off frame (about 15 f), uncovering the navy scene underneath.
  - Then connectors draw on from source to target, and each node pops (pill, then icon, then a small overshoot).
  - Icons keep moving while on screen (the clock hand rotates).
  - After the build, the pills turn yellow one at a time as each one is named (about 15 f each).
- **Out**: the next b-roll card scales up from a small point on the right while the diagram slides left (see 4.12).

### 4.10 B-roll caption
- **Trigger**: naming what the clip shows. Examples: "The input / The process / Output", "Healthcare", "Transportation", "Smart cities".
- **Layout**: bottom left, x about 60. A thin yellow vertical bar with white text (about 30 px) beside it. It appears on full-screen b-roll or inside a card.
- **In**: the yellow bar grows, then the text wipes in left to right (about 10 f).
- **Out**: with the clip. Within a captioned sequence, clips change with a glitch / pixel-dissolve (about 15 f).

### 4.11 Callouts on b-roll (HUD)
- **Trigger**: explaining parts of what the clip shows. Example: Perception / Reasoning / Action on the thermostat clip (IS01 2:28).
- **Layout**: yellow text boxes with a small grey label and navy text, attached to the object by thin white leader lines that end in a dot. An animated readout ("24°C") is tracked onto the object.
- **In**: the leader line draws on (about 8 f), then the box opens from a thin strip (about 5 f), then the text types on. Each callout is timed to its word, about 8 s apart.

### 4.12 Image cards: full-screen ↔ card, pairs, swaps
Examples: IS01 3:28, IS02 0:12, NDM 1:28.
- **Card**: a rounded rectangle (radius about 45 px) with the bevelled bottom-right corner and corner triangle (section 1). Single cards are about 840×570, centred or left. Pairs are two cards side by side, roughly x 112–978 and 1055–1820.
- **Full → card**: the full-screen clip scales down into the card (about 20 f, fast-out / slow-in). The corner triangle grows in after it lands (about 6 f).
- **Second card**: the first card shrinks and slides left. The new card scales up from a tiny point at the right to its place (about 22 f, the two moves overlapping).
- **Card swap / carousel**: the outgoing card shrinks to a point while the incoming card grows from a point next to it. A caption types in on each new card.
- **Pill under a card**: a keyword pill bottom centre beneath the card (4.3).
- **White variant** (IS02 0:58): a white background with a soft grey swoosh. Tall portrait cards open from thin vertical lines, one per word (Sense / Reason / Learn / Act). Labels alternate green and navy. A wave bar sits underneath.

### 4.13 Card plus numbered list
- **Trigger**: a list tied to one example. Example: Price / Quality / Timelines (NDM 3:10).
- **Layout**: the card on the left, a thin green vertical divider, then green number chips (01, 02, 03) with white text.
- **In**: the full-screen clip shrinks to the card on the left (about 15 f). The divider grows from its centre outwards. Each chip pops and its text types on its word.

### 4.14 Wave definition bar
- **Trigger**: a definition or key takeaway sentence over b-roll. Examples: IS01 2:56, IS02 0:57, NDM 2:20 and 3:48.
- **Layout** [M]:
  - A yellow band across the bottom, top edge at y about 830. On the right it sweeps up in an S-curve; the curve ends near x 1920, y 1010.
  - Text is navy italic, about 38 px, in 1–2 lines, at x 145, y 920, with a thin navy vertical bar at x 122.
- **In**: a cyan strip races in from the left with the curved end leading, then yellow fills behind it (about 18 f). The cyan stays as a thin top edge only while it builds. Text types in word by word (about 25 f per line).
- **Out**: slides down or off when the clip changes.

### 4.15 Quote card
- **Trigger**: a cited definition. Example: Russell & Norvig (IS01 2:13).
- **Layout** [M]:
  - Navy scene, everything left-aligned around x 45–280 at 1/6 scale, which is about x 270–1690.
  - A yellow square quote mark.
  - Quote text: white italic, 3 lines, about 34 px.
  - A thin yellow rule under the quote, with the attribution in small yellow text right-aligned below it.
- **In**: the b-roll slides up and off (about 15 f). The rule draws outwards from its centre (about 8 f). The quote mark pops. The quote lines rise up through a mask one after another (about 3 f stagger). The attribution fades in last.

### 4.16 Icon row ("Traits of…")
- **Trigger**: a list of named properties. Example: Autonomous / Adaptive / Goal-oriented / Interactive (IS01 3:52).
- **Layout**: a small section label top left with a yellow vertical bar. 3D grey/white icons in a row, green tag labels underneath, thin vertical dividers between items. The row is centred on screen.
- **In**:
  - The label's bar appears, then the label wipes in.
  - For each item: a divider grows down, the icon pops (overshoot), then the tag slides out from the left (a yellow edge, then green).
  - The row **re-centres** (slides left, about 10 f) before each new item comes in.

### 4.17 Timeline
- **Trigger**: a history or milestones section. Example: IS02 1:58–3:30, revisited in the recap at 8:26.
- **Layout**:
  - A thin vertical line on the left (x about 300) ending in a ringed dot at the bottom left of the card.
  - A date-range tag (a parallelogram such as "1950 – 1965" with a stripe) at the top of the line.
  - A wide rounded image card (about 1550×740) running right from the line, with a dark gradient at the bottom.
  - Milestones as small dots plus text along the bottom of the card.
- **In**:
  - The line draws down (about 10 f) and the dot appears.
  - The tag wipes in.
  - The card opens to the right from the line (about 15 f).
  - Each milestone's connector draws horizontally and its text types on as it is narrated.
  - Within one era, images cross-dissolve.
- **Era change**: the card slides up and off (about 25 f), the line stays, and the new era's line, dot and tag arrive in the next accent colour (yellow → red → green → cyan → yellow…).

### 4.18 Heading plus paragraph beside an image
- **Trigger**: a series of named categories, each with an explanation. Example: NDM 6:18–9:37 (Funding and investment, Suppliers and distributors, Regulators, Team…).
- **Layout** [M]:
  - Card on the left: x 120–962, y 276–848, with no corner triangle here.
  - Heading on the right in display caps, about 55 px, at x 1060, y 300. Line 1 is yellow, line 2 white.
  - Paragraph: white, about 30 px, line height about 44 px, at x 1065, y 460.
- **In**: the card grows from a small point (about 15 f). The heading letters fade in left to right (about 20 f). The paragraph types on in sync with speech, sometimes in two chunks.
- **Swap to the next category**: the whole group slides up and off (about 15 f, accelerating). The next card grows from a point and the heading fades in.
- **Interleaving**: the tutor close-up cuts in between categories.

### 4.19 Section title card
- **Trigger**: a new major section. Examples: "Common areas of negotiation" (NDM 6:10), "Challenges of negotiating in Africa as an entrepreneur" (NDM 9:56).
- **Layout**: a full-screen photo with a navy duotone and darkened. Centred display caps in two lines, line 1 yellow and line 2 white, with yellow triangular corner brackets top right and bottom left.
- **In**: a yellow square appears in the centre and scales up, then splits into the two corner triangles, which fly diagonally apart. The text is revealed between them, from the centre outwards (about 20 f in total).
- **Getting there**: usually a light leak from the tutor (4.21).

### 4.20 Mind map / branch diagram
- **Trigger**: a breakdown into categories and sub-items. Example: Entrepreneurs → Formal (Bank, Regulators, Investors) and Informal (Family, Community, Local suppliers), NDM 9:40.
- **Layout**: a white root label, thin white elbow connectors with small dots, a forked bracket for each group, and small white icons with labels.
- **In**:
  - The root types on, letter by letter.
  - Each branch draws on (vertical, then horizontal), its label types on, and the fork draws.
  - The sub-items pop in one by one (icon, then label typing).
  - The whole map **reframes** (shifts down) to make room when a new branch is added.

### 4.21 Transitions
- **Colour-band wipe** (the signature transition) [E], about 2.3 s in total:
  - Curved bands sweep in from the bottom left: red, then cyan, then yellow and green filling (about 15 f to full cover).
  - They hold on a yellow/green S-curve split (about 10 f).
  - Then the next shot is revealed through a growing wavy gap between the yellow and green (about 10 f).
  - Use it between a graphics or b-roll block and the tutor, in either direction, and into navy scenes.
  - The logo stays on top throughout.
- **Light leak / flash**: a warm orange-pink light leak over a short cross-dissolve (about 8–10 f). Used tutor ↔ b-roll and into section titles. A one-frame purple flash sometimes comes before it.
- **Slide-up reveal**: b-roll slides up and off, revealing the navy graphics scene underneath (about 15 f).
- **Glitch / pixel dissolve**: between b-roll clips in a captioned sequence (about 15 f).
- **Straight cuts**: between the two tutor cameras, and between consecutive b-roll clips that illustrate a list.

## 5. Motion character (applies to everything)

- **Fast and clean.** Most entrances are 6–20 frames. Nothing floats in slowly except the long holds.
- **Fast-out / slow-in eases.** Things decelerate into place. Pops (icons, targets, nodes) overshoot slightly and settle. Text and lines glide with no overshoot.
- **Growing from a line.** Bars, tiles, pills and cards first appear as a thin line or point, then open to full size.
- **Text** types on (letters or words) or rises up through a mask. It is rarely a plain fade.
- **Exits** are quick and directional: slide up and off, collapse back to a line, or shrink to a point.
- **Re-layout is animated.** When an item is added, the existing group slides to make room: icon rows re-centre, mind maps shift.

## 6. Mistakes in the human renders (don't copy)

- In NDM, the "COMMON DENOMINATORS" heading (4:42–5:06) and the "SUMMARY" heading (11:10–11:50) drift up until they are clipped by the top of the frame.
- The lower third in IS02 names a different person from the tutor on screen. The template text was probably never updated.
