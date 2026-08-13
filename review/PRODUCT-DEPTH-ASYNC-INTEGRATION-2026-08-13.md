# Product depth — async collection integration

Date: 2026-08-13  
Branch: `experiment/base-ui`  
Tranche: Wave 1, shared enterprise seams

## Outcome

The existing async collection controller is now connected to DataGrid,
ComboBox, Select, Tree and TransferList. This is one state machine, not five:
`useAsyncCollection` continues to own cancellation, stale-result rejection,
refresh, cursor paging and recovery, while each component owns only the semantic
presentation appropriate to its composite role.

DataGrid also has a bilingual, paged website example. The example keeps loaded
rows on screen while the next cursor is loading and leaves transport ownership
with the caller.

## Public seam

- `useAsyncLumoTable` projects `collection.items` into `useLumoTable` and returns
  the table, controller and caller-authored presentation together.
- `DataGrid.asyncState` renders its live status and recovery/paging action next
  to the grid and marks the shell busy during initial loading.
- `ComboBox.asyncState` and `Select.asyncState` keep status and action elements
  outside `role=listbox`; they never create a selectable loading/error option.
- `TransferList.asyncState` belongs to the available/source list only. Selected
  destination values remain available during source paging or refresh.
- `Tree.asyncStatus` marks `role=treegrid` busy without inserting an invalid
  direct status child into the treegrid.

Every announced sentence still comes from required caller-authored
`AsyncCollectionMessages`; no English fallback was introduced.

## Red/green and mutation evidence

The tests were written against the public seams before implementation. After
green, each integration was broken in production and the named assertion failed:

| Mutation | Assertion that failed |
| --- | --- |
| Removed DataGrid shell `aria-busy` | `announces loading on the shell, then projects the loaded rows into the table`: expected `"true"`, received `null`. |
| Replaced the table projection with `data: []` | The same DataGrid test could not find rowheader `سارا` after the loader resolved. |
| Removed ComboBox's recovery action | `keeps a failed request outside the option list and delivers its recovery action`: the retry button was absent. |
| Removed Select's ready-empty text | `announces the caller's empty result when the ready collection has no items`: no status element was present. |
| Removed the source ListBox async state | `loads the source pool without hiding already selected destination values`: expected source `aria-busy="true"`, received `null`. |
| Removed Tree's busy state | `keeps its rows while the shared collection refreshes and marks the treegrid busy`: expected `"true"`, received `null`. |

All mutations were restored before verification.

## Verification

- Focused behavior suite: 8 files, 131 tests passed.
- `@lumo-ui/ui` typecheck: passed.
- `@lumo-ui/website` typecheck: passed.
- Focused ESLint: passed.
- Inert-prop/root-contract gate: 128 files, zero violations.
- Registry check: 128 items passed.
- API reference check: 105 modules passed.
- Bare-consumer smoke: all 128 registry payloads copied and typechecked.

The full repository `pnpm run verify` remains reserved for the end of the larger
product-depth sequence, as required by the working constraints.

## Deliberate limits

- This tranche does not bundle a fetch client, cache or transport adapter. Those
  remain product concerns; the example uses an abortable caller-owned loader.
- Base UI Select has a static child contract, so callers still map controller
  items to `SelectItem`. Lumo adds honest async presentation, not a second hidden
  collection builder.
- Tree receives the async status rather than presentation copy because a status
  node inside `treegrid` would break its owned-child semantics. Copy belongs
  adjacent to the Tree in the caller.
- Virtualized async DataGrid/collection recipes and selection behavior across
  unmounted rows are still open and now have a separate roadmap item.
