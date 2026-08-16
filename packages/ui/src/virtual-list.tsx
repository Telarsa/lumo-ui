"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type Ref,
} from "react";
import { useVirtualWindow } from "./virtualizer.ts";
import type { AsyncCollectionStatus } from "./async-collection.ts";
import { cn, type Locale, type LumoNode } from "@lumo-ui/core";
import {
  virtualListItemVariants,
  virtualListSizerVariants,
  virtualListVariants,
  virtualMirror,
  type VirtualListOrientation,
} from "./virtual-list.variants.ts";

export {
  virtualListItemVariants,
  virtualListSizerVariants,
  virtualListVariants,
  virtualMirror,
};
export type { VirtualListOrientation };

/**
 * A list that renders a window instead of a corpus.
 *
 *     <VirtualList label="فهرست سفارش‌ها" locale={locale} count={orders.length}
 *                  estimateSize={44} initialSize={480}>
 *       {(index) => <OrderRow order={orders[index]} />}
 *     </VirtualList>
 *
 * The arithmetic is `virtualizer.ts` (ours since 11 Aug 2026); every role, name,
 * tab stop and `aria-*` belongs to this file. `aria-setsize`/`aria-posinset`
 * are emitted on every row from `count` and the TRUE index — a screen reader
 * would otherwise announce «۱ از ۱۲» on ten thousand rows — and are RAW
 * integers, never `formatNumber`ed (a Persian digit in an ARIA attribute is an
 * invalid value). `initialSize` is REQUIRED so the first screenful is in the
 * served bytes rather than an empty `role="list"`. ONE tab stop, on the
 * scroller (WCAG 2.1.1), hence `label` is required; rows are never focusable.
 * RTL: see `virtual-list.variants.ts` — `locale` is the one input, no `dir`.
 */

export interface VirtualListHandle {
  scrollToOffset(offset: number, behavior?: ScrollBehavior): void;
  scrollToIndex(
    index: number,
    options?: { align?: "start" | "center" | "end" | "auto"; behavior?: ScrollBehavior },
  ): void;
}

export interface VirtualListRange {
  startIndex: number;
  endIndex: number;
}

export interface VirtualListProps
  // `ref` is owned: `scrollRef` is the virtualiser's own container and replacing
  // it empties the window; the handle exposes `scrollToIndex`/`scrollToOffset`
  // only. `role`, `aria-label` and `tabIndex` are owned together: they ARE the tab stop.
  extends Omit<
    ComponentProps<"div">,
    | "children"
    | "className"
    | "ref"
    | "role"
    | "aria-label"
    | "aria-busy"
    | "tabIndex"
    | "dir"
  > {
  /** The list's announced name, e.g. «فهرست سفارش‌ها». REQUIRED — the scroll container is a tab stop. */
  label: string;
  /** The locale. Direction is derived from it — no `dir` and no `isRtl` prop. */
  locale: Locale;
  /** How many rows exist in total, not how many are rendered. */
  count: number;
  /** A row's size along the main axis in pixels: a constant, or a function of the index. */
  estimateSize: number | ((index: number) => number);
  /** The viewport's size along the main axis in pixels, for the SERVER render and first frame. REQUIRED. */
  initialSize: number;
  /** Rows to render beyond the visible window, each side. */
  overscan?: number | undefined;
  /** Which axis scrolls. `"horizontal"` is where the direction work lives. */
  orientation?: VirtualListOrientation | undefined;
  /** A stable identity per row. Defaults to the index — pass a real key for anything sorted or filtered. */
  getItemKey?: ((index: number) => string | number) | undefined;
  /** Gap between rows in pixels. Part of the arithmetic, so not a CSS gap. */
  gap?: number | undefined;
  /** Reports the true corpus indices represented by the current window. */
  onVisibleRangeChange?: ((range: VirtualListRange) => void) | undefined;
  /** Remote collection status. Active work owns `aria-busy`. */
  asyncStatus?: AsyncCollectionStatus | undefined;
  /** Requests another page once when the window reaches the corpus end. */
  onEndReached?: (() => void) | undefined;
  /** How many rows before the end should request another page. */
  endReachedThreshold?: number | undefined;
  /** Renders one row's contents. Called with the row's TRUE index. */
  children: (index: number) => LumoNode;
  /** Class for the scroll container. */
  className?: string | undefined;
  /** Class for each row wrapper. */
  itemClassName?: string | undefined;
  /** Imperative scrolling without replacing the ref owned by the virtualizer. */
  ref?: Ref<VirtualListHandle> | undefined;
}

