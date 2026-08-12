# Review C — registry components 63–94

Reviewed exact commit `1ab37905ec488ba84f7ca17ebf023d44690a7f51` on 12 August 2026. This was a read-only adversarial review of source, tests, examples, and current official competitor documentation. `PROVED` means the checked-in source or a focused test establishes the claim. `SUSPECTED` means the API or implementation strongly suggests the issue, but the repository does not yet contain a reproducer.

Focused verification passed: `pnpm --filter @lumo-ui/ui exec vitest run src/table.test.tsx src/tabs.test.tsx src/collections-no-primitive.test.tsx src/controls.test.tsx src/virtual-list.test.tsx --maxWorkers=1` — 5 files, 95 tests.

## Executive findings

1. **PROVED — Tabs has two live broken public surfaces.** Function children and `items` are accepted but never rendered, and both `Tab.id` and `TabPanel.id` are optional even though Base UI values are required. The source itself admits both defects at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tabs.tsx:354` (“`accepted by the type and never invoked`”) and `:443` (“`Base UI declares Tab.value REQUIRED`”).
2. **PROVED — Table’s “two tab stops” brief item is stale, but the replacement is not accessible.** `ColumnResizer` now renders `tabIndex={-1}` at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/table.tsx:1521`–`:1529`; the test asserts one stop at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/table.test.tsx:696`–`:719`. The source simultaneously admits “`the handle can no longer be reached with the Tab key`” at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/table.tsx:1489`. This fixes the count by removing keyboard access, not by implementing grid inner navigation.
3. **PROVED — three collection-like controls fail their pre-hydration tab-stop contract when direct children are wrapped in a Fragment.** SegmentedControl, TagGroup and ToggleGroup select their first child using non-recursive `Children.toArray` at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/segmented-control.tsx:242`–`:250`, `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tag-group.tsx:320`–`:329`, and `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toggle-group.tsx:142`–`:148`. The repository already proves the relevant React behavior at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/list-box.test.tsx:72` (“`Children.toArray flattens arrays and NOT fragments`”). TagGroup’s contrary comment (“`it flattens fragments`”, `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tag-group.tsx:321`–`:323`) is false.
4. **PROVED — Toast still has no action surface.** `LumoToastContent` contains only title, description and tone at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toast.tsx:122`–`:127`; `Toast` renders title, description and close only at `:316`–`:387`. Telling copy-in consumers to edit the function is not parity with Radix/Ark action APIs.
5. **PROVED — VirtualList still cannot scroll imperatively.** The public props deliberately own the ref and say “`The answer is a scroll METHOD, which this component does not have yet`” at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/virtual-list.tsx:117`–`:126`.
6. **PROVED — several audit narratives are stale at HEAD.** `LumoProvider` now mounts `DirectionProvider` at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/provider.tsx:104`–`:108`, contradicting Rating, SegmentedControl, ToggleGroup and TagGroup headers that say it does not (for example `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/rating.tsx:68`–`:74`). Toggle’s `excludeFromTabOrder` comment says “`UNREACHABLE`” at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toggle.tsx:146`–`:152`, while the translator implements it at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toggle.tsx:226`–`:229`.

## Current official competitor surface

“None” means no direct component appears in that vendor’s current official component catalog; an adjacent primitive is named where it is the meaningful comparison. Catalogs checked: [shadcn/ui](https://ui.shadcn.com/docs/components), [ReUI](https://reui.io/docs/base-navigation-menu), [Radix Primitives](https://www.radix-ui.com/primitives/docs/components), [Ark UI](https://ark-ui.com/docs/overview/introduction), and [Mantine Core](https://mantine.dev/core/package/).

| Lumo component | shadcn/ui | ReUI | Radix | Ark UI | Mantine |
|---|---|---|---|---|---|
| Rating | None | [Rating](https://reui.io/docs/components/base/rating) | None | [Rating Group](https://ark-ui.com/docs/components/rating-group) | [Rating](https://mantine.dev/core/rating/) |
| Resizable | [Resizable](https://ui.shadcn.com/docs/components/radix/resizable) | [Resizable patterns](https://reui.io/patterns/resizable) | None | [Splitter](https://ark-ui.com/docs/components/splitter) | [Splitter](https://mantine.dev/core/splitter/) |
| ScrollArea | [Scroll Area](https://ui.shadcn.com/docs/components/radix/scroll-area) | shadcn-compatible Scroll Area; no separate ReUI primitive | [Scroll Area](https://www.radix-ui.com/primitives/docs/components/scroll-area) | [Scroll Area](https://ark-ui.com/docs/components/scroll-area) | [ScrollArea](https://mantine.dev/core/scroll-area/) |
| Scrollspy | None | [Scrollspy](https://reui.io/docs/components/radix/scrollspy) | None | None | [TableOfContents](https://mantine.dev/core/table-of-contents/) |
| SearchField | adjacent [Input Group](https://ui.shadcn.com/docs/components/input-group) | adjacent [Autocomplete](https://reui.io/docs/components/base/autocomplete) | None | adjacent [Combobox](https://ark-ui.com/docs/components/combobox) | adjacent [TextInput](https://mantine.dev/core/text-input/) |
| SegmentedControl | adjacent Toggle Group | no separate direct primitive | adjacent [Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group) | [Segment Group](https://ark-ui.com/docs/components/segment-group) | [SegmentedControl](https://mantine.dev/core/segmented-control/) |
| Select | [Select](https://ui.shadcn.com/docs/components/radix/select) | shadcn-compatible Select | [Select](https://www.radix-ui.com/primitives/docs/components/select) | [Select](https://ark-ui.com/docs/components/select) | [Select](https://mantine.dev/core/select/) |
| Separator | [Separator](https://ui.shadcn.com/docs/components/radix/separator) | shadcn-compatible Separator | [Separator](https://www.radix-ui.com/primitives/docs/components/separator) | [Separator](https://ark-ui.com/docs/components/separator) | [Divider](https://mantine.dev/core/divider/) |
| Sidebar | [Sidebar](https://ui.shadcn.com/docs/components/sidebar) | no direct primitive | None | None | adjacent [AppShell](https://mantine.dev/core/app-shell/) |
| SkeletonPresets | None | None | None | None | None (compose [Skeleton](https://mantine.dev/core/skeleton/)) |
| Skeleton | [Skeleton](https://ui.shadcn.com/docs/components/skeleton) | shadcn-compatible Skeleton | None | None | [Skeleton](https://mantine.dev/core/skeleton/) |
| Slider | [Slider](https://ui.shadcn.com/docs/components/radix/slider) | shadcn-compatible Slider | [Slider](https://www.radix-ui.com/primitives/docs/components/slider) | [Slider](https://ark-ui.com/docs/components/slider) | [Slider/RangeSlider](https://mantine.dev/core/slider/) |
| Sortable | None | [Sortable](https://reui.io/components/sortable) | None | None | None |
| Spinner | [Spinner](https://ui.shadcn.com/docs/components/spinner) | shadcn-compatible Spinner | None | None | [Loader](https://mantine.dev/core/loader/) |
| Stack | None | None | None | None | [Stack](https://mantine.dev/core/stack/) |
| Steps | None | [Stepper](https://reui.io/docs/components/base/stepper) | None | [Steps](https://ark-ui.com/docs/components/steps) | [Stepper](https://mantine.dev/core/stepper/) |
| Switch | [Switch](https://ui.shadcn.com/docs/components/radix/switch) | shadcn-compatible Switch | [Switch](https://www.radix-ui.com/primitives/docs/components/switch) | [Switch](https://ark-ui.com/docs/components/switch) | [Switch](https://mantine.dev/core/switch/) |
| Table | [Table/Data Table](https://ui.shadcn.com/docs/components/data-table) | [Data Grid](https://reui.io/docs/components/base/data-grid) | None | None | [Table](https://mantine.dev/core/table/) |
| Tabs | [Tabs](https://ui.shadcn.com/docs/components/radix/tabs) | shadcn-compatible Tabs | [Tabs](https://www.radix-ui.com/primitives/docs/components/tabs) | [Tabs](https://ark-ui.com/docs/components/tabs) | [Tabs](https://mantine.dev/core/tabs/) |
| TagGroup | None | None | None | adjacent [Tags Input](https://ark-ui.com/docs/components/tags-input) | adjacent [Pill.Group](https://mantine.dev/core/pill/) |
| Tag | adjacent [Badge](https://ui.shadcn.com/docs/components/badge) | adjacent Badge | None | adjacent Tags Input | [Pill](https://mantine.dev/core/pill/) |
| TextArea | [Textarea](https://ui.shadcn.com/docs/components/textarea) | shadcn-compatible Textarea | None | adjacent [Field](https://ark-ui.com/docs/components/field) | [Textarea](https://mantine.dev/core/textarea/) |
| TextField | adjacent [Input](https://ui.shadcn.com/docs/components/input) | adjacent Number Field/Input | None | adjacent Field | [TextInput](https://mantine.dev/core/text-input/) |
| TimeField | None | None | None | adjacent [Date Input](https://ark-ui.com/docs/components/date-input); no direct TimeField (the current [changelog](https://ark-ui.com/docs/overview/changelog) records its time API direction) | [TimePicker](https://mantine.dev/dates/time-picker/) |
| Timeline | None | [Timeline](https://reui.io/docs/components/base/timeline) | None | None | [Timeline](https://mantine.dev/core/timeline/) |
| Toast | [Toast/Sonner](https://ui.shadcn.com/docs/components/sonner) | shadcn-compatible Toast | [Toast](https://www.radix-ui.com/primitives/docs/components/toast) | [Toast](https://ark-ui.com/docs/components/toast) | [Notifications](https://mantine.dev/x/notifications/) |
| ToggleGroup | [Toggle Group](https://ui.shadcn.com/docs/components/radix/toggle-group) | shadcn-compatible Toggle Group | [Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group) | [Toggle Group](https://ark-ui.com/docs/components/toggle-group) | adjacent [SegmentedControl](https://mantine.dev/core/segmented-control/) |
| Toggle | [Toggle](https://ui.shadcn.com/docs/components/radix/toggle) | [Toggle](https://reui.io/components/toggle) | [Toggle](https://www.radix-ui.com/primitives/docs/components/toggle) | [Toggle](https://ark-ui.com/docs/components/toggle) | adjacent [ActionIcon](https://mantine.dev/core/action-icon/) |
| Toolbar | None | shadcn-compatible Toolbar | [Toolbar](https://www.radix-ui.com/primitives/docs/components/toolbar) | None | adjacent [Group](https://mantine.dev/core/group/) |
| Tooltip | [Tooltip](https://ui.shadcn.com/docs/components/radix/tooltip) | shadcn-compatible Tooltip | [Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip) | [Tooltip](https://ark-ui.com/docs/components/tooltip) | [Tooltip](https://mantine.dev/core/tooltip/) |
| Tree | None | None | None | [Tree View](https://ark-ui.com/docs/components/tree-view) | [Tree](https://mantine.dev/core/tree/) |
| VirtualList | None | None | None | no standalone list; Tree View exposes virtualization hooks | None |

## Component-by-component review

### 63. Rating

Competitors ship decimal/partial values and, in Ark and Mantine, half-value interaction and richer form control; ReUI documents decimal display and editable mode. That matters for marketplaces where half stars are valid input. Lumo’s interactive contract only exposes a numeric star position while fractional clipping is explicitly read-only: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/rating.tsx:205`–`:224` — “`Fractional values clip the fill`” is under `ReadOnlyRatingProps`. **SUSPECTED gap:** no half-step interactive rating. Lumo is better at forcing a group name, per-star localized names and a semantic `role="img"` read-only summary (`rating.tsx:205`–`:239`). **PROVED stale audit note:** its direction warning says “`LumoProvider does not mount one`” at `rating.tsx:68`–`:74`, contradicted by `provider.tsx:104`–`:108`.

