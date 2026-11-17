"""Check that every on-screen text overlay lands on its spoken words (NIA rule: on the word, or up to 0.5 s before it; never late).

    python ost_timing_audit.py <work>/transcript.json <work>/ost_check.json --offset 8.0

ost_check.json lists the overlays (from list_layers.jsx) and the phrase each one belongs to:
  [ {"layer": "S08 OST Request save state handler return", "start": 201.64, "lands_after": 1.5,
     "phrase": "accepts an eligible request", "after": 190} , ... ]
  start        the overlay layer's in point on the main comp (comp seconds)
  lands_after  seconds from the layer's start until its text is readable (NIA pill presets ~1.4-1.5 s; wave bar ~1.0 s;
               measure once per preset with qc frames and reuse)
  phrase       the words the text should LAND ON, starting with that word (its first word is the target time); usually
               the keyword or the scene plan's "land on" words, not the start of the sentence. Copy the transcript's
               spelling (mishearings included).
  after        optional comp time to search from, when the phrase is said more than once
--offset is the tutor's start on the main comp (the intro offset; CSC1101: 8.0 s).
Written 2026-11-17 after the CSC1101 review found S08's text 9 s early.
"""
import argparse
import json
import re
import sys


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def find(words, phrase, after):
    target = [norm(w) for w in phrase.split() if norm(w)]
    seq = [norm(w["w"]) for w in words]
    for i in range(len(seq) - len(target) + 1):
        if words[i]["t"] < after:
            continue
        if seq[i:i + len(target)] == target:
            return words[i]["t"]
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript")
    ap.add_argument("plan")
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--early", type=float, default=0.5, help="allowed lead before the word (s)")
    ap.add_argument("--late", type=float, default=0.15, help="allowed lag after the word (s)")
    a = ap.parse_args()
    segs = json.load(open(a.transcript, encoding="utf-8"))
    words = [{"w": w["w"], "t": w["s"] + a.offset} for s in segs for w in s["words"]]
    plan = json.load(open(a.plan, encoding="utf-8"))
    bad = 0
    print("%-48s %8s %8s %7s  %s" % ("overlay", "lands", "word", "delta", "verdict"))
    for p in plan:
        land = p["start"] + p.get("lands_after", 1.4)
        t = find(words, p["phrase"], p.get("after", 0))
        if t is None:
            print("%-48s %8.2f %8s %7s  PHRASE NOT FOUND: %r" % (p["layer"][:48], land, "-", "-", p["phrase"]))
            bad += 1
            continue
        d = land - t
        if d < -a.early:
            v = "EARLY by %.1f s" % (-d)
        elif d > a.late:
            v = "LATE by %.1f s" % d
        else:
            v = "ok"
        if v != "ok":
            bad += 1
        print("%-48s %8.2f %8.2f %+7.2f  %s" % (p["layer"][:48], land, t, d, v))
    print("flagged:", bad, "of", len(plan))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
