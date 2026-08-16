import { parseHTML } from "linkedom";
import { RULES, digitSystem, scriptSystem } from "./rules.js";
export * from "./rules.js";
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
/**
 * Locales this gate knows how to grade. Every property is stated, none derived
 * (deriving digits from direction made the rules silently Persian-only). Wider
 * than core's `Locale` on purpose: `ar-SA` proves the parametrisation is real.
 */
const KNOWN = {
    "fa-IR": { direction: "rtl", digits: ARABEXT, calendar: "persian", script: ARABIC_SCRIPT },
    "ar-SA": { direction: "rtl", digits: ARAB, calendar: "islamic-umalqura", script: ARABIC_SCRIPT },
    "en-US": { direction: "ltr", digits: LATN, calendar: "gregory", script: LATIN_SCRIPT },
};
/** The locales `localeForPath` will accept. Used by the gate's own self-test. */
export function knownLocales() {
    return Object.keys(KNOWN);
}
/** How a locale is graded. Throws rather than defaulting to another locale's digits. */
export function gradingFor(locale) {
    const grading = KNOWN[locale];
    if (!grading) {
        throw new Error(`No grading rules for locale ${JSON.stringify(locale)}. Add it to KNOWN in ` +
            `packages/gate/src/index.ts with its direction AND its numbering system — ` +
            `a locale graded against another locale's digits reports green on defects.`);
    }
    return grading;
}
/** Derives the expected locale from a route path. Strict: an unrecognised route is an ERROR, not a skip. */
export function localeForPath(path, 
/** Root documents (`404.html`, entry stub) are NOT skipped: graded as this locale. */
rootLocale = "fa-IR") {
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
    const match = segments
        .map((seg) => Object.keys(KNOWN).find((l) => l === seg || l.split("-")[0] === seg))
        .find(Boolean);
    if (!match) {
        throw new Error(`Cannot derive a locale from route ${JSON.stringify(path)}. Every page must carry ` +
            `a locale segment (${Object.keys(KNOWN).join(", ")}) so the gate can grade it. ` +
            `An ungraded page is an unprotected page.`);
    }
    return { locale: match, direction: gradingFor(match).direction };
}
export function gradeHtml(path, html, rules = RULES) {
    const { locale, direction } = localeForPath(path);
    const { document } = parseHTML(html);
    const doc = {
        path,
        document: document,
        locale,
        direction,
        digits: gradingFor(locale).digits,
        calendar: gradingFor(locale).calendar,
        script: gradingFor(locale).script,
    };
    return rules.flatMap((r) => r.run(doc));
}
const EMPTY_COVERAGE = {
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
export function addCoverage(into, path, html) {
    const { locale } = localeForPath(path);
    // `.numberingSystem`, NOT the DigitSystem object — comparing the object to
    // "latn" is never true, and every English page then counts as Persian.
    if (gradingFor(locale).digits.numberingSystem === "latn")
        return into;
    const { document } = parseHTML(html);
    const walker = document.createTreeWalker(document.body ?? document, 
    // NodeFilter.SHOW_TEXT
    4);
    let nodes = 0;
    let exemptNodes = 0;
    let chars = 0;
    let exemptChars = 0;
    for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        const text = n.nodeValue ?? "";
        if (text.trim() === "")
            continue;
        const parent = n.parentElement;
        // `<script>` and `<style>` are not read by anyone.
        const tag = parent?.tagName?.toLowerCase();
        if (tag === "script" || tag === "style")
            continue;
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
export function countNativeDigits(path, html) {
    const { locale } = localeForPath(path);
    const digits = gradingFor(locale).digits;
    if (digits.numberingSystem === "latn")
        return 0;
    const { document } = parseHTML(html);
    const walker = document.createTreeWalker(document.body ?? document, 4);
    let count = 0;
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const parent = node.parentElement;
        const tag = parent?.tagName?.toLowerCase();
        if (tag === "script" || tag === "style" || parent?.closest?.("[data-lumo-latn]"))
            continue;
        count += (node.nodeValue?.match(digits.pattern) ?? []).length;
    }
    return count;
}
/**
 * The executable sampling policy for the per-route digit-floor ledger: every
 * non-Latin route with at least `threshold` visible native digits must have a
 * committed floor. The threshold sits above the shared docs chrome (~23 digits/page).
 */
export function missingDenseDigitFloors(pages, floors, threshold = 30) {
    return pages.flatMap((page) => {
        if (Object.hasOwn(floors, page.path))
            return [];
        const found = countNativeDigits(page.path, page.html);
        return found >= threshold ? [{ path: page.path, found }] : [];
    });
}
export { EMPTY_COVERAGE };
/** The scope line, printed beside the violation count. */
export function formatCoverage(c, flooredRoutes) {
    if (c.gradedLocaleDocs === 0)
        return "";
    const pct = (part, whole) => whole === 0 ? "0.0" : ((part / whole) * 100).toFixed(1);
    return [
        `  scope — of ${String(c.gradedLocaleDocs)} document(s) in a non-latn locale:`,
        `    ${pct(c.exemptTextNodes, c.textNodes)}% of text nodes and ` +
            `${pct(c.exemptCharacters, c.characters)}% of characters are exempt ` +
            `(data-lumo-latn), so the digit and visible-text rules did not read them`,
        `    persian-digit-floor armed on ${String(flooredRoutes)} of ` +
            `${String(c.gradedLocaleDocs)} route(s)`,
    ].join("\n");
}
export function format(violations) {
    if (!violations.length)
        return "  lumo-gate — clean";
    const byRule = new Map();
    for (const v of violations)
        byRule.set(v.rule, [...(byRule.get(v.rule) ?? []), v]);
    const lines = [""];
    for (const [rule, vs] of byRule) {
        const why = RULES.find((r) => r.id === rule)?.because ?? "";
        lines.push(`  ${rule} — ${vs.length} violation${vs.length === 1 ? "" : "s"}`);
        if (why)
            lines.push(`    ${why.replace(/\s+/g, " ")}`);
        for (const v of vs.slice(0, 8)) {
            lines.push(`      ${v.path}: ${v.detail}`);
            if (v.snippet)
                lines.push(`        ${v.snippet}`);
        }
        if (vs.length > 8)
            lines.push(`      … and ${vs.length - 8} more`);
        lines.push("");
    }
    return lines.join("\n");
}
