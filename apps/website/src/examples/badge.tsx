import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { CircleDotIcon } from "lucide-react";
import { Badge } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the badge page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `badge.tsx` carries no `"use client"` — a badge that
 * renders a plan tier or a stock state is content a crawler has to see in the
 * first byte, and marking a purely presentational component client-only costs
 * nothing visible while quietly removing it from the served HTML.
 *
 * The count example below is the file's real subject. `<Badge>{items.length}</Badge>`
 * is the single most natural thing to write and the single most common way to
 * ship `12` onto a Persian page; `children: LumoNode` makes it TS2322 and
 * `formatNumber` makes it «۱۲».
 */

const t = {
  draft: { "fa-IR": "پیش‌نویس", "en-US": "Draft" },
  published: { "fa-IR": "منتشرشده", "en-US": "Published" },
  archived: { "fa-IR": "بایگانی", "en-US": "Archived" },
  expired: { "fa-IR": "منقضی", "en-US": "Expired" },
  review: { "fa-IR": "در انتظار بررسی", "en-US": "Awaiting review" },

  inbox: { "fa-IR": "صندوق ورودی", "en-US": "Inbox" },
  flagged: { "fa-IR": "نشان‌دار", "en-US": "Flagged" },
  spam: { "fa-IR": "هرزنامه", "en-US": "Spam" },

  proseLead: {
    "fa-IR": "این طرح تا پایان دورهٔ آزمایشی با وضعیت",
    "en-US": "This plan stays on the trial period with the status",
  },
  proseTail: {
    "fa-IR": "باقی می‌ماند و پس از آن به‌صورت خودکار فعال می‌شود.",
    "en-US": "and switches over to a paid subscription automatically afterwards.",
  },

  orderOne: { "fa-IR": "سفارش مرداد", "en-US": "August order" },
  orderTwo: { "fa-IR": "سفارش تیر", "en-US": "July order" },
  orderThree: { "fa-IR": "سفارش خرداد", "en-US": "June order" },
  delivered: { "fa-IR": "تحویل‌شده", "en-US": "Delivered" },
  onTheWay: { "fa-IR": "در راه", "en-US": "On the way" },
  cancelled: { "fa-IR": "لغوشده", "en-US": "Cancelled" },
} satisfies Record<string, LocalizedText>;

function CountsExample(l: Locale) {
  const counts = [
    { key: "inbox", label: t.inbox[l], value: 24, tone: "accent" as const },
    { key: "flagged", label: t.flagged[l], value: 3, tone: "caution" as const },
    { key: "spam", label: t.spam[l], value: 1268, tone: "neutral" as const },
  ];
  return (
    <ul className="flex w-full max-w-xs list-none flex-col gap-2 p-0">
      {counts.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 text-sm text-fg">
          <span>{row.label}</span>
          {/* Not `{row.value}` — that does not compile. */}
          <Badge tone={row.tone}>{formatNumber(row.value, l)}</Badge>
        </li>
      ))}
    </ul>
  );
}

function FillsExample(l: Locale) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{t.draft[l]}</Badge>
        <Badge tone="accent">{t.review[l]}</Badge>
        <Badge tone="positive">{t.published[l]}</Badge>
        <Badge tone="caution">{t.archived[l]}</Badge>
        <Badge tone="critical">{t.expired[l]}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="solid">{t.draft[l]}</Badge>
        <Badge variant="solid" tone="accent">
          {t.review[l]}
        </Badge>
        <Badge variant="solid" tone="positive">
          {t.published[l]}
        </Badge>
        <Badge variant="solid" tone="caution">
          {t.archived[l]}
        </Badge>
        <Badge variant="solid" tone="critical">
          {t.expired[l]}
        </Badge>
      </div>
    </div>
  );
}

function InProseExample(l: Locale) {
  return (
    <p className="max-w-prose text-sm text-fg">
      {t.proseLead[l]} <Badge tone="accent">{t.review[l]}</Badge> {t.proseTail[l]}
    </p>
  );
}

