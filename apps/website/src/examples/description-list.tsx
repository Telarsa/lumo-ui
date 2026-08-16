import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatDate, formatNumber } from "@lumo-ui/core";
import {
  DescriptionDetail,
  DescriptionGroup,
  DescriptionList,
  DescriptionTerm,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the description-list page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `description-list.tsx` has no `"use client"` — it is four
 * elements and a class list, so a checkout panel or a settings summary built out
 * of it costs the consumer no hydration at all.
 *
 * The page's argument is that a `<dl>` written by hand is right about the
 * ELEMENTS and wrong about the DEFECTS. Two of those defects are demonstrated
 * below and neither shows up in a screenshot of a correct implementation: every
 * detail here goes through `formatNumber` or `formatDate` because `<dd>` from
 * React's own JSX types would happily render `24500`, and the money column is
 * `justify-between` rather than a two-column table with `text-right`.
 *
 * The instants are fixed with an explicit zone, so the prerendered bytes are the
 * same on every build machine — the same call `examples/timeline.tsx` makes.
 */

const CHECK_IN = new Date("2026-08-14T14:00:00+03:30");
const CHECK_OUT = new Date("2026-08-17T12:00:00+03:30");

const DAY: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Tehran",
};

const t = {
  nights: { "fa-IR": "شب اقامت", "en-US": "Nights" },
  guests: { "fa-IR": "مسافران", "en-US": "Guests" },
  checkIn: { "fa-IR": "ورود", "en-US": "Check-in" },
  checkOut: { "fa-IR": "خروج", "en-US": "Check-out" },
  roomRate: { "fa-IR": "نرخ هر شب", "en-US": "Nightly rate" },
  serviceFee: { "fa-IR": "هزینهٔ خدمات", "en-US": "Service fee" },
  tax: { "fa-IR": "مالیات بر ارزش افزوده", "en-US": "Value-added tax" },
  total: { "fa-IR": "مبلغ قابل پرداخت", "en-US": "Amount due" },

  policyTerm: { "fa-IR": "شرایط لغو", "en-US": "Cancellation policy" },
  policyDetail: {
    "fa-IR": "تا چهل‌وهشت ساعت پیش از ورود، لغو رایگان است. پس از آن، هزینهٔ نخستین شب کسر می‌شود و باقی مبلغ ظرف یک هفتهٔ کاری به همان کارت برمی‌گردد.",
    "en-US": "Free cancellation up to forty-eight hours before check-in. After that the first night is withheld and the rest returns to the same card within a working week.",
  },
  addressTerm: { "fa-IR": "نشانی اقامتگاه", "en-US": "Address" },
  addressDetail: {
    "fa-IR": "اصفهان، خیابان چهارباغ عباسی، کوچهٔ گلستان، پلاک بیست‌وشش",
    "en-US": "Chaharbagh Abbasi Street, Golestan Alley, number twenty-six, Isfahan",
  },

  status: { "fa-IR": "وضعیت رزرو", "en-US": "Booking status" },
  confirmed: { "fa-IR": "تأییدشده", "en-US": "Confirmed" },
  reference: { "fa-IR": "کد پیگیری", "en-US": "Reference" },
} satisfies Record<string, LocalizedText>;

function MoneyExample(l: Locale) {
  const rows = [
    { key: "rate", term: t.roomRate[l], value: 2_400_000 },
    { key: "fee", term: t.serviceFee[l], value: 180_000 },
    { key: "tax", term: t.tax[l], value: 463_000 },
  ];
  return (
    <DescriptionList className="w-full max-w-sm">
      {rows.map((row) => (
        <DescriptionGroup key={row.key}>
          <DescriptionTerm>{row.term}</DescriptionTerm>
          <DescriptionDetail>
            {formatNumber(row.value, l, { style: "currency", currency: "IRR" })}
          </DescriptionDetail>
        </DescriptionGroup>
      ))}
      {/*
       * The rule above the total is a border on the GROUP, not an <hr> between
       * the pairs: a <dl>'s content model admits <div> groups and nothing else.
       */}
      <DescriptionGroup className="border-bs border-border pbs-2 font-medium">
        <DescriptionTerm className="text-fg">{t.total[l]}</DescriptionTerm>
        <DescriptionDetail>
          {formatNumber(3_043_000, l, { style: "currency", currency: "IRR" })}
        </DescriptionDetail>
      </DescriptionGroup>
    </DescriptionList>
  );
}

