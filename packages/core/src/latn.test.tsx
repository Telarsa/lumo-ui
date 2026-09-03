import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isLatinRun, latnAttrs, latnNodeAttrs, plain } from "./latn.ts";
import { Latn, Name, Prose } from "./latn.tsx";

describe("isLatinRun", () => {
  it.each([
    ["Acme", true],
    ["contact@example.com", true],
    ["+98 912 345 6789", true],
    ["ISO 27001", true],
    ["AC-4825", true],
    // THE BUG the three hand-copies shipped: Persian digits sit inside the
    // Arabic block, so `\p{Script=Arabic}` called these native and never marked
    // them, while the gate — which asks for a LETTER — failed them.
    ["۹۰ Mt/year", true],
    ["۱۲۳", true],
    ["", true],
  ])("%s is a Latin run", (text, want) => {
    expect(isLatinRun(text)).toBe(want);
  });

  it.each([
    ["آکمه", "Persian"],
    ["۲۸۰۰ کیلومتر", "Persian with digits"],
    ["Sara احمدی", "mixed"],
    ["Плата", "Cyrillic"],
    ["治理服务费", "Han"],
    ["שלום", "Hebrew"],
    ["नमस्ते", "Devanagari"],
  ])("%s is NOT a Latin run (%s)", (text) => {
    expect(isLatinRun(text)).toBe(false);
  });
});

describe("Latn / Name", () => {
  it("marks a Latin string and adds nothing a reader could see", () => {
    expect(renderToStaticMarkup(<Latn>Acme</Latn>)).toBe('<span data-lumo-latn="">Acme</span>');
  });
  it("renders a native string BARE — the same slot must be able to hold a translation", () => {
    expect(renderToStaticMarkup(<Latn>{"آکمه"}</Latn>)).toBe("آکمه");
  });
  it("sets dir only when asked, because that is a visual change", () => {
    expect(renderToStaticMarkup(<Latn ltr>+98 912</Latn>)).toBe('<span data-lumo-latn="" dir="ltr">+98 912</span>');
  });
  it("Name is the same component", () => {
    expect(Name).toBe(Latn);
  });
});

describe("latnAttrs / latnNodeAttrs", () => {
  it("spreads the marker for a Latin attribute value and nothing otherwise", () => {
    expect(latnAttrs("Sara Ahmadi")).toEqual({ "data-lumo-latn": "" });
    expect(latnAttrs("سارا احمدی")).toEqual({});
  });
  it("judges rich-text chunks, and refuses to judge an element", () => {
    expect(latnNodeAttrs("INSTC")).toEqual({ "data-lumo-latn": "" });
    expect(latnNodeAttrs(["۹۰ ", "Mt/year"])).toEqual({ "data-lumo-latn": "" });
    expect(latnNodeAttrs("ایران")).toEqual({});
    expect(latnNodeAttrs(<b>INSTC</b>)).toEqual({});
    expect(latnNodeAttrs("")).toEqual({});
  });
});

describe("Prose / plain", () => {
  const copy = "پیگیری کنترل‌های ISMS و [[ISO 27001]] در [[M6]]";
  it("islands only the marked tokens", () => {
    expect(renderToStaticMarkup(<Prose>{copy}</Prose>)).toBe(
      'پیگیری کنترل‌های ISMS و <span data-lumo-latn="">ISO 27001</span> در <span data-lumo-latn="">M6</span>',
    );
  });
  it("sets dir on each island only when asked — the same opt-in as Latn", () => {
    expect(renderToStaticMarkup(<Prose ltr>{"شماره [[AC-4825]]"}</Prose>)).toBe(
      'شماره <span data-lumo-latn="" dir="ltr">AC-4825</span>',
    );
  });
  it("plain() strips the markers for a title or an alt", () => {
    expect(plain(copy)).toBe("پیگیری کنترل‌های ISMS و ISO 27001 در M6");
  });
});
