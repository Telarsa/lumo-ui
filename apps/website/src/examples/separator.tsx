import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Separator } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the separator page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `separator.tsx` has no `"use client"` — the whole
 * component is one ternary, so a rule inside a server-rendered block costs no
 * hydration and no client bytes.
 *
 * The interesting thing here is which ELEMENT comes out, and it is invisible in
 * a screenshot: horizontal renders `<hr>`, the element the HTML specification
 * defines for a thematic break and the one a reader-mode or no-CSS rendering
 * still shows; vertical renders a `<div role="separator" aria-orientation>`,
 * because a vertical `<hr>` would announce a break in the reading flow that is
 * not there. The migration turned down two headless primitives over exactly this
 * — both render a `<div>` unconditionally, including the horizontal case.
 */

const t = {
  profileTitle: { "fa-IR": "اطلاعات شخصی", "en-US": "Personal details" },
  profileBody: {
    "fa-IR": "نام، شمارهٔ تماس و نشانی‌ای که فاکتور به آن صادر می‌شود.",
    "en-US": "The name, phone number and address the invoice is issued to.",
  },
  securityTitle: { "fa-IR": "ورود و امنیت", "en-US": "Sign-in and security" },
  securityBody: {
    "fa-IR": "گذرواژه، ورود دومرحله‌ای و دستگاه‌هایی که به این حساب دسترسی دارند.",
    "en-US": "The password, two-step sign-in, and the devices with access to this account.",
  },
  billingTitle: { "fa-IR": "صورت‌حساب", "en-US": "Billing" },
  billingBody: {
    "fa-IR": "طرح فعلی، روش پرداخت و فاکتورهای پیشین.",
    "en-US": "The current plan, the payment method and past invoices.",
  },

  author: { "fa-IR": "سمیرا محمدی", "en-US": "Samira Mohammadi" },
  readTime: { "fa-IR": "دقیقه خواندن", "en-US": "minute read" },
  comments: { "fa-IR": "دیدگاه", "en-US": "comments" },

  price: { "fa-IR": "قیمت", "en-US": "Price" },
  stock: { "fa-IR": "موجودی انبار", "en-US": "In stock" },
  sku: { "fa-IR": "کد کالا", "en-US": "Item code" },
} satisfies Record<string, LocalizedText>;

