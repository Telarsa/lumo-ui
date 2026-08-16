import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { AspectRatio, Card, CardBody, CardTitle, Grid } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the aspect-ratio page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `aspect-ratio.tsx` has no `"use client"`, no engine and
 * no strings — a media frame costs the reader nothing to hydrate.
 *
 * There is deliberately nothing here about direction, and that is worth stating
 * rather than leaving as an absence: a RATIO is a dimension, not a direction, and
 * `aspect-ratio` behaves identically under `dir="rtl"`. The inline
 * `--lumo-aspect-ratio` value is a bare number in a STYLE attribute, which no
 * reader speaks and no locale renders — the Latin-digit rule is about visible
 * text and announced strings, and this component has neither. The digits that
 * ARE visible on this page, in the captions, go through `formatNumber` like
 * everything else.
 *
 * The children are coloured panels rather than photographs so the page owns its
 * own bytes; in real use the child is media stretched with `absolute inset-0`,
 * which is why `relative` is part of the component's contract rather than a
 * styling nicety.
 */

const t = {
  video: { "fa-IR": "ویدیوی معرفی محصول", "en-US": "Product introduction video" },
  cover: { "fa-IR": "تصویر شاخص مقاله", "en-US": "Article cover image" },
  portrait: { "fa-IR": "عکس پروفایل", "en-US": "Profile photograph" },
  banner: { "fa-IR": "بنر پهن صفحهٔ نخست", "en-US": "Wide banner on the home page" },

  courseOne: { "fa-IR": "طراحی رابط کاربری", "en-US": "Interface design" },
  courseTwo: { "fa-IR": "مبانی تایپوگرافی فارسی", "en-US": "Foundations of Persian typography" },
  courseThree: { "fa-IR": "دسترس‌پذیری در وب", "en-US": "Accessibility on the web" },
  lessons: { "fa-IR": "درس", "en-US": "lessons" },
} satisfies Record<string, LocalizedText>;

function MediaExample(l: Locale) {
  return (
    <div className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-surface-sunken">
        {/*
         * The usual child: stretched to all four edges. `relative` on the box is
         * what it resolves against — without it this would size itself against
         * whatever positioned ancestor happened to be further up the page.
         */}
        <div className="absolute inset-0 flex items-center justify-center bg-accent/10 text-sm text-fg-muted">
          {t.video[l]}
        </div>
      </AspectRatio>
    </div>
  );
}

function RatiosExample(l: Locale) {
  const boxes = [
    { key: "square", ratio: 1, label: t.portrait[l] },
    { key: "photo", ratio: 4 / 3, label: t.cover[l] },
    { key: "wide", ratio: 21 / 9, label: t.banner[l] },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {boxes.map((box) => (
        <AspectRatio
          key={box.key}
          ratio={box.ratio}
          className="overflow-hidden rounded-lg bg-surface-sunken"
        >
          <div className="absolute inset-0 flex items-center justify-center bg-accent/10 text-sm text-fg-muted">
            {box.label}
          </div>
        </AspectRatio>
      ))}
    </div>
  );
}

function SquareGridExample(_l: Locale) {
  const items = ["one", "two", "three", "four", "five", "six"];
  return (
    <Grid cols="3" gap="sm" className="w-full max-w-sm">
      {items.map((item) => (
        <AspectRatio
          key={item}
          ratio={1}
          className="overflow-hidden rounded-md bg-surface-sunken"
        >
          <div className="absolute inset-0 bg-accent/10" />
        </AspectRatio>
      ))}
    </Grid>
  );
}

