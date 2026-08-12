/**
 * No "use client": Kbd is presentational and renders on the server, so a
 * consumer pays no hydration for it.
 */
import { Fragment, type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A keyboard shortcut, e.g. Ctrl + K.
 *
 * No `"use client"` — it is `<kbd>` elements in a `<span>`.
 *
 * ═══ WHY THIS COMPONENT TAKES AN ARRAY AND NOT `children` ═══════════════════
 *
 * The obvious API is `<Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>`, and it is broken in
 * Persian in a way that is invisible to whoever writes it.
 *
 * Keyboard glyphs are Latin (`Ctrl`, `K`, `⌘`) and the separator `+` is
 * *neutral* under the Unicode bidirectional algorithm. Neutral characters take
 * the direction of the surrounding paragraph, so in an RTL paragraph the run
 * `Ctrl + K` is laid out with the strong-LTR fragments in RTL order: the reader
 * sees `K + Ctrl`. Nothing is misspelt, nothing is missing, and the shortcut is
 * simply wrong — the same defect shape as a Jalali date rendered in the
 * Gregorian calendar.
 *
 * The only fix is to keep the WHOLE chord inside one direction island, which is
 * why the separators are rendered by this component and not written by the
 * caller. `dir="ltr"` on the wrapper does that: the HTML spec's suggested UA
 * stylesheet gives any element with a `dir` attribute `unicode-bidi: isolate`,
 * so the island is both re-ordered internally and treated as a single neutral
 * object by the surrounding Persian sentence.
 *
 * ── `data-lumo-latn` ────────────────────────────────────────────────────────
 * The gate's `no-latin-digits` rule walks visible text nodes on an RTL route
 * and fails on any ASCII digit — which `F5`, `Ctrl+1` and `Alt+2` all contain.
 * `no-latin-aria` does the same for spoken attributes. Both check
 * `el.closest("[data-lumo-latn]")` and skip the subtree
 * (packages/gate/src/rules.ts, lines 84 and 172), so the marker on the wrapper
 * is what makes a keyboard shortcut a sanctioned exception rather than a
 * suppression somebody had to remember to add per page.
 *
 * It is written `data-lumo-latn=""` rather than as a bare JSX boolean: bare
 * would render `="true"`, which the attribute selector still matches, but the
 * empty string is what the gate's own fixture uses and matching it exactly
 * keeps the two files reading as one contract.
 */
export const kbdVariants = cva(
  "inline-flex items-center justify-center rounded-sm border border-border " +
    "bg-surface-sunken font-mono font-medium text-fg-muted " +
    // The bevel is a block-axis inset shadow — no inline component, so nothing
    // to mirror.
    "shadow-[inset_0_-1px_0_0_var(--color-border)]",
  {
    variants: {
      size: {
        // `px-*` is padding-inline in Tailwind v4, so the horizontal padding is
        // already logical. `min-w-*` keeps a single character from collapsing
        // into a sliver narrower than it is tall.
        sm: "h-5 min-w-5 px-1 text-[0.6875rem]",
        md: "h-6 min-w-6 px-1.5 text-xs",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface KbdProps
  extends Omit<ComponentProps<"span">, "children" | "className" | "dir">,
    VariantProps<typeof kbdVariants> {
  /**
   * The chord, in press order: `["Ctrl", "K"]`, `["⌘", "⇧", "P"]`.
   *
   * An array rather than free-form children, because the separators between
   * keys must be inside the direction island — see the file header. A single
   * key is `["Esc"]`.
   */
  keys: readonly string[];
  /**
   * Drawn between keys. Default `"+"`.
   *
   * Punctuation, not a word, so it is exempt from rule 6's "no shipped English"
   * — there is nothing to translate. `"then"` would be a word and would have to
   * be a required prop; pass `separator=" ← "`-style prose at your own risk,
   * because it lands inside a `dir="ltr"` island and will not mirror.
   */
  separator?: string | undefined;
  className?: string | undefined;
}

export function Kbd({ keys, separator = "+", size, className, ...props }: KbdProps) {
  return (
    <span
      {...props}
      data-lumo-latn=""
      dir="ltr"
      className={cn("inline-flex items-center gap-1 align-middle", className)}
    >
      {keys.map((key, index) => (
        // The index is part of the React key because a chord can legitimately
        // repeat a glyph (`["G", "G"]` is a real Vim-style shortcut) and a bare
        // `key={key}` would collide.
        <Fragment key={`${index}-${key}`}>
          {index > 0 ? (
            // `aria-hidden`: a screen reader reading the `<kbd>` elements in
            // order already conveys the chord, and "Ctrl plus K" spoken as
            // "Ctrl plus plus K" is worse than useful.
            <span aria-hidden="true" className="text-fg-subtle select-none">
              {separator}
            </span>
          ) : null}
          {/*
           * One `<kbd>` per key rather than one wrapping the whole chord. The
           * HTML spec's own guidance is that a nested `<kbd>` marks an
           * individual key within a larger input; a flat run of siblings says
           * the same thing with less markup and styles per key, which is what
           * the visual treatment needs anyway.
           */}
          <kbd className={cn(kbdVariants({ size }))}>{key}</kbd>
        </Fragment>
      ))}
    </span>
  );
}
