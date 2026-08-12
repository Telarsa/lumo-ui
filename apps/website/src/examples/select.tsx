import type { Locale } from "@lumo-ui/core";
import {
  Label,
  Select,
  SelectGroup,
  SelectItem,
  SelectPopover,
  SelectSeparator,
  SelectTrigger,
  TextField,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the select page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 */

const t = {
  city: { "fa-IR": "شهر", "en-US": "City" },
  selectCity: { "fa-IR": "یک شهر انتخاب کنید", "en-US": "Select a city" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  yazd: { "fa-IR": "یزد", "en-US": "Yazd" },
  plan: { "fa-IR": "طرح اشتراک", "en-US": "Plan" },
  selectPlan: { "fa-IR": "یک طرح انتخاب کنید", "en-US": "Select a plan" },
  free: { "fa-IR": "رایگان", "en-US": "Free" },
  pro: { "fa-IR": "حرفه‌ای", "en-US": "Pro" },
  enterprise: { "fa-IR": "سازمانی", "en-US": "Enterprise" },
  soldOut: { "fa-IR": "ناموجود", "en-US": "Sold out" },
  fullName: { "fa-IR": "نام و نام خانوادگی", "en-US": "Full name" },
  fullNamePlaceholder: { "fa-IR": "مثلاً سارا محمدی", "en-US": "For example, Sara Mohammadi" },
  province: { "fa-IR": "استان", "en-US": "Province" },
  selectProvince: { "fa-IR": "یک شهر انتخاب کنید", "en-US": "Select a city" },
  tehranProvince: { "fa-IR": "استان تهران", "en-US": "Tehran province" },
  isfahanProvince: { "fa-IR": "استان اصفهان", "en-US": "Isfahan province" },
  karaj: { "fa-IR": "کرج", "en-US": "Karaj" },
  shahriar: { "fa-IR": "شهریار", "en-US": "Shahriar" },
  kashan: { "fa-IR": "کاشان", "en-US": "Kashan" },
  najafabad: { "fa-IR": "نجف‌آباد", "en-US": "Najafabad" },
  cityHelp: {
    "fa-IR": "شهری که سفارش به آن ارسال می‌شود.",
    "en-US": "The city the order ships to.",
  },
  cityRequired: {
    "fa-IR": "برای ادامه یک شهر انتخاب کنید.",
    "en-US": "Choose a city to continue.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectCity[l]}>
      <Label>{t.city[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="thr">{t.tehran[l]}</SelectItem>
        <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
        <SelectItem id="tbz">{t.tabriz[l]}</SelectItem>
        <SelectItem id="shz">{t.shiraz[l]}</SelectItem>
      </SelectPopover>
    </Select>
  );
}

function GroupedExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectProvince[l]}>
      <Label>{t.province[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectGroup label={t.tehranProvince[l]}>
          <SelectItem id="thr">{t.tehran[l]}</SelectItem>
          <SelectItem id="krj">{t.karaj[l]}</SelectItem>
          <SelectItem id="shr">{t.shahriar[l]}</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup label={t.isfahanProvince[l]}>
          <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
          <SelectItem id="ksh">{t.kashan[l]}</SelectItem>
          <SelectItem id="njf">{t.najafabad[l]}</SelectItem>
        </SelectGroup>
      </SelectPopover>
    </Select>
  );
}

function DescriptionExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectCity[l]} description={t.cityHelp[l]}>
      <Label>{t.city[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="thr">{t.tehran[l]}</SelectItem>
        <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
        <SelectItem id="yzd">{t.yazd[l]}</SelectItem>
      </SelectPopover>
    </Select>
  );
}

function InvalidExample(l: Locale) {
  return (
    <Select
      className="max-w-xs"
      placeholder={t.selectCity[l]}
      description={t.cityHelp[l]}
      errorMessage={t.cityRequired[l]}
      isRequired
    >
      <Label>{t.city[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="thr">{t.tehran[l]}</SelectItem>
        <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
        <SelectItem id="yzd">{t.yazd[l]}</SelectItem>
      </SelectPopover>
    </Select>
  );
}

function DisabledOptionExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectPlan[l]}>
      <Label>{t.plan[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="free">{t.free[l]}</SelectItem>
        <SelectItem id="pro">{t.pro[l]}</SelectItem>
        <SelectItem id="ent" isDisabled textValue={t.enterprise[l]}>
          <span className="flex w-full items-center justify-between gap-4">
            {t.enterprise[l]}
            <span className="text-xs text-fg-subtle">{t.soldOut[l]}</span>
          </span>
        </SelectItem>
      </SelectPopover>
    </Select>
  );
}

function DisabledExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectCity[l]} defaultSelectedKey="thr" isDisabled>
      <Label>{t.city[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="thr">{t.tehran[l]}</SelectItem>
        <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
      </SelectPopover>
    </Select>
  );
}

function InFormExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <TextField label={t.fullName[l]} placeholder={t.fullNamePlaceholder[l]} />
      <Select placeholder={t.selectCity[l]}>
        <Label>{t.city[l]}</Label>
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">{t.tehran[l]}</SelectItem>
          <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
          <SelectItem id="yzd">{t.yazd[l]}</SelectItem>
        </SelectPopover>
      </Select>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `<Select placeholder="…" validate={key => …}>`,
      `  <Label>…</Label>`,
      `  <SelectTrigger />`,
      `  <SelectPopover>`,
      `    <SelectGroup label="…">`,
      `      <SelectItem id="…">…</SelectItem>`,
      `    </SelectGroup>`,
      `    <SelectSeparator />`,
      `  </SelectPopover>`,
      `</Select>`,
    ].join("\n"),
    parts: [
      {
        name: "Select",
        description: {
          "fa-IR":
            "ریشهٔ فیلد؛ جای‌نما اجباری است چون موتور هیچ رشته‌ای ندارد و کنترل بدون آن خالی می‌ماند. متن راهنما و پیام خطا را هم همین بخش می‌سازد و به کنترل وصل می‌کند؛ validate کلید انتخابی را می‌گیرد و فقط متنِ نوشته‌شدهٔ فراخوان را نمایش می‌دهد.",
          "en-US":
            "The field root; the placeholder is required because the engine ships no string and the control renders empty without one. It renders and wires the description and error; validate receives the selected key and displays only caller-authored copy.",
        },
      },
      {
        name: "SelectTrigger",
        description: {
          "fa-IR": "کنترل بسته؛ مقدار انتخابی و شورون رو به پایین را نشان می‌دهد.",
          "en-US": "The collapsed control; shows the selected value and a downward chevron.",
        },
      },
      {
        name: "SelectValue",
        description: {
          "fa-IR": "متن مقدار یا جای‌نما؛ SelectTrigger به‌طور پیش‌فرض همین را می‌گذارد.",
          "en-US": "The value-or-placeholder text; SelectTrigger renders it by default.",
        },
      },
      {
        name: "SelectPopover",
        description: {
          "fa-IR": "لایهٔ فهرست؛ پهنایش را از خود کنترل اندازه می‌گیرد.",
          "en-US": "The list's popover; sized to the trigger's own measured width.",
        },
      },
      {
        name: "SelectItem",
        description: {
          "fa-IR": "یک گزینه؛ فرزند غیررشته‌ای textValue می‌خواهد تا تایپ‌یاب نشکند.",
          "en-US": "One option; non-string children need a textValue so typeahead keeps working.",
        },
      },
      {
        name: "SelectGroup",
        description: {
          "fa-IR": "دستهٔ گزینه‌های هم‌خانواده؛ label اجباری است چون هر گزینه عضویتش در آن را اعلام می‌کند.",
          "en-US": "A block of related options; label is required because every option inside announces its membership.",
        },
      },
      {
        name: "SelectSeparator",
        description: {
          "fa-IR": "خط جداکنندهٔ دیداری؛ نقش presentation دارد و جای دسته را نمی‌گیرد.",
          "en-US": "A visual rule; role=\"presentation\", and no substitute for a named group.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "فهرست تک‌انتخابی درون پاپ‌اور؛ برچسب از راه Label به کنترل وصل می‌شود.",
        "en-US": "A single-select list in a popover; the label wires to the control through Label.",
      },
      render: BasicExample,
    },
    {
      id: "grouped",
      title: { "fa-IR": "دسته‌بندی‌شده", "en-US": "Grouped" },
      description: {
        "fa-IR":
          "هر دسته نامی اعلام‌شده دارد، پس خواننده هنگام رد شدن از مرز استان از آن باخبر می‌شود؛ خط جداکننده فقط دیداری است.",
        "en-US":
          "Each group carries an announced name, so a listener is told when they arrow past a province boundary; the rule between them is visual only.",
      },
      render: GroupedExample,
    },
    {
      id: "description",
      title: { "fa-IR": "متن راهنما", "en-US": "Help text" },
      description: {
        "fa-IR":
          "متن راهنما هنگام رندر به aria-describedby کنترل وصل می‌شود، نه پس از هیدریت شدن؛ پس خوانندهٔ صفحهٔ ایستا هم آن را می‌شنود.",
        "en-US":
          "The help text is wired into the control's aria-describedby during render, not after hydration — so a reader of the static page hears it too.",
      },
      render: DescriptionExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "خطای اعتبارسنجی", "en-US": "Validation error" },
      description: {
        "fa-IR":
          "دادن errorMessage خودِ فیلد را نامعتبر می‌کند؛ کنترل در همان بایت نخست aria-invalid می‌گیرد و پیام و متن راهنما به همان ترتیب خوانده می‌شوند. برای وارونه کردن این استنتاج، isInvalid را صریح بدهید.",
        "en-US":
          "Supplying errorMessage marks the field invalid on its own; the control carries aria-invalid in the first byte, and the message and the help text are announced in that order. Pass isInvalid to override the inference.",
      },
      render: InvalidExample,
    },
    {
      id: "disabled-option",
      title: { "fa-IR": "گزینهٔ غیرفعال", "en-US": "Disabled option" },
      description: {
        "fa-IR": "گزینهٔ غیرفعال در فهرست می‌ماند و خوانده می‌شود؛ حذفش دلیل ناموجودی را پنهان می‌کرد.",
        "en-US": "A disabled option stays listed and announced; removing it would hide why it is unavailable.",
      },
      render: DisabledOptionExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "کل کنترل غیرفعال، با مقدار انتخاب‌شده‌ای که همچنان خوانا می‌ماند.",
        "en-US": "The whole control disabled, with its selected value still readable.",
      },
      render: DisabledExample,
    },
    {
      id: "in-form",
      title: { "fa-IR": "درون فرم", "en-US": "In a form" },
      description: {
        "fa-IR": "کنار یک ورودی متن؛ هر دو فیلد یک ریتم عمودی و یک پهنای ستون را دنبال می‌کنند.",
        "en-US": "Beside a text field; both controls share one vertical rhythm and one column width.",
      },
      render: InFormExample,
    },
  ],
};
