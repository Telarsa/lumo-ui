import { parseHTML } from "linkedom";
import { RULES, digitSystem, scriptSystem, type DigitSystem, type Doc, type Rule, type ScriptSystem, type Violation } from "./rules.ts";

export * from "./rules.ts";

/**
 * The digit sets, one per numbering system rather than one per locale. `name`
 * is what a violation message calls them; "Persian" keeps `fa-IR` messages byte-identical.
 */
const ARABEXT = digitSystem("Persian", "arabext", "۰"); // U+06F0–U+06F9
const ARAB = digitSystem("Arabic-Indic", "arab", "٠"); //  U+0660–U+0669
const LATN = digitSystem("Latin", "latn", "0"); //         U+0030–U+0039

/**
 * The scripts, one per writing system. `\p{Script=Arabic}` covers Persian and
 * Arabic alike, and the message names the SCRIPT, not the language.
 */
const ARABIC_SCRIPT = scriptSystem("Arabic", "Arabic");
const LATIN_SCRIPT = scriptSystem("Latin", "Latin");

/** Everything the gate needs to know about a locale to grade a page in it. */
export interface LocaleGrading {
  direction: "rtl" | "ltr";
  digits: DigitSystem;
  /**
   * The Unicode calendar its readers count years in. Independent of direction
   * and digits, and data rather than an ICU default (ICU picks GREGORIAN for `ar-SA`).
   */
  calendar: string;
  /** The writing system its readers read. Independent of the other three: nothing about `rtl` implies Arabic script. */
  script: ScriptSystem;
}

/**
 * Locales this gate knows how to grade. Every property is stated, none derived
 * (deriving digits from direction made the rules silently Persian-only). Wider
 * than core's `Locale` on purpose: `ar-SA` proves the parametrisation is real.
 */
const KNOWN: Record<string, LocaleGrading> = {
  "fa-IR": { direction: "rtl", digits: ARABEXT, calendar: "persian", script: ARABIC_SCRIPT },
  "ar-SA": { direction: "rtl", digits: ARAB, calendar: "islamic-umalqura", script: ARABIC_SCRIPT },
  "en-US": { direction: "ltr", digits: LATN, calendar: "gregory", script: LATIN_SCRIPT },
};

/** The locales `localeForPath` will accept. Used by the gate's own self-test. */
export function knownLocales(): string[] {
  return Object.keys(KNOWN);
}

/*
 * ANY LANGUAGE (decision §28, 16 Aug 2026). The explicit table above is the
 * tested tier and always wins; every other BCP-47 tag is graded by a profile
 * DERIVED from the platform's CLDR data — the same source `formatNumber` and
 * `formatDate` draw on, so the gate expects exactly what the components emit:
 *   direction  — CLDR characterOrder by primary subtag (`RTL_PRIMARY`);
 *   digits     — `Intl.NumberFormat(tag).resolvedOptions().numberingSystem`,
 *                the ten digits taken from formatting 0 (never a typed range);
 *   calendar   — `Intl.DateTimeFormat(tag).resolvedOptions().calendar`
 *                (`fa-*` forced to `persian`, as `formatLocale` does);
 *   script     — `Intl.Locale(tag).maximize().script` → Unicode Script value(s).
 * Derived, and said so: a locale whose script this table cannot name is an
 * ERROR, not Latin by default — the failure mode `KNOWN` was written to avoid.
 */
