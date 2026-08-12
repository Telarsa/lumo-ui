/*
 * ════════════════════════════════════════════════════════════════════════════
 * EVERY BLOCK, RENDERED ONCE, UNDER fa-IR.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `blocks.test.ts` is a filesystem lint: it reads the sources as text and never
 * calls a component. That left 6,054 lines of this package with no behavioural
 * assertion of any kind — a block could throw on its first render and the suite
 * would stay green (AUDIT.md §2.9). This file is that missing first byte.
 *
 * WHAT EACH BLOCK IS ASKED. Three questions, one render:
 *
 *   1. It renders at all, to a non-empty tree.
 *   2. Its served text carries NO Latin digits. Every figure in this package
 *      goes through `formatNumber(n, locale)`; the way that promise breaks is
 *      an interpolated raw number, which is invisible in review and obvious to
 *      a Persian reader.
 *   3. Every interactive control in the output HAS AN ACCESSIBLE NAME. Blocks
 *      are compositions of components whose names are required props, so this
 *      asks the composition-level question the per-component tests cannot: that
 *      a block actually PASSES the name it demanded from its caller.
 *
 * (2) and (3) are graded by importing the SHIPPED GATE RULES rather than by a
 * local regex — the same modules `gate:html` runs over the built site, by
 * relative path, following `packages/ui/src/ssr-field-wiring.test.tsx`. A
 * copied rule is a rule that stops agreeing with the gate the day the gate
 * changes.
 *
 * `renderToStaticMarkup`, not `render()`. These blocks are measured at the
 * FIRST BYTE like everything else here: React Aria and Base UI do much of their
 * naming and describing in layout effects, so a jsdom render would show the
 * controls perfectly wired and prove nothing about the bytes a crawler, a
 * no-JS reader, or a screen reader mid-hydration actually receives.
 *
 * ── THE FIXTURES ARE THE POINT, NOT SCAFFOLDING ─────────────────────────────
 *
 * Every `*Strings` interface here is exhaustive and required by design. Writing
 * a fixture for each block therefore doubles as a proof that the interfaces are
 * CONSTRUCTIBLE — that a real translator handed the type could satisfy it. The
 * copy below is real Persian, with Persian digits, for the same reason the rest
 * of the repository refuses Lorem Ipsum: a placeholder in Latin script would
 * make rule (2) pass vacuously.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import {
  gradeHtml,
  namedControls,
  noLatinDigits,
  persianDigitFloor,
} from "../../gate/src/index.ts";

import { ActivityFeed } from "./activity-feed.tsx";
import { AppShell } from "./app-shell.tsx";
import { AuthPage } from "./auth-page.tsx";
import { BookingSummary } from "./booking-summary.tsx";
import { ChartPanel } from "./chart-panel.tsx";
import { CheckoutSummary } from "./checkout-summary.tsx";
import { CommandPalette } from "./command-palette.tsx";
import { DangerZone } from "./danger-zone.tsx";
import { DashboardPage } from "./dashboard-page.tsx";
import { DataToolbar } from "./data-toolbar.tsx";
import { EmptyCollection } from "./empty-collection.tsx";
import { Faq } from "./faq.tsx";
import { FeatureGrid } from "./feature-grid.tsx";
import { FilterBar } from "./filter-bar.tsx";
import { Footer } from "./footer.tsx";
import { Hero } from "./hero.tsx";
import { ListDetail } from "./list-detail.tsx";
import { ListingGrid } from "./listing-grid.tsx";
import { OtpVerify } from "./otp-verify.tsx";
import { PageHeader } from "./page-header.tsx";
import { RequestPasswordReset, SetNewPassword } from "./password-reset.tsx";
import { Preferences } from "./preferences.tsx";
import { PricingTable } from "./pricing-table.tsx";
import { ProductDetail } from "./product-detail.tsx";
import { SettingsForm } from "./settings-form.tsx";
import { SignIn } from "./sign-in.tsx";
import { SignUp } from "./sign-up.tsx";
import { StatGrid } from "./stat-grid.tsx";
import { TableView } from "./table-view.tsx";
import { TwoFactor } from "./two-factor.tsx";

import type { ActivityItem } from "./activity-feed.tsx";
import type { AppShellNavItem } from "./app-shell.tsx";
import type { SignInStrings } from "./sign-in.tsx";
import type { StatItem } from "./stat-grid.tsx";
import type { PageHeaderStrings } from "./page-header.tsx";
import type { ActivityFeedStrings } from "./activity-feed.tsx";
import type { StatGridStrings } from "./stat-grid.tsx";
import type { AppShellStrings } from "./app-shell.tsx";
import type { DataToolbarStrings } from "./data-toolbar.tsx";
import type { TableViewColumn } from "./table-view.tsx";

const FA = "fa-IR" as const;

/** A fixed instant, so a date-bearing block renders the same bytes every run. */
const WHEN = new Date("2026-08-11T09:30:00+03:30");
const LATER = new Date("2026-08-14T09:30:00+03:30");

