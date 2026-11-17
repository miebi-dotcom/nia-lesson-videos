"""Read an Illustrator (.ai, PDF-compatible) file into native elements for rebuild_ai.jsx.

    python ai_extract.py FILE.ai OUT_DIR

Writes OUT_DIR/elements.json and OUT_DIR/img_*.png (embedded images with their transparency) and
OUT_DIR/reference.png (the file rendered flat, for the fidelity check). Elements, in paint order:
  path : subpaths (vertices + bezier tangents), fill / stroke (colour, opacity, width, caps, joins, dashes)
  text : one block per paragraph (lines joined), font PostScript name, size, colour, justification,
         baseline anchor, leading
  image: extracted PNG, bbox, rotation
Any element may also carry "groupOpacity" (Illustrator transparency-group opacity) and "clip" (the subpaths of
the clipping mask that cuts it, in artboard coordinates) - rebuild_ai.jsx turns those into opacity and masks.
Each element gets a readable name and its Illustrator layer (OCG) when the file has layers.
Gradients/shadings cannot be rebuilt as paths: they are reported as "shade" with their bbox so the
rebuild can fall back to a raster crop for that region only.
When FILE.png (the designer's export) sits next to FILE.ai, images are re-anchored to it with png_anchor.py:
the PDF stream can hold stale image positions.
Requires PyMuPDF.
"""
import json
import math
import os
import sys

import pymupdf

TOL = 0.6  # px: points closer than this are the same point


def col(c):
    return [round(x, 4) for x in c[:3]] if c else None


def cname(c):
    if not c:
        return "none"
    r, g, b = c[:3]
    if max(r, g, b) - min(r, g, b) < 0.08:
        return "white" if r > 0.85 else "black" if r < 0.15 else "grey"
    h = {0: "red", 1: "yellow", 2: "green", 3: "cyan", 4: "blue", 5: "magenta"}
    mx = max(r, g, b)
    if mx == r:
        hue = ((g - b) / (mx - min(r, g, b))) % 6
    elif mx == g:
        hue = (b - r) / (mx - min(r, g, b)) + 2
    else:
        hue = (r - g) / (mx - min(r, g, b)) + 4
    return h[int(round(hue)) % 6]


def same(p, q):
    return abs(p[0] - q[0]) < TOL and abs(p[1] - q[1]) < TOL


def subpaths(items, close_flag):
    """PyMuPDF path items -> list of {v, i, o, closed} with tangents relative to their vertex."""
    subs, cur = [], None

    def start(p):
        nonlocal cur
        cur = {"v": [[p.x, p.y]], "i": [[0, 0]], "o": [[0, 0]], "closed": False}
        subs.append(cur)

    for it in items:
        k = it[0]
        if k == "re" or k == "qu":
            if k == "re":
                r = it[1]
                pts = [r.tl, r.tr, r.br, r.bl]
            else:
                q = it[1]
                pts = [q.ul, q.ur, q.lr, q.ll]
            subs.append({"v": [[p.x, p.y] for p in pts], "i": [[0, 0]] * 4, "o": [[0, 0]] * 4, "closed": True})
            cur = None
            continue
        p1 = it[1]
        if cur is None or not same(cur["v"][-1], (p1.x, p1.y)):
            start(p1)
        if k == "l":
            p2 = it[2]
            cur["v"].append([p2.x, p2.y]); cur["i"].append([0, 0]); cur["o"].append([0, 0])
        elif k == "c":
            c1, c2, p2 = it[2], it[3], it[4]
            cur["o"][-1] = [c1.x - p1.x, c1.y - p1.y]
            cur["v"].append([p2.x, p2.y]); cur["i"].append([c2.x - p2.x, c2.y - p2.y]); cur["o"].append([0, 0])
    for s in subs:
        if len(s["v"]) > 2 and same(s["v"][0], s["v"][-1]):
            s["i"][0] = s["i"][-1]
            s["v"].pop(); s["i"].pop(); s["o"].pop()
            s["closed"] = True
        elif close_flag:
            s["closed"] = True
    for s in subs:
        s["v"] = [[round(x, 3), round(y, 3)] for x, y in s["v"]]
        s["i"] = [[round(x, 3), round(y, 3)] for x, y in s["i"]]
        s["o"] = [[round(x, 3), round(y, 3)] for x, y in s["o"]]
    return [s for s in subs if len(s["v"]) >= 2]


