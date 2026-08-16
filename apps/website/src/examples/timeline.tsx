import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatDate } from "@lumo-ui/core";
import { CheckIcon, ClockIcon, CreditCardIcon, PackageIcon, TruckIcon } from "lucide-react";
import { Timeline, TimelineBody, TimelineItem, TimelineTime, TimelineTitle } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the timeline page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `timeline.tsx` carries no `"use client"` either, so
 * every example on this page prerenders whole — which is the point worth
 * demonstrating rather than merely stating: an order history is content, and
 * content that needs a bundle to appear is a worse order history.
 *
 * The dates are built HERE, through `formatDate`, because `TimelineTime` takes
 * an already-formatted string — its own docblock argues why, and the argument
 * is the reason this page can prerender at all: a `Date` formatted inside a
 * directive-free component would be formatted in the SERVER's time zone. The
 * instants are fixed and the zone is explicit, so the prerendered bytes are the
 * same on every build machine. The same call `examples/message.tsx` makes.
 *
 * On the fa route this puts real Jalali months — «مرداد», not «اوت» — into the
 * served bytes, which is what `native-calendar` grades.
 */

const t = {
  placedTitle: { "fa-IR": "سفارش ثبت شد", "en-US": "Order placed" },
  placedBody: {
    "fa-IR": "سفارش شما ثبت شد و در انتظار تأیید پرداخت است.",
    "en-US": "Your order was registered and is waiting for payment confirmation.",
  },
  paidTitle: { "fa-IR": "پرداخت تأیید شد", "en-US": "Payment confirmed" },
  paidBody: {
    "fa-IR": "پرداخت از طریق درگاه بانکی با موفقیت انجام شد.",
    "en-US": "The payment went through the bank gateway successfully.",
  },
  packedTitle: { "fa-IR": "بسته‌بندی شد", "en-US": "Packed" },
  packedBody: {
    "fa-IR": "کالا از انبار تهران برداشته و بسته‌بندی شد.",
    "en-US": "The goods were picked from the Tehran warehouse and packed.",
  },
  shippedTitle: { "fa-IR": "تحویل پست شد", "en-US": "Handed to the courier" },
  shippedBody: {
    "fa-IR": "مرسوله به شرکت پست تحویل شد و کد رهگیری صادر شد.",
    "en-US": "The parcel was handed to the courier and a tracking code was issued.",
  },
  deliveryTitle: { "fa-IR": "در انتظار تحویل", "en-US": "Awaiting delivery" },
  deliveryBody: {
    "fa-IR": "پیش‌بینی می‌شود مرسوله تا دو روز کاری به دست شما برسد.",
    "en-US": "The parcel is expected to reach you within two working days.",
  },

  auditCreated: { "fa-IR": "پرونده ساخته شد", "en-US": "Case created" },
  auditAssigned: { "fa-IR": "به کارشناس ارجاع شد", "en-US": "Assigned to an agent" },
  auditClosed: { "fa-IR": "پرونده بسته شد", "en-US": "Case closed" },
  auditBy: { "fa-IR": "توسط سمیرا محمدی", "en-US": "By Samira Mohammadi" },

  refundTitle: { "fa-IR": "درخواست بازگشت وجه", "en-US": "Refund requested" },
  refundBody: {
    "fa-IR": "درخواست شما ثبت شد.",
    "en-US": "Your request was registered.",
  },
  rejectedTitle: { "fa-IR": "درخواست رد شد", "en-US": "Request rejected" },
  rejectedBody: {
    "fa-IR": "بازهٔ هفت‌روزهٔ بازگشت کالا گذشته بود.",
    "en-US": "The seven-day return window had already closed.",
  },
} satisfies Record<string, LocalizedText>;

/*
 * Fixed instants with an explicit zone. A `new Date()` here would rewrite the
 * prerendered bytes on every build, and an implicit zone would put the build
 * machine's midnight into a Tehran order history — see the file header.
 */
const PLACED = new Date("2026-08-05T09:15:00+03:30");
const PAID = new Date("2026-08-05T09:22:00+03:30");
const PACKED = new Date("2026-08-06T11:40:00+03:30");
const SHIPPED = new Date("2026-08-07T16:05:00+03:30");
const REQUESTED = new Date("2026-07-29T13:00:00+03:30");
const REJECTED = new Date("2026-07-30T10:30:00+03:30");

const DAY: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Tehran",
};

