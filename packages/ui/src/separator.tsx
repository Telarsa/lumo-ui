"use client";

import { cva } from "class-variance-authority";
import {
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps,
} from "react-aria-components";
import { cn } from "@lumo-ui/core";

/**
 * A divider between two groups of content.
 *
 * `"use client"` because `react-aria-components` is `client-only`. RAC earns
 * the boundary here for one reason that is easy to get wrong by hand: the
 * element it renders changes with the orientation. Verified in RAC 1.20.0
 * (`private/Separator.mjs`): horizontal renders `<hr>`, and vertical renders a
 * `<div role="separator" aria-orientation="vertical">` — because `<hr>` is
 * defined as a *paragraph-level thematic break* and a hand-rolled vertical
 * `<hr>` announces a break in the reading flow that is not there.
 *
 * ── Why a decorative rule uses `--color-border` and not `--color-border-control` ─
 * tokens.css keeps the two apart on purpose: WCAG 1.4.11 requires 3:1 for the
 * boundary of a form control, and nothing at all for a decorative rule.
 * Collapsing them would force every hairline on the page to be as dark as an
 * input's edge. A separator is decoration; it takes the lighter token.
 */
export const separatorVariants = cva(
  // `border-0` overrides the UA's `<hr>` border, `m-0` its default block
  // margins. Both are all-sides shorthands, so neither has a direction to get
  // wrong; the visible rule is a background, which cannot be mirrored at all.
  "m-0 shrink-0 border-0 bg-border",
  {
    variants: {
      orientation: {
        // Width and height are physical dimensions, not physical *directions*
        // — there is no logical alternative to `h-px` and none is needed.
        horizontal: "h-px w-full",
        // `self-stretch` so a vertical rule inside a flex row takes the row's
        // height without the parent having to be told about it.
        vertical: "w-px self-stretch",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

/**
 * `orientation` is taken from RAC rather than from `VariantProps`, even though
 * the cva config declares it too. `VariantProps` widens every variant key with
 * `| null` (cva's way of spelling "fall back to the default"), and `null` is not
 * assignable to RAC's `Orientation` — so inheriting it from the variants would
 * make the prop typecheck here and fail at the RAC call. One source of truth,
 * and it is the one with the stricter type.
 */
export interface SeparatorProps extends Omit<AriaSeparatorProps, "className"> {
  className?: string | undefined;
}

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <AriaSeparator
      // No `data-lumo`: a separator is not focusable, and `data-lumo` exists to
      // carry the focus ring.
      orientation={orientation}
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  );
}
