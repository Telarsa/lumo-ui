import type { Locale } from "@lumo-ui/core";
import { ExternalLinkIcon } from "lucide-react";
import { Link } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the link page. Contract: `_system/types.ts`.
 *
 * A SERVER module — and so, now, is `link.tsx` itself. The component used to
 * rent React Aria's `Link`; the migration read what that dependency actually
 * bought on a real `<a href>` and found the answer was a client boundary. A link
 * in prose, in a footer, in a server-rendered block now costs no hydration.
 *
 * Two of the four examples below are about Persian rather than about links. The
 * underline offset exists because Arabic-script tails — ی, ج, ح, ع, ژ — descend
 * into the space a default underline occupies, and a Latin-only review never
 * sees the rule cutting through them. And `newTab` is a typed PAIR, so opening a
 * new tab without announcing it is not something this API can express.
 */

const t = {
  proseLead: {
    "fa-IR": "برای دیدن جزئیات این سفارش به",
    "en-US": "The details of this order are in",
  },
  proseLink: { "fa-IR": "تاریخچهٔ خریدهایتان", "en-US": "your purchase history" },
  proseTail: {
    "fa-IR": "سر بزنید. آن‌جا می‌توانید فاکتور را هم دریافت کنید.",
    "en-US": "where the invoice can also be downloaded.",
  },

  tracking: { "fa-IR": "رهگیری مرسوله در سامانهٔ پست", "en-US": "Track the parcel on the postal service" },
  newTabWarning: { "fa-IR": "در برگه جدید باز می‌شود", "en-US": "opens in a new tab" },

  overview: { "fa-IR": "نمای کلی", "en-US": "Overview" },
  orders: { "fa-IR": "سفارش‌ها", "en-US": "Orders" },
  invoices: { "fa-IR": "فاکتورها", "en-US": "Invoices" },
  settings: { "fa-IR": "تنظیمات", "en-US": "Settings" },

  accent: { "fa-IR": "پیوند درون نثر", "en-US": "A link in prose" },
  subtle: { "fa-IR": "پیوند ناوبری فشرده", "en-US": "A dense navigation link" },
  quiet: { "fa-IR": "پیوند روی یک کارت", "en-US": "A link wrapping a card" },
  unavailable: { "fa-IR": "گزارش سالانه", "en-US": "Annual report" },
} satisfies Record<string, LocalizedText>;

function InProseExample(l: Locale) {
  return (
    <p className="m-0 max-w-prose text-sm text-fg">
      {t.proseLead[l]}{" "}
      <Link href="#example-in-prose" size="sm">
        {t.proseLink[l]}
      </Link>{" "}
      {t.proseTail[l]}
    </p>
  );
}

function NewTabExample(l: Locale) {
  return (
    <Link href="#example-new-tab" newTab newTabLabel={t.newTabWarning[l]}>
      {t.tracking[l]}
      <ExternalLinkIcon aria-hidden="true" />
    </Link>
  );
}

