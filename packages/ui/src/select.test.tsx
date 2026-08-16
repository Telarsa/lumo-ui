/*
 * THE SELECTED KEY'S LABEL, IN THE FIRST BYTE.
 *
 * ── WHY EVERY ASSERTION HERE IS `renderToStaticMarkup` ──────────────────────
 *
 * The defect this file was opened for (AUDIT §2.1) SELF-HEALS ON HYDRATION.
 * Base UI's `Select.Item` publishes its own text to the root's store from an
 * effect, so a `render()` under jsdom sees «تهران» a tick later and passes no
 * matter what the server sent. The served bytes carried `thr`, and a Persian
 * reader on a slow connection — or with JavaScript off, or before hydration
 * completes — read a Latin key. Measured at `10a08dc` on the built export:
 *
 *     fa/components/select/index.html        <span …>thr</span>
 *     view-block/fa/data-toolbar/index.html  newest
 *     view-block/fa/table-view/index.html    newest
 *
 * with the RSC payload two lines below each one carrying `label:"تازه‌ترین"`.
 * Nine gate rules were green over it, because no rule grades Latin WORDS in
 * visible text — only digits and `aria-*`. So the only instrument that can see
 * this is a server render with no effects, which is what every `it` below uses.
 * A test that reached for `render()` here would prove nothing.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopover,
  SelectSeparator,
  SelectTrigger,
  selectListBoxVariants,
  selectPopoverVariants,
} from "./select.tsx";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("caps long dropdowns to the positioning engine's available height", () => {
  expect(selectPopoverVariants()).toContain("max-h-[min(20rem,var(--available-height))]");
});

it("gives long dropdowns exactly one scrolling layer", () => {
  expect(selectPopoverVariants()).toContain("overflow-hidden");
  expect(selectPopoverVariants()).not.toContain("overflow-auto");
  expect(selectListBoxVariants()).toContain("overflow-auto");
});

it("uses a thin draggable scrollbar without reserving an empty gutter", () => {
  const classes = selectListBoxVariants();
  expect(classes).not.toContain("[scrollbar-gutter:stable]");
  expect(classes).toContain("[scrollbar-width:thin]");
  expect(classes).toContain(
    "[scrollbar-color:var(--color-border-strong)_var(--color-surface-sunken)]",
  );
  expect(classes).toContain("[&::-webkit-scrollbar-track]:bg-surface-sunken");
});

it("keeps the native draggable scrollbar instead of hiding it for edge arrows", () => {
  render(
    <Select placeholder="سال را انتخاب کنید" aria-label="سال" defaultOpen>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="1403">۱۴۰۳</SelectItem>
        <SelectItem id="1404">۱۴۰۴</SelectItem>
      </SelectPopover>
    </Select>,
  );
  const list = screen.getByRole("listbox");
  expect(list.classList.contains("base-ui-disable-scrollbar")).toBe(false);
});

it("keeps composite option focus inside the listbox instead of drawing a button ring", () => {
  render(
    <Select placeholder="سال را انتخاب کنید" aria-label="سال" defaultOpen>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="1403">۱۴۰۳</SelectItem>
      </SelectPopover>
    </Select>,
  );

  expect(screen.getByRole("option", { name: "۱۴۰۳" }).hasAttribute("data-lumo")).toBe(false);
});

/** The collapsed control's visible text: the `<span>` `SelectValue` renders. */
function collapsedValue(html: string): string | undefined {
  const button = /<button[^>]*role="combobox"[^>]*>([\s\S]*?)<\/button>/.exec(html)?.[1];
  if (button === undefined) return undefined;
  // The chevron is a sibling `<svg>`; the value is the first `<span>`.
  return /<span[^>]*>([\s\S]*?)<\/span>/.exec(button)?.[1]?.replace(/<[^>]*>/g, "");
}

