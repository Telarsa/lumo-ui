"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ArrowDownIcon } from "lucide-react";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A transcript that stays pinned to the newest message — until the reader scrolls
 * back, and then does not fight them.
 *
 *     <MessageScroller label="گفت‌وگو" jumpLabel="رفتن به آخرین پیام">
 *       <MessageGroup>…</MessageGroup>
 *     </MessageScroller>
 *
 * ONE RULE: follow the bottom only while the reader is already at the bottom. The
 * pinned state is measured from the element on scroll (no "user scrolled" flag), with a
 * tolerance rather than an equality (sub-pixel residue, plus grace for a wheel nudge).
 * `role="log"` + `aria-live="polite"`; the jump button is `end-`, not `right-`; `label`
 * and `jumpLabel` are required. `column-reverse` is deliberately not used: it reverses
 * DOM order, so a screen reader would read the conversation backwards.
 */

/** How close to the bottom still counts as "at the bottom", in CSS pixels. */
const BOTTOM_TOLERANCE = 24;

export const messageScrollerVariants = cva(
  // `relative` anchors the floating jump button.
  "relative flex min-h-0 flex-1 flex-col",
);

export const messageScrollerViewportVariants = cva(
  "flex-1 overflow-y-auto overscroll-contain scroll-smooth motion-reduce:scroll-auto p-4",
);

export const messageScrollerJumpVariants = cva(
  // `end-`, never `right-`.
  "absolute bottom-4 end-4 inline-flex items-center gap-1.5 rounded-full " +
    "border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg " +
    // `active:` because this pill is tapped, not hovered; the smooth scroll takes ~300ms.
    "shadow-overlay transition-colors hover:bg-surface-hover active:translate-y-px",
);

export interface MessageScrollerProps {
  /** Announced name of the transcript. Required — no default, because a default would be English. */
  label: string;
  /** Name of the jump-to-latest button. Required — it is an icon. */
  jumpLabel: string;
  children?: LumoNode;
  /** Class for the outer box. */
  className?: string | undefined;
  /** Class for the scrolling viewport itself. */
  viewportClassName?: string | undefined;
}

export function MessageScroller({
  label,
  jumpLabel,
  children,
  className,
  viewportClassName,
}: MessageScrollerProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Kept TWICE on purpose: `pinnedRef` is what the ResizeObserver reads (once content has
  // grown, the element can no longer say where the reader WAS); `isPinned` is what React renders.
  const pinnedRef = React.useRef(true);
  const [isPinned, setIsPinned] = React.useState(true);

  const setPinned = React.useCallback((next: boolean) => {
    pinnedRef.current = next;
    setIsPinned(next);
  }, []);

  const measure = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    setPinned(distance <= BOTTOM_TOLERANCE);
  }, [setPinned]);

  const jump = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
    setPinned(true);
  }, [setPinned]);

  // Follow the bottom when content grows — a `ResizeObserver` on the content, not an effect on
  // `children`, so a streamed token or a loading image counts. Feature-detected: jsdom has none.
  React.useEffect(() => {
    const viewport = viewportRef.current;
    const content = viewport?.firstElementChild;
    if (!viewport || !content) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      // The ref, not the state — by now the content has ALREADY grown.
      if (pinnedRef.current) viewport.scrollTop = viewport.scrollHeight;
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
    };
    // Empty deps: the observer reads a ref, so it never needs rebuilding.
  }, []);

  // The one unconditional scroll: the first paint is at the top.
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);

  return (
    <div data-lumo="" className={cn(messageScrollerVariants(), className)}>
      <div
        ref={viewportRef}
        // `log`, not `region`: new children are new EVENTS rather than a re-render.
        role="log"
        aria-live="polite"
        aria-label={label}
        // Focusable so a keyboard user can scroll it at all.
        tabIndex={0}
        onScroll={measure}
        className={cn(messageScrollerViewportVariants(), viewportClassName)}
      >
        {/* One wrapper whose height IS the content height, for the ResizeObserver. */}
        <div>{children as React.ReactNode}</div>
      </div>

      {/* Rendered only when unpinned: a `hidden` button that does nothing is worse than none. */}
      {isPinned ? null : (
        <button
          type="button"
          data-lumo=""
          onClick={jump}
          aria-label={jumpLabel}
          className={messageScrollerJumpVariants()}
        >
          <ArrowDownIcon aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </div>
  );
}
