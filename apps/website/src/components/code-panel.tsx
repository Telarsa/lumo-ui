import { cn } from "@lumo-ui/core";
import { CopyCode } from "./code-block";

/**
 * A code listing with a copy button — a SERVER component, kept separate from
 * `code-block.tsx` so the raw source never becomes a client prop (`CopyCode`
 * reads `textContent` off the sibling `<pre>`) and one server element can be
 * placed twice on a page as a single flight row. The `<pre>` wrapper is the
 * Latin exception (`dir="ltr" lang="en" data-lumo-latn=""`); the copy button
 * stays a SIBLING outside it so its Persian name is graded by `no-latin-aria`.
 * Measurements and reasoning: docs/decisions/log.md.
 */
export interface CodePanelProps {
  /** Shiki output, produced at build time by the SERVER caller via `lib/highlight.ts`. */
  html?: string | undefined;
  /** Plain-text fallback when there is no `html`. NOT the clipboard's source:
   *  `CopyCode` reads the rendered `<pre>` either way. */
  code?: string | undefined;
  /** The copy button's accessible name before it is pressed. Required. */
  label: string;
  /** Announced via the live region, and taken on as the button's own accessible
   *  name, once the copy succeeds. Required. */
  copiedLabel: string;
  /** Marks this panel `data-lumo-code-source`, so the page header's "Copy page"
   *  button can append this listing's text without the source being a prop. */
  isPageSource?: boolean | undefined;
  className?: string | undefined;
}

// A scrollbar the reader can SEE on macOS. Two mechanisms because no engine
// honours both: `scrollbar-*` (Firefox/Chromium), `::-webkit-scrollbar` (Safari).
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
  // `data-lumo-code-panel` is the scope `CopyCode` climbs to before it looks
  // for a `<pre>`, so each button finds exactly the listing it floats over.
  return (
    <div
      data-lumo-code-panel=""
      {...(isPageSource === true ? { "data-lumo-code-source": "" } : {})}
      className={cn("relative", className)}
    >
      {html !== undefined ? (
        // Shiki's output is a complete `<pre class="shiki">…`; restyled via `[&_pre]`.
        <div
          dir="ltr"
          lang="en"
          data-lumo-latn=""
          // A listing that scrolls must be reachable by keyboard (axe scrollable-region-focusable).
          tabIndex={0}
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
          tabIndex={0}
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
