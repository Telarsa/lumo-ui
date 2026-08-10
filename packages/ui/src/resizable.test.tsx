/**
 * resizable.tsx's claims, pinned — above all the two places direction enters
 * the math, because both fail SILENTLY in exactly one script if they regress.
 *
 * `aria-valuenow`/`min`/`max` are numeric attributes and stay Latin: they are
 * machine state, which `aria-valuetext` exists to override for human ears —
 * the same split RAC's own grid makes with `aria-colindex`.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Resizable } from "./resizable.tsx";

afterEach(cleanup);

const pane = (locale: "fa-IR" | "en-US", orientation?: "horizontal" | "vertical") =>
  render(
    <Resizable
      locale={locale}
      label={locale === "fa-IR" ? "تغییر اندازهٔ ستون‌ها" : "Resize the columns"}
      sizeLabel={(v) => (locale === "fa-IR" ? `${v} درصد` : `${v} percent`)}
      startPanel={<p>{locale === "fa-IR" ? "فهرست" : "List"}</p>}
      endPanel={<p>{locale === "fa-IR" ? "محتوا" : "Content"}</p>}
      defaultSize={30}
      {...(orientation === undefined ? {} : { orientation })}
    />,
  );

describe("Resizable — the divider announces its size in the reader's digits", () => {
  it("is a named separator with Persian value text built from the formatted number", () => {
    pane("fa-IR");
    const divider = screen.getByRole("separator");

    expect(divider.getAttribute("aria-label")).toBe("تغییر اندازهٔ ستون‌ها");
    expect(divider.getAttribute("aria-valuenow")).toBe("30");
    expect(divider.getAttribute("aria-valuetext")).toBe("۳۰ درصد");
    // The divider between side-by-side panes is itself a vertical bar.
    expect(divider.getAttribute("aria-orientation")).toBe("vertical");

    // aria-controls must resolve to the start pane it resizes.
    const controlled = document.getElementById(divider.getAttribute("aria-controls") ?? "");
    expect(controlled?.textContent).toBe("فهرست");
  });

  it("en-US announces Latin — the locale prop is the whole difference", () => {
    pane("en-US");
    expect(screen.getByRole("separator").getAttribute("aria-valuetext")).toBe("30 percent");
  });

  it("arrows are PHYSICAL, so ArrowLeft GROWS the start pane in Persian", () => {
    pane("fa-IR");
    const divider = screen.getByRole("separator");
    // In RTL the start pane sits at the right edge; moving the divider left
    // widens it. A regression to reading-order arrows flips this expectation.
    fireEvent.keyDown(divider, { key: "ArrowLeft" });
    expect(divider.getAttribute("aria-valuenow")).toBe("35");
    expect(divider.getAttribute("aria-valuetext")).toBe("۳۵ درصد");
    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(divider.getAttribute("aria-valuenow")).toBe("30");
  });

  it("…and the same physical key shrinks it in English", () => {
    pane("en-US");
    const divider = screen.getByRole("separator");
    fireEvent.keyDown(divider, { key: "ArrowLeft" });
    expect(divider.getAttribute("aria-valuenow")).toBe("25");
    fireEvent.keyDown(divider, { key: "ArrowRight" });
    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(divider.getAttribute("aria-valuenow")).toBe("35");
  });

  it("Home and End are LOGICAL: they collapse and expand the START pane", () => {
    pane("fa-IR");
    const divider = screen.getByRole("separator");
    fireEvent.keyDown(divider, { key: "Home" });
    expect(divider.getAttribute("aria-valuenow")).toBe("15");
    fireEvent.keyDown(divider, { key: "End" });
    expect(divider.getAttribute("aria-valuenow")).toBe("85");
  });

  it("a vertical split moves on the block axis, which never mirrors", () => {
    pane("fa-IR", "vertical");
    const divider = screen.getByRole("separator");
    expect(divider.getAttribute("aria-orientation")).toBe("horizontal");
    fireEvent.keyDown(divider, { key: "ArrowDown" });
    expect(divider.getAttribute("aria-valuenow")).toBe("35");
    fireEvent.keyDown(divider, { key: "ArrowUp" });
    expect(divider.getAttribute("aria-valuenow")).toBe("30");
    // The inline-axis keys must do nothing here rather than something wrong.
    fireEvent.keyDown(divider, { key: "ArrowLeft" });
    expect(divider.getAttribute("aria-valuenow")).toBe("30");
  });

  it("clamps the initial size instead of trusting the caller", () => {
    render(
      <Resizable
        locale="fa-IR"
        label="تقسیم صفحه"
        sizeLabel={(v) => `${v} درصد`}
        startPanel={<p>الف</p>}
        endPanel={<p>ب</p>}
        defaultSize={99}
      />,
    );
    expect(screen.getByRole("separator").getAttribute("aria-valuenow")).toBe("85");
  });

  it("sizes the start pane with a LOGICAL inline-size, in the first byte", () => {
    const html = renderToStaticMarkup(
      <Resizable
        locale="fa-IR"
        label="تقسیم صفحه"
        sizeLabel={(v) => `${v} درصد`}
        startPanel={<p>الف</p>}
        endPanel={<p>ب</p>}
        defaultSize={30}
      />,
    );
    // `inline-size`, not `width` — the one style that could not be expressed
    // as a physical property without a direction branch somewhere else.
    expect(html).toContain("inline-size:30%");
    expect(html).toContain('aria-valuetext="۳۰ درصد"');
  });
});
