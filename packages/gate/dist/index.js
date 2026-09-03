import { parseHTML } from "linkedom";
import { LATN_HATCH, RULES, digitSystem, scriptSystem } from "./rules.js";
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
/*
 * The no-`Intl.Locale` fallback (Hermes). Checked against ICU tag by tag:
 * `ku` came OUT — bare `ku` is Kurmanji, Latin script, and `ckb` already
 * carries Sorani — and `prs` (Dari) went IN. `packages/mobile/lib/src/scope.dart`
 * holds the same set, and `direction_agreement_test.dart` reads THIS LINE to
 * pin them together.
 */
const RTL_PRIMARY = new Set(["ar", "arc", "az-arab", "ckb", "dv", "fa", "he", "iw", "khw", "ks", "nqo", "pa-arab", "prs", "ps", "rhg", "sd", "syr", "ug", "ur", "uz-arab", "yi"]);
/**
 * Direction, from the platform — the same question `core`'s `direction()` asks.
 *
 * This used to read `RTL_PRIMARY.has(primary)`, and the table and `core`
 * DISAGREED on four tags: the gate called `ku` RTL where ICU calls it LTR
 * (bare `ku` is Kurmanji, Latin script), and called `az-Arab`, `pa-Arab` and
 * `uz-Arab` LTR because the set is keyed by PRIMARY SUBTAG and its `az-arab`,
 * `pa-arab`, `uz-arab` entries were therefore unreachable.
 *
 * That is not a difference of opinion, it is a contradiction: `LumoHtml` writes
 * `dir` from `core.direction()`, and `lang-dir` then graded it against this
 * table — so the gate failed a page Lumo itself rendered. Every other field in
 * this profile is derived from CLDR; direction is now too, and
 * `direction-agreement.test.ts` pins the two together so they cannot drift
 * apart again.
 *
 * The table survives as the fallback for a runtime with no `Intl.Locale` —
 * Hermes, the case `core`'s own comment documents — and now matches on the
 * `language-script` form as well, so its Arabic-script entries are reachable.
 */
