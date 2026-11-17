"""Plan per-layer animation for a layered asset scene (PSD, Illustrator, or any layered comp), timed to the narration.

    python choreograph.py BEATS.json OUT_ops.json
    python choreograph.py --list FILE.psd            list PSD layers (kind, bbox, area) to write the beats

Layer positions come from one of:
  "psd": "D:/assets/file.psd"          read directly with psd-tools
  "layers": "work/layers_S06.json"     measured in After Effects (render_layers.jsx + layer_bboxes.py):
                                       use this for Illustrator (.ai) files and anything that isn't a PSD

BEATS.json:
{
  "comp": "S26 SOMLP integration",            scene comp name in AE
  "psd": "...",  or  "layers": "...",
  "sceneStart": 320.62, "duration": 21.28,      main-comp seconds (from the scene plan)
  "transcript": "work/transcript.json", "offset": 7.32,   tutor layer start in the main comp
  "hub": "Layer 3 copy",                       optional: satellites fly out from this layer's centre
  "fly": [0, 60],                              optional: default fly-in offset (px) for icon beats
  "base": ["Rectangle 2", "Arm of government"],   on screen from the start (panels, headers, hubs)
  "panels": [...], "headerCells": [...],       optional overrides for base roles (needed for .ai: everything is "vector")
  "beats": [                                   in spoken order
    {"layers": ["ring", "disc", "glyph", "Maternal child health"], "phrase": "maternal and child health", "kind": "icon"},
    {"layers": ["National policy", "dot 1"], "phrase": "national policy", "kind": "row"},
    {"layers": ["Line 1"], "phrase": "actively connecting", "kind": "line"},
    {"layers": ["person 1", "person 2"], "phrase": "people in their homes", "kind": "stagger"},
    {"layers": ["Logo"], "at": 1.5, "kind": "icon"},                       "at" = seconds into the scene
    {"layers": [...], "phrase": "...", "kind": "icon", "labels": ["Treatment"], "pills": ["tag bg"], "lines": ["connector"]}
  ]
}
Native (rebuilt Illustrator, rebuild_ai.jsx) scenes also have these beat kinds:
  draw  : {"layers": [connectors], "from": [x,y] | "layer name", "dur": 0.7, "gap": 0.08, "tips": [arrowheads, end caps]}
          Trim Paths draw-on along each path from the end nearest "from"; dashes stay dashes; tips pop on arrival
  label : {"layers": [text layers], "dy": 22}   live text: Text Animator cascade (Range Selector, Ramp Up, per
          character/word/line); options "based": "words", "blur": 10, "tracking": 30. Other layers: rise + fade
  pop   : {"layers": [...], "peak": 112, "rot": -10}   scale pop with settle about each layer's centre
  spin  : {"layers": [...], "center": [x,y] | "layer", "speed": 10}   slow continuous turn after t (deg/s)
  auto  : {"group": "Layer 20" | ["Layer 12", "Layer 7"], "kind": "auto"}   (SVG sources: layers.json has "group")
          animates a designer group by element type: containers pop (largest first), each line's start dot pops,
          the line draws on (Trim Paths) from it, arrowheads land on arrival, other small pieces pop, text rises;
          pieces inside a container of the beat are parented to it. Options: peak, rot, gap, dur, dy, from, snap, small.
Any beat may use "group" instead of / as well as "layers".
Top-level "parents": {"child layer": "container layer"} keeps pieces attached (icon to its card...).
Role detection: PSD type layers / AE text = labels; PSD shapes = pills/panels; thin layers or names starting
"Line" = lines; the remaining graphics sorted by area = ring, disc, glyph. Illustrator text is usually
outlined, so pass "labels" (and "pills") explicitly for .ai beats.
OUT_ops.json is applied with:  ae_run.ps1 -Script jsx/apply_anim.jsx -DataFile OUT_ops.json
"""
import json
import re
import sys


