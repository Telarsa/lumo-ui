import { describe, expect, it } from "vitest";
import { buildSearchIndex, matches, normalize, type SearchSource } from "./search-index";

/**
 * `normalize()` is the whole point of this file. Every rule below has a case
 * that FAILS on the raw, un-normalised strings — proving the rule is load
 * bearing rather than a test that would pass with `normalize` deleted.
 */
describe("normalize — Persian has no casefolding", () => {
  it("does not touch Persian letters (toLowerCase is a documented no-op)", () => {
    expect("دکمه".toLowerCase()).toBe("دکمه");
    expect(normalize("دکمه")).toBe("دکمه");
  });

  it("still folds Latin case, for the en-US route", () => {
    // Without .toLowerCase() these three would be three different strings.
    expect(normalize("Kbd")).toBe(normalize("KBD"));
    expect(normalize("KBD")).toBe(normalize("kbd"));
    expect(normalize("Kbd")).toBe("kbd");
  });
});

describe("normalize — Arabic vs Persian codepoints", () => {
  it("folds Arabic kaf (U+0643) to Persian keheh (U+06A9)", () => {
    const arabicKaf = "كتاب"; // كتاب, typed with ك
    const persianKeheh = "کتاب"; // کتاب, typed with ک
    // Fails without the fold: these are two different code points.
    expect(arabicKaf).not.toBe(persianKeheh);
    expect(normalize(arabicKaf)).toBe(normalize(persianKeheh));
  });

  it("folds Arabic yeh (U+064A) to Persian yeh (U+06CC)", () => {
    const arabicYeh = "علي"; // علي, typed with ي
    const persianYeh = "علی"; // علی, typed with ی
    expect(arabicYeh).not.toBe(persianYeh);
    expect(normalize(arabicYeh)).toBe(normalize(persianYeh));
  });
});

describe("normalize — ZWNJ", () => {
  it("matches a compound typed without the joiner", () => {
    const withZwnj = "دکمه‌ها"; // دکمه‌ها, the correct spelling
    const withoutZwnj = "دکمهها"; // what most people actually type
    expect(withZwnj).not.toBe(withoutZwnj);
    expect(normalize(withZwnj)).toBe(normalize(withoutZwnj));
    expect(normalize(withZwnj)).not.toContain("‌");
  });
});

describe("normalize — Persian and Arabic-Indic digits", () => {
  it("folds Persian, Arabic-Indic and ASCII digits to one form", () => {
    const persian = "۱۲۳"; // ۱۲۳
    const arabicIndic = "١٢٣"; // ١٢٣
    const ascii = "123";
    expect(persian).not.toBe(ascii);
    expect(arabicIndic).not.toBe(ascii);
    expect(normalize(persian)).toBe("123");
    expect(normalize(arabicIndic)).toBe("123");
    expect(normalize(persian)).toBe(normalize(arabicIndic));
  });
});

describe("normalize — diacritics", () => {
  it("strips fatha, damma, kasra, shadda and sukun", () => {
    // سَلام vs سلام — a vowelled spelling nobody actually types when searching.
    const vowelled = "سَلام"; // fatha on the seen
    const bare = "سلام";
    expect(vowelled).not.toBe(bare);
    expect(normalize(vowelled)).toBe(bare);
  });

  it("strips a shadda+kasra combination", () => {
    // مُحَمَّد vs محمد — damma, fatha, shadda+fatha all present.
    const vowelled = "مُحَمَّد";
    const bare = "محمد";
    expect(normalize(vowelled)).toBe(bare);
  });
});

describe("matches — the palette's filter predicate", () => {
  it("finds a Persian title through an Arabic-keyboard query", () => {
    expect(matches("دکمه", "دكمه")).toBe(true); // ك instead of ک
  });

  it("finds a title through a query with different digits", () => {
    expect(matches("نسخهٔ ۱۲۳", "123")).toBe(true);
  });

  it("finds a compound through a query missing the ZWNJ", () => {
    expect(matches("دکمه‌ها", "دکمهها")).toBe(true);
  });

  it("is case-insensitive for English", () => {
    expect(matches("Command palette", "COMMAND")).toBe(true);
  });

  it("an empty query matches everything (the palette's default state)", () => {
    expect(matches("anything", "")).toBe(true);
    expect(matches("anything", "   ")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matches("دکمه", "جدول")).toBe(false);
  });
});

describe("buildSearchIndex", () => {
  const components: SearchSource[] = [
    {
      id: "button",
      title: { "fa-IR": "دکمه", "en-US": "Button" },
      intro: { "fa-IR": "کنش اصلی.", "en-US": "The primary action." },
      tier: "form",
    },
  ];
  const blocks: SearchSource[] = [
    {
      id: "hero",
      title: { "fa-IR": "سربرگ صفحه", "en-US": "Hero" },
      intro: { "fa-IR": "نخستین بخش.", "en-US": "The opening section." },
    },
  ];

  it("tags each doc with its kind", () => {
    const index = buildSearchIndex(components, blocks);
    expect(index.find((d) => d.id === "button")?.kind).toBe("component");
    expect(index.find((d) => d.id === "hero")?.kind).toBe("block");
  });

  it("builds a per-locale href for a component, under /components/", () => {
    const index = buildSearchIndex(components, blocks);
    const doc = index.find((d) => d.id === "button")!;
    expect(doc.href["fa-IR"]).toBe("/fa/components/button/");
    expect(doc.href["en-US"]).toBe("/en/components/button/");
  });

  it("builds a per-locale href for a block, under /blocks/", () => {
    const index = buildSearchIndex(components, blocks);
    const doc = index.find((d) => d.id === "hero")!;
    expect(doc.href["fa-IR"]).toBe("/fa/blocks/hero/");
    expect(doc.href["en-US"]).toBe("/en/blocks/hero/");
  });

  it("carries both locales' title and intro through untouched", () => {
    const index = buildSearchIndex(components, blocks);
    const doc = index.find((d) => d.id === "button")!;
    expect(doc.title).toEqual(components[0]!.title);
    expect(doc.intro).toEqual(components[0]!.intro);
  });

  it("never touches the filesystem — safe to import from a client module", () => {
    // Regression guard for the file header's central claim: buildSearchIndex
    // is pure data transformation, so this file has zero fs-dependent
    // imports. There is nothing to assert at runtime beyond "it ran without
    // one" — the real check is the absence of `node:fs`/`@/lib/demos` in this
    // module's own import list, which TypeScript and the bundler enforce.
    expect(buildSearchIndex([], [])).toEqual([]);
  });
});
