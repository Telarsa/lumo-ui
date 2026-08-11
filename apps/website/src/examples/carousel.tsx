import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the carousel page. Contract: `_system/types.ts`.
 *
 * A SERVER module. `carousel.tsx` carries `"use client"` and calls embla's
 * hook, but every prop this page passes is a string, a plain options object or
 * a variant name — so the examples prerender and the slides' real text is in
 * the served bytes, which is the whole reason a carousel of content can be
 * graded at all.
 *
 * ── THREE DEFECTS UPSTREAM HAS, ALL SILENT, AND ALL VISIBLE HERE ────────────
 *
 *  1. `aria-roledescription="carousel"` and `="slide"`, hardcoded. Two English
 *     strings spoken on every slide of every carousel, invisible to a sighted
 *     reviewer — which is why they survive. `lumo-gate` fails a build over that
 *     attribute, so both are REQUIRED props here.
 *  2. The scroll direction. embla takes `direction: 'ltr' | 'rtl'` and defaults
 *     to `'ltr'`, so a Persian carousel starts at the left and advances
 *     rightward under an RTL layout: the slides and the buttons disagree about
 *     which way «next» is. Lumo derives it from `locale` and there is no `dir`
 *     prop to get wrong.
 *  3. The arrow keys. Upstream maps ArrowLeft to previous. In Persian the
 *     reader's «back» is to the RIGHT — the failure that survives a screenshot
 *     review, because the layout looks perfect and only the keyboard is wrong.
 *
 * The horizontal chevrons are `‹` and `›`, the Unicode `Bidi_Mirrored` pair, so
 * the text engine draws each as the other under RTL with no CSS and nothing for
 * a codemod to miss. The VERTICAL controls use real chevron icons, because up
 * and down are block-axis directions that mirror in no horizontal writing mode.
 */

const t = {
  offers: { "fa-IR": "پیشنهادهای ویژه", "en-US": "Featured offers" },
  carouselWord: { "fa-IR": "چرخ‌فلک", "en-US": "carousel" },
  slideWord: { "fa-IR": "اسلاید", "en-US": "slide" },
  previous: { "fa-IR": "اسلاید قبلی", "en-US": "Previous slide" },
  next: { "fa-IR": "اسلاید بعدی", "en-US": "Next slide" },

  offerOne: { "fa-IR": "قهوهٔ ترکِ آسیاب‌شده", "en-US": "Ground Turkish coffee" },
  offerTwo: { "fa-IR": "چای سیاه لاهیجان", "en-US": "Lahijan black tea" },
  offerThree: { "fa-IR": "زعفران سرگل قائنات", "en-US": "Qaen sargol saffron" },
  offerFour: { "fa-IR": "خرمای مضافتی بم", "en-US": "Bam mazafati dates" },

  keyboardName: { "fa-IR": "گشت‌وگذار با صفحه‌کلید", "en-US": "Keyboard walkthrough" },
  keyOne: {
    "fa-IR": "با کلید تب روی یکی از دو دکمه بایستید.",
    "en-US": "Tab onto either of the two controls.",
  },
  keyTwo: {
    "fa-IR": "کلید جهت را بزنید — نه کلیدی که به جلو اشاره می‌کند، کلیدی که به جلوی خواندنِ شما اشاره می‌کند.",
    "en-US": "Press an arrow key — not the one pointing forward, the one pointing along your reading direction.",
  },
  keyThree: {
    "fa-IR": "همان کلید در انگلیسی و فارسی دو کار متفاوت می‌کند، و این عمدی است.",
    "en-US": "The same key does two different things in English and Persian, deliberately.",
  },

  logos: { "fa-IR": "برندهای همکار", "en-US": "Partner brands" },
  brandWord: { "fa-IR": "برند", "en-US": "brand" },
  wall: { "fa-IR": "دیوار برندها", "en-US": "Brand wall" },

  gallery: { "fa-IR": "گالری عمودی", "en-US": "Vertical gallery" },
  photoWord: { "fa-IR": "عکس", "en-US": "photo" },
  up: { "fa-IR": "عکس بالاتر", "en-US": "Photo above" },
  down: { "fa-IR": "عکس پایین‌تر", "en-US": "Photo below" },
  photo: { "fa-IR": "قاب", "en-US": "Frame" },
} satisfies Record<string, LocalizedText>;

