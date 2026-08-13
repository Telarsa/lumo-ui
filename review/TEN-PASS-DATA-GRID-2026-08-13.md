# Toward 10 — Data Grid / Table tranche

Date: 13 Aug 2026  
Base for this tranche: `b97025e`  
Verdict after this tranche: **9.4/10 overall** (previous evidence-backed rating: 9.3)

This is not a claim that Lumo is a ten. It closes the highest-risk correctness defect in the existing Data Grid and adds one material depth feature. The remaining enterprise-grid breadth is recorded rather than hidden behind the new score.

## Current comparison used

- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table): a TanStack composition recipe with sorting, filtering, visibility, selection and pagination.
- [ReUI Data Grid](https://reui.io/docs/components/advanced/data-grid): the current page additionally demonstrates row expansion/tree rows, pinning, ordering/dragging, virtualization and infinite scrolling.
- [TanStack Table expanding guide](https://tanstack.com/table/latest/docs/guide/expanding): the state/model seam underneath Lumo's new hierarchy support.

The comparison was checked in the in-app browser on 13 Aug 2026. Lumo's stronger side remains the one the competitor examples do not make their primary contract: caller-authored Persian announcements, logical RTL keyboard direction, deterministic server markup, and a single first-byte grid tab stop.

## PROVED defects fixed

### 1. Column visibility changed state but not the rendered table

Before the fix, the menu called TanStack's visibility API, but `Column` and `Cell` rendered unconditionally. The live Lumo example still showed both City headers and all City cells after clicking City. This mattered because the page told users they could hide a column while leaving its data and keyboard coordinate in the grid.

The rendered projection is now owned once by the header. `packages/ui/src/table.tsx:893-907` says `const visible = column?.getIsVisible?.() !== false` and returns `null` for a hidden header; `packages/ui/src/table.tsx:1167-1176` makes the matching body cell return `null`. The public behavior assertion is `packages/ui/src/data-grid.test.tsx:476-516`: “removes the hidden header and every matching body cell from the rendered grid.”

Hidden middle columns also left a hole in the roving coordinate system. `packages/ui/src/table.tsx:630-652` now walks the requested axis until it finds the next rendered coordinate. The assertion is `packages/ui/src/data-grid.test.tsx:519-567`: “moves keyboard focus across a hidden column instead of trapping the grid.”

Browser proof after the fix: on the English Data Grid page the City column-header count changed from two examples to one after hiding City in the first example.

### 2. The advertised table feature set had no expansion model

`useLumoTable` now installs both `rowExpandingFeature` and `createExpandedRowModel()` at `packages/ui/src/table.tsx:258-275`. The state assertions at `packages/ui/src/table.test.tsx:132-215` prove collapsed projection, expansion, and collapse from initial expanded state.

### 3. Lumo had no honest hierarchical-grid composition

`Table` now has an explicit `hierarchical` contract and emits `role="treegrid"`; parent rows emit `aria-level` and `aria-expanded` at `packages/ui/src/table.tsx:1117-1142`. `TableTreeCell` is the public row-header/disclosure seam at `packages/ui/src/table.tsx:1500-1570`: its labels are required caller-authored strings, indentation uses `paddingInlineStart`, and the disclosure icon follows locale direction.

The semantic assertion is `packages/ui/src/table.test.tsx:259-288`. The RTL interaction assertion is `packages/ui/src/table.test.tsx:291-324`: “uses the logical inline-end arrow to expand a focused Persian row.” The part and its type are exported at `packages/ui/src/index.ts:450-486`.

Browser proof: the Persian example rendered three collapsed rows including the header, moved the one grid stop from the header to the disclosure with Arrow Down, expanded with RTL inline-end Arrow Left, then rendered five rows and changed the button to its Persian collapse label.

### 4. Ordinary rows claimed a selection model that was never enabled

TanStack's row object can answer `getCanSelect() === true` even when the table did not enable row selection. `packages/ui/src/table.tsx:1117-1142` now requires the table option as well as the row capability before emitting `aria-selected`. The regression at `packages/ui/src/table.test.tsx:447-449` asserts that an ordinary table contains no `aria-selected` attribute.

### 5. The new website tree example initially reset itself

Passing `[...rows]` on each render gave TanStack a new data identity and its scheduled reset closed an expanded row after the click. `apps/website/src/components/demo-islands.tsx:1693-1707` now takes one stable snapshot with `useState`. The delayed regression at `apps/website/src/components/demo-islands.test.tsx:8-41` waits past that reset window and asserts both the child row and collapse button remain.

The bilingual worked example is registered at `apps/website/src/examples/data-grid.tsx:330-339` and explicitly describes treegrid state and logical-direction keyboard behavior.

## Mutation proof

Each mutation was applied alone, its named assertion failed, and the production implementation was restored before the final run.

| Mutation | Assertion killed |
| --- | --- |
| Removed the hidden-column `return null` | `removes the hidden header and every matching body cell from the rendered grid` |
| Limited sparse-coordinate traversal to one attempt | `moves keyboard focus across a hidden column instead of trapping the grid` |
| Removed the explicit selection-option gate | `does not mark rows selectable when selection was never enabled` |
| Removed `rowExpandingFeature` | `lets a row disclose its children through the installed state feature` |
| Replaced the website's stable data snapshot with `[...rows]` per render | `keeps a child revealed after the table's scheduled auto-reset window` |

## Verification

- Focused UI: **79/79** tests.
- Focused website regression: **1/1** test.
- Full workspace: **2,586/2,586** tests (UI **1,721**, website **81**).
- TypeScript: clean across all packages and website.
- Public-prop/root-contract gate: **126 files, 0 violations**.
- ESLint and no-CSS-modules gate: clean.
- Registry: **126 items**; generated API: **103 modules**; clean-room registry consumer: all items type-check.
- Production export: **532 pages** built; rendered-HTML gate: **0 violations**.
- `git diff --check`: clean.

The first sandboxed production build was **not** counted as an application failure: Turbopack reported `creating new process - binding to a port - Operation not permitted`. The exact build was rerun with local-worker permission and succeeded before the HTML gate ran.

## Updated rating

| Dimension | Before | Now | Reason |
| --- | ---: | ---: | --- |
| Accessibility / i18n / RTL | 9.2 | **9.3** | Hierarchy now has first-byte treegrid/level/expanded semantics, required localized disclosure labels, and proved logical RTL keys. A real Persian VoiceOver/NVDA matrix still has not run. |
| Testing & tooling | 9.5 | **9.5** | Five behavior mutations were killed and the full generated/consumer/HTML chain is green. There is still no automated Firefox/WebKit visual regression tier. |
| API design & DX | 9.4 | **9.5** | Visibility is now an end-to-end contract and tree rows have one typed composition rather than caller folklore. |
| Design system & docs | 9.3 | **9.4** | The new behavior has a bilingual interactive example and generated public API. ReUI still has materially more grid recipes. |
| Product breadth | 9.0 | **9.2** | Tree rows close one material Data Grid depth gap. |
| **Overall** | **9.3** | **9.4** | A shipped claim became true and a major competitor feature became an accessible public seam. |

## SUSPECTED / deliberately declined in this tranche

- **SUSPECTED breadth gap:** Lumo still has no first-party compositions for row/column pinning, row drag ordering, editable cells, infinite loading or grid virtualization comparable to the current ReUI catalogue. Repository export searches find no such Data Grid parts, but absence is not a runtime defect in the contracts Lumo currently advertises.
- **Declined:** implementing all five at once. They need separate state, keyboard, SSR and mobile design decisions; bundling them behind score-chasing would make this review less trustworthy.
- **Declined:** claiming 10.0. The remaining evidence gaps are cross-browser visual automation and real assistive-technology runs; remaining product-depth gaps include advanced grids, scheduling/planning, upload lifecycle and async/virtual collections.

The next highest-value product tranche is Event Calendar and Gantt interaction depth, followed by upload lifecycle and async/virtual collections. Cross-browser/AT evidence is the highest-value validation tranche.
