import type { Locale, LumoNode } from "@lumo-ui/core";

/**
 * THE EXAMPLE-FILE CONTRACT.
 *
 * A component page grows a set of worked examples by gaining ONE file:
 *
 *     apps/website/src/examples/<slug>.tsx
 *
 * where `<slug>` is the component page's slug. The loader
 * (`lib/examples-loader.ts`) discovers these files by READING THE DIRECTORY, so
 * adding a component's page is creating the file and nothing else: no list to
 * append to, no registry to regenerate, no import to add. This file IS the
 * registration — there is no other list, and a component without one has no
 * page (see `lib/catalog.ts`). The FIRST example is the page's preview.
 *
 * The file exports ONE named constant:
 *
 *     export const EXAMPLES: ComponentExamples = { meta, examples };
 *
 * ── THE SOURCE-EXTRACTION CONVENTION, WHICH THE BUILD ENFORCES ──────────────
 *
 * Every example renders as a card with its own source under it, and that source
 * is SLICED FROM THIS FILE'S TEXT at build time — never retyped — so it cannot
 * drift from the preview beside it (the same argument `lib/catalog.ts` makes for
 * reading component source off disk). Slicing needs anchors, so the contract
 * fixes the file's shape:
 *
 *  1. Each entry in `examples` is an object literal whose `id` is written
 *     literally, once in the whole file, as:  id: "<the-id>"
 *  2. Each entry's `render` is written as a bare identifier reference:
 *         render: SizesExample
 *     naming a TOP-LEVEL function declared in the same file:
 *         function SizesExample(l: Locale) { return ( ... ); }
 *     That declaration, in full, is the source shown on the page.
 *  3. An example whose source cannot be recovered is a BUILD ERROR, not a
 *     silent omission: the extractor throws with the file, the id and the
 *     rule broken — see `_system/extract.ts` for the exact failure modes.
 *     (An inline `render: (l) => ...` is tolerated — its expression text is
 *     sliced verbatim — but the named-function shape is the convention: it
 *     reads as a complete function on the page instead of a bare arrow.
 *     The loader likewise accepts a transitional `meta` + `examples` export
 *     pair, with `intro` standing in for `description`, so files written
 *     against the early brief keep building; new files use `EXAMPLES`.)
 *  4. The slicer matches brackets textually. Keep `{}`, `()` and `[]` out of
 *     string literals inside render values (copy never needs them); an
 *     unbalanced count is a loud build failure by design.
 *
 * ── THE RULES EVERY RENDER FUNCTION OBEYS ───────────────────────────────────
 *
 * Three rules, because these render on prerendered, gate-graded pages:
 *
 *  1. Every user-visible string is keyed by locale — both `fa-IR` and `en-US`,
 *     no English literal anywhere, including `aria-label`s. `LocalizedText`
 *     is a full `Record<Locale, string>`, so a missing translation is a
 *     compile error, not a fallback.
 *  2. No bare numbers — `formatNumber(n, locale)` or `LumoNode` refuses it.
 *  3. Nothing that needs a client: no `useState`, no function props. These
 *     render under a static export. Overlays are shown as their triggers.
 *
 * ── META ────────────────────────────────────────────────────────────────────
 *
 * `composition` is the monospace parts tree the page renders in a copyable
 * block. Every capitalised JSX tag in it is checked against the REAL exports of
 * `packages/ui/src/index.ts` at build time; a part named in the tree but not
 * exported fails the build — a tree that lies is worse than no tree.
 *
 * `parts` is the hand-authored API reference: one row per part, description in
 * both locales. Part names are checked against the same export list.
 *
 * `isNew` puts the "new" dot on the component's sidebar row. Set it when the
 * component itself is new to the library; drop it in a later pass.
 */

/** Copy in every locale the site serves. There is no partial and no fallback. */
export type LocalizedText = Record<Locale, string>;

/** One row of the API-reference table. */
export interface ExamplePart {
  /** The part's exported name, exactly as `packages/ui/src/index.ts` spells it. */
  name: string;
  /** One line on what the part is and why it exists. Both locales. */
  description: LocalizedText;
}

export interface ExamplesMeta {
  /**
   * Page identity. Title and intro become the page header, tier places it in
   * the sidebar and the gallery. REQUIRED for every file (validated by
   * `lib/catalog.ts` at build time) — the types stay optional only because
   * the loader validates with a message that names the missing field rather
   * than a compiler error that does not. History: routes once derived from a
   * separate demo registry, an examples file alone was invisible to it, and a
   * review found eleven components with example files and no built page.
   */
  title?: Record<Locale, string>;
  intro?: Record<Locale, string>;
  tier?: "form" | "display" | "overlay" | "navigation" | "feedback" | "layout" | "data";
  /** Marks the component's sidebar row with the "new" dot. */
  isNew?: boolean;
  /**
   * The monospace parts tree, as pseudo-JSX. Rendered in a copyable code
   * block. Every capitalised tag must be a real `@lumo-ui/ui` export.
   */
  composition?: string;
  /** The API-reference rows. The section renders only when this is present. */
  parts?: readonly ExamplePart[];
  /**
   * The component's module inside `packages/ui/src`, when it differs from
   * `<slug>.tsx` — e.g. the icon-button page documents `button.tsx`. The
   * derived parts list in the composition section comes from this module's
   * exports.
   */
  sourceFile?: string;
}

export interface Example {
  /**
   * kebab-case, unique in the file. Becomes the section anchor
   * `#example-<id>`, which the on-this-page rail lists.
   */
  id: string;
  /** The section heading. Both locales. */
  title: LocalizedText;
  /** An optional line under the heading. Both locales. */
  description?: LocalizedText;
  /**
   * A bare reference to a top-level `function <Name>(l: Locale)` in this file —
   * see the extraction convention in this header. Called with the page's
   * locale during the server render.
   */
  render: (locale: Locale) => LumoNode;
}

export interface ComponentExamples {
  meta: ExamplesMeta;
  examples: readonly Example[];
}