export function VirtualList({
  label,
  locale,
  count,
  estimateSize,
  initialSize,
  overscan = 8,
  orientation = "vertical",
  getItemKey,
  gap,
  onVisibleRangeChange,
  asyncStatus,
  onEndReached,
  endReachedThreshold = 0,
  children,
  className,
  itemClassName,
  ref,
  ...props
}: VirtualListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const mirror = virtualMirror(locale, orientation);
  const horizontal = orientation === "horizontal";

  const { items, totalSize, measureElement, scrollToIndex, scrollToOffset } = useVirtualWindow({
    count,
    // The ref itself, not a getter that closes over it — see `virtualizer.ts`.
    scrollRef,
    estimateSize: typeof estimateSize === "number" ? () => estimateSize : estimateSize,
    overscan,
    horizontal,
    rtl: mirror.direction === "rtl",
    // The deterministic viewport the server render lays out against. ONE number,
    // along the main axis; which axis is `horizontal`'s business.
    initialSize,
    ...(getItemKey === undefined ? {} : { getItemKey }),
    ...(gap === undefined ? {} : { gap }),
  });

  useImperativeHandle(ref, () => ({ scrollToIndex, scrollToOffset }), [scrollToIndex, scrollToOffset]);

  const rangeCallback = useRef(onVisibleRangeChange);
  const endCallback = useRef(onEndReached);
  rangeCallback.current = onVisibleRangeChange;
  endCallback.current = onEndReached;
  const requestedAtCount = useRef<number | null>(null);
  const firstIndex = items[0]?.index;
  const lastIndex = items.at(-1)?.index;

  useEffect(() => {
    if (firstIndex === undefined || lastIndex === undefined) return;
    rangeCallback.current?.({ startIndex: firstIndex, endIndex: lastIndex });
  }, [firstIndex, lastIndex]);

  useEffect(() => {
    if (lastIndex === undefined || count === 0 || endCallback.current === undefined) return;
    const threshold = Math.max(0, Math.trunc(endReachedThreshold));
    if (lastIndex < count - 1 - threshold || requestedAtCount.current === count) return;
    requestedAtCount.current = count;
    endCallback.current();
  }, [count, endReachedThreshold, lastIndex]);

  return (
    <div
      {...props}
      ref={scrollRef}
      data-lumo=""
      // One tab stop for the whole list, on the element that actually scrolls.
      tabIndex={0}
      role="list"
      aria-label={label}
      {...(asyncStatus === "loading" ||
      asyncStatus === "refreshing" ||
      asyncStatus === "loading-more"
        ? { "aria-busy": true }
        : {})}
      className={cn(virtualListVariants({ orientation }), className)}
    >
      <div
        // Layout-only: flatten in the a11y tree, or VoiceOver announces “1 item”.
        role="presentation"
        className={cn(virtualListSizerVariants())}
        // The scrollable LENGTH, along the main axis only; logical properties.
        style={
          (horizontal
            ? { inlineSize: `${totalSize}px`, blockSize: "100%" }
            : { blockSize: `${totalSize}px` }) as CSSProperties
        }
      >
        {items.map((item) => (
          <div
            key={item.key}
            role="listitem"
            // Both 1-based, both count the CORPUS, both raw integers — never `formatNumber`ed.
            aria-posinset={item.index + 1}
            aria-setsize={count}
            data-index={item.index}
            // Real measurement replaces `estimateSize` as rows mount.
            ref={measureElement}
            className={cn(virtualListItemVariants({ orientation }), itemClassName)}
            style={{ transform: mirror.mainAxisTranslate(item.start) }}
          >
            {children(item.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
