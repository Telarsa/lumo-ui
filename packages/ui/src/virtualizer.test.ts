/*
 * THE VIRTUALISER, GRADED ON THE THREE CLAIMS ITS HEADER MAKES.
 *
 * `virtual-list.test.tsx` already grades the COMPONENT — the roles, the
 * `aria-setsize`, the served bytes, the transform sign. This file grades the
 * ARITHMETIC underneath it, which is the part that used to be someone else's.
 *
 * Each of the three claims is written as a pair where a pair is possible: the
 * behaviour, and the behaviour that the DISPLACED implementation would have
 * produced. A test that only asserts "the window is right" passes for a
 * virtualiser that is right for the wrong reason.
 */

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { useVirtualWindow, type VirtualWindowOptions } from "./virtualizer.ts";

/**
 * A scroll container that can be scrolled and resized from a test.
 *
 * jsdom lays nothing out — every element reports zero — so the sizes have to be
 * installed by hand. That is not a workaround for jsdom: it is the same reason
 * `initialSize` exists at all, and it means these tests exercise the exact code
 * path a server render takes.
 */
function scroller({ viewport = 300, horizontal = false } = {}) {
  const element = document.createElement("div");
  Object.defineProperty(element, horizontal ? "clientWidth" : "clientHeight", {
    configurable: true,
    get: () => viewport,
  });
  let scroll = 0;
  Object.defineProperty(element, horizontal ? "scrollLeft" : "scrollTop", {
    configurable: true,
    get: () => scroll,
    set: (next: number) => {
      scroll = next;
    },
  });
  document.body.appendChild(element);
  const ref = createRef<HTMLElement | null>();
  (ref as { current: HTMLElement | null }).current = element;
  return { element, ref, scrollTo: (n: number) => element.dispatchEvent(new Event("scroll")) && n };
}

function windowOf(options: Partial<VirtualWindowOptions> & { scrollRef: VirtualWindowOptions["scrollRef"] }) {
  return renderHook((props: VirtualWindowOptions) => useVirtualWindow(props), {
    initialProps: {
      count: 1000,
      estimateSize: () => 40,
      initialSize: 300,
      overscan: 2,
      ...options,
    } as VirtualWindowOptions,
  });
}

describe("the window", () => {
  it("renders a window, not a corpus", () => {
    const { ref } = scroller();
    const { result } = windowOf({ scrollRef: ref });
    // 300px viewport / 40px rows = 8 visible, plus 2 overscan each side.
    expect(result.current.items.length).toBeLessThan(20);
    expect(result.current.items[0]?.index).toBe(0);
    expect(result.current.totalSize).toBe(1000 * 40);
  });

  it("lays out against initialSize on the FIRST render, before any effect", () => {
    /*
     * The defect this closes: a virtualiser with no deterministic viewport
     * returns an empty window during `renderToStaticMarkup`, and the served
     * bytes contain an empty list. `lumo-gate` grades that as a vacuous pass —
     * no text, therefore no Latin digits, therefore green.
     *
     * A null ref is exactly the server's situation: nothing to measure.
     */
    const ref = createRef<HTMLElement | null>();
    const { result } = windowOf({ scrollRef: ref, initialSize: 480 });
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.items.at(-1)?.start).toBeGreaterThanOrEqual(480 - 40);
  });

  it("offsets are prefix sums, and the trailing gap is not content", () => {
    const { ref } = scroller();
    const { result } = windowOf({ scrollRef: ref, count: 3, estimateSize: () => 40, gap: 10 });
    expect(result.current.items.map((i) => i.start)).toEqual([0, 50, 100]);
    // Three rows have TWO gaps, not three: 3*40 + 2*10.
    expect(result.current.totalSize).toBe(140);
  });

  it("handles an empty list without inventing a row", () => {
    const { ref } = scroller();
    const { result } = windowOf({ scrollRef: ref, count: 0 });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalSize).toBe(0);
  });

  it("uses a per-index estimate when given one", () => {
    const { ref } = scroller();
    const { result } = windowOf({
      scrollRef: ref,
      count: 4,
      estimateSize: (index) => (index % 2 === 0 ? 20 : 60),
    });
    expect(result.current.items.map((i) => i.start)).toEqual([0, 20, 80, 100]);
    expect(result.current.totalSize).toBe(160);
  });
});

