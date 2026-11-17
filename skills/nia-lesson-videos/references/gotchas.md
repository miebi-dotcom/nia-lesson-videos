# NIA-specific gotchas (read before the first build in a session)

The old skill's `building-lesson-videos/references/gotchas.md` still applies (dialogs blocking AE, reserved words,
chained ternaries, IDs over names, etc.). These are the extra traps met on the NIA practice build.

## Project and timeline
- **List the main comp's layers before any move** (`list_layers.jsx`). A shift written for one layer moved the user's
  intro too and had to be undone. `shift_tutor_markers.jsx` takes `keepSourceIds` for the user's layers.
- **The old `organize_timeline.jsx` moves the user's intro below the scenes.** Don't run it on a project with a user
  intro layer (or run it with `dryRun` and check the order first).
- **Moving a layer by `startTime` moves its out point too.** Elements meant to stay to the end of the scene vanished
  early. `retime_scene.jsx` resets the out point; do the same in any ad-hoc script.
- **Removing every time-remap key switches time remapping off** ("property is hidden" error on the next set). Add the
  new keys first, then remove the old ones.
- **A failed script can leave part of its change applied** (it ran up to the error). Say so to the user: undo then takes
  an extra step.
- **Shared nested comps**: the cover comp `cover page 2` is used by the intro, the showreel and the deck. Duplicate
  before editing (set_intro_title.jsx does).
- **Presets are 24 fps, lessons 25 fps.** Check timing when nesting presets.
- **Never save the project unless the user asks.** Each script is one undo step.
- **Only one After Effects version open** at a time (scripts go to the newest running instance).
- Template footage can be offline in the user's copy: colour bars in a preset frame mean missing media.

## Text
- **All Caps** (see `diagrams-and-arrows.md` section 3): ExtendScript-made text can switch it off; text made with the
  higgsfield-ae tools cannot. `style_text` fails inside `ae_batch`: call `ae_style_text` directly; `ae_batch` wants tool
  names without the `ae_` prefix.
- In AE the PostScript names `Inter-Medium` / `Inter-Bold` resolve (Inter comes from Adobe Fonts, not Windows Fonts).
- Setting a text layer's text resets per-character colours: re-apply `characterRange(...).fillColor` after `setValue`.
- The installed SF Fourche shows lowercase as capitals, so titles run wider than the designer's mixed-case PNG.

## Transcription and cues
- faster-whisper (CPU, medium.en) takes about 4 min for 8.5 min of video and mishears names ("Anjiro" for Wanjiru,
  "Pauline" for polling, "sucks" for sacks): pass `--terms`; word times stay reliable. Anchors are fixed by editing the
  cue, not the script.
- Some script `Text:` directions use words the tutor never says: anchor on the spoken words, show the script's text.
- Quiz boxes are skipped. A "CUT" row is a section break.

## Shell
- The bash shell turns `\t` / `\r` in inline python into real tab/CR: build such strings with `chr(9)`/`chr(13)`.
- Python scripts that need numpy/Pillow: run without `-I` when they are your own scripts (it hides user site-packages).