/** Currency formatting used by the commerce blocks. */
const RIAL: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "IRR",
  maximumFractionDigits: 0,
};

/**
 * `alt=""` is deliberate and correct: these images are decorative beside a
 * title that already names the product, and an empty alt is the way to say so.
 * `namedControls` does not grade `<img>`, which is not an interactive control.
 */
const IMAGE = { src: "/media/backpack.avif", alt: "" };

const SIGN_IN_STRINGS: SignInStrings = {
  title: "ورود به حساب",
  description: "برای ادامه وارد شوید.",
  emailLabel: "رایانامه",
  passwordLabel: "گذرواژه",
  rememberLabel: "مرا به خاطر بسپار",
  forgotPassword: "گذرواژه‌ام را فراموش کرده‌ام",
  submit: "ورود",
  signUpPrompt: "حساب کاربری ندارید؟",
  signUpAction: "ثبت‌نام کنید",
};

const NAV: readonly AppShellNavItem[] = [
  { id: "dashboard", label: "داشبورد", href: "#", isCurrent: true },
  { id: "orders", label: "سفارش‌ها", href: "#", badge: "۸" },
  { id: "customers", label: "مشتریان", href: "#" },
];

const STATS: readonly StatItem[] = [
  { id: "revenue", label: "درآمد", value: 19500000, format: RIAL, delta: 0.12 },
  { id: "orders", label: "سفارش‌ها", value: 428, delta: -0.04 },
  { id: "customers", label: "مشتریان", value: 1260 },
];

const ACTIVITY: readonly ActivityItem[] = [
  {
    id: "one",
    actor: "سارا محمدی",
    initials: "س م",
    description: "سفارشی را تأیید کرد.",
    at: WHEN,
  },
  {
    id: "two",
    actor: "رضا کریمی",
    initials: "ر ک",
    description: "یادداشتی افزود.",
    at: WHEN,
  },
];

const SHELL_STRINGS: AppShellStrings = {
  navLabel: "ناوبری اصلی",
  skipToContent: "پرش به محتوا",
  currentPage: "صفحهٔ کنونی",
};

const HEADER_STRINGS: PageHeaderStrings = {
  title: "سفارش‌ها",
  description: "فهرست سفارش‌های این ماه.",
};

const STAT_STRINGS: StatGridStrings = {
  regionLabel: "شاخص‌های کلیدی",
  increase: "افزایش",
  decrease: "کاهش",
};

const FEED_STRINGS: ActivityFeedStrings = {
  title: "رویدادهای تازه",
  emptyTitle: "هنوز رویدادی نیست",
  emptyDescription: "وقتی کاری انجام شود اینجا دیده می‌شود.",
};

/**
 * The toolbar strings, shared by `DataToolbar` and `TableView`.
 *
 * `resultCount` takes an ALREADY-FORMATTED count — the block formats the number
 * and hands over a string, which is what keeps a Latin digit out of a sentence
 * a translator wrote.
 */
const TOOLBAR_STRINGS: DataToolbarStrings = {
  toolbarLabel: "ابزار فهرست",
  searchLabel: "جست‌وجو",
  searchClearLabel: "پاک‌کردن جست‌وجو",
  searchPlaceholder: "نام مشتری",
  sortLabel: "ترتیب",
  sortPlaceholder: "انتخاب ترتیب",
  viewLabel: "نمایش",
  viewList: "فهرستی",
  viewGrid: "شبکه‌ای",
  resultCount: (count) => `${count} نتیجه`,
};