function CardMediaExample(l: Locale) {
  const courses = [
    { key: "ui", title: t.courseOne[l], lessons: 18 },
    { key: "type", title: t.courseTwo[l], lessons: 9 },
    { key: "a11y", title: t.courseThree[l], lessons: 24 },
  ];
  return (
    <Grid cols="auto" gap="md" className="w-full">
      {courses.map((course) => (
        <Card key={course.key} className="overflow-hidden">
          <AspectRatio ratio={3 / 2} className="bg-surface-sunken">
            <div className="absolute inset-0 bg-accent/10" />
          </AspectRatio>
          <CardBody className="flex flex-col gap-1">
            <CardTitle level={4}>{course.title}</CardTitle>
            <span className="text-xs text-fg-muted">
              {formatNumber(course.lessons, l)} {t.lessons[l]}
            </span>
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "رسانه یا جاسازی‌ای که پهنایش نرم است اما نسبتش باید ثابت بماند: بندانگشتی، پخش‌کنندهٔ ویدیو، پیش‌نمایش نقشه.",
        "en-US": "Media or an embed whose width flexes but whose proportion must hold: a thumbnail, a video player, a map preview.",
      },
      whenNot: {
        "fa-IR": "قاب دستگاه دور یک پیش‌نمایش — `Frame`. چیدن چند جعبه کنار هم — `Stack` یا `Grid`. ارتفاع ثابت با پیمایش — `ScrollArea`.",
        "en-US": "Device chrome around a preview — `Frame`. Laying out several boxes — `Stack` or `Grid`. A fixed height that scrolls — `ScrollArea`.",
      },
    },
    tier: "layout",
    title: { "fa-IR": "نسبت ابعاد", "en-US": "Aspect ratio" },
    intro: {
      "fa-IR":
        "جعبه‌ای که نسبت عرض به ارتفاعش ثابت می‌ماند در حالی که عرضش کش می‌آید. اینجا عمداً هیچ چیزی دربارهٔ جهت نیست و همین نبودن ارزش گفتن دارد: نسبت یک بُعد است نه یک جهت، و رفتار aspect-ratio زیر راست‌چین دقیقاً همان است. مقدار درون‌خطی هم عددی خام در یک ویژگی style است — نه متن دیدنی و نه رشتهٔ گفتنی — پس قاعدهٔ منع رقم لاتین اصلاً به آن مربوط نمی‌شود. کلاس relative بخشی از قرارداد است نه آرایش: فرزند معمول، رسانه‌ای است که به هر چهار لبه کشیده می‌شود.",
      "en-US":
        "A box that holds a fixed width-to-height ratio while its width flexes. There is deliberately nothing here about direction, and that absence is worth stating: a ratio is a DIMENSION, not a direction, and aspect-ratio behaves identically under RTL. The inline value is a bare number in a style ATTRIBUTE — not visible text, not an announced string — so the Latin-digit rule does not reach it. relative is part of the contract rather than a styling nicety: the usual child is media stretched to all four edges.",
    },
    composition: [
      `<AspectRatio ratio className style>`,
      `  the child, usually absolute inset-0   ← relative on the box is what it`,
      `</AspectRatio>                             resolves against`,
    ].join("\n"),
    parts: [
      {
        name: "AspectRatio",
        description: {
          "fa-IR":
            "کل جزء. ratio عرض تقسیم بر ارتفاع است و به‌صورت یک متغیر سی‌اس‌اس درون‌خطی می‌نشیند، پس هیچ کلاس دلخواهی در زمان ساخت لازم نیست و نسبت‌های محاسبه‌شده هم کار می‌کنند.",
          "en-US":
            "The whole component. ratio is width divided by height and rides in as an inline custom property, so no arbitrary class has to exist at build time and computed ratios work too.",
        },
      },
    ],
  },
  examples: [
    {
      id: "media",
      title: { "fa-IR": "قاب ویدیو", "en-US": "A video frame" },
      description: {
        "fa-IR":
          "فرزند با یک کلاسِ inset صفر به هر چهار لبه کشیده می‌شود، و همین توضیح می‌دهد چرا relative جزو قرارداد است: بدون آن، این فرزند نسبت به نزدیک‌ترین نیای موقعیت‌دارِ بیرونی اندازه می‌گرفت — در بدترین حالت، تمام صفحه. آن کلاس هر چهار لبه را با هم می‌گذارد، پس چیزی برای قرینه‌شدن ندارد.",
        "en-US":
          "The child is stretched to all four edges with inset-0, which is what makes relative part of the contract: without it the child would size itself against the nearest positioned ancestor OUTSIDE the box — full-bleed over the page in the worst case. inset-0 is all four edges at once, so there is nothing in it to mirror.",
      },
      render: MediaExample,
    },
    {
      id: "ratios",
      title: { "fa-IR": "سه نسبت", "en-US": "Three ratios" },
      description: {
        "fa-IR":
          "ratio یک عدد جاوااسکریپتی است نه رشته‌ای مثل «شانزده به نُه»، پس می‌توان آن را محاسبه کرد و کلاس دلخواه هم لازم ندارد. ارتفاع را هیچ‌کس نمی‌نویسد: عرض جاری است و ارتفاع نتیجه.",
        "en-US":
          "ratio is a JavaScript number rather than a string like \"16:9\", so it can be computed and needs no arbitrary class. Nobody writes a height: the width is what flows, and the height is the consequence.",
      },
      render: RatiosExample,
    },
    {
      id: "square-grid",
      title: { "fa-IR": "شبکهٔ مربع", "en-US": "A square grid" },
      description: {
        "fa-IR":
          "با نسبت یک، هر خانه بدون هیچ ارتفاع ثابتی مربع می‌ماند — در هر عرضی و در هر دو خط. جایگزینش، یعنی ارتفاع دستی برای هر نقطهٔ شکست، همان چیزی است که در نخستین تغییر شبکه از هم می‌پاشد.",
        "en-US":
          "At a ratio of one every cell stays square with no fixed height anywhere — at any width and in both scripts. The alternative, a hand-set height per breakpoint, is what falls apart the first time the grid changes.",
      },
      render: SquareGridExample,
    },
    {
      id: "card-media",
      title: { "fa-IR": "تصویر شاخص کارت", "en-US": "Card media" },
      description: {
        "fa-IR":
          "این کاربرد اصلی جزء است: عنوان‌های سه کارت طول‌های متفاوت دارند، اما تصویرها دقیقاً هم‌اندازه‌اند، چون ارتفاعشان از نسبت می‌آید نه از محتوا. overflow-hidden روی کارت است، پس گوشهٔ گرد به بالای تصویر هم می‌رسد.",
        "en-US":
          "This is the component's main job: the three titles are different lengths, yet the media is exactly the same size in each, because its height comes from the ratio rather than from the content. overflow-hidden sits on the card, so the rounded corner reaches the top of the media too.",
      },
      render: CardMediaExample,
    },
  ],
};
