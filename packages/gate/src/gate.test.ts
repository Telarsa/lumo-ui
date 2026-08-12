import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeHtml, gradingFor, knownLocales, localeForPath } from "./index.ts";
import { RULES, compositeSingleTabStop, digitSystem, nativeCalendar, persianDigitFloor, resolvedIdrefs } from "./rules.ts";

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

  /*
   * The `aria-describedby` half of resolved-idrefs, pinned from both sides.
   *
   * The rule used to skip the attribute entirely, because React Aria's server
   * render dangles it by design. Measured on the 442-document export of this
   * branch, ALL 301 dangling describedby references carried a `react-aria-` id
   * and none came from Base UI or Lumo — so the exclusion narrowed from the
   * attribute to that id prefix.
   *
   * Both directions need a test or the narrowing is reversible by accident:
   * without the first, someone restores the wholesale exclusion and the gate
   * silently stops grading the attribute `form-state.tsx` routes every
   * validation error through; without the second, someone deletes the exemption
   * early and 301 documents go red for a defect that is not there.
   */
  it("grades a dangling aria-describedby — a message announced by nobody", () => {
    const html =
      '<!doctype html><html lang="fa-IR" dir="rtl"><body>' +
      '<label id="l">ایمیل</label>' +
      '<input aria-labelledby="l" aria-describedby="gone" aria-invalid="true" />' +
      "</body></html>";
    const v = gradeHtml("fa-IR/index.html", html, [resolvedIdrefs]);
    expect(v).toHaveLength(1);
    expect(v[0]?.detail).toMatch(/aria-describedby points at missing id "gone"/);
  });

  it("exempts React Aria's hydration-deferred ids, until the last one is gone", () => {
    const html =
      '<!doctype html><html lang="fa-IR" dir="rtl"><body>' +
      '<label id="l">ایمیل</label>' +
      '<input aria-labelledby="l" aria-describedby="react-aria-_R_1abc_" />' +
      "</body></html>";
    expect(gradeHtml("fa-IR/index.html", html, [resolvedIdrefs])).toEqual([]);
  });

  /*
   * native-calendar, from both sides.
   *
   * The poison above proves it fires. These two prove it is not merely
   * pattern-matching Persian words: the SAME date written in the calendar Iran
   * actually uses must pass, and a Gregorian month on an ENGLISH page must pass
   * too — `en-US` readers count in `gregory`, so there is nothing to catch and
   * the rule returns early rather than inventing a check.
   */
  it("accepts the same date written in the reader's own calendar", () => {
    const html =
      '<!doctype html><html lang="fa-IR" dir="rtl"><body><p>۱ مرداد ۱۴۰۳</p></body></html>';
    expect(gradeHtml("fa-IR/index.html", html, [nativeCalendar])).toEqual([]);
  });

  it("is vacuous on a Gregorian locale rather than pretending to grade it", () => {
    const html = '<!doctype html><html lang="en-US" dir="ltr"><body><p>22 July 2024</p></body></html>';
    expect(gradeHtml("en-US/index.html", html, [nativeCalendar])).toEqual([]);
  });

  it("grades ARABIC against its own calendar, not Persian's", () => {
    // The parametrisation, proven with a second locale — a rule with one
    // instantiation is indistinguishable from a hardwire. `ar-SA` counts in
    // islamic-umalqura, and this is the ICU default that is NOT its own
    // calendar, so the defect is live here in a way it is not for fa-IR.
    const bad = '<!doctype html><html lang="ar-SA" dir="rtl"><body><p>٢٢ يوليو ٢٠٢٤</p></body></html>';
    const good = '<!doctype html><html lang="ar-SA" dir="rtl"><body><p>١٦ محرم ١٤٤٦</p></body></html>';
    expect(gradeHtml("ar-SA/index.html", bad, [nativeCalendar])).toHaveLength(1);
    expect(gradeHtml("ar-SA/index.html", good, [nativeCalendar])).toEqual([]);
  });

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

  /*
   * THE COLLECTION-AS-TAB-STOP EXEMPTION.
   *
   * Inline rather than a `composite-tab-stop-clean.bad.html`: the loop above
   * generates a "fires on its poison" test per `*.bad.html` and asserts the
   * fixture basenames equal the rule-id list exactly, so a second file for the
   * same rule fails the no-orphans assertion.
   *
   * React Aria's collections serve `role="listbox" tabindex="0"` with every
   * option at `-1`, and marshal focus into the first option on entry. That IS
   * a tab stop. The rule reported four of these as unreachable widgets before
   * the exemption existed.
   */
  it("a composite whose CONTAINER is the tab stop is not a violation", () => {
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <div role="listbox" aria-label="شهرها" tabindex="0">
        <div role="option" tabindex="-1">تهران</div>
        <div role="option" tabindex="-1">شیراز</div>
      </div><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html)).toEqual([]);
  });

  /*
   * THE ANTI-VACUITY GUARD for the exemption above. Without this, widening
   * `=== "0"` to `hasAttribute("tabindex")` — which looks like a tidy-up —
   * would silently swallow the eight autocomplete/command containers, which
   * sit at `tabindex="-1"` and ARE genuinely unreachable in the served bytes.
   */
  it("a container at tabindex=-1 with no tabbable option still fires", () => {
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <div role="listbox" aria-label="شهرها" tabindex="-1">
        <div role="option" tabindex="-1">تهران</div>
      </div><p>۱۲۳</p></body></html>`;
    const fired = gradeHtml("fa-IR/index.html", html).map((v) => v.rule);
    expect(fired).toContain("composite-tab-stop");
  });

  /*
   * THE THREE GRID SHAPES, added on 12 Aug 2026 — and their anti-vacuity twins.
   *
   * `grid` and `treegrid` were absent from `COMPOSITE_ROLES` until three
   * components (`tree`, `event-calendar`, `gantt`) each shipped a header saying
   * their shape was right because it had been MEASURED, not because this rule
   * would have caught them. A rule entry that never fires is worse than no
   * entry, so each of the three gets a poison twin here rather than only a
   * clean case.
   *
   * `treegrid` maps to `row` and not to `treeitem`: ARIA names the two
   * container roles differently and it is the ROW that takes focus, which is
   * exactly why `tree: "treeitem"` did not cover `tree.tsx` after its
   * migration.
   */
  it("a treegrid whose rows are all -1 is a violation", () => {
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <div role="treegrid" aria-label="پرونده‌ها">
        <div role="row" tabindex="-1" aria-level="1"><span role="gridcell">اسناد</span></div>
        <div role="row" tabindex="-1" aria-level="1"><span role="gridcell">تصویرها</span></div>
      </div><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html).map((x) => x.rule)).toContain(
      "composite-tab-stop",
    );
  });

  it("a grid whose cells are all -1 is a violation", () => {
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <div role="grid" aria-label="مرداد">
        <div role="row"><span role="gridcell" tabindex="-1">۱</span></div>
        <div role="row"><span role="gridcell" tabindex="-1">۲</span></div>
      </div><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html).map((x) => x.rule)).toContain(
      "composite-tab-stop",
    );
  });

  it("but a grid whose CONTAINER holds the stop is clean — the shape all three ship", () => {
    // `tree.tsx`, `event-calendar.tsx` and `gantt.tsx` all compute
    // `tabIndex={entered ? -1 : 0}` on the container in the render body, so the
    // stop is in the served bytes with no effect to wait for. If this went red,
    // every one of them would be failing a rule they were built to satisfy.
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <div role="grid" aria-label="مرداد" tabindex="0">
        <div role="row"><span role="gridcell" tabindex="-1">۱</span></div>
      </div><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html)).toEqual([]);
  });

  it("a grid using WIDGET focus — the stop inside the cell — is clean", () => {
    /*
     * react-day-picker's shape, measured on a served calendar: the cells are
     * not tabbable and each holds a button, 41 at -1 and one at 0. ARIA
     * specifies both cell focus and widget focus; a rule that knew only the
     * first reported every calendar in the library as unreachable.
     */
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <table role="grid" aria-label="مرداد"><tbody>
        <tr><td role="gridcell"><button tabindex="0">۱</button></td>
            <td role="gridcell"><button tabindex="-1">۲</button></td></tr>
      </tbody></table><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html)).toEqual([]);
  });

  it("but widget focus with EVERY control at -1 still fires", () => {
    // The anti-vacuity twin for the widening above: reaching inside the cell
    // must not become "any cell with a control in it passes".
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <table role="grid" aria-label="مرداد"><tbody>
        <tr><td role="gridcell"><button tabindex="-1">۱</button></td>
            <td role="gridcell"><button tabindex="-1">۲</button></td></tr>
      </tbody></table><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html).map((x) => x.rule)).toContain(
      "composite-tab-stop",
    );
  });

  it("a fully DISABLED grid has nothing to focus, and that is not a violation", () => {
    /*
     * `<Calendar isDisabled>` serves 42 cells that are not themselves disabled,
     * each holding a `<button disabled>` at -1. Having no tab stop is correct —
     * there is nothing to focus. Judging the cell alone called that unreachable.
     */
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <table role="grid" aria-label="مرداد"><tbody>
        <tr><td role="gridcell"><button disabled tabindex="-1">۱</button></td>
            <td role="gridcell"><button disabled tabindex="-1">۲</button></td></tr>
      </tbody></table><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html)).toEqual([]);
  });

  it("one ENABLED control among disabled ones still demands a stop", () => {
    // The anti-vacuity twin: "some control is disabled" must not become
    // "the widget is exempt".
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>
      <table role="grid" aria-label="مرداد"><tbody>
        <tr><td role="gridcell"><button disabled tabindex="-1">۱</button></td>
            <td role="gridcell"><button tabindex="-1">۲</button></td></tr>
      </tbody></table><p>۱۲۳</p></body></html>`;
    expect(gradeHtml("fa-IR/index.html", html).map((x) => x.rule)).toContain(
      "composite-tab-stop",
    );
  });

  /*
   * THE COMBOBOX EXEMPTION, and the three ways it must NOT apply.
   *
   * In the combobox pattern focus never enters the list: it stays on the input,
   * the options are correctly -1, and the input names the active one. That is
   * one Tab from the outside — the input's.
   *
   * The three negative cases below are the ones that matter, because each is a
   * plausible loosening someone would make while "simplifying" this.
   */
  const combobox = (input: string, listAttrs = 'id="lumo-list"') => `<!doctype html>
    <html lang="fa-IR" dir="rtl"><body>
      <input role="combobox" aria-label="جست‌وجو" aria-expanded="true" ${input} />
      <div role="listbox" aria-label="نتیجه‌ها" tabindex="-1" ${listAttrs}>
        <div role="option" tabindex="-1">تهران</div>
      </div><p>۱۲۳</p></body></html>`;

  const composite = (html: string) =>
    gradeHtml("fa-IR/index.html", html)
      .map((v) => v.rule)
      .filter((r) => r === "composite-tab-stop");

  it("a listbox controlled by a tabbable combobox is not a violation", () => {
    expect(composite(combobox('aria-controls="lumo-list"'))).toEqual([]);
  });

  it("still fires when the combobox names no list at all", () => {
    // The adjacency heuristic this replaced would have excused this one: a
    // combobox is right there, sharing a parent. Nothing points at the list.
    expect(composite(combobox(""))).toEqual(["composite-tab-stop"]);
  });

  it("still fires when the combobox points somewhere else", () => {
    expect(composite(combobox('aria-controls="a-different-list"'))).toEqual([
      "composite-tab-stop",
    ]);
  });

  it("still fires when the combobox itself cannot be reached", () => {
    // A disabled input is not a tab stop, so the list behind it is exactly as
    // unreachable as it looks.
    expect(composite(combobox('aria-controls="lumo-list" disabled'))).toEqual([
      "composite-tab-stop",
    ]);
    expect(composite(combobox('aria-controls="lumo-list" tabindex="-1"'))).toEqual([
      "composite-tab-stop",
    ]);
  });

  it("reads aria-controls as the token LIST it is", () => {
    // One input may control a list and a grid. An exact-match comparison fails
    // that silently, which is the quietest kind of wrong.
    expect(composite(combobox('aria-controls="some-grid lumo-list"'))).toEqual([]);
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
      "composite-single-tab-stop",
      "native-calendar",
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

/**
 * The CEILING, and its one exemption from both sides.
 *
 * `composite-tab-stop` fires when a widget has NO stop; this one fires when it
 * has more than one. The pair is the whole contract, and the two poison
 * fixtures are inverses of each other — `composite-tab-stop.bad.html` is a
 * tablist with zero, `composite-single-tab-stop.bad.html` a toolbar with three.
 * The "each poison fires its own rule and nothing unexplained" block above is
 * what stops either from quietly grading the other's file.
 *
 * DECISIONS §13's rule applies to the exemption below: it carries negative
 * twins, or the next tidy-up widens it into a skip.
 */
const ceiling = (body: string) =>
  gradeHtml("fa-IR/index.html", `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`, [
    compositeSingleTabStop,
  ]);

describe("composite-single-tab-stop — the ceiling", () => {
  it("passes a toolbar with exactly one stop", () => {
    expect(
      ceiling(
        '<div role="toolbar" aria-label="ابزار">' +
          '<button tabindex="0">الف</button><button tabindex="-1">ب</button></div>',
      ),
    ).toEqual([]);
  });

  it("passes a container that IS the stop — activedescendant and the RAC collection", () => {
    // Both of `composite-tab-stop`'s first two exemptions are one stop, and the
    // ceiling must agree with the floor about that or the two rules disagree
    // about the same correct markup.
    expect(
      ceiling(
        '<div role="listbox" tabindex="0" aria-activedescendant="o1" aria-label="شهرها">' +
          '<div role="option" id="o1" tabindex="-1">تهران</div>' +
          '<div role="option" tabindex="-1">شیراز</div></div>',
      ),
    ).toEqual([]);
  });

  it("counts a natively-focusable control with NO tabindex", () => {
    // The half of the defect that does not self-heal. A `<button>` with no
    // tabindex is tabbable forever, not until hydration — which is what made
    // the toolbar demo and the grid's resize handle permanent extra stops.
    const v = ceiling(
      '<div role="toolbar" aria-label="ابزار">' +
        '<button tabindex="0">الف</button><button aria-label="ب">ب</button></div>',
    );
    expect(v).toHaveLength(1);
    expect(v[0]!.detail).toContain("serves 2 tab stops");
  });

  it("does not count a disabled control", () => {
    expect(
      ceiling(
        '<div role="toolbar" aria-label="ابزار">' +
          '<button tabindex="0">الف</button><button disabled>ب</button>' +
          '<button aria-disabled="true">پ</button></div>',
      ),
    ).toEqual([]);
  });

  it("does not count an `inert` subtree, and DOES count an aria-hidden one", () => {
    // `inert` removes an element from sequential navigation; `aria-hidden` does
    // not — it removes it from the accessibility tree while leaving the Tab key
    // landing on it, which is axe's own `aria-hidden-focus` rule. Discounting
    // the second would hide a stop a reader really reaches.
    expect(
      ceiling(
        '<div role="toolbar" aria-label="ابزار"><button tabindex="0">الف</button>' +
          '<span inert><button>ب</button></span></div>',
      ),
    ).toEqual([]);
    expect(
      ceiling(
        '<div role="toolbar" aria-label="ابزار"><button tabindex="0">الف</button>' +
          '<span aria-hidden="true"><button>ب</button></span></div>',
      ),
    ).toHaveLength(1);
  });

  it("skips a container that is itself hidden", () => {
    expect(
      ceiling(
        '<div hidden><div role="toolbar" aria-label="ابزار">' +
          '<button tabindex="0">الف</button><button tabindex="0">ب</button></div></div>',
      ),
    ).toEqual([]);
  });

  /* ── THE EXEMPTION, AND ITS NEGATIVE TWINS ──────────────────────────────── */

  it("discounts a control marked data-lumo-extra-tab-stop", () => {
    // The one use in the repository: `RegistrationExample` demonstrates the
    // defect this rule grades, and its third control is the demonstration.
    expect(
      ceiling(
        '<div role="toolbar" aria-label="ابزار"><button tabindex="0">الف</button>' +
          '<button data-lumo-extra-tab-stop aria-label="ب">ب</button></div>',
      ),
    ).toEqual([]);
  });

  it("discounts ONE control, not the container", () => {
    // The narrowing that matters. A marked control next to a SECOND unmarked
    // extra stop still fails — the attribute buys one stop, not silence.
    const v = ceiling(
      '<div role="toolbar" aria-label="ابزار"><button tabindex="0">الف</button>' +
        '<button data-lumo-extra-tab-stop aria-label="ب">ب</button>' +
        '<button aria-label="پ">پ</button></div>',
    );
    expect(v).toHaveLength(1);
    expect(v[0]!.detail).toContain("serves 2 tab stops");
  });

  it("does NOT let the attribute on the container excuse its children", () => {
    // The weakening this exemption is deliberately not. `closest` from a
    // descendant would match the container, so one attribute on the toolbar
    // would silence the whole widget — DECISIONS §13's "blindness by adjacency"
    // in a different spelling. The rule excludes the container from the match.
    const v = ceiling(
      '<div role="toolbar" data-lumo-extra-tab-stop aria-label="ابزار">' +
        '<button tabindex="0">الف</button><button tabindex="0">ب</button></div>',
    );
    expect(v).toHaveLength(1);
    expect(v[0]!.detail).toContain("serves 2 tab stops");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// THE RULE THAT IS ARMED BY AN ARGUMENT, NOT BY THE ARRAY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * `persian-digit-floor` is deliberately NOT in `RULES` — it needs per-route
 * floors, so `cli.ts` constructs it only when handed a floors file. That design
 * is right, and it has now un-armed the rule TWICE by two different routes.
 *
 * The first time is memorialised in `cli.ts`'s own header: the rule had "a
 * factory, a poison fixture, a passing self-test, a README paragraph … and was
 * never in the RULES array this CLI runs."
 *
 * The second time is what this test exists for. The arming moved out of the
 * array and into an ARGUMENT — and the argument was missing from `gate:html`,
 * which is the only gate command `verify` and CI actually run. The floors file
 * was passed by `apps/website`'s own `gate` script, which nothing invokes. So
 * the rule was fully built, fully tested, documented, and grading nothing.
 *
 * Measured at the time: the real landing page with every Persian digit replaced
 * by an en-dash — the exact defect the rule exists for — graded CLEAN, exit 0.
 *
 * Every other rule is protected from this by being in `RULES`, which the
 * one-fixture-per-rule test enumerates. This one cannot be, so it is protected
 * by reading the script that has to arm it. A string assertion on a package
 * manifest is a blunt instrument; it is also the only thing standing between
 * this rule and a third disappearance.
 */
describe("persian-digit-floor is actually armed where it matters", () => {
  const root = JSON.parse(
    readFileSync(join(import.meta.dirname, "..", "..", "..", "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };

  it("gate:html passes a floors file", () => {
    const script = root.scripts["gate:html"] ?? "";
    expect(script, "gate:html does not exist").not.toBe("");
    // Not a path equality check: the point is that SOME floors argument reaches
    // the CLI, because `cli.ts` builds the rule from `argv[3]` and from nothing
    // else. A renamed floors file should not fail this test; a missing argument
    // must.
    expect(script, "gate:html runs the CLI with no floors argument, so the rule is not constructed").toMatch(
      /cli\.ts\s+\S+\s+\S*floors\S*\.json/,
    );
  });

  it("is the rule that verify depends on, and it is still absent from RULES", () => {
    // Both halves of the design, pinned. If someone "fixes" the arming by
    // pushing it into RULES, the rule would run with no floors on every
    // document and the fixture suite would go red — this states why it is out.
    expect(RULES.map((r) => r.id)).not.toContain("persian-digit-floor");
    expect(persianDigitFloor({ "fa/index.html": 1 }).id).toBe("persian-digit-floor");
  });
});