const SORT_OPTIONS = [
  { id: "newest", label: "تازه‌ترین" },
  { id: "oldest", label: "قدیمی‌ترین" },
];

interface Row {
  id: string;
  customer: string;
  amount: number;
}

const ROWS: readonly Row[] = [
  { id: "alpha", customer: "سارا محمدی", amount: 1250000 },
  { id: "beta", customer: "رضا کریمی", amount: 640000 },
];

const COLUMNS: readonly TableViewColumn<Row>[] = [
  {
    id: "customer",
    header: "مشتری",
    isRowHeader: true,
    allowsSorting: true,
    sortValue: (row) => row.customer,
    cell: (row) => row.customer,
  },
  {
    id: "amount",
    header: "مبلغ",
    allowsSorting: true,
    sortValue: (row) => row.amount,
    cell: (row) => new Intl.NumberFormat("fa-IR", RIAL).format(row.amount),
  },
];

/**
 * Every block in the barrel, each with a complete set of required props.
 *
 * The list is asserted against `index.ts` below, so a block added to the
 * package without a fixture here fails rather than silently going unrendered —
 * which is the exact hole this file exists to close, and it would reopen the
 * first time somebody adds block 32.
 */
const BLOCKS: readonly (readonly [string, () => ReactElement])[] = [
  ["SignIn", () => <SignIn strings={SIGN_IN_STRINGS} forgotHref="#" signUpHref="#" />],

  [
    "SignUp",
    () => (
      <SignUp
        strings={{
          title: "ساخت حساب",
          nameLabel: "نام و نام خانوادگی",
          emailLabel: "رایانامه",
          passwordLabel: "گذرواژه",
          passwordHint: "دست‌کم هشت نویسه.",
          confirmLabel: "تکرار گذرواژه",
          termsPrefix: "با ساخت حساب،",
          termsLink: "شرایط استفاده",
          termsJoiner: "و",
          privacyLink: "سیاست حریم خصوصی",
          submit: "ساخت حساب",
          signInPrompt: "حساب دارید؟",
          signInAction: "وارد شوید",
        }}
        termsHref="#"
        privacyHref="#"
        signInHref="#"
      />
    ),
  ],

  [
    "OtpVerify",
    () => (
      <OtpVerify
        locale={FA}
        strings={{
          title: "تأیید رمز یک‌بارمصرف",
          description: "رمز فرستاده‌شده را وارد کنید.",
          codeLabel: "رمز تأیید",
          codeHint: "رمز شش‌رقمی پیامک‌شده.",
          submit: "تأیید",
          resend: "ارسال دوباره",
          resendIn: (seconds) => `ارسال دوباره تا ${seconds} ثانیهٔ دیگر`,
        }}
      />
    ),
  ],

  [
    "AuthPage",
    () => (
      <AuthPage
        strings={{ signIn: SIGN_IN_STRINGS, footnote: "پشتیبانی همه‌روزه پاسخ‌گوست." }}
        forgotHref="#"
        signUpHref="#"
      />
    ),
  ],

  [
    "AppShell",
    () => (
      <AppShell strings={SHELL_STRINGS} nav={NAV}>
        <p>محتوای صفحه.</p>
      </AppShell>
    ),
  ],

  [
    "DashboardPage",
    () => (
      <DashboardPage
        locale={FA}
        strings={{
          shell: SHELL_STRINGS,
          header: HEADER_STRINGS,
          stats: STAT_STRINGS,
          feed: FEED_STRINGS,
        }}
        nav={NAV}
        stats={STATS}
        activity={ACTIVITY}
      />
    ),
  ],

  [
    "PageHeader",
    () => (
      <PageHeader
        strings={HEADER_STRINGS}
        crumbs={[
          { id: "home", label: "خانه", href: "#" },
          { id: "orders", label: "سفارش‌ها" },
        ]}
        crumbsLabel="مسیر صفحه"
      />
    ),
  ],

  ["StatGrid", () => <StatGrid strings={STAT_STRINGS} items={STATS} locale={FA} />],

  [
    "ChartPanel",
    () => (
      <ChartPanel
        locale={FA}
        strings={{ title: "فروش ماهانه", description: "سه ماه گذشته" }}
        summary={[{ id: "total", label: "مجموع فصل", value: 19500000, format: RIAL }]}
        chart={<div>نمودار اینجا رندر می‌شود.</div>}
      />
    ),
  ],

  ["ActivityFeed", () => <ActivityFeed strings={FEED_STRINGS} items={ACTIVITY} locale={FA} />],

  [
    "FilterBar",
    () => (
      <FilterBar
        strings={{
          regionLabel: "پالایه‌ها",
          searchLabel: "جست‌وجو",
          searchClearLabel: "پاک‌کردن جست‌وجو",
          activeLabel: "پالایه‌های فعال",
          clearAll: "پاک‌کردن همه",
        }}
        filters={[
          {
            id: "city",
            label: "شهر",
            placeholder: "انتخاب شهر",
            options: [
              { id: "tehran", label: "تهران" },
              { id: "shiraz", label: "شیراز" },
            ],
          },
        ]}
        active={[{ id: "city", label: "شهر: تهران", removeLabel: "برداشتن پالایهٔ شهر" }]}
      />
    ),
  ],

  [
    "ListDetail",
    () => (
      <ListDetail
        strings={{
          listLabel: "فهرست پیام‌ها",
          detailLabel: "متن پیام",
          selectedLabel: "برگزیده",
          emptyTitle: "پیامی برنگزیده‌اید",
          emptyDescription: "از فهرست کناری یکی را برگزینید.",
          listEmptyTitle: "پیامی نیست",
        }}
        items={[
          { id: "alpha", title: "گزارش هفتگی", description: "خلاصهٔ کارها", badge: "تازه" },
          { id: "beta", title: "یادآوری جلسه" },
        ]}
        selectedId="alpha"
      >
        <p>متن کامل گزارش.</p>
      </ListDetail>
    ),
  ],

  [
    "DataToolbar",
    () => (
      <DataToolbar
        strings={TOOLBAR_STRINGS}
        locale={FA}
        total={128}
        sortOptions={SORT_OPTIONS}
        view="list"
      />
    ),
  ],

  [
    "EmptyCollection",
    () => (
      <EmptyCollection
        strings={{
          title: "هنوز سفارشی ثبت نشده",
          description: "نخستین سفارش که ثبت شود اینجا دیده می‌شود.",
          hintsLabel: "پیشنهادها",
        }}
        hints={[
          { id: "import", text: "سفارش‌های پیشین را درون‌ریزی کنید." },
          { id: "share", text: "نشانی فروشگاه را هم‌رسانی کنید." },
        ]}
      />
    ),
  ],

  [
    "ListingGrid",
    () => (
      <ListingGrid
        locale={FA}
        priceFormat={RIAL}
        strings={{
          regionLabel: "فهرست محصولات",
          priceLabel: "قیمت",
          rating: (value, count) => `${value} از ۵ بر پایهٔ ${count} دیدگاه`,
          emptyTitle: "محصولی یافت نشد",
        }}
        items={[
          {
            id: "backpack",
            title: "کوله‌پشتی سفر",
            href: "#",
            description: "ضدآب با جای لپ‌تاپ.",
            image: IMAGE,
            price: 2450000,
            badge: "پرفروش",
            rating: 4.6,
            ratingCount: 128,
          },
        ]}
      />
    ),
  ],

  [
    "BookingSummary",
    () => (
      <BookingSummary
        locale={FA}
        currencyFormat={RIAL}
        strings={{
          title: "خلاصهٔ رزرو",
          startLabel: "ورود",
          endLabel: "خروج",
          dateRangeJoiner: "تا",
          subtotalLabel: "جمع جزء",
          totalLabel: "مبلغ کل",
          confirm: "تأیید رزرو",
          footnote: "لغو رایگان تا یک روز پیش از ورود.",
        }}
        lines={[
          { id: "room", label: "اتاق دونفره", note: "سه شب", amount: 5400000 },
          { id: "tax", label: "مالیات", amount: 486000 },
        ]}
        subtotal={5400000}
        total={5886000}
        startsAt={WHEN}
        endsAt={LATER}
      />
    ),
  ],

  [
    "SettingsForm",
    () => (
      <SettingsForm
        strings={{
          title: "تنظیمات حساب",
          description: "این نشانی در رسیدها دیده می‌شود.",
          save: "ذخیره",
          cancel: "انصراف",
          pending: "در حال ذخیره",
          saved: "ذخیره شد",
        }}
        status="saved"
      >
        <p>میدان‌های فرم اینجا می‌آیند.</p>
      </SettingsForm>
    ),
  ],

  [
    "DangerZone",
    () => (
      <DangerZone
        confirmPhrase="حذف حساب"
        strings={{
          title: "ناحیهٔ خطر",
          description: "حذف حساب برگشت‌پذیر نیست.",
          action: "حذف حساب",
          dialogTitle: "حذف حساب؟",
          dialogDescription: "همهٔ داده‌ها برای همیشه پاک می‌شوند.",
          closeLabel: "بستن",
          confirmFieldLabel: "برای تأیید، عبارت زیر را بنویسید",
          confirmFieldDescription: "عبارت باید دقیقاً یکسان باشد.",
          mismatchError: "عبارت یکسان نیست.",
          confirm: "حذف کن",
          cancel: "انصراف",
        }}
      />
    ),
  ],

  [
    "Hero",
    () => (
      <Hero
        strings={{
          eyebrow: "تازه",
          title: "فروشگاهتان را امروز بسازید",
          description: "همه‌چیز از روز نخست فارسی و راست‌به‌چپ است.",
          primaryAction: "شروع کنید",
          secondaryAction: "بیشتر بدانید",
          footnote: "بدون نیاز به کارت بانکی.",
        }}
        primaryHref="#"
        secondaryHref="#"
      />
    ),
  ],

  [
    "FeatureGrid",
    () => (
      <FeatureGrid
        strings={{ regionLabel: "ویژگی‌ها", title: "چه چیزی می‌گیرید" }}
        items={[
          { id: "rtl", title: "راست‌به‌چپ", description: "چیدمان از روز نخست درست است." },
          { id: "digits", title: "ارقام فارسی", description: "هر عدد با ارقام خواننده." },
        ]}
      />
    ),
  ],

  [
    "PricingTable",
    () => (
      <PricingTable
        locale={FA}
        priceFormat={RIAL}
        strings={{
          regionLabel: "طرح‌های اشتراک",
          title: "یک طرح برگزینید",
          periodLabel: "ماهانه",
          included: "دارد",
          excluded: "ندارد",
          featuresLabel: "امکانات",
        }}
        plans={[
          {
            id: "starter",
            name: "پایه",
            description: "برای شروع.",
            price: 490000,
            cta: "انتخاب طرح پایه",
            href: "#",
            features: [
              { id: "seats", label: "یک کاربر", isIncluded: true },
              { id: "api", label: "دسترسی برنامه‌نویسی", isIncluded: false },
            ],
          },
          {
            id: "pro",
            name: "حرفه‌ای",
            price: 1290000,
            cta: "انتخاب طرح حرفه‌ای",
            href: "#",
            isFeatured: true,
            badge: "پیشنهاد ما",
            features: [{ id: "seats", label: "کاربر نامحدود", isIncluded: true }],
          },
        ]}
      />
    ),
  ],

  [
    "Faq",
    () => (
      <Faq
        strings={{ regionLabel: "پرسش‌های پرتکرار", title: "پرسش‌های پرتکرار" }}
        items={[
          { id: "refund", question: "شرایط بازگشت وجه چیست؟", answer: "تا هفت روز بازگشت‌پذیر است." },
          { id: "support", question: "پشتیبانی چگونه است؟", answer: "همه‌روزه پاسخ‌گو هستیم." },
        ]}
      />
    ),
  ],

  [
    "RequestPasswordReset",
    () => (
      <RequestPasswordReset
        locale={FA}
        signInHref="#"
        strings={{
          title: "بازیابی گذرواژه",
          description: "نشانی رایانامه‌تان را بنویسید.",
          emailLabel: "رایانامه",
          submit: "فرستادن پیوند بازیابی",
          backToSignIn: "بازگشت به ورود",
          sentTitle: "پیوند فرستاده شد",
          sentDescription: "صندوق ورودی‌تان را ببینید.",
          resend: "ارسال دوباره",
          resendIn: (seconds) => `ارسال دوباره تا ${seconds} ثانیهٔ دیگر`,
        }}
      />
    ),
  ],

  [
    "SetNewPassword",
    () => (
      <SetNewPassword
        strings={{
          title: "گذرواژهٔ تازه",
          passwordLabel: "گذرواژهٔ تازه",
          passwordHint: "دست‌کم هشت نویسه.",
          confirmLabel: "تکرار گذرواژه",
          submit: "ذخیرهٔ گذرواژه",
        }}
      />
    ),
  ],

  [
    "TwoFactor",
    () => (
      <TwoFactor
        strings={{
          title: "تأیید دو مرحله‌ای",
          description: "رمز نمایش‌داده‌شده در برنامهٔ تأیید را بنویسید.",
          codeLabel: "رمز تأیید",
          codeHint: "رمز شش‌رقمی برنامهٔ تأیید.",
          recoveryLabel: "رمز بازیابی",
          recoveryHint: "یکی از رمزهای ذخیره‌شده.",
          submit: "تأیید",
          rememberDevice: "این دستگاه را به خاطر بسپار",
          useRecoveryCode: "به‌جای آن از رمز بازیابی استفاده کنید",
          useAuthenticatorApp: "بازگشت به برنامهٔ تأیید",
        }}
      />
    ),
  ],

  [
    "CommandPalette",
    () => (
      <CommandPalette
        strings={{
          title: "جعبهٔ فرمان",
          description: "کاری را بنویسید یا برگزینید.",
          closeLabel: "بستن",
          inputLabel: "جست‌وجوی فرمان",
          inputPlaceholder: "نام فرمان",
          emptyMessage: "فرمانی یافت نشد",
          triggerLabel: "گشودن جعبهٔ فرمان",
        }}
        groups={[
          {
            id: "actions",
            heading: "کارها",
            items: [
              { id: "new-order", label: "سفارش تازه" },
              { id: "new-customer", label: "مشتری تازه" },
            ],
          },
        ]}
      />
    ),
  ],

  [
    "TableView",
    () => (
      <TableView<Row>
        locale={FA}
        strings={{
          toolbar: TOOLBAR_STRINGS,
          tableLabel: "سفارش‌ها",
          selectAllLabel: "گزینش همهٔ ردیف‌ها",
          selectRow: (rowLabel) => `گزینش ردیف ${rowLabel}`,
          sortAscendingLabel: "مرتب‌سازی صعودی",
          sortDescendingLabel: "مرتب‌سازی نزولی",
          emptyTitle: "سفارشی نیست",
        }}
        columns={COLUMNS}
        rows={ROWS}
        rowKey={(row) => row.id}
        rowLabel={(row) => row.customer}
        selectionMode="multiple"
        sortOptions={SORT_OPTIONS}
        pagination={{
          page: 1,
          count: 3,
          onPageChange: () => {},
          label: "صفحه‌بندی سفارش‌ها",
          previousLabel: "صفحهٔ پیشین",
          nextLabel: "صفحهٔ بعدی",
          pageLabel: (formatted) => `صفحهٔ ${formatted}`,
        }}
      />
    ),
  ],

  [
    "ProductDetail",
    () => (
      <ProductDetail
        locale={FA}
        priceFormat={RIAL}
        title="کوله‌پشتی سفر مدل آفتاب"
        description="کولهٔ ضدآب با بند قابل تنظیم."
        images={[IMAGE]}
        badge="پرفروش"
        price={2450000}
        compareAtPrice={2890000}
        rating={4.6}
        ratingCount={128}
        stock="low-stock"
        lowStockCount={3}
        variants={[
          {
            id: "color",
            label: "رنگ",
            options: [
              { id: "black", label: "مشکی" },
              { id: "navy", label: "سرمه‌ای", isAvailable: false },
            ],
          },
        ]}
        selectedVariants={{ color: "black" }}
        specs={[{ id: "material", term: "جنس", detail: "نایلون ضدآب" }]}
        quantity={1}
        strings={{
          galleryLabel: "گالری تصاویر محصول",
          galleryRoleDescription: "چرخ‌فلک",
          slideRoleDescription: "اسلاید",
          imagePrevious: "تصویر پیشین",
          imageNext: "تصویر بعدی",
          priceLabel: "قیمت",
          compareAtLabel: "قیمت پیشین",
          ratingValueLabel: (value, maxValue) => `${value} از ${maxValue}`,
          inStock: "موجود",
          outOfStock: "ناموجود",
          lowStock: (count) => `تنها ${count} عدد مانده`,
          quantityLabel: "تعداد",
          quantityDecrement: "کاهش تعداد",
          quantityIncrement: "افزایش تعداد",
          quantityRoleDescription: "شمارندهٔ تعداد",
          addToCart: "افزودن به سبد خرید",
          specsLabel: "مشخصات فنی",
        }}
      />
    ),
  ],

  [
    "CheckoutSummary",
    () => (
      <CheckoutSummary
        locale={FA}
        currencyFormat={RIAL}
        strings={{
          title: "خلاصهٔ سفارش",
          itemsLabel: "کالاها",
          quantity: (count) => `تعداد: ${count}`,
          removeItem: "برداشتن",
          removeItemLabel: (title) => `برداشتن ${title} از سبد`,
          promoLabel: "کد تخفیف",
          promoPlaceholder: "کد را بنویسید",
          promoApply: "اعمال کد",
          totalLabel: "مبلغ کل",
          confirm: "پرداخت",
          footnote: "هزینهٔ ارسال در گام بعد افزوده می‌شود.",
        }}
        items={[
          {
            id: "backpack",
            title: "کوله‌پشتی سفر",
            description: "رنگ مشکی",
            image: IMAGE,
            quantity: 2,
            lineTotal: 4900000,
          },
        ]}
        charges={[{ id: "shipping", label: "ارسال", note: "پست پیشتاز", amount: 120000 }]}
        total={5020000}
      />
    ),
  ],

  [
    "Preferences",
    () => (
      <Preferences
        strings={{
          regionLabel: "ترجیحات",
          title: "ترجیحات",
          description: "این گزینه‌ها فوری ذخیره می‌شوند.",
          pending: "در حال ذخیره",
        }}
        groups={[
          {
            id: "notifications",
            title: "آگاه‌سازی‌ها",
            description: "چه چیزی و چگونه به شما خبر داده شود.",
            items: [
              {
                id: "email",
                label: "آگاه‌سازی رایانامه‌ای",
                description: "خلاصهٔ روزانه بفرست.",
                control: { type: "switch", isSelected: true },
              },
              {
                id: "digest",
                label: "بازهٔ خلاصه",
                control: {
                  type: "select",
                  value: "daily",
                  placeholder: "انتخاب بازه",
                  options: [
                    { id: "daily", label: "روزانه" },
                    { id: "weekly", label: "هفتگی" },
                  ],
                },
              },
              {
                id: "theme",
                label: "پوسته",
                control: {
                  type: "radio",
                  value: "system",
                  options: [
                    { id: "system", label: "پیرو سامانه" },
                    { id: "dark", label: "تیره" },
                  ],
                },
              },
            ],
          },
        ]}
      />
    ),
  ],

  [
    "Footer",
    () => (
      <Footer
        strings={{ regionLabel: "پاورقی سایت", copyright: "همهٔ حقوق برای تلارسا محفوظ است." }}
        description="ابزارهایی که از روز نخست فارسی‌اند."
        groups={[
          {
            id: "product",
            title: "محصول",
            links: [
              { id: "pricing", label: "قیمت‌گذاری", href: "#" },
              { id: "docs", label: "مستندات", href: "#" },
            ],
          },
        ]}
        legalLinks={[{ id: "privacy", label: "حریم خصوصی", href: "#" }]}
      />
    ),
  ],
];

