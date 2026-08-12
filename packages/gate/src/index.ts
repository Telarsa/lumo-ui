import { parseHTML } from "linkedom";
import { RULES, digitSystem, type DigitSystem, type Doc, type Rule, type Violation } from "./rules.ts";

export * from "./rules.ts";

/**
 * The digit sets, one per numbering system rather than one per locale — several
 * locales share a system, and the range is a property of the system.
 *
 * `name` is what a violation message calls them. "Persian" is deliberate and
 * load-bearing: it is the word the floor rule printed when the range was
 * hardwired, so a `fa-IR` violation still reads byte-for-byte as it always did.
 */
const ARABEXT = digitSystem("Persian", "arabext", "۰"); // U+06F0–U+06F9
const ARAB = digitSystem("Arabic-Indic", "arab", "٠"); //  U+0660–U+0669
const LATN = digitSystem("Latin", "latn", "0"); //         U+0030–U+0039

/** Everything the gate needs to know about a locale to grade a page in it. */
export interface LocaleGrading {
  direction: "rtl" | "ltr";
  digits: DigitSystem;
  /**
   * The Unicode calendar its readers count years in. A THIRD independent
   * property, for the same reason direction and digits are already two: it does
   * not follow from either. Persian is rtl/arabext/persian, Arabic is
   * rtl/arab/islamic-umalqura — same direction, different digits AND a
   * different calendar — and Urdu is rtl/latn/gregory. Deriving any one from
   * another is how `no-latin-digits` was silently Persian-only.
   *
   * Measured, and the reason this is data rather than an ICU default: on this
   * project's Node, `Intl.DateTimeFormat("fa-IR")` picks `persian` by itself
   * while `Intl.DateTimeFormat("ar-SA")` picks GREGORIAN. The default is not
   * something a gate can rely on, and it can differ between a laptop and CI.
   */
  calendar: string;
}

/**
 * Locales this gate knows how to grade.
 *
 * Two properties, deliberately independent. Direction was once used as a stand-in
 * for "numbers in its own digits", which is true of Persian and Arabic and false
 * in both directions in general — Urdu is rtl and commonly latn, and nothing
 * about ltr implies Latin numerals. Conflating them is why the digit rules were
 * silently Persian-only, so both are stated.
 *
 * This table is the gate's OWN scope and is deliberately wider than
 * `@lumo-ui/core`'s `Locale` union: core's union is the set of locales the
 * LIBRARY ships complete string sets for, while this is the set of locales the
 * grader can grade — including a consumer's, whose HTML it is handed but whose
 * translations it does not own. `ar-SA` is here for that reason and because a
 * parametrisation with one instantiation is indistinguishable from a hardwire;
 * `fixtures/locales/` grades real Arabic bytes through it.
 */
const KNOWN: Record<string, LocaleGrading> = {
  "fa-IR": { direction: "rtl", digits: ARABEXT, calendar: "persian" },
  "ar-SA": { direction: "rtl", digits: ARAB, calendar: "islamic-umalqura" },
  "en-US": { direction: "ltr", digits: LATN, calendar: "gregory" },
};

/** The locales `localeForPath` will accept. Used by the gate's own self-test. */
export function knownLocales(): string[] {
  return Object.keys(KNOWN);
}

/**
 * How a locale is graded. Throws rather than defaulting: a locale with no entry
 * would otherwise be graded against some other locale's digits, which is a
 * wrong answer wearing a green tick.
 */
export function gradingFor(locale: string): LocaleGrading {
  const grading = KNOWN[locale];
  if (!grading) {
    throw new Error(
      `No grading rules for locale ${JSON.stringify(locale)}. Add it to KNOWN in ` +
        `packages/gate/src/index.ts with its direction AND its numbering system — ` +
        `a locale graded against another locale's digits reports green on defects.`,
    );
  }
  return grading;
}

/**
 * Derives the expected locale from a route path.
 *
 * Deliberately strict: an unrecognised first segment is an ERROR, not a skip.
 * Silently skipping unknown routes is how a gate ends up grading three pages out
 * of fifty-five and reporting green.
 */
