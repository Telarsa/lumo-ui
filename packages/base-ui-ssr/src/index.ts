/**
 * `@lumo-ui/base-ui-ssr` — what Base UI 1.7.0 leaves undone until hydration,
 * done during render instead. Evidence for every export: README.md.
 *
 * Three rules hold: PUBLIC API ONLY (no Base UI internals, no `node_modules`
 * patch — the package never imports `@base-ui/react`; every fix is a prop);
 * NO `"use client"` in any file, so a server module may import and call
 * `baseUiStringsFor`, `attr` or `findChildProp` during a server render; and
 * NO DEPENDENCY ON `@lumo-ui/ui` (only `react`, `@lumo-ui/core`, and a peer on
 * `@base-ui/react` for the version it is verified against).
 */

// the SSR accessibility fixes
export { useFieldWiring } from "./field-wiring.ts";
export type { FieldWiring, FieldWiringInput, FieldWiringMode } from "./field-wiring.ts";
export { useOpenMirror } from "./open-mirror.ts";
export { useCompositeTabStop } from "./composite-tab-stop.ts";
export {
  ComboboxWiringProvider,
  useComboboxInputWiring,
  useComboboxListId,
  useComboboxListWiring,
} from "./combobox-wiring.ts";

// the i18n layer
export { BASE_UI_STRINGS, baseUiStringsFor } from "./strings.ts";
export type { BaseUiStrings, BaseUiStringTemplates } from "./strings.ts";

// composition plumbing the fixes need
export { findChildProp } from "./children.ts";
export { attr } from "./attr.ts";
export { relabelEngineDismiss } from "./dismiss-label.ts";