/**
 * Render one block into a whole `fa-IR` document and grade it with the shipped
 * rules. A page skeleton rather than a bare fragment because the gate's `Doc`
 * is a document — and grading the fragment alone would not be what the site
 * gets graded on.
 */
function renderAndGrade(element: ReactElement): { html: string; violations: string[] } {
  const body = renderToStaticMarkup(element);
  const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
  const violations = gradeHtml(`fa-IR/block.html`, html, [noLatinDigits, namedControls]).map(
    (v) => `${v.rule}: ${v.detail}${v.snippet === undefined ? "" : ` — ${v.snippet}`}`,
  );
  return { html: body, violations };
}

describe("blocks — every block renders under fa-IR", () => {
  it("covers every block the barrel exports (guards a vacuous pass)", async () => {
    const barrel = (await import("./index.ts")) as Record<string, unknown>;
    const exported = Object.keys(barrel).filter((k) => typeof barrel[k] === "function");
    const covered = new Set(BLOCKS.map(([name]) => name));
    expect(
      exported.filter((name) => !covered.has(name)),
      "a block is exported but never rendered here — add a fixture",
    ).toEqual([]);
  });

  it.each(BLOCKS)("%s renders to a non-empty tree", (_name, build) => {
    const { html } = renderAndGrade(build());
    // A block that renders `null` or an empty wrapper is the failure this
    // whole file exists to notice, so the floor is an element with content
    // rather than merely a non-empty string.
    expect(html.length).toBeGreaterThan(200);
    expect(html).toMatch(/^<[a-z]/);
  });

  it.each(BLOCKS)("%s serves no Latin digits and no unnamed control", (_name, build) => {
    const { violations } = renderAndGrade(build());
    expect(violations).toEqual([]);
  });
});