### 64. Resizable

Shadcn’s panel implementation and Ark/Mantine splitters cover multi-panel layouts, controlled/persisted layouts and keyboard resize; Ark’s current splitter additionally accepts CSS-unit bounds and resize lifecycle callbacks. Lumo is a deliberately small two-pane uncontrolled splitter: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/resizable.tsx:113`–`:140` — only `defaultSize`, min/max and `onResize`. **PROVED defect:** invalid bounds are not rejected; `clamp` is `Math.min(max, Math.max(min, value))` at `:109`–`:111`, while the handle emits caller values directly as `aria-valuemin`/`aria-valuemax` at `:219`–`:222`, so `minSize={90} maxSize={10}` produces an invalid ARIA range. Lumo is better at required localized `aria-valuetext`, logical pane semantics, and explicit RTL physical-arrow behavior (`:181`–`:199`).

### 65. ScrollArea

Radix, Ark, shadcn and Mantine ship custom scrollbar parts, horizontal/both-axis examples and configurable presentation. Lumo intentionally ships the browser scrollbar: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/scroll-area.tsx:18`–`:29` — “`native wheel/touch/keyboard behaviour, native RTL`”. **PROVED trade, not defect:** no thumb/track API, visibility modes, hide delay or imperative viewport handle. That matters for product-specific scrollbar styling; it does not matter where native reliability/SSR is preferred. Lumo is better at first-byte behavior and requires a named, focusable region (`scroll-area.tsx:42`–`:50`, `:102`–`:108`).

