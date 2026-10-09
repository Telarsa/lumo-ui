import type { SiteLocale } from "./locales";

/**
 * Every string the shell speaks, per locale — complete for both or the build
 * fails at the type level, which is the contract the site is here to sell.
 */
export const CHROME = {
  de: {
  "siteName": "Lumo UI",
  "productOf": "Ein Produkt von Telarsa",
  "allProducts": "Produkte von Telarsa",
  "tagline": "Die Grundlage für korrekte persische Oberflächen",
  "description": "Ein typisierter Sprachvertrag, Lint-Regeln und eine Prüfung der ausgelieferten Ziffern, Kalender, Schreibrichtung und zugänglichen Namen.",
  "skip": "Zum Inhalt springen",
  "nav": {
    "docs": "Dokumentation",
    "rules": "Regeln",
    "github": "GitHub"
  },
  "switchLabel": "DE",
  "switchAria": "Sprache wechseln",
  "theme": {
    "system": "Design: folgt dem System. Zu hell wechseln.",
    "light": "Design: hell. Zu dunkel wechseln.",
    "dark": "Design: dunkel. Wieder dem System folgen."
  },
  "footer": {
    "built": "Entwickelt von",
    "licence": "Open Source unter der MIT-Lizenz",
    "docs": "Dokumentation",
    "source": "Quelltext",
    "company": "Telarsa",
    "version": "Version"
  },
  "docs": {
    "eyebrow": "Dokumentation",
    "index": "Übersicht",
    "prev": "Zurück",
    "next": "Weiter",
    "onThisSite": "Auf dieser Website"
  }
},
  "fa": {
    siteName: "Lumo UI",
    productOf: "محصولی از تلارسا",
    allProducts: "محصولات تلارسا",
    tagline: "لایهٔ درستیِ محصولات فارسی",
    description:
      "قرارداد زبانی تایپ‌شده، سیاست lint و دروازه‌ای که بایت‌هایی را نمره می‌دهد که خوانندهٔ فارسی واقعاً دریافت می‌کند — ارقام، تقویم، جهت و نامی که صفحه‌خوان اعلام می‌کند.",
    skip: "پرش به محتوا",
    nav: { docs: "مستندات", rules: "قوانین", github: "گیت‌هاب" },
    switchLabel: "English",
    switchAria: "تغییر زبان",
    theme: {
      system: "پوسته: مطابق سیستم. تغییر به روشن.",
      light: "پوسته: روشن. تغییر به تاریک.",
      dark: "پوسته: تاریک. بازگشت به پیروی از سیستم.",
    },
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
    productOf: "A Telarsa product",
    allProducts: "Telarsa products",
    tagline: "The correctness layer for Persian products",
    description:
      "A typed locale contract, a lint policy, and a gate that grades the bytes a Persian reader actually receives: the digits, the calendar, the direction, and the name a screen reader announces.",
    skip: "Skip to content",
    nav: { docs: "Docs", rules: "Rules", github: "GitHub" },
    switchLabel: "فارسی",
    switchAria: "Change language",
    theme: {
      system: "Theme: follows system. Switch to light.",
      light: "Theme: light. Switch to dark.",
      dark: "Theme: dark. Switch to follow system.",
    },
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
