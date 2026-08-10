/**
 * InputGroup under fa-IR.
 *
 * The two claims the header makes, pinned: the adornment overlays sit on
 * LOGICAL insets (`start-0`/`end-0`) with the input reserving logical padding
 * only on the side that has an adornment — and an icon-only adornment control
 * cannot exist unnamed, because it is the exemplar's IconButton underneath.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { InputGroup, InputGroupButton } from "./input-group.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

function spokenAttributes(): string[] {
  const out: string[] = [];
  for (const el of document.querySelectorAll(
    "[aria-label],[aria-roledescription],[aria-valuetext],[aria-placeholder],[title]",
  )) {
    for (const attr of ["aria-label", "aria-roledescription", "aria-valuetext", "aria-placeholder", "title"]) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
}

function Glyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M2 8h12" />
    </svg>
  );
}

describe("InputGroup — a named field with adorned reading edges", () => {
  it("the input is named by the required Persian label", () => {
    render(<InputGroup label="نشانی صفحه" />);
    expect(screen.getByRole("textbox", { name: "نشانی صفحه" })).toBeDefined();
  });

  it("reserves logical padding ONLY on the side that has an adornment", () => {
    const { container, unmount } = render(<InputGroup label="نشانی" leading={<Glyph />} />);
    let input = container.querySelector("input");
    expect(input?.className).toContain("ps-10");
    expect(input?.className).toContain("pe-3");
    unmount();

    const second = render(
      <InputGroup label="نشانی" trailing={<Glyph />} />,
    );
    input = second.container.querySelector("input");
    expect(input?.className).toContain("ps-3");
    expect(input?.className).toContain("pe-10");
  });

  it("pins the overlays with start-0 / end-0, never a physical inset", () => {
    const { container } = render(
      <InputGroup label="نشانی" leading={<Glyph />} trailing={<Glyph />} />,
    );
    const overlays = [...container.querySelectorAll("div.absolute")];
    expect(overlays.length).toBe(2);
    const classes = overlays.map((o) => o.className).join(" ");
    expect(classes).toContain("start-0");
    expect(classes).toContain("end-0");
    expect(/(?<![a-z-])(left|right)-/.test(classes)).toBe(false);
    // Decorative adornments must not steal the input's clicks…
    for (const o of overlays) expect(o.className).toContain("pointer-events-none");
  });

  it("an icon-only adornment button carries its required Persian name and wins back its events", () => {
    render(
      <InputGroup
        label="نشانی صفحه"
        trailing={
          <InputGroupButton label="رونوشت نشانی">
            <Glyph />
          </InputGroupButton>
        }
      />,
    );
    const button = screen.getByRole("button", { name: "رونوشت نشانی" });
    // …while an interactive one — every Lumo control carries data-lumo — does.
    expect(button.hasAttribute("data-lumo")).toBe(true);
    expect(
      button.closest("div.absolute")?.className,
    ).toContain("[&_[data-lumo]]:pointer-events-auto");
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });

  it("wires description and error exactly as TextField does", () => {
    const { container } = render(
      <InputGroup
        label="کد پستی"
        description="ده رقم، بدون خط تیره."
        errorMessage="کد پستی واردشده معتبر نیست."
      />,
    );
    const input = container.querySelector("input");
    // Supplying an errorMessage marks the field invalid on its own.
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    const described = (input?.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    expect(described.length).toBeGreaterThan(0);
    const texts = described.map((id) => document.getElementById(id)?.textContent ?? "");
    expect(texts.join(" ")).toContain("ده رقم، بدون خط تیره.");
    expect(texts.join(" ")).toContain("کد پستی واردشده معتبر نیست.");
  });

  it("serves the label in the first byte with no English beside it", () => {
    const html = renderToStaticMarkup(
      <InputGroup label="نشانی صفحه" placeholder="نشانی را وارد کنید" leading={<Glyph />} />,
    );
    expect(html).toContain("نشانی صفحه");
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(LATIN_WORD.test(html.replace(/<[^>]+>/g, ""))).toBe(false);
  });
});
