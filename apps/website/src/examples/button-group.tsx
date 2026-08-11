import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  IconButton,
} from "@lumo-ui/ui";
import { BoldIcon, ItalicIcon, MinusIcon, PlusIcon, Trash2Icon, UnderlineIcon } from "lucide-react";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the button-group page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `button-group.tsx` carries no `"use client"` either: the
 * group is a presentational `<div role="group">` and the interactivity belongs
 * to the Button children, which carry their own client boundary. So everything
 * on this page is in the served bytes — the seams included, which is what makes
 * the direction claim below checkable rather than assertable.
 *
 * ── THE SEAMS ARE THE COMPONENT ─────────────────────────────────────────────
 *
 * Upstream joins the corners with `rounded-r-none` / `rounded-l-none` /
 * `border-l-0`, which pins every seam to a physical side. On a Persian page the
 * FIRST button sits on the right, so those classes square the OUTER corner and
 * round an INNER one — a group that looks subtly wrong and reviews as a spacing
 * problem. Every seam rule here is inline-axis logical instead:
 *
 *     every child after the first   loses its START corners and its START border
 *     every child before the last   loses its END corners
 *
 * The class string is IDENTICAL in both scripts, which `button-group.test.tsx`
 * pins by rendering the group under both directions and diffing the class sets.
 *
 * The vertical orientation stacks along the BLOCK axis, which mirrors in no
 * horizontal writing mode, so its rules are physical on purpose.
 *
 * ── AND THE ONE PROP THAT IS REQUIRED ───────────────────────────────────────
 *
 * `label`. A `role="group"` makes a screen reader announce entry and exit, and
 * an unnamed one is announced as "group" and nothing else.
 */

const t = {
  docActions: { "fa-IR": "کارهای سند", "en-US": "Document actions" },
  duplicate: { "fa-IR": "رونوشت", "en-US": "Duplicate" },
  rename: { "fa-IR": "تغییر نام", "en-US": "Rename" },
  remove: { "fa-IR": "حذف", "en-US": "Delete" },

  textStyle: { "fa-IR": "سبک متن", "en-US": "Text style" },
  bold: { "fa-IR": "سیاه", "en-US": "Bold" },
  italic: { "fa-IR": "کج", "en-US": "Italic" },
  underline: { "fa-IR": "زیرخط", "en-US": "Underline" },

  quantity: { "fa-IR": "تعداد کالا", "en-US": "Item quantity" },
  decrease: { "fa-IR": "یکی کمتر", "en-US": "One fewer" },
  increase: { "fa-IR": "یکی بیشتر", "en-US": "One more" },

  amount: { "fa-IR": "مبلغ سفارش", "en-US": "Order amount" },
  currency: { "fa-IR": "تومان", "en-US": "IRR" },
  applyDiscount: { "fa-IR": "اعمال تخفیف", "en-US": "Apply a discount" },

  viewport: { "fa-IR": "بازهٔ گزارش", "en-US": "Report range" },
  today: { "fa-IR": "امروز", "en-US": "Today" },
  thisWeek: { "fa-IR": "این هفته", "en-US": "This week" },
  thisMonth: { "fa-IR": "این ماه", "en-US": "This month" },
} satisfies Record<string, LocalizedText>;

function OutlineExample(l: Locale) {
  return (
    <ButtonGroup label={t.docActions[l]}>
      <Button variant="outline">{t.duplicate[l]}</Button>
      <Button variant="outline">{t.rename[l]}</Button>
      <IconButton label={t.remove[l]} variant="outline">
        <Trash2Icon aria-hidden="true" />
      </IconButton>
    </ButtonGroup>
  );
}

function SolidExample(l: Locale) {
  return (
    <ButtonGroup label={t.textStyle[l]}>
      <IconButton label={t.bold[l]}>
        <BoldIcon aria-hidden="true" />
      </IconButton>
      <ButtonGroupSeparator />
      <IconButton label={t.italic[l]}>
        <ItalicIcon aria-hidden="true" />
      </IconButton>
      <ButtonGroupSeparator />
      <IconButton label={t.underline[l]}>
        <UnderlineIcon aria-hidden="true" />
      </IconButton>
    </ButtonGroup>
  );
}

function TextExample(l: Locale) {
  return (
    <div className="flex flex-col gap-4">
      <ButtonGroup label={t.quantity[l]}>
        <IconButton label={t.decrease[l]} variant="outline">
          <MinusIcon aria-hidden="true" />
        </IconButton>
        <ButtonGroupText>{formatNumber(3, l)}</ButtonGroupText>
        <IconButton label={t.increase[l]} variant="outline">
          <PlusIcon aria-hidden="true" />
        </IconButton>
      </ButtonGroup>
      <ButtonGroup label={t.amount[l]}>
        <ButtonGroupText>{t.currency[l]}</ButtonGroupText>
        <ButtonGroupText>{formatNumber(1250000, l)}</ButtonGroupText>
        <Button variant="outline">{t.applyDiscount[l]}</Button>
      </ButtonGroup>
    </div>
  );
}

