import type { Locale } from "@lumo-ui/core";
import { DateInputIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the date-input page. Contract: `_system/types.ts`.
 *
 * ISLANDS, unavoidably: this component is handed a STATE OBJECT built by
 * `useDateFieldState` or `useTimeFieldState`, a hook cannot run during the RSC
 * pass, and the state carries `cycle`, `setSegment` and `clearSegment` — three
 * functions. The copy lives HERE in both locales.
 *
 * ═══ THE KEYBOARD MODEL IS THE ENTIRE COMPONENT ═════════════════════════════
 *
 *     Arrow up / down     cycle this segment inside its own unit, wrapping
 *     Arrow along the     move to the next / previous segment — and WHICH key
 *       inline axis       that is depends on the direction
 *     Digits              type-to-fill, in either numbering system
 *     Backspace / Delete  clear this segment
 *     Home / End          first / last segment
 *
 * ── AND THE ARROW ROW IS WHY THE FILE EXISTS ────────────────────────────────
 *
 * On a Persian page the segments run right to left, so ArrowLeft moves to the
 * NEXT segment and ArrowRight to the previous one. Hard-coding the Latin
 * mapping renders correctly, type-checks, and is wrong for every user of this
 * library. It is resolved from `direction(locale)` — the same source of truth
 * the sortable rows and the data grid's arrow geometry read.
 *
 * Home and End are NOT mirrored, deliberately: they mean «first» and «last» in
 * reading order, and reading order is what already flipped. Mirroring them too
 * would flip it back.
 *
 * ── WHY THIS FILE IS THE UNBLOCKING ONE ─────────────────────────────────────
 *
 * The segmented input used to be written inline inside the date field, so it
 * was unreachable: the time field and both pickers still imported the older
 * engine's segment renderer, and the library shipped TWO segmented inputs with
 * different keyboard behaviour. A picker CONTAINS a date input, so the input
 * has to be a part before anything containing one can move.
 *
 * ── WHAT A SEGMENT IS TO A SCREEN READER ────────────────────────────────────
 *
 * `role="spinbutton"`, which is what makes a value changed under an arrow key
 * be announced as a NEW value rather than as the text being read again.
 * `aria-valuenow` is required by the spec to be a decimal number, so it is the
 * one announced value in this library that must stay Latin; `aria-valuetext` is
 * the override that makes it audible in Persian anyway. The served bytes read
 * `aria-valuetext="۱۹"` beside `aria-valuenow="19"` rather than either alone.
 */

const t = {
  departure: { "fa-IR": "تاریخ حرکت", "en-US": "Departure date" },
  meeting: { "fa-IR": "ساعت جلسه", "en-US": "Meeting time" },
  duration: { "fa-IR": "مدت ضبط", "en-US": "Recording length" },
  compact: { "fa-IR": "تاریخ فشرده", "en-US": "Compact date" },
  roomy: { "fa-IR": "تاریخ درشت", "en-US": "Roomy date" },
  issued: { "fa-IR": "تاریخ صدور", "en-US": "Issue date" },
} satisfies Record<string, LocalizedText>;

function DateExample(l: Locale) {
  return <DateInputIsland locale={l} label={t.departure[l]} />;
}

function TimeExample(l: Locale) {
  return (
    <DateInputIsland
      locale={l}
      kind="time"
      label={t.meeting[l]}
      hourCycle={12}
      defaultTime={{ hour: 14, minute: 30, second: 0 }}
    />
  );
}

function SecondsExample(l: Locale) {
  return (
    <DateInputIsland
      locale={l}
      kind="time"
      label={t.duration[l]}
      granularity="second"
      hourCycle={24}
      defaultTime={{ hour: 9, minute: 5, second: 42 }}
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-col gap-4">
      <DateInputIsland locale={l} size="sm" label={t.compact[l]} />
      <DateInputIsland locale={l} size="lg" label={t.roomy[l]} />
    </div>
  );
}

function ReadOnlyExample(l: Locale) {
  return <DateInputIsland locale={l} isReadOnly label={t.issued[l]} />;
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ساختن سطح تاریخ یا ساعت خودتان: ورودی بخش‌بندی‌شده و مستقل از حالت که همهٔ انتخابگرهای این کتابخانه روی آن سوارند.",
        "en-US": "Building your own date or time surface: the segmented, state-agnostic input every picker in this library already sits on.",
      },
      whenNot: {
        "fa-IR": "فیلد تاریخ آماده — `DateField`. ساعت — `TimeField`. فیلدی با تقویم پشت دکمه — `DatePicker`.",
        "en-US": "A finished date field — `DateField`. A time — `TimeField`. A field with a calendar behind a button — `DatePicker`.",
      },
    },
    tier: "form",
    isNew: true,
    title: { "fa-IR": "ورودی بخش‌بخش تاریخ", "en-US": "Date input" },
    intro: {
      "fa-IR":
        "ورودیِ بخش‌بخش — یک بار، برای همهٔ سطح‌های تاریخِ کتابخانه. تمامش دربارهٔ صفحه‌کلید است: کلید بالا و پایین بخش را در واحدِ خودش می‌چرخاند، کلیدهای محورِ درون‌خطی میان بخش‌ها می‌روند و اینکه کدام کلید جلو می‌بَرد از direction(locale) حل می‌شود و نه نوشته شده — روی صفحهٔ فارسی کلید چپ به بخشِ بعدی می‌رود. خانه و پایان عمداً آینه نمی‌شوند، چون «اول» و «آخر» در ترتیبِ خواندن‌اند و ترتیبِ خواندن پیش‌تر برگشته. عمداً از حالت بی‌خبر است: هم قلابِ تاریخ و هم قلابِ ساعت یک شکلِ یکسان برمی‌گردانند و این پرونده نمی‌فهمد کدام را گرفته.",
      "en-US":
        "THE segmented input — written once, for every date surface in the library. All of it is the keyboard: arrow up and down cycle a segment inside its own unit, the inline-axis arrows move between segments, and WHICH key moves forward is resolved from `direction(locale)` rather than written down — on a Persian page ArrowLeft goes to the NEXT segment. Home and End are deliberately not mirrored, because «first» and «last» are in reading order and reading order is what already flipped. It is state-AGNOSTIC: the date hook and the time hook return the same shape and this file cannot tell which it was handed.",
    },
    composition: [
      `const state = useDateFieldState({ locale, value, onChange })`,
      `// …or useTimeFieldState({ locale, granularity, hourCycle })`,
      ``,
      `<DateInput state locale labelId    ← labelId is an IDREF, not a string`,
      `           describedBy size bare`,
      `           isDisabled isReadOnly isInvalid />`,
    ].join("\n"),
    parts: [
      {
        name: "DateInput",
        description: {
          "fa-IR":
            "یک role=\"group\" از چند spinbutton. labelId اجباری است و یک ارجاعِ شناسه است و نه یک رشته، چون برچسب عنصرِ واقعی و دیدنی‌ای است که فراخواننده پیش‌تر رندر کرده — و قاعدهٔ resolved-idrefs در دروازه، ساخت را می‌شکند اگر آن ارجاع به هیچ اشاره کند. locale پاس داده می‌شود و از context خوانده نمی‌شود: یک پیکربند پیش‌تر تاریخ را در دست دارد و دو خواندن از یک واقعیت همان است که به اختلاف می‌رسد.",
          "en-US":
            "A `role=\"group\"` of spinbuttons. `labelId` is required and is an IDREF rather than a string, because the label is a real, visible element the caller has already rendered — and the gate's `resolved-idrefs` rule fails the build if the reference points at nothing. `locale` is passed rather than read from a context: a picker already has it in hand, and two reads of one fact is how they come to disagree.",
        },
      },
      {
        name: "useDateFieldState",
        description: {
          "fa-IR":
            "موتورِ تاریخ. سیستمِ تقویم را از خودِ locale می‌گیرد و نه از یک ثابت، پس یک فیلدِ خالی روی مسیر فارسی پیش از هر مقداری جلالی است — حالتی که یک پیش‌فرضِ میلادی، ششصد و بیست‌ویک سال بی‌صدا اشتباه می‌کند. قاعدهٔ سال کبیسه هم اینجاست و نه در گرداننده کلید.",
          "en-US":
            "The date engine. It takes the calendar SYSTEM from the locale rather than from a constant, so an empty field on the Persian route is already Jalali before any value exists — the case a Gregorian default gets wrong invisibly, by 621 years. The leap rule lives here too, not in a key handler.",
        },
      },
      {
        name: "useTimeFieldState",
        description: {
          "fa-IR":
            "موتورِ ساعت، با همان شکلِ بازگشتی. ریزدانگی پیش‌فرض تا دقیقه است، چون بخشِ ثانیه‌ای که کسی نخواسته یک ایستِ تبِ چهارم روی هر فیلدِ ساعت است. رشته‌های قبل و بعد‌ازظهر را از Intl می‌خواند، پس همان‌ها هستند که کاربر می‌بیند و همان‌ها که با حرف تایپ می‌شوند.",
          "en-US":
            "The time engine, with the same return shape. Granularity defaults to the minute, because a seconds segment nobody asked for is a fourth tab stop on every time field. It reads the day-period words out of `Intl`, so the strings a reader sees are the strings a typed letter matches.",
        },
      },
      {
        name: "dateSegmentVariants",
        description: {
          "fa-IR":
            "یک بخشِ ویرایش‌پذیر. حالتِ جای‌نگه‌دار، فوکوس، نامعتبر و ازکارافتاده همه از ویژگی‌های داده‌ای می‌آیند و نه از انتخابگرهای شبه‌کلاسی، پس هر چهار حالت در بایت اول هم قابلِ سبک‌دهی‌اند.",
          "en-US":
            "One editable segment. The placeholder, focused, invalid and disabled states all come from data attributes rather than pseudo-class selectors, so all four are styleable in the first byte too.",
        },
      },
      {
        name: "dateLiteralVariants",
        description: {
          "fa-IR":
            "جداکننده‌ها — اسلش، دونقطه — که aria-hidden اند. آن‌ها ویرایش‌پذیر نیستند و در پیمایشِ بخش‌ها هم شمرده نمی‌شوند؛ خواندنشان بلند فقط میان دو عدد نویز است.",
          "en-US":
            "The separators — slashes, colons — which are `aria-hidden`. They are not editable and do not count in the segment traversal; read aloud they are only noise between two numbers.",
        },
      },
      {
        name: "dateInputVariants",
        description: {
          "fa-IR":
            "جعبهٔ حاشیه‌دار در سه اندازه. با bare کاملاً کنار گذاشته می‌شود، برای فراخواننده‌ای که جعبهٔ خودش را دارد — یک پیکربند بخش‌ها و دکمهٔ بازکننده را در یک گروهِ حاشیه‌دار می‌پیچد، و دو حاشیهٔ تودرتو دقیقاً همان است که بدون این ویژگی دیده می‌شود.",
          "en-US":
            "The bordered box in three sizes. `bare` drops it entirely, for a caller that supplies its own — a picker wraps the segments and a trigger button in one bordered group, and two nested borders is what that looks like without the prop.",
        },
      },
    ],
  },
  examples: [
    {
      id: "date",
      title: { "fa-IR": "کلیدی که در دو زبان دو کار می‌کند", "en-US": "The key that does two different things" },
      description: {
        "fa-IR":
          "روی یکی از بخش‌ها بایستید و کلیدهای جهت را بزنید. روی مسیر فارسی کلید چپ به بخشِ بعدی می‌رود و کلید راست به قبلی؛ روی مسیر انگلیسی برعکس. حالا رقم تایپ کنید: ارقام درونِ یک بخش جمع می‌شوند تا وقتی که رقمِ بعدی از کرانِ آن بخش بگذرد، و آن‌وقت فوکوس خودش جلو می‌رود — «۱۹» روی روز می‌نشیند و می‌رود، «۴» بی‌درنگ می‌رود چون چهل روزِ ماه نیست. کلیدهای خانه و پایان هم آینه نمی‌شوند.",
        "en-US":
          "Land on a segment and press the arrow keys. On the Persian route ArrowLeft moves to the NEXT segment and ArrowRight to the previous one; on the English route it is the other way. Now type digits: they accumulate inside one segment until the next would overflow its bound, and then focus advances on its own — «۱۹» lands on the day and moves on, «۴» moves on immediately because 40 cannot be a day. Home and End are not mirrored.",
      },
      render: DateExample,
    },
    {
      id: "time",
      title: { "fa-IR": "بخشی که رقم نمی‌گیرد", "en-US": "The segment that takes no digits" },
      description: {
        "fa-IR":
          "«قبل‌ازظهر» شکلِ عددی ندارد، پس رقم آنجا بی‌معناست و نادیده گرفته می‌شود به‌جای آنکه به صفر یا یک تبدیل شود. چیزی که می‌گیرد حرفِ اولِ هرکدام از دو دوره است، در خطِ خودِ خواننده و خوانده‌شده از متنِ همان بخش — پس کاربرِ فارسی «ق» یا «ب» می‌زند و کاربرِ انگلیسی A یا P، بی‌آنکه این پرونده هیچ‌کدام از دو الفبا را بشناسد.",
        "en-US":
          "«قبل‌ازظهر» has no numeric form, so a digit there is meaningless and is ignored rather than coerced into 0 or 1. What it does take is the first LETTER of either period, in the reader's own script and read off the segment's own rendered text — so a Persian user presses «ق» or «ب» and an English one presses A or P, with this file knowing neither alphabet.",
      },
      render: TimeExample,
    },
    {
      id: "seconds",
      title: { "fa-IR": "ریزدانگی، و ساعتی که بازنویسی شده", "en-US": "Granularity, and an overridden clock" },
      description: {
        "fa-IR":
          "با ریزدانگیِ ثانیه یک بخشِ چهارم اضافه می‌شود و با ساعتِ بیست‌وچهاره بخشِ دوره‌ی روز کاملاً می‌رود — پس تعدادِ ایست‌های صفحه‌کلید با این دو ویژگی عوض می‌شود و نه فقط ظاهر. پیش‌فرض تا دقیقه است، چون بخشِ ثانیه‌ای که کسی نخواسته یک ایستِ اضافه روی هر فیلدِ ساعت است.",
        "en-US":
          "Second granularity adds a fourth segment, and a 24-hour clock removes the day-period one entirely — so these two props change how many keyboard stops the field has, not only how it looks. The default stops at the minute, because a seconds segment nobody asked for is one more stop on every time field.",
      },
      render: SecondsExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "سه ارتفاع، همان مدل", "en-US": "Three heights, the same model" },
      description: {
        "fa-IR":
          "اندازه فقط جعبهٔ حاشیه‌دار و ارتفاعِ کنترل را عوض می‌کند؛ بخش‌ها، نقش‌ها و کلِ گرداننده‌ی صفحه‌کلید یکی می‌مانند. ارتفاع‌ها همان‌هایی‌اند که هر کنترلِ دیگرِ این کتابخانه دارد، پس یک ورودیِ تاریخ در یک ردیفِ فرم با فیلدِ کنارش هم‌تراز می‌ماند.",
        "en-US":
          "Size changes only the bordered box and the control height; the segments, the roles and the whole keyboard handler are identical. The heights are the ones every other control in this library shares, so a date input stays aligned with the field beside it in a form row.",
      },
      render: SizesExample,
    },
    {
      id: "read-only",
      title: { "fa-IR": "خواندنی، ولی همچنان یک کنترل", "en-US": "Readable, and still a control" },
      description: {
        "fa-IR":
          "با isReadOnly هر بخش aria-readonly می‌گیرد و کلیدها دیگر مقدارش را عوض نمی‌کنند — ولی بخش‌ها همچنان فوکوس‌پذیرند و همچنان نام و مقدارِ خودشان را اعلام می‌کنند. این با ازکارافتاده یکی نیست: «نمی‌توانید عوضش کنید» و «این اصلاً برای شما نیست» دو جملهٔ متفاوت‌اند.",
        "en-US":
          "`isReadOnly` gives every segment `aria-readonly` and the keys stop changing its value — but the segments stay focusable and keep announcing their own name and value. That is not the same as disabled: «you cannot change this» and «this is not for you at all» are two different sentences.",
      },
      render: ReadOnlyExample,
    },
  ],
};
