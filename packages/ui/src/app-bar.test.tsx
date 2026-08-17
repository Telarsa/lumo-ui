/**
 * app-bar.tsx — the bar names the view, and the actions name themselves.
 *
 * The defect this file exists to catch is the one every app bar has: a title
 * that pushes the actions off the inline end. `min-w-0` on the title column is
 * what prevents it, and a flex item's `min-width: auto` is what makes that
 * necessary — so it is asserted rather than trusted.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppBar } from "./app-bar.tsx";

afterEach(cleanup);

describe("AppBar", () => {
  it("renders the title as a heading, at the level the caller asked for", () => {
    render(<AppBar title="جزئیات سفارش" />);
    expect(screen.getByRole("heading", { level: 2, name: "جزئیات سفارش" })).toBeTruthy();
    cleanup();
    render(<AppBar title="صندوق ورودی" level={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "صندوق ورودی" })).toBeTruthy();
  });

  it("is a header element, so the caller can place it inside the region it heads", () => {
    const html = renderToStaticMarkup(<AppBar title="گزارش‌ها" />);
    expect(html.startsWith("<header")).toBe(true);
  });

  it("keeps the title column shrinkable, so a long title cannot push the actions out", () => {
    const html = renderToStaticMarkup(
      <AppBar title="گزارش فروش شهریور با جزئیات کامل هر فروشگاه" actions={<button type="button">…</button>} />,
    );
    // `min-w-0` is the whole fix; without it the flex item floors at min-content.
    expect(html).toContain("min-w-0");
    expect(html).toContain("truncate");
  });

  it("announces nothing of its own for the slots — they carry their own names", () => {
    render(
      <AppBar
        title="سبد خرید"
        leading={<button type="button">بازگشت</button>}
        actions={<button type="button">هم‌رسانی</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "بازگشت" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "هم‌رسانی" })).toBeTruthy();
  });

  it("renders no subtitle paragraph when there is no subtitle", () => {
    const bare = renderToStaticMarkup(<AppBar title="خانه" />);
    const withSub = renderToStaticMarkup(<AppBar title="خانه" subtitle="۱۲ خوانده‌نشده" />);
    expect(bare).not.toContain("<p ");
    expect(withSub).toContain("۱۲ خوانده‌نشده");
  });

  it("carries the caller's className last, and its own root classes", () => {
    const html = renderToStaticMarkup(<AppBar title="خانه" className="lumo-custom" />);
    expect(html).toContain("lumo-custom");
    // The module's own root delivery — the mutation floor strips `className=`.
    expect(html).toContain("flex");
  });

  it("drops the rule when `divided` is false", () => {
    expect(renderToStaticMarkup(<AppBar title="خانه" />)).toContain("border-b");
    expect(renderToStaticMarkup(<AppBar title="خانه" divided={false} />)).not.toContain("border-b");
  });
});
