import type { Locale } from "@lumo-ui/core";
import { NumberField } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the number-field page. Contract: `_system/types.ts` —
 * each render is a named top-level function so the loader can slice its source.
 *
 * A server module: every prop below is a string or a number, so the field, its
 * name, its role description and both stepper names are in the served bytes.
 *
 * ── WHY NO EXAMPLE HERE STARTS WITH A VALUE, AND THAT IS DELIBERATE ─────────
 *
 * Under the previous engine the locale came from a provider, so one wrapper at
 * the root of the page made every number field render ۱۲۳ and parse it back.
 * The current engine has no locale context: `locale` is a per-component option
 * that defaults to the RUNTIME locale — the build machine's on the server, the
 * browser's on the client — and the number field's own root even suppresses the
 * hydration warning, which removes the one signal React would have given.
 *
 * Lumo does not add a required `locale` prop here, because that would change a
 * frozen public API. The honest consequence is that a value the component
 * FORMATS may not be in the reader's numerals, so these examples start empty
 * and let the reader type — what you type is what you see. `Num`, `Slider` and
 * `Steps` all take `locale` and are the components to reach for when a number
 * has to be RENDERED rather than entered.
 */

const t = {
  quantity: { "fa-IR": "تعداد", "en-US": "Quantity" },
  quantityUp: { "fa-IR": "افزایش تعداد", "en-US": "Increase the quantity" },
  quantityDown: { "fa-IR": "کاهش تعداد", "en-US": "Decrease the quantity" },
  quantityHelp: {
    "fa-IR": "برای هر سفارش دست‌کم یک عدد و حداکثر ده عدد.",
    "en-US": "At least one and at most ten per order.",
  },

  guests: { "fa-IR": "تعداد مهمان", "en-US": "Number of guests" },
  guestsUp: { "fa-IR": "افزایش تعداد مهمان", "en-US": "Increase the number of guests" },
  guestsDown: { "fa-IR": "کاهش تعداد مهمان", "en-US": "Decrease the number of guests" },
  guestsHelp: {
    "fa-IR": "کلیدهای بالا و پایین هم همین کار را می‌کنند.",
    "en-US": "The up and down arrow keys do the same thing.",
  },

  price: { "fa-IR": "قیمت واحد", "en-US": "Unit price" },
  priceUp: { "fa-IR": "افزایش قیمت واحد", "en-US": "Increase the unit price" },
  priceDown: { "fa-IR": "کاهش قیمت واحد", "en-US": "Decrease the unit price" },
  priceHelp: {
    "fa-IR": "به تومان. جداکنندهٔ هزارگان خودش گذاشته می‌شود.",
    "en-US": "In toman. The thousands separator is inserted for you.",
  },

  discount: { "fa-IR": "درصد تخفیف", "en-US": "Discount percentage" },
  discountUp: { "fa-IR": "افزایش درصد تخفیف", "en-US": "Increase the discount percentage" },
  discountDown: { "fa-IR": "کاهش درصد تخفیف", "en-US": "Decrease the discount percentage" },
  discountError: {
    "fa-IR": "تخفیف بیشتر از نیمِ قیمت نیاز به تأیید مدیر دارد.",
    "en-US": "A discount over half the price needs a manager's approval.",
  },

  seats: { "fa-IR": "تعداد صندلی", "en-US": "Seats" },
  seatsUp: { "fa-IR": "افزایش تعداد صندلی", "en-US": "Increase the seats" },
  seatsDown: { "fa-IR": "کاهش تعداد صندلی", "en-US": "Decrease the seats" },

  roleDescription: { "fa-IR": "فیلد عددی", "en-US": "Number field" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <NumberField
      className="max-w-xs"
      label={t.quantity[l]}
      description={t.quantityHelp[l]}
      decrementLabel={t.quantityDown[l]}
      incrementLabel={t.quantityUp[l]}
      roleDescription={t.roleDescription[l]}
    />
  );
}

function BoundsExample(l: Locale) {
  return (
    <NumberField
      className="max-w-xs"
      label={t.guests[l]}
      description={t.guestsHelp[l]}
      decrementLabel={t.guestsDown[l]}
      incrementLabel={t.guestsUp[l]}
      roleDescription={t.roleDescription[l]}
      minValue={1}
      maxValue={8}
    />
  );
}

