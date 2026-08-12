import type { Locale } from "@lumo-ui/core";
import { Scrollspy } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the scrollspy page. Contract: `_system/types.ts`.
 *
 * A SERVER module even though `scrollspy.tsx` is a client component: every prop
 * that crosses is a string or an array of strings, so these prerender — and
 * that is the demonstration, not an implementation note. Every anchor below is
 * a real `href="#id"` in the served bytes, so the contents list navigates before
 * hydration, with JavaScript disabled, and in a printed page. The observer only
 * decides which link is MARKED.
 *
 * ── THESE SECTIONS USE THE PAGE; NESTED ROOTS ARE ALSO SUPPORTED ────────────
 *
 * These examples omit `scrollRootRef`, so `Scrollspy` observes the viewport
 * and its `rootMargin` shrinks the observation band near the top of the page.
 * A dialog or settings pane can instead pass its scrolling element through
 * `scrollRootRef`; bottom detection and observation then use that element, and
 * `onActiveChange` reports the same id that receives `aria-current`.
 *
 * `document.getElementById` is global, so ids are chosen page-wide rather than
 * per example: the first two examples own disjoint sets — `spy-*` and `steps-*`
 * — because two spies fighting over one section would each mark the other's.
 * The third example points at the FIRST one's sections on purpose, to show that
 * the list is just links and does not own the headings it names.
 */

const t = {
  contentsLabel: { "fa-IR": "در این صفحه", "en-US": "On this page" },
  guideLabel: { "fa-IR": "فهرست راهنما", "en-US": "Guide contents" },
  stepsLabel: { "fa-IR": "مراحل ثبت‌نام", "en-US": "Sign-up steps" },

  install: { "fa-IR": "نصب", "en-US": "Install" },
  installBody: {
    "fa-IR":
      "بستهٔ اصلی را با مدیر بستهٔ دلخواه خود اضافه کنید. هیچ پیکربندی اجباری وجود ندارد و پیش‌فرض‌ها برای یک پروژهٔ فارسی درست‌اند.",
    "en-US":
      "Add the core package with whichever package manager you use. There is no mandatory configuration, and the defaults are already right for a Persian project.",
  },
  usage: { "fa-IR": "استفاده", "en-US": "Usage" },
  usageBody: {
    "fa-IR":
      "جزءها را همان‌جا که لازم دارید وارد کنید. هر رشته‌ای که صفحه‌خوان می‌خواند یک ویژگی الزامی است، پس چیزی به‌طور پیش‌فرض انگلیسی نمی‌ماند.",
    "en-US":
      "Import the components where you need them. Every string a screen reader announces is a required prop, so nothing is left English by default.",
  },
  theming: { "fa-IR": "قالب‌بندی", "en-US": "Theming" },
  themingBody: {
    "fa-IR":
      "رنگ‌ها و فاصله‌ها از توکن‌های CSS می‌آیند. برای تغییر یک قالب، توکن را بازنویسی کنید، نه کلاس‌های داخل جزء را.",
    "en-US":
      "Colours and spacing come from CSS tokens. To change a theme, override the token rather than the classes inside a component.",
  },
  faq: { "fa-IR": "پرسش‌های پرتکرار", "en-US": "Frequently asked" },
  faqBody: {
    "fa-IR":
      "بخش پایانی عمداً کوتاه است. یک بخش کوتاه در انتهای سند هرگز به نوارِ دید نمی‌رسد چون صفحه پیش از آن تمام می‌شود — و همان چیزی است که قاعدهٔ جداگانهٔ «انتهای سند» برایش نوشته شده.",
    "en-US":
      "This last section is short on purpose. A short final section never reaches the strip, because the page runs out of scroll first — which is exactly what the separate end-of-document rule exists for.",
  },

  account: { "fa-IR": "ساخت حساب", "en-US": "Create an account" },
  accountBody: {
    "fa-IR": "شمارهٔ موبایل خود را وارد کنید و کد پیامک‌شده را تأیید کنید.",
    "en-US": "Enter your mobile number and confirm the code we text you.",
  },
  identity: { "fa-IR": "احراز هویت", "en-US": "Verify your identity" },
  identityBody: {
    "fa-IR": "کد ملی و تاریخ تولد لازم است. هر دو در قالب فارسی پذیرفته می‌شوند.",
    "en-US": "Your national ID and date of birth are needed. Both are accepted in Persian form.",
  },
  payment: { "fa-IR": "افزودن روش پرداخت", "en-US": "Add a payment method" },
  paymentBody: {
    "fa-IR": "کارت بانکی خود را ثبت کنید تا سفارش‌ها یک‌مرحله‌ای شوند.",
    "en-US": "Register your bank card so orders become one step.",
  },
} satisfies Record<string, LocalizedText>;

