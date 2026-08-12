/**
 * What a two-state button owes a Persian reader, pinned.
 *
 * The interesting assertions here are not about classes. They are about the
 * three things that make a toggle different from a button — the ON attribute,
 * the name that must NOT move with the state, and the required name on the
 * icon-only form — and each one corresponds to a paragraph in `toggle.tsx`'s
 * header that would otherwise be an unchecked claim.
 */

import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { LumoProvider } from "./provider.tsx";
import { IconToggle, Toggle, toggleVariants } from "./toggle.tsx";
import { ToggleButton, ToggleButtonGroup } from "./toggle-group.tsx";

afterEach(cleanup);

const LATIN = /[A-Za-z]/;

function fa(node: ReactElement) {
  return render(<LumoProvider locale="fa-IR">{node}</LumoProvider>);
}

describe("Toggle — the state is an attribute, not a change of name", () => {
  it("announces itself as a pressed/unpressed button", () => {
    fa(
      <>
        <Toggle>پررنگ</Toggle>
        <Toggle defaultSelected>کج</Toggle>
      </>,
    );

    // RAC's own wiring, asserted rather than assumed: this is what makes the
    // "do not flip the label" rule in the header correct rather than stylistic.
    expect(screen.getByRole("button", { name: "پررنگ" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByRole("button", { name: "کج" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("marks the ON state with an attribute the variants actually style", () => {
    const { container } = fa(<Toggle defaultSelected>پررنگ</Toggle>);
    const button = container.querySelector("button")!;

    // ENGINE VOCABULARY. This assertion used to read `data-selected` and
    // forbid `data-pressed`, because under React Aria `data-pressed` was the
    // TRANSIENT pointer-down state and styling ON with it made an on toggle
    // look identical to an off one. Base UI spells the ON state `data-pressed`
    // and emits no transient attribute at all, so the old names invert.
    //
    // What the test is for has not changed and is what is asserted: the ON
    // state must be (a) exposed as an attribute, (b) the SAME attribute the
    // variants file styles — a mismatch is the silent defect — and (c) matched
    // by the ARIA state, so pixels and screen reader agree.
    expect(button.hasAttribute("data-pressed")).toBe(true);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(toggleVariants()).toContain("data-pressed:");
  });

  it("drops that attribute when OFF — the ON style cannot be always-on", () => {
    // The other half of the pair above. An attribute that never clears would
    // satisfy the ON assertions and still render every toggle as selected.
    const { container } = fa(<Toggle>پررنگ</Toggle>);
    const button = container.querySelector("button")!;
    expect(button.hasAttribute("data-pressed")).toBe(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("is a plain button role — a toggle is not a switch and not a checkbox", () => {
    fa(<Toggle>پررنگ</Toggle>);
    // A `switch` announces on/off and belongs to `switch.tsx`; a `checkbox`
    // belongs to a form. This is a button that stays down, which is why
    // `aria-pressed` is the right attribute and the role stays `button`.
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

describe("Toggle — the icon-only form cannot be shipped nameless", () => {
  it("names the control from the required `label`", () => {
    fa(
      <IconToggle label="پررنگ">
        <svg aria-hidden="true" />
      </IconToggle>,
    );
    const button = screen.getByRole("button", { name: "پررنگ" });
    expect(button.getAttribute("aria-label")).toBe("پررنگ");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("the name is in the SERVED bytes, so the gate grades it", () => {
    // Unlike the chart, a toggle server-renders completely. The gate reads these
    // exact bytes, and `no-latin-aria` would fail an English name here.
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        <IconToggle label="بی‌صدا">
          <svg aria-hidden="true" />
        </IconToggle>
      </LumoProvider>,
    );
    expect(html).toContain('aria-label="بی‌صدا"');
    expect(html).toContain('aria-pressed="false"');
    const spoken = /aria-label="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(LATIN.test(spoken)).toBe(false);
  });

  it("is square: the icon variant takes a width from the same density token as its height", () => {
    const classes = toggleVariants({ iconOnly: true, size: "lg" });
    // Height and width both from `--lumo-ref-control-*`, so the density knob
    // moves them together and an icon toggle never becomes a rectangle.
    expect(classes).toContain("h-control-lg");
    expect(classes).toContain("w-control-lg");
    expect(toggleVariants({ size: "lg" })).not.toContain("w-control-lg");
  });
});

describe("Toggle — the variants stay logical", () => {
  it("uses no physical inline utility", () => {
    const every = [
      toggleVariants(),
      toggleVariants({ variant: "outline", size: "sm" }),
      toggleVariants({ iconOnly: true, size: "md" }),
    ].join(" ");
    // The lint catches this repo-wide; asserting it here means a COPIED file
    // still fails its own test when someone reaches for the physical spelling.
    expect(every).not.toMatch(/\b(ml|mr|pl|pr|left|right|border-l|border-r|rounded-[lr])-/);
    expect(every).toContain("px-");
  });

  it("the outline variant draws its boundary with the control token", () => {
    // WCAG 1.4.11 wants 3:1 for the edge of a control; `--lumo-sys-border` is
    // the decorative hairline and does not clear it. Two tokens, on purpose.
    expect(toggleVariants({ variant: "outline" })).toContain("border-border-control");
  });
});

describe("ToggleButtonGroup — collection keys survive the public seam", () => {
  it("serves one tab stop when its buttons are grouped in a Fragment", () => {
    const html = renderToStaticMarkup(
      <ToggleButtonGroup aria-label="چیدمان">
        <>
          <ToggleButton id="list">فهرست</ToggleButton>
          <ToggleButton id="grid">شبکه</ToggleButton>
        </>
      </ToggleButtonGroup>,
    );
    expect(html.split('tabindex="0"').length - 1).toBe(1);
  });

  it("returns numeric keys as numbers", () => {
    const seen: Set<string | number>[] = [];
    render(
      <ToggleButtonGroup aria-label="چیدمان" onSelectionChange={(keys) => seen.push(keys)}>
        <ToggleButton id={3}>سه</ToggleButton>
      </ToggleButtonGroup>,
    );
    screen.getByRole("button", { name: "سه" }).click();
    expect([...seen.at(-1)!]).toEqual([3]);
  });
});