function CurrentExample(l: Locale) {
  const items = [
    { key: "overview", label: t.overview[l], current: false },
    { key: "orders", label: t.orders[l], current: true },
    { key: "invoices", label: t.invoices[l], current: false },
    { key: "settings", label: t.settings[l], current: false },
  ];
  return (
    <ul className="flex list-none flex-wrap items-center gap-4 p-0">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href="#example-current"
            variant="subtle"
            size="sm"
            {...(item.current ? { isCurrent: "page" as const } : {})}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function VariantsExample(l: Locale) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Link href="#example-variants">{t.accent[l]}</Link>
      <Link href="#example-variants" variant="subtle">
        {t.subtle[l]}
      </Link>
      <Link href="#example-variants" variant="quiet">
        {t.quiet[l]}
      </Link>
      {/* No href at all: a <span role="link">, and not a tab stop. */}
      <Link isDisabled>{t.unavailable[l]}</Link>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ناوبری به صفحه یا بخشی دیگر روی یک لنگر واقعی: در متن، در پابرگ، در جدول.",
        "en-US": "Navigation to another page or section on a real anchor: in prose, in footers, in tables.",
      },
      whenNot: {
        "fa-IR": "کنشی که حالت را تغییر می‌دهد — `Button`. ناوبری بالای سایت با پنل — `NavigationMenu`. مسیر رسیدن به این صفحه — `Breadcrumbs`.",
        "en-US": "An action that changes state — `Button`. Site-top navigation with panels — `NavigationMenu`. The trail to this page — `Breadcrumbs`.",
      },
    },
    tier: "navigation",
    title: { "fa-IR": "پیوند", "en-US": "Link" },
    intro: {
      "fa-IR":
        "یک پیوند ناوبری، روی یک «a» واقعی و بدون هیچ موتوری. فاصلهٔ زیرخط بخشی از خود جزء است نه اصلاحی صفحه‌به‌صفحه: دنبالهٔ حرف‌های خط عربی پایین‌تر از خط پایه می‌روند و زیرخط پیش‌فرض از میانشان می‌گذرد. باز کردن برگهٔ تازه هم فقط از راه یک جفت تایپ‌شده ممکن است — newTab بدون newTabLabel کامپایل نمی‌شود، چون هشدارِ تغییر بافت یک رشتهٔ گفتنی است و کتابخانه هیچ پیش‌فرض انگلیسی ندارد.",
      "en-US":
        "A navigational link on a real «a», with no engine at all. The underline offset is part of the component rather than a per-page fix: Arabic-script descenders drop below the baseline and a default underline cuts through them. Opening a new tab is likewise reachable only through a typed pair — newTab without newTabLabel does not compile, because the change-of-context warning is a SPOKEN string and the library ships no English default.",
    },
    composition: [
      `<Link href variant size isCurrent isDisabled newTab newTabLabel>`,
      `                        ← no href, or isDisabled → <span role="link">`,
      `                        ← isCurrent → aria-current AND data-current`,
      `                        ← newTab → target + rel, plus an sr-only warning`,
      `</Link>`,
    ].join("\n"),
    parts: [
      {
        name: "Link",
        description: {
          "fa-IR":
            "کل جزء. target و rel از نوع حذف شده‌اند تا دری پشتی نماند: تنها راه رسیدن به برگهٔ تازه، جفت newTab و newTabLabel است. هشدار پس از متن دیدنی می‌آید، چون نام دسترس‌پذیر به ترتیب سند به‌هم چسبانده می‌شود و الگوریتم دوجهته آن ترتیب را به‌هم نمی‌زند.",
          "en-US":
            "The whole component. target and rel are removed from the prop type so there is no back door: the only route to a new tab is the newTab / newTabLabel pair. The warning is appended AFTER the visible text, because an accessible name is concatenated in document order and the bidi algorithm never reorders that.",
        },
      },
    ],
  },
  examples: [
    {
      id: "in-prose",
      title: { "fa-IR": "پیوند درون نثر", "en-US": "A link in prose" },
      description: {
        "fa-IR":
          "گونهٔ پیش‌فرض هم رنگ دارد و هم زیرخط، چون رنگ به‌تنهایی نشانهٔ کافی نیست وقتی پیوند میان متن نشسته. فاصلهٔ زیرخط را روی مسیر فارسی ببینید: خط از زیر دنبالهٔ «ی» و «ج» می‌گذرد و آن‌ها را نمی‌بُرد.",
        "en-US":
          "The default variant is coloured AND underlined, because colour alone is not a distinguishing feature once the link sits inside prose. Look at the underline offset on the fa route: the rule passes below the tails of «ی» and «ج» instead of cutting through them.",
      },
      render: InProseExample,
    },
    {
      id: "new-tab",
      title: { "fa-IR": "برگهٔ تازه، اعلام‌شده", "en-US": "A new tab, announced" },
      description: {
        "fa-IR":
          "نام دسترس‌پذیر این پیوند «رهگیری مرسوله… در برگه جدید باز می‌شود» است؛ نیمهٔ دوم sr-only است و روی صفحه دیده نمی‌شود. آیکون بیرونی aria-hidden است و جای هشدار را نمی‌گیرد — آیکون چیزی نمی‌گوید، فقط چیزی را که گفته شده تکرار می‌کند.",
        "en-US":
          "This link's accessible name is \"Track the parcel… opens in a new tab\"; the second half is sr-only and never drawn. The outbound icon is aria-hidden and does NOT stand in for the warning — an icon says nothing, it only repeats something already said.",
      },
      render: NewTabExample,
    },
    {
      id: "current",
      title: { "fa-IR": "صفحه‌ای که روی آن هستید", "en-US": "The page you are on" },
      description: {
        "fa-IR":
          "isCurrent هم‌زمان aria-current و data-current می‌نویسد، پس حالت فعال هم قابل استایل‌دهی است و هم اعلام می‌شود، بدون هیچ رشتهٔ پنهانِ اضافه. مقدار page است نه true: واژه می‌گوید خواننده روی چه چیزی است، و صفحه‌خوان آن را به زبان خودش می‌گوید.",
        "en-US":
          "isCurrent writes aria-current AND data-current, so the active item is both styleable and announced with no extra sr-only string. The value is \"page\" rather than true: the word names WHAT the reader is currently on, and a screen reader speaks it in its own language.",
      },
      render: CurrentExample,
    },
    {
      id: "variants",
      title: { "fa-IR": "سه گونه و یک غیرفعال", "en-US": "Three variants and one unavailable" },
      description: {
        "fa-IR":
          "آخرین مورد href ندارد و isDisabled است، پس اصلاً «a» نیست: یک «span» با role پیوند که در ترتیب تب هم نمی‌آید. عنصر عوض می‌شود چون «a» بدون مقصد برای صفحه‌خوان پیوند نیست، یک گرهٔ بی‌نقش است — و کنترلی که فعال نمی‌شود نباید ایستگاه تب باشد.",
        "en-US":
          "The last item has no href and is disabled, so it is not an «a» at all: a «span» with role link, kept out of the tab order. The element changes because an «a» without a destination is not a link to a screen reader, it is a generic — and a control that cannot be activated should not be a tab stop.",
      },
      render: VariantsExample,
    },
  ],
};
