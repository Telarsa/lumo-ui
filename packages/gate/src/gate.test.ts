import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeHtml, gradingFor, knownLocales, localeForPath } from "./index.ts";
import { RULES, digitSystem, persianDigitFloor } from "./rules.ts";

const FIXTURES = join(import.meta.dirname, "..", "fixtures");
const read = (name: string) => readFileSync(join(FIXTURES, name), "utf8");

/** The second-locale fixtures. See `fixtures/locales/README.md` for why they are
 *  in a subdirectory rather than beside the one-per-rule poison. */
const LOCALE_FIXTURES = join(FIXTURES, "locales");
const readLocale = (name: string) => readFileSync(join(LOCALE_FIXTURES, name), "utf8");

/**
 * The gate's self-test.
 *
 * A rule that silently stops detecting is worse than a missing rule, because it
 * is trusted. So every rule must (a) reject its own poison fixture and (b)
 * accept the good one — and the suite asserts that every rule HAS a fixture, so
 * adding a rule without a poison file fails the build rather than shipping
 * ungraded.
 */
describe("self-test — every rule rejects its poison", () => {
  const cases = readdirSync(FIXTURES).filter((f) => f.endsWith(".bad.html"));

  it("there is one poison fixture per rule, and no orphans", () => {
    const covered = cases.map((f) => f.replace(".bad.html", "")).sort();
    const expected = [...RULES.map((r) => r.id), "persian-digit-floor"].sort();
    expect(covered).toEqual(expected);
  });

  for (const file of cases.filter((f) => !f.startsWith("persian-digit-floor"))) {
    const ruleId = file.replace(".bad.html", "");
    it(`${ruleId} fires on its poison`, () => {
      const v = gradeHtml("fa-IR/index.html", read(file));
      expect(v.map((x) => x.rule)).toContain(ruleId);
    });
  }

  it("persian-digit-floor fires when a page renders no Persian digits", () => {
    const rule = persianDigitFloor({ "fa-IR/index.html": 20 });
    const v = gradeHtml("fa-IR/index.html", read("persian-digit-floor.bad.html"), [rule]);
    expect(v).toHaveLength(1);
    expect(v[0]?.detail).toMatch(/expected at least 20/);
  });

  it("the good fixture passes every rule", () => {
    expect(gradeHtml("fa-IR/index.html", read("good.html"))).toEqual([]);
  });

  it("the good fixture clears the digit floor too", () => {
    const rule = persianDigitFloor({ "fa-IR/index.html": 10 });
    expect(gradeHtml("fa-IR/index.html", read("good.html"), [rule])).toEqual([]);
  });
});

describe("locale derivation refuses to skip", () => {
  it("derives locale and direction from the path", () => {
    expect(localeForPath("fa-IR/admin/index.html")).toEqual({ locale: "fa-IR", direction: "rtl" });
    expect(localeForPath("fa/admin/index.html")).toEqual({ locale: "fa-IR", direction: "rtl" });
    expect(localeForPath("en-US/index.html")).toEqual({ locale: "en-US", direction: "ltr" });
  });

  it("THROWS on an unrecognised route rather than skipping it", () => {
    // Silently skipping is how a gate grades 3 pages of 55 and reports green.
    expect(() => localeForPath("about/index.html")).toThrow(/Cannot derive a locale/);
  });
});

