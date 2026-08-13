# Wave 1–2 completion evidence — 13 August 2026

This record closes the first two product-depth waves in `ROADMAP.md`. It does
not revise the 9.3 whole-library rating: that remains frozen until a fresh blind
evaluation. It also does not claim NVDA, JAWS or current Chrome/TalkBack, which
remain explicitly deferred.

## Shipped surface

- Wave 1: async/virtual DataGrid integration; recursive PowerSearch over the
  shared query AST and canonical bytes; nested/list form state, schema and
  latest-result async validation; SSR-safe toast/modal/command managers.
- DataGrid: logical pinning, stable column/row ordering, transactional editing,
  TanStack grouping/pinning/ordering/aggregation features, native-table virtual
  rows, infinite-loading threshold and footer aggregation helpers. The 100,000-
  row pure-operation test has a one-second ceiling.
- EventCalendar: resource grouping, bounded recurrence and exclusions, immutable
  CRUD, explicit IANA conversion, work-hour/snap movement, both-edge resizing,
  keyboard and pointer timed creation/movement/resizing, deletion and required
  localized live announcements.
- Gantt: recursive hierarchy rollups with cycle rejection, dependency DAG and
  cycle rejection, critical-path analysis, dependency connectors mirrored by
  locale, baselines, continuous zoom and a logical keyboard-resizable split.
- Upload: directory and camera acquisition, recursive entry collection,
  transforms, stable reorder plus caller-labeled row controls, and an optional
  chunk transport with progress, pause/resume, cancellation and retry.

## Red/green and mutation proof

The following production mutations were applied deliberately, the named
assertions failed, then the original implementation was restored:

1. Map DataGrid logical `start` pinning to the physical end: the logical pinned
   style assertion failed.
2. Ignore recurrence exclusions: the stable occurrence-ID/exclusion assertion
   failed.
3. Return no Gantt critical path: the longest-path and cycle assertions failed.
4. Return upload rows unchanged: the stable reorder assertion failed.
5. Roll a parent from direct children instead of recursively rolled summaries:
   `rolls nested descendants through their intermediate summaries` failed.
6. Disable scheduler creation: `creates snapped timed drafts from both the
   keyboard and pointer` failed.
7. Remove the virtual native row's measurement ref: `measures mounted native
   rows instead of keeping estimates forever` failed.

The last three mutations produced exactly three failed assertions across the
135-test Gantt/EventCalendar/Table run; restoration returned it to 135/135.

## Browser evidence

The local Next preview was exercised in the in-app browser in both English/LTR
and Persian/RTL for DataGrid, EventCalendar, Gantt and FileUpload.

- No document-level horizontal overflow and no console errors remained.
- Persian DataGrid cells and EventCalendar accessible names contained no Latin
  digits.
- EventCalendar keyboard creation visibly inserted a new event.
- Gantt zoom accepted a new range value, the split moved in the correct logical
  direction in both locales, and dependency/critical-path marks rendered.
- Upload rendered native `capture="environment"`, `webkitdirectory` and
  `directory` acquisition attributes. Its localized reorder action changed the
  visible file order.

The pass first exposed an intentional pre-hydration theme stamp as an unhandled
React root mismatch. `LumoHtml` now exposes an opt-in
`suppressHydrationWarning`; only the three layouts that run `ThemeScript` use
it. A fresh browser tab then reported zero hydration errors.

## Verification

Before the whole-workspace gate, focused verification passed:

- 236/236 UI tests across DataGrid, Table, EventCalendar, Gantt, FileUpload,
  PowerSearch, FormState and Provider.
- 4/4 website island tests.
- 135/135 restored Gantt/EventCalendar/Table mutation-target tests.
- UI and website TypeScript checks, changed-file ESLint and `git diff --check`.

The one reserved `pnpm run verify` attempt cleared workspace types, prop/root,
lint and CSS policy, then exposed a stale process guard: the mutation floor and
runner still expected 98 implementation modules although the shipped
PowerSearch module made the discovered catalogue 99. The other 1,938 UI
assertions were green. The guard and runner now require 99; verification resumes
from the failed UI-suite stage rather than repeating already-passed gates.

The resumed verification completed with:

- UI 1,939/1,939, blocks 160/160 and website 85/85 tests.
- 129/129 registry dependency graphs and clean-room copied payloads typechecked.
- 106/106 generated public API modules current.
- Prop/root gate: 129 files, zero violations.
- Production static export: 544/544 documents generated and graded, zero
  violations; 200 component evidence panels were injected.

The first HTML scan found 22 actionable violations and therefore failed: 12
extra EventCalendar Tab stops introduced by interactive chips, six upload
reorder names missing the narrow mixed-script filename marker, and four raw
PowerSearch number/date displays. The fixes preserved behavior: event controls
are `tabIndex=-1` and programmatically entered with E from the focused day;
upload marks only filename-bearing controls; PowerSearch formats display values
from the active locale while its canonical query strings remain unchanged.
Focused tests passed 66/66, registry/API artifacts were regenerated, and the
second production scan returned 544 documents with zero violations.

The first production build attempt inside the filesystem sandbox also failed
before compiling because Turbopack could not bind an internal worker port. The
same `gate:html` command completed with build permission; this was an execution-
environment restriction, not a suppressed product failure.

## Deliberate limits

- Scheduler recurrence is a bounded typed subset, not a partial RFC 5545 string
  parser. Resource grouping is public engine logic; a virtualized resource
  swimlane renderer is still product-specific.
- Gantt dependencies are analysed and rendered but do not silently reschedule
  downstream work; automatic leveling needs explicit conflict/resource policy.
- Upload provides the transport contract, not a bundled HTTP/cloud client.
- No runtime dependency was added, and nothing was pushed or published.
