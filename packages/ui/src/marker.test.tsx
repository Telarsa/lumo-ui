/**
 * Marker under fa-IR.
 *
 * A server-rendered marker is text in flow: no role, no aria beyond the icon
 * slot's hidden flag, hairlines drawn by pseudo-elements spaced by gap — the
 * physical-margin spelling of that spacing is the upstream defect pinned here.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Marker, MarkerIcon, markerVariants } from "./marker.tsx";

afterEach(cleanup);

const PHYSICAL = /\b(?:-?m[lr]-|p[lr]-|rounded-[lr]-|rounded-[tb][lr]-|border-[lr]\b|border-[lr]-|text-(?:left|right)\b|(?<![a-z-])(?:left|right)-)/;

describe("Marker — three variants, all logical", () => {
  it("no variant emits a physical utility, and rtl/ltr class sets are identical by construction", () => {
    for (const variant of ["status", "separator", "border"] as const) {
      const cls = markerVariants({ variant });
      expect(PHYSICAL.test(cls), `physical utility in "${cls}"`).toBe(false);
    }
  });

  it("the separator draws hairline—label—hairline as flex items spaced by gap, not margins", () => {
    const cls = markerVariants({ variant: "separator" });
    expect(cls).toContain("before:flex-1");
    expect(cls).toContain("after:flex-1");
    expect(cls).toContain("before:bg-border");
    expect(cls).toContain("after:bg-border");
    // Spacing comes from the container's gap, which has no side to get wrong.
    expect(cls).toContain("gap-2");
    expect(cls).not.toMatch(/(?:before|after):-?m[a-z]?-/);
  });

  it("the border variant closes the row on the block-end edge with the logical spelling", () => {
    const cls = markerVariants({ variant: "border" });
    expect(cls).toContain("border-be");
    expect(cls).toContain("pbe-2");
  });
});

describe("Marker — server bytes are quiet and Persian", () => {
  it("renders no role and no aria noise; the icon slot alone is aria-hidden", () => {
    const html = renderToStaticMarkup(
      <Marker>
        <MarkerIcon>
          <svg viewBox="0 0 16 16" />
        </MarkerIcon>
        سارا به گفتگو پیوست
      </Marker>,
    );
    expect(html).not.toContain("role=");
    expect(html).toContain('aria-hidden="true"');
    // Exactly one aria attribute in the whole marker: the icon's hidden flag.
    expect(html.match(/aria-/g)?.length).toBe(1);
    expect(html).toContain("سارا به گفتگو پیوست");
    expect(/[A-Za-z]{3,}/.test(html.replace(/<[^>]+>/g, ""))).toBe(false);
  });

  it("stamps its variant for descendants and centers the status line", () => {
    const { container } = render(<Marker>دیروز</Marker>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("status");
    expect(root.getAttribute("class")).toContain("justify-center");
  });
});
