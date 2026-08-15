/**
 * EXPERIMENT (branch `experiment/base-ui`). VirtualList, on
 * `@tanstack/react-virtual` 3.14.9.
 *
 * ── WHY THE ASSERTIONS ARE ON `renderToStaticMarkup` ───────────────────────
 *
 * Two of the three things worth pinning here are invisible to a jsdom mount:
 *
 *  · Whether the SERVED bytes contain any rows at all. jsdom lays out nothing
 *    either, but a component test would happily assert on a tree that is empty
 *    in both tiers and call it correct.
 *  · The mirrored `transform`. jsdom has no layout engine, so the only honest
 *    place to grade the arithmetic is the string it produces — which is exactly
 *    why `virtualMirror` is a pure function in a directive-free module.
 *
 * The third — `aria-setsize` / `aria-posinset` — is gradeable in either tier
 * and is asserted in the bytes for consistency.
 */

import { createRef } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { formatNumber } from "@lumo-ui/core";
import { VirtualList, type VirtualListHandle } from "./virtual-list.tsx";
import { virtualMirror } from "./virtual-list.variants.ts";

function rows(html: string): number {
  return (html.match(/role="listitem"/g) ?? []).length;
}

function transforms(html: string): string[] {
  return [...html.matchAll(/transform:(translate[XY]\(-?[\d.]+px\))/g)].map(
    (m) => m[1] as string,
  );
}

const list = (extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    <VirtualList
      label="فهرست سفارش‌ها"
      locale="fa-IR"
      count={10_000}
      estimateSize={44}
      initialSize={480}
      {...extra}
    >
      {/* Formatted, not interpolated: a bare `{index}` would put a Latin digit
          in the fixture, which is the defect the rest of the library exists to
          prevent — and it is what makes the gate assertion below meaningful. */}
      {(index) => <span>ردیف {formatNumber(index, "fa-IR")}</span>}
    </VirtualList>,
  );

describe("VirtualList — the served bytes carry real rows", () => {
  it("does not accept a direction that can disagree with locale", () => {
    // @ts-expect-error direction is owned by the required locale.
    void <VirtualList dir="ltr" label="فهرست" locale="fa-IR" count={1} estimateSize={40} initialSize={40}>{() => "ردیف"}</VirtualList>;
    expect(true).toBe(true);
  });

  it("serves a screenful, not an empty list", () => {
    // The defect this pins is the one `chart.variants.ts` records for recharts:
    // a component that contributes nothing to the served HTML is a page-shaped
    // blind spot the gate reports as green. A virtualiser has nothing to
    // virtualise until something measures a viewport, and nothing measures
    // anything on a server — `initialRect` is what supplies one.
    const html = list();
    expect(rows(html)).toBeGreaterThan(10);
    // And the rows carry real, gradeable text — this is the whole point of
    // serving them. `no-latin-digits` and `persian-digit-floor` can now see a
    // virtualised list, which they could not if the window were empty.
    expect(html).toContain(`ردیف ${formatNumber(0, "fa-IR")}`);
    expect(html).toMatch(/[۰-۹]/);
  });

  it("POISON TWIN — without a deterministic viewport, most of the screenful is missing", () => {
    /*
     * `initialSize` is a required prop precisely because of this. Asserted
     * against the same component with a zero viewport, which is what a
     * virtualiser assumes when nothing tells it otherwise.
     *
     * ── THIS ASSERTION CHANGED WHEN THE VIRTUALISER BECAME OURS ────────────
     *
     * Under `@tanstack/react-virtual` the measured answer was ZERO rows: the
     * list was served completely empty, so it had no text, therefore no Latin
     * digits, therefore a vacuous pass on every rule the HTML gate owns.
     *
     * `virtualizer.ts` serves 9 — the first row plus the overscan, because
     * overscan is applied to the window rather than gated on it being
     * non-empty. That is a real improvement and it is worth naming: a Lumo
     * virtualised list can no longer be a completely blank region in the served
     * bytes, whatever the caller passes. The gate cannot be made structurally
     * blind here by a misconfiguration.
     *
     * `initialSize` is still REQUIRED, and this is still a poison twin, because
     * 9 is less than half of the 20 the real viewport needs. A list that serves
     * under half its screenful is a list whose first paint is short and whose
     * scrollbar is wrong — quieter than blank, and quieter is worse.
     */
    expect(rows(list({ initialSize: 0 }))).toBe(9);
    expect(rows(list())).toBe(20);
  });

  it("renders a WINDOW and not the corpus", () => {
    // The other half of the claim: if this ever rendered all 10,000 rows the
    // first assertion would still pass and the component would be pointless.
    expect(rows(list())).toBeLessThan(100);
  });

  it("the scrollable length is the whole corpus, not the window", () => {
    // 10,000 × 44px. This is what makes the scrollbar honest before a single
    // row has been measured for real.
    expect(list()).toContain("block-size:440000px");
  });
});

