"""Measure each layer's bounding box from the solo renders made by render_layers.jsx.

    python layer_bboxes.py LAYERS_DIR OUT_layers.json

OUT_layers.json maps layer name -> {"bb": [x0, y0, x1, y1], "kind": ..., "index": n} in comp pixels,
the same shape psd-tools gives for PSDs, so choreograph.py can use it ("layers": "OUT_layers.json").
Kinds: text (live AE text) | shape (AE shape layer) | vector (Illustrator/EPS/PDF layer) | pixel (other footage).
Layers that render empty are listed and skipped (hidden in the source file, or fully transparent).
Requires Pillow.
"""
import json
import os
import sys

from PIL import Image


def main(d, out):
    man = json.load(open(os.path.join(d, "manifest.json"), encoding="utf-8-sig"))
    res, empty = {}, []
    kind_map = {"text": "type", "shape": "shape", "vector": "vector", "footage": "pixel", "other": "pixel"}
    for m in man:
        p = m["file"]
        if not os.path.exists(p):
            empty.append(m["name"] + " (no render)")
            continue
        im = Image.open(p).convert("RGBA")
        bb = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
        if not bb:
            empty.append(m["name"])
            continue
        name = m["name"]
        if name in res:  # duplicate layer names: keep them distinguishable
            name = "%s #%d" % (name, m["index"])
        full = bb[0] <= 2 and bb[1] <= 2 and bb[2] >= im.width - 2 and bb[3] >= im.height - 2
        res[name] = {"bb": list(bb), "kind": kind_map.get(m["type"], "pixel"), "index": m["index"], "fullFrame": full}
    json.dump(res, open(out, "w", encoding="utf-8"), indent=1)
    for n, v in sorted(res.items(), key=lambda kv: kv[1]["index"]):
        b = v["bb"]
        print("  %3d %-7s %-40r bbox=%s area=%d%s" % (v["index"], v["kind"], n, b, (b[2] - b[0]) * (b[3] - b[1]), "  FULL FRAME" if v["fullFrame"] else ""))
    if empty:
        print("empty / skipped:", ", ".join(empty))
    print("%d layers -> %s" % (len(res), out))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