### 66. Scrollspy

ReUI’s official API has `targetRef`, `onUpdate`, per-link/global offsets, smooth scrolling and history; Mantine’s TableOfContents likewise targets a scroll container. Lumo exposes only items and `topOffset` (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/scrollspy.tsx:94`–`:112`) and hard-codes `document.getElementById` plus window scroll state (`:122`–`:178`). **PROVED gap:** it cannot observe a nested scroll container or report active changes. This matters inside dialogs/settings panes. Lumo is better at progressively enhanced real `href="#id"` links and `aria-current="location"` rather than button-only navigation (`scrollspy.tsx:180`–`:190`).

### 67. SearchField

There is no exact primitive in the five catalogs; competitors compose Input/InputGroup or Combobox, generally gaining addon slots and async filtering but not Lumo’s semantic search contract. **PROVED first-byte defect:** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/search-field.tsx:85`–`:101` says a server-rendered default value serves its clear button hidden until hydration because Base UI cannot seed `filled`. That matters on slow/no-JS paths. Lumo is better at required visible `label`, required localized `clearLabel`, Escape-to-clear, and translated validation (`search-field.tsx:115`–`:164`, `:185`–`:216`).

### 68. SegmentedControl

Ark and Mantine ship direct segmented/radio-backed controls; Mantine additionally documents generic primitive values, read-only state and indicator transitions. **PROVED defect:** fallback tab-stop discovery is shallow at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/segmented-control.tsx:242`–`:250`; a Fragment first child has no `id`, so an unselected group serves no tab stop pre-hydration. Lumo is better at a required group name and explicit selection semantics. **PROVED stale comment:** the direction warning at `segmented-control.tsx:63`–`:71` predates the provider fix.

### 69. Select

All five ecosystems have a direct Select except that ReUI uses the shadcn-compatible implementation. Ark additionally documents grouped, async and virtualized selects. Lumo has controlled opening/selection, form name and static JSX children, but its public surface at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/select.tsx:375`–`:451` has no `validate`; **PROVED gap:** error display is external-only while TextField can execute validation. It also deliberately rejects dynamic `items` via an `undefined` type carrier (`:413`–`:448`), so large/async collections need another component. Lumo is better at a required placeholder and server-rendered description/error IDREF wiring.

### 70. Separator

Shadcn, ReUI, Radix and Ark ship Separator; Mantine’s Divider is the direct visual counterpart. **PROVED defect:** Lumo inherits `role` and `aria-orientation` because they are not omitted at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/separator.tsx:75`–`:87`, then spreads props after owned semantics at `:98`–`:109`. A caller can therefore render `orientation="vertical" role="presentation"` or overwrite `aria-orientation`, contradicting the visual branch. Lumo is otherwise better at a native `<hr>` for horizontal output and a real vertical separator without client code.

### 71. Sidebar

Shadcn’s official Sidebar includes mobile Sheet behavior, viewport detection and cookie persistence; Mantine AppShell covers responsive navigation layout. Lumo explicitly declines those capabilities at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/sidebar.tsx:55`–`:65`. **PROVED product gap, deliberate:** no built-in responsive overlay/persistence. **PROVED footgun:** the source admits collapsed mode “`PRESUMES ICONS`” and an item without one has “`no visible box`” (`sidebar.tsx:67`–`:74`), but the type cannot enforce it. Lumo is better at logical-side-only design, controlled persistence hooks, and preserving accessible item names while collapsed.

### 72. SkeletonPresets

No reviewed vendor has a comparable preset family; competitors expect composition from a base Skeleton. Lumo’s deterministic text/avatar/card/form/table presets are genuinely useful for SSR: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/skeleton-presets.tsx:40`–`:43` — widths are “`DETERMINISTIC`”, never random. **PROVED defect:** every preset inherits ordinary div ARIA props and spreads them after `aria-hidden="true"`; the first occurrence is `:46`–`:60`. Consumers can accidentally expose meaningless loading bars to assistive technology. This matters because the preset contract specifically claims decoration.

### 73. Skeleton

Shadcn/ReUI/Mantine ship direct Skeletons; Radix and Ark do not. **PROVED defect:** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/skeleton.tsx:59`–`:70` inherits `aria-hidden` and spreads props after `aria-hidden="true"`, so `aria-hidden={false}` defeats the component’s semantic contract. Lumo is better at server-only markup and named shape variants, but it should own/omit this prop.

### 74. Slider

All five competitors ship a direct Slider; Radix/Ark/Mantine support multiple thumbs/ranges, and Mantine documents marks, restricted marks, decimal domains and vertical range sliders. Lumo explicitly has no range slider at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/slider.tsx:85`–`:91`; **PROVED capability gap** for price/date ranges. Lumo is better at using the exact same locale formatter for visible output and `aria-valuetext` (`slider.tsx:245`–`:250`, `:343`–`:348`). **SUSPECTED prop leak:** `isRequired` is called unreachable in `:269`–`:272` but is not destructured in `:256`–`:274`, leaving it in `...rest` sent to Base UI rather than translated or removed.

### 75. Sortable

ReUI’s direct Sortable showcases vertical, grid and nested patterns plus drag overlays; the other catalogs have no direct primitive. Lumo only exposes one list, one axis and full-list `onReorder` (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/sortable.tsx:169`–`:190`). **PROVED capability gap:** no grid, cross-list/nested transfer, drag overlay or sensors API. This matters for kanban/grid builders, less for settings-list reordering. Lumo is better at required localized live-region strings and position formatting (`sortable.tsx:150`–`:167`), cancel restoration, and shared pointer/keyboard focus recovery.

