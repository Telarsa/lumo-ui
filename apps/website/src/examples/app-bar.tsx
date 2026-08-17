import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { ArrowRightIcon, EllipsisVerticalIcon, SearchIcon, Share2Icon } from "lucide-react";
import { AppBar, Button, IconButton } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the app-bar page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `app-bar.tsx` has no `"use client"` either — which is
 * only possible because `leading` and `actions` are SLOTS. An `onBack` callback
 * would be a function crossing the server boundary and would make every screen
 * header in the application a client component.
 *
 * The back arrow is the one thing on this page worth staring at. It is
 * `ArrowRightIcon` under Persian and `ArrowLeftIcon` would be wrong there: back
 * is towards the reading START, which is the right-hand side in Persian. The
 * component does not mirror the glyph for you, because a glyph is the caller's
 * content — so the example picks it per locale, and that is the honest shape.
 */

const t = {
  orderTitle: { "fa-IR": "جزئیات سفارش", "en-US": "Order details" },
  back: { "fa-IR": "بازگشت به سفارش‌ها", "en-US": "Back to orders" },
  share: { "fa-IR": "هم‌رسانی سفارش", "en-US": "Share the order" },
  more: { "fa-IR": "کنش‌های بیشتر", "en-US": "More actions" },

  inboxTitle: { "fa-IR": "صندوق ورودی", "en-US": "Inbox" },
  unreadLead: { "fa-IR": "خوانده‌نشده", "en-US": "unread" },
  search: { "fa-IR": "جست‌وجو در پیام‌ها", "en-US": "Search the messages" },

  settingsTitle: { "fa-IR": "تنظیمات حساب", "en-US": "Account settings" },
  save: { "fa-IR": "ذخیره", "en-US": "Save" },

  longTitle: {
    "fa-IR": "گزارش فروش شهریور با تفکیک هر فروشگاه و هر پیک",
    "en-US": "September sales report, broken down by storefront and by courier",
  },
} satisfies Record<string, LocalizedText>;

function WithBackExample(l: Locale) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface">
      <AppBar
        title={t.orderTitle[l]}
        leading={
          <IconButton label={t.back[l]} variant="ghost">
            <ArrowRightIcon aria-hidden="true" className="rtl:rotate-0 ltr:rotate-180" />
          </IconButton>
        }
        actions={
          <IconButton label={t.share[l]} variant="ghost">
            <Share2Icon aria-hidden="true" />
          </IconButton>
        }
      />
    </div>
  );
}

function WithSubtitleExample(l: Locale) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface">
      <AppBar
        title={t.inboxTitle[l]}
        subtitle={`${formatNumber(12, l)} ${t.unreadLead[l]}`}
        actions={
          <IconButton label={t.search[l]} variant="ghost">
            <SearchIcon aria-hidden="true" />
          </IconButton>
        }
      />
    </div>
  );
}

function TruncatingExample(l: Locale) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface">
      <AppBar
        title={t.longTitle[l]}
        actions={
          <IconButton label={t.more[l]} variant="ghost">
            <EllipsisVerticalIcon aria-hidden="true" />
          </IconButton>
        }
      />
    </div>
  );
}

