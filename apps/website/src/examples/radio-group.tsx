import type { Locale } from "@lumo-ui/core";
import { Radio, RadioGroup } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the radio-group page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * A server module, and here that is load-bearing rather than convenient.
 *
 * ── THE ONE THING TO CHECK, AND IT IS THE Tab KEY ───────────────────────────
 *
 * Measured on this repository's own export before the fix existed: every served
 * `<span role="radio">` carried `tabindex="-1"` and none carried `0`, so a radio
 * group was UNREACHABLE by the Tab key for the whole window between first paint
 * and hydration. Six documents of a 442-document build were in that state,
 * including the component's own docs page.
 *
 * The engine's group resolves its roving index in a layout effect, which never
 * runs on the server. The fix hands the CHECKED option the stop — falling back
 * to the first — and the value EXPIRES on hydration, which a constant
 * `tabIndex={0}` would not: that would leave two permanent tab stops the
 * composite could never reclaim.
 *
 * ── AND ONE CAPABILITY THAT IS GONE, STATED ON THE PAGE ─────────────────────
 *
 * `orientation` no longer steers the arrow keys. The engine's group has no such
 * prop and hands its composite no axis, so a horizontal group answers Up/Down as
 * well and a vertical one answers Left/Right. That is a widening rather than a
 * break, and the prop is kept as the VISUAL prop it always also was.
 */

