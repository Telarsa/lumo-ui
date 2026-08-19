# Review brief — blind rubric pass, 18 Aug 2026

For a fresh session with no authorship of the window under review. The last
dated sheet is `docs/history/rubric-2026-08-17.md` (self-scored 7.9, so
plausibly 7.4–7.9 blind, by that sheet's own note). Everything since is
unscored, and the author of those changes must not be the scorer (rubric
rule 3) — that is why this brief exists.

## Protocol

Fill in `docs/rubric.md` §2 for Lumo at the current HEAD; report the sheet, the
weighted overall, and the delta per criterion against the 17 Aug sheet. One
line of evidence per criterion — a `file:line`, or a command and its output.
Rule 4: no N/A; a criterion with no evidence scores what exists. Orient with
`graphify query` / `path` / `explain` before reading raw source. Re-run
instruments rather than trusting their last report: `pnpm verify` (22 gates),
`pnpm run evidence` (Playwright; needs `pnpm --filter @lumo-ui/website build`
first), `flutter test` in `packages/mobile` and `apps/mobile-gallery`.

Write the sheet as `docs/history/rubric-2026-08-18-blind.md`.

## What changed since the 17 Aug sheet (claims to verify, not accept)

Decisions §46–§48 in `docs/decisions/log.md` are the primary record. In brief:

- **`LumoStyles`** (§46): mobile customisation surface — `ThemeExtension`
  registry, per-family style bags, appearance-only enforced by a generator
  allow-list (`scripts/build-mobile-styles.mjs`, `gate:mobile-styles`), floors
  that can only grow. Three families wired (button/card/item); 73 not.
- **Consumer upgrade evidence** (§47): the reference app
  (`telarsa-projects/example-projects/lumo-app-flutter`, branch
  `test/consumer-upgrade-goldens`) pins released v0.2.3 and diffs 61 screens
  against the checkout. Claim: pixel-neutral except one dev button. Found and
  fixed: `LumoRating` threw under any intrinsic-width parent; the app shipped a
  30 dp tap target.
- **Stress instruments on both platforms** (§48):
  `apps/mobile-gallery/test/composition_stress_test.dart` (2× text, 320 dp,
  IntrinsicWidth; three defects fixed — `LumoSpinner` label overflow,
  `LumoAppBar` fixed-height overflow at 2×, a demo's rigid Row; floors
  asserted) and `evidence/tests/stress.spec.ts` (every component route at
  320 px and 200% root font; first run 255/348 failing → 0, via five
  root-caused fixes, one of them in the LIBRARY: `tabListVariants` had no
  overflow handling). `evidence/tests/console.spec.ts` sweeps every built
  route for console errors/uncaught exceptions/failed requests.
- **Honest remainders, pinned not hidden:** 7 routes with purely scrollable
  overflow at 200% (`KNOWN_SIDEWAYS_AT_200`, cause unfound); 17 demos that
  cannot report an intrinsic width (`kNoIntrinsicWidth`, structural); tap
  targets iOS 28/120, Android 39/120 (M8, needs a redraw); no screen-reader
  transcript on any platform; device run is by hand, not CI.

Weigh those remainders as the rubric directs — they are recorded facts, and
whether "pinned and honest" earns more than "absent" is the scorer's call, not
the author's.