export function localeForPath(
  path: string,
  /**
   * Documents that legitimately sit above the locale segment — a static export's
   * root `404.html` and its entry stub. They are served for paths that matched
   * no route, so they cannot know the visitor's locale.
   *
   * They are NOT skipped. They are graded as the primary locale, because a 404
   * is user-facing text and the one route nobody tests is exactly where an
   * English document slips through. The allowance is a narrow, named list rather
   * than a wildcard for that reason.
   */
  rootLocale: string = "fa-IR",
): { locale: string; direction: "rtl" | "ltr" } {
  const clean = path.replace(/^\.?\//, "");
  // Both emitted forms: `trailingSlash: true` turns 404.html into 404/index.html.
  const ROOT_DOCS = new Set([
    "404.html", "404/index.html",
    "500.html", "500/index.html",
    "index.html",
    // Next's internal name for the root not-found route under app router.
    "_not-found/index.html", "_not-found.html",
  ]);
  if (ROOT_DOCS.has(clean)) {
    return { locale: rootLocale, direction: gradingFor(rootLocale).direction };
  }
  // The locale may be any segment, not only the first: preview routes are
  // /view/<locale>/<slug>/. Scanning rather than assuming a position means a new
  // route shape does not silently become ungraded.
  const segments = clean.split("/");
  const match = segments
    .map((seg) => Object.keys(KNOWN).find((l) => l === seg || l.split("-")[0] === seg))
    .find(Boolean);
  if (!match) {
    throw new Error(
      `Cannot derive a locale from route ${JSON.stringify(path)}. Every page must carry ` +
        `a locale segment (${Object.keys(KNOWN).join(", ")}) so the gate can grade it. ` +
        `An ungraded page is an unprotected page.`,
    );
  }
  return { locale: match, direction: gradingFor(match).direction };
}

export function gradeHtml(path: string, html: string, rules: Rule[] = RULES): Violation[] {
  const { locale, direction } = localeForPath(path);
  const { document } = parseHTML(html);
  // `localeForPath` deliberately still returns only locale+direction: it answers
  // "which page is this", and the digit set is looked up from the same table.
  const doc: Doc = {
    path,
    document: document as unknown as Document,
    locale,
    direction,
    digits: gradingFor(locale).digits,
    calendar: gradingFor(locale).calendar,
  };
  return rules.flatMap((r) => r.run(doc));
}

/**
 * WHAT FRACTION OF THIS DOCUMENT THE GATE ACTUALLY READ.
 *
 * ═══ WHY A GATE SHOULD PUBLISH ITS OWN SCOPE ════════════════════════════════
 *
 * "524 documents graded, 0 violations" is a true sentence that invites a false
 * conclusion. `data-lumo-latn` exempts whole subtrees from the digit and script
 * rules — legitimately, because the dominant one is shiki code listings, which
 * really are Latin. But this is a documentation site made largely OF source
 * code, so the exempt fraction is not small, and nothing in the output said so.
 *
 * Measured before this existed, across the 260 Persian documents:
 *
 *     text nodes   145,448 of 172,999   84.1% ungraded
 *     characters 1,844,825 of 2,318,717  79.6% ungraded
 *
 * Neither number is wrong and neither is a defect. What was wrong is that a
 * reader of the summary line could not have guessed either of them, and this
 * repository's own standard is that an ungraded page is an unprotected page.
 *
 * ═══ WHY THIS IS NOT A RULE ═════════════════════════════════════════════════
 *
 * There is no threshold to fail at. An exempt fraction of 80% is correct for a
 * docs site and would be alarming for a product; the number's job is to be SEEN
 * by someone who knows which they are looking at, not to be compared against a
 * constant nobody can justify. A rule here would either never fire or fire
 * always, and both teach people to ignore the output.
 *
 * So it prints, and printing is the whole feature: it is the only line in this
 * tool that can tell you about a defect nobody has thought of yet.
 */
export interface Coverage {
  /** Documents whose locale the digit rules actually grade. */
  gradedLocaleDocs: number;
  textNodes: number;
  exemptTextNodes: number;
  characters: number;
  exemptCharacters: number;
}

const EMPTY_COVERAGE: Coverage = {
  gradedLocaleDocs: 0,
  textNodes: 0,
  exemptTextNodes: 0,
  characters: 0,
  exemptCharacters: 0,
};

/**
 * Adds one document's text-node census to a running total.
 *
 * Counts only documents whose locale the digit rules grade — a `latn` locale
 * has nothing to exempt, so folding English pages in would dilute the fraction
 * toward zero and make the exemption look smaller than it is.
 *
 * `closest("[data-lumo-latn]")` is the same test the rules themselves apply
 * (`rules.ts`, twice), deliberately: a census that used a different definition
 * of "exempt" would report a coverage the gate does not actually have.
 */
export function addCoverage(into: Coverage, path: string, html: string): Coverage {
  const { locale } = localeForPath(path);
  // `.numberingSystem`, NOT the DigitSystem object. The first cut compared the
  // object to the string "latn", which is never true — so every English page
  // counted as Persian and the printed fraction was computed over twice the
  // real corpus. A scope line that is itself miscounted is worse than none.
  if (gradingFor(locale).digits.numberingSystem === "latn") return into;

  const { document } = parseHTML(html);
  const walker = (document as unknown as Document).createTreeWalker(
    (document as unknown as Document).body ?? (document as unknown as Document),
    // NodeFilter.SHOW_TEXT
    4,
  );
  let nodes = 0;
  let exemptNodes = 0;
  let chars = 0;
  let exemptChars = 0;
  for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
    const text = n.nodeValue ?? "";
    if (text.trim() === "") continue;
    const parent = n.parentElement;
    // `<script>` and `<style>` are not read by anyone, and counting them would
    // credit the gate with ignoring bytes it was never asked to grade.
    const tag = parent?.tagName?.toLowerCase();
    if (tag === "script" || tag === "style") continue;
    const exempt = parent?.closest?.("[data-lumo-latn]") != null;
    nodes += 1;
    chars += text.length;
    if (exempt) {
      exemptNodes += 1;
      exemptChars += text.length;
    }
  }
  return {
    gradedLocaleDocs: into.gradedLocaleDocs + 1,
    textNodes: into.textNodes + nodes,
    exemptTextNodes: into.exemptTextNodes + exemptNodes,
    characters: into.characters + chars,
    exemptCharacters: into.exemptCharacters + exemptChars,
  };
}

