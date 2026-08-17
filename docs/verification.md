# Verification

**4,601 automated tests today: 3,392 on the web, 669 in the mobile library, 540 over the mobile gallery.**

`pnpm run verify` runs **21 gates** in order — 14 for the web library and its
distribution, 6 for the mobile library, and the built-HTML grader last. CI runs
the same list, preceded by an Intl/ICU capability probe, plus **two separate
jobs**: mutation (web and mobile) and browser evidence. Roughly 25 minutes locally
(the Flutter gates and the site build dominate) — run it once at the end of a
change, not per edit.

CI installs the Flutter SDK, so the mobile gates run on the runner and not only
on a laptop. That was not true until 17 Aug 2026, and until then four gates were
graded locally and taken on trust in CI (decision §31).

## The gates, in the order `verify` runs them

| Gate | What it proves | What it cannot |
| --- | --- | --- |
| `gate:versions` | Every workspace package — including `packages/mobile`'s pubspec — carries the root's version, and `CHANGELOG.md` leads with it. One tag, one changelog entry per upgrade | That the changelog entry is accurate prose |
| `gate:types` | Whole workspace type-checks; `?: undefined` carriers and `@ts-expect-error` pins reject at compile time; a `.type-test.tsx` per family pins required strings, all-or-nothing unions and rejected inherited props | Runtime behaviour |
| `gate:consumer-profile` | Every copyable file also type-checks under a *consumer's* compiler — plain `strict`, no `exactOptionalPropertyTypes`, `lib: esnext`. Found necessary when three copies leaned on our stricter flags | Their bundler, their React version |
| `gate:consumer-lint` | `packages/ui` and `packages/blocks` pass the lint policy a consumer inherits | — |
| `gate:dist` | `packages/gate/dist` (committed, because `lumo gate` runs it from a consumer's `node_modules` where Node will not strip types) matches a fresh build | — |
| `gate:pack` | The packed root contains every file the `lumo` CLI imports or reads at runtime — 386 files today. Found necessary when 0.1.2's first install shipped without `scripts/lib` | Whether the install *works* end to end |
| `gate:flutter-tokens` | `packages/mobile/lib/src/tokens.g.dart` matches a fresh generation from `packages/theme/src/tokens.css`. The two platforms cannot disagree about what `md`, `accent` or `raised` mean | That the mapping rem→dp, oklch→sRGB is the *right* one |
| `gate:flutter` | Two packages. **`packages/mobile`**: analyze clean and **669 tests** across 77 files — names, roles, states and values in the semantics tree, per family, in `fa-IR` and `en-US`, plus five directory-wide sweeps and three permanent floors (tap target, cramped layout, token contrast). **`apps/mobile-gallery`**: **540 tests** — the *render floors* (every demo measured for a stage that centres rather than stretches, and for strings that inherit the app's font) and the **semantics grader**: 105 demos × 2 locales × 4 rules (`named-controls`, `persian-digits`, `engine-english`, `announced-once`), each with a poison fixture, plus Flutter's own `AccessibilityGuideline`s. Every floor is poison-tested | Layout on a real device; what a screen reader says |
| `gate:flutter-contract` | Four static rules over `packages/mobile/lib` — no English default, no English literal in an announced position, no physical left/right, no Material route helper (each names its own barrier in English from `MaterialLocalizations`) — each with a poison fixture that must fail, and a clean fixture that must pass | Anything not expressible as a source pattern |
| `gate:mobile-demos` | 105 demos across 47 slugs carry a title, a description and copy in **both** locales, and their Dart source slices parse. A missing locale throws at build time rather than degrading | Whether the demo is a *good* demo |
| `gate:mobile-api` | `mobile-api-reference.json` is current: **143 widgets, 1049 props, 67 enums**, parsed from the files the BARREL exports — what a consumer can actually import. **0 undocumented props**, ratcheted at 0, the same floor the web reached | Description accuracy |
| `gate:mobile-smoke` | A throwaway Flutter package OUTSIDE the workspace depends on `lumo_ui_mobile` by path, imports only the barrel, and names all **143 widgets and 67 enums** the API reference documents. Catches a pubspec missing a dependency the monorepo happened to supply, and documented API the barrel does not export | That a real `git` install from the advertised tag resolves |
| `gate:props` | No prop is typed-but-undelivered (AST, fails closed); root contract for `ref`/`id`; anchor-only names never leak from non-anchors | Names that collide with a same-named local; destinations behind a call |
| `gate:lint` | No physical left/right utilities in shared components; conditional hooks | — |
| `gate:no-css-modules` | Tailwind only | — |
| `gate:test` | **3,392 web tests** — ui 2,411 · theme 472 · gate 184 · blocks 160 · website 106 · core 36 · base-ui-ssr 13 — including the popup-interiors tier (families opened live and graded with the HTML rules) and the styling floor | Layout, real browsers, real assistive technology |
| `gate:registry` / `gate:api` | Generated artifacts are current; API docs debt is 0 (ratchet in `api-docs.floor.json`); 119 modules checked; README/site counts equal the registry | Description accuracy |
| `gate:catalog` | `catalog.json` — title/intro/usage/tier/required strings per item, both locales, 141 items — is regenerated from the examples' meta + registry + api reference and matches the commit. This is what `lumo search`/`info` and consumer sessions read | Whether the copy is *good* |
| `gate:smoke` | Every registry item type-checks in a bare consumer project under TWO resolutions: bundler (Vite / Next) and Node ESM (`NodeNext`) | Runtime install path |
| `gate:html` | **688 static documents** graded with the **13 served-HTML rules**; 65 Persian routes carry digit floors. The mobile preview shell is skipped by name, as an embedded application rather than a document — its canvas is graded by `packages/mobile/test/` | Anything a popup renders (see the popup tier); anything inside the Flutter canvas |

## The two CI jobs outside `verify`

| Job | What it proves | What it cannot |
| --- | --- | --- |
| `mutation:components` | 111 web modules each kill one mutant via `vitest related` — a floor of one operator per module: behavioural operators for 104, and 7 presentational modules keep the class-strip floor and are listed by name in `scripts/mutate-components.mjs` | Mutation breadth beyond one operator per module |
| `mutation:mobile` | The Dart counterpart. One promise broken per family — a name dropped, a state flipped, the Jalali epoch shifted, `formatNumber` sent to the root locale — and that family's OWN test must fail. **13 of 13 killed today**; the other 63 families are listed as `PENDING` and that list may only shrink. A family in neither set throws before the campaign starts | The 63 families with no operator yet: their tests are not proved against vacuity |
| `evidence` (`pnpm run evidence`) | Real engines over the built site: axe-core (WCAG 2.x A/AA) on every route in Chromium; popup families opened for real in Chromium, WebKit and Firefox with the ARIA tree pinned as committed snapshots, no Latin in spoken attributes, authored names, axe with the popup open; RTL layout checked by geometry (reading order flips fa↔en, `dir`/`direction`, no horizontal scroll). See `docs/evidence/README.md` | What a screen reader says; visual rendering; engine defects are recorded in `docs/upstream/` and annotated `fixme` rather than failed |

## Discipline

**Poison fixtures.** Every rule has a fixture that must fail — on the web, in
the mobile contract gate (`packages/mobile/gate_fixtures/*.bad.dart`, checked by
`--self-test`), and under the mobile floors. A gate that has never rejected
anything is a gate nobody has tested.

**Ratchets, not targets.** `api-docs.floor.json`, the mobile undocumented-prop
floor and the per-route digit floors may only move in the improving direction,
and the tool prints the new number to commit when ground is won.

**Sweeps over the directory, not per family.** The defects that survive review
are in the family nobody suspected, so the checks that matter most run over
every file: `packages/mobile/test/house_rules_test.dart` holds five, and it has
twice caught families that landed from another workstream while the first fixes
were being written.

## What is honestly not covered

- **No screen reader, on either platform.** The browser `evidence` job reads
  accessibility *trees*, which is not the same thing.
  `evidence/tests/voiceover.spec.ts` is an opt-in placeholder for a local
  VoiceOver run via Guidepup. No NVDA/JAWS/Narrator/TalkBack claim exists.
  Do not make one unless you actually ran it.
- **No real device or emulator run for the mobile library.** Every mobile test
  is `flutter test` on the host.
- **Two of Flutter's own accessibility guidelines are NOT met**, and the number
  is recorded rather than hidden. Of 105 demos: **42 miss the iOS 44pt tap
  target, 62 miss Android's 48dp, and 37 miss WCAG AA text contrast** (as low as
  3.46:1 at 12px). Lumo's control scale is 29/36/44dp, generated from the web's
  `--lumo-ref-control-*` and designed for a pointer; raising it moves the web
  too, so it is an owner decision, not a test's. The counts are ratcheted and may
  only fall. `labeledTapTargetGuideline` — every tappable node has a name — IS
  met, and is a hard floor.
- **No golden images anywhere** — deliberately. The two defects of 17 Aug 2026
  (a preview stage that never centred its demo; button labels silently dropping
  the app's font) are now permanent floors in `apps/mobile-gallery/test/`, but
  as *measurements*, not committed pictures: a PNG differs across machines and
  font stacks and gets reverted the first time it goes red for a reason nobody
  can see. What is still uncovered is everything a picture would show that a
  number does not — colour, overlap, spacing rhythm, a glyph rendering as a box.
