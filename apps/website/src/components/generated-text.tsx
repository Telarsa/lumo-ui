import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";

/**
 * GENERATED localized prose, with its Latin identifiers islanded.
 *
 * Hand-authored copy marks its own foreign runs: an author writing «مقدار
 * بیرونی همیشه E.164 است» wraps `E.164` themselves, because a Latin run inside
 * a Persian sentence needs bidi isolation, and a run carrying ASCII digits is a
 * `no-latin-digits` violation until it is declared. Copy that arrives from a
 * GENERATOR cannot do that: `mobile-demos.generated.json` carries plain strings
 * with nowhere to put markup, and the generator has no business emitting HTML.
 *
 * So the marking happens HERE, on exactly one shape: a run that STARTS WITH an
 * ASCII letter (`E.164`, `use24Hour`, `defaultCountry`, `LumoAlert`). That is an
 * identifier or a spec name, and it is what the hatch is for.
 *
 * A BARE NUMBER IS DELIBERATELY NOT MATCHED. «۲۴ ساعته» written as «24 ساعته»
 * is the exact defect `no-latin-digits` exists to catch, and islanding it would
 * hide it. A generator that emits Latin digits as a NUMBER still fails the gate,
 * loudly, which is the point.
 *
 * `<bdi>` with no `lang`: this is a bidi and digit exemption, not a claim that
 * the run is English — `E.164` is a spec name in any language. It renders
 * identically to the surrounding text.
 */
const LATIN_IDENTIFIER = /[A-Za-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*/g;

/**
 * Whose readers read Latin. A Record over the locale union, not a `=== "fa-IR"`,
 * so a third locale is a compile error rather than a silent default. On a
 * Latin-script page there is no foreign run to isolate: EVERY word matches the
 * pattern, and marking English prose as a Latin island would be both meaningless
 * markup and a lie to the gate's coverage report.
 */
const LATIN_SCRIPT: Record<Locale, boolean> = {
  "fa-IR": false,
  "en-US": true,
};

export function GeneratedText({ text, locale }: { text: string; locale: Locale }): LumoNode {
  if (LATIN_SCRIPT[locale]) return text;
  const parts: LumoNode[] = [];
  let last = 0;
  // `matchAll` over a fresh lastIndex each call: the regex is module-level and global.
  LATIN_IDENTIFIER.lastIndex = 0;
  for (const match of text.matchAll(LATIN_IDENTIFIER)) {
    const at = match.index;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      <bdi key={`${String(at)}-${match[0]}`} dir="ltr" data-lumo-latn="">
        {match[0]}
      </bdi>,
    );
    last = at + match[0].length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
