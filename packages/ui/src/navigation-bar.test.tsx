/**
 * navigation-bar.tsx — the bar is named, and the count survives the icon.
 *
 * The defect this file exists to catch is the tempting one: parking the badge
 * inside the icon's `aria-hidden` wrapper because that is where it sits
 * visually. Do that and «سفارش‌ها، ۱۲» is announced as «سفارش‌ها» — the count is
 * decoration to the eye and information to everyone else.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { NavigationBar, NavigationBarItem } from "./navigation-bar.tsx";

afterEach(cleanup);

const bar = (
  <NavigationBar label="ناوبری اصلی">
    <NavigationBarItem href="/" isCurrent="page">
      خانه
    </NavigationBarItem>
    <NavigationBarItem href="/orders" badge="۱۲">
      سفارش‌ها
    </NavigationBarItem>
    <NavigationBarItem href="/profile">نمایه</NavigationBarItem>
  </NavigationBar>
);

describe("NavigationBar", () => {
  it("is a named navigation landmark — a page with a bottom bar has more than one", () => {
    render(bar);
    expect(screen.getByRole("navigation", { name: "ناوبری اصلی" })).toBeTruthy();
  });

  it("renders destinations as links, not buttons: on the web a tab bar navigates", () => {
    render(bar);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("says which destination you are on with aria-current, never with colour alone", () => {
    render(bar);
    const current = screen.getByRole("link", { name: /خانه/ });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /نمایه/ }).getAttribute("aria-current")).toBe(null);
  });

  it("announces the badge as part of the destination's name", () => {
    render(bar);
    // The whole point: the count reaches the accessible name.
    expect(screen.getByRole("link", { name: "سفارش‌ها ۱۲" })).toBeTruthy();
  });

  it("hides the glyph from the tree — the label under it already says the word", () => {
    const html = renderToStaticMarkup(
      <NavigationBar label="ناوبری اصلی">
        <NavigationBarItem href="/" icon={<svg />}>
          خانه
        </NavigationBarItem>
      </NavigationBar>,
    );
    expect(html).toContain('aria-hidden="true"');
    // …and the badge is NOT inside that wrapper.
    const hiddenSpan = html.slice(html.indexOf('aria-hidden="true"'));
    expect(hiddenSpan.slice(0, hiddenSpan.indexOf("</span>"))).not.toContain("۱۲");
  });

  it("places the badge on the logical inline edge, not a physical one", () => {
    const html = renderToStaticMarkup(bar);
    expect(html).toContain("inset-inline-end-2");
    expect(html).not.toContain("right-2");
  });

  it("carries the caller's className last, and its own root classes", () => {
    const html = renderToStaticMarkup(
      <NavigationBar label="ناوبری اصلی" className="lumo-custom">
        <NavigationBarItem href="/">خانه</NavigationBarItem>
      </NavigationBar>,
    );
    expect(html).toContain("lumo-custom");
    expect(html).toContain("border-t");
  });
});