/** ISO 8601, and therefore Gregorian — see `TimelineTimeProps.dateTime`. */
function stamp(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function OrderExample(l: Locale) {
  return (
    <Timeline className="w-full max-w-md">
      <TimelineItem tone="positive" marker={<CheckIcon aria-hidden="true" className="size-4" />}>
        <TimelineTime dateTime={stamp(PLACED)}>{formatDate(PLACED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.placedTitle[l]}</TimelineTitle>
        <TimelineBody>{t.placedBody[l]}</TimelineBody>
      </TimelineItem>
      <TimelineItem
        tone="positive"
        marker={<CreditCardIcon aria-hidden="true" className="size-4" />}
      >
        <TimelineTime dateTime={stamp(PAID)}>{formatDate(PAID, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.paidTitle[l]}</TimelineTitle>
        <TimelineBody>{t.paidBody[l]}</TimelineBody>
      </TimelineItem>
      <TimelineItem tone="accent" marker={<TruckIcon aria-hidden="true" className="size-4" />}>
        <TimelineTime dateTime={stamp(SHIPPED)}>{formatDate(SHIPPED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.shippedTitle[l]}</TimelineTitle>
        <TimelineBody>{t.shippedBody[l]}</TimelineBody>
      </TimelineItem>
      <TimelineItem isLast marker={<ClockIcon aria-hidden="true" className="size-4" />}>
        <TimelineTitle>{t.deliveryTitle[l]}</TimelineTitle>
        <TimelineBody>{t.deliveryBody[l]}</TimelineBody>
      </TimelineItem>
    </Timeline>
  );
}

function ProgressExample(l: Locale) {
  return (
    <Timeline className="w-full max-w-md">
      <TimelineItem tone="positive" marker={<CheckIcon aria-hidden="true" className="size-4" />}>
        <TimelineTitle>{t.paidTitle[l]}</TimelineTitle>
      </TimelineItem>
      <TimelineItem tone="positive" marker={<PackageIcon aria-hidden="true" className="size-4" />}>
        <TimelineTime dateTime={stamp(PACKED)}>{formatDate(PACKED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.packedTitle[l]}</TimelineTitle>
      </TimelineItem>
      <TimelineItem tone="accent" marker={<TruckIcon aria-hidden="true" className="size-4" />}>
        <TimelineTitle>{t.shippedTitle[l]}</TimelineTitle>
      </TimelineItem>
      <TimelineItem isLast>
        <TimelineTitle>{t.deliveryTitle[l]}</TimelineTitle>
      </TimelineItem>
    </Timeline>
  );
}

function PlainExample(l: Locale) {
  return (
    <Timeline className="w-full max-w-md">
      <TimelineItem>
        <TimelineTime dateTime={stamp(PLACED)}>{formatDate(PLACED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.auditCreated[l]}</TimelineTitle>
      </TimelineItem>
      <TimelineItem>
        <TimelineTime dateTime={stamp(PACKED)}>{formatDate(PACKED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.auditAssigned[l]}</TimelineTitle>
        <TimelineBody>{t.auditBy[l]}</TimelineBody>
      </TimelineItem>
      <TimelineItem isLast>
        <TimelineTime dateTime={stamp(SHIPPED)}>{formatDate(SHIPPED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.auditClosed[l]}</TimelineTitle>
      </TimelineItem>
    </Timeline>
  );
}

function CriticalExample(l: Locale) {
  return (
    <Timeline className="w-full max-w-md">
      <TimelineItem tone="accent" marker={<ClockIcon aria-hidden="true" className="size-4" />}>
        <TimelineTime dateTime={stamp(REQUESTED)}>{formatDate(REQUESTED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.refundTitle[l]}</TimelineTitle>
        <TimelineBody>{t.refundBody[l]}</TimelineBody>
      </TimelineItem>
      <TimelineItem isLast tone="critical">
        <TimelineTime dateTime={stamp(REJECTED)}>{formatDate(REJECTED, l, DAY)}</TimelineTime>
        <TimelineTitle>{t.rejectedTitle[l]}</TimelineTitle>
        <TimelineBody>{t.rejectedBody[l]}</TimelineBody>
      </TimelineItem>
    </Timeline>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "دنباله‌ای از رویدادها در امتداد یک ریل: تاریخچهٔ سفارش، ردّ ممیزی، یادداشت‌های انتشار.",
        "en-US": "A sequence of events down a rail: an order history, an audit trail, release notes.",
      },
      whenNot: {
        "fa-IR": "جریانی رو به جلو با مرحلهٔ جاری — `Steps`. کارهایی با مدت — `Gantt`. پیام‌های گفتگو — `Message`.",
        "en-US": "A forward flow with a current step — `Steps`. Tasks with duration — `Gantt`. Chat messages — `Message`.",
      },
    },
    tier: "display",
    isNew: true,
    title: { "fa-IR": "خط زمان", "en-US": "Timeline" },
    intro: {
      "fa-IR":
        "دنبالهٔ رویدادها روی یک ریل — تاریخچهٔ سفارش، رد پای تغییرات. ریل و نقطه و متن هر سه روی محور افقی می‌نشینند، یعنی همان محوری که آینه می‌شود، و هر سه با ویژگی‌های منطقی نوشته شده‌اند تا با یک رشتهٔ کلاس در فارسی از راست و در انگلیسی از چپ کشیده شوند. نشانه‌گذاری «ol» است چون ترتیب، خودِ اطلاعات است.",
      "en-US":
        "A sequence of events down a rail — an order history, an audit trail. The rail, the dots and the text all sit on the horizontal axis, which is the axis that mirrors, and all three are written logically so one class string draws the rail on the reader's own leading edge in both scripts. The markup is an «ol» because the order IS the information.",
    },
    composition: [
      `<Timeline>                                 ← an <ol>: the order is the information`,
      `  <TimelineItem tone marker isLast>        ← tone colours the dot AND the rail below it`,
      `    <TimelineTime dateTime>                ← already-formatted text; dateTime is ISO`,
      `    <TimelineTitle>                        ← the step's real name`,
      `    <TimelineBody>`,
      `  </TimelineItem>`,
      `</Timeline>`,
    ].join("\n"),
    parts: [
      {
        name: "Timeline",
        description: {
          "fa-IR":
            "خودِ فهرست، یک «ol». شماره‌های دیداری خاموش‌اند چون نقطه‌ها همان شماره‌اند، اما معنای ترتیبی برای صفحه‌خوان می‌ماند.",
          "en-US":
            "The list itself, an «ol». The visible numbering is suppressed because the dots are the numbering, but the ordered semantics stay for a screen reader.",
        },
      },
      {
        name: "TimelineItem",
        description: {
          "fa-IR":
            "یک رویداد. tone هم نقطه و هم قطعهٔ ریلِ زیرِ آن را رنگ می‌کند، پس پیشرفت فقط از کلاس‌های هر مورد ساخته می‌شود بدون هیچ حساب‌وکتاب شاخص. isLast ریل را قطع می‌کند.",
          "en-US":
            "One event. tone colours both the dot and the rail segment BELOW it, so progress is built from per-item classes alone with no index arithmetic. isLast ends the rail.",
        },
      },
      {
        name: "TimelineTime",
        description: {
          "fa-IR":
            "زمان، به‌صورت رشتهٔ از پیش قالب‌بندی‌شده. dateTime عمداً میلادی است: آن را نرم‌افزار می‌خواند و ایزو ۸۶۰۱ تقویم دیگری ندارد.",
          "en-US":
            "The time, as an already-formatted string. dateTime is Gregorian on purpose: software reads it, and ISO 8601 has no other calendar.",
        },
      },
      {
        name: "TimelineTitle",
        description: {
          "fa-IR":
            "نام رویداد. معنا اینجاست، نه در آیکون — آیکون تزئینی است و باید aria-hidden بگیرد.",
          "en-US":
            "The event's name. The meaning lives here, not in the icon — the icon is decorative and must carry aria-hidden.",
        },
      },
      {
        name: "TimelineBody",
        description: {
          "fa-IR": "توضیح اختیاری زیر عنوان.",
          "en-US": "The optional explanation under the title.",
        },
      },
    ],
  },
  examples: [
    {
      id: "order",
      title: { "fa-IR": "تاریخچهٔ سفارش", "en-US": "Order history" },
      description: {
        "fa-IR":
          "تاریخ‌ها با formatDate ساخته می‌شوند، پس روی مسیر فارسی ماهِ جلالی می‌آید — «مرداد» و نه «اوت» — در حالی که dateTime کنارش میلادی می‌ماند. این دو با هم ناسازگار نیستند؛ یک لحظه‌اند که برای دو خواننده نوشته شده‌اند.",
        "en-US":
          "The dates are built with formatDate, so the fa route gets a Jalali month — «مرداد», not «اوت» — while the dateTime beside it stays Gregorian. The two are not inconsistent; they are one instant written for two different readers.",
      },
      render: OrderExample,
    },
    {
      id: "progress",
      title: { "fa-IR": "نمایش پیشرفت", "en-US": "Showing progress" },
      description: {
        "fa-IR":
          "قطعهٔ ریل به موردِ بالای خودش تعلق دارد، و همین یک تصمیم است که پیشرفت را ممکن می‌کند: مراحل انجام‌شده tone خودشان را می‌گیرند و بقیه خنثی می‌مانند، بدون آنکه فهرست بداند کجای کار است.",
        "en-US":
          "The rail segment belongs to the item ABOVE it, and that one decision is what makes progress expressible: finished steps carry their own tone and the rest stay neutral, without the list knowing where the work has got to.",
      },
      render: ProgressExample,
    },
    {
      id: "plain",
      title: { "fa-IR": "بدون آیکون", "en-US": "Without icons" },
      description: {
        "fa-IR":
          "marker اختیاری است و نبودش یک نقطهٔ توپر می‌دهد. برای رد پای تغییرات معمولاً همین درست است: آیکونی که برای هر ردیف تکرار شود چیزی به آن اضافه نمی‌کند.",
        "en-US":
          "marker is optional, and leaving it out gives a plain filled dot. For an audit trail that is usually right: an icon repeated on every row adds nothing to it.",
      },
      render: PlainExample,
    },
    {
      id: "critical",
      title: { "fa-IR": "پایانِ ناموفق", "en-US": "An unhappy ending" },
      description: {
        "fa-IR":
          "tone فقط برای موفقیت نیست. آخرین مورد isLast می‌گیرد تا ریل زیر آن کشیده نشود — قطعه‌ای که زیر رویداد پایانی آویزان بماند وعدهٔ چیزی است که وجود ندارد.",
        "en-US":
          "tone is not only for success. The final item takes isLast so no rail is drawn below it — a segment hanging under the last event is a promise of something that is not there.",
      },
      render: CriticalExample,
    },
  ],
};
