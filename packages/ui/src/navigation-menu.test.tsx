/**
 * navigation-menu.tsx's claims, pinned: the landmark is named, the panel is a
 * popover (links stay links — no menu role lying about menuitems), the
 * current page is stated in `aria-current`, and the panel trigger carries
 * RAC's expanded state rather than a mirrored useState.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "./navigation-menu.tsx";

afterEach(cleanup);

const nav = (defaultOpen = false) => (
  <NavigationMenu label="ناوبری اصلی">
    <NavigationMenuItem {...(defaultOpen ? { defaultOpen: true } : {})}>
      <NavigationMenuTrigger>محصولات</NavigationMenuTrigger>
      <NavigationMenuPanel>
        <NavigationMenuLink href="/lumo" description="سیستم طراحی فارسی‌محور">
          لومو
        </NavigationMenuLink>
        <NavigationMenuLink href="/khroos">خروس</NavigationMenuLink>
      </NavigationMenuPanel>
    </NavigationMenuItem>
    <NavigationMenuLink href="/pricing" isCurrent="page">
      قیمت‌ها
    </NavigationMenuLink>
  </NavigationMenu>
);

describe("NavigationMenu — a named landmark whose panels are popovers", () => {
  it("names the <nav> landmark in Persian", () => {
    render(nav());
    expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe("ناوبری اصلی");
  });

  it("marks the current page with aria-current, not colour or an sr-only phrase", () => {
    render(nav());
    const current = screen.getByRole("link", { name: "قیمت‌ها" });
    expect(current.getAttribute("aria-current")).toBe("page");
    // RAC reflects it as data-current, which is what the sunken style reads.
    expect(current.getAttribute("data-current")).toBe("true");
  });

  it("the trigger carries RAC's expanded state and an aria-hidden block-axis chevron", () => {
    render(nav());
    const trigger = screen.getByRole("button", { name: "محصولات" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // The chevron is decoration; the name must be exactly the visible word.
    const svg = trigger.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("an open panel holds LINKS — no role=menu, no role=menuitem anywhere", () => {
    render(nav(true));

    // `hidden: true` because RAC's ariaHideOutside marks everything outside
    // the open modal popover aria-hidden, the trigger row included.
    const trigger = screen
      .getAllByRole("button", { hidden: true })
      .find((b) => b.textContent?.includes("محصولات"));
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    // The panel content: real links with their descriptions inside the target.
    const lumo = screen.getByRole("link", { name: /لومو/ });
    expect(lumo.getAttribute("href")).toBe("/lumo");
    expect(lumo.textContent).toContain("سیستم طراحی فارسی‌محور");

    // The promise named in the header: a marketing panel is generic content,
    // not an application menu. If a menu role ever appears, the semantics
    // changed and this pin says so.
    expect(document.querySelector('[role="menu"],[role="menuitem"]')).toBeNull();
  });

  it("contributes no English to the first byte, closed", () => {
    const html = renderToStaticMarkup(nav());
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(html).toContain("محصولات");
    expect(html).toContain("قیمت‌ها");
  });
});
