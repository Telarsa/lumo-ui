import type { Locale } from "@lumo-ui/core";
import { LayoutGrid, List, Rows3 } from "lucide-react";
import { SegmentedControl, SegmentedControlItem } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the segmented-control page. Contract: `_system/types.ts`
 * — each render is a named top-level function so the loader can slice its
 * source.
 *
 * A server module: every prop below is a string, so the `role="radiogroup"`,
 * every `role="radio"`, every `aria-checked` and the pre-hydration tab stop are
 * all in the served bytes.
 *
 * ── THE PRIMITIVE UNDERNEATH THIS COMPONENT IS THE WHOLE ARGUMENT ───────────
 *
 * The obvious port for a segmented control is the engine's toggle group, and it
 * is the WRONG one. Measured, bare libraries, no Lumo code:
 *
 *     toggle group   <div role="group"><button aria-pressed="true">…
 *     radio group    <div role="radiogroup"><span role="radio" aria-checked="true">…
 *
 * The toggle group hardcodes its role with no prop to change it, and its
 * children carry `aria-pressed`. N `aria-pressed` buttons announce as N
 * independent switches, with nothing telling a listener that choosing one
 * UN-chooses the others — which is the entire accessibility argument for this
 * component. So it sits on the radio group instead, and `toggle-group.tsx`
 * records the same measurement from the other side. Two components that shared
 * one primitive now sit on two; that split is a finding, not a refactor.
 */

const t = {
  resultView: { "fa-IR": "نمای نتایج", "en-US": "Results view" },
  listView: { "fa-IR": "فهرست", "en-US": "List" },
  gridView: { "fa-IR": "شبکه", "en-US": "Grid" },
  boardView: { "fa-IR": "تخته", "en-US": "Board" },

  layout: { "fa-IR": "چیدمان صفحه", "en-US": "Page layout" },

  period: { "fa-IR": "بازهٔ گزارش", "en-US": "Report period" },
  week: { "fa-IR": "هفته", "en-US": "Week" },
  month: { "fa-IR": "ماه", "en-US": "Month" },
  year: { "fa-IR": "سال", "en-US": "Year" },

  export: { "fa-IR": "قالب خروجی", "en-US": "Export format" },
  sheet: { "fa-IR": "صفحه‌گسترده", "en-US": "Spreadsheet" },
  pdf: { "fa-IR": "سند چاپی", "en-US": "Printable document" },
  archive: { "fa-IR": "بایگانی فشرده", "en-US": "Compressed archive" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <SegmentedControl label={t.resultView[l]} defaultSelectedKeys={["grid"]}>
      <SegmentedControlItem id="list">{t.listView[l]}</SegmentedControlItem>
      <SegmentedControlItem id="grid">{t.gridView[l]}</SegmentedControlItem>
      <SegmentedControlItem id="board">{t.boardView[l]}</SegmentedControlItem>
    </SegmentedControl>
  );
}

function IconsExample(l: Locale) {
  return (
    <SegmentedControl label={t.layout[l]} defaultSelectedKeys={["rows"]}>
      <SegmentedControlItem id="rows" aria-label={t.listView[l]}>
        <List aria-hidden="true" />
      </SegmentedControlItem>
      <SegmentedControlItem id="cards" aria-label={t.gridView[l]}>
        <LayoutGrid aria-hidden="true" />
      </SegmentedControlItem>
      <SegmentedControlItem id="stack" aria-label={t.boardView[l]}>
        <Rows3 aria-hidden="true" />
      </SegmentedControlItem>
    </SegmentedControl>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl label={t.period[l]} defaultSelectedKeys={["month"]}>
        <SegmentedControlItem id="week" size="sm">
          {t.week[l]}
        </SegmentedControlItem>
        <SegmentedControlItem id="month" size="sm">
          {t.month[l]}
        </SegmentedControlItem>
        <SegmentedControlItem id="year" size="sm">
          {t.year[l]}
        </SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl label={t.period[l]} defaultSelectedKeys={["month"]}>
        <SegmentedControlItem id="week">{t.week[l]}</SegmentedControlItem>
        <SegmentedControlItem id="month">{t.month[l]}</SegmentedControlItem>
        <SegmentedControlItem id="year">{t.year[l]}</SegmentedControlItem>
      </SegmentedControl>
    </div>
  );
}

