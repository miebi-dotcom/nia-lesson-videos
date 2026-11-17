"""Anchor an Illustrator file's embedded images to the designer's PNG export.

    python png_anchor.py OUT_DIR [EXPORT.png]      (ai_extract.py runs this itself when FILE.png sits next to FILE.ai)

The PDF-compatible stream inside an .ai can be stale: images (and their clipping masks) may sit hundreds of pixels
away from where Illustrator - and the PNG export - shows them. For every non-background image in elements.json this
finds the image's true position and size in the export (masked colour-difference search, so transparent icons
match too) and, when it differs, moves the image there. A clipping mask is rebuilt as a rounded rectangle over the
moved image, keeping the clip's corner radius and its extent on the axis the image did not move along.
Prints one line per moved image. Requires Pillow and numpy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image


def fftcorr(a, b):
    """valid cross-correlation of 2-D a (big) with b (small)."""
    H, W = a.shape; h, w = b.shape
    s = (H + h, W + w)
    r = np.fft.irfft2(np.fft.rfft2(a, s) * np.conj(np.fft.rfft2(b, s)), s)
    return r[:H - h + 1, :W - w + 1]


def ssd_map(I, T, M):
    """masked SSD over every placement: sum M*(I-T)^2 / sum M. I: HxWx3, T: hxwx3, M: hxw (0..1)."""
    I2 = (I ** 2).sum(2)
    out = fftcorr(I2, M)
    for ch in range(3):
        out -= 2 * fftcorr(I[:, :, ch], M * T[:, :, ch])
    out += (M[:, :, None] * T ** 2).sum()
    return out / max(M.sum(), 1)


def load_template(fn, w, h):
    im = Image.open(fn).convert("RGBA").resize((max(w, 4), max(h, 4)), Image.LANCZOS)
    a = np.asarray(im, dtype=np.float64) / 255.0
    return a[:, :, :3], a[:, :, 3]


def search(P, fn, bb, f, scales, win=None):
    """best (score, x0, y0, w, h) in artboard px; P = export resized to artboard*f."""
    best = None
    for sc in scales:
        w = (bb[2] - bb[0]) * sc; h = (bb[3] - bb[1]) * sc
        tw, th = int(round(w * f)), int(round(h * f))
        if tw < 6 or th < 6 or tw >= P.shape[1] or th >= P.shape[0]:
            continue
        T, M = load_template(fn, tw, th)
        if win:
            x0, y0, x1, y1 = [int(round(v * f)) for v in win]
            x0, y0 = max(0, x0), max(0, y0); x1, y1 = max(0, min(P.shape[1], x1 + tw)), max(0, min(P.shape[0], y1 + th))   # never a negative slice end
            sub = P[y0:y1, x0:x1]
            if sub.shape[0] <= th or sub.shape[1] <= tw:
                continue
            m = ssd_map(sub, T, M); ox, oy = x0, y0
        else:
            m = ssd_map(P, T, M); ox, oy = 0, 0
        iy, ix = np.unravel_index(np.argmin(m), m.shape)
        cand = (float(m[iy, ix]), (ix + ox) / f, (iy + oy) / f, w, h)
        if best is None or cand[0] < best[0]:
            best = cand
    return best


def rrect(x0, y0, x1, y1, r):
    k = 0.5523 * r
    v = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]]
    i = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]]
    o = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]]
    return [{"v": v, "i": i, "o": o, "closed": True}]


def corner_radius(clip):
    sp = clip[0]
    best = 0
    for t in sp["o"] + sp["i"]:
        best = max(best, abs(t[0]), abs(t[1]))
    return round(best / 0.5523, 2) if best else 0


def main(out, png=None):
    ej = os.path.join(out, "elements.json")
    E = json.load(open(ej, encoding="utf-8"))
    if not png:
        png = os.path.splitext(E["file"])[0] + ".png"
    if not os.path.exists(png):
        print("no PNG export next to the .ai - image positions not checked")
        return
    W, H = E["width"], E["height"]
    ex = Image.open(png).convert("RGB")
    f1 = 0.25
    P1 = np.asarray(ex.resize((int(W * f1), int(H * f1)), Image.LANCZOS), dtype=np.float64) / 255.0
    P2 = np.asarray(ex.resize((int(W), int(H)), Image.LANCZOS), dtype=np.float64) / 255.0
    moved = 0
    for e in E["elements"]:
        if e["kind"] != "image" or not e.get("file"):
            continue
        bb = e["bb"]
        if bb[2] - bb[0] >= W - 2 and bb[3] - bb[1] >= H - 2:
            continue
        if e.get("groupOpacity"):          # faded in the export: its pixels cannot match
            continue
        # where the stream says it is: if it already matches, leave it alone
        here = search(P2, e["file"], bb, 1.0, [1.0], win=[bb[0] - 3, bb[1] - 3, bb[0] + 3, bb[1] + 3])
        g = search(P1, e["file"], bb, f1, [0.8 + 0.025 * k for k in range(17)])
        if not g:
            continue
        sc = g[3] / (bb[2] - bb[0])
        fine = search(P2, e["file"], bb, 1.0, [sc * (1 + d) for d in (-0.012, -0.006, 0, 0.006, 0.012)],
                      win=[g[1] - 8, g[2] - 8, g[1] + 8, g[2] + 8])
        g = fine or g
        if here and here[0] <= g[0] * 1.15 + 1e-4:
            continue
        nb = [g[1], g[2], g[1] + g[3], g[2] + g[4]]
        dx, dy = nb[0] - bb[0], nb[1] - bb[1]
        if max(abs(dx), abs(dy)) < 20 and abs(sc - 1) < 0.04:   # small offsets are matching noise, not staleness
            continue
        e["bbStream"] = bb
        e["bb"] = [round(v, 2) for v in nb]
        if e.get("clip"):
            cb = e["clipBB"]
            mx, my = abs(dx) >= 3 or abs(sc - 1) >= 0.02, abs(dy) >= 3 or abs(sc - 1) >= 0.02
            x0, x1 = (nb[0], nb[2]) if mx else (max(nb[0], cb[0]), min(nb[2], cb[2]))
            y0, y1 = (nb[1], nb[3]) if my else (max(nb[1], cb[1]), min(nb[3], cb[3]))
            # a clip that cut the image on an axis keeps cutting it there
            if mx and cb[0] > bb[0] + 3: x0 = max(x0, cb[0])
            if mx and cb[2] < bb[2] - 3: x1 = min(x1, cb[2])
            if not mx and (x1 - x0) < 4: x0, x1 = nb[0], nb[2]
            r = corner_radius(e["clip"])
            e["clip"] = rrect(x0, y0, x1, y1, r)
            e["clipBB"] = [x0, y0, x1, y1]
        moved += 1
        print("%s: moved %+.0f,%+.0f px, scale %.3f (stream position was stale)" % (e["name"], dx, dy, sc))
    json.dump(E, open(ej, "w", encoding="utf-8"), indent=1)
    print("%d image(s) re-anchored to %s" % (moved, os.path.basename(png)))


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    main(*sys.argv[1:])
