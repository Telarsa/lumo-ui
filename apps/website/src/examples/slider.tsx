import type { Locale } from "@lumo-ui/core";
import { Slider } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the slider page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * A server module: `locale` is a string union and every other prop is a number,
 * so the whole control — including the thumb's `aria-valuetext` — is in the
 * served bytes.
 *
 * ── A SLIDER RENDERS ITS VALUE TWICE, AND THEY MUST AGREE ───────────────────
 *
 * Once as visible text in the `<output>`, once as `aria-valuetext` on the hidden
 * range input. Under the previous engine only ONE of the two was reachable: a
 * passed `aria-valuetext` type-checked and was discarded, so the only lever was
 * a provider feeding the engine's own formatter. The current engine consults the
 * consumer's callback FIRST, which is the clearest win in the whole migration —
 * both numbers now come out of the same `formatNumber` call on the same value
 * and cannot drift.
 *
 * There is a new hole underneath that win, and it is why the callback is passed
 * unconditionally: left alone, a single-thumb slider emits NO `aria-valuetext`
 * at all — not English, not Latin digits, nothing — and a screen reader falls
 * back to reading the raw `aria-valuenow` in the USER AGENT's digits rather than
 * the page's. That is quieter than a Latin `40`: there is no string to grep for.
 *
 * ── AND ONE REGRESSION THIS COMPONENT PAYS FOR YOU ──────────────────────────
 *
 * Direction is no longer derived from the locale. The engine reads it from its
 * own provider and has no locale context at all, so `locale` and direction are
 * two independent props with two independent failure modes. This component
 * mounts the direction provider itself, from the same required `locale`, which
 * is the only way to keep one prop as the single source — otherwise a page could
 * set one and forget the other and slide Persian digits the wrong way, with
 * nothing red anywhere.
 */

const t = {
  budget: { "fa-IR": "بودجهٔ روزانه", "en-US": "Daily budget" },
  quality: { "fa-IR": "کیفیت تصویر خروجی", "en-US": "Export image quality" },
  price: { "fa-IR": "سقف قیمت", "en-US": "Price ceiling" },
  volume: { "fa-IR": "بلندی صدای اعلان", "en-US": "Notification volume" },
  seats: { "fa-IR": "تعداد صندلی طرح", "en-US": "Seats on the plan" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Slider
      className="max-w-sm"
      label={t.budget[l]}
      locale={l}
      minValue={0}
      maxValue={100}
      defaultValue={40}
    />
  );
}

function PercentExample(l: Locale) {
  return (
    <Slider
      className="max-w-sm"
      label={t.quality[l]}
      locale={l}
      minValue={0}
      maxValue={1}
      step={0.05}
      defaultValue={0.8}
      formatOptions={{ style: "percent" }}
    />
  );
}

function CurrencyExample(l: Locale) {
  return (
    <Slider
      className="max-w-sm"
      label={t.price[l]}
      locale={l}
      minValue={0}
      maxValue={5000000}
      step={250000}
      defaultValue={2000000}
      formatOptions={{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }}
    />
  );
}

