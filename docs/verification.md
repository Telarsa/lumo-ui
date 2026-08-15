# Verification

`pnpm run verify` runs nine gates in order; CI runs the same plus an Intl/ICU probe first and a separate mutation job. Roughly 15 minutes locally — run it once at the end of a change, not per edit.

| Gate | What it proves | What it cannot |
| --- | --- | --- |
| `gate:types` | Whole workspace type-checks; `?: undefined` carriers and `@ts-expect-error` pins reject at compile time | Runtime behavior |
| `gate:props` | No prop is typed-but-undelivered (AST, fails closed); root contract for `ref`/`id`; anchor-only names never leak from non-anchors | Names that collide with a same-named local; destinations behind a call |
| `gate:lint` | No physical left/right utilities in shared components; conditional hooks | — |
| `gate:no-css-modules` | Tailwind only | — |
| `gate:test` | ~3,000 tests across packages, including the popup-interiors tier (18 families opened live and graded with the HTML rules) and the styling floor | Layout, real browsers, real assistive technology |
| `gate:registry` / `gate:api` | Generated artifacts are current; API docs debt is 0 (ratchet in `api-docs.floor.json`); README/site counts equal the registry | Description accuracy |
| `gate:smoke` | Every registry item type-checks in a bare consumer project | Runtime install path |
| `gate:html` | 594 static documents graded with the 13 rules; 63 Persian routes carry digit floors | Anything a popup renders (see popup tier) |
| `mutation:components` (CI job) | 111 modules each kill one mutant via `vitest related` — a floor of one operator per module: class-strip for visual modules plus behavioral operators for 13 (form-state, provider, cascader, data-grid, tree-select, combobox, multi-select, dialog, drawer, menu, select, phone-input, table) | Behavioral mutation breadth |

Poison discipline: every rule has a fixture that must fail; every SSR compensation has a twin that renders bare Base UI and asserts the defect still exists there.

Not covered by anything mechanical yet: a real browser or screen-reader pass. Do not claim NVDA/JAWS/VoiceOver/TalkBack/Firefox/Safari results unless you actually ran them.
