import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import {
  AlertTriangleIcon,
  CheckIcon,
  HeadphonesIcon,
  ShieldCheckIcon,
  TruckIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { IconTile } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the icon-tile page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `icon-tile.tsx` has no `"use client"` either — a feature
 * grid of forty tiles ships no JavaScript at all, which is the reason to have
 * the component rather than a div with two classes on it.
 *
 * The interesting thing on this page is an ABSENCE: in the feature grid below,
 * none of the tiles has a name and none of them is in the accessibility tree.
 * That is deliberate and it is the component's default — a tile sitting above a
 * heading that already says «ارسال رایگان» would otherwise make every card in
 * the grid announce its subject twice. `label` appears in exactly one example
 * here, the one where the tile is genuinely the only carrier of meaning.
 */

const t = {
  shippingTitle: { "fa-IR": "ارسال رایگان", "en-US": "Free shipping" },
  shippingBody: {
    "fa-IR": "برای سفارش‌های بالای پانصد هزار تومان در سراسر ایران.",
    "en-US": "On orders over five hundred thousand toman, anywhere in Iran.",
  },
  warrantyTitle: { "fa-IR": "ضمانت اصالت", "en-US": "Authenticity guarantee" },
  warrantyBody: {
    "fa-IR": "هر کالا با کد رهگیری سازندهٔ اصلی عرضه می‌شود.",
    "en-US": "Every item ships with the manufacturer's own tracking code.",
  },
  supportTitle: { "fa-IR": "پشتیبانی شبانه‌روزی", "en-US": "Round-the-clock support" },
  supportBody: {
    "fa-IR": "کارشناسان ما هر روز هفته پاسخگو هستند.",
    "en-US": "Our agents answer every day of the week.",
  },
  refundTitle: { "fa-IR": "بازگشت وجه", "en-US": "Money back" },
  refundBody: {
    "fa-IR": "تا هفت روز پس از دریافت، بدون پرسش.",
    "en-US": "Up to seven days after delivery, no questions asked.",
  },

  paid: { "fa-IR": "پرداخت‌شده", "en-US": "Paid" },
  failed: { "fa-IR": "ناموفق", "en-US": "Failed" },
  invoiceOne: { "fa-IR": "فاکتور مرداد", "en-US": "August invoice" },
  invoiceTwo: { "fa-IR": "فاکتور تیر", "en-US": "July invoice" },
} satisfies Record<string, LocalizedText>;

function FeatureGridExample(l: Locale) {
  const features = [
    { icon: <TruckIcon aria-hidden="true" />, title: t.shippingTitle[l], body: t.shippingBody[l] },
    {
      icon: <ShieldCheckIcon aria-hidden="true" />,
      title: t.warrantyTitle[l],
      body: t.warrantyBody[l],
    },
    {
      icon: <HeadphonesIcon aria-hidden="true" />,
      title: t.supportTitle[l],
      body: t.supportBody[l],
    },
    { icon: <WalletIcon aria-hidden="true" />, title: t.refundTitle[l], body: t.refundBody[l] },
  ];
  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      {features.map((feature) => (
        <div key={feature.title} className="flex flex-col gap-2">
          {/* No label: the heading below already says what this means. */}
          <IconTile tone="accent" size="lg">
            {feature.icon}
          </IconTile>
          <h3 className="text-sm font-medium text-fg">{feature.title}</h3>
          <p className="text-sm text-fg-muted">{feature.body}</p>
        </div>
      ))}
    </div>
  );
}

function TonesExample(_l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconTile tone="neutral">
        <TruckIcon aria-hidden="true" />
      </IconTile>
      <IconTile tone="accent">
        <WalletIcon aria-hidden="true" />
      </IconTile>
      <IconTile tone="positive">
        <CheckIcon aria-hidden="true" />
      </IconTile>
      <IconTile tone="caution">
        <AlertTriangleIcon aria-hidden="true" />
      </IconTile>
      <IconTile tone="critical">
        <XIcon aria-hidden="true" />
      </IconTile>
      <IconTile tone="accent" variant="solid">
        <ShieldCheckIcon aria-hidden="true" />
      </IconTile>
    </div>
  );
}

function SizesExample(_l: Locale) {
  return (
    <div className="flex items-center gap-3">
      <IconTile size="sm" tone="accent">
        <TruckIcon aria-hidden="true" />
      </IconTile>
      <IconTile size="md" tone="accent">
        <TruckIcon aria-hidden="true" />
      </IconTile>
      <IconTile size="lg" tone="accent">
        <TruckIcon aria-hidden="true" />
      </IconTile>
    </div>
  );
}

