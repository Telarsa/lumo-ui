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
 *     <VirtualList
 *       label="فهرست سفارش‌ها"
 *       locale={locale}
 *       count={orders.length}
 *       estimateSize={44}
 *       initialSize={480}
 *     >
 *       {(index) => <OrderRow order={orders[index]} />}
 *     </VirtualList>
 *
 * ═══ THE ARITHMETIC IS OURS NOW ═════════════════════════════════════════════
 *
 * This was `@tanstack/react-virtual` 3.14.9 until 11 Aug 2026, and the reason
 * that dependency was acceptable — it emits no DOM, no role, no `aria-*` and no
 * focus management — is the same reason it was replaceable: what it supplied
 * was ARITHMETIC, and arithmetic this file already had tests for. It is now
 * `virtualizer.ts`, whose header records the three defects the swap closed
 * (measurements keyed by position rather than by item, a scroller getter that
 * re-subscribes on every render, and an `isRtl` flag defaulting to wrong).
 *
 * What did NOT change is the division of labour: the hook computes a window of
 * indices and their offsets and nothing else, and every role, name, tab stop
 * and `aria-*` attribute below belongs to this file. That was the rule when the
 * arithmetic was rented and it is the rule now that it is owned.
 *
 * ═══ THE DEFECT VIRTUALISATION INTRODUCES, AND THE ONLY FIX FOR IT ══════════
 *
 * A screen reader computes a list's size from the DOM. Virtualise ten thousand
 * rows and the DOM holds twelve, so the reader announces **«۱ از ۱۲»** on a list
 * of ten thousand — confidently, wrongly, and identically in every language.
 * There is no visual symptom whatsoever.
 *
 * `aria-setsize` and `aria-posinset` are the fix and they are not optional here:
 * every row this component renders carries both, computed from `count` and the
 * item's true index rather than from its position in the rendered window. They
 * are emitted BY THIS COMPONENT and not by the caller's `children`, because an
 * accessibility affordance a caller has to remember on every row is one that is
 * eventually forgotten on one row — the same argument `<ChartData>` and
 * `TableSelectAllColumn` make.
 *
 * **Both are ATTRIBUTES carrying integers, and integers in ARIA attributes are
 * announced in the reader's OWN language and numbering system.** So `count` is
 * emitted raw and is deliberately NOT put through `formatNumber` — a Persian
 * digit in `aria-setsize` is not a localisation, it is an invalid attribute
 * value. This is the same distinction `aria-sort` gets in table.tsx and the
 * opposite of `aria-valuetext` in progress.tsx, which is prose and must be
 * formatted. Getting it backwards is silent in both directions.
 *
 * ═══ THE SERVED BYTES, MEASURED ═════════════════════════════════════════════
 *
 * A virtualiser has nothing to virtualise until something measures the viewport,
 * and nothing measures anything on a server. Left alone, `getVirtualItems()`
 * returns `[]` during `renderToStaticMarkup` and this component serves an empty
 * `role="list"` — a page-shaped blind spot of exactly the kind
 * `chart.variants.ts` documents for recharts, and one `lumo-gate` would grade as
 * a vacuous pass: no text, therefore no Latin digits, therefore green.
 *
 * `initialSize` closes it. It is fed to the virtualiser's `initialRect`, which is
 * the documented deterministic fallback "for server output, hidden containers,
 * and the first frame before measurement", so the first screenful of rows —
 * their real text, their real figures — is in the first byte and is graded like
 * any other prose. It is a REQUIRED prop for the same reason `ChartContainer`'s
 * `data` is: an optional affordance is one nobody adds.
 *
 * The number is a pixel length, not a row count, because that is what the
 * virtualiser measures in and a row count would have to be converted back with
 * an `estimateSize` this component does not own at that moment.
 *
 * ═══ ONE TAB STOP, AND WHY IT IS ON THE SCROLLER ════════════════════════════
 *
 * A scrollable region that cannot be reached from the keyboard cannot be
 * scrolled from the keyboard (WCAG 2.1.1), and the browser only gives a
 * `overflow: auto` box a tab stop of its own in some engines. So the scroller
 * carries `tabIndex={0}` — and a focusable element with no name announces its
 * role and nothing else, which is why `label` is required.
 *
 * There is exactly ONE stop for the whole list. Rows are `role="listitem"`,
 * which is not focusable and must not become so: a list of ten thousand rows
 * with ten thousand tab stops is a keyboard trap with extra steps. A list whose
 * rows are ACTIONABLE is a different component (`ListBox`, `Menu`) with a roving
 * tab stop, and this one deliberately does not pretend to be it.
 *
 * ═══ RTL ═══════════════════════════════════════════════════════════════════
 *
 * All of it is in `virtual-list.variants.ts`, above `virtualMirror`, with the
 * dist line numbers. The short version: a vertical list needs nothing, a
 * horizontal one needs `isRtl` (which the library defaults to `false`, i.e.
 * wrong) and a NEGATED `translateX` (because CSS has no logical transform), and
 * neither is derivable from `<html dir>` by the library itself. `locale` is the
 * one input and there is no `isRtl` or `dir` prop to disagree with it.
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
  /*
   * `ref` is owned, and this is the component AUDIT §4.2 used as the example of
   * what the missing ref story cost — "a consumer cannot … scroll a
   * `VirtualList` to an index". The ref is not the answer to that: `scrollRef`
   * below is the virtualiser's own scroll container and replacing it empties
   * the window. The public ref therefore exposes only `scrollToIndex` and
   * `scrollToOffset`; it never exposes or replaces the virtualizer's DOM ref.
   * `role`, `aria-label` and `tabIndex` are owned
   * together for `ScrollArea`'s reason: the three of them ARE the tab stop.
   */
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
  /**
   * The list's announced name, e.g. «فهرست سفارش‌ها».
   *
   * REQUIRED. The scroll container is a tab stop; an unnamed one announces
   * "list" and nothing else, and a screen with two of them offers two identical
   * stops.
   */
  label: string;
  /**
   * The locale. Direction is derived from it — there is deliberately no `dir`
   * and no `isRtl` prop, see the header.
   */
  locale: Locale;
  /** How many rows exist in total, not how many are rendered. */
  count: number;
  /**
   * A row's size along the main axis in pixels: a constant, or a function of
   * the index. Rows are measured for real once they mount; this is the estimate
   * that makes the scrollbar right before they do.
   */
  estimateSize: number | ((index: number) => number);
  /**
   * The viewport's size along the main axis in pixels, used for the SERVER
   * render and the first frame. REQUIRED — see the header. Match it to the
   * height (or inline size) the container is actually styled to.
   */
  initialSize: number;
  /** Rows to render beyond the visible window, each side. */
  overscan?: number | undefined;
  /** Which axis scrolls. `"horizontal"` is where the direction work lives. */
  orientation?: VirtualListOrientation | undefined;
  /**
   * A stable identity per row. Defaults to the index, which is correct only for
   * a list that never reorders — pass a real key for anything sorted or
   * filtered, exactly as with React's own `key`.
   */
  getItemKey?: ((index: number) => string | number) | undefined;
  /** Gap between rows in pixels. Part of the arithmetic, so not a CSS gap. */
  gap?: number | undefined;
  /** Reports the true corpus indices represented by the current window. */
  onVisibleRangeChange?: ((range: VirtualListRange) => void) | undefined;
  /**
   * Remote collection status. Active work owns `aria-busy`; ready and error
   * remain operable and are announced by caller-authored status UI.
   */
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
    /*
     * The deterministic viewport the server render lays out against. Without it
     * the window is empty during `renderToStaticMarkup` and the served bytes
     * contain an empty list — see the header.
     *
     * ONE number, along the main axis. The old call passed a `Rect` carrying
     * both axes because TanStack's type demanded both and read one; which axis
     * is the main one is `horizontal`'s business, so the caller now states a
     * length rather than a rectangle and cannot get the pairing wrong.
     */
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
      // See the header: one tab stop for the whole list, on the element that
      // actually scrolls, named because a focusable element must be.
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
        // Layout-only: flatten this node in the accessibility tree so the
        // list's owned listitems are its exposed children. VoiceOver otherwise
        // counts this one wrapper and announces “1 item”.
        role="presentation"
        className={cn(virtualListSizerVariants())}
        /*
         * The scrollable LENGTH, along the main axis only. Logical properties:
         * `blockSize`/`inlineSize` rather than `height`/`width`, so the sizer
         * says which axis it means rather than which edge of the screen.
         */
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
            /*
             * The whole reason this component exists rather than a `.map()`.
             * Both are 1-based, both count the CORPUS and not the window, and
             * both are raw integers — never `formatNumber`ed. See the header.
             */
            aria-posinset={item.index + 1}
            aria-setsize={count}
            data-index={item.index}
            // Real measurement replaces `estimateSize` as rows mount. Without
            // this the scrollbar stays a guess for the lifetime of the list.
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
