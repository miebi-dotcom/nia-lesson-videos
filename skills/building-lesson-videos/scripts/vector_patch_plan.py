"""Find what an Illustrator->shapes conversion got wrong, and plan patches for it.

    python vector_patch_plan.py ORIGINAL.png EXPLODED.png LAYERS.json OUT_plan.json [--pad 6]

ORIGINAL.png / EXPLODED.png: the two renders written by explode_vector.jsx (DATA.compareOut).
Converting Illustrator art to shape layers loses embedded images (they become grey boxes) and live text
(it disappears). This compares the renders pixel by pixel, groups the differences into regions, and writes:
  {"patches": [{"name": "patch 01", "bb": [x0,y0,x1,y1]}], "remove": [exploded layers that are wrong]}
Apply with split_regions.jsx: wrong shape layers are deleted and each patch becomes a copy of the original
art layer masked to that region (so photos, icons and text look exactly as designed).
If it reports no patches, the conversion is faithful and the exploded layers can be used as they are.
Requires Pillow and numpy.
"""
import argparse
import json

import numpy as np
from PIL import Image


def components(mask):
    """4-connected components of a boolean array -> list of (x0, y0, x1, y1, pixel_count)."""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    out = []
    ys, xs = np.nonzero(mask)
    for y, x in zip(ys, xs):
        if seen[y, x]:
            continue
        stack = [(y, x)]
        seen[y, x] = True
        x0 = x1 = x
        y0 = y1 = y
        n = 0
        while stack:
            cy, cx = stack.pop()
            n += 1
            x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        out.append((x0, y0, x1 + 1, y1 + 1, n))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("original")
    ap.add_argument("exploded")
    ap.add_argument("layers")
    ap.add_argument("out")
    ap.add_argument("--pad", type=int, default=6)
    a = ap.parse_args()
    o = Image.open(a.original).convert("RGBA")
    e = Image.open(a.exploded).convert("RGBA")
    W, H = o.size
    k = 4  # work at 1/4 size: fast, and differences are regions, not single pixels
    small = (W // k, H // k)
    oa = np.asarray(o.resize(small), dtype=np.int16)
    ea = np.asarray(e.resize(small), dtype=np.int16)
    diff = np.abs(oa - ea).max(axis=2) > 40
    # dilate ~2 px (8 px full size) so letters of one label merge into one region
    m = diff.copy()
    for _ in range(2):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    regions = [r for r in components(m) if r[4] >= 6]
    # merge overlapping boxes
    boxes = [[int(r[0]) * k, int(r[1]) * k, int(r[2]) * k, int(r[3]) * k] for r in regions]
    merged = True
    while merged:
        merged = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                A, B = boxes[i], boxes[j]
                if A[0] <= B[2] and B[0] <= A[2] and A[1] <= B[3] and B[1] <= A[3]:
                    boxes[i] = [min(A[0], B[0]), min(A[1], B[1]), max(A[2], B[2]), max(A[3], B[3])]
                    boxes.pop(j)
                    merged = True
                    break
            if merged:
                break
    p = a.pad
    patches = [{"name": "patch %02d" % (i + 1), "bb": [max(0, b[0] - p), max(0, b[1] - p), min(W, b[2] + p), min(H, b[3] + p)]}
               for i, b in enumerate(sorted(boxes, key=lambda b: (b[1] // 50, b[0])))]
    info = json.load(open(a.layers, encoding="utf-8-sig"))
    remove = []
    for name, v in info.items():
        if v.get("fullFrame"):
            continue
        b = v["bb"]
        area = max(1, (b[2] - b[0]) * (b[3] - b[1]))
        for pt in patches:
            q = pt["bb"]
            ix = max(0, min(b[2], q[2]) - max(b[0], q[0]))
            iy = max(0, min(b[3], q[3]) - max(b[1], q[1]))
            if ix * iy / area > 0.85:
                # inside a patch: the patch shows the true art there; keep the shape only if it is mostly
                # identical in both renders (e.g. a ring around a lost icon)
                bx = [int(b[0] / k), int(b[1] / k), max(int(b[0] / k) + 1, int(b[2] / k)), max(int(b[1] / k) + 1, int(b[3] / k))]
                frac = diff[bx[1]:bx[3], bx[0]:bx[2]].mean() if bx[3] > bx[1] and bx[2] > bx[0] else 0
                if frac > 0.5:
                    remove.append(name)
                break
    json.dump({"patches": patches, "remove": remove}, open(a.out, "w", encoding="utf-8"), indent=1)
    for pt in patches:
        print("  %s  bbox=%s" % (pt["name"], pt["bb"]))
    print("remove (wrong conversions): " + (", ".join(remove) or "none"))
    print("%d patches -> %s" % (len(patches), a.out) if patches else "conversion is faithful: no patches needed")


if __name__ == "__main__":
    main()
