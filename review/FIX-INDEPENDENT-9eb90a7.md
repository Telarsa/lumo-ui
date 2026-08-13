# Independent-review remediation at `9eb90a7`

Date: 2026-08-13  
Branch: `experiment/base-ui`  
Verified starting commit: `9eb90a79bfe1e35883cc9169fcaa6758c42ba808`

This report records an independent reproduction before each change. `CONFIRMED`
means the supplied recipe reproduced the claimed defect. `PARTIALLY CONFIRMED`
means the underlying problem was real but the report overstated either the
recipe, count, or correct remedy. `REJECTED` means the claimed mutation was
already killed by the complete UI suite.

## Results first

| Review item | Verdict | What the reproduction proved | Disposition |
| --- | --- | --- | --- |
| P-1, Gantt zero tab stops | **CONFIRMED** | SSR with the first task outside the range served one rendered bar at `tabindex=-1`, and collapsing the focused branch left the remaining bar at `-1`. | Fixed and mutation-proved. |
| P-2, Persian table resize direction | **CONFIRMED** | In RTL the resizer occupies the physical left/inline-end edge. `ArrowRight` grew the column under the old test; the same key correctly shrank the comparable Resizable panel. | Fixed with paired `fa-IR`/`en-US` assertion and browser proof. |
| EventCalendar's three survivors | **CONFIRMED** | Removing the clamp, advancing by one day, and hardcoding three columns each survived the complete 1,751-test UI suite. The production implementation was correct; the fixture was not discriminating. | Tests fixed; no production change. |
| FileUpload budgeting/lifecycle | **CONFIRMED** | Removing `currentFileCount` from the budget survived the complete UI suite; accepted MIME and queued/success rendering also had no direct test. Production behavior was correct. | Tests added and each mutation killed. |
| P-4, `gate:props` name collision | **PARTIALLY CONFIRMED** | The exact Kbd recipe is invalid because Kbd already declares and consumes `size`. A direct `gradeSource` fixture proved the bug: a module-scope object property named `size` cleared dropped `size`, while dropped `toneLabel` fired. | Matcher fixed and mutation-proved. |
| P-5, API gate absent from CI | **CONFIRMED** | `verify` called `gate:api`; `.github/workflows/ci.yml` did not. | CI step and guard assertion added. |
| OverflowList / MessageScroller measurement darkness | **CONFIRMED** | A jsdom OverflowList mounted with zero visible items. Ignoring measured fit, reversing `collapseFrom`, and deleting pinned auto-follow all survived the complete UI suite. MessageScroller production was correct; OverflowList's unmeasured fallback was not. | Shared observer harness and behavioral tests added; fallback fixed to one visible item. |
| Locale-derived `dir` override | **CONFIRMED** | Both Gantt and VirtualList accepted `dir="ltr"` with `locale="fa-IR"` although their keyboard logic still derived RTL from locale. | `dir` removed from both public prop types; compile assertions added. |
| ListBox two-root change | **PARTIALLY CONFIRMED** | The Fragment did expose two sibling roots, and moving the async block inside the listbox survived the complete suite. However, the report's implied alternative was wrong: async status belongs outside the composite. | One framing root now contains the semantic listbox and its sibling status; root/placement assertion added. |
| Generated documentation debt | **PARTIALLY CONFIRMED** | All 2,304 generated prop rows lacked prose and `components.json` still said `aria-vega`. Registry measurement found 41 non-terminal excerpts plus 2 empty descriptions, not “42 truncated mid-word.” | JSDoc is emitted, inherited props receive explicit prose, registry descriptions end at a complete sentence, style is `vega`. |

The separate P-6 assertion about Alert's English-default source check is
**REJECTED**. Replacing its required `aria-label` path with hidden English text
fails the complete UI suite in `composition-gaps.test.tsx`. A narrow component
run is blind, which is exactly the trap §12.5 warned about. Production was
restored without change.

## Fix evidence and the assertion that catches each regression

