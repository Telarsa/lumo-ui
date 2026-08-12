import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Disclosure, DisclosurePanel, DisclosureTrigger } from "./disclosure.tsx";

/**
 * A conversational message bubble.
 *
 *     <BubbleGroup variant="sent">
 *       <Bubble variant="sent" grouping="first">سلام!</Bubble>
 *       <Bubble variant="sent" grouping="last">رسیدی خونه؟</Bubble>
 *     </BubbleGroup>
 *
 * No `"use client"` — a bubble is a styled div, so a whole chat transcript
 * renders on the server. `BubbleCollapse` composes the Disclosure client
 * component; its props are strings, so a server tree can still use it.
 *
 * ═══ "SENT" IS A DIRECTION IN THE CONVERSATION, NOT ON THE SCREEN ═══════════
 *
 * Every chat UI puts the reader's own messages on one side, and nearly every
 * implementation writes that side down as `right`. It is not the right — it is
 * the reading END. In Persian Telegram and WhatsApp your own messages sit on
 * the LEFT, because the whole conversation mirrors with the script. So:
 *
 *   - `sent` is `self-end`, `received` is `self-start`. Flexbox resolves both
 *     against the container's direction, so the sent side is the physical
 *     right in English and the physical left in Persian with zero RTL code.
 *   - The grouping corners are LOGICAL corners. Consecutive bubbles from one
 *     sender square off the corners on the JOINED side — the side the bubbles
 *     hug, which is the end side for sent and the start side for received.
 *     `rounded-se`/`rounded-ee`/`rounded-ss`/`rounded-es` name exactly those
 *     corners in both scripts; the tl/tr/bl/br spellings are the single most
 *     copied chat-UI defect and are banned by lint here anyway.
 *
 * The vendored shape (shadcn aria-vega `bubble`) fails both halves: its end
 * alignment exists but its reactions row is pinned with physical inset-left /
 * inset-right, and it has no grouping geometry at all. Its seven color variants
 * collapse here to the two the conversation actually has — sent (accent) and
 * received (surface) — because a chat is a dialogue, not a palette.
 *
 * ── Grouping ────────────────────────────────────────────────────────────────
 * `single` (default) keeps all four corners large. In a run, the FIRST bubble
 * squares its block-end corner on the joined side, MIDDLE squares both, LAST
 * squares its block-start corner — the classic tail-less grouped look. The
 * block axis never mirrors, so only the inline half of each corner pair
 * changes between sent and received.
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
  /**
   * Whose message this is. REQUIRED rather than defaulted: a bubble that
   * guesses its sender renders confidently on the wrong side, and the wrong
   * side is the one mistake a transcript cannot absorb.
   */
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

/**
 * A run of bubbles from one sender. Carries the shared alignment so a map over
 * messages does not restate it, and provides the tight gap that makes the
 * squared grouping corners read as one unit.
 */
export const bubbleGroupVariants = cva("flex w-full min-w-0 flex-col gap-0.5", {
  variants: {
    variant: {
      sent: "items-end",
      received: "items-start",
    },
  },
});

export interface BubbleGroupProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  variant: BubbleVariant;
  children?: LumoNode;
  className?: string | undefined;
}

export function BubbleGroup({ variant, className, ...props }: BubbleGroupProps) {
  return <div className={cn(bubbleGroupVariants({ variant }), className)} {...props} />;
}

/**
 * The reactions row, overlapping the bubble's block-end edge.
 *
 * `bottom-0` plus a translate is all block-axis geometry — direction-neutral —
 * and the inline anchor is `start-*`/`end-*`, which is the line upstream wrote
 * physically. Counts inside are the caller's to format: `LumoNode` refuses a
 * bare number, so «۲» arrives via formatNumber and cannot arrive as `2`.
 */
export const bubbleReactionsVariants = cva(
  "absolute bottom-0 z-10 flex w-fit translate-y-2/3 items-center gap-1 " +
    "rounded-full border border-border bg-surface px-1.5 py-0.5 text-xs " +
    "text-fg shadow-sm",
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
  /**
   * Visible AND announced text of the expand control, e.g. «نمایش بیشتر».
   *
   * REQUIRED — the control is the only way to reach the hidden content, and a
   * library default would be an English phrase inside a Persian bubble.
   */
  label: string;
  /**
   * Heading level for the trigger's outline entry, forwarded to Disclosure.
   * Long quoted content in a bubble is genuinely navigable structure; if the
   * transcript's headings make that wrong for a page, set the level that fits.
   */
  level?: number | undefined;
  defaultExpanded?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Collapsible long content inside a bubble, composed from Disclosure rather
 * than re-implemented: `Disclosure` supplies aria-expanded, aria-controls and
 * the keyboard handling, and its chevron already rotates a half turn — its own
 * mirror image, safe in both scripts (disclosure.tsx records why).
 *
 * The trigger restates its colors as `text-current` so it inherits the
 * bubble's own foreground — accent-fg inside a sent bubble, fg inside a
 * received one — instead of Disclosure's document-level palette.
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
        /*
         * `hover:` and not `data-hovered:`. React Aria wrote a `data-hovered`
         * attribute; Base UI writes none at all, so these two utilities matched
         * nothing from the day `disclosure.tsx` changed engines — the trigger
         * inside a bubble had no hover affordance whatever. Dead classes are
         * the quietest kind of rot: they compile, they lint, and the only
         * symptom is an interaction that never happens.
         *
         * `text-current` is kept deliberately. A bubble sets its own foreground
         * (a sent bubble is on the accent fill), and the underline is the whole
         * hover signal — recolouring it would take the trigger off the bubble's
         * palette for the one state where it matters most.
         */
        className="gap-2 py-1 text-xs font-medium text-current hover:text-current hover:underline"
      >
        {label}
      </DisclosureTrigger>
      <DisclosurePanel className="pt-1 pb-0 text-sm text-current">{children}</DisclosurePanel>
    </Disclosure>
  );
}