describe("Select — shared async collection presentation", () => {
  it("marks its trigger busy and reports loading outside the option list", () => {
    render(
      <Select
        placeholder="یک شهر انتخاب کنید"
        aria-label="شهر"
        defaultOpen
        asyncState={{ status: "loading", text: "در حال دریافت شهرها" }}
      >
        <SelectTrigger />
        <SelectPopover />
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "شهر" }).getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(screen.getByRole("status").textContent).toBe("در حال دریافت شهرها");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("delivers a failed collection's recovery action without creating an option", () => {
    const retry = vi.fn();
    render(
      <Select
        placeholder="یک شهر انتخاب کنید"
        aria-label="شهر"
        defaultOpen
        asyncState={{
          status: "error",
          text: "دریافت شهرها ناموفق بود",
          action: { label: "تلاش دوباره", onPress: retry },
        }}
      >
        <SelectTrigger />
        <SelectPopover />
      </Select>,
    );

    expect(screen.getByRole("status").textContent).toBe("دریافت شهرها ناموفق بود");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("announces the caller's empty result when the ready collection has no items", () => {
    render(
      <Select
        placeholder="یک شهر انتخاب کنید"
        aria-label="شهر"
        defaultOpen
        asyncState={{ status: "ready", emptyText: "شهری پیدا نشد" }}
      >
        <SelectTrigger />
        <SelectPopover />
      </Select>,
    );

    expect(screen.getByRole("status").textContent).toBe("شهری پیدا نشد");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});

describe("the collapsed value resolves the selected key to its item's label", () => {
  it("a defaultSelectedKey renders the item's Persian text, not the key", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" defaultSelectedKey="thr">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">تهران</SelectItem>
          <SelectItem id="isf">اصفهان</SelectItem>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).toBe("تهران");
    // The stronger half: the key must not appear as visible text ANYWHERE. The
    // hidden `<input value="thr">` is a form value and is `aria-hidden`, so the
    // assertion is scoped to the button rather than to the whole document.
    expect(collapsedValue(html)).not.toBe("thr");
  });

  it("a controlled selectedKey resolves the same way", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" selectedKey="isf">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">تهران</SelectItem>
          <SelectItem id="isf">اصفهان</SelectItem>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).toBe("اصفهان");
  });

  it("resolves through a SelectGroup, which is a level of nesting deeper", () => {
    // The label map is walked out of `children`, and the items a real Persian
    // form uses are grouped by province. A walk that stopped at the popover's
    // direct children would pass the flat case above and ship this one broken.
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" defaultSelectedKey="ksh">
        <SelectTrigger />
        <SelectPopover>
          <SelectGroup label="استان تهران">
            <SelectItem id="thr">تهران</SelectItem>
            <SelectItem id="krj">کرج</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup label="استان اصفهان">
            <SelectItem id="isf">اصفهان</SelectItem>
            <SelectItem id="ksh">کاشان</SelectItem>
          </SelectGroup>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).toBe("کاشان");
  });

  it("uses `textValue` when the item's children are markup rather than a string", () => {
    // The rich-child arm: the visible row is a flex box holding the city and a
    // «تکمیل ظرفیت» note. Only `textValue` can say what the COLLAPSED control
    // should read, and the type makes it required exactly here.
    const html = renderToStaticMarkup(
      <Select placeholder="یک طرح انتخاب کنید" defaultSelectedKey="ent">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="free">رایگان</SelectItem>
          <SelectItem id="ent" textValue="سازمانی">
            <span className="flex w-full items-center justify-between gap-4">
              سازمانی
              <span className="text-xs text-fg-subtle">تکمیل ظرفیت</span>
            </span>
          </SelectItem>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).toBe("سازمانی");
  });

  it("still renders the placeholder when nothing is selected", () => {
    // The regression this fix could most easily cause: an empty label map plus
    // a null value must leave Base UI's placeholder path untouched.
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">تهران</SelectItem>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).toBe("یک شهر انتخاب کنید");
  });

  it("serves no Latin word inside the trigger", () => {
    // The rule the gate does not have, applied to the one component that
    // violated it. `data-*` attributes and class names are stripped by
    // `collapsedValue`, so what is left is what a reader sees.
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" defaultSelectedKey="thr">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">تهران</SelectItem>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).not.toMatch(/[A-Za-z]/);
  });

  it("validates the selected key and renders the caller's message", () => {
    const renderCity = (selectedKey: string) =>
      renderToStaticMarkup(
        <Select
          placeholder="یک شهر انتخاب کنید"
          aria-label="شهر"
          selectedKey={selectedKey}
          validate={(key) => (key === "thr" ? "این شهر مجاز نیست" : true)}
        >
          <SelectTrigger />
          <SelectPopover>
            <SelectItem id="thr">تهران</SelectItem>
            <SelectItem id="isf">اصفهان</SelectItem>
          </SelectPopover>
        </Select>,
      );

    const invalid = renderCity("thr");
    expect(invalid).toContain('aria-invalid="true"');
    expect(invalid).toContain("این شهر مجاز نیست");

    const valid = renderCity("isf");
    expect(valid).not.toContain("aria-invalid");
    expect(valid).not.toContain("این شهر مجاز نیست");
  });
});

