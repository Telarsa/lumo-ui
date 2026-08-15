# Repair evidence after the independent `4eaf8ec` evaluation

**Repository:** `lumo-ui`  
**Branch:** `experiment/base-ui`  
**Base HEAD:** `4eaf8ece7eb9a58672076874952b1532f4537e7f`  
**State:** intentional uncommitted repair patch; nothing pushed, published, or installed  
**Date:** 15 August 2026

This ledger answers the proved and partially confirmed shortcomings in
`review/EVALUATION-OF-FIXES-4eaf8ec.md`. It is written by the fixing session,
so it is evidence to attack, not an independent verdict.

## Product defects

1. **DataGrid validation reason was discarded — fixed.**
   `DataGridEditableCell` now renders the caller-authored string in a
   `role="alert"` and connects it through `aria-errormessage`
   (`packages/ui/src/data-grid.tsx:126,142`). The red assertion was
   **“associates the caller-authored validation reason and blocks an invalid
   commit”** (`data-grid.test.tsx:165`). The mutation operator
   **“disconnect the validation reason from its invalid editor”** is killed.

2. **Cascader served a Latin column digit in Persian — fixed.**
   The listbox name uses `formatNumber(..., locale)`
   (`cascader.tsx:187`). The red assertion was **“announces Persian column
   numbers on a Persian surface”** (`cascader.test.tsx:57`). The mutation
   **“replace locale-shaped column number with a raw JavaScript number”** is
   killed.

3. **A disabled first Cascader item could own the only tab stop — fixed.**
   The stop is the active enabled value or the first enabled option
   (`cascader.tsx:182-195`). The original implementation failed
   **“gives the column's roving tab stop to its first enabled option”**
   (`cascader.test.tsx:66`).

4. **Changed `dismissLabel` stayed stale while open — fixed twice.**
   ComboBox and MultiSelect mark engine-owned sentinels after the first rewrite
   and query that marker on later prop changes (`combobox.tsx:195-209`;
   `multi-select.tsx:65-79`). The original behavior failed
   **“updates the engine-owned dismiss name while the popup remains open”**
   (`combobox.test.tsx:131`) and **“updates MultiSelect's engine-owned dismiss
   name while suggestions remain open”** (`wave-three-inputs.test.tsx:229`).
   The shared behavior mutation is killed for both modules.

5. **TreeSelect multiple-mode parent state did not round-trip — fixed.**
   Multiple mode now derives and toggles a node from its own selected value;
   checkbox mode alone derives descendant state (`tree-select.tsx:104,120`).
   The original behavior failed **“multiple mode round-trips a selected parent
   as its own independent value”** (`tree-select.test.tsx:73`). The mutation
   that restores descendant-derived multiple state is killed.

## Documentation, artifacts, and tooling

6. **Generated API descriptions were invisible — fixed.**
   The public prop table has a localized Description column and renders every
   generated description (`composition-tree.tsx:133-209`). The certifying
   SSR assertion is **“renders each generated public-prop description under a
   named column”** (`composition-tree.test.tsx:7`).

7. **Unsupported Tab props were described as if they worked — strengthened.**
   Seventeen link/React-Aria/style compatibility fields are now
   `?: undefined` carriers, not accepted no-ops
   (`tabs.tsx:427-481`). The inert-prop gate initially rejected the attempted
   “accepted but documented unreachable” repair; the final API makes those
   values unrepresentable and omits them from generated callable props.

8. **Registry descriptions could attach to an earlier helper — fixed.**
   The generator now parses the exact named export with the TypeScript AST and
   reads only its attached JSDoc (`scripts/build-registry.mjs:324-350`).
   **“takes a component description from its named export, not an earlier
   helper”** protects the Treemap case (`build-registry.test.ts:20`).

9. **Public counts and architecture/engine prose were stale — fixed and gated.**
   README and bilingual site counts derive to 111 UI components, 30 blocks, 141
   registry items. Architecture and current docs now describe React 19 + Base UI,
   current private distribution, and TanStack Charts 0.11.1. The new
   `documentation-truth.test.ts` rejects the superseded Preact/React-Aria/date
   and chart-version narratives.

10. **Digit floors were a fixed 12-route sample — fixed with an executable
    admission rule.** `missingDenseDigitFloors` requires every non-Latin route
    with at least 30 visible, non-exempt native digits to have a committed floor
    (`packages/gate/src/index.ts:296-335`). Existing entries are never removed
    automatically, so a regression to zero remains caught. The ledger now arms
    62 of 299 Persian routes and the 594-document build is clean. The poison
    assertion is **“requires every newly number-dense Persian route to join the
    floor ledger”** (`gate.test.ts:968`).

11. **Popup grading covered seven families — expanded to 18 live families.**
    `popup-interiors.test.tsx` now opens and grades Menu, Select, Dialog,
    Cascader, TreeSelect, ComboBox, DatePicker, Command, MultiSelect,
    Autocomplete, ContextMenu, Popover, Tooltip, Drawer, AlertDialog, Menubar,
    NavigationMenu, and HoverCard with the production rule set. The test
    explicitly licenses Base UI's two `aria-hidden` menubar focus guards while
    independently requiring one tabbable real menuitem.

12. **Mutation was outside CI and too easily overstated — improved.**
    CI now has a separate 35-minute `mutation` job
    (`.github/workflows/ci.yml:146-159`). The campaign remains honest that most
    modules receive a rendered-class mutation, but adds behavior-specific
    operators for Cascader, DataGrid, TreeSelect, ComboBox and MultiSelect in
    addition to FormState and Provider. The full result was:
    **111/111 killed; 0 survived; 0 unobserved; 0 invalid**.

## Final verification

- `pnpm run verify`: **PASS**
  - type checks: pass
  - inert props/root contract: 141 files, 0/0 violations
  - lint and no-CSS-modules: pass
  - tests: **3,031 passed**
  - registry/API: 141 items, 118 API modules, zero documentation debt
  - consumer smoke: all 141 payloads compile outside the workspace
  - production export: 594 pages
  - HTML gate: 594 documents, 0 violations; 62 digit-floor routes
- `pnpm run mutation:components`: **PASS**
  - 111 killed; 0 survived; 0 unobserved; 0 invalid
- `git diff --check`: **PASS**

The final green verification was preceded by two useful failed integration
runs: the inert-prop gate rejected accepted-but-unreachable Tab fields, and the
theme vocabulary gate rejected the unpublished `text-danger` token. Both were
fixed rather than muted.

## Explicit limitations

- No real browser or visual pass was performed in this repair session.
- No NVDA, JAWS, TalkBack, or other real assistive-technology session was run.
- The mutation campaign is broader behaviorally but is still primarily a
  rendered-style assignment floor, not arbitrary behavioral mutation for all
  111 modules.
- Lumo is still private, versioned `0.0.0`, absent from npm, and has no public
  registry URL; distribution/adoption readiness is therefore unchanged.
- No remote GitHub Actions run was dispatched; CI workflow source is locally
  tested, but hosted execution is not claimed.
- The copied Treemap RTL adaptation remains an upgrade-maintenance seam.
- Nothing was committed, pushed, published, or installed.
