import { cn } from "@lumo-ui/core";
import { CopyCode } from "./code-block";

/**
 * A code listing with a copy button — every shell command and every source
 * listing on the site. A SERVER component, which is the whole point of the file
 * existing separately from `code-block.tsx`.
 *
 * ── WHY THIS IS NOT `CodeBlock` ANY MORE ─────────────────────────────────────
 *
 * `CodeBlock` was a `"use client"` component taking the highlighted markup as
 * an `html` string prop AND the raw source as a second `code` string prop. Every
 * prop of a client component is serialized into the RSC flight payload so the
 * browser can hydrate with it, so each panel shipped its source twice: once as
 * rendered DOM, once as an escaped string inside `self.__next_f.push(...)`.
 *
 * Measured on the built export at 3f46039, `out/fa/components/event-calendar/
 * index.html` (2,217,379 chars / 2,274,585 bytes):
 *
 *     shiki style spans      224,727 chars   4,670 spans    10%
 *     all <pre> blocks       364,509 chars       6 blocks   16%
 *     RSC flight payload   1,678,774 chars                  76%
 *
 * The flight decodes to 1,311,032 chars, and React outlines every string of
 * 1024 chars or more into its own `T`-prefixed row: 15 such rows held 1,102,417
 * chars, 84% of the payload. Nine were shiki HTML (885,280 chars) and six were
 * RAW SOURCE passed as `code` (217,137 chars) — and only 364,509 chars of shiki
 * were ever in the DOM, because React Aria's `Tabs` mounts one panel at a time
 * while the flight serializes every panel's props regardless.
 *
 * ── WHAT SERVER-RENDERING DOES AND DOES NOT FIX ──────────────────────────────
 *
 * It does NOT remove the highlighted markup from the flight, and it was worth
 * measuring rather than assuming. A server component's host elements are in the
 * RSC tree exactly like a client component's props are: `apps/website/src/app/
 * [lang]/blocks/[slug]/page.tsx` has always rendered `dangerouslySetInnerHTML`
 * from the server, and `out/fa/blocks/dashboard-page/index.txt` carries the
 * string anyway — one 31,017-char `T` row, 23% of that page's payload. Moving a
 * `<pre>` across the client boundary changes which flight row holds the markup,
 * not whether one does.
 *
 * What it DOES buy is the two things this file's shape is actually for:
 *
 *   1. **No `code` prop at all.** The copy button reads `textContent` off its
 *      sibling `<pre>` (see `CopyCode`), so the raw source never enters the
 *      React tree in either form. That is the 217,137 chars above, and it is
 *      the largest single reduction available without dropping content.
 *   2. **One element, two placements.** React's flight writer deduplicates
 *      OBJECTS by reference (`writtenObjects`, a WeakMap) but never strings —
 *      `serializeLargeTextString` emits a fresh row every time it is called.
 *      The component page shows the same file twice (Preview → Code, and
 *      Installation → Manual, which `resolveRegistryItem` matches BY CONTENT),
 *      and as two `html` string props that shipped as two identical 336,371-char
 *      rows. As one shared server element it can ship as one row and a
 *      back-reference. See `page.tsx` for the reuse and the measurement.
 *
 * ── THE LATIN ESCAPE HATCH IS UNCHANGED ──────────────────────────────────────
 *
 * `dir="ltr" lang="en" data-lumo-latn=""` on the `<pre>`'s wrapper: shell
 * commands and source code are genuinely Latin, CONTRIBUTING.md's stated
 * exception. The copy button stays OUTSIDE that subtree — a sibling of the
 * `<pre>`, not a descendant — because `no-latin-aria` (packages/gate/src/
 * rules.ts) skips anything under `data-lumo-latn`, and this button's accessible
 * name is Persian prose that must stay graded.
 */
export interface CodePanelProps {
  /**
   * Shiki output, produced at build time by the SERVER caller via
   * `lib/highlight.ts`. Never imported here or below: shiki plus two grammars
   * is megabytes of tokenizer with no business in a browser bundle.
   */
  html?: string | undefined;
  /**
   * The plain-text fallback, rendered only when there is no `html` — the CSS
   * snippets on the theming and typography pages, for which no grammar is
   * loaded. It is NOT the clipboard's source: `CopyCode` reads the rendered
   * `<pre>` either way, so the highlighted and unhighlighted paths cannot
   * disagree about what a paste produces.
   */
  code?: string | undefined;
  /** The copy button's accessible name before it is pressed. Required. */
  label: string;
  /** Announced via the live region, and taken on as the button's own accessible
   *  name, once the copy succeeds. Required. */
  copiedLabel: string;
  /**
   * Marks this panel `data-lumo-code-source`, so the page header's "Copy page"
   * button can append this listing's text to the install command WITHOUT the
   * source being a prop of anything. One panel per page may carry it; see
   * `CopyButton`'s `appendFrom` for the other half of the contract.
   */
  isPageSource?: boolean | undefined;
  className?: string | undefined;
}

/**
 * A scrollbar the reader can SEE. `overflow-auto` alone leaves macOS's overlay
 * scrollbar invisible until the reader is already scrolling — on a capped-height
 * code block that reads as "the rest of the code does not exist", which is
 * exactly what the review reported. Two mechanisms, because no one engine
 * honours both: `scrollbar-width`/`scrollbar-color` for Firefox and Chromium,
 * `::-webkit-scrollbar` for Safari (which supports neither standard property
 * with a custom colour). The thumb reads the `--lumo-sys-border-strong` token
 * directly, so it repaints with the theme like every other surface.
 */
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--lumo-sys-border-strong)_transparent] " +
  "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong";

export function CodePanel({
  html,
  code,
  label,
  copiedLabel,
  isPageSource,
  className,
}: CodePanelProps) {
  /*
   * `data-lumo-code-panel` is the scope `CopyCode` climbs to before it looks
   * for a `<pre>`. A selector rooted at the document would find the first code
   * panel on the page for every button on it; rooted at the closest panel it
   * finds exactly the listing the button floats over, which is the only
   * relationship this control has ever claimed.
   */
  return (
    <div
      data-lumo-code-panel=""
      {...(isPageSource === true ? { "data-lumo-code-source": "" } : {})}
      className={cn("relative", className)}
    >
      {html !== undefined ? (
        /*
         * Shiki's output is a complete `<pre class="shiki">…`, so the wrapper
         * div carries the chrome and the inner pre is restyled by the
         * `[&_pre]` utilities — restating shiki's own background would fight
         * the dual-theme variables globals.css flips.
         */
        <div
          dir="ltr"
          lang="en"
          data-lumo-latn=""
          className={cn(
            "max-h-128 overflow-auto rounded-lg border border-border bg-surface-sunken text-start text-xs leading-relaxed [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:pe-12",
            SCROLLBAR,
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          dir="ltr"
          lang="en"
          data-lumo-latn=""
          className={cn(
            "max-h-128 overflow-auto rounded-lg border border-border bg-surface-sunken p-4 pe-12 text-start text-xs leading-relaxed",
            SCROLLBAR,
          )}
        >
          <code>{code}</code>
        </pre>
      )}
      <CopyCode label={label} copiedLabel={copiedLabel} />
    </div>
  );
}