function ListExample(l: Locale) {
  const orders = [
    { key: "aug", name: t.orderOne[l], status: t.delivered[l], tone: "positive" as const },
    { key: "jul", name: t.orderTwo[l], status: t.onTheWay[l], tone: "accent" as const },
    { key: "jun", name: t.orderThree[l], status: t.cancelled[l], tone: "critical" as const },
  ];
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      {orders.map((order) => (
        <li
          key={order.key}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-sm"
        >
          <span className="text-fg">{order.name}</span>
          <Badge tone={order.tone}>
            <CircleDotIcon aria-hidden="true" />
            {order.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "display",
    title: { "fa-IR": "نشان", "en-US": "Badge" },
    intro: {
      "fa-IR":
        "نشانگر وضعیت: یک «span» با توکن‌ها روی آن. هیچ حالت، هیچ رویداد و هیچ وابستگی؛ پس روی سرور رندر می‌شود و هیچ جاوااسکریپتی نمی‌فرستد. پرکاربردترین محتوایش یک شمارش است و همان‌جاست که خراب می‌شود — به همین دلیل فرزندانش LumoNode هستند و عدد خام کامپایل نمی‌شود.",
      "en-US":
        "A status marker: a «span» with tokens on it. No state, no handler, no dependency, so it renders on the server and ships zero JavaScript. Its commonest content is a count, and a count is exactly where it breaks — which is why children are LumoNode and a bare number does not compile.",
    },
    composition: [
      `<Badge tone variant>       ← tone × variant are compoundVariants: colour only`,
      `  formatNumber or text     ← children are LumoNode; a bare number is TS2322`,
      `</Badge>`,
    ].join("\n"),
    parts: [
      {
        name: "Badge",
        description: {
          "fa-IR":
            "کل جزء. «span» است نه «div»، چون نشان تقریباً همیشه کنار متن می‌آید و عنصر بلوکی درون یک پاراگراف، اچ‌تی‌ام‌ال نامعتبری است که مرورگر با شکستن پاراگراف تعمیرش می‌کند. role=\"status\" هم ندارد: نشانی که در نخستین رسم حاضر است باید به‌ترتیب سند خوانده شود.",
          "en-US":
            "The whole component. A «span» rather than a «div», because a badge is almost always inline beside text and a block element inside a paragraph is invalid HTML that browsers repair by splitting the paragraph. No role=\"status\" either: a badge present at first paint should be read in document order.",
        },
      },
    ],
  },
  examples: [
    {
      id: "counts",
      title: { "fa-IR": "شمارش، از راه درست", "en-US": "A count, the correct way" },
      description: {
        "fa-IR":
          "هر سه عدد از formatNumber می‌گذرند، پس روی مسیر فارسی ارقام فارسی و جداکنندهٔ هزارگانِ عربی می‌آیند. نوشتن مستقیم مقدار عددی اینجا خطای کامپایل است، نه چیزی که در بازبینی دیده شود — و همین تفاوت میان یک قاعده و یک تذکر است.",
        "en-US":
          "All three numbers go through formatNumber, so the fa route gets Persian digits and U+066C as the thousands separator. Writing the value straight in is a COMPILE error here rather than something review has to catch — which is the whole difference between a rule and a reminder.",
      },
      render: CountsExample,
    },
    {
      id: "fills",
      title: { "fa-IR": "پُر و کم‌رنگ", "en-US": "Solid and subtle" },
      description: {
        "fa-IR":
          "پُرها text-bg می‌گیرند نه text-white. توکن‌های وضعیت میان دو پوسته روشنایی عوض می‌کنند، پس سفید روی حالت روشن درست است و روی حالت تیره به کنتراست حدود دو و نیم به یک می‌افتد — نقصی که فقط وقتی ظاهر می‌شود که سیستم‌عاملِ خواننده تیره باشد. text-bg با آن‌ها عوض می‌شود و جفت در هر دو پوسته خوانا می‌ماند.",
        "en-US":
          "The solid fills use text-bg, not text-white. The status tokens swap lightness between themes, so white is correct on light and roughly 2.4:1 on dark — a contrast failure that only appears when the READER's OS is in dark mode. text-bg swaps with them, so the pair stays legible in both.",
      },
      render: FillsExample,
    },
    {
      id: "in-prose",
      title: { "fa-IR": "درون جمله", "en-US": "Inside a sentence" },
      description: {
        "fa-IR":
          "نشان درون یک پاراگراف می‌نشیند و align-middle خط پایه را نگه می‌دارد. همین‌جاست که «span» بودن اهمیت پیدا می‌کند: یک «div» پاراگراف را به دو پاراگراف می‌شکند و متن پیرامون آن دیگر یک جمله نیست.",
        "en-US":
          "The badge sits inside a paragraph and align-middle keeps it on the baseline. This is where being a «span» pays: a «div» here splits the paragraph in two and the prose around it stops being one sentence.",
      },
      render: InProseExample,
    },
    {
      id: "in-a-list",
      title: { "fa-IR": "ستون وضعیت", "en-US": "A status column" },
      description: {
        "fa-IR":
          "هیچ‌یک از این سه نشان ناحیهٔ زنده نیست، پس صفحه‌خوان آن‌ها را در جای خودشان و پس از نام سفارش می‌شنود — نه سه بار پیش از رسیدن به فهرست. آیکون درون نشان aria-hidden است و اندازه‌اش را خود نشان تعیین می‌کند.",
        "en-US":
          "None of these three is a live region, so a screen reader meets them in place, after each order's name — not three times over before reaching the list at all. The icon inside is aria-hidden and the badge, not the caller, decides its size.",
      },
      render: ListExample,
    },
  ],
};
