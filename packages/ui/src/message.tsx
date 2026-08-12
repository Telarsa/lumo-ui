import type { ComponentProps, Ref } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * The composed chat row: avatar slot, bubbles, timestamp.
 *
 *     <Message variant="received">
 *       <MessageAvatar><Avatar initials="س م" /></MessageAvatar>
 *       <MessageBody>
 *         <MessageHeader>سارا محمدی</MessageHeader>
 *         <Bubble variant="received">سلام! فایل رو دیدی؟</Bubble>
 *         <MessageTime value={formatDate(at, locale, { hour: "2-digit", minute: "2-digit" })} />
 *       </MessageBody>
 *     </Message>
 *
 * No `"use client"` — a transcript is content, and content renders on the
 * server. Every slot is a styled div; the bubbles inside carry their own
 * geometry (bubble.tsx).
 *
 * `sent` rows are `flex-row-reverse`, which is resolved against the writing
 * direction like every flex keyword: the avatar lands on the reading END in
 * both scripts. There is no `right-*` anywhere in this file to disagree with
 * Persian.
 *
 * ── `MessageTime` takes a STRING, never a Date ──────────────────────────────
 * The caller formats, through `formatDate` — because under `fa-IR` that means
 * the Jalali calendar, and a component that accepted a `Date` would have to
 * choose the calendar itself, silently, for every consumer. A string prop is
 * the same decision `LumoNode` forces for numbers: by the time it is a string,
 * someone chose the representation. The element is a `<time>` only when a
 * machine-readable `dateTime` is supplied; a bare `<time>` whose content is
 * «دیروز ۱۴:۰۵» is invalid HTML, so without `dateTime` it renders a span.
 *
 * ═══ MessageScroller: MEASURED, AND NOT BUILT — READ BEFORE REACHING FOR IT ═
 *
 * The obvious companion is a pinned-to-bottom scroll container with a «پیام
 * تازه» affordance. The honest line count for a CORRECT one, itemized:
 *
 *   - scroll-position bookkeeping to know whether the reader is "at" the
 *     bottom (a threshold, not equality — subpixel scroll heights make
 *     `scrollTop === scrollHeight - clientHeight` false at rest);
 *   - a flag distinguishing programmatic scrolls from reader scrolls, or the
 *     auto-pin re-engages the moment it scrolls and the reader can never
 *     leave the bottom;
 *   - a ResizeObserver AND a MutationObserver (or per-image load handlers),
 *     because content grows after append — images, fonts — and each growth
 *     must re-pin only if pinned before it;
 *   - the affordance itself: live-region politeness, a REQUIRED label, unread
 *     count through formatNumber, dismiss-on-arrival;
 *   - reduced-motion handling for the smooth scroll.
 *
 * That is 200+ lines of bookkeeping (the reference implementation this space
 * uses, use-stick-to-bottom, spends ~700 on it), every line of it untestable
 * in jsdom, where scrollHeight, clientHeight and scrollTop are all 0 and every
 * assertion passes vacuously. The CSS shortcuts are worse: reversed
 * flex-column keeps DOM order and reading order opposed — a screen reader
 * walks the transcript backwards — and scroll anchoring via `overflow-anchor`
 * is absent from Safari. A scroller that half-works steals the reader's scroll
 * position; a missing one costs the consumer `scrollIntoView` on append. So it
 * is not here, deliberately. If it becomes real, it is a client component in
 * its own file with its affordance strings required, and this note moves there
 * as its spec.
 */

export const messageGroupVariants = cva("flex w-full min-w-0 flex-col gap-4");

export interface MessageSectionProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function MessageGroup({ className, ...props }: MessageSectionProps) {
  return <div className={cn(messageGroupVariants(), className)} {...props} />;
}

export const messageVariants = cva(
  "group/lumo-message flex w-full min-w-0 items-end gap-2",
  {
    variants: {
      variant: {
        received: "",
        // Reverses FLOW order, not physical order: the avatar written first in
        // JSX lands at the inline end — the right in English, the left in
        // Persian — with no physical utility involved.
        sent: "flex-row-reverse",
      },
    },
  },
);

export type MessageVariant = "sent" | "received";

export interface MessageProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  /** Whose row this is. REQUIRED, for the reason bubble.tsx gives. */
  variant: MessageVariant;
  children?: LumoNode;
  className?: string | undefined;
}

export function Message({ variant, className, ...props }: MessageProps) {
  return (
    <div
      data-variant={variant}
      className={cn(messageVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * The avatar slot. `self-end` sits it on the last line of a multi-bubble run,
 * the convention every messenger shares — block-axis alignment, so it needs no
 * direction handling.
 */
export function MessageAvatar({ className, ...props }: MessageSectionProps) {
  return <div className={cn("shrink-0 self-end", className)} {...props} />;
}

/**
 * The column beside the avatar: header, bubbles, time. Alignment follows the
 * row's stamped variant, so bubbles and timestamp hug the correct inline edge
 * without each child restating it.
 */
export const messageBodyVariants = cva(
  "flex max-w-full min-w-0 flex-1 flex-col gap-0.5 " +
    "group-data-[variant=sent]/lumo-message:items-end " +
    "group-data-[variant=received]/lumo-message:items-start",
);

export function MessageBody({ className, ...props }: MessageSectionProps) {
  return <div className={cn(messageBodyVariants(), className)} {...props} />;
}

/** The sender line above the first bubble. */
export function MessageHeader({ className, ...props }: MessageSectionProps) {
  return (
    <div
      className={cn("flex max-w-full min-w-0 items-center gap-2 px-1 text-xs font-medium text-fg-muted", className)}
      {...props}
    />
  );
}

export interface MessageTimeProps
  extends Omit<ComponentProps<"time">, "children" | "className" | "dateTime" | "ref"> {
  /**
   * The root, at the widest type both branches satisfy — `<time>` when
   * `dateTime` is supplied and `<span>` when it is not. Widened rather than
   * dropped; see `props.ts`'s contract.
   */
  ref?: Ref<HTMLElement> | undefined;
  /**
   * The ALREADY-FORMATTED timestamp, e.g. `formatDate(at, locale, …)` —
   * «۱۴:۰۵» under fa-IR, in Jalali when the options ask for a date. A string
   * by design; see the file header.
   */
  value: string;
  /** Machine-readable instant (ISO 8601). Supplying it upgrades the span to `<time>`. */
  dateTime?: string | undefined;
  className?: string | undefined;
}

export function MessageTime({ value, dateTime, className, ...props }: MessageTimeProps) {
  const classes = cn("px-1 text-xs text-fg-subtle", className);
  return dateTime !== undefined ? (
    <time dateTime={dateTime} className={classes} {...(props as ComponentProps<"time">)}>
      {value}
    </time>
  ) : (
    <span className={classes} {...(props as ComponentProps<"span">)}>
      {value}
    </span>
  );
}