def dashes(d):
    if not d or d.startswith("[] "):
        return None
    try:
        arr = d[d.index("[") + 1:d.index("]")].split()
        off = float(d[d.index("]") + 1:].strip() or 0)
        vals = [float(x) for x in arr]
        return {"pattern": vals, "offset": off} if vals and any(vals) else None
    except ValueError:
        return None


def transparency_context(page):
    """Walk the extended display list for what plain drawings leave out: transparency-group opacity and clip
    paths (Illustrator clipping masks). Returns {path seqno: stack} and the 'gaps' between two paths, each with
    the stack snapshots pushed there - images and text are not in the drawing list, they sit in those gaps."""
    stack, path_ctx, gaps, cur, last = [], {}, [], [], -1
    for d in page.get_drawings(extended=True):
        lvl, t = d.get("level", 0), d.get("type")
        while stack and stack[-1]["level"] >= lvl:
            stack.pop()
        if t in ("clip", "group"):
            r = d.get("scissor") or d.get("rect")
            stack.append({"level": lvl, "type": t, "rect": [r[0], r[1], r[2], r[3]],
                          "opacity": d.get("opacity") if t == "group" else None,
                          "items": d.get("items") if t == "clip" else None})
            cur.append(list(stack))
        else:
            s = d.get("seqno")
            path_ctx[s] = list(stack)
            gaps.append((last, s, cur))
            cur, last = [], s
    gaps.append((last, 10 ** 9, cur))
    return path_ctx, gaps


def iou(a, b):
    w = min(a[2], b[2]) - max(a[0], b[0]); h = min(a[3], b[3]) - max(a[1], b[1])
    if w <= 0 or h <= 0:
        return 0
    i = w * h
    return i / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i)


def apply_context(elements, page):
    """Set each element's group opacity ("groupOpacity") and its clipping path ("clip", only when the clip
    actually cuts into the element - the artboard clip and box-sized clips are dropped)."""
    path_ctx, gaps = transparency_context(page)
    picks = {}
    for e in sorted(elements, key=lambda e: e["seq"]):
        if e["kind"] == "path":
            ctx = path_ctx.get(e["seq"], [])
        else:
            ctx = []
            for gi, (a, b, snaps) in enumerate(gaps):
                if a < e["seq"] < b and snaps:
                    lo = picks.get(gi, 0)       # content in a gap is in stream order: never step back
                    best, bi = 0, None
                    for k in range(lo, len(snaps)):
                        sc = iou(snaps[k][-1]["rect"], e["bb"])
                        if sc > best:                   # first best: ties (artboard-sized clips) must not skip ahead
                            best, bi = sc, k
                    if bi is not None:
                        picks[gi] = bi
                        ctx = snaps[bi]
                    break
        op = 1.0
        for x in ctx:
            if x["type"] == "group" and x["opacity"] is not None:
                op *= x["opacity"]
        if op < 0.995:
            e["groupOpacity"] = round(op, 4)
        bb = e["bb"]
        area = max((bb[2] - bb[0]) * (bb[3] - bb[1]), 1e-6)
        for x in reversed(ctx):
            r = x["rect"]
            if x["type"] != "clip" or not x["items"]:
                continue
            curved = any(it[0] == "c" for it in x["items"])
            inside = r[0] <= bb[0] + 1 and r[1] <= bb[1] + 1 and r[2] >= bb[2] - 1 and r[3] >= bb[3] - 1
            if inside and not curved:
                continue                          # artboard / box clip: cuts nothing
            iw, ih = min(r[2], bb[2]) - max(r[0], bb[0]), min(r[3], bb[3]) - max(r[1], bb[1])
            if e["kind"] == "text" and iw > 0 and ih > 0 and iw * ih / area > 0.85:
                continue                          # glyph boxes overhang clips slightly: not a real cut
            e["clip"] = subpaths(x["items"], True)
            e["clipBB"] = r
            e["hint"] = e["hint"] + " clipped"
            break


