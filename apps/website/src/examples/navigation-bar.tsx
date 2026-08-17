import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { HouseIcon, ReceiptTextIcon, SearchIcon, UserIcon } from "lucide-react";
import { NavigationBar, NavigationBarItem } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the navigation-bar page. Contract: `_system/types.ts`.
 *
 * The destinations are LINKS. That is the one place this component parts from
 * the mobile `LumoNavigationBar`, which takes a value and a callback: on a phone
 * a tab bar swaps a view inside one app, on the web it navigates, and a thing
 * that navigates is an anchor. Everything else is the same component — a
 * required name for the bar, a decorative glyph, a count that is announced.
 *
 * `aria-current="page"` is what says which destination you are on. Not the
 * colour, not the filled glyph: both are invisible to a reader who cannot see
 * them, and the current page is exactly the fact they most need.
 */

const t = {
  mainNav: { "fa-IR": "ناوبری اصلی", "en-US": "Main navigation" },
  home: { "fa-IR": "خانه", "en-US": "Home" },
  search: { "fa-IR": "جست‌وجو", "en-US": "Search" },
  orders: { "fa-IR": "سفارش‌ها", "en-US": "Orders" },
  profile: { "fa-IR": "نمایه", "en-US": "Profile" },
  shopNav: { "fa-IR": "ناوبری فروشگاه", "en-US": "Storefront navigation" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface">
      <NavigationBar label={t.mainNav[l]}>
        <NavigationBarItem href="#home" icon={<HouseIcon aria-hidden="true" />} isCurrent="page">
          {t.home[l]}
        </NavigationBarItem>
        <NavigationBarItem href="#search" icon={<SearchIcon aria-hidden="true" />}>
          {t.search[l]}
        </NavigationBarItem>
        <NavigationBarItem href="#orders" icon={<ReceiptTextIcon aria-hidden="true" />}>
          {t.orders[l]}
        </NavigationBarItem>
        <NavigationBarItem href="#profile" icon={<UserIcon aria-hidden="true" />}>
          {t.profile[l]}
        </NavigationBarItem>
      </NavigationBar>
    </div>
  );
}

function WithBadgeExample(l: Locale) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface">
      <NavigationBar label={t.shopNav[l]}>
        <NavigationBarItem href="#home" icon={<HouseIcon aria-hidden="true" />}>
          {t.home[l]}
        </NavigationBarItem>
        <NavigationBarItem
          href="#orders"
          icon={<ReceiptTextIcon aria-hidden="true" />}
          badge={formatNumber(12, l)}
          isCurrent="page"
        >
          {t.orders[l]}
        </NavigationBarItem>
        <NavigationBarItem href="#profile" icon={<UserIcon aria-hidden="true" />}>
          {t.profile[l]}
        </NavigationBarItem>
      </NavigationBar>
    </div>
  );
}

