/*
 * icon-tile.tsx, icon-stack.tsx and frame.tsx.
 *
 * Three small components, and every one of them has exactly one way to be
 * wrong that a rendering cannot show: a decoration that announces itself, an
 * overlap that leans the wrong way, and a Latin digit.
 */

import { Fragment } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { IconTile } from "./icon-tile.tsx";
import { IconStack } from "./icon-stack.tsx";
import { Frame } from "./frame.tsx";

afterEach(cleanup);

describe("IconTile — decorative unless told otherwise", () => {
  it("is hidden from assistive technology by default", () => {
    const { container } = render(
      <IconTile>
        <svg />
      </IconTile>,
    );
    // The opposite of the usual default, and the right one: a tile sits above a
    // heading that already says what it means, so naming it makes every card
    // in a grid announce its subject twice.
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(container.firstElementChild?.getAttribute("role")).toBeNull();
  });

  it("becomes a named image when it is the only carrier of meaning", () => {
    render(
      <IconTile label="ارسال شد">
        <svg />
      </IconTile>,
    );
    expect(screen.getByRole("img", { name: "ارسال شد" })).toBeTruthy();
  });

  it("never serves an unnamed role=img", () => {
    // Which announces "image" and then has nothing to say — worse than no role.
    const html = renderToStaticMarkup(
      <IconTile>
        <svg />
      </IconTile>,
    );
    expect(html).not.toContain('role="img"');
  });

  it("keeps its owned semantics when an untyped props bag conflicts", () => {
    const { container, rerender } = render(
      <IconTile {...({ role: "img", "aria-hidden": false } as object)} />,
    );
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(container.firstElementChild?.getAttribute("role")).toBeNull();

    rerender(
      <IconTile label="ارسال شد" {...({ role: "presentation", "aria-label": "wrong" } as object)} />,
    );
    expect(screen.getByRole("img", { name: "ارسال شد" })).toBeTruthy();
  });
});

describe("IconStack — the overlap leans the reader's way", () => {
  const stack = (
    <IconStack label="۵ عضو" locale="fa-IR" max={3}>
      <span />
      <span />
      <span />
      <span />
      <span />
    </IconStack>
  );

  it("uses the inline axis, not the left one", () => {
    const html = renderToStaticMarkup(stack);
    // `-ml-2` pulls each avatar toward the LEFT on a Persian page — away from
    // the one before it in reading order — so the overlap runs backwards: the
    // first face ends up on top of nothing.
    expect(html).toContain("-ms-2");
    expect(html).not.toMatch(/(^|["\s])-ml-/);
  });

  it("formats the overflow count in the reader's numerals", () => {
    render(stack);
    // «+۲», never «+2». A bare {overflow} type-checks under ReactNode and
    // renders Latin digits on a page whose every other figure is Persian —
    // exactly the defect LumoNode exists to make unrepresentable.
    expect(screen.getByText("+۲")).toBeTruthy();
  });

  it("shows no count when nothing overflows", () => {
    const html = renderToStaticMarkup(
      <IconStack label="۲ عضو" locale="fa-IR" max={4}>
        <span />
        <span />
      </IconStack>,
    );
    expect(html).not.toContain("+");
  });

  it("is one named thing, not five anonymous ones", () => {
    render(stack);
    // A stack of five avatars is one fact. Five images with five names
    // followed by "+2" is a worse rendering of it than the sentence the caller
    // already knows how to write.
    expect(screen.getByRole("img", { name: "۵ عضو" })).toBeTruthy();
  });

  it("counts through Children.toArray, so fragments and nulls behave", () => {
    render(
      <IconStack label="۴ عضو" locale="fa-IR" max={2}>
        <Fragment>
          <span />
          <span />
        </Fragment>
        {null}
        <span />
        <span />
      </IconStack>,
    );
    expect(screen.getByText("+۲")).toBeTruthy();
  });

  it("keeps its required semantics when an untyped props bag conflicts", () => {
    const { container } = render(
      <IconStack
        label="۵ عضو"
        locale="fa-IR"
        {...({ role: "presentation", "aria-label": "wrong" } as object)}
      >
        <span />
      </IconStack>,
    );
    expect(container.firstElementChild?.getAttribute("role")).toBe("img");
    expect(container.firstElementChild?.getAttribute("aria-label")).toBe("۵ عضو");
  });
});

describe("Frame — the chrome is a drawing, not a control", () => {
  it("hides the browser bar entirely", () => {
    const { container } = render(
      <Frame label="پیش‌نمایش" address="lumo.telarsa.com">
        <p>محتوا</p>
      </Frame>,
    );
    // Real <button>s here would put three unnamed controls into the tab order
    // of every page showing a preview, and named-controls fails the build on
    // each — which is how this rule was arrived at rather than assumed.
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("names what is inside it", () => {
    render(
      <Frame label="پیش‌نمایش موبایل" device="phone">
        <p>محتوا</p>
      </Frame>,
    );
    // A <figure> with a name rather than a landmark: a preview is illustrative
    // content, and a landmark per mockup clutters the landmark list.
    expect(screen.getByLabelText("پیش‌نمایش موبایل").tagName).toBe("FIGURE");
  });

  it("keeps the bar LTR while the content inherits the page", () => {
    const html = renderToStaticMarkup(
      <Frame label="پیش‌نمایش" address="lumo.telarsa.com">
        <p>محتوا</p>
      </Frame>,
    );
    // A browser's chrome is not part of the document it frames, and a URL is an
    // LTR run. Mirroring the traffic-light dots on a Persian page draws a
    // browser that does not exist.
    expect(html).toMatch(/dir="ltr"[^>]*data-lumo-latn|data-lumo-latn[^>]*dir="ltr"/);
    // The content is untouched — no dir written around it.
    expect(html).toContain("<p>محتوا</p>");
  });

  it("draws no bar on a phone and no bezel on a browser", () => {
    const phone = renderToStaticMarkup(
      <Frame label="م" device="phone">
        <p>م</p>
      </Frame>,
    );
    const browser = renderToStaticMarkup(
      <Frame label="م" device="browser">
        <p>م</p>
      </Frame>,
    );
    expect(phone).not.toContain("data-lumo-latn");
    expect(browser).not.toContain("border-8");
  });

  it("keeps its required name when an untyped props bag conflicts", () => {
    render(<Frame label="پیش‌نمایش" {...({ "aria-label": "wrong" } as object)} />);
    expect(screen.getByLabelText("پیش‌نمایش")).toBeTruthy();
  });
});
