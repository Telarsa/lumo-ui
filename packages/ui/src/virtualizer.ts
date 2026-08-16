"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

/**
 * The window arithmetic behind `VirtualList`. Lumo's own rather than
 * `@tanstack/react-virtual`, closing three holes by deleting the option:
 * measurements are keyed by ITEM (`getItemKey`), not index, so a sorted list
 * does not leave heights behind; the scroller is a stable `RefObject`, not a
 * per-render getter; and the scroll offset is READ as `Math.abs(scrollLeft)`,
 * which is correct under both surviving RTL scroll models with no direction
 * flag — only WRITES (`scrollToOffset`) need the caller-derived `rtl` sign.
 * `initialSize` is REQUIRED so the server render lays out a real window.
 */

/** One row of the rendered window. */
export interface VirtualItem {
  /** `getItemKey(index)`, or the index. React's `key`, and the measurement key. */
  key: string | number;
  /** The row's TRUE index in the corpus, not its position in the window. */
  index: number;
  /** Offset along the main axis, in pixels, from the start of the content. */
  start: number;
  /** The row's size along the main axis — measured if it has mounted, else estimated. */
  size: number;
}

export interface VirtualWindowOptions {
  /** How many rows exist in total. */
  count: number;
  /** A row's main-axis size in pixels before it has been measured. */
  estimateSize: (index: number) => number;
  /** The element that scrolls. A ref, deliberately, so the effect subscribes once. */
  scrollRef: RefObject<HTMLElement | null>;
  /** The viewport's main-axis size for the SERVER render and the first frame. */
  initialSize: number;
  /** Rows rendered beyond the visible window, each side. */
  overscan?: number | undefined;
  /** Which axis scrolls. */
  horizontal?: boolean | undefined;
  /** Whether horizontal offsets use the RTL negative scroll model. Derived by the caller. */
  rtl?: boolean | undefined;
  /** Gap between rows in pixels. Part of the arithmetic, so not a CSS gap. */
  gap?: number | undefined;
  /** Stable identity per row; measurements are cached by it. Defaults to the index. */
  getItemKey?: ((index: number) => string | number) | undefined;
}

export interface VirtualWindow {
  /** The rows to render, in index order. */
  items: VirtualItem[];
  /** The full scrollable length along the main axis. */
  totalSize: number;
  /** Ref callback for a row element. Measures it and keeps measuring it; attach to every row. */
  measureElement: (element: HTMLElement | null) => void;
  /** Scroll the owned viewport to a logical offset from the reading start. */
  scrollToOffset: (offset: number, behavior?: ScrollBehavior) => void;
  /** Scroll the owned viewport until the requested item is aligned. */
  scrollToIndex: (
    index: number,
    options?: { align?: "start" | "center" | "end" | "auto"; behavior?: ScrollBehavior },
  ) => void;
}

/**
 * A `ResizeObserver`, or `null` where there is none (jsdom, server). Without
 * one, rows are still measured once on mount; only post-mount resizes are lost.
 */
function observe(callback: ResizeObserverCallback): ResizeObserver | null {
  return typeof ResizeObserver === "undefined" ? null : new ResizeObserver(callback);
}

/** The last index whose `start` is at or before `offset`. Binary search; runs on every scroll frame. */
function indexAt(starts: readonly number[], offset: number): number {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const start = starts[middle] ?? 0;
    if (start === offset) return middle;
    if (start < offset) low = middle + 1;
    else high = middle - 1;
  }
  return Math.max(0, high);
}

