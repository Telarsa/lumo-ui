/**
 * NativeSelect under fa-IR.
 *
 * The platform picker with a required, wired `<label>`. Pinned here: the
 * name reaches the control through for/id in the first byte, the chevron and
 * padding are logical (upstream's physical spelling is the defect), and the
 * whole thing renders with no ARIA beyond what the platform implies.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./native-select.tsx";

afterEach(cleanup);

const PHYSICAL = /\b(?:-?m[lr]-|p[lr]-|rounded-[lr]-|rounded-[tb][lr]-|border-[lr]\b|border-[lr]-|text-(?:left|right)\b|(?<![a-z-])(?:left|right)-)/;

function picker() {
  return (
    <NativeSelect label="شهر" defaultValue="thr">
      <NativeSelectOptGroup label="استان تهران">
        <NativeSelectOption value="thr">تهران</NativeSelectOption>
        <NativeSelectOption value="krj">کرج</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="استان اصفهان">
        <NativeSelectOption value="isf">اصفهان</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  );
}

describe("NativeSelect — a real <select> named by a real <label>", () => {
  it("the required Persian label reaches the control through for/id", () => {
    render(picker());
    const select = screen.getByLabelText("شهر");
    expect(select.tagName).toBe("SELECT");
    // Options and groups pass through with their Persian text intact.
    expect(screen.getByRole("option", { name: "تهران" })).toBeDefined();
  });

  it("serves the association in the first byte — prerendered, before any JS", () => {
    const html = renderToStaticMarkup(picker());
    const forMatch = html.match(/for="([^"]+)"/);
    expect(forMatch?.[1]).toBeTruthy();
    expect(html).toContain(`id="${forMatch?.[1] ?? ""}"`);
    expect(html).toContain("شهر");
    expect(html).toContain('label="استان تهران"');
    // No ARIA invented: the platform supplies the semantics.
    expect(html).not.toContain("aria-label");
    expect(html).not.toContain("role=");
  });

  it("labelHidden keeps the name for AT instead of deleting it", () => {
    render(
      <NativeSelect label="اندازهٔ صفحه" labelHidden>
        <NativeSelectOption value="10">ده مورد</NativeSelectOption>
      </NativeSelect>,
    );
    const select = screen.getByLabelText("اندازهٔ صفحه");
    expect(select.tagName).toBe("SELECT");
    const label = document.querySelector("label");
    expect(label?.getAttribute("class")).toContain("sr-only");
  });
});

describe("NativeSelect — logical chrome over the platform widget", () => {
  it("pads with the ps/pe pair and anchors the chevron at the inline end — the lines upstream wrote physically", () => {
    const { container } = render(picker());
    const select = container.querySelector("select");
    expect(select?.getAttribute("class")).toContain("ps-3");
    expect(select?.getAttribute("class")).toContain("pe-9");
    const chevron = container.querySelector("svg");
    expect(chevron?.getAttribute("aria-hidden")).toBe("true");
    expect(chevron?.getAttribute("class")).toContain("end-3");
    for (const el of container.querySelectorAll("[class]")) {
      const cls = el.getAttribute("class") ?? "";
      expect(PHYSICAL.test(cls), `physical utility in "${cls}"`).toBe(false);
    }
  });

  it("carries data-lumo so the theme's single focus-ring rule covers it", () => {
    const { container } = render(picker());
    expect(container.querySelector("select")?.hasAttribute("data-lumo")).toBe(true);
  });

  it("isInvalid marks the control for AT; without it no aria-invalid is emitted", () => {
    const { container } = render(
      <NativeSelect label="شهر" isInvalid>
        <NativeSelectOption value="thr">تهران</NativeSelectOption>
      </NativeSelect>,
    );
    expect(container.querySelector("select")?.getAttribute("aria-invalid")).toBe("true");
    cleanup();
    const { container: clean } = render(picker());
    expect(clean.querySelector("select")?.hasAttribute("aria-invalid")).toBe(false);
  });
});
