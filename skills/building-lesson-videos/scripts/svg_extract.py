"""Read an SVG exported from Illustrator into native elements for rebuild_ai.jsx (same elements.json as ai_extract.py).

    python svg_extract.py FILE.svg OUT_DIR

SVG is the preferred source for Illustrator artwork: the designer's groups and layer names survive, circles and
rounded rectangles stay exact, dashes are explicit, text keeps its line breaks, and images sit where Illustrator
puts them (the PDF stream inside an .ai can be stale). Export from Illustrator with
File > Export > Export As... > SVG:  Styling: Internal CSS | Font: SVG | Images: Embed | Object IDs: Layer Names
| Decimal: 2 | Minify: off | Responsive: off.

Writes OUT_DIR/elements.json and OUT_DIR/img_*.png. Every element carries "group" (its top-level Illustrator layer,
e.g. "Layer 20") and "groupPath" (nested group names), which choreograph.py's "auto" beats use to animate a
designer group as one unit: start dots pop, lines draw on, arrowheads land on arrival, cards pop, text rises.
Fonts: the PostScript name from the CSS; when the CSS has none (Illustrator sometimes drops it) the font is
borrowed from FILE.ai's text, and the weight is matched against FILE.png (the designer's export) if present.
Gradient fills are approximated by their average colour (reported). Requires Pillow (and PyMuPDF for borrowing).
"""
import base64
import io
import json
import math
import os
import re
import sys
import xml.etree.ElementTree as ET

SVG = "{http://www.w3.org/2000/svg}"
XLINK = "{http://www.w3.org/1999/xlink}href"
K = 0.5522847498            # circle -> cubic bezier handle factor
INHERIT = {"fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
           "stroke-miterlimit", "fill-opacity", "stroke-opacity", "fill-rule", "font-family", "font-size", "font-weight",
           "font-style", "letter-spacing", "visibility"}
WEIGHTS = {100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold",
           800: "ExtraBold", 900: "Black"}
NAMED = {"black": "#000000", "white": "#ffffff", "red": "#ff0000", "green": "#008000", "blue": "#0000ff",
         "yellow": "#ffff00", "gray": "#808080", "grey": "#808080", "none": None}


# ---------------- small geometry helpers ----------------
def mul(a, b):
    """affine a*b, matrices as (a, b, c, d, e, f) like SVG."""
    return (a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5])


I = (1, 0, 0, 1, 0, 0)


def ap(m, p):
    return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]


def av(m, v):  # vector (no translation)
    return [m[0] * v[0] + m[2] * v[1], m[1] * v[0] + m[3] * v[1]]


