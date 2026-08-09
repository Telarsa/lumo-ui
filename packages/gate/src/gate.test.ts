import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeHtml, localeForPath } from "./index.ts";
import { RULES, persianDigitFloor } from "./rules.ts";

const FIXTURES = join(import.meta.dirname, "..", "fixtures");
const read = (name: string) => readFileSync(join(FIXTURES, name), "utf8");

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
