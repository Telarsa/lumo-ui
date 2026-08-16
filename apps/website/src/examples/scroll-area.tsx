import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { ScrollArea } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the scroll-area page. Contract: `_system/types.ts` —
 * each render is a named top-level function so the loader can slice its source.
 *
 * ScrollArea is one of the few pieces of Lumo with no `"use client"` at all,
 * so these previews cost the reader zero hydration.
 */

const t = {
  listLabel: { "fa-IR": "فهرست تراکنش‌ها", "en-US": "Transaction list" },
  deposit: { "fa-IR": "واریز حقوق", "en-US": "Salary deposit" },
  groceries: { "fa-IR": "خرید خواربار", "en-US": "Groceries" },
  transfer: { "fa-IR": "انتقال به پس‌انداز", "en-US": "Transfer to savings" },
  internet: { "fa-IR": "قبض اینترنت", "en-US": "Internet bill" },
  taxi: { "fa-IR": "کرایهٔ تاکسی", "en-US": "Taxi fare" },
  monthsLabel: { "fa-IR": "نوار ماه‌ها", "en-US": "Month strip" },
  month: { "fa-IR": "ماه", "en-US": "Month" },
} satisfies Record<string, LocalizedText>;

const rows = [t.deposit, t.groceries, t.transfer, t.internet, t.taxi];

function VerticalExample(l: Locale) {
  return (
    <ScrollArea label={t.listLabel[l]} className="h-48 w-64 rounded-md border border-border">
      <ul className="flex flex-col">
        {Array.from({ length: 15 }, (_, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-4 px-3 py-2 text-sm text-fg"
          >
            <span className="truncate">{rows[i % rows.length]?.[l]}</span>
            <span className="text-fg-muted">{formatNumber(i + 1, l)}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

function HorizontalExample(l: Locale) {
  return (
    <ScrollArea
      label={t.monthsLabel[l]}
      orientation="horizontal"
      className="w-72 rounded-md border border-border"
    >
      <div className="flex w-max gap-2 p-3">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface-sunken px-3 py-1.5 text-sm text-fg"
          >
            {t.month[l]} {formatNumber(i + 1, l)}
          </span>
        ))}
      </div>
    </ScrollArea>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ناحیه‌ای که بومی می‌پیماید و نوارهایش رنگ توکن دارند: نوار کناری، پنل کد، منوی بلند در ارتفاعی ثابت.",
        "en-US": "A region that scrolls natively with token-coloured bars: a sidebar, a code panel, a long menu in a fixed height.",
      },
      whenNot: {
        "fa-IR": "ده‌هزار ردیف — `VirtualList`. گفتگویی که دنبال تازه‌ترین پیام می‌رود — `MessageScroller`. پنجرک‌هایی که خواننده اندازه می‌دهد — `Resizable`.",
        "en-US": "Ten thousand rows — `VirtualList`. A transcript that follows the newest message — `MessageScroller`. Panes the reader resizes — `Resizable`.",
      },
    },
    // Page identity — the catalog builds the page from these three fields (see lib/catalog.ts).
    tier: "layout",
    title: { "fa-IR": "ناحیهٔ پیمایش", "en-US": "Scroll area" },
    intro: { "fa-IR": "پیمایش بومی با نوارِ هم‌رنگِ توکن‌ها — بدون بازسازی دستگیرهٔ اسکرول با جاوااسکریپت. ناحیه نام‌دار است و با صفحه‌کلید قابل‌رسیدن.", "en-US": "Native scrolling with token-coloured bars — no JavaScript thumb reconstruction. The region is named and keyboard-reachable." },
    isNew: true,
    composition: [`<ScrollArea label="…" orientation="vertical">`, `  …`, `</ScrollArea>`].join(
      "\n",
    ),
    parts: [
      {
        name: "ScrollArea",
        description: {
          "fa-IR": "پیمایشگر بومی با نوار باریک هم‌رنگ توکن حاشیه؛ ناحیه‌ای نام‌دار و با Tab قابل‌رسیدن، بدون بازسازی دستگیرهٔ اسکرول با جاوااسکریپت.",
          "en-US": "The native scroller with a thin border-token bar; a named, Tab-reachable region with no JS thumb re-implementation.",
        },
      },
    ],
  },
  examples: [
    {
      id: "vertical",
      title: { "fa-IR": "فهرست بلند", "en-US": "A long list" },
      description: {
        "fa-IR": "۱۵ ردیف در قابی کوتاه. لبهٔ نوار پیمایش در فارسی خودبه‌خود به چپ می‌رود، چون مرورگر جهت را حل می‌کند.",
        "en-US": "Fifteen rows in a short frame. The bar's edge moves to the left in Persian by itself, because the engine resolves direction.",
      },
      render: VerticalExample,
    },
    {
      id: "horizontal",
      title: { "fa-IR": "نوار افقی", "en-US": "A horizontal strip" },
      description: {
        "fa-IR": "سرریز روی محور درون‌خطی: در فارسی از راست آغاز می‌شود و به چپ ادامه می‌یابد، بدون هیچ کد جهتی در کامپوننت.",
        "en-US": "Overflow on the inline axis: in Persian it starts from the right and runs left, with no direction code in the component.",
      },
      render: HorizontalExample,
    },
  ],
};
