import type { Locale } from "@lumo-ui/core";

/**
 * The ⌘K search index: the plain-data shape, the builder, and the normaliser
 * that makes Persian queries actually find anything.
 *
 * ── WHY THIS FILE NEVER IMPORTS `@/lib/demos` OR `@/lib/blocks` ─────────────
 *
 * Both of those are SERVER modules: `demos.tsx` calls `readFileSync` at module
 * scope to embed each component's real source next to its preview, and
 * `blocks.tsx` does the same for blocks. Importing either — even transitively,
 * even for a type — pulls `node:fs` into whatever bundle imports THIS file.
 *
 * `site-search.tsx` is `"use client"` and imports `normalize`/`matches` from
 * here to filter as the user types. If this file also imported `demos.tsx`,
 * Next would have to bundle `node:fs` for the browser and the build would
 * fail — not with a warning, with a hard error, on every one of the ~200
 * pages that render the header. So `buildSearchIndex` below takes the
 * already-read arrays as plain arguments instead of reaching for the
 * registries itself. The one caller that has both — `site-shell.tsx`, a
 * Server Component — imports `allDemos()`/`allBlocks()` and hands the result
 * here. That keeps the fs read where it already lived and keeps this module
 * safe to import from either side of the client boundary.
 *
 * ── BLOCK COVERAGE ───────────────────────────────────────────────────────
 *
 * `apps/website/src/lib/blocks.tsx` was mid-restructure while this file was
 * first written — a concurrent agent was expanding it from a 4-block curated
 * sample toward all 28 blocks in `@lumo-ui/blocks`, each with its own
 * `/[lang]/blocks/<slug>/` route. `buildSearchIndex` was deliberately written
 * to take `allBlocks()`'s output as a plain array rather than reading
 * `packages/blocks/src/index.ts` (which has no title/intro copy of its own)
 * or hard-coding a count, specifically so it would need no change once that
 * work landed. It has: `blocks.tsx` now carries all 28, and the index covers
 * all 28 with zero edits here.
 */

export type SearchDocKind = "component" | "block" | "doc";

/**
 * The minimal shape this module needs from a registry entry. Both `Demo`
 * (`demos.tsx`) and `BlockDemo` (`blocks.tsx`) already satisfy this
 * structurally — callers pass `allDemos()`/`allBlocks()` straight through.
 */
export interface SearchSource {
  id: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  tier?: string | undefined;
}

/** One entry in the built index — plain, JSON-serialisable data. */
export interface SearchDoc {
  id: string;
  kind: SearchDocKind;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  tier: string | undefined;
  href: Record<Locale, string>;
}

/**
 * Builds the flat index the palette searches, from data a server module has
 * already read off disk. Pure — no I/O, safe to call at module load and reuse
 * across every page in the same build process (see `site-shell.tsx`, which
 * does exactly that so 52 components + N blocks are not re-derived per page).
 */
export function buildSearchIndex(
  components: readonly SearchSource[],
  blocks: readonly SearchSource[],
  docs: readonly SearchSource[] = [],
): SearchDoc[] {
  const docDocs: SearchDoc[] = docs.map((d) => ({
    id: d.id,
    kind: "doc",
    title: d.title,
    intro: d.intro,
    tier: undefined,
    href: {
      "fa-IR": `/fa/docs/${d.id}/`,
      "en-US": `/en/docs/${d.id}/`,
    },
  }));
  const componentDocs: SearchDoc[] = components.map((d) => ({
    id: d.id,
    kind: "component",
    title: d.title,
    intro: d.intro,
    tier: d.tier,
    href: {
      "fa-IR": `/fa/components/${d.id}/`,
      "en-US": `/en/components/${d.id}/`,
    },
  }));

  const blockDocs: SearchDoc[] = blocks.map((b) => ({
    id: b.id,
    kind: "block",
    title: b.title,
    intro: b.intro,
    tier: undefined,
    // Mirrors apps/website/src/app/[lang]/blocks/[slug]/page.tsx, whose own
    // generateStaticParams keys every block's route on `b.id` the same way.
    href: {
      "fa-IR": `/fa/blocks/${b.id}/`,
      "en-US": `/en/blocks/${b.id}/`,
    },
  }));

  // Docs first: when everything matches (empty query), the reading-order prose
  // pages lead, the way shadcn's palette leads with its Getting Started group.
  return [...docDocs, ...componentDocs, ...blockDocs];
}

