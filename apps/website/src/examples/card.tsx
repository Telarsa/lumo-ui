import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@lumo-ui/ui";
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

  actionTitle: { "fa-IR": "فضای ذخیره‌سازی", "en-US": "Storage" },
  actionDescription: {
    "fa-IR": "از هجده گیگابایت طرح شما، دوازده گیگابایت پر شده است.",
    "en-US": "Twelve gigabytes of your eighteen-gigabyte plan are in use.",
  },
  manage: { "fa-IR": "مدیریت", "en-US": "Manage" },
  metricTitle: { "fa-IR": "فروش این ماه", "en-US": "Sales this month" },
  metricDescription: {
    "fa-IR": "از آغاز مهر تا امروز، به تومان.",
    "en-US": "From the start of the month to today, in toman.",
  },
  metricTrend: { "fa-IR": "رشد نسبت به ماه پیش", "en-US": "up on last month" },
  metricFooter: {
    "fa-IR": "ارقام هر شب بازخوانی می‌شوند و سفارش‌های بازگردانده‌شده از جمع کم شده‌اند.",
    "en-US": "The figures are recomputed nightly, with refunded orders already deducted.",
  },
  actionBody: {
    "fa-IR": "پرونده‌های حذف‌شده تا سی روز در سطل بازیافت می‌مانند و همچنان فضا اشغال می‌کنند.",
    "en-US": "Deleted files stay in the bin for thirty days and keep taking up room.",
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

function ActionExample(l: Locale) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t.actionTitle[l]}</CardTitle>
        <CardDescription>{t.actionDescription[l]}</CardDescription>
        {/*
         * Last in the DOM, first in the layout's trailing column. The order is
         * the point: a screen reader meets the card's name and its summary
         * before the button that acts on them, which is what makes «مدیریت»
         * mean anything on its own.
         */}
        <CardAction>
          <Button variant="ghost" size="sm">
            {t.manage[l]}
          </Button>
        </CardAction>
      </CardHeader>
      <CardBody>
        <p className="m-0 text-sm text-fg-muted">{t.actionBody[l]}</p>
      </CardBody>
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