/**
 * ── THE ANTI-VACUITY PAIR ───────────────────────────────────────────────────
 *
 * "No Latin digits" and "no unnamed control" both pass trivially on a page that
 * renders no numbers and no controls, which is exactly the failure mode the
 * gate's own `persianDigitFloor` was written to close. Thirty-one green blocks
 * prove nothing until it is shown that (a) they really do render numbers and
 * controls, and (b) the two rules would FIRE on this package's markup if they
 * did not.
 *
 * Measured on this fixture set: 115 interactive controls and 209 Persian digits
 * across the 31 blocks. Five blocks render zero controls on purpose — StatGrid,
 * ChartPanel, ActivityFeed, FeatureGrid and EmptyCollection are read-only, and
 * EmptyCollection takes its call-to-action as a slot rather than owning one.
 *
 * The floor below is the shipped rule, not a local count. The poison twins are
 * built from real block props rather than hand-written HTML, so what fires is
 * the same code path the green assertions run.
 */
describe("blocks — the render checks can fail", () => {
  it("the blocks together clear a native-digit floor", () => {
    const body = BLOCKS.map(([, build]) => renderToStaticMarkup(build())).join("");
    const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;
    const path = "fa-IR/all-blocks.html";
    // 150 against a measured 209: a floor tight enough that a block silently
    // dropping its figures trips it, loose enough that rewording a fixture does
    // not. See `apps/website/gate.floors.json` for the same trade-off.
    expect(gradeHtml(path, html, [persianDigitFloor({ [path]: 150 })])).toEqual([]);
  });

  it("POISON: a Latin digit in a block's own copy fires no-latin-digits", () => {
    const { violations } = renderAndGrade(
      <Footer
        // A copyright line is where a Latin year most plausibly arrives, and it
        // is a caller-supplied `LumoNode` — so this is not a synthetic defect.
        strings={{ regionLabel: "پاورقی سایت", copyright: "2026 تلارسا" }}
      />,
    );
    expect(violations.join("\n")).toContain("no-latin-digits");
  });

  it("POISON: a block link with an empty label fires named-controls", () => {
    const { violations } = renderAndGrade(
      <Footer
        strings={{ regionLabel: "پاورقی سایت", copyright: "همهٔ حقوق محفوظ است." }}
        // An empty string satisfies `label: string`. The type system cannot
        // catch it; this is the layer that can.
        legalLinks={[{ id: "privacy", label: "", href: "#" }]}
      />,
    );
    expect(violations.join("\n")).toContain("named-controls");
  });
});
