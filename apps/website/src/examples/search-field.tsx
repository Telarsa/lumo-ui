import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { SearchField } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the search-field page. Contract: `_system/types.ts` —
 * each render is a named top-level function so the loader can slice its source.
 *
 * A server module. Every prop below is a string, so the field, its name and its
 * description are all in the served bytes.
 *
 * ── THE THREE THINGS TO DO HERE, NONE OF WHICH A SCREENSHOT SHOWS ───────────
 *
 *  1. **Type, then press Escape.** The field clears and keeps focus. Nothing in
 *     the engine binds that key; it is bound in the component, because a search
 *     box that does not answer Escape is a small thing keyboard users notice
 *     immediately.
 *  2. **Clear with the ✕ and watch what fires.** The button does not assign to
 *     `el.value` — it writes through the native setter and dispatches a bubbling
 *     `input` event, which is the one route that makes a CONTROLLED field's
 *     `onChange` run. Assigning directly is swallowed by React's value tracker
 *     and the consumer is never told: the silent version of this bug.
 *  3. **Load the prefilled example and look before you touch it.** The clear
 *     button is not there on the first byte and appears on hydration. That is a
 *     documented gap rather than an oversight — see the example's own note.
 */

const t = {
  orders: { "fa-IR": "جست‌وجو در سفارش‌ها", "en-US": "Search the orders" },
  ordersClear: { "fa-IR": "پاک کردن جست‌وجو", "en-US": "Clear the search" },
  ordersPlaceholder: { "fa-IR": "شمارهٔ سفارش یا نام مشتری", "en-US": "Order number or customer name" },

  city: { "fa-IR": "شهر", "en-US": "City" },
  cityClear: { "fa-IR": "پاک کردن شهر", "en-US": "Clear the city" },
  cityValue: { "fa-IR": "تهران", "en-US": "Tehran" },

  docs: { "fa-IR": "جست‌وجو در راهنما", "en-US": "Search the documentation" },
  docsClear: { "fa-IR": "پاک کردن عبارت", "en-US": "Clear the query" },
  docsHelp: {
    "fa-IR": "برای پاک کردن، کلید گریز را بزنید.",
    "en-US": "Press Escape to clear it.",
  },

  invoice: { "fa-IR": "شمارهٔ فاکتور", "en-US": "Invoice number" },
  invoiceClear: { "fa-IR": "پاک کردن شمارهٔ فاکتور", "en-US": "Clear the invoice number" },
  invoiceError: {
    "fa-IR": "فاکتوری با این شماره پیدا نشد.",
    "en-US": "No invoice carries that number.",
  },

  members: { "fa-IR": "جست‌وجوی اعضا", "en-US": "Search members" },
  membersClear: { "fa-IR": "پاک کردن جست‌وجوی اعضا", "en-US": "Clear the member search" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <SearchField
      className="w-full max-w-sm"
      label={t.orders[l]}
      clearLabel={t.ordersClear[l]}
      placeholder={t.ordersPlaceholder[l]}
    />
  );
}

function PrefilledExample(l: Locale) {
  return (
    <SearchField
      className="w-full max-w-sm"
      label={t.city[l]}
      clearLabel={t.cityClear[l]}
      defaultValue={t.cityValue[l]}
    />
  );
}