describe("scrolling", () => {
  it("moves the window to the scrolled offset", () => {
    const { element, ref } = scroller({ viewport: 300 });
    const { result } = windowOf({ scrollRef: ref, count: 1000, estimateSize: () => 40 });

    act(() => {
      element.scrollTop = 4000; // row 100
      element.dispatchEvent(new Event("scroll"));
    });

    const indexes = result.current.items.map((i) => i.index);
    expect(indexes).toContain(100);
    expect(indexes).not.toContain(0);
    // Overscan is 2, so the window opens two rows early and no earlier.
    expect(indexes[0]).toBe(98);
  });

  /*
   * CLAIM 3 — direction needs no option.
   *
   * TanStack read `scrollLeft * (isRtl ? -1 : 1)` with `isRtl` defaulting to
   * false, so a horizontal Persian list computed a NEGATIVE offset and windowed
   * the wrong end of the data. Every engine shipping today reports a negative
   * `scrollLeft` in an RTL scroller, so `Math.abs` is the whole fix and there is
   * no flag to forget.
   *
   * The assertion is deliberately that BOTH signs give the SAME window: that is
   * what "needs no configuration" means, and it is what the signed form cannot
   * do without being told which one it is looking at.
   */
  it("windows the same rows whichever sign the engine reports scrollLeft with", () => {
    const ltr = scroller({ viewport: 300, horizontal: true });
    const rtl = scroller({ viewport: 300, horizontal: true });

    const a = windowOf({ scrollRef: ltr.ref, horizontal: true, estimateSize: () => 40 });
    const b = windowOf({ scrollRef: rtl.ref, horizontal: true, estimateSize: () => 40 });

    act(() => {
      ltr.element.scrollLeft = 4000; // the "reverse" model, and LTR
      ltr.element.dispatchEvent(new Event("scroll"));
      rtl.element.scrollLeft = -4000; // the "negative" model, RTL, 2026 engines
      rtl.element.dispatchEvent(new Event("scroll"));
    });

    expect(b.result.current.items.map((i) => i.index)).toEqual(
      a.result.current.items.map((i) => i.index),
    );
    expect(b.result.current.items.map((i) => i.index)).toContain(100);
  });

  it("POISON: the signed form TanStack used windows the wrong end under RTL", () => {
    /*
     * Not a test of our code — a test of the CLAIM, so the fix is not merely
     * asserted to work but shown to be necessary. This is the arithmetic the
     * displaced implementation ran with its default `isRtl: false`.
     */
    const scrollLeft = -4000;
    const signed = scrollLeft * (false ? -1 : 1); // TanStack's default path
    const ours = Math.abs(scrollLeft);
    expect(signed).toBe(-4000); // negative offset → index 0 → the wrong end
    expect(ours).toBe(4000);
  });
});

describe("measurement is keyed by ITEM, not by position", () => {
  /**
   * Mount a row element the hook can measure, at a given index and size.
   *
   * `measureElement` reads `data-index` off the element — the attribute
   * `virtual-list.tsx` already writes — and jsdom reports 0 for every offset,
   * so the size is installed the same way the viewport is.
   */
  function row(index: number, size: number) {
    const element = document.createElement("div");
    element.dataset["index"] = String(index);
    Object.defineProperty(element, "offsetHeight", { configurable: true, get: () => size });
    return element;
  }

  /*
   * THE CLAIM, AND THE DEFECT IT CLOSES.
   *
   * TanStack caches a measured size by INDEX. Sort or filter the list and every
   * measurement stays at its old position, so a tall row that moves from index
   * 0 to index 2 leaves its height behind at index 0 — the scrollbar drifts and
   * rows jump as you scroll past them, then correct themselves as each
   * re-measures, which is why it reads as jank rather than as a bug.
   *
   * Here the cache is keyed by `getItemKey(index)`, so the measurement follows
   * the CONTENT. The test reorders the data and asserts the tall row's height
   * moved with it.
   */
  it("a measurement follows its row through a reorder", () => {
    const { ref } = scroller();
    let order = ["a", "b", "c"];

    const view = renderHook((props: VirtualWindowOptions) => useVirtualWindow(props), {
      initialProps: {
        count: 3,
        estimateSize: () => 40,
        initialSize: 300,
        scrollRef: ref,
        getItemKey: (index: number) => order[index] ?? index,
      } as VirtualWindowOptions,
    });

    // Row "a", at index 0, is measured at 100px rather than the 40px estimate.
    act(() => {
      view.result.current.measureElement(row(0, 100));
    });
    expect(view.result.current.items.map((i) => i.size)).toEqual([100, 40, 40]);
    expect(view.result.current.totalSize).toBe(180);

    // Now "a" moves to the END. Its height must move with it.
    order = ["b", "c", "a"];
    act(() => {
      view.rerender({
        count: 3,
        estimateSize: () => 40,
        initialSize: 300,
        scrollRef: ref,
        getItemKey: (index: number) => order[index] ?? index,
      } as VirtualWindowOptions);
    });

    expect(view.result.current.items.map((i) => i.key)).toEqual(["b", "c", "a"]);
    // Index-keyed caching would give [100, 40, 40] here — the tall row's height
    // left behind at position 0, on a row that is now 40px tall.
    expect(view.result.current.items.map((i) => i.size)).toEqual([40, 40, 100]);
    expect(view.result.current.totalSize).toBe(180);
  });

  it("a measured row displaces the ones after it", () => {
    const { ref } = scroller();
    const { result } = windowOf({ scrollRef: ref, count: 3, estimateSize: () => 40 });
    act(() => {
      result.current.measureElement(row(0, 100));
    });
    expect(result.current.items.map((i) => i.start)).toEqual([0, 100, 140]);
  });

  it("ignores a row that reports zero, rather than collapsing the scrollbar", () => {
    /*
     * An element that has not been laid out reports 0. Recording it would
     * collapse the total size to nothing and expand it again a frame later —
     * a visible jump, for a measurement that was never real.
     */
    const { ref } = scroller();
    const { result } = windowOf({ scrollRef: ref, count: 3, estimateSize: () => 40 });
    act(() => {
      result.current.measureElement(row(0, 0));
    });
    expect(result.current.totalSize).toBe(120);
  });

  it("survives a null ref and an element with no data-index", () => {
    const { ref } = scroller();
    const { result } = windowOf({ scrollRef: ref, count: 3 });
    const orphan = document.createElement("div");
    expect(() => {
      act(() => {
        result.current.measureElement(null);
        result.current.measureElement(orphan);
      });
    }).not.toThrow();
  });
});
