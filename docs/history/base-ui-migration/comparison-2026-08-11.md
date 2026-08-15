# React Aria vs Base UI — the corrected comparison

Every number here is measured on `experiment/base-ui` (13 components rebuilt with
the public API frozen), then **corrected by the adversarial audit** of
`VERDICT.md`. Where the verdict and the audit disagree, the audit wins — it
recounted from the raw JSON and found five overstatements, all in the same
direction.

**Read the "what it is" column before the numbers.** Several of the verdict's
headline findings turned out to be artifacts of a partial port or of the
experiment's own frozen-API condition, not properties of either library.

---

## 1. The seven axes

| # | Axis | React Aria | Base UI | Winner | What it is |
|---|---|---|---|---|---|
| 1a | Dangling idrefs (wrapped) | 4 | **0** | **Base UI** | Real. React Aria's `useSlotId` clears in a layout effect that never runs on the server. Systemic — 6 across the full library. |
| 1b | Unnamed controls (wrapped) | **0** | 4 | React Aria | Real, but see §3 — Base UI names via `Field`, which the frozen API could not adopt. |
| 1c | Bare-library SSR defects | ≈18 | **13** | **Base UI** | **Verdict said 14:17 against Base UI. Audit reversed it.** React Aria's bare arm was measured *with our patches installed*; combobox opened on one arm only. |
| 2 | Announced English strings | 8 total: 5 by prop, 3 by patch, **0 unreachable** | 8 total: **7 by prop**, 0 by bundle, **1 unreachable** | Split | Both real. Base UI is better on props; its one unreachable string has no patch target. |
| 2b | Upstream path for the gap | **Closed.** 0 community locale PRs ever. 3 maintainers, 26 months, same refusal. | **Open.** Issue acknowledged in 5 days; prop accepted as interim fix. | **Base UI** | Real and decisive for maintenance. React Aria's patch tax has no end date. |
| 3 | RTL at served bytes | 0 class / 1 style delta | 0 class / 1 style delta | **Tie** | Neither library contributes meaningful direction handling. Lumo's logical utilities do all of it. Base UI additionally ships a `direction-provider`. |
| 4 | Wrapper code lines | **1,198** | 1,930 (+61%) | React Aria | Real but **inflated by the frozen API** — 106 of 235 "translation sites" are props kept inert only because the API could not change. A Base UI-native API discards none. |
| 5a | Gzip, 13 sharing a runtime | **103.7 KB** | 111.1 KB (+7%) | React Aria | Real. React Aria's shared machinery amortises better. |
| 5b | Gzip, each measured alone | 461.9 KB | **397.3 KB** | Base UI | Real, but not the shipping configuration. |
| 6 | `pnpm verify` without patches | Fails — 5 tests lose their reason to exist | n/a — needs no patches | **Base UI** | Real. This is the maintenance argument. |
| 7 | Accessibility (Lumo's own suites) | Baseline | 1 regression + 5 throws | **Disputed** | **All of it in `alert-dialog` and `context-menu` — components Base UI ships NATIVELY and a real migration would port, not compose.** |

---

## 2. What was artifact, not evidence

The verdict listed four "decisive" reasons. The audit and my own re-testing left
one standing.

| Verdict claim | Status | Evidence |
|---|---|---|
| "Ten components do not install" | **FALSE — fixed in 3 lines** | Our `build-registry.mjs` matched externals exactly, so `@base-ui/react/select` never matched `@base-ui/react`. `gate:smoke` now passes 107/107. |
| "The site cannot be built" | **FALSE — artifact** | The crash is `context-menu.tsx`, never migrated, importing React Aria while calling a Base-UI `MenuPopover`. Base UI ships `context-menu` natively. |
| "No focus ring on switch/checkbox — a WCAG failure" | **FALSE — our control** | We froze `.variants.ts` byte-identically. Base UI's idiom is CSS pseudo-classes; shadcn's own `base-vega` confirms it. This is a **migration cost**, not a library defect. |
| "Compatibility layer bigger than the patch" | **Half true** | 106 of 235 sites exist *because the API was frozen* — the experiment's own condition. Priced from zero, they vanish. |
| "The date family has no route on Base UI" | **TRUE — the one that survives** | Base UI ships no calendar, date-field, or time-field primitive. |

---

## 3. Coverage, measured against Lumo's actual 77 components

| | count |
|---|---|
| Have a **native Base UI primitive** | **28** |
| Do not | 49 |

Of the 49, honestly categorised:

- **~20 are presentational and engine-independent** — alert, badge, card, kbd, skeleton, spinner, stack, num, steps, description-list, link, aspect-ratio, empty-state, item, marker, bubble, message, attachment, button-group, input-group. These cost nothing either way.
- **3 are third-party in both worlds** — chart (recharts), carousel (embla), resizable.
- **6 are the date family** — the real gap. **But `@internationalized/date` is standalone**: verified running with zero React dependency (Esfand 1404 = 29 days, rollover correct). Jalali *arithmetic* is portable to any engine; what React Aria uniquely supplies is the *interaction* layer — segment keyboard handling and the roving day grid.
- **The rest need building on either engine** — table/grid, tree, tag-group, list-box, search-field, file-upload, rating, command, pagination, breadcrumbs, hover-card (Base UI's `preview-card` is close), segmented-control (maps to `toggle-group`).

---

## 4. What is still unknown

The experiment did not answer these, and they matter:

1. **Does the site build once `context-menu` and `alert-dialog` are ported natively?** Untested. Base UI ships both.
2. **What is the real defect count with state selectors unfrozen?** Every "missing focus ring" and "ON looks like OFF" finding disappears if `.variants.ts` moves from `data-*` to pseudo-classes — but that rewrite across 77 components is the true migration cost and has never been sized.
3. **What does the date family cost on Base UI?** Arithmetic is free (`@internationalized/date`). Interaction is not. Nobody has built one to find out.
4. **Bundle weight with a native API.** The +7% was measured with 41 inert props carried for API compatibility.

---

## 5. The honest summary

**React Aria's real advantages:** the date family's interaction layer, a 7%
lighter shared runtime, four rounds of hardening already paid for, and 77
components that work today.

**Base UI's real advantages:** no dangling-idref class at all, fewer
prop-unreachable strings, **no patch tax**, a maintainer who answers in five
days, and a `direction-provider`.

**The deciding tension:** React Aria costs ~11 patch regenerations a year,
forever, with upstream permanently closed. Base UI costs a rewrite of every state
selector across 77 components, plus building the date family's interaction layer
— once.

One is a recurring tax with no end. The other is a large one-time bill with real
unknowns. That is the trade, stated without a thumb on the scale.