const t = {
  shipping: { "fa-IR": "روش ارسال", "en-US": "Delivery method" },
  courier: { "fa-IR": "پیک موتوری", "en-US": "Motorcycle courier" },
  post: { "fa-IR": "پست پیشتاز", "en-US": "Express post" },
  pickup: { "fa-IR": "تحویل حضوری", "en-US": "Collect in person" },

  plan: { "fa-IR": "دورهٔ پرداخت", "en-US": "Billing period" },
  monthly: { "fa-IR": "ماهانه", "en-US": "Monthly" },
  monthlyHelp: {
    "fa-IR": "هر ماه صورت‌حساب می‌شود و هر وقت خواستید لغو می‌شود.",
    "en-US": "Billed each month and cancellable whenever you like.",
  },
  yearly: { "fa-IR": "سالانه", "en-US": "Yearly" },
  yearlyHelp: {
    "fa-IR": "یک‌جا پرداخت می‌شود و دو ماه ارزان‌تر درمی‌آید.",
    "en-US": "Paid once, and works out two months cheaper.",
  },

  density: { "fa-IR": "فشردگی جدول", "en-US": "Table density" },
  compact: { "fa-IR": "فشرده", "en-US": "Compact" },
  cosy: { "fa-IR": "معمولی", "en-US": "Cosy" },
  roomy: { "fa-IR": "باز", "en-US": "Roomy" },

  invoiceTo: { "fa-IR": "صورت‌حساب به نام", "en-US": "Invoice made out to" },
  person: { "fa-IR": "شخص حقیقی", "en-US": "An individual" },
  company: { "fa-IR": "شخص حقوقی", "en-US": "A company" },
  invoiceError: {
    "fa-IR": "پیش از ادامه یکی از این دو را انتخاب کنید.",
    "en-US": "Choose one of these two before continuing.",
  },

  region: { "fa-IR": "منطقهٔ سرور", "en-US": "Server region" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  frankfurt: { "fa-IR": "فرانکفورت", "en-US": "Frankfurt" },
  regionHelp: {
    "fa-IR": "منطقه پس از ساختِ فضای کاری قابل تغییر نیست.",
    "en-US": "The region cannot be changed once the workspace exists.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <RadioGroup className="max-w-sm" label={t.shipping[l]} defaultValue="post">
      <Radio value="courier">{t.courier[l]}</Radio>
      <Radio value="post">{t.post[l]}</Radio>
      <Radio value="pickup">{t.pickup[l]}</Radio>
    </RadioGroup>
  );
}

function DescriptionsExample(l: Locale) {
  return (
    <RadioGroup className="max-w-sm" label={t.plan[l]} defaultValue="yearly">
      <Radio value="monthly" description={t.monthlyHelp[l]}>
        {t.monthly[l]}
      </Radio>
      <Radio value="yearly" description={t.yearlyHelp[l]}>
        {t.yearly[l]}
      </Radio>
    </RadioGroup>
  );
}

function HorizontalExample(l: Locale) {
  return (
    <RadioGroup
      className="max-w-sm"
      label={t.density[l]}
      orientation="horizontal"
      defaultValue="cosy"
    >
      <Radio value="compact">{t.compact[l]}</Radio>
      <Radio value="cosy">{t.cosy[l]}</Radio>
      <Radio value="roomy">{t.roomy[l]}</Radio>
    </RadioGroup>
  );
}

function InvalidExample(l: Locale) {
  return (
    <RadioGroup className="max-w-sm" label={t.invoiceTo[l]} errorMessage={t.invoiceError[l]}>
      <Radio value="person">{t.person[l]}</Radio>
      <Radio value="company">{t.company[l]}</Radio>
    </RadioGroup>
  );
}

function DisabledExample(l: Locale) {
  return (
    <RadioGroup
      className="max-w-sm"
      label={t.region[l]}
      description={t.regionHelp[l]}
      defaultValue="tehran"
      isDisabled
    >
      <Radio value="tehran">{t.tehran[l]}</Radio>
      <Radio value="frankfurt">{t.frankfurt[l]}</Radio>
    </RadioGroup>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "چند گزینهٔ ناسازگار که همه یک‌جا دیده می‌شوند و دقیقاً یکی درست است: روش ارسال، طرح اشتراک.",
        "en-US": "A few mutually exclusive options all visible at once, exactly one true: delivery method, plan.",
      },
      whenNot: {
        "fa-IR": "بیش از حدود ۶ گزینه — `Select`. چند انتخاب هم‌زمان — `CheckboxGroup`. دو تا چهار نمای یک چیز — `SegmentedControl`. روشن/خاموش — `Switch`.",
        "en-US": "More than about 6 options — `Select`. Several choices at once — `CheckboxGroup`. Two to four views of one thing — `SegmentedControl`. On/off — `Switch`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "گروه رادیویی", "en-US": "Radio group" },
    intro: {
      "fa-IR":
        "چند گزینهٔ ناسازگار که دقیقاً یکی‌شان درست است. نامِ گروه اجباری است و برخلاف چک‌باکس هیچ جایگزینِ منطقی‌ای ندارد: تک‌تک رادیوها نامِ گزینه‌ها را می‌گویند، نه نامِ پرسشی را که جواب می‌دهند. هر گزینه هم خودش را نام می‌برد و باید ببرد — به ارث بردنِ نامِ گروه یعنی پنج گزینه همه «روش ارسال» اعلام شوند. کلِ گروه یک ایست تبی است و جابه‌جایی بینشان با کلیدهای جهت انجام می‌شود.",
      "en-US":
        "A few mutually exclusive options, exactly one of which is true. The group's name is required and, unlike a checkbox, there is no sensible per-option fallback: the individual radios name the OPTIONS, not the question they answer. Each option names itself and has to — inheriting the group's name would announce five options all called «Delivery method». The whole group is one tab stop and the arrow keys move between them.",
    },
    composition: [
      `<RadioGroup`,
      `  label            ← REQUIRED; rendered with nativeLabel={false}`,
      `  orientation      ← VISUAL only now: both axes of arrow keys navigate`,
      `  description errorMessage isDisabled name value defaultValue onChange>`,
      ``,
      `  <Radio value description>…</Radio>   ← names ITSELF, per-option help text`,
      `</RadioGroup>`,
    ].join("\n"),
    parts: [
      {
        name: "RadioGroup",
        description: {
          "fa-IR":
            "خودِ گروه. یک ریشهٔ میدان است نه فقط یک گروه رادیویی، و این لازم است: اعتبارسنجی از ریشهٔ میدان روی تک‌تک رادیوها پایین می‌آید، و بدون آن دایرهٔ نامعتبر هیچ ویژگی‌ای برای خواندن ندارد. برچسبش هم به‌جای label یک span است، چون هیچ کنترلِ برچسب‌پذیرِ یکتایی برای اشاره‌کردن وجود ندارد.",
          "en-US":
            "The group itself. It is a FIELD root and not merely a radio group, and that is necessary: validity is pushed down from the field root onto each radio, and without it the invalid circle has no attribute to read. Its label is a span rather than a `<label>`, because there is no single labelable control to point at.",
        },
      },
      {
        name: "Radio",
        description: {
          "fa-IR":
            "یک گزینه. سیم‌کشیِ نام را برای خودش انجام می‌دهد نه اینکه از گروه ارث ببرد، چون این یک میدانِ دیگر است: عنصرِ دایره روی سرور بدون هیچ aria-labelledby صادر می‌شود، یعنی نامِ گروه در بایتِ اول هست و نامِ هیچ گزینه‌ای نیست — و آن نیمه گمراه‌کننده‌تر از هر دو است.",
          "en-US":
            "One option. It does its own name wiring rather than inheriting the group's, because it is a DIFFERENT field: the circle is served with no aria-labelledby at all, so the group's name is in the first byte and every option's name is not — the more misleading half of the two.",
        },
      },
      {
        name: "radioIndicatorVariants",
        description: {
          "fa-IR":
            "دایره، که حالا خودش کنترل است. نقطهٔ داخلش یک span مقیاس‌شونده است نه یک آیکونِ شرطی: یک تبدیلِ مقیاس روی هر دو محور جهت‌خنثی است، و اگر نشانگرِ خودِ موتور به کار می‌رفت گذارِ مقیاس جایش را به سوارشدن و پیاده‌شدن می‌داد و انیمیشنی که نقطه برایش وجود دارد از بین می‌رفت.",
          "en-US":
            "The circle, which is now also the control. The dot inside it is a scaled span rather than a conditionally mounted icon: a transform on both axes together is direction-neutral, and the engine's own indicator mounts CONDITIONALLY, which would replace a scale transition with a mount and lose the animation the dot exists to have.",
        },
      },
      {
        name: "radioListVariants",
        description: {
          "fa-IR":
            "چیدمانِ گزینه‌ها، که همان عنصرِ دارای نقشِ گروه رادیویی هم هست. فاصله با gap گذاشته می‌شود نه با حاشیه روی گزینه: gap را الگوریتمِ چیدمان روی محور درون‌خطی می‌گذارد و آن الگوریتم جهت را از پیش می‌داند، در حالی که حاشیهٔ سمتِ پایان باید دستی وارونه شود.",
          "en-US":
            "The options' layout, which is also the element carrying the radiogroup role. The spacing is a `gap` rather than a margin on the option: a gap in a row is inserted on the inline axis by the layout algorithm, which already knows the direction, while a trailing margin would have to be un-mirrored by hand.",
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
          "با کلید تب وارد گروه شوید: ایست روی گزینهٔ انتخاب‌شده می‌افتد، نه روی اولی — همان‌جایی که الگوی گروه رادیوییِ استاندارد می‌گذاردش، و همان‌جایی که در بایتِ اول هم هست. بعد با کلیدهای جهت بین گزینه‌ها بروید؛ هر بار انتخاب هم عوض می‌شود.",
        "en-US":
          "Tab into the group: the stop lands on the CHECKED option rather than the first — where the standard radio-group pattern puts it, and where it already is in the first byte. Then arrow between the options; each move also changes the selection.",
      },
      render: BasicExample,
    },
    {
      id: "descriptions",
      title: { "fa-IR": "راهنما برای هر گزینه", "en-US": "Help text per option" },
      description: {
        "fa-IR":
          "هر گزینه توضیحِ خودش را دارد و آن توضیح به همان رادیو وصل است نه به گروه — دو میدانِ جدا، دو aria-describedby جدا. تورفتگیِ خطِ دوم منطقی است، پس در فارسی از راست فرو می‌رود.",
        "en-US":
          "Each option carries its own description, and it is tied to that radio rather than to the group — two separate fields, two separate aria-describedby values. The second line's indent is logical, so it steps in from the right in Persian.",
      },
      render: DescriptionsExample,
    },
    {
      id: "horizontal",
      title: { "fa-IR": "افقی، و آنچه دیگر رایگان نیست", "en-US": "Horizontal, and what is no longer free" },
      description: {
        "fa-IR":
          "orientation حالا فقط چیدمان را عوض می‌کند. موتور به مرکبِ خودش هیچ محوری نمی‌دهد، پس این گروهِ افقی به کلیدهای بالا و پایین هم جواب می‌دهد و گروهِ عمودی به چپ و راست — گشایش است نه شکست، ولی چیزی است که این جزء پیش‌تر تضمین می‌کرد و دیگر نمی‌کند. کلیدهای جهت خودشان جهت‌آگاه‌اند: روی صفحهٔ فارسی کلید راست به گزینهٔ پیشین می‌رود.",
        "en-US":
          "`orientation` now changes only the layout. The engine hands its composite no axis, so this horizontal group also answers Up/Down and a vertical one answers Left/Right — a widening rather than a break, but something this component used to guarantee and no longer can. The arrow keys are themselves direction-aware: on a Persian page ArrowRight moves to the PREVIOUS option.",
      },
      render: HorizontalExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR":
          "خطا به گروه تعلق دارد و نه به گزینه، و ساختارِ موتور همین را می‌گوید: بخشِ یک گزینه توضیح دارد و خطا ندارد. دادنِ errorMessage گروه را نامعتبر می‌کند و ویژگی تا خودِ دایره‌ها پایین می‌آید، که تنها راهی است که حاشیهٔ قرمز بی‌آنکه دستی روی هر گزینه گذاشته شود ظاهر می‌شود.",
        "en-US":
          "The error belongs to the GROUP and not to an option, and the engine's structure says so: an option's part has a description slot and no error slot. Supplying errorMessage marks the group invalid and the attribute reaches the circles themselves, which is the only way the red border appears without being hand-applied per option.",
      },
      render: InvalidExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "گروهِ غیرفعال", "en-US": "A disabled group" },
      description: {
        "fa-IR":
          "کم‌رنگ‌شدن یک بار روی پوششِ میدان اعمال می‌شود و برچسب و گزینه‌ها و توضیح را با هم می‌گیرد. گذاشتنِ همان روی هر گزینه ضرب می‌شد و به یک‌چهارم می‌رسید، که خراب به نظر می‌رسد نه غیرفعال — و گزینهٔ انتخاب‌شده همچنان خوانده می‌شود، که تمامِ نکتهٔ نشان‌دادنِ یک گروهِ قفل‌شده است.",
        "en-US":
          "The dimming is applied once, on the field wrapper, and takes the label, the options and the description together. Applying it per option would multiply to a quarter and read as broken rather than as disabled — and the chosen option stays readable, which is the entire point of showing a locked group.",
      },
      render: DisabledExample,
    },
  ],
};
