import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A sequence of events down a rail — an order's history, an audit trail. No
 * `"use client"`: no state, deliberately server-renderable. The rail, the dot
 * and the text are all placed on the inline axis with LOGICAL classes
 * (`start-*`, `-ms-*`, `ps-*`), since a physical rail is a broken component
 * on a Persian page. It is an `<ol>` because the order is the information;
 * `marker` is the caller's decorative element.
 */

export const timelineVariants = cva("relative flex list-none flex-col gap-6 p-0");

export const timelineItemVariants = cva(
  // `ps-10` clears the rail and the dot; logical, so it mirrors.
  "relative ps-10",
  {
    variants: {
      /**
       * The rail's colour BELOW this item, and the dot's fill. The segment
       * belongs to the item above it, so progress reads from per-item classes.
       * Two properties because neutral wants two greys (dot vs hairline).
       */
      tone: {
        neutral:
          "[--lumo-timeline-dot:var(--color-border-strong)] " +
          "[--lumo-timeline-rail:var(--color-border)]",
        accent:
          "[--lumo-timeline-dot:var(--color-accent)] " +
          "[--lumo-timeline-rail:var(--color-accent)]",
        positive:
          "[--lumo-timeline-dot:var(--color-positive)] " +
          "[--lumo-timeline-rail:var(--color-positive)]",
        critical:
          "[--lumo-timeline-dot:var(--color-critical)] " +
          "[--lumo-timeline-rail:var(--color-critical)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export const timelineMarkerVariants = cva(
  // `start-0`, not `left-0`: dot and rail are placed from the same logical edge.
  "absolute start-0 top-0 grid size-7 place-items-center rounded-full " +
    "border-2 border-bg bg-[var(--lumo-timeline-dot)] text-bg",
);

export const timelineRailVariants = cva(
  // `start-3.5` is size-7 / 2, so the line runs through the dots' centres. The
  // colour comes from the ITEM's `tone`; the fallback is the plain hairline.
  "absolute start-3.5 top-7 bottom-0 w-px -ms-px " +
    "bg-[var(--lumo-timeline-rail,var(--color-border))]",
);

export const timelineTitleVariants = cva("text-sm font-medium text-fg");
export const timelineBodyVariants = cva("mt-1 text-sm text-fg-muted");
export const timelineTimeVariants = cva("text-xs text-fg-subtle");

export interface TimelineProps extends React.ComponentProps<"ol"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Timeline({ className, children, ...props }: TimelineProps) {
  const parts = React.Children.toArray(children);
  const itemIndexes = parts.flatMap((child, index) =>
    React.isValidElement(child) && child.type === TimelineItem ? [index] : [],
  );
  const lastItemIndex = itemIndexes.at(-1);
  return (
    <ol data-lumo="" className={cn(timelineVariants(), className)} {...props}>
      {parts.map((child, index) =>
        React.isValidElement<TimelineItemProps>(child) && child.type === TimelineItem
          ? React.cloneElement(child, { isLast: index === lastItemIndex })
          : child,
      )}
    </ol>
  );
}

export interface TimelineItemProps
  extends Omit<React.ComponentProps<"li">, "children">,
    VariantProps<typeof timelineItemVariants> {
  /** What sits in the dot — usually a small icon. DECORATIVE: mark it `aria-hidden="true"`. */
  marker?: LumoNode;
  /** The last item draws no rail below it — there is nothing to connect to. */
  isLast?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function TimelineItem({
  marker,
  tone,
  isLast = false,
  className,
  children,
  ...props
}: TimelineItemProps) {
  return (
    <li data-lumo="" className={cn(timelineItemVariants({ tone }), className)} {...props}>
      {/* The rail is drawn by the item, not the list, so it can take the item's tone. */}
      {isLast ? null : <span aria-hidden="true" className={timelineRailVariants()} />}
      <span aria-hidden="true" className={timelineMarkerVariants()}>
        {marker as React.ReactNode}
      </span>
      {children as React.ReactNode}
    </li>
  );
}

export interface TimelineSectionProps extends React.ComponentProps<"div"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function TimelineTitle({ className, children, ...props }: TimelineSectionProps) {
  return (
    <div className={cn(timelineTitleVariants(), className)} {...props}>
      {children as React.ReactNode}
    </div>
  );
}

export function TimelineBody({ className, children, ...props }: TimelineSectionProps) {
  return (
    <div className={cn(timelineBodyVariants(), className)} {...props}>
      {children as React.ReactNode}
    </div>
  );
}

export interface TimelineTimeProps extends Omit<React.ComponentProps<"time">, "dateTime"> {
  /** The already-formatted, already-localised time — «۱۹ مرداد ۱۴۰۵». A STRING, not a `Date`: the caller holds the locale. */
  children: LumoNode;
  /** The machine-readable stamp for the `datetime` attribute — ISO 8601, therefore GREGORIAN, whatever the visible calendar. */
  dateTime?: string | undefined;
  className?: string | undefined;
}

export function TimelineTime({ children, dateTime, className, ...props }: TimelineTimeProps) {
  return (
    <time
      className={cn(timelineTimeVariants(), className)}
      {...(dateTime === undefined ? {} : { dateTime })}
      {...props}
    >
      {children as React.ReactNode}
    </time>
  );
}
