/**
 * The measured claims in menubar.tsx's header, pinned.
 *
 * ═══ THIS FILE'S ALARM FIRED, AND THIS IS THE FLIP ══════════════════════════
 *
 * The React Aria version of this suite pinned the OPPOSITE of what it now
 * asserts:
 *
 *     expect(document.querySelector('[role="menubar"]')).toBeNull();
 *     expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
 *
 * because RAC 1.20 shipped no Menubar — `role="menubar"` appeared nowhere in
 * its dist — so Lumo shipped a Toolbar of MenuTriggers and said so. The
 * component header promised: "If RAC ships a Menubar, this file adopts it and
 * the role assertion in menubar.test.tsx goes red to say so."
 *
 * Base UI 1.7.0 ships one, the assertion went red, and the shape was
 * renegotiated rather than the test relaxed. What replaced it is STRICTLY
 * STRONGER: asserting that a role is PRESENT on a named element rules out every
 * tree the old assertion allowed except the correct one, where asserting a role
 * is absent was satisfied by any markup at all — including no menubar.
 *
 * That is the distinction that makes this a legitimate restatement. The old
 * assertions pinned React Aria's VOCABULARY (what RAC could express), not a
 * behaviour Lumo promised its users. The behaviours the old suite pinned —
 * one Persian-named row, every trigger advertising its menu, no English in the
 * first byte — are all still here and all still asserted.
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

describe("Menubar — a real, named role=menubar", () => {
  it("is ONE named menubar stop whose triggers are menuitems", () => {
    render(bar());

    const menubar = screen.getByRole("menubar");
    expect(menubar.getAttribute("aria-label")).toBe("نوار منو");
    // The orientation is the engine's, and it is what tells assistive
    // technology which arrow keys move along the row.
    expect(menubar.getAttribute("aria-orientation")).toBe("horizontal");

    // THE FLIPPED PIN. Both triggers carry the menubar's own child role, so the
    // row is a menubar in the accessibility tree rather than a lookalike.
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["پرونده", "ویرایش"]);

    // And the shape it replaced is gone, which is the other half of the flip:
    // a tree carrying BOTH roles would be two containers claiming one row.
    expect(document.querySelector('[role="toolbar"]')).toBeNull();
  });

  it("is ONE tab stop: a roving tabindex, not two tabbable triggers", () => {
    render(bar());
    const items = screen.getAllByRole("menuitem");
    // Exactly one member is tabbable once mounted — that is what makes
    // `role="menubar"` a single stop rather than N.
    expect(items.map((i) => i.getAttribute("tabindex"))).toEqual(["0", "-1"]);
  });

  it("every trigger is Tab-reachable in the FIRST BYTE, before any JavaScript", () => {
    /**
     * The gap `MenubarButton` exists to close, and the reason it needs a
     * hydration flag rather than a constant.
     *
     * Base UI elects the one tabbable member of a roving tabindex in an effect,
     * and an effect does not run on the server — so bare Base UI serves
     * `tabindex="-1"` on EVERY trigger and the menubar cannot be reached by Tab
     * at all until hydration. React Aria's row served `tabindex="0"`. The defect
     * self-heals, so the mounted test above passes either way; only the served
     * bytes show it, which is why this assertion is on `renderToStaticMarkup`.
     */
    const html = renderToStaticMarkup(bar());
    const tabindexes = [...html.matchAll(/tabindex="(-?\d)"/g)].map((m) => m[1]);
    expect(tabindexes.length).toBeGreaterThan(0);
    expect(tabindexes.every((t) => t === "0")).toBe(true);
  });

  it("each trigger advertises its menu — the engine's wiring, not restated locally", () => {
    render(bar());
    const triggers = screen.getAllByRole("menuitem");
    expect(triggers).toHaveLength(2);
    for (const trigger of triggers) {
      expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("serves aria-expanded in the first byte, which bare Base UI does not", () => {
    // menu.tsx's `useOpenMirror`, measured through the menubar path. Base UI's
    // `Menu.Trigger` serves `aria-haspopup="menu"` alone; the attribute below
    // exists only because the wrapper supplies the real value.
    const html = renderToStaticMarkup(bar());
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('role="menubar"');
    expect(html).toContain('role="menuitem"');
  });

  it("an open menu is a role=menu with the Persian items", () => {
    render(bar(true));

    expect(screen.getByRole("menu")).toBeTruthy();
    // The menubar's own triggers are menuitems too, so the open menu's items are
    // the ones INSIDE the role="menu" — asserting on the whole document would
    // now match four elements rather than two, which is the honest consequence
    // of the row having become a real menubar.
    const items = screen.getAllByRole("menuitem", { hidden: true });
    expect(items.map((i) => i.textContent)).toContain("سند تازه");
    expect(items.map((i) => i.textContent)).toContain("باز کردن");

    const trigger = items.find((i) => i.textContent === "پرونده");
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");

    // React Aria bracketed every open popover with two unreachable "Dismiss"
    // sentinels and this suite budgeted for them. Base UI renders none —
    // dismissal is a listener, not a focusable element — so the expected set is
    // now EMPTY, which is the tightened form of the same rule.
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });

  it("contributes no English to the first byte, closed", () => {
    const html = renderToStaticMarkup(bar());
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(html).toContain("پرونده");
    expect(html).toContain("ویرایش");
  });
});