function HiddenValueExample(l: Locale) {
  return (
    <Slider
      className="max-w-sm"
      label={t.volume[l]}
      locale={l}
      minValue={0}
      maxValue={10}
      defaultValue={7}
      hideValue
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <Slider
      className="max-w-sm"
      label={t.seats[l]}
      locale={l}
      minValue={1}
      maxValue={50}
      defaultValue={12}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    title: { "fa-IR": "لغزنده", "en-US": "Slider" },
    intro: {
      "fa-IR":
        "یک مقدار از یک بازه. locale اجباری است و راحتی نیست: تنها ورودیِ هر دو عددِ این کنترل است — آنکه دیده می‌شود و آنکه گفته می‌شود — و از وقتی موتور عوض شده، تنها ورودیِ جهتِ خواندن هم هست. انگشتی هم روی ریل نگه دارید و ببینید پُرشدگی از کدام لبه شروع می‌شود: در فارسی از راست، بدون هیچ کدِ آینه‌کننده‌ای، چون خودِ موتور به‌جای مقدارِ چپِ حل‌شده از ویژگیِ منطقیِ شروعِ درون‌خطی استفاده می‌کند.",
      "en-US":
        "One value chosen from a range. `locale` is required by design rather than by convenience: it is the only input to BOTH of this control's numbers — the one you see and the one you hear — and since the engine change it is also the only input to the reading direction. Drag the thumb and watch which edge the fill grows from: the right in Persian, with no mirroring code, because the engine sets a logical inline-start rather than a direction-resolved left.",
    },
    composition: [
      `<Slider`,
      `  label           ← REQUIRED: an unnamed range input announces as bare "slider"`,
      `  locale          ← REQUIRED: the output, the aria-valuetext AND the direction`,
      `  minValue maxValue step defaultValue`,
      `  formatOptions   ← feeds the visible output and aria-valuetext, so they cannot drift`,
      `  hideValue size isDisabled onChange onChangeEnd />`,
    ].join("\n"),
    parts: [
      {
        name: "Slider",
        description: {
          "fa-IR":
            "کل کنترل: ردیفِ نام و مقدار، ریل، پُرشدگی و دستگیره. نام هم روی ریشه و هم روی دستگیره نوشته می‌شود، چون عنصری که صفحه‌خوان واقعاً رویش می‌نشیند همان ورودیِ پنهانِ داخلِ دستگیره است.",
          "en-US":
            "The whole control: the name-and-value row, the rail, the fill and the thumb. The name is written on the root AND on the thumb, because the element a screen reader actually lands on is the hidden range input inside the thumb.",
        },
      },
      {
        name: "sliderTrackVariants",
        description: {
          "fa-IR":
            "ریلِ رنگ‌شده. سطحِ اشاره‌گر عنصرِ دیگری است؛ جدا نگه‌داشتنشان یعنی هدفِ کشیدن می‌تواند از خطِ نازکِ دیده‌شده بلندتر باشد بی‌آنکه ریل ضخیم شود.",
          "en-US":
            "The painted rail. The pointer surface is a separate element; keeping the two apart lets the drag target be taller than the hairline you see without thickening the rail.",
        },
      },
      {
        name: "sliderFillVariants",
        description: {
          "fa-IR":
            "بخشِ پُرشده. جای یک div دستی‌جاگذاشته را گرفته که همین کار را می‌کرد — حالا موتور خودش شروعِ درون‌خطی و اندازهٔ درون‌خطی را می‌نویسد، پس تنها جایی که این پرونده عددِ خام را به طولِ سی‌اس‌اس تبدیل می‌کرد از بین رفته.",
          "en-US":
            "The filled run. It replaces a hand-positioned div that did the same job — the engine now writes the inline-start and inline-size itself, so the one place this file turned a raw number into a CSS length is gone.",
        },
      },
      {
        name: "sliderThumbVariants",
        description: {
          "fa-IR":
            "دستگیره، که ایستِ فوکوس هم هست. aria-valuetext از یک فراخوانی می‌آید نه از یک رشتهٔ ثابت: فراخوانی مقدارِ خام را می‌گیرد، پس رشته از همان formatNumber بیرون می‌آید که متنِ دیده‌شده را ساخته و دو عدد بایت‌به‌بایت یکی‌اند.",
          "en-US":
            "The thumb, which is also the focus stop. Its `aria-valuetext` comes from a callback rather than a literal: the callback receives the raw value, so the string comes out of the same `formatNumber` that produced the visible output and the two are byte-identical.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "یک مقدار", "en-US": "One value" },
      description: {
        "fa-IR":
          "دستگیره را با کلیدهای جهت جابه‌جا کنید و به عددِ گوشه نگاه کنید: همان رشته‌ای که می‌بینید همان رشته‌ای است که اعلام می‌شود. ردیفِ بالا با justify-between چیده شده، پس نام لبهٔ شروعِ خواندن را می‌گیرد و مقدار لبهٔ پایان را، و در هر دو خط جایشان بدون هیچ وردی عوض می‌شود.",
        "en-US":
          "Move the thumb with the arrow keys and watch the figure in the corner: the string you see is the string that is announced. The row above is laid out with `justify-between`, so the name takes the reading start and the value the reading end, and the two swap in both scripts with no override.",
      },
      render: BasicExample,
    },
    {
      id: "percent",
      title: { "fa-IR": "درصد، با پلهٔ کسری", "en-US": "A percentage, with a fractional step" },
      description: {
        "fa-IR":
          "مقدارِ زیرین کسری بین صفر و یک است و آنچه خوانده می‌شود درصد است. همین چیزی است که formatOptions می‌خرد: قالب‌بندی یک بار تعریف می‌شود و هر دو عدد از آن می‌گذرند، پس هیچ راهی نیست که خروجیِ دیده‌شده درصد باشد و آنچه اعلام می‌شود عددِ خام.",
        "en-US":
          "The underlying value is a fraction between zero and one and what is read is a percentage. That is what `formatOptions` buys: the formatting is defined once and both numbers go through it, so there is no path by which the visible output is a percentage and the announced value is the raw fraction.",
      },
      render: PercentExample,
    },
    {
      id: "currency",
      title: { "fa-IR": "مبلغ، با پلهٔ درشت", "en-US": "An amount, with a coarse step" },
      description: {
        "fa-IR":
          "واحد پول هم از راه همان قالب‌بندی می‌آید، پس نامِ واحد در زبانِ خواننده نوشته می‌شود و نه به‌صورت یک واژهٔ لاتینِ چسبیده به رقمِ فارسی. پلهٔ درشت هم انتخابِ آگاهانه است: لغزنده‌ای با پنج میلیون گامِ یک‌واحدی با صفحه‌کلید عملاً کار نمی‌کند.",
        "en-US":
          "The currency comes through the same formatting, so the unit's name is written in the reader's language rather than as a Latin word glued to a Persian digit. The coarse step is a deliberate choice too: a slider with five million single-unit stops is unusable from a keyboard.",
      },
      render: CurrencyExample,
    },
    {
      id: "hide-value",
      title: { "fa-IR": "بدون خوانشِ دیداری", "en-US": "Without the visible read-out" },
      description: {
        "fa-IR":
          "hideValue ردیفِ نام و مقدار را برمی‌دارد و نه نام را: aria-valuetext هنوز روی دستگیره است و کنترل هنوز نام دارد. برای وقتی است که مقدار جای دیگری از رابط دیده می‌شود؛ برای صرفه‌جویی در فضا با حذفِ برچسب نیست.",
        "en-US":
          "`hideValue` removes the name-and-value row and not the NAME: the aria-valuetext is still on the thumb and the control is still named. It is for when the value is shown elsewhere in the interface, not for saving space by dropping the label.",
      },
      render: HiddenValueExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR":
          "ریل و دستگیره هر دو data-disabled می‌گیرند، پس رنگِ کم‌جان از یک ویژگی می‌آید و نه از دو قاعدهٔ جدا که می‌توانند از هم جدا بیفتند. مقدار همچنان دیده و اعلام می‌شود: یک کنترلِ قفل‌شده هنوز چیزی برای گفتن دارد.",
        "en-US":
          "The rail and the thumb both take `data-disabled`, so the muted colour comes from one attribute rather than from two rules that can drift apart. The value is still shown and still announced: a locked control still has something to say.",
      },
      render: DisabledExample,
    },
  ],
};