function LabelsOnlyExample(l: Locale) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface">
      <NavigationBar label={t.mainNav[l]}>
        <NavigationBarItem href="#home" isCurrent="page">
          {t.home[l]}
        </NavigationBarItem>
        <NavigationBarItem href="#orders">{t.orders[l]}</NavigationBarItem>
        <NavigationBarItem href="#profile">{t.profile[l]}</NavigationBarItem>
      </NavigationBar>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR":
          "سه تا پنج مقصد اصلی، چسبیده به لبهٔ پایینِ یک نمای باریک — همان که روی گوشی نوار زبانه است. همتای وبِ `LumoNavigationBar`.",
        "en-US":
          "Three to five top destinations pinned to the block end of a narrow view — what a phone calls the tab bar. The web counterpart of `LumoNavigationBar`.",
      },
      whenNot: {
        "fa-IR":
          "ناوبری سراسری با پنل — `NavigationMenu`. فهرست کنارهٔ برنامه — `Sidebar`. جابه‌جایی میان نماهای یک صفحه بدون رفتن به نشانی تازه — `Tabs`.",
        "en-US":
          "Site-wide navigation with panels — `NavigationMenu`. The app's side list — `Sidebar`. Swapping views inside one page without going to a new address — `Tabs`.",
      },
    },
    tier: "navigation",
    title: { "fa-IR": "نوار ناوبری", "en-US": "Navigation bar" },
    intro: {
      "fa-IR":
        "مقصدهای اصلی، به‌شکل پیوند. نامِ نوار اجباری است چون صفحه‌ای که نوار پایین دارد بیش از یک `<nav>` دارد و یک ناحیهٔ بی‌نام فقط «ناوبری» خوانده می‌شود. مقصدِ جاری با aria-current گفته می‌شود نه با رنگ. نشانِ شمارش درونِ پوششِ aria-hidden آیکون نمی‌نشیند — آیکون تزئین است و شمارش اطلاعات.",
      "en-US":
        "The top destinations, as links. The bar's name is required because a page with a bottom bar has more than one `<nav>`, and an unnamed region is read as just \"navigation\". The current destination is said with aria-current, not with colour. The count does NOT sit inside the icon's aria-hidden wrapper — an icon is decoration and a count is information.",
    },
    composition: [
      `<NavigationBar label>`,
      `  <NavigationBarItem href icon badge isCurrent>`,
      `                          ← icon is aria-hidden: the label says the word`,
      `                          ← badge is NOT: it reaches the accessible name`,
      `                          ← isCurrent="page" is how "you are here" is said`,
      `</NavigationBar>`,
    ].join("\n"),
    parts: [
      {
        name: "NavigationBar",
        description: {
          "fa-IR":
            "خودِ ناحیه. یک `<nav>` با نامِ اجباری. مرزِ بالایی‌اش `border-t` است — لبهٔ آغازِ بلوک، که میان دو خط‌نویسی قرینه نمی‌شود؛ آنچه قرینه می‌شود ترتیبِ مقصدهاست و آن را خودِ ردیفِ فلکس انجام می‌دهد.",
          "en-US":
            "The region itself: a `<nav>` with a required name. Its rule is `border-t`, a block-start edge, which does not mirror between scripts; what mirrors is the ORDER of the destinations, and the flex row does that on its own.",
        },
      },
      {
        name: "NavigationBarItem",
        description: {
          "fa-IR":
            "یک مقصد. روی `Link` سوار است، پس `linkComponent` و در نتیجه مسیریابِ برنامه را به ارث می‌برد. `variant` و `size` را خودش تعیین می‌کند و فراخوان نمی‌تواند عوضشان کند.",
          "en-US":
            "One destination. Built on `Link`, so it inherits `linkComponent` and with it the app's router. It owns `variant` and `size`; a caller cannot override them.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "چهار مقصد", "en-US": "Four destinations" },
      description: {
        "fa-IR":
          "ترتیب از سمتِ شروعِ خواندن است: در فارسی «خانه» راست‌ترین است. هیچ چیزی اینجا چپ و راست نمی‌شناسد — ردیفِ فلکس خودش می‌چرخد.",
        "en-US":
          "The order runs from the reading start: in Persian, Home is the right-most. Nothing here names left or right — the flex row turns on its own.",
      },
      render: BasicExample,
    },
    {
      id: "with-badge",
      title: { "fa-IR": "با شمارش", "en-US": "With a count" },
      description: {
        "fa-IR":
          "شمارش از formatNumber می‌گذرد و به نامِ دسترس‌پذیرِ پیوند می‌رسد: «سفارش‌ها ۱۲». فاصلهٔ میانشان تزئینی نیست — دو span چسبیده، در نام، «سفارش‌ها۱۲» می‌شوند، و همین اشکال در `Sidebar` هم بود و همین‌جا پیدا و درست شد.",
        "en-US":
          "The count goes through formatNumber and reaches the link's accessible name: \"Orders 12\". The space between them is not cosmetic — two adjacent spans concatenate into \"Orders12\", and `Sidebar` had the same defect, found and fixed here.",
      },
      render: WithBadgeExample,
    },
    {
      id: "labels-only",
      title: { "fa-IR": "بدون آیکون", "en-US": "No icons" },
      description: {
        "fa-IR":
          "آیکون اختیاری است. چیزی از دست نمی‌رود جز فضا: آیکون از ابتدا aria-hidden بود و هیچ‌وقت چیزی به درخت دسترس‌پذیری اضافه نمی‌کرد.",
        "en-US":
          "The glyph is optional. Nothing is lost but space: it was aria-hidden all along and never added anything to the accessibility tree.",
      },
      render: LabelsOnlyExample,
    },
  ],
};
