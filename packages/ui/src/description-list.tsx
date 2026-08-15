import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * Name/value pairs: `<dl>`, `<dt>`, `<dd>`.
 *
 *     <DescriptionList>
 *       <DescriptionGroup>
 *         <DescriptionTerm>ورود</DescriptionTerm>
 *         <DescriptionDetail>{formatDate(startsAt, locale)}</DescriptionDetail>
 *       </DescriptionGroup>
 *     </DescriptionList>
 *
 * No `"use client"`, deliberately: presentational markup that renders on the
 * SERVER and costs no hydration. A component rather than hand-written markup
 * because `children` is `LumoNode` (a bare count is TS2322), `<dd>`'s UA
 * `margin-inline-start: 40px` is zeroed here rather than by someone's reset,
 * and the money-column layout is `justify-between`, never `text-right`.
 */

export const descriptionListVariants = cva("flex flex-col gap-2 text-sm");

export const descriptionGroupVariants = cva("min-w-0", {
  variants: {
    /** Stacked pairs or the side-by-side columns. */
    layout: {
      /** Term at the inline start, detail at the inline end; `justify-between` mirrors on its own. */
      row: "flex items-start justify-between gap-3",
      /** Term above detail. The block axis does not mirror. */
      stack: "flex flex-col gap-0.5",
    },
  },
  defaultVariants: { layout: "row" },
});

export const descriptionTermVariants = cva("min-w-0 text-fg-muted");

// `m-0`: kills the UA's inline-start indent on `<dd>` without a consumer's reset.
export const descriptionDetailVariants = cva("m-0 min-w-0 text-fg");

export interface DescriptionListProps
  extends Omit<ComponentProps<"dl">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionList({ className, ...props }: DescriptionListProps) {
  return <dl className={cn(descriptionListVariants(), className)} {...props} />;
}

/**
 * One pair. A `<div>` between `<dl>` and its `<dt>`/`<dd>` is valid HTML and
 * is what makes a per-pair `justify-between` possible.
 */
export interface DescriptionGroupProps
  extends Omit<ComponentProps<"div">, "children" | "className">,
    VariantProps<typeof descriptionGroupVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionGroup({ layout, className, ...props }: DescriptionGroupProps) {
  return <div className={cn(descriptionGroupVariants({ layout }), className)} {...props} />;
}

export interface DescriptionTermProps
  extends Omit<ComponentProps<"dt">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionTerm({ className, ...props }: DescriptionTermProps) {
  return <dt className={cn(descriptionTermVariants(), className)} {...props} />;
}

export interface DescriptionDetailProps
  extends Omit<ComponentProps<"dd">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionDetail({ className, ...props }: DescriptionDetailProps) {
  return <dd className={cn(descriptionDetailVariants(), className)} {...props} />;
}