### 76. Spinner

Shadcn/ReUI and Mantine Loader are the direct competitors; Radix/Ark have none. Lumo forces the important semantic that most visual loaders leave optional: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/spinner.tsx:91`–`:113` requires a localized label, and `:125`–`:142` renders `role="status"` with visually hidden or visible copy. **No proved defect found.** Competitors ship more visual loader types/custom SVG choices; that is cosmetic, while Lumo’s mandatory status name materially improves accessibility.

### 77. Stack

Mantine Stack is the only direct counterpart and adds responsive style props, alignment/justify controls and full system composition. Lumo’s closed `BoxTag` union is intentionally simple (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/stack.tsx:45`–`:70`). **SUSPECTED type gap:** the runtime permits `tag="form"`, but each primitive casts a div prop bag (`stack.tsx:309`–`:321` shows the pattern), so element-specific form attributes are not accurately modeled. Lumo is better at server rendering, logical row behavior and avoiding `asChild`/ref ambiguity.

### 78. Steps

ReUI, Ark and Mantine ship interactive steppers; Ark’s current Steps includes validation/skippable-state support, while shadcn/Radix have no direct component. Lumo is intentionally a server-rendered progress nav. **PROVED defect:** `current` is documented as 1-based at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/steps.tsx:201`–`:207`, but status calculation at `:244`–`:254` neither clamps nor rejects 0/out-of-range values, producing no `aria-current="step"`. Existing focused tests only exercise a valid current value, so the invariant is unguarded. Lumo is better at required localized status phrases and formatted positions without hydration.

### 79. Switch

All five ecosystems ship a direct Switch. Mantine adds on/off labels and icons; Ark/Radix expose composable hidden-input/form anatomy. Lumo now translates `validate` correctly: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/switch.tsx:276`–`:323` maps valid `true` to Base UI `null`. **PROVED gaps:** `validationBehavior`, `autoFocus`, `excludeFromTabOrder` and focus-change props are accepted but destructured without translation at `:286`–`:303`. Lumo is better at required label/description/error wiring and preventing engine-owned English validation prose.

