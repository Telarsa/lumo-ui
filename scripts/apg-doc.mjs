#!/usr/bin/env node
/** Renders docs/apg.md from the JSON that scripts/apg-matrix.mjs prints. */
import fs from "node:fs";
const [, , input, output] = process.argv;
if (!input || !output) throw new Error("usage: apg-doc.mjs <matrix.json> <docs/apg.md>");
/** @type {Array<{ f: string; own: string[]; tested: string[]; n: number }>} */
const rows=JSON.parse(fs.readFileSync(input,"utf8"));
/** @type {Record<string, string>} */
const E={"menu":"Arrows, Home/End, typeahead, Escape, Enter/Space","select":"Arrows, Home/End, typeahead, Escape, Enter/Space","combobox":"Arrows, Home/End, Escape, Enter","multi-select":"Arrows, Escape, Enter, Backspace on chips","autocomplete":"Arrows, Escape, Enter","tabs":"Arrows (orientation-aware), Home/End","slider":"Arrows, Home/End, PageUp/PageDown","range-slider":"Arrows, Home/End, PageUp/PageDown per thumb","dialog":"Escape, focus trap, Tab cycle","alert-dialog":"Escape, focus trap","drawer":"Escape, focus trap","popover":"Escape, Tab out","tooltip":"Escape","disclosure":"Enter/Space","toolbar":"Arrows, Home/End (roving)","toggle-group":"Arrows (roving), Space","radio-group":"Arrows (roving), Space","checkbox":"Space","switch":"Space","menubar":"Arrows across menus, Home/End","navigation-menu":"Arrows, Escape","context-menu":"Shift+F10 / ContextMenu (Lumo), then Menu keys","tag-group":"Arrows, Home/End, Delete/Backspace","calendar":"Arrows, Home/End, PageUp/PageDown (react-day-picker)","range-calendar":"as calendar","number-field":"Arrows, Home/End, PageUp/PageDown","segmented-control":"Arrows (roving)","command":"Arrows, Enter, Escape","input-otp":"single input; native editing","file-upload":"Enter/Space on the drop zone","rating":"Arrows (radio group)","pagination":"Tab between buttons","breadcrumbs":"Tab between links","steps":"Tab between steps","virtual-list":"host list semantics; Lumo owns scroll math","transfer-list":"ListBox keys inside"};
const L=[];
L.push("# APG keyboard audit — what each family owns, what is proved, what is not","");
L.push("Generated 15 Aug 2026 from `packages/ui/src` by `scripts/apg-matrix.mjs` + `scripts/apg-doc.mjs` (owned = key literal handled in the family's own source; proved = a test that imports the family DIRECTLY presses the key). Regenerate rather than hand-edit the table. An owned-but-unproved key is a hole; an engine key nobody pins is a missing tripwire (rubric G1).","");
L.push("| Family | Engine-provided (per APG) | Lumo-owned keys | Proved by a direct test | Holes (owned, unproved) | Direct tests |");
L.push("|---|---|---|---|---|---:|");
for(const r of rows){const holes=r.own.filter((k)=>!r.tested.includes(k));L.push(`| ${r.f} | ${E[r.f]??"—"} | ${r.own.join(", ")||"—"} | ${r.tested.join(", ")||"—"} | ${holes.length?"**"+holes.join(", ")+"**":"—"} | ${r.n} |`);}
L.push("","## Deviations and decisions","");
L.push("- **ListBox PageUp/PageDown** are clamped to the first/last option (fixed 15 Aug 2026 — near the ends they were a no-op). Page size = viewport ÷ option height; 10 in jsdom.");
L.push("- **Home/End are never mirrored** in any family: first/last in reading order under both directions (`list-box.test.tsx`, `date-input`).");
L.push("- **Horizontal arrows are mirrored** wherever Lumo owns them (list-box, tree, sortable, kanban, resizable, carousel, date-input, event-calendar, gantt): the *forward* key is ArrowLeft under `fa-IR`; each has a behavioural mutation operator that un-mirrors it and dies.");
L.push("- **Menu, Select, ComboBox, Tabs, Slider, Toolbar, ToggleGroup, RadioGroup, Menubar, TagGroup keys belong to the engine.** Their suites exercise them only as far as each family's own concerns reach; Home/End/typeahead/PageUp/PageDown on those families are **not pinned** — the next tranche adds engine tripwires so a Base UI change cannot silently remove them.");
L.push("- **Still unproved (owned):** date-input Delete; event-calendar End/PageUp/ArrowRight/ArrowUp/Enter/Space; gantt ArrowUp/ArrowDown/Enter; kanban Enter; tree Home/End/ArrowUp/Enter; tree-select Home/End/ArrowUp; cascader Home/End; tags-input ArrowUp/Escape; carousel ArrowLeft/ArrowRight (covered indirectly by its mutation operator's killing test, not by a direct key test). Listed so the table is not read as complete.");
fs.writeFileSync(output, L.join("\n")+"\n");
