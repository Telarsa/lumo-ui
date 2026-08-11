import type { Locale } from "@lumo-ui/core";
import { DateText, Num } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the num page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `num.tsx` has no `"use client"` — these are pure
 * formatters over `Intl`, so a page full of prices costs the reader no
 * hydration.
 *
 * This component exists because the lint rule banning raw numbers in JSX
 * advertised an export that did not exist, and a rule whose message points at
 * nothing teaches people the rule is wrong. The whole page is therefore about
 * making the correct path shorter than the wrong one — `<Num value locale />`
 * against `{count}`.
 *
 * `DateText` is the sharper half. It changes the CALENDAR, not the digits: under
 * `fa-IR` a date is Jalali, and `toLocaleDateString("fa")` produces a
 * plausible-looking wrong YEAR that is invisible to anyone who cannot read it.
 * The instants below are fixed, with an explicit zone, so the prerendered bytes
 * do not change per build machine.
 */

const SIGNED = new Date("2026-08-05T09:15:00+03:30");
const RENEWS = new Date("2027-08-05T09:15:00+03:30");
const NOWRUZ = new Date("2027-03-21T00:30:00+03:30");

const t = {
  members: { "fa-IR": "اعضای فعال", "en-US": "Active members" },
  storage: { "fa-IR": "پرونده‌های ذخیره‌شده", "en-US": "Stored files" },
  requests: { "fa-IR": "درخواست‌های این ماه", "en-US": "Requests this month" },

  monthly: { "fa-IR": "حق اشتراک ماهانه", "en-US": "Monthly subscription" },
  credit: { "fa-IR": "اعتبار باقی‌مانده", "en-US": "Remaining credit" },
  dollars: { "fa-IR": "معادل دلاری", "en-US": "In US dollars" },

  growth: { "fa-IR": "رشد فروش نسبت به فصل گذشته", "en-US": "Sales growth over last quarter" },
  uptime: { "fa-IR": "در دسترس‌بودن سرویس", "en-US": "Service availability" },
  weight: { "fa-IR": "وزن مرسوله", "en-US": "Parcel weight" },

  signed: { "fa-IR": "تاریخ امضای قرارداد", "en-US": "Contract signed" },
  renews: { "fa-IR": "تمدید خودکار", "en-US": "Renews automatically" },
  nowruz: { "fa-IR": "آغاز سال نو", "en-US": "The new year begins" },

  sentenceLead: { "fa-IR": "این طرح", "en-US": "This plan covers" },
  sentenceMiddle: { "fa-IR": "کاربر را پوشش می‌دهد و ماهانه", "en-US": "seats and costs" },
  sentenceTail: { "fa-IR": "هزینه دارد.", "en-US": "each month." },
} satisfies Record<string, LocalizedText>;

function CountsExample(l: Locale) {
  const rows = [
    { key: "members", label: t.members[l], value: 48 },
    { key: "storage", label: t.storage[l], value: 12_640 },
    { key: "requests", label: t.requests[l], value: 1_284_907 },
  ];
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 text-sm text-fg">
          <span className="text-fg-muted">{row.label}</span>
          <Num value={row.value} locale={l} />
        </li>
      ))}
    </ul>
  );
}

function CurrencyExample(l: Locale) {
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.monthly[l]}</span>
        <Num value={2_400_000} locale={l} style="currency" currency="IRR" />
      </li>
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.credit[l]}</span>
        <Num value={318_500} locale={l} style="currency" currency="IRR" />
      </li>
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.dollars[l]}</span>
        <Num value={42.5} locale={l} style="currency" currency="USD" />
      </li>
    </ul>
  );
}

function StylesExample(l: Locale) {
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.growth[l]}</span>
        <Num value={0.184} locale={l} style="percent" maximumFractionDigits={1} />
      </li>
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.uptime[l]}</span>
        <Num
          value={0.9993}
          locale={l}
          style="percent"
          minimumFractionDigits={2}
          maximumFractionDigits={2}
        />
      </li>
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.weight[l]}</span>
        <Num
          value={1.75}
          locale={l}
          minimumFractionDigits={2}
          maximumFractionDigits={2}
        />
      </li>
    </ul>
  );
}

