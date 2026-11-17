"""Turn a hand-written cue list into timed markers by finding each cue's words in the transcript.

    python align_cues.py CUES.json TRANSCRIPT.json OUT_markers.json --offset 7.32 [--stretch 100]

CUES.json - written by the agent from script_rows.md, one entry per script row, in spoken order:
  [{"id": "S01", "kind": "TUTOR", "label": "Show the tutor", "anchor": "hello and welcome to this lesson",
    "highlights": ["three tier", "responsibilities of the different"]},
   {"id": "CUT", "kind": "CUT", "label": "Topic: Roles of government", "anchor": "hello and welcome back"}, ...]
  kind: TUTOR | ON-SCREEN TEXT | TEXT | ASSET | CUT
  anchor: the first 4-6 words of the row's narration AS SPOKEN (check the transcript .txt, not the script).
  highlights: phrases that appear on screen and should be revealed when spoken, in spoken order.

--offset: comp time where the tutor recording starts (tutor layer startTime from probe_project).
Matching ignores case, punctuation and spacing, and searches forward from the previous match,
so repeated phrases resolve to the right occurrence. Prints every row with comp time and duration,
and lists anything not found (fix the anchor wording and rerun).

OUT_markers.json: [{"t": comp_time, "c": comment, "label": colour_index, "d": duration_for_rows}]
"""
import argparse
import json
import re

COLOURS = {"TUTOR": 9, "ON-SCREEN TEXT": 3, "TEXT": 1, "ASSET": 8, "CUT": 10, "HL": 2}  # AE label colours


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cues")
    ap.add_argument("transcript")
    ap.add_argument("out")
    ap.add_argument("--offset", type=float, required=True)
    ap.add_argument("--stretch", type=float, default=100.0)
    a = ap.parse_args()
    cues = json.load(open(a.cues, encoding="utf-8-sig"))
    segs = json.load(open(a.transcript, encoding="utf-8-sig"))
    words = [w for s in segs for w in s["words"]]
    stream, owner = [], []
    for i, w in enumerate(words):
        for ch in norm(w["w"]):
            stream.append(ch)
            owner.append(i)
    stream = "".join(stream)
    k = a.stretch / 100.0

    def ct(word_index):
        return round(a.offset + words[word_index]["s"] * k, 3)

    markers, problems, pos = [], [], 0
    for c in cues:
        i = stream.find(norm(c["anchor"]), pos)
        if i < 0:
            problems.append("%s: anchor not found after previous cue: %r" % (c["id"], c["anchor"]))
            continue
        pos = i
        label = c.get("label", "")
        comment = ("CUT | " + label) if c["kind"] == "CUT" else "%s %s: %s" % (c["id"], c["kind"], label)
        markers.append({"t": ct(owner[i]), "c": comment, "label": COLOURS.get(c["kind"], 0), "row": True, "id": c["id"]})
        hp = i
        for h in c.get("highlights", []):
            j = stream.find(norm(h), hp)
            if j < 0:
                problems.append("%s: highlight not found: %r" % (c["id"], h))
                continue
            markers.append({"t": ct(owner[j]), "c": "   - " + h, "label": COLOURS["HL"], "row": False, "id": c["id"]})
            hp = j + 1
    rows = [m for m in markers if m["row"]]
    end = round(a.offset + words[-1]["e"] * k, 3)
    for m, nxt in zip(rows, rows[1:] + [None]):
        m["d"] = round((nxt["t"] if nxt else end) - m["t"], 3)
    times = [m["t"] for m in markers]
    if any(x > y for x, y in zip(times, times[1:])):
        problems.append("markers are not in time order - an anchor matched too late; check the cue order")
    json.dump(markers, open(a.out, "w", encoding="utf-8"), indent=1)
    # cue sheet for the user (opens in Excel): timecode at the main comp's frame rate is approximate (25 fps)
    import csv
    csv_path = a.out.rsplit(".", 1)[0] + "_cue_sheet.csv"
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["Comp time (s)", "Timecode", "Duration (s)", "Cue", "Highlights (time s)"])
        for m in rows:
            hl = ["%s @ %.2f" % (x["c"].strip(" -"), x["t"]) for x in markers if not x["row"] and x["id"] == m["id"]]
            fr = round(m["t"] * 25)
            tc = "%02d:%02d:%02d:%02d" % (fr // 90000, fr // 1500 % 60, fr // 25 % 60, fr % 25)
            w.writerow(["%.2f" % m["t"], tc, "%.2f" % m["d"], m["c"], " | ".join(hl)])
    print("cue sheet: " + csv_path)
    for m in rows:
        print("%8.2f  (%5.1fs)  %s" % (m["t"], m["d"], m["c"]))
    print("\n%d rows, %d highlights -> %s" % (len(rows), len(markers) - len(rows), a.out))
    print("\n".join(problems) if problems else "all anchors and highlights found")


if __name__ == "__main__":
    main()
