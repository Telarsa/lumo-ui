# Lumo dropdown migration and evaluation

Date: 13 August 2026

Branch: `experiment/base-ui`

Starting commit: `7d1f27e`

## Outcome

Lumo's current evidence supports **9.6/10**. This pass removes the inconsistent
native-dropdown exception from product components; it does not claim 10/10 or
use component count as a proxy for quality.

All product-owned dropdowns now use Lumo's Select/MultiSelect composition:
Filters, PowerSearch, DataGrid pagination, PhoneInput and react-day-picker's
Calendar/RangeCalendar captions. TagsInput suggestions now use a named Lumo
listbox rather than a browser datalist. The standalone NativeSelect component,
example and registry item were removed because retaining a public escape hatch
would contradict the product-wide contract.

The resulting measured catalogue is 111 UI implementation modules, 112 public
component pages, 30 blocks, 141 generated registry items and 118 generated API
modules.

## Proved defects and assertions

1. Native dropdowns survived inside product widgets. Tests now require no
   `<select>` in Filters, DataGrid, PhoneInput, PowerSearch and calendar
   compositions, then select options through Lumo's `role="combobox"` /
   `role="option"` behavior.
2. Calendar initially supplied a newly-created Dropdown component on every
   render, so opening it remounted the control and immediately closed the popup.
   `dates.test.tsx` now requires the year popup to remain mounted after focus
   settles; the stable exported `CalendarDropdown` satisfies it.
3. Calendar navigation overlaid the caption trigger and intercepted pointer
   input. The calendar assertion requires the Select wrapper's relative stacking
   context; browser interaction proves the popup can be opened and selected.
4. A 105-year list rendered as a 3,842 px popup. `select.test.tsx` now requires
   `max-h-[min(20rem,var(--available-height))]`; browser measurement is 304 px
   desktop and 320 px at 390×844, within both viewports.
5. The first height fix put `overflow-auto` on both popup and list, visibly
   producing two scrollbars. The new assertion requires the popup to be
   `overflow-hidden`, forbids its `overflow-auto`, and requires the list to own
   `overflow-auto`. Browser computed style confirms hidden/auto respectively.
6. A Select-valued Filters clause rendered its error twice. A new assertion
   requires one occurrence and `aria-invalid="true"`; the owned Select field now
   renders the message while the outer fallback serves the other editor types.
7. TagsInput's native datalist could not expose Lumo option styling or a stable
   active-descendant contract. Its test now requires a named suggestion list,
   arrow highlight, Enter selection, and no datalist.
8. The first scrollbar polish reserved a stable gutter and revealed a thin
   native rail during interaction. The 390 px Persian calendar pass proved the
   reservation itself remained visible as an empty strip and made the popup
   look wider than its content. The final treatment follows the Base UI /
   Radix-style long-select pattern instead: the engine hides the native rail,
   reserves no gutter, and exposes 20 px surface-backed edge scroll controls
   only where more content exists. Calendar caption selects additionally use
   an 80 px trigger/popup, 29 px options, and a 256 px cap.
9. Select options no longer opt into the global standalone-control focus ring.
   A listbox is a composite: its keyboard cursor is the highlighted row, while
   the selected row already has `aria-selected` and the check indicator. The
   old `data-lumo` marker drew the thick rounded outline seen around a year and
   made that option look like a nested button. A DOM assertion now forbids the
   marker on `role="option"` while preserving the highlighted background.

The red state was observed before each fix. Re-applying the relevant old class,
factory, native control, or duplicate error branch fails the named assertion;
the mutations were restored before verification.

## Browser evidence

- Ten affected routes were checked in English/LTR and Persian/RTL at desktop
  and 390×844: 20 desktop and 20 mobile page loads, zero native selects,
  datalists or horizontal overflow.
- Filters, PhoneInput and TagsInput option selection was exercised in Persian.
- Calendar's 105-option Persian year popup remains open, stays within the
  viewport and has one visible scrolling owner. The fresh final tab produced no
  console errors.
- The final Persian year popup at 390×844 measures 80×256 px, with 29 px rows,
  `scrollbar-gutter: auto`, `scrollbar-width: none`, equal `clientWidth` and
  `offsetWidth`, and no option outline. Both 20 px edge controls are visible
  around the selected middle year; they disappear independently at the ends.
- A source-less MutationObserver error appeared only during the earlier rapid
  reuse loop and did not reproduce in the fresh final tab; it is rejected as
  browser-instrumentation teardown, consistent with the prior Wave 3 finding.

## Verification

The first `pnpm run verify` stopped when one registry freshness test timed out at
30 seconds while four test packages competed. It had no failed assertion. The
same test passed alone in 8.07 seconds, and the remaining packages were then run
sequentially.

- Types, prop/root contracts, ESLint and no-CSS-Modules: clean.
- Tests: **2,904 passed** — core 31, theme 427, gate 148, config 10, Base UI SSR
  13, UI 2,028, blocks 160 and website 87.
- Registry: 141 graphs checked; all 141 payloads copied and typechecked outside
  the workspace.
- API reference: 118 modules current.
- Production export: 594 documents, 224 evidence panels; HTML gate graded all
  594 with zero violations.
- The restricted HTML build was denied permission to bind Turbopack's internal
  helper port. The identical command with local-process permission completed.

## Rating

| Dimension | Rating | Evidence / remaining deduction |
|---|---:|---|
| Accessibility, Persian, RTL | 9.6 | Strong required-string, Jalali, first-byte, VoiceOver and Android TalkBack evidence; Windows NVDA/JAWS/current Chrome matrix remains deliberately deferred. |
| Testing and tooling | 9.8 | 2,904 tests, mutation floor, prop/API/registry/consumer/HTML gates and browser passes; no automated multi-browser visual-diff service. |
| API and developer experience | 9.6 | Deep React product APIs, copied registry and generated reference; public distribution/versioning remains an adoption blocker. |
| Design system and docs | 9.6 | Bilingual catalogue, consistent Lumo controls and verified mobile/RTL behavior; Wave 4 product workflows are not yet shipped. |
| Product depth | 9.5 | Enterprise grid/calendar/Gantt/upload, async collections, forms, managers, charts and advanced inputs; LogStream, AI/chat and editor ecosystems remain. |
| **Overall** | **9.6** | Near best-in-class for its declared React/Persian product-system scope, but the unproved/deferred items make 10 dishonest. |

## Declined

- No native dropdown remains as a public Lumo product component. Hidden native
  inputs owned internally by accessibility engines are not author-facing
  dropdowns and were not removed.
- No new runtime dependency was added.
- Historical review reports were not rewritten to erase their original native
  select evidence or old measured counts.
- Wave 4 LogStream, AI/chat and editor components were not smuggled into this
  consistency pass.
- The deferred Windows-only AT matrix was not claimed as complete.
