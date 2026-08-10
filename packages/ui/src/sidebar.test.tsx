/**
 * sidebar.tsx's claims, pinned. The one that earns its test is the collapse
 * contract: the rail hides text with `sr-only`, so every accessible name must
 * survive collapsing BYTE-IDENTICAL — a regression to `hidden` renders a
 * column of unnamed icon links, which is the measured 33-unnamed-controls
 * defect wearing a nicer coat.
 */

import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from "./sidebar.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

/** Every string a screen reader would speak from an attribute, in the live DOM. */
function spokenAttributes(): string[] {
  const out: string[] = [];
  for (const el of document.querySelectorAll(
    "[aria-label],[aria-roledescription],[aria-valuetext],[aria-placeholder],[title]",
  )) {
    for (const attr of ["aria-label", "aria-roledescription", "aria-valuetext", "aria-placeholder", "title"]) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
}

const app = (defaultCollapsed = false) => (
  <Sidebar label="ناوبری اصلی" defaultCollapsed={defaultCollapsed}>
    <SidebarHeader>لومو</SidebarHeader>
    <SidebarContent>
      <SidebarGroup title="گزارش‌ها">
        <SidebarItem href="/dash" icon={<svg aria-hidden="true" />} isCurrent="page">
          داشبورد
        </SidebarItem>
        <SidebarItem href="/orders" icon={<svg aria-hidden="true" />} badge="۳">
          سفارش‌ها
        </SidebarItem>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarTrigger collapseLabel="جمع‌کردن نوار کناری" expandLabel="بازکردن نوار کناری" />
    </SidebarFooter>
  </Sidebar>
);

describe("Sidebar — a named landmark whose names survive the rail", () => {
  it("names the nav, the group, and the current page", () => {
    render(app());

    expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe("ناوبری اصلی");

    // The group heading is WIRED, not decorative: role=group names itself
    // via aria-labelledby pointing at the visible title element.
    const group = screen.getByRole("group");
    const titleId = group.getAttribute("aria-labelledby") ?? "";
    expect(document.getElementById(titleId)?.textContent).toBe("گزارش‌ها");

    const current = screen.getByRole("link", { name: "داشبورد" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.getAttribute("data-current")).toBe("true");
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });

  it("shows the badge count in the digits the consumer formatted", () => {
    render(app());
    // «۳» arrives pre-formatted — LumoNode makes the raw 3 uncompilable, so
    // the only thing to check is that it reached the row intact and is part
    // of the item's announced content.
    const item = screen.getByRole("link", { name: /سفارش‌ها/ });
    expect(item.textContent).toContain("۳");
    expect(item.textContent).not.toMatch(/[0-9]/);
  });

  it("collapsing keeps every accessible name and swaps the trigger's", () => {
    render(app());
    const nav = screen.getByRole("navigation");
    expect(nav.hasAttribute("data-collapsed")).toBe(false);

    act(() => {
      screen.getByRole("button", { name: "جمع‌کردن نوار کناری" }).click();
    });

    expect(nav.hasAttribute("data-collapsed")).toBe(true);
    // The names survive the rail — sr-only, not hidden. If either query fails
    // here, someone traded sr-only away and unnamed the whole rail.
    expect(screen.getByRole("link", { name: "داشبورد" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /سفارش‌ها/ })).toBeTruthy();
    // The toggle now announces the OTHER action.
    expect(screen.getByRole("button", { name: "بازکردن نوار کناری" })).toBeTruthy();
  });

  it("supports the controlled form for an out-of-tree toggle", () => {
    render(
      <Sidebar label="ناوبری اصلی" isCollapsed>
        <SidebarContent>
          <SidebarItem href="/dash" icon={<svg aria-hidden="true" />}>
            داشبورد
          </SidebarItem>
        </SidebarContent>
      </Sidebar>,
    );
    expect(screen.getByRole("navigation").hasAttribute("data-collapsed")).toBe(true);
  });

  it("renders its first byte in Persian with no English attribute", () => {
    const html = renderToStaticMarkup(app());
    expect(html).toContain('aria-label="ناوبری اصلی"');
    expect(html).toContain("داشبورد");
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });

  it("the collapsed first byte still contains the names", () => {
    const html = renderToStaticMarkup(app(true));
    expect(html).toContain("data-collapsed");
    expect(html).toContain("داشبورد");
    expect(html).toContain("سفارش‌ها");
    expect(html).toContain('aria-label="بازکردن نوار کناری"');
  });
});
