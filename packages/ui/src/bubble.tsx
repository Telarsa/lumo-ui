import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Disclosure, DisclosurePanel, DisclosureTrigger } from "./disclosure.tsx";

/**
 * A conversational message bubble. No `"use client"` — a bubble is a styled div, so a
 * whole transcript renders on the server.
 *
 *     <BubbleGroup variant="sent">
 *       <Bubble variant="sent" grouping="first">سلام!</Bubble>
 *       <Bubble variant="sent" grouping="last">رسیدی خونه؟</Bubble>
 *     </BubbleGroup>
 *
 * "Sent" is a direction in the conversation, not on the screen: `sent` is `self-end`,
 * `received` is `self-start` (in Persian Telegram your own messages sit on the LEFT), and
 * the grouping corners are LOGICAL corners on the JOINED side. Two variants, not seven:
 * a chat is a dialogue, not a palette.
 */

export const bubbleVariants = cva(
  "relative w-fit max-w-[85%] min-w-0 rounded-2xl px-3.5 py-2 text-sm " +
    "leading-relaxed wrap-break-word",
  {
    variants: {
      variant: {
        sent: "self-end bg-accent text-accent-fg",
        received: "self-start bg-surface-sunken text-fg",
      },
      grouping: {
        single: "",
        first: "",
        middle: "",
        last: "",
      },
    },
    compoundVariants: [
      { variant: "sent", grouping: "first", class: "rounded-ee-md" },
      { variant: "sent", grouping: "middle", class: "rounded-se-md rounded-ee-md" },
      { variant: "sent", grouping: "last", class: "rounded-se-md" },
      { variant: "received", grouping: "first", class: "rounded-es-md" },
      { variant: "received", grouping: "middle", class: "rounded-ss-md rounded-es-md" },
      { variant: "received", grouping: "last", class: "rounded-ss-md" },
    ],
    defaultVariants: { grouping: "single" },
  },
);

export type BubbleVariant = "sent" | "received";
export type BubbleGrouping = "single" | "first" | "middle" | "last";

export interface BubbleProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  /** Whose message this is. REQUIRED: a bubble that guesses its sender renders confidently on the wrong side. */
  variant: BubbleVariant;
  /** Position within a run of consecutive bubbles from the same sender. */
  grouping?: BubbleGrouping | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Bubble({ variant, grouping = "single", className, ...props }: BubbleProps) {
  return (
    <div
      data-variant={variant}
      className={cn(bubbleVariants({ variant, grouping }), className)}
      {...props}
    />
  );
}

/** A run of bubbles from one sender: shared alignment and the tight gap that makes grouped corners read as one unit. */
export const bubbleGroupVariants = cva("flex w-full min-w-0 flex-col gap-0.5", {
  variants: {
    /** Which side of the conversation the group belongs to. */
    variant: {
      sent: "items-end",
      received: "items-start",
    },
  },
});

export interface BubbleGroupProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  /** Which side of the conversation the group belongs to. */
  variant: BubbleVariant;
  children?: LumoNode;
  className?: string | undefined;
}

export function BubbleGroup({ variant, className, ...props }: BubbleGroupProps) {
  return <div className={cn(bubbleGroupVariants({ variant }), className)} {...props} />;
}

/**
 * The reactions row, overlapping the bubble's block-end edge. Block-axis geometry plus a
 * `start-*`/`end-*` inline anchor. Counts are the caller's to format (`LumoNode`).
 */
export const bubbleReactionsVariants = cva(
  "absolute bottom-0 z-10 flex w-fit translate-y-2/3 items-center gap-1 " +
    "rounded-full border border-border bg-surface px-1.5 py-0.5 text-xs " +
    "text-fg shadow-raised",
  {
    variants: {
      align: {
        start: "start-2",
        end: "end-2",
      },
    },
    defaultVariants: { align: "end" },
  },
);

export interface BubbleReactionsProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  /** Which inline corner to hug. Defaults to the trailing (end) corner. */
  align?: "start" | "end" | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function BubbleReactions({ align = "end", className, ...props }: BubbleReactionsProps) {
  return <div className={cn(bubbleReactionsVariants({ align }), className)} {...props} />;
}

export interface BubbleCollapseProps {
  /** Visible AND announced text of the expand control, e.g. «نمایش بیشتر». REQUIRED. */
  label: string;
  /** Heading level for the trigger's outline entry, forwarded to Disclosure. */
  level?: number | undefined;
  /** Starts expanded, when the disclosure is uncontrolled. */
  defaultExpanded?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Collapsible long content inside a bubble, composed from Disclosure. The trigger uses
 * `text-current` so it inherits the bubble's own foreground.
 */
export function BubbleCollapse({
  label,
  level,
  defaultExpanded,
  className,
  children,
}: BubbleCollapseProps) {
  return (
    <Disclosure
      {...(defaultExpanded !== undefined ? { defaultExpanded } : {})}
      className={cn("w-full", className)}
    >
      <DisclosureTrigger
        {...(level !== undefined ? { level } : {})}
        // `hover:`, not `data-hovered:` (Base UI writes none). `text-current` keeps the trigger on the bubble's palette.
        className="gap-2 py-1 text-xs font-medium text-current hover:text-current hover:underline"
      >
        {label}
      </DisclosureTrigger>
      <DisclosurePanel className="pt-1 pb-0 text-sm text-current">{children}</DisclosurePanel>
    </Disclosure>
  );
}
