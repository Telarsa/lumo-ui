import type { Locale } from "@lumo-ui/core";
import { Skeleton, Spinner } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the skeleton page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `skeleton.tsx` has no `"use client"` either — which
 * matters more here than almost anywhere else, because the skeleton is the
 * component most often rendered from a server `loading.tsx`, where a client
 * directive would be actively wrong.
 *
 * Every block below is `aria-hidden`, without exception and with no way to turn
 * it off. A skeleton has no content, so there is nothing to announce and a stack
 * of them would produce a run of empty group nodes. Loading is a STATE, not a
 * picture of a state: the third example is the one that says so properly, with
 * `aria-busy` on the region and a named `Spinner` beside it.
 */

const t = {
  loadingOrders: { "fa-IR": "در حال بارگذاری سفارش‌ها…", "en-US": "Loading the orders…" },
} satisfies Record<string, LocalizedText>;

function ArticleExample(_l: Locale) {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Skeleton shape="heading" />
      <Skeleton shape="text" />
      <Skeleton shape="text" />
      <Skeleton shape="text" className="w-4/5" />
    </div>
  );
}

function CardExample(_l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <Skeleton shape="rect" className="h-32 w-full" />
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="size-10" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton shape="text" className="h-3 w-1/2" />
          <Skeleton shape="text" className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

function BusyRegionExample(l: Locale) {
  return (
    <div
      aria-busy="true"
      className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      {/*
       * The blocks say nothing. This does: `aria-busy` on the region being
       * replaced, and one named live region beside it.
       */}
      <Spinner size="sm" label={t.loadingOrders[l]} showLabel />
      <Skeleton shape="text" />
      <Skeleton shape="text" />
      <Skeleton shape="text" className="w-2/3" />
    </div>
  );
}

function ListExample(_l: Locale) {
  const rows = ["one", "two", "three"];
  return (
    <ul className="flex w-full max-w-md list-none flex-col gap-2 p-0">
      {rows.map((row) => (
        <li
          key={row}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
        >
          <Skeleton shape="circle" className="size-8" />
          <Skeleton shape="text" className="h-3 w-1/3" />
          <Skeleton shape="text" className="ms-auto h-3 w-16" />
        </li>
      ))}
    </ul>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "شکل خالی محتوایی که هنوز نرسیده، به اندازه‌ای که خواهد گرفت.",
        "en-US": "The empty shape of content that has not arrived, drawn to the size it will take.",
      },
      whenNot: {
        "fa-IR": "یک پاراگراف، کارت، فرم یا جدول کامل — پیش‌ساخته‌های `SkeletonText`، `SkeletonCard`، `SkeletonForm`، `SkeletonTable`. انتظار برای یک عملیات — `Spinner`. پیشرفت معلوم — `ProgressBar`.",
        "en-US": "A whole paragraph, card, form or table — the presets `SkeletonText`, `SkeletonCard`, `SkeletonForm`, `SkeletonTable`. Waiting on an operation — `Spinner`. A known progress — `ProgressBar`.",
      },
    },
    tier: "feedback",
    title: { "fa-IR": "اسکلت", "en-US": "Skeleton" },
    intro: {
      "fa-IR":
        "قالبِ خالیِ محتوایی که هنوز نرسیده. انیمیشنش تپش است نه درخشش، و این یک تصمیم راست‌چین است: درخششی که از یک لبه به لبهٔ دیگر می‌رود، هم محور گرادیان و هم علامت جابه‌جایی‌اش فیزیکی است، در راست‌چین خلاف جهت خواندن می‌دود و شبیه بیرون‌رفتن محتوا می‌شود — و کی‌فریم شکل منطقی ندارد، پس اصلاحش یعنی یک نسخهٔ قرینه که باید دستی هم‌گام بماند. تپش روی شفافیت کار می‌کند و شفافیت جهت ندارد.",
      "en-US":
        "The empty shape of content that has not arrived. Its animation is a pulse rather than a shimmer, and that is an RTL decision: a highlight sweeping from one edge to the other is physical in both halves — the gradient axis and the sign of the translate — so under RTL it runs against the reading direction and reads as content sliding OUT. Keyframes have no logical form, so fixing that means a mirrored copy kept in sync by hand. A pulse animates opacity, and opacity has no direction.",
    },
    composition: [
      `<Skeleton shape className />   ← text | heading | circle | rect`,
      `                               ← always aria-hidden, with no way to turn it off`,
      `                               ← circle and rect take their size from className`,
    ].join("\n"),
    parts: [
      {
        name: "Skeleton",
        description: {
          "fa-IR":
            "کل جزء. چهار شکل دارد: text و heading ارتفاع و عرض خودشان را می‌آورند، circle و rect اندازه را از className می‌گیرند. زیر تنظیم کاهش حرکت، انیمیشن کاملاً خاموش می‌شود و این بی‌خطر است — شکل و جای بلوک هنوز می‌گویند چیزی در راه است.",
          "en-US":
            "The whole component. Four shapes: text and heading bring their own height and width, circle and rect take their size from className. Under the reduced-motion preference the animation stops entirely, which is safe here — the block's shape and position still say \"pending\".",
        },
      },
    ],
  },
  examples: [
    {
      id: "article",
      title: { "fa-IR": "یک بلوک متن", "en-US": "A block of text" },
      description: {
        "fa-IR":
          "شکل heading عمداً کوتاه‌تر از تمام عرض است تا پشته‌ای از خط‌ها شبیه دیوار نشود، و خط آخر با یک کلاس کوتاه‌تر می‌شود؛ بند واقعی هم خط آخرش کوتاه است، و همین جزئیات است که قالب را از یک مستطیل خاکستری جدا می‌کند.",
        "en-US":
          "The heading shape is deliberately narrower than full width so a stack of lines does not read as a wall, and the last line is shortened with one class; a real paragraph's last line is short too, and it is that detail that separates a placeholder from a grey rectangle.",
      },
      render: ArticleExample,
    },
    {
      id: "card",
      title: { "fa-IR": "قالبِ یک کارت", "en-US": "The shape of a card" },
      description: {
        "fa-IR":
          "circle و rect اندازه‌ای از خودشان ندارند، و این محدودیت نیست: قالب باید هم‌اندازهٔ چیزی باشد که جایش را می‌گیرد، وگرنه در لحظهٔ رسیدن محتوا چیدمان می‌پرد — و آن پرش، دقیقاً همان چیزی است که قالب برای جلوگیری از آن گذاشته شده.",
        "en-US":
          "circle and rect carry no size of their own, and that is not a limitation: a placeholder has to be the size of the thing it stands in for, or the layout jumps the moment the content lands — and that jump is exactly what the placeholder was put there to prevent.",
      },
      render: CardExample,
    },
    {
      id: "busy-region",
      title: { "fa-IR": "کسی که این را می‌شنود", "en-US": "The reader who hears this" },
      description: {
        "fa-IR":
          "بدون این نمونه، صفحه‌خوان از هیچ‌کدام از قالب‌های بالا چیزی نمی‌شنود — که درست است، چون آن‌ها محتوا نیستند. خبرِ «در حال بارگذاری» جای دیگری زندگی می‌کند: aria-busy روی ناحیه‌ای که جایگزین می‌شود، و یک Spinner با نامِ نوشته‌شده کنارش.",
        "en-US":
          "Without this example a screen reader hears nothing from any of the placeholders above — which is correct, because they are not content. The \"loading\" fact lives somewhere else: aria-busy on the region being replaced, and one Spinner with a written name beside it.",
      },
      render: BusyRegionExample,
    },
    {
      id: "list",
      title: { "fa-IR": "ردیف‌های یک فهرست", "en-US": "The rows of a list" },
      description: {
        "fa-IR":
          "بلوک سمت پایانی با ms-auto رانده می‌شود نه با ml-auto: حاشیهٔ خودکارِ منطقی در فارسی به چپ می‌افتد و در انگلیسی به راست، با همان یک کلاس. نسخهٔ فیزیکی‌اش پرتکرارترین ایراد در ردیف‌های فهرست است.",
        "en-US":
          "The trailing block is pushed with ms-auto rather than ml-auto: the logical auto margin lands on the left in Persian and on the right in English from the same class. The physical version of that line is the commonest defect in list rows.",
      },
      render: ListExample,
    },
  ],
};
