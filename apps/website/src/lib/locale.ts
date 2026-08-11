import type { Locale } from "@lumo-ui/core";
import { LOCALES, direction } from "@lumo-ui/core";

/**
 * Locale is a ROUTE SEGMENT, never client state.
 *
 * This is the decision that makes the site's Persian claim honest. Because
 * `/fa/` and `/en/` are separately prerendered under a root layout that
 * writes a literal `<html lang dir>`, the served bytes for a Persian page are
 * Persian — correct in view-source, correct with JavaScript off, correct to a
 * crawler, correct at first paint.
 *
 * A direction toggle held in React state would flip the CSS and leave
 * `lang="en"` on the document, which is exactly the defect this library exists
 * to prevent. There is therefore no toggle: the language control is a link.
 */
/**
 * ═══ THE URL SEGMENT IS NOT THE LOCALE, AND THAT SEPARATION IS THE POINT ════
 *
 * The routes are `/fa/` and `/en/`; the `lang` attribute stays `fa-IR` and
 * `en-US`. They were the same string until 11 Aug 2026 and it was convenient
 * right up to the moment it was wrong in both directions:
 *
 *   · A URL is read and typed by people. `/fa-IR/components/calendar/` carries
 *     a region subtag that says nothing to a reader in Tehran and nothing to
 *     one in Kabul, and it is the kind of detail that gets mistyped in a
 *     message and shared broken.
 *   · A `lang` attribute is read by SOFTWARE, and there the region is
 *     load-bearing: `fa-IR` selects the Persian calendar and the arabext digits
 *     through `FORMAT_LOCALE`, and a bare `fa` does not reliably select either.
 *     Shortening the attribute to match the URL would have been the same class
 *     of defect this library exists to prevent, arrived at through tidiness.
 *
 * So there are two spellings of one fact, and exactly one place that converts
 * between them. `segmentFor` builds every href; `assertLocale` reads every
 * route param. Neither the union nor the attribute changed.
 */
const LOCALE_SEGMENT = {
  "fa-IR": "fa",
  "en-US": "en",
} as const satisfies Record<Locale, string>;

/**
 * The URL segment for a locale. EVERY href and iframe `src` goes through this.
 *
 * Interpolating `${lang}` directly is what the migration had to undo in 24
 * places; it compiles, it produces a URL, and the URL is the old one.
 */
export function segmentFor(lang: Locale): string {
  return LOCALE_SEGMENT[lang];
}

/** Route params are SEGMENTS — `{ lang: "fa" }`, never `{ lang: "fa-IR" }`. */
export const localeParams = LOCALES.map((lang) => ({ lang: segmentFor(lang) }));

const BY_SEGMENT = new Map<string, Locale>(
  LOCALES.map((lang) => [segmentFor(lang), lang] as const),
);

/**
 * True for a URL SEGMENT. Deliberately not for a locale tag: `/fa-IR/` is no
 * longer a route, and accepting it here would silently prerender both spellings
 * and make the migration reversible by accident.
 */
export function isLocale(value: string): value is Locale {
  return BY_SEGMENT.has(value);
}

/** A route segment to the locale it names. */
export function assertLocale(value: string): Locale {
  const locale = BY_SEGMENT.get(value);
  if (locale === undefined) {
    throw new Error(
      `Unknown locale segment ${JSON.stringify(value)}. Every page must live under ` +
        `one of: ${LOCALES.map(segmentFor).join(", ")} — an ungraded route is an ` +
        `unprotected route. Note the segments are short (\`fa\`), while the \`lang\` ` +
        `attribute stays a full tag (\`fa-IR\`); see this file's header.`,
    );
  }
  return locale;
}

/**
 * The locale a "both directions, side by side" exhibit mirrors a page against.
 *
 * Both the component and the block pages spelled this `lang === "fa-IR" ?
 * "en-US" : "fa-IR"`, which is not copy but LOGIC — and logic that assumed the
 * site would only ever serve two locales. With a third, a German page would have
 * compared itself against Persian and an Arabic page against Persian too,
 * neither of which demonstrates anything about direction, and no type would have
 * objected. The exhibit exists to show BOTH DIRECTIONS, so it asks for a locale
 * whose direction differs — derived, never a hand-kept pairing, which is the
 * same rule `direction()` itself exists to enforce.
 *
 * Lives here rather than in either page because it is locale logic, not page
 * chrome; the pages' own headers are right that a route file must not export
 * helpers for a sibling route to import.
 */
export function oppositeDirectionLocale(lang: Locale): Locale {
  const other = LOCALES.find((l) => direction(l) !== direction(lang));
  if (!other) {
    throw new Error(
      `No locale with a direction opposite to ${JSON.stringify(lang)} is declared, so the ` +
        `side-by-side comparison has nothing to show. Refusing to render the page's own ` +
        `locale twice and call it a comparison.`,
    );
  }
  return other;
}

/**
 * Every locale, named in ITSELF — endonyms, deliberately not translated per
 * page. A Persian speaker stranded on the English site scans the language menu
 * for «فارسی», not for "Persian"; an endonym is the one spelling of a
 * language's name its own readers are guaranteed to recognise. Keyed by the
 * full `Locale` union, so adding a third locale without naming it here is a
 * compile error, not a blank menu row.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  "fa-IR": "فارسی",
  "en-US": "English",
};

/** UI copy for the site itself. The site is a Lumo consumer and obeys its rules. */
export const site = {
  "fa-IR": {
    title: "لومو",
    tagline: "کتابخانهٔ کامپوننت فارسی‌محور",
    docs: "مستندات",
    components: "کامپوننت‌ها",
    blocks: "بلوک‌ها",
    language: "تغییر زبان",
    github: "مخزن گیت‌هاب لومو",
    sections: "بخش‌ها",
    theme: "تغییر پوسته",
    intro:
      "کامپوننت‌های دسترس‌پذیر برای محصولاتی که به فارسی عرضه می‌شوند. تقویم جلالی، ارقام فارسی، و نام‌های دسترس‌پذیر فارسی — از همان اولین بایت.",
    preview: "پیش‌نمایش",
    code: "کد",
    props: "ویژگی‌ها",
    footerNote: "ساخته‌شده با کامپوننت‌های خودش",
  },
  "en-US": {
    title: "Lumo",
    tagline: "A Persian-first component library",
    docs: "Docs",
    components: "Components",
    blocks: "Blocks",
    language: "Change language",
    github: "Lumo GitHub repository",
    sections: "Sections",
    theme: "Toggle theme",
    intro:
      "Accessible components for products that ship in Persian. Jalali calendars, Persian numerals, and Persian accessible names — from the first byte.",
    preview: "Preview",
    code: "Code",
    props: "Props",
    footerNote: "Built with its own components",
  },
} as const satisfies Record<Locale, Record<string, string>>;
