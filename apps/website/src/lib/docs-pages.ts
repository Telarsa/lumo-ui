import type { BuiltinLocale as Locale } from "@lumo-ui/core";

/**
 * The canonical list of prose docs pages — ONE list, five consumers.
 *
 * The review found the docs section undiscoverable: reachable only through a
 * sidebar that is `hidden` below `lg`, absent from the header nav, absent from
 * the ⌘K index, and dead-ending (no pager). Each of those surfaces needed the
 * same six entries, and four hand-kept copies of a list is how one of them
 * drifts silently. So the list lives here, in reading order (what it is, how
 * to install it, how to restyle it, the tooling, the letterforms, what
 * changed), and the sidebar, the header link, the search index, the mobile
 * strip and the pager all derive from it. Adding a docs page is one entry
 * here plus the route directory — everything else follows.
 */
export interface DocsPage {
  slug: string;
  label: Record<Locale, string>;
  /** One line for the ⌘K palette row — what the page answers, not a title. */
  intro: Record<Locale, string>;
}

export const DOCS_PAGES: readonly DocsPage[] = [
  {
    slug: "introduction",
    label: { "fa-IR": "معرفی", "en-US": "Introduction" },
    intro: {
      "fa-IR": "لومو چیست، برای چه ساخته شد، و چه چیزی را نمی‌سازد.",
      "en-US": "What Lumo is, what it was built for, and what it will not build.",
    },
  },
  {
    slug: "installation",
    label: { "fa-IR": "نصب", "en-US": "Installation" },
    intro: {
      "fa-IR": "راه‌اندازی یک پروژهٔ مصرف‌کننده: بسته‌ها، رجیستری، و اولین کامپوننت.",
      "en-US": "Setting up a consuming project: the packages, the registry, the first component.",
    },
  },
  {
    slug: "theming",
    label: { "fa-IR": "پوسته‌سازی", "en-US": "Theming" },
    intro: {
      "fa-IR": "سه لایهٔ توکن، سه حالت پوسته، و دستگیره‌هایی که برند را می‌چرخانند.",
      "en-US": "The three token tiers, the three theme states, and the knobs that turn the brand.",
    },
  },
  {
    slug: "cli",
    label: { "fa-IR": "خط فرمان", "en-US": "CLI" },
    intro: {
      "fa-IR": "دستورهای واقعی: افزودن از رجیستری، وندورکردن، و verify.",
      "en-US": "The real commands: adding from the registry, vendoring, and verify.",
    },
  },
  {
    slug: "native",
    label: { "fa-IR": "موبایل (React Native)", "en-US": "Mobile (React Native)" },
    intro: {
      "fa-IR": "شروع نسخهٔ موبایل: همان قرارداد روی React Native / Expo — اولین کامپوننت، دکمه.",
      "en-US": "The mobile start: the same contract on React Native / Expo — the first component, Button.",
    },
  },
  {
    slug: "typography",
    label: { "fa-IR": "حروف‌نگاری", "en-US": "Typography" },
    intro: {
      "fa-IR": "وزیرمتن و اینتر، ارقام فارسی، و قاعده‌هایی که اتصال حروف را نگه می‌دارند.",
      "en-US": "Vazirmatn and Inter, Persian numerals, and the rules that keep letters joined.",
    },
  },
  {
    slug: "integration-recipes",
    label: { "fa-IR": "دستورهای یکپارچه‌سازی", "en-US": "Integration recipes" },
    intro: {
      "fa-IR": "هوک‌های کوچک و آزموده‌ای که باید در محصول کپی شوند، نه اینکه API زمان اجرای لومو را بزرگ کنند.",
      "en-US": "Small tested hooks to copy into a product instead of expanding Lumo's runtime API.",
    },
  },
  {
    slug: "coverage",
    label: { "fa-IR": "پوشش نمونه‌ها", "en-US": "Example coverage" },
    intro: {
      "fa-IR": "کدام کامپوننت نمونه دارد و کدام ندارد — شمرده از روی رجیستری، نه از روی حافظه.",
      "en-US": "Which components have worked examples and which do not — counted from the registry, not from memory.",
    },
  },
  {
    slug: "changelog",
    label: { "fa-IR": "تاریخچهٔ تغییرات", "en-US": "Changelog" },
    intro: {
      "fa-IR": "آنچه تغییر کرد، به ترتیب، از تاریخچهٔ واقعی مخزن.",
      "en-US": "What changed, in order, from the repo's real history.",
    },
  },
];
