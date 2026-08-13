# Lumo UI depth + Astryx pass — final evaluation — 2026-08-13

Evaluated against the current official documentation viewed on 2026-08-13:

- [ReUI Gantt](https://reui.io/docs/components/radix/gantt), [File Upload](https://reui.io/docs/components/radix/file-upload), and [Event Calendar](https://reui.io/docs/components/radix/event-calendar)
- [Meta Astryx](https://facebook.github.io/astryx/) and its current [Storybook](https://facebook.github.io/astryx/storybook/index.html)
- The prior 94-component five-library matrix at `review/PARITY-PASS-2026-08-13.md`

Verdict: **9.6/10 overall**, up from the last evidence-backed **9.5**. This is
not a claim of feature parity with every competitor and not a claim of 10.0.

## What is proved

### Gantt

**PROVED:** five calendar-aligned scales now exist. `packages/ui/src/gantt.tsx:197-206`
says `"day" | "week" | "month" | "quarter" | "year"`; quarter and year
boundaries are calendar arithmetic at `:341-363`. The Persian fixture asserts
quarter lengths `[93, 93, 90, 89]` and a 365-day year at
`packages/ui/src/gantt.test.tsx:296-308`.

**PROVED:** tasks can form a collapsible hierarchy. The public row carries
`parentId` at `packages/ui/src/gantt.tsx:208-213`; the visible-row algorithm says
“Orphans and cycles remain visible roots” at `:689-697`; the assertion at
`packages/ui/src/gantt.test.tsx:441-466` proves descendants disappear and only
the opened branch returns.

**PROVED:** start and end edges resize with keyboard and pointer input. The pure
operation clamps an edge before its opposite at `packages/ui/src/gantt.tsx:526-555`.
The named assertions are `changes one edge and clamps it before the opposite
edge`, `mirrors a resize handle's later key in Persian`, and `converts a Persian
pointer drag toward inline-end into one later day` at
`packages/ui/src/gantt.test.tsx:469-520`.

**Mutation proof:** changing a quarter from three months to one made
`quarter and year scales use the reader's calendar boundaries` fail with ten
31/30-day columns instead of `[93,93,90,89]`. Restored, the full Gantt suite is
30/30.

**Lumo advantage:** scale boundaries, pointer signs, dates, digits, and live
sentences are resolved in the reader's calendar and direction. ReUI currently
ships broader planning behavior—continuous zoom, summary rollups, dependencies,
and external CRUD—but its public RTL caveat is exactly the signed-delta class
Lumo tests in Persian.

### Upload lifecycle

**PROVED:** picker, drop, and paste share validation for type, byte size, and
remaining count. The public limits are at `packages/ui/src/file-upload.tsx:163-175`;
the single delivery pipeline records explicit `type`, `size`, or `count`
rejections at `:221-250`. The assertion at
`packages/ui/src/collections-no-primitive.test.tsx:282-313` proves an oversized
file is rejected for `size` and the second single-file drop for `count`.

**PROVED:** a row can express queued/uploading/success/error, progress value text,
and a caller-owned action. The discriminated lifecycle is at
`packages/ui/src/file-upload.tsx:412-428`; rendered `aria-busy`, live status,
progressbar, and action are at `:468-540`. The assertion at
`packages/ui/src/collections-no-primitive.test.tsx:355-393` exercises progress
and retry.

**Mutation proof:** disabling the non-negative size branch made
`enforces one-file and size limits on drops and reports every rejection` fail:
`large.txt` became a `count` rejection rather than `size`. Restored, the focused
collection suite is 17/17.

**Lumo advantage:** transport remains caller-owned; the UI cannot pretend a
network request occurred. ReUI currently has more first-party recipes—sortable
gallery/table/avatar forms and a richer upload hook—but Lumo's state is explicit,
localized, and usable without adopting a transport library.

### Async and virtual collections

**PROVED:** `ListBox` remote states are siblings of the composite, not fake
selectable options. The union is at `packages/ui/src/list-box.tsx:294-306`; the
assertion at `packages/ui/src/list-box.test.tsx:282-323` proves loading publishes
`aria-busy`, yields zero options, and retry/load-more actions execute.

**Mutation proof:** removing `aria-busy` killed `announces loading without
inventing a selectable option`; restored, ListBox is 18/18.

**PROVED:** `VirtualList` reports true corpus ranges and requests the next page
once per corpus size. The callbacks and guard live at
`packages/ui/src/virtual-list.tsx:175-205,255-274`. The tightened assertion at
`packages/ui/src/virtual-list.test.tsx:215-251` changes an effect dependency at
the same count, proving the request guard rather than merely rerendering without
rerunning the effect.

**Vacuous-test mutation:** deleting the per-count guard initially survived the
old test. After changing the threshold on the same corpus, the named assertion
failed with two calls instead of one. This was a real vacuous-test finding; the
fixture is now non-vacuous and the restored suite is 14/14.

### Event Calendar

**PROVED:** the public view union now includes `days`; callers author its label
and choose a clamped 2–14 day count at
`packages/ui/src/event-calendar.tsx:334,442-454,798-805`. Period text and stepping
use the exact count at `:977-1009`, and the renderer builds exactly that many
date columns at `:1434-1446`.

**Mutation proof:** changing the N-day navigation step from the requested count
to seven killed `an N-day view projects and advances exactly the requested
window` at `packages/ui/src/event-calendar.test.tsx:660-687`; the fourth event
did not appear after Next. Restored, Event Calendar is 38/38.

**Lumo advantage:** the same occurrence data renders in Gregorian or Jalali,
with locale-derived week starts, deterministic caller-supplied today, logical
RTL geometry, and required announced strings. ReUI is still broader: resources,
recurrence, time zones, configurable hours/interval/snap, event activation and
tooltips, settings, and drag/create/move/resize are material missing categories.

### Meta Astryx additions

Astryx's current catalog was inspected component by component. Most apparent
gaps are naming or composition gaps: Lumo `Stack` already exports Grid and
Container; `Badge`/Avatar status cover simple StatusDot/Indicator use; Menu
covers MoreMenu/DropdownMenu; Sidebar/NavigationMenu cover the navigation names;
DescriptionList covers MetadataList; Drawer covers BottomSheet's category.
Adding aliases for those would increase the count while making the modules
shallower.

Two gaps survived that deletion test and were added:

1. **OverflowList.** Pure fitting includes item widths, indicator width, gaps,
   minimum and maximum at `packages/ui/src/overflow-list.tsx:43-70`. The browser
   layer observes shrink and grow-back at `:130-152`; hidden measurements are
   inert and outside the accessibility tree at `:175-190`. Server output is
   deterministic through required `initialVisibleItems` at `:73-90`.
2. **TransferList.** The public item/value/string contract is at
   `packages/ui/src/transfer-list.tsx:34-61`. Movement preserves source/order,
   controlled ownership, locked values, and a localized live sentence at
   `:115-145`; its two named ListBoxes and keyboard-accessible buttons are at
   `:148-205`.

**Mutation proofs:** ignoring OverflowList indicator width killed `reserves the
overflow indicator and respects both bounds` at
`packages/ui/src/overflow-list.test.tsx:5-27`. Prepending instead of appending a
transferred key killed `preserves controlled ownership and reports the ordered
next value` at `packages/ui/src/transfer-list.test.tsx:41-50`. Restored focused
suites are 3/3 and 4/4.

## Browser evidence

The production-shaped docs were exercised through the in-app browser in English
and Persian:

- Gantt displayed Day/Week/Month/Quarter/Year; collapsing “Spring release” left
  zero child bars; Persian displayed `فصل`, `سال`, `بستن نسخهٔ بهار`, and Jalali
  year `۱۴۰۵`.
- Event Calendar's Three-day example displayed August 11–13 with exactly three
  gridcells and a pressed `3 days` button.
- File Upload retry replaced `Upload failed` + `Retry` with `Uploaded`.
- Async ListBox retry removed the error action and inserted only the real Lumo
  and Gate options.
- TransferList moved Priority to Visible fields and announced `1 moved to list
  Visible fields`.
- OverflowList rendered a measured `+1 more` affordance and both collapse ends.

## Verification

- Focused new/changed suites: **7 files, 124 assertions, all green**.
- Complete test chain: config 10, core 30, theme 427, gate 144,
  base-ui-ssr 13, UI 1,751, blocks 160, website 81 — **2,616 total, all green**.
- Types, ESLint, no-CSS-modules, inert-prop and root-contract gates: clean.
- Registry/API: **128 registry items**, **105 API modules**; all 128 payloads
  compile in a bare consumer.
- Production export: **540 documents**, **0 HTML violations**; 198 evidence
  panels injected.
- `git diff --check`: clean.

The first production build attempt failed because Turbopack's CSS worker could
not bind its sandbox-internal port (`Operation not permitted`). The identical
gate was rerun with local worker permission and passed. An earlier duplicate
verify also encountered the first build's live `.next/lock`; the owning orphaned
PID was resolved before termination. Neither result is counted as an application
failure.

## Final score

| Dimension | Previous | Final | Evidence and remaining ceiling |
| --- | ---: | ---: | --- |
| Accessibility / i18n / RTL | 9.3 | **9.4** | Required localized lifecycle/navigation text, real composite semantics, Persian keyboard/pointer tests and browser QA. No real VoiceOver/NVDA matrix. |
| Testing & tooling | 9.5 | **9.6** | Five behavior mutations killed; two vacuous fixtures found/tightened; complete 2,616-test + registry consumer + 540-page HTML chain. No automated Firefox/WebKit visual tier. |
| API design & DX | 9.5 | **9.6** | Controlled/uncontrolled hierarchy and transfer values, pure arithmetic exports, explicit lifecycle unions, generated API, zero prop/root violations. A few advanced workflows remain composition rather than one integrated API. |
| Design system & docs | 9.5 | **9.7** | Every delivered seam has bilingual interactive examples, generated API and browser-checked first-byte output. Competitors still have more visual recipes for enterprise workflows. |
| Product breadth | 9.5 | **9.5** | Gantt, uploads, collections and calendar gained material depth; OverflowList and TransferList close genuine Astryx gaps. ReUI/Astryx still ship meaningful specialized categories Lumo does not. |
| **Overall** | **9.5** | **9.6** | The remaining 0.4 is named evidence/product scope, not rounded away. |

## Declined or still missing

**PROVED product gaps, not defects in advertised behavior:**

- Gantt dependency graph/solver, critical path, baseline comparison, summary
  rollups, continuously measured zoom, and a resizable split pane.
- Event Calendar resources, recurrence, zones, CRUD/activation, configurable
  hours/snap, and pointer create/move/resize.
- Integrated async/virtual ComboBox and Select recipes; TransferList staged
  commit, search/virtual large pool, grouping and pointer reorder.
- Upload transport/chunking/pause/resume and first-party sortable preview/table
  recipes. Lifecycle UI is intentionally not a network client.
- Astryx domain/specialist categories: Chat Composer/Dictation/Tool Calls and
  citations, Markdown/RichText/Code editors, Lightbox, Tour, LogStream, advanced
  WebGL/3D/Sankey chart families, and PowerSearch as a single product component.

**Declined:** adding thin aliases such as Center, Grid, MoreMenu, TopNav,
MetadataList, StatusDot, and BottomSheet when existing Lumo primitives already
compose the behavior. Declined because a second name would add registry and docs
surface without owning a new state model or removing caller complexity.

**Declined:** adding editor/Markdown/WebGL packages in this pass. They introduce
sanitization, syntax/runtime dependencies, bundle and security policies outside
the user's no-new-dependency component-depth scope; adding them without those
decisions would lower the rating being pursued.

**SUSPECTED evidence gap:** real Persian VoiceOver/NVDA and automated Firefox/
WebKit visual-direction matrices. Browser DOM and screenshots are positive, but
they do not prove assistive-technology speech or every engine's layout.
