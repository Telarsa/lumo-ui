import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { ComboBox, ComboBoxItem } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the combobox page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * A server module. The overlay is shown as its trigger, which is the same rule
 * every other overlay page on this site follows: these render under a static
 * export, so what is graded is the closed control — the labelled input, the
 * named trigger button and the group that ties the two together.
 *
 * ── THE TWO REQUIRED STRINGS, AND WHY THE ARGUMENT FOR THEM INVERTED ────────
 *
 * Under the previous engine these props existed to OVERWRITE English: its own
 * bundle carried «Show suggestions» and «Suggestions» and wrote both
 * unconditionally, in a language it had no Persian bundle for.
 *
 * This engine has no string bundle and writes NEITHER. What replaces the English
 * is nothing, and nothing is worse: the trigger renders a `<button>` whose only
 * content is an icon, so with no name it is an UNNAMED control — the single most
 * common defect this library exists to prevent — and unlike «Show suggestions»
 * it leaves no Latin word for the gate or a reviewer to notice. So both props
 * stay REQUIRED, and the argument for requiring them is stronger than it was.
 *
 * That is also why this component is not split into parts. The two named
 * elements live deep inside it, and a split API is an API where you can render a
 * combobox without them; required props on the root are the only shape in which
 * forgetting is impossible.
 */

