# The NIA After Effects template and how to fill its presets

The NIA template project is `NIA motion craft.aep` (the user opens it, or imports it into the lesson project).
IDs below are from the template copy probed on 2026-11-16; **IDs change between projects: always re-resolve by name**
(`probe_project.jsx`, `inspect_presets.jsx {"folderId": <id of "*all pre set">}`).
Preview frames of every preset: render the showreel comp `3 PReview` with qc_frames.jsx (footage may be offline: image
slots then render as colour bars, text and shapes still render).

## Preset map

**Project layout:**
- `*all pre set` holds the preset library (folder id 3). Its subfolders are 1 cover page and lower 3rd, 2 text bar, 2 text place holders, 3 highlight, 3 transitons, 4 icon place holder, 5 image place holders and 6 back ground.
- `3 PReview` (id 564) is a showreel that plays most presets in order.
- `NIA Official Template Deck` (id 5269) is a container holding every preset.
- `others` contains imported pieces of the animators' own IS_SC_01, IS_SC_02 and IS_SC_03 projects, including `TUTOR MAIN` (`nia-style.md` section 1) and the IS_SC_02 timeline.
- `end` holds 320 support comps (precomps of the presets).
- IDs are from this project. **Re-resolve them by name in any new project.**

**Presets matched to the scene catalogue (`nia-style.md` section 4).** Fit is the skill's `inspect_presets` verdict: *extend* means build-in then static; *remap* means it has an exit, so time-remap it to fit.

| Scene type (`nia-style.md` section 4) | Preset (id) | Slots | Fit |
|---|---|---|---|
| 4.1 Title card | `cover page` (5), `cover page 2` (31). Full intro + lower third: `Intro and Lower third Template` (57) | title text (SF Fourche), subtitle, logo | extend |
| 4.2 Lower third | `Lower Thirds (Name, Role, Topic)` (73), the one used in the videos. A variant with the name in yellow boxes: `… Main` (97) | name, role, topic | remap |
| 4.3 Keyword pill | `Text placeholder` (473) | 1 text | extend |
| 4.10 B-roll caption | `Sub Title Placeholder` (392) | 1 text | extend |
| 4.11 Callouts (HUD) | `text graphic placeholder` (426, 1088×358), `highlights` (532) | 1 text each | remap / extend |
| 4.14 Wave definition bar | `lower text bar 2` (160) yellow; `lower text bar` (142) and `lower text bar 3` (178) are colour variants (yellow and red are both in the showreel) | 1 text | extend |
| 4.15 Quote card | `paragraph centere text quote` (334), `… 2` (354) | quote, attribution | extend |
| 4.6 Navy side panel over the tutor | `Side bar text` (374); `Side bar Quote` (898) with a green quote mark | 2 texts | remap |
| 4.7 Summary | `Summary` (408) | heading + 2 numbered points | remap |
| 4.8 Objectives grid | `Mutiple Vector Placeholders` (724): coloured tiles with icons, up to 3×2 | icons, texts | extend |
| 4.9 Flow diagram (simple) | `Three Icons Placeholders` (744): Perceive → Process → Act | 3 labels | extend |
| 4.12 Image cards, pair → large | `Two Image Placeholder and Large Placeholder` (1060) | 3 images, 1 text | remap |
| 4.13 / numbered lists | `3 style bullet` (231), `text options 1 to 6` (443) | heading + up to 6 numbered items | extend / remap |
| 4.16 Icon row | `Four Icons Unique with Text placeholders` (488): "Traits of intelligent system" | header + 4 icons + tags | extend |
| 4.17 Timeline | `timeline` (938, 110 layers, 16 texts) | era tags, milestones, images | remap |
| 4.18 Heading + paragraph + image | `Image  placement ` (776) | heading 2 lines, paragraph, 1 image | extend |
| Heading + 2 images with captions ("Common denominators") | `image placement 2` (798) | heading, 2 captions, 2 images | extend |
| Heading + large image + caption ("Classification of…") | `image placement 4` (825) | heading, captions | extend |
| 4.19 Section title | `Large text` (276); `Large text 2` (862) "Breaker with transition" | 2 lines | extend / remap |
| Statement card (alternative breaker) | `Page breakers` (122) | 4 texts | extend |
| 4.21 Colour-band wipe | `NIA transition 2` (628, 7.75 s; the wipe used in the videos) | — | — |
| Concentric-arc transition | `NIA Transition 2` (610, 3.2 s) | — | remap |
| Navy background | `blue background` (1080); `white back ground` (1094) | — | — |
| Logo bug | `logo` (5351, 492×181), `logo without text` (5380) | — | — |
| Not seen in the three videos | `Q and A` (196, quiz), `Multiple Options Motion graphics Circle` (304), profile and image grids (648, 665, 682, 703), `side bar small rectangle` (917), `Background overlay` (257), `highlights` (549) | | |

