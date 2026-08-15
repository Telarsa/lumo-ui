import type { Locale } from "@lumo-ui/core";

/**
 * The ⌘K search index: the plain-data shape, the builder, and the normaliser that makes
 * Persian queries actually find anything.
 *
 * This file NEVER imports `@/lib/demos` or `@/lib/blocks`: both read `node:fs` at module
 * scope, and `site-search.tsx` (`"use client"`) imports `normalize`/`matches` from here. So
 * `buildSearchIndex` takes already-read arrays; `site-shell.tsx` (server) supplies them.
 */

export type SearchDocKind = "component" | "block" | "doc";

/** The minimal shape this module needs from a registry entry; `Demo` and `BlockDemo` satisfy it structurally. */
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

/** Builds the flat index the palette searches. Pure — no I/O; `site-shell.tsx` builds it once per process. */
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
    // Mirrors app/[lang]/blocks/[slug]/page.tsx, whose generateStaticParams keys on `b.id`.
    href: {
      "fa-IR": `/fa/blocks/${b.id}/`,
      "en-US": `/en/blocks/${b.id}/`,
    },
  }));

  // Docs first: on an empty query the reading-order prose pages lead.
  return [...docDocs, ...componentDocs, ...blockDocs];
}

// normalize(): five things a naive `query.toLowerCase()` gets wrong for Persian.
// 1. ZWNJ (U+200C) — «دکمه‌ها» vs «دکمهها»: stripped from both sides.
// 2. Arabic diacritics (tashkeel) — «سَلام» and «سلام» are the same intent: stripped.
// 3. Arabic vs Persian codepoints — ك U+0643 vs ک U+06A9, ي U+064A vs ی U+06CC. NFC/NFKC does
//    NOT unify them, so they are remapped by hand toward the Persian codepoint.
// 4. Persian (۱۲۳) and Arabic-Indic (١٢٣) digits fold to ASCII.
// 5. Casefolding — a no-op for Persian, so 1–4 are load-bearing; still applied last for English.
// Order matters only for diacritics-before-letter-mapping; the rest are independent.

const ZWNJ = /‌/g;

// The Arabic combining-diacritic block plus superscript alef (U+0670); no base LETTER lives in this range.
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

/** Folds a string to a form comparable across scripts, digits and diacritics — see the block comment above. */
export function normalize(input: string): string {
  let out = input;
  out = out.replace(ZWNJ, "");
  out = out.replace(ARABIC_DIACRITICS, "");
  out = out.replace(ARABIC_LETTERS, (ch) => ARABIC_TO_PERSIAN_LETTER[ch] ?? ch);
  out = out.replace(NON_ASCII_DIGITS, (ch) => DIGIT_TO_ASCII[ch] ?? ch);
  out = out.toLowerCase();
  return out.trim().replace(/\s+/g, " ");
}

/** Whether `query` matches `text` after both are folded through `normalize`; an empty query matches everything. */
export function matches(text: string, query: string): boolean {
  const q = normalize(query);
  if (q === "") return true;
  return normalize(text).includes(q);
}
