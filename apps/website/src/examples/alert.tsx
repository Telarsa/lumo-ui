import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { CheckCircleIcon, InfoIcon, TriangleAlertIcon, XCircleIcon } from "lucide-react";
import { Alert } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the alert page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `alert.tsx` carries no `"use client"` either — a callout
 * is prose with a coloured edge, and prose that needs a bundle to appear is a
 * worse callout.
 *
 * The subject of this page is a DEFAULT: `live="off"`. Every alert below except
 * the ones in «اعلام‌شده» is outside the accessibility tree's live machinery,
 * so a screen reader meets them in document order like the paragraphs they are.
 * That is the opposite of what most libraries ship, and the component's docblock
 * argues why at length — a page of four `role="alert"` callouts reads all four
 * before the reader has arrived at any of them.
 */

const t = {
  infoTitle: { "fa-IR": "تغییر ساعت پشتیبانی", "en-US": "Support hours have changed" },
  infoBody: {
    "fa-IR": "از ابتدای مهر، پاسخگویی تلفنی تا ساعت هشت شب ادامه دارد.",
    "en-US": "From the start of the autumn term, the phone line stays open until eight in the evening.",
  },
  okTitle: { "fa-IR": "تنظیمات ذخیره شد", "en-US": "Settings saved" },
  okBody: {
    "fa-IR": "تغییرهای شما روی همهٔ دستگاه‌های متصل اعمال شد.",
    "en-US": "Your changes were applied across every connected device.",
  },
  cautionTitle: { "fa-IR": "اعتبار رو به پایان است", "en-US": "Your credit is running out" },
  cautionBody: {
    "fa-IR": "با مصرف فعلی، اعتبار حساب کمتر از یک هفتهٔ دیگر تمام می‌شود.",
    "en-US": "At the current rate, the balance on this account runs out in under a week.",
  },
  badTitle: { "fa-IR": "پرداخت ناموفق بود", "en-US": "The payment failed" },
  badBody: {
    "fa-IR": "بانک تراکنش را رد کرد. کارت دیگری را امتحان کنید.",
    "en-US": "The bank declined the transaction. Try another card.",
  },

  politeTitle: { "fa-IR": "پیش‌نویس ذخیره شد", "en-US": "Draft saved" },
  politeBody: {
    "fa-IR": "این پیام پس از یک کنش کاربر ساخته می‌شود، پس نقش status می‌گیرد و در اولین مکث خوانده می‌شود.",
    "en-US": "This message is produced after something the user did, so it takes role status and is read at the next pause.",
  },
  assertiveTitle: { "fa-IR": "ارتباط با سرور قطع شد", "en-US": "The connection to the server dropped" },
  assertiveBody: {
    "fa-IR": "کار نیمه‌تمام شما ذخیره نشده است. پیش از هر چیز اتصال را بررسی کنید.",
    "en-US": "Your unsaved work is still here. Check the connection before doing anything else.",
  },

  refTitle: { "fa-IR": "شمارهٔ پیگیری تراکنش", "en-US": "Transaction reference" },
  refBody: {
    "fa-IR": "این شماره را برای پیگیری نزد خود نگه دارید:",
    "en-US": "Keep this number to follow the transaction up:",
  },

  plainBody: {
    "fa-IR": "برای ثبت سفارش‌های بالای دو میلیون تومان، تأیید تلفنی هم لازم است.",
    "en-US": "Orders above two million toman also need a confirmation by phone.",
  },
} satisfies Record<string, LocalizedText>;

/** A single unbroken token, of the shape that overflows a flex item. */
const REFERENCE = 9081440225712345;

function TonesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Alert tone="info" icon={<InfoIcon aria-hidden="true" />} title={t.infoTitle[l]}>
        {t.infoBody[l]}
      </Alert>
      <Alert tone="positive" icon={<CheckCircleIcon aria-hidden="true" />} title={t.okTitle[l]}>
        {t.okBody[l]}
      </Alert>
      <Alert
        tone="caution"
        icon={<TriangleAlertIcon aria-hidden="true" />}
        title={t.cautionTitle[l]}
      >
        {t.cautionBody[l]}
      </Alert>
      <Alert tone="critical" icon={<XCircleIcon aria-hidden="true" />} title={t.badTitle[l]}>
        {t.badBody[l]}
      </Alert>
    </div>
  );
}

function LiveExample(l: Locale) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {/* role="status" — waits for a pause instead of interrupting. */}
      <Alert live="polite" tone="positive" title={t.politeTitle[l]}>
        {t.politeBody[l]}
      </Alert>
      {/* role="alert" — interrupts. Reserved for a change the reader must know about now. */}
      <Alert live="assertive" tone="critical" title={t.assertiveTitle[l]}>
        {t.assertiveBody[l]}
      </Alert>
    </div>
  );
}

function OverflowExample(l: Locale) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <Alert tone="info" icon={<InfoIcon aria-hidden="true" />} title={t.refTitle[l]}>
        <p className="m-0">{t.refBody[l]}</p>
        <p className="m-0 font-mono">{formatNumber(REFERENCE, l, { useGrouping: false })}</p>
      </Alert>
    </div>
  );
}