### 80. Table

Shadcn Data Table and ReUI Data Grid add column visibility, pinning/moving/dragging, expandable/subgrid rows, infinite loading and CRUD patterns; Mantine adds a simpler native Table plus virtualization examples. Lumo is unusually strong in localized grid semantics, selection, sorting and first-byte roving focus. **PROVED accessibility defect:** keyboard column resizing is absent and the resize button is deliberately removed from sequential focus (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/table.tsx:1460`–`:1500`, `:1521`–`:1529`). **PROVED brief correction:** current tests assert exactly one stop, not two (`table.test.tsx:696`–`:719`). Material fix: implement ARIA grid inner-navigation/F2 and keyboard resize; do not merely restore a second Tab stop.

### 81. Tabs

Shadcn/ReUI, Radix, Ark and Mantine all ship direct Tabs. Radix requires matching `value` on Trigger and Content and supports automatic/manual activation; Ark/Mantine add indicator and activation options. **PROVED defects:** Lumo accepts `items` and function children but discards `items` and passes the function through (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tabs.tsx:354`–`:389`), and optional IDs reach required Base UI values as undefined (`tabs.tsx:393`–`:451`, `:493`–`:530`). Root-level `isDisabled`, `keyboardActivation` and `disabledKeys` are also accepted and dropped (`tabs.tsx:291`–`:309`). These matter: they compile and silently fail. Lumo is better at required tab-list naming, SSR-selected tab derivation and server IDREF wiring. Current tests do not cover function children or omitted IDs.

