import type { SiteLocale } from "./locales";

/**
 * The docs reading order. The sidebar, the header, every page's prev/next and
 * the docs index all read this one list, so a page cannot exist in one place
 * and be missing from another.
 */
export const DOCS_ORDER = ["getting-started", "contract", "helpers", "dates", "gate", "mobile"] as const;
export type DocSlug = (typeof DOCS_ORDER)[number];

export const DOCS: Record<SiteLocale, Record<DocSlug, { label: string; lead: string }>> = {
  "fa-IR": {
    "getting-started": { label: "شروع", lead: "یک بسته، یک ترتیب ثابت برای CSS، و نمره‌دادن به خروجی build." },
    contract: { label: "قرارداد مشترک", lead: "چه چیزی مشترک است، چه کسی حملش می‌کند، و واگرایی را چه می‌گیرد." },
    helpers: { label: "کمک‌کننده‌ها", lead: "جزیره‌های لاتین، اعداد، و دو دستور lumo doctor و lumo fix." },
    dates: { label: "تاریخ جلالی", lead: "چهار propی که Calendar خودِ shadcn می‌پذیرد و شبکه را جلالی می‌کند." },
    gate: { label: "دروازه", lead: "پانزده قانون روی HTML سرو‌شده، و پروندهٔ کف‌ها." },
    mobile: { label: "موبایل", lead: "همان لایه روی Material در Flutter، با نمره‌دهِ Semantics خودش." },
  },
  "en-US": {
    "getting-started": { label: "Getting started", lead: "One package, one fixed CSS order, and a grade over the build output." },
    contract: { label: "The contract", lead: "What is shared, what carries it, and what catches divergence." },
    helpers: { label: "Helpers", lead: "Latin islands, numbers, and the two commands: lumo doctor and lumo fix." },
    dates: { label: "Jalali dates", lead: "The four props shadcn's own Calendar accepts, counting in the reader's calendar." },
    gate: { label: "The gate", lead: "Fifteen rules over served HTML, and the floors file." },
    mobile: { label: "Mobile", lead: "The same layer on Material in Flutter, with its own semantics grader." },
  },
};

export function docNeighbours(slug: DocSlug): { prev?: DocSlug; next?: DocSlug } {
  const i = DOCS_ORDER.indexOf(slug);
  return { prev: DOCS_ORDER[i - 1], next: DOCS_ORDER[i + 1] };
}

/** «۰۲» / "02" — the docs are a sequence, so the number carries information. */
export function docIndex(slug: DocSlug, locale: SiteLocale): string {
  return new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(
    DOCS_ORDER.indexOf(slug) + 1,
  );
}