const SECTION = "scroll-mt-24 border-t border-border pt-4";

function ContentsExample(l: Locale) {
  const sections = [
    { id: "spy-install", label: t.install[l], body: t.installBody[l] },
    { id: "spy-usage", label: t.usage[l], body: t.usageBody[l] },
    { id: "spy-theming", label: t.theming[l], body: t.themingBody[l] },
    { id: "spy-faq", label: t.faq[l], body: t.faqBody[l] },
  ];
  return (
    <div className="flex w-full flex-col gap-6 sm:flex-row">
      <div className="sm:sticky sm:top-24 sm:h-fit sm:w-44 sm:shrink-0">
        <div className="mb-2 text-xs font-medium text-fg-subtle">{t.contentsLabel[l]}</div>
        <Scrollspy
          label={t.contentsLabel[l]}
          items={sections.map((s) => ({ id: s.id, label: s.label }))}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className={SECTION}>
            <h3 className="text-sm font-medium text-fg">{section.label}</h3>
            <p className="mt-2 text-sm text-fg-muted">{section.body}</p>
            <div className="h-40" />
          </section>
        ))}
      </div>
    </div>
  );
}

function OffsetExample(l: Locale) {
  const sections = [
    { id: "steps-account", label: t.account[l], body: t.accountBody[l] },
    { id: "steps-identity", label: t.identity[l], body: t.identityBody[l] },
    { id: "steps-payment", label: t.payment[l], body: t.paymentBody[l] },
  ];
  return (
    <div className="flex w-full flex-col gap-6 sm:flex-row">
      <div className="sm:sticky sm:top-24 sm:h-fit sm:w-44 sm:shrink-0">
        <div className="mb-2 text-xs font-medium text-fg-subtle">{t.stepsLabel[l]}</div>
        {/*
         * A taller sticky header than the default assumes. Get this wrong and
         * the symptom is a contents list that marks the section ABOVE the one
         * on screen, because the strip is still behind the header.
         */}
        <Scrollspy
          label={t.stepsLabel[l]}
          topOffset="140px"
          items={sections.map((s) => ({ id: s.id, label: s.label }))}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className={SECTION}>
            <h3 className="text-sm font-medium text-fg">{section.label}</h3>
            <p className="mt-2 text-sm text-fg-muted">{section.body}</p>
            <div className="h-40" />
          </section>
        ))}
      </div>
    </div>
  );
}

