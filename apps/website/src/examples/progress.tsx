import type { Locale } from "@lumo-ui/core";
import { Meter, ProgressBar } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the progress page. Contract: `_system/types.ts`.
 *
 * A SERVER module. `progress.tsx` itself carries `"use client"` because it wraps
 * Base UI, but nothing here passes it a function, so every bar below is rendered
 * from the server and arrives whole in the first byte.
 *
 * The subject of this page is a NUMBER THAT IS ANNOUNCED. Base UI formats the
 * value itself, from its own `locale` prop, which defaults to the runtime's —
 * so a Persian page built on an `en-US` machine announces `45%` in Latin digits
 * beside a Persian label, type-checks, and is wrong only to the person
 * listening. Lumo replaces that string wholesale through `getAriaValueText`, and
 * the VISIBLE value comes from the same JavaScript value, so the two cannot
 * drift. `locale` is a required prop for exactly this reason.
 *
 * The other half is the trap: `formatOptions` is NOT Base UI's `format`. A
 * percent style applies to the FRACTION here and to the CLAMPED VALUE there, so
 * forwarding one to the other makes a value of forty-five announce «۴٬۵۰۰٪».
 */

const t = {
  upload: { "fa-IR": "بارگذاری پروندهٔ قرارداد", "en-US": "Uploading the contract file" },
  importing: { "fa-IR": "درون‌ریزی فهرست کالاها", "en-US": "Importing the product list" },
  rendering: { "fa-IR": "آماده‌سازی گزارش فصلی", "en-US": "Preparing the quarterly report" },

  transferred: { "fa-IR": "حجم منتقل‌شده", "en-US": "Transferred so far" },
  quota: { "fa-IR": "فضای مصرف‌شدهٔ حساب", "en-US": "Account storage in use" },
  battery: { "fa-IR": "شارژ دستگاه پایانهٔ فروش", "en-US": "Charge on the card terminal" },
  seats: { "fa-IR": "صندلی‌های واگذارشده از کل قرارداد", "en-US": "Seats assigned out of the contract" },
} satisfies Record<string, LocalizedText>;

const MEGABYTES: Intl.NumberFormatOptions = {
  style: "unit",
  unit: "megabyte",
  maximumFractionDigits: 0,
};

function UploadExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <ProgressBar label={t.upload[l]} locale={l} value={68} showValue />
      <ProgressBar label={t.importing[l]} locale={l} value={34} showValue tone="positive" />
    </div>
  );
}

function IndeterminateExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <ProgressBar label={t.rendering[l]} locale={l} isIndeterminate showValue />
    </div>
  );
}

function BytesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <ProgressBar
        label={t.transferred[l]}
        locale={l}
        value={184}
        maxValue={512}
        formatOptions={MEGABYTES}
        showValue
      />
    </div>
  );
}

function MeterExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <Meter label={t.quota[l]} locale={l} value={94} tone="critical" showValue />
      <Meter label={t.battery[l]} locale={l} value={41} tone="caution" showValue size="sm" />
    </div>
  );
}

function RangeExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <Meter
        label={t.seats[l]}
        locale={l}
        value={19}
        minValue={5}
        maxValue={40}
        showValue
        size="lg"
      />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "feedback",
    title: { "fa-IR": "نوار پیشرفت و سنجه", "en-US": "Progress bar and meter" },
    intro: {
      "fa-IR":
        "دو چیز که شبیه هم‌اند و یکی نیستند: نوار پیشرفت یک عملیات در جریان است و سنجه یک کمیت درون یک بازه. هر دو label و locale را اجباری می‌خواهند، و دومی همان چیزی است که این پرونده برایش وجود دارد — موتور زیرین عدد را خودش قالب‌بندی می‌کند و زبانش را از زمان اجرا می‌گیرد، یعنی روی سرور از جایی که هیچ خواننده‌ای در آن نیست. اینجا عدد از formatNumber می‌گذرد و همان رشته هم دیده و هم اعلام می‌شود.",
      "en-US":
        "Two things that look alike and are not: a progress bar is an operation in flight, a meter is a quantity within a range. Both require label and locale, and the second is why this file exists — the underlying engine formats the number itself and takes its language from the runtime, i.e. on the server from somewhere no reader lives. Here the number goes through formatNumber, and the same string is both drawn and announced.",
    },
    composition: [
      `<ProgressBar label locale value minValue maxValue isIndeterminate`,
      `             formatOptions showValue tone size />`,
      `                        ← formatOptions is NOT the engine's own format prop`,
      `<Meter label locale value minValue maxValue formatOptions showValue tone size />`,
      `                        ← never indeterminate: an unknown quantity within a`,
      `                           known range is not a thing a meter can express`,
    ].join("\n"),
    parts: [
      {
        name: "ProgressBar",
        description: {
          "fa-IR":
            "عملیات در جریان. حالت نامعین از ویژگی خودِ موتور می‌آید نه از یک گونهٔ محاسبه‌شده، و به‌جای نوار کشویی یک تپش تمام‌عرض دارد: انیمیشن کشویی با درصدهای فیزیکی نوشته می‌شود و در راست‌چین وارونه می‌دود، و کی‌فریم شکل منطقی ندارد که بشود اصلاحش کرد.",
          "en-US":
            "An operation in flight. The indeterminate state comes from the engine's own attribute rather than a computed variant, and instead of a sliding bar it pulses full width: a sliding animation is authored in physical percentages, runs backwards under RTL, and keyframes have no logical form to correct.",
        },
      },
      {
        name: "Meter",
        description: {
          "fa-IR":
            "کمیت درون بازه. اینجا رنگ معنا دارد — نود درصدِ سهمیهٔ فضا خبری از جنس دیگری است تا نود درصدِ یک دانلود — و چون رنگ به‌تنهایی نباید حامل خبر باشد، سنجهٔ بحرانی را با متنی همراه کنید که همان را بگوید.",
          "en-US":
            "A quantity within a range. Here the tone carries meaning — ninety per cent of a disk quota is a different fact from ninety per cent of a download — and since colour alone must not be the only carrier, pair a critical meter with text that says so.",
        },
      },
    ],
  },
  examples: [
    {
      id: "upload",
      title: { "fa-IR": "یک بارگذاری، با مقدار دیدنی", "en-US": "An upload, with the value shown" },
      description: {
        "fa-IR":
          "عددی که می‌بینید و عددی که اعلام می‌شود یک متغیر جاوااسکریپتی‌اند، نه دو رشته که کنار هم نگه داشته شده‌اند. برچسب در هر دو حالت رندر می‌شود — دیدنی یا sr-only — پس روشن‌کردن showValue چیزی را که خوانده می‌شود عوض نمی‌کند.",
        "en-US":
          "The number you see and the number that is announced are one JavaScript value, not two strings kept in step. The label element is rendered in both cases — visible or sr-only — so turning showValue on cannot change what is announced.",
      },
      render: UploadExample,
    },
    {
      id: "indeterminate",
      title: { "fa-IR": "بدون مدت معلوم", "en-US": "With no known duration" },
      description: {
        "fa-IR":
          "اینجا عددی نیست که غلط به‌نظر برسد، و دقیقاً همین حالت است که موتور یک عبارت انگلیسی در ویژگی aria می‌گذارد. آن عبارت از فهرست واژگانِ خودِ موتور جایگزین می‌شود، نه با یک ویژگی اجباری تازه: «پیشرفت نامعین» در هر برنامه‌ای همان است و واژگان موتور دربارهٔ خودش است، در حالی که label کار مصرف‌کننده را نام می‌برد.",
        "en-US":
          "There is no number here to look wrong, and this is precisely the state where the engine puts an English phrase into an ARIA attribute. That phrase is replaced from the engine's own string catalogue rather than by a new required prop: «پیشرفت نامعین» is the same phrase in every application that renders one, while label names the CONSUMER's task.",
      },
      render: IndeterminateExample,
    },
    {
      id: "byte-counter",
      title: { "fa-IR": "شمارندهٔ حجم", "en-US": "A byte counter" },
      description: {
        "fa-IR":
          "با formatOptions غیردرصدی، مقدار خام قالب‌بندی می‌شود نه کسر — همان انشعابی که موتور و موتور فعلی هر دو دارند، پس رفتار مطابق مستندات هر دو است. یکا هم از Intl می‌آید، پس ارقام روی مسیر فارسی فارسی می‌مانند.",
        "en-US":
          "With a non-percent formatOptions the RAW value is formatted rather than the fraction — the same branch React Aria and the current engine both take, so the behaviour matches both libraries' documentation. The unit comes from Intl too, so the digits stay Persian on the fa route.",
      },
      render: BytesExample,
    },
    {
      id: "meter",
      title: { "fa-IR": "سنجه، جایی که رنگ خبر است", "en-US": "A meter, where the colour is news" },
      description: {
        "fa-IR":
          "سنجه هیچ ویژگی حالتی ندارد و این کمبود نیست: سنجه نه نامعین می‌شود، نه کامل، نه غیرفعال. هر دو نمونه showValue دارند تا همان خبری که رنگ می‌دهد در متن هم گفته شود.",
        "en-US":
          "A meter publishes no state attributes at all, and that is not an omission: a meter is never indeterminate, never complete and never disabled. Both examples carry showValue so the fact the colour is carrying is also stated in text.",
      },
      render: MeterExample,
    },
    {
      id: "range",
      title: { "fa-IR": "بازه‌ای که از صفر شروع نمی‌شود", "en-US": "A range that does not start at zero" },
      description: {
        "fa-IR":
          "درصد از کسرِ درون بازه حساب می‌شود، نه از مقدار تقسیم بر بیشینه؛ با کف پنج و سقف چهل، مقدار نوزده نزدیک چهل درصد است و نه نزدیک پنجاه. این مرزِ قالب‌بندی جایی است که سنجه‌های خودساخته معمولاً اشتباه در می‌آیند.",
        "en-US":
          "The percentage is computed from the fraction WITHIN the range rather than from value over maximum; with a floor of five and a ceiling of forty, a value of nineteen is around forty per cent and not around fifty. That formatting boundary is where hand-rolled meters usually go wrong.",
      },
      render: RangeExample,
    },
  ],
};