describe("rules do not fire where they should not", () => {
  it("Latin digits are allowed on an English route", () => {
    const html = read("no-latin-digits.bad.html").replace('lang="fa-IR" dir="rtl"', 'lang="en-US" dir="ltr"');
    const v = gradeHtml("en-US/index.html", html);
    expect(v.filter((x) => x.rule === "no-latin-digits")).toEqual([]);
  });

  it("a data-lumo-latn subtree is a sanctioned escape hatch", () => {
    // Order IDs and model numbers are genuinely Latin and must stay Latin.
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <span data-lumo-latn dir="ltr">KH-4825</span></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html)).toEqual([]);
  });

  it("each poison fires its own rule and nothing unexplained", () => {
    // One implication is real and worth stating rather than designing around:
    // a dangling aria-labelledby means the control genuinely HAS no accessible
    // name, so resolved-idrefs necessarily drags named-controls with it. Any
    // other co-firing means a fixture is testing more than one thing and the
    // suite has stopped isolating defects.
    const IMPLIES: Record<string, string[]> = { "resolved-idrefs": ["named-controls"] };

    for (const file of readdirSync(FIXTURES).filter((f) => f.endsWith(".bad.html") && !f.startsWith("persian-digit"))) {
      const ruleId = file.replace(".bad.html", "");
      const fired = [...new Set(gradeHtml("fa-IR/index.html", read(file)).map((v) => v.rule))].sort();
      const allowed = [ruleId, ...(IMPLIES[ruleId] ?? [])].sort();
      expect(fired, `${file} fired unexpected rules`).toEqual(allowed);
    }
  });
});

/**
 * The digit rules are PARAMETRISED, and this block is the proof.
 *
 * They used to grep a literal Persian range. That is correct for `fa-IR` and
 * silently wrong for every other locale that does not number in Latin — Arabic
 * numbers nine code points lower, so a flawless Arabic page scored zero native
 * digits and could not meet any floor. The failure was invisible because the
 * only non-Latin locale in the repo was the one the range was written for.
 *
 * A parametrisation with one instantiation is indistinguishable from a hardwire,
 * so these grade a SECOND locale through the same rules — and the crossed pair
 * (Arabic prose in Persian digits, Persian prose in Arabic-Indic digits) is what
 * distinguishes "reads Doc.digits" from "widened to any Arabic-script digit",
 * which would be the vacuous version of the rule.
 */
describe("the digit rules read the locale, not a hardwired range", () => {
  it("every locale the gate claims to grade has a fixture proving it does", () => {
    // Without this, adding a locale to KNOWN would ship an untested claim —
    // the same hole as a rule with no poison fixture, one table entry later.
    const files = readdirSync(LOCALE_FIXTURES);
    for (const locale of knownLocales()) {
      if (gradingFor(locale).digits.numberingSystem === "latn") continue;
      expect(
        files.some((f) => f.startsWith(`${locale}.`)),
        `${locale} is in KNOWN with a non-Latin numbering system but fixtures/locales/ has nothing for it`,
      ).toBe(true);
    }
  });

  it("derives the ten digits from the zero, contiguously", () => {
    expect(digitSystem("Persian", "arabext", "۰").pattern.source).toBe("[۰-۹]");
    expect(digitSystem("Arabic-Indic", "arab", "٠").pattern.source).toBe("[٠-٩]");
    expect(digitSystem("Latin", "latn", "0").pattern.source).toBe("[0-9]");
  });

  it("grades an Arabic route with Arabic-Indic digits", () => {
    expect(gradingFor("ar-SA")).toMatchObject({ direction: "rtl" });
    expect(gradingFor("ar-SA").digits.numberingSystem).toBe("arab");
    expect(localeForPath("ar-SA/index.html")).toEqual({ locale: "ar-SA", direction: "rtl" });
  });

  it("refuses a locale it has no grading rules for", () => {
    // Defaulting would grade a page against some other locale's digits, which
    // is a wrong answer wearing a green tick.
    expect(() => gradingFor("de-DE")).toThrow(/No grading rules for locale/);
  });

  it("the Arabic good fixture passes every rule, and clears an Arabic floor", () => {
    expect(gradeHtml("ar-SA/index.html", readLocale("ar-SA.good.html"))).toEqual([]);
    const rule = persianDigitFloor({ "ar-SA/index.html": 10 });
    expect(gradeHtml("ar-SA/index.html", readLocale("ar-SA.good.html"), [rule])).toEqual([]);
  });

  it("no-latin-digits fires on an Arabic page — it is not Persian-only", () => {
    const v = gradeHtml("ar-SA/index.html", readLocale("ar-SA.latin-digits.bad.html"));
    expect(v.map((x) => x.rule)).toContain("no-latin-digits");
  });

  it("Persian digits on an Arabic page: no Latin to catch, but the floor fails", () => {
    const html = readLocale("ar-SA.persian-digits.bad.html");
    expect(gradeHtml("ar-SA/index.html", html).filter((x) => x.rule === "no-latin-digits")).toEqual([]);

    const rule = persianDigitFloor({ "ar-SA/index.html": 10 });
    const v = gradeHtml("ar-SA/index.html", html, [rule]);
    expect(v).toHaveLength(1);
    // Found ZERO: the ranges do not overlap, which is the entire point.
    expect(v[0]?.detail).toBe("expected at least 10 Arabic-Indic digits, found 0");
  });

  it("Arabic-Indic digits on a Persian page fail the Persian floor", () => {
    // The mirror of the test above, and the one that matters most: it proves the
    // Persian floor was parametrised rather than loosened to accept any
    // Arabic-script digit. A widened floor would pass this page.
    const rule = persianDigitFloor({ "fa-IR/index.html": 10 });
    const v = gradeHtml("fa-IR/index.html", readLocale("fa-IR.arabic-indic-digits.bad.html"), [rule]);
    expect(v).toHaveLength(1);
    expect(v[0]?.detail).toBe("expected at least 10 Persian digits, found 0");
  });
});

