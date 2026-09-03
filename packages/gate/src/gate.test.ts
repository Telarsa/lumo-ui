import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addCoverage, EMPTY_COVERAGE, exceedsExemptCeiling, formatCoverage, gradeHtml, gradingFor, knownLocales, localeForPath } from "./index.ts";
import { RULES, compositeSingleTabStop, digitSystem, nativeCalendar, noLatinDigits, persianDigitFloor, resolvedIdrefs } from "./rules.ts";
import { missingDenseDigitFloors } from "./index.ts";

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
describe("native-calendar sees the month forms real formatters emit", () => {
  /*
   * The rule built its foreign-month list from `{month:"long"}` — the
   * STANDALONE form. No page renders a month standalone; a page renders a DATE,
   * and neither of the two ways a Persian page gets a Gregorian one produces
   * that form.
   *
   *   `Intl.DateTimeFormat("fa-IR-u-ca-gregory",{dateStyle:"long"})` on 22 July
   *   gives «۲۲ ژوئیهٔ ۲۰۲۴» — «ژوئیه» plus U+0654, a \p{M}, which
   *   `datePattern`'s trailing boundary refused to match. 4 of 12 months.
   *
   *   `react-day-picker@10.0.1`'s fa-IR locale — which is what shadcn's
   *   Calendar uses — transliterates differently: «جولای», not «ژوئیه».
   *   5 of 12 months.
   *
   * July is in both sets, and «۲۲ ژوئیه ۲۰۲۴» is the string in this rule's own
   * `because` and its poison fixture, under a comment claiming to be "exactly
   * what react-day-picker produces". It is the one spelling of July neither
   * real generator emits.
   */
  const doc = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const fires = (text: string) =>
    gradeHtml("fa-IR/index.html", doc(`<p>${text}</p>`)).some((v) => v.rule === "native-calendar");

  it("catches every month Intl renders inside a formatted date", () => {
    const missed: string[] = [];
    for (let m = 0; m < 12; m += 1) {
      const rendered = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2024, m, 22)));
      if (!fires(rendered)) missed.push(rendered);
    }
    expect(missed, "months that evade the rule in their formatted form").toEqual([]);
  });

  it("catches date-fns's transliterations, which disagree with CLDR", () => {
    // Captured from react-day-picker@10.0.1/locale, not typed from memory.
    for (const name of ["ژانویه", "آپریل", "می", "جون", "جولای", "آگوست", "دسامبر"]) {
      expect(fires(`۲۲ ${name} ۲۰۲۴`), name).toBe(true);
    }
  });

  it("still says nothing about a Jalali date", () => {
    expect(fires("۲۲ مرداد ۱۴۰۳")).toBe(false);
    expect(fires("۹ شهریور ۱۴۰۵ ثبت شد")).toBe(false);
  });

  it("and nothing about the imperfective می, which is also date-fns's May", () => {
    // The one real false-positive risk in the transliteration list. What saves
    // it is `datePattern`'s digit-adjacency class, which admits no letters —
    // so «می» next to a digit is a date and «می» next to a verb is not.
    for (const sentence of [
      "این کار ۳ بار تکرار می شود",
      "قیمت ۱۲۰۰ تومان می باشد",
      "۵ نفر می آیند",
    ]) {
      expect(fires(sentence), sentence).toBe(false);
    }
  });
});

describe("a native digit is not evidence that a translator has been here", () => {
  /*
   * Persian and Arabic-Indic digits carry `Script=Arabic`, so
   * `/\p{Script=Arabic}/u.test("۲")` is TRUE — and the three language rules each
   * read that as "the reader's script is present, leave this string alone".
   *
   * The hole was in the exact state these rules exist to catch: half-translated
   * UI. Someone runs the numbers through `formatNumber` and leaves the words in
   * English, and «Page ۲ of ۱۰» becomes invisible to all thirteen rules.
   *
   * `latn-island-purity` never had this bug — it builds
   * `/(?=\p{L})\p{Script=Latin}/gu` for exactly this reason — so the fix is the
   * rest of the file catching up with one rule inside it.
   */
  const doc = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;

  it("catches English words wearing Persian digits", () => {
    const rules = gradeHtml("fa-IR/index.html", doc("<p>Page ۲ of ۱۰</p>")).map((v) => v.rule);
    expect(rules).toContain("native-script-text");
  });

  it("catches it in an announced string too", () => {
    const rules = gradeHtml(
      "fa-IR/index.html",
      doc('<button aria-label="Next page ۳">›</button>'),
    ).map((v) => v.rule);
    expect(rules).toContain("no-latin-aria");
  });

  it("still spares a Persian phrase carrying a foreign token", () => {
    // The policy this must not break: «دانلود PDF» and «ورود با Google» belong
    // to a translator's judgement, not to a rule. They contain Persian LETTERS.
    expect(gradeHtml("fa-IR/index.html", doc("<p>دانلود PDF</p><p>ورود با Google</p>"))).toEqual([]);
  });

  it("and spares Persian prose with Persian digits", () => {
    expect(gradeHtml("fa-IR/index.html", doc("<p>صفحهٔ ۲ از ۱۰</p>"))).toEqual([]);
  });
});

describe("named-controls covers the roles ARIA requires a name on", () => {
  /*
   * `INTERACTIVE` had simply never listed `progressbar`, `treeitem`,
   * `menuitemcheckbox`, `menuitemradio` or `toolbar`, so `named-controls` and
   * `native-script-name` both skipped them. Base UI emits all of them.
   *
   * The live instance is in a consumer build: `<div role="progressbar"
   * aria-valuetext="۲۵٪">` with no name, so a reader hears «۲۵٪» and never what
   * is at 25%. Adding the roles took that corpus from 6 violations to 7 and
   * changed nothing on the other 166 documents graded.
   */
  const doc = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const rules = (html: string) => gradeHtml("fa-IR/index.html", doc(html)).map((v) => v.rule);

  it("an unnamed progressbar announces a number and nothing else", () => {
    expect(rules('<div role="progressbar" aria-valuenow="25" aria-valuetext="۲۵٪"></div>'))
      .toContain("named-controls");
  });

  it("…and a named one passes", () => {
    expect(rules('<div role="progressbar" aria-label="پیشرفت" aria-valuenow="25"></div>'))
      .not.toContain("named-controls");
  });

  it("the menu item variants are covered, not just the plain one", () => {
    for (const role of ["menuitemcheckbox", "menuitemradio", "treeitem"]) {
      expect(rules(`<div role="${role}"></div>`), role).toContain("named-controls");
    }
  });
});