function offerRows(l: Locale): readonly string[] {
  return [t.offerOne[l], t.offerTwo[l], t.offerThree[l], t.offerFour[l]];
}

function BasicExample(l: Locale) {
  return (
    <div className="w-full max-w-sm px-12">
      <Carousel
        locale={l}
        label={t.offers[l]}
        roleDescription={t.carouselWord[l]}
        slideRoleDescription={t.slideWord[l]}
      >
        <CarouselContent>
          {offerRows(l).map((offer) => (
            <CarouselItem key={offer}>
              <div className="flex h-32 items-center justify-center rounded-lg border border-border bg-surface p-4 text-sm font-medium text-fg">
                {offer}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label={t.previous[l]} />
        <CarouselNext label={t.next[l]} />
      </Carousel>
    </div>
  );
}

function KeyboardExample(l: Locale) {
  const steps = [t.keyOne[l], t.keyTwo[l], t.keyThree[l]];
  return (
    <div className="w-full max-w-sm px-12">
      <Carousel
        locale={l}
        label={t.keyboardName[l]}
        roleDescription={t.carouselWord[l]}
        slideRoleDescription={t.slideWord[l]}
      >
        <CarouselContent>
          {steps.map((step, index) => (
            <CarouselItem key={step}>
              <div className="flex h-32 flex-col justify-center gap-2 rounded-lg border border-border bg-surface p-4">
                <span className="text-xs font-medium text-fg-muted">
                  {formatNumber(index + 1, l)}
                </span>
                <span className="text-sm text-fg">{step}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label={t.previous[l]} />
        <CarouselNext label={t.next[l]} />
      </Carousel>
    </div>
  );
}

function MultipleExample(l: Locale) {
  return (
    <div className="w-full max-w-md px-12">
      <Carousel
        locale={l}
        label={t.logos[l]}
        roleDescription={t.wall[l]}
        slideRoleDescription={t.brandWord[l]}
        opts={{ align: "start", slidesToScroll: 2 }}
      >
        <CarouselContent>
          {offerRows(l).map((offer) => (
            <CarouselItem key={offer} className="basis-1/2">
              <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-surface-sunken p-3 text-xs text-fg-muted">
                {offer}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label={t.previous[l]} />
        <CarouselNext label={t.next[l]} />
      </Carousel>
    </div>
  );
}

function VerticalExample(l: Locale) {
  return (
    <div className="w-full max-w-sm py-12">
      <Carousel
        locale={l}
        orientation="vertical"
        label={t.gallery[l]}
        roleDescription={t.carouselWord[l]}
        slideRoleDescription={t.photoWord[l]}
      >
        <CarouselContent className="h-40">
          {offerRows(l).map((offer, index) => (
            <CarouselItem key={offer} className="basis-1/2">
              <div className="flex h-full items-center gap-3 rounded-lg border border-border bg-surface p-3 text-sm text-fg">
                <span className="text-xs text-fg-muted">
                  {t.photo[l]} {formatNumber(index + 1, l)}
                </span>
                <span className="min-w-0 truncate">{offer}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label={t.up[l]} />
        <CarouselNext label={t.down[l]} />
      </Carousel>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "display",
    title: { "fa-IR": "چرخ‌فلک", "en-US": "Carousel" },
    intro: {
      "fa-IR":
        "نواری از اسلایدها روی embla. سه چیزی که نسخهٔ بالادست در فارسی خراب می‌کند هر سه بی‌صدا هستند: دو رشتهٔ انگلیسیِ سفت‌شده در aria-roledescription که روی هر اسلاید خوانده می‌شوند، جهتِ پیمایش که embla پیش‌فرض چپ‌به‌راست می‌گیرد، و نگاشتِ کلیدهای جهت که «عقب» را به چپ می‌بندد. اینجا دو رشته ویژگیِ اجباری‌اند و دو مورد دیگر از locale مشتق می‌شوند، پس هیچ ویژگیِ dir ای نیست که با سند اختلاف پیدا کند.",
      "en-US":
        "A strip of slides over embla. The three things the upstream version gets wrong in Persian are all silent: two hardcoded English strings in `aria-roledescription`, spoken on every slide; the scroll direction, which embla defaults to left-to-right; and the arrow-key mapping, which binds «back» to the left. Here the two strings are REQUIRED props and the other two are derived from `locale`, so there is no `dir` prop that can disagree with the document.",
    },
    composition: [
      `<Carousel locale label roleDescription slideRoleDescription`,
      `          orientation opts plugins setApi>`,
      `  <CarouselContent>`,
      `    <CarouselItem>…</CarouselItem>       ← gets its roledescription from context`,
      `  </CarouselContent>`,
      `  <CarouselPrevious label="…" />         ← sits at the reading START`,
      `  <CarouselNext label="…" />`,
      `</Carousel>`,
    ].join("\n"),
    parts: [
      {
        name: "Carousel",
        description: {
          "fa-IR":
            "ناحیهٔ نام‌دار، و جایی که هر چهار رشتهٔ اجباری زندگی می‌کنند. slideRoleDescription روی خودِ چرخ‌فلک است و نه روی هر اسلاید، چون ویژگی‌ای که در هر مورد تکرار شود همان است که روی موردِ هفتم فراموش می‌شود. جهتِ embla و نگاشتِ کلیدهای جهت هر دو از locale مشتق می‌شوند، در یک تابع، پس نمی‌توانند اختلاف پیدا کنند.",
          "en-US":
            "The named region, and where all four required strings live. `slideRoleDescription` sits on the carousel rather than on each item, because a per-item prop is the prop somebody forgets on item seven. embla's direction and the arrow-key mapping are both derived from `locale`, in one function, so they cannot disagree.",
        },
      },
      {
        name: "CarouselContent",
        description: {
          "fa-IR":
            "ریلِ اسلایدها. حاشیهٔ منفی‌اش که فاصلهٔ هر مورد را خنثی می‌کند روی محور درون‌خطی منطقی است، پس در همان لبه‌ای می‌نشیند که بالشتکِ موردها نشسته‌اند؛ املای فیزیکی‌اش در راست‌به‌چپ فاصله را یک طرف دوبرابر و طرف دیگر را می‌بُرید.",
          "en-US":
            "The slide rail. Its negative margin — the one that cancels the per-item gutter — is inline-axis logical, so it lands on the same edge as the items' own padding; the physical spelling would double the gap on one side under RTL and clip the other.",
        },
      },
      {
        name: "CarouselItem",
        description: {
          "fa-IR":
            "یک اسلاید، یک گروهِ نام‌بردهٔ نقش. عرضش با basis تعیین می‌شود، پس نمایشِ چندتایی یک کلاس است و نه یک ویژگیِ جداگانه.",
          "en-US":
            "One slide, and one role-described group. Its width comes from a `basis` class, so showing several at a time is a class rather than a separate prop.",
        },
      },
      {
        name: "CarouselPrevious",
        description: {
          "fa-IR":
            "دکمهٔ «قبلی»، که با inset-inline در لبهٔ آغازِ خواندن می‌نشیند — چپ در انگلیسی، راست در فارسی — یعنی همان سمتی که embla پس از تنظیمِ جهت واقعاً به آن برمی‌گردد. املای فیزیکیِ بالادست دکمهٔ عقب را در فارسی همان‌جایی می‌گذارد که چرخ‌فلک به سویش می‌رود.",
          "en-US":
            "The «previous» control, placed at the reading START with `inset-inline` — left in English, RIGHT in Persian — which is the side embla actually moves toward once its direction is set. Upstream's physical spelling puts the back button where the carousel is heading.",
        },
      },
      {
        name: "CarouselNext",
        description: {
          "fa-IR":
            "دکمهٔ «بعدی». در حالت افقی نگاره‌اش یکی از جفتِ آینه‌شوندهٔ یونیکد است، پس سرِ پیکان با جهتِ خط برمی‌گردد بدون هیچ کلاسی؛ در حالت عمودی یک نگارهٔ واقعیِ رو به پایین است، چون بالا و پایین آینه نمی‌شوند و چرخاندنِ یک نگارهٔ آینه‌شونده محورِ اشتباه را برمی‌گرداند.",
          "en-US":
            "The «next» control. In the horizontal case its glyph is one of Unicode's mirrored pair, so the arrowhead flips with the resolved direction and needs no class; in the vertical case it is a real down-pointing icon, because up and down do not mirror and rotating a mirrored glyph would flip the wrong axis.",
        },
      },
    ],
  },
  examples: [
    {
      id: "offers",
      title: { "fa-IR": "چهار رشته که پیش‌فرض ندارند", "en-US": "Four strings with no defaults" },
      description: {
        "fa-IR":
          "label ناحیه را نام می‌دهد و roleDescription می‌گوید این ناحیه چیست — و بی هر دو، صفحه‌خوان روی هر اسلاید واژهٔ انگلیسیِ carousel را می‌خواند. متنِ اسلایدها در بایت اول هست، پس این نوار مثل هر بندِ دیگری از صفحه ارزیابی می‌شود.",
        "en-US":
          "`label` names the region and `roleDescription` says what the region IS — without both, a screen reader reads the English word «carousel» on every slide. The slides' text is in the first byte, so this strip is graded like any other prose on the page.",
      },
      render: BasicExample,
    },
    {
      id: "keyboard",
      title: { "fa-IR": "کلیدی که در دو زبان دو کار می‌کند", "en-US": "The key that does two different things" },
      description: {
        "fa-IR":
          "با کلید تب روی دکمه‌ها بایستید و کلیدهای جهت را بزنید. روی مسیر فارسی کلید چپ جلو می‌بَرد و کلید راست عقب، چون «جلو» برای خواننده به چپ است؛ روی مسیر انگلیسی برعکس. نگاشت از direction(locale) حل می‌شود و نه نوشته، و این تنها نقصِ این جزء است که هیچ نماگرفتی نشانش نمی‌دهد.",
        "en-US":
          "Tab onto the controls and press the arrow keys. On the Persian route ArrowLeft ADVANCES and ArrowRight goes back, because the reader's «forward» is leftward; on the English route it is the other way. The mapping is resolved from `direction(locale)` rather than written down, and it is the one defect here no screenshot shows.",
      },
      render: KeyboardExample,
    },
    {
      id: "multiple",
      title: { "fa-IR": "چند اسلاید در یک قاب", "en-US": "Several slides in one frame" },
      description: {
        "fa-IR":
          "opts مستقیم به embla می‌رسد: هم‌ترازی از آغاز و دو اسلاید در هر گام. عرضِ هر مورد یک کلاسِ basis است و نه یک ویژگی، پس یک دیوارِ برند و یک بنرِ تمام‌عرض یک جزء‌اند با یک کلاسِ متفاوت. هم‌ترازیِ «آغاز» هم با جهتِ مشتق‌شده هم‌سو می‌ماند و نیازی به معادلِ راست‌به‌چپ ندارد.",
        "en-US":
          "`opts` reaches embla directly: align from the start, two slides per step. Each item's width is a `basis` class rather than a prop, so a brand wall and a full-width banner are one component with one class between them. `align: \"start\"` also stays aligned with the derived direction and needs no right-to-left counterpart.",
      },
      render: MultipleExample,
    },
    {
      id: "vertical",
      title: { "fa-IR": "محوری که آینه نمی‌شود", "en-US": "The axis that does not mirror" },
      description: {
        "fa-IR":
          "با orientation=\"vertical\" همه‌چیز به محور بلوکی می‌رود: دکمه‌ها بالا و پایین می‌نشینند و نگاره‌هایشان چِوِرونِ واقعی‌اند و نه جفتِ آینه‌شوندهٔ یونیکد. نامشان هم عوض می‌شود — «عکس بالاتر» و «عکس پایین‌تر» — چون «قبلی» و «بعدی» روی محوری که با خط برنمی‌گردد چیزی نمی‌گویند.",
        "en-US":
          "`orientation=\"vertical\"` moves everything to the block axis: the controls sit above and below and their glyphs are real chevrons rather than Unicode's mirrored pair. Their NAMES change too — «Photo above» and «Photo below» — because «previous» and «next» say nothing on an axis that does not flip with the script.",
      },
      render: VerticalExample,
    },
  ],
};
