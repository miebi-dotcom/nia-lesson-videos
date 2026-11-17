"""Draw every measured layer's box and short name over a rendered frame of the scene, so exploded
Illustrator groups ("Layer 2 007 Group 7") can be matched to what they are (icon ring, label, arrow...).

    python label_layers.py FRAME.png LAYERS.json OUT.png [--scale 1.0]

FRAME.png: a qc_frames.jsx render of the asset comp (final state). LAYERS.json: from explode_vector.jsx
or layer_bboxes.py (comp pixels). --scale: if the frame was rendered at a different size than the comp.
Labels are the layer's number in the file (e.g. 007) so the picture stays readable; the list printed
below the image maps numbers to full names. Requires Pillow.
"""
import argparse
import json
import re

from PIL import Image, ImageDraw

COLOURS = [(255, 80, 80), (80, 220, 120), (90, 160, 255), (255, 200, 60), (230, 110, 255), (60, 230, 230)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frame")
    ap.add_argument("layers")
    ap.add_argument("out")
    ap.add_argument("--scale", type=float, default=1.0)
    a = ap.parse_args()
    info = json.load(open(a.layers, encoding="utf-8-sig"))
    im = Image.open(a.frame).convert("RGBA")
    bg = Image.new("RGBA", im.size, (0, 0, 0, 255))
    im = Image.alpha_composite(bg, im)
    # small artboards: upscale for legibility
    up = max(1, round(1200 / im.width))
    if up > 1:
        im = im.resize((im.width * up, im.height * up))
    k = a.scale * up
    d = ImageDraw.Draw(im)
    items = sorted(info.items(), key=lambda kv: kv[1].get("index", 0))
    for i, (name, v) in enumerate(items):
        if v.get("fullFrame"):
            continue
        b = [x * k for x in v["bb"]]
        col = COLOURS[i % len(COLOURS)]
        d.rectangle(b, outline=col, width=2)
        m = re.search(r"\b(\d{3})\b", name)
        tag = m.group(1) if m else str(v.get("index", i))
        d.rectangle([b[0], b[1] - 12, b[0] + 7 * len(tag) + 4, b[1]], fill=(0, 0, 0))
        d.text((b[0] + 2, b[1] - 12), tag, fill=col)
    im.convert("RGB").save(a.out)
    for name, v in items:
        print("  %-40s bbox=%s%s" % (name, [round(x) for x in v["bb"]], "  (background)" if v.get("fullFrame") else ""))
    print(a.out)


if __name__ == "__main__":
    main()
