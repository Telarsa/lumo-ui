import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { LOCALES, direction } from "@lumo-ui/core";

/**
 * Locale is a ROUTE SEGMENT, never client state: `/fa/` and `/en/` are prerendered under a
 * root layout that writes a literal `<html lang dir>`, so the served bytes are right at first
 * paint and with JavaScript off. There is no direction toggle; the language control is a link.
 *
 * The URL segment is NOT the locale: routes are `/fa/` and `/en/`, the `lang` attribute stays
 * `fa-IR`/`en-US` (the region subtag selects the Persian calendar and digits). Exactly one place
 * converts between them — `segmentFor` builds every href, `assertLocale` reads every route
 * param. Long-form: docs/i18n-and-rtl.md and docs/decisions/log.md.
 */
const LOCALE_SEGMENT = {
  "fa-IR": "fa",
  "en-US": "en",
} as const satisfies Record<Locale, string>;

/** The URL segment for a locale. EVERY href and iframe `src` goes through this, never the tag itself. */
export function segmentFor(lang: Locale): string {
  return LOCALE_SEGMENT[lang];
}

/** Route params are SEGMENTS — `{ lang: "fa" }`, never `{ lang: "fa-IR" }`. */
export const localeParams = LOCALES.map((lang) => ({ lang: segmentFor(lang) }));

const BY_SEGMENT = new Map<string, Locale>(
  LOCALES.map((lang) => [segmentFor(lang), lang] as const),
);

/** True for a URL SEGMENT, deliberately not for a locale tag: `/fa-IR/` is no longer a route. */
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
 * The locale a "both directions, side by side" exhibit mirrors a page against — derived from
 * `direction()`, never a hand-kept pairing that assumes only two locales. Lives here rather
 * than in either page because it is locale logic, not page chrome.
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
 * Every locale, named in ITSELF — endonyms, so a reader stranded on the wrong site recognises
 * their language. Keyed by the full `Locale` union, so a new locale without a name is a compile error.
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