### 82. TagGroup

There is no exact direct counterpart; Ark Tags Input and Mantine Pill.Group are adjacent but primarily input/display APIs. **PROVED defect:** TagGroup says `Children.toArray` “`flattens fragments`” and uses it shallowly at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tag-group.tsx:320`–`:329`; React does not, so Fragment-wrapped toolbar tags lose the served tab stop. Lumo is better at a static semantic `<ul>` outside toolbars, required localized removal-status strings and a deliberate toolbar mode.

### 83. Tag

Shadcn/ReUI Badge and Mantine Pill are adjacent; no reviewed headless vendor has an exact removable display tag. Lumo’s discriminated union requires `removeLabel` whenever `onRemove` exists, proved by `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tag.tsx:87`–`:100`; that is better than optional icon naming, and its logical margins/expanded hit target are thoughtful (`:105`–`:126`). **PROVED capability gap:** the closed props expose no standard DOM attributes/ref/id on the root, limiting analytics, testing and composition. It matters in app code even though basic chip rendering is sound.

### 84. TextArea

Shadcn/ReUI and Mantine have direct Textareas; Ark Field is adjacent and Radix has none. Lumo now executes consumer validation at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/text-area.tsx:90`–`:126`, a strength alongside required label and first-byte help/error wiring. **PROVED gap:** `validationBehavior` and `excludeFromTabOrder` remain accepted but unreachable (`text-area.tsx:101`–`:106`). This matters in composite widgets and callers migrating from React Aria; silent compilation is worse than rejecting unsupported props.

### 85. TextField

Shadcn Input/ReUI input patterns, Ark Field and Mantine TextInput cover the adjacent/direct surface; Radix has no text-field primitive. Lumo is better at making label a constructor requirement and maps validation results to Base UI (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/text-field.tsx:97`–`:116`, `:145`–`:163`). **PROVED gap:** `validationBehavior` and `excludeFromTabOrder` are explicitly “`ACCEPTED AND UNREACHABLE`” at `text-field.tsx:87`–`:95` and destructured at `:139`–`:143`. Competitors expose broader addon/section/style APIs; those are useful but less important than fixing silent inert props.

### 86. TimeField

Mantine TimePicker is the only current direct counterpart and supports min/max, per-unit steps, dropdown presets and 12/24-hour modes; Ark’s current changelog documents the newer Date Input/formatting direction rather than a direct TimeField. **PROVED capability gap:** Lumo deliberately rejects `minValue`/`maxValue` and has no validation engine (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/time-field.tsx:62`–`:70`); its props also lack form name/required/step at `:74`–`:100`. Bounds matter for booking/business-hour input. Lumo is better at locale-derived hour cycles, localized day periods and segment labels without built-in English error strings.

### 87. Timeline

