import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Button, Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the card page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and no file in `card.tsx` carries `"use client"` — a card is
 * the commonest wrapper around server-rendered content, so a directive there
 * would drag whole pages across the boundary for a border and a radius. The
 * `<Button>`s below are the only client components on the page, and they are
 * client for their own reasons.
 *
 * Two things worth watching for, neither of which a screenshot shows: the
 * footer's `justify-end` is the INLINE end, so the actions move to the left in
 * Persian without a single `rtl:` rule; and `CardTitle`'s `level` is what keeps
 * a page full of cards from shredding the heading outline a screen-reader user
 * navigates by.
 */

const t = {
  planTitle: { "fa-IR": "طرح حرفه‌ای", "en-US": "Professional plan" },
  planDescription: {
    "fa-IR": "برای تیم‌هایی که بیش از یک فروشگاه را هم‌زمان اداره می‌کنند.",
    "en-US": "For teams running more than one storefront at a time.",
  },
  planBody: {
    "fa-IR": "کاربر فعال، پشتیبانی تلفنی و گزارش‌های ماهانه در همین طرح گنجانده شده است.",
    "en-US": "Active seats, a phone line and monthly reporting are all included at this tier.",
  },
  seats: { "fa-IR": "کاربر", "en-US": "seats" },
  choose: { "fa-IR": "انتخاب طرح", "en-US": "Choose this plan" },
  compare: { "fa-IR": "مقایسه", "en-US": "Compare" },

  sectionTitle: { "fa-IR": "امنیت حساب", "en-US": "Account security" },
  twoFactorTitle: { "fa-IR": "ورود دومرحله‌ای", "en-US": "Two-step sign-in" },
  twoFactorBody: {
    "fa-IR": "هر ورود تازه به یک رمز یک‌بارمصرف نیاز دارد.",
    "en-US": "Every new sign-in asks for a one-time code.",
  },
  sessionsTitle: { "fa-IR": "نشست‌های فعال", "en-US": "Active sessions" },
  sessionsBody: {
    "fa-IR": "دستگاه‌هایی که همین حالا به این حساب وارد شده‌اند.",
    "en-US": "The devices signed in to this account right now.",
  },

  regionTitle: { "fa-IR": "خلاصهٔ صورت‌حساب", "en-US": "Billing summary" },
  regionBody: {
    "fa-IR": "این کارت یک ناحیهٔ نام‌دار است: نامش را از عنوان خودش می‌گیرد.",
    "en-US": "This card is a named region: it takes its name from its own title.",
  },

  nestedOuter: { "fa-IR": "روش‌های پرداخت", "en-US": "Payment methods" },
  nestedInner: { "fa-IR": "کارت ثبت‌شده", "en-US": "Saved card" },
  nestedInnerBody: {
    "fa-IR": "کارت پیش‌فرض برای تمدید خودکار.",
    "en-US": "The default card for automatic renewal.",
  },
} satisfies Record<string, LocalizedText>;

function AnatomyExample(l: Locale) {
  return (
    <Card variant="elevated" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t.planTitle[l]}</CardTitle>
        <CardDescription>{t.planDescription[l]}</CardDescription>
      </CardHeader>
      <CardBody>
        <p className="m-0 text-sm text-fg-muted">{t.planBody[l]}</p>
        <p className="m-0 pbs-2 text-sm text-fg">
          {formatNumber(25, l)} {t.seats[l]}
        </p>
      </CardBody>
      <CardFooter>
        <Button variant="ghost">{t.compare[l]}</Button>
        <Button>{t.choose[l]}</Button>
      </CardFooter>
    </Card>
  );
}

