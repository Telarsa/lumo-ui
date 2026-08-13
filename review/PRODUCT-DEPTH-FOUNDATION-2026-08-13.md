# Product-depth foundation — async collections

Date: 13 August 2026  
Base commit: `49301f3ec14542c4f1419da3319815d36c565962`

## Outcome

The first Wave 1 module is implemented. `useAsyncCollection` owns transport-
independent cancellation, stale-result rejection, cursor paging, overlapping
page replacement, retry and refresh. It does not own a network client or any
announced language. `presentAsyncCollection` maps its behavior to required
caller-authored messages, and `groupCollection` preserves first-seen group and
row order.

The seam is used in two existing collection components:

- `ListBoxAsyncState` is now the shared presentation type rather than a second
  copy of the same state model.
- `VirtualList.asyncStatus` owns `aria-busy` for loading, refreshing and
  loading-more, while error and ready remain operable.

Both copied registry payloads carry `async-collection.ts`; the package index
also exports the complete interface. No runtime dependency was added.

## Red/green and mutation evidence

| Behavior | Red or mutation | Assertion that caught it |
| --- | --- | --- |
| Module absent | Focused suite failed to resolve `./async-collection.ts`. | The new suite could not collect before implementation. |
| Superseded result ignored | Removing the post-load aborted-signal guard made a stale row set status to `ready`. | `aborts the superseded request and ignores its result even when the loader ignores abort` failed at the intermediate `status === "loading"` assertion. |
| One request per cursor | Removing the in-flight guard made two rapid `loadMore()` calls start two page requests. | `loads pages once, replaces overlapping keys, and preserves their first position` expected two total loader calls and received three. |
| Overlapping page refresh | Discarding a repeated key left the older row payload in place. | The same paging assertion expected `Beta updated` and received `Beta`. |
| Virtual busy state | Before `asyncStatus` was consumed, React forwarded an unknown prop and the list had no `aria-busy`. | `announces only active remote work as busy` expected `aria-busy="true"` and received `null`. |

The mutation pass also found and removed a redundant generation counter. An
aborted controller already remains aborted even when its loader ignores the
signal and resolves; the observable stale-result guard is the signal check.
Keeping both mechanisms added implementation without interface leverage.

## Verification

- Focused async/ListBox/VirtualList suites: 39/39 passed.
- UI full run: 1,870 passed; five tests in four pre-existing heavy files hit the
  shared 15-second timeout under the all-file pool. Those four files then passed
  306/306 with one worker, proving resource contention rather than an assertion
  regression.
- UI typecheck, focused ESLint, `gate:props` and `gate:registry`: passed.
- Consumer smoke: all 128 dependency graphs validated and all 128 copied
  payloads typechecked outside the workspace.
- `git diff --check`: passed.

## Deliberate limits

- No fetch, XHR, storage, TanStack Query or other transport adapter is bundled.
- No default loading, retry, empty or error text exists.
- Grouping is an ordered projection, not a second selectable state machine.
- Combobox, Select, Tree, TransferList and DataGrid are not yet migrated. The
  foundation is complete; the Wave 1 integration checkbox remains open until
  those callers share it.
- `review/INDEPENDENT-REVIEW-9eb90a7.md` remains untouched and untracked.