ReUI and Mantine ship direct timelines; ReUI includes controlled active step and horizontal/vertical orientation, Mantine includes bullet sizing, line variants and active state. **PROVED footgun:** each Lumo item defaults `isLast=false`, and only that caller-owned flag suppresses the final rail (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/timeline.tsx:146`–`:180`). Omitting it draws a dangling connector; the parent could derive last-child position as Steps already does. Lumo is better at semantic ordered-list structure and separate title/description/time primitives.

### 88. Toast

Radix supplies a first-class `Toast.Action` with required alternative text; Ark’s anatomy/store includes ActionTrigger, duration, placement, pause/hotkey and queue controls; shadcn now recommends Sonner; Mantine Notifications has update/auto-close/loading actions. **PROVED missing feature:** Lumo’s payload and renderer have no action slot (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toast.tsx:122`–`:127`, `:308`–`:387`). This matters for Undo/Retry, not just customization. **PROVED inert prop:** required `ToastRegion.locale` is documented “`NOW INERT`” at `toast.tsx:391`–`:402`. Lumo is better at no default timeout, required localized region/close labels, logical placement and node-typed content.

### 89. ToggleGroup

Shadcn/ReUI, Radix and Ark ship direct Toggle Groups; Mantine SegmentedControl is the closest exclusive-selection counterpart. **PROVED data defect:** numeric keys are stringified and returned as strings (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toggle-group.tsx:107`–`:116`), violating lossless `Key` round trips. **PROVED SSR defect:** shallow first-child discovery at `:142`–`:148` fails for Fragment children. Lumo is better at explicit single/multiple selection-mode typing and first-byte roving intent, but these two defects undermine it.

### 90. Toggle

Shadcn/ReUI, Radix and Ark have direct Toggle primitives; Mantine ActionIcon is adjacent. Lumo supports controlled/uncontrolled pressed state and maps `excludeFromTabOrder` to `tabIndex=-1` (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toggle.tsx:220`–`:229`). **PROVED stale comment:** the prop is nevertheless documented “`ACCEPTED AND UNREACHABLE`” at `toggle.tsx:146`–`:152`. **PROVED real gaps:** press-start/end/up/change, hover-change and focus-change callbacks are destructured and discarded at `:209`–`:219`. Lumo is better at the IconToggle naming contract and localized semantic labels.

### 91. Toolbar

Radix has the canonical direct Toolbar and ReUI uses the shadcn-compatible wrapper; the other catalogs have only adjacent layout primitives. **PROVED composition gap:** bare focusable descendants still render but are excluded from arrow-key navigation unless wrapped as `ToolbarItem`; the measured behavior is documented at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/toolbar.tsx:45`–`:68`. This matters because arbitrary buttons look correct while silently losing the toolbar’s defining behavior. `slot` and `style` are also accepted/dropped at `toolbar.tsx:250`–`:260`. Lumo is better at a required toolbar name and a pre-hydration served tab stop for registered items.

### 92. Tooltip

All five ecosystems have direct Tooltip components. Radix/Ark/Mantine expose delay, collision/boundary, portal and controlled-open options. **PROVED gap:** Lumo accepts but discards entering/exiting state, triggerRef, flip, boundary padding/offset, portal container and style (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tooltip.tsx:247`–`:262`). This matters in clipped dialogs, shadow roots and custom portals. Lumo is better at logical placement vocabulary and explicit server IDREF naming.

### 93. Tree

Ark Tree View and Mantine Tree are substantially richer: async/lazy loading, filtering, checkbox selection, mutation, links and virtualized navigation; Ark exposes `scrollToIndexFn` specifically for virtual trees. **PROVED major API defect:** Lumo keeps dynamic `items` and dependencies in the type but ignores them at runtime (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tree.tsx:263`–`:287`, `:670`–`:690`). `selectedKeys="all"` also cannot toggle out (`tree.tsx:785`–`:792`). These matter for any nontrivial data-backed tree. Lumo is better at static first-byte treegrid semantics, localized/Persian typeahead work, required labeling and true corpus position metadata.

### 94. VirtualList

None of the five catalogs ships a standalone direct VirtualList; Ark’s Tree View is the nearest official virtualized composite and exposes a scroll-to-index hook. Lumo’s implementation has excellent SSR and accessibility choices: required `initialSize` prevents an empty server list (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/virtual-list.tsx:73`–`:87`) and every row gets true `aria-setsize`/`aria-posinset` (`:57`–`:69`). **PROVED missing feature:** the root ref is owned and no imperative scrolling method exists (`virtual-list.tsx:117`–`:177`); the only ref is internal (`:184`–`:202`). This materially blocks search-result jumps, restored positions and “scroll to selected”.

