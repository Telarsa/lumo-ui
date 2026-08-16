import { describe, expect, it } from "vitest";
import { direction, FORMAT_LOCALE, LOCALES } from "./types.ts";
import { formatDate, formatNumber, parseNumber } from "./format.ts";

/**
 * The environment assertions. These must run on the CI RUNNER, not only on a
 * laptop, because a small-ICU Node build silently reports `gregory`/`latn` for
 * `fa-IR` — and every Jalali claim downstream would then be false in a way no
 * other test could catch, since the other tests run on the same runtime.
 */
describe("environment — Intl capability", () => {
  it("resolves the Persian calendar and numbering system", () => {
    const o = new Intl.DateTimeFormat(FORMAT_LOCALE["fa-IR"]).resolvedOptions();
    expect(o.calendar).toBe("persian");
    expect(o.numberingSystem).toBe("arabext");
  });

  it("derives direction from the platform when the capability exists", () => {
    expect(direction("fa-IR")).toBe("rtl");
    expect(direction("en-US")).toBe("ltr");
  });

  it("every declared locale resolves a direction", () => {
    for (const l of LOCALES) expect(["rtl", "ltr"]).toContain(direction(l));
  });

  it("keeps the closed locale catalogue usable on Android Chromium without getTextInfo", () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl.Locale.prototype, "getTextInfo");
    Object.defineProperty(Intl.Locale.prototype, "getTextInfo", {
      configurable: true,
      value: undefined,
    });
    try {
      expect(direction("fa-IR")).toBe("rtl");
      expect(direction("en-US")).toBe("ltr");
    } finally {
      if (descriptor === undefined) delete Intl.Locale.prototype.getTextInfo;
      else Object.defineProperty(Intl.Locale.prototype, "getTextInfo", descriptor);
    }
  });
});

describe("format — Persian numerals", () => {
  it("uses Persian digits with the correct separators", () => {
    const out = formatNumber(1234.5, "fa-IR");
    expect(out).toBe("۱٬۲۳۴٫۵");
    // Stated explicitly because these two are the ones that get silently
    // replaced by ASCII , and . when the numbering system falls back.
    expect(out).toContain("٬"); // Arabic thousands separator
    expect(out).toContain("٫"); // Arabic decimal separator
  });

  it("contains no ASCII digits at all", () => {
    expect(formatNumber(9876543210, "fa-IR")).not.toMatch(/[0-9]/);
  });

  it("still formats English normally", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
  });
});

describe("format — Jalali dates", () => {
  it("formats in the Persian calendar, not Gregorian-with-Persian-digits", () => {
    // 2026-08-09 is 18 Mordad 1405. A Gregorian fallback would say ۲۰۲۶.
    const out = formatDate(new Date("2026-08-09T12:00:00Z"), "fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(out).toContain("۱۴۰۵");
    expect(out).not.toContain("۲۰۲۶");
    expect(out).toContain("مرداد");
  });
});

describe("parseNumber — the half Intl does not provide", () => {
  it("round-trips a Persian-formatted number", () => {
    expect(parseNumber(formatNumber(1234.5, "fa-IR"), "fa-IR")).toBe(1234.5);
    expect(parseNumber(formatNumber(9876543, "fa-IR"), "fa-IR")).toBe(9876543);
  });

  it("parses Persian digits that Number() cannot", () => {
    // The reason this function exists at all.
    expect(Number("۱٬۲۳۴٫۵")).toBeNaN();
    expect(parseNumber("۱٬۲۳۴٫۵", "fa-IR")).toBe(1234.5);
  });

  it("tolerates bidi marks, which real Persian input carries", () => {
    expect(parseNumber("‏۱۲۳‎", "fa-IR")).toBe(123);
  });

  it("returns NaN for genuine rubbish rather than a plausible wrong number", () => {
    expect(parseNumber("سلام", "fa-IR")).toBeNaN();
  });
});

describe("documentDirection — a host's other languages", () => {
  // LumoHtml accepts any BCP-47 tag so a site can serve a `de` page beside the
  // Lumo locales; direction for those comes from the primary subtag.
  it("derives Lumo locales exactly as direction() does", async () => {
    const { documentDirection } = await import("./html.tsx");
    expect(documentDirection("fa-IR")).toBe("rtl");
    expect(documentDirection("en-US")).toBe("ltr");
  });
  it("knows the right-to-left primary subtags and defaults everything else to ltr", async () => {
    const { documentDirection } = await import("./html.tsx");
    for (const tag of ["ar", "ar-EG", "he-IL", "ur", "ps-AF", "ckb"]) expect(documentDirection(tag), tag).toBe("rtl");
    for (const tag of ["de", "de-CH", "fr", "ja-JP", "tr"]) expect(documentDirection(tag), tag).toBe("ltr");
  });
  it("isLocale narrows only the two Lumo locales", async () => {
    const { isLocale } = await import("./types.ts");
    expect(isLocale("fa-IR")).toBe(true);
    expect(isLocale("fa")).toBe(false);
    expect(isLocale("de")).toBe(false);
  });
});

describe("direction — a runtime without Intl.Locale (Hermes, 16 Aug 2026)", () => {
  it("falls back to the table instead of throwing when Intl.Locale is absent", async () => {
    const saved = Object.getOwnPropertyDescriptor(Intl, "Locale");
    // Simulating Hermes: the constructor is missing entirely.
    Object.defineProperty(Intl, "Locale", { value: undefined, configurable: true, writable: true });
    try {
      const { direction } = await import("./types.ts");
      expect(direction("fa-IR")).toBe("rtl");
      expect(direction("en-US")).toBe("ltr");
    } finally {
      if (saved) Object.defineProperty(Intl, "Locale", saved);
    }
  });
});
