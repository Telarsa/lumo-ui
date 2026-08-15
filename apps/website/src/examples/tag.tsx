import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Tag } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the tag page. Contract: `_system/types.ts`.
 *
 * A SERVER module — and that is why every Tag below is the STATIC form.
 *
 * `tag.tsx` carries `"use client"` for one reason and it is not an engine: this
 * file imports no component library at all, before or after the Base UI
 * migration. The directive is there because `onRemove` is a FUNCTION PROP, and a
 * function cannot cross the server/client boundary — a removable Tag rendered
 * from a server component fails at build with "Functions cannot be passed
 * directly to Client Components". So the removable form cannot appear on this
 * page, which is itself the most honest demonstration of the constraint: the
 * static form is server-renderable and the removable one is not, and splitting
 * the file in two to prove it would leave two components to keep in sync.
 *
 * What the removable form guarantees is stated in the parts table instead:
 * `onRemove` without `removeLabel` is TS2322, because the remove control is an
 * ✕ with no text and would otherwise announce as a bare "button", once per tag.
 */

const t = {
  filterCity: { "fa-IR": "تهران", "en-US": "Tehran" },
  filterCategory: { "fa-IR": "لوازم خانگی", "en-US": "Home appliances" },
  filterStock: { "fa-IR": "موجود در انبار", "en-US": "In stock" },
  filterFree: { "fa-IR": "ارسال رایگان", "en-US": "Free delivery" },

  brandLong: {
    "fa-IR": "شرکت صنایع الکترونیک پارس‌آوند خاورمیانه",
    "en-US": "Pars-Avand Middle East Electronics Industries",
  },

  results: { "fa-IR": "نتیجه", "en-US": "results" },
  pages: { "fa-IR": "صفحه", "en-US": "pages" },
  attachments: { "fa-IR": "پیوست", "en-US": "attachments" },
} satisfies Record<string, LocalizedText>;

function FiltersExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag>{t.filterCity[l]}</Tag>
      <Tag>{t.filterCategory[l]}</Tag>
      <Tag>{t.filterStock[l]}</Tag>
      <Tag>{t.filterFree[l]}</Tag>
    </div>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag size="sm">{t.filterCity[l]}</Tag>
      <Tag size="md">{t.filterCity[l]}</Tag>
    </div>
  );
}

function TruncateExample(l: Locale) {
  return (
    <div className="flex w-full max-w-56 flex-wrap items-center gap-2">
      <Tag>{t.brandLong[l]}</Tag>
    </div>
  );
}