function VerticalExample(l: Locale) {
  return (
    <ButtonGroup label={t.viewport[l]} orientation="vertical">
      <Button variant="outline">{t.today[l]}</Button>
      <Button variant="outline">{t.thisWeek[l]}</Button>
      <Button variant="outline">{t.thisMonth[l]}</Button>
    </ButtonGroup>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    title: { "fa-IR": "گروه دکمه", "en-US": "Button group" },
    intro: {
      "fa-IR":
        "ردیفی از دکمه‌های مرتبط که به یک کنترلِ دیداریِ واحد جوش می‌خورند. درزها روی خودِ فرزندان صاف می‌شوند و نه با بریدنِ گروه، چون یک دکمه شعاع خودش را دارد و بریدن، گوشه‌های او را روی هر درز شیار می‌انداخت. هر سه قاعدهٔ درز روی محور درون‌خطی منطقی‌اند، پس لبهٔ جوش‌خورده با خط آینه می‌شود و رشتهٔ کلاس در هر دو زبان یکسان است. label اجباری است: یک role=\"group\" ورود و خروج را اعلام می‌کند و بی‌نامش «گروه» و هیچ.",
      "en-US":
        "A row of related buttons joined into one visual control. The seams are squared on the CHILDREN rather than by clipping the group, because a Button declares its own radius and clipping would leave its corners notching every seam. All three seam rules are inline-axis logical, so the joined edge mirrors with the script and the class string is identical in both. `label` is required: a `role=\"group\"` announces entry and exit, and an unnamed one is «group» and nothing else.",
    },
    composition: [
      `<ButtonGroup label orientation>          ← role="group"; label is REQUIRED`,
      `  <Button variant="outline">…</Button>`,
      `  <ButtonGroupSeparator />               ← for two SOLID neighbours`,
      `  <ButtonGroupText>…</ButtonGroupText>   ← a unit, a prefix, a count`,
      `  <IconButton label="…">…</IconButton>`,
      `</ButtonGroup>`,
    ].join("\n"),
    parts: [
      {
        name: "ButtonGroup",
        description: {
          "fa-IR":
            "خودِ گروه: یک div با نقشِ گروه و یک نام. قاعده‌های درز از همین‌جا روی فرزندان اعمال می‌شود، پس افزودن یا برداشتنِ یک دکمه هیچ کلاسی را دستی جابه‌جا نمی‌کند. حلقهٔ فوکوس هر فرزند هم بالای همسایه‌اش می‌آید، چون حلقه بیرونِ جعبهٔ حاشیه کشیده می‌شود — دقیقاً جایی که دکمهٔ بعدی رنگ می‌زند.",
          "en-US":
            "The group itself: a `div` with a group role and a name. The seam rules are applied to the children from here, so adding or removing a button moves no class by hand. Each child's focus ring is also lifted above its neighbour, because the ring is drawn OUTSIDE the border box — exactly where the next button paints.",
        },
      },
      {
        name: "ButtonGroupText",
        description: {
          "fa-IR":
            "متنِ غیرِ تعاملی درونِ گروه — یک واحد، یک پیشوند، یک شمارش. حاشیه و شعاعش با دکمه جور است تا قاعده‌های درز آن را هم‌رده حساب کنند. هر عددی که اینجا می‌گذارید باید از formatNumber بگذرد؛ یک عددِ برهنه در همین جعبه رقم لاتین را کنار ارقام فارسیِ بقیهٔ صفحه می‌نشاند.",
          "en-US":
            "Non-interactive text inside the group — a unit, a prefix, a count. Its border and radius match a Button so the seam rules treat it as a peer. Any number placed here goes through `formatNumber`; a bare one puts a Latin digit beside the Persian digits of the rest of the page.",
        },
      },
      {
        name: "ButtonGroupSeparator",
        description: {
          "fa-IR":
            "خط‌مویی میان دو عضو، برای وقتی که دو دکمهٔ توپر کنار هم می‌نشینند — آن‌ها حاشیهٔ خودشان را ندارند، پس قاعده‌های درز چیزی دیدنی بینشان نمی‌گذارد. رنگش از ردهٔ کنترل است و نه از ردهٔ تزئینی، چون این خط بخشی از مرزِ یک کنترل خوانده می‌شود و همان است که بندِ ۱٫۴٫۱۱ می‌خواهد.",
          "en-US":
            "A hairline between two members, for when two SOLID buttons sit side by side — they have no borders of their own, so the seam rules leave nothing visible between them. Its colour comes from the control tier rather than the decorative one, because this rule reads as part of a control's boundary, which is what WCAG 1.4.11 asks about.",
        },
      },
      {
        name: "buttonGroupVariants",
        description: {
          "fa-IR":
            "قاعده‌های درز. افقی روی محور درون‌خطی است و منطقی؛ عمودی روی محور بلوکی است و عمداً فیزیکی، چون بالا و پایین در هیچ حالتِ نوشتنِ افقی جابه‌جا نمی‌شوند و املای منطقیِ ساختگی فقط آن را پنهان می‌کرد.",
          "en-US":
            "The seam rules. Horizontal is inline-axis and logical; vertical is block-axis and physical on purpose, because up and down do not swap in any horizontal writing mode and an invented logical spelling would only hide that.",
        },
      },
      {
        name: "IconButton",
        description: {
          "fa-IR":
            "عضوی که تنها یک نگاره است. label اش همچنان اجباری است: نامِ گروه می‌گوید این ردیف چیست، نه اینکه سومین دکمه چه می‌کند.",
          "en-US":
            "A member that is only a glyph. Its `label` is still required: the group's name says what the row is, not what the third button does.",
        },
      },
    ],
  },
  examples: [
    {
      id: "outline-row",
      title: { "fa-IR": "یک خط‌مو به‌جای دو", "en-US": "One hairline instead of two" },
      description: {
        "fa-IR":
          "هر فرزند پس از اولی حاشیهٔ لبهٔ آغازش را می‌اندازد، پس دو دکمهٔ خط‌دار یک خط‌موی مشترک دارند و نه دو خطِ چسبیده. گوشه‌های بیرونی گرد می‌مانند و فقط گوشه‌های داخلی صاف می‌شوند — و چون هر سه قاعده منطقی‌اند، در فارسی «بیرونی» همان سمت راست است بی‌آنکه چیزی در کلاس‌ها عوض شود.",
        "en-US":
          "Every child after the first drops its start border, so two outlined buttons share ONE hairline rather than two touching ones. The outer corners stay round and only the inner ones are squared — and because all three rules are logical, «outer» is the right-hand side in Persian with nothing in the classes changing.",
      },
      render: OutlineExample,
    },
    {
      id: "solid-row",
      title: { "fa-IR": "وقتی درزها دیده نمی‌شوند", "en-US": "When the seams are invisible" },
      description: {
        "fa-IR":
          "سه دکمهٔ توپر هیچ حاشیه‌ای ندارند، پس قاعده‌های درز چیزی برای برداشتن ندارند و ردیف یک تودهٔ یکدست می‌شود. جداکنندهٔ گروه همان خطی است که کم بود، و رنگش از ردهٔ کنترل می‌آید تا در برابر پس‌زمینهٔ دکمه هم دیده شود.",
        "en-US":
          "Three solid buttons have no borders, so the seam rules have nothing to remove and the row becomes one undifferentiated block. The group's separator is the missing rule, and its colour comes from the control tier so it stays visible against the button's own fill.",
      },
      render: SolidExample,
    },
    {
      id: "with-text",
      title: { "fa-IR": "عددی که کنترل نیست", "en-US": "A number that is not a control" },
      description: {
        "fa-IR":
          "خانهٔ میانی متن است و نه دکمه: نه ایستِ تبی می‌گیرد، نه فشرده می‌شود، و قاعده‌های درز آن را مثل هر عضوِ دیگری حساب می‌کنند. هر دو عدد از formatNumber گذشته‌اند، پس روی مسیر فارسی «۳» و «۱٬۲۵۰٬۰۰۰» سرو می‌شود — جداکنندهٔ هزارگان هم از خودِ زبان می‌آید و نه از یک کاما که دستی گذاشته شده باشد.",
        "en-US":
          "The middle cell is TEXT rather than a button: it takes no tab stop, cannot be pressed, and the seam rules count it as a peer anyway. Both numbers go through `formatNumber`, so the Persian route serves «۳» and «۱٬۲۵۰٬۰۰۰» — with the thousands separator coming from the language rather than from a comma someone typed.",
      },
      render: TextExample,
    },
    {
      id: "vertical",
      title: { "fa-IR": "محوری که آینه نمی‌شود", "en-US": "The axis that does not mirror" },
      description: {
        "fa-IR":
          "با orientation=\"vertical\" پشته روی محور بلوکی می‌رود و قاعده‌های درز به جفتِ بالا و پایین عوض می‌شوند — که فیزیکی‌اند و باید باشند. این تنها جای این جزء است که املای فیزیکی درست است، و نوشتنش با یک جفتِ منطقی فقط خواننده را وامی‌داشت باور کند اینجا هم چیزی جابه‌جا می‌شود.",
        "en-US":
          "With `orientation=\"vertical\"` the stack runs on the block axis and the seam rules become `rounded-t`/`rounded-b` and `border-t-0` — physical, and rightly so. This is the one place in the component where a physical spelling is correct, and writing it logically would only make the reader believe something mirrors here too.",
      },
      render: VerticalExample,
    },
  ],
};
