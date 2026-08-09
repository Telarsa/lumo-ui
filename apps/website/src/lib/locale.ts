import type { Locale } from "@lumo-ui/core";
import { LOCALES } from "@lumo-ui/core";

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

/** UI copy for the site itself. The site is a Lumo consumer and obeys its rules. */
export const site = {
  "fa-IR": {
    title: "لومو",
    tagline: "کتابخانهٔ کامپوننت فارسی‌محور",
    components: "کامپوننت‌ها",
    blocks: "بلوک‌ها",
    switchTo: "English",
    switchLabel: "تغییر زبان به انگلیسی",
    theme: "تغییر پوسته",
    intro:
      "کامپوننت‌های دسترس‌پذیر برای محصولاتی که به فارسی عرضه می‌شوند. تقویم جلالی، ارقام فارسی، و نام‌های دسترس‌پذیر فارسی — از همان اولین بایت.",
    preview: "پیش‌نمایش",
    code: "کد",
    props: "ویژگی‌ها",
  },
  "en-US": {
    title: "Lumo",
    tagline: "A Persian-first component library",
    components: "Components",
    blocks: "Blocks",
    switchTo: "فارسی",
    switchLabel: "Switch language to Persian",
    theme: "Toggle theme",
    intro:
      "Accessible components for products that ship in Persian. Jalali calendars, Persian numerals, and Persian accessible names — from the first byte.",
    preview: "Preview",
    code: "Code",
    props: "Props",
  },
} as const satisfies Record<Locale, Record<string, string>>;
