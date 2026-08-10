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
      <ComboBox label="شهر" showSuggestionsLabel="نمایش پیشنهادها" suggestionsLabel="پیشنهادها">
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
      <ComboBox key="cb" label="شهر" showSuggestionsLabel="نمایش" suggestionsLabel="پیشنهادها">
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
    const b = render(<Button>سلام</Button>).container.querySelector("button")!;
    expect(b.getAttribute("class")).toContain("active:bg-accent-hover");
  });
});
