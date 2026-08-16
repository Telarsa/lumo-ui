import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { AtSign, Copy, Link2, Search } from "lucide-react";
import { InputGroup, InputGroupButton } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the input-group page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * A server module: every prop below is a string or an icon element, so the
 * field, its name and the adornment button's name are all in the served bytes.
 *
 * ── THIS COMPONENT WAS VENDORED TWICE AND REJECTED TWICE ────────────────────
 *
 * Both upstream input-groups — the React Aria one and the Base UI one — are
 * COMPOSITIONAL: a bare group you fill with an unlabelled input, which reopens
 * the exact hole `TextField` closed, because nothing forces the field to have a
 * name. This one is COMPOSED like `text-field.tsx` and `label` is a REQUIRED
 * string.
 *
 * Both also align their adornments with physical padding and negative physical
 * margins — `pl-2`/`pr-2`, `-ml-1`/`-mr-1` — on every seam. Here the adornments
 * are absolutely positioned overlays pinned with logical insets, and the border
 * stays on the focusable `<input>` itself, so the one focus rule in the theme
 * draws around the whole control rather than around a text run inset inside a
 * decorated box.
 *
 * The Base UI vendor added a third disqualifier of its own: its addon carries an
 * `onClick` that reaches into the DOM to focus the sibling input — hand-rolled
 * label-to-control association, click-only, which is the exact mechanism this
 * whole migration exists to route around.
 */

const t = {
  pageAddress: { "fa-IR": "نشانی صفحه", "en-US": "Page address" },
  pageAddressPlaceholder: { "fa-IR": "نشانی را اینجا بچسبانید", "en-US": "Paste the address here" },
  copyAddress: { "fa-IR": "رونوشت نشانی", "en-US": "Copy the address" },

  handle: { "fa-IR": "نام کاربری عمومی", "en-US": "Public handle" },
  handleHelp: {
    "fa-IR": "همین نام در نشانی صفحهٔ شما می‌آید.",
    "en-US": "This is the name that appears in your page's address.",
  },

  workspaceSuffix: { "fa-IR": "فضای کاری", "en-US": "workspace" },

  price: { "fa-IR": "قیمت", "en-US": "Price" },
  toman: { "fa-IR": "تومان", "en-US": "toman" },
  priceHelp: {
    "fa-IR": "واحد ثابت است و تایپ نمی‌شود.",
    "en-US": "The unit is fixed and is not typed.",
  },

  coupon: { "fa-IR": "کد تخفیف", "en-US": "Discount code" },
  couponError: {
    "fa-IR": "این کد تخفیف منقضی شده است.",
    "en-US": "That discount code has expired.",
  },

  filter: { "fa-IR": "فیلتر اعضا", "en-US": "Filter the members" },
} satisfies Record<string, LocalizedText>;

function LeadingExample(l: Locale) {
  return (
    <InputGroup
      className="w-full max-w-sm"
      label={t.filter[l]}
      leading={<Search aria-hidden="true" />}
    />
  );
}

function PrefixExample(l: Locale) {
  return (
    <InputGroup
      className="w-full max-w-sm"
      label={t.handle[l]}
      description={t.handleHelp[l]}
      leading={<AtSign aria-hidden="true" />}
      trailing={<span className="text-sm text-fg-muted">{t.workspaceSuffix[l]}</span>}
    />
  );
}

