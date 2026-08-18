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
| WCAG AA text contrast | 39/120 | **74/120** | **~2× worse on the device** |

The first three agreeing is the useful part: it says the host instrument is sound
for semantics and geometry, and the numbers reported from it can be trusted.

**The contrast number cannot.** `MinimumTextContrastGuideline` samples the pixels
that were actually painted. On the host that is a substitute font at a device
pixel ratio of 1; on the device it is the real text stack at dpr 3, where small
glyphs cover far less of each logical pixel. The host therefore under-reports —
and it under-reports in the REASSURING direction, which is the worst way for a
measurement to be wrong.

So: **62% of demos fail WCAG AA contrast on a real phone, not 32%.** The
offenders are `fgMuted` and `fgSubtle` at 12px. The host ceiling in
`semantics_grader_test.dart` is kept as a regression tripwire, and is labelled
there as known-optimistic so nobody cites it as the real figure.

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
