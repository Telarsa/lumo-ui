/**
 * The measured claims in menubar.tsx's header, pinned.
 *
 * The big one is the ROLE decision: RAC 1.20 ships no Menubar (grepped in its
 * dist, recorded in the component header), so Lumo ships a Toolbar of
 * MenuTriggers and says so. The role assertions below are the alarm that goes
 * red when React Aria gains a real menubar — at which point this file's shape
 * is renegotiated rather than silently left behind.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Menubar, MenubarButton } from "./menubar.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";

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

const bar = (defaultOpen = false) => (
  <Menubar label="نوار منو">
    <MenuTrigger {...(defaultOpen ? { defaultOpen: true } : {})}>
      <MenubarButton>پرونده</MenubarButton>
      <MenuPopover>
        <Menu>
          <MenuItem id="new">سند تازه</MenuItem>
          <MenuItem id="open">باز کردن</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
    <MenuTrigger>
      <MenubarButton>ویرایش</MenubarButton>
      <MenuPopover>
        <Menu>
          <MenuItem id="undo">واگرد</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  </Menubar>
);

describe("Menubar — a named toolbar of menu triggers", () => {
  it("is ONE named toolbar stop, honestly role=toolbar and never role=menubar", () => {
    render(bar());

    const toolbar = screen.getByRole("toolbar");
    expect(toolbar.getAttribute("aria-label")).toBe("نوار منو");

    // The pin. RAC 1.20 cannot express role="menubar" (see the header); the
    // day an element with that role appears here, this assertion goes red and
    // the Toolbar-of-MenuTriggers shape is up for renegotiation.
    expect(document.querySelector('[role="menubar"]')).toBeNull();
    expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
  });

  it("each trigger advertises its menu — RAC's wiring, not restated locally", () => {
    render(bar());
    const triggers = screen.getAllByRole("button");
    expect(triggers).toHaveLength(2);
    for (const trigger of triggers) {
      expect(trigger.getAttribute("aria-haspopup")).not.toBeNull();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("an open menu is RAC's role=menu with the Persian items", () => {
    render(bar(true));

    expect(screen.getByRole("menu")).toBeTruthy();
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["سند تازه", "باز کردن"]);
    // `hidden: true` because RAC's ariaHideOutside marks everything outside
    // the open modal popover aria-hidden — including the trigger row. That is
    // RAC's own overlay behaviour, worth knowing rather than fighting.
    const trigger = screen
      .getAllByRole("button", { hidden: true })
      .find((b) => b.textContent === "پرونده");
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");

    // The only English in the open state is the popover's own pinned pair of
    // unreachable "Dismiss" buttons — popover.tsx's header records why, and
    // overlays.test.tsx pins the exact count. Nothing menubar adds may join it.
    const english = spokenAttributes().filter((v) => LATIN_WORD.test(v));
    expect(english.every((v) => v === "Dismiss")).toBe(true);
  });

  it("contributes no English to the first byte, closed", () => {
    const html = renderToStaticMarkup(bar());
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(html).toContain("پرونده");
    expect(html).toContain("ویرایش");
  });
});