function LabelledExample(l: Locale) {
  const rows = [
    { id: "aug", invoice: t.invoiceOne[l], ok: true, status: t.paid[l] },
    { id: "jul", invoice: t.invoiceTwo[l], ok: false, status: t.failed[l] },
  ];
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
        >
          {/*
           * The one case for `label`: nothing else in the row says whether the
           * invoice was paid, so the tile IS the status and must carry a name.
           */}
          <IconTile size="sm" tone={row.ok ? "positive" : "critical"} label={row.status}>
            {row.ok ? <CheckIcon aria-hidden="true" /> : <XIcon aria-hidden="true" />}
          </IconTile>
          <span className="text-sm text-fg">{row.invoice}</span>
        </li>
      ))}
    </ul>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "آیکونی تزئینی در مربعی رنگی بالای عنوانی که خودش معنا را می‌گوید: شبکهٔ قابلیت‌ها، بخش‌های تنظیمات.",
        "en-US": "A decorative icon in a tinted square above a heading that already names it: feature grids, settings sections.",
      },
      whenNot: {
        "fa-IR": "یک شخص — `Avatar`. آیکونی که کاری می‌کند — `IconButton`. نشانگر کوتاه وضعیت — `Badge`.",
        "en-US": "A person — `Avatar`. An icon that does something — `IconButton`. A short status marker — `Badge`.",
      },
    },
    tier: "display",
    isNew: true,
    title: { "fa-IR": "کاشی آیکون", "en-US": "Icon tile" },
    intro: {
      "fa-IR":
        "آیکون در یک مربع رنگی — همان چیزی که بالای کارتِ ویژگی می‌نشیند. برخلاف عرف، این کاشی به‌طور پیش‌فرض aria-hidden است و آن پیش‌فرضِ درست است: کاشی درست بالای عنوانی می‌نشیند که معنایش را گفته، پس نام دادن به آن یعنی هر ویژگی در شبکه دو بار خوانده شود. tone یک جفتِ پس‌زمینه و پیش‌زمینه است، نه یک رنگ، تا کسی نتواند نیمی از جفت را عوض کند.",
      "en-US":
        "An icon in a tinted square — the thing at the top of a feature card. Against the usual convention the tile is aria-hidden by default, and that is the correct default: it sits directly above a heading that already says what it means, so naming it makes every feature in a grid announce its subject twice. tone is a background and foreground PAIR rather than a colour, so nobody can change half of it.",
    },
    composition: [
      `<IconTile tone variant size label>  ← no label → aria-hidden; label → role="img" with a name`,
      `  the icon, aria-hidden        ← sized by the tile, at half its width`,
      `</IconTile>`,
    ].join("\n"),
    parts: [
      {
        name: "IconTile",
        description: {
          "fa-IR":
            "کل جزء. label را فقط وقتی بده که کاشی تنها حاملِ معنا باشد — مثل نشانگر وضعیت در یک ردیف جدول. حالت سومی وجود ندارد: role=\"img\" بی‌نام از نبودِ نقش هم بدتر است.",
          "en-US":
            "The whole component. Supply label ONLY when the tile is the sole carrier of meaning — a status marker in a table row, say. There is no third state: an unnamed role=\"img\" is worse than no role at all.",
        },
      },
    ],
  },
  examples: [
    {
      id: "feature-grid",
      title: { "fa-IR": "شبکهٔ ویژگی‌ها", "en-US": "Feature grid" },
      description: {
        "fa-IR":
          "هیچ‌کدام از این چهار کاشی نامی ندارد و هیچ‌کدام در درخت دسترس‌پذیری نیست. صفحه‌خوان دقیقاً چهار عنوان و چهار توضیح می‌شنود — همان چیزی که یک انسان از این شبکه می‌خواند.",
        "en-US":
          "None of these four tiles has a name and none is in the accessibility tree. A screen reader hears exactly four headings and four paragraphs — which is what a person reads off this grid.",
      },
      render: FeatureGridExample,
    },
    {
      id: "tones",
      title: { "fa-IR": "شش لحن", "en-US": "Six tones" },
      description: {
        "fa-IR":
          "هر لحن پس‌زمینه و پیش‌زمینه را با هم می‌گذارد، از توکن‌های خود قالب. جدا کردنشان به دو ویژگی همان راهی است که کاشی با پس‌زمینهٔ درست و متنِ ناخوانا از آن بیرون می‌آید.",
        "en-US":
          "Each tone sets a background and a foreground together, from the theme's own tokens. Splitting them into two props is how a tile ends up with a fine-looking background and a foreground nobody adjusted.",
      },
      render: TonesExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR":
          "آیکون همیشه نصفِ عرضِ کاشی است و این را خودِ کاشی تعیین می‌کند، نه فراخوان — پس شبکه‌ای از کاشی‌ها با آیکون‌های ناهم‌اندازه در نمی‌آید.",
        "en-US":
          "The icon is always half the tile's width, and the TILE decides that rather than the caller — so a grid of tiles never comes out with mismatched icon sizes.",
      },
      render: SizesExample,
    },
    {
      id: "labelled",
      title: { "fa-IR": "وقتی کاشی خودش معناست", "en-US": "When the tile is the meaning" },
      description: {
        "fa-IR":
          "در این ردیف‌ها هیچ متنی نمی‌گوید فاکتور پرداخت شده یا نه؛ تیک و ضربدر تنها حاملِ آن خبرند. اینجاست که label لازم است، و کاشی به role=\"img\" با نام تبدیل می‌شود.",
        "en-US":
          "Nothing in these rows says in words whether the invoice was paid; the tick and the cross are the only carriers of that fact. This is where label is required, and the tile becomes a role=\"img\" with a name.",
      },
      render: LabelledExample,
    },
  ],
};
