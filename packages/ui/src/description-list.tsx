import type { HTMLAttributes } from "react";
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
 * ── NO `"use client"`, AND THAT IS THE WHOLE POINT ──────────────────────────
 *
 * This file imports nothing from `react-aria-components`, holds no state and
 * takes no callbacks — it is four elements and a class list. A description list
 * is presentational markup, so it renders on the SERVER and costs a consumer no
 * hydration at all. Making it a client component would drag every checkout
 * panel and every settings summary that contains one across the boundary for a
 * flex rule, which is the same trade `card.tsx` and `badge.tsx` refuse.
 *
 * The directive is omitted deliberately rather than forgotten; `coverage.test.ts`
 * requires this paragraph to exist for exactly that reason.
 *
 * ── WHY IT IS A COMPONENT AT ALL, GIVEN IT IS JUST MARKUP ──────────────────
 *
 * `booking-summary.tsx` writes `<dl>/<dt>/<dd>` by hand and says so in a
 * comment: "a semantic element is markup, not a primitive to reimplement". That
 * reasoning is right about the ELEMENTS and wrong about the DEFECTS, and the
 * defects are the reason this exists:
 *
 *  1. `children` here is `LumoNode`. Hand-written `<dd>{total}</dd>` accepts a
 *     bare number and renders `24500` in Latin digits on a Persian page — rule
 *     0, the single most-repeated defect in the prototype this library replaces.
 *     `<dd>` from React's own JSX types cannot refuse it. This can.
 *  2. `<dd>` carries a UA `margin-inline-start: 40px`. Tailwind's preflight
 *     zeroes it, so it is invisible in this workspace and appears the moment a
 *     consumer copies the block into a project without preflight — as a 40px
 *     indent on the reading edge, i.e. on the right in Persian. `m-0` states it
 *     rather than relying on someone else's reset.
 *  3. The money-column layout is `justify-between`, never a two-column table
 *     with `text-right`. booking-summary.tsx already argues this at length: the
 *     table version pins every amount to the PHYSICAL right, which is outside
 *     the panel's reading edge in Persian and reads as broken alignment rather
 *     than as a mirroring bug. `DescriptionGroup`'s `layout="row"` is that
 *     argument, made once.
 */

export const descriptionListVariants = cva("flex flex-col gap-2 text-sm");

export const descriptionGroupVariants = cva("min-w-0", {
  variants: {
    layout: {
      /**
       * Term at the inline start, detail at the inline end, on one line.
       * `justify-between` resolves against the container's direction, so both
       * swap under `dir="rtl"` from this one class and there is no physical
       * value anywhere to get wrong.
       */
      row: "flex items-start justify-between gap-3",
      /** Term above detail. The block axis does not mirror. */
      stack: "flex flex-col gap-0.5",
    },
  },
  defaultVariants: { layout: "row" },
});

export const descriptionTermVariants = cva("min-w-0 text-fg-muted");

// `m-0`: kills the UA's inline-start indent on `<dd>` without depending on a
// consumer's CSS reset. Symmetric, so there is no logical form to prefer.
export const descriptionDetailVariants = cva("m-0 min-w-0 text-fg");

export interface DescriptionListProps
  extends Omit<HTMLAttributes<HTMLDListElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionList({ className, ...props }: DescriptionListProps) {
  return <dl className={cn(descriptionListVariants(), className)} {...props} />;
}

/**
 * One pair.
 *
 * A `<div>` between `<dl>` and its `<dt>`/`<dd>` is valid — the HTML spec
 * allows wrapping each name/value group in one, and assistive technology still
 * pairs them. It is what makes a per-pair `justify-between` possible at all,
 * since flex on the `<dl>` itself would lay every term and every detail out as
 * siblings in a single run.
 */
export interface DescriptionGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">,
    VariantProps<typeof descriptionGroupVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionGroup({ layout, className, ...props }: DescriptionGroupProps) {
  return <div className={cn(descriptionGroupVariants({ layout }), className)} {...props} />;
}

export interface DescriptionTermProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionTerm({ className, ...props }: DescriptionTermProps) {
  return <dt className={cn(descriptionTermVariants(), className)} {...props} />;
}

export interface DescriptionDetailProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DescriptionDetail({ className, ...props }: DescriptionDetailProps) {
  return <dd className={cn(descriptionDetailVariants(), className)} {...props} />;
}
