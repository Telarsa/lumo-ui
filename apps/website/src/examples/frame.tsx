import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Frame } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the frame page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `frame.tsx` is directive-free too: it is a border with a
 * decorative header, so a page of previews ships none of it.
 *
 * The example worth stopping on is the browser bar, because of what it is NOT.
 * The three traffic-light dots are `<span>`s inside an `aria-hidden` subtree,
 * not `<button>`s — a mockup built from real buttons puts three unnamed
 * controls into the tab order of every page that shows a preview, and
 * `lumo-gate`'s `named-controls` fails the build on each one. That is how the
 * rule was arrived at rather than assumed.
 *
 * The bar also carries `dir="ltr"` and `data-lumo-latn` while `children` inherit
 * the page's own direction untouched. A browser's chrome is not part of the
 * document it frames, and a URL is a left-to-right run — mirroring the dots on
 * a Persian page draws a browser that does not exist.
 */

const t = {
  browserLabel: { "fa-IR": "پیش‌نمایش فروشگاه", "en-US": "Storefront preview" },
  phoneLabel: { "fa-IR": "پیش‌نمایش موبایل", "en-US": "Mobile preview" },
  plainLabel: { "fa-IR": "پیش‌نمایش قالب روشن", "en-US": "Light theme preview" },

  shopTitle: { "fa-IR": "فروشگاه نیلوفر", "en-US": "Niloofar Store" },
  shopTagline: {
    "fa-IR": "دست‌ساخته‌های سفالی، مستقیم از کارگاه لالجین.",
    "en-US": "Handmade pottery, straight from the Lalejin workshop.",
  },
  productsWord: { "fa-IR": "کالا", "en-US": "products" },
  ordersWord: { "fa-IR": "سفارش امروز", "en-US": "orders today" },

  appGreeting: { "fa-IR": "سلام سمیرا", "en-US": "Hello Samira" },
  appBalanceLabel: { "fa-IR": "موجودی کیف پول", "en-US": "Wallet balance" },
  tomanWord: { "fa-IR": "تومان", "en-US": "toman" },
  appAction: { "fa-IR": "افزایش موجودی", "en-US": "Top up" },

  themeNote: {
    "fa-IR": "بدون هیچ زینتی — فقط یک سطح با قاب و گوشهٔ گرد.",
    "en-US": "No chrome at all — just a bordered surface with rounded corners.",
  },
} satisfies Record<string, LocalizedText>;

function BrowserExample(l: Locale) {
  return (
    <Frame
      device="browser"
      label={t.browserLabel[l]}
      address="niloofar.example/shop"
      className="w-full max-w-md"
    >
      <div className="flex flex-col gap-2 p-6">
        <div className="text-base font-medium text-fg">{t.shopTitle[l]}</div>
        <p className="text-sm text-fg-muted">{t.shopTagline[l]}</p>
        <div className="mt-2 flex gap-4 text-xs text-fg-subtle">
          {/* Through formatNumber — a bare number here is a Latin digit on the fa route. */}
          <span>{`${formatNumber(128, l)} ${t.productsWord[l]}`}</span>
          <span>{`${formatNumber(37, l)} ${t.ordersWord[l]}`}</span>
        </div>
      </div>
    </Frame>
  );
}

/**
 * The phone, at the width the component itself ships.
 *
 * This carried `className="max-w-[16rem]"`, and the measured result was a
 * handset 256px wide between a 448px browser window and a 448px plain frame on
 * the same page — centred (the canvas put 248.5px on each side of it, so it was
 * never off-centre, only small), but visibly the runt of the three, with an 8px
 * bezel wrapped around 224px of screen.
 *
 * `frameVariants`' phone already ships `w-[min(22rem,100%)]` — 352px, a real
 * handset width, and the `min()` keeps it inside a narrow canvas without help.
 * Overriding it here made the example argue with the component it documents,
 * and the override bought nothing: the stage is 817px wide either way.
 *
 * The comment lives above the declaration rather than inside it because
 * `_system/extract.ts` slices the shown source from `function PhoneExample(`
 * onward — a note about a past defect is not part of the example a reader
 * copies.
 */
function PhoneExample(l: Locale) {
  return (
    <Frame device="phone" label={t.phoneLabel[l]}>
      <div className="flex flex-col gap-4 p-5">
        <div className="text-sm text-fg-muted">{t.appGreeting[l]}</div>
        <div className="rounded-xl bg-surface-sunken p-4">
          <div className="text-xs text-fg-subtle">{t.appBalanceLabel[l]}</div>
          <div className="mt-1 text-lg font-medium text-fg">
            {`${formatNumber(2450000, l)} ${t.tomanWord[l]}`}
          </div>
        </div>
        <div className="rounded-lg bg-accent px-3 py-2 text-center text-sm text-accent-fg">
          {t.appAction[l]}
        </div>
      </div>
    </Frame>
  );
}

