/*
 * `@locales` IN THE GATE ITSELF, NOT ONLY IN grade-app.
 *
 * 0.4.13 taught grade-app to honour a declared locale set while staging. The
 * gate underneath still guessed, so `lumo gate dist` — the entry point every
 * static export calls directly — never saw the declaration: `cli.ts` read
 * `@exempt-ceiling` and `@min-documents`, grade-app read `@locales`, and which
 * settings existed depended on which command you typed. That is a trap.
 *
 * `localeForPath` now takes the set, and `cli.ts` reads the same key and hands
 * it to every grader that derives a locale.
 */
import { describe, expect, it } from "vitest";
import { gradeHtml, gradingFor, localeForPath } from "./index.ts";

const EN = (lang = "en") =>
  `<!doctype html><html lang="${lang}" dir="ltr"><head><meta charset="utf-8"><title>Pro</title></head><body><p>Pricing for teams.</p></body></html>`;

describe("localeForPath with a declared set", () => {
  it("the bug, pinned: undeclared, /pro is Old Provençal", () => {
    expect(localeForPath("pro/index.html", "en").locale).toBe("pro");
  });
  it("declared, an undeclared segment is not a locale — and the page must be staged", () => {
    expect(() => localeForPath("pro/index.html", "en", undefined, new Set(["en", "de", "fa"]))).toThrow(/declared locales/);
  });
  it("a declared segment is still found, wherever it sits", () => {
    const d = new Set(["en", "de", "fa"]);
    expect(localeForPath("de/pricing.html", "en", undefined, d).locale).toBe("de");
    // `fa` refines to the built-in fa-IR profile — see the bare-tag test below.
    expect(localeForPath("view/fa/x.html", "en", undefined, d).locale).toBe("fa-IR");
  });
  it("a real language the app does NOT serve is not a locale either", () => {
    // `fa` is assigned and built in; this app declares only English.
    expect(() => localeForPath("fa/x.html", "en", undefined, new Set(["en"]))).toThrow(/declared locales/);
  });
  it("primary-subtag matching still works when the declaration is regional", () => {
    expect(localeForPath("fa/x.html", "en", undefined, new Set(["en-US", "fa-IR"])).locale).toBe("fa-IR");
  });
  it("a BARE declared tag refines to the built-in profile, as the guess always did", () => {
    // ICU's default for bare `ar` is LATIN digits; `ar-SA` is Arabic-Indic.
    // 0.5.0 returned the declared tag verbatim and graded Arabic pages as
    // Latin-digit pages — the committed digit floors caught it on a consumer.
    expect(new Intl.NumberFormat("ar").resolvedOptions().numberingSystem).toBe("latn");
    const d = new Set(["fa", "en", "ar"]);
    expect(localeForPath("ar/x.html", "en", undefined, d).locale).toBe("ar-SA");
    expect(gradingFor(localeForPath("ar/x.html", "en", undefined, d).locale).digits.numberingSystem).toBe("arab");
    expect(localeForPath("fa/x.html", "en", undefined, d).locale).toBe("fa-IR");
    // A REGIONAL declaration is honoured as written.
    expect(localeForPath("ar/x.html", "en", undefined, new Set(["ar-EG"])).locale).toBe("ar-EG");
  });
  it("root documents grade as the root locale regardless", () => {
    expect(localeForPath("404.html", "en", undefined, new Set(["en"])).locale).toBe("en");
  });
});

describe("gradeHtml honours the declaration", () => {
  it("undeclared, /pro fails lang-dir for declaring en", () => {
    const v = gradeHtml("pro/index.html", EN()).filter((x) => x.rule === "lang-dir");
    expect(v.length).toBeGreaterThan(0);
  });
  it("declared, de/pro is a German page and the English one is the defect", () => {
    const opts = { declaredLocales: new Set(["en", "de"]) };
    expect(gradeHtml("de/pro.html", EN("de"), undefined, opts).filter((x) => x.rule === "lang-dir")).toEqual([]);
    expect(gradeHtml("de/pro.html", EN("en"), undefined, opts).filter((x) => x.rule === "lang-dir").length).toBeGreaterThan(0);
  });
});
