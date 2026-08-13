# Lumo UI assistive-technology, visual, and mutation pass

Date: 2026-08-13

Branch: `experiment/base-ui`

Starting HEAD: `7b3938aa258bf6e58ccc58081256ede6ec6bff3f`

## Result

This pass completed all three previously missing evidence projects:

1. a real VoiceOver session against the production-shaped site;
2. a visual/browser pass over every public component route in English/LTR and
   Persian/RTL; and
3. one isolated mutation in every one of the 98 UI implementation modules.

It found and fixed three defects rather than merely raising a score:

- **PROVED:** the VirtualList documentation example collapsed to a two-pixel
  border and a zero-width scrollport in Chromium;
- **PROVED:** VoiceOver counted VirtualList's layout sizer instead of its
  listitems and announced the list as “1 item”; and
- **PROVED:** VoiceOver did not announce a Table column separator's raw numeric
  width. A caller-localized `aria-valuetext` is load-bearing.

The evidence supports **9.2/10 overall**, not the earlier 9.6 claim. The
independent review correctly reset the evidence-backed baseline to 8.9 after
its ten-defect remediation. This pass closes the three explicit evidence gaps
named there, but one macOS/Chromium/VoiceOver stack and a breadth mutation floor
are not equivalent to a multi-platform AT matrix or exhaustive semantic
mutation score.

## 1. Complete visual/browser matrix

The static export currently contains **99 public component routes backed by 98
implementation modules**. `IconButton` is a distinct documentation route but
shares `button.tsx`; this is why the current route count is one higher than the
98-module brief. All 99 routes were opened in both `/en/` and `/fa/`: **198
rendered pages**.

Each page was checked for the expected `lang` and `dir`, one H1, a rendered
preview, absence of 404 content, broken images and unloaded fonts, and body or
viewport horizontal overflow. Contact sheets for both directions were then
inspected visually. The only catalogue-wide visual failure was VirtualList,
described below.

The complete route population, with both locales passing after the fix, is:

| Group | Routes checked in `en-US/LTR` and `fa-IR/RTL` |
| --- | --- |
| Form controls (35) | `autocomplete`, `button`, `button-group`, `calendar`, `checkbox`, `combobox`, `date-field`, `date-input`, `date-picker`, `date-range-picker`, `date-selector`, `file-upload`, `filters`, `form`, `form-state`, `icon-button`, `input-group`, `input-otp`, `native-select`, `number-field`, `phone-input`, `questionnaire`, `radio-group`, `range-calendar`, `rating`, `search-field`, `segmented-control`, `select`, `slider`, `switch`, `text-area`, `text-field`, `time-field`, `toggle`, `toggle-group` |
| Content display (18) | `attachment`, `avatar`, `badge`, `bubble`, `carousel`, `disclosure`, `empty-state`, `icon-stack`, `icon-tile`, `item`, `kbd`, `marker`, `message`, `message-scroller`, `num`, `tag`, `tag-group`, `timeline` |
| Overlays (9) | `alert-dialog`, `command`, `context-menu`, `dialog`, `drawer`, `hover-card`, `menu`, `popover`, `tooltip` |
| Navigation (10) | `breadcrumbs`, `link`, `menubar`, `navigation-menu`, `pagination`, `scrollspy`, `sidebar`, `steps`, `tabs`, `toolbar` |
| Feedback (6) | `alert`, `progress`, `skeleton`, `skeleton-presets`, `spinner`, `toast` |
| Layout (9) | `aspect-ratio`, `card`, `frame`, `overflow-list`, `provider`, `resizable`, `scroll-area`, `separator`, `stack` |
| Data display (12) | `chart`, `data-grid`, `description-list`, `event-calendar`, `gantt`, `kanban`, `list-box`, `sortable`, `table`, `transfer-list`, `tree`, `virtual-list` |

### Browser-found VirtualList defect

**Before:** the live list and its island wrapper measured two CSS pixels wide;
the list's `clientWidth` was zero even though 25 listitems existed. The wrapper
was `class="flex flex-col gap-2"`. Its child used a percentage width, producing
an intrinsic-size cycle inside the preview.

**Failing assertion first:** `apps/website/src/components/demo-islands.test.tsx:45-65`
names the contract “`gives its percentage-width viewport a definite inline
size`” and requires `w-full` on both viewport and wrapper. It failed on the
wrapper before the production change.

**Fix:** `apps/website/src/components/demo-islands.tsx:2628` now serves
“`className="flex w-full flex-col gap-2"`”.

**After:** the rebuilt live viewport measured 431 CSS pixels (`448px` border
box), 320px high, rendered 25 listitems, and exposed a corpus size of 10,000.
The rows were visibly readable in both directions. Removing `w-full` makes the
named regression assertion fail again.

## 2. Real VoiceOver session

