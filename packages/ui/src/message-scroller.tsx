"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ArrowDownIcon } from "lucide-react";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A transcript that stays pinned to the newest message — until the reader
 * scrolls back, and then does not fight them.
 *
 *     <MessageScroller
 *       label="گفت‌وگو"
 *       jumpLabel="رفتن به آخرین پیام"
 *     >
 *       <MessageGroup>…</MessageGroup>
 *     </MessageScroller>
 *
 * ═══ THE WHOLE COMPONENT IS ONE RULE ════════════════════════════════════════
 *
 * *Follow the bottom only while the reader is already at the bottom.*
 *
 * Everything else here is the consequence. A chat view that scrolls to the end
 * unconditionally yanks a reader out of the message they went back to read,
 * every time anyone types; one that never scrolls leaves them staring at an old
 * message while the conversation moves on below. Both are worse than no
 * autoscroll, and both are what you get from `scrollTop = scrollHeight` in an
 * effect.
 *
 * So the pinned state is measured from the element, once per scroll, and the
 * autoscroll is conditional on it. There is no "user has scrolled" flag to get
 * out of step, because the DOM already knows the answer — the same rule
 * `button.tsx` states as "no `useState` mirrors what the DOM says".
 *
 * ═══ WHY `scrollTop` NEEDS A TOLERANCE, NOT AN EQUALITY ═════════════════════
 *
 * `scrollTop + clientHeight === scrollHeight` is false at the bottom of a great
 * many real scrollers. Fractional device pixels, a zoom level that is not 100%,
 * and sub-pixel line heights all leave a residue under one pixel, and browsers
 * disagree about which way they round it. An equality test therefore reports
 * "not at the bottom" for a reader who is plainly at the bottom, and the
 * transcript silently stops following.
 *
 * `BOTTOM_TOLERANCE` is 24px rather than 1px on purpose: it is also the answer
 * to "the reader nudged the wheel by one notch and did not mean to unpin".
 *
 * ═══ WHAT MAKES THIS A LUMO COMPONENT RATHER THAN A DIV ═════════════════════
 *
 *  1. **`role="log"` with `aria-live="polite"`.** A message arriving is a
 *     change no sighted-reader affordance announces; without a live region a
 *     screen reader user learns about it only by navigating there. `polite`
 *     rather than `assertive` because a transcript is not an alert, and
 *     `aria-relevant` is left at its default (`additions text`) so an edited
 *     message is announced but a deleted one is not re-read.
 *
 *  2. **The jump button is `end-`, not `right-`.** It floats over the
 *     transcript, and on a Persian page it belongs on the LEFT. One logical
 *     class does that in both scripts with no `rtl:` variant to forget.
 *
 *  3. **`label` and `jumpLabel` are required props.** A scrollable region with
 *     no name is announced as "scroll area" and nothing else, and the jump
 *     button is an icon — `named-controls` in `lumo-gate` fails the build on
 *     either. There is no default, because a default would be English.
 *
 * ═══ THE SERVER RENDER IS THE BOTTOM, WHICH IS FREE ═════════════════════════
 *
 * `scrollTop` cannot be set on the server, so the first paint is at the TOP of
 * the transcript and the effect scrolls it down — a visible jump on a slow
 * connection. `column-reverse` would fix that with no JavaScript, and is
 * deliberately not used: it reverses the DOM order of the messages, so a screen
 * reader reads the conversation backwards and Tab walks it backwards. A
 * one-frame jump is a much smaller defect than a transcript that is announced
 * newest-first.
 *
 * `"use client"`: the pinned state is measured from a live element.
 */

/**
 * How close to the bottom still counts as "at the bottom", in CSS pixels.
 *
 * See the header — this is a tolerance for sub-pixel rounding AND the grace for
 * an accidental nudge, and both want the same number.
 */
const BOTTOM_TOLERANCE = 24;

