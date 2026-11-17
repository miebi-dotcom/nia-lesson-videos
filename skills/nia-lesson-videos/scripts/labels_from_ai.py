"""Build the DATA file for fix_labels.jsx from a designer's Illustrator file (the .ai keeps LIVE text even when the SVG export
outlines it). Diagram labels are retyped as Inter: Bold for box/node labels, Medium for the rest (sizes = designer x 0.86 inside
fix_labels.jsx). SF Fourche titles are left out (the rebuilt title stays as it is).

    python labels_from_ai.py "<path>/02 Input and output.ai" 6843 S03 <work>/fix_S03.json [--dry]

Needs building-lesson-videos/scripts/ai_extract.py next to this skill (both skills installed side by side).
Check the result against the designer PNG: ai_extract merges lines of one text object that sit side by side (table columns,
two labels in one block). Split those by hand in the JSON using the PNG (or pymupdf per-span boxes) before running fix_labels.jsx.
Proven on CSC1101 (14 diagram scenes, 2026-11-16); combined into one script on 2026-11-17.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
AI_EXTRACT = os.path.normpath(os.path.join(HERE, "..", "..", "building-lesson-videos", "scripts", "ai_extract.py"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ai")
    ap.add_argument("comp_id", type=int)
    ap.add_argument("scene")
    ap.add_argument("out")
    ap.add_argument("--dry", action="store_true", help="fix_labels.jsx reports the plan without changing the comp")
    ap.add_argument("--bold-ratio", type=float, default=0.8, help="labels at least this fraction of the largest size are Bold")
    a = ap.parse_args()
    if not os.path.exists(AI_EXTRACT):
        sys.exit("ai_extract.py not found at " + AI_EXTRACT + " (install building-lesson-videos beside this skill)")
    tmp = tempfile.mkdtemp(prefix="ai_" + a.scene + "_")
    r = subprocess.run([sys.executable, AI_EXTRACT, a.ai, tmp], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("ai_extract failed:\n" + r.stderr[-2000:])
    els = json.load(open(os.path.join(tmp, "elements.json"), encoding="utf-8"))["elements"]
    texts = [e for e in els if e.get("kind") == "text"]
    titles = [t for t in texts if str(t.get("font", "")).startswith("SFFourche")]
    body = [t for t in texts if t not in titles]
    title_bottom = max([t["bb"][3] for t in titles], default=0)
    subtitle = None
    for t in sorted(body, key=lambda t: t["bb"][1]):
        if titles and 0 <= t["bb"][1] - title_bottom < 70:   # the line right under the title is a subtitle (Medium)
            subtitle = t
            break
    sizes = [t["size"] for t in body if t is not subtitle]
    biggest = max(sizes) if sizes else 0
    labels = []
    for t in body:
        bold = t is not subtitle and t["size"] >= a.bold_ratio * biggest
        labels.append({"text": t["text"], "color": t["color"], "bb": t["bb"], "size": t["size"], "bold": bold})
    data = {"comp": a.comp_id, "scene": a.scene, "dryRun": a.dry, "labels": labels}
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=1)
    print(a.scene, "->", a.out, "|", len(labels), "labels,", len(titles), "title block(s) left alone")
    for l in labels:
        print("  %-40s %5.1f %s" % (l["text"].replace("\r", "/")[:40], l["size"], "Bold" if l["bold"] else "Medium"))


if __name__ == "__main__":
    main()
