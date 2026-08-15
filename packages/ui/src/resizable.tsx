"use client";

import { useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cva } from "class-variance-authority";
import { cn, direction, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * Two panes and a draggable divider. Hand-written rather than a skin over
 * `react-resizable-panels`: the pattern is a `role="separator"` with value
 * semantics, and `aria-valuetext` is built from the REQUIRED `sizeLabel` over
 * an already-formatted number, so no bundle string is ever announced. Layout
 * needs no direction code (flex order mirrors); direction enters in exactly
 * two places — the pointer fraction is flipped under RTL, and the arrows are
 * PHYSICAL per the window-splitter pattern, so ArrowLeft grows the start pane
 * in Persian and shrinks it in English. Home/End are logical.
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
  // The visible bar is 1 unit thick; the GRAB target grows through the transparent pseudo-element.
  "relative shrink-0 rounded-full bg-border outline-none transition-colors " +
    "touch-none select-none " +
    "hover:bg-border-strong " +
    // No `focus-visible:` fill: `data-lumo` rings it, and the fill matched `data-resizing`.
    "data-resizing:bg-accent " +
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
  /** Builds `aria-valuetext` from the ALREADY-FORMATTED percentage, e.g. ``(v) => `${v} درصد` ``. REQUIRED. */
  sizeLabel: (formattedPercent: string) => string;
  /** Content of the pane on the inline-start (or block-start) side. */
  startPanel: LumoNode;
  /** Content of the other pane. */
  endPanel: LumoNode;
  /** `horizontal` splits along the inline axis (direction-sensitive); `vertical` stacks on the block axis. */
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
  if (minSize > maxSize) {
    throw new RangeError("Resizable minSize must be less than or equal to maxSize.");
  }
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
    // In RTL the fraction from the left is the END pane's share — flip it.
    commit((horizontal && rtl ? 1 - fraction : fraction) * 100);
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    // Physical arrows, logical delta: +1 grows the start pane.
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
        // aria-orientation names the separator bar, not the layout.
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