function SectionsExample(l: Locale) {
  const sections = [
    { key: "profile", title: t.profileTitle[l], body: t.profileBody[l] },
    { key: "security", title: t.securityTitle[l], body: t.securityBody[l] },
    { key: "billing", title: t.billingTitle[l], body: t.billingBody[l] },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {sections.map((section, index) => (
        <div key={section.key} className="flex flex-col gap-4">
          {index > 0 ? <Separator /> : null}
          <div className="flex flex-col gap-1">
            <h3 className="m-0 text-sm font-semibold text-fg">{section.title}</h3>
            <p className="m-0 text-sm text-fg-muted">{section.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetaRowExample(l: Locale) {
  return (
    <div className="flex items-center gap-3 text-sm text-fg-muted">
      <span>{t.author[l]}</span>
      <Separator orientation="vertical" className="h-4" />
      <span>
        {formatNumber(7, l)} {t.readTime[l]}
      </span>
      <Separator orientation="vertical" className="h-4" />
      <span>
        {formatNumber(12, l)} {t.comments[l]}
      </span>
    </div>
  );
}

function StretchExample(l: Locale) {
  return (
    <div className="flex items-stretch gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-muted">{t.price[l]}</span>
        <span className="text-sm text-fg">
          {formatNumber(2_400_000, l, { style: "currency", currency: "IRR" })}
        </span>
      </div>
      {/* No height class: `self-stretch` takes the row's height on its own. */}
      <Separator orientation="vertical" />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-muted">{t.stock[l]}</span>
        <span className="text-sm text-fg">{formatNumber(38, l)}</span>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-muted">{t.sku[l]}</span>
        <span className="font-mono text-sm text-fg">
          {formatNumber(70412, l, { useGrouping: false })}
        </span>
      </div>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "خطی میان دو گروه محتوا، افقی یا عمودی: میان بخش‌های منو، گروه‌های نوار ابزار، پاره‌های صفحه.",
        "en-US": "A rule between two groups of content, horizontal or vertical: between menu sections, toolbar groups, page parts.",
      },
      whenNot: {
        "fa-IR": "خط برچسب‌دار میان پیام‌ها — `Marker`. فاصله بی‌خط — `Stack`. داخل منو — `MenuSeparator`.",
        "en-US": "A labelled line between messages — `Marker`. Space without a line — `Stack`. Inside a menu — `MenuSeparator`.",
      },
    },
    tier: "layout",
    title: { "fa-IR": "جداکننده", "en-US": "Separator" },
    intro: {
      "fa-IR":
        "خطی میان دو گروه از محتوا — و تمام جزء یک شرط سه‌تایی است، بدون هیچ موتوری. همین انتخابِ عنصر است که ارزش دارد: افقی «hr» می‌دهد، یعنی همان عنصری که مشخصات برای شکست موضوعی تعریف کرده و در حالت خواندن یا بدون سی‌اس‌اس هم دیده می‌شود؛ عمودی یک «div» با نقش جداکننده می‌دهد، چون «hr» عمودی شکستی در جریان خواندن اعلام می‌کند که وجود ندارد. رنگش هم از توکن مرزِ تزئینی می‌آید نه مرز کنترل: مرز یک کنترل باید سه به یک کنتراست داشته باشد، یک خط تزئینی هیچ.",
      "en-US":
        "A rule between two groups of content — and the whole component is one ternary, with no engine at all. The element choice is the part worth having: horizontal gives an «hr», the element the spec defines for a thematic break and the one a reader-mode rendering still shows; vertical gives a «div» with role separator, because a vertical «hr» announces a break in the reading flow that is not there. Its colour comes from the DECORATIVE border token rather than the control one: a control's edge owes 3:1 of contrast, a decorative rule owes none.",
    },
    composition: [
      `<Separator orientation />   ← "horizontal" (the default) → <hr />`,
      `                            ← "vertical" → <div role="separator" aria-orientation>`,
    ].join("\n"),
    parts: [
      {
        name: "Separator",
        description: {
          "fa-IR":
            "کل جزء. orientation اجتماع ادبی خودش است و عمداً از VariantProps گرفته نشده: آن نوع هر کلید را با null هم گسترده می‌کند و آنگاه انتخاب عنصر باید null را هم مدیریت کند. حاشیه‌ها صفرند، پس فاصله‌گذاری کار ظرف است نه کار خط.",
          "en-US":
            "The whole component. orientation is its own literal union and deliberately not taken from VariantProps: that type widens every key with null, and the element choice would then have to handle null. Its margins are zero, so spacing belongs to the container rather than to the rule.",
        },
      },
    ],
  },
  examples: [
    {
      id: "sections",
      title: { "fa-IR": "میان بخش‌های یک پنل", "en-US": "Between the sections of a panel" },
      description: {
        "fa-IR":
          "هر خط اینجا یک «hr» واقعی است، پس معنای «شکست موضوعی» در نشانه‌گذاری می‌ماند و به سی‌اس‌اس وابسته نیست. حاشیهٔ پیش‌فرض مرورگر صفر شده است: فاصله را gap ظرف می‌سازد، که روی محور بلوکی است و چیزی برای قرینه‌شدن ندارد.",
        "en-US":
          "Every rule here is a real «hr», so the \"thematic break\" meaning lives in the markup rather than depending on CSS. The UA's own margins are zeroed: the spacing comes from the container's gap, which is on the block axis and has nothing to mirror.",
      },
      render: SectionsExample,
    },
    {
      id: "meta-row",
      title: { "fa-IR": "میان قلم‌های یک سطر", "en-US": "Between the items of a row" },
      description: {
        "fa-IR":
          "جداکنندهٔ عمودی «hr» نیست: یک «div» با role جداکننده و aria-orientation عمودی. تفاوت را نمی‌بینید و می‌شنوید — «hr» اینجا به صفحه‌خوان می‌گفت جریان خواندن قطع شده، در حالی که این سطر یک جمله است که با خط‌های نازک تکه شده.",
        "en-US":
          "A vertical separator is not an «hr»: it is a «div» with role separator and a vertical aria-orientation. You do not see the difference, you hear it — an «hr» here would tell a screen reader the reading flow had broken, when the row is one sentence sliced up by hairlines.",
      },
      render: MetaRowExample,
    },
    {
      id: "stretch",
      title: { "fa-IR": "قد گرفتن از سطر", "en-US": "Taking the row's height" },
      description: {
        "fa-IR":
          "هیچ‌کدام از این دو خط ارتفاع تعیین‌شده ندارند؛ self-stretch قد سطر را می‌گیرد بدون آنکه ظرف چیزی دربارهٔ فرزندانش بداند. جایگزینش — ارتفاع ثابتی که کسی دستی حساب کند — همان عددی است که در نخستین تغییر متن غلط می‌شود.",
        "en-US":
          "Neither rule has a height set; self-stretch takes the row's height without the container having to be told about its children. The alternative — a fixed height somebody worked out by hand — is the number that goes wrong the first time the text changes.",
      },
      render: StretchExample,
    },
  ],
};