function CountsExample(l: Locale) {
  const rows = [
    { key: "results", value: 1_284, label: t.results[l] },
    { key: "pages", value: 43, label: t.pages[l] },
    { key: "attachments", value: 7, label: t.attachments[l] },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {rows.map((row) => (
        <Tag key={row.key} size="sm">
          {formatNumber(row.value, l)} {row.label}
        </Tag>
      ))}
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک تراشه: فیلتر، مقدار برگزیده، کلیدواژه — به‌دلخواه حذف‌شدنی.",
        "en-US": "A chip: a filter, a selected value, a keyword — optionally removable.",
      },
      whenNot: {
        "fa-IR": "چندتا در یک ردیف — `TagGroup`. نشانگر وضعیت فقط‌خواندنی — `Badge`. مقدارهای آزاد تایپ‌شده — `TagsInput`.",
        "en-US": "Several in a row — `TagGroup`. A read-only status marker — `Badge`. Free-form values typed in — `TagsInput`.",
      },
    },
    tier: "display",
    title: { "fa-IR": "برچسب", "en-US": "Tag" },
    intro: {
      "fa-IR":
        "یک تراشه: فیلتری، مقداری برگزیده، کلیدواژه‌ای — و به‌دلخواه قابل حذف. این پرونده گروه گواهِ کل مهاجرت است: پیش و پس از تغییر موتور، هیچ کتابخانه‌ای وارد نمی‌کند و هیچ گزینشگر حالتی ندارد. «use client» رویش هست، اما نه به‌خاطر موتور: onRemove یک تابع است و تابع از مرز سرور نمی‌گذرد. پس نمونه‌های این صفحه همگی شکل ایستا هستند — که خودش گویاترین نمایش همان محدودیت است.",
      "en-US":
        "A chip: a filter, a selected value, a keyword — optionally removable. This file is the migration's control group: it imported no component library before the engine change and imports none after, and carries zero state selectors. It does carry \"use client\", but not because of an engine: onRemove is a function, and a function cannot cross the server boundary. Every example on this page is therefore the STATIC form — which is itself the plainest demonstration of that constraint.",
    },
    composition: [
      `<Tag size onRemove removeLabel>   ← onRemove and removeLabel are one union:`,
      `  the text                        ← neither alone type-checks`,
      `</Tag>`,
    ].join("\n"),
    parts: [
      {
        name: "Tag",
        description: {
          "fa-IR":
            "کل جزء. اگر onRemove بدهید، removeLabel اجباری می‌شود و نبودش خطای کامپایل است — نه یک قرارداد که کسی باید به‌یاد بیاورد. برچسب باید نامِ همان چیزی باشد که حذف می‌شود، وگرنه فهرستی از هشت فیلتر هشت بار «حذف» را می‌خواند بدون آنکه چیزی آن‌ها را از هم جدا کند. ناحیهٔ لمس دکمهٔ حذف با یک شبه‌عنصر شفاف بزرگ می‌شود، پس هدف بزرگ می‌شود و چیدمان دست‌نخورده می‌ماند.",
          "en-US":
            "The whole component. Supply onRemove and removeLabel becomes required — its absence is a compile error rather than a convention somebody has to remember. The label must name the thing being removed, or a list of eight filters announces \"remove\" eight times with nothing to tell them apart. The remove control's hit area is grown with a transparent pseudo-element, so the target grows and the layout does not.",
        },
      },
    ],
  },
  examples: [
    {
      id: "filters",
      title: { "fa-IR": "فیلترهای اعمال‌شده", "en-US": "The filters in force" },
      description: {
        "fa-IR":
          "شکل ایستا هیچ کنترلی درون خود ندارد، پس چیزی برای نام‌گذاری هم نیست: صفحه‌خوان دقیقاً چهار رشتهٔ متن می‌شنود. همین‌جاست که تفاوت با tag-group روشن می‌شود — آن یکی مجموعه‌ای با انتخاب و تمرکز است، این یکی متن است.",
        "en-US":
          "The static form contains no control, so there is nothing to name: a screen reader hears exactly four strings of text. This is where the difference from tag-group shows — that one is a collection with selection and focus, this one is text.",
      },
      render: FiltersExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "دو اندازه و یک لایه‌گذاری نامتقارن", "en-US": "Two sizes and an asymmetric padding" },
      description: {
        "fa-IR":
          "لایه‌گذاری با ps و pe نوشته شده نه px، چون تراشهٔ قابل حذف در لبهٔ پایانی به فضای کمتری نیاز دارد — دکمهٔ حذف خودش فضا می‌آورد. نتیجه‌اش این است که در فارسی همان کاهش به لبهٔ چپ می‌رود، خودکار.",
        "en-US":
          "The padding is written with ps and pe rather than px, because a removable chip needs less room at the inline END — the remove button brings its own. The consequence is that in Persian the same trim lands on the left edge, automatically.",
      },
      render: SizesExample,
    },
    {
      id: "long-value",
      title: { "fa-IR": "مقدار بلند", "en-US": "A long value" },
      description: {
        "fa-IR":
          "متن درون تراشه truncate است و خود تراشه max-w-full دارد، پس یک مقدار بلند سطر فیلترها را نمی‌شکند. برش با سه‌نقطه در فارسی از سمت چپ اتفاق می‌افتد چون آن لبهٔ پایانی است — نه به‌خاطر قاعده‌ای در این پرونده، بلکه چون text-overflow جهت را دنبال می‌کند.",
        "en-US":
          "The text inside the chip truncates and the chip itself is max-w-full, so one long value does not break the filter row. In Persian the ellipsis appears on the LEFT because that is the inline end — not because of any rule in this file, but because text-overflow follows the direction.",
      },
      render: TruncateExample,
    },
    {
      id: "counts",
      title: { "fa-IR": "تراشه‌ای که عدد دارد", "en-US": "A chip carrying a number" },
      description: {
        "fa-IR":
          "فرزندان Tag از نوع LumoNode هستند، پس گذاشتن مستقیم یک شمارش خطای کامپایل است و باید از formatNumber بگذرد. این پرتکرارترین محتوای یک تراشه است و پرتکرارترین جای بروز همان نقص.",
        "en-US":
          "Tag's children are LumoNode, so dropping a count straight in is a compile error and it has to go through formatNumber. This is a chip's commonest content and, for the same reason, the commonest place the defect appears.",
      },
      render: CountsExample,
    },
  ],
};