function EscapeExample(l: Locale) {
  return (
    <SearchField
      className="w-full max-w-sm"
      label={t.docs[l]}
      clearLabel={t.docsClear[l]}
      description={t.docsHelp[l]}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <SearchField
      className="w-full max-w-sm"
      label={t.invoice[l]}
      clearLabel={t.invoiceClear[l]}
      errorMessage={t.invoiceError[l]}
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <SearchField size="sm" label={t.members[l]} clearLabel={t.membersClear[l]} />
      <SearchField size="md" label={t.members[l]} clearLabel={t.membersClear[l]} />
      <SearchField size="lg" label={t.members[l]} clearLabel={t.membersClear[l]} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ورودی جست‌وجو با ذره‌بین و دکمهٔ پاک‌کردن — برای یک عبارت روی یک فهرست یا یک سایت.",
        "en-US": "A search input with a magnifier and a clear button — for one term against a list or a site.",
      },
      whenNot: {
        "fa-IR": "بندهای فیلدآگاه و نماهای ذخیره‌شده — `PowerSearch`. فیلتر کردن فهرستی دیدنی — `Autocomplete`. کنش‌ها با صفحه‌کلید — `Command`. متن ساده — `TextField`.",
        "en-US": "Field-aware clauses and saved views — `PowerSearch`. Filtering a visible list — `Autocomplete`. Actions by keyboard — `Command`. Plain text — `TextField`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "میدان جست‌وجو", "en-US": "Search field" },
    intro: {
      "fa-IR":
        "یک ورودی جست‌وجو با ذره‌بین در لبهٔ شروعِ خواندن و دکمهٔ پاک‌کردن در لبهٔ پایان. هر دو روی ورودی شناور شده‌اند و کنارش در یک ردیف ننشسته‌اند، و این پیش از آنکه تصمیمی دربارهٔ چیدمان باشد تصمیمی دربارهٔ فوکوس است: اگر حاشیه روی پوشش می‌نشست، عنصری که واقعاً فوکوس می‌گیرد یک ورودی بی‌حاشیهٔ تودررفته بود و تنها قاعدهٔ حلقهٔ فوکوسِ کتابخانه دورِ متن کشیده می‌شد نه دورِ کنترل. هیچ موتوری میدان جست‌وجو ندارد؛ این یکی ساخته شده، و سه رفتاری که پیش‌تر رایگان می‌آمد دوباره نوشته شده است.",
      "en-US":
        "A search input with a magnifier at the reading start and a clear button at the reading end. Both are overlaid on the input rather than laid out beside it, and that is a focus decision before it is a layout one: with the border on a wrapper, the element that actually takes focus would be a borderless inset input, and the library's one focus rule would draw around the text run instead of around the control. Neither engine ships a search field; this one is BUILT, and three behaviours that used to arrive free are re-authored.",
    },
    composition: [
      `<SearchField`,
      `  label            ← REQUIRED: an unnamed field is a defect`,
      `  clearLabel       ← REQUIRED: an unnamed ✕ is worse than an English one`,
      `  description errorMessage placeholder`,
      `  size defaultValue value onChange onClear onSubmit />`,
    ].join("\n"),
    parts: [
      {
        name: "SearchField",
        description: {
          "fa-IR":
            "کل کنترل. clearLabel اجباری است و استدلالش با عوض‌شدن موتور برعکس شد نه اینکه از بین برود: پیش‌تر این ویژگی وجود داشت تا نامِ انگلیسیِ آماده را بپوشاند، حالا وجود دارد چون هیچ نامی ساخته نمی‌شود — و دکمهٔ بی‌نام از دکمهٔ انگلیسی بدتر است، چون واژهٔ لاتینی برای دروازه نمی‌ماند و یک ضربدرِ برهنه در نماگرفت شبیه یک انتخابِ ظاهری است.",
          "en-US":
            "The whole control. `clearLabel` is required and the argument for it INVERTED rather than disappearing: it used to exist to overwrite a ready-made English name, and now exists because no name is produced at all — and an unnamed button is worse than an English one, because there is no Latin word left for the gate to catch and a bare ✕ in a screenshot looks like a styling choice.",
        },
      },
      {
        name: "searchInputVariants",
        description: {
          "fa-IR":
            "شکلِ ورودی. دو جای خالیِ داخلی برای دو شناور با ویژگی‌های منطقی رزرو شده‌اند، پس ذره‌بین در لبهٔ شروعِ خواندن و دکمهٔ پاک‌کردن در لبهٔ پایان می‌نشیند بدون هیچ قاعدهٔ جداگانه‌ای برای راست‌به‌چپ. دکمهٔ پاک‌کردنِ خودِ وبکیت هم پنهان شده: یک کنترلِ بومیِ بی‌نام که کنارِ مالِ ما می‌نشست.",
          "en-US":
            "The input's shape. The two overlays are reserved with logical inline padding, so the magnifier sits at the reading start and the clear button at the reading end with no separate right-to-left rule. WebKit's own cancel button is hidden as well: an unnamed native control that would otherwise sit beside ours.",
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
          "چیزی تایپ کنید تا دکمهٔ پاک‌کردن ظاهر شود، و بعد کلید گریز را بزنید. پیدا و پنهان شدنِ آن دکمه سی‌اس‌اس است — از یک ویژگیِ «پُر است» که موتور روی ریشهٔ میدان می‌نویسد — نه یک حالتِ جاوااسکریپتی که مقدارِ ورودی را دوباره نگه دارد.",
        "en-US":
          "Type something to make the clear button appear, then press Escape. That button's appearance is CSS — driven by a «filled» attribute the engine writes on the field root — rather than a JavaScript state mirroring what the input already says.",
      },
      render: BasicExample,
    },
    {
      id: "prefilled",
      title: { "fa-IR": "یک شکافِ صادقانه در بایتِ اول", "en-US": "An honest first-byte gap" },
      description: {
        "fa-IR":
          "این میدان با مقدار بارگذاری می‌شود و دکمهٔ پاک‌کردنش در بایتِ اول نیست — بعد از هیدراسیون ظاهر می‌شود. موتور آن حالتِ «پُر است» را با مقدار نادرست آغاز می‌کند و هیچ ویژگی‌ای برای کاشتنش ندارد. جایگزین‌ها بدترند: یک حالتِ جاوااسکریپتیِ موازی با فرمِ کنترل‌نشده می‌جنگد، و placeholder-shown وقتی فراخوان جای‌نگهدار ندهد بی‌صدا هیچ نمی‌کند. نوشته شده، نه پوشانده.",
        "en-US":
          "This field loads with a value and its clear button is not in the first byte — it appears on hydration. The engine initialises that «filled» state as false and exposes no prop to seed it. The alternatives are worse: a parallel JavaScript state fights the uncontrolled form, and a `:placeholder-shown` rule silently does nothing when the caller passes no placeholder. Recorded rather than papered over.",
      },
      render: PrefilledExample,
    },
    {
      id: "escape",
      title: { "fa-IR": "کلید گریز پاک می‌کند", "en-US": "Escape clears" },
      description: {
        "fa-IR":
          "بنویسید و کلید گریز را بزنید: متن می‌رود و فوکوس در میدان می‌ماند. کلید اینتر هم فرمِ اطرافش را ارسال نمی‌کند و جلوی مرورگر را هم نمی‌گیرد — فقط فراخوانیِ خودش را صدا می‌زند، تا فرمِ واقعیِ اطراف رفتار خودش را نگه دارد.",
        "en-US":
          "Type, then press Escape: the text goes and focus stays in the field. Enter neither submits the surrounding form itself nor blocks the browser — it fires its own callback and lets a real form keep its own behaviour.",
      },
      render: EscapeExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "جست‌وجویی که چیزی پیدا نکرد", "en-US": "A search that found nothing" },
      description: {
        "fa-IR":
          "دادن errorMessage خودش میدان را نامعتبر می‌کند و حاشیهٔ قرمز از data-invalid می‌آید. توجه کنید که این پیامِ اعتبارسنجی است نه حالتِ خالی: خالی‌بودنِ نتیجه به فهرست تعلق دارد و به یک ناحیهٔ زنده، نه به خودِ ورودی.",
        "en-US":
          "Supplying errorMessage marks the field invalid on its own and the red border comes from data-invalid. Note this is a VALIDATION message rather than an empty state: emptiness belongs to the results list and to a live region, not to the input.",
      },
      render: InvalidExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "سه اندازه", "en-US": "Three sizes" },
      description: {
        "fa-IR":
          "ارتفاع‌ها از توکن‌های چگالی می‌آیند، ولی جای خالیِ رزروشده برای دو شناور در هر سه یکی است — پس ذره‌بین در اندازهٔ کوچک هم روی متن نمی‌افتد. بزرگ‌ترین اندازه کفِ چهل‌وچهار پیکسلیِ لمس را برآورده می‌کند.",
        "en-US":
          "The heights come from the density tokens, but the inline space reserved for the two overlays is the same in all three — so the magnifier does not land on the text at the small size. The largest meets the 44px touch floor.",
      },
      render: SizesExample,
    },
  ],
};