function PlainExample(l: Locale) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Alert tone="caution">{t.plainBody[l]}</Alert>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "feedback",
    title: { "fa-IR": "هشدار", "en-US": "Alert" },
    intro: {
      "fa-IR":
        "پیام درون‌صفحه‌ای در چهار لحن. دو تصمیم این جزء را می‌سازد: نوار رنگی با border-s روی لبهٔ خواندن می‌نشیند و بدون هیچ قاعدهٔ rtl قرینه می‌شود، و ناحیهٔ زنده به‌طور پیش‌فرض خاموش است. لحن و فوریت دو چیز جدا هستند — هشداری با لحن critical که از اول در صفحه بوده فوری نیست، و پیامی با لحن info که همین حالا ساخته شده ممکن است باشد.",
      "en-US":
        "An inline message in four tones. Two decisions make the component: the coloured bar is a border-s, so it sits on the reader's leading edge with no rtl rule anywhere, and the live region is OFF by default. Tone and urgency are separate facts — a critical alert that has always been on the page is not urgent, and an info alert that just appeared may be.",
    },
    composition: [
      `<Alert tone live icon title>   ← live defaults to "off": no role, read in document order`,
      `  the body                     ← prose stays text-fg; only the icon takes the tone colour`,
      `</Alert>`,
    ].join("\n"),
    parts: [
      {
        name: "Alert",
        description: {
          "fa-IR":
            "کل جزء. live ویژگی‌ای است که نقش را تعیین می‌کند: off یعنی هیچ نقشی، polite یعنی status و assertive یعنی alert. title یک «p» است نه سرفصل، چون پیامی گذرا نباید وارد فهرست سرفصل‌های صفحه شود.",
          "en-US":
            "The whole component. live is what picks the role: off means no role at all, polite gives status, assertive gives alert. title renders as a «p» rather than a heading — a transient message has no business in the outline a screen-reader user navigates by.",
        },
      },
    ],
  },
  examples: [
    {
      id: "tones",
      title: { "fa-IR": "چهار لحن، بی‌صدا", "en-US": "Four tones, none of them live" },
      description: {
        "fa-IR":
          "هیچ‌کدام از این چهار هشدار نقش ندارد، چون هر چهار در بایت اول صفحه بوده‌اند. رنگ فقط روی آیکون می‌نشیند و متن text-fg می‌ماند: رنگ‌کردن نثر به لحن، متنِ caution را روی زمینهٔ تیره‌شده به مرز کنتراست می‌رساند، در حالی که آیکون فقط باید سه به یک را رد کند.",
        "en-US":
          "None of these four carries a role, because all four were in the page's first byte. The colour lives on the ICON and the prose stays text-fg: tinting the prose to match the tone pushes caution text to the edge of its contrast budget, while an icon only has to clear the 3:1 non-text threshold.",
      },
      render: TonesExample,
    },
    {
      id: "announced",
      title: { "fa-IR": "وقتی باید اعلام شود", "en-US": "When it must be announced" },
      description: {
        "fa-IR":
          "این تنها جای صفحه است که ناحیهٔ زنده روشن است، و بهایش را همین صفحه می‌پردازد: چون هر دو در بارگذاری حاضرند، برخی صفحه‌خوان‌ها آن‌ها را پیش از رسیدن خواننده می‌خوانند — دقیقاً همان چیزی که پیش‌فرض off برای جلوگیری از آن وجود دارد. live را وقتی بدهید که پیام در پاسخ به کنشی ساخته شده باشد.",
        "en-US":
          "This is the only place on the page where the live region is on, and this page pays the price for it: both are present at load, so several screen readers read them before the reader has arrived — exactly what the off default exists to prevent. Pass live only when the message was PRODUCED in response to something.",
      },
      render: LiveExample,
    },
    {
      id: "overflow",
      title: { "fa-IR": "یک نشانهٔ نشکستنی", "en-US": "One unbreakable token" },
      description: {
        "fa-IR":
          "ستون متن کمینه‌عرضِ صفر می‌گیرد و همین یک کلاس باربر است: فرزند یک flex به‌طور پیش‌فرض کمینه‌عرضِ خودکار دارد، پس یک شمارهٔ بلند به‌جای شکستن، خودِ هشدار را از قاب بیرون می‌برد. در راست‌چین این سرریز به سمت چپ فرار می‌کند، جایی که بازبینی افقی در عرض کم کمتر دنبالش می‌گردد.",
        "en-US":
          "The text column carries min-w-0, and that class is load-bearing: a flex item defaults to min-width auto, so a long reference pushes the whole alert past its container instead of wrapping. Under RTL that overflow escapes to the LEFT, which is where a narrow-viewport sweep is least likely to look for it.",
      },
      render: OverflowExample,
    },
    {
      id: "plain",
      title: { "fa-IR": "بدون عنوان و بدون آیکون", "en-US": "No title, no icon" },
      description: {
        "fa-IR":
          "هر دو اختیاری‌اند و برای یک جملهٔ کوتاه، نبودشان درست‌تر است. عنوانی که خلاصهٔ همان یک جمله باشد، چیزی جز یک ایستگاه اضافه برای صفحه‌خوان اضافه نمی‌کند.",
        "en-US":
          "Both are optional, and for a single sentence leaving them out is the better answer. A title that summarises the one sentence below it adds nothing but an extra stop for a screen reader.",
      },
      render: PlainExample,
    },
  ],
};
