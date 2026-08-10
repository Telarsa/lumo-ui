"use client";

import { useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cva } from "class-variance-authority";
import { cn, direction, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * Two panes and a draggable divider.
 *
 *     <Resizable
 *       locale="fa-IR"
 *       label="تغییر اندازهٔ ستون‌ها"
 *       sizeLabel={(v) => `${v} درصد`}
 *       startPanel={<FileTree …/>}
 *       endPanel={<Editor …/>}
 *     />
 *
 * ── WHY THIS IS HAND-WRITTEN, MEASURED FIRST ────────────────────────────────
 *
 * Vendor-first was followed: shadcn's aria-vega `resizable` exists and was
 * emitted — and it is a 50-line skin over `react-resizable-panels`, a NEW
 * runtime dependency. The workspace policy pins anything that changes rendered
 * output exactly and routes it through a reviewed bump; adopting a whole
 * layout engine to draw one divider inverts the build-vs-rent call table.tsx
 * already settled for the same interaction: React Aria's ColumnResizer showed
 * the pattern is a `role="separator"` with value semantics and a localised
 * `aria-valuetext`. That pattern is ~180 lines by hand — under the 400-line
 * pin threshold — so it is built, on the worked example's terms.
 *
 * ── THE COLUMN-SIZE LESSON, APPLIED BY CONSTRUCTION ─────────────────────────
 *
 * table.tsx's resizer announced "{value} pixels" from React Aria's bundle and
 * needed a patch to say «۱۸۰ پیکسل». Here the announced size never passes
 * through a bundle at all: `aria-valuetext` is built from the REQUIRED
 * `sizeLabel` prop, whose argument arrives already formatted by
 * `formatNumber(size, locale)` — the same contract as `Pagination.pageLabel`
 * and `Rating.valueLabel`, so «۳۰ درصد» is expressible and `30 درصد` is not.
 * `aria-valuenow`/`min`/`max` stay numeric attributes: they are machine state
 * (what `aria-valuetext` exists to override), like `aria-colindex` in RAC's
 * own grid.
 *
 * ── DIRECTION, IN EXACTLY TWO PLACES ────────────────────────────────────────
 *
 * The layout needs NO direction code: the panes are flex children on the
 * inline axis, so the start pane sits right in Persian by flex order alone
 * (`flex-row-reverse` is the classic wrong fix — toolbar.tsx explains).
 * Direction enters only where physical input meets logical state:
 *
 *  1. POINTER. The drag position is resolved against the group's box —
 *     distance from the LEFT edge in LTR is distance from the RIGHT edge in
 *     RTL, so the fraction is flipped under `rtl`. Position-based rather than
 *     delta-based, so the divider tracks the pointer even after it leaves and
 *     re-enters the box.
 *  2. KEYBOARD. Per the WAI-ARIA window-splitter pattern the arrows are
 *     PHYSICAL — ArrowLeft moves the divider left, in both scripts, because
 *     the divider is a thing on screen, not an item in reading order. Moving
 *     it left GROWS the start pane in Persian and shrinks it in English, so
 *     the physical key maps to a logical delta through the same `dir` term
 *     the pointer uses. Home/End are logical: Home collapses the START pane
 *     to `minSize`, whichever side that is.
 *
 * `dir` comes from `direction(locale)` — the locale is a prop, as on Slider,
 * so the math cannot disagree with the page the way a hand-read `document.dir`
 * could during SSR (there is no document to read; first paint must be right).
 */

const KEYBOARD_STEP = 5;

export const resizableVariants = cva("flex w-full", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

export const resizablePanelVariants = cva("min-h-0 min-w-0 overflow-hidden");

export const resizableHandleVariants = cva(
  // The visible bar is 1 unit thick; the GRAB target grows through the
  // transparent pseudo-element, exactly the tag-group remove-button technique:
  // the target changes, the layout does not. `cursor-col-resize` names the
  // inline axis, which is the same axis in both scripts (see table.tsx).
  // Plain CSS `hover:`/`focus-visible:` rather than RAC's `data-hovered`
  // family: this element is a hand-owned div, so the DOM's own states are the
  // truth here — there is no RAC layer publishing data attributes to mirror.
  "relative shrink-0 rounded-full bg-border outline-none transition-colors " +
    "touch-none select-none " +
    "hover:bg-border-strong " +
    "data-resizing:bg-accent focus-visible:bg-accent " +
    "after:absolute after:content-['']",
  {
    variants: {
      orientation: {
        horizontal: "w-1 cursor-col-resize after:-inset-x-2 after:inset-y-0",
        vertical: "h-1 cursor-row-resize after:inset-x-0 after:-inset-y-2",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface ResizableProps {
  /** Drives digits and drag/arrow direction. As on Slider: a prop, not a guess. */
  locale: Locale;
  /** Announced name of the divider, e.g. «تغییر اندازهٔ ستون‌ها». Required. */
  label: string;
  /**
   * Builds `aria-valuetext` from the ALREADY-FORMATTED percentage, e.g.
   * ``(v) => `${v} درصد` `` → «۳۰ درصد». REQUIRED, and a function for the
   * reason recorded in tag-group.tsx: word order is authored, not assembled.
   */
  sizeLabel: (formattedPercent: string) => string;
  /** Content of the pane on the inline-start (or block-start) side. */
  startPanel: LumoNode;
  /** Content of the other pane. */
  endPanel: LumoNode;
  /**
   * `horizontal` splits along the inline axis (panes side by side) and is the
   * direction-sensitive case; `vertical` stacks panes on the block axis.
   */
  orientation?: "horizontal" | "vertical";
  /** Initial start-pane share, in percent. Uncontrolled. */
  defaultSize?: number;
  /** Smallest share the start pane can be dragged to, in percent. */
  minSize?: number;
  /** Largest share the start pane can be dragged to, in percent. */
  maxSize?: number;
  /** Observes committed sizes, e.g. to persist a layout. Integer percent. */
  onResize?: (percent: number) => void;
  className?: string | undefined;
}

export function Resizable({
  locale,
  label,
  sizeLabel,
  startPanel,
  endPanel,
  orientation = "horizontal",
  defaultSize = 50,
  minSize = 15,
  maxSize = 85,
  onResize,
  className,
}: ResizableProps) {
  const [size, setSize] = useState(() => clamp(Math.round(defaultSize), minSize, maxSize));
  const [resizing, setResizing] = useState(false);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const startPanelId = useId();
  const rtl = direction(locale) === "rtl";
  const horizontal = orientation === "horizontal";

  const commit = (next: number) => {
    const clamped = clamp(Math.round(next), minSize, maxSize);
    setSize(clamped);
    onResize?.(clamped);
  };

  const fromPointer = (event: { clientX: number; clientY: number }) => {
    const rect = groupRef.current?.getBoundingClientRect();
    if (rect === undefined || rect.width === 0 || rect.height === 0) return;
    const fraction = horizontal
      ? (event.clientX - rect.left) / rect.width
      : (event.clientY - rect.top) / rect.height;
    // In RTL the start pane grows toward the LEFT edge, so the fraction from
    // the left is the END pane's share — flip it. The block axis never flips.
    commit((horizontal && rtl ? 1 - fraction : fraction) * 100);
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    // Physical arrows, logical delta — see the header. `sign` is the one place
    // the two meet: +1 grows the start pane.
    let sign = 0;
    if (horizontal && event.key === "ArrowLeft") sign = rtl ? 1 : -1;
    else if (horizontal && event.key === "ArrowRight") sign = rtl ? -1 : 1;
    else if (!horizontal && event.key === "ArrowUp") sign = -1;
    else if (!horizontal && event.key === "ArrowDown") sign = 1;
    else if (event.key === "Home") {
      event.preventDefault();
      commit(minSize);
      return;
    } else if (event.key === "End") {
      event.preventDefault();
      commit(maxSize);
      return;
    } else return;
    event.preventDefault();
    commit(size + sign * KEYBOARD_STEP);
  };

  return (
    <div ref={groupRef} className={cn(resizableVariants({ orientation }), className)}>
      <div
        id={startPanelId}
        className={resizablePanelVariants()}
        style={horizontal ? { inlineSize: `${size}%` } : { blockSize: `${size}%` }}
      >
        {startPanel}
      </div>
      <div
        data-lumo=""
        role="separator"
        // The divider between side-by-side panes is itself a VERTICAL bar —
        // aria-orientation names the separator, not the layout.
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-label={label}
        aria-controls={startPanelId}
        aria-valuenow={size}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        aria-valuetext={sizeLabel(formatNumber(size, locale))}
        tabIndex={0}
        {...(resizing ? { "data-resizing": "" } : {})}
        className={resizableHandleVariants({ orientation })}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setResizing(true);
          fromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event);
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setResizing(false);
        }}
      />
      <div className={cn(resizablePanelVariants(), "flex-1")}>{endPanel}</div>
    </div>
  );
}