1. **Gantt roving focus.** `gantt.tsx` builds `barIndexById` only from rendered
   placements and clamps the served focus index to that rendered population
   (`packages/ui/src/gantt.tsx:812-816`, `:1081-1098`). The assertions are
   “serves one tab stop when earlier rows have no bar in the requested range”
   and “keeps one tabbable bar after collapsing the branch that held focus”
   (`packages/ui/src/gantt.test.tsx:468`, `:619`). Reapplying row indexes and
   removing the clamp made both named assertions fail.

2. **Table physical key direction.** `ColumnResizer` now applies
   `resizeBy(rtl ? -10 : 10)` to ArrowRight (`packages/ui/src/table.tsx:1760`).
   “mirrors a physical ArrowRight resize between Persian and English”
   (`packages/ui/src/table.test.tsx:925`) failed when the unconditional English
   signs were restored.

3. **EventCalendar survivors.** The suite now projects and clamps widths across
   `2`, `5`, `14`, `1→2`, and `15→14`, and compares the exact callback date
   after a five-day move. The assertions are “renders each requested N-day
   width and clamps out-of-range widths to 2–14” and “advances an N-day view by
   exactly N calendar days” (`packages/ui/src/event-calendar.test.tsx:690`,
   `:704`). Each of the three original mutations independently makes these red.

4. **FileUpload policy and states.** “budgets new files against files the caller
   already owns”, “accepts matching MIME types and reports a non-matching file
   as type”, and “renders caller-owned queued and success states as live status
   text” live at `packages/ui/src/file-upload.test.tsx:20`, `:42`, and `:65`.
   Removing each corresponding production branch makes its named assertion red.

5. **Prop gate collision.** Object-literal keys are excluded from delivery
   references at `packages/gate/src/inert-props.ts:382-405`; genuine references
   remain valid. The module-scope collision fixture starts at
   `packages/gate/src/inert-props.test.ts:192`. Removing the property-name
   exclusion makes the fixture fail because dropped `size` disappears again.

6. **CI API gate.** CI runs `pnpm run gate:api` at
   `.github/workflows/ci.yml:121`. `packages/gate/src/api-reference.test.ts:24`
   asserts the workflow contains that exact command. Renaming the CI command
   makes the assertion red.

7. **Measurement behavior.** OverflowList defaults `minVisibleItems` to one
   (`packages/ui/src/overflow-list.tsx:98`). Its tests pin deterministic SSR,
   unmeasured fallback, observed shrink/grow, and both collapse directions
   (`packages/ui/src/overflow-list.test.tsx:44-113`). MessageScroller pins
   content growth only while the reader remains at the end
   (`packages/ui/src/message-scroller.test.tsx:136`). Defaults of zero, ignored
   fit, reversed collapse order, and deleted auto-follow each make the relevant
   assertion red.

8. **Owned direction.** `GanttProps` omits `dir`
   (`packages/ui/src/gantt.tsx:640`); the equivalent VirtualList assertion is at
   `packages/ui/src/virtual-list.test.tsx:58`. Removing either omission makes
   TypeScript report its `@ts-expect-error` as unused.

9. **ListBox root contract.** The framing element is at
   `packages/ui/src/list-box.tsx:701`. “ListBox keeps async status outside its
   composite while exposing one root” (`packages/ui/src/root-contract.test.tsx:115`)
   fails if the Fragment returns or if the status is moved into `role=listbox`.

10. **Generated docs.** `registryDescription` is at
    `scripts/build-registry.mjs:216`; prop documentation is emitted by
    `descriptionOf` at `scripts/build-api-reference.mjs:89-130`; the registry
    style is `vega` at `components.json:3`. “publishes complete, non-empty
    registry descriptions” (`packages/gate/src/build-registry.test.ts:10`) and
    the API-reference completeness assertion both fail under the old generators.

## Additional browser-found defect

The Persian Table page's “Column resizing” example originally rendered a raw
Table without `useLumoTable`. The visible handle was therefore a plain button:
no separator role, no `aria-valuenow`, and no keyboard resize. The failing
public assertion is “ships a working Persian column-resize handle”
(`apps/website/src/examples/table.test.tsx:8`). The example now crosses the
server/client boundary through `TableResizingIsland`; in the in-app browser its
named separator changed from `aria-valuenow="200"` to `"190"` after
ArrowRight. Removing `table={table}` makes that named assertion red again.