def cen(b):
    return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def list_psd(path):
    from psd_tools import PSDImage
    psd = PSDImage.open(path)
    print("%s  %sx%s" % (path, psd.width, psd.height))
    for l in psd.descendants():
        b = l.bbox
        print("  %-8s %-45r bbox=%s area=%d%s" % (l.kind, l.name, b, (b[2] - b[0]) * (b[3] - b[1]), "" if l.visible else " (hidden)"))


def load_layers(B):
    if B.get("psd"):
        from psd_tools import PSDImage
        psd = PSDImage.open(B["psd"])
        return psd.width, psd.height, {l.name: {"bb": list(l.bbox), "kind": l.kind} for l in psd.descendants()}, "psd"
    info = json.load(open(B["layers"], encoding="utf-8-sig"))
    W = max(v["bb"][2] for v in info.values())
    H = max(v["bb"][3] for v in info.values())
    for v in info.values():
        if v.get("fullFrame"):
            W, H = v["bb"][2], v["bb"][3]
    return W, H, info, "measured"


def main(beats_path, out_path):
    B = json.load(open(beats_path, encoding="utf-8-sig"))
    W, H, info, src = load_layers(B)
    D = B["duration"]
    segs = json.load(open(B["transcript"], encoding="utf-8-sig"))
    words = [w for s in segs for w in s["words"]]
    stream, owner = [], []
    for i, w in enumerate(words):
        for ch in norm(w["w"]):
            stream.append(ch)
            owner.append(i)
    stream = "".join(stream)
    pos = next((i for i, o in enumerate(owner) if words[o]["s"] >= B["sceneStart"] - B["offset"] - 0.3), len(stream))

    ops, problems, glyph_n = {}, [], [0]

    def op(n):
        if n not in info:
            problems.append("layer not found: %r" % n)
        return ops.setdefault(n, {"L": n, "keys": {}, "expr": {}})

    def area(n):
        b = info[n]["bb"]
        return (b[2] - b[0]) * (b[3] - b[1])

    def thin(n):
        b = info[n]["bb"]
        return min(b[2] - b[0], b[3] - b[1]) <= 8

    # --- motion primitives (times = seconds into the scene comp) ---
    def pop(n, t, peak=112, off=None, rot=None):
        o = op(n); c = cen(info[n]["bb"]); o["anchor"] = c
        o["keys"]["scale"] = [[t, [0, 0, 100]], [t + 0.28, [peak, peak, 100]], [t + 0.48, [100, 100, 100]]]
        o["keys"]["opacity"] = [[t, 0], [t + 0.15, 100]]
        if off:
            o["keys"]["position"] = [[t, [c[0] + off[0], c[1] + off[1]]], [t + 0.5, c]]
        if rot:
            o["keys"]["rotation"] = [[t, rot], [t + 0.3, -rot * 0.25], [t + 0.5, 0]]

    def idle_float(n, t):
        o = op(n); ph = glyph_n[0] * 1.3; glyph_n[0] += 1
        o["expr"]["position"] = "var d=time-%.2f; var a=Math.min(Math.max((d-0.6)/0.8,0),1)*5; value+[0, Math.sin(d*2.1+%.2f)*a]" % (t, ph)

    def slide(n, t, dx=-34, dy=0, dur=0.45):
        o = op(n); c = cen(info[n]["bb"]); o["anchor"] = c
        o["keys"]["position"] = [[t, [c[0] + dx, c[1] + dy]], [t + dur, c]]
        o["keys"]["opacity"] = [[t, 0], [t + dur * 0.7, 100]]

    def stretch_x(n, t, dur=0.5):
        b = info[n]["bb"]; o = op(n); o["anchor"] = [b[0], (b[1] + b[3]) / 2]
        o["keys"]["scale"] = [[t, [0, 100, 100]], [t + dur, [100, 100, 100]]]
        o["keys"]["opacity"] = [[t, 0], [t + 0.1, 100]]

    def unfold_y(n, t, dur=0.6):
        b = info[n]["bb"]; o = op(n); o["anchor"] = [(b[0] + b[2]) / 2, b[1]]
        o["keys"]["scale"] = [[t, [100, 0, 100]], [t + dur, [100, 100, 100]]]
        o["keys"]["opacity"] = [[t, 0], [t + 0.15, 100]]

    def drop(n, t):
        o = op(n); c = cen(info[n]["bb"]); o["anchor"] = c
        o["keys"]["position"] = [[t, [c[0], c[1] - 70]], [t + 0.35, [c[0], c[1] + 8]], [t + 0.5, c]]
        o["keys"]["scale"] = [[t, [85, 85, 100]], [t + 0.35, [104, 96, 100]], [t + 0.55, [100, 100, 100]]]
        o["keys"]["opacity"] = [[t, 0], [t + 0.2, 100]]

    def stretch_y(n, t, dur=0.5):
        b = info[n]["bb"]; o = op(n); o["anchor"] = [(b[0] + b[2]) / 2, b[1]]
        o["keys"]["scale"] = [[t, [100, 0, 100]], [t + dur, [100, 100, 100]]]
        o["keys"]["opacity"] = [[t, 0], [t + 0.1, 100]]

    def wipe(n, t, dur=0.6):
        # draw a connector on from its starting edge (left for wide pieces, top for tall ones).
        # Scale-based, so it behaves the same on PSD layers, shape layers and masked copies
        # (Linear Wipe works in each layer's own space, which only matches document-sized layers).
        b = info[n]["bb"]
        if b[2] - b[0] >= b[3] - b[1]:
            stretch_x(n, t, dur)
        else:
            stretch_y(n, t, dur)

    def roles(names, beat):
        names = [n for n in names if n in info]
        labels = set(beat.get("labels", [])) | {n for n in names if info[n]["kind"] == "type"}
        lines = set(beat.get("lines", [])) | {n for n in names if n.lower().startswith("line") or (thin(n) and n not in labels)}
        pills = set(beat.get("pills", [])) | {n for n in names if src == "psd" and info[n]["kind"] == "shape" and n not in lines}
        pix = sorted([n for n in names if n not in labels | lines | pills], key=area, reverse=True)
        return ([n for n in names if n in labels], [n for n in names if n in lines], [n for n in names if n in pills], pix)

    def icon(names, t, beat, off=None):
        types, lines, rects, pix = roles(names, beat)
        k = t
        if len(pix) == 1 and (lines or rects):        # picture + connector + label pill
            drop(pix[0], k); k += 0.3
        else:
            for i, n in enumerate(pix):                # biggest = ring, then disc, smallest = glyph
                if (i == len(pix) - 1 and len(pix) >= 3) or len(pix) == 1:
                    pop(n, k + 0.16, peak=122, off=off, rot=-14); idle_float(n, k + 0.16)
                else:
                    pop(n, k + 0.07 * i, peak=110 if i else 112, off=off)
            if pix:
                k += 0.3
        for n in lines:
            wipe(n, k); k += 0.35
        for n in rects:
            stretch_x(n, k, 0.45); k += 0.2
        for n in types:
            if rects:
                slide(n, k + 0.1, dx=0, dy=0, dur=0.35)      # text inside a pill: fade in place
            else:
                rise(n, k + 0.1, 22)

    def row(names, t, beat):
        names = [n for n in names if n in info]
        cells = set(beat.get("cells", [])) | {n for n in names if src == "psd" and info[n]["kind"] == "shape"}
        labels = set(beat.get("labels", [])) | {n for n in names if info[n]["kind"] == "type"}
        dots = [n for n in names if n not in cells and n not in labels and area(n) < 2500]
        others = [n for n in names if n not in cells and n not in labels and n not in dots]
        k = t
        for i, n in enumerate([n for n in names if n in cells]):
            stretch_x(n, k + i * 0.08, 0.45)
        if cells:
            k += 0.25
        for n in dots:
            pop(n, k, peak=140)
        for n in [n for n in names if n in labels] + others:
            slide(n, k + (0.06 if dots else 0))

    # background texture: slow push as an expression (keyframes would compound on re-runs)
    for n, v in info.items():
        b = v["bb"]
        if n.lower() != "background" and v["kind"] in ("pixel", "vector") and b[2] - b[0] >= W - 20 and b[3] - b[1] >= H - 20:
            o = op(n); o["anchor"] = [W / 2, H / 2]
            o["expr"]["scale"] = "value*(1+0.06*linear(time,0,%.2f,0,1))" % D

    # base: panels unfold, header cells stretch, header text slides, base icons build
    bt = 0.15
    base = [n for n in B.get("base", []) if n in info]
    panels = [n for n in B.get("panels", []) if n in info] or [n for n in base if src == "psd" and info[n]["kind"] == "shape" and area(n) > 0.15 * W * H]
    cells = [n for n in B.get("headerCells", []) if n in info] or [n for n in base if src == "psd" and info[n]["kind"] == "shape" and n not in panels]
    for n in panels:
        unfold_y(n, bt); bt += 0.35
    for i, n in enumerate(cells):
        stretch_x(n, bt + i * 0.12)
    if cells:
        bt += 0.3
    rest = [n for n in base if n not in panels and n not in cells]
    base_txt = [n for n in rest if info[n]["kind"] == "type" or n in B.get("baseLabels", [])]
    base_pix = [n for n in rest if n not in base_txt]
    if base_pix:
        icon(base_pix + base_txt, bt, {"labels": base_txt})
    else:
        for i, n in enumerate(base_txt):
            slide(n, bt + i * 0.1)

    # ---- native-layer moves (rebuilt Illustrator scenes: real shape/text layers) ----
    def endpoints(n):
        v = info[n]
        return v.get("p0"), v.get("p1")

    def draw(n, t, dur, frm=None):
        """Draw a stroked path on with Trim Paths, starting from the end nearest `frm`."""
        o = op(n)
        p0, p1 = endpoints(n)
        rev = False
        if frm and p0 and p1:
            d0 = (p0[0] - frm[0]) ** 2 + (p0[1] - frm[1]) ** 2
            d1 = (p1[0] - frm[0]) ** 2 + (p1[1] - frm[1]) ** 2
            rev = d1 < d0
        o["trim"] = {"keys": [[t, 0], [t + dur, 100]], "reverse": rev}   # Trim at 0 hides the line: no opacity pop

    def tip(n, t, peak=135):
        pop(n, t, peak=peak)

    def text_opts(beat):
        return {k: beat[k] for k in ("blur", "tracking", "based") if k in beat}

    def rise(n, t, dy=22, dur=None, opts=None):
        """Text rises in. Live text layers get a Text Animator cascade (per char/word/line, see apply_anim
        textEntrance); anything else (PSD type flattened to pixels) moves as a whole layer."""
        slide(n, t, dx=0, dy=dy, dur=dur or 0.4)
        if info[n]["kind"] == "type":
            o = op(n)
            o["text"] = dict({"t": t, "dur": dur, "dy": dy, "fallback": o.pop("keys")}, **(opts or {}))
            o["keys"] = {}          # (anchor kept: the fallback keys are positions of that pivot)

    def spin(n, t, centre, speed):
        o = op(n)
        o["anchor"] = centre
        o["expr"]["rotation"] = "var d=time-%.2f; d>0 ? value + d*%.2f*Math.min(1,d/1.2) : value" % (t, speed)

    def point_of(x):
        if isinstance(x, str) and x in info:
            return cen(info[x]["bb"])
        return x

    def members(beat):
        """beat layers + every layer of the named designer group(s) (SVG sources), in paint order."""
        names = list(beat.get("layers", []))
        g = beat.get("group")
        if g:
            gs = g if isinstance(g, list) else [g]
            found = [n for n, v in sorted(info.items(), key=lambda kv: -kv[1].get("index", 0)) if v.get("group") in gs]
            if not found:
                problems.append("group not found: %r" % g)
            names += [n for n in found if n not in names]
        beat["layers"] = names
        return [n for n in names if n in info]

    auto_parents = {}

    def auto(names, t, beat):
        """Animate a designer group by element type: containers pop (largest first), each line's start dot pops,
        the line draws on from that dot, its arrowhead lands on arrival, leftover small pieces pop, text rises
        last. Pieces lying inside a container are parented to it, so they move and scale with it."""
        small_area = beat.get("small", 2500)
        dur, gap, snap = beat.get("dur", 0.8), beat.get("gap", 0.12), beat.get("snap", 30)
        lines = [n for n in names if info[n]["kind"] == "line"]
        texts = [n for n in names if info[n]["kind"] == "type"]
        rest = [n for n in names if n not in lines and n not in texts]
        small = [n for n in rest if area(n) <= small_area]
        big = sorted([n for n in rest if area(n) > small_area], key=area, reverse=True)
        k = t
        for i, n in enumerate(big):
            pop(n, k + i * gap, peak=beat.get("peak", 108), rot=beat.get("rot") if i else None)
        if big:
            k += 0.25 + gap * (len(big) - 1)

        def dist(pt, n):
            c = cen(info[n]["bb"])
            return ((c[0] - pt[0]) ** 2 + (c[1] - pt[1]) ** 2) ** 0.5

        def roundish(n):
            b = info[n]["bb"]; w, h = b[2] - b[0], b[3] - b[1]
            return abs(w - h) <= 0.2 * max(w, h, 1)

        used, end = set(), k
        for i, ln in enumerate(lines):
            p0, p1 = info[ln].get("p0"), info[ln].get("p1")
            s0 = k + i * gap
            starts, tips, frm = [], [], p0
            if p0 and p1:
                cand = [n for n in small if n not in used]
                at0 = [n for n in cand if dist(p0, n) < snap and dist(p0, n) <= dist(p1, n)]
                at1 = [n for n in cand if dist(p1, n) < snap and dist(p1, n) < dist(p0, n)]
                # a round dot marks where a connector starts; an arrowhead marks where it ends
                if any(roundish(n) for n in at1) and not any(roundish(n) for n in at0):
                    start1 = True
                elif any(roundish(n) for n in at0):
                    start1 = False
                else:
                    start1 = bool(at0) and not at1
                frm = p1 if start1 else p0
                starts, tips = (at1, at0) if start1 else (at0, at1)
            if beat.get("from") is not None:              # explicit override
                frm = point_of(beat["from"])
            for j, n in enumerate(starts):
                pop(n, s0 + j * 0.05, peak=150); used.add(n)
            d0 = s0 + (0.15 if starts else 0)
            draw(ln, d0, dur, frm)
            for n in tips:
                tip(n, d0 + dur - 0.05); used.add(n)
            end = max(end, d0 + dur)
        others = [n for n in small if n not in used]
        for j, n in enumerate(others):
            pop(n, k + j * 0.06, peak=140)
        tt = min(end, k + 0.4) if lines else max(k, t + 0.3)
        for j, n in enumerate(texts):
            rise(n, tt + j * gap, beat.get("dy", 18), opts=text_opts(beat))
        # parent every piece that lies inside a container of this beat (smallest container that holds it)
        for n in names:
            if info[n]["kind"] == "line":
                continue
            b, best = info[n]["bb"], None
            for cn in big:
                if cn == n or area(cn) < 3 * area(n):
                    continue
                cb = info[cn]["bb"]
                if b[0] >= cb[0] - 2 and b[1] >= cb[1] - 2 and b[2] <= cb[2] + 2 and b[3] <= cb[3] + 2:
                    if best is None or area(cn) < area(best):
                        best = cn
            if best:
                auto_parents[n] = best

    hub = cen(info[B["hub"]]["bb"]) if B.get("hub") in info else None
    for beat in B["beats"]:
        if beat.get("group"):
            members(beat)
        if "at" in beat:
            t = float(beat["at"])
        else:
            i = stream.find(norm(beat["phrase"]), pos)
            if i < 0:
                problems.append("phrase not found after scene start: %r" % beat["phrase"])
                continue
            pos = i   # next search starts at this match: beats may share a phrase
            t = max(0.1, round(B["offset"] + words[owner[i]]["s"] - B["sceneStart"] - 0.1, 2))
        t = round(t + beat.get("delay", 0), 2)   # e.g. land a node when its connector arrives
        kind = beat.get("kind", "icon")
        names = beat["layers"]
        if kind == "draw":
            # connectors drawn one after another (gap), each from the end nearest "from"; tips pop on arrival
            dur, gap, frm = beat.get("dur", 0.7), beat.get("gap", 0.08), point_of(beat.get("from"))
            k = t
            for n in [n for n in names if n in info]:
                draw(n, k, dur, frm); k += gap
            for n in [n for n in beat.get("tips", []) if n in info]:
                tip(n, t + dur + (len(names) - 1) * gap - 0.05)
            beat["_t"] = t
            continue
        if kind == "label":
            for i, n in enumerate([n for n in names if n in info]):
                rise(n, t + i * beat.get("gap", 0.08), beat.get("dy", 22), opts=text_opts(beat))
            beat["_t"] = t
            continue
        if kind == "pop":
            for i, n in enumerate([n for n in names if n in info]):
                pop(n, t + i * beat.get("gap", 0.07), peak=beat.get("peak", 112), rot=beat.get("rot"))
            beat["_t"] = t
            continue
        if kind == "spin":
            c0 = point_of(beat.get("center"))
            for n in [n for n in names if n in info]:
                spin(n, t, c0, beat.get("speed", 10))
            beat["_t"] = t
            continue
        if kind == "auto":
            auto([n for n in names if n in info], t, beat)
            beat["_t"] = t
            continue
        if kind == "row":
            row(names, t, beat)
        elif kind == "line":
            for n in names:
                if n in info:
                    wipe(n, t, 0.7)
        elif kind == "stagger":
            for i, n in enumerate([n for n in names if n in info]):
                drop(n, t + i * 0.07)
        else:
            off = B.get("fly")
            present = [n for n in names if n in info]
            if hub and B["hub"] not in names and present:
                bbs = [info[n]["bb"] for n in present]
                gc = cen([min(b[0] for b in bbs), min(b[1] for b in bbs), max(b[2] for b in bbs), max(b[3] for b in bbs)])
                off = [(hub[0] - gc[0]) * 0.55, (hub[1] - gc[1]) * 0.55]
            icon(names, t, beat, off)
        beat["_t"] = t
    # parenting: children stay attached to their container (icon inside a card, label on a pill)
    allp = dict(auto_parents)
    allp.update(B.get("parents") or {})          # explicit parents win over detected ones
    for child, parent in allp.items():
        if child in info and parent in info:
            op(child)["parent"] = parent
            op(parent)
        else:
            problems.append("parent pair not found: %r -> %r" % (child, parent))
    # parents must be applied before their children
    order = list(ops.values())
    order.sort(key=lambda o: 1 if o.get("parent") else 0)
    json.dump({"comp": B["comp"], "ops": order}, open(out_path, "w", encoding="utf-8"))
    for beat in B["beats"]:
        if "_t" in beat:
            print("%6.2fs  %-7s %s" % (beat["_t"], beat.get("kind", "icon"), ", ".join(beat["layers"])[:80]))
    print("%d layers animated (positions from %s) -> %s" % (len(ops), src, out_path))
    print("\n".join(sorted(set(problems))) if problems else "all layers and phrases found")


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--list":
        list_psd(sys.argv[2])
    elif len(sys.argv) == 3:
        main(sys.argv[1], sys.argv[2])
    else:
        sys.exit(__doc__)
