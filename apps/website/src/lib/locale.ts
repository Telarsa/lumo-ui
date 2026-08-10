import type { Locale } from "@lumo-ui/core";
import { LOCALES, direction } from "@lumo-ui/core";

/**
 * Locale is a ROUTE SEGMENT, never client state.
 *
 * This is the decision that makes the site's Persian claim honest. Because
 * `/fa-IR/` and `/en-US/` are separately prerendered under a root layout that
 * writes a literal `<html lang dir>`, the served bytes for a Persian page are
 * Persian — correct in view-source, correct with JavaScript off, correct to a
 * crawler, correct at first paint.
 *
 * A direction toggle held in React state would flip the CSS and leave
 * `lang="en"` on the document, which is exactly the defect this library exists
 * to prevent. There is therefore no toggle: the language control is a link.
 */
export const localeParams = LOCALES.map((lang) => ({ lang }));

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function assertLocale(value: string): Locale {
  if (!isLocale(value)) {
    throw new Error(
      `Unknown locale segment ${JSON.stringify(value)}. Every page must live under ` +
        `one of: ${LOCALES.join(", ")} — an ungraded route is an unprotected route.`,
    );
  }
  return value;
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