def installed_fonts():
    import glob
    dirs = [os.path.join(os.environ.get("WINDIR", "C:/Windows"), "Fonts"), os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Windows", "Fonts")]
    files = []
    for d in dirs:
        files += glob.glob(os.path.join(d, "*.ttf")) + glob.glob(os.path.join(d, "*.otf"))
    return files


def match_weights(texts, ref_png):
    """Set e["fontAE"] to the installed static font (PostScript name) whose ink density best matches the reference."""
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
    if not texts:
        return
    ref = np.asarray(Image.open(ref_png).convert("RGB"), dtype=np.int16)
    files = installed_fonts()
    cache = {}
    for e in texts:
        fam = e["font"].split("-")[0].replace("Flux", "").replace("VF", "").lower()
        cands = [f for f in files if os.path.basename(f).lower().startswith(fam) and "italic" not in os.path.basename(f).lower()]
        if not cands:
            continue
        x0, y0, x1, y1 = [int(round(v)) for v in e["bb"]]
        region = ref[max(0, y0):y1, max(0, x0):x1]
        if region.size == 0:
            continue
        tc = np.array([int(c * 255) for c in (e["color"] or [1, 1, 1])], dtype=np.int16)
        ref_ink = (np.abs(region - tc).max(axis=2) < 70).sum()
        lines = e["text"].split("\r")
        best, best_d = None, None
        for f in cands:
            key = (f, e["size"])
            if key not in cache:
                cache[key] = ImageFont.truetype(f, max(1, int(round(e["size"]))))
            font = cache[key]
            ink = 0
            for ln in lines:
                l, t, r, b = font.getbbox(ln)
                im = Image.new("L", (max(1, r - l + 4), max(1, b - t + 4)), 0)
                ImageDraw.Draw(im).text((2 - l, 2 - t), ln, fill=255, font=font)
                ink += (np.asarray(im) > 127).sum()
            dlt = abs(ink - ref_ink) / max(1, ref_ink)
            if best_d is None or dlt < best_d:
                fam_name, style = font.getname()
                best, best_d = (fam_name.replace(" ", "") + "-" + style.replace(" ", "")), dlt
        if best:
            e["fontAE"] = best
            e["fontMatch"] = round(1 - best_d, 2)
    for e in texts:
        if e.get("fontAE") and e["fontAE"] != e["font"]:
            print("  weight match: %-28s %s -> %s (%.0f%% ink match)" % (e["text"].replace("\r", " ")[:28], e["font"], e["fontAE"], e["fontMatch"] * 100))


def main(path, out):
    os.makedirs(out, exist_ok=True)
    doc = pymupdf.open(path)
    page = doc[0]
    W, H = page.rect.width, page.rect.height
    page.get_pixmap(alpha=True).save(os.path.join(out, "reference.png"))
    log = page.get_bboxlog()
    elements = []

    # ---- paths ----
    for d in page.get_drawings():
        subs = subpaths(d["items"], d.get("closePath"))
        if not subs:
            continue
        r = d["rect"]
        fill = col(d.get("fill")) if d.get("fill") is not None else None
        stroke = col(d.get("color")) if d.get("color") is not None and d.get("width") else None
        e = {"kind": "path", "seq": d.get("seqno", 0), "bb": [r.x0, r.y0, r.x1, r.y1], "subpaths": subs,
             "fill": fill, "fillOpacity": d.get("fill_opacity") if d.get("fill_opacity") is not None else 1,
             "evenOdd": bool(d.get("even_odd")),
             "stroke": stroke, "strokeOpacity": d.get("stroke_opacity") if d.get("stroke_opacity") is not None else 1,
             "width": d.get("width") or 0, "cap": (d.get("lineCap") or [0])[0], "join": d.get("lineJoin") or 0,
             "dashes": dashes(d.get("dashes")), "layer": d.get("layer")}
        thin = min(r.width, r.height) < 3 or (stroke and not fill)
        e["role"] = "line" if (stroke and not fill) else "shape"
        e["p0"], e["p1"] = subs[0]["v"][0], subs[0]["v"][-1]
        base = ("dashed line" if e["dashes"] else "line") if e["role"] == "line" else "%s shape" % cname(fill)
        e["hint"] = "%s %dx%d" % (base, round(r.width), round(r.height))
        elements.append(e)

    # ---- text: spans -> lines -> paragraphs ----
    spans = []
    for s in page.get_texttrace():
        # one trace span can hold several lines (Illustrator area/point text with line breaks):
        # split wherever the baseline moves or the pen jumps back to the left
        runs, cur = [], []
        for ch in s["chars"]:
            if cur:
                prev = cur[-1]
                if abs(ch[2][1] - prev[2][1]) > s["size"] * 0.3 or ch[2][0] < prev[2][0] - s["size"] * 0.5:
                    runs.append(cur); cur = []
            cur.append(ch)
        if cur:
            runs.append(cur)
        for run in runs:
            txt = "".join(chr(c[0]) for c in run)
            if not txt.strip():
                continue
            o0 = run[0][2]
            bbs = [c[3] for c in run]
            bb = [min(b[0] for b in bbs), min(b[1] for b in bbs), max(b[2] for b in bbs), max(b[3] for b in bbs)]
            spans.append({"seq": s["seqno"], "text": txt, "font": s["font"], "size": round(s["size"], 2), "color": col(s["color"]),
                          "opacity": s.get("opacity", 1), "x0": o0[0], "x1": bb[2], "base": o0[1], "bb": bb})
    spans.sort(key=lambda s: s["seq"])
    lines = []
    for s in spans:
        L = lines[-1] if lines else None
        if L and abs(L["base"] - s["base"]) < s["size"] * 0.3 and L["font"] == s["font"] and L["size"] == s["size"] and s["x0"] >= L["x1"] - s["size"] and s["x0"] - L["x1"] < s["size"] * 0.7:   # a wider gap = a separate label (own AE layer)
            gap = s["x0"] - L["x1"]
            L["text"] += (" " if gap > s["size"] * 0.15 and not L["text"].endswith(" ") else "") + s["text"]
            L["x1"] = s["x1"]; L["bb"] = [min(L["bb"][0], s["bb"][0]), min(L["bb"][1], s["bb"][1]), max(L["bb"][2], s["bb"][2]), max(L["bb"][3], s["bb"][3])]
        else:
            lines.append(dict(s))
    paras = []
    for L in lines:
        P = paras[-1] if paras else None
        if P and P["font"] == L["font"] and P["size"] == L["size"] and P["color"] == L["color"] and 0 < L["base"] - P["lines"][-1]["base"] < L["size"] * 1.8 and L["bb"][0] < P["lines"][-1]["bb"][2] and L["bb"][2] > P["lines"][-1]["bb"][0]:
            P["lines"].append(L)
        else:
            paras.append({"font": L["font"], "size": L["size"], "color": L["color"], "opacity": L["opacity"], "seq": L["seq"], "lines": [L]})
    for P in paras:
        ls = P["lines"]
        lefts = [l["x0"] for l in ls]; rights = [l["x1"] for l in ls]; mids = [(l["x0"] + l["x1"]) / 2 for l in ls]
        spread = lambda v: max(v) - min(v)
        if len(ls) == 1 or spread(lefts) <= 2:
            just, ax = "left", min(lefts)
        elif spread(mids) <= 3:
            just, ax = "center", sum(mids) / len(mids)
        elif spread(rights) <= 2:
            just, ax = "right", max(rights)
        else:
            just, ax = "left", min(lefts)
        bb = [min(l["bb"][0] for l in ls), min(l["bb"][1] for l in ls), max(l["bb"][2] for l in ls), max(l["bb"][3] for l in ls)]
        lead = (ls[-1]["base"] - ls[0]["base"]) / (len(ls) - 1) if len(ls) > 1 else P["size"] * 1.2
        text = "\r".join(l["text"].strip() for l in ls)
        elements.append({"kind": "text", "seq": P["seq"], "text": text, "font": P["font"], "size": P["size"], "color": P["color"],
                         "opacity": P["opacity"], "just": just, "anchor": [round(ax, 2), round(ls[0]["base"], 2)], "leading": round(lead, 2),
                         "bb": bb, "role": "label", "hint": "text " + text.replace("\r", " ")[:28]})

    # ---- font weight: Illustrator files often use a VARIABLE font whose PostScript name ("Manrope-ExtraLight")
    # says nothing about the weight actually drawn. Measure ink density in the reference render and pick the
    # installed static weight of the same family that matches best. ----
    try:
        match_weights([e for e in elements if e["kind"] == "text"], os.path.join(out, "reference.png"))
    except Exception as ex:
        print("font weight matching skipped (%s)" % ex)

    # ---- images (paint order from the bbox log) ----
    img_seqs = [i for i, (kind, _) in enumerate(log) if kind == "fill-image"]
    infos = page.get_image_info(xrefs=True)
    for n, info in enumerate(infos):
        xref = info.get("xref")
        if not xref:
            continue
        try:
            pix = pymupdf.Pixmap(doc, xref)
            sm = doc.extract_image(xref).get("smask")
            if sm:
                pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, sm))
            if pix.n - pix.alpha > 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            fn = os.path.join(out, "img_%02d.png" % (n + 1))
            pix.save(fn)
        except Exception as ex:  # unusual colour spaces etc.
            print("image %d not extracted (%s): will be a raster crop" % (n + 1, ex))
            fn = None
        bb = list(info["bbox"])
        a, b, c, d, e, f = info["transform"]
        rot = round(math.degrees(math.atan2(b, a)), 2)
        el = {"kind": "image", "seq": img_seqs[n] if n < len(img_seqs) else 10 ** 6, "file": fn, "bb": bb, "rotation": rot,
              "flipX": a < 0, "flipY": d < 0, "w": info["width"], "h": info["height"], "role": "image",
              "hint": "image %dx%d" % (round(bb[2] - bb[0]), round(bb[3] - bb[1]))}
        elements.append(el)

    # ---- gradients / shadings: raster fallback regions ----
    for i, (kind, r) in enumerate(log):
        if kind == "fill-shade":
            elements.append({"kind": "shade", "seq": i, "bb": [r[0], r[1], r[2], r[3]], "role": "shape", "hint": "gradient region"})

    try:
        apply_context(elements, page)
    except Exception as ex:
        print("clip/opacity context skipped (%s)" % ex)
    elements.sort(key=lambda e: e["seq"])
    for idx, e in enumerate(elements, 1):
        nm = "%03d %s" % (idx, e["hint"])
        e["name"] = nm[:60]
    json.dump({"file": path, "width": W, "height": H, "elements": elements}, open(os.path.join(out, "elements.json"), "w", encoding="utf-8"), indent=1)
    # the .ai's PDF stream can hold stale image positions: re-anchor them to the designer's PNG export
    if os.path.exists(os.path.splitext(path)[0] + ".png"):
        try:
            import png_anchor
            png_anchor.main(out)
        except Exception as ex:
            print("PNG anchoring skipped (%s)" % ex)
    kinds = {}
    for e in elements:
        kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
    print("%s: %dx%d, %s -> %s" % (os.path.basename(path), W, H, kinds, out))
    fonts = sorted(set(e["font"] for e in elements if e["kind"] == "text"))
    if fonts:
        print("fonts: " + ", ".join(fonts))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
