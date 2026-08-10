/**
 * ButtonGroup under fa-IR.
 *
 * The load-bearing claim is the header's: every seam rule is logical, so the
 * class set the group renders is IDENTICAL under both directions — the
 * mirroring is the browser's, not ours. That is asserted literally, by
 * rendering the same tree under `dir="rtl"` and `dir="ltr"` and diffing the
 * class strings, plus a physical-utility screen over the whole set.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Button, IconButton } from "./button.tsx";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

/** The utilities the lint bans — if one appears in a rendered class, the seam pins a side. */
const PHYSICAL = /\b(?:-?m[lr]-|p[lr]-|rounded-[lr]-|rounded-[tb][lr]-|border-[lr]\b|border-[lr]-|text-(?:left|right)\b|(?<![a-z-])(?:left|right)-)/;

function groupUnder(dir: "rtl" | "ltr") {
  const { container, unmount } = render(
    <div dir={dir}>
      <ButtonGroup label="عملیات سند">
        <Button variant="outline">رونوشت</Button>
        <Button variant="outline">تغییر نام</Button>
        <IconButton label="حذف" variant="outline">
          <span aria-hidden="true">×</span>
        </IconButton>
      </ButtonGroup>
    </div>,
  );
  const group = container.querySelector('[role="group"]');
  expect(group, "no group rendered — everything below would pass vacuously").not.toBeNull();
  const classes = {
    group: group?.getAttribute("class") ?? "",
    children: [...(group?.children ?? [])].map((c) => c.getAttribute("class") ?? ""),
  };
  unmount();
  return classes;
}

describe("ButtonGroup — the seams are logical", () => {
  it("renders the IDENTICAL class set under rtl and ltr", () => {
    const rtl = groupUnder("rtl");
    const ltr = groupUnder("ltr");
    // Not merely "both work": byte-equal. A direction-variant class anywhere
    // in the set means someone reintroduced a physical seam.
    expect(rtl.group).toBe(ltr.group);
    expect(rtl.children).toEqual(ltr.children);
  });

  it("squares the seams with rounded-s-none / rounded-e-none, and no physical utility anywhere", () => {
    const { group, children } = groupUnder("rtl");
    expect(group).toContain("[&>*+*]:rounded-s-none");
    expect(group).toContain("[&>*:not(:last-child)]:rounded-e-none");
    expect(group).toContain("[&>*+*]:border-s-0");
    for (const cls of [group, ...children]) {
      expect(PHYSICAL.test(cls), `physical utility in "${cls}"`).toBe(false);
    }
  });

  it("stacks the vertical orientation along the block axis, which does not mirror", () => {
    const { container } = render(
      <ButtonGroup label="عملیات" orientation="vertical">
        <Button variant="outline">رونوشت</Button>
        <Button variant="outline">حذف</Button>
      </ButtonGroup>,
    );
    const group = container.querySelector('[role="group"]');
    expect(group?.getAttribute("data-orientation")).toBe("vertical");
    expect(group?.getAttribute("class")).toContain("flex-col");
    // rounded-t/rounded-b are deliberate: the block axis is direction-invariant.
    expect(group?.getAttribute("class")).toContain("[&>*+*]:rounded-t-none");
  });
});

describe("ButtonGroup — named in Persian, mechanically", () => {
  it("the group and its icon-only member both carry required Persian names", () => {
    render(
      <ButtonGroup label="عملیات سند">
        <Button variant="outline">رونوشت</Button>
        <ButtonGroupSeparator />
        <IconButton label="حذف" variant="outline">
          <span aria-hidden="true">×</span>
        </IconButton>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group", { name: "عملیات سند" })).toBeDefined();
    expect(screen.getByRole("button", { name: "حذف" })).toBeDefined();
    // The separator between two members is RAC's vertical form: a div with the
    // separator role, not a misused <hr>.
    expect(document.querySelector('[role="separator"]')).not.toBeNull();
  });

  it("serves the name in the first byte, with no English beside it", () => {
    const html = renderToStaticMarkup(
      <ButtonGroup label="عملیات سند">
        <Button variant="outline">رونوشت</Button>
        <ButtonGroupText>پیش‌نویس</ButtonGroupText>
      </ButtonGroup>,
    );
    expect(html).toContain('aria-label="عملیات سند"');
    expect(html).toContain("پیش‌نویس");
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(LATIN_WORD.test(html.replace(/<[^>]+>/g, ""))).toBe(false);
  });
});
