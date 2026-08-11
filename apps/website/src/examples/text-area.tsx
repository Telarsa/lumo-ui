import type { Locale } from "@lumo-ui/core";
import { TextArea } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the text-area page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * A server module: every prop below is a string or a number, so these prerender
 * and the gate grades a Persian control rather than an empty box.
 *
 * ── THE ARGUMENT THIS PAGE IS MAKING ────────────────────────────────────────
 *
 * A textarea is a text field whose control happens to be a `<textarea>`, so the
 * label, description and error wiring is identical and only the inner element
 * changes. Neither engine ships a separate textarea component; the element swap
 * is the `render` prop on the field control, which keeps every piece of field
 * behaviour — validity, disabled, the filled/dirty/touched tracking, the form
 * value — instead of re-implementing them beside it. Under the previous engine
 * the two WERE separate implementations, and they had already drifted.
 */

const t = {
  bio: { "fa-IR": "دربارهٔ من", "en-US": "About me" },
  bioPlaceholder: {
    "fa-IR": "در چند خط بنویسید چه کاری انجام می‌دهید.",
    "en-US": "In a few lines, say what you do.",
  },

  address: { "fa-IR": "نشانی پستی", "en-US": "Postal address" },
  addressHelp: {
    "fa-IR": "خیابان، کوچه، پلاک و واحد را در خطهای جدا بنویسید.",
    "en-US": "Put the street, the alley, the number and the unit on separate lines.",
  },

  reason: { "fa-IR": "دلیل مرجوع کردن", "en-US": "Reason for the return" },
  reasonError: {
    "fa-IR": "دلیل مرجوع کردن نباید خالی بماند.",
    "en-US": "The reason for the return cannot be left empty.",
  },

  release: { "fa-IR": "یادداشت انتشار", "en-US": "Release note" },
  releaseHelp: {
    "fa-IR": "گوشهٔ پایین را بگیرید و بکشید؛ فقط ارتفاع تغییر می‌کند.",
    "en-US": "Drag the bottom corner; only the height changes.",
  },

  note: { "fa-IR": "یادداشت داخلی", "en-US": "Internal note" },
  noteValue: {
    "fa-IR": "این سفارش پیش از تغییر سیاست مرجوعی ثبت شده است.",
    "en-US": "This order was placed before the returns policy changed.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <TextArea
      className="w-full max-w-sm"
      label={t.bio[l]}
      placeholder={t.bioPlaceholder[l]}
    />
  );
}

function RowsExample(l: Locale) {
  return (
    <TextArea
      className="w-full max-w-sm"
      label={t.address[l]}
      description={t.addressHelp[l]}
      rows={6}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <TextArea
      className="w-full max-w-sm"
      label={t.reason[l]}
      errorMessage={t.reasonError[l]}
      rows={3}
    />
  );
}

