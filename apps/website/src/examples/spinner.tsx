import type { Locale } from "@lumo-ui/core";
import { Button, Spinner } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the spinner page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `spinner.tsx` has no `"use client"` — the ring is a
 * bordered circle with a CSS rotation and the live region is a plain attribute.
 * That is what puts the spinner in the server-rendered first byte, which is the
 * moment a loading indicator is most useful and the moment a client-only one has
 * not mounted yet.
 *
 * `label` is a REQUIRED string, and this is the component that proves why: a
 * spinner has no text, so a screen-reader user gets not a wrong name but SILENCE
 * while the page appears frozen. It cannot be defaulted either, because the
 * default would be English handed to a Persian voice.
 *
 * The label is real text inside `role="status"`, never an `aria-label` on it —
 * a live region announces its CONTENT when that content changes, and a name is
 * not content. That is also why `showLabel` cannot make the visible and the
 * spoken strings drift: there is only one string.
 */

const t = {
  loading: { "fa-IR": "در حال بارگذاری…", "en-US": "Loading…" },
  saving: { "fa-IR": "در حال ذخیرهٔ تغییرها…", "en-US": "Saving your changes…" },
  verifying: { "fa-IR": "در حال بررسی کارت بانکی…", "en-US": "Checking the card…" },
  importing: {
    "fa-IR": "در حال درون‌ریزی فهرست کالاها — این کار ممکن است چند دقیقه طول بکشد",
    "en-US": "Importing the product list — this can take a few minutes",
  },
  submit: { "fa-IR": "ثبت سفارش", "en-US": "Place the order" },
} satisfies Record<string, LocalizedText>;

function AnnouncedExample(l: Locale) {
  return (
    <div className="flex items-center gap-6">
      {/* Nothing visible says what is happening. The label still does. */}
      <Spinner label={t.loading[l]} />
      <Spinner label={t.saving[l]} color="accent" />
      <Spinner label={t.verifying[l]} color="muted" />
    </div>
  );
}

function VisibleExample(l: Locale) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Spinner label={t.saving[l]} showLabel color="muted" />
      <Spinner label={t.importing[l]} showLabel color="accent" />
    </div>
  );
}

