// No "use client": Kbd is presentational and renders on the server.
import { Fragment, type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A keyboard shortcut, e.g. Ctrl + K. Takes an ARRAY, not `children`: `+` is bidi-neutral,
 * so `<Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>` renders as `K + Ctrl` in an RTL paragraph. The
 * whole chord stays inside one `dir="ltr"` island (which also gets `unicode-bidi: isolate`
 * from the UA stylesheet). `data-lumo-latn=""` marks it a sanctioned exception for the
 * gate's `no-latin-digits`/`no-latin-aria` rules, which skip that subtree.
 */
export const kbdVariants = cva(
  "inline-flex items-center justify-center rounded-sm border border-border " +
    "bg-surface-sunken font-mono font-medium text-fg-muted " +
    // The bevel is a block-axis inset shadow — nothing to mirror.
    "shadow-[inset_0_-1px_0_0_var(--color-border)]",
  {
    variants: {
      /** The key-cap size step. */
      size: {
        // `px-*` is padding-inline in Tailwind v4; `min-w-*` keeps a single character from collapsing.
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
  /** The chord, in press order: `["Ctrl", "K"]`. An array so the separators sit inside the direction island. */
  keys: readonly string[];
  /** Drawn between keys. Default `"+"`. Punctuation, not a word; it lands inside a `dir="ltr"` island and will not mirror. */
  separator?: string | undefined;
  className?: string | undefined;
}

/** A keyboard shortcut rendered as key caps, kept as an LTR island so Latin glyphs and separators never mirror. */
export function Kbd({ keys, separator = "+", size, className, ...props }: KbdProps) {
  return (
    <span
      {...props}
      data-lumo-latn=""
      dir="ltr"
      className={cn("inline-flex items-center gap-1 align-middle", className)}
    >
      {keys.map((key, index) => (
        // The index is part of the key because a chord can repeat a glyph (`["G", "G"]`).
        <Fragment key={`${index}-${key}`}>
          {index > 0 ? (
            // `aria-hidden`: the `<kbd>` elements in order already convey the chord.
            <span aria-hidden="true" className="text-fg-subtle select-none">
              {separator}
            </span>
          ) : null}
          {/* One `<kbd>` per key: a flat run of siblings, styled per key. */}
          <kbd className={cn(kbdVariants({ size }))}>{key}</kbd>
        </Fragment>
      ))}
    </span>
  );
}
