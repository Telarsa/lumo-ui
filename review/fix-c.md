# Fix C — components 63–94

Implementation was performed test-first against the public React/type/rendered-DOM seams. No commit or push was made.

## Red → green record

| Contract | Initial red evidence | Green result |
|---|---|---|
| Resizable bounds | `expected function to throw an error` for `minSize=90`, `maxSize=10` | Invalid inverted bounds now throw `RangeError`; focused suite 9/9. |
| Fragment-aware composite defaults | SegmentedControl, TagGroup and ToggleGroup each served zero `tabindex="0"` controls for Fragment children | Recursive Fragment traversal supplies exactly one first-byte stop. |
| ToggleGroup key identity | callback returned `["3"]` for numeric key `3` | Serialized engine keys map losslessly back to the original `Key`; collisions throw. |
| Separator/Skeleton semantic ownership | spoofed `role`, `aria-orientation`, or `aria-hidden={false}` won | Owned props are omitted from the public type and authored after consumer props. All Skeleton presets share the fix. |
| Sidebar collapsed contract | `@ts-expect-error` was unused for an iconless item | `SidebarItem.icon` is required, making the collapsed-mode invariant compile-time enforceable. |
| Steps bounds | `current={0}` did not throw | Zero, non-integer, and values beyond the explicit `items.length + 1` completed state throw `RangeError`; the documented completed sequence remains representable. |
| Timeline last item | final item without `isLast` rendered a dangling rail | `Timeline` derives the final direct item and suppresses its rail. |
| Toast locale/action | RTL locale emitted no `dir`; queued action produced no button | Region direction derives from locale; action payload renders an operable Base UI action and invokes its callback. |
| SearchField first byte | a default value served its clear button hidden | initial visibility is derived during render from controlled/default input state. |
| TextField/TextArea/SearchField/Switch inert props | `excludeFromTabOrder` left controls at tab index 0; unsupported validation/focus props compiled | supported focus props translate to `tabIndex=-1`; unsupported surface is no longer accepted. |
| Tabs collection/IDs/root state | function child emitted no tabs; root-disabled key stayed enabled | items/function children materialize, tab/panel IDs are required, and disabled keys/root disability/manual activation reach the engine. |
| Table keyboard resize | F2 left focus on the column header | F2 enters the owned resizer, arrows/Home/End resize within bounds, Escape returns focus; ARIA values and owned table semantics cannot be spoofed. |
| Tree collection contracts | function-child collection rendered no rows; toggling from `selectedKeys="all"` emitted no change | dynamic items render and `"all"` converts to concrete remaining keys on toggle. `dependencies` is unrepresentable rather than leaking to DOM. |
| VirtualList imperative contract | `VirtualListHandle`/`scrollToIndex` did not exist | ref exposes `scrollToIndex` and `scrollToOffset` without replacing the virtualizer-owned DOM ref, including logical RTL offsets. |
| Enhanced inert/owned-prop gate | initially reported Toggle, Tooltip, Tree and six Table owned/inert surfaces | unsupported Toggle/Tooltip/Toolbar props are unrepresentable and Table semantic fields are owned; gate is clean. |

## Verification

- `pnpm exec vitest run src/resizable.test.tsx src/controls.test.tsx src/collections-no-primitive.test.tsx src/toggle.test.tsx src/form-family.test.tsx src/skeleton.test.tsx src/sidebar.test.tsx src/state-vocabulary.test.tsx src/table.test.tsx src/tabs.test.tsx src/timeline.test.tsx src/toast.test.tsx src/tree.test.tsx src/virtual-list.test.tsx` — **13 files, 379 tests passed**.
- `pnpm --filter @lumo-ui/ui typecheck` — **passed** (`tsc --noEmit`).
- `pnpm run gate:props` — **passed**, 124 component files graded, zero inert-prop and zero root-contract violations.

An earlier workspace-wide invocation, `pnpm --filter @lumo-ui/ui test -- virtual-list.test.tsx`, did not filter as expected, entered the entire suite, and was interrupted after an unrelated `date-selector.test.tsx` failure. The direct focused command `pnpm exec vitest run src/virtual-list.test.tsx` passed 13/13.

## Deliberately deferred or declined

- Scrollspy nested-container observation and `onUpdate` are real capability gaps, but adding a second scroll/observer ownership model was outside the capped correctness tranche and was not started.
- Select executable validation is a consistency/capability gap; its documented external `errorMessage`/`isInvalid` contract remains intact. It was not changed after the integration cap.
- Slider range mode and TimeField min/max/form/step support are explicitly declined competitor breadth, not regressions in their documented single-value/time contracts. Slider's `isRequired` note was a suspected leak rather than a proved failure and was not expanded after the cap.
- Sidebar responsive overlay/persistence, Sortable grid/cross-list transfer, Tag root DOM breadth, Stack polymorphic typing, Rating half-step input, and custom ScrollArea parts remain the review's deliberate product-breadth findings, not correctness defects.
- Toolbar still requires `ToolbarItem` for composite membership. That explicit composition rule is tested and documented; making arbitrary descendants register would require a new discovery/registry design. The proved inert root `slot`/`style` surface was removed.
- Tooltip collision tuning, transition state, external trigger refs and custom portal containers were accepted-but-inert. They were removed from the public type rather than falsely claimed as supported; adding them remains optional breadth.
- The public barrel must export `VirtualListHandle` beside `VirtualListProps`. `packages/ui/src/index.ts` was outside this slice's permitted edit scope; the parent was asked to make that shared change during integration.

Missing competitor features are not automatically defects. They become defects when Lumo accepts a prop and silently ignores it, violates its own documented invariant, emits incorrect semantics, or omits a material contract explicitly in scope (Toast action and VirtualList scrolling here). Broader anatomy, styling, and product workflows remain conscious scope decisions unless a consuming requirement adopts them.
