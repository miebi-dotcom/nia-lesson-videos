"""Transcribe the tutor recording with word-level timestamps (runs locally, nothing uploaded).

    python transcribe.py VIDEO OUT.json [--terms "CHEWs, CHIPS, Saving One Million Lives"] [--model medium.en]

--terms: key terms / acronyms / names from the script so they are spelled correctly.
Tries the GPU (large-v3) first and falls back to CPU (medium.en, int8; ~6 min for a 9 min video).
Output: [{"start", "end", "text", "words": [{"w", "s", "e", "p"}]}] with times in seconds of the video.

Requires: pip install --user faster-whisper numpy ; ffmpeg on PATH (or installed via winget).
Audio is loaded through numpy because some PyAV builds break faster-whisper's own decoder.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import tempfile
import time
import wave

import numpy as np


def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    hits = glob.glob(os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Packages", "**", "ffmpeg.exe"), recursive=True)
    if hits:
        return hits[0]
    raise SystemExit("ffmpeg not found. Install it (winget install Gyan.FFmpeg) and retry.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--terms", default="")
    ap.add_argument("--model", default="")
    a = ap.parse_args()

    from faster_whisper import WhisperModel

    wav = os.path.join(tempfile.gettempdir(), "lesson_audio_%d.wav" % os.getpid())
    subprocess.run([find_ffmpeg(), "-v", "error", "-y", "-i", a.video, "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    with wave.open(wav) as wf:
        audio = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    os.remove(wav)

    prompt = ("Lesson narration. Key terms: " + a.terms) if a.terms else None
    t0 = time.time()
    attempts = [(a.model or "large-v3", "cuda", "float16"), (a.model or "medium.en", "cpu", "int8")]
    segs = None
    for model_name, device, ctype in attempts:
        try:
            model = WhisperModel(model_name, device=device, compute_type=ctype)
            it, _ = model.transcribe(audio, language="en", word_timestamps=True, initial_prompt=prompt, vad_filter=True)
            segs = list(it)
            print("transcribed on %s with %s" % (device, model_name))
            break
        except Exception as e:  # missing CUDA libraries etc. -> fall back
            print("%s failed (%s), trying next option" % (device, str(e)[:120]))
    if segs is None:
        raise SystemExit("transcription failed on every device")
    out = [{"start": s.start, "end": s.end, "text": s.text.strip(),
            "words": [{"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)} for w in s.words]}
           for s in segs]
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    txt = os.path.splitext(a.out)[0] + ".txt"
    with open(txt, "w", encoding="utf-8") as f:
        for s in out:
            f.write("%7.2f-%7.2f  %s\n" % (s["start"], s["end"], s["text"]))
    print("%d segments in %ds -> %s (+ readable %s)" % (len(out), time.time() - t0, a.out, txt))


if __name__ == "__main__":
    main()
