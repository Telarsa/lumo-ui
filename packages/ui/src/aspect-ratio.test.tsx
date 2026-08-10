/**
 * AspectRatio has no strings, no direction and no behaviour — so what is
 * pinned here is exactly that: it stays a silent box. The one numeric value it
 * owns lives in a style ATTRIBUTE, which no screen reader speaks and the
 * digit gate does not grade, and it must stay there rather than migrate into
 * text where it would render Latin digits on a Persian page.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { AspectRatio } from "./aspect-ratio.tsx";

afterEach(cleanup);

describe("AspectRatio — a ratio is a dimension, not a direction", () => {
  it("carries the ratio as a custom property and sizes with aspect-[var(…)]", () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <p>پیش‌نمایش ویدیو</p>
      </AspectRatio>,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.getPropertyValue("--lumo-aspect-ratio")).toBe(String(16 / 9));
    expect(box.getAttribute("class")).toContain("aspect-[var(--lumo-aspect-ratio)]");
    // `relative` is the contract for absolutely-positioned media children.
    expect(box.getAttribute("class")).toContain("relative");
    expect(box.textContent).toBe("پیش‌نمایش ویدیو");
  });

  it("renders on the server with no role, no aria-* and no visible digits", () => {
    const html = renderToStaticMarkup(
      <AspectRatio ratio={1}>
        <span>مربع</span>
      </AspectRatio>,
    );
    expect(html).not.toContain("aria-");
    expect(html).not.toContain("role=");
    // The number stays in the style attribute; the visible text carries none.
    expect(/[0-9]/.test(html.replace(/<[^>]+>/g, ""))).toBe(false);
    expect(html).toContain("مربع");
  });

  it("merges a caller style without dropping the ratio", () => {
    const { container } = render(<AspectRatio ratio={4 / 3} style={{ maxWidth: "20rem" }} />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.getPropertyValue("--lumo-aspect-ratio")).toBe(String(4 / 3));
    expect(box.style.maxWidth).toBe("20rem");
  });
});
