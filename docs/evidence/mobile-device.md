<!--
  STILL LOAD-BEARING, and NO LONGER REPRODUCIBLE as written.

  The numbers below are why `LumoTouch.floor` is 44 and why `styles.dart`
  refuses to clamp a tap target under it — `scope.dart:148` and
  `styles.dart:266` both cite this file by name, so it stays.

  What cannot be re-run is the procedure: it drives
  `apps/mobile-gallery/integration_test/device_evidence_test.dart`, and the
  gallery retired with the mobile widget roster in §54. Re-measuring today would
  mean writing the equivalent against `apps/mobile-example`, which has one
  screen rather than 120 demos — a smaller sample for the same question.

  Treat it as a dated measurement with its device and build recorded, which is
  what it is.
-->

# Mobile device evidence — what one run on real hardware proved

`apps/mobile-gallery/integration_test/device_evidence_test.dart`, run against a
physically attached device:

```
cd apps/mobile-gallery
flutter test integration_test/device_evidence_test.dart -d <device-id>
```

It renders every gallery demo in both locales and applies the SAME rules the host
sweep applies — imported from `lib/src/semantics_rules.dart`, one implementation,
so a device number and a host number are comparable rather than merely similar.

## The run of 18 Aug 2026

| | |
|---|---|
| Device | iPhone, iOS 26.6 (23G71), 1179×2556 physical px at dpr 3.0 |
| Flutter | 3.35.2 stable |
| Corpus | 120 demos × 2 locales = 240 renders |
| Result | **240 rendered, 0 failed** |

Nothing in the library failed to build, sign, install or render on real iOS
hardware. Until this run that was unproven: every mobile test in this repo was
`flutter test` on the host.

## Host and device, side by side

| Check | Host | Device | |
|---|---:|---:|---|
| The four semantics rules | 0 violations | **0 violations** | agrees |
| iOS 44 pt tap target | 48/120 | **48/120** | agrees exactly |
| Android 48 dp tap target | 72/120 | **73/120** | +1 |
| WCAG AA text contrast | 39/120 | 74/120 | **neither number means anything — see below** |

The first three agreeing is the useful part: it says the host instrument is sound
for semantics and geometry, and the numbers reported from it can be trusted.

## CORRECTION — the contrast figure was wrong, and so was the explanation

This file first reported "**62% of demos fail WCAG AA contrast on a real phone**"
and blamed `fgMuted`/`fgSubtle` at 12px. Both halves were wrong, and neither had
been computed before being written down.

Computing the token pairs directly (achromatic brand, luminance from the oklch
lightness) says every one of them PASSES:

| pair | light | dark |
|---|---:|---:|
| `fgMuted` on `bg` | 5.75:1 | 7.70:1 |
| `fgSubtle` on `bg` | 4.86:1 | 6.36:1 |

So the failures were not the colours. Reading the guideline's own messages across
all 120 demos, of **93 reported failures in 39 demos**:

| what the text was compared against | failures | demos |
|---|---:|---:|
| fully TRANSPARENT — the widget paints no fill of its own | 84 | 37 |
| a 10% tint, never composited over the surface beneath it | 9 | 3 |
| a genuinely OPAQUE background | **0** | **0** |

`MinimumTextContrastGuideline` samples the background a widget paints FOR ITSELF
and does not composite it over what is behind. A ghost button's label is compared
against nothing at all, which is where the 1.06:1 ratios come from. **Not one of
the 93 is a contrast defect a reader would experience.**

That also disposes of the host-versus-device gap: 39 against 74 is this artifact
moving with the rendering, not the host being optimistic about real contrast.

**What replaced it.** The contrast ratchet is gone — a ratchet on a metric that
is entirely artifact fires on innocent changes and never on a real one. The floor
is now `opaqueContrastMisses`: the subset the guideline can actually judge,
asserted at ZERO. The raw count is still printed, labelled
`39 reported / 0 judgeable`, so the artifact stays visible without being
mistaken for a result.

## What this run does NOT prove

- **It is not a screen-reader run.** Nothing here asks iOS what VoiceOver would
  speak. It reads the same semantics tree the host tests read, on hardware. An
  ARIA/semantics tree is the INPUT to a screen reader, not its output. No
  VoiceOver, TalkBack, NVDA, JAWS or Narrator claim exists for this library.
- **One device, one OS, one screen.** 1179×2556 at 3x is a large modern iPhone.
  Nothing here says anything about a small phone, a tablet, Android, a different
  text-scale setting, or a device with «Increase Contrast» or «Reduce Motion» on.
- **It is not in CI.** It needs an attached, signed device. It is a thing a human
  runs, and the date above is when a human last ran it.