function InButtonExample(l: Locale) {
  return (
    <Button isDisabled>
      <Spinner size="sm" label={t.saving[l]} />
      {t.submit[l]}
    </Button>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex items-center gap-6">
      <Spinner size="sm" label={t.loading[l]} color="accent" />
      <Spinner size="md" label={t.loading[l]} color="accent" />
      <Spinner size="lg" label={t.loading[l]} color="accent" />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "نشانگر مشغولی با نامی که خوانده می‌شود، برای انتظاری با طول نامعلوم: ارسال، بارگذاری یک پنل، دکمه‌ای در جریان.",
        "en-US": "A busy indicator with a spoken name, for a wait of unknown length: sending, loading a panel, a button in flight.",
      },
      whenNot: {
        "fa-IR": "کسری معلوم — `ProgressBar`. محتوایی که شکلش معلوم است — `Skeleton`. نمایی که کلاً خالی است — `EmptyState`.",
        "en-US": "A known fraction — `ProgressBar`. Content whose shape is known — `Skeleton`. A view that is entirely empty — `EmptyState`.",
      },
    },
    tier: "feedback",
    title: { "fa-IR": "چرخنده", "en-US": "Spinner" },
    intro: {
      "fa-IR":
        "نشانگر انتظاری که خودش می‌گوید منتظر چیست. label رشته‌ای اجباری است و همین جزء دلیلش را ثابت می‌کند: چرخنده هیچ متنی ندارد، پس کاربر صفحه‌خوان نه نامی غلط بلکه سکوت می‌شنود در حالی که صفحه انگار یخ زده. پیش‌فرض هم نمی‌شود گذاشت، چون پیش‌فرض انگلیسی می‌شد و انگلیسیِ سپرده‌شده به یک صدای فارسی، آوای بی‌معناست. زیر تنظیم کاهش حرکت، چرخش جای خود را به تپش می‌دهد نه به سکون: حلقهٔ ساکن چیزی نمی‌گوید و شبیه ایراد رندر است.",
      "en-US":
        "A busy indicator that says out loud what is being waited for. label is a required string and this is the component that proves why: a spinner has no text, so a screen-reader user gets not a wrong name but silence while the page appears frozen. It cannot be defaulted either, because the default would be English handed to a Persian voice. Under reduced motion the rotation becomes a PULSE rather than nothing: a static ring says nothing and reads as a rendering fault.",
    },
    composition: [
      `<Spinner label showLabel size color />`,
      `                     ← role="status" wraps a decorative ring and REAL text`,
      `                     ← showLabel off → the text is sr-only, never display:none,`,
      `                        because a hidden live region is not announced at all`,
    ].join("\n"),
    parts: [
      {
        name: "Spinner",
        description: {
          "fa-IR":
            "کل جزء. حلقه aria-hidden است و متن حاملِ خبر؛ نقش status ویژگی aria-live مؤدبانه را در خود دارد، پس جداگانه نوشته نمی‌شود. color سه مقدار دارد و current رنگ متن پیرامون را به ارث می‌برد — همان چیزی که درون یک دکمه لازم است.",
          "en-US":
            "The whole component. The ring is aria-hidden and the text carries the fact; role status already implies a polite live region, so aria-live is not restated. color has three values, and current inherits the surrounding text colour — which is what a spinner inside a button needs.",
        },
      },
    ],
  },
  examples: [
    {
      id: "announced",
      title: { "fa-IR": "سه حلقه، سه جملهٔ متفاوت", "en-US": "Three rings, three different sentences" },
      description: {
        "fa-IR":
          "روی صفحه این سه از هم جدا نیستند و در گوش کاملاً جدا هستند. همین است دلیل اجباری‌بودن label: تفاوت میان «در حال ذخیره» و «در حال بررسی کارت» تنها در رشته‌ای است که هیچ‌کس نمی‌بیند.",
        "en-US":
          "On screen these three are indistinguishable and in the ear they are completely distinct. That is the case for making label required: the difference between \"saving\" and \"checking the card\" lives entirely in a string nobody sees.",
      },
      render: AnnouncedExample,
    },
    {
      id: "visible",
      title: { "fa-IR": "وقتی انتظار طولانی است", "en-US": "When the wait is long" },
      description: {
        "fa-IR":
          "showLabel همان رشته را دیدنی می‌کند و رشتهٔ دومی در کار نیست، پس متن دیده‌شده و متن گفته‌شده نمی‌توانند از هم دور شوند. کاربر بینایی که به حلقه‌ای بی‌توضیح خیره شده، دقیقاً در همان وضعیتی است که کاربر صفحه‌خوانِ بدون label — و متن از قبل نوشته شده است.",
        "en-US":
          "showLabel reveals the same string and there is no second one, so what is drawn and what is spoken cannot drift apart. A sighted user staring at an unexplained ring is in exactly the position of a screen-reader user with no label — and the text has already been written.",
      },
      render: VisibleExample,
    },
    {
      id: "in-a-button",
      title: { "fa-IR": "درون یک دکمه", "en-US": "Inside a button" },
      description: {
        "fa-IR":
          "مقدار color برابر current است، پس حلقه رنگ متن دکمه را به ارث می‌برد و روی هر گونه‌ای درست در می‌آید بدون آنکه فراخوان رنگی انتخاب کند. دکمه غیرفعال است اما برچسبش سر جایش می‌ماند: دکمه‌ای که در حال کار متنش را با یک حلقه عوض کند، نامش را برای مدت انتظار از دست می‌دهد.",
        "en-US":
          "The color is current, so the ring inherits the button's text colour and comes out right on every variant without the caller picking one. The button is disabled but keeps its label: a button that swaps its text for a ring while it works loses its accessible name for the duration of the wait.",
      },
      render: InButtonExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "سه اندازه، یک شکافِ ثابت", "en-US": "Three sizes, one fixed gap" },
      description: {
        "fa-IR":
          "شکاف حلقه لبهٔ آغازِ محور بلوکی است و با یک ویژگی منطقی نوشته شده. محور بلوکی قرینه نمی‌شود، پس حلقه در هر دو خط یکسان است — و این عمدی است: جهت چرخش قراردادی فرهنگی نیست و قرینه‌کردنش تغییری است که هیچ خواننده‌ای از آن سود نمی‌برد.",
        "en-US":
          "The gap in the ring is the block-start edge, written as a logical utility. The block axis does not mirror, so the ring is identical in both scripts — deliberately: rotation direction is not a cultural convention, and mirroring it would be a change with no reader to benefit from it.",
      },
      render: SizesExample,
    },
  ],
};
