# APG keyboard audit — what each family owns, what is proved, what is not

Generated 15 Aug 2026 from `packages/ui/src` by `scripts/apg-matrix.mjs` + `scripts/apg-doc.mjs` (owned = key literal handled in the family's own source; proved = a test that imports the family DIRECTLY presses the key). Regenerate rather than hand-edit the table. An owned-but-unproved key is a hole; an engine key nobody pins is a missing tripwire (rubric G1).

| Family | Engine-provided (per APG) | Lumo-owned keys | Proved by a direct test | Holes (owned, unproved) | Direct tests |
|---|---|---|---|---|---:|
| menu | Arrows, Home/End, typeahead, Escape, Enter/Space | — | Escape, ArrowDown, Tab | — | 9 |
| select | Arrows, Home/End, typeahead, Escape, Enter/Space | — | ArrowDown, Tab | — | 7 |
| combobox | Arrows, Home/End, Escape, Enter | — | ArrowDown, Tab | — | 5 |
| multi-select | Arrows, Escape, Enter, Backspace on chips | — | ArrowDown, Enter | — | 2 |
| autocomplete | Arrows, Escape, Enter | — | ArrowDown | — | 3 |
| list-box | — | Home, End, PageUp, PageDown, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Enter, Space | Home, End, PageUp, PageDown, Enter, Backspace, ArrowLeft, ArrowRight, ArrowDown, Space | **ArrowUp** | 5 |
| tabs | Arrows (orientation-aware), Home/End | — | Tab, ArrowRight | — | 5 |
| tree | — | Home, End, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Enter, Space | ArrowLeft, ArrowRight, ArrowDown, Space | **Home, End, ArrowUp, Enter** | 2 |
| tree-select | — | Home, End, ArrowUp, ArrowDown | ArrowDown, Escape, Enter | **Home, End, ArrowUp** | 3 |
| cascader | — | Home, End, ArrowLeft, ArrowRight, ArrowUp, ArrowDown | ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Escape, Enter | **Home, End** | 3 |
| table | — | Home, End, ArrowLeft, ArrowRight, Escape, Enter, Space | ArrowLeft, Escape, Enter, Home, End, PageUp, PageDown, ArrowRight, ArrowDown, Space | — | 4 |
| data-grid | — | Escape, Enter | ArrowLeft, Escape, Enter | — | 1 |
| slider | Arrows, Home/End, PageUp/PageDown | — | Tab | — | 4 |
| range-slider | Arrows, Home/End, PageUp/PageDown per thumb | — | ArrowDown, Enter | — | 2 |
| dialog | Escape, focus trap, Tab cycle | — | Escape, ArrowDown, Tab | — | 8 |
| alert-dialog | Escape, focus trap | — | ArrowDown | — | 3 |
| drawer | Escape, focus trap | — | Escape, ArrowDown, Tab | — | 5 |
| popover | Escape, Tab out | — | Escape, ArrowDown, Tab | — | 4 |
| tooltip | Escape | — | ArrowDown, Tab | — | 3 |
| disclosure | Enter/Space | — | — | — | 3 |
| toolbar | Arrows, Home/End (roving) | — | — | — | 4 |
| toggle-group | Arrows (roving), Space | — | — | — | 4 |
| radio-group | Arrows (roving), Space | — | Escape, Tab | — | 2 |
| checkbox | Space | — | Tab | — | 4 |
| switch | Space | — | Tab | — | 3 |
| menubar | Arrows across menus, Home/End | — | ArrowDown | — | 3 |
| navigation-menu | Arrows, Escape | — | ArrowDown | — | 3 |
| context-menu | Shift+F10 / ContextMenu (Lumo), then Menu keys | — | Escape, ArrowDown | — | 2 |
| tag-group | Arrows, Home/End, Delete/Backspace | — | ArrowRight | — | 3 |
| tags-input | — | ArrowUp, ArrowDown, Escape, Enter, Backspace | Home, End, PageUp, PageDown, Enter, Backspace, ArrowDown | **ArrowUp, Escape** | 2 |
| carousel | — | ArrowLeft, ArrowRight | — | **ArrowLeft, ArrowRight** | 0 |
| kanban | — | ArrowLeft, ArrowRight, Escape, Enter, Space | ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Escape, Space | **Enter** | 2 |
| sortable | — | ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Escape, Enter, Space | ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Escape, Space | **Enter** | 3 |
| resizable | — | Home, End, ArrowLeft, ArrowRight, ArrowUp, ArrowDown | Home, End, ArrowLeft, ArrowRight, ArrowUp, ArrowDown | — | 2 |
| date-input | — | Home, End, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Delete, Backspace | — | **Home, End, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Delete, Backspace** | 0 |
| date-field | — | Space | Home, End, PageUp, PageDown, Enter, Backspace, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Escape | **Space** | 3 |
| date-picker | — | Space | ArrowUp, ArrowDown, Escape | **Space** | 2 |
| calendar | Arrows, Home/End, PageUp/PageDown (react-day-picker) | Space | ArrowUp, ArrowDown, Escape | **Space** | 1 |
| range-calendar | as calendar | — | ArrowUp, ArrowDown, Escape | — | 2 |
| event-calendar | — | Home, End, PageUp, PageDown, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Enter, Delete, Space | Home, PageDown, ArrowLeft, ArrowDown, Delete | **End, PageUp, ArrowRight, ArrowUp, Enter, Space** | 1 |
| gantt | — | ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Escape, Enter, Tab, Space | ArrowLeft, ArrowRight, Escape, Tab, Space | **ArrowUp, ArrowDown, Enter** | 1 |
| virtual-list | host list semantics; Lumo owns scroll math | — | — | — | 2 |
| transfer-list | ListBox keys inside | — | — | — | 2 |
| number-field | Arrows, Home/End, PageUp/PageDown | — | Tab | — | 5 |
| segmented-control | Arrows (roving) | — | — | — | 2 |
| steps | Tab between steps | — | — | — | 2 |
| pagination | Tab between buttons | — | — | — | 3 |
| breadcrumbs | Tab between links | — | — | — | 2 |
| command | Arrows, Enter, Escape | — | ArrowDown | — | 3 |
| search-field | — | Escape, Enter | Home, End, PageUp, PageDown, Enter, Backspace, Escape, Tab | — | 2 |
| input-otp | single input; native editing | — | — | — | 2 |
| file-upload | Enter/Space on the drop zone | — | ArrowRight | — | 2 |
| rating | Arrows (radio group) | — | — | — | 1 |

## Deviations and decisions

- **ListBox PageUp/PageDown** are clamped to the first/last option (fixed 15 Aug 2026 — near the ends they were a no-op). Page size = viewport ÷ option height; 10 in jsdom.
- **Home/End are never mirrored** in any family: first/last in reading order under both directions (`list-box.test.tsx`, `date-input`).
- **Horizontal arrows are mirrored** wherever Lumo owns them (list-box, tree, sortable, kanban, resizable, carousel, date-input, event-calendar, gantt): the *forward* key is ArrowLeft under `fa-IR`; each has a behavioural mutation operator that un-mirrors it and dies.
- **Engine keys are pinned as tripwires** in `apg-engine-keys.test.tsx`: Menu Home/End, Select Home/End, Tabs Home/End, Slider Home/End/PageUp/PageDown, Toolbar arrows (mirrored under fa-IR), ToggleButtonGroup arrows, RadioGroup arrows — asserted through Lumo's public API so a Base UI minor cannot silently drop one. **Engine deviation:** Base UI 1.7.0's Toolbar composite does not handle Home/End (APG lists them); typeahead on Menu/Select and Menubar/TagGroup keys are still unpinned.
- **Still unproved (owned):** date-input Delete; event-calendar End/PageUp/ArrowRight/ArrowUp/Enter/Space; gantt ArrowUp/ArrowDown/Enter; kanban Enter; tree Home/End/ArrowUp/Enter; tree-select Home/End/ArrowUp; cascader Home/End; tags-input ArrowUp/Escape; carousel ArrowLeft/ArrowRight (covered indirectly by its mutation operator's killing test, not by a direct key test). Listed so the table is not read as complete.