function DatesExample(l: Locale) {
  return (
    <DescriptionList className="w-full max-w-sm">
      <DescriptionGroup>
        <DescriptionTerm>{t.checkIn[l]}</DescriptionTerm>
        <DescriptionDetail>{formatDate(CHECK_IN, l, DAY)}</DescriptionDetail>
      </DescriptionGroup>
      <DescriptionGroup>
        <DescriptionTerm>{t.checkOut[l]}</DescriptionTerm>
        <DescriptionDetail>{formatDate(CHECK_OUT, l, DAY)}</DescriptionDetail>
      </DescriptionGroup>
      <DescriptionGroup>
        <DescriptionTerm>{t.nights[l]}</DescriptionTerm>
        <DescriptionDetail>{formatNumber(3, l)}</DescriptionDetail>
      </DescriptionGroup>
      <DescriptionGroup>
        <DescriptionTerm>{t.guests[l]}</DescriptionTerm>
        <DescriptionDetail>{formatNumber(2, l)}</DescriptionDetail>
      </DescriptionGroup>
    </DescriptionList>
  );
}

function StackedExample(l: Locale) {
  return (
    <DescriptionList className="w-full max-w-sm">
      <DescriptionGroup layout="stack">
        <DescriptionTerm>{t.addressTerm[l]}</DescriptionTerm>
        <DescriptionDetail>{t.addressDetail[l]}</DescriptionDetail>
      </DescriptionGroup>
      <DescriptionGroup layout="stack">
        <DescriptionTerm>{t.policyTerm[l]}</DescriptionTerm>
        <DescriptionDetail>{t.policyDetail[l]}</DescriptionDetail>
      </DescriptionGroup>
    </DescriptionList>
  );
}

