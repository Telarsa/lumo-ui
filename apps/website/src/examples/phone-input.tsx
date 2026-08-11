import type { Locale } from "@lumo-ui/core";
import type { PhoneCountry } from "@lumo-ui/ui";
import { PhoneInputIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the phone-input page. Contract: `_system/types.ts`.
 *
 * Every example here is an ISLAND, and unavoidably so: `PhoneInput` is a
 * CONTROLLED field with no uncontrolled mode. Handed a `value` that never
 * changes, the second keystroke erases the first — the shown text is derived
 * from the value rather than stored beside it, which is the right design and
 * the reason a static demo of this component would be a field nobody can type
 * into. `demo-islands.tsx` states the same thing from its side. The strings
 * still live HERE, in both locales; the island authors no copy.
 *
 * ── THE ONE THING TO DO ON THIS PAGE ────────────────────────────────────────
 *
 * Type «۰۹۱۲۱۲۳۴۵۶۷» — eleven digits beginning with a zero, the number every
 * Iranian knows by heart — and watch `+989121234567` appear in the read-out
 * underneath. That leading zero is a *trunk prefix*: a domestic dialling
 * artefact that is not part of the number. Nobody outside telecoms knows this
 * and there is no reason they should, which is why a form that demands E.164
 * rejects the number its user is certain of, and a form that stores what was
 * typed hands the SMS gateway a string it will not deliver to.
 *
 * Then try the same number as «۹۱۲۱۲۳۴۵۶۷», as `+989121234567`, and as
 * `00989121234567`, with spaces and dashes in it, in either script. All four
 * are the same number and all four land on the same E.164 string.
 *
 * ── THE HONEST LIMIT, RESTATED WHERE PEOPLE WILL READ IT ────────────────────
 *
 * This component validates IRAN properly and everything else loosely. It does
 * not carry `react-phone-number-input`'s ~140KB metadata table, so the country
 * list is a small curated default and a prop. The last example supplies its own.
 */

const t = {
  mobileLabel: { "fa-IR": "شمارهٔ موبایل", "en-US": "Mobile number" },
  countryLabel: { "fa-IR": "کشور", "en-US": "Country" },
  storedLabel: { "fa-IR": "چیزی که ذخیره می‌شود:", "en-US": "What gets stored:" },
  emptyText: { "fa-IR": "— هنوز چیزی وارد نشده", "en-US": "— nothing entered yet" },

  trunkHelp: {
    "fa-IR": "همان‌طور که همیشه می‌نویسید، با صفر ابتدایی. ارقام فارسی هم پذیرفته می‌شود.",
    "en-US": "Write it exactly as you always do, leading zero and all. Persian numerals are fine.",
  },
  placeholder: { "fa-IR": "۰۹۱۲ ۱۲۳ ۴۵۶۷", "en-US": "0912 123 4567" },

  prefilledHelp: {
    "fa-IR": "مقدار ذخیره‌شده به شکل E.۱۶۴ است؛ چیزی که می‌بینید شکل ملیِ همان عدد است.",
    "en-US": "The stored value is E.164; what you see is the national form of the same number.",
  },

  invalidError: {
    "fa-IR": "شمارهٔ موبایل ایران باید ده رقم پس از صفر باشد.",
    "en-US": "An Iranian mobile number has ten digits after the zero.",
  },

  customHelp: {
    "fa-IR": "فهرست کشورها یک ویژگی است — این یکی فقط سه کشور دارد.",
    "en-US": "The country list is a prop — this one carries just three countries.",
  },
  iran: { "fa-IR": "ایران", "en-US": "Iran" },
  oman: { "fa-IR": "عمان", "en-US": "Oman" },
  qatar: { "fa-IR": "قطر", "en-US": "Qatar" },
} satisfies Record<string, LocalizedText>;

/**
 * A caller-supplied list, to show that the shipped one is only a default.
 *
 * A numbering plan is DATA, and data in a UI library goes stale silently — so
 * `COUNTRIES` is small and explicitly curated rather than exhaustive, and a
 * caller who needs somewhere else supplies it. `nationalLength` is what the
 * component's one validation checks; a country without it is accepted at any
 * non-empty length rather than rejected, because a validator that rejects a
 * number it simply has no data for is worse than one that lets it through.
 */
const GULF: readonly PhoneCountry[] = [
  { code: "IR", dial: "98", nationalLength: 10, name: t.iran },
  { code: "OM", dial: "968", nationalLength: 8, name: t.oman },
  { code: "QA", dial: "974", nationalLength: 8, name: t.qatar },
];

function TrunkZeroExample(l: Locale) {
  return (
    <PhoneInputIsland
      locale={l}
      label={t.mobileLabel[l]}
      countryLabel={t.countryLabel[l]}
      description={t.trunkHelp[l]}
      placeholder={t.placeholder[l]}
      storedLabel={t.storedLabel[l]}
      emptyText={t.emptyText[l]}
    />
  );
}

function PrefilledExample(l: Locale) {
  return (
    <PhoneInputIsland
      locale={l}
      label={t.mobileLabel[l]}
      countryLabel={t.countryLabel[l]}
      defaultValue="+989121234567"
      description={t.prefilledHelp[l]}
      storedLabel={t.storedLabel[l]}
      emptyText={t.emptyText[l]}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <PhoneInputIsland
      locale={l}
      label={t.mobileLabel[l]}
      countryLabel={t.countryLabel[l]}
      defaultValue="+98912123"
      errorMessage={t.invalidError[l]}
      storedLabel={t.storedLabel[l]}
      emptyText={t.emptyText[l]}
    />
  );
}

function CustomListExample(l: Locale) {
  return (
    <PhoneInputIsland
      locale={l}
      label={t.mobileLabel[l]}
      countryLabel={t.countryLabel[l]}
      countries={GULF}
      defaultCountry="OM"
      description={t.customHelp[l]}
      storedLabel={t.storedLabel[l]}
      emptyText={t.emptyText[l]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    isNew: true,
    title: { "fa-IR": "ورودی شمارهٔ تلفن", "en-US": "Phone input" },
    intro: {
      "fa-IR":
        "شمارهٔ تلفن، همان‌طور که ایرانی‌ها واقعاً می‌نویسندش. هر ایرانی موبایلش را «۰۹۱۲۱۲۳۴۵۶۷» می‌نویسد؛ چیزی که هر درگاه پیامک و هر ستون پایگاه‌داده می‌خواهد «+۹۸۹۱۲۱۲۳۴۵۶۷» است — بدون آن صفر. آن صفر پیشوند تنه است: یک نشانهٔ شماره‌گیریِ داخلی که جزئی از خودِ شماره نیست. این جزء همان درز است: چهار شکلِ رایج را در هر دو خط می‌پذیرد و یک رشتهٔ E.۱۶۴ تحویل می‌دهد، و آنچه نشان می‌دهد شکل ملی با ارقام خودِ خواننده است.",
      "en-US":
        "A phone number, entered the way Iranians actually type one. Every Iranian writes their mobile as «۰۹۱۲۱۲۳۴۵۶۷»; what every SMS gateway and every database column wants is «+989121234567» — with no zero. That zero is a trunk prefix: a domestic dialling artefact that is not part of the number. This component is the seam: it accepts the four shapes people actually type, in either script, and hands back one canonical E.164 string while SHOWING the national form in the reader's own numerals.",
    },
    composition: [
      `<PhoneInput`,
      `  label locale countryLabel     ← countryLabel names the selector: two controls, one field`,
      `  value onChange                ← both are E.164, always`,
      `  defaultCountry countries      ← the list is a prop; the shipped one is a default`,
      `  description errorMessage`,
      `  placeholder name isDisabled />`,
      ``,
      `toNational / toE164 / phoneDigits / isValidPhone / COUNTRIES`,
      `                                 ← the parsing is exported and testable on its own`,
    ].join("\n"),
    parts: [
      {
        name: "PhoneInput",
        description: {
          "fa-IR":
            "کل میدان: یک انتخابگر بومیِ کشور کنار یک ورودی tel. انتخابگر بومی است چون این فهرستی بلند از نام کشورهاست روی فرمی که غالباً با گوشی پر می‌شود، و انتخابگر خودِ سکو تنها کنترلی است که با یک دست کار می‌کند.",
          "en-US":
            "The whole field: a native country selector beside a tel input. Native because this is a long list of country names on a form that is very often filled on a phone, and the platform's own picker is the control that works one-handed.",
        },
      },
      {
        name: "toNational",
        description: {
          "fa-IR":
            "شماره بدون پیشوند تنه و بدون کد کشور. ترتیبِ کارها مهم است: «۰۰۹۸۹۱۲…» باید اول پیشوند بین‌المللی را از دست بدهد و بعد قاعدهٔ صفر اجرا شود، وگرنه یکی از صفرها زنده می‌ماند.",
          "en-US":
            "The national number, with the trunk prefix and any dial code removed. The ORDER matters: «0098912…» has to lose the international prefix before the trunk-zero rule runs, or one of the zeroes survives.",
        },
      },
      {
        name: "toE164",
        description: {
          "fa-IR":
            "همان، به‌علاوهٔ کد کشور و یک «+». وقتی چیزی برای ساختن نیست رشتهٔ خالی می‌دهد، نه «+۹۸» تنها.",
          "en-US":
            "The same, plus the dial code and a «+». Returns an empty string when there is nothing to build, never a bare «+98».",
        },
      },
      {
        name: "isValidPhone",
        description: {
          "fa-IR":
            "تنها اعتبارسنجیِ ادعاشده، و عمداً ضعیف: «آیا طولش همانی است که طرح شماره‌گذاری آن کشور می‌گوید». کشوری بدون nationalLength در هر طولِ ناتهی پذیرفته می‌شود، چون ردکردنِ شماره‌ای که فقط داده‌اش را نداریم از عبوردادنش بدتر است.",
          "en-US":
            "The only validation claimed, and deliberately weak: «is it the length its country's plan expects». A country with no nationalLength is accepted at any non-empty length, because rejecting a number you simply have no data for is worse than letting it through.",
        },
      },
      {
        name: "COUNTRIES",
        description: {
          "fa-IR":
            "فهرست پیش‌فرض، و عمداً الفبایی نیست: ایران اول است. فرمی که کاربر ایرانی را وادار کند برای یافتن ایران بپیماید، پیش‌فرض‌هایش را از جای دیگری گرفته.",
          "en-US":
            "The default list, and deliberately not alphabetical: Iran is first. A form that makes an Iranian user scroll to find Iran has got its defaults from somewhere else.",
        },
      },
    ],
  },
  examples: [
    {
      id: "trunk-zero",
      title: { "fa-IR": "صفرِ ابتدایی", "en-US": "The leading zero" },
      description: {
        "fa-IR":
          "«۰۹۱۲۱۲۳۴۵۶۷» را تایپ کنید و زیرش را ببینید. بعد همان شماره را به شکل «۹۱۲۱۲۳۴۵۶۷»، «+۹۸۹۱۲…» و «۰۰۹۸۹۱۲…» و با فاصله و خط تیره امتحان کنید: هر چهار شکل به یک رشتهٔ E.۱۶۴ می‌رسند. عدد خودش یک جزیرهٔ چپ‌به‌راست است و داخل bdi نشسته — بدون آن، «+» و پرانتز جهتشان را از متنِ اطراف می‌گیرند و «+۹۸ ۹۱۲…» به «۹۱۲… ۹۸+» تبدیل می‌شود.",
        "en-US":
          "Type «09121234567» and watch the read-out. Then try the same number as «9121234567», as «+98912…» and as «0098912…», with spaces and dashes: all four land on one E.164 string. The number itself is a left-to-right island and sits inside a bdi — without it the «+» and any parentheses take their direction from the surrounding text, and «+۹۸ ۹۱۲…» renders as «۹۱۲… ۹۸+».",
      },
      render: TrunkZeroExample,
    },
    {
      id: "prefilled",
      title: { "fa-IR": "بارگذاری یک مقدار ذخیره‌شده", "en-US": "Loading a stored value" },
      description: {
        "fa-IR":
          "میدان با E.۱۶۴ پر می‌شود و شکل ملی را نشان می‌دهد. متنِ نمایش‌داده‌شده از مقدار مشتق می‌شود نه اینکه کنارش نگه داشته شود، و همین است که باعث می‌شود پروفایلِ ذخیره‌شده یا ریست‌شدنِ فرم بلافاصله جا بیفتد.",
        "en-US":
          "The field is loaded with E.164 and shows the national form. The displayed text is DERIVED from the value rather than stored beside it, which is what makes a saved profile loading — or a form resetting — take effect immediately.",
      },
      render: PrefilledExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "شمارهٔ ناقص", "en-US": "An incomplete number" },
      description: {
        "fa-IR":
          "errorMessage هم پیام را زیر ردیف می‌گذارد و هم aria-invalid را روی ورودی. توجه کنید که ورودی type=\"tel\" است و نه number: «input type=number» ارقام فارسی و علامت «+» را یک‌جا رد می‌کند، بی‌آنکه هیچ پیام اعتبارسنجی‌ای بدهد.",
        "en-US":
          "errorMessage puts the message under the row and aria-invalid on the input. Note the input is type=\"tel\" and never number: «input type=number» rejects Persian digits and the «+» outright, with no validation message at all.",
      },
      render: InvalidExample,
    },
    {
      id: "custom-list",
      title: { "fa-IR": "فهرست کشورِ خودتان", "en-US": "Your own country list" },
      description: {
        "fa-IR":
          "این جزء جدول ۱۴۰ کیلوبایتیِ طرح‌های شماره‌گذاری را با خود نمی‌آورد، و پیامدِ صادقانه‌اش نوشته می‌شود نه پنهان: ایران را درست اعتبارسنجی می‌کند و بقیه را سرانگشتی. هر کس بلژیک بخواهد بلژیک را خودش می‌دهد.",
        "en-US":
          "This component does not carry the ~140KB numbering-plan table, and the honest consequence is stated rather than hidden: it validates Iran properly and everything else loosely. Anyone who needs Belgium supplies Belgium.",
      },
      render: CustomListExample,
    },
  ],
};