## Cross-cutting audit and test issues

- **PROVED — Fragment coverage is inconsistent.** ListBox has a dedicated regression proving Fragments are not flattened (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/list-box.test.tsx:72`–`:77`), while TagGroup, SegmentedControl and ToggleGroup repeat the shallow pattern without equivalent coverage. These are not merely missing tests; one source comment asserts the opposite React behavior.
- **PROVED — some tests lock a compromised invariant.** Table’s test correctly proves one tab stop (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/table.test.tsx:696`–`:719`) but does not prove that a keyboard user can reach or operate the resizer. A green count is therefore not accessibility parity.
- **PROVED — Tabs tests are incomplete at the exact frozen-API seams.** The implementation admits the function-child and optional-ID failures (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/tabs.tsx:354`–`:356`, `:443`–`:451`), yet the passing focused suite contains no omitted-ID/function-child case.
- **PROVED — comments and review brief can become false after fixes.** The provider implementation now supplies direction (`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/provider.tsx:104`–`:108`) while four component headers still say otherwise; the brief’s Table count is likewise from a prior commit. Audit tooling that scans comment phrases or historical measurements without rerunning behavior will report false positives.
- **PROVED — accepted-but-inert surfaces evade ordinary prop-name gates.** Tree (`tree.tsx:680`–`:690`), Tabs (`tabs.tsx:298`–`:309`, `:378`–`:381`), Toolbar (`toolbar.tsx:254`–`:260`) and Tooltip (`tooltip.tsx:253`–`:261`) explicitly destructure unsupported props, so a name-presence audit can pass while runtime behavior is absent.
- **Calendar/today, checked because the brief called it out but outside components 63–94:** the issue remains. `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/calendar.tsx:205`–`:212` says DayPicker still defaults `today` from the clock and “`a today prop ... is a separate change ... not made here`”.

## Recommended priority

1. Make `Tab.id`/`TabPanel.id` required; reject or implement dynamic TabList children/items.
2. Add keyboard-operable Table column resizing through grid inner-navigation, preserving the one-stop contract.
3. Add a typed Toast action payload/render slot with an accessible alternative label.
4. Add a VirtualList imperative handle (`scrollToIndex`, optionally `scrollToOffset`).
5. Replace shallow first-child discovery with recursive Fragment-aware traversal in SegmentedControl, TagGroup and ToggleGroup, with SSR regression tests.
6. Reject impossible bounds in Resizable and Steps; own semantic ARIA props in Separator/Skeletons.
7. Remove or implement every accepted-but-inert prop, then update stale source narratives and audit fixtures against exact HEAD behavior.

## Declined findings

The competitor comparison is not a checklist that Lumo must clone. I did **not** classify a missing feature as a defect when the narrower contract is explicit, internally consistent and preserves the component’s promised use case. In particular:

- ScrollArea’s lack of a custom JavaScript thumb is a deliberate native/SSR/RTL trade, not a defect; the local source explicitly chooses “`native wheel/touch/keyboard behaviour, native RTL`” at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/scroll-area.tsx:20`–`:29`.
- Sidebar’s lack of built-in cookie persistence and mobile Sheet behavior is an architectural split, not inherently a defect; the source delegates persistence to `onCollapsedChange` and mobile overlay to Drawer at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/sidebar.tsx:55`–`:65`. The separately identified iconless-collapsed-item footgun remains a finding because the public type permits a state the source admits becomes invisible.
- Slider’s lack of a range mode, Sortable’s lack of grid/cross-list transfer, and TimeField’s lack of bounds are capability gaps, not correctness bugs in their documented single-value/list/time contracts. They become product blockers only when a consuming use case requires those capabilities. The report labels them accordingly rather than inflating them into defects.
- Lumo’s closed composition surfaces and required localized labels often provide less flexibility than competitors but stronger first-byte accessibility guarantees. I treated required naming, deterministic SSR output, logical CSS, localized value text and explicit IDREF wiring as Lumo advantages, not as incidental implementation detail.
- Conversely, “copy the component and edit it” does not excuse a public API that compiles but silently does nothing. Tabs function children/optional IDs, Tree dynamic items, and Toast actions remain findings because they either break an accepted contract or omit a common semantic operation that the local docs themselves discuss.
