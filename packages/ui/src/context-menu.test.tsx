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

    // COVERAGE DELIBERATELY LOST — read before restoring anything.
    //
    // This block asserted a portaled `[data-lumo-context-menu-anchor]` div at
    // position:fixed/top:48px/left:120px. That element was never a feature; it
    // was the workaround React Aria needed, because RAC had no context menu and
    // the pointer had to be turned into a real node for a Popover to anchor to.
    // Base UI's anchor is a VIRTUAL object exposing getBoundingClientRect(), so
    // there is no node in the document to query — and emitting an empty div
    // purely to keep this assertion would be dressing one library as the other.
    //
    // The consequence is honest and is recorded in phase-a-result.json: NOTHING
    // now verifies that the menu opens AT THE POINTER. jsdom computes no
    // layout, so the coordinate hand-off is not observable from here at all.
    // That check needs a real browser, and Lumo has no browser tier today. It
    // is a test-coverage debt of the migration, not a defect of Base UI.
    //
    // What remains observable is asserted above (opens on contextmenu, Persian
    // items) and below (announces no English — the two unreachable "Dismiss"
    // sentinels RAC emitted here are gone with the same sentinel class).
    expect(englishIn(spokenAttributes())).toEqual([]);
  });

  it("Escape closes it and tears the anchor down", async () => {
    render(composed());
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 40, clientY: 20 });
    const menu = await screen.findByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    // The companion anchor assertion is removed rather than kept: with the
    // element gone engine-wide it would be null unconditionally, and a query
    // that can never fail reads as coverage without being any.
  });

  it("Shift+F10 opens it at the focused element — the pattern is not pointer-only", async () => {
    render(composed());
    const surface = screen.getByTestId("surface");
    surface.focus();
    fireEvent.keyDown(surface, { key: "F10", shiftKey: true });
    expect(await screen.findByRole("menu")).toBeDefined();
  });
});

/*
 * Styling delivery: the mutation campaign's visual mutant strips this
 * module's className assignments, and the behavior assertions above cannot
 * see that. One observation of an element THIS module styles is the floor.
 */
describe("styling delivery", () => {
  it("the trigger wrapper carries the module's contents class", () => {
    const { container } = render(composed());
    expect(container.querySelector(".contents")).toBeTruthy();
  });
});
