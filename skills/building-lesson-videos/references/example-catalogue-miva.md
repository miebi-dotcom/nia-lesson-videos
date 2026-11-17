# Example catalogue: Miva Open University "#All preset" library

A finished catalogue, built for the UG template library and used on lesson CHS224_Y2_02_02. Use it as the model for new catalogues. **Item IDs are from that project only**: re-resolve by name + folder in any other project.

## Brand
- Miva Open University: navy, red, white; triangle-pattern backgrounds; MIVA "M" logo bug top-right (white on navy, red on white). Fonts: Manrope (Regular/Medium/Bold/ExtraBold), Agency for names.
- Presets come in navy and white versions. Colour-bar test patterns = image/video slots. Black = transparent (tutor shows through).
- All presets 1920x1080 @ 24 fps; tutor recordings are 25 fps (fine).
- Showreel of every preset: comp "Preview Template".

## User rules recorded with this library
- The user builds the cover/intro and sets the main comp timing before work starts; the user supplies the tutor's name and converts photos to videos when wanted.
- "Cover Page new" is retired: use "Intro Page".
- Tutor name: "Lower Thirds LargeName". Other speakers: "Lower Thirds Small Name".
- Long definition read by the tutor: "Blue Bar Text Placeholder 2" over the tutor (not a full-screen card), keywords highlighted on the spoken word in the script's highlight colours.
- Short list or points beside a photo: "side bar blue bullet points".
- Tutor transitions: "Miva transition" when the tutor comes ON screen (full cover at 0.78 s); "Circles Corner 2-Color" when the tutor goes OFF (full cover at 0.77 s).
- The icon presets ("Icon Dont use", "Icon 2 Done use") may be renamed "Icon Bullets White/Blue" when needed.

## Presets
### Intro Page / INTRO video beginning
- Use: opening title (typed headline) + image slot. Usually prepared by the user.

### Lower Thirds LargeName(Name, Role, Topic) / Lower Thirds Small Name(Name, Role, Topic)
- Use: name, role, topic over the tutor. LargeName = the tutor.
- Text slots (LargeName): name 12, role 11, topic 10.
- Timing: animate-out → remap hold [2.92, 15.17] end 20.75.

### Small text placeholder (dark bar, folder "lower bars", 25 fps)
- Use: short on-screen text over the tutor. Text slot 1.
- Fixed width ~914 px: fit long text by font size (54 → ~43 pt). The "Move to increase" nulls do nothing.
- Timing: trims out → remap hold [1.64, 6.28] end 7.24.

### Small Text placeholder (red ribbon)
- Use: short label over a photo (e.g. role names). Text slot 1, ~61 pt; ribbon ~980 px wide (≈ 42 pt for 35 characters).
- Timing: scales out → remap hold [1.09, 6.29] end 8.29.

### White and Red Small Bar Text Placeholder 3
- Use: short items over the tutor; stack several (110 px apart) appearing one per spoken item. Text slot 2. Matte ~850 px.
- Timing: fades out → remap hold [1.96, 5.54] end 8.62.

### Blue Bar Text Placeholder 2
- Use: a sentence/definition at the bottom over the tutor. Text slot 1 (paragraph box; 44 pt fits ~3 lines).
- Timing: the real exit is a slide at 12.42–13.45 s (ignore a stray opacity key at 16.3 s) → remap hold [1.42, 12.42] end 13.45.

### full screen bar quotes
- Use: a statement on a full-width red bar with a small supporting paragraph. Heading 3 (point text), body 2 (small box: long text needs ~24 pt).
- Timing: build-only.

### text quote (navy) / text quote 2 (white)
- Use: quote card with speaker name and role.

### Bullet 6 (navy) / Bullet 6 light
- Use: heading + up to 6 bullets. Heading 13; bullet text 12,10,8,6,4,2; arrows 11,9,7,5,3,1 (pairs).
- Timing: build-only; re-time pairs to the spoken words; disable unused pairs.

### side bar blue bullet points
- Use: navy panel with up to 3 arrow bullets + photo on the right. Bullet text 2,4,6 (box, 64 pt fits 3 lines); arrows 1,3,5; image layer 8; panel = layer "sidebar".
- No heading layer: duplicate bullet text 2, Manrope-ExtraBold ×1.15, 150 px left / 115 px above (raise another 85 px if it wraps to 2 lines).
- The panel slides out at 4.42–6.42 s revealing the full photo: move position keys 3–4 of "sidebar" and the image layer to the last 2 s of the scene (1.3 s if the last bullet is late).
- AC line reveal: keep bullets to 2–3 lines with natural wrapping.

### SIDE BAR BLUE Use for Tutor and large text
- Use: large text left, tutor/photo right. Text slot 2; image slot 4.

### SIDE BAR for image and text
- Use: paragraph + name/role tag left, photo right. Paragraph 3, tag 4, role 5, image 7.
- Timing: animate-out → remap hold [2.5, 10.58] end 12.62.

### General image place holder
- Use: one full-screen photo. Image slot 3: **frame and matte are parented to it and it starts at −65.6 s → holder comp swap**.
- Timing: slides out → remap hold [1.75, 6.33] end 8.46.

### 2 image placeholder
- Use: two photos with heading + caption each. Headings 2 and 1, captions 4 and 3, images 10 (left) and 7 (right).
- Timing: build-only.

### Profile Frames 3 / Profile Frames 6
- Use: arch-shaped portraits with name and role (3 or 6 people).

### Image placement ... iconic figures with name and quotes
- Use: photo left, title, description and red quote block right.

### Icon Dont use / Icon 2 Done use (Icon Bullets White / Blue)
- Use: four columns of icon cards with short text.

### background blue / background white, Logo
- Base backgrounds and the logo bug.