describe("composite-tab-stop sees the elements that carry item roles implicitly", () => {
  /*
   * Nobody writes `<button role="button">` or `<td role="gridcell">`. The item
   * selector was built purely from `[role="…"]`, so for canonical markup the
   * toolbar, grid and treegrid containers matched NO items — and
   * `if (items.length === 0) continue` then passed them in silence.
   *
   * Measured on real Radix SSR output: a `<div role="toolbar">` holding three
   * `<button type="button" tabindex="-1">`, with zero keyboard entry points,
   * graded clean. The ceiling rule beside it already saw those buttons, because
   * it asks `isTabbable` rather than matching a role — so the floor and the
   * ceiling disagreed about the same elements.
   *
   * Both directions: unreachable must fail, reachable must stay silent, or the
   * fix trades a false negative for a false positive.
   */
  const doc = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const composite = (html: string) =>
    gradeHtml("fa-IR/index.html", doc(html))
      .map((v) => v.rule)
      .filter((r) => r.startsWith("composite"));

  it("catches a toolbar of native buttons that no key can reach", () => {
    expect(
      composite('<div role="toolbar"><button type="button" tabindex="-1">پررنگ</button>' +
        '<button type="button" tabindex="-1">کج</button></div>'),
    ).toContain("composite-tab-stop");
  });

  it("catches native grid cells and treegrid rows", () => {
    expect(composite('<table role="grid"><tr><td tabindex="-1">۱</td><td tabindex="-1">۲</td></tr></table>'))
      .toContain("composite-tab-stop");
    expect(composite('<table role="treegrid"><tr tabindex="-1"><td>۱</td></tr><tr tabindex="-1"><td>۲</td></tr></table>'))
      .toContain("composite-tab-stop");
  });

  it("stays silent when one member IS reachable", () => {
    expect(
      composite('<div role="toolbar"><button type="button" tabindex="0">پررنگ</button>' +
        '<button type="button" tabindex="-1">کج</button></div>'),
    ).toEqual([]);
  });

  it("an explicit role still wins over the implicit one", () => {
    // `:not([role])` is what keeps the two from double-counting, and an author
    // who relabels a `<td>` deserves to be graded on what they wrote.
    expect(
      composite('<table role="grid"><tr><td role="presentation">x</td>' +
        '<td role="gridcell" tabindex="-1">۱</td></tr></table>'),
    ).toContain("composite-tab-stop");
  });
});

