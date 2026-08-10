import type { Locale, LumoNode } from "@lumo-ui/core";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@lumo-ui/ui";

/**
 * NativeSelect examples. Server module — and the component itself needs no
 * hydration at all: these controls are the browser's own widget, interactive
 * from the first byte, which is exactly the argument for using one on mobile.
 */

const copy = {
  city: { "fa-IR": "شهر", "en-US": "City" },
  tehranProvince: { "fa-IR": "استان تهران", "en-US": "Tehran province" },
  isfahanProvince: { "fa-IR": "استان اصفهان", "en-US": "Isfahan province" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  karaj: { "fa-IR": "کرج", "en-US": "Karaj" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  kashan: { "fa-IR": "کاشان", "en-US": "Kashan" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  paymentMethod: { "fa-IR": "روش پرداخت", "en-US": "Payment method" },
  card: { "fa-IR": "کارت بانکی", "en-US": "Bank card" },
  wallet: { "fa-IR": "کیف پول", "en-US": "Wallet" },
  invoice: { "fa-IR": "فاکتور", "en-US": "Invoice" },
} satisfies Record<string, Record<Locale, string>>;

export const meta = {
  id: "native-select",
  tier: "form",
  title: { "fa-IR": "انتخاب بومی", "en-US": "Native select" },
  intro: {
    "fa-IR":
      "یک select واقعی با برچسب اجباری. روی موبایل چرخ iOS و برگهٔ اندروید را باز می‌کند — همان دلیلی که این کنار Select سفارشی وجود دارد — و بدون جاوااسکریپت هم کار می‌کند.",
    "en-US":
      "A real select with a required label. On a phone it opens the iOS wheel and the Android sheet — the reason it exists beside the custom Select — and it works with no JavaScript at all.",
  },
} as const;

export const examples: Array<{
  id: string;
  title: Record<Locale, string>;
  intro?: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
}> = [
  {
    id: "basic",
    title: { "fa-IR": "پایه", "en-US": "Basic" },
    intro: {
      "fa-IR": "برچسب یک label واقعی است، دیدنی و متصل با for — نه placeholder و نه aria-label.",
      "en-US": "The label is a real, visible label wired by for — not a placeholder, not an aria-label.",
    },
    render: (l) => (
      <NativeSelect label={copy.city[l]} defaultValue="thr">
        <NativeSelectOption value="thr">{copy.tehran[l]}</NativeSelectOption>
        <NativeSelectOption value="isf">{copy.isfahan[l]}</NativeSelectOption>
        <NativeSelectOption value="shz">{copy.shiraz[l]}</NativeSelectOption>
        <NativeSelectOption value="tbz">{copy.tabriz[l]}</NativeSelectOption>
      </NativeSelect>
    ),
  },
  {
    id: "groups",
    title: { "fa-IR": "گروه‌بندی", "en-US": "Grouped options" },
    intro: {
      "fa-IR": "برچسب optgroup را خودِ سکو در فهرست نشان می‌دهد؛ اجباری است تا ردیف خالی نماند.",
      "en-US": "The optgroup label is rendered by the platform itself; it is required so no row shows empty.",
    },
    render: (l) => (
      <NativeSelect label={copy.city[l]} defaultValue="krj">
        <NativeSelectOptGroup label={copy.tehranProvince[l]}>
          <NativeSelectOption value="thr">{copy.tehran[l]}</NativeSelectOption>
          <NativeSelectOption value="krj">{copy.karaj[l]}</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label={copy.isfahanProvince[l]}>
          <NativeSelectOption value="isf">{copy.isfahan[l]}</NativeSelectOption>
          <NativeSelectOption value="ksh">{copy.kashan[l]}</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    ),
  },
  {
    id: "states",
    title: { "fa-IR": "اندازه و وضعیت", "en-US": "Size and state" },
    intro: {
      "fa-IR": "اندازهٔ کوچک برای نوارهای فشرده؛ حالت نامعتبر برای فناوری کمکی هم علامت می‌خورد.",
      "en-US": "The small size for dense bars; the invalid state is marked for assistive technology too.",
    },
    render: (l) => (
      <div className="flex flex-wrap items-end gap-4">
        <NativeSelect label={copy.paymentMethod[l]} size="sm" defaultValue="card">
          <NativeSelectOption value="card">{copy.card[l]}</NativeSelectOption>
          <NativeSelectOption value="wallet">{copy.wallet[l]}</NativeSelectOption>
          <NativeSelectOption value="invoice">{copy.invoice[l]}</NativeSelectOption>
        </NativeSelect>
        <NativeSelect label={copy.city[l]} isInvalid defaultValue="">
          <NativeSelectOption value="">—</NativeSelectOption>
          <NativeSelectOption value="thr">{copy.tehran[l]}</NativeSelectOption>
        </NativeSelect>
      </div>
    ),
  },
];