function DatesExample(l: Locale) {
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.signed[l]}</span>
        <DateText value={SIGNED} locale={l} day="numeric" month="long" year="numeric" />
      </li>
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.renews[l]}</span>
        <DateText value={RENEWS} locale={l} dateStyle="long" />
      </li>
      <li className="flex items-center justify-between gap-3 text-sm text-fg">
        <span className="text-fg-muted">{t.nowruz[l]}</span>
        <DateText value={NOWRUZ} locale={l} dateStyle="full" />
      </li>
    </ul>
  );
}

function InSentenceExample(l: Locale) {
  return (
    <p className="m-0 max-w-prose text-sm text-fg">
      {t.sentenceLead[l]} <Num value={25} locale={l} className="font-medium" />{" "}
      {t.sentenceMiddle[l]}{" "}
      <Num
        value={2_400_000}
        locale={l}
        style="currency"
        currency="IRR"
        className="font-medium"
      />{" "}
      {t.sentenceTail[l]}
    </p>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "data",
    title: { "fa-IR": "عدد و تاریخ", "en-US": "Number and date" },
    intro: {
      "fa-IR":
        "عدد را در سیستم عددی خواننده می‌نویسد و تاریخ را در تقویم او. نکته این نیست که این کار سخت است؛ نکته این است که راه غلط کوتاه‌تر بود. نوشتن مستقیم یک عدد در جی‌اس‌ایکس با LumoNode خطای کامپایل است، و این دو جزء همان راه درست‌اند که باید دست‌کم به‌اندازهٔ راه غلط راحت باشد وگرنه قاعده خاموش می‌شود. زیر fa تاریخ جلالی است، نه تاریخ میلادی با ارقام فارسی — تفاوتی که برای کسی که تقویم را نمی‌خواند نامرئی است.",
      "en-US":
        "Renders a number in the reader's own numbering system and a date in their own calendar. The point is not that this is hard; the point is that the wrong path was shorter. Writing a number straight into JSX is a compile error under LumoNode, and these two components are the correct path — which has to be at least as convenient, or the rule gets suppressed. Under fa the date is Jalali, not Gregorian wearing Persian digits, and that difference is invisible to anyone who cannot read the calendar.",
    },
    composition: [
      `<Num value locale style currency minimumFractionDigits maximumFractionDigits />`,
      `                            ← a <span>; options go straight to Intl.NumberFormat`,
      `<DateText value locale dateStyle year month day />`,
      `                            ← a <time dateTime>: the ISO value for machines,`,
      `                               the locale's own calendar for the reader`,
    ].join("\n"),
    parts: [
      {
        name: "Num",
        description: {
          "fa-IR":
            "عدد. font-variant-numeric عمداً اینجا تنظیم نمی‌شود: قالب آن را زیر lang فارسی به normal برمی‌گرداند، چون ارقام جدولی ایده‌ای از تایپوگرافی لاتین است، و یک کلاس روی این عنصر آن بازگردانی را بی‌اثر می‌کرد.",
          "en-US":
            "The number. font-variant-numeric is deliberately NOT set here: the theme resets it to normal under the Persian language, because tabular figures are a Latin-typography idea, and a utility on this element would out-specify that reset.",
        },
      },
      {
        name: "DateText",
        description: {
          "fa-IR":
            "تاریخ، در تقویم زبان. یک «time» است، پس مقدار ماشین‌خوان ایزو کنار متن انسانی می‌ماند و خزنده و صفحه‌خوان هر دو چیزی برای استفاده دارند.",
          "en-US":
            "The date, in the locale's calendar. It renders a «time», so the machine-readable ISO value travels beside the human one and a crawler and a screen reader both get something they can use.",
        },
      },
    ],
  },
  examples: [
    {
      id: "counts",
      title: { "fa-IR": "شمارش‌ها", "en-US": "Counts" },
      description: {
        "fa-IR":
          "روی مسیر فارسی نه‌فقط ارقام عوض می‌شوند: جداکنندهٔ هزارگان و نشانهٔ اعشار هم نویسه‌های عربیِ خودشان‌اند، و هیچ‌کدام چیزی نیست که toLocaleString با «fa» تضمینش کند. formatNumber زبان را با پسوندهای صریح می‌سازد تا نتیجه به تنظیمات میزبان وابسته نباشد.",
        "en-US":
          "On the fa route it is not only the digits that change: the thousands separator is U+066C and the decimal is U+066B, and neither is something a naive toLocaleString with \"fa\" guarantees across runtimes. formatNumber states the extensions explicitly rather than inheriting them from the host.",
      },
      render: CountsExample,
    },
    {
      id: "currency",
      title: { "fa-IR": "پول", "en-US": "Money" },
      description: {
        "fa-IR":
          "style ارزی هم ارقام و هم نام واحد پول را از همان زبان می‌گیرد، و جای نماد را هم همان‌جا تصمیم می‌گیرند — در فارسی پس از عدد و در انگلیسی پیش از آن. ردیف آخر ارز دیگری است تا روشن شود این تصمیم به زبان بستگی دارد نه به واحد پول.",
        "en-US":
          "A currency style takes both the digits and the currency's name from the locale, and the locale also decides where the symbol goes — after the number in Persian, before it in English. The last row uses a different currency to make clear that placement follows the LOCALE, not the unit.",
      },
      render: CurrencyExample,
    },
    {
      id: "styles",
      title: { "fa-IR": "درصد و رقم اعشار", "en-US": "Percent and fraction digits" },
      description: {
        "fa-IR":
          "style درصدی روی کسر اعمال می‌شود، نه روی عدد صد برابر شده — Intl خودش ضرب می‌کند، و همین جایی است که مقدارها معمولاً صد برابر اشتباه در می‌آیند. تعداد رقم اعشار هم از همین‌جا کنترل می‌شود، پس گِرد کردن دستی پیش از قالب‌بندی لازم نیست — و گِرد کردن دستی همان چیزی است که نشانهٔ اعشار را به نقطهٔ لاتین برمی‌گرداند.",
        "en-US":
          "A percent style applies to the FRACTION, not to an already-multiplied number — Intl does the multiplying, and that is where values usually come out a hundred times wrong. The fraction digits are controlled here too, so there is no rounding by hand before formatting — and rounding by hand is exactly what turns the decimal mark back into a Latin full stop.",
      },
      render: StylesExample,
    },
    {
      id: "dates",
      title: { "fa-IR": "تقویم، نه فقط ارقام", "en-US": "The calendar, not just the digits" },
      description: {
        "fa-IR":
          "روی مسیر فارسی سال جلالی است و ماه نامِ جلالی دارد. ویژگی dateTime همان عنصر میلادی می‌ماند و باید هم بماند: ایزو ۸۶۰۱ تقویم دیگری ندارد و آن رشته را نرم‌افزار می‌خواند نه انسان.",
        "en-US":
          "On the fa route the year is Jalali and the month carries a Jalali name. The element's dateTime attribute stays Gregorian, and must: ISO 8601 has no other calendar, and that string is read by software rather than by a person.",
      },
      render: DatesExample,
    },
    {
      id: "in-a-sentence",
      title: { "fa-IR": "درون یک جمله", "en-US": "Inside a sentence" },
      description: {
        "fa-IR":
          "هر دو عدد «span» هستند و در جریان متن می‌مانند، پس می‌توان بدون شکستن بند به آن‌ها کلاس داد. این پرکاربردترین جای بروز نقص است: عددی که مستقیم در جمله نوشته شده، در بازبینی دیداری کاملاً عادی به‌نظر می‌رسد.",
        "en-US":
          "Both numbers are «span»s and stay in the text flow, so they can be styled without breaking the paragraph. This is the commonest place the defect appears: a number written straight into a sentence looks entirely normal in a visual review.",
      },
      render: InSentenceExample,
    },
  ],
};