export { EMPTY_COVERAGE };

/** The scope line, printed beside the violation count. */
export function formatCoverage(c: Coverage, flooredRoutes: number): string {
  if (c.gradedLocaleDocs === 0) return "";
  const pct = (part: number, whole: number) =>
    whole === 0 ? "0.0" : ((part / whole) * 100).toFixed(1);
  return [
    `  scope — of ${String(c.gradedLocaleDocs)} document(s) in a non-latn locale:`,
    `    ${pct(c.exemptTextNodes, c.textNodes)}% of text nodes and ` +
      `${pct(c.exemptCharacters, c.characters)}% of characters are exempt ` +
      `(data-lumo-latn), so the digit and script rules did not read them`,
    `    persian-digit-floor armed on ${String(flooredRoutes)} of ` +
      `${String(c.gradedLocaleDocs)} route(s)`,
  ].join("\n");
}

export function format(violations: Violation[]): string {
  if (!violations.length) return "  lumo-gate — clean";
  const byRule = new Map<string, Violation[]>();
  for (const v of violations) byRule.set(v.rule, [...(byRule.get(v.rule) ?? []), v]);
  const lines: string[] = [""];
  for (const [rule, vs] of byRule) {
    const why = RULES.find((r) => r.id === rule)?.because ?? "";
    lines.push(`  ${rule} — ${vs.length} violation${vs.length === 1 ? "" : "s"}`);
    if (why) lines.push(`    ${why.replace(/\s+/g, " ")}`);
    for (const v of vs.slice(0, 8)) {
      lines.push(`      ${v.path}: ${v.detail}`);
      if (v.snippet) lines.push(`        ${v.snippet}`);
    }
    if (vs.length > 8) lines.push(`      … and ${vs.length - 8} more`);
    lines.push("");
  }
  return lines.join("\n");
}
