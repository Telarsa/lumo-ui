# Rating rubric — Lumo UI against the alternatives

**Why this file exists.** Every session used to invent its own dimensions and
weights, so an "8" from one reviewer and a "7.3" from the next measured
different things, and self-ratings ran ~0.5 above blind ratings. From now on
every evaluation — blind, post-fix, or comparative — fills in **this sheet**,
with **these weights**, using **these level anchors**. Change the weights here,
by commit, never in a review.

**What the score means.** The question is: *is Lumo worth building Telarsa's
products on, and can it stand beside the established libraries as a contender?*
The sheet therefore weights what a consuming product team feels — correctness
of the core promise, depth, breadth, proof, DX, theming, dependency health,
records — and gives **zero weight to adoption and bus factor**: the library is
for our own use for now, and those two measure popularity, not worth. They stay
on the sheet as recorded facts so comparators can be described honestly.

**Rules of use**
1. Score each criterion 0–10 in whole or half points, using the level anchors.
   Write one line of evidence per criterion (`file:line`, a command and its
   output, or a public source for a comparator).
2. The dimension score is the mean of its criteria; the overall is the
   weighted sum ÷ 100.
3. The person who wrote a fix does not score it. The blind reviewer's post-fix
   sheet is the record.
4. "N/A" is not allowed. If evidence does not exist (no browser run, no
   consumer install), the criterion scores what *exists*: usually 0–2.
5. Comparators are scored on the same sheet from public evidence (repository,
   changelog, issue tracker, docs), and each comparator score is dated.

---

## 1. Weights

| # | Dimension | Weight | What it answers |
|---|---|---:|---|
| A | **Core promise: i18n, RTL, accessibility, first byte** | **25** | Does it work for a Persian/RTL/non-English reader, in the served bytes? |
| B | **Component quality (depth)** | **18** | Is each component complete, composable, and low-defect? |
| C | **Breadth** | **12** | How much of a product can be built without leaving the library? |
| D | **Verification & evidence** | **15** | How much of the quality claim is proved, and how? |
| E | **API design & developer experience** | **10** | Is it consistent, typed, honest, documented, cheap to migrate? |
| F | **Design system & theming** | **8** | Tokens, density, dark mode, RTL styling, customisation path, motion. |
| G | **Dependencies & ecosystem** | **6** | Engine health, dependency hygiene, framework fit, integrations. |
| H | **Maintenance records** | **3** | Records, upstream engagement, CI. (H1 bus factor: recorded, weight 0.) |
| I | **Distribution readiness** | **3** | Can *our* products install it today; versioning; docs. (I5 adoption: recorded, weight 0.) |
| | **Total** | **100** | |

Sensitivity note: a *public-OSS* reading (adoption and bus factor counted, A
lowered to 20, H and I raised to 8/7) is a second, labelled column when needed;
it is never blended into the primary score.

---

## 2. Criteria and level anchors

Scores between anchors are allowed. "10" means "best in the ecosystem, proved".

### A. Core promise — i18n, RTL, accessibility, first byte (25)

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| A1 Announced strings & names | English defaults baked in; icon buttons unnamed | Locale packs for some languages, English fallback | Every announced string is a required prop or a complete locale contract; no English fallback path | …and proved by an output gate over served HTML and open popups |
| A2 RTL & bidi layout | `dir` flips text only; icons/paddings wrong | Logical CSS properties; some hard-coded left/right | Logical throughout; explicit LTR islands (`data-lumo-latn`-style) for codes/numbers; direction derived from locale, not a prop | …and every family verified mirrored under RTL, including popups, sliders, charts |
| A3 Locale digits, dates, calendars | Latin digits and Gregorian only | `Intl` for numbers; dates via a plugin | Native digits everywhere; a non-Gregorian calendar (Jalali) as a first-class date model, not a display skin | …plus gates that catch a Gregorian date in native digits |
| A4 First-byte (SSR) truth | Names/labels attached in effects; server markup unnamed | Most static markup correct; popups untested | Label/description/error wiring resolved during render; served HTML graded | …plus open-popup interiors graded live with the same rules |
| A5 Accessibility conformance | Roles/keyboard incomplete | APG patterns mostly followed; jsdom tests | APG patterns per family; focus/keyboard tested; names/idrefs gated | …plus real assistive-technology evidence (see D3) |

### B. Component quality — depth (18)

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| B1 Behavioural completeness vs APG | Visual only | Core interactions; edge cases missing (typeahead, Home/End, PageUp) | Full APG behaviour per family, controlled + uncontrolled | …plus documented deviations with reasons |
| B2 Composability & forms | Monolithic props | Parts exposed; forms via ad-hoc wiring | Parts + slots; field wiring (label/description/error/validation) shared across inputs | …plus first-class async/collection states |
| B3 Defect density | Many open confirmed defects | A few per review | ≤ 1 confirmed defect per 25 components per adversarial pass, none in the core promise | Zero confirmed core-promise defects across two consecutive passes |