/**
 * fa-IR grading is BIT-FOR-BIT what it was before the parametrisation.
 *
 * The tests above prove the new capability; these pin the old one. The floor's
 * message is asserted character for character because `gate.floors.json` and the
 * docs quote that wording, and because "Persian" surviving in the message is the
 * observable signal that `fa-IR` still resolves to the same digit set — the
 * rule id, the range and the sentence are all unchanged.
 */
describe("fa-IR grading is unchanged by the parametrisation", () => {
  it("resolves to the same direction and the same range as the old literal", () => {
    const { direction, digits } = gradingFor("fa-IR");
    expect(direction).toBe("rtl");
    expect(digits.name).toBe("Persian");
    expect(digits.pattern.source).toBe("[۰-۹]");
    expect([...digits.pattern.source].map((c) => c.codePointAt(0))).toEqual([
      0x5b, 0x6f0, 0x2d, 0x6f9, 0x5d,
    ]);
  });

  it("still emits the exact violation the floor has always emitted", () => {
    const rule = persianDigitFloor({ "fa-IR/index.html": 20 });
    expect(gradeHtml("fa-IR/index.html", read("persian-digit-floor.bad.html"), [rule])).toEqual([
      {
        rule: "persian-digit-floor",
        path: "fa-IR/index.html",
        detail: "expected at least 20 Persian digits, found 4",
      },
    ]);
  });

  it("keeps the rule ids the floors file and the docs name", () => {
    // Renaming an id is how a rule silently stops being the one anybody wired
    // up: gate.floors.json, DECISIONS.md and the CI status check all quote these.
    expect(RULES.map((r) => r.id)).toEqual([
      "lang-dir",
      "no-latin-digits",
      "no-latin-aria",
      "named-controls",
      "resolved-idrefs",
      "composite-tab-stop",
    ]);
    expect(persianDigitFloor({}).id).toBe("persian-digit-floor");
  });

  it("still allows Latin digits on the English route, now by numbering system", () => {
    // The skip used to be `direction !== "rtl"`. en-US is ltr AND latn, so the
    // two spellings select identically here — this asserts the outcome, not the
    // mechanism, so it stays true whichever way the question is asked.
    const html = read("no-latin-digits.bad.html").replace('lang="fa-IR" dir="rtl"', 'lang="en-US" dir="ltr"');
    expect(gradeHtml("en-US/index.html", html).filter((x) => x.rule === "no-latin-digits")).toEqual([]);
    expect(gradingFor("en-US").digits.numberingSystem).toBe("latn");
  });
});