function LevelExample(l: Locale) {
  return (
    <section className="flex w-full max-w-sm flex-col gap-3">
      {/* The section's own heading. The cards below live UNDER it. */}
      <h3 className="text-sm font-semibold text-fg">{t.sectionTitle[l]}</h3>
      <Card>
        <CardHeader>
          {/* level={4}, because an h3 is already open above. */}
          <CardTitle level={4}>{t.twoFactorTitle[l]}</CardTitle>
          <CardDescription>{t.twoFactorBody[l]}</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle level={4}>{t.sessionsTitle[l]}</CardTitle>
          <CardDescription>{t.sessionsBody[l]}</CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}

function RegionExample(l: Locale) {
  return (
    <Card role="region" aria-labelledby="card-billing-region" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle id="card-billing-region">{t.regionTitle[l]}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="m-0 text-sm text-fg-muted">{t.regionBody[l]}</p>
      </CardBody>
    </Card>
  );
}

function NestedExample(l: Locale) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t.nestedOuter[l]}</CardTitle>
      </CardHeader>
      <CardBody>
        {/* `plain` — the outer card already drew the edge this one would double. */}
        <Card variant="plain" className="bg-surface-sunken">
          <CardHeader>
            <CardTitle level={4}>{t.nestedInner[l]}</CardTitle>
            <CardDescription>{t.nestedInnerBody[l]}</CardDescription>
          </CardHeader>
          <CardBody>
            <p className="m-0 font-mono text-sm text-fg">
              {formatNumber(6037, l, { useGrouping: false })} … {formatNumber(4419, l, { useGrouping: false })}
            </p>
          </CardBody>
        </Card>
      </CardBody>
    </Card>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "layout",
    title: { "fa-IR": "کارت", "en-US": "Card" },
    intro: {
      "fa-IR":
        "سطحی با سربرگ، بدنه و پاورقی — شش جزء و هیچ حالتی. پاورقی کنش‌ها را با justify-end به لبهٔ پایانی می‌برد، و لبهٔ پایانی را خودِ الگوریتم چیدمان از روی جهت ظرف تعیین می‌کند: راست در انگلیسی، چپ در فارسی، بدون هیچ قاعدهٔ جداگانه. عنوان به‌جای برچسب عنصر، ویژگی level می‌گیرد، چون کارت در فهرست سرفصل‌های صفحه جایی دارد و پرش سطح یک نقص واقعی ناوبری است.",
      "en-US":
        "A surface with a header, a body and a footer — six components and no state. The footer sends its actions to the inline end with justify-end, and the layout algorithm resolves that end against the container's direction: right in English, left in Persian, with no separate rule. The title takes a level NUMBER rather than an element name, because a card has a place in the page outline and a skipped level is a real navigation defect.",
    },
    composition: [
      `<Card variant>                 ← outlined | elevated | plain`,
      `  <CardHeader>`,
      `    <CardTitle level>          ← 2–6, never 1: a card is not the page`,
      `    <CardDescription>          ← a <p>, so :lang(fa) line-height applies`,
      `  </CardHeader>`,
      `  <CardBody>`,
      `  <CardFooter>                 ← justify-end = the INLINE end`,
      `</Card>`,
    ].join("\n"),
    parts: [
      {
        name: "Card",
        description: {
          "fa-IR":
            "خودِ سطح. variant سه حالت دارد و plain برای کارتی است که درون ظرفی مرزدار می‌نشیند، جایی که مرز دوم به یک درز دوپیکسلی تبدیل می‌شود.",
          "en-US":
            "The surface itself. variant has three values, and plain is for a card inside an already-bordered container, where a second border doubles up into a two-pixel seam.",
        },
      },
      {
        name: "CardHeader",
        description: {
          "fa-IR":
            "عنوان و توضیح. لایه‌گذاری پایانی‌اش صفر است تا با لایه‌گذاری آغازین بدنه جمع نشود و شکافی که کسی نخواسته باز نکند.",
          "en-US":
            "Title and description. Its block-end padding is zero so it does not add to the body's block-start padding and open a gap nobody asked for.",
        },
      },
      {
        name: "CardTitle",
        description: {
          "fa-IR":
            "سرفصل کارت. level عددی میان دو تا شش است و سرفصلِ نخستِ صفحه عمداً بیرون مانده. همین جزء props را عبور می‌دهد تا بتوان id گذاشت و کارت را با aria-labelledby به ناحیه‌ای نام‌دار تبدیل کرد.",
          "en-US":
            "The card's heading. level is a number from two to six and h1 is deliberately excluded. This part forwards its props so it can take an id and turn the card into a named region through aria-labelledby.",
        },
      },
      {
        name: "CardDescription",
        description: {
          "fa-IR":
            "یک «p»، چون توضیح نثر است. text-balance عمداً غایب است: برای تیترهای کوتاه لاتین تنظیم شده و در خط عربی لبهٔ ناهموار می‌سازد.",
          "en-US":
            "A «p», because the description is prose. text-balance is deliberately absent: it is tuned for short Latin headlines and produces an uneven rag on Arabic script.",
        },
      },
      {
        name: "CardBody",
        description: {
          "fa-IR": "محتوای اصلی. کمینه‌عرضِ صفر دارد تا محتوای طولانی کارت را پهن‌تر از ظرفش نکند.",
          "en-US": "The main content. It carries min-w-0 so long content cannot push the card wider than its container.",
        },
      },
      {
        name: "CardFooter",
        description: {
          "fa-IR":
            "کنش‌ها. مرزِ بالایش border-bs است نه border-t؛ محور بلوکی قرینه نمی‌شود، اما قاعده‌ای که استثنا داشته باشد قاعده‌ای است که آدم‌ها اشتباه به‌یاد می‌آورند.",
          "en-US":
            "The actions. Its top edge is border-bs rather than border-t; the block axis does not mirror, but a rule with a carve-out is a rule people get wrong.",
        },
      },
    ],
  },
  examples: [
    {
      id: "anatomy",
      title: { "fa-IR": "سربرگ، بدنه، پاورقی", "en-US": "Header, body, footer" },
      description: {
        "fa-IR":
          "کارت را در هر دو زبان کنار هم بگذارید: دکمه‌ها جابه‌جا می‌شوند و هیچ کلاسی در این پرونده عوض نشده. justify-end در فلکس‌باکس نسبت به جهتِ ظرف حل می‌شود، و همین دلیلی است که این کتابخانه پیش از هر چیزِ موقعیتی سراغ فلکس می‌رود.",
        "en-US":
          "Put the card side by side in the two languages: the buttons move, and not one class in this file changed. Flexbox resolves justify-end against the container's direction, which is the reason this library reaches for flex before it reaches for anything positional.",
      },
      render: AnatomyExample,
    },
    {
      id: "heading-level",
      title: { "fa-IR": "سطح سرفصل، نه اندازهٔ متن", "en-US": "The heading level, not the text size" },
      description: {
        "fa-IR":
          "هر دو کارت زیر یک سرفصل سطح سه نشسته‌اند، پس عنوانشان level چهار می‌گیرد. اندازهٔ دیداری متن هیچ تغییری نمی‌کند — تنها چیزی که عوض می‌شود، فهرستی است که کاربر صفحه‌خوان با آن در صفحه می‌پرد.",
        "en-US":
          "Both cards sit under a level-three heading, so their titles take level four. Nothing about the drawn text size changes — the only thing that changes is the outline a screen-reader user jumps through the page with.",
      },
      render: LevelExample,
    },
    {
      id: "named-region",
      title: { "fa-IR": "کارت به‌عنوان ناحیه", "en-US": "The card as a region" },
      description: {
        "fa-IR":
          "عنوان یک id می‌گیرد و کارت با aria-labelledby به آن اشاره می‌کند؛ نتیجه، ناحیه‌ای است که در فهرست نشانه‌های صفحه‌خوان با نام خودش ظاهر می‌شود. قاعدهٔ resolved-idrefs در گیت بررسی می‌کند که این اشاره واقعاً به جایی برسد.",
        "en-US":
          "The title takes an id and the card points at it with aria-labelledby; the result is a region that appears in a screen reader's landmark list under its own name. The gate's resolved-idrefs rule checks that the reference actually lands.",
      },
      render: RegionExample,
    },
    {
      id: "nested",
      title: { "fa-IR": "کارت درون کارت", "en-US": "A card inside a card" },
      description: {
        "fa-IR":
          "کارت درونی variant plain است. با outlined دو مرز کنار هم می‌افتادند و درزی دوبرابر می‌ساختند که در نگاه اول شبیه یک ایراد رندر است؛ plain دقیقاً برای همین وجود دارد، نه برای «کارتِ بدون قاب».",
        "en-US":
          "The inner card is plain. Left outlined, the two borders would sit against each other and make a doubled seam that reads at a glance as a rendering fault; plain exists for exactly this, not as a general \"card without a frame\".",
      },
      render: NestedExample,
    },
  ],
};