### C. Breadth (12)

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| C1 Primitives | < 20 | 30–50 | 60–100 | 100+ with consistent quality |
| C2 Product-depth components | none | data table | data grid, scheduler/calendar, charts, upload, command palette, tree | …plus gantt, kanban, query/filter builders, virtualised lists |
| C3 Blocks / templates / hooks | none | a few blocks | 20–40 blocks or a hooks library | …plus full page templates and app shells |

### D. Verification & evidence (15)

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| D1 Automated tests & mutation | Snapshot tests | Unit + integration; no anti-vacuity | Poison fixtures, vacuity guards, behavioural mutation for the modules that own behaviour | Behavioural mutation for every module; mutation score published |
| D2 Output gates | none | lint only | Served-HTML gate with per-rule poison fixtures and floors | …plus live popup grading and CI drift ratchets |
| D3 External evidence | none | one browser in CI | Real Chromium/Firefox/WebKit runs; visual regression | …plus screen-reader/AT runs (NVDA/VoiceOver/TalkBack) with published transcripts |
| D4 Consumer smoke | none | example app | Every registry item type-checks outside the workspace | …plus an end-to-end install from the advertised URL in CI |

### E. API design & DX (10)

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| E1 Consistency & type honesty | Inherited props that do nothing; `any` | Mostly typed; some inert props | Every accepted prop is delivered or a compile error; unions for all-or-nothing strings | …plus a source gate that fails CI on new inert props |
| E2 Docs per prop, examples | README only | Some prop docs; examples for popular components | Every prop documented (ratchet at 0); every component has bilingual worked examples | …plus per-example live previews and API reference generated from source |
| E3 Migration & breaking-change discipline | silent breaks | changelog | Semver, codemods or migration notes, decision log | …plus deprecation periods |

### F. Design system & theming (8)

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| F1 Tokens, density, dark mode | hard-coded colours | CSS variables, dark mode | Token contract, density scale, elevation, motion tokens, reduced-motion respected | …plus documented token semantics and Figma parity |
| F2 RTL styling & customisation path | override with `!important` | variants API (cva) | Variants + logical utilities + styling floors tested | …plus theme packages and per-brand overrides |

### G. Dependencies & ecosystem (6)

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| G1 Engine health | abandoned or pre-1.0 unstable | active but young (few releases) | mature, semver-stable, responsive maintainers | …and the library tracks it with an automated tripwire for internal-precedence changes |
| G2 Dependency hygiene | many, unpinned | pinned, some heavy | few, exact-pinned, audited, no paid services | …plus provenance / lockfile policy in CI |
| G3 Framework fit | one bundler | React only | RSC/Next + Vite + SSR proved | …plus React Native/Expo story |
| G4 Integrations | none | forms | forms, tables, charts, dates via first-class adapters | …plus router/data-layer adapters |

### H. Maintenance records (3) — H1 is recorded but carries no weight

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| H1 People *(weight 0)* | one author, no reviews | one author + periodic independent review | small team, code review, bus factor ≥ 2 | org-backed |
| H2 Cadence & records | none | commits only | changelog, decision log (ADR-style, append-only), dated evaluations | releases on cadence with notes |
| H3 Upstream engagement | none | issues drafted | issues filed and tracked | patches upstreamed |
| H4 CI | none | tests | full verify chain + separate mutation job + gates | …plus release automation |

### I. Distribution readiness (3) — I5 is recorded but carries no weight

| Criterion | 2 | 5 | 8 | 10 |
|---|---|---|---|---|
| I1 Install path | advertised URL does not serve the artifact | manual copy from repo works and is documented | registry/package resolves from the advertised location; consumer install tested in CI | …plus mirrors / offline install |
| I2 Versioning | `0.0.0`, no tags | tags | semver + changelog | LTS policy |
| I3 Docs site | none | static build, unhosted | hosted, searchable, bilingual | …plus versioned docs |
| I4 Licence & access policy | unclear | private, stated | private/public policy stated, licence file present | OSS or clearly-licensed private |
| I5 Adoption evidence *(weight 0)* | none | one internal app | several products in production | large public user base |

---

## 3. Provisional comparator sheet (dated 15 Aug 2026 — **verify before relying**)

Comparator scores are from public knowledge (repositories, docs, changelogs)
as of my information horizon and were **not** re-verified for this sheet; they
exist to make the anchors concrete, not as a settled ranking. Lumo's row uses
the evidence gathered in this week's reviews.