const t = {
  city: { "fa-IR": "شهر", "en-US": "City" },
  cityPlaceholder: { "fa-IR": "نام شهر را بنویسید", "en-US": "Type a city name" },
  showSuggestions: { "fa-IR": "نمایش پیشنهادها", "en-US": "Show suggestions" },
  suggestions: { "fa-IR": "پیشنهادها", "en-US": "Suggestions" },
  dismissSuggestions: { "fa-IR": "بستن پیشنهادها", "en-US": "Dismiss suggestions" },

  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  mashhad: { "fa-IR": "مشهد", "en-US": "Mashhad" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  ahvaz: { "fa-IR": "اهواز", "en-US": "Ahvaz" },
  rasht: { "fa-IR": "رشت", "en-US": "Rasht" },
  kerman: { "fa-IR": "کرمان", "en-US": "Kerman" },
  yazd: { "fa-IR": "یزد", "en-US": "Yazd" },
  urmia: { "fa-IR": "ارومیه", "en-US": "Urmia" },

  courier: { "fa-IR": "شرکت حمل", "en-US": "Carrier" },
  courierSuggestions: { "fa-IR": "شرکت‌های حمل", "en-US": "Carriers" },
  showCouriers: { "fa-IR": "نمایش شرکت‌های حمل", "en-US": "Show the carriers" },
  bike: { "fa-IR": "پیک موتوری", "en-US": "Motorcycle courier" },
  post: { "fa-IR": "پست پیشتاز", "en-US": "Express post" },
  freight: { "fa-IR": "باربری سنگین", "en-US": "Heavy freight" },

  region: { "fa-IR": "منطقهٔ سرور", "en-US": "Server region" },
  regionSuggestions: { "fa-IR": "منطقه‌ها", "en-US": "Regions" },
  showRegions: { "fa-IR": "نمایش منطقه‌ها", "en-US": "Show the regions" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <ComboBox
      className="max-w-xs"
      label={t.city[l]}
      placeholder={t.cityPlaceholder[l]}
      showSuggestionsLabel={t.showSuggestions[l]}
      suggestionsLabel={t.suggestions[l]}
      dismissLabel={t.dismissSuggestions[l]}
    >
      <ComboBoxItem id="thr">{t.tehran[l]}</ComboBoxItem>
      <ComboBoxItem id="mhd">{t.mashhad[l]}</ComboBoxItem>
      <ComboBoxItem id="isf">{t.isfahan[l]}</ComboBoxItem>
      <ComboBoxItem id="shz">{t.shiraz[l]}</ComboBoxItem>
    </ComboBox>
  );
}

function PreselectedExample(l: Locale) {
  return (
    <ComboBox
      className="max-w-xs"
      label={t.city[l]}
      defaultSelectedKey="isf"
      showSuggestionsLabel={t.showSuggestions[l]}
      suggestionsLabel={t.suggestions[l]}
      dismissLabel={t.dismissSuggestions[l]}
    >
      <ComboBoxItem id="thr">{t.tehran[l]}</ComboBoxItem>
      <ComboBoxItem id="mhd">{t.mashhad[l]}</ComboBoxItem>
      <ComboBoxItem id="isf">{t.isfahan[l]}</ComboBoxItem>
      <ComboBoxItem id="shz">{t.shiraz[l]}</ComboBoxItem>
    </ComboBox>
  );
}

function DisabledOptionExample(l: Locale) {
  return (
    <ComboBox
      className="max-w-xs"
      label={t.courier[l]}
      showSuggestionsLabel={t.showCouriers[l]}
      suggestionsLabel={t.courierSuggestions[l]}
      dismissLabel={t.dismissSuggestions[l]}
    >
      <ComboBoxItem id="bike">{t.bike[l]}</ComboBoxItem>
      <ComboBoxItem id="post">{t.post[l]}</ComboBoxItem>
      <ComboBoxItem id="freight" isDisabled>
        {t.freight[l]}
      </ComboBoxItem>
    </ComboBox>
  );
}

function LongListExample(l: Locale) {
  return (
    <ComboBox
      className="max-w-xs"
      label={t.region[l]}
      placeholder={t.cityPlaceholder[l]}
      showSuggestionsLabel={t.showRegions[l]}
      suggestionsLabel={t.regionSuggestions[l]}
      dismissLabel={t.dismissSuggestions[l]}
    >
      <ComboBoxItem id="thr">{t.tehran[l]}</ComboBoxItem>
      <ComboBoxItem id="mhd">{t.mashhad[l]}</ComboBoxItem>
      <ComboBoxItem id="isf">{t.isfahan[l]}</ComboBoxItem>
      <ComboBoxItem id="shz">{t.shiraz[l]}</ComboBoxItem>
      <ComboBoxItem id="tbz">{t.tabriz[l]}</ComboBoxItem>
      <ComboBoxItem id="ahz">{t.ahvaz[l]}</ComboBoxItem>
      <ComboBoxItem id="rsh">{t.rasht[l]}</ComboBoxItem>
      <ComboBoxItem id="ker">{t.kerman[l]}</ComboBoxItem>
      <ComboBoxItem id="yzd">{t.yazd[l]}</ComboBoxItem>
      <ComboBoxItem id="urm">{t.urmia[l]}</ComboBoxItem>
    </ComboBox>
  );
}

function DisabledExample(l: Locale) {
  return (
    <ComboBox
      className="max-w-xs"
      label={t.region[l]}
      defaultSelectedKey="thr"
      isDisabled
      showSuggestionsLabel={t.showRegions[l]}
      suggestionsLabel={t.regionSuggestions[l]}
      dismissLabel={t.dismissSuggestions[l]}
    >
      <ComboBoxItem id="thr">{t.tehran[l]}</ComboBoxItem>
      <ComboBoxItem id="mhd">{t.mashhad[l]}</ComboBoxItem>
    </ComboBox>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "فهرست بلند است یا از سرور می‌آید و کاربر با نوشتن آن را کوتاه می‌کند؛ مقدار نهایی یکی از گزینه‌هاست.",
        "en-US": "The list is long or comes from a server and the user narrows it by typing; the final value is one of the options.",
      },
      whenNot: {
        "fa-IR": "فهرست کوتاه و ثابت است — `Select`. متن آزاد با پیشنهاد اختیاری — `Autocomplete`. چند مقدار — `MultiSelect`.",
        "en-US": "The list is short and fixed — `Select`. Free text with optional suggestions — `Autocomplete`. Several values — `MultiSelect`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "جعبهٔ ترکیبی", "en-US": "Combo box" },
    intro: {
      "fa-IR":
        "یک ورودی متن که فهرستی از گزینه‌ها را فیلتر می‌کند. دو رشته اجباری‌اند و هر دو جایی می‌نشینند که موتور چیزی نمی‌نویسد: نامِ دکمهٔ آیکونیِ باز‌کننده و نامِ فهرستِ پیشنهادها. برچسبِ دیداری هم یک label بومی است و نه بخشِ برچسبِ خودِ موتور، و این دستورِ خودِ موتور است نه ترجیح: بخشِ برچسبِ آن، دکمه را نام می‌برد و نه ورودی را — اندازه‌گیری‌شده، ورودی هیچ نامی نمی‌گرفت و نامِ محاسبه‌شده‌اش تهی بود.",
      "en-US":
        "A text input that filters a list of options. Two strings are required and both sit where the engine writes nothing: the name of the icon-only trigger and the name of the suggestion list. The visible label is a NATIVE `<label>` rather than the engine's own label part, and that is the engine's own instruction rather than a preference: its label part names the TRIGGER and not the input — measured, the input carried no name at all and its computed name was null.",
    },
    composition: [
      `<ComboBox`,
      `  showSuggestionsLabel   ← REQUIRED: the trigger is an icon-only button`,
      `  suggestionsLabel       ← REQUIRED: the engine names the list nothing`,
      `  label                  ← rendered as a native <label htmlFor>`,
      `  placeholder items selectedKey defaultSelectedKey onSelectionChange`,
      `  inputValue onInputChange isDisabled isRequired name>`,
      ``,
      `  <ComboBoxItem id isDisabled>…</ComboBoxItem>`,
      `</ComboBox>`,
    ].join("\n"),
    parts: [
      {
        name: "ComboBox",
        description: {
          "fa-IR":
            "کل کنترل، و عمداً به قطعه‌ها شکسته نشده: دو عنصرِ نام‌دار عمیقاً درونش زندگی می‌کنند و اِی‌پی‌آیِ شکسته اِی‌پی‌آیی است که می‌شود این کنترل را بی آن‌ها ساخت. یک نقشِ گروه هم دورِ ورودی و دکمه‌اش برگردانده شده — تنها نقشی که این جزء با عوض‌شدن موتور از دست داد. تزئین نیست: دکمه و میدان برای خواننده یک کنترل‌اند، و بدون گروه‌بندی، پیمایشِ عنصربه‌عنصرِ صفحه‌خوان به دکمه‌ای می‌رسد که به هیچ‌چیز تعلق ندارد.",
          "en-US":
            "The whole control, deliberately not split into parts: the two named elements live deep inside it, and a split API is one in which you can render this control without them. A `role=\"group\"` is also restored around the input and its trigger — the one ROLE this component lost on the engine change. It is not decoration: the button and the field are ONE control to a reader, and without the grouping a screen reader's element-by-element walk meets a button that belongs to nothing.",
        },
      },
      {
        name: "ComboBoxItem",
        description: {
          "fa-IR":
            "یک پیشنهاد. textValue پذیرفته و بی‌استفاده است و این عمدی است نه سهل‌انگاری: تطبیق روی ریشه انجام می‌شود و هیچ قلابِ هر‌گزینه‌ای برای مسیردهی‌اش نمانده؛ حذفش اِی‌پی‌آی را می‌شکست و فرستادنش به aria-label هر گزینه را به نامِ متنِ دیداریِ خودش تغییرِ نام می‌داد و بی‌صدا عوض می‌کرد که صفحه‌خوان چه می‌گوید.",
          "en-US":
            "One suggestion. `textValue` is accepted and unused, and that is deliberate rather than sloppy: matching happens on the ROOT and there is no per-item hook left to route it to; dropping the prop would break the frozen API, and forwarding it to `aria-label` would rename every option after its own visible text and quietly change what a screen reader says.",
        },
      },
      {
        name: "comboBoxPopoverVariants",
        description: {
          "fa-IR":
            "سطحِ شناور. عرضش از متغیرِ اندازه‌گیری‌شدهٔ لنگر می‌آید، پس فهرست دقیقاً به پهنای میدان می‌شود و در هر دو جهت لبه‌هایش با آن هم‌تراز می‌ماند.",
          "en-US":
            "The floating surface. Its width comes from the engine's measured anchor variable, so the list is exactly as wide as the field and its edges stay flush with it in both directions.",
        },
      },
      {
        name: "comboBoxGroupVariants",
        description: {
          "fa-IR":
            "جعبه‌ای که ورودی و دکمه را با هم نگه می‌دارد. حاشیه‌اش با فوکوسِ درونی روشن می‌شود و این یک شبه‌کلاسِ خودِ سی‌اس‌اس است: موتور هیچ ویژگیِ فوکوسِ درونی نمی‌نویسد، پس همان رفتار با یک چیزِ کمترِ اجاره‌ای به دست می‌آید.",
          "en-US":
            "The box that holds the input and its trigger together. Its border lights on focus-within, and that is CSS's own pseudo-class: the engine writes no focus-within attribute, so the same behaviour costs one less rented thing.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR":
          "روی برچسب کلیک کنید: فوکوس به ورودی می‌رود، چون این یک label بومی با htmlFor است و شناسه‌اش پایدارِ سمتِ سرور است — نه چیزی که یک اثرِ چیدمانی بعداً بسازد. دکمهٔ کنارش هم نامِ نوشته‌شدهٔ خودش را دارد؛ بدون آن، یک دکمهٔ بی‌نام با یک آیکون بود.",
        "en-US":
          "Click the label: focus lands in the input, because this is a native `<label htmlFor>` whose id is server-stable — not something a layout effect mints later. The button beside it carries its own authored name; without it, it would be an unnamed button containing an icon.",
      },
      render: BasicExample,
    },
    {
      id: "preselected",
      title: { "fa-IR": "با مقدار انتخاب‌شده", "en-US": "With a value already chosen" },
      description: {
        "fa-IR":
          "متنِ ورودی از کلیدِ انتخاب‌شده مشتق می‌شود و کنارش نگه داشته نمی‌شود، که همان چیزی است که باعث می‌شود پروفایلِ ذخیره‌شده بلافاصله جا بیفتد. فهرست را باز کنید تا تیکِ کنارِ همان گزینه را ببینید: نشانگرِ انتخاب یک عنصرِ جدا است، نه رنگی که به سطر داده شده باشد.",
        "en-US":
          "The input's text is DERIVED from the selected key rather than stored beside it, which is what makes a saved profile take effect immediately. Open the list to see the check beside that option: the selection indicator is its own element rather than a colour applied to the row.",
      },
      render: PreselectedExample,
    },
    {
      id: "disabled-option",
      title: { "fa-IR": "گزینه‌ای که در دسترس نیست", "en-US": "An option that is unavailable" },
      description: {
        "fa-IR":
          "گزینهٔ غیرفعال هنوز فیلتر می‌شود و هنوز دیده می‌شود: خواننده باید بداند این گزینه وجود دارد و امروز شدنی نیست. برداشتنش از فهرست، تفاوتِ «نداریم» و «نیست» را از بین می‌برد.",
        "en-US":
          "The disabled option is still filtered and still shown: the reader needs to know that it exists and is not available today. Removing it from the list erases the difference between «we do not have it» and «there is no such thing».",
      },
      render: DisabledOptionExample,
    },
    {
      id: "long-list",
      title: { "fa-IR": "فهرست بلند", "en-US": "A long list" },
      description: {
        "fa-IR":
          "بنویسید تا فهرست کوچک شود، و با کلیدهای بالا و پایین بگردید بی‌آنکه فوکوس از ورودی برود: مکان‌نما مجازی است و ورودی همچنان جایی است که تایپ می‌کنید. سطح شناور خودش را با پهنای میدان اندازه می‌کند و وقتی گزینه‌ها بیشتر از ارتفاعش شوند خودش می‌پیماید.",
        "en-US":
          "Type to narrow the list, then arrow through it without focus ever leaving the input: the cursor is virtual and the input is still where you are typing. The floating surface measures itself against the field's width and scrolls itself once the options outgrow its height.",
      },
      render: LongListExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR":
          "کلِ کنترل کم‌رنگ می‌شود و رویدادِ اشاره‌گر نمی‌گیرد، ولی متنِ انتخاب‌شده خوانا می‌ماند — چیزی که نمی‌شود عوضش کرد هنوز باید خوانده شود. دکمهٔ باز‌کننده هم همچنان نام دارد، چون یک کنترلِ غیرفعال از درختِ دسترس‌پذیری بیرون نمی‌رود.",
        "en-US":
          "The whole control dims and takes no pointer events, but the chosen text stays readable — what cannot be changed still has to be read. The trigger keeps its name too, because a disabled control does not leave the accessibility tree.",
      },
      render: DisabledExample,
    },
  ],
};
