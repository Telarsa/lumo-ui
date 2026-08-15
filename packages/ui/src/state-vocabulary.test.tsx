/**
 * Every visual state of the thirteen Base UI components, pinned to the selector
 * that styles it.
 *
 * ── WHY THIS SUITE EXISTS ──────────────────────────────────────────────────
 *
 * The Base UI experiment froze every `*.variants.ts` and every state class
 * string byte-identical as an experimental control, and the result was read as
 * a Base UI accessibility failure: no focus ring on switch or checkbox, an ON
 * toggle indistinguishable from an OFF one. It was neither. It was Lumo's
 * selectors — React Aria's `data-hovered` / `data-selected` /
 * `data-focus-visible` vocabulary — addressed to an engine that publishes a
 * different one. Nothing errored, no shipped test failed, and the page looked
 * plausible. That is the failure mode this suite exists to make impossible.
 *
 * Each test asserts BOTH halves of a state, because either half alone is
 * satisfiable by a component that does not work:
 *
 *   1. the engine puts the state where we think it does — the attribute, on
 *      that element, in that state; and
 *   2. the class string on that same element carries a rule keyed to it.
 *
 * Assert only (1) and you have pinned Base UI's API while the component renders
 * unstyled. Assert only (2) and you have pinned a string, which is exactly what
 * the frozen control did for four rounds without anyone noticing.
 *
 * ── THE ONE STATE THIS SUITE CANNOT PROVE, AND WHY IT SAYS SO ──────────────
 *
 * Hover and press are CSS pseudo-classes on Base UI, and jsdom models no
 * pointer: `matches(":hover")` and `matches(":active")` are permanently false
 * regardless of what has been dispatched. Measured in
 * `experiments/measurements/probe3.testability.json`. So those two states are
 * asserted structurally — the rule exists and is on the right element — and the
 * gap is named here rather than hidden behind a passing assertion. Under React
 * Aria both were attributes and both were fully assertable, which is a real
 * capability this migration spends.
 *
 * `:focus-visible` is NOT in that category. jsdom does match it on a focused
 * element (same probe file), so the WCAG 2.4.7 ring keeps its unit tier and is
 * asserted behaviourally below. That is the one state that must never be
 * merely structural.
 *
 * New file rather than additions to `toggle.test.tsx`, `controls.test.tsx` or
 * `overlays.test.tsx`: those suites encode React Aria's vocabulary as their
 * subject, and `toggle.test.tsx` in particular now FAILS on this branch because
 * it asserts `data-selected` for an ON toggle. That failure is information —
 * it is the engine-specific test tax, one test file per selector-bearing
 * component — and weakening it to green would delete the measurement.
 */

