"use client";

import { useEffect, useRef, useState, type ComponentProps, type Key } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A single-row collection that replaces items which no longer fit with a
 * caller-authored overflow affordance.
 *
 * `initialVisibleItems` is required because a server cannot measure a
 * container. The served bytes therefore contain a deliberate window rather
 * than either every action (which flashes away on hydration) or no actions (a
 * vacuous first-byte pass). Once mounted, every item remains in the DOM exactly
 * once: overflowed entries are inert, hidden from the accessibility tree and
 * positioned out of flow so they can still be measured for grow-back.
 */

export const overflowListVariants = cva(
  "relative flex min-w-0 items-center overflow-hidden whitespace-nowrap",
);
export const overflowListItemVariants = cva("min-w-0 shrink-0");
export const overflowListMeasureVariants = cva(
  "pointer-events-none invisible absolute shrink-0",
);

export interface OverflowListEntry<T> {
  item: T;
  index: number;
  key: Key;
}

export interface OverflowFitInput {
  availableSize: number;
  itemSizes: readonly number[];
  overflowSize: number;
  gap: number;
  minVisibleItems: number;
  maxVisibleItems: number;
  collapseFrom?: "start" | "end" | undefined;
}

/** Pure fitting arithmetic; exported so layout policy is testable without DOM mocks. */
export function fitOverflowItems({
  availableSize,
  itemSizes,
  overflowSize,
  gap,
  minVisibleItems,
  maxVisibleItems,
  collapseFrom = "end",
}: OverflowFitInput): number {
  const total = itemSizes.length;
  const minimum = Math.min(total, Math.max(0, Math.trunc(minVisibleItems)));
  const maximum = Math.min(total, Math.max(minimum, Math.trunc(maxVisibleItems)));

  for (let count = maximum; count >= minimum; count -= 1) {
    const visibleSizes =
      collapseFrom === "start"
        ? itemSizes.slice(total - count)
        : itemSizes.slice(0, count);
    const hasOverflow = count < total;
    const renderedCount = count + (hasOverflow ? 1 : 0);
    const used =
      visibleSizes.reduce((sum, size) => sum + size, 0) +
      (hasOverflow ? overflowSize : 0) +
      Math.max(0, renderedCount - 1) * gap;
    if (used <= availableSize) return count;
  }
  return minimum;
}

export interface OverflowListProps<T>
  /*
   * `ref` is owned: the ResizeObserver must keep `rootRef` attached to the
   * element whose clientWidth defines the fitting budget. Letting a caller's
   * ref replace it would freeze shrink and grow-back with no error.
   */
  extends Omit<ComponentProps<"div">, "children" | "className" | "ref"> {
  items: readonly T[];
  getKey: (item: T, index: number) => Key;
  /** Deterministic number rendered before a browser can measure. Required. */
  initialVisibleItems: number;
  minVisibleItems?: number | undefined;
  maxVisibleItems?: number | undefined;
  collapseFrom?: "start" | "end" | undefined;
  /** Inline gap in CSS pixels. It participates in fitting, so it is not a class-only concern. */
  gap?: number | undefined;
  renderItem: (item: T, index: number) => LumoNode;
  renderOverflow: (hidden: readonly OverflowListEntry<T>[]) => LumoNode;
  className?: string | undefined;
}

export function OverflowList<T>({
  items,
  getKey,
  initialVisibleItems,
  minVisibleItems = 0,
  maxVisibleItems = items.length,
  collapseFrom = "end",
  gap = 8,
  renderItem,
  renderOverflow,
  className,
  style,
  ...props
}: OverflowListProps<T>) {
  const minimum = Math.min(items.length, Math.max(0, Math.trunc(minVisibleItems)));
  const maximum = Math.min(items.length, Math.max(minimum, Math.trunc(maxVisibleItems)));
  const initial = Math.min(maximum, Math.max(minimum, Math.trunc(initialVisibleItems)));
  const [visibleCount, setVisibleCount] = useState(initial);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const overflowRef = useRef<HTMLSpanElement | null>(null);

  const entries: OverflowListEntry<T>[] = items.map((item, index) => ({
    item,
    index,
    key: getKey(item, index),
  }));
  const split = collapseFrom === "start" ? items.length - visibleCount : visibleCount;
  const visible = collapseFrom === "start" ? entries.slice(split) : entries.slice(0, split);
  const hidden = collapseFrom === "start" ? entries.slice(0, split) : entries.slice(split);
  const visibleKeys = new Set(visible.map((entry) => entry.key));

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;

    const measure = () => {
      const itemSizes = entries.map(
        (_, index) => itemRefs.current[index]?.getBoundingClientRect().width ?? 0,
      );
      const next = fitOverflowItems({
        availableSize: root.clientWidth,
        itemSizes,
        overflowSize: overflowRef.current?.getBoundingClientRect().width ?? 0,
        gap,
        minVisibleItems: minimum,
        maxVisibleItems: maximum,
        collapseFrom,
      });
      setVisibleCount((current) => (current === next ? current : next));
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const item of itemRefs.current) if (item !== null) observer.observe(item);
    if (overflowRef.current !== null) observer.observe(overflowRef.current);
    return () => observer.disconnect();
  }, [collapseFrom, entries.length, gap, maximum, minimum, visibleCount]);

  const overflow =
    hidden.length === 0 ? null : (
      <span
        ref={overflowRef}
        data-overflow-list-overflow=""
        className={overflowListItemVariants()}
      >
        {renderOverflow(hidden)}
      </span>
    );

  return (
    <div
      {...props}
      ref={rootRef}
      data-lumo=""
      data-overflowed={hidden.length === 0 ? undefined : ""}
      className={cn(overflowListVariants(), className)}
      style={{ ...style, columnGap: gap }}
    >
      {collapseFrom === "start" ? overflow : null}
      {entries.map((entry) => {
        const shown = visibleKeys.has(entry.key);
        return (
          <span
            key={entry.key}
            ref={(node) => {
              itemRefs.current[entry.index] = node;
            }}
            {...(shown
              ? { "data-overflow-list-visible": "" }
              : { "aria-hidden": true, inert: true, "data-overflow-list-measure": "" })}
            className={shown ? overflowListItemVariants() : overflowListMeasureVariants()}
          >
            {renderItem(entry.item, entry.index)}
          </span>
        );
      })}
      {collapseFrom === "end" ? overflow : null}
    </div>
  );
}
