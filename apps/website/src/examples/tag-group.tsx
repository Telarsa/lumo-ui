import type { Locale } from "@lumo-ui/core";
import { TagGroup, TagItem, TagList } from "@lumo-ui/ui";
import { TagGroupIsland, type TagRow } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the tag-group page. Contract: `_system/types.ts`.
 *
 * MIXED, and the split is the component's own: the STATIC form takes only
 * strings and renders from a server module; the REMOVABLE form requires
 * `onRemove` AND `removeLabel` — two functions, which the union makes
 * inseparable — so those examples are islands. The copy lives here in both
 * locales either way.
 *
 * ── THE PIN THIS PAGE EXISTS TO CLOSE ───────────────────────────────────────
 *
 * This component's previous engine carried a defect described in its own header
 * as «verified unreachable»: each served row emitted a second id reference
 * pointing at nothing, because the id was only cleared inside a layout effect
 * and the props that could have claimed it were thrown away by the engine. It
 * failed the gate's resolved-idrefs rule on any prerendered Persian route, and
 * it was the stated reason the showcase site had NO tag-group demo at all.
 *
 * It is gone, and it needed no workaround to remove — there is no such id to
 * clear any more. This page is the consequence: the ledger entry can be closed
 * because the demo exists.
 *
 * ── TWO CAPABILITIES ARE GONE, AND BOTH ARE REAL ────────────────────────────
 *
 *  1. **Selection.** The props are REMOVED rather than accepted and ignored, so
 *     a consumer using them gets a compile error naming what no longer exists.
 *     If you need a selectable chip row, compose a list box — it is a listbox
 *     with a selected state, and that is what that widget is.
 *  2. **Delete on a focused tag.** The rows are not tab stops any more; the
 *     focusable element is the remove BUTTON, so removal is Enter or Space on a
 *     control that says what it does. A fair trade for a filter row, and a loss
 *     for a power user who had learned the Delete key.
 */

const t = {
  activeFilters: { "fa-IR": "فیلترهای فعال", "en-US": "Active filters" },
  removeWord: { "fa-IR": "حذف", "en-US": "Remove" },
  liftPhrase: { "fa-IR": " را بردارید", "en-US": ", lift this filter" },

  labels: { "fa-IR": "برچسب‌های این مسئله", "en-US": "Labels on this issue" },
  bug: { "fa-IR": "اشکال", "en-US": "Bug" },
  regression: { "fa-IR": "بازگشت اشکال", "en-US": "Regression" },
  rtl: { "fa-IR": "راست‌به‌چپ", "en-US": "Right-to-left" },
  needsDesign: { "fa-IR": "نیازمند طراحی", "en-US": "Needs design" },

  cities: { "fa-IR": "شهرهای انتخاب‌شده", "en-US": "Selected cities" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },

  skills: { "fa-IR": "مهارت‌های اعلام‌شده", "en-US": "Declared skills" },
  typography: { "fa-IR": "تایپوگرافی", "en-US": "Typography" },
  motion: { "fa-IR": "حرکت", "en-US": "Motion" },
  accessibility: { "fa-IR": "دسترس‌پذیری", "en-US": "Accessibility" },
} satisfies Record<string, LocalizedText>;

function cityRows(l: Locale): readonly TagRow[] {
  return [
    { id: "thr", text: t.tehran[l] },
    { id: "isf", text: t.isfahan[l] },
    { id: "shz", text: t.shiraz[l] },
    { id: "tbz", text: t.tabriz[l] },
  ];
}

function StaticExample(l: Locale) {
  return (
    <TagGroup label={t.labels[l]}>
      <TagList>
        <TagItem id="bug" textValue={t.bug[l]}>
          {t.bug[l]}
        </TagItem>
        <TagItem id="regression" textValue={t.regression[l]}>
          {t.regression[l]}
        </TagItem>
        <TagItem id="rtl" textValue={t.rtl[l]}>
          {t.rtl[l]}
        </TagItem>
        <TagItem id="design" textValue={t.needsDesign[l]}>
          {t.needsDesign[l]}
        </TagItem>
      </TagList>
    </TagGroup>
  );
}

function RemovableExample(l: Locale) {
  return (
    <TagGroupIsland
      label={t.activeFilters[l]}
      tags={cityRows(l)}
      removePrefix={`${t.removeWord[l]} `}
    />
  );
}