export function useVirtualWindow(options: VirtualWindowOptions): VirtualWindow {
  const {
    count,
    estimateSize,
    scrollRef,
    initialSize,
    overscan = 8,
    horizontal = false,
    rtl = false,
    gap = 0,
    getItemKey,
  } = options;

  // `initialSize` seeds the viewport so the server render lays out against a real size, not zero.
  const [offset, setOffset] = useState(0);
  const [viewport, setViewport] = useState(initialSize);

  // Measured sizes, keyed by ITEM KEY. A ref, not state: written from a
  // ResizeObserver, and `version` turns a batch of writes into one re-render.
  const measured = useRef(new Map<string | number, number>());
  const [version, setVersion] = useState(0);

  const keyOf = useCallback(
    (index: number): string | number => (getItemKey ? getItemKey(index) : index),
    [getItemKey],
  );

  // Prefix sums over the whole corpus. O(count), recomputed on measurement changes — not on scroll.
  const layout = useMemo(() => {
    const starts: number[] = new Array<number>(count);
    const sizes: number[] = new Array<number>(count);
    let running = 0;
    for (let index = 0; index < count; index++) {
      const size = measured.current.get(keyOf(index)) ?? estimateSize(index);
      starts[index] = running;
      sizes[index] = size;
      running += size + gap;
    }
    // The trailing gap is not part of the content: n rows have n−1 gaps.
    return { starts, sizes, total: count === 0 ? 0 : running - gap };
    // `version` is read for its identity, not its value.
  }, [count, estimateSize, gap, keyOf, version]);

  // Watch the scroller. Both dependencies are stable, so this subscribes once.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const read = () => {
      // `Math.abs`, and no direction option — see the file header.
      setOffset(horizontal ? Math.abs(element.scrollLeft) : element.scrollTop);
      setViewport(horizontal ? element.clientWidth : element.clientHeight);
    };
    read();

    element.addEventListener("scroll", read, { passive: true });
    const resize = observe(read);
    resize?.observe(element);
    return () => {
      element.removeEventListener("scroll", read);
      resize?.disconnect();
    };
  }, [scrollRef, horizontal]);

  // One ResizeObserver for every row; the row's index is read back from `data-index`.
  const rows = useRef<ResizeObserver | null>(null);
  const keyOfRef = useRef(keyOf);
  keyOfRef.current = keyOf;
  const horizontalRef = useRef(horizontal);
  horizontalRef.current = horizontal;

  const record = useCallback((element: HTMLElement) => {
    const index = Number(element.dataset["index"]);
    if (!Number.isInteger(index)) return;
    const size = horizontalRef.current ? element.offsetWidth : element.offsetHeight;
    // A row not yet laid out reports 0; keep the estimate rather than collapse the scrollbar.
    if (size === 0) return;
    const key = keyOfRef.current(index);
    if (measured.current.get(key) === size) return;
    measured.current.set(key, size);
    setVersion((n) => n + 1);
  }, []);

  useEffect(() => {
    const observer = observe((entries) => {
      for (const entry of entries) record(entry.target as HTMLElement);
    });
    rows.current = observer;
    return () => {
      observer?.disconnect();
      rows.current = null;
    };
  }, [record]);

  const measureElement = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      // Measure NOW as well as on change: a row that mounts at its final size never fires the observer.
      record(element);
      rows.current?.observe(element);
    },
    [record],
  );

  const scrollToOffset = useCallback(
    (requested: number, behavior: ScrollBehavior = "auto") => {
      const element = scrollRef.current;
      if (!element) return;
      const maximum = Math.max(0, layout.total - viewport);
      const logical = Math.min(maximum, Math.max(0, requested));
      const physical = horizontal && rtl ? -logical : logical;
      if (typeof element.scrollTo === "function") {
        element.scrollTo(horizontal ? { left: physical, behavior } : { top: physical, behavior });
      } else if (horizontal) {
        element.scrollLeft = physical;
      } else {
        element.scrollTop = physical;
      }
    },
    [horizontal, layout.total, rtl, scrollRef, viewport],
  );

  const scrollToIndex = useCallback(
    (
      requested: number,
      options: { align?: "start" | "center" | "end" | "auto"; behavior?: ScrollBehavior } = {},
    ) => {
      if (count === 0) return;
      const index = Math.min(count - 1, Math.max(0, Math.trunc(requested)));
      const start = layout.starts[index] ?? 0;
      const size = layout.sizes[index] ?? 0;
      const end = start + size;
      let target = start;
      switch (options.align ?? "start") {
        case "center":
          target = start - (viewport - size) / 2;
          break;
        case "end":
          target = end - viewport;
          break;
        case "auto":
          target = start < offset ? start : end > offset + viewport ? end - viewport : offset;
          break;
      }
      scrollToOffset(target, options.behavior);
    },
    [count, layout.sizes, layout.starts, offset, scrollToOffset, viewport],
  );

  const items = useMemo(() => {
    if (count === 0) return [];
    const firstVisible = indexAt(layout.starts, offset);
    const start = Math.max(0, firstVisible - overscan);

    const end = offset + viewport;
    let last = firstVisible;
    while (last < count - 1 && (layout.starts[last] ?? 0) < end) last++;
    const stop = Math.min(count - 1, last + overscan);

    const window: VirtualItem[] = [];
    for (let index = start; index <= stop; index++) {
      window.push({
        key: keyOf(index),
        index,
        start: layout.starts[index] ?? 0,
        size: layout.sizes[index] ?? 0,
      });
    }
    return window;
  }, [count, layout, offset, viewport, overscan, keyOf]);

  return { items, totalSize: layout.total, measureElement, scrollToIndex, scrollToOffset };
}