function DisabledOptionExample(l: Locale) {
  return (
    <SegmentedControl label={t.export[l]} defaultSelectedKeys={["sheet"]}>
      <SegmentedControlItem id="sheet">{t.sheet[l]}</SegmentedControlItem>
      <SegmentedControlItem id="pdf">{t.pdf[l]}</SegmentedControlItem>
      <SegmentedControlItem id="zip" isDisabled>
        {t.archive[l]}
      </SegmentedControlItem>
    </SegmentedControl>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "دو تا چهار نمای ناسازگار از یک چیز، همه دیدنی و همیشه یکی برگزیده: فهرست/شبکه، روز/هفته/ماه.",
        "en-US": "Two to four mutually exclusive views of one thing, all visible, one always selected: list/grid, day/week/month.",
      },
      whenNot: {
        "fa-IR": "گزینه‌ای که می‌تواند هیچ‌کدام باشد — `RadioGroup`. چند دکمهٔ مستقل روشن/خاموش — `ToggleButtonGroup`. پنل‌های محتوا با نشانی خودشان یا گزینه‌های زیاد — `Tabs`.",
        "en-US": "An option that can be none — `RadioGroup`. Several independent on/off buttons — `ToggleButtonGroup`. Content panels with their own URLs or many options — `Tabs`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "کنترل بخش‌بندی‌شده", "en-US": "Segmented control" },
    intro: {
      "fa-IR":
        "دو تا چهار گزینهٔ ناسازگار برای یک چیز، همه هم‌زمان دیده می‌شوند. حالتِ «هیچ‌کدام» برای یک تعویض‌کنندهٔ نما وجود ندارد، و روی این موتور دیگر یک ویژگی هم نیست: گروه رادیویی هیچ راهی به انتخابِ خالی ندارد، پس فشردنِ گزینهٔ انتخاب‌شده دوباره همان را انتخاب می‌کند. گِردیِ گوشه‌ها هم به ظرف سپرده شده نه به اولین و آخرین فرزند — «اولین» در فارسی سمت راست است، و قاعدهٔ رایجِ گِردکردنِ دو گوشهٔ چپ و راست آنجا دو گوشهٔ اشتباه را گِرد می‌کند.",
      "en-US":
        "Two to four mutually exclusive options for one thing, all visible at once. «None of these» is not a state a view switcher has, and on this engine it is no longer even a prop: the radio group has no path to an empty selection, so pressing the checked option re-checks it. The corner radius belongs to the CONTAINER rather than to the first and last child — «first» is the right-hand one in Persian, and the usual rule rounds the wrong two corners there.",
    },
    composition: [
      `<SegmentedControl`,
      `  label                      ← REQUIRED: neither engine names the radiogroup`,
      `  defaultSelectedKeys        ← a one-element iterable`,
      `  selectedKeys onSelectionChange isDisabled name>`,
      ``,
      `  <SegmentedControlItem id size isDisabled aria-label>…</SegmentedControlItem>`,
      `</SegmentedControl>`,
    ].join("\n"),
    parts: [
      {
        name: "SegmentedControl",
        description: {
          "fa-IR":
            "خودِ گروه، که یک گروه رادیویی است و نه یک گروه دکمهٔ حالتی. label اجباری است چون هیچ موتوری این نقش را نام نمی‌برد، و نوار ابزاری با دو کنترلِ بی‌نام با صدا اصلاً قابل پیمایش نیست. کلیدِ ایستِ تبی هم پیش از هیدراسیون روی گزینهٔ انتخاب‌شده گذاشته می‌شود، وگرنه کل کنترل تا رسیدن جاوااسکریپت با کلید تب دست‌نیافتنی است.",
          "en-US":
            "The group itself, which is a radio group rather than a toggle group. `label` is required because neither engine names that role, and a page with two anonymous ones is unnavigable by voice. The pre-hydration tab stop is placed on the CHECKED option, without which the whole control is unreachable by Tab until JavaScript arrives.",
        },
      },
      {
        name: "SegmentedControlItem",
        description: {
          "fa-IR":
            "یک گزینه. id اجباری است چون یک رادیو بدون مقدار وجود ندارد، و aria-label وقتی لازم می‌شود که گزینه به‌جای متن آیکون بکشد — یک آیکون نام نیست.",
          "en-US":
            "One option. `id` is required because a radio without a value does not exist, and `aria-label` becomes necessary the moment the option draws an icon instead of text — an icon is not a name.",
        },
      },
      {
        name: "segmentedControlItemVariants",
        description: {
          "fa-IR":
            "شکلِ یک گزینه. حالتِ انتخاب‌شده از data-checked خوانده می‌شود و نه از نشانگرِ فوکوسِ چرخشی که جدا سفر می‌کند: استایل‌کردنِ دومی یعنی هر گزینه‌ای که کلیدهای جهت از رویش گذشته‌اند برجسته شود، نه گزینه‌ای که انتخاب شده. حلقهٔ فوکوس هم مستقیم روی همین عنصر است، چون همین عنصر فوکوس می‌گیرد.",
          "en-US":
            "One option's shape. The checked state is read from `data-checked` rather than from the roving-focus cursor, which travels separately: styling that one would raise whichever option the arrow keys last passed over instead of the chosen one. The focus ring is on this element directly, because this element is the one that takes focus.",
        },
      },
      {
        name: "segmentedControlVariants",
        description: {
          "fa-IR":
            "شیارِ فرورفته. گِردی یکنواخت روی همین ظرف می‌نشیند به‌علاوهٔ گِردیِ کوچک‌ترِ خودِ گزینه‌ها، و همین در هر دو جهت درست است بی‌آنکه قاعده‌ای برای جابه‌جا شدنِ ترتیبِ گزینه‌ها بشکند.",
          "en-US":
            "The sunken track. One uniform radius sits here, plus the items' own smaller one, and that is correct in both directions with no rule to break when someone reorders the options.",
        },
      },
    ],
  },
  examples: [
    {
      id: "views",
      title: { "fa-IR": "تعویض‌کنندهٔ نما", "en-US": "A view switcher" },
      description: {
        "fa-IR":
          "با کلید تب وارد شوید و با کلیدهای جهت بگردید: یک ایست تبی برای کل گروه، و هر جابه‌جایی خودش انتخاب هم می‌کند. روی گزینهٔ انتخاب‌شده کلیک کنید و ببینید هیچ اتفاقی نمی‌افتد — انتخابِ خالی اینجا با ساختار غیرممکن است، نه با یک پرچم.",
        "en-US":
          "Tab in and arrow around: one tab stop for the whole group, and each move also selects. Click the checked option and watch nothing happen — an empty selection is unreachable here BY CONSTRUCTION rather than by a flag.",
      },
      render: BasicExample,
    },
    {
      id: "icon-options",
      title: { "fa-IR": "گزینه‌های آیکونی", "en-US": "Icon-only options" },
      description: {
        "fa-IR":
          "آیکون‌ها از درختِ دسترس‌پذیری بیرون‌اند و هر گزینه نامِ نوشته‌شدهٔ خودش را دارد. سه گزینه بدون این ویژگی سه کنترلِ بی‌نام می‌شدند، که نه در نماگرفت دیده می‌شود و نه واژهٔ لاتینی برای گیر افتادن باقی می‌گذارد.",
        "en-US":
          "The icons are out of the accessibility tree and each option carries its own authored name. Without that prop these would be three unnamed controls — invisible in a screenshot, and leaving no Latin word to be caught by.",
      },
      render: IconsExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "دو اندازه", "en-US": "Two sizes" },
      description: {
        "fa-IR":
          "اندازه ویژگیِ گزینه است نه گروه، چون چیزی که ارتفاع می‌گیرد گزینه است. شیارِ دورش خودش را با آن تنظیم می‌کند، پس بالشتکِ یک‌سانِ دور هر دو نوار در هر دو اندازه یکسان می‌ماند.",
        "en-US":
          "The size is a prop of the ITEM rather than of the group, because the item is what takes a height. The track around it adjusts, so the padding ring around both strips stays identical at both sizes.",
      },
      render: SizesExample,
    },
    {
      id: "disabled-option",
      title: { "fa-IR": "یک گزینهٔ غیرفعال", "en-US": "One option disabled" },
      description: {
        "fa-IR":
          "گزینهٔ غیرفعال از چرخشِ فوکوس بیرون می‌ماند ولی از فهرست حذف نمی‌شود: با کلیدهای جهت از رویش رد می‌شوید و همچنان اعلام می‌شود که هست و در دسترس نیست. برداشتنش از صفحه، همان چیزی را پنهان می‌کرد که خواننده باید بداند وجود دارد.",
        "en-US":
          "The disabled option is skipped by the roving focus but not removed from the set: the arrow keys pass over it and it is still announced as present and unavailable. Removing it from the page would hide the very thing the reader needs to know exists.",
      },
      render: DisabledOptionExample,
    },
  ],
};
