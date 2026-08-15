# Verification

`pnpm run verify` runs nine gates in order; CI runs the same plus an Intl/ICU probe first and a separate mutation job. Roughly 15 minutes locally — run it once at the end of a change, not per edit.

| Gate | What it proves | What it cannot |
| --- | --- | --- |
| `gate:types` | Whole workspace type-checks; `?: undefined` carriers and `@ts-expect-error` pins reject at compile time; a `.type-test.tsx` per family pins required strings, all-or-nothing unions and rejected inherited props (49 files) | Runtime behavior |
| `gate:props` | No prop is typed-but-undelivered (AST, fails closed); root contract for `ref`/`id`; anchor-only names never leak from non-anchors | Names that collide with a same-named local; destinations behind a call |
| `gate:lint` | No physical left/right utilities in shared components; conditional hooks | — |
| `gate:no-css-modules` | Tailwind only | — |
| `gate:test` | ~3,000 tests across packages, including the popup-interiors tier (18 families opened live and graded with the HTML rules) and the styling floor | Layout, real browsers, real assistive technology |
| `gate:registry` / `gate:api` | Generated artifacts are current; API docs debt is 0 (ratchet in `api-docs.floor.json`); README/site counts equal the registry | Description accuracy |
| `gate:smoke` | Every registry item type-checks in a bare consumer project under TWO resolutions: bundler (Vite / Next) and Node ESM (`NodeNext`) | Runtime install path |
| `gate:html` | 594 static documents graded with the 14 rules; 63 Persian routes carry digit floors | Anything a popup renders (see popup tier) |
| `mutation:components` (CI job) | 111 modules each kill one mutant via `vitest related` — a floor of one operator per module: behavioural operators for 104 modules; 7 presentational modules keep the class-strip floor and are listed in scripts/mutate-components.mjs | Behavioral mutation breadth |
| `evidence` (CI job, `pnpm run evidence`) | Real engines over the built site: axe-core (WCAG 2.x A/AA) on every route in Chromium; 20 popup families opened for real in Chromium, WebKit and Firefox — ARIA tree pinned as committed snapshots, no Latin in spoken attributes, authored names, axe with the popup open; RTL layout by geometry (reading order flips fa↔en, `dir`/`direction`, no horizontal scroll). See `docs/evidence/README.md` | What a screen reader says; visual rendering; engine defects recorded in `docs/upstream/` and annotated `fixme` rather than failed |

Poison discipline: every rule has a fixture that must fail; every SSR compensation has a twin that renders bare Base UI and asserts the defect still exists there.

Real browsers ARE covered (Chromium, WebKit, Firefox — the `evidence` job). A real screen reader is not: `evidence/tests/voiceover.spec.ts` is an opt-in placeholder for a local VoiceOver run via Guidepup, and no VoiceOver/NVDA/JAWS/Narrator/TalkBack claim exists. Do not claim one unless you actually ran it.
