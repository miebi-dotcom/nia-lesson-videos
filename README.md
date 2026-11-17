# nia-lesson-videos

A Claude Code plugin with two skills for After Effects lesson videos:

- `nia-lesson-videos` (1.0.0): builds, reviews and fixes NIA University tutor lessons with the NIA template ("NIA motion craft.aep"). It was trained on three finished NIA lessons and the CSC1101 practice build, November 2026.
- `building-lesson-videos`: the general lesson pipeline. The NIA skill runs every After Effects script through this skill's `scripts/ae_run.ps1`, so the two must stay side by side in `skills/`. This is an unchanged copy of the version from 2026-11-17.

## Install on another Claude account
This repository is public for now, so no GitHub sign-in is needed. In Claude Code:

```
/plugin marketplace add miebi-dotcom/nia-lesson-videos
/plugin install nia-lesson-videos@nia-lesson-videos
```

Restart Claude Code. The skills show as `nia-lesson-videos:nia-lesson-videos` and `nia-lesson-videos:building-lesson-videos`.

If that computer already has `building-lesson-videos` or `nia-lesson-videos` in `~/.claude/skills/`, or has the `lesson-video-tools` plugin installed, remove the duplicate so Claude doesn't see two copies.

To get updates later: `/plugin marketplace update nia-lesson-videos`.

If the repo is made private again, that computer must first be signed in to GitHub as the owner (`gh auth login`).

## Requirements
- Windows, with After Effects 2023 or newer open on the lesson project and the NIA template imported.
- Python 3 with pymupdf, psd-tools, faster-whisper, numpy and pillow, and ffmpeg. Run `skills/building-lesson-videos/scripts/setup_check.ps1` once to check the machine.
- In After Effects, turn on *Preferences > Scripting & Expressions > Allow Scripts to Write Files*.

## Updating the skill
Corrections are logged in the project's `SKILL-NOTES.md`. Edit `skills/nia-lesson-videos/`, raise the version in both files in `.claude-plugin/`, then commit and push.
