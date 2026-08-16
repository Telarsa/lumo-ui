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
  sidebarItemVariants,
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
  it("requires the icon that keeps an item visible in collapsed mode", () => {
    void (
      <Sidebar label="ناوبری">
        {/* @ts-expect-error every SidebarItem can be rendered in collapsed mode */}
        <SidebarItem href="/text-only">فقط متن</SidebarItem>
      </Sidebar>
    );
  });

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

  /*
   * ── THE TWO DEFECTS THIS BLOCK EXISTS FOR ──────────────────────────────────
   *
   * A row's hover treatment was written as `data-hovered:`, which is React
   * Aria's vocabulary. `link.tsx` gave up its React Aria runtime and nothing
   * else writes the attribute, so the classes styled nothing while reading as a
   * hover state to every grep and every reviewer — and `Link`'s own
   * `hover:underline` was left uncancelled, so the ONE hover effect that fired
   * was the one being suppressed.
   *
   * And the current row's fill collided with the hover it was meant to be
   * distinguishable from: `--lumo-sys-surface-sunken` and
   * `--lumo-sys-surface-hover` are the SAME `--lumo-ref-neutral-100` on the
   * light theme, so fixing the attribute alone would have made every hovered
   * row look like the current one.
   *
   * Both are class-string facts, so both are asserted against the class string.
   * jsdom models no pointer (see state-vocabulary.test.tsx), which is exactly
   * why a rendered-state test could never have caught either one.
   */
  describe("the row's hover and current treatments are real, and are different", () => {
    it("styles :hover, never an attribute nothing writes", () => {
      const classes = sidebarItemVariants();
      expect(classes).not.toContain("data-hovered");
      expect(classes).toContain("hover:bg-surface-hover");
      // The cancel for `Link`'s `quiet` variant, which underlines on hover.
      expect(classes).toContain("hover:no-underline");
    });

    it("and the served row carries no dead attribute selector either", () => {
      expect(renderToStaticMarkup(app())).not.toContain("data-hovered");
    });

    it("the current row does not resolve to the hover fill", () => {
      /*
       * The comparison, not a presence check — presence is what let this ship.
       * `bg-surface-hover` and `bg-surface-sunken` are literally different
       * strings and resolved to the same colour, so the assertion is on the
       * TOKEN FAMILY: the current state must not be another step on the neutral
       * surface ramp, because that ramp is where the collision lives.
       */
      const classes = sidebarItemVariants();
      const current = classes
        .split(/\s+/)
        .filter((c) => c.startsWith("data-current:"))
        .join(" ");
      expect(current, "the current row has no treatment at all").not.toBe("");
      expect(current, "the current row is painted from the ramp its hover sits on").not.toMatch(
        /bg-surface/,
      );
      // Two channels, not one — WCAG 1.4.1. Colour alone is not a difference.
      expect(current).toContain("data-current:font-medium");
    });
  });
});