export const messageScrollerVariants = cva(
  // `relative` anchors the floating jump button. `overscroll-contain` stops a
  // flick that reaches the end of the transcript from scrolling the page behind
  // it — the defect that makes a chat panel inside a page feel broken on touch.
  "relative flex min-h-0 flex-1 flex-col",
);

export const messageScrollerViewportVariants = cva(
  "flex-1 overflow-y-auto overscroll-contain scroll-smooth p-4",
);

export const messageScrollerJumpVariants = cva(
  // `end-`, never `right-`. See the header.
  "absolute bottom-4 end-4 inline-flex items-center gap-1.5 rounded-full " +
    "border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg " +
    "shadow-md transition-colors hover:bg-surface-hover",
);

export interface MessageScrollerProps {
  /**
   * Announced name of the transcript. Required.
   *
   * A scrollable region with no name is announced as "scroll area" and nothing
   * else. There is no default because a default would be English.
   */
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

  /*
   * The pinned state is kept TWICE, on purpose, and the duplication is the
   * whole trick rather than an oversight.
   *
   *   `pinnedRef`    is what the ResizeObserver reads. It has to be a ref: once
   *                  content has grown, the element can no longer answer "was
   *                  the reader at the bottom BEFORE this?" — the distance to
   *                  the bottom is large either way. The answer has to have
   *                  been recorded at the last scroll, and a ref is the only
   *                  thing an observer callback can read without being torn
   *                  down and rebuilt on every change.
   *
   *   `isPinned`     is what React renders the jump button from.
   *
   * Written together in one place so they cannot drift.
   */
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

  /*
   * Follow the bottom when content grows — and ONLY then.
   *
   * A `ResizeObserver` on the content rather than a `useEffect` on `children`:
   * a message that grows after it arrives (an image finishing loading, a
   * streamed reply appending a token) changes the scroll height without
   * changing the React tree, so a children-keyed effect misses exactly the case
   * a chat view is built for.
   *
   * Feature-detected for the same reason `virtualizer.ts` documents: jsdom has
   * no `ResizeObserver`, and a hook that throws from inside an effect makes the
   * component unrenderable in any consumer's test suite. Without it the
   * transcript simply does not auto-follow, which is a degradation rather than
   * a crash.
   */
  React.useEffect(() => {
    const viewport = viewportRef.current;
    const content = viewport?.firstElementChild;
    if (!viewport || !content) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      // The ref, not the state — see the block where both are declared. By the
      // time this fires the content has ALREADY grown, so the element can no
      // longer be asked where the reader was.
      if (pinnedRef.current) viewport.scrollTop = viewport.scrollHeight;
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
    };
    // Empty deps: the observer reads a ref, so it never needs rebuilding — and
    // rebuilding it on every scroll is how this kind of hook ends up missing
    // the resize it exists for.
  }, []);

  /* The one unconditional scroll: the first paint is at the top (see header). */
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);

  return (
    <div data-lumo="" className={cn(messageScrollerVariants(), className)}>
      <div
        ref={viewportRef}
        // `log` and not `region`: a transcript is a running record, and the
        // role is what tells a screen reader that new children are new EVENTS
        // rather than a re-render.
        role="log"
        aria-live="polite"
        aria-label={label}
        // Focusable so a keyboard user can scroll it at all. A scrollable box
        // with no tab stop is reachable only by dragging, which is the defect
        // `scroll-area.tsx` records at length.
        tabIndex={0}
        onScroll={measure}
        className={cn(messageScrollerViewportVariants(), viewportClassName)}
      >
        {/*
         * One wrapper, because the ResizeObserver needs a single element whose
         * height IS the content height. Observing the viewport instead would
         * report the viewport's own fixed height and never fire.
         */}
        <div>{children as React.ReactNode}</div>
      </div>

      {/*
       * Rendered only when unpinned, rather than always-rendered-and-hidden. A
       * `hidden` button is still a `hidden` button, and a control that is
       * announced but does nothing is worse than one that is absent — the same
       * call `hover-card.tsx` makes for `isDisabled`.
       */}
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