**Notes:**
- The library was extended from the IS lessons. Several presets still hold IS text ("Traditional system", "The input", "Traits of intelligent system", "A system is just parts…", "Classification of intelligent agents").
- The 4.9 flow diagram (input → process → output → feedback), the callouts on b-roll, the full → card shrink and the card swaps were not found as standalone presets. They may be in `end` or built per lesson. → Ask the user when a lesson needs one.

## Filling the presets (learned on CSC1101, 2026-11-16/17)

Use the old skill's `build_scenes.jsx` (one scene per entry; re-running a name replaces it). Indices below refer to the
original preset as `inspect_presets.jsx` reports it: confirm them in the current project before relying on them.

| Preset | How to fill | Notes |
|---|---|---|
| `Text placeholder` (keyword pill) | `"texts": {"2": "<script text>"}`, `"fit": {"mode": "extend"}` | Text lands about 1.4-1.5 s after the layer's start; exit collapses to a line. Sized for 1-4 words: a full sentence makes a bar about 1,780 px wide with 65 px text, about twice the training size. When the script gives a sentence, **ask** whether to use the pill, a smaller pill, or the wave bar (open question). |
| `lower text bar 2` (yellow wave bar) | `"texts": {"2": "..."}`, `"fit": {"mode": "extend"}`, `"fitWidth": {"2": 1300-1500}` for long lines | Matches the training bar exactly. Fine over the tutor or over b-roll. |
| `text options 1 to 6` (numbered list) | numbers: layers 8,7,6 = 01-03 (left column), 5,4,3 = 04-06 (right); item texts 14,13,12 = 01-03, 11,10,9 = 04-06; layer 15 = heading | Use `"fit": {"mode": "extend"}`: `retime` combined with `remap` dropped items 03-05. Disabling the heading leaves the list low with an empty top third: keep a heading if the script gives one, or centre the list. |
| `Summary` | heading + numbered points | remap fit. |
| `Intro and Lower third Template` | The user places it at 0. Cover 0-9.24 s, lower third from 7.36 s (runs about 17 s, over whatever follows), logo from 7.2 s. | Set the title with `set_intro_title.jsx` (script's first `Text:` row). The lower-third name/role stay placeholders ("TUTOR NAME") until the user supplies them. The cover's right half is a green solid until an opener image/video is supplied. |
| `logo` | `place_logo.jsx` (anchor 246,90.5 · position 1730,127 · scale 42% · from 7.2 s to the end) | Needed when the user trims the intro layer (that removes the intro's own logo). Fade it out (`logo_hide.jsx`) where an asset puts art in the logo zone. |
| `NIA Transition 2` (arcs, 3.17 s) | `make_tight_transition.jsx` → tight copy (cover 0.84-1.92 s of source, speed 1.25) | Tutor cuts only, and not at every cut (see `transitions.md`). |
| `NIA transition 2` (colour bands, 7.75 s) | place on its full-cover frame | Keep for rare section breaks (a CUT row). |
| `blue background` | under every rebuilt diagram scene | Navy wave bands; static. |

Not found as standalone presets (build per lesson, or ask): the flow diagram with highlighted nodes, callouts on b-roll, full-screen ↔ card shrink and card swaps.