describe("the exemption has a ceiling, because it is the one thing that silences the gate", () => {
  /*
   * THE MEASUREMENT THAT JUSTIFIES THIS, taken before the check was written.
   *
   * A Persian page carrying ten real violations drops to ONE when a single
   * `data-lumo-latn` is placed on a wrapper around it. Nine silenced by one
   * attribute — and `latn-island-purity` says nothing, correctly: it fails an
   * island hiding READER-SCRIPT prose, and this island hides LATIN defects,
   * which is exactly what the other rules exist to find.
   *
   * That is the same vacuity `persian-digit-floor` was built for — "zero Latin
   * digits" passes trivially on a page with no numbers — and it gets the same
   * answer: a reviewed per-site baseline, not a threshold in the rule.
   */
  const DEFECTS =
    "<h1>سفارش‌ها</h1>" +
    "<p>Total 42 items</p>" +
    '<button aria-label="Close">×</button>' +
    "<button></button>" +
    "<p>Please contact support</p>" +
    "<table><tr><td>120000 rial</td><td>18 Mordad 1405</td></tr></table>";
  const doc = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;

  it("one attribute silences almost every rule — the reason a ceiling exists", () => {
    const bare = gradeHtml("fa-IR/index.html", doc(DEFECTS));
    const wrapped = gradeHtml(
      "fa-IR/index.html",
      doc(`<div data-lumo-latn dir="ltr">${DEFECTS}</div>`),
    );
    // Measured: ten violations become one. The surviving one is the unnamed
    // button — `named-controls` is not island-aware, and should not be: an
    // island says "this text is Latin on purpose", never "this control needs
    // no name".
    expect(bare.length, "the unwrapped page should be full of defects").toBe(10);
    expect(wrapped.length, "one attribute should silence almost all of them").toBe(1);
    expect(wrapped[0]?.rule).toBe("named-controls");
    // …and purity does NOT object, which is the half that surprises people.
    expect(wrapped.map((v) => v.rule)).not.toContain("latn-island-purity");
  });

  const coverage = (exempt: number, total: number) => ({
    gradedLocaleDocs: 1,
    textNodes: 10,
    exemptTextNodes: 5,
    characters: total,
    exemptCharacters: exempt,
  });

  it("says nothing when no ceiling is committed — the opt-in half", () => {
    // A site that never sets one keeps exactly today's behaviour: the scope
    // line prints and nothing fails. That was a deliberate decision and it
    // stays available.
    expect(exceedsExemptCeiling(coverage(900, 1000), undefined)).toBeUndefined();
  });

  it("passes under the ceiling and fails above it", () => {
    expect(exceedsExemptCeiling(coverage(190, 1000), 24)).toBeUndefined();
    const over = exceedsExemptCeiling(coverage(400, 1000), 24);
    expect(over).toBeDefined();
    expect(over?.fraction).toBe(40);
    expect(over?.ceiling).toBe(24);
  });

  it("compares at the precision the scope line prints", () => {
    // The reported number and the ceiling must be comparable by eye, or the
    // first person to hit it raises the ceiling instead of looking at the page.
    expect(exceedsExemptCeiling(coverage(2404, 10000), 24.1), "24.04% rounds to 24.0").toBeUndefined();
    expect(exceedsExemptCeiling(coverage(2404, 10000), 24), "24.04% rounds to 24.0, not above 24").toBeUndefined();
    expect(exceedsExemptCeiling(coverage(2450, 10000), 24), "24.5% is above 24").toBeDefined();
  });

  it("is inert on a build with no characters to count", () => {
    expect(exceedsExemptCeiling(coverage(0, 0), 0)).toBeUndefined();
  });
});

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

  /*
   * React streaming, pinned from both sides (§50.5).
   *
   * A streamed Next document ships the real page inside `<div hidden id="S:0">`
   * and reveals it on boundary resolution — so `hidden` there means "arriving",
   * not "hidden". Without normalisation, the nine rules that skip
   * `closest('[hidden]')` exempted every announced string in every streamed
   * segment: a live `aria-label="مرحله 1 از ۳"` graded clean on 51 of 51 routes
   * of a real product while the visible-text branch flagged the same string.
   *
   * Both directions, or the normalisation is reversible by accident: without
   * the first test someone restores the blanket skip and product apps go
   * silently ungraded again; without the second someone widens the id match and
   * genuinely hidden UI starts being graded as if a reader could reach it.
   */
  it("grades announced strings inside a React streamed segment (div[hidden][id=S:n])", () => {
    const html =
      '<!doctype html><html lang="fa-IR" dir="rtl"><body>' +
      "<p>۱۴۰۳</p>" +
      '<div hidden id="S:0"><main><div aria-label="مرحله 1 از ۳"><span></span></div></main></div>' +
      "</body></html>";
    const v = gradeHtml("fa-IR/index.html", html);
    expect(v.map((x) => x.rule)).toContain("no-latin-digits");
    expect(v.find((x) => x.detail?.includes("aria-label"))?.detail).toMatch(/مرحله 1/);
  });

  /*
   * `no-latin-aria` joins the same policy, 31 Aug 2026.
   *
   * It skipped NEITHER `aria-hidden` nor `hidden` — the strictest of the
   * thirteen, and inconsistent with the other eight for no reason anyone had
   * written down (§50.5 recorded the divergence and left it open).
   *
   * Both directions, because a RELAXATION is the easier of the two to lose:
   * without the first test the skip creeps back out and hidden UI goes red for
   * a string no reader receives; without the second, someone widens the skip to
   * a subtree that is merely off-screen and English names stop being graded at
   * all. The `.bad.html` fixture covers the plain case; this covers the edge.
   */
  it("no-latin-aria skips hidden subtrees, like the other eight", () => {
    const wrap = (attr: string) =>
      '<!doctype html><html lang="fa-IR" dir="rtl"><body>' +
      `<div ${attr}><button aria-label="Close">×</button></div>` +
      "</body></html>";
    for (const attr of ['aria-hidden="true"', "hidden"]) {
      expect(
        gradeHtml("fa-IR/index.html", wrap(attr)).map((x) => x.rule),
        `no-latin-aria fired inside [${attr}]`,
      ).not.toContain("no-latin-aria");
    }
  });

  it("…and still grades the same name when nothing hides it", () => {
    const html =
      '<!doctype html><html lang="fa-IR" dir="rtl"><body>' +
      '<div><button aria-label="Close">×</button></div>' +
      "</body></html>";
    expect(gradeHtml("fa-IR/index.html", html).map((x) => x.rule)).toContain("no-latin-aria");
  });

  it("still exempts a genuinely hidden subtree — hidden without React's S: id", () => {
    /*
     * Scoped to `noLatinDigits`, the rule whose `[hidden]` skip the
     * normalisation gates — NOT the full set. Scoping is forced by a
     * pre-existing divergence this test found: `no-latin-aria` never skipped
     * `[hidden]` at all, so it fires on the first div here with or without the
     * streaming change. That divergence predates §50.5 and changing its policy
     * is its own decision; this test must not silently take it.
     */
    const html =
      '<!doctype html><html lang="fa-IR" dir="rtl"><body>' +
      "<p>۱۴۰۳</p>" +
      '<div hidden><div aria-label="Step 3 of 4"></div></div>' +
      '<div hidden id="template-cache"><div aria-label="مرحله 1"></div></div>' +
      "</body></html>";
    expect(gradeHtml("fa-IR/index.html", html, [noLatinDigits])).toEqual([]);
  });

  /*
   * lang-dir compares the PRIMARY SUBTAG, pinned from both sides (31 Aug 2026).
   * Widened when a legitimately `lang="en"` site failed on an `en-US` route;
   * the founding defect is a different LANGUAGE and must still fail.
   */
  it("accepts a correct but less specific language tag", () => {
    const html = '<!doctype html><html lang="en" dir="ltr"><body><p>Orders</p></body></html>';
    expect(gradeHtml("en-US/index.html", html, [RULES[0]!])).toEqual([]);
  });

  it("accepts a less specific tag on the Persian route too", () => {
    const html = '<!doctype html><html lang="fa" dir="rtl"><body><p>سفارش‌ها</p></body></html>';
    expect(gradeHtml("fa-IR/index.html", html, [RULES[0]!])).toEqual([]);
  });

  it("STILL fails the founding defect — a different language entirely", () => {
    const html = '<!doctype html><html lang="en" dir="rtl"><body><p>سفارش‌ها</p></body></html>';
    const v = gradeHtml("fa-IR/index.html", html, [RULES[0]!]);
    expect(v).toHaveLength(1);
    expect(v[0]?.detail).toMatch(/<html lang> is "en", expected "fa-IR"/);
  });

  it("still fails a missing lang, and still grades dir exactly", () => {
    const noLang = '<!doctype html><html dir="rtl"><body><p>سفارش‌ها</p></body></html>';
    expect(gradeHtml("fa-IR/index.html", noLang, [RULES[0]!])).toHaveLength(1);
    const wrongDir = '<!doctype html><html lang="fa-IR" dir="ltr"><body><p>سفارش‌ها</p></body></html>';
    expect(gradeHtml("fa-IR/index.html", wrongDir, [RULES[0]!])).toHaveLength(1);
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

  it("a short ROUTE NAME is not a locale just because BCP-47's grammar allows it", () => {
    /*
     * `Intl.getCanonicalLocales` is a SYNTAX check and BCP-47's grammar is
     * wide: every well-formed 2-3 letter subtag passes, assigned or not.
     * One consumer serves `/how`, which canonicalises happily and maximises
     * to the Han script — grading died with `No script known for locale "how"`
     * on a 105-page Persian product. These are route names, not languages, and the
     * gate must say so rather than throw a script error or, worse, grade a
     * Persian page against another script and report green.
     */
    for (const name of ["how", "art", "abc", "zzz"]) {
      expect(() => localeForPath(`${name}/index.html`)).toThrow(/Cannot derive a locale/);
    }
    // Real languages, including ones outside KNOWN, must still resolve.
    expect(localeForPath("de/index.html")).toEqual({ locale: "de", direction: "ltr" });
    expect(localeForPath("ru/index.html")).toEqual({ locale: "ru", direction: "ltr" });
    expect(localeForPath("he/index.html")).toEqual({ locale: "he", direction: "rtl" });
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
      <span data-lumo-latn dir="ltr">AC-4825</span></body></html>`;
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
    /*
     * The second implication, added 12 Aug 2026 with `native-script-name`, and
     * as real as the first: a Latin `aria-label` on an interactive control IS
     * that control's computed accessible name, so the rule that grades the
     * attribute and the rule that grades the name are two true statements about
     * one string. `no-latin-aria.bad.html`'s first line is
     * `<button aria-label="Show suggestions">`, which is exactly that shape.
     *
     * It is declared rather than designed around because designing around it
     * would mean poisoning `no-latin-aria` with a NON-interactive element,
     * which is not where that defect happens.
     */
    const IMPLIES: Record<string, string[]> = {
      "resolved-idrefs": ["named-controls"],
      "no-latin-aria": ["native-script-name"],
    };

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

  it("never grades a tag against another locale's digits: derives its own, or refuses", () => {
    // Since 0.2.0 (decision §28) `de-DE` is graded by its own CLDR profile —
    // Latin digits, Latin script — not refused; what is refused is a tag that
    // is not a language, or a script the gate cannot name. Defaulting to
    // another locale's digits would be a wrong answer wearing a green tick.
    expect(gradingFor("de-DE").digits.numberingSystem).toBe("latn");
    expect(() => gradingFor("not a tag!")).toThrow(/not a BCP-47/);
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
      "unique-ids",
      "native-script-text",
      "native-script-name",
      "named-roledescription",
      "latn-island-purity",
      "persian-zwnj",
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
// THE FOUR RULES ADDED FOR AUDIT PHASE 3, AND THEIR NARROWINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Each of these grades something the first nine structurally could not see, and
 * each carries its negative twins here for the reason DECISIONS §13 gives: an
 * exemption without a test against it is an exemption that widens into a skip
 * on the next tidy-up.
 *
 * Three of the four have LIVE findings on the export as they land — 14 duplicate
 * ids, 138 pure-Latin text runs, 44 unnamed roledescriptions. That is the
 * intended state and it is recorded here rather than smoothed away: a rule
 * narrowed until the export is green is a rule that has stopped grading.
 */
const fa = (body: string) =>
  `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
const fired = (body: string, rules?: Parameters<typeof gradeHtml>[2]) =>
  [...new Set(gradeHtml("fa-IR/index.html", fa(body), rules).map((v) => v.rule))].sort();

describe("unique-ids — a reference that resolves to the WRONG element", () => {
  it("fires on a duplicate, where resolved-idrefs is green", () => {
    const html = fa('<p id="x">الف</p><p id="x">ب</p><input aria-labelledby="x" />');
    const v = gradeHtml("fa-IR/index.html", html);
    expect(v.filter((r) => r.rule === "resolved-idrefs")).toEqual([]);
    const dup = v.filter((r) => r.rule === "unique-ids");
    expect(dup).toHaveLength(1);
    expect(dup[0]?.detail).toContain("is carried by 2 elements");
  });

  it("reports one violation per duplicated id, not one per element", () => {
    // Five rows sharing `id="a"` is ONE defect to fix. Reporting five would
    // make the export's 44 elements read as 44 problems and bury the 14.
    const v = gradeHtml("fa-IR/index.html", fa('<i id="a">۱</i><i id="a">۲</i><i id="a">۳</i>'));
    expect(v.filter((r) => r.rule === "unique-ids")).toHaveLength(1);
  });

  it("does not group empty ids together", () => {
    // `id=""` matches no reference at all, so two of them are not a collision.
    // Grouping on it would report every such element as a duplicate of every
    // other — a fabricated defect, which is worse than a missed one.
    expect(fired('<p id="">الف</p><p id="">ب</p>')).toEqual([]);
  });

  it("grades ids inside <pre> and <code>, because the export has none there", () => {
    /*
     * The carve-out this rule was specified with. Measured before it was
     * written: 8,846 elements carry an `id` in the export and ZERO of them are
     * inside a `<pre>` or `<code>` — a shiki listing renders `id="…"` as
     * escaped TEXT, never as an attribute, so the exclusion is a no-op on every
     * byte this project ships and a hole the day someone embeds live markup in
     * a code block.
     */
    expect(fired('<pre><code><span id="d">۱</span><span id="d">۲</span></code></pre>')).toEqual([
      "unique-ids",
    ]);
  });
});

describe("native-script-text — the rule that would have caught «thr»", () => {
  it("fires on a pure-Latin run on a Persian page", () => {
    expect(fired("<p>مرتب‌سازی</p><span>thr</span>")).toEqual(["native-script-text"]);
  });

  it("does NOT fire on an inline technical term inside Persian prose", () => {
    // The scope decision, from the side that matters: hundreds of these exist
    // in the documentation and every one is correct prose. A rule that flagged
    // them would be switched off within a day.
    expect(fired('<p>با orientation="vertical" پشته می‌نشیند.</p>')).toEqual([]);
  });

  it("merges a run split by ENTITIES, which is how linkedom parses the export", () => {
    /*
     * `&quot;` splits a text node in linkedom, so this ONE Persian sentence
     * arrives as five nodes and two of them hold no Persian at all. Asked per
     * node the rule reports two false positives here; measured over the export,
     * 40 of 178 findings were exactly this and nothing else. The rule grades
     * an element's own text, merged.
     */
    expect(fired("<p>با orientation=&quot;vertical&quot; پشته می‌نشیند.</p>")).toEqual([]);
  });

  it("honours data-lumo-latn and NOT a bare lang attribute", () => {
    /*
     * `lang` was considered as a second hatch — the root 404 documents carry
     * `lang="en-US" dir="ltr"` on a deliberate English line — and refused. The
     * natural wrong fix for «thr» being read in a Persian voice is to add
     * `lang="en"` to it, which would silence this rule on the exact defect it
     * exists for. `data-lumo-latn` cannot be reached by accident.
     */
    expect(fired('<span data-lumo-latn dir="ltr">AC-4825</span>')).toEqual([]);
    expect(fired('<p lang="en-US" dir="ltr">This page could not be found.</p>')).toEqual([
      "native-script-text",
    ]);
  });

  it("is vacuous on a Latin-script locale rather than pretending to grade it", () => {
    const html = '<!doctype html><html lang="en-US" dir="ltr"><body><p>Sort by</p></body></html>';
    expect(gradeHtml("en-US/index.html", html)).toEqual([]);
  });

  it("grades ARABIC through the same script, not a second hardwired one", () => {
    // The parametrisation, proven with a second locale — the standard this
    // suite already holds the digit rules to.
    const bad = '<!doctype html><html lang="ar-SA" dir="rtl"><body><span>newest</span></body></html>';
    const good = '<!doctype html><html lang="ar-SA" dir="rtl"><body><span>الأحدث</span></body></html>';
    expect(gradeHtml("ar-SA/index.html", bad).map((v) => v.rule)).toContain("native-script-text");
    expect(gradeHtml("ar-SA/index.html", good)).toEqual([]);
  });

  it("ignores a run with no WORD in it — a bullet, a unit, a symbol", () => {
    // Three letters, not one: «۵ kg» and «▼» are not untranslated strings.
    expect(fired("<p>۵ kg</p><span>▼</span><span>x</span>")).toEqual([]);
  });
});

describe("native-script-name — what is ANNOUNCED, not what is in an attribute", () => {
  it("fires on a name that no attribute carries", () => {
    // `<input type=submit>` is named by its `value`: not an ARIA attribute, not
    // a text node. This is the gap `no-latin-aria` structurally cannot reach.
    const v = gradeHtml("fa-IR/index.html", fa('<input type="submit" value="Send order" />'));
    expect(v.map((r) => r.rule)).toEqual(["native-script-name"]);
    expect(v[0]?.detail).toContain('"Send order"');
  });

  it("fires on a control named by a <label for> across the document", () => {
    expect(fired('<label for="q">Search orders</label><input id="q" />')).toEqual([
      "native-script-name",
      "native-script-text",
    ]);
  });

  it("subtracts a MARKED DESCENDANT, which is where a name comes from", () => {
    /*
     * The 474 pure-Latin names in the export are all proper nouns and all
     * already marked — but the mark is one level DOWN, on the `<code>` or
     * `<span>` inside the control. `closest()`, which every other rule in
     * rules.ts uses for this hatch, looks UP and would report all 474.
     */
    expect(fired('<a href="/x/"><code data-lumo-latn dir="ltr" lang="en">pnpm</code></a>')).toEqual([]);
  });

  it("but subtraction is not silence: unmarked Latin beside marked Latin fires", () => {
    // The negative twin. The mark buys the string it wraps, not the control.
    const v = gradeHtml(
      "fa-IR/index.html",
      fa('<button><code data-lumo-latn dir="ltr" lang="en">pnpm</code> Install</button>'),
    );
    expect(v.filter((r) => r.rule === "native-script-name")).toHaveLength(1);
  });

  it("leaves an UNNAMED control to named-controls", () => {
    // Two rules reporting one element teaches people to read neither.
    expect(fired("<button></button>")).toEqual(["named-controls"]);
  });

  it("passes a control named in the reader's own script", () => {
    expect(fired('<button aria-label="افزودن سفارش">+</button>')).toEqual([]);
  });

  it("grades composite widgets: an unnamed menu, listbox, tree or grid is an unnamed control", () => {
    expect(fired('<div role="menu"><div role="menuitem" tabindex="0">رونوشت</div></div>')).toEqual(["named-controls"]);
    expect(fired('<ul role="listbox"><li role="option" tabindex="0">۱۴۰۳</li></ul>')).toEqual(["named-controls"]);
    expect(fired('<div role="tree"><div role="treeitem" tabindex="0">پرونده</div></div>')).toEqual(["named-controls"]);
    expect(
      fired('<button id="t">گزینه‌ها</button><div role="menu" aria-labelledby="t"><div role="menuitem" tabindex="0">رونوشت</div></div>'),
    ).toEqual([]);
    expect(fired('<ul role="listbox" aria-label="سال"><li role="option" tabindex="0">۱۴۰۳</li></ul>')).toEqual([]);
  });

  it("grades an unnamed radiogroup; a plain role=group may stay unnamed", () => {
    expect(fired('<div role="radiogroup"><div role="radio" aria-checked="true" tabindex="0">الف</div></div>')).toEqual(["named-controls"]);
    expect(fired('<div role="group"><button>الف</button></div>')).toEqual([]);
  });

  it("grades unnamed dialog, tablist and region roles", () => {
    expect(fired('<div role="dialog"></div>')).toEqual(["named-controls"]);
    expect(fired('<div role="alertdialog"></div>')).toEqual(["named-controls"]);
    expect(fired('<div role="tablist"></div>')).toEqual(["named-controls"]);
    expect(fired('<div role="region"></div>')).toEqual(["named-controls"]);
    expect(fired('<div role="dialog" aria-label="گفتگو"></div>')).toEqual([]);
  });

  it("is vacuous on a Latin-script locale", () => {
    const html =
      '<!doctype html><html lang="en-US" dir="ltr"><body><button>Save</button></body></html>';
    expect(gradeHtml("en-US/index.html", html)).toEqual([]);
  });
});

describe("named-roledescription — a word announced with nothing attached", () => {
  it("fires on a roledescription with no accessible name", () => {
    const v = gradeHtml("fa-IR/index.html", fa('<div role="group" aria-roledescription="اسلاید"></div>'));
    expect(v.map((r) => r.rule)).toEqual(["named-roledescription"]);
    expect(v[0]?.detail).toContain("announced as that word and nothing else");
  });

  it("passes once the element has a name — the one-attribute fix", () => {
    expect(
      fired('<div role="group" aria-roledescription="اسلاید" aria-label="کفش، ۱ از ۴"></div>'),
    ).toEqual([]);
  });

  it("still fires when the slide merely CONTAINS a heading — the obvious wrong fix", () => {
    /*
     * `group` takes its name from the author only: ARIA does not list it among
     * the name-from-content roles, so a heading inside the slide is not a name
     * and a reader announcing this element still says «اسلاید» and stops.
     * This is worth a test rather than a comment, because "put a title in the
     * slide" is what anyone would try first when told the carousel is unnamed —
     * and the page would look completely correct afterwards.
     */
    expect(fired('<div role="group" aria-roledescription="اسلاید"><h3>کفش دویدن</h3></div>')).toEqual(
      ["named-roledescription"],
    );
  });

  it("accepts a name from CONTENT where the role takes one", () => {
    // The counterpart, so the rule is not mistaken for "aria-label or nothing":
    // `button` IS a name-from-content role, so its text is its name.
    expect(fired('<button aria-roledescription="کلید میان‌بر">ذخیره</button>')).toEqual([]);
  });

  it("skips an aria-hidden subtree, which is never announced at all", () => {
    expect(
      fired('<div aria-hidden="true"><div role="group" aria-roledescription="اسلاید"></div></div>'),
    ).toEqual([]);
  });

  it("grades an ENGLISH page too — the export's finding is 22 and 22", () => {
    // Deliberately no locale early return. An unnamed slide is exactly as
    // unnavigable in English, and a rule that graded only the Persian half
    // would have called the English carousel correct.
    const html =
      '<!doctype html><html lang="en-US" dir="ltr"><body>' +
      '<div role="group" aria-roledescription="slide"></div></body></html>';
    expect(gradeHtml("en-US/index.html", html).map((v) => v.rule)).toEqual([
      "named-roledescription",
    ]);
  });
});

describe("no-latin-aria grades the two PLATFORM attributes as well", () => {
  /*
   * `SPOKEN` held seven attributes, five of them `aria-*`. `alt` IS the
   * accessible name of an image and a native `placeholder` is announced; that
   * `aria-placeholder` was graded and `placeholder` was not is the tell. The
   * export has 12 `alt` and 40 `placeholder` attributes on Persian routes with
   * zero Latin words among them, so this costs nothing — which is exactly why
   * it needs tests that watch it fire rather than a note saying it is clean.
   */
  it("grades alt on an image", () => {
    const v = gradeHtml("fa-IR/index.html", fa('<img src="/l.svg" alt="Company logo" />'));
    expect(v.map((r) => r.rule)).toEqual(["no-latin-aria"]);
    expect(v[0]?.detail).toContain("alt=");
  });

  it("grades a native placeholder", () => {
    const v = gradeHtml(
      "fa-IR/index.html",
      fa('<input type="search" aria-label="جست‌وجو" placeholder="Search orders" />'),
    );
    expect(v.map((r) => r.rule)).toEqual(["no-latin-aria"]);
    expect(v[0]?.detail).toContain("placeholder=");
  });

  it("does NOT grade either on an element the platform never speaks them on", () => {
    // `<div alt>` and `<div placeholder>` are author errors no reader hears. A
    // rule whose findings cannot reach a user is one people learn to ignore.
    expect(fired('<div alt="Save" placeholder="Search">متن</div>')).toEqual([]);
  });

  it("does not fire on an empty decorative alt", () => {
    expect(fired('<img src="/d.svg" alt="" />')).toEqual([]);
  });

  it("does not mistake the standards-defined aria-keyshortcuts grammar for English prose", () => {
    const v = gradeHtml(
      "fa-IR/index.html",
      fa(
        '<button aria-label="تغییر اندازه" aria-keyshortcuts="F2 ArrowLeft ArrowRight Escape Tab">تغییر</button>',
      ),
    );
    expect(v.filter((result) => result.rule === "no-latin-aria")).toEqual([]);
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

  it("and that file actually arms the exempt ceiling", () => {
    /*
     * The ceiling is armed one level deeper than the floors are: not by the
     * ARGUMENT, which the test above pins, but by a KEY inside the file the
     * argument names. Delete `"@exempt-ceiling"` and `exceedsExemptCeiling` is
     * never called with a number, so it returns undefined, so nothing fails —
     * and its four unit tests keep passing, because they call the function
     * directly with literal ceilings and never look at the site's config.
     *
     * That is the same disarm route this whole describe block exists to
     * memorialise for `persian-digit-floor` ("fully built, fully tested,
     * documented, and grading nothing"). The guard that incident produced was
     * never extended to the newer check.
     */
    const floors = JSON.parse(
      readFileSync(
        join(import.meta.dirname, "..", "..", "..", "apps", "website", "gate.floors.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(
      Object.hasOwn(floors, "@exempt-ceiling"),
      "the docs site stopped bounding how much of itself the gate is allowed not to read",
    ).toBe(true);
    expect(typeof floors["@exempt-ceiling"]).toBe("number");
  });

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

  it("requires every newly number-dense Persian route to join the floor ledger", () => {
    const dense = fa(`<p>${"۱".repeat(30)}</p>`);
    const exempt = fa(`<pre data-lumo-latn><code>${"۱".repeat(40)}</code></pre>`);
    expect(missingDenseDigitFloors([
      { path: "fa/components/new/index.html", html: dense },
      { path: "fa/components/code/index.html", html: exempt },
      { path: "en/components/new/index.html", html: dense.replace('lang="fa-IR" dir="rtl"', 'lang="en-US" dir="ltr"') },
    ], {})).toEqual([{ path: "fa/components/new/index.html", found: 30 }]);
    expect(missingDenseDigitFloors([
      { path: "fa/components/new/index.html", html: dense },
    ], { "fa/components/new/index.html": 16 })).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// THE GATE PRINTS ITS OWN SCOPE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * "524 documents graded, 0 violations" is true and invites a false conclusion.
 * `data-lumo-latn` exempts whole subtrees — legitimately, since the dominant
 * one is shiki code listings — but on a docs site made largely OF source code
 * the exempt fraction is most of the text, and nothing said so.
 *
 * These grade the census itself. It never fails a build: there is no threshold
 * to fail at, because 80% exempt is correct for a documentation site and would
 * be alarming for a product. The number's job is to be seen by someone who
 * knows which they are looking at.
 */
describe("coverage census", () => {
  const fa = (body: string) => `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;

  it("counts an exempt subtree as exempt, using the rules' own test", () => {
    const c = addCoverage(EMPTY_COVERAGE, "fa/index.html", fa(
      `<p>سلام</p><pre data-lumo-latn=""><code>const x = 1;</code></pre>`,
    ));
    expect(c.textNodes).toBe(2);
    expect(c.exemptTextNodes).toBe(1);
    // The exemption is inherited by descendants — `closest`, not an own-attribute
    // check — because that is exactly what `no-latin-digits` does.
    expect(c.exemptCharacters).toBe("const x = 1;".length);
  });

  it("ignores latn locales, so the fraction is over the corpus it describes", () => {
    /*
     * The first cut compared `gradingFor(locale).digits` — a DigitSystem object —
     * to the string "latn", which is never true. Every English page counted as
     * Persian and the printed fraction was computed over twice the real corpus.
     * A scope line that is itself miscounted is worse than no scope line.
     */
    const before = addCoverage(EMPTY_COVERAGE, "fa/index.html", fa("<p>سلام</p>"));
    const after = addCoverage(before, "en/index.html",
      `<!doctype html><html lang="en-US" dir="ltr"><body><p>hello</p></body></html>`);
    expect(after).toEqual(before);
    expect(after.gradedLocaleDocs).toBe(1);
  });

  it("does not credit itself for script and style it was never asked to read", () => {
    const c = addCoverage(EMPTY_COVERAGE, "fa/index.html", fa(
      `<p>سلام</p><script>var a = 1;</script><style>.a{color:red}</style>`,
    ));
    expect(c.textNodes).toBe(1);
  });

  it("prints nothing when there is nothing in scope to describe", () => {
    // An all-English export should not print a Persian coverage line at all,
    // rather than printing 0.0% and implying it measured something.
    expect(formatCoverage(EMPTY_COVERAGE, 0)).toBe("");
  });

  it("reports the floor's coverage against the same denominator", () => {
    const c = addCoverage(EMPTY_COVERAGE, "fa/index.html", fa("<p>سلام</p>"));
    expect(formatCoverage(c, 12)).toContain("armed on 12 of 1 route(s)");
  });
});

describe("latn-island-purity — the exemption cannot hide the reader's own prose", () => {
  const fa = (body: string) => `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const fired = (body: string) => gradeHtml("fa-IR/index.html", fa(body)).map((v) => v.rule);

  it("fires on a Persian paragraph inside a data-lumo-latn island", () => {
    expect(
      fired('<p data-lumo-latn dir="ltr">این پاراگراف فارسی است و نباید در جزیرهٔ لاتین باشد؛ چون قاعده‌ها آن را نمی‌خوانند.</p>'),
    ).toEqual(["latn-island-purity"]);
  });

  it("fires on a Persian CONTROL inside an English island, however short", () => {
    expect(
      fired('<figcaption dir="ltr" lang="en" data-lumo-latn=""><code>lang="fa-IR" dir="rtl"</code><a href="/x/">باز کردن تمام‌صفحه</a></figcaption>'),
    ).toEqual(["latn-island-purity"]);
  });

  it("does NOT fire on a Persian-named control inside a bare bidi island (no lang): PhoneInput's tel input", () => {
    expect(fired('<bdi dir="ltr" data-lumo-latn=""><span aria-hidden="true">+۹۸</span><input type="tel" aria-label="شمارهٔ موبایل" /></bdi>')).toEqual([]);
  });

  it("reads a control's aria-label, and ignores hidden controls", () => {
    expect(fired('<div dir="ltr" lang="en" data-lumo-latn=""><code>pnpm add</code><button aria-label="کپی کردن دستور">⧉</button></div>')).toEqual(["latn-island-purity"]);
    expect(fired('<div dir="ltr" lang="en" data-lumo-latn=""><code>pnpm add @lumo-ui/ui</code><a hidden href="/x/">باز کردن تمام‌صفحه</a></div>')).toEqual([]);
  });

  it("does NOT fire on English documentation prose that quotes Persian strings", () => {
    expect(
      fired('<td dir="ltr" lang="en" data-lumo-latn="">The label announced when the list is empty, e.g. «هیچ موردی پیدا نشد» or «فهرست خالی است».</td>'),
    ).toEqual([]);
  });

  it("does NOT fire on a code sample that quotes a short Persian string", () => {
    expect(
      fired('<pre data-lumo-latn dir="ltr"><code>&lt;Button label="ذخیره کنید"&gt;ذخیره&lt;/Button&gt; // pnpm add @lumo-ui/ui</code></pre>'),
    ).toEqual([]);
  });

  it("does NOT fire on digit-only islands (phone runs, ids) — letters are what count", () => {
    expect(fired('<bdi data-lumo-latn dir="ltr">+۹۸ ۹۱۲ ۱۲۳ ۴۵۶۷</bdi><span data-lumo-latn dir="ltr">AC-4825</span>')).toEqual([]);
  });

  it("grades outermost islands only, and skips hidden ones", () => {
    // The nested island alone would fire; it is not graded because its outer island is, and the outer one is Latin-dominant.
    expect(
      fired(
        '<pre data-lumo-latn dir="ltr"><code>import { Button } from "@lumo-ui/ui"; export function Save() { return &lt;Button variant="primary" size="md"&gt;' +
          '<span data-lumo-latn>این هم فارسی است ولی درون کد</span>&lt;/Button&gt;; }</code></pre>',
      ),
    ).toEqual([]);
    expect(fired('<p hidden data-lumo-latn dir="ltr">این پاراگراف فارسی پنهان است و نباید گزارش شود چون خوانده نمی‌شود.</p>')).toEqual([]);
  });

  it("is vacuous on a Latin-script locale", () => {
    expect(gradeHtml("en-US/index.html", '<!doctype html><html lang="en-US" dir="ltr"><body><p data-lumo-latn>Plain English prose is fine here.</p></body></html>')).toEqual([]);
  });
});

describe("no-latin-aria — mixed Persian is Persian", () => {
  const fa = (body: string) => `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const fired = (body: string) => gradeHtml("fa-IR/index.html", fa(body)).map((v) => v.rule);

  it("passes an announced string that carries a foreign token inside a Persian phrase", () => {
    expect(fired('<button type="button" aria-label="دانلود PDF">⬇</button>')).toEqual([]);
    expect(fired('<button type="button" aria-label="ورود با Google">G</button>')).toEqual([]);
    expect(fired('<input aria-label="ایمیل" aria-placeholder="نشانی مثل name@example.com" />')).toEqual([]);
  });

  it("still fails a purely Latin announced string", () => {
    expect(fired('<button type="button" aria-label="Download">⬇</button>')).toContain("no-latin-aria");
    expect(fired('<input aria-label="مبلغ" aria-roledescription="Number field" />')).toEqual(["no-latin-aria"]);
  });
});

describe("no-latin-digits — attributes a reader sees or hears", () => {
  const fa = (body: string) => `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const fired = (body: string) => gradeHtml("fa-IR/index.html", fa(body)).map((v) => v.rule);

  it("fires on an input's served value, aria-valuetext, placeholder and alt", () => {
    expect(fired('<input aria-label="مبلغ" value="1,234" />')).toEqual(["no-latin-digits"]);
    expect(fired('<div role="slider" tabindex="0" aria-label="بودجه" aria-valuenow="40" aria-valuetext="40 درصد"></div>')).toContain("no-latin-digits");
    expect(fired('<input aria-label="سن" placeholder="18" />')).toEqual(["no-latin-digits"]);
    expect(fired('<img alt="فاکتور 12" src="x.png" />')).toEqual(["no-latin-digits"]);
    expect(fired('<button type="button" aria-label="حذف ردیف 3">×</button>')).toEqual(["no-latin-digits"]);
  });

  it("does NOT fire on Latin-by-nature inputs, islands, hidden nodes or Persian digits", () => {
    expect(fired('<input type="tel" aria-label="تلفن" value="+98 912" /><input type="email" aria-label="ایمیل" value="a2@x.com" />')).toEqual([]);
    expect(fired('<input aria-label="کد سفارش" data-lumo-latn value="AC-4825" />')).toEqual([]);
    expect(fired('<input hidden aria-label="x" value="42" />')).toEqual([]);
    expect(fired('<input type="number" aria-label="مبلغ" value="100" />')).toEqual([]);
    expect(fired('<input aria-label="مبلغ" value="۱٬۲۳۴" placeholder="۱۸" />')).toEqual([]);
  });
});

describe("native-calendar — a numeric Gregorian year in a Persian date field", () => {
  const fa = (body: string) => `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const fired = (body: string) => gradeHtml("fa-IR/index.html", fa(body)).map((v) => v.rule);
  const seg = (year: number, first = true) =>
    `<div role="group" aria-label="تاریخ"><div role="spinbutton" data-type="year" aria-label="سال" aria-valuemin="1" aria-valuemax="9999" aria-valuenow="${year}" aria-valuetext="${year}" tabindex="${first ? 0 : -1}"></div></div>`;
  it("fires on 2026, not on 1405", () => {
    expect(fired(seg(2026))).toContain("native-calendar");
    expect(fired(seg(1405))).not.toContain("native-calendar");
  });
});

describe("any language — a CLDR-derived profile under the explicit table (decision §28)", () => {
  it("derives direction, digits, calendar and script for tags the table does not name", () => {
    expect(gradingFor("de")).toMatchObject({ direction: "ltr", calendar: "gregory" });
    expect(gradingFor("de").digits.numberingSystem).toBe("latn");
    expect(gradingFor("de").script.name).toBe("Latin");
    expect(gradingFor("ar-EG").direction).toBe("rtl");
    expect(gradingFor("ar-EG").digits.numberingSystem).toBe("arab");
    expect(gradingFor("ar-EG").digits.pattern.source).toBe("[٠-٩]");
    expect(gradingFor("he").direction).toBe("rtl");
    expect(gradingFor("he").script.name).toBe("Hebrew");
    expect(gradingFor("fa-AF").calendar).toBe("persian"); // fa-* always Jalali, as formatLocale does
    expect(gradingFor("ja").script.pattern.test("ひらがな")).toBe(true);
    expect(gradingFor("ja").script.pattern.test("漢字")).toBe(true);
    expect(gradingFor("hi").script.name).toBe("Devanagari");
  });
  it("the explicit table still wins for the locales it names", () => {
    expect(gradingFor("ar-SA").calendar).toBe("islamic-umalqura");
    expect(gradingFor("fa-IR").digits.numberingSystem).toBe("arabext");
  });
  it("throws for a tag that is not a language — never grades against another locale's digits", () => {
    expect(() => gradingFor("not a tag!")).toThrow(/not a BCP-47/);
  });
  it("derives the locale from a non-built-in route segment, refined by <html lang>", () => {
    expect(localeForPath("de/about/index.html")).toEqual({ locale: "de", direction: "ltr" });
    expect(localeForPath("de/about/index.html", undefined, "de-AT")).toEqual({ locale: "de-AT", direction: "ltr" });
    expect(localeForPath("de/about/index.html", undefined, "fr")).toEqual({ locale: "de", direction: "ltr" }); // lang disagrees on the language: the route wins, lang-dir will report it
    expect(localeForPath("ar-EG/index.html")).toEqual({ locale: "ar-EG", direction: "rtl" });
    expect(() => localeForPath("about/index.html")).toThrow(/Cannot derive a locale/);
  });
  it("grades a German page and an Egyptian-Arabic page with their own digits and script", () => {
    const de = `<!doctype html><html lang="de" dir="ltr"><head><title>Konto</title></head><body><main><h1>Konto</h1><p>3 Einträge</p><button type="button">Speichern</button></main></body></html>`;
    expect(gradeHtml("de/konto/index.html", de)).toEqual([]);
    const ar = `<!doctype html><html lang="ar-EG" dir="rtl"><head><title>حساب</title></head><body><main><h1>الحساب</h1><p>٣ عناصر</p><button type="button">حفظ</button></main></body></html>`;
    expect(gradeHtml("ar-EG/index.html", ar)).toEqual([]);
    // Latin digits on the Arabic page are the defect, exactly as on a Persian page.
    const bad = ar.replace("٣ عناصر", "3 عناصر");
    expect(gradeHtml("ar-EG/index.html", bad).map((v) => v.rule)).toContain("no-latin-digits");
  });
});

/*
 * «می» IS BOTH A MONTH AND THE COMMONEST VERB PREFIX IN PERSIAN.
 *
 * `native-calendar` finds a Gregorian month name near digits. In Persian the
 * name for May is «می», which is also the imperfective prefix on almost every
 * verb in the language: «می‌افتد» (falls), «می‌نشیند» (sits), «می‌شود» (becomes).
 *
 * They are told apart by the joiner. `می‌افتد` is ONE word, joined by U+200C;
 * `می ۲۰۲۴` is a date. But U+200C is a FORMAT character — neither `\p{L}` nor
 * `\p{M}` — so a word boundary built from those alone ends the word at the
 * joiner, and «۱ می‌افتد» ("1 falls") was reported as "1 May" on a live
 * catalogue. `persian-zwnj` already rests on «می کند» and «می‌کند» being
 * different strings; this rule has to agree with it.
 */
describe("native-calendar and the Persian imperfective prefix", () => {
  const page = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"></head>` +
    `<body>${body}</body></html>`;
  const fired = (body: string) =>
    gradeHtml("fa-IR/index.html", page(body)).filter((v) => v.rule === "native-calendar");

  it.each([
    ["۱ می‌افتد", "falls"],
    ["ستون ۱ می‌نشیند", "sits"],
    ["۳ روز طول می‌کشد", "takes"],
  ])("does not read a verb as a month: %s (%s)", (text) => {
    expect(fired(`<p>${text}</p>`)).toEqual([]);
  });

  it.each(["۱ می ۲۰۲۴", "می ۲۰۲۴", "۲۲ می"])("still catches a real Gregorian date: %s", (text) => {
    // The anti-vacuity half. If the boundary widened too far these would pass
    // too, and the rule would have been disabled rather than corrected.
    expect(fired(`<p>${text}</p>`).length).toBeGreaterThan(0);
  });

  it("and a joiner does not hide a date that really is one", () => {
    // ZWNJ inside the YEAR must not launder the month beside it.
    expect(fired("<p>۱ می ۲۰۲۴ می‌شود</p>").length).toBeGreaterThan(0);
  });
});

/*
 * `<code>`, `<kbd>`, `<samp>` and `<var>` ARE the deliberately-foreign mark.
 *
 * A consumer's Persian tool pages carried «<code>WEBVTT</code>», «<code>Date</code>»
 * and «<kbd>Ctrl</kbd>» and were asked to add `data-lumo-latn` to each — a mark
 * that says nothing `<code>` does not already say. The four phrasing elements
 * whose content is machine text by definition now count as marked, for every
 * rule that honours the mark: text, name residue, digits, attributes, coverage.
 * `<pre>` and `lang` stay outside the hatch on purpose.
 */
describe("code-like elements are the deliberately-foreign hatch", () => {
  const page = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"></head>` +
    `<body>${body}</body></html>`;
  const rules = (body: string) => gradeHtml("fa-IR/index.html", page(body)).map((v) => v.rule);

  it.each(["code", "kbd", "samp", "var"])("<%s> content is not graded for script", (tag) => {
    expect(rules(`<p>قالب <${tag}>WEBVTT</${tag}> را انتخاب کنید</p><p><${tag}>Date</${tag}></p>`)).not.toContain("native-script-text");
  });

  it("nor for digits", () => {
    expect(rules("<p>کد <code>0x1F</code> و <kbd>F12</kbd></p>")).not.toContain("no-latin-digits");
  });

  it("and code inside an accessible name is subtracted, not skipped", () => {
    // The residue rule: «ذخیرهٔ <code>song.txt</code>» is fine; a name that is
    // ONLY code still has no reader-script letter and still fires.
    expect(rules('<button>ذخیرهٔ <code>song.txt</code></button>')).not.toContain("native-script-name");
    expect(rules('<button><code>song.txt</code> save</button>')).toContain("native-script-name");
  });

  it("but the same text in a <span> or a <pre> still fires (the poison)", () => {
    expect(rules("<p>قالب <span>WEBVTT</span> را انتخاب کنید</p>")).toContain("native-script-text");
    expect(rules("<pre>WEBVTT</pre>")).toContain("native-script-text");
    expect(rules("<p>کد <span>0x1F</span></p>")).toContain("no-latin-digits");
  });

  it("and lang=\"en\" is still not a hatch", () => {
    expect(rules('<p lang="en">WEBVTT</p>')).toContain("native-script-text");
  });

  it("a code sample IN Persian is not an impure island (0.5.6 failed 52 of them)", () => {
    // `<code>` claims nothing about script, so purity has nothing to audit.
    expect(rules("<p>کلید <code>تنظیمات: رضایت</code> را بخوانید</p>")).not.toContain("latn-island-purity");
    // The poison: the same prose under the AUTHOR'S mark is still a false claim.
    expect(rules('<p>کلید <span data-lumo-latn>تنظیمات: رضایت</span> را بخوانید</p>')).toContain("latn-island-purity");
  });
});
