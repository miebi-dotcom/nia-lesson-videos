"""Compare a rebuilt scene's render with the reference render of the source file.

    python compare_render.py REFERENCE.png RENDER.png OUT.png

OUT.png stacks reference (top) and render (bottom) at half size, with differing areas outlined in red on the
render. Prints the share of pixels that differ clearly (>40/255) and strongly (>80/255). A faithful rebuild
is typically under ~1.5% (anti-aliasing and font hinting); look at the outlined areas either way.
Requires Pillow and numpy.
"""
import sys
import time

import numpy as np
from PIL import Image, ImageDraw


def flat(p, size=None):
    for _ in range(30):              # After Effects may still be writing a large PNG
        try:
            im = Image.open(p)
            im.load()
            break
        except OSError:
            time.sleep(1)
    im = im.convert("RGBA")
    if size:
        im = im.resize(size)
    bg = Image.new("RGBA", im.size, (0, 0, 0, 255))
    return Image.alpha_composite(bg, im).convert("RGB")


def main(ref, ren, out):
    a = flat(ref)
    b = flat(ren, a.size)
    A, B = np.asarray(a, dtype=np.int16), np.asarray(b, dtype=np.int16)
    d = np.abs(A - B).max(axis=2)
    print("pixels differing >40: %.2f%%   >80: %.2f%%" % ((d > 40).mean() * 100, (d > 80).mean() * 100))
    # outline clusters of strong difference (on a coarse grid)
    g = 24
    h, w = d.shape
    hot = []
    for y in range(0, h, g):
        for x in range(0, w, g):
            if (d[y:y + g, x:x + g] > 80).mean() > 0.12:
                hot.append((x, y))
    half = (a.width // 2, a.height // 2)
    top, bot = a.resize(half), b.resize(half)
    dr = ImageDraw.Draw(bot)
    for x, y in hot:
        dr.rectangle([x // 2, y // 2, (x + g) // 2, (y + g) // 2], outline=(255, 0, 0))
    sheet = Image.new("RGB", (half[0], half[1] * 2))
    sheet.paste(top, (0, 0))
    sheet.paste(bot, (0, half[1]))
    sheet.save(out)
    print(out, "(%d hot cells)" % len(hot))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
