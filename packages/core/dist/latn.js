/*
 * A RUN THAT IS LATIN BY NATURE, ON A PAGE THAT IS NOT.
 *
 * Every product ends up with the same handful of runs it cannot transliterate
 * without breaking them — a wordmark, a mailbox, a hostname, a phone number, a
 * standards citation like «ISO 27001», a unit like «Mt/year». lumo-gate's
 * `native-script-text` and `native-script-name` read each as an untranslated
 * string, which is the right default for prose and the wrong one for a name.
 * `data-lumo-latn` is the ONLY exemption the gate honours: not `lang="en"`, not
 * `dir="ltr"`, because both are too easy to use as an excuse for not translating.
 *
 * The pure half lives here, React-free, so an Astro site or the gate's own
 * tests can call `isLatinRun` without a renderer. The components are in
 * `latn.tsx` and are a thin JSX layer over these functions.
 *
 * This module existed three times before it existed here — hand-copied into
 * three separate consumer apps — and two of the three copies were wrong in
 * the same way: they tested `\p{Script=Arabic}`, and Persian DIGITS live inside
 * the Arabic block, so «۹۰ Mt/year» read as native, was never marked, and the
 * gate failed it anyway. One copy got fixed; the other two shipped the bug. A
 * helper that has to agree with the gate belongs beside the gate.
 *
 * The test is therefore not "is there an Arabic character" but "is there any
 * LETTER that is not Latin". That is exactly the gate's own question, for every
 * script Lumo grades — Arabic, Cyrillic, Han, Hebrew, Devanagari — and it is
 * what keeps `latn-island-purity` quiet: an island that holds no reader-script
 * letter is a pure island by definition.
 *
 * The attribute is emitted as `data-lumo-latn=""` — the same bytes `latnAttrs`
 * spreads — so there is one serialisation of the marker, not React's `"true"`
 * beside a spread's `""`.
 *
 * Deliberately NO `dir` and NO class by default. A bare inline `<span>` around a
 * Latin run inside RTL text renders exactly as the bare text did, so marking
 * changes what the gate reads and nothing a reader sees. `ltr` is opt-in for the
 * case it genuinely improves — a phone number whose leading «+» the bidi
 * algorithm would otherwise put at the wrong end — because that IS a visual
 * change, and a helper should not smuggle one in.
 */
/** A letter in any script other than Latin. Digits, punctuation and space do not count. */
const NON_LATIN_LETTER = /(?=\p{L})[^\p{Script=Latin}]/u;
/**
 * True when nothing in `text` is a non-Latin letter — so it may be declared a
 * Latin island without lying. Persian digits, ASCII digits, punctuation and Latin
 * letters all keep this true; a single «ر» or «д» or «字» makes it false.
 *
 * Tested on the STRING, never on which slot produced it: the same slot holds
 * "Acme" on one product and «آکمه» on another, and marking a Persian run as a
 * Latin island would rightly trip `latn-island-purity`.
 */
export function isLatinRun(text) {
    return !NON_LATIN_LETTER.test(text);
}
/**
 * The same decision for a run that lives in an ATTRIBUTE — `alt`, `aria-label`,
 * `title`, `placeholder`. Those cannot be wrapped, and the gate reads them as the
 * accessible name, so the marker goes ON the element: `closest()` matches self.
 *
 *     <Image alt={name} {...latnAttrs(name)} />
 */
export function latnAttrs(text) {
    return isLatinRun(text) ? { "data-lumo-latn": "" } : {};
}
/**
 * The attribute form for rich-text callbacks, where the chunk arrives already
 * isolated in its own element — next-intl's `t.rich("…", { b: chunks => … })`.
 * A string chunk, or an array of string chunks, is tested; anything else (an
 * element) cannot be judged and is left unmarked.
 */
export function latnNodeAttrs(chunks) {
    const text = typeof chunks === "string"
        ? chunks
        : Array.isArray(chunks) && chunks.every((c) => typeof c === "string")
            ? chunks.join("")
            : "";
    return text !== "" && isLatinRun(text) ? { "data-lumo-latn": "" } : {};
}
/**
 * The same copy with the `[[…]]` markers removed, for anywhere a string is used
 * as TEXT rather than markup — `<title>`, `og:title`, JSON-LD, an `alt`. Missing
 * one is visible in the browser tab and on every social card, which is where it
 * was first found.
 */
export function plain(text) {
    return text.replace(/\[\[(.+?)\]\]/g, "$1");
}
