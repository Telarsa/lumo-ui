import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * Overlapping avatars, with a count for the rest. No `"use client"`: a row of
 * children and a number, server-renderable. The overlap is `-ms-2` (LOGICAL),
 * owned by the stack, so it leans the reader's way in both scripts; the
 * overflow count goes through `formatNumber` («+۲», never «+2»); and `label`
 * names the stack as ONE fact, with the children hidden beneath it.
 */

export const iconStackVariants = cva(
  // The overlap and the ring, both owned by the stack.
  "flex items-center [&>*]:ring-2 [&>*]:ring-bg [&>*:not(:first-child)]:-ms-2",
  {
    variants: {
      /** The member-chip diameter step. */
      size: {
        sm: "[&>*]:size-6 [&>*]:text-xs",
        md: "[&>*]:size-8 [&>*]:text-sm",
        lg: "[&>*]:size-10 [&>*]:text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const iconStackOverflowVariants = cva(
  "grid shrink-0 place-items-center rounded-full bg-surface-sunken font-medium text-fg-muted",
);

export interface IconStackProps
  extends Omit<
      React.ComponentProps<"div">,
      "children" | "role" | "aria-label" | "aria-labelledby"
    >,
    VariantProps<typeof iconStackVariants> {
  /** What the stack MEANS, e.g. «۵ عضو». Required — the children are hidden beneath it. */
  label: string;
  /** Selects the numbering system for the overflow count. */
  locale: Locale;
  /** How many children to show before collapsing the rest into a count. */
  max?: number;
  children?: LumoNode;
  className?: string | undefined;
}

export function IconStack({
  label,
  locale,
  max = 4,
  size,
  className,
  children,
  ...props
}: IconStackProps) {
  const flatten = (nodes: React.ReactNode): React.ReactNode[] =>
    React.Children.toArray(nodes).flatMap((node) =>
      React.isValidElement(node) && node.type === React.Fragment
        ? flatten((node.props as { children?: React.ReactNode }).children)
        : [node],
    );
  const all = flatten(children as React.ReactNode);
  const shown = all.slice(0, max);
  const overflow = all.length - shown.length;

  return (
    <div
      {...props}
      data-lumo=""
      // One fact, one name. The children carry no names of their own here.
      role="img"
      aria-label={label}
      aria-labelledby={undefined}
      className={cn(iconStackVariants({ size }), className)}
    >
      {shown}
      {overflow > 0 ? (
        <span aria-hidden="true" className={iconStackOverflowVariants()}>
          {/* Through `formatNumber`, never `{overflow}` bare. */}
          {`+${formatNumber(overflow, locale)}`}
        </span>
      ) : null}
    </div>
  );
}
