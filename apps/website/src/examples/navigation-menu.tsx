import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the navigation-menu page. Contract: `_system/types.ts` —
 * each render is a named top-level function so the loader can slice its source.
 *
 * Panels are closed in the first byte — an open overlay contributes nothing to
 * SSR, so the trigger is what a demo shows.
 */

const t = {
  nav: { "fa-IR": "ناوبری اصلی", "en-US": "Main navigation" },
  products: { "fa-IR": "محصولات", "en-US": "Products" },
  lumo: { "fa-IR": "لومو", "en-US": "Lumo" },
  lumoDesc: {
    "fa-IR": "سیستم طراحی فارسی‌محور روی Base UI",
    "en-US": "The Persian-first design system on Base UI",
  },
  khroos: { "fa-IR": "خروس", "en-US": "Khroos" },
  khroosDesc: {
    "fa-IR": "رزرو اقامتگاه، از جست‌وجو تا پرداخت",
    "en-US": "Stay booking, from search to checkout",
  },
  resources: { "fa-IR": "منابع", "en-US": "Resources" },
  docs: { "fa-IR": "مستندات", "en-US": "Documentation" },
  docsDesc: {
    "fa-IR": "راهنمای نصب و الگوهای دوزبانه",
    "en-US": "Install guides and bilingual patterns",
  },
  notes: { "fa-IR": "یادداشت‌ها", "en-US": "Notes" },
  notesDesc: {
    "fa-IR": "تصمیم‌های اندازه‌گیری‌شدهٔ کتابخانه",
    "en-US": "The library's measured decisions",
  },
  pricing: { "fa-IR": "قیمت‌ها", "en-US": "Pricing" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <NavigationMenu label={t.nav[l]}>
      <NavigationMenuItem value="products">
        <NavigationMenuTrigger>{t.products[l]}</NavigationMenuTrigger>
        <NavigationMenuPanel>
          <NavigationMenuLink href="#lumo" description={t.lumoDesc[l]}>
            {t.lumo[l]}
          </NavigationMenuLink>
          <NavigationMenuLink href="#khroos" description={t.khroosDesc[l]}>
            {t.khroos[l]}
          </NavigationMenuLink>
        </NavigationMenuPanel>
      </NavigationMenuItem>
      <NavigationMenuItem value="resources">
        <NavigationMenuTrigger>{t.resources[l]}</NavigationMenuTrigger>
        <NavigationMenuPanel>
          <NavigationMenuLink href="#docs" description={t.docsDesc[l]}>
            {t.docs[l]}
          </NavigationMenuLink>
          <NavigationMenuLink href="#notes" description={t.notesDesc[l]}>
            {t.notes[l]}
          </NavigationMenuLink>
        </NavigationMenuPanel>
      </NavigationMenuItem>
      <NavigationMenuLink href="#pricing" isCurrent="page">
        {t.pricing[l]}
      </NavigationMenuLink>
    </NavigationMenu>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ناوبری بالای سایت با پنل محتوا: بخش‌های محصول، منوهای بزرگ. پیوندها پیوند می‌مانند.",
        "en-US": "Site-top navigation with content panels: product sections, mega menus. Links stay links.",
      },
      whenNot: {
        "fa-IR": "ناوبری کناری یک برنامه — `Sidebar`. کنش‌ها پشت یک دکمه — `Menu`. ردیف منوهای دسکتاپی — `Menubar`.",
        "en-US": "An application's side navigation — `Sidebar`. Actions behind a button — `Menu`. Desktop-style rows of menus — `Menubar`.",
      },
    },
    // Page identity — the catalog builds the page from these three fields (see lib/catalog.ts).
    tier: "navigation",
    title: { "fa-IR": "منوی ناوبری", "en-US": "Navigation menu" },
    intro: { "fa-IR": "ناوبری بالای سایت با پنل‌های محتوایی. پنل‌ها پاپ‌اورند نه منو، پس پیوندها پیوند می‌مانند؛ جای پنل با خواص منطقی تعیین می‌شود و در فارسی خودبه‌خود آینه می‌شود.", "en-US": "Site-top navigation with content panels. Panels are popovers, not menus, so links stay links; placement is logical and mirrors on its own in Persian." },
    isNew: true,
    composition: [
      `<NavigationMenu label="…">`,
      `  <NavigationMenuItem value="products">`,
      `    <NavigationMenuTrigger>…</NavigationMenuTrigger>`,
      `    <NavigationMenuPanel>`,
      `      <NavigationMenuLink href="…" description="…">…</NavigationMenuLink>`,
      `    </NavigationMenuPanel>`,
      `  </NavigationMenuItem>`,
      `  <NavigationMenuLink href="…">…</NavigationMenuLink>`,
      `</NavigationMenu>`,
    ].join("\n"),
    parts: [
      {
        name: "NavigationMenu",
        description: {
          "fa-IR": "نشانگاه nav با نام اجباری — صفحه‌ای با چند nav بی‌نام در فهرست نشانگاه‌ها یکسان خوانده می‌شود.",
          "en-US": "The nav landmark with a required name — several unnamed navs read identically in a landmark list.",
        },
      },
      {
        name: "NavigationMenuItem",
        description: {
          "fa-IR": "مالک حالت یک جفت دکمه/پنل؛ DOM ندارد.",
          "en-US": "Owns one trigger/panel pair's state; renders no DOM.",
        },
      },
      {
        name: "NavigationMenuTrigger",
        description: {
          "fa-IR": "دکمهٔ پنل با aria-expanded از خودِ موتور و شورون محور بلوکی که با چرخش ۱۸۰ درجه در هر دو خط یکسان است.",
          "en-US": "The panel's button with the engine's own aria-expanded and a block-axis chevron whose half turn reads the same in both scripts.",
        },
      },
      {
        name: "NavigationMenuPanel",
        description: {
          "fa-IR": "پنل محتوا: پاپ‌آوری در «bottom start» منطقی، پس در فارسی از لبهٔ راستِ دکمه آویزان می‌شود.",
          "en-US": "The content panel: a popover at the logical bottom start, so it hangs from the trigger's right edge in Persian.",
        },
      },
      {
        name: "NavigationMenuLink",
        description: {
          "fa-IR": "پیوندی که پیوند می‌ماند — نه menuitem — با توضیح دوخطی داخل خودِ هدف کلیک و aria-current برای صفحهٔ فعلی.",
          "en-US": "A link that stays a link — never a menuitem — with its description inside the click target and aria-current for the current page.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "ناوبری با دو پنل", "en-US": "A nav with two panels" },
      description: {
        "fa-IR": "دو دکمهٔ پنل‌دار و یک پیوند ساده که صفحهٔ فعلی است — aria-current آن را به گفتار می‌رساند، نه فقط به رنگ.",
        "en-US": "Two panel triggers and one plain link marked as the current page — aria-current states it aloud, not only in colour.",
      },
      render: BasicExample,
    },
  ],
};
