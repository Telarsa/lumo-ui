/**
 * `@lumo-ui/base-ui-ssr` — what Base UI 1.7.0 leaves undone until hydration,
 * done during render instead.
 *
 * See README.md for the measured evidence behind every export. Three rules hold
 * for this package and they are the reason it can exist at all:
 *
 *  1. PUBLIC API ONLY. Nothing here imports from a Base UI internal module path,
 *     and nothing patches `node_modules`. Every fix is a documented prop passed
 *     to a documented part. That is checkable: this package does not import
 *     `@base-ui/react` AT ALL — see the note below.
 *
 *  2. NO `"use client"`, in any file. The two hooks are hooks and are therefore
 *     only callable from a component, but the MODULES are directive-free, so a
 *     server module may import `baseUiStringsFor`, `attr` or `findChildProp` and
 *     call them during a server render. A directive here would put every
 *     consumer's field component on the client for no reason.
 *
 *  3. NO DEPENDENCY ON `@lumo-ui/ui`. This package must be usable by anyone with
 *     the same problem and no interest in Lumo's components. Its whole dependency
 *     surface is `react`, `@lumo-ui/core` (for `Locale` and `formatNumber`), and
 *     a PEER on `@base-ui/react` for the version it is verified against.
 *
 * ── WHY THERE IS NO `import … from "@base-ui/react"` IN THIS PACKAGE ────────
 *
 * It surprised us too, and it is the strongest single piece of evidence for the
 * bet this package tests. Every defect below is fixed by passing a value INTO
 * Base UI — an `aria-labelledby`, an `aria-describedby`, a `role`, an
 * `aria-valuetext` callback, an id. Passing a prop needs no import. The peer
 * dependency is declared because the fixes are verified against one version's
 * BEHAVIOUR, not because a symbol is linked.
 *
 * Contrast the alternative this project measured: React Aria's equivalent
 * defects needed a 27 KB patch of `node_modules`, because the values that had to
 * change were computed inside the library and never exposed. A patch must freeze
 * an internal; an adapter only has to understand one.
 */

// ── the SSR accessibility fixes ────────────────────────────────────────────
export { useFieldWiring } from "./field-wiring";
export type { FieldWiring, FieldWiringInput, FieldWiringMode } from "./field-wiring";
export { useOpenMirror } from "./open-mirror";
/*
 * Added while migrating the collections family. Same shape as the two above — a
 * relationship Base UI resolves in a layout effect and therefore not at all on
 * the server — and the most expensive of the three for a keyboard user: a
 * server-rendered composite (Toolbar, ToggleGroup, Tabs, RadioGroup) carries
 * `tabindex="-1"` on every item and `tabindex="0"` on none, so the Tab key
 * cannot reach it before hydration. Measured table in the module header.
 */
export { useCompositeTabStop } from "./composite-tab-stop";
export {
  ComboboxWiringProvider,
  useComboboxInputWiring,
  useComboboxListId,
  useComboboxListWiring,
} from "./combobox-wiring";

// ── the i18n layer ─────────────────────────────────────────────────────────
export { BASE_UI_STRINGS, baseUiStringsFor } from "./strings";
export type { BaseUiStrings, BaseUiStringTemplates } from "./strings";

// ── composition plumbing the fixes need ────────────────────────────────────
export { findChildProp } from "./children";
export { attr } from "./attr";