function ButtonExample(l: Locale) {
  return (
    <InputGroup
      className="w-full max-w-sm"
      label={t.pageAddress[l]}
      placeholder={t.pageAddressPlaceholder[l]}
      leading={<Link2 aria-hidden="true" />}
      trailing={
        <InputGroupButton label={t.copyAddress[l]}>
          <Copy aria-hidden="true" />
        </InputGroupButton>
      }
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <InputGroup
      className="w-full max-w-sm"
      label={t.coupon[l]}
      errorMessage={t.couponError[l]}
      leading={<Search aria-hidden="true" />}
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <InputGroup
        size="sm"
        label={t.price[l]}
        description={t.priceHelp[l]}
        trailing={<span className="text-xs text-fg-muted">{t.toman[l]}</span>}
      />
      <InputGroup
        size="lg"
        label={t.price[l]}
        trailing={<span className="text-sm text-fg-muted">{t.toman[l]}</span>}
      />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ورودی متن با زائده‌هایی روی لبه‌های خواندن: نشان واحد پول، یکا، پسوند دامنه، یک دکمه.",
        "en-US": "A text field with adornments on its reading edges: a currency sign, a unit, a domain suffix, a button.",
      },
      whenNot: {
        "fa-IR": "فیلد ساده — `TextField`. جست‌وجو با ذره‌بین و پاک‌کردن — `SearchField`. عدد با گام — `NumberField`. چند دکمهٔ چسبیده — `ButtonGroup`.",
        "en-US": "A plain field — `TextField`. Search with a magnifier and clear — `SearchField`. A number with steppers — `NumberField`. Several joined buttons — `ButtonGroup`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "ورودی آذین‌دار", "en-US": "Input group" },
    intro: {
      "fa-IR":
        "یک میدان متن با آذین روی لبه‌های خواندن. آنچه leading نامیده می‌شود در لبهٔ شروعِ خواندن می‌نشیند — در فارسی راست، در انگلیسی چپ — و trailing در لبهٔ پایان؛ نه چپ و راست، و هیچ‌جا وردی برای راست‌به‌چپ نوشته نشده. جای خالیِ لازم برای هر آذین فقط در همان سمتی رزرو می‌شود که واقعاً آذین دارد، پس ورودیِ بی‌آذین دقیقاً مثل یک میدان متنِ ساده درمی‌آید. ظرفِ آذین‌ها رویدادِ اشاره‌گر نمی‌گیرد تا کلیک روی یک آیکونِ تزئینی به ورودیِ زیرش برسد، و کنترل‌های تعاملی رویدادِ خودشان را پس می‌گیرند.",
      "en-US":
        "A text field with adornments on the reading edges. What is called `leading` sits at the reading START — the right in Persian, the left in English — and `trailing` at the reading end; not left and right, and there is no right-to-left override anywhere. The inset for an adornment is reserved only on the side that actually has one, so an adornment-free group renders pixel-identical to a plain text field. The adornment container takes no pointer events, so a click on a decorative icon falls through to the input underneath it, and interactive children win their own events back.",
    },
    composition: [
      `<InputGroup`,
      `  label            ← REQUIRED string: an unnamed field is a defect`,
      `  leading          ← reading START: right in Persian, left in English`,
      `  trailing         ← reading END`,
      `  description errorMessage placeholder size`,
      `  inputClassName />`,
      ``,
      `<InputGroupButton label>…</InputGroupButton>   ← for an interactive adornment`,
    ].join("\n"),
    parts: [
      {
        name: "InputGroup",
        description: {
          "fa-IR":
            "کل میدان. هر دو شکافِ آذین LumoNode هستند، پس عددِ برهنه نمی‌تواند در هیچ‌کدام بیفتد — همان قاعده‌ای که یک شمارندهٔ «۳ از ۱۰» را وادار می‌کند از قالب‌بندی بگذرد.",
          "en-US":
            "The whole field. Both adornment slots are `LumoNode`, so a bare number cannot land in either — the same rule that forces a «۳ از ۱۰» counter through the formatter.",
        },
      },
      {
        name: "InputGroupButton",
        description: {
          "fa-IR":
            "کنترلِ آیکونی داخلِ یک شکافِ آذین. label اجباری‌اش را از دکمهٔ آیکونیِ کتابخانه به ارث می‌برد و از نو تعریف نمی‌کند، پس این دو نمی‌توانند از هم دور بیفتند. پیش‌فرض بی‌حاشیه است، چون جعبه را خودِ ورودی می‌کشد.",
          "en-US":
            "An icon-only control inside an adornment slot. Its required `label` is INHERITED from the library's icon button rather than restated, so the two cannot drift. Ghost by default: the input already draws the box.",
        },
      },
      {
        name: "inputGroupInputVariants",
        description: {
          "fa-IR":
            "شکلِ ورودی. جای خالیِ درون‌خطی یک وردِ حضورِ شکاف است نه بخشی از پایه — سمتی که آذین ندارد همان فرورفتگیِ میدان متنِ ساده را نگه می‌دارد.",
          "en-US":
            "The input's shape. The inline padding is a variant of the SLOT'S PRESENCE rather than part of the base — a side with no adornment keeps the plain text field's inset.",
        },
      },
      {
        name: "inputGroupAddonVariants",
        description: {
          "fa-IR":
            "ظرفِ شناور. با ویژگی‌های منطقیِ شروع و پایانِ درون‌خطی سنجاق می‌شود؛ شکلِ فیزیکی‌اش در فارسی هر دو آذین را به سمتِ اشتباه می‌برد و در نماگرفتِ انگلیسی کاملاً درست به نظر می‌رسد.",
          "en-US":
            "The overlay container. It is pinned with logical inline-start and inline-end insets; the physical spelling puts both adornments on the wrong side in Persian and looks perfectly correct in an English screenshot.",
        },
      },
    ],
  },
  examples: [
    {
      id: "leading-icon",
      title: { "fa-IR": "آیکون در لبهٔ شروع", "en-US": "An icon at the reading start" },
      description: {
        "fa-IR":
          "روی خودِ آیکون کلیک کنید: فوکوس به ورودی می‌رود، چون ظرفِ شناور رویدادِ اشاره‌گر نمی‌گیرد و کلیک از رویش رد می‌شود. بعد با کلید تب واردش شوید و به حلقهٔ فوکوس نگاه کنید — دورِ کلِ کنترل کشیده می‌شود، نه دورِ متنِ تودررفته، چون حاشیه روی همان ورودی است که فوکوس می‌گیرد.",
        "en-US":
          "Click the icon itself: focus lands in the input, because the overlay takes no pointer events and the click falls through. Then Tab in and look at the focus ring — it draws around the whole control rather than around an inset text run, because the border is on the very input that takes focus.",
      },
      render: LeadingExample,
    },
    {
      id: "two-adornments",
      title: { "fa-IR": "هر دو لبه", "en-US": "Both edges" },
      description: {
        "fa-IR":
          "دو آذین، دو جای خالیِ رزروشده، هیچ قاعدهٔ جداگانه‌ای برای راست‌به‌چپ. صفحه را به انگلیسی ببینید و همین مثال را دوباره نگاه کنید: آیکون و واحد جایشان را با هم عوض می‌کنند و در سی‌اس‌اس هیچ‌چیز شرطی نیست.",
        "en-US":
          "Two adornments, two reserved insets, no separate right-to-left rule. Switch the page to English and look at this example again: the icon and the unit swap sides together, and nothing in the CSS is conditional.",
      },
      render: PrefixExample,
    },
    {
      id: "adornment-button",
      title: { "fa-IR": "کنترل داخل آذین", "en-US": "A control inside the adornment" },
      description: {
        "fa-IR":
          "ظرفِ آذین رویدادِ اشاره‌گر نمی‌گیرد، ولی هر کنترلِ لومو رویدادِ خودش را پس می‌گیرد — یعنی آیکونِ تزئینی کلیک را رد می‌کند و دکمه نمی‌کند، بدون آنکه فراخوان چیزی تنظیم کند. label دکمه اجباری است و کامپایل نمی‌شود اگر نباشد، که تنها شکلی است که فراموش‌کردنش ناممکن باشد.",
        "en-US":
          "The adornment container takes no pointer events, but every Lumo control wins its own back — so the decorative icon passes a click through and the button does not, with nothing for the caller to configure. The button's label is required and does not compile without it, which is the only shape in which forgetting is impossible.",
      },
      render: ButtonExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر، با آذین", "en-US": "Invalid, with an adornment" },
      description: {
        "fa-IR":
          "حاشیهٔ قرمز روی همان ورودی است و آذین رویش نمی‌افتد، چون شناور در بالای جعبه نشسته و درونش نه. اگر حاشیه روی پوشش می‌بود، همین حالت یک قابِ قرمز دورِ آذین‌ها هم می‌کشید و مرزِ خطا را جای دیگری نشان می‌داد.",
        "en-US":
          "The red border is on the input itself and the adornment does not sit on top of it, because the overlay is above the box rather than inside it. With the border on a wrapper, this state would draw a red frame around the adornments too and put the error's boundary in the wrong place.",
      },
      render: InvalidExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR":
          "ارتفاع از توکن‌های چگالی می‌آید و جای خالیِ آذین با آن عوض نمی‌شود، پس واحدِ کنارِ عدد در هر دو اندازه در همان فاصله از لبه می‌نشیند. بزرگ‌ترین اندازه کفِ چهل‌وچهار پیکسلیِ لمس را برآورده می‌کند.",
        "en-US":
          "The height comes from the density tokens and the adornment inset does not move with it, so the unit beside the figure sits the same distance from the edge at both sizes. The largest meets the 44px touch floor.",
      },
      render: SizesExample,
    },
  ],
};
