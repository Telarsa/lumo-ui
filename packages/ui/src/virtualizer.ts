"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

/**
 * The window arithmetic behind `VirtualList`. Lumo's own, since 11 Aug 2026.
 *
 * ═══ WHY THIS REPLACED `@tanstack/react-virtual` ════════════════════════════
 *
 * Not because that library is bad — it is very good, and this file reproduces
 * its shape closely enough that the swap changed six lines in `virtual-list.tsx`.
 * It is because a virtualiser is **arithmetic**, the arithmetic is small, and
 * the parts of it Lumo actually needs are the parts where a general-purpose
 * library has to leave a configuration hole that a Persian page can fall
 * through. Three such holes are closed below by DELETING the option rather than
 * by setting it correctly, which is the only fix that survives the next person.
 *
 * Everything here was written against the behaviour `virtual-list.test.tsx`
 * already pinned, so the tests are the specification rather than a description.
 *
 * ═══ THE THREE THINGS THIS DOES DIFFERENTLY, AND WHY EACH IS A DEFECT FIXED ══
 *
 * ── 1. MEASUREMENTS ARE KEYED BY ITEM, NOT BY POSITION ─────────────────────
 *
 * TanStack caches a measured row size by INDEX (`measurementsCache`). For a
 * list that never reorders that is identical to keying by item and cheaper. For
 * a SORTED or FILTERED list it is wrong in a way that is easy to miss: sort the
 * list and every measured height stays at its old position, so a two-line row
 * that moves from index 3 to index 40 leaves its height behind at index 3. The
 * symptom is a scrollbar that drifts and rows that jump as you scroll past
 * them, and it corrects itself as each row re-measures, which is exactly why it
 * reads as jank rather than as a bug.
 *
 * Here the cache is keyed by `getItemKey(index)` — the same identity React uses
 * for the row — so a measurement follows its CONTENT. `getItemKey` defaults to
 * the index, so a list that never reorders behaves exactly as before.
 *
 * ── 2. THE SCROLLER ARRIVES AS A REF, NOT AS A GETTER ──────────────────────
 *
 * TanStack takes `getScrollElement: () => el`. Written the natural way at the
 * call site — `getScrollElement: () => scrollRef.current` — that is a NEW
 * FUNCTION on every render, so any effect that depends on it re-subscribes its
 * scroll listener and re-creates its ResizeObserver on every render. It works,
 * and it is silent, and it is per-render work in the one component whose whole
 * purpose is to avoid per-row work.
 *
 * A `RefObject` is stable by construction. The effect below has no reason to
 * re-run and cannot be made to by a caller writing the obvious thing.
 *
 * ── 3. DIRECTION IS DERIVED, AND THERE IS NO `isRtl` TO GET WRONG ──────────
 *
 * TanStack reads the scroll offset as `el.scrollLeft * (isRtl ? -1 : 1)`, and
 * `isRtl` defaults to `false`. A horizontal list in a Persian document
 * therefore reads the offset with the wrong sign and renders the window from
 * the wrong end of the data — while looking, to anyone who does not read
 * Persian, like a list that simply starts somewhere odd.
 *
 * This file reads `Math.abs(el.scrollLeft)` and takes no direction option at
 * all. That is not a shortcut; it is correct for strictly more browsers than
 * the signed form:
 *
 *     model      scrollLeft at the reading start … end      abs() correct?
 *     negative    0 → −max   (Chrome ≥85, Firefox, Safari)      yes
 *     reverse     0 → +max   (old WebKit, old Edge)             yes
 *     default   +max → 0     (Chrome <85, removed 2020)         no
 *
 * Every engine shipping in 2026 uses `negative`; the signed form is correct
 * only for that one, and only when the caller remembered the flag. `abs` is
 * correct for two of the three and needs no flag, so there is no direction
 * input on this hook and nothing for a page to set in disagreement with its own
 * `<html dir>`. `virtual-list.variants.ts`'s `virtualMirror` still owns the
 * TRANSFORM sign, which is a genuinely physical quantity — see its header.
 *
 * ═══ THE SERVER RENDER ══════════════════════════════════════════════════════
 *
 * Nothing measures a viewport on a server, so a virtualiser left alone returns
 * an empty window during `renderToStaticMarkup` and the component serves an
 * empty `role="list"` — a page-shaped blind spot that `lumo-gate` would grade
 * as a vacuous pass (no text, therefore no Latin digits, therefore green).
 *
 * `initialSize` is the deterministic viewport the first render lays out
 * against, and it is REQUIRED rather than defaulted for the reason an optional
 * affordance is always the wrong shape here: the default would be 0, and 0 is
 * indistinguishable from a correct answer until someone reads the bytes.
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
  /** The element that scrolls. A ref, deliberately — see the header. */
  scrollRef: RefObject<HTMLElement | null>;
  /** The viewport's main-axis size for the SERVER render and the first frame. */
  initialSize: number;
  /** Rows rendered beyond the visible window, each side. */
  overscan?: number | undefined;
  /** Which axis scrolls. */
  horizontal?: boolean | undefined;
  /** Gap between rows in pixels. Part of the arithmetic, so not a CSS gap. */
  gap?: number | undefined;
  /** Stable identity per row. Defaults to the index. See the header on caching. */
  getItemKey?: ((index: number) => string | number) | undefined;
}