Environment: macOS 26.5.2, VoiceOver 10, ChatGPT's Chromium 151 in-app browser,
production static export at `localhost:4173`. The VoiceOver Caption Panel was
enabled so spoken output could be inspected rather than inferred from DOM.

Apple's current documentation was used for the keyboard model and Caption
Panel: [VoiceOver keyboard commands](https://support.apple.com/guide/voiceover/control-your-mac-with-keyboard-commands-vo2681/mac),
[web commands](https://support.apple.com/guide/voiceover/web-commands-vo27972/mac),
and [Caption Panel](https://support.apple.com/guide/voiceover/use-the-braille-and-caption-panel-on-mac).

| Component / action | Actual VoiceOver evidence | Verdict |
| --- | --- | --- |
| AlertDialog, open → traverse → Escape | “Cancel, button, Delete the invoice … alert dialog”; next “Remove, button”; after Escape “Delete the invoice, dialog pop up collapsed, button” | **PROVED sound:** named context, contained actions, and focus restoration. |
| Autocomplete, focus and type `te` | “Search commands Type a command, list box pop up expanded, combo box”; DOM value became `te` and stayed expanded | **PARTIAL:** the editable/expanded contract was heard, but active-suggestion speech was not captured; no claim beyond that. |
| Persian Calendar, move right | “button, column 5 of 7, ۱۴۰۵ مرداد ۷, چهارشنبه” | **PROVED sound:** Jalali date, Persian digits, weekday, and table coordinate reached the reader. |
| Gantt, first task then Down | “Spring release, from March 21, 2026 to April 7, 2026, 45% complete, toggle button, list 6 items”; then “Design the checkout page … 100% complete” | **PROVED sound:** roving task focus exposes date range and progress. |
| VirtualList before fix | “Preview, tab panel, list Order list 1 item”; entering reached “Order 1” | **PROVED defect:** a generic layout wrapper corrupted collection count. |
| VirtualList after fix | “Preview, tab panel, list Order list 10,000 items”; entering reached “Order 1, 1 of 10,000” | **PROVED fix:** layout node is flattened and corpus semantics are heard. |
| Persian Table before value-text fix | Isolated numeric-only separator: “vertical splitter” | **PROVED defect:** `aria-valuenow=180` alone was not exposed in speech. |
| Persian Table after fix | Live Lumo control: “vertical splitter, ۲۰۰ پیکسل … سفارش‌های اخیر, table, 3 columns, 3 rows” | **PROVED fix:** the required localized formatter is heard on the real component. |

Toast was triggered and its live region was verified in the DOM, but the
transient spoken sentence was not captured. FileUpload's named group, picker,
and help association were verified in the accessibility tree, but a native
file-dialog activation was not completed. Those are explicitly **not claimed
as real-reader passes**.

### VirtualList accessibility-tree fix

The positioning sizer is layout-only. `packages/ui/src/virtual-list.tsx:288-293`
now says “`Layout-only: flatten this node in the accessibility tree`” and sets
`role="presentation"`. The named assertion at
`packages/ui/src/virtual-list.test.tsx:137-145` requires a presentational direct
child under the list. It failed before the change and fails again if the role
is removed. VoiceOver's change from “1 item” to “10,000 items” is the independent
end-to-end proof.

### Table value announcement fix

The WAI-ARIA range guidance permits `aria-valuetext` on a focusable separator,
and a focusable separator still owns its numeric range attributes. Current
references: [WAI-ARIA range-related properties](https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/)
and [Window Splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/).

An isolated poison twin used two otherwise identical Persian separators. The
numeric-only control produced “vertical splitter”; adding
`aria-valuetext="۱۸۰ پیکسل"` produced “vertical splitter, ۱۸۰ پیکسل”. The live
Lumo component then reproduced the latter result.

`packages/ui/src/table.tsx:1687-1708,1741-1756` now:

- removes consumer control of owned `aria-valuetext`;
- requires `valueText: (value: number) => string`; and
- emits the formatter result beside `aria-valuenow/min/max`.

There is no English default. The website caller at
`apps/website/src/components/demo-islands.tsx:973-979` says
``valueText={(value) => `${formatNumber(value, locale)} ${resizeUnit}`}``. The
generated API reference exposes the prop as required at
`api-reference.json:12142-12157`. The named assertion “`serves a localized
value string that VoiceOver actually announces`” at
`packages/ui/src/table.test.tsx:942-945` was red before the emission and is red
again if that emission is reverted. The older migration assertion was
deliberately corrected: it had pinned the defective absence of all value text.
It now requires “`aria-valuetext="۱۵۰ پیکسل"`” while still forbidding the former
English bundle string and hidden range input at
`packages/ui/src/data-display.test.tsx:249-268`.

## 3. Systematic 98-module mutation campaign

`scripts/mutate-components.mjs:16-46,61-100` enumerates the 98 non-test TSX
implementation modules and applies one isolated mutation at a time, restoring
the original bytes in a `finally` block:

- 96 rendered modules: remove every JSX `className=` assignment;
- `form-state.tsx`: remove submit cancellation; and
- `provider.tsx`: disconnect direction from locale.

`packages/ui/src/component-mutation-floor.test.ts:31-42` pins the exact
98-module catalogue and a per-module campaign anchor. The final recorded run at
`review/MUTATION-CAMPAIGN-2026-08-13.json:1-8` is:

> **98 killed / 98; 0 survived; 0 invalid**

The preliminary operator removed only the first class assignment. It produced
apparent survivors because a later class assignment still satisfied the same
anchor. That run was rejected, the leaked scratch mutation was restored, and
the operator was changed to remove every assignment before the recorded run.
No provisional result is counted.

This is deliberately called a **mutation floor**, not a comprehensive mutation
score. A broad styling mutation proves that every implementation module is in
the declared, testable catalogue; it does not prove every state transition or
branch. The deeper behavior mutations from the independent-remediation and
depth passes remain the evidence for Gantt, EventCalendar, upload, collections,
OverflowList, TransferList, and the prop/API gates.

## 4. Re-evaluation

| Dimension | Independent-remediation baseline | Current | Why it is not 10 |
| --- | ---: | ---: | --- |
| Accessibility / i18n / RTL | 9.0 | **9.3** | Real VoiceOver caught two defects and verified their fixes; AlertDialog, Calendar, Gantt, and VirtualList also spoke correctly. Still only macOS VoiceOver/Chromium, not NVDA/JAWS/Firefox/TalkBack, and not all 99 routes with AT. |
| Testing and tooling | 9.1 | **9.4** | Every implementation module received an isolated mutation, and visual geometry plus AT regressions now have named tests. The catalogue operator is a breadth floor, not exhaustive semantic mutation, and there is no automated Firefox/WebKit visual tier. |
| API design and DX | 8.8 | **9.0** | The separator now makes its localized speech requirement explicit and unoverrideable. Cross-component controlled-state and locale conventions still deserve an independent consistency pass. |
| Design system and docs | 9.0 | **9.4** | All 198 locale/direction pages were rendered and inspected, and the one collapsed example was fixed. Competitors still provide materially more enterprise recipes and automated screenshot baselines. |
| Product breadth | 8.5 | **8.8** | The 98 modules/99 routes are unusually broad and the latest depth work is real, but dependency-aware Gantt, recurrence/resources/time zones, resumable upload transport, and integrated async/virtual selection remain genuine gaps. |
| **Overall** | **8.9** | **9.2** | The three missing evidence projects are now real, but their limits are named rather than rounded away. |

The earlier 9.6 was lowered because it counted green gates and feature additions
as if they proved behavior. The independent review demonstrated the opposite:
critical keyboard/RTL failures and 14 surviving mutations coexisted with those
greens. The 9.2 here rises only for evidence actually gathered and defects
actually closed.

## 5. Declined and not claimed

- No runtime dependency, paid service, publish, push, or remote mutation was
  used.
- No English default was added to an announced string.
- No score was added for Toast speech or FileUpload native-dialog behavior;
  those real-reader observations were incomplete.
- No NVDA, JAWS, Narrator, TalkBack, Firefox, Safari, or WebKit result is
  claimed. Those require platforms/engines not present in this session.
- No thin component aliases or large editor/WebGL/runtime packages were added.
  They do not remedy the defects found here and would introduce design,
  security, and bundle decisions outside this evidence pass.
- The mutation result is not represented as “100% mutation coverage.” It is
  one explicit, comparable floor per implementation module.

## 6. Verification

- Focused UI Table/data-display suites: 2 files / 64 assertions, passed.
- Focused website island suite: 1 file / 2 assertions, passed.
- Static website build: compiled and exported 540 pages; 198 evidence panels
  injected.
- One top-level `pnpm run verify` was invoked. It stopped in its first stage
  because checked JavaScript found implicit `any` parameters in the new
  mutation runner. The runner was typed at
  `scripts/mutate-components.mjs:24-28,50-60,70-72`; `gate:types` then passed.
- Every remaining verification stage was resumed explicitly and passed:
  prop/root gates graded 128 component files with zero findings; lint and the
  no-CSS-modules gate passed; config 10, core 30, theme 427, gate 147,
  base-ui-ssr 13, UI 1,866, blocks 160, and website 83 tests passed — **2,736
  assertions total**.
- Registry/API/consumer checks passed: 128 registry items, 105 API modules,
  and all 128 payloads typechecked outside the workspace.
- Production export and HTML gate passed: 540 pages, 198 evidence panels, zero
  violations.
- `git diff --check`: clean after all verification stages.

No change was pushed. `review/INDEPENDENT-REVIEW-9eb90a7.md` remains untouched
and outside this work's grouped commit.