function ResizeExample(l: Locale) {
  return (
    <TextArea
      className="w-full max-w-sm"
      label={t.release[l]}
      description={t.releaseHelp[l]}
      rows={3}
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <TextArea
      className="w-full max-w-sm"
      label={t.note[l]}
      defaultValue={t.noteValue[l]}
      rows={3}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    title: { "fa-IR": "ناحیهٔ متن", "en-US": "Text area" },
    intro: {
      "fa-IR":
        "میدان متنِ چندخطی. ارتفاعش یک کفِ رشدپذیر است نه یک قدِ ثابت، و همین تنها چیزی است که آن را از ورودی تک‌خطی جدا می‌کند — به همین دلیل هم استایلش از آن یکی به ارث نمی‌رسد. تغییر اندازه فقط روی محور بلوکی باز است: کشیدنِ عرض به دستِ کاربر داخل یک ظرف راست‌به‌چپ رفتاری است که هر مرورگر جور دیگری انجام می‌دهد. فاصلهٔ عمودی هم عمداً کمتر از فاصلهٔ افقی است، چون قالبِ فارسی خودش ارتفاع خط بلندتری می‌آورد.",
      "en-US":
        "A multi-line text field. Its height is a growable MINIMUM rather than a fixed control height, which is the one property that separates it from the single-line input — and the reason it does not inherit that input's styling. Resizing is open on the block axis only: a user-dragged inline resize inside a right-to-left container is browser-dependent. The vertical padding is deliberately smaller than the inline padding, because the Persian type ramp already brings a taller line height.",
    },
    composition: [
      `<TextArea`,
      `  label            ← REQUIRED string: an unnamed field is a defect`,
      `  rows             ← 4 by default; the browser's own 2 is rarely right`,
      `  description`,
      `  errorMessage     ← supplying one marks the field invalid`,
      `  placeholder isDisabled isReadOnly`,
      `  textAreaClassName />`,
    ].join("\n"),
    parts: [
      {
        name: "TextArea",
        description: {
          "fa-IR":
            "کل میدان: برچسب، جعبهٔ چندخطی، متن راهنما و خطا. rows روی خودِ عنصرِ رندرشده می‌نشیند نه روی کنترلِ میدان، چون ویژگی‌های کنترل بر پایهٔ input تایپ شده‌اند و rows یکی از آن‌ها نیست — فرستادنش به سمتِ اشتباه خطای کامپایل می‌دهد، که همان نتیجه‌ای است که ارزش داشتن دارد.",
          "en-US":
            "The whole field: label, multi-line box, help text and error. `rows` goes on the RENDERED element rather than on the field control, because the control's props are typed against `<input>` and `rows` is not one of them — passing it to the wrong side is a compile error, which is the outcome worth having.",
        },
      },
      {
        name: "textAreaVariants",
        description: {
          "fa-IR":
            "شکلِ جعبه. عمداً یک وردِ اندازه روی استایلِ ورودی تک‌خطی نیست: آن یکی قدِ ثابت از توکن‌های چگالی می‌گیرد و این یکی کفِ ارتفاع دارد، و اشتراکِ یک تعریف یعنی این دو در گروهِ ارتفاعِ ادغام‌گرِ کلاس‌ها با هم بجنگند.",
          "en-US":
            "The box itself. Deliberately not a size variant of the single-line input's cva: that one takes a fixed control height from the density tokens and this one takes a minimum, and sharing the definition would put the two in a fight inside the class merger's height group.",
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
          "چهار خط پیش‌فرض است، نه دوتای مرورگر: جعبه‌ای که فقط دو خط نشان می‌دهد به خواننده می‌گوید جواب کوتاهی خواسته شده، و کسی که پاراگراف می‌نویسد بلافاصله به پیمایش می‌افتد.",
        "en-US":
          "Four rows by default rather than the browser's two: a box that shows two lines tells the reader a short answer is wanted, and anyone writing a paragraph is scrolling immediately.",
      },
      render: BasicExample,
    },
    {
      id: "rows",
      title: { "fa-IR": "ارتفاع آغازین", "en-US": "The starting height" },
      description: {
        "fa-IR":
          "rows کفِ ارتفاع را جابه‌جا می‌کند نه سقف را — جعبه هنوز با کشیدن بزرگ می‌شود. متن راهنما با aria-describedby به همین کنترل وصل است و پیش از هر جاوااسکریپتی در بایتِ اول نشسته.",
        "en-US":
          "`rows` moves the FLOOR, not the ceiling — the box still grows when dragged. The help text is tied to this control with aria-describedby and sits in the first byte, before any JavaScript.",
      },
      render: RowsExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR":
          "errorMessage خودش میدان را نامعتبر می‌کند و data-invalid تا خودِ textarea پایین می‌آید، چون کنترل درون ریشهٔ میدان نشسته. حاشیهٔ قرمز از همان ویژگی می‌آید، نه از یک کلاسِ دستیِ کنارِ پیام.",
        "en-US":
          "errorMessage marks the field invalid on its own, and data-invalid reaches the `<textarea>` itself because the control sits inside the field root. The red border comes from that attribute rather than from a class hand-applied beside the message.",
      },
      render: InvalidExample,
    },
    {
      id: "resize",
      title: { "fa-IR": "فقط محور بلوکی", "en-US": "The block axis only" },
      description: {
        "fa-IR":
          "گوشهٔ کشیدن فقط ارتفاع را عوض می‌کند. محور بلوکی از جهتِ نوشتار اثر نمی‌گیرد، ولی تغییر اندازهٔ افقیِ کاربر داخل ظرفِ راست‌به‌چپ در هر مرورگر جور دیگری رفتار می‌کند — پس اصلاً باز نشده.",
        "en-US":
          "The drag corner changes the height and nothing else. The block axis is unaffected by writing direction, while a user-dragged inline resize inside a right-to-left container behaves differently in every browser — so it is simply not offered.",
      },
      render: ResizeExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال با مقدار", "en-US": "Disabled, with a value" },
      description: {
        "fa-IR":
          "متن خوانا می‌ماند: کم‌رنگ‌شدن روی پوششِ میدان است نه روی خودِ نوشته، پس چیزی که نمی‌شود عوضش کرد همچنان می‌شود خواندش. نشانگر از data-disabled می‌آید که موتور روی هر چهار عنصر می‌گذارد.",
        "en-US":
          "The text stays readable: the dimming is on the field wrapper rather than on the writing itself, so what cannot be changed can still be read. The styling comes from data-disabled, which the engine puts on all four elements.",
      },
      render: DisabledExample,
    },
  ],
};
