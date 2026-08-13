# Toward 10 — Event Calendar day-view tranche

Date: 13 Aug 2026  
Base: `8950730`  
Verdict after this tranche: **9.5/10 overall**

## Current-doc comparison

The current [ReUI Event Calendar](https://reui.io/docs/components/radix/event-calendar) ships month, week, day, N-day, agenda and resource views, plus recurrence, time zones, remote range loading, controlled state and pointer CRUD. Lumo entered this tranche with month, week and agenda only. Lumo remains materially stronger for this project's target reader: its values retain calendar fields rather than converting through JS instants, it renders a real Jalali month/week, it requires every announced string, and its RTL time geometry is logical rather than side-resolved.

The gap chosen here was Day view. It is a common scheduling question, it can honestly share Lumo's already-proved time-axis/overlap model, and it does not require pretending that recurrence, resources or drag CRUD are small additions.

## PROVED addition

`EventCalendarView` now includes `"day"` at `packages/ui/src/event-calendar.tsx:334`, and the caller must provide its announced name through `EventCalendarStrings.dayView` at `packages/ui/src/event-calendar.tsx:441-450`.

The Day and Week views use one renderer rather than two diverging implementations. `packages/ui/src/event-calendar.tsx:1165-1181` defines `timeGrid(days)` and derives its column count from the supplied days. The final branch passes seven locale-started days for Week and exactly `[focus]` for Day at `packages/ui/src/event-calendar.tsx:1416-1423`. Navigation uses `focus.add({ days: amount })` for Day, while Week still advances by locale week, at `packages/ui/src/event-calendar.tsx:982-990`.

The behavior assertions are explicit:

- `packages/ui/src/event-calendar.test.tsx:620-637` — “the day view projects exactly the focused day onto the time axis”; it requires one gridcell, the focused day's event, no next-day event and a pressed Day button.
- `packages/ui/src/event-calendar.test.tsx:639-656` — “the day view's period controls move by one day”; it requires the next day's event and the Persian ۲۱ announcement.

The website now carries a fifth bilingual example and documents four views in `apps/website/src/examples/event-calendar.tsx`. In the in-app browser, the Persian page exposed five Day buttons (one per worked example), only the Day example was pressed, the view rendered a single wide RTL time column headed سه‌شنبه ۲۰, and Next advanced the visible Jalali date to چهارشنبه ۲۱.

## Mutation proof

| Mutation | Assertion killed |
| --- | --- |
| Fed the Week's seven days into the Day branch | `the day view projects exactly the focused day onto the time axis` failed with 7 gridcells instead of 1 |
| Advanced the Day period by one week | `the day view's period controls move by one day` failed because the next-day event was absent |

Both mutations were restored before verification.

## PROVED tooling fix found during verification

The API-reference poison fixture launches the full checker three times—stale, write and fresh—but had a single 60-second wall-clock ceiling. It timed out twice in isolation just after 60 seconds without a failed child-process assertion. With only the ceiling raised to 120 seconds, the unchanged assertions completed successfully in 64.17 seconds. `packages/gate/src/api-reference.test.ts` now explains why a performance budget belongs on one measured generator run, not on three correctness runs sharing one timeout.

Reverting the timeout to 60 seconds reproduces the failure: `rejects stale output and accepts only checker-generated content` times out. Restoring 120 seconds makes both API-reference gate tests pass.

## Verification

- Event Calendar: **37/37** tests.
- Full workspace: **2,588/2,588** tests; UI **1,723**, website **81**.
- Types, inherited-prop/root-contract gate, ESLint and no-CSS-modules: clean.
- Registry **126 items**, API **103 modules**, and clean-room consumer: clean.
- Production export: **532 pages**; rendered-HTML audit: **0 violations**.
- Browser: Persian Day view and one-day navigation exercised in the in-app browser.
- `git diff --check`: clean.

## Rating movement and declines

The overall rating moves from **9.4 to 9.5**. Product breadth gains the most; API/DX and bilingual documentation gain slightly. Accessibility does not move merely because another accessible view exists: a real Persian VoiceOver/NVDA matrix is still missing.

- **Declined:** N-day and resource grids. They introduce range configuration/resource hierarchy and need their own responsive and keyboard model.
- **Declined:** recurrence, time-zone conversion and drag/resize/create. Each changes the data contract and persistence boundary; half an implementation would be worse than an explicit gap.
- **Declined:** claiming parity with ReUI's current Event Calendar. ReUI is substantially broader; Lumo's advantage is calendar/RTL/SSR rigor, not feature count.
- **Still highest impact:** Gantt hierarchy/resizing/long-horizon scales, upload lifecycle, async/virtual collections, then automated cross-browser visual and real assistive-technology evidence.
