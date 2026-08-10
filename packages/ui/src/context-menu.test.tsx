/**
 * ContextMenu under fa-IR.
 *
 * The wrapper's own claims, pinned: right-click opens menu.tsx's menu at the
 * pointer through a portaled virtual anchor; the keyboard path (Shift+F10)
 * opens it too; closed, it contributes nothing to the served bytes; and open,
 * it carries exactly the two unreachable "Dismiss" labels every RAC popover
 * does — the count popover.tsx measured, re-pinned here so a RAC upgrade that
 * changes it fails the build.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { ContextMenu, ContextMenuTrigger } from "./context-menu.tsx";
import { MenuItem, MenuSeparator } from "./menu.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

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

const englishIn = (values: string[]) => values.filter((v) => LATIN_WORD.test(v));

function composed() {
  return (
    <ContextMenuTrigger>
      <div data-testid="surface" tabIndex={0}>
        روی این کارت راست‌کلیک کنید
      </div>
      <ContextMenu>
        <MenuItem id="duplicate">رونوشت</MenuItem>
        <MenuItem id="rename">تغییر نام</MenuItem>
        <MenuSeparator />
        <MenuItem id="remove">حذف</MenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  );
}

describe("ContextMenu — closed is the served state", () => {
  it("the first byte holds the surface and nothing of the menu", () => {
    const html = renderToStaticMarkup(composed());
    expect(html).toContain("راست‌کلیک");
    expect(html).not.toContain('role="menu"');
    expect(html).not.toContain("رونوشت");
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });
});

describe("ContextMenu — opened at the pointer", () => {
  it("right-click opens menu.tsx's menu with Persian items and the anchor at the pointer", async () => {
    render(composed());
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 120, clientY: 48 });

    const menu = await screen.findByRole("menu");
    expect(menu).toBeDefined();
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual(["رونوشت", "تغییر نام", "حذف"]);

    // The virtual trigger: a fixed point at clientX/clientY. Physical top/left
    // on purpose — pointer coordinates are viewport-physical in both scripts.
    const anchor = document.querySelector<HTMLElement>("[data-lumo-context-menu-anchor]");
    expect(anchor).not.toBeNull();
    expect(anchor?.style.position).toBe("fixed");
    expect(anchor?.style.top).toBe("48px");
    expect(anchor?.style.left).toBe("120px");

    // The popover.tsx count, re-pinned: exactly two unreachable "Dismiss".
    expect(englishIn(spokenAttributes())).toEqual(["Dismiss", "Dismiss"]);
  });

  it("Escape closes it and tears the anchor down", async () => {
    render(composed());
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 40, clientY: 20 });
    const menu = await screen.findByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.querySelector("[data-lumo-context-menu-anchor]")).toBeNull();
  });

  it("Shift+F10 opens it at the focused element — the pattern is not pointer-only", async () => {
    render(composed());
    const surface = screen.getByTestId("surface");
    surface.focus();
    fireEvent.keyDown(surface, { key: "F10", shiftKey: true });
    expect(await screen.findByRole("menu")).toBeDefined();
  });
});