export interface VirtualWindow {
  /** The rows to render, in index order. */
  items: VirtualItem[];
  /** The full scrollable length along the main axis. */
  totalSize: number;
  /**
   * Ref callback for a row element. Measures it and keeps measuring it.
   *
   * Attach to every row. A row that is never measured keeps its estimate
   * forever, which is correct only if the estimate was.
   */
  measureElement: (element: HTMLElement | null) => void;
}

/**
 * A `ResizeObserver`, or `null` where there is none.
 *
 * There are two such environments and both are ordinary rather than exotic:
 * **jsdom**, which every consumer's component tests run in and which defines no
 * `ResizeObserver` at all, and any **server** render, where the effects below
 * do not run but the module is still evaluated. Constructing one unguarded
 * throws `ReferenceError: ResizeObserver is not defined` from inside an effect,
 * which surfaces as a component that cannot be rendered in a test at all — a
 * failure a consumer would reasonably read as "this library does not work".
 *
 * Found by this file's own tests, which are the first thing in the repository
 * to render the hook in jsdom without a shim.
 *
 * The degradation is deliberate and stated: without an observer, rows are still
 * measured ONCE when they mount (`measureElement` calls `record` directly) and
 * the scroller is still read on every scroll event. What is lost is reacting to
 * a row or a viewport that changes size AFTER mount. That is the correct thing
 * to lose — it keeps the common case exact and the rare case stale, rather than
 * making the whole component unrenderable.
 */
function observe(callback: ResizeObserverCallback): ResizeObserver | null {
  return typeof ResizeObserver === "undefined" ? null : new ResizeObserver(callback);
}

/**
 * The last index whose `start` is at or before `offset`.
 *
 * Binary search rather than a scan, because this runs on every scroll frame and
 * a linear scan over ten thousand rows is the thing virtualisation exists to
 * avoid. Returns 0 for an empty list, which callers then range-clamp anyway.
 */
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
    gap = 0,
    getItemKey,
  } = options;

  /*
   * `initialSize` seeds BOTH, so the first render — on the server, and the
   * first client frame before any effect has run — lays out against a real
   * viewport rather than against zero. The offset starts at 0 because a list
   * that has not been scrolled has not been scrolled in any direction, which is
   * the one fact about the server render that is unambiguous.
   */
  const [offset, setOffset] = useState(0);
  const [viewport, setViewport] = useState(initialSize);

  /*
   * Measured sizes, keyed by ITEM KEY. See the header: index-keying is the
   * common choice and is wrong the moment the list reorders.
   *
   * A ref and not state: it is written from a ResizeObserver during layout, and
   * `version` is the single state bump that turns a batch of those writes into
   * one re-render.
   */
  const measured = useRef(new Map<string | number, number>());
  const [version, setVersion] = useState(0);

  const keyOf = useCallback(
    (index: number): string | number => (getItemKey ? getItemKey(index) : index),
    [getItemKey],
  );

  /*
   * Prefix sums over the whole corpus.
   *
   * O(count) and deliberately so: it is the only way to know where row 9,000
   * starts when rows 0–8,999 have different sizes, and it recomputes only when
   * the count, the gap, the keying or a MEASUREMENT changes — not on scroll.
   * Scrolling costs one binary search.
   */
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
    // `version` is the dependency that makes a measurement visible here. It is
    // read for its identity, not its value.
  }, [count, estimateSize, gap, keyOf, version]);

  /*
   * Watch the scroller.
   *
   * The dependency list is `[scrollRef, horizontal]` and both are stable, so
   * this subscribes once — the point of taking a ref rather than a getter.
   *
   * `passive: true` because nothing here calls `preventDefault`, and a
   * non-passive scroll listener blocks the compositor on every frame.
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const read = () => {
      // `Math.abs`, and no direction option. See the header's table.
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

  /*
   * One ResizeObserver for every row, not one per row.
   *
   * A row's key is recovered from `data-index` on the element, which
   * `virtual-list.tsx` already writes for its own reasons. Reading it back is
   * cheaper than a WeakMap and keeps the element self-describing in the DOM,
   * where anyone debugging this can see it.
   */
  const rows = useRef<ResizeObserver | null>(null);
  const keyOfRef = useRef(keyOf);
  keyOfRef.current = keyOf;
  const horizontalRef = useRef(horizontal);
  horizontalRef.current = horizontal;

  const record = useCallback((element: HTMLElement) => {
    const index = Number(element.dataset["index"]);
    if (!Number.isInteger(index)) return;
    const size = horizontalRef.current ? element.offsetWidth : element.offsetHeight;
    // A row that has not been laid out yet reports 0. Recording that would
    // collapse the scrollbar to nothing and then expand it again a frame later,
    // which is worse than keeping the estimate for one more frame.
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
      // Measure NOW as well as on change: a row that mounts at its final size
      // never fires the observer with a different one, and waiting for a resize
      // that will not come leaves the estimate in place forever.
      record(element);
      rows.current?.observe(element);
    },
    [record],
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

  return { items, totalSize: layout.total, measureElement };
}
