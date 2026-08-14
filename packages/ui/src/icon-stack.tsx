import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * Overlapping avatars, with a count for the rest — the row on a shared
 * document or a group conversation.
 *
 *     <IconStack label="۵ عضو" locale={locale} max={3}>
 *       <Avatar … /> <Avatar … /> <Avatar … /> <Avatar … /> <Avatar … />
 *     </IconStack>
 *
 * No `"use client"`: a row of children and a number, so it is
 * server-renderable — a members row on a list page costs no bundle.
 *
 * ═══ THE OVERLAP HAS A DIRECTION, AND IT IS LOGICAL ═════════════════════════
 *
 * Every stack of this kind is built with `-ml-2` on every child but the first,
 * plus a ring so the edges read. On a Persian page `-ml-2` pulls each avatar
 * toward the LEFT — away from the one before it in reading order — so the
 * overlap runs backwards: the first face ends up on top of nothing and the last
 * covers the one that should be in front of it.
 *
 * `-ms-2` is the same instruction expressed on the inline axis, so the stack
 * leans the reader's way in both scripts from one class. The `:first-child`
 * exemption is written as `[&>*:not(:first-child)]` rather than applied by the
 * caller, because "all but the first" is a rule about the STACK, and a caller
 * looping over people should not have to know it.
 *
 * ═══ THE OVERFLOW COUNT IS A NUMBER, SO IT IS FORMATTED ═════════════════════
 *
 * «+۲», never «+2». This is the exact defect `LumoNode` exists to make
 * unrepresentable — a bare `{overflow}` in JSX type-checks under a plain
 * `ReactNode` and renders Latin digits on a page whose every other number is
 * Persian — so the count goes through `formatNumber`, and `locale` is required
 * rather than inferred.
 *
 * ═══ THE STACK IS ONE THING TO A SCREEN READER ══════════════════════════════
 *
 * `label` is required and the children are hidden beneath it. A stack of five
 * avatars is one fact — "five members" — and announcing five images with five
 * names, followed by "+2", is a worse rendering of that fact than the sentence
 * the caller already knows how to write. The names are not lost: a stack like
 * this is always beside, or a trigger for, a real list.
 */

export const iconStackVariants = cva(
  // The overlap and the ring, both owned by the stack. `ring-bg` is what makes
  // the edges legible against whatever surface the stack sits on.
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
  /**
   * What the stack MEANS, e.g. «۵ عضو». Required.
   *
   * The children are hidden beneath it — see the file header. Five names and a
   * "+2" is a worse rendering of "five members" than the sentence the caller
   * already knows how to write.
   */
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
          {/*
           * Through `formatNumber`, never `{overflow}` bare. A raw number
           * type-checks under `ReactNode` and renders «+2» on a page whose
           * every other figure is Persian — the defect `LumoNode` exists for.
           */}
          {`+${formatNumber(overflow, locale)}`}
        </span>
      ) : null}
    </div>
  );
}
