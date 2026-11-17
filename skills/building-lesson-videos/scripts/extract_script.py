"""Read a two-column lesson script PDF (Transcript/Audio | Animation/Visual) into rows.

    python extract_script.py SCRIPT.pdf OUT_DIR

Writes:
  OUT_DIR/script_rows.md    one block per table row: narration, visual direction, highlighted phrases
                            (with colour), embedded image count. Read this to plan cues and scenes.
  OUT_DIR/script_rows.json  the same, machine-readable.
  OUT_DIR/page_XX.png       page renders (80 dpi), to look at reference images the script embeds.

Quiz/question boxes (large filled boxes, typically purple) are skipped and reported, not parsed as rows.
Requires PyMuPDF:  pip install --user pymupdf
"""
import json
import os
import re
import sys

import pymupdf

NAMED = {(1.0, 1.0, 0.0): "yellow", (0.0, 1.0, 1.0): "cyan", (1.0, 0.0, 1.0): "magenta", (0.0, 1.0, 0.0): "green"}


def colour_name(c):
    key = tuple(round(x, 2) for x in c)
    return NAMED.get(key, "rgb(%.2f,%.2f,%.2f)" % key)


def is_white(c):
    return all(x > 0.97 for x in c)


def main(pdf_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    rows, quiz_pages, no_table_pages = [], [], []
    split_x = None
    header_text = ""
    for pno, page in enumerate(doc, 1):
        page.get_pixmap(dpi=80).save(os.path.join(out_dir, "page_%02d.png" % pno))
        words = page.get_text("words")  # x0, y0, x1, y1, text, block, line, wordno
        if pno == 1:
            header_text = page.get_text()[:800]
        drawings = page.get_drawings()
        # column split: the table's vertical rule nearest the page centre (headers are centred, so
        # their x is not the column edge); remembered across pages, page middle as last resort
        vx = []
        for d in drawings:
            for item in d["items"]:
                if item[0] == "l" and abs(item[1].x - item[2].x) < 1 and abs(item[1].y - item[2].y) > 40:
                    vx.append(item[1].x)
                elif item[0] == "re" and item[1].width < 2 and item[1].height > 40:
                    vx.append(item[1].x0)
        mid = page.rect.width / 2
        inner = [x for x in vx if page.rect.width * 0.25 < x < page.rect.width * 0.75]
        if inner:
            split_x = min(inner, key=lambda x: abs(x - mid))
        sx = split_x or mid
        hl_rects, quiz_rects, hlines = [], [], []
        for d in drawings:
            r = d["rect"]
            fill = d.get("fill")
            if fill and not is_white(fill):
                rr_, gg_, bb_ = fill[:3]
                purple = bb_ > 0.45 and bb_ > gg_ + 0.15 and rr_ > gg_
                if r.height > 40 and r.width > page.rect.width * 0.6:
                    if purple:
                        quiz_rects.append(r)      # big purple box = quiz / question block (skip it)
                elif r.height <= 40:
                    hl_rects.append((r, colour_name(fill)))
            for item in d["items"]:              # table rules: long horizontal lines
                if item[0] == "l":
                    p1, p2 = item[1], item[2]
                    if abs(p1.y - p2.y) < 1 and abs(p1.x - p2.x) > page.rect.width * 0.5:
                        hlines.append(p1.y)
                elif item[0] == "re":
                    rr = item[1]
                    if rr.height < 2 and rr.width > page.rect.width * 0.5:
                        hlines.append(rr.y0)
        if quiz_rects:
            quiz_pages.append(pno)
        hlines = sorted(set(round(y) for y in hlines))
        if not hlines:
            # no table rules on this page: it is not part of the narration table (notes, description...)
            no_table_pages.append(pno)
            continue
        bands = list(zip(hlines, hlines[1:]))

        def in_quiz(wr):
            return any(q.intersects(wr) for q in quiz_rects)

        for y0, y1 in bands:
            band_words = [w for w in words if y0 <= (w[1] + w[3]) / 2 < y1 and not in_quiz(pymupdf.Rect(w[:4]))]
            band_words = [w for w in band_words if w[1] > 60 or pno == 1]  # drop running page header
            if not band_words:
                continue
            narr = [w for w in band_words if w[0] < sx]
            vis = [w for w in band_words if w[0] >= sx]

            def text_of(ws):
                ws = sorted(ws, key=lambda w: (round(w[1] / 4), w[0]))
                return " ".join(w[4] for w in ws).strip()

            def highlights(ws):
                runs, cur = [], None
                for w in sorted(ws, key=lambda w: (round(w[1] / 4), w[0])):
                    wr = pymupdf.Rect(w[:4])
                    col = None
                    for r, c in hl_rects:
                        if r.intersects(wr) and (wr & r).get_area() > 0.5 * wr.get_area():
                            col = c
                            break
                    if col and cur and cur["colour"] == col:
                        cur["text"] += " " + w[4]
                    elif col:
                        cur = {"colour": col, "text": w[4]}
                        runs.append(cur)
                    else:
                        cur = None
                return runs

            imgs = 0
            for info in page.get_image_info():
                b = pymupdf.Rect(info["bbox"])
                if y0 <= (b.y0 + b.y1) / 2 < y1:
                    imgs += 1
            rows.append({"page": pno, "narration": text_of(narr), "visual": text_of(vis),
                         "narration_highlights": highlights(narr), "visual_highlights": highlights(vis), "images": imgs})
    # keep only the narration table: start after its header row (drops the metadata table above it) ...
    def is_header(r):
        n, v = r["narration"].lower(), r["visual"].lower()
        return ("transcript" in n or "audio" in n or "narration" in n) and ("visual" in v or "animation" in v or "screen" in v)
    starts = [i for i, r in enumerate(rows) if is_header(r)]
    dropped_head = 0
    if starts:
        dropped_head = starts[0] + 1
        rows = rows[starts[0] + 1:]
    # ... and stop at the end-of-lesson questions / question table
    end_pat = r"(end[- ]of[- ]lesson questions|lesson questions|^s/?n\b|comments\s*:|lesson description\s*:|lesson tags\s*:|^references\s*:)"
    ends = [i for i, r in enumerate(rows) if re.search(end_pat, r["narration"].strip().lower())]
    # a row that starts with narration and then hits "Comments:" keeps its narration part
    if ends:
        r0 = rows[ends[0]]
        m = re.search(r"(comments\s*:|lesson description\s*:|lesson tags\s*:)", r0["narration"], re.I)
        if m and m.start() > 0:
            r0["narration"] = r0["narration"][:m.start()].strip()
            ends[0] += 1
    dropped_tail = 0
    if ends:
        dropped_tail = len(rows) - ends[0]
        rows = rows[:ends[0]]
    print("dropped %d rows before the narration table and %d question rows after it" % (dropped_head, dropped_tail))
    with open(os.path.join(out_dir, "script_rows.json"), "w", encoding="utf-8") as f:
        json.dump({"header": header_text, "quiz_pages": quiz_pages, "rows": rows}, f, indent=1, ensure_ascii=False)
    with open(os.path.join(out_dir, "script_rows.md"), "w", encoding="utf-8") as f:
        f.write("# Script rows: %s\n\nQuiz boxes skipped on pages: %s\n\n" % (os.path.basename(pdf_path), quiz_pages or "none"))
        for i, r in enumerate(rows, 1):
            f.write("## Row %d (page %d)\n" % (i, r["page"]))
            f.write("**Narration:** %s\n\n**Visual:** %s\n\n" % (r["narration"] or "-", r["visual"] or "-"))
            for side in ("narration_highlights", "visual_highlights"):
                for h in r[side]:
                    f.write("- %s %s: %s\n" % (side.split("_")[0], h["colour"], h["text"]))
            if r["images"]:
                f.write("- embedded reference images: %d (see page_%02d.png)\n" % (r["images"], r["page"]))
            f.write("\n")
    print("rows: %d, quiz boxes skipped on pages: %s, pages without a table (skipped): %s -> %s" % (len(rows), quiz_pages, no_table_pages, out_dir))
    print("Rows can split across pages; merge a row whose narration continues mid-sentence on the next page.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
