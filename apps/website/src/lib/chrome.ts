import type { SiteLocale } from "./locales";

/**
 * Every string the shell speaks, per locale — complete for both or the build
 * fails at the type level, which is the contract the site is here to sell.
 */
export const CHROME = {
  "fa": {
    siteName: "Lumo UI",
    tagline: "لایهٔ درستیِ محصولات فارسی",
    description:
      "قرارداد زبانی تایپ‌شده، سیاست lint و دروازه‌ای که بایت‌هایی را نمره می‌دهد که خوانندهٔ فارسی واقعاً دریافت می‌کند — ارقام، تقویم، جهت و نامی که صفحه‌خوان اعلام می‌کند.",
    skip: "پرش به محتوا",
    nav: { docs: "مستندات", rules: "قوانین", github: "گیت‌هاب" },
    switchLabel: "English",
    switchAria: "تغییر زبان به انگلیسی",
    theme: { label: "تغییر پوسته", light: "روشن", dark: "تاریک" },
    footer: {
      built: "ساختهٔ",
      licence: "متن‌باز، با پروانهٔ MIT",
      docs: "مستندات",
      source: "کد منبع",
      company: "تلارسا",
      version: "نسخهٔ",
    },
    docs: {
      eyebrow: "مستندات",
      index: "فهرست",
      prev: "قبلی",
      next: "بعدی",
      onThisSite: "در این سایت",
    },
  },
  "en": {
    siteName: "Lumo UI",
    tagline: "The correctness layer for Persian products",
    description:
      "A typed locale contract, a lint policy, and a gate that grades the bytes a Persian reader actually receives: the digits, the calendar, the direction, and the name a screen reader announces.",
    skip: "Skip to content",
    nav: { docs: "Docs", rules: "Rules", github: "GitHub" },
    switchLabel: "فارسی",
    switchAria: "Switch to Persian",
    theme: { label: "Theme", light: "Light", dark: "Dark" },
    footer: {
      built: "Built by",
      licence: "Open source under the MIT licence",
      docs: "Docs",
      source: "Source",
      company: "Telarsa",
      version: "Version",
    },
    docs: {
      eyebrow: "Docs",
      index: "Index",
      prev: "Previous",
      next: "Next",
      onThisSite: "On this site",
    },
  },
} as const satisfies Record<SiteLocale, unknown>;

export type Chrome = (typeof CHROME)[SiteLocale];