describe("VirtualList — the set size is the corpus", () => {
  it("every row states its true position in ten thousand", () => {
    const html = list();
    expect(html).toContain('aria-setsize="10000"');
    expect(html).toContain('aria-posinset="1"');
    // 1-based, like aria-setsize: a zero here would announce the first row as the row before the first.
    expect(html).not.toContain('aria-posinset="0"');
    // The window is a window: the last rendered row is not the last row.
    expect(html).not.toContain('aria-posinset="10000"');
  });

  it("the set size is a RAW integer, never a Persian numeral", () => {
    // `aria-setsize` is an attribute carrying an integer, and a screen reader
    // announces it in its own numbering system. A `formatNumber`ed value here
    // is not a localisation, it is an invalid attribute value — and it would
    // look MORE correct in review than the right answer does.
    const html = list();
    expect(html).toContain('aria-setsize="10000"');
    expect(html).not.toMatch(/aria-setsize="[۰-۹٬]+"/);
  });

  it("the list itself is one named tab stop", () => {
    const html = list();
    expect(html).toContain('role="list"');
    expect(html).toContain('aria-label="فهرست سفارش‌ها"');
    expect(html).toContain('tabindex="0"');
    // The positioning box is layout-only. If it remains a generic AX node,
    // VoiceOver counts that one wrapper and announces “list … 1 item” even
    // though the rendered descendants are listitems with aria-setsize.
    expect(html).toMatch(/role="list"[^>]*>\s*<div[^>]*role="presentation"/);
    // Rows must NOT be focusable: ten thousand tab stops is a keyboard trap.
    expect(html).not.toMatch(/role="listitem"[^>]*tabindex/);
  });
});

describe("VirtualList — direction", () => {
  it("a vertical list is identical in both locales", () => {
    // The block axis has no direction term in any horizontal writing mode.
    // Asserting this is what stops someone "fixing" the vertical branch too.
    const fa = transforms(list());
    const en = transforms(
      renderToStaticMarkup(
        <VirtualList
          label="Orders"
          locale="en-US"
          count={10_000}
          estimateSize={44}
          initialSize={480}
        >
          {(index) => <span>row {index}</span>}
        </VirtualList>,
      ),
    );
    expect(fa).toEqual(en);
    expect(fa[1]).toBe("translateY(44px)");
  });

  it("a HORIZONTAL list advances toward the reading start under RTL", () => {
    // CSS has no logical transform: `translateX(+n)` moves an element toward
    // the physical right in every direction, and a row anchored at
    // `start-0` under `dir="rtl"` starts at the physical RIGHT. So advancing
    // along the reading axis is a NEGATIVE translation, and the sign is the
    // whole correction.
    const html = list({ orientation: "horizontal" });
    const t = transforms(html);
    expect(t[0]).toBe("translateX(0px)");
    expect(t[1]).toBe("translateX(-44px)");
  });

  it("and positively under LTR, so one code path serves both", () => {
    const html = renderToStaticMarkup(
      <VirtualList
        label="Orders"
        locale="en-US"
        count={10_000}
        estimateSize={44}
        initialSize={480}
        orientation="horizontal"
      >
        {(index) => <span>row {index}</span>}
      </VirtualList>,
    );
    expect(transforms(html)[1]).toBe("translateX(44px)");
  });
});

