import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A sequence of events down a rail — an order's history, an audit trail.
 *
 *     <Timeline>
 *       <TimelineItem marker={<CheckIcon aria-hidden="true" />} tone="positive">
 *         <TimelineTime value={shipped} locale={locale} />
 *         <TimelineTitle>ارسال شد</TimelineTitle>
 *         <TimelineBody>…</TimelineBody>
 *       </TimelineItem>
 *     </Timeline>
 *
 * No `"use client"`: there is no state here. A timeline is a rendered list, and
 * this file is deliberately server-renderable so a page can produce one without
 * shipping any JavaScript — the same rule `button.variants.ts` states for cva.
 *
 * ═══ THE RAIL IS THE ENTIRE RTL PROBLEM ═════════════════════════════════════
 *
 * A timeline is a vertical line with dots on it and text beside it, and every
 * one of those three parts is placed on the HORIZONTAL axis — which is the axis
 * that mirrors. The usual build hardcodes all three:
 *
 *     absolute left-4 w-px          ← the rail
 *     -ml-1.5                       ← the dot, pulled back over it
 *     pl-10                         ← the text, pushed clear
 *
 * On a Persian page that produces a rail down the left, dots hanging off its
 * wrong side, and text that starts at the right and runs into the rail. It is
 * not subtly wrong; it is a broken component. And it looks perfect in every
 * screenshot an English-speaking reviewer takes.
 *
 * Here all three are logical — `start-*`, `-ms-*`, `ps-*` — so one class string
 * produces a rail on the reader's own leading edge in both scripts, with no
 * `rtl:` variant that someone can forget on the next dot they add.
 *
 * ═══ IT IS AN `<ol>`, AND THE ORDER IS THE INFORMATION ══════════════════════
 *
 * `<ul>` would be markup that renders identically and says something false. A
 * screen reader announces an ordered list as ordered, and the sequence is the
 * only reason a timeline exists rather than a stack of cards. The visible
 * numbering is suppressed with `list-none` because the dots ARE the numbering;
 * the semantics are not.
 *
 * ═══ THE MARKER IS THE CALLER'S, AND IT CARRIES NO NAME ═════════════════════
 *
 * `marker` takes an element rather than a variant name, because the icons that
 * belong on a timeline are the caller's domain — a truck, a tick, a warning —
 * and an enum here would be a list this file has to keep growing. What the file
 * DOES own is that the marker is decorative: the meaning is in
 * `TimelineTitle`, which is real text. A caller who puts an icon in without
 * `aria-hidden` gets a name announced twice; the docs on `marker` say so.
 */

export const timelineVariants = cva("relative flex list-none flex-col gap-6 p-0");

export const timelineItemVariants = cva(
  // `ps-10` clears the rail and the dot. Logical, so the text column starts on
  // the reader's own leading edge — see the file header.
  "relative ps-10",
  {
    variants: {
      /**
       * The rail's colour BELOW this item, and the dot's fill.
       *
       * The segment belongs to the item ABOVE it in reading order, which is the
       * only assignment that lets a timeline show progress: everything up to
       * the current step is drawn in its own tone and everything after is
       * neutral, from per-item classes alone with no index arithmetic.
       *
       * ── THE RAIL HALF OF THAT SENTENCE DID NOT RENDER ────────────────────
       *
       * It was one custom property, `--lumo-timeline-dot`, and
       * `timelineRailVariants` below read none of it — the rail was a flat
       * `bg-border` on every item. So `tone="positive"` painted the dot and
       * left the segment beneath it neutral, and the progress reading this
       * docblock describes was never available from any prop. A comment true in
       * intention and false in the present tense, which is exactly the shape
       * that survives review: the dot DOES change, so the tone looks wired.
       *
       * Two properties rather than one, because the neutral tone wants two
       * different greys: `border-strong` (neutral-300 on light) is what makes a
       * 7px dot read as a marker, and it is too heavy for a 1px line, where
       * `border` (neutral-200) is the library's hairline everywhere else.
       * Collapsing them would have changed every existing neutral timeline's
       * rail as the price of fixing the toned one.
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
  // `start-0` and not `left-0`. The dot sits ON the rail, so both are placed
  // from the same logical edge and cannot drift apart under mirroring.
  "absolute start-0 top-0 grid size-7 place-items-center rounded-full " +
    "border-2 border-bg bg-[var(--lumo-timeline-dot)] text-bg",
);

export const timelineRailVariants = cva(
  // Inset by half the dot so the line runs through their centres. `start-3.5`
  // is size-7 / 2; if the dot's size changes, this changes with it.
  //
  // The colour comes from the ITEM's `tone`, through the custom property
  // `timelineItemVariants` sets — see its docblock for what this used to be and
  // why a flat `bg-border` made half of that variant unreachable. The fallback
  // is the same hairline, so a rail drawn outside a toned item (a consumer who
  // composed one by hand from the exported cvas) is unchanged.
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
  /**
   * What sits in the dot — usually a small icon.
   *
   * DECORATIVE. Mark it `aria-hidden="true"`: the meaning of the step is in
   * `TimelineTitle`, and an icon with a name of its own announces the step
   * twice. Omit it entirely for a plain filled dot.
   */
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
      {/*
       * The rail is drawn by the item, not by the list, and that is what makes
       * per-step tone possible at all: a single line owned by the `<ol>` can
       * only ever be one colour. Suppressed on the last item — a segment
       * hanging below the final event is a promise of something that is not
       * there.
       */}
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
  /**
   * The already-formatted, already-localised time — «۱۹ مرداد ۱۴۰۵».
   *
   * A STRING and not a `Date`, deliberately. Formatting one here would need a
   * `locale` on every item, and it would put a `Date` in a file with no
   * `"use client"` — where the server's time zone, not the reader's, decides
   * which day it is. `formatDate` from `@lumo-ui/core` is the one formatter,
   * and it belongs at the call site that knows the locale.
   */
  children: LumoNode;
  /**
   * The machine-readable stamp for the `datetime` attribute — ISO 8601, and
   * therefore GREGORIAN, whatever calendar the visible text is in.
   *
   * That divergence is correct and is worth stating: `datetime` is consumed by
   * software, and ISO 8601 has no other calendar. «۱۹ مرداد ۱۴۰۵» beside
   * `datetime="2026-08-10"` is not an inconsistency; it is the same instant
   * written for two different readers.
   */
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
