# Consumer upgrade evidence — does a real app move when the library moves?

Every other instrument in this repo grades the library against its own tests and
its own gallery. This one asks the question a consumer actually asks:

> If I take the next version of `lumo_ui_mobile`, does my app look different?

## The instrument

`example-projects/lumo-app-flutter` pins a RELEASED tag of the library
(`pubspec.yaml`, currently `v0.2.3`) and overrides it to the local checkout via
a gitignored `pubspec_overrides.yaml`. That makes a true before/after possible
in one working tree:

```
# 1. baseline — against the tag a consumer would be on today
mv pubspec_overrides.yaml /tmp/ && flutter pub get
flutter test test/khroos_golden_test.dart --update-goldens

# 2. candidate — against the checkout
mv /tmp/pubspec_overrides.yaml . && flutter pub get
flutter test test/khroos_golden_test.dart
```

`test/khroos_golden_test.dart` renders **61 screens** at a fixed 390×844 — every
customer and provider tab in Persian and English, the Persian dark scheme, 20
pushed overlays, 6 sheets and all 8 auth steps. Flutter's `LocalFileComparator`
fails on ANY differing pixel and writes the master, the candidate and a diff to
`test/failures/`, so the result is not "different" but *where*, and by how much.

**Both fonts are loaded.** Vazirmatn AND the Lucide icon font. The first run of
this comparison loaded only the typeface, so all 61 screens drew every icon as a
fallback tofu box — a pixel comparison that could not see icons at all, on a
library whose controls are mostly icons. That is a blind instrument, and the
numbers below are from the run after it was fixed.

## CORRECTION (19 Aug 2026) — the first corpus was blank, and the conclusion below is retracted

The blind rubric pass of 18 Aug proved that **all 61 goldens of the first run
had uniform, blank main-content crops**: the harness pumped ONE 400ms frame,
which is before the app shell's post-frame entrance animation even starts, so
every body sat at opacity 0. Comparing 61 blank bodies to 61 blank bodies can
only ever find differences in the chrome outside the animated shell — which is
exactly why the whole diff localised to the dev TweaksButton. The
"pixel-identical upgrade" conclusion below was VACUOUS for screen content and
is retracted; the section is kept unedited underneath as the record of the
mistake.

**The fixed instrument** (8×150ms pumps + two 400ms settling pumps, plus a
content-presence floor of ≥3 Text widgets per capture — a blank capture now
FAILS) re-ran the same comparison and found the opposite result:

| | |
|---|---:|
| Screens compared | 61 (all with real, unique bodies — probed) |
| Screens identical | 0 |
| Largest difference | ~1.0M px (`overlay-review-fa`) |

**And that is the correct result.** The pending release deliberately grows
every control's LAYOUT box to the 48dp touch floor
(`MaterialTapTargetSize.padded`, decision §45 of 18 Aug): a 36dp-drawn button
now OCCUPIES 48dp, so rows grow and everything below them shifts. The earlier
claim that the tap-target fix changed "no drawn pixel" conflated the drawn box
(unchanged) with the occupied box (grown); a real phone screen is composed of
occupied boxes. Two real defects fell out of the honest run:

- `LumoSearchField`'s input row (grown 44→48) overflowed the reference app's
  fixed-height 48dp search box by its 3px of borders — fixed in the app by
  flooring instead of fixing the height (`KSearchBar`).
- The consumer-facing statement for the next release must be: **upgrading past
  v0.2.3 visibly moves layouts** — deliberately, for touch-target compliance —
  and consumers with fixed-height slots around Lumo controls must floor them.

The goldens are re-baselined against the working checkout (the forward
baseline), with the content floor keeping the corpus honest from now on.

---

## The run of 18 Aug 2026 — v0.2.3 → working checkout

| | |
|---|---:|
| Screens compared | 61 |
| Screens identical | 1 |
| Screens differing | **60** |
| Largest difference | **0.01%** (323 px of 2,962,440) |

Sixty of sixty-one differ, and that number alone would read as a broad
regression. It is the opposite. Every differing pixel on all 60 screens falls
inside ONE bounding box:

| region (px, dpr 3) | in dp | screens |
|---|---|---:|
| `(51, 38) → (91, 77)` | 13.3 × 13.0 dp, top-start corner | 49 (Persian) |
| `(1107, 38) → (1147, 77)` | mirrored to the top-end corner | 11 (English) |

That is `TweaksButton` — the dev-only overlay pinned to the top inline-end of
every screen. Nothing else moved. Not one list row, card, chart, chat bubble,
form field, tab bar, app bar, sheet or auth step in 20,870 lines of application
code. The glyph itself is identical; it sits **0.67 dp** further along.

## Why that one moved, and what it exposed

The app was drawing it like this:

```dart
SizedBox(width: 30, height: 30, child: LumoIconButton(size: LumoButtonSize.sm, …))
```

Measured directly, the same button unconstrained is **48×48** — `LumoTouch.floor`,
which is Android's minimum and above iOS's. A tight 30 dp box silently overrode
it, so the app shipped a 30 dp tap target: under both platform floors, and
exactly the defect the library exists to make impossible. The 0.67 dp shift is
the library's centring arithmetic changing underneath a control squeezed to 62%
of the size it asks for.

The `SizedBox` is gone. Subtlety was already handled by the `Opacity(.55)` around
it; it was never a reason to ship an undersized target.

## The bug it found in the LIBRARY

One screen — `overlay/compare`, the provider comparison table — threw **22**
exceptions at phone width:

```
LayoutBuilder does not support returning intrinsic dimensions.
```

`LumoRating` wrapped itself in a `LayoutBuilder` unconditionally. A `Table` with
`IntrinsicColumnWidth` asks every cell how wide it wants to be, and a
`LayoutBuilder` cannot answer — so a read-only rating could not be put in a
comparison table, an `IntrinsicWidth`, or any parent that measures. All ordinary
places to put a rating.

The builder existed only to divide the row into touch cells for the INTERACTIVE
rating. The read-only path never read the constraint at all — `cell = drawn` —
so it was paying a hard restriction for a value it ignored. Read-only ratings
now build directly; interactive ones keep the builder and inherit the
restriction, which is documented on the widget. Two regression tests in
`packages/mobile/test/rating_test.dart` pin both halves.

**The app's own 19-test suite did not catch this**, because it renders overlays
at the default 800×600 test surface. The table only takes the intrinsic path at
phone width with three providers side by side. A test that never uses a phone's
width is not testing a phone.

## What this run does NOT prove

- **It is a host run.** Same substitute engine, dpr 1, no platform accessibility
  bridge. It compares two library versions under identical conditions, which is
  what makes it valid; it says nothing about how either looks on real hardware.
  That is `docs/evidence/mobile-device.md`.
- **61 screens, not all of them.** 20 of 46 overlays and 6 of 13 sheets, chosen
  to span the widest set of families. A regression confined to a family none of
  them uses would not appear here.
- **One app.** A different consumer, constraining controls differently, would
  meet different edges — as this one did, in exactly the place it fought the
  library's touch floor.