| Dimension (weight) | **Lumo UI** | shadcn/ui | Mantine | MUI | Ant Design | Ark UI | React Aria Components |
|---|---:|---:|---:|---:|---:|---:|---:|
| A Core promise (25) | **8.2** | 5.0 | 6.5 | 7.0 | 7.5 | 6.0 | 8.0 |
| B Depth (18) | **7.0** | 7.5 | 8.0 | 8.5 | 8.5 | 8.0 | 9.0 |
| C Breadth (12) | **7.7** | 7.0 | 9.0 | 9.0 | 9.5 | 7.0 | 7.0 |
| D Verification (15) | **6.5** | 5.0 | 6.5 | 8.0 | 7.5 | 7.0 | 8.5 |
| E API & DX (10) | **7.0** | 8.5 | 8.5 | 8.0 | 7.5 | 8.0 | 7.5 |
| F Design system (8) | **7.5** | 8.0 | 8.5 | 8.0 | 7.0 | 7.0 | 6.5 |
| G Dependencies (6) | **6.5** | 8.5 | 8.0 | 8.5 | 7.5 | 8.0 | 8.0 |
| H Records (3, H1 unweighted) | **6.0** | 8.0 | 9.0 | 9.5 | 9.0 | 8.5 | 9.0 |
| I Distribution (3, I5 unweighted) | **3.5** | 9.5 | 9.5 | 10 | 10 | 9.5 | 9.5 |
| **Weighted overall** | **7.2** | 6.7 | 7.7 | 8.1 | 8.0 | 7.2 | 8.0 |

Reading it honestly:
- Lumo **wins A** (its reason to exist) by a clear margin and is competitive on
  C. On this sheet it already stands beside Ark UI and above shadcn/ui; the gap
  to the top three (MUI, Ant Design, React Aria) is ~0.8–0.9 and it is made of
  four things, in order of leverage: **D3** external evidence (1 → a real
  Chromium job would add ~0.4 alone), **B3** defect density (two consecutive
  clean adversarial passes), **G1** engine youth (Base UI 1.x — partly time),
  and **I1** an install path that resolves for our own products.
- On the earlier ad-hoc "shadcn = 8" scale Lumo read ~7.3–7.8 and shadcn 8; on
  this sheet shadcn reads 6.7 because A and D are weighted and shadcn is
  English-only with few tests. Same code, different instrument — which is the
  point of fixing the instrument.
- H and I are deliberately small: they answer "can we run it and know what
  changed", not "is it popular".

### Lumo's row — evidence (15 Aug 2026, HEAD `9edd398`)

| Criterion | Score | Evidence |
|---|---:|---|
| A1 | 9 | Required announced strings across 142 component files; `gate:props` 0 inert; `named-controls` grades interactive, composite and container roles; popup tier 18 families |
| A2 | 8 | Logical utilities, `data-lumo-latn` islands, no `dir` prop; 74.8% of fa text nodes exempt under islands (disclosed, not contained) |
| A3 | 9 | `formatNumber` everywhere; Jalali calendar model; `native-calendar` gate rule |
| A4 | 8 | `@lumo-ui/base-ui-ssr` field wiring in render; 594 documents 0 violations; open popups graded live; one engine string relabelled live (mui/base-ui#5263) |
| A5 | 7 | APG behaviours tested in jsdom; **no AT/browser evidence** |
| B1 | 7 | Table Home/End/PageUp; menus/selects complete; some families thinner |
| B2 | 7.5 | Shared field wiring; async collection states; PhoneInput only joined the wiring on 15 Aug |
| B3 | 6.5 | Last two adversarial passes: 5 and 4 confirmed defects incl. one in the core promise each time |
| C1 / C2 / C3 | 8 / 8 / 7 | 111 modules; data grid, gantt, event calendar, charts ×4, kanban, power search; 30 blocks |
| D1 | 7.5 | Poison fixtures, vacuity guards, 13 behavioural operators of 111 modules |
| D2 | 9 | 13 served-HTML rules, floors, api/registry ratchets, CI mutation job |
| D3 | 1 | none |
| D4 | 8 | 141 items type-check outside the workspace; no install from advertised URL |
| E1 / E2 / E3 | 7.5 / 8 / 5.5 | Inert-prop gate; 0 undocumented props; bilingual examples; `0.0.0`, breaking changes recorded only in the decision log |
| F1 / F2 | 7.5 / 7.5 | Token contract, density, reduced-motion; cva variants + styling floors |
| G1–G4 | 6 / 8 / 7 / 6 | Base UI 1.7.0 (young, precedence tripwire); exact pins, no paid services; RSC/Next proved, no RN; TanStack table/charts/form adapters |
| H1–H4 | 3 / 7 / 3 / 8 | one author; decision log + dated evaluations; upstream drafts unfiled; full verify + mutation job |
| I1–I5 | 1 / 2 / 5 / 6 / 3 | `lumo-ui.com/r/*.json` is a parked domain; `0.0.0`; docs site built, unhosted; private policy stated; one internal consumer |

---

## 4. How to use it in a review brief

Replace "rate 0–10 on the anchored scale" with: *"Fill in `docs/rubric.md` §2
for Lumo; report the sheet, the weighted overall, and the delta per criterion
against the last dated sheet in `docs/history/`."* Progress is then a list of
criteria that moved, with evidence — not an argument about whether 7.9 is
"justified". Orient with the knowledge graph first (`graphify query`,
`graphify path`, `graphify explain`) — it is the cheapest way to find every
consumer of a seam before scoring it.