// ═══ normalize() ═════════════════════════════════════════════════════════
//
// Five things a naive `query.toLowerCase()` gets wrong for Persian, in the
// order this function fixes them:
//
// 1. ZERO-WIDTH NON-JOINER (U+200C). Persian compounds like «دکمه‌ها»
//    ("buttons") carry a ZWNJ between the noun and the plural suffix. A user
//    typing on a phone keyboard, or just typing fast, produces «دکمهها»
//    instead — same word, no ZWNJ. Stripped from both sides, or the two
//    never compare equal.
//
// 2. ARABIC DIACRITICS (tashkeel): fatha َ, damma ُ, kasra ِ, shadda ّ,
//    sukun ْ, and the rarer marks in the same block. Persian text is almost
//    never typed with these — «سَلام» and «سلام» are the same search intent —
//    so both sides need them gone before comparing.
//
// 3. ARABIC vs PERSIAN CODEPOINTS. ك U+0643 (Arabic kaf) is a different
//    character from ک U+06A9 (Persian keheh); ي U+064A (Arabic yeh) is
//    different from ی U+06CC (Persian yeh). Arabic and Persian keyboard
//    layouts produce different codepoints for what a Persian reader sees as
//    the same letter, and most people typing Persian on an Arabic-laid-out
//    keyboard (or vice versa) have no idea which one their OS just inserted.
//    Unicode does NOT treat these as canonically equivalent — NFC/NFKC
//    normalisation leaves them exactly as different as they started — so
//    they are remapped by hand, toward the Persian codepoint (the one
//    Lumo's own UI text is authored in).
//
// 4. PERSIAN AND ARABIC-INDIC DIGITS. ۱۲۳ (U+06F1…, Persian) and ١٢٣
//    (U+0661…, Arabic-Indic) and 123 (ASCII) are three different digit
//    blocks a Persian-reading user might type or see, depending on keyboard
//    and OS locale. All three fold to ASCII digits.
//
// 5. CASEFOLDING. Persian has none — `"دکمه".toLowerCase()` is a byte-for-byte
//    no-op, so rules 1–4 above are load-bearing on their own and cannot be
//    skipped because "we already lowercase everything". `.toLowerCase()` is
//    still applied, last, because the same palette also searches English
//    titles on `/en/` and "Kbd" has to find "kbd".
//
// Order matters only between steps that could otherwise interact (diacritics
// before letter-mapping, so a diacritic sitting on a remapped letter doesn't
// survive by accident); digits, ZWNJ and casefolding are independent of the
// rest and of each other.

const ZWNJ = /‌/g;

// Fathatan, dammatan, kasratan, fatha, damma, kasra, shadda, sukun, and the
// rest of the Arabic combining-diacritic block, plus the superscript alef
// used in a handful of loanwords (U+0670). No base letters live in this
// range, so stripping it never removes a consonant or vowel LETTER — only
// marks drawn above or below one.
const ARABIC_DIACRITICS = /[ً-ٰٟ]/g;

const ARABIC_TO_PERSIAN_LETTER: Record<string, string> = {
  "ك": "ک", // ك (Arabic kaf)  -> ک (Persian keheh)
  "ي": "ی", // ي (Arabic yeh)  -> ی (Persian yeh)
};
const ARABIC_LETTERS = /[كي]/g;

const DIGIT_TO_ASCII: Record<string, string> = {
  // Persian (Extended Arabic-Indic), U+06F0–U+06F9
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  // Arabic-Indic, U+0660–U+0669
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};
const NON_ASCII_DIGITS = /[۰-۹٠-٩]/g;

/**
 * Folds a string to a form comparable across scripts, digit systems and
 * diacritics — see the block comment above for what each step is for and
 * `search-index.test.ts` for a failing-without-it case per rule.
 */
export function normalize(input: string): string {
  let out = input;
  out = out.replace(ZWNJ, "");
  out = out.replace(ARABIC_DIACRITICS, "");
  out = out.replace(ARABIC_LETTERS, (ch) => ARABIC_TO_PERSIAN_LETTER[ch] ?? ch);
  out = out.replace(NON_ASCII_DIGITS, (ch) => DIGIT_TO_ASCII[ch] ?? ch);
  out = out.toLowerCase();
  return out.trim().replace(/\s+/g, " ");
}

/**
 * Whether `query` matches `text`, once both are folded through `normalize`.
 * An empty (or all-whitespace) query matches everything — the palette's
 * default, unfiltered state.
 */
export function matches(text: string, query: string): boolean {
  const q = normalize(query);
  if (q === "") return true;
  return normalize(text).includes(q);
}