function directionFor(tag, primary) {
    try {
        const info = new Intl.Locale(tag).getTextInfo?.();
        if (info?.direction === "rtl" || info?.direction === "ltr")
            return info.direction;
    }
    catch {
        // no Intl.Locale, or a tag it refuses: fall through to the table
    }
    const lower = tag.toLowerCase();
    const script = lower.split("-").slice(0, 2).join("-");
    return RTL_PRIMARY.has(primary) || RTL_PRIMARY.has(script) ? "rtl" : "ltr";
}
const DIGIT_NAMES = { latn: "Latin", arab: "Arabic-Indic", arabext: "Persian", deva: "Devanagari", beng: "Bengali", thai: "Thai", mymr: "Myanmar", tibt: "Tibetan", khmr: "Khmer", laoo: "Lao", guru: "Gurmukhi", gujr: "Gujarati", orya: "Odia", taml: "Tamil", telu: "Telugu", knda: "Kannada", mlym: "Malayalam", hanidec: "Han decimal", fullwide: "Full-width", adlm: "Adlam", nkoo: "N'Ko" };
/** ISO 15924 script code (from `Intl.Locale.maximize`) → Unicode Script property values that WRITE it. */
const SCRIPT_BY_CODE = {
    Latn: ["Latin", "Latin"], Arab: ["Arabic", "Arabic"], Cyrl: ["Cyrillic", "Cyrillic"], Hebr: ["Hebrew", "Hebrew"],
    Grek: ["Greek", "Greek"], Deva: ["Devanagari", "Devanagari"], Beng: ["Bengali", "Bengali"], Thai: ["Thai", "Thai"],
    Hans: ["Han", "Han"], Hant: ["Han", "Han"], Jpan: ["Japanese", "Han", "Hiragana", "Katakana"], Kore: ["Korean", "Hangul", "Han"],
    Armn: ["Armenian", "Armenian"], Geor: ["Georgian", "Georgian"], Ethi: ["Ethiopic", "Ethiopic"], Khmr: ["Khmer", "Khmer"],
    Sinh: ["Sinhala", "Sinhala"], Taml: ["Tamil", "Tamil"], Telu: ["Telugu", "Telugu"], Knda: ["Kannada", "Kannada"],
    Mlym: ["Malayalam", "Malayalam"], Gujr: ["Gujarati", "Gujarati"], Guru: ["Gurmukhi", "Gurmukhi"], Orya: ["Oriya", "Oriya"],
    Mymr: ["Myanmar", "Myanmar"], Laoo: ["Lao", "Lao"], Tibt: ["Tibetan", "Tibetan"], Mong: ["Mongolian", "Mongolian"],
    Syrc: ["Syriac", "Syriac"], Thaa: ["Thaana", "Thaana"], Nkoo: ["N'Ko", "Nko"], Tfng: ["Tifinagh", "Tifinagh"], Cans: ["Canadian Aboriginal", "Canadian_Aboriginal"],
};
const derived = new Map();
function deriveGrading(locale) {
    const cached = derived.get(locale);
    if (cached)
        return cached;
    let canonical;
    try {
        canonical = Intl.getCanonicalLocales(locale)[0] ?? locale;
    }
    catch {
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
        throw new Error(`No script known for locale ${JSON.stringify(locale)} (ISO 15924 ${JSON.stringify(scriptCode)}). ` +
            `Add it to SCRIPT_BY_CODE in packages/gate/src/index.ts — a locale graded against another script's text reports green on defects.`);
    }
    const [scriptName, ...properties] = scriptDef;
    const grading = {
        direction: directionFor(locale, primary),
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
export function gradingFor(locale) {
    return KNOWN[locale] ?? deriveGrading(locale);
}
export function localeForPath(path, 
/** Root documents (`404.html`, entry stub) are NOT skipped: graded as this locale. */
rootLocale = "fa-IR", 
/** The document's `<html lang>`, when the caller has parsed it — refines a non-built-in segment. */
htmlLang, 
/**
 * THE APP'S OWN LOCALES, when it declares them (`@locales` in the floors file).
 *
 * Guessing which segment is a locale has a floor. `isLanguageTag` asks ICU
 * whether a code is ASSIGNED, which fixed `/how`, `/map` and `/api` — and
 * cannot fix `/pro`, because `pro` IS assigned: Old Provençal. A pricing page
 * was graded as that locale and failed `lang-dir` for declaring `en`.
 *
 * Nothing in a PATH distinguishes a product route from a rare language. The
 * app knows, so when it says, the guess never runs: a segment is a locale if
 * and only if it is in this set (by full tag or primary subtag). Absent, the
 * behaviour is exactly the old one.
 */
declared) {
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
    if (declared !== undefined) {
        // Exhaustive: the declaration replaces every guess below it.
        const primary = (tag) => tag.toLowerCase().split("-")[0];
        const hit = segments.find((seg) => declared.has(seg) || Array.from(declared).some((d) => primary(d) === primary(seg) && /^[a-z]{2,3}$/i.test(seg)));
        if (hit !== undefined) {
            const tag = declared.has(hit) ? hit : (Array.from(declared).find((d) => primary(d) === primary(hit)) ?? hit);
            /*
             * A BARE declared tag refines to the built-in profile with the same
             * language, exactly as the guessing path below does — because the
             * profiles are what carry the digits and the calendar, and ICU's default
             * for a bare tag is not always the product's. `new Intl.NumberFormat("ar")`
             * resolves to LATIN digits (CLDR changed the bare-`ar` default), while
             * `ar-SA` is Arabic-Indic. 0.5.0 returned the declared tag verbatim, so
             * an app declaring `["ar"]` had its Arabic pages graded as Latin-digit
             * pages; the committed digit floors caught it — "expected at least 88
             * Latin digits, found 0" — on the first consumer to declare.
             */
            const known = Object.keys(KNOWN).find((l) => l === tag || (!tag.includes("-") && l.split("-")[0] === tag));
            if (known !== undefined)
                return { locale: known, direction: gradingFor(known).direction };
            const lang = htmlLang !== undefined && primary(htmlLang) === primary(tag) ? htmlLang : tag;
            return { locale: lang, direction: gradingFor(lang).direction };
        }
        throw new Error(`Cannot derive a locale from route ${JSON.stringify(path)}: no segment is one of the declared locales ` +
            `[${Array.from(declared).join(", ")}]. Declare it in @locales, or stage the document under one — ` +
            `an ungraded page is an unprotected page.`);
    }
    const known = segments
        .map((seg) => Object.keys(KNOWN).find((l) => l === seg || l.split("-")[0] === seg))
        .find(Boolean);
    if (known)
        return { locale: known, direction: gradingFor(known).direction };
    // Any other language: a segment shaped like a BCP-47 tag (`de`, `de-CH`,
    // `zh-Hant-TW`, `sr-Latn`). The document's own `<html lang>` refines it when
    // it agrees on the language (`/de/…` serving `lang="de-AT"` grades as de-AT).
    const TAG = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?$/;
    const candidate = segments.find((seg) => TAG.test(seg) && isLanguageTag(seg));
    if (candidate) {
        const lang = htmlLang !== undefined && isLanguageTag(htmlLang) && htmlLang.toLowerCase().split("-")[0] === candidate.toLowerCase().split("-")[0] ? htmlLang : candidate;
        return { locale: lang, direction: gradingFor(lang).direction };
    }
    throw new Error(`Cannot derive a locale from route ${JSON.stringify(path)}. Every page must carry ` +
        `a locale segment (a BCP-47 tag such as ${Object.keys(KNOWN).join(", ")}, de, ar-EG) so the gate can grade it. ` +
        `An ungraded page is an unprotected page.`);
}
/**
 * A route segment names a language.
 *
 * `Intl.getCanonicalLocales` alone is a SYNTAX check, and BCP-47's grammar is
 * wide: every well-formed 2-3 letter subtag passes, assigned or not. That made
 * ordinary route names into locales — one consumer serves `/how`, which
 * canonicalises happily, maximises to the Han script, and took the whole run
 * down with "No script known for locale \"how\"". `/map`, `/job`, `/web`,
 * `/api`, `/tax`, `/pay`, `/day` and `/sea` were all one route away from the
 * same thing.
 *
 * So the code must also be ASSIGNED. `Intl.DisplayNames` with
 * `fallback: "none"` returns undefined for a subtag ICU has no language for,
 * which is exactly the distinction the syntax check cannot make.
 *
 * KNOWN RESIDUE, deliberately not chased: a handful of real language codes are
 * also common English words — `new` (Newari), `car` (Carib), `man` (Mandingo),
 * `war` (Waray), `sun` (Sundanese). A route named for one of those is still
 * read as a locale segment. Closing that needs the document's own `<html lang>`
 * to confirm the segment, which is a change to what the ROUTE-is-the-oracle
 * rule means and wants its own decision.
 */
function isLanguageTag(tag) {
    try {
        if (Intl.getCanonicalLocales(tag).length !== 1)
            return false;
        return LANGUAGE_NAMES.of(new Intl.Locale(tag).language) !== undefined;
    }
    catch {
        return false;
    }
}
/** Built once: `Intl.DisplayNames` is expensive to construct per call. */
const LANGUAGE_NAMES = new Intl.DisplayNames(["en"], { type: "language", fallback: "none" });
export function gradeHtml(path, html, rules = RULES, options = {}) {
    const { document } = parseHTML(html);
    /*
     * React STREAMING normalisation (§50.5, found on first product contact).
     *
     * A streamed Next.js document ships the real page inside
     * `<div hidden id="S:0">` and reveals it with the inline `$RC` script when the
     * Suspense boundary resolves — the served bytes show a skeleton, and the
     * content arrives hidden, later in the same document. That container is THE
     * PAGE ARRIVING EARLY, not hidden UI: every hydrated reader gets it.
     *
     * Nine rules skip `closest('[hidden]')` subtrees — correctly, for genuinely
     * hidden UI. Unnormalised, that skip silently exempted every announced string
     * inside every streamed segment: on an insurance product, a live
     * `aria-label="مرحله 1 از ۳"` (a Latin digit a Persian reader hears) graded
     * clean on all 51 routes, while the visible-text branch — which never
     * honoured `hidden` — flagged the same string one element over. Two branches,
     * two policies, and both wrong in one direction each.
     *
     * So the streamed container's `hidden` is removed BEFORE rules run, in one
     * place. The id convention is React's own (`S:` + boundary index); the empty
     * placeholder stubs and any genuinely `hidden` subtree keep their skip.
     * Lumo's static export contains zero such containers, verified the day this
     * landed — this exists for the PRODUCT apps the gate is pointed at.
     */
    for (const el of Array.from(document.querySelectorAll('[hidden]'))) {
        if (/^S:\d/.test(el.getAttribute("id") ?? ""))
            el.removeAttribute("hidden");
    }
    const htmlLang = document.documentElement?.getAttribute("lang") ?? undefined;
    const { locale, direction } = localeForPath(path, undefined, htmlLang, options.declaredLocales);
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
 * dilute the fraction). `closest(LATN_HATCH)` is the same test the rules
 * apply. Describes the digit and visible-text rules, NOT `native-script-name`,
 * which grades a computed name and has no text-node denominator.
 */
export function addCoverage(into, path, html, options = {}) {
    const { document } = parseHTML(html);
    const { locale } = localeForPath(path, undefined, document.documentElement?.getAttribute("lang") ?? undefined, options.declaredLocales);
    // `.numberingSystem`, NOT the DigitSystem object — comparing the object to
    // "latn" is never true, and every English page then counts as Persian.
    if (gradingFor(locale).digits.numberingSystem === "latn")
        return into;
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
        const exempt = parent?.closest?.(LATN_HATCH) != null;
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
export function countNativeDigits(path, html, options = {}) {
    const { document } = parseHTML(html);
    const { locale } = localeForPath(path, undefined, document.documentElement?.getAttribute("lang") ?? undefined, options.declaredLocales);
    const digits = gradingFor(locale).digits;
    if (digits.numberingSystem === "latn")
        return 0;
    const walker = document.createTreeWalker(document.body ?? document, 4);
    let count = 0;
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const parent = node.parentElement;
        const tag = parent?.tagName?.toLowerCase();
        if (tag === "script" || tag === "style" || parent?.closest?.(LATN_HATCH))
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
export function missingDenseDigitFloors(pages, floors, threshold = 30, options = {}) {
    return pages.flatMap((page) => {
        if (Object.hasOwn(floors, page.path))
            return [];
        const found = countNativeDigits(page.path, page.html, options);
        return found >= threshold ? [{ path: page.path, found }] : [];
    });
}
/**
 * The anti-vacuity pair for `data-lumo-latn`, and the reason it exists is one
 * measurement: a Persian page carrying ten real violations — Latin digits in
 * visible text, an English `aria-label`, a Latin-only run of prose — drops to
 * ONE when a single `data-lumo-latn` is placed on a wrapper around it. Nine
 * silenced by one attribute.
 *
 * `latn-island-purity` does not catch that, and is not meant to: it fails an
 * island holding mostly READER-SCRIPT text, i.e. someone hiding Persian prose.
 * An island hiding LATIN defects is pure by that test, and Latin defects are
 * precisely what the other rules exist to find.
 *
 * So the exemption needs the same treatment the digit count needed. "Zero
 * violations" passes trivially on a page that is entirely exempt, exactly as
 * "zero Latin digits" passes trivially on a page with no numbers, and the
 * answer is the same one: not an absolute threshold — there genuinely is none,
 * a docs site full of code listings is legitimately more exempt than a product
 * — but a REVIEWED BASELINE that a human committed and that may only fall.
 *
 * OPT-IN. A site with no ceiling in its floors file keeps today's behaviour
 * exactly: the scope line prints and nothing fails. That was a deliberate
 * decision and it stays available; this gives a site the option to hold the
 * line rather than replacing the choice.
 */
export function exceedsExemptCeiling(c, ceiling) {
    if (ceiling === undefined || c.characters === 0)
        return undefined;
    const fraction = (c.exemptCharacters / c.characters) * 100;
    // One decimal, because that is what the scope line prints — a ceiling a
    // reader cannot compare against the reported number is a ceiling they will
    // raise rather than investigate.
    const rounded = Math.round(fraction * 10) / 10;
    return rounded > ceiling ? { fraction: rounded, ceiling } : undefined;
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
