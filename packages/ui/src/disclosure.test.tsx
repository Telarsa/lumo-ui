/**
 * disclosure.tsx's Base UI claims, pinned.
 *
 * The load-bearing one is the FIRST: the choice of `Accordion` over
 * `Collapsible` rests entirely on the panel carrying `role="region"` and a name,
 * and that difference is one attribute pair that nothing else in the suite would
 * notice. If someone later "simplifies" a lone `<Disclosure>` onto `Collapsible`
 * — which is the mapping that reads more naturally — this file is what says no.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "./disclosure.tsx";

afterEach(cleanup);

const group = (props: { multiple?: boolean } = {}) => (
  <DisclosureGroup
    defaultExpandedKeys={["shipping"]}
    {...(props.multiple === true ? { allowsMultipleExpanded: true } : {})}
  >
    <Disclosure id="shipping">
      <DisclosureTrigger>هزینه ارسال</DisclosureTrigger>
      <DisclosurePanel>ارسال به تهران رایگان است.</DisclosurePanel>
    </Disclosure>
    <Disclosure id="returns">
      <DisclosureTrigger>بازگشت کالا</DisclosureTrigger>
      <DisclosurePanel>تا هفت روز.</DisclosurePanel>
    </Disclosure>
  </DisclosureGroup>
);

describe("Disclosure — an expanded panel is a NAMED region", () => {
  it("wires role=region + aria-labelledby back to its own trigger", () => {
    render(group());
    const trigger = screen.getByRole("button", { name: /هزینه ارسال/ });
    const region = screen.getByRole("region");

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(region.getAttribute("id"));
    // THE ASSERTION THE ENGINE CHOICE RESTS ON. Base UI's `Collapsible` panel
    // is an anonymous generic — no role, no name — so a reader who navigates
    // into an expanded section has nothing telling them which one they are in.
    expect(region.getAttribute("aria-labelledby")).toBe(trigger.getAttribute("id"));
    expect(region.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("puts every section in the document outline as a heading", () => {
    render(group());
    const headings = screen.getAllByRole("heading");
    expect(headings.map((h) => h.tagName)).toEqual(["H3", "H3"]);
    expect(headings.map((h) => h.textContent)).toEqual(["هزینه ارسال", "بازگشت کالا"]);
  });

  it("honours `level` by overriding the engine's element, keeping its state", () => {
    const html = renderToStaticMarkup(
      <Disclosure id="a">
        <DisclosureTrigger level={2}>هزینه ارسال</DisclosureTrigger>
        <DisclosurePanel>متن</DisclosurePanel>
      </Disclosure>,
    );
    expect(html).toContain("<h2");
    expect(html).toContain('aria-expanded="false"');
  });

  it("single-expansion is the DEFAULT, and `allowsMultipleExpanded` opens it up", () => {
    /**
     * The inverted-default trap. base-vega's vendored accordion spells this
     * `openMultiple`; Base UI's real prop is `multiple` and defaults to false,
     * matching React Aria's `allowsMultipleExpanded`. Getting it backwards would
     * turn every single-open accordion in every consuming project into a
     * multi-open one, with nothing red anywhere — so both directions are pinned.
     */
    render(group());
    // Only one panel exists at a time in single mode.
    expect(screen.getAllByRole("region")).toHaveLength(1);
    cleanup();

    render(
      <DisclosureGroup allowsMultipleExpanded defaultExpandedKeys={["shipping", "returns"]}>
        <Disclosure id="shipping">
          <DisclosureTrigger>هزینه ارسال</DisclosureTrigger>
          <DisclosurePanel>الف</DisclosurePanel>
        </Disclosure>
        <Disclosure id="returns">
          <DisclosureTrigger>بازگشت کالا</DisclosureTrigger>
          <DisclosurePanel>ب</DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>,
    );
    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("a LONE Disclosure works, and expands — it supplies its own root", () => {
    // The composition that has no group. Under Base UI expansion state lives on
    // `Accordion.Root`, so a bare `<Disclosure>` that did not render one would
    // type-check, render, and never open.
    render(
      <Disclosure id="solo" defaultExpanded>
        <DisclosureTrigger>هزینه ارسال</DisclosureTrigger>
        <DisclosurePanel>ارسال رایگان</DisclosurePanel>
      </Disclosure>,
    );
    expect(screen.getByRole("button", { name: /هزینه ارسال/ }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByRole("region").textContent).toContain("ارسال رایگان");
  });

  it("a collapsed panel is ABSENT from the first byte unless `keepMounted`", () => {
    /**
     * The capability Base UI adds and this file does not switch on by default,
     * asserted in both directions so "off" stays a decision. `hiddenUntilFound`
     * is what makes an FAQ's answers indexable and Ctrl-F-able with no
     * JavaScript at all.
     */
    const closed = renderToStaticMarkup(
      <Disclosure id="a">
        <DisclosureTrigger>پرسش</DisclosureTrigger>
        <DisclosurePanel>پاسخ</DisclosurePanel>
      </Disclosure>,
    );
    expect(closed).not.toContain("پاسخ");

    const kept = renderToStaticMarkup(
      <Disclosure id="a">
        <DisclosureTrigger>پرسش</DisclosureTrigger>
        <DisclosurePanel keepMounted="until-found">پاسخ</DisclosurePanel>
      </Disclosure>,
    );
    expect(kept).toContain("پاسخ");
    expect(kept).toContain('role="region"');
  });

  it("contributes no English to the first byte", () => {
    const html = renderToStaticMarkup(group());
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(html).toContain("هزینه ارسال");
  });
});