function LinksOnlyExample(l: Locale) {
  return (
    <Scrollspy
      label={t.guideLabel[l]}
      className="w-full max-w-xs"
      items={[
        { id: "spy-install", label: t.install[l] },
        { id: "spy-usage", label: t.usage[l] },
        { id: "spy-theming", label: t.theming[l] },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "navigation",
    isNew: true,
    title: { "fa-IR": "ردیاب پیمایش", "en-US": "Scrollspy" },
    intro: {
      "fa-IR":
        "فهرست مطالبی که می‌داند خواننده کجاست. هر پیوند یک href واقعی است و بدون جاوااسکریپت هم کار می‌کند؛ ناظر فقط تصمیم می‌گیرد کدام‌یک نشان‌دار شود، و این کار را با aria-current=\"location\" انجام می‌دهد نه با یک کلاس. بخشِ نشان‌دار «بالاترین بخشِ دیده‌شده» است نه «بیشترین بخشِ دیده‌شده» — وگرنه یک بخش کوتاه بین دو بخش بلند هرگز نوبتش نمی‌شود.",
      "en-US":
        "A table of contents that knows where the reader is. Every link is a real href that works with JavaScript disabled; the observer only decides which one is MARKED, and it does that with aria-current=\"location\" rather than a class. The marked section is the TOPMOST visible one, not the most visible one — otherwise a short section between two long ones never gets its turn.",
    },
    composition: [
      `<Scrollspy label items topOffset scrollRootRef onActiveChange />`,
      ``,
      `items      [{ id, label }] — id is the heading's own id, href becomes #id`,
      `label      names the <nav>; a page has several, and unnamed ones are indistinguishable`,
      `topOffset  how far down the viewport the reader's eye line sits`,
      `scrollRootRef  optional nested scroll container; omit for the viewport`,
      `onActiveChange receives the id that carries aria-current="location"`,
    ].join("\n"),
    parts: [
      {
        name: "Scrollspy",
        description: {
          "fa-IR":
            "یک «nav» از پیوندهای واقعی. کلاسِ حالتِ فعال از خودِ ویژگی ARIA می‌آید — aria-current:font-medium — و نه به‌موازات آن، پس حالتِ دیداری نمی‌تواند با حالتِ اعلام‌شده اختلاف پیدا کند.",
          "en-US":
            "A «nav» of real links. The active class follows the ARIA attribute — aria-current:font-medium — rather than sitting beside it, so the visible state cannot disagree with the announced one.",
        },
      },
    ],
  },
  examples: [
    {
      id: "contents",
      title: { "fa-IR": "فهرست صفحه", "en-US": "Page contents" },
      description: {
        "fa-IR":
          "صفحه را بپیمایید و ریلِ کنارِ فهرست را ببینید. ریل با border-s کشیده می‌شود، پس در فارسی لبهٔ راستِ پیوند را می‌گیرد و در انگلیسی لبهٔ چپ را، از یک کلاس. بخش آخر کوتاه است تا قاعدهٔ «انتهای سند» را ببینید: بدون آن، آخرین ورودی هرگز نشان‌دار نمی‌شود.",
        "en-US":
          "Scroll the page and watch the rail beside the contents. It is drawn with border-s, so it takes the link's right edge in Persian and its left in English from one class. The last section is short on purpose so the end-of-document rule is visible: without it, the last entry could never be marked.",
      },
      render: ContentsExample,
    },
    {
      id: "offset",
      title: { "fa-IR": "سرصفحهٔ بلندتر", "en-US": "A taller header" },
      description: {
        "fa-IR":
          "topOffset تعیین می‌کند خطِ دیدِ خواننده چقدر پایین‌تر از بالای پنجره است. پیش‌فرض یک سرصفحهٔ چسبانِ معمولی را رد می‌کند؛ اگر مالِ شما بلندتر است این را بالا ببرید.",
        "en-US":
          "topOffset says how far down the viewport the reader's eye line sits. The default clears a typical sticky header; raise it if yours is taller.",
      },
      render: OffsetExample,
    },
    {
      id: "links-only",
      title: { "fa-IR": "خودِ فهرست", "en-US": "The list on its own" },
      description: {
        "fa-IR":
          "همان جزء، بی‌ آنکه بخش‌هایش کنارش باشند — به بخش‌های مثال اول اشاره می‌کند. این چیزی است که پیش از آمدن جاوااسکریپت سرو می‌شود، و همان‌طور هم پیمایش می‌کند.",
        "en-US":
          "The same component with its sections elsewhere — these point at the first example's. This is what is served before any JavaScript arrives, and it navigates just the same.",
      },
      render: LinksOnlyExample,
    },
  ],
};
