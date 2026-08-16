# Goals — from 7.2 to a contender

Scored on `docs/rubric.md` (primary weights). Today, 15 Aug 2026: **Lumo 7.2**;
provisional comparators shadcn 6.7 · Ark 7.2 · Mantine 7.7 · React Aria 8.0 ·
Ant Design 8.0 · MUI 8.1. Reaching every target below puts Lumo at **≈ 8.6**,
above the top of the provisional sheet, on the criteria that matter for our
products. Nothing here needs a paid service; nothing needs adoption or a
second maintainer to count.

Each goal: **criterion · now → target · the work · the proof that moves the
score · est. Δ overall**. Ordered by leverage per unit of effort, not by
dimension. Every goal ends with a dated rubric row in `docs/history/`, scored
by someone who did not do the work.

---

## Tier 1 — evidence and hygiene (largest Δ, mostly tooling)

| # | Criteria | Now → target | Work | Proof | Δ |
|---|---|---|---|---|---:|
| 1 ✅ (15 Aug: Chromium/WebKit/Firefox job live; VoiceOver still opt-in placeholder) | **D3 external evidence**, A5 | 1 → 7 / 7 → 9 | Playwright job over the built `apps/website/out` (Chromium, WebKit, Firefox — all free): `@axe-core/playwright` per route under `fa/` and `en/`, ARIA snapshots (`toMatchAriaSnapshot`) for every popup family opened for real, RTL screenshot regressions for the 20 most direction-sensitive routes. Locally on macOS: **Guidepup** driving VoiceOver through the popup families with published transcripts (free, open source). Label everything exactly: "Chromium/WebKit/Firefox accessibility-tree + axe evidence" and "VoiceOver transcripts"; never "screen-reader certified". | CI job green with artefacts; `docs/verification.md` lists what each browser run proves and what it cannot; transcripts under `docs/evidence/`. | **+0.5** |
| 2 ◐ (four blind passes 15–16 Aug: 7.3 → 7.2 → 7.3 → 7.5; every confirmed A-defect fixed the same day; the counter of consecutive clean A-passes is still 0 — open: date family calendar policy, decision §24) | **B3 defect density**, A1 | 6.5 → 9 | Fix the two open findings from `reevaluation-9edd398.md` (P7 `popupName` lifting a body field's `label`; `Dialog.label` inert inside `Drawer` — lift from the Drawer or drop the requirement there). Then run the adversarial brief after every tranche and aim for **two consecutive passes with zero confirmed core-promise defects**. | Two dated evaluations in `docs/history/` with (c) empty for A-dimension defects. | **+0.3** |
| 3 ✅ (104/111 behavioural, 7 listed presentational) | **D1 mutation depth** | 7.5 → 9 | One behavioural operator for every module that owns behaviour (today 13 of 111); publish `mutation-report.json` summary in CI; keep class-strip only for genuinely presentational modules and say so per module. | `mutation:components` report: N behavioural / M presentational, 100% killed; the floor test lists every anchor. | **+0.2** |
| 4 ✅ (v0.1.0 tagged 16 Aug; CHANGELOG.md with breaking/migration/policy; packages 0.1.0) | **E3, H2, I2 — versioning and change records** | 5.5 / 7 / 2 → 8 / 9 / 8 | Tag `v0.1.0`; generate `CHANGELOG.md` from conventional commits (free tooling); write migration notes for every breaking change from now on (the `Dialog.label` requirement is the first); a one-page deprecation policy. | Tags exist; changelog regenerates in CI; each breaking commit links a migration note. | **+0.15** |
| 5 ✅ (path A decided §25 and proved end to end: git sub-path dependencies + root dev dep for the `lumo` CLI; docs site advertises `lumo add`; parked host gone; I3 hosted docs still open) | **I1, I3 — install path and hosted docs** (owner decision) | 1 / 5 → 8 / 8 | Pick one and make it real: (a) private static host for `registry.json` + `r/*.json` + the docs site behind an access layer (free tiers exist — verify current terms), consumers keep `shadcn add @lumo/<name>` with an auth header; or (b) drop the URL entirely and document the exact pinned-git / workspace install for our products. Either way the parked domain leaves `components.json` and `registry.json`. Add a CI step that installs one item through the *advertised* path. | `curl` of the advertised path returns the registry item; a consumer smoke job installs from it. | **+0.15** |

Tier 1 total ≈ **+1.3** → ~8.5.

## Tier 2 — depth of what we already ship

| # | Criteria | Now → target | Work | Proof | Δ |
|---|---|---|---|---|---:|
| 6 ✅ (matrix in docs/apg.md; Lumo-owned gaps tested; ListBox Page keys fixed; engine tripwires pinned; Toolbar Home/End recorded as engine deviation) | **B1 APG completeness** | 7 → 8.5 | Family-by-family APG audit (menu, listbox/select/combobox, tabs, tree, grid, slider, dialog, disclosure, toolbar): typeahead, Home/End, PageUp/PageDown, RTL-aware arrows, Escape/outside-press, roving tabindex, disabled-item skipping. Record deviations with reasons in the family docblock. | A checklist per family in `docs/apg.md`, each row pointing at the test that proves it; deviations listed. | +0.2 |
| 7 ✅ (audit done; InputOtp, ComboBox, MultiSelect, TagsInput, Slider wired — description/error reach the control in the first byte) | **B2 composability & forms** | 7.5 → 8.5 | Every input on the shared field wiring (PhoneInput joined only on 15 Aug — audit the rest); async/collection states (`loading / empty / error`) as first-class on every collection component; one form adapter story for all fields. | `first-byte-names`/wiring tests cover 100% of inputs; a table of components × states in the docs. | +0.15 |
| 8 ✅ (tier 22 families; rule 14 `latn-island-purity`) | **A4 popup tier to every popup family**, A2 exemption containment | 8 → 9 / 8 → 9 | Add the remaining popup-bearing families to `popup-interiors.test.tsx`; turn the `data-lumo-latn` exemption from a disclosure into a containment: per-route ceiling on exempt text share (armed like the digit floors), and a rule that an island may not contain a full sentence of the reader's language. | Popup tier lists every family that opens anything; gate reports exemption share per route under its ceiling. | +0.15 |
| 9 ◐ (E1 ✅: 49 `.type-test.tsx`, 329 pins, vacuity-checked; E2: `usage` section live on 16 core pages — remaining pages next) | **E1 type honesty**, E2 | 7.5 → 8.5 / 8 → 9 | Retire the `label: _label` discard (lift without destructuring, as `Menu` does); a `.type-test.tsx` per family for required-string unions and rejected inherited props; "when to use / when not" and a migration section on every component page. | `gate:props` stays 0; type-tests exist for every family; docs pages carry the two sections. | +0.1 |
| 10 ✅ (G3: bundler + Node-ESM consumers in smoke. G4: `LumoProvider linkComponent` read by Item/Command/NavigationMenuLink/SidebarItem, explicit on the server-safe `Link`; `presentQueryResult` maps a TanStack Query / SWR result onto `asyncState`, structurally) | **G4 integrations**, G3 | 6 → 8 / 7 → 8 | Router adapter (`Link`/`MenuItem` href with Next and plain anchors), TanStack Query async-collection adapter, form adapter parity across all fields; a Vite consumer added to the smoke script beside Next. | Adapters documented with a worked example each; smoke runs both consumers. | +0.1 |

Tier 2 total ≈ **+0.7**.

## Tier 3 — breadth, design system, dependencies, upstream

| # | Criteria | Now → target | Work | Proof | Δ |
|---|---|---|---|---|---:|
| 11 | **C2, C3, C1** | 8 / 7 / 8 → 9 / 8.5 / 8.5 | Product-depth gaps vs Mantine/Ant Design: rich-text editor, tree grid, notification centre, image lightbox, tour/onboarding, mentions; blocks 30 → ~50 with full page templates (auth, settings, dashboard, list-detail already exist — add billing, onboarding, admin table pages, chat). Never add a component without its five files, popup-tier case, mutation operator and rubric-B evidence. | Registry counts test-pinned; every new item passes the same gates on day one. | +0.15 |
| 12 | **F1, F2 design system** | 7.5 / 7.5 → 8.5 / 8.5 | Written token semantics (`docs/tokens.md`), density scale proved per family (the density-contract test exists — extend), elevation and motion tokens documented, brand override package example, Figma token parity (Figma MCP export, no paid plan). | Token doc; a second brand theme package builds and passes the gate; RTL screenshot regressions (from goal 1) cover both themes. | +0.1 |
| 13 | **G1, G2 dependencies** | 6 / 8 → 7 / 9 | Base UI upgrade job that runs `base-ui-strings.test.tsx` and the popup tier against the next minor before we adopt it; free dependency-update bot; `pnpm audit` in CI; provenance notes in `pnpm-workspace.yaml`. | Upgrade PRs carry the tripwire result; audit step in `verify`. | +0.05 |
| 14 | **H3 upstream** (owner decision — Task 11) | 3 → 7 | File the two Base UI drafts in `docs/upstream/` (dismiss `aria-label`, SSR naming) once you say so; track responses in the decision log. | Issue links in `docs/upstream/`. | +0.05 |

Tier 3 total ≈ **+0.35**.

---

## What we deliberately do not chase

- **Adoption (I5) and bus factor (H1)** — recorded, unweighted, out of scope for now.
- **React Native** — started 16 Aug 2026 by owner decision (`@lumo-ui/native`: provider + Button, decision §27); the device ICU probe is still the gate for any claim; never Flutter.
- **Component count for its own sake** — C is 12% of the score; a component without proof lowers B and D more than it raises C.
- **Claims without runs** — no NVDA/JAWS/TalkBack claims until we actually run them; VoiceOver via Guidepup is the honest first step on this machine.

## How progress is reported

After each tranche: the adversarial brief (`docs/history/review-brief-2026-08-15.md`) → a dated rubric sheet → the per-criterion delta. The number moves when a criterion's evidence changes; that is the only way it moves.