function PlainExample(l: Locale) {
  return (
    <Frame device="plain" label={t.plainLabel[l]} className="w-full max-w-md">
      <p className="p-6 text-sm text-fg-muted">{t.themeNote[l]}</p>
    </Frame>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "قاب دستگاه دور یک پیش‌نمایش: نوار مرورگر یا لبهٔ گوشی دور نماگرفت یا نمونهٔ زنده.",
        "en-US": "Device chrome around a preview: a browser bar or a phone bezel around a screenshot or a live demo.",
      },
      whenNot: {
        "fa-IR": "نگه‌داشتن نسبت بی‌هیچ قابی — `AspectRatio`. سطح محتوایی با سربرگ و پابرگ — `Card`.",
        "en-US": "Holding a proportion with no chrome — `AspectRatio`. A content surface with header and footer — `Card`.",
      },
    },
    tier: "layout",
    isNew: true,
    title: { "fa-IR": "قاب دستگاه", "en-US": "Frame" },
    intro: {
      "fa-IR":
        "قابِ دستگاه دور یک پیش‌نمایش — نوار مرورگر یا حاشیهٔ گوشی. کل این زینت تزئینی است و aria-hidden می‌گیرد: سه نقطهٔ نوار مرورگر دکمه نیستند، چون یک ماکتِ ساخته‌شده از دکمه‌های واقعی سه کنترلِ بی‌نام را وارد ترتیب Tab هر صفحه‌ای می‌کند که پیش‌نمایشی نشان می‌دهد. نوار dir=\"ltr\" است و محتوا جهت خودِ صفحه را نگه می‌دارد.",
      "en-US":
        "Device chrome around a preview — a browser bar or a phone bezel. The whole chrome is decoration and carries aria-hidden: the three dots on a browser bar are not buttons, because a mockup built from real ones puts three unnamed controls into the tab order of every page showing a preview. The bar is dir=\"ltr\"; the content keeps the page's own direction.",
    },
    composition: [
      `<Frame device label address>   ← label names what is INSIDE; the chrome is hidden`,
      `  the preview                  ← inherits the page's own direction, untouched`,
      `</Frame>`,
      ``,
      `device="browser"   a bar with three dots and an address line`,
      `device="phone"     a thick bezel and a speaker slot`,
      `device="plain"     no chrome at all`,
    ].join("\n"),
    parts: [
      {
        name: "Frame",
        description: {
          "fa-IR":
            "کل جزء، یک «figure» با نام. label الزامی است چون زینت پنهان است و بدون آن قاب فقط یک گروهِ بی‌نام دور محتواست. «figure» است و نه landmark: یک پیش‌نمایش محتوای توضیحی است و یک landmark برای هر ماکت، فهرست نشانه‌های صفحه را شلوغ می‌کند.",
          "en-US":
            "The whole component, a «figure» with a name. label is required because the chrome is hidden, and without it the frame is an anonymous group around its content. A «figure» rather than a landmark: a preview is illustrative content, and a landmark per mockup clutters the landmark list.",
        },
      },
    ],
  },
  examples: [
    {
      id: "browser",
      title: { "fa-IR": "پنجرهٔ مرورگر", "en-US": "Browser window" },
      description: {
        "fa-IR":
          "نوار بالا از درخت دسترس‌پذیری بیرون است و در هر دو زبان چپ‌به‌راست می‌ماند — نشانی هم یک رشتهٔ لاتین است و با data-lumo-latn نشان‌دار شده تا دروازه آن را نشتِ انگلیسی نخواند. محتوای داخل قاب اما فارسی و راست‌به‌چپ است.",
        "en-US":
          "The bar is out of the accessibility tree and stays left-to-right in both locales — the address is a Latin run, marked with data-lumo-latn so the gate does not read it as an English leak. The content inside the frame is Persian and right-to-left.",
      },
      render: BrowserExample,
    },
    {
      id: "phone",
      title: { "fa-IR": "حاشیهٔ گوشی", "en-US": "Phone bezel" },
      description: {
        "fa-IR":
          "گوشهٔ گرد، حاشیهٔ ضخیم و یک شکافِ بلندگو. شکل‌های ناچ که به clip-path یا چند شبه‌عنصر نیاز دارند تصویری از سخت‌افزار یک سازنده در یک سالِ مشخص‌اند و قاب را سریع‌تر از هر چیز دیگری قدیمی می‌کنند.",
        "en-US":
          "Rounded corners, a thick border and a speaker slot. The notch shapes that need clip-path or a stack of pseudo-elements are a rendering of one manufacturer's hardware from one year, and they date the frame faster than anything else in it.",
      },
      render: PhoneExample,
    },
    {
      id: "plain",
      title: { "fa-IR": "بدون زینت", "en-US": "No chrome" },
      description: {
        "fa-IR":
          "وقتی فقط یک مرزِ تمیز دور پیش‌نمایش لازم است. label همچنان الزامی است: قاب هنوز چیزی را دربر می‌گیرد و آن چیز نامی می‌خواهد.",
        "en-US":
          "For when all that is wanted is a clean boundary around a preview. label is still required: the frame still encloses something, and that something needs a name.",
      },
      render: PlainExample,
    },
  ],
};