function MetricExample(l: Locale) {
  /*
   * The commonest card in any dashboard, and the commonest way to build it
   * wrong: the usual version makes the FIGURE the card's heading, because the
   * figure is the biggest text. That reverses the outline — a screen-reader
   * user jumping by heading then hears a bare number and has to read on to find
   * out what it counts. Here the heading stays the LABEL and the figure is body
   * text set large, so the drawn hierarchy and the announced hierarchy point
   * the same way. `CardTitle`'s `level` is a number precisely so a wall of
   * these cards can sit in a grid under one section heading without stepping
   * on it — see the heading-level example for that arrangement.
   *
   * The trend is a `Badge` with its direction spelled out beside the
   * percentage, not an arrow glyph alone: an arrow is a shape with no name, and
   * up is not a word. Both the figure and the percentage go through
   * `formatNumber`, which is also what places the percent sign correctly for
   * the script.
   */
  return (
    <Card variant="elevated" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t.metricTitle[l]}</CardTitle>
        <CardDescription>{t.metricDescription[l]}</CardDescription>
      </CardHeader>
      <CardBody>
        <p className="m-0 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-semibold text-fg tabular-nums">
            {formatNumber(48200000, l)}
          </span>
          <Badge tone="positive" variant="subtle">
            {formatNumber(0.18, l, { style: "percent" })} {t.metricTrend[l]}
          </Badge>
        </p>
      </CardBody>
      <CardFooter>
        <p className="m-0 w-full text-xs text-fg-muted">{t.metricFooter[l]}</p>
      </CardFooter>
    </Card>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "layout",
    title: { "fa-IR": "کارت", "en-US": "Card" },
    intro: {
      "fa-IR":
        "سطحی با سربرگ، بدنه و پاورقی — هفت جزء و هیچ حالتی. پاورقی کنش‌ها را با justify-end به لبهٔ پایانی می‌برد، و لبهٔ پایانی را خودِ الگوریتم چیدمان از روی جهت ظرف تعیین می‌کند: راست در انگلیسی، چپ در فارسی، بدون هیچ قاعدهٔ جداگانه. عنوان به‌جای برچسب عنصر، ویژگی level می‌گیرد، چون کارت در فهرست سرفصل‌های صفحه جایی دارد و پرش سطح یک نقص واقعی ناوبری است.",
      "en-US":
        "A surface with a header, a body and a footer — seven components and no state. The footer sends its actions to the inline end with justify-end, and the layout algorithm resolves that end against the container's direction: right in English, left in Persian, with no separate rule. The title takes a level NUMBER rather than an element name, because a card has a place in the page outline and a skipped level is a real navigation defect.",
    },
    composition: [
      `<Card variant>                 ← outlined | elevated | plain`,
      `  <CardHeader>              ← a grid; the 2nd column exists only with an action`,
      `    <CardTitle level>          ← 2–6, never 1: a card is not the page`,
      `    <CardDescription>          ← a <p>, so :lang(fa) line-height applies`,
      `    <CardAction>               ← last in the DOM, opposite the title in the layout`,
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
        name: "CardAction",
        description: {
          "fa-IR":
            "کنشی که روی کل کارت اثر می‌گذارد و روبه‌روی عنوان می‌نشیند. در DOM پس از عنوان و توضیح می‌آید تا صفحه‌خوان اول نام کارت را بشنود؛ در چیدمان به ستون دوم می‌رود، و ستون دوم فقط وقتی ساخته می‌شود که این جزء واقعاً حاضر باشد — وگرنه هر کارتِ بی‌کنش عرض عنوانش را به یک ستون خالی می‌داد.",
          "en-US":
            "The control that acts on the whole card, sitting opposite the title. It comes after the title and description in the DOM so a screen reader hears the card's name first; in the layout it moves to the second column, and that column is only created when this part is actually present — otherwise every action-less card would give away title width to an empty track.",
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
      id: "action",
      title: { "fa-IR": "کنش روبه‌روی عنوان", "en-US": "The action opposite the title" },
      description: {
        "fa-IR":
          "سربرگ یک grid است، نه یک ستون flex، و دلیلش دقیقاً همین‌جا دیده می‌شود: دکمه هم‌تراز سطر نخست می‌ماند، نه وسطِ بلوکِ دو سطریِ عنوان و توضیح. جای دکمه با شمارهٔ ستون تعیین می‌شود و شمارهٔ ستون روی محور درون‌خطی حل می‌شود، پس در فارسی بدون هیچ قاعدهٔ تازه‌ای به چپ می‌رود.",
        "en-US":
          "The header is a grid rather than a flex column, and this is where the difference shows: the button stays level with the first line instead of centring against the two-line title-and-description block. Its place is a column NUMBER, and grid columns are laid along the inline axis — so it moves to the left in Persian with no new rule.",
      },
      render: ActionExample,
    },
    {
      id: "metric",
      title: { "fa-IR": "کارت سنجه", "en-US": "The metric card" },
      description: {
        "fa-IR":
          "رایج‌ترین کارت هر داشبورد، و رایج‌ترین راه اشتباه ساختنش: نسخهٔ معمول، خودِ عدد را سرفصل کارت می‌کند چون بزرگ‌ترین متن است. این کار فهرست سرفصل‌ها را وارونه می‌کند — کاربری که با کلید سرفصل در صفحه می‌پرد، عددی برهنه می‌شنود و باید ادامه بخواند تا بفهمد شمارِ چیست. اینجا سرفصل همان برچسب می‌ماند و رقم، متنِ بدنه‌ای است که بزرگ چیده شده، پس سلسله‌مراتب دیداری و سلسله‌مراتب اعلام‌شده یک‌سو می‌شوند. روند، یک Badge است که جهتش کنار درصد نوشته شده و نه یک پیکان تنها: پیکان شکلی بی‌نام است و «بالا» واژه نیست. هم رقم و هم درصد از formatNumber می‌گذرند، و همان است که نشانهٔ درصد را برای این خط سر جای درست می‌گذارد.",
        "en-US":
          "The commonest card in any dashboard, and the commonest way to get it wrong: the usual version makes the FIGURE the heading, because the figure is the biggest text. That reverses the outline — a reader jumping by heading hears a bare number and has to read on to learn what it counts. Here the heading stays the label and the figure is body text set large, so the drawn hierarchy and the announced hierarchy point the same way. The trend is a Badge with its direction spelled out beside the percentage rather than an arrow alone: an arrow is a shape with no name, and up is not a word. Both the figure and the percentage go through formatNumber, which is also what places the percent sign correctly for the script.",
      },
      render: MetricExample,
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
