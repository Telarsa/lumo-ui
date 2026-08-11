/**
 * toolbar.tsx's Base UI claims, pinned — including the two that are LOSSES.
 *
 * A migration test suite that only asserts what still works is a suite that
 * cannot tell you what the migration cost. The membership assertion below
 * asserts that an unwrapped child is NOT in the composite, so the day someone
 * "fixes" it by auto-wrapping (which would turn a separator or a nested group
 * into a focusable button) this file argues with them.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Toolbar, ToolbarItem, ToolbarSeparator } from "./toolbar.tsx";

afterEach(cleanup);

const wrapped = (
  <Toolbar label="قالب‌بندی متن">
    <ToolbarItem>
      <button type="button">پررنگ</button>
    </ToolbarItem>
    <ToolbarSeparator />
    <ToolbarItem>
      <button type="button">مورب</button>
    </ToolbarItem>
  </Toolbar>
);

describe("Toolbar — one named stop, and membership is now explicit", () => {
  it("names the toolbar and states its orientation", () => {
    render(wrapped);
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar.getAttribute("aria-label")).toBe("قالب‌بندی متن");
    expect(toolbar.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("cannot render unnamed — `label` is required, and it reaches the first byte", () => {
    const html = renderToStaticMarkup(wrapped);
    expect(html).toContain('aria-label="قالب‌بندی متن"');
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });

  it("a ToolbarItem child JOINS the composite; a bare child does NOT", () => {
    /**
     * THE COST OF THE MIGRATION, asserted rather than described.
     *
     * React Aria's Toolbar discovered every focusable descendant. Base UI's is a
     * CompositeRoot with a registry, so only `Toolbar.Button` / `Toolbar.Link` /
     * `Toolbar.Input` / `Toolbar.Group` register — which is why `ToolbarItem`
     * exists. `data-focusable` is the engine's own marker for "registered".
     */
    render(
      <Toolbar label="قالب‌بندی متن">
        <ToolbarItem>
          <button type="button">پررنگ</button>
        </ToolbarItem>
        <button type="button">خام</button>
      </Toolbar>,
    );
    const enrolled = screen.getByRole("button", { name: "پررنگ" });
    const bare = screen.getByRole("button", { name: "خام" });

    expect(enrolled.hasAttribute("data-focusable")).toBe(true);
    // The loss, pinned. Arrow keys do not reach this control, and no attribute
    // on the page says so — which is exactly why it is asserted here.
    expect(bare.hasAttribute("data-focusable")).toBe(false);
    expect(bare.hasAttribute("tabindex")).toBe(false);
  });

  it("is ONE tab stop once mounted: a roving tabindex, not N", () => {
    render(wrapped);
    const items = screen.getAllByRole("button");
    expect(items.map((i) => i.getAttribute("tabindex"))).toEqual(["0", "-1"]);
  });

  it("every item is Tab-reachable in the FIRST BYTE, before any JavaScript", () => {
    /**
     * The gap `ToolbarItem` closes. Base UI elects the tabbable member in an
     * effect, so bare Base UI serves `tabindex="-1"` on EVERY item and the
     * toolbar cannot be reached by Tab at all until hydration; React Aria served
     * `tabindex="0"`. It self-heals, so the mounted assertion above passes
     * either way — only the served bytes show it.
     */
    const html = renderToStaticMarkup(wrapped);
    const tabindexes = [...html.matchAll(/tabindex="(-?\d)"/g)].map((m) => m[1]);
    expect(tabindexes.length).toBe(2);
    expect(tabindexes.every((t) => t === "0")).toBe(true);
  });

  it("the separator is not a focus stop and derives its own perpendicular", () => {
    /**
     * The React Aria build hand-wrote `aria-orientation="vertical"`, which is
     * right in a horizontal toolbar and wrong in a vertical one — a latent bug
     * with no vertical toolbar in the repo to reveal it. Both orientations are
     * asserted here so the derivation cannot silently become a constant again.
     */
    render(wrapped);
    const sep = screen.getByRole("separator");
    expect(sep.getAttribute("aria-orientation")).toBe("vertical");
    expect(sep.hasAttribute("tabindex")).toBe(false);
    expect(sep.hasAttribute("data-focusable")).toBe(false);
    cleanup();

    render(
      <Toolbar label="قالب‌بندی متن" orientation="vertical">
        <ToolbarItem>
          <button type="button">پررنگ</button>
        </ToolbarItem>
        <ToolbarSeparator />
      </Toolbar>,
    );
    expect(screen.getByRole("separator").getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("adopts the child element rather than wrapping it — no extra node, class kept", () => {
    const html = renderToStaticMarkup(
      <Toolbar label="قالب‌بندی متن">
        <ToolbarItem>
          <button type="button" className="lumo-child">
            پررنگ
          </button>
        </ToolbarItem>
      </Toolbar>,
    );
    expect(html).toContain("lumo-child");
    // One <button>, not a button inside a button.
    expect(html.split("<button").length - 1).toBe(1);
  });
});