const RTL_PRIMARY = new Set(["ar", "arc", "az-arab", "ckb", "dv", "fa", "he", "iw", "khw", "ks", "ku", "nqo", "pa-arab", "ps", "rhg", "sd", "syr", "ug", "ur", "uz-arab", "yi"]);
const DIGIT_NAMES: Record<string, string> = { latn: "Latin", arab: "Arabic-Indic", arabext: "Persian", deva: "Devanagari", beng: "Bengali", thai: "Thai", mymr: "Myanmar", tibt: "Tibetan", khmr: "Khmer", laoo: "Lao", guru: "Gurmukhi", gujr: "Gujarati", orya: "Odia", taml: "Tamil", telu: "Telugu", knda: "Kannada", mlym: "Malayalam", hanidec: "Han decimal", fullwide: "Full-width", adlm: "Adlam", nkoo: "N'Ko" };
/** ISO 15924 script code (from `Intl.Locale.maximize`) → Unicode Script property values that WRITE it. */
const SCRIPT_BY_CODE: Record<string, [string, string, ...string[]]> = {
  Latn: ["Latin", "Latin"], Arab: ["Arabic", "Arabic"], Cyrl: ["Cyrillic", "Cyrillic"], Hebr: ["Hebrew", "Hebrew"],
  Grek: ["Greek", "Greek"], Deva: ["Devanagari", "Devanagari"], Beng: ["Bengali", "Bengali"], Thai: ["Thai", "Thai"],
  Hans: ["Han", "Han"], Hant: ["Han", "Han"], Jpan: ["Japanese", "Han", "Hiragana", "Katakana"], Kore: ["Korean", "Hangul", "Han"],
  Armn: ["Armenian", "Armenian"], Geor: ["Georgian", "Georgian"], Ethi: ["Ethiopic", "Ethiopic"], Khmr: ["Khmer", "Khmer"],
  Sinh: ["Sinhala", "Sinhala"], Taml: ["Tamil", "Tamil"], Telu: ["Telugu", "Telugu"], Knda: ["Kannada", "Kannada"],
  Mlym: ["Malayalam", "Malayalam"], Gujr: ["Gujarati", "Gujarati"], Guru: ["Gurmukhi", "Gurmukhi"], Orya: ["Oriya", "Oriya"],
  Mymr: ["Myanmar", "Myanmar"], Laoo: ["Lao", "Lao"], Tibt: ["Tibetan", "Tibetan"], Mong: ["Mongolian", "Mongolian"],
  Syrc: ["Syriac", "Syriac"], Thaa: ["Thaana", "Thaana"], Nkoo: ["N'Ko", "Nko"], Tfng: ["Tifinagh", "Tifinagh"], Cans: ["Canadian Aboriginal", "Canadian_Aboriginal"],
};
const derived = new Map<string, LocaleGrading>();

function deriveGrading(locale: string): LocaleGrading {
  const cached = derived.get(locale);
  if (cached) return cached;
  let canonical: string;
  try {
    canonical = Intl.getCanonicalLocales(locale)[0] ?? locale;
  } catch {
    throw new Error(`${JSON.stringify(locale)} is not a BCP-47 language tag; the gate cannot grade it.`);
  }
  const primary = canonical.toLowerCase().split("-")[0] ?? "";
  const nf = new Intl.NumberFormat(canonical, { useGrouping: false });
  const numberingSystem = nf.resolvedOptions().numberingSystem;
  const zero = nf.format(0);
  const digits = digitSystem(DIGIT_NAMES[numberingSystem] ?? numberingSystem, numberingSystem, zero);
  const calendar = primary === "fa" ? "persian" : new Intl.DateTimeFormat(canonical).resolvedOptions().calendar;
  const scriptCode = new Intl.Locale(canonical).maximize().script ?? "";
  const scriptDef = SCRIPT_BY_CODE[scriptCode];
  if (!scriptDef) {
    throw new Error(
      `No script known for locale ${JSON.stringify(locale)} (ISO 15924 ${JSON.stringify(scriptCode)}). ` +
        `Add it to SCRIPT_BY_CODE in packages/gate/src/index.ts — a locale graded against another script's text reports green on defects.`,
    );
  }
  const [scriptName, ...properties] = scriptDef;
  const grading: LocaleGrading = {
    direction: RTL_PRIMARY.has(primary) ? "rtl" : "ltr",
    digits,
    calendar,
    script: scriptSystem(scriptName, properties[0] ?? "Latin", ...properties.slice(1)),
  };
  derived.set(locale, grading);
  return grading;
}

/**
 * How a locale is graded: the explicit table for the locales it names, a
 * CLDR-derived profile for any other tag. Throws for a tag that is not a
 * language, or whose script the gate cannot name — never another locale's digits.
 */
export function gradingFor(locale: string): LocaleGrading {
  return KNOWN[locale] ?? deriveGrading(locale);
}