describe("VirtualList — imperative scrolling", () => {
  it("scrolls its owned viewport to an item index", () => {
    const ref = createRef<VirtualListHandle>();
    const view = render(
      <VirtualList
        ref={ref}
        label="Orders"
        locale="en-US"
        count={100}
        estimateSize={40}
        initialSize={200}
      >
        {(index) => <span>row {index}</span>}
      </VirtualList>,
    );

    const viewport = view.getByRole("list");
    ref.current?.scrollToIndex(25);

    expect(viewport.scrollTop).toBe(1_000);
  });
});

describe("VirtualList — async range seam", () => {
  it("announces only active remote work as busy", () => {
    const renderList = (asyncStatus: "loading-more" | "error") => (
      <VirtualList
        label="Orders"
        locale="en-US"
        count={2}
        estimateSize={40}
        initialSize={80}
        asyncStatus={asyncStatus}
      >
        {(index) => <span>row {index}</span>}
      </VirtualList>
    );

    const view = render(renderList("loading-more"));
    expect(view.getByRole("list").getAttribute("aria-busy")).toBe("true");

    view.rerender(renderList("error"));
    expect(view.getByRole("list").hasAttribute("aria-busy")).toBe(false);
  });

  it("reports the true visible range and requests the next page once per corpus size", () => {
    const viewportHeight = vi
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockReturnValue(200);
    const onVisibleRangeChange = vi.fn();
    const onEndReached = vi.fn();
    const renderList = (count: number, endReachedThreshold = 0) => (
      <VirtualList
        label="Orders"
        locale="en-US"
        count={count}
        estimateSize={40}
        initialSize={200}
        overscan={0}
        onVisibleRangeChange={onVisibleRangeChange}
        onEndReached={onEndReached}
        endReachedThreshold={endReachedThreshold}
      >
        {(index) => <span>row {index}</span>}
      </VirtualList>
    );

    const view = render(renderList(3));
    expect(onVisibleRangeChange).toHaveBeenLastCalledWith({ startIndex: 0, endIndex: 2 });
    expect(onEndReached).toHaveBeenCalledOnce();

    // Change an effect dependency while keeping the corpus size fixed. A plain
    // rerender never reruns the effect and therefore cannot prove the per-count
    // request guard exists.
    view.rerender(renderList(3, 1));
    expect(onEndReached).toHaveBeenCalledOnce();

    view.rerender(renderList(5));
    expect(onVisibleRangeChange).toHaveBeenLastCalledWith({ startIndex: 0, endIndex: 4 });
    expect(onEndReached).toHaveBeenCalledTimes(2);
    viewportHeight.mockRestore();
  });
});

describe("virtualMirror — the arithmetic on its own", () => {
  /*
   * `isRtl` was asserted here until 11 Aug 2026, because TanStack's option
   * defaulted to `false` and a horizontal Persian list without it windowed the
   * wrong end of the data. The option is gone with the dependency —
   * `virtualizer.ts` reads `Math.abs(scrollLeft)`, which needs no flag — so the
   * field was deleted rather than left exported and unread. What replaces this
   * assertion is `virtualizer.test.ts`, which grades the scroll behaviour the
   * flag used to configure.
   */

  it("reports the direction it derived rather than one it was told", () => {
    expect(virtualMirror("fa-IR", "vertical").direction).toBe("rtl");
    expect(virtualMirror("en-US", "vertical").direction).toBe("ltr");
  });

  it("the vertical branch is byte-identical across locales (guards a vacuous pass)", () => {
    expect(virtualMirror("fa-IR", "vertical").mainAxisTranslate(120)).toBe(
      virtualMirror("en-US", "vertical").mainAxisTranslate(120),
    );
    expect(virtualMirror("fa-IR", "horizontal").mainAxisTranslate(120)).not.toBe(
      virtualMirror("en-US", "horizontal").mainAxisTranslate(120),
    );
  });
});
