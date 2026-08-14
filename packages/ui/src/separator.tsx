import type { ComponentProps, Ref } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A divider between two groups of content.
 *
 * ── NO ENGINE, AND NO `"use client"` — THE HONEST ANSWER TO THE MIGRATION ──
 *
 * This file used to import React Aria's `Separator`, and its header argued the
 * dependency earned its keep for one reason: the element changes with the
 * orientation. Verified in RAC 1.20.0 (`private/Separator.mjs`) — horizontal
 * renders `<hr>`, vertical renders `<div role="separator"
 * aria-orientation="vertical">` — because `<hr>` is defined as a
 * *paragraph-level thematic break*, and a hand-rolled vertical `<hr>` announces
 * a break in the reading flow that is not there.
 *
 * The obvious migration was `@base-ui/react/separator`. It was read rather than
 * assumed, and it is a REGRESSION on exactly the point that justified renting
 * the primitive: `separator/Separator.mjs` calls `useRenderElement('div', …)`
 * unconditionally and adds `role="separator"` + `aria-orientation`. Every
 * separator in the library would become a `<div>`, including the horizontal
 * one, where `<hr>` is the element the HTML specification defines for the job
 * and the one a no-CSS or reader-mode rendering still shows. base-vega's
 * vendored separator is that `<div>` plus `data-horizontal:`/`data-vertical:`
 * utilities, and it inherits the same loss.
 *
 * So the third option is the right one: no engine at all. The whole component
 * is one ternary. That buys back more than it costs —
 *
 *   - `<hr>` returns for the horizontal case, which is the majority case;
 *   - the file drops `"use client"`, so a separator inside a server-rendered
 *     block costs the consumer no hydration and no client-bundle bytes. It
 *     ships in `item.tsx` and `button-group.tsx`, both of which are copied into
 *     server components;
 *   - there is nothing left to break on the next engine upgrade.
 *
 * A component that is correct as plain markup should be plain markup. That is
 * the same judgement `description-list.tsx` makes, arrived at from the opposite
 * direction — that file never had an engine, this one gave one up.
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
      /** Which axis the separator divides. */
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
 * `orientation` is the component's own literal union rather than an engine's
 * `Orientation`, and it is deliberately NOT taken from `VariantProps`:
 * `VariantProps` widens every variant key with `| null` (cva's way of spelling
 * "fall back to the default"), and `null` would then have to be handled at the
 * element choice below. One source of truth, and it is the stricter one.
 */
export interface SeparatorProps
  extends Omit<
    ComponentProps<"hr">,
    "children" | "className" | "ref" | "role" | "aria-orientation"
  > {
  /**
   * The root, at the widest type both branches satisfy.
   *
   * A horizontal separator is an `<hr>` and a vertical one is a
   * `<div role="separator">`, so neither `HTMLHRElement` nor `HTMLDivElement`
   * is true of this component — `HTMLElement` is. Widened rather than dropped:
   * see `props.ts`'s contract.
   */
  ref?: Ref<HTMLElement> | undefined;
  /** Which axis the separator divides. */
  orientation?: "horizontal" | "vertical" | undefined;
  className?: string | undefined;
}

export function Separator({
  orientation = "horizontal",
  className,
  ...props
}: SeparatorProps) {
  // No `data-lumo`: a separator is not focusable, and `data-lumo` exists to
  // carry the focus ring.
  const classes = cn(separatorVariants({ orientation }), className);
  return orientation === "horizontal" ? (
    // `<hr>` has an implicit `role="separator"` and an implicit horizontal
    // orientation, so neither is restated — an explicit role on a semantic
    // element is noise that eventually contradicts the element.
    <hr className={classes} {...(props as ComponentProps<"hr">)} />
  ) : (
    <div
      {...(props as ComponentProps<"div">)}
      role="separator"
      aria-orientation="vertical"
      className={classes}
    />
  );
}
