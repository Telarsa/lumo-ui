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

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { formatNumber } from "@lumo-ui/core";
import { VirtualList } from "./virtual-list.tsx";
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

  it("POISON TWIN — without a deterministic viewport there are no rows at all", () => {
    // `initialSize` is a required prop precisely because this is what happens
    // without it. Asserted against the same component with a zero viewport,
    // which is what the virtualiser assumes when nothing tells it otherwise.
    //
    // Measured: ZERO rows, not one. The list is served completely empty — no
    // text, therefore no Latin digits, therefore a vacuous pass on every rule
    // the HTML gate owns.
    const html = list({ initialSize: 0 });
    expect(rows(html)).toBe(0);
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

describe("virtualMirror — the arithmetic on its own", () => {
  it("derives isRtl from the locale, which is the lever TanStack defaults wrong", () => {
    // `virtual-core/dist/esm/index.js:274` is `isRtl: false`, and line 119 uses
    // it to sign `scrollLeft`. A horizontal Persian list without this option
    // computes a negative scroll offset and windows the wrong end of the data.
    expect(virtualMirror("fa-IR", "horizontal").isRtl).toBe(true);
    expect(virtualMirror("en-US", "horizontal").isRtl).toBe(false);
  });

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