def parse_transform(s):
    m = I
    for name, args in re.findall(r"(\w+)\s*\(([^)]*)\)", s or ""):
        a = [float(x) for x in re.findall(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", args)]
        if name == "matrix":
            t = tuple(a[:6])
        elif name == "translate":
            t = (1, 0, 0, 1, a[0], a[1] if len(a) > 1 else 0)
        elif name == "scale":
            t = (a[0], 0, 0, a[1] if len(a) > 1 else a[0], 0, 0)
        elif name == "rotate":
            r = math.radians(a[0]); c, s_ = math.cos(r), math.sin(r)
            t = (c, s_, -s_, c, 0, 0)
            if len(a) == 3:
                t = mul(mul((1, 0, 0, 1, a[1], a[2]), t), (1, 0, 0, 1, -a[1], -a[2]))
        elif name == "skewX":
            t = (1, 0, math.tan(math.radians(a[0])), 1, 0, 0)
        elif name == "skewY":
            t = (1, math.tan(math.radians(a[0])), 0, 1, 0, 0)
        else:
            continue
        m = mul(m, t)
    return m


def scale_of(m):
    return math.sqrt(abs(m[0] * m[3] - m[1] * m[2]))


# ---------------- colours / css ----------------
def color(v):
    if v is None:
        return None
    v = v.strip()
    if v in NAMED:
        v = NAMED[v]
        if v is None:
            return None
    if v.startswith("#"):
        h = v[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return [round(int(h[i:i + 2], 16) / 255, 4) for i in (0, 2, 4)]
    m = re.match(r"rgba?\(([^)]*)\)", v)
    if m:
        p = [x.strip() for x in m.group(1).split(",")]
        return [round((float(x[:-1]) * 2.55 if x.endswith("%") else float(x)) / 255, 4) for x in p[:3]]
    return None


def parse_css(text):
    rules = []
    text = re.sub(r"/\*.*?\*/", "", text or "", flags=re.S)
    for sel, body in re.findall(r"([^{}]+)\{([^}]*)\}", text):
        decl = {}
        for part in body.split(";"):
            if ":" in part:
                k, v = part.split(":", 1)
                decl[k.strip()] = v.strip()
        for s in sel.split(","):
            rules.append((s.strip(), decl))
    return rules


def num(v, default=0.0):
    if v is None:
        return default
    m = re.match(r"\s*([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)", str(v))
    return float(m.group(1)) if m else default


# ---------------- path data -> cubic subpaths ----------------
def arc_to_cubics(x1, y1, rx, ry, phi, fa, fs, x2, y2):
    if rx == 0 or ry == 0:
        return [((x1, y1), (x2, y2), (x2, y2))]
    phi = math.radians(phi); cp, sp = math.cos(phi), math.sin(phi)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    rx, ry = abs(rx), abs(ry)
    lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
    if lam > 1:
        rx *= math.sqrt(lam); ry *= math.sqrt(lam)
    num_ = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    co = math.sqrt(max(0, num_ / den)) if den else 0
    if fa == fs:
        co = -co
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx, cy = cp * cxp - sp * cyp + (x1 + x2) / 2, sp * cxp + cp * cyp + (y1 + y2) / 2

    def ang(u, v):
        a = math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])
        return a
    t1 = ang((1, 0), ((x1p - cxp) / rx, (y1p - cyp) / ry))
    dt = ang(((x1p - cxp) / rx, (y1p - cyp) / ry), ((-x1p - cxp) / rx, (-y1p - cyp) / ry))
    if not fs and dt > 0:
        dt -= 2 * math.pi
    elif fs and dt < 0:
        dt += 2 * math.pi
    n = max(1, int(math.ceil(abs(dt) / (math.pi / 2))))
    d = dt / n
    out = []
    for i in range(n):
        a1, a2 = t1 + i * d, t1 + (i + 1) * d
        al = 4 / 3 * math.tan((a2 - a1) / 4)
        p = lambda a: (cx + rx * math.cos(a) * cp - ry * math.sin(a) * sp, cy + rx * math.cos(a) * sp + ry * math.sin(a) * cp)
        dp = lambda a: (-rx * math.sin(a) * cp - ry * math.cos(a) * sp, -rx * math.sin(a) * sp + ry * math.cos(a) * cp)
        P1, P2, D1, D2 = p(a1), p(a2), dp(a1), dp(a2)
        out.append(((P1[0] + al * D1[0], P1[1] + al * D1[1]), (P2[0] - al * D2[0], P2[1] - al * D2[1]), P2))
    return out


def path_subs(d):
    """SVG path data -> [{"pts": [(x,y)...], "segs": [(c1, c2, p2) or None for lines], "closed"}] in local coords."""
    toks = re.findall(r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", d or "")
    subs, cur, i = [], None, 0
    x = y = sx = sy = 0.0
    cmd, last_c2, last_q = None, None, None

    def nums(n):
        nonlocal i
        v = [float(t) for t in toks[i:i + n]]
        i += n
        return v

    def isnum(k):
        return k < len(toks) and not re.match(r"[A-Za-z]", toks[k])

    def start(px, py):
        nonlocal cur
        cur = {"start": (px, py), "segs": [], "closed": False}
        subs.append(cur)

    def seg(c1, c2, p2):
        nonlocal x, y
        if cur is None:
            start(x, y)
        cur["segs"].append((c1, c2, p2))
        x, y = p2

    while i < len(toks):
        t = toks[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t; i += 1
        elif cmd is None:
            i += 1; continue
        rel = cmd.islower(); C = cmd.upper()
        ox, oy = (x, y) if rel else (0.0, 0.0)
        if C == "Z":
            if cur:
                cur["closed"] = True
                x, y = cur["start"]
            cur = None; last_c2 = last_q = None
            continue
        if not isnum(i):
            continue
        if C == "M":
            px, py = nums(2); x, y = px + ox, py + oy; start(x, y); sx, sy = x, y
            cmd = "l" if rel else "L"; last_c2 = last_q = None
        elif C == "L":
            px, py = nums(2); seg(None, None, (px + ox, py + oy)); last_c2 = last_q = None
        elif C == "H":
            px, = nums(1); seg(None, None, (px + (x if rel else 0), y)); last_c2 = last_q = None
        elif C == "V":
            py, = nums(1); seg(None, None, (x, py + (y if rel else 0))); last_c2 = last_q = None
        elif C == "C":
            a = nums(6)
            c1, c2, p2 = (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy), (a[4] + ox, a[5] + oy)
            seg(c1, c2, p2); last_c2 = c2; last_q = None
        elif C == "S":
            a = nums(4)
            c1 = (2 * x - last_c2[0], 2 * y - last_c2[1]) if last_c2 else (x, y)
            c2, p2 = (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy)
            seg(c1, c2, p2); last_c2 = c2; last_q = None
        elif C == "Q":
            a = nums(4)
            q, p2 = (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy)
            c1 = (x + 2 / 3 * (q[0] - x), y + 2 / 3 * (q[1] - y)); c2 = (p2[0] + 2 / 3 * (q[0] - p2[0]), p2[1] + 2 / 3 * (q[1] - p2[1]))
            seg(c1, c2, p2); last_q = q; last_c2 = None
        elif C == "T":
            a = nums(2)
            q = (2 * x - last_q[0], 2 * y - last_q[1]) if last_q else (x, y)
            p2 = (a[0] + ox, a[1] + oy)
            c1 = (x + 2 / 3 * (q[0] - x), y + 2 / 3 * (q[1] - y)); c2 = (p2[0] + 2 / 3 * (q[0] - p2[0]), p2[1] + 2 / 3 * (q[1] - p2[1]))
            seg(c1, c2, p2); last_q = q; last_c2 = None
        elif C == "A":
            a = nums(7)
            p2 = (a[5] + ox, a[6] + oy)
            for c1, c2, pp in arc_to_cubics(x, y, a[0], a[1], a[2], int(a[3]), int(a[4]), p2[0], p2[1]):
                seg(c1, c2, pp)
            last_c2 = last_q = None
    return subs


def to_ae(subs, m):
    """local subpaths -> AE {v, i, o, closed} in artboard coords (tangents relative to their vertex)."""
    out = []
    for s in subs:
        v = [ap(m, s["start"])]; ii = [[0, 0]]; oo = [[0, 0]]
        for c1, c2, p2 in s["segs"]:
            P2 = ap(m, p2)
            if c1 is not None:
                C1, C2 = ap(m, c1), ap(m, c2)
                oo[-1] = [C1[0] - v[-1][0], C1[1] - v[-1][1]]
                ii.append([C2[0] - P2[0], C2[1] - P2[1]])
            else:
                ii.append([0, 0])
            v.append(P2); oo.append([0, 0])
        closed = s["closed"]
        if closed and len(v) > 2 and abs(v[0][0] - v[-1][0]) < 0.05 and abs(v[0][1] - v[-1][1]) < 0.05:
            ii[0] = ii[-1]; v.pop(); ii.pop(); oo.pop()   # closing segment drawn explicitly: merge the duplicate
        if len(v) >= 2 or (len(v) == 1 and closed):
            r3 = lambda L: [[round(a, 3), round(b, 3)] for a, b in L]
            out.append({"v": r3(v), "i": r3(ii), "o": r3(oo), "closed": closed})
    return out


def ellipse_subs(cx, cy, rx, ry):
    kx, ky = rx * K, ry * K
    return [{"start": (cx, cy - ry), "closed": True, "segs": [
        ((cx + kx, cy - ry), (cx + rx, cy - ky), (cx + rx, cy)),
        ((cx + rx, cy + ky), (cx + kx, cy + ry), (cx, cy + ry)),
        ((cx - kx, cy + ry), (cx - rx, cy + ky), (cx - rx, cy)),
        ((cx - rx, cy - ky), (cx - kx, cy - ry), (cx, cy - ry))]}]


def rect_subs(x, y, w, h, rx, ry):
    if rx <= 0 and ry <= 0:
        return [{"start": (x, y), "closed": True, "segs": [(None, None, (x + w, y)), (None, None, (x + w, y + h)), (None, None, (x, y + h))]}]
    rx = min(rx or ry, w / 2); ry = min(ry or rx, h / 2)
    kx, ky = rx * K, ry * K
    return [{"start": (x + rx, y), "closed": True, "segs": [
        (None, None, (x + w - rx, y)), ((x + w - rx + kx, y), (x + w, y + ry - ky), (x + w, y + ry)),
        (None, None, (x + w, y + h - ry)), ((x + w, y + h - ry + ky), (x + w - rx + kx, y + h), (x + w - rx, y + h)),
        (None, None, (x + rx, y + h)), ((x + rx - kx, y + h), (x, y + h - ry + ky), (x, y + h - ry)),
        (None, None, (x, y + ry)), ((x, y + ry - ky), (x + rx - kx, y), (x + rx, y))]}]


def poly_subs(pts, closed):
    p = [float(t) for t in re.findall(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", pts or "")]
    xy = list(zip(p[0::2], p[1::2]))
    if not xy:
        return []
    return [{"start": xy[0], "closed": closed, "segs": [(None, None, q) for q in xy[1:]]}]


def bbox(subs):
    xs, ys = [], []
    for s in subs:
        for k, (x, y) in enumerate(s["v"]):
            xs.append(x); ys.append(y)
            for t in (s["i"][k], s["o"][k]):          # control points: conservative box
                xs.append(x + t[0]); ys.append(y + t[1])
    return [min(xs), min(ys), max(xs), max(ys)] if xs else [0, 0, 0, 0]


def cname(c):
    if not c:
        return "none"
    r, g, b = c[:3]
    if max(r, g, b) - min(r, g, b) < 0.08:
        return "white" if r > 0.85 else "black" if r < 0.15 else "grey"
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == r:
        hue = ((g - b) / (mx - mn)) % 6
    elif mx == g:
        hue = (b - r) / (mx - mn) + 2
    else:
        hue = (r - g) / (mx - mn) + 4
    return {0: "red", 1: "yellow", 2: "green", 3: "cyan", 4: "blue", 5: "magenta"}[int(round(hue)) % 6]


# ---------------- fonts ----------------
_FONT_INDEX = None


def font_index():
    """PostScript-ish name ("Manrope-SemiBold") -> font file, for installed static fonts."""
    global _FONT_INDEX
    if _FONT_INDEX is None:
        from PIL import ImageFont
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from ai_extract import installed_fonts
        _FONT_INDEX = {}
        for f in installed_fonts():
            try:
                fam, sty = ImageFont.truetype(f, 12).getname()
            except Exception:
                continue
            _FONT_INDEX.setdefault((fam.replace(" ", "") + "-" + sty.replace(" ", "")).lower(), f)
    return _FONT_INDEX


def resolve_font(ps, weight):
    """-> (name AE should try, font file or None). Variable-font instance names map to the static family."""
    idx = font_index()
    if ps and ps.lower() in idx:
        return ps, idx[ps.lower()]
    fam = (ps or "").split("-")[0]
    w = WEIGHTS.get(int(round(weight / 100.0)) * 100 if weight else 400, "Regular")
    style = (ps.split("-", 1)[1] if ps and "-" in ps else w)
    for f in (fam, fam.replace("Flux", ""), fam.replace("VF", ""), re.sub(r"Variable$", "", fam)):
        for s in (style, w, "Regular"):
            key = (f + "-" + s).lower()
            if key in idx:
                return f + "-" + s, idx[key]
    return ps, None


def borrow_fonts(texts, ai_path):
    """Fill in missing font names from the .ai's own text (matched by words)."""
    try:
        import pymupdf
    except ImportError:
        return
    page = pymupdf.open(ai_path)[0]
    words = {}
    for s in page.get_texttrace():
        t = re.sub(r"\W", "", "".join(chr(c[0]) for c in s["chars"])).lower()
        if t:
            words.setdefault(t, s["font"])
    for e in texts:
        if e.get("font"):
            continue
        for w in re.findall(r"\w+", e["text"].lower()):
            hit = next((f for k, f in words.items() if w in k or k in w), None)
            if hit:
                e["font"] = hit; e["fontBorrowed"] = True
                break


# ---------------- main walk ----------------
def main(path, out):
    os.makedirs(out, exist_ok=True)
    tree = ET.parse(path)
    root = tree.getroot()
    vb = [float(v) for v in re.split(r"[\s,]+", root.get("viewBox", "").strip())] if root.get("viewBox") else \
        [0, 0, num(root.get("width"), 1920), num(root.get("height"), 1080)]
    W, H = vb[2], vb[3]
    base = (1, 0, 0, 1, -vb[0], -vb[1])
    rules = []
    for st in root.iter(SVG + "style"):
        rules += parse_css(st.text)
    defs = {el.get("id"): el for el in root.iter() if el.get("id")}
    elements, notes, n_img = [], [], [0]

    def style_of(el, inherited):
        s = {k: v for k, v in inherited.items() if k in INHERIT}
        for k in ("fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
                  "fill-opacity", "stroke-opacity", "opacity", "fill-rule", "font-family", "font-size", "font-weight",
                  "letter-spacing", "display", "visibility", "clip-path"):
            if el.get(k) is not None:
                s[k] = el.get(k)
        classes = (el.get("class") or "").split()
        for sel, decl in rules:
            if sel.startswith(".") and sel[1:] in classes or sel == el.tag.replace(SVG, ""):
                s.update(decl)
        for part in (el.get("style") or "").split(";"):
            if ":" in part:
                k, v = part.split(":", 1)
                s[k.strip()] = v.strip()
        return s   # opacity is not inherited (not in INHERIT): walk() multiplies it down the tree instead

    def paint(v):
        if v is None:
            return None, False
        m = re.match(r"url\(#([^)]+)\)", v)
        if m:
            g = defs.get(m.group(1))
            cols = [color((st.get("style") or "").split("stop-color:")[-1].split(";")[0] if "stop-color:" in (st.get("style") or "")
                          else st.get("stop-color") or next((d.get("stop-color") for sel, d in rules if sel[1:] in (st.get("class") or "").split() and d.get("stop-color")), None))
                    for st in (g.iter(SVG + "stop") if g is not None else [])]
            cols = [c for c in cols if c]
            if cols:
                return [round(sum(c[i] for c in cols) / len(cols), 4) for i in range(3)], True
            return None, True
        return color(v), False

    def clip_of(s, m):
        v = s.get("clip-path")
        mm = re.match(r"url\(#([^)]+)\)", v or "")
        if not mm or mm.group(1) not in defs:
            return None
        subs = []
        for ch in defs[mm.group(1)]:
            subs += shape_subs(ch, mul(m, parse_transform(ch.get("transform"))))
        return subs or None

    def shape_subs(el, m):
        tag = el.tag.replace(SVG, "")
        if tag == "path":
            loc = path_subs(el.get("d"))
        elif tag == "rect":
            loc = rect_subs(num(el.get("x")), num(el.get("y")), num(el.get("width")), num(el.get("height")),
                            num(el.get("rx"), 0), num(el.get("ry"), 0))
        elif tag == "circle":
            r = num(el.get("r")); loc = ellipse_subs(num(el.get("cx")), num(el.get("cy")), r, r)
        elif tag == "ellipse":
            loc = ellipse_subs(num(el.get("cx")), num(el.get("cy")), num(el.get("rx")), num(el.get("ry")))
        elif tag == "line":
            loc = [{"start": (num(el.get("x1")), num(el.get("y1"))), "closed": False,
                    "segs": [(None, None, (num(el.get("x2")), num(el.get("y2"))))]}]
        elif tag in ("polyline", "polygon"):
            loc = poly_subs(el.get("points"), tag == "polygon")
        elif tag == "use":
            ref = defs.get((el.get(XLINK) or el.get("href") or "").lstrip("#"))
            if ref is None:
                return []
            return shape_subs(ref, mul(m, (1, 0, 0, 1, num(el.get("x")), num(el.get("y")))))
        else:
            return []
        return to_ae(loc, m)

    def walk(el, m, inh, gop, group, gpath, clip):
        tag = el.tag.replace(SVG, "")
        if tag in ("defs", "clipPath", "mask", "metadata", "style", "title", "desc", "linearGradient", "radialGradient", "symbol"):
            return
        s = style_of(el, inh)
        if s.get("display") == "none" or s.get("visibility") == "hidden":
            return
        m = mul(m, parse_transform(el.get("transform")))
        op = gop * num(s.get("opacity"), 1)
        c = clip_of(s, m) or clip
        if tag in ("g", "svg", "a"):
            name = el.get("data-name") or el.get("id")
            g2 = group or name
            p2 = gpath + ([name] if name else [])
            for ch in el:
                walk(ch, m, s, op, g2, p2, c)
            if el.get("mask"):
                notes.append("mask on group %s ignored" % name)
            return
        base_e = {"group": group or "", "groupPath": "/".join(p for p in gpath if p)}
        if op < 0.995:
            base_e["groupOpacity"] = round(op, 4)
        if tag == "use":
            # <use> pointing at an <image> in <defs> (Illustrator reuses embedded images this way)
            ref = defs.get((el.get(XLINK) or el.get("href") or "").lstrip("#"))
            if ref is not None and ref.tag.replace(SVG, "") == "image":
                walk(ref, mul(m, (1, 0, 0, 1, num(el.get("x")), num(el.get("y")))), s, op, group, gpath, clip)
                return
        if tag == "image":
            href = el.get(XLINK) or el.get("href") or ""
            n_img[0] += 1
            fn = os.path.join(out, "img_%02d.png" % n_img[0])
            w, h = num(el.get("width")), num(el.get("height"))
            if href.startswith("data:"):
                data = base64.b64decode(href.split(",", 1)[1])
                from PIL import Image
                im = Image.open(io.BytesIO(data))
                im.save(fn)
                pw, ph = im.size
            else:
                src = os.path.join(os.path.dirname(path), href)
                from PIL import Image
                im = Image.open(src); im.save(fn); pw, ph = im.size
            mm = mul(m, (1, 0, 0, 1, num(el.get("x")), num(el.get("y"))))
            corners = [ap(mm, p) for p in ((0, 0), (w, 0), (w, h), (0, h))]
            xs, ys = [p[0] for p in corners], [p[1] for p in corners]
            rot = round(math.degrees(math.atan2(mm[1], mm[0])), 2)
            e = dict(base_e, kind="image", file=fn, bb=[min(xs), min(ys), max(xs), max(ys)], rotation=rot,
                     flipX=mm[0] < 0, flipY=mm[3] < 0, w=pw, h=ph, role="image")
            # true (unrotated) size and mirror flag, for images turned off-axis (rebuild_ai.jsx places them with a real rotation)
            e["ew"] = math.hypot(mm[0], mm[1]) * w
            e["eh"] = math.hypot(mm[2], mm[3]) * h
            e["mirror"] = (mm[0] * mm[3] - mm[1] * mm[2]) < 0
            e["cxy"] = [(corners[0][0] + corners[2][0]) / 2, (corners[0][1] + corners[2][1]) / 2]
            e["hint"] = "image %dx%d" % (round(e["bb"][2] - e["bb"][0]), round(e["bb"][3] - e["bb"][1]))
            if c:
                cb = bbox(c)
                if not (cb[0] <= e["bb"][0] + 1 and cb[1] <= e["bb"][1] + 1 and cb[2] >= e["bb"][2] - 1 and cb[3] >= e["bb"][3] - 1) or \
                        any(any(t != [0, 0] for t in sp["i"]) for sp in c):
                    e["clip"], e["clipBB"] = c, cb
                    e["hint"] += " clipped"
            elements.append(e)
            return
        if tag == "text":
            e = text_element(el, m, s, base_e)
            if e:
                elements.append(e)
            return
        subs = shape_subs(el, m)
        if not subs:
            return
        fill, fg = paint(s.get("fill", "#000000"))
        stroke, sg = paint(s.get("stroke"))
        if fg or sg:
            notes.append("gradient on %s approximated by its average colour" % (el.get("id") or tag))
        sw = num(s.get("stroke-width"), 1) * scale_of(m) if stroke else 0
        da = s.get("stroke-dasharray")
        dash = None
        if da and da != "none":
            pat = [num(x) * scale_of(m) for x in re.split(r"[\s,]+", da.strip()) if x]
            dash = {"pattern": pat, "offset": num(s.get("stroke-dashoffset"), 0) * scale_of(m)}
        bb = bbox(subs)
        e = dict(base_e, kind="path", subpaths=subs, bb=bb, fill=fill, fillOpacity=num(s.get("fill-opacity"), 1),
                 evenOdd=s.get("fill-rule") == "evenodd", stroke=stroke, strokeOpacity=num(s.get("stroke-opacity"), 1),
                 width=round(sw, 3), cap={"butt": 0, "round": 1, "square": 2}.get(s.get("stroke-linecap"), 0),
                 join={"miter": 0, "round": 1, "bevel": 2}.get(s.get("stroke-linejoin"), 0), dashes=dash)
        e["role"] = "line" if (stroke and not fill) else "shape"
        e["p0"], e["p1"] = subs[0]["v"][0], subs[0]["v"][-1]
        tagname = {"circle": "circle", "ellipse": "ellipse", "rect": "rect", "polygon": "polygon"}.get(tag)
        if e["role"] == "line":
            kind = "dashed line" if dash else "line"
        else:
            kind = "%s %s" % (cname(fill), tagname or "shape")
        e["hint"] = "%s %dx%d" % (kind, round(bb[2] - bb[0]), round(bb[3] - bb[1]))
        if c:
            cb = bbox(c)
            if not (cb[0] <= bb[0] + 1 and cb[1] <= bb[1] + 1 and cb[2] >= bb[2] - 1 and cb[3] >= bb[3] - 1):
                e["clip"], e["clipBB"] = c, cb
                e["hint"] += " clipped"
        elements.append(e)

    def text_element(el, m, s, base_e):
        runs = []   # (x, y, text, style) in text-local coordinates

        def tw(node, st, x, y):
            st2 = style_of(node, st) if node is not el else st
            x = num(node.get("x"), x) if node.get("x") is not None else x
            y = num(node.get("y"), y) if node.get("y") is not None else y
            if node.text and node.text.strip("\n"):
                runs.append((x, y, node.text, st2))
            for ch in node:
                if ch.tag.replace(SVG, "") == "tspan":
                    tw(ch, st2, x, y)
                if ch.tail and ch.tail.strip():
                    runs.append((x, y, ch.tail, st2))
        tw(el, s, num(el.get("x"), 0), num(el.get("y"), 0))
        if not runs:
            return None
        lines = []
        for x, y, t, st in runs:
            L = lines[-1] if lines else None
            if L and abs(L["y"] - y) < 0.5 and x >= L["x"] - 0.5:
                L["text"] += t
            else:
                lines.append({"x": x, "y": y, "text": t, "st": st})
        st0 = lines[0]["st"]
        sc = scale_of(m)
        size = round(num(st0.get("font-size"), 16) * sc, 2)
        ps = (st0.get("font-family") or "").split(",")[0].strip().strip("'\"")
        weight = num(st0.get("font-weight"), 0) or None
        col, _ = paint(st0.get("fill", "#000000"))
        e = dict(base_e, kind="text", text="\r".join(l["text"].strip() for l in lines), font=ps or None, weight=weight,
                 size=size, color=col or [0, 0, 0], opacity=1.0, role="label")
        e["_lines"] = [{"x": ap(m, (l["x"], l["y"]))[0], "base": ap(m, (l["x"], l["y"]))[1], "text": l["text"].strip()} for l in lines]
        e["leading"] = round((e["_lines"][-1]["base"] - e["_lines"][0]["base"]) / (len(lines) - 1), 2) if len(lines) > 1 else round(size * 1.2, 2)
        e["hint"] = "text " + e["text"].replace("\r", " ")[:28]
        return e

    for ch in root:
        walk(ch, base, {}, 1.0, None, [], None)

    # ---- text: fonts, widths, justification, boxes ----
    texts = [e for e in elements if e["kind"] == "text"]
    ai = os.path.splitext(path)[0] + ".ai"
    if any(not e["font"] for e in texts) and os.path.exists(ai):
        borrow_fonts(texts, ai)
    from PIL import ImageFont
    for e in texts:
        if not e["font"]:
            notes.append("no font for '%s' (none in the SVG or .ai): AE will use its default" % e["text"][:20])
            e["font"] = ""
        name, f = resolve_font(e["font"], e.get("weight"))
        if name != e["font"]:
            e["fontAE"] = name
        widths = None
        if f:
            ft = ImageFont.truetype(f, max(1, int(round(e["size"]))))
            k = e["size"] / max(1, int(round(e["size"])))
            widths = [ft.getlength(l["text"]) * k for l in e["_lines"]]
        L = e["_lines"]
        if widths:
            mids = [l["x"] + w / 2 for l, w in zip(L, widths)]
            rights = [l["x"] + w for l, w in zip(L, widths)]
        else:
            mids = rights = [l["x"] for l in L]
        lefts = [l["x"] for l in L]
        spread = lambda v: max(v) - min(v)
        # multi-line: the alignment whose edges line up best (measured widths ignore Illustrator's per-letter
        # kerning, so allow a few px of noise rather than a fixed tolerance)
        e["just"], ax = "left", min(lefts)
        if len(L) > 1 and widths and spread(lefts) > 2:
            if spread(mids) <= spread(rights):
                e["just"], ax = "center", sum(mids) / len(mids)
            else:
                e["just"], ax = "right", max(rights)
        x1 = max(rights) if widths else min(lefts) + e["size"] * 0.55 * max(len(l["text"]) for l in L)
        e["anchor"] = [round(ax, 2), round(L[0]["base"], 2)]
        e["penAnchor"] = True     # SVG x/y are pen positions (AE's own text origin): rebuild_ai must not nudge them
        e["bb"] = [min(lefts), L[0]["base"] - e["size"] * 0.78, x1, L[-1]["base"] + e["size"] * 0.24]
        del e["_lines"]
    png = os.path.splitext(path)[0] + ".png"
    if texts and os.path.exists(png):
        # Illustrator's per-letter kerning (letter-spacing classes) is not reproduced by AE, so lines come out a few
        # px wider. Measure each label's ink edges in the designer's export and let rebuild_ai align to them.
        import numpy as np
        from PIL import Image
        P = np.asarray(Image.open(png).convert("RGB").resize((int(round(W)), int(round(H)))), dtype=np.int16)
        for e in texts:
            b = e["bb"]; pad = e["size"] * 0.6
            x0, y0 = max(0, int(b[0] - pad)), max(0, int(b[1]))
            x1, y1 = min(P.shape[1], int(b[2] + pad)), min(P.shape[0], int(b[3]))
            reg = P[y0:y1, x0:x1]
            if reg.size == 0:
                continue
            tc = np.array([int(c * 255) for c in e["color"]], dtype=np.int16)
            ink = (np.abs(reg - tc).max(axis=2) < 60).sum(axis=0) >= 2
            cols = np.nonzero(ink)[0]
            if len(cols) < 3:
                continue
            ix0, ix1 = x0 + cols[0], x0 + cols[-1] + 1
            if abs((ix1 - ix0) - (b[2] - b[0])) <= 0.15 * (b[2] - b[0]):     # plausible: same text, not background
                e["bb"] = [float(ix0), b[1], float(ix1), b[3]]
                e["penAnchor"] = False
                e["inkFromExport"] = True
    borrowed = [e for e in texts if e.get("fontBorrowed") and not e.get("weight")]
    if borrowed and os.path.exists(png):
        # the .ai name of a variable font says nothing about the weight drawn: match ink against the export
        from PIL import Image
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from ai_extract import match_weights
        tmp = os.path.join(out, "_export_artboard.png")
        Image.open(png).convert("RGB").resize((int(round(W)), int(round(H)))).save(tmp)
        match_weights(borrowed, tmp)
        os.remove(tmp)

    for idx, e in enumerate(elements, 1):
        e["seq"] = idx
        e["name"] = ("%03d %s" % (idx, e["hint"]))[:60]
    json.dump({"file": path, "source": "svg", "width": W, "height": H, "elements": elements},
              open(os.path.join(out, "elements.json"), "w", encoding="utf-8"), indent=1)
    kinds, groups = {}, {}
    for e in elements:
        kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
        groups.setdefault(e["group"], []).append(e["name"])
    print("%s: %gx%g, %s -> %s" % (os.path.basename(path), W, H, kinds, out))
    for g, ns in groups.items():
        print("  group %-12s %s" % (g or "(none)", "; ".join(ns)[:150]))
    # which groups belong together: what each label sits on, where each connector starts and ends
    gbb = {}
    for e in elements:
        b = e["bb"]; g = gbb.setdefault(e["group"], list(b))
        g[0], g[1], g[2], g[3] = min(g[0], b[0]), min(g[1], b[1]), max(g[2], b[2]), max(g[3], b[3])
    full = {g for g, b in gbb.items() if b[2] - b[0] >= W * 0.9 and b[3] - b[1] >= H * 0.9}

    def holder(pt, skip, pad=30):
        best = None
        for g, b in gbb.items():
            if g in skip or g in full:
                continue
            if b[0] - pad <= pt[0] <= b[2] + pad and b[1] - pad <= pt[1] <= b[3] + pad:
                a = (b[2] - b[0]) * (b[3] - b[1])
                if best is None or a < best[1]:
                    best = (g, a)
        return best[0] if best else None
    print("  related groups (combine them in one auto beat where they belong together):")
    for g, ns in groups.items():
        if g in full:
            print("    %-10s full-frame background" % g)
            continue
        ls = [e for e in elements if e["group"] == g and e["kind"] == "path" and e["role"] == "line"]
        if ls:
            a, b = holder(ls[0]["p0"], {g}), holder(ls[0]["p1"], {g})
            print("    %-10s connector: starts at %s, ends at %s" % (g, a or "-", b or "-"))
            continue
        b = gbb[g]; inside = None
        for h, hb in gbb.items():
            if h != g and h not in full and hb[0] - 2 <= b[0] and hb[1] - 2 <= b[1] and hb[2] + 2 >= b[2] and hb[3] + 2 >= b[3]:
                if inside is None or (hb[2] - hb[0]) * (hb[3] - hb[1]) < (gbb[inside][2] - gbb[inside][0]) * (gbb[inside][3] - gbb[inside][1]):
                    inside = h
        if inside:
            print("    %-10s sits on %s" % (g, inside))
    for t in texts:
        print("  text %-26r font %s%s just %s" % (t["text"][:26], t.get("fontAE") or t["font"],
                                                  " (borrowed from .ai)" if t.get("fontBorrowed") else "", t["just"]))
    for n in sorted(set(notes)):
        print("  note: " + n)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
