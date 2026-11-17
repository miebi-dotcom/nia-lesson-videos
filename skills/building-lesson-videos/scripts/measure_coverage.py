"""Find when a transition fully covers the screen, from frames rendered with qc_frames.jsx.

    python measure_coverage.py FRAMES_DIR [--prefix TR]

Prints the opaque fraction of each frame (file names carry the time, e.g. TR_0000078.png = 0.78 s)
and the best cover time. Render ~15 frames across the transition first, then refine around the peak.
A transition is only usable to hide a cut if some frame reaches ~1.00.
Requires Pillow.
"""
import argparse
import glob
import os

from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frames_dir")
    ap.add_argument("--prefix", default="")
    a = ap.parse_args()
    rows = []
    for p in glob.glob(os.path.join(a.frames_dir, a.prefix + "*.png")):
        try:
            t = int(os.path.splitext(os.path.basename(p))[0].rsplit("_", 1)[1]) / 100
        except (IndexError, ValueError):
            continue
        im = Image.open(p).convert("RGBA").resize((240, 135))
        alpha = im.getchannel("A")
        hist = alpha.histogram()
        opaque = sum(hist[200:]) / (240 * 135)
        rows.append((t, opaque))
    if not rows:
        raise SystemExit("no frames found")
    rows.sort()
    for t, o in rows:
        print("%6.2fs  %.2f  %s" % (t, o, "#" * int(o * 40)))
    best = max(rows, key=lambda r: (r[1], -abs(r[0])))
    print("best cover: %.2fs (%.2f opaque)%s" % (best[0], best[1], "" if best[1] > 0.98 else "  <- never fully covers: not safe to hide a cut"))


if __name__ == "__main__":
    main()
