/**
 * Item under fa-IR.
 *
 * Pins the three renderings (anchor / button / static div) as type-driven
 * facts of the DOM, the ABSENCE of upstream's broken list semantics, and the
 * removal of its `text-left` description — the row must produce the identical
 * class set under both directions.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item.tsx";

afterEach(cleanup);

const PHYSICAL = /\b(?:-?m[lr]-|p[lr]-|rounded-[lr]-|rounded-[tb][lr]-|border-[lr]\b|border-[lr]-|text-(?:left|right)\b|(?<![a-z-])(?:left|right)-)/;

function roster(dir: "rtl" | "ltr") {
  const { container, unmount } = render(
    <div dir={dir}>
      <ItemGroup>
        <Item variant="outlined">
          <ItemMedia media="icon">
            <svg viewBox="0 0 16 16" aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>پروفایل</ItemTitle>
            <ItemDescription>نام و نشانی شما برای دیگر اعضا دیده می‌شود.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <span>…</span>
          </ItemActions>
        </Item>
        <ItemSeparator />
        <Item href="#" variant="outlined">
          <ItemContent>
            <ItemTitle>تنظیمات</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>,
  );
  const classes = [...container.querySelectorAll("[class]")].map(
    (el) => el.getAttribute("class") ?? "",
  );
  unmount();
  return classes;
}

describe("Item — what the element is, is the API", () => {
  it("href renders a real anchor, named by its Persian content", () => {
    render(
      <Item href="/fa-IR/profile">
        <ItemTitle>پروفایل</ItemTitle>
      </Item>,
    );
    const link = screen.getByRole("link", { name: "پروفایل" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/fa-IR/profile");
  });

  it("onPress renders a button and the press actually lands", async () => {
    const onPress = vi.fn();
    render(
      <Item onPress={onPress}>
        <ItemTitle>خروج از حساب</ItemTitle>
      </Item>,
    );
    const button = screen.getByRole("button", { name: "خروج از حساب" });
    await act(async () => {
      button.click();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("neither prop renders a plain div: no role, no tab stop, nothing focusable", () => {
    const html = renderToStaticMarkup(
      <Item>
        <ItemTitle>نسخهٔ برنامه</ItemTitle>
      </Item>,
    );
    expect(html.startsWith("<div")).toBe(true);
    expect(html).not.toContain("tabindex");
    expect(html).not.toContain("role=");
  });
});

describe("ItemGroup — no semantics is better than broken semantics", () => {
  it("does NOT claim role=list — upstream's list-of-nothing is the pinned defect", () => {
    const { container } = render(
      <ItemGroup>
        <Item>
          <ItemTitle>ردیف</ItemTitle>
        </Item>
      </ItemGroup>,
    );
    expect(container.querySelector("[role]")).toBeNull();
  });
});

describe("Item — logical geometry, and the upstream text-left is gone", () => {
  it("renders the IDENTICAL class set under rtl and ltr, with no physical utility", () => {
    const rtl = roster("rtl");
    const ltr = roster("ltr");
    expect(rtl).toEqual(ltr);
    for (const cls of rtl) {
      expect(PHYSICAL.test(cls), `physical utility in "${cls}"`).toBe(false);
    }
  });

  it("interactive rows realign their centered default with text-start, resolved by direction", () => {
    render(
      <Item href="#">
        <ItemTitle>تنظیمات</ItemTitle>
      </Item>,
    );
    expect(screen.getByRole("link").getAttribute("class")).toContain("text-start");
  });

  it("actions push to the inline end with ms-auto", () => {
    const { container } = render(
      <Item>
        <ItemTitle>اعلان‌ها</ItemTitle>
        <ItemActions>
          <span>…</span>
        </ItemActions>
      </Item>,
    );
    const actions = container.firstElementChild?.lastElementChild;
    expect(actions?.getAttribute("class")).toContain("ms-auto");
  });

  it("the description marks itself so the media can top-align two-line rows", () => {
    const { container } = render(
      <Item>
        <ItemMedia media="icon" />
        <ItemContent>
          <ItemTitle>پروفایل</ItemTitle>
          <ItemDescription>توضیح دوخطی</ItemDescription>
        </ItemContent>
      </Item>,
    );
    expect(container.querySelector("[data-lumo-item-description]")).not.toBeNull();
    expect(container.querySelector("p")?.getAttribute("class")).not.toContain("text-left");
  });
});
