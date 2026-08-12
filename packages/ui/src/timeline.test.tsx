/*
 * timeline.tsx and scrollspy.tsx.
 *
 * Both are components whose defects are invisible in an English screenshot: a
 * timeline places all three of its parts on the axis that mirrors, and a
 * scrollspy's failure mode is a heading that can never be marked.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Timeline,
  TimelineBody,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "./timeline.tsx";
import { Scrollspy } from "./scrollspy.tsx";

afterEach(cleanup);

const timeline = (
  <Timeline>
    <TimelineItem tone="positive">
      <TimelineTime dateTime="2026-08-10">۱۹ مرداد ۱۴۰۵</TimelineTime>
      <TimelineTitle>ثبت شد</TimelineTitle>
      <TimelineBody>سفارش در انبار ثبت شد.</TimelineBody>
    </TimelineItem>
    <TimelineItem>
      <TimelineTitle>ارسال شد</TimelineTitle>
    </TimelineItem>
  </Timeline>
);

describe("Timeline — the rail is the whole RTL problem", () => {
  /*
   * A timeline is a vertical line with dots on it and text beside it, and all
   * three are placed on the HORIZONTAL axis, which is the one that mirrors.
   * The usual build hardcodes `left-4`, `-ml-1.5` and `pl-10`, which produces a
   * rail down the wrong edge with text running into it — and looks perfect in
   * every screenshot an English-speaking reviewer takes.
   */
  it("places rail, dot and text with logical properties only", () => {
    const html = renderToStaticMarkup(timeline);
    for (const physical of ["left-", "right-", "ml-", "mr-", "pl-", "pr-"]) {
      expect(html, `${physical} would pin the rail to one script`).not.toMatch(
        new RegExp(`(^|["\\s-])${physical}`),
      );
    }
    // And the logical ones are actually there — the guard against this test
    // passing because nothing is positioned at all.
    expect(html).toContain("ps-10");
    expect(html).toContain("start-0");
    expect(html).toContain("start-3.5");
  });

  it("is an ordered list, because the order IS the information", () => {
    render(timeline);
    // `<ul>` renders identically and says something false: a screen reader
    // announces an ordered list as ordered, and the sequence is the only
    // reason this is a timeline rather than a stack of cards.
    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("draws no rail below the last item", () => {
    // A segment hanging below the final event promises something that is not
    // there.
    const { container } = render(timeline);
    const items = container.querySelectorAll("li");
    expect(items[0]?.querySelector('[class*="bottom-0"]')).not.toBeNull();
    expect(items[1]?.querySelector('[class*="bottom-0"]')).toBeNull();
  });

  it("hides the marker and the rail from assistive technology", () => {
    const { container } = render(timeline);
    // The meaning of a step is in TimelineTitle, which is real text. A dot that
    // announces itself makes every step read twice.
    for (const decoration of container.querySelectorAll("span")) {
      expect(decoration.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("carries a Gregorian datetime beside Jalali text, and that is correct", () => {
    render(timeline);
    const time = screen.getByText("۱۹ مرداد ۱۴۰۵");
    // `datetime` is consumed by software and ISO 8601 has no other calendar.
    // The visible text is the reader's. Not an inconsistency — the same
    // instant, written for two different readers.
    expect(time.getAttribute("datetime")).toBe("2026-08-10");
    expect(time.tagName).toBe("TIME");
  });

  it("renders without a client boundary", () => {
    // No "use client": a page can produce a timeline with no JavaScript at all.
    expect(renderToStaticMarkup(timeline)).toContain("ثبت شد");
  });
});

describe("Scrollspy — the links work before any JavaScript does", () => {
  const items = [
    { id: "install", label: "نصب" },
    { id: "usage", label: "استفاده" },
  ];

  it("serves real anchors, named as a landmark", () => {
    render(<Scrollspy label="در این صفحه" items={items} />);
    // A page routinely has several <nav>s and a screen reader's landmark list
    // shows them by name. Two unnamed ones are indistinguishable.
    expect(screen.getByRole("navigation", { name: "در این صفحه" })).toBeTruthy();
    // Genuine hrefs: these work with JavaScript disabled, before hydration,
    // and in print. The observer only decides which one is MARKED.
    expect(screen.getByRole("link", { name: "نصب" }).getAttribute("href")).toBe("#install");
  });

  it("marks nothing until something is observed", () => {
    render(<Scrollspy label="در این صفحه" items={items} />);
    // jsdom has no IntersectionObserver. The component must still render and
    // still navigate — a hook that throws from inside an effect makes it
    // unrenderable in every consumer's test suite.
    expect(typeof IntersectionObserver).toBe("undefined");
    expect(document.querySelector("[aria-current]")).toBeNull();
  });

  it("styles the active link FROM the aria attribute, not beside it", () => {
    const html = renderToStaticMarkup(<Scrollspy label="در این صفحه" items={items} />);
    // One source of truth, so the visible state cannot disagree with the
    // announced one. `aria-selected` would be meaningless on a link and a bare
    // class is invisible to anyone not looking at the screen.
    expect(html).toContain("aria-current:");
    expect(html).not.toContain("aria-selected");
  });

  it("puts its marker rail on the logical edge", () => {
    const html = renderToStaticMarkup(<Scrollspy label="در این صفحه" items={items} />);
    expect(html).toContain("border-s");
    expect(html).toContain("ps-3");
    expect(html).not.toMatch(/(^|["\s-])border-l/);
  });
});
