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
import { ToggleButton } from "./toggle-group.tsx";

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

  it("serves EXACTLY ONE tab stop in the FIRST BYTE, before any JavaScript", () => {
    /**
     * The gap `ToolbarItem` closes, and the OVERSHOOT it used to close it with.
     *
     * Base UI elects the tabbable member in an effect, so bare Base UI serves
     * `tabindex="-1"` on EVERY item and the toolbar cannot be reached by Tab at
     * all until hydration; React Aria served `tabindex="0"`. It self-heals, so
     * the mounted assertion above passes either way — only the served bytes
     * show it.
     *
     * ── THIS ASSERTION WAS REVERSED, AND THAT IS THE POINT ─────────────────
     *
     * It used to read `tabindexes.every((t) => t === "0")`. That answered the
     * TOTAL failure with the DEGRADED one — N stops for a widget whose role
     * exists to collapse them — which is the React Aria TagGroup failure
     * `useCompositeTabStop`'s header names and `tag-group.tsx` was written to
     * fix. Measured on the export before this commit, the five toolbars in the
     * build served 2, 3, 3, 4 and 5 stops.
     *
     * The claim is strictly stronger than the one it replaces: zero stops still
     * fails it, and N stops now fails it too.
     */
    const html = renderToStaticMarkup(wrapped);
    const tabindexes = [...html.matchAll(/tabindex="(-?\d)"/g)].map((m) => m[1]);
    expect(tabindexes).toEqual(["0", "-1"]);
  });

  it("designates the FIRST ToolbarItem, not the first child", () => {
    /**
     * A separator ahead of the items must not swallow the designation — it is
     * not a composite member and can never hold a stop. The `-1` fallback in
     * `Toolbar` would be reached if the search were by child position, and the
     * toolbar would then serve N stops again with nothing to say so.
     */
    const html = renderToStaticMarkup(
      <Toolbar label="قالب‌بندی متن">
        <ToolbarSeparator />
        <ToolbarItem>
          <button type="button">پررنگ</button>
        </ToolbarItem>
        <ToolbarItem>
          <button type="button">مورب</button>
        </ToolbarItem>
      </Toolbar>,
    );
    expect([...html.matchAll(/tabindex="(-?\d)"/g)].map((m) => m[1])).toEqual(["0", "-1"]);
  });

  it("finds the first item through a caller's OWN component", () => {
    /**
     * A container-side designation could not do this — `Toolbar` cannot see
     * through `<Pair/>` any more than it can see through an RSC boundary, and
     * the version that tried served a stop on every item instead. The claim
     * counter is read by the item, so nesting is transparent to it.
     */
    function Pair() {
      return (
        <>
          <ToolbarItem>
            <button type="button">پررنگ</button>
          </ToolbarItem>
          <ToolbarItem>
            <button type="button">مورب</button>
          </ToolbarItem>
        </>
      );
    }
    const html = renderToStaticMarkup(
      <Toolbar label="قالب‌بندی متن">
        <Pair />
      </Toolbar>,
    );
    expect([...html.matchAll(/tabindex="(-?\d)"/g)].map((m) => m[1])).toEqual(["0", "-1"]);
  });

  it("a ToolbarItem outside a Toolbar THROWS — so the `null` claim is unreachable", () => {
    /**
     * `ToolbarItem` treats a missing claim counter as "I am the only member and
     * I take the stop", which would be the degraded fallback. It is never
     * reached: `Toolbar.Button` demands `ToolbarRootContext` and Base UI throws
     * before this file's branch can run. Asserted so that the branch is known to
     * be a belt rather than a road — and so that a future Base UI that stops
     * throwing turns this red instead of quietly opening an ungraded shape.
     */
    expect(() =>
      renderToStaticMarkup(
        <ToolbarItem>
          <button type="button">تنها</button>
        </ToolbarItem>,
      ),
    ).toThrow(/ToolbarRootContext/);
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

describe("ToolbarItem reaches a COMPONENT child, not only an intrinsic one", () => {
  /**
   * The defect this pins was silent in both directions and shipped for a week.
   *
   * `ToolbarItem` hands its child to `Toolbar.Button`'s `render`, and
   * `useRenderElement` gives a COMPONENT render target its merged props as
   * ordinary React props. `ToggleButton` destructured a closed prop list and
   * spread nothing, so `ref`, `tabIndex`, `data-focusable` and
   * `data-orientation` were all dropped — no registration, no arrow-key reach,
   * and a natively-tabbable `<button>` left over as a permanent extra stop.
   *
   * Measured on the export before the fix: `FormattingExample` served four Tab
   * stops for four controls, three of which were toggles that the toolbar's
   * composite had never heard of.
   */
  const withToggles = (
    <Toolbar label="قالب‌بندی متن">
      <ToolbarItem>
        <ToggleButton size="sm" aria-label="پررنگ">
          ب
        </ToggleButton>
      </ToolbarItem>
      <ToolbarItem>
        <ToggleButton size="sm" aria-label="کج">
          ک
        </ToggleButton>
      </ToolbarItem>
    </Toolbar>
  );

  it("registers a ToggleButton in the composite", () => {
    const html = renderToStaticMarkup(withToggles);
    expect(html.split("data-focusable").length - 1).toBe(2);
  });

  it("is ONE tab stop, and the toggles are the members", () => {
    const html = renderToStaticMarkup(withToggles);
    expect([...html.matchAll(/tabindex="(-?\d)"/g)].map((m) => m[1])).toEqual(["0", "-1"]);
    // No `<button>` without a tabindex — that is what made the old shape a
    // permanent stop rather than a first-byte one.
    expect([...html.matchAll(/<button(?![^>]*tabindex)[^>]*>/g)]).toHaveLength(0);
  });

  it("moves the roving stop once mounted, which proves the ref landed too", () => {
    render(withToggles);
    const items = screen.getAllByRole("button");
    expect(items.map((i) => i.getAttribute("tabindex"))).toEqual(["0", "-1"]);
  });
});