describe("the RSC boundary, which is where the first fix silently did nothing", () => {
  /**
   * ── WHAT THIS SIMULATES, AND WHY A UNIT TEST HAS TO ────────────────────────
   *
   * `Select` and `SelectItem` are both `"use client"`. When a SERVER component
   * writes the exemplar in this file's header, the elements are created in the
   * server graph, serialised into the flight payload and revived for SSR. The
   * revived elements keep their `props` and their nesting — instrumented and
   * dumped during `next build` on 12 Aug 2026 — but `element.type` is a CLIENT
   * REFERENCE object, not the `SelectItem` function this module holds.
   *
   * The first version of the fix tested `child.type === SelectItem`. It passed
   * every other assertion in this file, and it shipped the original defect on
   * every page whose `<Select>` is written in a server component: the export
   * still served `thr` on `fa/components/select`. Only the `"use client"`
   * blocks were fixed.
   *
   * There is no RSC boundary inside vitest, so the test stands an element in
   * whose type is NOT `SelectItem` while its props are an item's props. That is
   * the same question the boundary asks — "can this walk recognise an item it
   * cannot identify by function?" — and it is the assertion that goes red if
   * anyone reintroduces the identity check as a "stricter" test.
   */
  function OpaqueItem(props: { id: string; children: string }) {
    return <SelectItem {...props} />;
  }

  it("resolves an item whose element type is not this module's function", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" defaultSelectedKey="thr">
        <SelectTrigger />
        <SelectPopover>
          <OpaqueItem id="thr">تهران</OpaqueItem>
          <OpaqueItem id="isf">اصفهان</OpaqueItem>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).toBe("تهران");
  });

  it("does not mistake a SelectGroup for an item", () => {
    // The group carries `label` and element children, so it must be descended
    // into rather than registered — and it has no `id` to register under. The
    // negative half of the props-shaped predicate.
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" defaultSelectedKey="krj">
        <SelectTrigger />
        <SelectPopover>
          <SelectGroup label="استان تهران">
            <OpaqueItem id="krj">کرج</OpaqueItem>
          </SelectGroup>
        </SelectPopover>
      </Select>,
    );
    expect(collapsedValue(html)).toBe("کرج");
  });
});

describe("the label a non-string item announces is required by the type", () => {
  /**
   * COMPILE-ENFORCED, and this is the half that keeps the fix from decaying.
   *
   * Deriving the label map out of `children` covers a string child. An item
   * whose child is markup has no string for the map to take, and before this
   * union `textValue` was optional with the requirement written in prose — the
   * same shape as the defect. `@ts-expect-error` fails `gate:types` the moment
   * the union collapses back to an optional prop.
   */
  it("markup children without `textValue` do not compile", () => {
    const noTextValue = (
      // @ts-expect-error a rich row has no string for the collapsed control to read.
      <SelectItem id="ent">
        <span>سازمانی</span>
      </SelectItem>
    );
    expect(noTextValue).toBeTruthy();
  });

  it("a plain string child needs nothing else", () => {
    const stringChild = <SelectItem id="thr">تهران</SelectItem>;
    expect(stringChild).toBeTruthy();
  });
});
