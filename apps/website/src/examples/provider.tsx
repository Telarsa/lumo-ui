import type { Locale } from "@lumo-ui/core";
import {
  DateField,
  LumoProvider,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TimeField,
} from "@lumo-ui/ui";
import { DatePickerIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the provider page. Contract: `_system/types.ts`.
 *
 * A SERVER module. `provider.tsx` carries `"use client"`, but its only props
 * are a locale string and children, so a server component renders it and every
 * example below prerenders whole — which is the point that makes this page
 * worth existing: the locale context is READ DURING RENDER, so a provider's
 * effect is in the first byte rather than after hydration. That is exactly the
 * distinction `core/src/strings.ts` measured against React Aria's own string
 * provider, which renders no children and only sets a global on `window`.
 *
 * ═══ ONE PROP IN, THREE CONTEXTS OUT ════════════════════════════════════════
 *
 *     locale ──┬─► the Base UI half's locale and its strings
 *              ├─► the React Aria half's formatters
 *              └─► the direction, as direction(locale)
 *
 * **There is no `direction` prop and there will not be one.** Base UI's own
 * direction provider takes one, defaulting to `ltr`, and its per-component
 * `locale` props are unrelated values with nothing tying them together — so the
 * failure when they disagree is Persian digits sliding the wrong way with
 * nothing red anywhere. `direction(locale)` makes that unrepresentable: passing
 * a wrong direction is not discouraged here, it does not compile.
 *
 * `direction()` asks `Intl.Locale.getTextInfo()` where available and otherwise
 * reads an exhaustive `Record<Locale, Direction>`, so adding a locale cannot
 * forget to add its direction.
 *
 * ═══ AND WHY IT IS A COMPONENT WITH A REQUIRED PROP ═════════════════════════
 *
 * …rather than a line of documentation. React Aria resolves its locale from
 * `navigator.language`, falling back to `'en-US'` — and during a server render
 * there is no `navigator` at all. Measured on a slider at value forty:
 *
 *     without a provider   left: 40%      ← measured from the wrong edge
 *     with fa-IR           left: 60%
 *
 * `lumo-gate` grades attributes and text; that is inline GEOMETRY, individually
 * valid. It renders, it type-checks, and it looks plausible in a screenshot.
 *
 * ═══ THE EXAMPLE THIS PAGE CANNOT HAVE, AND WHY THAT IS A RESULT ════════════
 *
 * The obvious demonstration is a NESTED provider carrying the OTHER language —
 * a locale switcher previewing the other direction inside a page, which is a
 * real thing this site does. It cannot be prerendered here, and the reason is
 * the gate doing its job: a nested `en-US` provider on the Persian route serves
 * `aria-label="month"`, `aria-label="day"`, `aria-label="year"` into a
 * `fa-IR` document, and `no-latin-aria` fails the build over exactly that. The
 * strings are CORRECT for the nested provider and wrong for the page they are
 * served into, and the gate cannot tell those apart — nor should it, because
 * that is indistinguishable from the defect it exists to catch.
 *
 * So this page demonstrates what one provider REACHES rather than what two
 * providers differ by. The nesting contract is still worth stating: the
 * direction provider is INNERMOST, so a nested `LumoProvider` overrides
 * direction and locale TOGETHER. Nesting direction outside locale would let an
 * inner provider change one and inherit the other, which is the disagreement
 * the file exists to prevent.
 */

const t = {
  departure: { "fa-IR": "تاریخ حرکت", "en-US": "Departure date" },
  departureHelp: {
    "fa-IR": "خانه‌های خالی نام بخش‌ها را در زبان همین فراهم‌کننده نشان می‌دهند.",
    "en-US": "The empty slots name their segments in this provider's own language.",
  },
  boarding: { "fa-IR": "ساعت سوارشدن", "en-US": "Boarding time" },
  boardingHelp: {
    "fa-IR": "دوازده‌ساعته یا بیست‌وچهارساعته بودنِ ساعت هم از همان یک ویژگی می‌آید.",
    "en-US": "Whether the clock is twelve-hour or twenty-four-hour comes from the same one prop.",
  },

  issued: { "fa-IR": "تاریخ صدور", "en-US": "Issue date" },
  openCalendar: { "fa-IR": "باز کردن تقویم", "en-US": "Open the calendar" },
  issuedHelp: {
    "fa-IR": "بخش‌های این فیلد و تقویمِ درونِ پنل، هر دو از یک بافت می‌خوانند.",
    "en-US": "This field's segments and the calendar inside the panel both read one context.",
  },

  report: { "fa-IR": "گزارش فروش", "en-US": "Sales report" },
  overview: { "fa-IR": "نمای کلی", "en-US": "Overview" },
  byCity: { "fa-IR": "بر پایهٔ شهر", "en-US": "By city" },
  byProduct: { "fa-IR": "بر پایهٔ کالا", "en-US": "By product" },
  overviewBody: {
    "fa-IR": "با کلیدهای جهت میان زبانه‌ها بروید و ببینید کدام کلید جلو می‌بَرد.",
    "en-US": "Arrow between the tabs and see which key moves forward.",
  },
  byCityBody: {
    "fa-IR": "نگاشت این کلیدها هیچ ویژگی‌ای ندارد؛ از زبانِ فراهم‌کننده می‌آید.",
    "en-US": "That mapping has no prop; it comes from the provider's language.",
  },
  byProductBody: {
    "fa-IR": "هیچ‌کدام از این سه زبانه چیزی دربارهٔ جهت نمی‌داند.",
    "en-US": "None of these three tabs knows anything about direction.",
  },

  nestedNote: {
    "fa-IR":
      "فراهم‌کننده‌ها تودرتو می‌شوند و درونی‌ترین برنده است — و زبان و جهت همیشه با هم جابه‌جا می‌شوند و نه یکی‌یکی.",
    "en-US":
      "Providers nest and the innermost wins — and the language and the direction always move together rather than one at a time.",
  },
  nestedLabel: { "fa-IR": "تاریخ درونِ فراهم‌کنندهٔ تودرتو", "en-US": "A date inside the nested provider" },
} satisfies Record<string, LocalizedText>;

function MountExample(l: Locale) {
  return (
    <LumoProvider locale={l}>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <DateField label={t.departure[l]} description={t.departureHelp[l]} />
        <TimeField label={t.boarding[l]} description={t.boardingHelp[l]} />
      </div>
    </LumoProvider>
  );
}

function PickerExample(l: Locale) {
  return (
    <LumoProvider locale={l}>
      <DatePickerIsland
        label={t.issued[l]}
        openCalendarLabel={t.openCalendar[l]}
        description={t.issuedHelp[l]}
      />
    </LumoProvider>
  );
}

function KeyboardExample(l: Locale) {
  return (
    <LumoProvider locale={l}>
      <Tabs className="w-full max-w-md" defaultSelectedKey="overview">
        <TabList label={t.report[l]}>
          <Tab id="overview">{t.overview[l]}</Tab>
          <Tab id="city">{t.byCity[l]}</Tab>
          <Tab id="product">{t.byProduct[l]}</Tab>
        </TabList>
        <TabPanel id="overview">{t.overviewBody[l]}</TabPanel>
        <TabPanel id="city">{t.byCityBody[l]}</TabPanel>
        <TabPanel id="product">{t.byProductBody[l]}</TabPanel>
      </Tabs>
    </LumoProvider>
  );
}

function NestedExample(l: Locale) {
  return (
    <LumoProvider locale={l}>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <p className="text-xs text-fg-muted">{t.nestedNote[l]}</p>
        <LumoProvider locale={l}>
          <DateField label={t.nestedLabel[l]} />
        </LumoProvider>
      </div>
    </LumoProvider>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک بار در ریشهٔ هر برنامهٔ لومو، با زبان — هیچ جزئی بی‌آن درست رندر نمی‌شود.",
        "en-US": "Once at the root of every Lumo application, with the locale — nothing renders correctly without it.",
      },
      whenNot: {
        "fa-IR": "نه برای یک جزء یا جزیرهٔ تنها — برنامه را یک بار بپیچید. ناحیه‌ای به زبان دیگر یک `LumoProvider` دوم تو در تو می‌گیرد؛ ویژگی جهت وجود ندارد که به‌سراغش بروید.",
        "en-US": "Not for a single component or island — wrap the application once. A region in the other locale nests a second `LumoProvider`; there is no direction prop to reach for.",
      },
    },
    tier: "layout",
    title: { "fa-IR": "فراهم‌کنندهٔ لومو", "en-US": "Lumo provider" },
    intro: {
      "fa-IR":
        "یک بار، بالای هر برنامهٔ لومو، و اختیاری نیست. یک ویژگی می‌گیرد — locale — و سه بافت بیرون می‌دهد: زبانِ نیمهٔ بیس‌یو‌آی و رشته‌هایش، قالب‌بندهای نیمهٔ موتور، و جهت. ویژگیِ direction ندارد و نخواهد داشت: جهت از خودِ زبان مشتق می‌شود، پس دو اهرمی که بتوانند با هم اختلاف پیدا کنند وجود ندارد. بافت هنگام رندر خوانده می‌شود، پس اثرش در بایت اول هست و نه پس از هیدراسیون — و همین است که این صفحه را قابلِ ارزیابی می‌کند.",
      "en-US":
        "Mounted once, high in every Lumo application, and not optional. It takes ONE prop — `locale` — and publishes three contexts: the Base UI half's locale and strings, the React Aria half's formatters, and the direction. It has no `direction` prop and will not get one: direction is derived from the language, so there are not two levers that can disagree. The context is read DURING render, so its effect is in the first byte rather than after hydration — which is what makes this page gradable at all.",
    },
    composition: [
      `<LumoProvider locale={locale}>     ← the ONLY prop. No direction sibling.`,
      `  <DateField … />                  ← reads the locale from context`,
      `  <TimeField … />`,
      `  <DatePicker … />`,
      `  <Tabs>…</Tabs>                   ← reads the DIRECTION from the same context`,
      `</LumoProvider>`,
      ``,
      `Nesting is legal and the innermost wins — locale and direction together.`,
    ].join("\n"),
    parts: [
      {
        name: "LumoProvider",
        description: {
          "fa-IR":
            "کلِ جزء. سه فراهم‌کننده را در ترتیبی می‌چیند که تودرتویی را درست نگه می‌دارد: جهت درونی‌ترین است، پس یک فراهم‌کنندهٔ تودرتو زبان و جهت را با هم بازنویسی می‌کند. اگر جهت بیرون‌تر از زبان بود، یک فراهم‌کنندهٔ درونی می‌توانست یکی را عوض کند و دیگری را به ارث ببرد — یعنی همان اختلافی که این پرونده برای جلوگیری از آن هست.",
          "en-US":
            "The whole component. It nests three providers in the order that keeps nesting correct: direction is INNERMOST, so a nested provider overrides language and direction together. With direction outside language, an inner provider could change one and inherit the other — which is the disagreement this file exists to prevent.",
        },
      },
      {
        name: "DateField",
        description: {
          "fa-IR":
            "یکی از اجزایی که ویژگیِ locale ندارند و زبان را از همین بافت می‌خوانند. سیستمِ تقویم را هم از همان‌جا می‌گیرد، پس یک فیلدِ خالی روی مسیر فارسی پیش از هر مقداری جلالی است — حالتی که یک پیش‌فرضِ میلادی ششصد و بیست‌ویک سال بی‌صدا اشتباه می‌کند.",
          "en-US":
            "One of the components that have no `locale` prop and read the language from this context. It takes the calendar SYSTEM from there too, so an empty field on the Persian route is already Jalali before any value exists — the case a Gregorian default gets wrong invisibly, by 621 years.",
        },
      },
      {
        name: "TimeField",
        description: {
          "fa-IR":
            "همان‌طور: چرخهٔ ساعت و واژه‌های دورهٔ روز از Intl برای همان زبان خوانده می‌شوند و نه از جدولی در کتابخانه — که همان چیزی است که تایپِ حرف در بخشِ دوره را بدون شناختنِ الفبا ممکن می‌کند.",
          "en-US":
            "The same way: the hour cycle and the day-period words are read out of `Intl` for that language rather than from a table in the library — which is what makes typing a LETTER into the period segment work without the library knowing an alphabet.",
        },
      },
      {
        name: "DatePicker",
        description: {
          "fa-IR":
            "جزئی که یک ورودیِ بخش‌بخش را در خود دارد، پس هم بخش‌ها و هم تقویمِ درونِ پنل از یک بافت می‌خوانند. دو خواندنِ جدا از یک واقعیت همان است که به اختلاف می‌رسد؛ اینجا خواندن یکی است.",
          "en-US":
            "A component that CONTAINS a segmented input, so the segments and the calendar inside its panel read one context. Two separate reads of one fact is how they come to disagree; here there is one read.",
        },
      },
      {
        name: "Tabs",
        description: {
          "fa-IR":
            "چیزی که فراهم‌کنندهٔ جهت واقعاً برایش خریده شده. بیس‌یو‌آی آن را برای هندسهٔ صفحه‌کلید می‌خواند — نگاشتِ کلیدهای جهت در منو، انتخابگر، زبانه‌ها و لغزنده، و حلِ ضلع و هم‌ترازی در جای‌گیرنده. روی هیچ عنصری dir نمی‌نویسد و به سی‌اس‌اس کاری ندارد؛ آن کارِ سندِ ریشه است و از همان زبان مشتق می‌شود.",
          "en-US":
            "What the direction provider is actually bought for. Base UI reads it for KEYBOARD geometry — the arrow-key mapping in the menu, the select, the tabs and the slider, and the side/align resolution in the positioner. It writes `dir` on no element and does not affect CSS; that is the root document's job, derived from the same language.",
        },
      },
    ],
  },
  examples: [
    {
      id: "mount",
      title: { "fa-IR": "یک ویژگی، دو فیلد", "en-US": "One prop, two fields" },
      description: {
        "fa-IR":
          "هیچ‌کدام از این دو فیلد ویژگیِ زبان نمی‌گیرند. تقویم، ارقام، نام بخش‌ها، چرخهٔ ساعت و جهتِ کلیدهای جهت همه از همین یک ویژگی می‌آیند — و چون بافت هنگام رندر خوانده می‌شود، همه‌شان در بایت اول حاضرند. برداشتنِ فراهم‌کننده هیچ خطایی نمی‌سازد؛ فقط موتور به زبانِ مرورگر می‌افتد، که روی سرور اصلاً وجود ندارد و به انگلیسی برمی‌گردد.",
        "en-US":
          "Neither field takes a language prop. The calendar, the digits, the segment names, the hour cycle and the arrow-key direction all come from that one prop — and because the context is read during render, all of them are in the first byte. Removing the provider raises no error; React Aria simply falls back to the browser's language, which does not exist on a server at all and resolves to English.",
      },
      render: MountExample,
    },
    {
      id: "picker",
      title: { "fa-IR": "یک بافت، دو سطحِ تاریخ", "en-US": "One context, two date surfaces" },
      description: {
        "fa-IR":
          "بخش‌های این فیلد و تقویمی که پشت دکمهٔ کنارش باز می‌شود هر دو از همین یک فراهم‌کننده می‌خوانند. تقویم در بایت اول نیست — پنلِ بسته null است — ولی وقتی باز شود ماهِ جلالی می‌آورد بی‌آنکه چیزی به آن گفته شود. همین است دلیلِ اینکه ورودیِ بخش‌بخش باید پیش از هر جزئی که در خود داردش یک قطعهٔ مستقل می‌شد.",
        "en-US":
          "This field's segments and the calendar that opens behind the button beside it both read this one provider. The calendar is not in the first byte — a closed panel is `null` — but when it opens it brings Jalali months with nothing told to it. That is why the segmented input had to become a part before anything containing one could move.",
      },
      render: PickerExample,
    },
    {
      id: "keyboard",
      title: { "fa-IR": "جهتی که هیچ ویژگی‌ای ندارد", "en-US": "A direction with no prop" },
      description: {
        "fa-IR":
          "با کلید تب روی نوارِ زبانه‌ها بایستید و کلیدهای جهت را بزنید: روی مسیر فارسی کلید چپ به زبانهٔ بعدی می‌رود و روی مسیر انگلیسی به قبلی. این نگاشت را موتور از فراهم‌کنندهٔ جهت می‌خواند، که پیش‌فرضش چپ‌به‌راست است و بدون این جزء روی هر صفحهٔ فارسی همان می‌ماند. هیچ‌چیزی در بایت‌های سرو‌شده این را لو نمی‌دهد؛ رفتارِ صفحه‌کلید است.",
        "en-US":
          "Tab onto the tab strip and press the arrow keys: on the Persian route ArrowLeft moves to the NEXT tab and on the English route to the previous one. The engine reads that mapping from the direction provider, whose own default is left-to-right and would stay that way on every Persian page without this component. Nothing in the served bytes gives it away; it is a keyboard behaviour.",
      },
      render: KeyboardExample,
    },
    {
      id: "nested",
      title: { "fa-IR": "تودرتویی، و نمونه‌ای که این صفحه نمی‌تواند داشته باشد", "en-US": "Nesting, and the example this page cannot have" },
      description: {
        "fa-IR":
          "فراهم‌کننده‌ها تودرتو می‌شوند و درونی‌ترین برنده است؛ جهت درونی‌ترین لایه است تا زبان و جهت هرگز جدا جابه‌جا نشوند. نمونهٔ بدیهی — یک فراهم‌کنندهٔ تودرتو با زبانِ دیگر، یعنی همان تعویض‌کنندهٔ زبانی که این سایت دارد — اینجا از پیش رندر نمی‌شود، و دلیلش دروازه است که کارش را می‌کند: چنین چیزی روی مسیر فارسی نام‌های انگلیسیِ بخش‌ها را در سندی فارسی سرو می‌کند و قاعدهٔ no-latin-aria ساخت را می‌شکند. آن رشته‌ها برای فراهم‌کنندهٔ درونی درست‌اند و برای صفحه‌ای که در آن سرو می‌شوند غلط، و دروازه نمی‌تواند این دو را از هم جدا کند — و نباید بتواند.",
        "en-US":
          "Providers nest and the innermost wins; direction is the innermost layer so language and direction never move apart. The obvious example — a nested provider carrying the OTHER language, which is the locale switcher this site itself has — cannot be prerendered here, and the reason is the gate doing its job: on the Persian route it serves English segment names into a Persian document and `no-latin-aria` fails the build. Those strings are correct for the inner provider and wrong for the page they land in, and the gate cannot tell the two apart — nor should it.",
      },
      render: NestedExample,
    },
  ],
};