function WordOrderExample(l: Locale) {
  return (
    <TagGroupIsland
      label={t.cities[l]}
      tags={cityRows(l)}
      removeSuffix={t.liftPhrase[l]}
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-col gap-4">
      <TagGroup label={t.skills[l]}>
        <TagList>
          <TagItem id="type" size="sm" textValue={t.typography[l]}>
            {t.typography[l]}
          </TagItem>
          <TagItem id="motion" size="sm" textValue={t.motion[l]}>
            {t.motion[l]}
          </TagItem>
          <TagItem id="a11y" size="sm" textValue={t.accessibility[l]}>
            {t.accessibility[l]}
          </TagItem>
        </TagList>
      </TagGroup>
      <TagGroupIsland
        label={t.cities[l]}
        size="sm"
        tags={cityRows(l)}
        removePrefix={`${t.removeWord[l]} `}
      />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "display",
    title: { "fa-IR": "گروه برچسب", "en-US": "Tag group" },
    intro: {
      "fa-IR":
        "ردیفی از فیلترها، کلیدواژه‌ها یا مقدارهای انتخاب‌شده. دو شکل دارد و از دو عنصرِ کاملاً متفاوت ساخته می‌شود: شکلِ ایستا یک فهرست است — پس شمارش رایگان و به زبانِ خودِ خواننده از درختِ دسترس‌پذیری می‌آید و رشته‌ای لازم نیست — و شکلِ حذف‌شدنی یک نوار ابزار است، چون یک نوار ابزار دقیقاً همان مدلِ صفحه‌کلیدی است که ردیفی از دکمه‌های حذف لازم دارد. نوار ابزاری با هیچ‌چیزِ فوکوس‌پذیر درونش یک کنترلِ خالی است، پس شکلِ ایستا یکی نمی‌گیرد.",
      "en-US":
        "A row of filters, keywords or chosen values. It has two forms and is built from two completely different elements: the STATIC form is a list — so the count arrives in the accessibility tree for free, announced in the reader's own language, with no string to require — and the REMOVABLE form is a toolbar, because a toolbar is exactly the keyboard model a row of remove controls needs. A toolbar with nothing focusable in it is an empty control, so the static form does not get one.",
    },
    composition: [
      `<TagGroup label onRemove removeLabel>   ← the last two travel together or not at all`,
      `  <TagList>`,
      `    <TagItem id textValue size>…</TagItem>`,
      `  </TagList>`,
      `</TagGroup>`,
    ].join("\n"),
    parts: [
      {
        name: "TagGroup",
        description: {
          "fa-IR":
            "گروه. اجتماعِ تفکیک‌شده‌اش عمدی است: onRemove بدون removeLabel خطای تایپ است و removeLabel بدون onRemove اصلاً نمایاندنی نیست. label اجباری است و در شکلِ حذف‌شدنی نوار ابزار را نام می‌برد و در شکلِ ایستا فهرست را.",
          "en-US":
            "The group. Its discriminated union is deliberate: `onRemove` without `removeLabel` is a type error, and `removeLabel` without `onRemove` is unrepresentable. `label` is required and names the toolbar in the removable form and the list in the static one.",
        },
      },
      {
        name: "TagList",
        description: {
          "fa-IR":
            "ظرفِ چیپ‌ها. در شکلِ ایستا یک فهرستِ واقعی است و در شکلِ حذف‌شدنی یک جعبهٔ منعطفِ ساده — یک فهرست بینِ نوار ابزار و کنترل‌هایش، فرزندان را از جایی که مرکب انتظارشان را دارد بیرون می‌برد. کلیدِ اولین چیپ را هم می‌خواند و بازنشر می‌کند تا دقیقاً یکی از آن‌ها ایستِ تبیِ پیش از هیدراسیون را بردارد.",
          "en-US":
            "The chips' container. A real list in the static form and a plain flex box in the removable one — a list between the toolbar and its controls would move the children out of where the composite expects them. It also reads the first chip's key and republishes it, so exactly one chip carries the pre-hydration tab stop.",
        },
      },
      {
        name: "TagItem",
        description: {
          "fa-IR":
            "یک چیپ. textValue اجباری است، جایی که پیش‌تر اختیاری بود و از فرزندِ رشته‌ایِ ساده مشتق می‌شد — و به‌محضِ اینکه فرزند چیزی جز متنِ برهنه می‌شد به رشتهٔ خالی می‌افتاد و سطری بی‌نام می‌ساخت، بی‌صدا. حالا هیچ‌چیز مشتقش نمی‌کند، پس این ویژگی تنها منبع است و نمی‌تواند تصادفی خالی بماند. همین رشته است که به سازندهٔ نامِ دکمهٔ حذف هم داده می‌شود.",
          "en-US":
            "One chip. `textValue` is REQUIRED, where it used to be optional and derived from a literal string child — falling back to the empty string the moment a child was anything but bare text, which produced an unnamed row silently. Nothing derives it now, so the prop is the only source and it cannot be empty by accident. It is also the argument handed to the remove control's name builder.",
        },
      },
      {
        name: "tagRemoveVariants",
        description: {
          "fa-IR":
            "دکمهٔ حذف، که حالا خودش عنصرِ فوکوس‌پذیر است. حاشیه‌اش به لبهٔ پایانِ درون‌خطیِ چیپ کشیده می‌شود — چپ در فارسی — و املای فیزیکیِ همین یک خط رایج‌ترین نقصِ راست‌به‌چپِ کلِ خانوادهٔ چیپ است. نگاره بیست‌پیکسلی است و زیر کفِ لمس، پس ناحیهٔ هدف با یک شبه‌عنصرِ شفاف بزرگ می‌شود: هدف عوض می‌شود، چیدمان نه.",
          "en-US":
            "The remove control, which is now the focusable element itself. It is nudged toward the chip's inline END — the left in Persian — and the physical spelling of that one line is the single most copied right-to-left defect in chip components. The glyph is under the touch floor, so the HIT AREA grows via a transparent pseudo-element: the target changes and the layout does not.",
        },
      },
      {
        name: "tagListVariants",
        description: {
          "fa-IR":
            "چیدمانِ ردیف. کفِ ارتفاعش به حالتِ خالیِ خودِ سی‌اس‌اس بسته شده و نه به ویژگی‌ای که موتور منتشر کند، پس وقتی آخرین فیلتر برداشته می‌شود ردیف به صفر جمع نمی‌شود و چیدمان نمی‌پرد — همان ایده، بدون هیچ کتابخانه‌ای.",
          "en-US":
            "The row's layout. Its minimum height is keyed to CSS's own empty state rather than to an attribute an engine publishes, so dropping the last filter does not collapse the row to zero height and jump the layout — the same idea with no library at all.",
        },
      },
    ],
  },
  examples: [
    {
      id: "static",
      title: { "fa-IR": "چیپ‌هایی که کاری نمی‌شود کرد", "en-US": "Chips with nothing to do" },
      description: {
        "fa-IR":
          "بدون onRemove هیچ نوار ابزاری ساخته نمی‌شود و این یک فهرستِ واقعی است: صفحه‌خوان «فهرست، ۴ مورد» می‌گوید، به زبانِ خودش، بدون آنکه این کتابخانه رشته‌ای بخواهد یا عددی قالب‌بندی کند. با کلید تب رد شوید — هیچ ایستی اینجا نیست، چون چیزی برای عمل‌کردن نیست.",
        "en-US":
          "With no `onRemove` there is no toolbar and this is a real list: a screen reader says «list, 4 items», in its own language, with no string required of this library and no number to format. Tab past it — there is no stop here, because there is nothing to operate.",
      },
      render: StaticExample,
    },
    {
      id: "removable",
      title: { "fa-IR": "ردیفِ فیلترِ حذف‌شدنی", "en-US": "A removable filter row" },
      description: {
        "fa-IR":
          "با کلید تب وارد شوید و بعد با کلیدهای جهت بگردید: کلِ ردیف یک ایست است و هر دکمهٔ حذف نامِ برچسبِ خودش را می‌گوید — «حذف تهران»، «حذف اصفهان». همین است که چهار فیلتر را چهار اعلامِ متمایز می‌کند به‌جای چهار دکمه به نامِ «حذف». آخرین چیپ را هم بردارید و ببینید ردیف جمع نمی‌شود.",
        "en-US":
          "Tab in, then arrow through: the whole row is one stop and each remove control names its own tag — «حذف تهران», «حذف اصفهان». That is what makes four filters four distinct announcements instead of four buttons called «Remove». Drop the last chip and watch the row hold its height.",
      },
      render: RemovableExample,
    },
    {
      id: "word-order",
      title: { "fa-IR": "چرا یک تابع و نه یک قالب", "en-US": "Why a function and not a template" },
      description: {
        "fa-IR":
          "همان چیپ‌ها، با جمله‌بندیِ دیگری: اینجا نامِ برچسب اولِ جمله می‌آید و فعل آخر. «حذف تهران»، «تهران را بردارید» و «برداشتن فیلتر تهران» هر سه در بافت‌های متفاوت درست‌اند و فقط اولی تصادفاً با ترتیبِ انگلیسی می‌خواند. برای همین این ویژگی یک تابع است که اسم را می‌گیرد و جمله را می‌خواهد، نه رشته‌ای با یک جای خالی.",
        "en-US":
          "The same chips with a different phrasing: here the tag's name comes first and the verb last. «حذف تهران», «تهران را بردارید» and «برداشتن فیلتر تهران» are all correct in different contexts and only the first happens to match English order. That is why the prop is a FUNCTION that receives the noun and asks for the sentence rather than a string with a hole in it.",
      },
      render: WordOrderExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازهٔ کوچک، هر دو شکل", "en-US": "The small size, both forms" },
      description: {
        "fa-IR":
          "چیپِ حذف‌شدنی سرپوشِ لبهٔ پایانش کوتاه می‌شود تا دکمه در همان جا بنشیند، و این با یک جفتِ منطقی نوشته شده — تنها شکلی که می‌تواند بگوید «همان سمتی که دکمه در آن است» بی‌آنکه بداند آن سمت کدام است. ناحیهٔ هدفِ دکمه با اندازه کوچک نمی‌شود: بزرگ‌کننده یک شبه‌عنصرِ شفاف است، نه بالشتک.",
        "en-US":
          "A removable chip trims its inline-END cap so the button sits in it, and that is written with a LOGICAL pair — the only spelling that can say «the cap the button is in» without knowing which side that is. The button's hit area does not shrink with the size: what enlarges it is a transparent pseudo-element rather than padding.",
      },
      render: SizesExample,
    },
  ],
};