function CurrencyExample(l: Locale) {
  return (
    <NumberField
      className="max-w-xs"
      label={t.price[l]}
      description={t.priceHelp[l]}
      decrementLabel={t.priceDown[l]}
      incrementLabel={t.priceUp[l]}
      roleDescription={t.roleDescription[l]}
      minValue={0}
      step={5000}
      formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <NumberField
      className="max-w-xs"
      label={t.discount[l]}
      errorMessage={t.discountError[l]}
      decrementLabel={t.discountDown[l]}
      incrementLabel={t.discountUp[l]}
      roleDescription={t.roleDescription[l]}
      minValue={0}
      maxValue={100}
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex max-w-xs flex-col gap-4">
      <NumberField
        size="sm"
        label={t.seats[l]}
        decrementLabel={t.seatsDown[l]}
        incrementLabel={t.seatsUp[l]}
        roleDescription={t.roleDescription[l]}
      />
      <NumberField
        size="lg"
        label={t.seats[l]}
        decrementLabel={t.seatsDown[l]}
        incrementLabel={t.seatsUp[l]}
        roleDescription={t.roleDescription[l]}
      />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    title: { "fa-IR": "ورودی عددی", "en-US": "Number field" },
    intro: {
      "fa-IR":
        "یک ورودی عدد با دو دکمهٔ پله. سه رشته اجباری‌اند و هر سه جایی می‌نشینند که موتور واژهٔ انگلیسیِ خودش را می‌نوشت: نام دکمهٔ کاهش، نام دکمهٔ افزایش، و توضیحِ نقشِ خودِ ورودی. دو دکمه روی محور بلوکی روی هم چیده شده‌اند نه کنار هم، و این یک تصمیم است نه سلیقه: جفتِ افقی «کمتر سمت چپ است» را رمزگذاری می‌کند، که خوانشی چپ‌به‌راست از خطِ اعداد است — آینه‌اش کنید و یا جفت برعکس می‌شود یا معنا. بالا در هر دو خط یعنی بیشتر.",
      "en-US":
        "A number input with two stepper buttons. Three strings are required, and each sits exactly where the engine would otherwise write its own English word: the decrement's name, the increment's name and the input's own role description. The two buttons are stacked on the BLOCK axis rather than placed side by side, and that is a decision rather than a taste: a horizontal pair encodes «less is to the left», which is a left-to-right reading of a number line — mirror it and either the pair reverses or the meaning does. Up is more in both scripts.",
    },
    composition: [
      `<NumberField`,
      `  label                ← REQUIRED`,
      `  decrementLabel       ← REQUIRED: the engine writes an English verb here`,
      `  incrementLabel       ← REQUIRED: same`,
      `  roleDescription      ← REQUIRED: aria-roledescription on the input`,
      `  minValue maxValue step formatOptions`,
      `  description errorMessage size isDisabled />`,
    ].join("\n"),
    parts: [
      {
        name: "NumberField",
        description: {
          "fa-IR":
            "کل میدان: برچسب، یک گروه که ورودی و دو پله را یک واحد می‌کند، و متن راهنما. سه رشتهٔ اجباری از راه فهرستِ رشته‌های موتور نمی‌گذرند و این عمدی است — قاعدهٔ آن فهرست «ویژگیِ صریح، وگرنه فهرست» است، و ویژگیِ اجباری همیشه صریح است، پس فهرست هرگز اینجا شلیک نمی‌کند.",
          "en-US":
            "The whole field: the label, a group that makes the input and its two steppers one unit, and the help text. The three required strings deliberately do NOT go through the engine's string catalogue — its rule is «explicit prop, else catalogue», and a required prop is always explicit, so the catalogue could never fire here.",
        },
      },
      {
        name: "numberInputVariants",
        description: {
          "fa-IR":
            "شکلِ ورودی. حاشیهٔ نامعتبرش را از یک پرشِ گروهی می‌خواند نه از ویژگیِ خودش، چون موتور data-invalid را فقط روی ریشه می‌گذارد و روی هیچ عنصر دیگری — همان فایل، دو حالت، دو بردِ متفاوت. این ویرایش یک تغییرِ ساختاری است نه تغییرِ نام، و همین تفاوت است که شمردنش ارزش دارد.",
          "en-US":
            "The input's shape. Its invalid border is read across a GROUP HOP rather than from its own attribute, because the engine puts `data-invalid` on the root and on nothing else — same file, two states, two different reaches. That edit is structural rather than a rename, and the distinction is the whole point of counting it.",
        },
      },
      {
        name: "stepperVariants",
        description: {
          "fa-IR":
            "یک دکمهٔ پله. ستونِ دو دکمه با ویژگی‌های منطقی به لبهٔ پایانِ خواندن سنجاق شده، پس در فارسی سمت چپِ جعبه می‌نشیند بی‌آنکه قاعده‌ای وارونه شود.",
          "en-US":
            "One stepper button. The column of two is pinned to the reading END with logical insets, so it sits on the left of the box in Persian with no rule to reverse.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "سه رشتهٔ اجباری", "en-US": "The three required strings" },
      description: {
        "fa-IR":
          "هر سه ویژگی جایی می‌نشینند که موتور بدون آن‌ها واژهٔ انگلیسی می‌گذارد: دو فعل روی دکمه‌های پله و یک توضیحِ نقش روی خودِ ورودی. هر سه در بایتِ اول‌اند، پس اعلامِ درست به هیدراسیون وابسته نیست.",
        "en-US":
          "All three props sit where the engine would otherwise put an English word: two bare verbs on the stepper buttons and a role description on the input itself. All three are in the first byte, so the correct announcement does not depend on hydration.",
      },
      render: BasicExample,
    },
    {
      id: "bounds",
      title: { "fa-IR": "کف و سقف", "en-US": "A floor and a ceiling" },
      description: {
        "fa-IR":
          "به مرز که برسید دکمهٔ همان سمت غیرفعال می‌شود — و کلیدهای بالا و پایین هم همان‌جا می‌ایستند، چون هر دو یک حالت را می‌خوانند. تایپِ عددِ بیرونِ بازه هنگام خروج از میدان به مرز برمی‌گردد نه اینکه رد شود، که تنها رفتاری است که ورودیِ نیمه‌نوشته را از بین نمی‌برد.",
        "en-US":
          "Reach a bound and that side's button goes disabled — and the arrow keys stop there too, because both read the same state. Typing a number outside the range clamps it on blur rather than rejecting it, which is the only behaviour that does not destroy a half-typed entry.",
      },
      render: BoundsExample,
    },
    {
      id: "grouping",
      title: { "fa-IR": "جداکنندهٔ هزارگان و پلهٔ بزرگ", "en-US": "Grouping and a big step" },
      description: {
        "fa-IR":
          "formatOptions هم به نمایش و هم به تجزیه داده می‌شود، پس آنچه می‌بینید همان چیزی است که دوباره خوانده می‌شود. پلهٔ بزرگ برای مبلغ درست است: پله‌ای به اندازهٔ یک، یک قیمت را به کاری بی‌پایان تبدیل می‌کند.",
        "en-US":
          "`formatOptions` feeds both the display and the parsing, so what you see is what is read back. A large step is right for a price: a step of one turns entering an amount into an endless task.",
      },
      render: CurrencyExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر، و یک شکافِ نوشته‌شده", "en-US": "Invalid, and a recorded gap" },
      description: {
        "fa-IR":
          "دادن errorMessage ریشه را نامعتبر علامت می‌زند و حاشیهٔ ورودی از راه همان پرشِ گروهی قرمز می‌شود. شکافِ صادقانه هم همین‌جاست: عنصرِ خطا هنوز از خانوادهٔ موتورِ قبلی است و بدون زمینهٔ آن هیچ نمی‌سازد، پس پیام به aria-describedby ورودی وصل نیست — یک ارجاعِ آویزان از پیامِ افتاده بدتر بود، و این یکی نوشته شده است.",
        "en-US":
          "Supplying errorMessage marks the root invalid and the input's border turns red across that same group hop. The honest gap is here too: the error element still belongs to the previous engine's family and renders nothing without its context, so the message is not wired into the input's aria-describedby — a dangling reference would be worse than a dropped message, and this one is written down.",
      },
      render: InvalidExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "دو اندازه", "en-US": "Two sizes" },
      description: {
        "fa-IR":
          "جای خالیِ رزروشده برای ستونِ پله‌ها در هر دو اندازه یکسان است، پس عددِ بلند در اندازهٔ کوچک هم زیر دکمه‌ها نمی‌رود. خودِ دکمه‌ها با جعبه بزرگ می‌شوند تا هدفِ لمسی در اندازهٔ بزرگ‌تر واقعاً بزرگ‌تر باشد.",
        "en-US":
          "The inline space reserved for the stepper column is the same at both sizes, so a long number does not slide under the buttons at the small one. The buttons themselves grow with the box, so the touch target is genuinely larger at the larger size.",
      },
      render: SizesExample,
    },
  ],
};