## Browser pass completed

The in-app browser was exercised against the local Next site, not inferred from
jsdom:

- Gantt kept exactly one tabbable rendered bar after the branch containing the
  focused bar was collapsed.
- Persian Table exposed a named separator and ArrowRight changed 200 → 190.
- EventCalendar's three-day view moved August 11–13 → August 14–16.
- FileUpload rendered progressing and failed rows with visible/live status,
  progressbar, Retry, and Remove actions.
- ListBox recovery removed the external error state and populated its semantic
  listbox with Lumo and Gate options.
- VirtualList's end-loading example rendered the initial virtual window and its
  authored “Loaded 40” status.
- OverflowList rendered a deliberate server window rather than zero items.

This is a high-risk-route browser pass, not a claim that all 98 component pages
received visual QA.

## Re-evaluation

Blindly re-rated against the evidence above, before using §10's old numbers as
an anchor:

| Dimension | After remediation | Why it is not 10 |
| --- | ---: | --- |
| Accessibility / i18n / RTL | **9.0** | The two critical defects and direction override are closed, but no real assistive-technology session was performed. |
| Testing and tooling | **9.1** | Every reported survivor now has a discriminating assertion and both generated gates run in CI; mutation coverage is still targeted rather than systematic over all 98 components. |
| API design and DX | **8.8** | Root and direction contracts are mechanical now; cross-component locale conventions and controlled-state policy still merit a separate consistency pass. |
| Design system and docs | **9.0** | Generated docs are complete and the repaired example works in-browser; the whole catalogue has not had visual/browser QA. |
| Product breadth | **8.5** | The broken breadth claims are now covered and the served components work, but direct competitors still offer deeper Gantt collaboration/recurrence and broader data-grid/upload infrastructure. |
| **Overall** | **8.9** | A defensible large improvement from ≈7.0, but calling it 10 without a 98-page browser/AT pass and systematic mutation campaign would repeat the original scoring mistake. |

This score is intentionally evidence-limited. The old rating fell because green
counts were mistaken for behavioral coverage; this rating does not add points
for checks that were not performed.

## Declined / not claimed

- No paid service, runtime dependency, publish, push, upstream issue, or remote
  mutation was used.
- The Gantt composite-role gate was not broadened. Modeling a list of nested
  interactive bars in the static HTML gate is a larger rule-design change; the
  public SSR and interaction assertions close the proved defect without an
  unmeasured blast radius.
- No fake `ResizeObserver` production fallback was added; the harness belongs
  in tests and real browsers retain measurement-driven behavior.
- No English default was added to any announced string.
- A visual sweep of all 98 pages, real screen-reader testing, and a complete
  five-library competitor refresh were not claimed. They are distinct review
  projects, not prerequisites for closing these reproduced defects.

## Verification

The single `pnpm run verify` invocation completed every stage through generated
API/registry checks and external-consumer smoke, then the sandbox denied
Turbopack's PostCSS worker permission to bind its internal local port. That
invocation therefore exited 1 for `Operation not permitted`, not for a project
assertion. In accordance with the one-run/low-RAM constraint, the complete
verification was not restarted. Only the two unfinished stages were resumed
with the needed permission:

- typecheck: all workspace packages passed;
- `gate:props`: 128 component files, 0 inert-prop and 0 root-contract findings;
- lint and no-CSS-modules: passed;
- tests: UI 77 files / 1,766 tests; Blocks 2 / 160; Website 12 / 82;
  Gate 5 / 147; Core 3 / 30; Theme 1 / 427; Base-UI SSR 1 / 13; Config 1 / 10;
- registry: 128 items current;
- API reference: 105 modules current;
- smoke consumer: all 128 payloads copied and typechecked outside the workspace;
- resumed production build: 540/540 static pages and 198 evidence panels;
- resumed served-HTML gate: passed, Persian digit floor armed on 12 routes.

`git diff --check` is clean. The only worktree entry intentionally left outside
the final remediation commit is the review input
`review/INDEPENDENT-REVIEW-9eb90a7.md`, which was untracked before this work and
was preserved as user-owned evidence. No changes were pushed or published.