import { readFileSync, readdirSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

import { Button } from "./button.tsx";
import { buttonVariants } from "./button.variants.ts";
import { Checkbox } from "./checkbox.tsx";
import { Switch } from "./switch.tsx";
import { Toggle } from "./toggle.tsx";
import { toggleVariants } from "./toggle.variants.ts";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";
import { Slider } from "./slider.tsx";
import { NumberField } from "./number-field.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { ComboBox, ComboBoxItem } from "./combobox.tsx";
import { Dialog, DialogHeading, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Popover, PopoverTrigger } from "./popover.tsx";
import { Drawer, DrawerOverlay } from "./drawer.tsx";
import { Tooltip, TooltipTrigger } from "./tooltip.tsx";
import { dialogOverlayVariants, dialogModalVariants } from "./dialog.tsx";
import { popoverVariants } from "./popover.tsx";
import { tooltipVariants } from "./tooltip.tsx";

afterEach(cleanup);

/**
 * The state attribute is present on the element AND the element's own class
 * string carries a rule keyed to it. Both, or the assertion proves nothing —
 * see the file header.
 */
function expectStyledBy(el: Element | null, attribute: string, options?: { via?: string }) {
  expect(el, `element not found for ${attribute}`).not.toBeNull();
  expect(el!.hasAttribute(attribute), `${attribute} missing from the element`).toBe(true);
  const styledBy = options?.via ?? el!.getAttribute("class") ?? "";
  expect(styledBy, `no rule keyed to ${attribute}`).toContain(`${attribute}:`);
}

/** The state attribute is ABSENT — the other half of a two-state control. */
function expectNoAttribute(el: Element | null, attribute: string) {
  expect(el).not.toBeNull();
  expect(el!.hasAttribute(attribute)).toBe(false);
}

/**
 * The element carries a class whose variant chain STARTS with `focus-visible:`.
 *
 * Substring matching is not good enough for this one assertion, and finding
 * that out was itself instructive: `group-data-focus-visible:[outline:…]` — the
 * React Aria spelling this migration had to remove — contains the literal text
 * `focus-visible:`, so a `toContain` check passes on the exact defect it was
 * written to catch. Verified by mutation: reverting checkbox.tsx to `FOCUS_RING`
 * left the substring form green. Tokenise, then anchor.
 */
function expectSelfFocusRing(el: Element | null) {
  expect(el).not.toBeNull();
  const tokens = (el!.getAttribute("class") ?? "").split(/\s+/);
  const ring = tokens.filter((t) => t.startsWith("focus-visible:"));
  expect(ring.length, "no rule keyed to the element's own :focus-visible").toBeGreaterThan(0);
  expect(ring.join(" ")).toContain("outline");
  expect(tokens.some((t) => t.includes("data-focus-visible"))).toBe(false);
}

// ═══════════════════════════════════════════════════════════════════════════
// The focus ring. WCAG 2.4.7, and the state the frozen control lost silently.
// ═══════════════════════════════════════════════════════════════════════════

describe("focus ring — WCAG 2.4.7", () => {
  /**
   * Under React Aria the focusable element of these two controls was a
   * visually hidden `<input>` and the ring had to be re-derived on the visible
   * wrapper from `data-focus-visible`. Under Base UI the VISIBLE box is the
   * focusable element, so the ring is a plain pseudo-class on it — and the
   * element being genuinely focusable is half the claim.
   */
  it("checkbox: the visible box is the focusable element and carries the ring", () => {
    const { container } = render(<Checkbox>قبول</Checkbox>);
    const box = container.querySelector('[role="checkbox"]') as HTMLElement | null;
    expect(box).not.toBeNull();
    expect(box!.getAttribute("tabindex")).toBe("0");

    // The hidden input must NOT be the focus target — that was React Aria's
    // arrangement and the reason the ring needed a group hop at all.
    const input = container.querySelector("input");
    expect(input!.getAttribute("tabindex")).toBe("-1");

    act(() => {
      fireEvent.keyDown(document, { key: "Tab" });
      box!.focus();
    });
    expect(document.activeElement).toBe(box);
    expect(box!.matches(":focus-visible")).toBe(true);
    expectSelfFocusRing(box);
  });

  it("switch: the track is the focusable element and carries the ring", () => {
    const { container } = render(<Switch>اعلان</Switch>);
    const track = container.querySelector('[role="switch"]') as HTMLElement | null;
    expect(track).not.toBeNull();
    expect(track!.getAttribute("tabindex")).toBe("0");
    act(() => {
      fireEvent.keyDown(document, { key: "Tab" });
      track!.focus();
    });
    expect(document.activeElement).toBe(track);
    expect(track!.matches(":focus-visible")).toBe(true);
    expectSelfFocusRing(track);
  });

  it("switch: tabIndex reaches the focusable track", () => {
    const { container } = render(<Switch tabIndex={-1}>اعلان</Switch>);
    expect(container.querySelector('[role="switch"]')?.getAttribute("tabindex")).toBe("-1");
  });

  it("button and toggle keep the system-wide ring, which was never engine-specific", () => {
    // theme.css styles `:where([data-lumo]):focus-visible`. Base UI's Button
    // renders a real <button>; the marker is what the rule needs and it is
    // there. No per-component ring class, and none needed.
    const { container } = render(<Button>سلام</Button>);
    const btn = container.querySelector("button") as HTMLElement;
    expect(btn.hasAttribute("data-lumo")).toBe(true);
    act(() => {
      fireEvent.keyDown(document, { key: "Tab" });
      btn.focus();
    });
    expect(btn.matches(":focus-visible")).toBe(true);

    cleanup();
    const t = render(<Toggle>پررنگ</Toggle>).container.querySelector("button") as HTMLElement;
    expect(t.hasAttribute("data-lumo")).toBe(true);
  });

  /**
   * ── AN ELEMENT THAT SUPPRESSES ITS OUTLINE MUST HAVE OPTED INTO THE RING ───
   *
   * The defect this catches shipped for months and was found by grep, not by a
   * test: `drawer.tsx` contained the string `data-lumo` ZERO times, and
   * `drawerVariants` sets `outline-none`. That panel is
   * `<div role="dialog" tabindex="-1" data-base-ui-focusable>` — measured — so
   * it IS the focus stop whenever the drawer holds nothing focusable of its own,
   * and a keyboard reader entering it got no indicator from the platform and
   * none from the library. WCAG 2.4.7, on the component whose entire job is to
   * take over the screen. `dialog.tsx` had the same hole, disguised: its INNER
   * `Dialog` div has always carried `data-lumo`, and that div is not focusable.
   *
   * The assertion is deliberately not "the drawer has data-lumo" — that is the
   * hand-kept list this suite's own footer argues against. It is the INVARIANT:
   * an element that can receive focus and cancels the UA outline has to state
   * that the library ring covers it. Anything matching the first two conditions
   * and not the third has, by construction, no focus indicator at all.
   *
   * Rendered rather than swept from source, because both halves — "is
   * focusable" and "the class landed on that element" — are properties of the
   * DOM and neither is decidable from a cva string.
   */
  it("no focusable element cancels its outline without carrying the marker", () => {
    const overlays = [
      <DialogTrigger key="dialog" defaultOpen>
        <Button>باز</Button>
        <DialogOverlay>
          <DialogModal>
            <Dialog closeLabel="بستن">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
      <DialogTrigger key="drawer" defaultOpen>
        <Button>منو</Button>
        <DrawerOverlay>
          <Drawer side="start">
            <Dialog closeLabel="بستن">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>,
      <PopoverTrigger key="popover" defaultOpen>
        <Button>باز</Button>
        <Popover>محتوا</Popover>
      </PopoverTrigger>,
    ];

    const offenders: string[] = [];
    let checked = 0;
    for (const ui of overlays) {
      render(ui);
      for (const el of document.body.querySelectorAll("[class]")) {
        const classes = (el.getAttribute("class") ?? "").split(/\s+/);
        if (!classes.includes("outline-none")) continue;
        // Focusable: a real tabindex, or a role the engine moves focus to.
        const focusable =
          el.hasAttribute("tabindex") || el.hasAttribute("data-base-ui-focusable");
        if (!focusable) continue;
        checked++;
        if (!el.hasAttribute("data-lumo") && !el.hasAttribute("data-lumo-proxy-focus")) {
          offenders.push(
            `<${el.tagName.toLowerCase()} role="${el.getAttribute("role") ?? ""}" ` +
              `tabindex="${el.getAttribute("tabindex") ?? ""}">`,
          );
        }
      }
      cleanup();
    }

    // Anti-vacuity: if Base UI ever stops emitting a focusable popup, or the
    // `outline-none` moves off these class strings, the loop above inspects
    // nothing and the assertion below passes for free. Two is the measured
    // count on this engine — the dialog popup and the drawer popup, which are
    // the two `role="dialog"` focus stops. The popover's popup carries
    // `outline-none` too but is not focusable, so it is correctly not graded.
    expect(checked, "no focusable outline-none element was found to grade").toBeGreaterThanOrEqual(
      2,
    );
    expect(
      [...new Set(offenders)],
      "a focusable element cancels the UA outline and has not opted into " +
        "theme.css's `:where([data-lumo]):focus-visible` — so it has no focus " +
        "indicator at all",
    ).toEqual([]);
  });

  it("no component still asks for React Aria's focus attribute", () => {
    // `data-focus-visible` does not exist anywhere in @base-ui/react. A class
    // keyed to it is a ring that never appears — the exact defect the frozen
    // control produced and nothing caught.
    const rendered = [
      render(<Checkbox>قبول</Checkbox>).container,
      render(<Switch>اعلان</Switch>).container,
      render(<Toggle>پررنگ</Toggle>).container,
      render(<Button>سلام</Button>).container,
    ];
    for (const container of rendered) {
      for (const el of container.querySelectorAll("[class]")) {
        expect(el.getAttribute("class")).not.toContain("data-focus-visible");
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Selected / checked / pressed — the state each control exists for.
// ═══════════════════════════════════════════════════════════════════════════

describe("the ON state", () => {
  it("switch: the track fills and the thumb travels, both from data-checked", () => {
    const { container } = render(<Switch isSelected>اعلان</Switch>);
    const track = container.querySelector('[role="switch"]')!;
    expectStyledBy(track, "data-checked");
    // The thumb is a Base UI part, so Base UI propagates the state onto it and
    // the rule addresses its own element rather than hopping through a group.
    const thumb = track.querySelector("span")!;
    expectStyledBy(thumb, "data-checked");
    // The travel itself: the size variant contributes an inline-start rule
    // keyed to the same attribute, so an ON switch cannot look like an OFF one.
    expect(thumb.getAttribute("class")).toMatch(/data-checked:start-/);
  });

  it("switch: OFF is data-unchecked, and no rule fires", () => {
    const { container } = render(<Switch>اعلان</Switch>);
    const track = container.querySelector('[role="switch"]')!;
    expectNoAttribute(track, "data-checked");
    expect(track.hasAttribute("data-unchecked")).toBe(true);
  });

  it("checkbox: the box fills from data-checked and the tick reads it across the named group", () => {
    const { container } = render(<Checkbox isSelected>قبول</Checkbox>);
    const box = container.querySelector('[role="checkbox"]')!;
    expectStyledBy(box, "data-checked");
    // The icons are Lumo's glyphs, not Base UI parts, so they get no state of
    // their own — the named group on the root is the workaround that makes them
    // reachable. Assert the hop exists at BOTH ends.
    expect(box.getAttribute("class")).toContain("group/box");
    const tick = container.querySelector("svg.lucide-check")!;
    expect(tick.getAttribute("class")).toContain("group-data-checked/box:block");
  });

  it("checkbox: indeterminate wins over checked, and the dash is reachable", () => {
    const { container } = render(<Checkbox isIndeterminate>قبول</Checkbox>);
    const box = container.querySelector('[role="checkbox"]')!;
    expectStyledBy(box, "data-indeterminate");
    const dash = container.querySelector("svg.lucide-minus")!;
    expect(dash.getAttribute("class")).toContain("group-data-indeterminate/box:block");
    // The tick hides in the same state, so a box never shows both marks.
    const tick = container.querySelector("svg.lucide-check")!;
    expect(tick.getAttribute("class")).toContain("group-data-indeterminate/box:hidden");
  });

  it("toggle: ON is data-pressed HERE, which is the opposite of what it means next door", () => {
    const { container } = render(<Toggle isSelected>پررنگ</Toggle>);
    const btn = container.querySelector("button")!;
    // No pointer is touching this control. Under React Aria `data-pressed` on
    // an untouched control would be a bug; under Base UI it is the whole state.
    expectStyledBy(btn, "data-pressed");
    expect(btn.getAttribute("aria-pressed")).toBe("true");

    // And the RAC spelling must be gone, or the ON state styles nothing — the
    // measured defect that read as "an ON toggle looks identical to an OFF one".
    expect(toggleVariants()).not.toContain("data-selected:");
    expect(toggleVariants()).toContain("data-pressed:");
  });

  it("toggle: OFF carries no pressed attribute", () => {
    const { container } = render(<Toggle>پررنگ</Toggle>);
    expectNoAttribute(container.querySelector("button"), "data-pressed");
  });

  it("tabs: the selected tab is data-active, not the roving cursor", () => {
    const { container } = render(
      <Tabs defaultSelectedKey="b">
        <TabList label="بخش‌ها">
          <Tab id="a">الف</Tab>
          <Tab id="b">ب</Tab>
        </TabList>
        <TabPanel id="a">۱</TabPanel>
        <TabPanel id="b">۲</TabPanel>
      </Tabs>,
    );
    const [first, second] = [...container.querySelectorAll('[role="tab"]')];
    expect(second!.getAttribute("aria-selected")).toBe("true");
    expectStyledBy(second!, "data-active");
    expectNoAttribute(first!, "data-active");
    // The underline is the visible half and must key to the same attribute.
    expect(second!.getAttribute("class")).toContain("data-active:border-accent");
    // `data-selected` is React Aria's name for this and Base UI never writes
    // it; a rule keyed to it is an unstyled selected tab.
    expect(second!.getAttribute("class")).not.toContain("data-selected:");
  });

  it("select: the chosen option is data-selected — the one name that survived", () => {
    render(
      <Select placeholder="انتخاب" aria-label="شهر" defaultSelectedKey="b">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="a">تهران</SelectItem>
          <SelectItem id="b">شیراز</SelectItem>
        </SelectPopover>
      </Select>,
    );
    act(() => {
      fireEvent.click(document.querySelector('[role="combobox"]')!);
    });
    const options = [...document.querySelectorAll('[role="option"]')];
    const chosen = options.find((o) => o.getAttribute("aria-selected") === "true")!;
    expect(chosen.hasAttribute("data-selected")).toBe(true);
    // Styled by a conditionally-mounted indicator part rather than a rule on
    // the item, which is why the item's class carries no selected rule and that
    // is correct rather than missing.
    expect(chosen.textContent).toContain("شیراز");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Disabled and invalid.
// ═══════════════════════════════════════════════════════════════════════════

describe("disabled", () => {
  it("button and toggle: unchanged from React Aria, same name, same element", () => {
    const b = render(<Button isDisabled>سلام</Button>).container.querySelector("button")!;
    expectStyledBy(b, "data-disabled");
    cleanup();
    const t = render(<Toggle isDisabled>پررنگ</Toggle>).container.querySelector("button")!;
    expectStyledBy(t, "data-disabled");
  });

  it("checkbox and switch: the Field pushes it onto the label AND the control", () => {
    const c = render(<Checkbox isDisabled>قبول</Checkbox>).container;
    expectStyledBy(c.querySelector("label"), "data-disabled");
    expectStyledBy(c.querySelector('[role="checkbox"]'), "data-disabled");
    cleanup();
    const s = render(<Switch isDisabled>اعلان</Switch>).container;
    expectStyledBy(s.querySelector("label"), "data-disabled");
  });

  it("slider: reaches the track and the thumb, so neither rule needed an edit", () => {
    const { container } = render(
      <Slider label="بودجه" locale="fa-IR" defaultValue={40} isDisabled />,
    );
    const styled = [...container.querySelectorAll("[class]")].filter((el) =>
      (el.getAttribute("class") ?? "").includes("data-disabled:"),
    );
    expect(styled.length).toBeGreaterThan(0);
    for (const el of styled) expect(el.hasAttribute("data-disabled")).toBe(true);
  });

  it("number field: reaches the input and both steppers", () => {
    const { container } = render(
      <NumberField
        label="تعداد"
        decrementLabel="کاهش تعداد"
        incrementLabel="افزایش تعداد"
        roleDescription="فیلد عددی"
        isDisabled
      />,
    );
    expectStyledBy(container.querySelector("input"), "data-disabled");
    for (const btn of container.querySelectorAll("button")) {
      expectStyledBy(btn, "data-disabled");
    }
  });

  it("tabs and menu and select items: disabled is engine-independent", () => {
    const t = render(
      <Tabs defaultSelectedKey="a">
        <TabList label="بخش‌ها">
          <Tab id="a">الف</Tab>
          <Tab id="b" isDisabled>ب</Tab>
        </TabList>
        <TabPanel id="a">۱</TabPanel>
        <TabPanel id="b">۲</TabPanel>
      </Tabs>,
    ).container;
    expectStyledBy(t.querySelectorAll('[role="tab"]')[1]!, "data-disabled");
    cleanup();

    render(
      <MenuTrigger defaultOpen>
        <Button>منو</Button>
        <MenuPopover>
          <Menu>
            <MenuItem id="a">کپی</MenuItem>
            <MenuItem id="b" isDisabled>چسباندن</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    const disabled = [...document.querySelectorAll('[role="menuitem"]')].find((el) =>
      el.hasAttribute("data-disabled"),
    );
    expect(disabled).toBeDefined();
    expect(disabled!.getAttribute("class")).toContain("data-disabled:");
  });

  /**
   * Select gained a `Field.Root` on 12 Aug 2026, and with it the wrapper's
   * `data-disabled:opacity-60`. Base UI writes `data-disabled` on BOTH the
   * field root and the trigger, so the trigger's own `data-disabled:opacity-50`
   * — correct while there was no wrapper above it — became a SECOND dimming
   * multiplying to 0.30. form.tsx's header states the rule; this is the
   * assertion that keeps it, and it is written as a COUNT rather than as a
   * check on one element, because restating the opacity anywhere else in the
   * subtree would fail it the same way.
   */
  it("select: the disabled dimming is stated exactly once in the subtree", () => {
    const { container } = render(
      <Select placeholder="یک شهر انتخاب کنید" isDisabled>
        <SelectTrigger />
      </Select>,
    );
    const trigger = container.querySelector('[role="combobox"]')!;
    expect(trigger.hasAttribute("data-disabled")).toBe(true);
    expectStyledBy(trigger, "data-disabled");

    const dimmed = [...container.querySelectorAll("[class]")].filter((el) =>
      (el.getAttribute("class") ?? "").split(/\s+/).some((t) => /^data-disabled:opacity-/.test(t)),
    );
    expect(dimmed.map((el) => el.tagName.toLowerCase())).toEqual(["div"]);
  });
});

describe("invalid", () => {
  it("checkbox: the Field pushes validity onto the control, so the rule sits on it", () => {
    const { container } = render(
      <Checkbox isInvalid errorMessage="خطا">
        قبول
      </Checkbox>,
    );
    expectStyledBy(container.querySelector('[role="checkbox"]'), "data-invalid");
  });

  it("number field: validity reaches the ROOT ONLY — the workaround, asserted at both ends", () => {
    const { container } = render(
      <NumberField
        label="تعداد"
        decrementLabel="کاهش تعداد"
        incrementLabel="افزایش تعداد"
        roleDescription="فیلد عددی"
        isInvalid
        errorMessage="خطا"
      />,
    );
    const root = container.firstElementChild!;
    const input = container.querySelector("input")!;

    // The reason a rename could not fix this rule: there is no attribute on the
    // input to rename TO.
    expect(root.hasAttribute("data-invalid")).toBe(true);
    expect(input.hasAttribute("data-invalid")).toBe(false);

    // So the hop: named group on the root, group rule on the input.
    expect(root.getAttribute("class")).toContain("group/field");
    expect(input.getAttribute("class")).toContain("group-data-invalid/field:border-critical");
  });

  /**
   * Select, which had NO `Field.Root` until 12 Aug 2026 and therefore no
   * validity of any kind — neither the attribute nor a rule keyed to it. Unlike
   * NumberField above, no group hop is needed: `Select.Trigger` spreads the
   * field's state into its own, so the attribute lands on the button the rule
   * styles and the spelling matches `inputVariants`.
   */
  it("select: validity reaches the trigger itself, no group hop", () => {
    const { container } = render(
      <Select placeholder="یک شهر انتخاب کنید" errorMessage="خطا">
        <SelectTrigger />
      </Select>,
    );
    const trigger = container.querySelector('[role="combobox"]')!;
    expectStyledBy(trigger, "data-invalid");
    expect(trigger.getAttribute("class")).toContain("data-invalid:border-critical");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Overlay transitions and placement.
// ═══════════════════════════════════════════════════════════════════════════

describe("overlay transitions", () => {
  it("dialog, popover and tooltip use Base UI's transition vocabulary", () => {
    for (const variants of [
      dialogOverlayVariants(),
      dialogModalVariants(),
      popoverVariants(),
      tooltipVariants(),
    ]) {
      expect(variants).toContain("data-starting-style:");
      expect(variants).toContain("data-ending-style:");
      // React Aria's names. Base UI writes neither, so a rule keyed to them is
      // an animation that never runs — measured as "the popover appears
      // instantly" before this rewrite.
      expect(variants).not.toContain("data-entering:");
      expect(variants).not.toContain("data-exiting:");
    }
  });

  it("popover and tooltip key their offsets to data-side, and the popup carries it", () => {
    render(
      <PopoverTrigger defaultOpen>
        <Button>باز</Button>
        <Popover placement="top">محتوا</Popover>
      </PopoverTrigger>,
    );
    const popup = [...document.querySelectorAll("[data-side]")].find((el) =>
      (el.getAttribute("class") ?? "").includes("data-[side="),
    );
    expect(popup, "no popup carries both data-side and a rule keyed to it").toBeDefined();
    expect(popup!.getAttribute("data-side")).toBe("top");
    // React Aria's single combined attribute. Base UI splits side from align,
    // so a rule keyed to the old name matches nothing.
    expect(popup!.getAttribute("class")).not.toContain("data-[placement=");
    cleanup();

    render(
      <TooltipTrigger defaultOpen>
        <Button>راهنما</Button>
        <Tooltip placement="top">توضیح</Tooltip>
      </TooltipTrigger>,
    );
    const tip = [...document.querySelectorAll("[data-side]")].find((el) =>
      (el.getAttribute("class") ?? "").includes("data-[side="),
    );
    expect(tip).toBeDefined();
    expect(tip!.getAttribute("data-side")).toBe("top");
  });

  it("dialog: the open backdrop and popup are both reachable by the rewritten rules", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DialogOverlay>
          <DialogModal>
            <Dialog closeLabel="بستن">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    const styled = [...document.querySelectorAll("[class]")].filter((el) =>
      (el.getAttribute("class") ?? "").includes("data-starting-style:"),
    );
    expect(styled.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The focus cursor inside collections — one attribute for pointer and keyboard.
// ═══════════════════════════════════════════════════════════════════════════

describe("collection focus cursor", () => {
  it("menu: the highlighted item is data-highlighted, and hover must NOT compete", () => {
    render(
      <MenuTrigger defaultOpen>
        <Button>منو</Button>
        <MenuPopover>
          <Menu>
            <MenuItem id="a">کپی</MenuItem>
            <MenuItem id="b">چسباندن</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    const item = document.querySelector('[role="menuitem"]')!;
    expect(item.getAttribute("class")).toContain("data-highlighted:");
    // Base UI drives ONE cursor for pointer and keyboard alike, so adding a
    // hover rule here would fight the arrow keys — the one place in the
    // migration where `:hover` is the WRONG answer to `data-hovered`.
    expect(item.getAttribute("class")).not.toContain("hover:bg-");
  });

  it("select and combobox items use the same cursor", () => {
    render(
      <Select placeholder="انتخاب" aria-label="شهر">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="a">تهران</SelectItem>
        </SelectPopover>
      </Select>,
    );
    act(() => {
      fireEvent.click(document.querySelector('[role="combobox"]')!);
    });
    const option = document.querySelector('[role="option"]')!;
    expect(option.getAttribute("class")).toContain("data-highlighted:");
    expect(option.getAttribute("class")).not.toContain("data-focused:");
    cleanup();

    render(
      <ComboBox label="شهر" showSuggestionsLabel="نمایش پیشنهادها" suggestionsLabel="پیشنهادها" dismissLabel="بستن پیشنهادها">
        <ComboBoxItem id="a">تهران</ComboBoxItem>
      </ComboBox>,
    );
    act(() => {
      fireEvent.click(document.querySelector("button")!);
    });
    const comboOption = document.querySelector('[role="option"]');
    if (comboOption) {
      expect(comboOption.getAttribute("class")).toContain("data-highlighted:");
    }
  });

  it("select trigger: the open state is data-popup-open, not data-open", () => {
    render(
      <Select placeholder="انتخاب" aria-label="شهر">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="a">تهران</SelectItem>
        </SelectPopover>
      </Select>,
    );
    const trigger = document.querySelector('[role="combobox"]')!;
    act(() => {
      fireEvent.click(trigger);
    });
    expectStyledBy(trigger, "data-popup-open");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The sweep. No React Aria state vocabulary survives anywhere in the thirteen.
// ═══════════════════════════════════════════════════════════════════════════

describe("no React Aria state vocabulary survives", () => {
  /**
   * These four are the ones Base UI never writes under any circumstance, on any
   * part, in any component — verified by grepping the installed dist and by the
   * render dumps in `probe.state-vocabulary.json`. A class keyed to any of them
   * is a rule that cannot fire, which is a defect with no visible symptom other
   * than the state simply not appearing.
   *
   * `data-selected` is deliberately NOT in this list: Base UI DOES write it, on
   * select and combobox items. It is dead on toggle and tabs and alive here,
   * which is exactly why a blanket ban would be the wrong instrument and why
   * the per-component tests above exist.
   */
  const DEAD = ["data-hovered:", "data-focus-visible:", "data-entering:", "data-exiting:"];

  const specimens: Array<[string, React.ReactElement]> = [
    ["button", <Button key="b">سلام</Button>],
    ["switch", <Switch key="s">اعلان</Switch>],
    ["checkbox", <Checkbox key="c">قبول</Checkbox>],
    ["toggle", <Toggle key="t">پررنگ</Toggle>],
    [
      "tabs",
      <Tabs key="tb" defaultSelectedKey="a">
        <TabList label="بخش‌ها">
          <Tab id="a">الف</Tab>
        </TabList>
        <TabPanel id="a">۱</TabPanel>
      </Tabs>,
    ],
    ["slider", <Slider key="sl" label="بودجه" locale="fa-IR" defaultValue={40} />],
    [
      "number-field",
      <NumberField
        key="nf"
        label="تعداد"
        decrementLabel="کاهش تعداد"
        incrementLabel="افزایش تعداد"
        roleDescription="فیلد عددی"
      />,
    ],
    [
      "select",
      <Select key="se" placeholder="انتخاب" aria-label="شهر">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="a">تهران</SelectItem>
        </SelectPopover>
      </Select>,
    ],
    [
      "menu",
      <MenuTrigger key="me" defaultOpen>
        <Button>منو</Button>
        <MenuPopover>
          <Menu>
            <MenuItem id="a">کپی</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    ],
    [
      "combobox",
      <ComboBox key="cb" label="شهر" showSuggestionsLabel="نمایش" suggestionsLabel="پیشنهادها" dismissLabel="بستن پیشنهادها">
        <ComboBoxItem id="a">تهران</ComboBoxItem>
      </ComboBox>,
    ],
    [
      "dialog",
      <DialogTrigger key="di" defaultOpen>
        <Button>باز</Button>
        <DialogOverlay>
          <DialogModal>
            <Dialog closeLabel="بستن">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    ],
    [
      "popover",
      <PopoverTrigger key="po" defaultOpen>
        <Button>باز</Button>
        <Popover>محتوا</Popover>
      </PopoverTrigger>,
    ],
    [
      "tooltip",
      <TooltipTrigger key="to" defaultOpen>
        <Button>راهنما</Button>
        <Tooltip>توضیح</Tooltip>
      </TooltipTrigger>,
    ],
  ];

  for (const [name, ui] of specimens) {
    it(`${name} renders no dead React Aria selector`, () => {
      render(ui);
      const offenders: string[] = [];
      for (const el of document.body.querySelectorAll("[class]")) {
        const cls = el.getAttribute("class") ?? "";
        for (const dead of DEAD) if (cls.includes(dead)) offenders.push(`${dead} on <${el.tagName.toLowerCase()}>`);
      }
      expect(offenders).toEqual([]);
    });
  }

  it("the two exported variant functions are clean at the source, not just in one render", () => {
    // A cva can hide a dead selector inside a variant that this suite never
    // renders, so the strings themselves are checked as well as the DOM.
    for (const variants of [
      buttonVariants(),
      buttonVariants({ variant: "outline" }),
      buttonVariants({ variant: "ghost" }),
      buttonVariants({ variant: "critical" }),
      toggleVariants(),
      toggleVariants({ variant: "outline" }),
    ]) {
      for (const dead of ["data-hovered:", "data-focus-visible:"]) {
        expect(variants).not.toContain(dead);
      }
    }
    // And the replacement is actually present, so "not dead" cannot be
    // satisfied by deleting the rule.
    expect(buttonVariants()).toContain("hover:");
    expect(buttonVariants()).toContain("active:");
    expect(toggleVariants()).toContain("hover:");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Hover and press: the two states jsdom cannot prove, asserted structurally
// and labelled as such.
// ═══════════════════════════════════════════════════════════════════════════

describe("hover and press — structural only, and the reason is measured", () => {
  it("jsdom models no pointer, so these assertions are weaker than the rest of the file", () => {
    document.body.innerHTML = '<button id="p">x</button>';
    const el = document.getElementById("p")!;
    // If either of these ever becomes true, jsdom has gained pointer modelling
    // and the assertions below can be upgraded from structural to behavioural.
    expect(el.matches(":hover")).toBe(false);
    expect(el.matches(":active")).toBe(false);
  });

  it("every control that had a hover rule still has one, on the right element", () => {
    const b = render(<Button>سلام</Button>).container.querySelector("button")!;
    expect(b.getAttribute("class")).toContain("hover:bg-accent-hover");
    cleanup();

    const t = render(<Toggle>پررنگ</Toggle>).container.querySelector("button")!;
    expect(t.getAttribute("class")).toContain("hover:bg-surface-hover");
    cleanup();

    // Switch and checkbox hover the LABEL and style the BOX, so the rule is a
    // group hop — the one place `group-data-hovered` became `group-hover` with
    // no other change.
    const s = render(<Switch>اعلان</Switch>).container;
    expect(s.querySelector("label")!.getAttribute("class")).toContain("group");
    expect(s.querySelector('[role="switch"]')!.getAttribute("class")).toContain(
      "group-hover:border-border-strong",
    );
    cleanup();

    const c = render(<Checkbox>قبول</Checkbox>).container;
    expect(c.querySelector("label")!.getAttribute("class")).toContain("group");
    expect(c.querySelector('[role="checkbox"]')!.getAttribute("class")).toContain(
      "group-hover:border-border-strong",
    );
    cleanup();

    const tab = render(
      <Tabs defaultSelectedKey="a">
        <TabList label="بخش‌ها">
          <Tab id="a">الف</Tab>
        </TabList>
        <TabPanel id="a">۱</TabPanel>
      </Tabs>,
    ).container.querySelector('[role="tab"]')!;
    expect(tab.getAttribute("class")).toContain("hover:text-fg");
    cleanup();

    const nf = render(
      <NumberField
        label="تعداد"
        decrementLabel="کاهش"
        incrementLabel="افزایش"
        roleDescription="فیلد عددی"
      />,
    ).container;
    expect(nf.querySelector("input")!.getAttribute("class")).toContain("hover:border-border-strong");
    expect(nf.querySelector("button")!.getAttribute("class")).toContain("hover:bg-surface-hover");
  });

  it("button keeps a press treatment, with the fidelity caveat recorded", () => {
    // `:active` is not `data-pressed`: the platform drops it when the pointer
    // leaves the element, React Aria did not. Partial mapping, recorded in
    // experiments/measurements/state-vocabulary.json.
    //
    // The treatment is the nudge, not `active:bg-accent-hover`. It is on the
    // BASE string rather than in the `solid` variant, which is the change:
    // four variants each carrying their own press is where the library's five
    // press vocabularies started. `button.variants.ts` measures the three
    // candidates the nudge beat.
    const b = render(<Button>سلام</Button>).container.querySelector("button")!;
    expect(b.getAttribute("class")).toContain("active:not-aria-[haspopup]:translate-y-px");
    expect(b.getAttribute("class")).not.toContain("active:bg-");
  });

  it("the press treatment is DIFFERENT from the hover treatment, in every variant", () => {
    /*
     * The regression this pins is not a missing selector — it is a selector
     * with the same value as the one beside it. `scratchpad/visual-audit.md`
     * finding 3 measured `active:` as byte-identical to `hover:` in all four
     * variants, which reads as "pressed is styled" to every grep and every
     * reviewer, and produces NOTHING on a touch device, where hover never
     * happens and the press is the only event there is.
     *
     * So the assertion is a comparison, not a presence check: extract each
     * variant's `hover:`/`active:` utilities and require the two sets to
     * differ. jsdom still cannot enter either state (see the test above), so
     * this stays structural — but it is the structural check that would have
     * caught the defect.
     */
    const utilities = (classes: string, prefix: string) =>
      classes
        .split(/\s+/)
        .filter((c) => c.startsWith(prefix))
        .map((c) => c.slice(prefix.length))
        .sort()
        .join(" ");

    for (const variant of ["solid", "outline", "ghost", "critical"] as const) {
      const classes = buttonVariants({ variant });
      const hover = utilities(classes, "hover:");
      const active = utilities(classes, "active:");
      expect(hover, `${variant} has no hover treatment`).not.toBe("");
      expect(active, `${variant} has no press treatment`).not.toBe("");
      expect(active, `${variant}'s press is a copy of its hover`).not.toBe(hover);
    }
  });

  it("a toggle's ON treatment is DIFFERENT from its hover treatment", () => {
    /*
     * The same defect SHAPE as the button comparison above, one component over
     * and one layer deeper: the strings differed and the COLOURS did not.
     * Measured in tokens.css, `:root, [data-theme="light"]` —
     *
     *     --lumo-sys-surface-hover:  var(--lumo-ref-neutral-100)
     *     --lumo-sys-surface-sunken: var(--lumo-ref-neutral-100)
     *
     * — so `hover:bg-surface-hover` (OFF, hovered) and
     * `data-pressed:bg-surface-sunken` (ON) painted the same pixel on the light
     * theme, and a hovered off toggle was indistinguishable from an on one. On
     * dark the two tokens differ, and the state was lost the other way instead:
     * `data-pressed:hover:bg-surface-hover` is specificity (0,3,0) against
     * (0,2,0), verified in a built 4.3.3 stylesheet, so an ON toggle under the
     * cursor took EXACTLY the OFF-hover fill.
     *
     * A same-string comparison would have passed in both cases. So the
     * assertion is on the token FAMILY: the ON state must not be another step
     * on the neutral surface ramp, because that ramp is where the collision
     * lives and where the next theme edit can recreate it.
     */
    const utilities = (classes: string, prefix: string) =>
      classes
        .split(/\s+/)
        .filter((c) => c.startsWith(prefix))
        .map((c) => c.slice(prefix.length))
        .sort()
        .join(" ");

    for (const variant of ["ghost", "outline"] as const) {
      const classes = toggleVariants({ variant });
      const hover = utilities(classes, "hover:");
      const on = utilities(classes, "data-pressed:");
      expect(hover, `${variant} has no hover treatment`).not.toBe("");
      expect(on, `${variant} has no ON treatment`).not.toBe("");
      expect(on, `${variant}'s ON state is a copy of its hover`).not.toBe(hover);
      // The part a string comparison cannot see. `bg-surface-*` IS the ramp the
      // hover fill comes from; an ON state anywhere on it is one theme edit
      // away from being invisible again.
      expect(on, `${variant}'s ON fill is on the same ramp as its hover`).not.toMatch(
        /bg-surface/,
      );
      // And the ON state must survive the pointer arriving. Without an explicit
      // `data-pressed:hover:` the neutral hover fill wins by source order.
      expect(classes, `${variant} loses its ON fill on hover`).toContain(
        "data-pressed:hover:bg-",
      );
    }
  });

  it("the press nudge is on the block axis and skips overlay triggers", () => {
    // `translate-y-px`, not a logical utility: a press pushes the control INTO
    // the page and the block axis does not mirror. The `not-aria-[haspopup]`
    // exemption keeps an opening menu from moving with the trigger it is
    // anchored to.
    expect(buttonVariants()).toContain("active:not-aria-[haspopup]:translate-y-px");
  });

  it("the press is stated ONCE, not once per variant", () => {
    /*
     * The shape the library's five press vocabularies grew out of, pinned in the
     * file they grew out of. Four variants each choosing their own press is four
     * decisions where there should be one, and this component is the exemplar
     * every other copies from — `pagination.variants.ts`'s header says in as
     * many words that it took its steps "token for token" from here.
     *
     * So: the base string carries the press, and no variant adds one.
     */
    const base = buttonVariants({ variant: "solid" });
    for (const variant of ["solid", "outline", "ghost", "critical"] as const) {
      const own = buttonVariants({ variant })
        .split(/\s+/)
        .filter((c) => c.startsWith("active:"));
      expect(own, `${variant} carries its own press`).toEqual([
        "active:not-aria-[haspopup]:translate-y-px",
      ]);
    }
    expect(base).toContain("active:not-aria-[haspopup]:translate-y-px");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE SWEEP THE SPECIMEN LIST COULD NOT DO
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("no dead React Aria selector survives anywhere in the source", () => {
  /**
   * ── WHY THIS EXISTS BESIDE THE TWO CHECKS ABOVE, WHICH LOOK LIKE IT ────────
   *
   * Both of those enumerate. One renders a hand-kept `specimens` list; the
   * other calls two named cva functions. They are precise about what they
   * cover and silent about everything else — and on 12 Aug 2026 that silence
   * had two live defects in it:
   *
   *   sidebar.variants.ts   `data-hovered:no-underline` and
   *                         `data-hovered:bg-surface-hover` on the row. Nothing
   *                         writes that attribute since `link.tsx` left React
   *                         Aria, so sidebar rows had NO hover at all — and the
   *                         one hover that did fire was `Link`'s own underline,
   *                         which the dead rule existed to suppress.
   *   bubble.tsx:207        `data-hovered:text-current data-hovered:underline`
   *                         on the collapse trigger. Same cause, same silence.
   *
   * Neither component was a specimen, so neither was ever looked at. That is
   * the failure mode `coverage.test.ts` names in its own header: a suite that
   * checks what someone remembered to add to a list checks the components
   * nobody forgot.
   *
   * So this one reads the DIRECTORY. A component added tomorrow is covered
   * without anyone adding it here, which is the only property that makes a
   * rule like this hold.
   *
   * ── WHY IT MATCHES A UTILITY AND NOT THE BARE WORD ────────────────────────
   *
   * `data-hovered:` with the colon is a Tailwind VARIANT — a rule addressed to
   * an attribute Base UI never writes. The bare word appears all over this
   * library in prose, recording what React Aria used to emit and why the
   * migration changed it, and that prose is evidence worth keeping. Matching
   * the colon separates the dead rule from its own obituary.
   */
  const DEAD_UTILITIES = [
    "data-hovered:",
    "data-focus-visible:",
    "data-entering:",
    "data-exiting:",
  ];

  /** Strips block and line comments so prose about the past cannot fail this. */
  function code(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  }

  const SRC = import.meta.dirname;
  const sources = readdirSync(SRC).filter(
    (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes(".test."),
  );

  it("has sources to sweep (guards against a vacuous pass)", () => {
    // If the filter or the directory ever changes shape, every assertion below
    // would iterate nothing and report green.
    expect(sources.length).toBeGreaterThan(80);
  });

  it.each(sources.map((f) => [f] as const))("%s carries no dead state utility", (file) => {
    const source = code(readFileSync(`${SRC}/${file}`, "utf8"));
    for (const dead of DEAD_UTILITIES) {
      expect(source, `${file} styles ${dead}, which Base UI never writes`).not.toContain(dead);
    }
  });
});
