# Tutor in/out transitions

Each cut between the tutor and a full-screen graphic gets a transition whose **full-cover frame lands exactly on the cut**, which makes the cut invisible.

- **Tutor comes ON screen** (graphic → tutor, including right after the intro): the library's "in" transition.
- **Tutor goes OFF screen** (tutor → graphic): the "out" transition.
- Back-to-back full-screen graphics: no transition. Overlays on the tutor (text bars, lower thirds, text boxes): not a cut, no transition.

Which comps to use is a library/user rule (see the catalogue); the user often drops the two transition comps on the timeline as a hint. **If no transitions are supplied, create them** with `make_transition.jsx` (styles `panels` and `iris`, in the template's colours and motion direction: see motion-design.md "Transitions"). Its result gives the exact `cover` time, so step 1 below can be skipped for created transitions; still QC them at a cut.

## 1. Measure each transition's cover frame
Render ~20 frames across the transition comp and measure:
```
qc_frames.jsx  {"compId": <transition comp id>, "times": [0.40, 0.44, ... 1.20], "outDir": "<work>/qc_tr_in", "prefix": "TR"}
python scripts/measure_coverage.py <work>/qc_tr_in --prefix TR
```
Use the middle of the fully covered window (e.g. 1.00 at 0.76–0.80 s → 0.78). A transition that never reaches ~1.00 can't hide a cut; tell the user.

## 2. Place
```
place_transitions.jsx {"mainId": ..., "tutorSourceId": ..., "inCompId": ..., "inCover": 0.78,
                       "outCompId": ..., "outCover": 0.77, "overlayPattern": " OST |lower third|Blue bar"}
```
It removes earlier instances of both transition comps (including the user's sample layers: say so), merges touching full-screen scenes into blocks, and places one transition per tutor↔graphic cut. It names them `IN <scene>` / `OUT <scene>`. Re-run it whenever scenes move.

## 3. Check
QC frames at a few cuts: 0.5 s before, the cut itself (should be 100% transition), and 0.5 s after. If an overlay was treated as full-screen (a transition appears while the tutor is still visible), add its name pattern to `overlayPattern` and re-run.
