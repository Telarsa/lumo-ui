import type { ComponentProps, Ref } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * The composed chat row: avatar slot, bubbles, timestamp. No `"use client"` — a
 * transcript is content, and content renders on the server.
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
 * `sent` rows are `flex-row-reverse`, resolved against the writing direction. `MessageTime`
 * takes a STRING, never a Date: under `fa-IR` the caller's `formatDate` chooses Jalali,
 * and it is a `<time>` only when a machine-readable `dateTime` is supplied. Pinned-to-bottom
 * behaviour lives in `message-scroller.tsx`, a separate client module.
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
        // Reverses FLOW order, not physical order: the avatar lands at the inline end.
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

/** The avatar slot. `self-end` sits it on the last line of a multi-bubble run (block axis). */
export function MessageAvatar({ className, ...props }: MessageSectionProps) {
  return <div className={cn("shrink-0 self-end", className)} {...props} />;
}

/** The column beside the avatar: header, bubbles, time. Alignment follows the row's stamped variant. */
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
  // `ref` is widened to `HTMLElement` below: the root is a `<time>` or a `<span>`.
  extends Omit<ComponentProps<"time">, "children" | "className" | "dateTime" | "ref"> {
  /** The root, at the widest type both branches satisfy — `<time>` or `<span>`. Widened rather than dropped. */
  ref?: Ref<HTMLElement> | undefined;
  /** The ALREADY-FORMATTED timestamp, e.g. `formatDate(at, locale, …)` — «۱۴:۰۵» under fa-IR. A string by design. */
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