function PlainExample(l: Locale) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface">
      <AppBar
        size="sm"
        divided={false}
        title={t.settingsTitle[l]}
        actions={<Button size="sm">{t.save[l]}</Button>}
      />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR":
          "سربرگ یک نما: این صفحه چیست، چطور از آن بیرون می‌آیید، و یکی دو کاری که می‌شود با آن کرد. همتای وبِ `LumoAppBar` در کتابخانهٔ موبایل.",
        "en-US":
          "The header of one view: what this screen is, how to leave it, and the one or two things you can do to it. The web counterpart of the mobile library's `LumoAppBar`.",
      },
      whenNot: {
        "fa-IR":
          "ناوبری سراسری سایت — `NavigationMenu`. فهرست کنارهٔ برنامه — `Sidebar`. ردیفی از ابزارها که با کلید جهت‌دار پیموده می‌شود — `Toolbar`.",
        "en-US":
          "Site-wide navigation — `NavigationMenu`. The app's side list — `Sidebar`. A row of tools navigated with the arrow keys — `Toolbar`.",
      },
    },
    tier: "navigation",
    title: { "fa-IR": "نوار برنامه", "en-US": "App bar" },
    intro: {
      "fa-IR":
        "نوار بالای یک نما: عنوان اجباری است، و آنچه دو طرفش می‌نشیند شکاف است نه تابع — پس یک نوار سرورساخته می‌تواند دکمهٔ کلاینتی در خود داشته باشد. عنوان از نوع LumoNode است، پس شمارشِ خام درونش کامپایل نمی‌شود. ستون عنوان اجازهٔ کوچک‌شدن دارد؛ بدون آن، یک عنوانِ بلندِ فارسی کنش‌ها را از لبه بیرون می‌راند.",
      "en-US":
        "The bar at the top of a view: the title is required, and what sits either side of it is a SLOT rather than a callback — so a server-rendered bar can hold a client button. The title is LumoNode, so a bare count inside it does not compile. The title column carries min-w-0; without it a long Persian title pushes the actions off the inline end.",
    },
    composition: [
      `<AppBar size divided level leading title subtitle actions>`,
      `                          ← leading and actions are NODES, so client`,
      `                             buttons fit inside a server-rendered bar`,
      `                          ← each slot names ITSELF: an icon is not a name`,
    ].join("\n"),
    parts: [
      {
        name: "AppBar",
        description: {
          "fa-IR":
            "کل جزء. یک `<header>` می‌سازد و جای‌گذاری‌اش با فراخوان است: `<header>`ی که درون `<section>`/`<main>` نباشد، نشانهٔ banner صفحه است و نوارِ یک نما معمولاً نباید آن را ادعا کند.",
          "en-US":
            "The whole component. It renders a `<header>`, and where it sits is the caller's call: a `<header>` outside `<section>`/`<main>` is the page's banner landmark, and a view-level bar usually should not claim that.",
        },
      },
      {
        name: "appBarVariants",
        description: {
          "fa-IR":
            "بلندی و بالشتکِ محورِ درون‌خطی (`size`) و خطِ جداکننده (`divided`). هیچ‌کدام جهت‌دار نیستند: `border-b` لبهٔ پایانِ بلوک است و میان دو خط‌نویسی قرینه نمی‌شود.",
          "en-US":
            "The height and inline padding step (`size`) and the separating rule (`divided`). Neither is directional: `border-b` is a block-end edge and does not mirror between scripts.",
        },
      },
    ],
  },
  examples: [
    {
      id: "with-back",
      title: { "fa-IR": "با بازگشت و یک کنش", "en-US": "With back and one action" },
      description: {
        "fa-IR":
          "پیکانِ بازگشت به سمت شروعِ خواندن اشاره می‌کند — در فارسی یعنی راست. جزء گلیف را برای شما قرینه نمی‌کند، چون گلیف محتوای فراخوان است؛ اینجا با چرخشِ منطقی حل شده تا در هر دو زبان درست بایستد.",
        "en-US":
          "The back arrow points towards the reading start — the right-hand side in Persian. The component does not mirror the glyph for you, because a glyph is the caller's content; here a logical rotation makes it stand correctly in both languages.",
      },
      render: WithBackExample,
    },
    {
      id: "with-subtitle",
      title: { "fa-IR": "با زیرعنوان", "en-US": "With a subtitle" },
      description: {
        "fa-IR":
          "زیرعنوان یک سطر است: یک شمارش، یک وضعیت، یک تاریخ — نه جملهٔ دوم. شمارش از formatNumber می‌گذرد، پس زیر فارسی رقم محلی می‌شود.",
        "en-US":
          "The subtitle is one line: a count, a state, a date — never a second sentence. The count goes through formatNumber, so it carries local digits under Persian.",
      },
      render: WithSubtitleExample,
    },
    {
      id: "truncating",
      title: { "fa-IR": "عنوانی که جا نمی‌شود", "en-US": "A title that does not fit" },
      description: {
        "fa-IR":
          "عنوان کوتاه می‌شود و کنش‌ها سرِ جایشان می‌مانند. این پیش‌فرض نیست: یک آیتمِ فلکس به‌طور خودکار روی عرضِ محتوایش کف می‌گذارد و کنش‌ها را بیرون می‌راند — اجازهٔ کوچک‌شدنِ ستونِ عنوان همان چیزی است که این را می‌گیرد، و آزمونِ جزء آن را ادعا می‌کند نه فرض.",
        "en-US":
          "The title truncates and the actions hold their place. That is not the default: a flex item's min-width: auto floors it at its content width and pushes the actions out — min-w-0 is what catches it, and the component's test asserts it rather than trusting it.",
      },
      render: TruncatingExample,
    },
    {
      id: "plain",
      title: { "fa-IR": "کوتاه و بی‌خط", "en-US": "Short, with no rule" },
      description: {
        "fa-IR":
          "size=\"sm\" و divided={false} برای نواری که درون یک کارت یا یک ورقه می‌نشیند و خطِ جداکنندهٔ خودش را لازم ندارد. کنشِ اصلی اینجا یک دکمهٔ متنی است، نه نماد — وقتی جا هست، کلمه بهتر از آیکون است.",
        "en-US":
          "size=\"sm\" with divided={false}, for a bar that sits inside a card or a sheet and does not need its own rule. The action here is a text button rather than an icon — when there is room, a word beats a glyph.",
      },
      render: PlainExample,
    },
  ],
};