/** Derives the expected locale from a route path. Strict: an unrecognised route is an ERROR, not a skip. */
export function localeForPath(
  path: string,
  /** Root documents (`404.html`, entry stub) are NOT skipped: graded as this locale. */
  rootLocale: string = "fa-IR",
  /** The document's `<html lang>`, when the caller has parsed it — refines a non-built-in segment. */
  htmlLang?: string,
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
  // The locale may be any segment, not only the first (/view/<locale>/<slug>/).
  const segments = clean.split("/");
  const known = segments
    .map((seg) => Object.keys(KNOWN).find((l) => l === seg || l.split("-")[0] === seg))
    .find(Boolean);
  if (known) return { locale: known, direction: gradingFor(known).direction };
  // Any other language: a segment shaped like a BCP-47 tag (`de`, `de-CH`,
  // `zh-Hant-TW`, `sr-Latn`). The document's own `<html lang>` refines it when
  // it agrees on the language (`/de/…` serving `lang="de-AT"` grades as de-AT).
  const TAG = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?$/;
  const candidate = segments.find((seg) => TAG.test(seg) && isLanguageTag(seg));
  if (candidate) {
    const lang = htmlLang !== undefined && isLanguageTag(htmlLang) && htmlLang.toLowerCase().split("-")[0] === candidate.toLowerCase().split("-")[0] ? htmlLang : candidate;
    return { locale: lang, direction: gradingFor(lang).direction };
  }
  throw new Error(
    `Cannot derive a locale from route ${JSON.stringify(path)}. Every page must carry ` +
      `a locale segment (a BCP-47 tag such as ${Object.keys(KNOWN).join(", ")}, de, ar-EG) so the gate can grade it. ` +
      `An ungraded page is an unprotected page.`,
  );
}

function isLanguageTag(tag: string): boolean {
  try {
    return Intl.getCanonicalLocales(tag).length === 1;
  } catch {
    return false;
  }
}

export function gradeHtml(path: string, html: string, rules: Rule[] = RULES): Violation[] {
  const { document } = parseHTML(html);
  const htmlLang = (document as unknown as Document).documentElement?.getAttribute("lang") ?? undefined;
  const { locale, direction } = localeForPath(path, undefined, htmlLang);
  const doc: Doc = {
    path,
    document: document as unknown as Document,
    locale,
    direction,
    digits: gradingFor(locale).digits,
    calendar: gradingFor(locale).calendar,
    script: gradingFor(locale).script,
  };
  return rules.flatMap((r) => r.run(doc));
}

/**
 * What fraction of a document the gate actually read. `data-lumo-latn` exempts
 * whole subtrees (measured: ~80% of a docs site's characters), and a summary
 * line that hides that invites a false conclusion. Not a rule — there is no
 * threshold to fail at — it prints, and printing is the whole feature.
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
 * Adds one document's text-node census to a running total. Counts only
 * documents whose locale the digit rules grade (folding `latn` pages in would
 * dilute the fraction). `closest("[data-lumo-latn]")` is the same test the rules
 * apply. Describes the digit and visible-text rules, NOT `native-script-name`,
 * which grades a computed name and has no text-node denominator.
 */
export function addCoverage(into: Coverage, path: string, html: string): Coverage {
  const { document } = parseHTML(html);
  const { locale } = localeForPath(path, undefined, (document as unknown as Document).documentElement?.getAttribute("lang") ?? undefined);
  // `.numberingSystem`, NOT the DigitSystem object — comparing the object to
  // "latn" is never true, and every English page then counts as Persian.
  if (gradingFor(locale).digits.numberingSystem === "latn") return into;

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
    // `<script>` and `<style>` are not read by anyone.
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

/** Counts visible, non-exempt digits in the route's numbering system — the same corpus the digit rules inspect. */
export function countNativeDigits(path: string, html: string): number {
  const { document } = parseHTML(html);
  const { locale } = localeForPath(path, undefined, (document as unknown as Document).documentElement?.getAttribute("lang") ?? undefined);
  const digits = gradingFor(locale).digits;
  if (digits.numberingSystem === "latn") return 0;

  const walker = (document as unknown as Document).createTreeWalker(
    (document as unknown as Document).body ?? (document as unknown as Document),
    4,
  );
  let count = 0;
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const parent = node.parentElement;
    const tag = parent?.tagName?.toLowerCase();
    if (tag === "script" || tag === "style" || parent?.closest?.("[data-lumo-latn]")) continue;
    count += (node.nodeValue?.match(digits.pattern) ?? []).length;
  }
  return count;
}

/**
 * The executable sampling policy for the per-route digit-floor ledger: every
 * non-Latin route with at least `threshold` visible native digits must have a
 * committed floor. The threshold sits above the shared docs chrome (~23 digits/page).
 */
export function missingDenseDigitFloors(
  pages: ReadonlyArray<{ path: string; html: string }>,
  floors: Readonly<Record<string, number>>,
  threshold = 30,
): Array<{ path: string; found: number }> {
  return pages.flatMap((page) => {
    if (Object.hasOwn(floors, page.path)) return [];
    const found = countNativeDigits(page.path, page.html);
    return found >= threshold ? [{ path: page.path, found }] : [];
  });
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
      `(data-lumo-latn), so the digit and visible-text rules did not read them`,
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