function MixedExample(l: Locale) {
  return (
    <DescriptionList className="w-full max-w-sm rounded-lg border border-border bg-surface p-4">
      <DescriptionGroup>
        <DescriptionTerm>{t.status[l]}</DescriptionTerm>
        <DescriptionDetail className="text-positive">{t.confirmed[l]}</DescriptionDetail>
      </DescriptionGroup>
      <DescriptionGroup>
        <DescriptionTerm>{t.reference[l]}</DescriptionTerm>
        <DescriptionDetail className="font-mono">
          {formatNumber(48210773, l, { useGrouping: false })}
        </DescriptionDetail>
      </DescriptionGroup>
      <DescriptionGroup layout="stack">
        <DescriptionTerm>{t.policyTerm[l]}</DescriptionTerm>
        <DescriptionDetail>{t.policyDetail[l]}</DescriptionDetail>
      </DescriptionGroup>
    </DescriptionList>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "جفت‌های نام/مقدار که با هم خوانده می‌شوند: خلاصهٔ سفارش، مشخصات نمایه، جمع‌های فاکتور.",
        "en-US": "Name/value pairs read together: an order summary, a profile's details, invoice totals.",
      },
      whenNot: {
        "fa-IR": "رکوردهای زیاد با ستون‌های یکسان — `Table`. مرتب‌سازی، فیلتر و ویرایش — `DataGrid`. ردیف‌هایی با رسانه و کنش — `Item`.",
        "en-US": "Many records with the same columns — `Table`. Sorting, filtering and editing — `DataGrid`. Rows with media and actions — `Item`.",
      },
    },
    tier: "data",
    title: { "fa-IR": "فهرست توصیفی", "en-US": "Description list" },
    intro: {
      "fa-IR":
        "جفت‌های نام و مقدار، با همان «dl» و «dt» و «dd» که باید باشد. اگر عنصرها درست‌اند، چرا جزء؟ چون سه نقص همیشه تکرار می‌شوند: «dd» دستی عدد خام را می‌پذیرد و روی صفحهٔ فارسی رقم لاتین می‌نویسد؛ «dd» تورفتگی پیش‌فرض مرورگر را در لبهٔ خواندن دارد که با ریست تیلویند پنهان می‌ماند و در پروژهٔ دیگری برمی‌گردد؛ و ستون مبلغ اگر جدول دوستونی با text-right باشد، به لبهٔ فیزیکی راست می‌چسبد که در فارسی بیرون از لبهٔ خواندن است.",
      "en-US":
        "Name/value pairs, with the «dl», «dt» and «dd» they should be. If the elements are right, why a component? Because three defects keep coming back: a hand-written «dd» accepts a bare number and writes Latin digits onto a Persian page; «dd» carries a UA indent on the reading edge that Tailwind's preflight hides here and that returns in the next project; and a money column built as a two-column table with text-right pins every amount to the PHYSICAL right, which in Persian is outside the panel's reading edge.",
    },
    composition: [
      `<DescriptionList>                    ← the <dl></dl>`,
      `  <DescriptionGroup layout>          ← a <div>: row (justify-between) or stack`,
      `    <DescriptionTerm>                ← the <dt></dt>`,
      `    <DescriptionDetail>              ← the <dd></dd>, children are LumoNode`,
      `  </DescriptionGroup>`,
      `</DescriptionList>`,
    ].join("\n"),
    parts: [
      {
        name: "DescriptionList",
        description: {
          "fa-IR": "خودِ «dl». چیدمان ستونی با gap، تا فاصله‌ها روی محور بلوکی بنشینند و چیزی برای قرینه‌شدن نماند.",
          "en-US": "The «dl» itself. A column with gap, so the spacing lives on the block axis and there is nothing left to mirror.",
        },
      },
      {
        name: "DescriptionGroup",
        description: {
          "fa-IR":
            "یک جفت، درون یک «div» — که مشخصات اچ‌تی‌ام‌ال اجازه‌اش می‌دهد و همان چیزی است که justify-between به‌ازای هر جفت را ممکن می‌کند. layout=row نام را در آغاز و مقدار را در پایانِ سطر می‌گذارد و هر دو با یک کلاس در راست‌چین جابه‌جا می‌شوند؛ layout=stack برای مقدارهای بلند است.",
          "en-US":
            "One pair, inside a «div» — which the HTML spec allows and which is what makes a per-pair justify-between possible at all. layout=row puts the name at the inline start and the value at the inline end, both swapping from one class under RTL; layout=stack is for long values.",
        },
      },
      {
        name: "DescriptionTerm",
        description: {
          "fa-IR": "نام، یعنی «dt». کمینه‌عرضِ صفر دارد تا نام بلند مقدار را از سطر بیرون نراند.",
          "en-US": "The name, i.e. the «dt». It carries min-w-0 so a long name cannot push the value out of the row.",
        },
      },
      {
        name: "DescriptionDetail",
        description: {
          "fa-IR":
            "مقدار، یعنی «dd». حاشیهٔ صفر تورفتگی پیش‌فرض مرورگر را می‌کُشد بدون آنکه به ریست کسی تکیه کند، و فرزندانش LumoNode هستند تا عدد خام کامپایل نشود.",
          "en-US":
            "The value, i.e. the «dd». m-0 kills the UA's inline-start indent without depending on somebody else's reset, and its children are LumoNode so a bare number does not compile.",
        },
      },
    ],
  },
  examples: [
    {
      id: "money-column",
      title: { "fa-IR": "ستون مبلغ", "en-US": "The money column" },
      description: {
        "fa-IR":
          "مبلغ‌ها به لبهٔ پایانی می‌چسبند و نه به راستِ فیزیکی؛ روی مسیر فارسی همین جفت کلاس آن‌ها را به چپ می‌برد. مقدارها از formatNumber با style ارزی می‌گذرند، پس واحد پول و ارقام هر دو از سیستم عددی همان زبان می‌آیند.",
        "en-US":
          "The amounts hug the inline end rather than the physical right; on the fa route the same pair of classes moves them to the left. The values go through formatNumber with a currency style, so both the digits and the currency name come out of the locale's own numbering system.",
      },
      render: MoneyExample,
    },
    {
      id: "dates",
      title: { "fa-IR": "تاریخ‌ها، در تقویم خواننده", "en-US": "Dates in the reader's calendar" },
      description: {
        "fa-IR":
          "formatDate تقویم را عوض می‌کند، نه فقط ارقام را: روی مسیر فارسی «مرداد» می‌آید نه «اوت». همین است تفاوت میان تاریخِ درست و تاریخِ میلادی‌ای که ارقام فارسی پوشیده — دومی برای کسی که تقویم را نمی‌خواند کاملاً موجه به‌نظر می‌رسد.",
        "en-US":
          "formatDate changes the CALENDAR, not merely the digits: the fa route gets «مرداد», not «اوت». That is the difference between a correct date and a Gregorian one wearing Persian numerals — and the second one looks entirely plausible to anyone who cannot read the calendar.",
      },
      render: DatesExample,
    },
    {
      id: "stacked",
      title: { "fa-IR": "وقتی مقدار یک بند است", "en-US": "When the value is a paragraph" },
      description: {
        "fa-IR":
          "layout=stack نام را بالای مقدار می‌گذارد. سطرِ justify-between برای متن چندخطی جواب نمی‌دهد: نام در بالا می‌ماند و مقدار زیرش می‌ریزد و فاصلهٔ میانشان به عرض ظرف وابسته می‌شود. محور بلوکی قرینه نمی‌شود، پس این حالت در هر دو خط یکسان است.",
        "en-US":
          "layout=stack puts the name above the value. A justify-between row does not survive multi-line text: the name stays pinned at the top while the value wraps beneath it and the gap between them becomes a function of the container's width. The block axis does not mirror, so this layout is identical in both scripts.",
      },
      render: StackedExample,
    },
    {
      id: "mixed",
      title: { "fa-IR": "دو چیدمان در یک فهرست", "en-US": "Two layouts in one list" },
      description: {
        "fa-IR":
          "layout روی هر جفت جداگانه تعیین می‌شود، نه روی فهرست — و همین چیزی است که یک پنل خلاصه را می‌سازد: سطرهای کوتاه به‌صورت سطری و یک بند توضیح به‌صورت پشته‌ای، همه درون یک «dl» که برای فناوری کمکی هنوز یک ساختار است.",
        "en-US":
          "layout is set per PAIR rather than per list, and that is what makes a summary panel work: the short facts as rows, the one paragraph of explanation as a stack, all inside a single «dl» that assistive technology still reads as one structure.",
      },
      render: MixedExample,
    },
  ],
};
