import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { formatDate, formatNumber } from "@lumo-ui/core";
import {
  ActivityFeed,
  AppShell,
  AuthPage,
  BookingSummary,
  ChartPanel,
  CommandPalette,
  DangerZone,
  DashboardPage,
  EmptyCollection,
  Faq,
  FeatureGrid,
  FilterBar,
  Footer,
  Hero,
  ListDetail,
  PageHeader,
  Preferences,
  PricingTable,
  SetNewPassword,
  SettingsForm,
  SignIn,
  SignUp,
  StatGrid,
  TwoFactor,
  type ActivityItem,
  type AppShellNavItem,
  type BookingLine,
  type ChartPanelSummaryItem,
  type CheckoutCharge,
  type CheckoutItem,
  type CommandPaletteGroup,
  type Feature,
  type FooterLinkGroup,
  type ListDetailItem,
  type Listing,
  type PageHeaderCrumb,
  type PreferenceGroup,
  type PricingPlan,
  type ProductVariantGroup,
} from "@lumo-ui/blocks";
import {
  Badge,
  Button,
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
  TextField,
} from "@lumo-ui/ui";
import { ChartIsland } from "@/components/demo-islands";
import {
  CheckoutSummaryIsland,
  DataToolbarIsland,
  ListingGridIsland,
  OtpVerifyIsland,
  ProductDetailIsland,
  RequestPasswordResetIsland,
  TableViewIsland,
  type OrderRow,
} from "@/app/view-block/block-islands";

/**
 * The blocks gallery — data for both the card-grid index and every block's own
 * full-page preview.
 *
 * A block is a whole screen, and stacking 28 of them on one page (the v0.4
 * gallery's original shape) is neither reviewable nor honest about how any one
 * of them looks in use. So the index (`[lang]/blocks/page.tsx`) shows a card
 * per block — name, one-line intro, no live render — and each block gets its
 * OWN route: `[lang]/blocks/<slug>/` for the write-up, `view-block/<lang>/<slug>/`
 * for the block rendered alone in a real document. That second route is what
 * "full-page preview" means: `AppShell` at `min-h-dvh` actually gets a whole
 * page to occupy, rather than a card 224px tall.
 *
 * Every block takes ALL of its text as a required `strings` prop, so each entry
 * below supplies a complete Persian and English set — there is no default to
 * silently fall back to English.
 *
 * ── WHY SEVEN ENTRIES GO THROUGH `block-islands.tsx` ────────────────────────
 *
 * This file reads block source off disk with `node:fs` at module scope (see
 * `source()` below), exactly as `demos.tsx` does — which is what keeps it a
 * server module. A server module cannot pass a FUNCTION prop to a Client
 * Component: React has nothing to serialise a closure into. Seven blocks
 * require one directly in their `strings` contract — `otp-verify`,
 * `password-reset`, `data-toolbar`, `table-view`, `listing-grid`,
 * `checkout-summary`, `product-detail` — because a sentence like «فقط ۳ عدد
 * باقی مانده» does not place its number where "Only 3 left" places its own, so
 * the library asks for a function rather than a template with a hole in it
 * (see `otp-verify.tsx`'s header for the full argument). Those seven are
 * composed through a small Client Component in `view-block/block-islands.tsx`
 * that takes only plain, serialisable props and builds the closure itself —
 * the same move `demo-islands.tsx` already makes for `Rating`, `Pagination`,
 * `Toast` and `Chart`. No copy lives in the islands file; every word below is
 * still authored here, in both locales.
 */

const BLOCKS_SRC = join(process.cwd(), "..", "..", "packages", "blocks", "src");

function source(file: string): string {
  try {
    return readFileSync(join(BLOCKS_SRC, file), "utf8");
  } catch {
    return `// ${file} — source unavailable at build time`;
  }
}

/**
 * A neutral 4:3 placeholder, inlined as a data URI. No network fetch and no
 * asset to keep in sync — a block that needs "some image" (a gallery, a cart
 * thumbnail) is demonstrating layout, not sourcing photography.
 */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23dcdcdc'/%3E%3C/svg%3E";

/**
 * Fixed points in time. A `new Date()` here would change the prerendered bytes
 * on every build, and a Jalali date is exactly the kind of value nobody
 * notices drifting — `activity-feed.tsx` and `booking-summary.tsx` both format
 * these under `fa-IR`'s own calendar.
 */
const T_ORDER_PLACED = new Date("2026-08-09T14:20:00Z");
const T_INVOICE_PAID = new Date("2026-08-09T11:05:00Z");
const T_MEMBER_ADDED = new Date("2026-08-08T19:40:00Z");
const CHECK_IN = new Date("2026-08-15T00:00:00Z");
const CHECK_OUT = new Date("2026-08-18T00:00:00Z");
const ROW_DATE_1 = new Date("2026-08-09T09:10:00Z");
const ROW_DATE_2 = new Date("2026-08-08T16:45:00Z");
const ROW_DATE_3 = new Date("2026-08-08T10:05:00Z");
const ROW_DATE_4 = new Date("2026-08-07T13:30:00Z");
const ROW_DATE_5 = new Date("2026-08-06T08:55:00Z");

export const CATEGORIES = [
  "auth",
  "shell",
  "dashboard",
  "data",
  "commerce",
  "settings",
  "marketing",
] as const;

export type BlockCategory = (typeof CATEGORIES)[number];

export const categoryLabel: Record<BlockCategory, Record<Locale, string>> = {
  auth: { "fa-IR": "احراز هویت", "en-US": "Auth" },
  shell: { "fa-IR": "چارچوب برنامه", "en-US": "App shell" },
  dashboard: { "fa-IR": "داشبورد", "en-US": "Dashboard" },
  data: { "fa-IR": "داده", "en-US": "Data" },
  commerce: { "fa-IR": "فروشگاه", "en-US": "Commerce" },
  settings: { "fa-IR": "تنظیمات", "en-US": "Settings" },
  marketing: { "fa-IR": "بازاریابی", "en-US": "Marketing" },
};

export interface BlockDemo {
  id: string;
  category: BlockCategory;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
  source: string;
}

const BLOCKS: BlockDemo[] = [
  /* ══════════════════════════════════════════════════════════════════ auth ══ */
  {
    id: "auth-page",
    category: "auth",
    title: { "fa-IR": "صفحهٔ ورود کامل", "en-US": "Auth page" },
    intro: {
      "fa-IR": "کل مسیر ورود در یک تکه: نشان محصول، کارت ورود و خط پانوشت، وسط‌چین در ارتفاع کامل نما. چیزی که به‌جای یک بخش، یک صفحهٔ کامل جای‌گذاری می‌شود.",
      "en-US": "The whole sign-in route in one piece: brand mark, the sign-in card, a footnote line, centred in the full viewport. Pasted as an entire page, not as a section.",
    },
    source: source("auth-page.tsx"),
    render: (l) => (
      <AuthPage
        forgotHref="#"
        signUpHref="#"
        brand={
          <span className="text-lg font-semibold text-fg">
            {l === "fa-IR" ? "فروشگاه نوین" : "Novin Shop"}
          </span>
        }
        strings={{
          signIn: {
            title: l === "fa-IR" ? "ورود به حساب کاربری" : "Sign in to your account",
            description:
              l === "fa-IR"
                ? "خوش برگشتید! برای ادامه، اطلاعات حساب خود را وارد کنید."
                : "Welcome back! Enter your account details to continue.",
            emailLabel: l === "fa-IR" ? "ایمیل" : "Email",
            emailPlaceholder: l === "fa-IR" ? "نشانی ایمیل شما" : "you@company.com",
            passwordLabel: l === "fa-IR" ? "رمز عبور" : "Password",
            passwordPlaceholder: l === "fa-IR" ? "دست‌کم ۸ نویسه" : "At least 8 characters",
            rememberLabel: l === "fa-IR" ? "مرا به خاطر بسپار" : "Remember me",
            forgotPassword: l === "fa-IR" ? "رمز عبور را فراموش کرده‌اید؟" : "Forgot password?",
            submit: l === "fa-IR" ? "ورود به حساب" : "Sign in",
            signUpPrompt: l === "fa-IR" ? "هنوز حساب کاربری ندارید؟" : "Don't have an account?",
            signUpAction: l === "fa-IR" ? "رایگان ثبت‌نام کنید" : "Sign up for free",
          },
          footnote:
            l === "fa-IR"
              ? "ورود شما به معنای پذیرش شرایط استفاده و حریم خصوصی فروشگاه نوین است."
              : "By signing in you agree to Novin Shop's terms of service and privacy policy.",
        }}
      />
    ),
  },
  {
    id: "sign-in",
    category: "auth",
    title: { "fa-IR": "ورود به حساب", "en-US": "Sign in" },
    intro: {
      "fa-IR": "فرم ورود با ایمیل و رمز عبور. سرتیتر اصلی صفحه را خودش می‌سازد، چون صفحهٔ ورود خودِ صفحه است، نه بخشی از آن.",
      "en-US": "An email-and-password sign-in form. It owns a real h1, because an auth screen IS the page rather than a section of one.",
    },
    source: source("sign-in.tsx"),
    render: (l) => (
      <SignIn
        forgotHref="#"
        signUpHref="#"
        strings={{
          title: l === "fa-IR" ? "ورود به حساب کاربری" : "Sign in to your account",
          description:
            l === "fa-IR" ? "خوش برگشتید! اطلاعات خود را وارد کنید." : "Welcome back! Enter your details.",
          emailLabel: l === "fa-IR" ? "ایمیل" : "Email",
          passwordLabel: l === "fa-IR" ? "رمز عبور" : "Password",
          rememberLabel: l === "fa-IR" ? "مرا به خاطر بسپار" : "Remember me",
          forgotPassword: l === "fa-IR" ? "رمز عبور را فراموش کرده‌اید؟" : "Forgot password?",
          submit: l === "fa-IR" ? "ورود" : "Sign in",
          signUpPrompt: l === "fa-IR" ? "هنوز حساب کاربری ندارید؟" : "Don't have an account?",
          signUpAction: l === "fa-IR" ? "ثبت‌نام کنید" : "Sign up",
        }}
      />
    ),
  },
  {
    id: "sign-up",
    category: "auth",
    title: { "fa-IR": "ساخت حساب", "en-US": "Sign up" },
    intro: {
      "fa-IR": "فرم ثبت‌نام. ردیف پذیرش شرایط از چهار رشتهٔ جدا ساخته می‌شود، نه یک قالب با یک جای‌خالی، چون ترتیب جمله در فارسی یکی نیست.",
      "en-US": "The account-creation form. The consent row is assembled from four separate strings rather than one template with a hole, because Persian clause order is not English's.",
    },
    source: source("sign-up.tsx"),
    render: (l) => (
      <SignUp
        termsHref="#"
        privacyHref="#"
        signInHref="#"
        strings={{
          title: l === "fa-IR" ? "ساخت حساب کاربری" : "Create your account",
          description:
            l === "fa-IR"
              ? "برای شروع، اطلاعات زیر را تکمیل کنید."
              : "Fill in the details below to get started.",
          nameLabel: l === "fa-IR" ? "نام و نام خانوادگی" : "Full name",
          emailLabel: l === "fa-IR" ? "ایمیل" : "Email",
          passwordLabel: l === "fa-IR" ? "رمز عبور" : "Password",
          passwordHint:
            l === "fa-IR" ? "دست‌کم ۸ نویسه، همراه با یک عدد." : "At least 8 characters, including a number.",
          confirmLabel: l === "fa-IR" ? "تکرار رمز عبور" : "Confirm password",
          termsPrefix: l === "fa-IR" ? "می‌پذیرم که" : "I agree to the",
          termsLink: l === "fa-IR" ? "شرایط استفاده" : "terms of service",
          termsJoiner: l === "fa-IR" ? "و" : "and the",
          privacyLink: l === "fa-IR" ? "حریم خصوصی را خوانده‌ام" : "privacy policy",
          submit: l === "fa-IR" ? "ساخت حساب" : "Create account",
          signInPrompt: l === "fa-IR" ? "پیش از این حساب داشته‌اید؟" : "Already have an account?",
          signInAction: l === "fa-IR" ? "وارد شوید" : "Sign in",
        }}
      />
    ),
  },
  {
    id: "otp-verify",
    category: "auth",
    title: { "fa-IR": "تأیید کد پیامکی", "en-US": "OTP verify" },
    intro: {
      "fa-IR": "مرحلهٔ کد پیامکی. شمارندهٔ ارسال دوباره یک تابع روی ثانیهٔ فرمت‌شده است، نه یک قالب، چون «۴۵ ثانیهٔ دیگر» عدد را جای دیگری می‌نشاند.",
      "en-US": "The SMS-code step. The resend countdown is a function of the already-formatted seconds, not a template — «45 seconds left» places its number somewhere English doesn't.",
    },
    source: source("otp-verify.tsx"),
    render: (l) => (
      <OtpVerifyIsland
        locale={l}
        title={l === "fa-IR" ? "تأیید کد پیامکی" : "Verify your code"}
        description={
          l === "fa-IR"
            ? "کد تأییدی برای شمارهٔ همراه شما پیامک شد."
            : "A verification code was texted to your phone number."
        }
        codeLabel={l === "fa-IR" ? "کد تأیید" : "Verification code"}
        codeHint={l === "fa-IR" ? "کد شش‌رقمی را وارد کنید" : "Enter the 6-digit code"}
        submit={l === "fa-IR" ? "تأیید کد" : "Verify code"}
        resend={l === "fa-IR" ? "ارسال دوبارهٔ کد" : "Resend code"}
        resendInPrefix={l === "fa-IR" ? "ارسال دوباره تا " : "Resend in "}
        resendInSuffix={l === "fa-IR" ? " ثانیهٔ دیگر" : "s"}
        resendAfterSeconds={45}
        length={6}
      />
    ),
  },
  {
    id: "password-reset",
    category: "auth",
    title: { "fa-IR": "بازیابی رمز عبور", "en-US": "Password reset" },
    intro: {
      "fa-IR": "دو صفحه، دو مسیر: درخواست پیوند بازیابی و سپس تعیین رمز تازه. یک کامپوننت با یک مرحلهٔ درونی نیستند، چون پیوند ایمیل‌شده به نشانی دیگری می‌رود.",
      "en-US": "Two screens, two routes: requesting the reset link, then setting a new password. Not one component with a stage prop — the emailed link points at a different URL.",
    },
    source: source("password-reset.tsx"),
    render: (l) => (
      <div className="flex flex-col gap-8 py-8">
        <RequestPasswordResetIsland
          locale={l}
          signInHref="#"
          status="sent"
          title={l === "fa-IR" ? "بازیابی رمز عبور" : "Reset your password"}
          description={
            l === "fa-IR"
              ? "نشانی ایمیل خود را وارد کنید تا پیوند بازیابی برایتان ارسال شود."
              : "Enter your email address and we'll send you a reset link."
          }
          emailLabel={l === "fa-IR" ? "ایمیل" : "Email"}
          submit={l === "fa-IR" ? "ارسال پیوند بازیابی" : "Send reset link"}
          backToSignIn={l === "fa-IR" ? "بازگشت به ورود" : "Back to sign in"}
          sentTitle={l === "fa-IR" ? "ایمیل خود را بررسی کنید" : "Check your email"}
          sentDescription={
            l === "fa-IR"
              ? "اگر حسابی با این نشانی وجود داشته باشد، پیوند بازیابی برایش ارسال شد."
              : "If an account exists for that address, a reset link was sent."
          }
          resend={l === "fa-IR" ? "ارسال دوبارهٔ پیوند" : "Resend link"}
          resendInPrefix={l === "fa-IR" ? "ارسال دوباره تا " : "Resend in "}
          resendInSuffix={l === "fa-IR" ? " ثانیهٔ دیگر" : "s"}
          resendAfterSeconds={40}
        />
        <SetNewPassword
          strings={{
            title: l === "fa-IR" ? "تعیین رمز تازه" : "Set a new password",
            description: l === "fa-IR" ? "رمز تازهٔ خود را وارد کنید." : "Enter your new password.",
            passwordLabel: l === "fa-IR" ? "رمز عبور تازه" : "New password",
            passwordHint:
              l === "fa-IR" ? "دست‌کم ۸ نویسه، همراه با یک عدد." : "At least 8 characters, including a number.",
            confirmLabel: l === "fa-IR" ? "تکرار رمز عبور" : "Confirm password",
            submit: l === "fa-IR" ? "ذخیرهٔ رمز تازه" : "Save new password",
          }}
        />
      </div>
    ),
  },
  {
    id: "two-factor",
    category: "auth",
    title: { "fa-IR": "تأیید دومرحله‌ای", "en-US": "Two-factor" },
    intro: {
      "fa-IR": "چالش برنامهٔ احرازهویت، با یک ورودی جایگزین برای کد بازیابی. برخلاف کد پیامکی، اینجا چیزی برای «ارسال دوباره» نیست.",
      "en-US": "The authenticator-app challenge, with an alternate recovery-code input. Unlike the SMS step, there is nothing here to resend.",
    },
    source: source("two-factor.tsx"),
    render: (l) => (
      <TwoFactor
        strings={{
          title: l === "fa-IR" ? "تأیید دومرحله‌ای" : "Two-factor verification",
          description:
            l === "fa-IR"
              ? "کد شش‌رقمی برنامهٔ احرازهویت خود را وارد کنید."
              : "Enter the 6-digit code from your authenticator app.",
          codeLabel: l === "fa-IR" ? "کد تأیید" : "Authentication code",
          codeHint: l === "fa-IR" ? "کد شش‌رقمی" : "6-digit code",
          recoveryLabel: l === "fa-IR" ? "کد بازیابی" : "Recovery code",
          recoveryHint:
            l === "fa-IR"
              ? "کد بازیابی را هنگام فعال‌سازی این ویژگی دریافت کرده‌اید."
              : "You received recovery codes when you enabled this feature.",
          submit: l === "fa-IR" ? "تأیید و ورود" : "Verify and sign in",
          rememberDevice: l === "fa-IR" ? "این دستگاه را به خاطر بسپار" : "Remember this device",
          useRecoveryCode: l === "fa-IR" ? "استفاده از کد بازیابی" : "Use a recovery code instead",
          useAuthenticatorApp:
            l === "fa-IR" ? "استفاده از برنامهٔ احرازهویت" : "Use authenticator app instead",
        }}
      />
    ),
  },

  /* ═════════════════════════════════════════════════════════════════ shell ══ */
  {
    id: "app-shell",
    category: "shell",
    title: { "fa-IR": "چارچوب برنامه", "en-US": "App shell" },
    intro: {
      "fa-IR": "نوار کناری روی لبهٔ خواندن و یک نوار بالا. بدون «use client»، چون هیچ callbackای اینجا نیست و مسیرها فقط href هستند.",
      "en-US": "A sidebar on the reading edge and a top bar. No \"use client\" — routes are hrefs and there is no callback here to require one.",
    },
    source: source("app-shell.tsx"),
    render: (l) => {
      const nav: AppShellNavItem[] = [
        { id: "dashboard", label: l === "fa-IR" ? "داشبورد" : "Dashboard", href: "#", isCurrent: true },
        {
          id: "orders",
          label: l === "fa-IR" ? "سفارش‌ها" : "Orders",
          href: "#",
          badge: formatNumber(12, l),
        },
        { id: "customers", label: l === "fa-IR" ? "مشتریان" : "Customers", href: "#" },
        {
          id: "products",
          label: l === "fa-IR" ? "محصولات" : "Products",
          href: "#",
          badge: formatNumber(4, l),
        },
        { id: "reports", label: l === "fa-IR" ? "گزارش‌ها" : "Reports", href: "#" },
        { id: "settings", label: l === "fa-IR" ? "تنظیمات" : "Settings", href: "#" },
      ];
      return (
        <AppShell
          strings={{
            navLabel: l === "fa-IR" ? "ناوبری اصلی" : "Main navigation",
            skipToContent: l === "fa-IR" ? "پرش به محتوای اصلی" : "Skip to main content",
            currentPage: l === "fa-IR" ? "صفحهٔ فعلی" : "Current page",
          }}
          nav={nav}
          brand={
            <span className="text-sm font-semibold text-fg">
              {l === "fa-IR" ? "فروشگاه نوین" : "Novin Shop"}
            </span>
          }
          topBarStart={
            <span className="truncate text-sm font-medium text-fg-muted">
              {l === "fa-IR" ? "فضای کاری تیم فروش" : "Sales team workspace"}
            </span>
          }
          topBarEnd={<Button size="sm">{l === "fa-IR" ? "سفارش تازه" : "New order"}</Button>}
          sidebarFooter={
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-fg">
                {l === "fa-IR" ? "سارا محمدی" : "Sara Mohammadi"}
              </p>
              <p className="text-xs text-fg-subtle">
                {l === "fa-IR" ? "طرح حرفه‌ای — تمدید در مهر" : "Pro plan — renews in October"}
              </p>
            </div>
          }
        >
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold text-fg">
                {l === "fa-IR" ? "داشبورد" : "Dashboard"}
              </h1>
              <p className="max-w-prose text-sm text-fg-muted">
                {l === "fa-IR"
                  ? "محتوای هر مسیر همین‌جا، درون عنصر main، قرار می‌گیرد — سربرگ، شاخص‌ها و هرچه صفحه لازم دارد."
                  : "Every route's content lands right here, inside the main element — the header, the figures, whatever the page needs."}
              </p>
            </div>
            <StatGrid
              locale={l}
              cols="3"
              className="px-0"
              strings={{
                regionLabel: l === "fa-IR" ? "شاخص‌های امروز" : "Today's metrics",
                increase: l === "fa-IR" ? "افزایش" : "increase",
                decrease: l === "fa-IR" ? "کاهش" : "decrease",
              }}
              items={[
                {
                  id: "revenue",
                  label: l === "fa-IR" ? "درآمد امروز" : "Today's revenue",
                  value: 18400000,
                  format: { notation: "compact" },
                  delta: 0.082,
                },
                {
                  id: "open-orders",
                  label: l === "fa-IR" ? "سفارش‌های باز" : "Open orders",
                  value: 34,
                  delta: -0.05,
                },
                {
                  id: "visitors",
                  label: l === "fa-IR" ? "بازدید امروز" : "Today's visitors",
                  value: 2180,
                  delta: 0.114,
                },
              ]}
            />
          </div>
        </AppShell>
      );
    },
  },
  {
    id: "page-header",
    category: "shell",
    title: { "fa-IR": "سربرگ صفحه", "en-US": "Page header" },
    intro: {
      "fa-IR": "نوار بالای یک مسیر: مسیر راهنما، عنوان، توضیح و کنش‌ها. برچسب مسیر راهنما وقتی crumbs هست اجباری می‌شود، وگرنه غیرقابل‌نوشتن است.",
      "en-US": "The band atop a route: breadcrumbs, title, description, actions. The trail's label becomes required exactly when crumbs are present, and unwritable otherwise.",
    },
    source: source("page-header.tsx"),
    render: (l) => {
      const crumbs: PageHeaderCrumb[] = [
        { id: "home", label: l === "fa-IR" ? "خانه" : "Home", href: "#" },
        { id: "orders", label: l === "fa-IR" ? "سفارش‌ها" : "Orders", href: "#" },
        { id: "detail", label: l === "fa-IR" ? "سفارش #۱۰۴۲" : "Order #1042" },
      ];
      return (
        <div className="p-6">
          <PageHeader
            strings={{
              title: l === "fa-IR" ? "سفارش #۱۰۴۲" : "Order #1042",
              description:
                l === "fa-IR"
                  ? "ثبت‌شده به‌دست سارا محمدی."
                  : "Placed by Sara Mohammadi.",
            }}
            crumbs={crumbs}
            crumbsLabel={l === "fa-IR" ? "مسیر صفحه" : "Breadcrumb trail"}
            actions={<Button size="sm">{l === "fa-IR" ? "چاپ فاکتور" : "Print invoice"}</Button>}
          />
        </div>
      );
    },
  },
  {
    id: "command-palette",
    category: "shell",
    title: { "fa-IR": "پالت فرمان", "en-US": "Command palette" },
    intro: {
      "fa-IR": "کادر جستجو به‌همراه گروه‌های اقدام. آیکون‌ها یک خانهٔ caller-supplied هستند، چون این بسته هیچ کتابخانهٔ آیکونی همراه ندارد.",
      "en-US": "A search box with grouped actions. Icons are a caller-supplied slot, because this package carries no icon library of its own.",
    },
    source: source("command-palette.tsx"),
    render: (l) => {
      const groups: CommandPaletteGroup[] = [
        {
          id: "actions",
          heading: l === "fa-IR" ? "اقدامات" : "Actions",
          items: [
            { id: "new-order", label: l === "fa-IR" ? "سفارش تازه" : "New order", shortcut: ["Ctrl", "N"] },
            { id: "new-customer", label: l === "fa-IR" ? "مشتری تازه" : "New customer" },
          ],
        },
        {
          id: "navigate",
          heading: l === "fa-IR" ? "پیمایش" : "Navigate",
          items: [
            { id: "dashboard", label: l === "fa-IR" ? "داشبورد" : "Dashboard", href: "#" },
            { id: "settings", label: l === "fa-IR" ? "تنظیمات" : "Settings", href: "#" },
          ],
        },
      ];
      return (
        <div className="flex justify-center p-6">
          <CommandPalette
            strings={{
              title: l === "fa-IR" ? "پالت فرمان" : "Command palette",
              description: l === "fa-IR" ? "برای اجرای یک فرمان جست‌وجو کنید" : "Search for a command to run",
              closeLabel: l === "fa-IR" ? "بستن پنجره" : "Close dialog",
              inputLabel: l === "fa-IR" ? "جست‌وجوی فرمان" : "Search commands",
              inputPlaceholder: l === "fa-IR" ? "یک فرمان بنویسید" : "Type a command",
              emptyMessage: l === "fa-IR" ? "فرمانی پیدا نشد" : "No matching command",
              triggerLabel: l === "fa-IR" ? "جست‌وجوی فرمان‌ها…" : "Search commands…",
            }}
            groups={groups}
            triggerShortcut={["Ctrl", "K"]}
          />
        </div>
      );
    },
  },

  /* ═════════════════════════════════════════════════════════════ dashboard ══ */
  {
    id: "dashboard-page",
    category: "dashboard",
    title: { "fa-IR": "صفحهٔ داشبورد کامل", "en-US": "Dashboard page" },
    intro: {
      "fa-IR": "چارچوب برنامه با محتوای واقعی: سربرگ مسیر، شبکهٔ شاخص‌ها، ناحیهٔ جدول و فهرست فعالیت، همه سرِ جای خودشان. ناحیهٔ جدول یک slot است تا مرز کلاینت با caller بماند.",
      "en-US": "The app shell with real content in it: route header, stat grid, a table region and the activity feed, each in its place. The table region is a slot, so the client boundary stays with the caller.",
    },
    source: source("dashboard-page.tsx"),
    render: (l) => {
      const currency = { style: "currency", currency: "IRR", maximumFractionDigits: 0 } as const;
      const orders = [
        { id: "1042", customer: l === "fa-IR" ? "سارا محمدی" : "Sara Mohammadi", at: ROW_DATE_1, amount: 1250000, status: "paid" },
        { id: "1041", customer: l === "fa-IR" ? "رضا کریمی" : "Reza Karimi", at: ROW_DATE_2, amount: 640000, status: "pending" },
        { id: "1040", customer: l === "fa-IR" ? "نگار حسینی" : "Negar Hosseini", at: ROW_DATE_3, amount: 2100000, status: "paid" },
        { id: "1039", customer: l === "fa-IR" ? "امیر توکلی" : "Amir Tavakoli", at: ROW_DATE_4, amount: 480000, status: "canceled" },
      ] as const;
      const statusLabel: Record<(typeof orders)[number]["status"], string> =
        l === "fa-IR"
          ? { paid: "پرداخت‌شده", pending: "در انتظار", canceled: "لغوشده" }
          : { paid: "Paid", pending: "Pending", canceled: "Canceled" };
      const statusTone = { paid: "positive", pending: "neutral", canceled: "critical" } as const;
      return (
        <DashboardPage
          locale={l}
          strings={{
            shell: {
              navLabel: l === "fa-IR" ? "ناوبری اصلی" : "Main navigation",
              skipToContent: l === "fa-IR" ? "پرش به محتوای اصلی" : "Skip to main content",
              currentPage: l === "fa-IR" ? "صفحهٔ فعلی" : "Current page",
            },
            header: {
              title: l === "fa-IR" ? "داشبورد فروش" : "Sales dashboard",
              description:
                l === "fa-IR"
                  ? "نمای کلی امروز فروشگاه: درآمد، سفارش‌ها و فعالیت تیم."
                  : "Today's overview of the shop: revenue, orders and the team's activity.",
            },
            stats: {
              regionLabel: l === "fa-IR" ? "شاخص‌های کلیدی" : "Key metrics",
              increase: l === "fa-IR" ? "افزایش" : "increase",
              decrease: l === "fa-IR" ? "کاهش" : "decrease",
            },
            feed: {
              title: l === "fa-IR" ? "فعالیت اخیر" : "Recent activity",
              emptyTitle: l === "fa-IR" ? "هنوز فعالیتی ثبت نشده" : "No activity yet",
            },
          }}
          nav={[
            { id: "dashboard", label: l === "fa-IR" ? "داشبورد" : "Dashboard", href: "#", isCurrent: true },
            { id: "orders", label: l === "fa-IR" ? "سفارش‌ها" : "Orders", href: "#", badge: formatNumber(8, l) },
            { id: "customers", label: l === "fa-IR" ? "مشتریان" : "Customers", href: "#" },
            { id: "products", label: l === "fa-IR" ? "محصولات" : "Products", href: "#" },
            { id: "settings", label: l === "fa-IR" ? "تنظیمات" : "Settings", href: "#" },
          ]}
          brand={
            <span className="text-sm font-semibold text-fg">
              {l === "fa-IR" ? "فروشگاه نوین" : "Novin Shop"}
            </span>
          }
          topBarStart={
            <span className="truncate text-sm font-medium text-fg-muted">
              {l === "fa-IR" ? "فضای کاری تیم فروش" : "Sales team workspace"}
            </span>
          }
          topBarEnd={
            <Button variant="ghost" size="sm">
              {l === "fa-IR" ? "راهنما" : "Help"}
            </Button>
          }
          sidebarFooter={
            <p className="text-xs text-fg-subtle">
              {l === "fa-IR" ? "طرح حرفه‌ای — تمدید در مهر" : "Pro plan — renews in October"}
            </p>
          }
          headerActions={
            <>
              <Button variant="outline" size="sm">
                {l === "fa-IR" ? "برون‌بری گزارش" : "Export report"}
              </Button>
              <Button size="sm">{l === "fa-IR" ? "سفارش تازه" : "New order"}</Button>
            </>
          }
          stats={[
            {
              id: "revenue",
              label: l === "fa-IR" ? "درآمد امروز" : "Today's revenue",
              value: 18400000,
              format: { notation: "compact" },
              delta: 0.082,
              deltaCaption: l === "fa-IR" ? "نسبت به دیروز" : "vs yesterday",
            },
            {
              id: "orders",
              label: l === "fa-IR" ? "سفارش‌های باز" : "Open orders",
              value: 34,
              delta: -0.05,
              deltaCaption: l === "fa-IR" ? "نسبت به هفتهٔ گذشته" : "vs last week",
            },
            {
              id: "customers",
              label: l === "fa-IR" ? "مشتریان تازه" : "New customers",
              value: 126,
              delta: 0.114,
              deltaCaption: l === "fa-IR" ? "نسبت به ماه گذشته" : "vs last month",
            },
            {
              id: "refunds",
              label: l === "fa-IR" ? "نرخ بازگشت وجه" : "Refund rate",
              value: 0.018,
              format: { style: "percent", maximumFractionDigits: 1 },
              delta: -0.003,
            },
          ]}
          activity={[
            {
              id: "a1",
              actor: l === "fa-IR" ? "سارا محمدی" : "Sara Mohammadi",
              initials: l === "fa-IR" ? "س م" : "SM",
              description: l === "fa-IR" ? "سفارش #۱۰۴۲ را ثبت کرد." : "placed order #1042.",
              at: T_ORDER_PLACED,
            },
            {
              id: "a2",
              actor: l === "fa-IR" ? "رضا کریمی" : "Reza Karimi",
              initials: l === "fa-IR" ? "ر ک" : "RK",
              description: l === "fa-IR" ? "فاکتور را پرداخت کرد." : "paid the invoice.",
              at: T_INVOICE_PAID,
            },
            {
              id: "a3",
              actor: l === "fa-IR" ? "نگار حسینی" : "Negar Hosseini",
              initials: l === "fa-IR" ? "ن ح" : "NH",
              description: l === "fa-IR" ? "عضو تازه‌ای به تیم افزود." : "added a new team member.",
              at: T_MEMBER_ADDED,
            },
            {
              id: "a4",
              actor: l === "fa-IR" ? "امیر توکلی" : "Amir Tavakoli",
              initials: l === "fa-IR" ? "ا ت" : "AT",
              description: l === "fa-IR" ? "سفارش #۱۰۳۹ را لغو کرد." : "canceled order #1039.",
              at: ROW_DATE_4,
            },
          ]}
          tableRegion={
            <section className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between gap-2 p-4 pbe-3">
                <h2 className="text-sm font-semibold text-fg">
                  {l === "fa-IR" ? "آخرین سفارش‌ها" : "Latest orders"}
                </h2>
                <Button variant="ghost" size="sm">
                  {l === "fa-IR" ? "دیدن همه" : "View all"}
                </Button>
              </div>
              <div className="w-full overflow-auto">
                <Table label={l === "fa-IR" ? "آخرین سفارش‌ها" : "Latest orders"} locale={l}>
                  <TableHeader>
                    <Column id="customer" isRowHeader>
                      {l === "fa-IR" ? "مشتری" : "Customer"}
                    </Column>
                    <Column id="date">{l === "fa-IR" ? "تاریخ ثبت" : "Placed on"}</Column>
                    <Column id="amount">{l === "fa-IR" ? "مبلغ" : "Amount"}</Column>
                    <Column id="status">{l === "fa-IR" ? "وضعیت" : "Status"}</Column>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <Row key={order.id} id={order.id}>
                        <Cell>{order.customer}</Cell>
                        <Cell>{formatDate(order.at, l, { dateStyle: "medium" })}</Cell>
                        <Cell>{formatNumber(order.amount, l, currency)}</Cell>
                        <Cell>
                          <Badge tone={statusTone[order.status]} variant="subtle">
                            {statusLabel[order.status]}
                          </Badge>
                        </Cell>
                      </Row>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          }
        />
      );
    },
  },
  {
    id: "stat-grid",
    category: "dashboard",
    title: { "fa-IR": "شبکهٔ شاخص‌ها", "en-US": "Stat grid" },
    intro: {
      "fa-IR": "چند عدد کلیدی در کنار هم. هر عدد از Intl عبور می‌کند، پس ارقام فارسی می‌مانند و جهت تغییر با واژه اعلام می‌شود، نه فقط با رنگ.",
      "en-US": "A row of key figures. Every number goes through Intl, so digits stay Persian, and the direction of a change is announced in words rather than by colour alone.",
    },
    source: source("stat-grid.tsx"),
    render: (l) => (
      <StatGrid
        locale={l}
        strings={{
          regionLabel: l === "fa-IR" ? "شاخص‌های کلیدی" : "Key metrics",
          increase: l === "fa-IR" ? "افزایش" : "increase",
          decrease: l === "fa-IR" ? "کاهش" : "decrease",
        }}
        items={[
          {
            id: "revenue",
            label: l === "fa-IR" ? "درآمد ماه" : "Monthly revenue",
            value: 48250000,
            format: { notation: "compact" },
            delta: 12.4,
          },
          {
            id: "orders",
            label: l === "fa-IR" ? "سفارش‌ها" : "Orders",
            value: 1284,
            delta: 3.1,
          },
          {
            id: "refunds",
            label: l === "fa-IR" ? "بازگشت وجه" : "Refunds",
            value: 0.021,
            format: { style: "percent" },
            delta: -0.4,
          },
        ]}
      />
    ),
  },
  {
    id: "activity-feed",
    category: "dashboard",
    title: { "fa-IR": "فهرست فعالیت", "en-US": "Activity feed" },
    intro: {
      "fa-IR": "رویدادها به ترتیب معکوس زمانی. زمان با تقویم جلالی نمایش داده می‌شود، در حالی که attribute دیتایم به‌عمد میلادی و لاتین می‌ماند.",
      "en-US": "Events in reverse chronological order. The visible time is Jalali, while the dateTime attribute deliberately stays ISO/Latin — a machine value, not prose.",
    },
    source: source("activity-feed.tsx"),
    render: (l) => (
      <div className="p-6">
        <ActivityFeed
          locale={l}
          strings={{
            title: l === "fa-IR" ? "فعالیت اخیر" : "Recent activity",
            emptyTitle: l === "fa-IR" ? "هنوز فعالیتی ثبت نشده" : "No activity yet",
          }}
          items={
            [
              {
                id: "a1",
                actor: l === "fa-IR" ? "سارا محمدی" : "Sara Mohammadi",
                initials: l === "fa-IR" ? "س م" : "SM",
                description: l === "fa-IR" ? "سفارش #۱۰۴۲ را ثبت کرد." : "placed order #1042.",
                at: T_ORDER_PLACED,
              },
              {
                id: "a2",
                actor: l === "fa-IR" ? "رضا کریمی" : "Reza Karimi",
                initials: l === "fa-IR" ? "ر ک" : "RK",
                description: l === "fa-IR" ? "فاکتور را پرداخت کرد." : "paid the invoice.",
                at: T_INVOICE_PAID,
              },
              {
                id: "a3",
                actor: l === "fa-IR" ? "نگار حسینی" : "Negar Hosseini",
                initials: l === "fa-IR" ? "ن ح" : "NH",
                description: l === "fa-IR" ? "عضو تازه‌ای به تیم افزود." : "added a new team member.",
                at: T_MEMBER_ADDED,
              },
            ] satisfies ActivityItem[]
          }
        />
      </div>
    ),
  },
  {
    id: "filter-bar",
    category: "dashboard",
    title: { "fa-IR": "نوار فیلتر", "en-US": "Filter bar" },
    intro: {
      "fa-IR": "جستجو، چند فیلتر بازشو و تراشه‌های فعال. نام دکمهٔ پاک‌کردنِ هر تراشه اجباری است، چون یک ✕ نام نیست.",
      "en-US": "Search, a row of dropdown filters, and the active chips. Each chip's remove name is required, because an ✕ is not a name.",
    },
    source: source("filter-bar.tsx"),
    render: (l) => (
      <div className="p-6">
        <FilterBar
          strings={{
            regionLabel: l === "fa-IR" ? "نوار فیلتر" : "Filter bar",
            searchLabel: l === "fa-IR" ? "جستجو" : "Search",
            searchClearLabel: l === "fa-IR" ? "پاک‌کردن جستجو" : "Clear search",
            searchPlaceholder: l === "fa-IR" ? "جستجو در سفارش‌ها" : "Search orders",
            activeLabel: l === "fa-IR" ? "فیلترهای فعال" : "Active filters",
            clearAll: l === "fa-IR" ? "پاک‌کردن همه" : "Clear all",
          }}
          filters={[
            {
              id: "city",
              label: l === "fa-IR" ? "شهر" : "City",
              placeholder: l === "fa-IR" ? "همهٔ شهرها" : "All cities",
              options: [
                { id: "thr", label: l === "fa-IR" ? "تهران" : "Tehran" },
                { id: "isf", label: l === "fa-IR" ? "اصفهان" : "Isfahan" },
              ],
            },
            {
              id: "status",
              label: l === "fa-IR" ? "وضعیت" : "Status",
              placeholder: l === "fa-IR" ? "همهٔ وضعیت‌ها" : "All statuses",
              options: [
                { id: "paid", label: l === "fa-IR" ? "پرداخت‌شده" : "Paid" },
                { id: "pending", label: l === "fa-IR" ? "در انتظار" : "Pending" },
              ],
            },
          ]}
          active={[
            {
              id: "thr",
              label: l === "fa-IR" ? "تهران" : "Tehran",
              removeLabel: l === "fa-IR" ? "حذف فیلتر تهران" : "Remove the Tehran filter",
            },
            {
              id: "paid",
              label: l === "fa-IR" ? "پرداخت‌شده" : "Paid",
              removeLabel: l === "fa-IR" ? "حذف فیلتر پرداخت‌شده" : "Remove the Paid filter",
            },
          ]}
        />
      </div>
    ),
  },
  {
    id: "chart-panel",
    category: "dashboard",
    title: { "fa-IR": "پنل نمودار", "en-US": "Chart panel" },
    intro: {
      "fa-IR": "کارت دور یک نمودار، با ارقامی که وقتی خودِ نمودار رندر نشود هم می‌مانند. نمودار یک خانهٔ LumoNode است؛ این بسته هیچ کتابخانهٔ نموداری وارد نمی‌کند.",
      "en-US": "A card around a chart, with figures that survive even when the plot itself does not render. The chart is a LumoNode slot; this package imports no chart library.",
    },
    source: source("chart-panel.tsx"),
    render: (l) => (
      <div className="p-6">
        <ChartPanel
          locale={l}
          strings={{
            title: l === "fa-IR" ? "فروش ماهانه" : "Monthly sales",
            description: l === "fa-IR" ? "سه ماه اخیر" : "The last three months",
          }}
          summary={
            [
              {
                id: "total",
                label: l === "fa-IR" ? "مجموع فصل" : "Quarter total",
                value: 19500000,
                format: { style: "currency", currency: "IRR", maximumFractionDigits: 0 },
              },
              {
                id: "avg",
                label: l === "fa-IR" ? "میانگین ماهانه" : "Monthly average",
                value: 6500000,
                format: { style: "currency", currency: "IRR", maximumFractionDigits: 0 },
              },
            ] satisfies ChartPanelSummaryItem[]
          }
          chart={
            <ChartIsland
              locale={l}
              label={l === "fa-IR" ? "نمودار فروش ماهانه" : "Monthly sales chart"}
              seriesLabel={l === "fa-IR" ? "فروش" : "Sales"}
              categoryLabel={l === "fa-IR" ? "ماه" : "Month"}
              dataCaption={l === "fa-IR" ? "داده‌های نمودار فروش ماهانه" : "Monthly sales chart data"}
              data={[
                { month: l === "fa-IR" ? "فروردین" : "Farvardin", sales: 4200000 },
                { month: l === "fa-IR" ? "اردیبهشت" : "Ordibehesht", sales: 6900000 },
                { month: l === "fa-IR" ? "خرداد" : "Khordad", sales: 8400000 },
              ]}
            />
          }
        />
      </div>
    ),
  },

  /* ══════════════════════════════════════════════════════════════════ data ══ */
  {
    id: "list-detail",
    category: "data",
    title: { "fa-IR": "فهرست و جزئیات", "en-US": "List / detail" },
    intro: {
      "fa-IR": "فهرست روی لبهٔ خواندن، رکورد انتخاب‌شده کنارش. جداکننده border-e است، پس همیشه میان دو ستون می‌نشیند نه روی لبهٔ صفحه.",
      "en-US": "A list on the reading edge, the selected record beside it. The divider is border-e, so it always falls between the panes rather than against the viewport edge.",
    },
    source: source("list-detail.tsx"),
    render: (l) => (
      <ListDetail
        strings={{
          listLabel: l === "fa-IR" ? "پرونده‌ها" : "Documents",
          detailLabel: l === "fa-IR" ? "جزئیات پرونده" : "Document details",
          selectedLabel: l === "fa-IR" ? "انتخاب‌شده" : "Selected",
          emptyTitle: l === "fa-IR" ? "پرونده‌ای انتخاب نشده" : "No document selected",
          emptyDescription:
            l === "fa-IR"
              ? "یکی از پرونده‌ها را از فهرست کنار انتخاب کنید."
              : "Choose a document from the list on the side.",
          listEmptyTitle: l === "fa-IR" ? "پرونده‌ای یافت نشد" : "No documents found",
        }}
        items={
          [
            {
              id: "1",
              title: l === "fa-IR" ? "قرارداد همکاری" : "Partnership contract",
              description: l === "fa-IR" ? "به‌روزرسانی ۲ روز پیش" : "Updated 2 days ago",
              badge: l === "fa-IR" ? "جدید" : "New",
            },
            {
              id: "2",
              title: l === "fa-IR" ? "فاکتور ماهانه" : "Monthly invoice",
              description: l === "fa-IR" ? "به‌روزرسانی هفتهٔ گذشته" : "Updated last week",
            },
            {
              id: "3",
              title: l === "fa-IR" ? "گزارش سالانه" : "Annual report",
            },
          ] satisfies ListDetailItem[]
        }
        selectedId="1"
        listHeader={
          <p className="text-xs text-fg-muted">{l === "fa-IR" ? "۳ پرونده" : "3 documents"}</p>
        }
      >
        <div className="flex flex-col gap-3 p-6">
          <h3 className="text-lg font-semibold text-fg">
            {l === "fa-IR" ? "قرارداد همکاری" : "Partnership contract"}
          </h3>
          <p className="max-w-prose text-sm text-fg-muted">
            {l === "fa-IR"
              ? "امضاشده در تیر ۱۴۰۵ و معتبر تا پایان سال مالی جاری."
              : "Signed this fiscal year and valid through its end."}
          </p>
        </div>
      </ListDetail>
    ),
  },
  {
    id: "data-toolbar",
    category: "data",
    title: { "fa-IR": "نوار ابزار داده", "en-US": "Data toolbar" },
    intro: {
      "fa-IR": "جستجو، مرتب‌سازی، سوییچ نما و شمار نتیجه. شمار نتیجه یک تابع روی رشتهٔ فرمت‌شده است، نه یک قالب با جای‌خالی.",
      "en-US": "Search, sort, a view switch and a result count. The count is a function of the already-formatted total, not a template with a hole.",
    },
    source: source("data-toolbar.tsx"),
    render: (l) => (
      <div className="p-6">
        <DataToolbarIsland
          locale={l}
          toolbarLabel={l === "fa-IR" ? "ابزار داده" : "Data tools"}
          searchLabel={l === "fa-IR" ? "جستجو" : "Search"}
          searchClearLabel={l === "fa-IR" ? "پاک‌کردن جستجو" : "Clear search"}
          searchPlaceholder={l === "fa-IR" ? "جستجو در نتیجه‌ها" : "Search results"}
          sortLabel={l === "fa-IR" ? "مرتب‌سازی" : "Sort"}
          sortPlaceholder={l === "fa-IR" ? "مرتب‌سازی بر اساس" : "Sort by"}
          viewLabel={l === "fa-IR" ? "نمای نمایش" : "View"}
          viewList={l === "fa-IR" ? "فهرست" : "List"}
          viewGrid={l === "fa-IR" ? "شبکه" : "Grid"}
          resultCountPrefix=""
          resultCountSuffix={l === "fa-IR" ? " نتیجه" : " results"}
          total={128}
          sortOptions={[
            { id: "newest", label: l === "fa-IR" ? "تازه‌ترین" : "Newest" },
            { id: "popular", label: l === "fa-IR" ? "محبوب‌ترین" : "Most popular" },
          ]}
          sort="newest"
          view="grid"
        />
      </div>
    ),
  },
  {
    id: "empty-collection",
    category: "data",
    title: { "fa-IR": "مجموعهٔ خالی", "en-US": "Empty collection" },
    intro: {
      "fa-IR": "حالتی که هیچ داده‌ای نیست. متن راهنما اجباری است، چون یک صفحهٔ خالیِ بی‌توضیح از یک خطا قابل تشخیص نیست.",
      "en-US": "The state where there is no data. The guidance text is required, because an unexplained empty page is indistinguishable from a failure.",
    },
    source: source("empty-collection.tsx"),
    render: (l) => (
      <EmptyCollection
        strings={{
          title: l === "fa-IR" ? "هنوز سفارشی ثبت نشده" : "No orders yet",
          description:
            l === "fa-IR"
              ? "وقتی نخستین سفارش ثبت شود، اینجا نمایش داده می‌شود."
              : "When the first order is placed, it will appear here.",
          hintsLabel: l === "fa-IR" ? "پیشنهادها" : "Suggestions",
        }}
        hints={[
          {
            id: "share",
            text: l === "fa-IR" ? "پیوند فروشگاه را هم‌رسانی کنید." : "Share your shop link.",
          },
          {
            id: "import",
            text: l === "fa-IR" ? "سفارش‌های قبلی را وارد کنید." : "Import previous orders.",
          },
        ]}
      />
    ),
  },
  {
    id: "table-view",
    category: "data",
    title: { "fa-IR": "نمای جدول", "en-US": "Table view" },
    intro: {
      "fa-IR": "نوار ابزار روی یک grid واقعی، با صفحه‌بندی. تنها بلوکی که یک بلوک همسایه (نوار ابزار داده) را وارد می‌کند، نه فقط کامپوننت‌های پایه را.",
      "en-US": "A toolbar above a real ARIA grid, with pagination. The one block that imports a sibling block (the data toolbar) rather than composing only from primitives.",
    },
    source: source("table-view.tsx"),
    render: (l) => (
      <div className="p-6">
        <TableViewIsland
          locale={l}
          rows={
            [
              { id: "1042", customer: l === "fa-IR" ? "سارا محمدی" : "Sara Mohammadi", placedAt: ROW_DATE_1, amount: 1250000, status: "paid" },
              { id: "1041", customer: l === "fa-IR" ? "رضا کریمی" : "Reza Karimi", placedAt: ROW_DATE_2, amount: 640000, status: "pending" },
              { id: "1040", customer: l === "fa-IR" ? "نگار حسینی" : "Negar Hosseini", placedAt: ROW_DATE_3, amount: 2100000, status: "paid" },
              { id: "1039", customer: l === "fa-IR" ? "امیر توکلی" : "Amir Tavakoli", placedAt: ROW_DATE_4, amount: 480000, status: "canceled" },
              { id: "1038", customer: l === "fa-IR" ? "مریم اکبری" : "Maryam Akbari", placedAt: ROW_DATE_5, amount: 990000, status: "paid" },
            ] satisfies OrderRow[]
          }
          customerHeader={l === "fa-IR" ? "مشتری" : "Customer"}
          dateHeader={l === "fa-IR" ? "تاریخ ثبت" : "Placed on"}
          amountHeader={l === "fa-IR" ? "مبلغ" : "Amount"}
          statusHeader={l === "fa-IR" ? "وضعیت" : "Status"}
          statusLabel={
            l === "fa-IR"
              ? { paid: "پرداخت‌شده", pending: "در انتظار", canceled: "لغوشده" }
              : { paid: "Paid", pending: "Pending", canceled: "Canceled" }
          }
          tableLabel={l === "fa-IR" ? "سفارش‌های اخیر" : "Recent orders"}
          selectAllLabel={l === "fa-IR" ? "انتخاب همهٔ سفارش‌ها" : "Select every order"}
          selectRowPrefix={l === "fa-IR" ? "انتخاب " : "Select "}
          sortAscendingLabel={l === "fa-IR" ? "مرتب‌شده صعودی" : "Sorted ascending"}
          sortDescendingLabel={l === "fa-IR" ? "مرتب‌شده نزولی" : "Sorted descending"}
          emptyTitle={l === "fa-IR" ? "سفارشی یافت نشد" : "No orders found"}
          toolbarLabel={l === "fa-IR" ? "ابزارهای جدول" : "Table tools"}
          searchLabel={l === "fa-IR" ? "جستجوی سفارش‌ها" : "Search orders"}
          searchClearLabel={l === "fa-IR" ? "پاک‌کردن جستجو" : "Clear search"}
          searchPlaceholder={l === "fa-IR" ? "شمارهٔ سفارش یا نام مشتری" : "Order number or customer name"}
          sortLabel={l === "fa-IR" ? "مرتب‌سازی" : "Sort"}
          sortPlaceholder={l === "fa-IR" ? "مرتب‌سازی بر اساس" : "Sort by"}
          viewLabel={l === "fa-IR" ? "نمای نمایش" : "View"}
          viewList={l === "fa-IR" ? "فهرست" : "List"}
          viewGrid={l === "fa-IR" ? "شبکه" : "Grid"}
          resultCountPrefix=""
          resultCountSuffix={l === "fa-IR" ? " سفارش" : " orders"}
          sortOptions={[
            { id: "newest", label: l === "fa-IR" ? "تازه‌ترین" : "Newest" },
            { id: "amount", label: l === "fa-IR" ? "بیشترین مبلغ" : "Highest amount" },
          ]}
          toolbarSort="newest"
          view="list"
          paginationLabel={l === "fa-IR" ? "صفحه‌بندی سفارش‌ها" : "Orders pagination"}
          previousPageLabel={l === "fa-IR" ? "صفحهٔ قبل" : "Previous page"}
          nextPageLabel={l === "fa-IR" ? "صفحهٔ بعد" : "Next page"}
          pageWordPrefix={l === "fa-IR" ? "صفحهٔ " : "Page "}
          pageCount={6}
        />
      </div>
    ),
  },

  /* ══════════════════════════════════════════════════════════════ commerce ══ */
  {
    id: "booking-summary",
    category: "commerce",
    title: { "fa-IR": "خلاصهٔ رزرو", "en-US": "Booking summary" },
    intro: {
      "fa-IR": "بازهٔ تاریخ به تقویم جلالی و ردیف‌های هزینه. تاریخ‌ها با یک gap کنار هم می‌نشینند، نه یک خط تیرهٔ نوشته‌شده که در بایدی وارونه می‌شود.",
      "en-US": "A Jalali date range and a set of charge rows. The dates sit beside each other with a gap, never a written dash — a neutral glyph a bidi algorithm can reorder.",
    },
    source: source("booking-summary.tsx"),
    render: (l) => (
      <div className="flex justify-center p-6">
        <BookingSummary
          locale={l}
          strings={{
            title: l === "fa-IR" ? "خلاصهٔ رزرو" : "Booking summary",
            startLabel: l === "fa-IR" ? "ورود" : "Check-in",
            endLabel: l === "fa-IR" ? "خروج" : "Check-out",
            dateRangeJoiner: l === "fa-IR" ? "تا" : "to",
            subtotalLabel: l === "fa-IR" ? "جمع جزء" : "Subtotal",
            totalLabel: l === "fa-IR" ? "مبلغ نهایی" : "Total",
            confirm: l === "fa-IR" ? "تأیید رزرو" : "Confirm booking",
            footnote:
              l === "fa-IR"
                ? "تا ۲۴ ساعت پیش از ورود، لغو رایگان است."
                : "Free cancellation up to 24 hours before check-in.",
          }}
          lines={
            [
              { id: "stay", label: l === "fa-IR" ? "اقامت ۳ شب" : "3-night stay", amount: 5400000 },
              { id: "cleaning", label: l === "fa-IR" ? "هزینهٔ نظافت" : "Cleaning fee", amount: 350000 },
              { id: "service", label: l === "fa-IR" ? "کارمزد خدمات" : "Service fee", amount: 270000 },
            ] satisfies BookingLine[]
          }
          total={6020000}
          currencyFormat={{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }}
          startsAt={CHECK_IN}
          endsAt={CHECK_OUT}
        />
      </div>
    ),
  },
  {
    id: "listing-grid",
    category: "commerce",
    title: { "fa-IR": "شبکهٔ آگهی‌ها", "en-US": "Listing grid" },
    intro: {
      "fa-IR": "کارتِ خبرِ کاملاً پیوندشده، بدون «use client» — هر آگهی یک a href واقعی است تا خزنده بدون جاوااسکریپت آن را ببیند.",
      "en-US": "A grid of fully-linked cards, with no \"use client\" — each listing is a real a href, so a crawler sees it with no JavaScript at all.",
    },
    source: source("listing-grid.tsx"),
    render: (l) => (
      <ListingGridIsland
        locale={l}
        regionLabel={l === "fa-IR" ? "آگهی‌های اقامتگاه" : "Stay listings"}
        priceLabel={l === "fa-IR" ? "قیمت هر شب" : "Price per night"}
        ratingJoiner={l === "fa-IR" ? " از " : " from "}
        ratingSuffix={l === "fa-IR" ? " نظر" : " reviews"}
        emptyTitle={l === "fa-IR" ? "آگهی‌ای یافت نشد" : "No listings found"}
        priceFormat={{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }}
        items={
          [
            {
              id: "l1",
              title: l === "fa-IR" ? "سوئیت مبله در نیاوران" : "Furnished suite in Niavaran",
              href: "#",
              description:
                l === "fa-IR" ? "دو نفره، نزدیک مترو، صبحانه رایگان." : "For two, near the metro, free breakfast.",
              price: 1850000,
              badge: l === "fa-IR" ? "پیشنهاد ویژه" : "Special offer",
              rating: 4.8,
              ratingCount: 212,
            },
            {
              id: "l2",
              title: l === "fa-IR" ? "استودیوی کوچک در ونک" : "Small studio in Vanak",
              href: "#",
              description: l === "fa-IR" ? "مناسب اقامت کوتاه‌مدت." : "Suited to a short stay.",
              price: 1200000,
              rating: 4.3,
              ratingCount: 64,
            },
            {
              id: "l3",
              title: l === "fa-IR" ? "آپارتمان دو خوابه در سعادت‌آباد" : "Two-bedroom flat in Saadat Abad",
              href: "#",
              description: l === "fa-IR" ? "پارکینگ اختصاصی و آسانسور." : "Private parking and an elevator.",
              price: 2600000,
              rating: 4.9,
              ratingCount: 340,
            },
          ] satisfies Listing[]
        }
      />
    ),
  },
  {
    id: "product-detail",
    category: "commerce",
    title: { "fa-IR": "جزئیات محصول", "en-US": "Product detail" },
    intro: {
      "fa-IR": "گالری، قیمت، موجودی و گزینه‌ها. وضعیت موجودی سه رشته است نه یک boolean، چون «فقط ۳ عدد باقی مانده» تصمیم خواننده را عوض می‌کند.",
      "en-US": "Gallery, price, stock and variants. Stock is three strings rather than a boolean, because \"only 3 left\" changes the reader's decision in a way \"in stock\" alone does not.",
    },
    source: source("product-detail.tsx"),
    render: (l) => (
      <ProductDetailIsland
        locale={l}
        title={l === "fa-IR" ? "کوله‌پشتی سفر مدل آفتاب" : "Aftab travel backpack"}
        description={
          l === "fa-IR"
            ? "کولهٔ ضدآب با بند قابل تنظیم و جای مخصوص لپ‌تاپ."
            : "A water-resistant backpack with adjustable straps and a dedicated laptop sleeve."
        }
        images={[{ src: PLACEHOLDER_IMAGE, alt: "", label: "نمای محصول" }]}
        badge={l === "fa-IR" ? "پرفروش" : "Bestseller"}
        price={2450000}
        compareAtPrice={2890000}
        priceFormat={{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }}
        rating={4.6}
        ratingCount={128}
        stock="low-stock"
        lowStockCount={3}
        variants={
          [
            {
              id: "color",
              label: l === "fa-IR" ? "رنگ" : "Colour",
              options: [
                { id: "black", label: l === "fa-IR" ? "مشکی" : "Black" },
                { id: "navy", label: l === "fa-IR" ? "سرمه‌ای" : "Navy" },
                { id: "olive", label: l === "fa-IR" ? "زیتونی" : "Olive", isAvailable: false },
              ],
            },
          ] satisfies ProductVariantGroup[]
        }
        selectedVariants={{ color: "black" }}
        specs={[
          { id: "material", term: l === "fa-IR" ? "جنس" : "Material", detail: l === "fa-IR" ? "نایلون ۶۰۰ دنیر ضدآب" : "600-denier water-resistant nylon" },
          { id: "capacity", term: l === "fa-IR" ? "گنجایش" : "Capacity", detail: l === "fa-IR" ? "۲۵ لیتر" : "25 litres" },
        ]}
        galleryLabel={l === "fa-IR" ? "گالری تصاویر محصول" : "Product image gallery"}
        galleryRoleDescription={l === "fa-IR" ? "چرخ‌فلک" : "carousel"}
        slideRoleDescription={l === "fa-IR" ? "اسلاید" : "slide"}
        imagePrevious={l === "fa-IR" ? "تصویر قبلی" : "Previous image"}
        imageNext={l === "fa-IR" ? "تصویر بعدی" : "Next image"}
        priceLabel={l === "fa-IR" ? "قیمت" : "Price"}
        compareAtLabel={l === "fa-IR" ? "قیمت پیشین" : "Previous price"}
        ratingJoiner={l === "fa-IR" ? " از " : " out of "}
        inStock={l === "fa-IR" ? "موجود" : "In stock"}
        outOfStock={l === "fa-IR" ? "ناموجود" : "Out of stock"}
        lowStockPrefix={l === "fa-IR" ? "فقط " : "Only "}
        lowStockSuffix={l === "fa-IR" ? " عدد باقی مانده" : " left"}
        quantityLabel={l === "fa-IR" ? "تعداد" : "Quantity"}
        quantityDecrement={l === "fa-IR" ? "کاهش تعداد" : "Decrease quantity"}
        quantityIncrement={l === "fa-IR" ? "افزایش تعداد" : "Increase quantity"}
        quantityRoleDescription={l === "fa-IR" ? "شمارندهٔ تعداد" : "quantity stepper"}
        addToCart={l === "fa-IR" ? "افزودن به سبد خرید" : "Add to cart"}
        specsLabel={l === "fa-IR" ? "مشخصات فنی" : "Specifications"}
      />
    ),
  },
  {
    id: "checkout-summary",
    category: "commerce",
    title: { "fa-IR": "خلاصهٔ خرید", "en-US": "Checkout summary" },
    intro: {
      "fa-IR": "اقلام سبد خرید، جمع هزینه‌ها و یک کد تخفیف. جمعِ هر ردیف را caller محاسبه می‌کند، چون ضرب سمت کلاینت است که با مبلغ نهایی درگاه پرداخت اختلاف پیدا می‌کند.",
      "en-US": "Cart items, itemised charges and a promo code. Each line total is pre-computed by the caller — client-side multiplication is how a shown total quietly disagrees with a payment gateway's.",
    },
    source: source("checkout-summary.tsx"),
    render: (l) => (
      <div className="flex justify-center p-6">
        <CheckoutSummaryIsland
          locale={l}
          items={
            [
              {
                id: "c1",
                title: l === "fa-IR" ? "کوله‌پشتی سفر مدل آفتاب" : "Aftab travel backpack",
                description: l === "fa-IR" ? "رنگ: مشکی" : "Colour: Black",
                image: { src: PLACEHOLDER_IMAGE, alt: "" },
                quantity: 1,
                lineTotal: 2450000,
              },
              {
                id: "c2",
                title: l === "fa-IR" ? "قمقمهٔ فولادی ۷۵۰ میلی‌لیتری" : "750ml steel water bottle",
                description: l === "fa-IR" ? "رنگ: نقره‌ای" : "Colour: Silver",
                quantity: 2,
                lineTotal: 980000,
              },
            ] satisfies CheckoutItem[]
          }
          charges={
            [
              { id: "shipping", label: l === "fa-IR" ? "هزینهٔ ارسال" : "Shipping", amount: 150000 },
              {
                id: "promo",
                label: l === "fa-IR" ? "کد تخفیف نوین‌۱۰" : "Promo code NOVIN10",
                note: l === "fa-IR" ? "اعمال‌شده" : "Applied",
                amount: -100000,
              },
            ] satisfies CheckoutCharge[]
          }
          total={3480000}
          currencyFormat={{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }}
          title={l === "fa-IR" ? "خلاصهٔ سفارش" : "Order summary"}
          itemsLabel={l === "fa-IR" ? "اقلام سفارش" : "Order items"}
          quantityPrefix={l === "fa-IR" ? "تعداد: " : "Qty: "}
          removeItem={l === "fa-IR" ? "حذف" : "Remove"}
          removeItemLabelPrefix={l === "fa-IR" ? "حذف " : "Remove "}
          promoLabel={l === "fa-IR" ? "کد تخفیف" : "Promo code"}
          promoPlaceholder={l === "fa-IR" ? "کد را وارد کنید" : "Enter a code"}
          promoApply={l === "fa-IR" ? "اعمال" : "Apply"}
          totalLabel={l === "fa-IR" ? "مبلغ نهایی" : "Total"}
          confirm={l === "fa-IR" ? "تکمیل خرید" : "Complete purchase"}
          footnote={l === "fa-IR" ? "پرداخت امن و رمزنگاری‌شده" : "Secure, encrypted checkout"}
        />
      </div>
    ),
  },

  /* ═══════════════════════════════════════════════════════════════ settings ══ */
  {
    id: "settings-form",
    category: "settings",
    title: { "fa-IR": "فرم تنظیمات", "en-US": "Settings form" },
    intro: {
      "fa-IR": "فیلد و یک نوار وضعیت. پیام موفقیت با live=\"polite\" اعلام می‌شود، چون یک خبر خوب نباید صدای صفحه‌خوان را وسط جمله قطع کند.",
      "en-US": "Fields plus one status line. Success is announced live=\"polite\", because good news should never interrupt a screen reader mid-sentence.",
    },
    source: source("settings-form.tsx"),
    render: (l) => (
      <div className="flex justify-center p-6">
        <SettingsForm
          status="saved"
          strings={{
            title: l === "fa-IR" ? "اطلاعات حساب" : "Account information",
            description:
              l === "fa-IR" ? "نام و ایمیل نمایشی خود را ویرایش کنید." : "Edit your display name and email.",
            save: l === "fa-IR" ? "ذخیرهٔ تغییرات" : "Save changes",
            cancel: l === "fa-IR" ? "انصراف" : "Cancel",
            pending: l === "fa-IR" ? "در حال ذخیره…" : "Saving…",
            saved: l === "fa-IR" ? "تغییرات با موفقیت ذخیره شد." : "Changes saved successfully.",
          }}
        >
          <TextField
            label={l === "fa-IR" ? "نام نمایشی" : "Display name"}
            defaultValue={l === "fa-IR" ? "سارا محمدی" : "Sara Mohammadi"}
          />
          <TextField
            label={l === "fa-IR" ? "ایمیل" : "Email"}
            type="email"
            description={
              l === "fa-IR"
                ? "برای بازیابی رمز عبور از آن استفاده می‌کنیم."
                : "We use it to recover your password."
            }
          />
        </SettingsForm>
      </div>
    ),
  },
  {
    id: "danger-zone",
    category: "settings",
    title: { "fa-IR": "منطقهٔ خطر", "en-US": "Danger zone" },
    intro: {
      "fa-IR": "کنش برگشت‌ناپذیر، پشتِ یک عبارتِ تایپ‌شونده. مقایسه با === و بدون هیچ نرمال‌سازی‌ای انجام می‌شود، چون ک عربی و ک فارسی دو نویسهٔ متفاوتند.",
      "en-US": "An irreversible action behind a typed phrase. The comparison is === with no normalisation, because an Arabic ك and a Persian ک are two different characters.",
    },
    source: source("danger-zone.tsx"),
    render: (l) => (
      <div className="flex justify-center p-6">
        <DangerZone
          confirmPhrase={l === "fa-IR" ? "حذف-کارگاه" : "delete-workspace"}
          strings={{
            title: l === "fa-IR" ? "منطقهٔ خطر" : "Danger zone",
            description:
              l === "fa-IR"
                ? "این کارگاه و همهٔ داده‌های آن برای همیشه حذف می‌شود. این کار بازگشت‌ناپذیر است."
                : "This workspace and all of its data will be permanently deleted. This cannot be undone.",
            action: l === "fa-IR" ? "حذف کارگاه" : "Delete workspace",
            dialogTitle: l === "fa-IR" ? "حذف این کارگاه؟" : "Delete this workspace?",
            dialogDescription:
              l === "fa-IR"
                ? "همهٔ پروژه‌ها، اعضا و پرونده‌های این کارگاه برای همیشه حذف خواهند شد."
                : "All projects, members and files in this workspace will be permanently removed.",
            closeLabel: l === "fa-IR" ? "بستن پنجره" : "Close dialog",
            confirmFieldLabel: l === "fa-IR" ? "برای تأیید، عبارت زیر را بنویسید" : "Type the phrase below to confirm",
            confirmFieldDescription:
              l === "fa-IR" ? "«حذف-کارگاه»" : "\"delete-workspace\"",
            mismatchError:
              l === "fa-IR"
                ? "عبارت واردشده با عبارت خواسته‌شده یکسان نیست."
                : "The typed phrase doesn't match.",
            confirm: l === "fa-IR" ? "حذف همیشگی" : "Delete permanently",
            cancel: l === "fa-IR" ? "انصراف" : "Cancel",
          }}
        />
      </div>
    ),
  },
  {
    id: "preferences",
    category: "settings",
    title: { "fa-IR": "ترجیحات", "en-US": "Preferences" },
    intro: {
      "fa-IR": "کنترل‌های آنی — بدون دکمهٔ ذخیره. برخلاف فرم تنظیمات، هر کنترل به‌محض تغییر ثبت می‌شود، دقیقاً مانند یک سوییچ.",
      "en-US": "Instantly-committing controls, with no Save button. Unlike the settings form, every control commits the moment it changes — exactly the way a switch should.",
    },
    source: source("preferences.tsx"),
    render: (l) => (
      <Preferences
        strings={{
          regionLabel: l === "fa-IR" ? "تنظیمات ترجیحات" : "Preferences",
          title: l === "fa-IR" ? "ترجیحات" : "Preferences",
          description: l === "fa-IR" ? "این تغییرات بی‌درنگ ذخیره می‌شوند." : "These changes save instantly.",
          pending: l === "fa-IR" ? "در حال ذخیره…" : "Saving…",
        }}
        groups={
          [
            {
              id: "notifications",
              title: l === "fa-IR" ? "اعلان‌ها" : "Notifications",
              items: [
                {
                  id: "email",
                  label: l === "fa-IR" ? "اعلان ایمیلی" : "Email notifications",
                  control: { type: "switch", isSelected: true },
                },
                {
                  id: "sms",
                  label: l === "fa-IR" ? "اعلان پیامکی" : "SMS notifications",
                  control: { type: "switch", isSelected: false },
                },
              ],
            },
            {
              id: "display",
              title: l === "fa-IR" ? "نمایش" : "Display",
              items: [
                {
                  id: "language",
                  label: l === "fa-IR" ? "زبان نمایش" : "Display language",
                  control: {
                    type: "select",
                    value: l === "fa-IR" ? "fa" : "en",
                    placeholder: l === "fa-IR" ? "یک زبان انتخاب کنید" : "Choose a language",
                    options: [
                      { id: "fa", label: l === "fa-IR" ? "فارسی" : "Persian" },
                      { id: "en", label: l === "fa-IR" ? "انگلیسی" : "English" },
                    ],
                  },
                },
                {
                  id: "density",
                  label: l === "fa-IR" ? "تراکم چیدمان" : "Layout density",
                  control: {
                    type: "radio",
                    value: "comfortable",
                    options: [
                      { id: "comfortable", label: l === "fa-IR" ? "راحت" : "Comfortable" },
                      { id: "compact", label: l === "fa-IR" ? "فشرده" : "Compact" },
                    ],
                  },
                },
              ],
            },
          ] satisfies PreferenceGroup[]
        }
      />
    ),
  },

  /* ══════════════════════════════════════════════════════════════ marketing ══ */
  {
    id: "hero",
    category: "marketing",
    title: { "fa-IR": "سربرگ صفحه", "en-US": "Hero" },
    intro: {
      "fa-IR": "نخستین بخش یک صفحهٔ معرفی. بدون «use client» رندر می‌شود، پس متن آن در نخستین بایت است و خزنده آن را می‌بیند.",
      "en-US": "The opening section of a marketing page. Renders without \"use client\", so its text is in the first byte and a crawler sees it.",
    },
    source: source("hero.tsx"),
    render: (l) => (
      <Hero
        strings={{
          eyebrow: l === "fa-IR" ? "نسخهٔ ۲ منتشر شد" : "Version 2 is out",
          title: l === "fa-IR" ? "زیرساخت فروشگاه شما" : "Infrastructure for your shop",
          description:
            l === "fa-IR"
              ? "سفارش، پرداخت و ارسال را از یک جا اداره کنید."
              : "Run orders, payments and delivery from one place.",
          primaryAction: l === "fa-IR" ? "شروع کنید" : "Get started",
          secondaryAction: l === "fa-IR" ? "مستندات" : "Documentation",
          footnote: l === "fa-IR" ? "بدون نیاز به کارت بانکی" : "No credit card required",
        }}
        primaryHref="#"
        secondaryHref="#"
      />
    ),
  },
  {
    id: "feature-grid",
    category: "marketing",
    title: { "fa-IR": "شبکهٔ ویژگی‌ها", "en-US": "Feature grid" },
    intro: {
      "fa-IR": "بخش «چه‌کار می‌کند»: چند ادعای کوتاه و خودکفا. تنها تصمیم جهت‌دار در این فایل text-start است؛ خودِ شبکه با محور درون‌خطی قرینه می‌شود.",
      "en-US": "The \"what it does\" section: a grid of short, self-contained claims. The only directional decision in the file is text-start; the grid itself mirrors on the inline axis for free.",
    },
    source: source("feature-grid.tsx"),
    render: (l) => (
      <FeatureGrid
        strings={{
          regionLabel: l === "fa-IR" ? "ویژگی‌های لومو" : "Lumo features",
          title: l === "fa-IR" ? "چرا لومو" : "Why Lumo",
          description:
            l === "fa-IR"
              ? "هرچه برای عرضهٔ یک محصول فارسی لازم است، از پیش ساخته شده."
              : "Everything a Persian product needs is already built in.",
        }}
        items={
          [
            {
              id: "rtl",
              title: l === "fa-IR" ? "راست‌چین از پایه" : "RTL from the ground up",
              description:
                l === "fa-IR"
                  ? "جهت از Intl.Locale تعیین می‌شود، نه یک prop که بتوان فراموشش کرد."
                  : "Direction is derived from Intl.Locale, not a prop that can be forgotten.",
            },
            {
              id: "digits",
              title: l === "fa-IR" ? "ارقام فارسی همه‌جا" : "Persian digits everywhere",
              description:
                l === "fa-IR"
                  ? "هر عدد از formatNumber می‌گذرد، پس رقم لاتین در یک صفحهٔ فارسی دیده نمی‌شود."
                  : "Every number passes through formatNumber, so no Latin digit shows on a Persian page.",
            },
            {
              id: "strings",
              title: l === "fa-IR" ? "بدون متن پنهانِ انگلیسی" : "No hidden English",
              description:
                l === "fa-IR"
                  ? "هر رشتهٔ اعلام‌شده یک prop اجباری است؛ کتابخانه پیش‌فرضی برایش ندارد."
                  : "Every announced string is a required prop; the library ships no default for it.",
            },
          ] satisfies Feature[]
        }
      />
    ),
  },
  {
    id: "pricing-table",
    category: "marketing",
    title: { "fa-IR": "جدول قیمت‌گذاری", "en-US": "Pricing table" },
    intro: {
      "fa-IR": "مقایسهٔ پلن‌ها. شمولِ هر ویژگی فقط با یک نشانه گفته نمی‌شود؛ کنار هر نشانه یک واژهٔ ترجمه‌شده و sr-only هست.",
      "en-US": "The plan comparison. Inclusion is never a glyph alone — a required, translated, sr-only word sits beside every mark.",
    },
    source: source("pricing-table.tsx"),
    render: (l) => (
      <PricingTable
        locale={l}
        strings={{
          regionLabel: l === "fa-IR" ? "پلن‌های قیمت‌گذاری" : "Pricing plans",
          title: l === "fa-IR" ? "یک پلن که با شما رشد می‌کند" : "A plan that grows with you",
          periodLabel: l === "fa-IR" ? "/ ماهانه" : "/ month",
          included: l === "fa-IR" ? "شامل می‌شود" : "Included",
          excluded: l === "fa-IR" ? "شامل نمی‌شود" : "Not included",
          featuresLabel: l === "fa-IR" ? "امکانات" : "Features",
        }}
        priceFormat={{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }}
        plans={
          [
            {
              id: "basic",
              name: l === "fa-IR" ? "پایه" : "Basic",
              description: l === "fa-IR" ? "برای شروع کار" : "To get started",
              price: 490000,
              cta: l === "fa-IR" ? "شروع رایگان" : "Start for free",
              href: "#",
              features: [
                { id: "f1", label: l === "fa-IR" ? "تا ۵۰۰ سفارش در ماه" : "Up to 500 orders / month" },
                { id: "f2", label: l === "fa-IR" ? "پشتیبانی ایمیلی" : "Email support" },
                { id: "f3", label: l === "fa-IR" ? "گزارش‌های پیشرفته" : "Advanced reports", isIncluded: false },
              ],
            },
            {
              id: "pro",
              name: l === "fa-IR" ? "حرفه‌ای" : "Pro",
              description: l === "fa-IR" ? "برای تیم‌های در حال رشد" : "For growing teams",
              price: 1990000,
              cta: l === "fa-IR" ? "شروع دورهٔ آزمایشی" : "Start free trial",
              href: "#",
              isFeatured: true,
              badge: l === "fa-IR" ? "محبوب‌ترین" : "Most popular",
              features: [
                { id: "f1", label: l === "fa-IR" ? "سفارش نامحدود" : "Unlimited orders" },
                { id: "f2", label: l === "fa-IR" ? "پشتیبانی اولویت‌دار" : "Priority support" },
                { id: "f3", label: l === "fa-IR" ? "گزارش‌های پیشرفته" : "Advanced reports" },
              ],
            },
          ] satisfies PricingPlan[]
        }
      />
    ),
  },
  {
    id: "faq",
    category: "marketing",
    title: { "fa-IR": "پرسش‌های پرتکرار", "en-US": "FAQ" },
    intro: {
      "fa-IR": "فهرست پرسش و پاسخ روی Disclosure. نشانگر باز و بسته در محور عمودی می‌چرخد، نه افقی، تا در راست‌چین همان معنا را بدهد.",
      "en-US": "A question and answer list built on Disclosure. The open indicator rotates on the block axis, not the inline one, so it means the same thing under RTL.",
    },
    source: source("faq.tsx"),
    render: (l) => (
      <Faq
        strings={{ regionLabel: l === "fa-IR" ? "پرسش‌های پرتکرار" : "Frequently asked questions" }}
        items={[
          {
            id: "shipping",
            question: l === "fa-IR" ? "هزینهٔ ارسال چقدر است؟" : "How much is shipping?",
            answer:
              l === "fa-IR"
                ? "ارسال برای سفارش‌های بالای پانصد هزار ریال رایگان است."
                : "Shipping is free for orders above five hundred thousand rials.",
          },
          {
            id: "returns",
            question: l === "fa-IR" ? "امکان مرجوعی هست؟" : "Can I return an item?",
            answer:
              l === "fa-IR"
                ? "تا هفت روز پس از دریافت، بدون پرسش مرجوع می‌شود."
                : "Within seven days of delivery, no questions asked.",
          },
        ]}
      />
    ),
  },
  {
    id: "footer",
    category: "marketing",
    title: { "fa-IR": "پاورقی", "en-US": "Footer" },
    intro: {
      "fa-IR": "نوار پایین هر صفحه: نشان، ستون‌های ناوبری و خط کپی‌رایت. بدون level، چون پاورقی همیشه در یک عمق سند می‌نشیند، فارغ از آنچه بالای آن است.",
      "en-US": "The band at the bottom of every page: brand, nav columns, a copyright line. No level prop — a footer sits at the same document depth regardless of what's above it.",
    },
    source: source("footer.tsx"),
    render: (l) => (
      <Footer
        strings={{
          regionLabel: l === "fa-IR" ? "پاورقی سایت" : "Site footer",
          copyright:
            l === "fa-IR" ? "© ۱۴۰۵ تلارسا. تمام حقوق محفوظ است." : "© 2026 Telarsa. All rights reserved.",
        }}
        brand={<span className="text-sm font-semibold text-fg">{l === "fa-IR" ? "لومو" : "Lumo"}</span>}
        description={
          l === "fa-IR"
            ? "کتابخانهٔ کامپوننت فارسی‌محور تلارسا."
            : "Telarsa's Persian-first component library."
        }
        groups={
          [
            {
              id: "product",
              title: l === "fa-IR" ? "محصول" : "Product",
              links: [
                { id: "features", label: l === "fa-IR" ? "امکانات" : "Features", href: "#" },
                { id: "pricing", label: l === "fa-IR" ? "قیمت‌گذاری" : "Pricing", href: "#" },
                { id: "docs", label: l === "fa-IR" ? "مستندات" : "Documentation", href: "#" },
              ],
            },
            {
              id: "company",
              title: l === "fa-IR" ? "شرکت" : "Company",
              links: [
                { id: "about", label: l === "fa-IR" ? "دربارهٔ ما" : "About us", href: "#" },
                { id: "blog", label: l === "fa-IR" ? "وبلاگ" : "Blog", href: "#" },
              ],
            },
          ] satisfies FooterLinkGroup[]
        }
        legalLinks={[
          { id: "privacy", label: l === "fa-IR" ? "حریم خصوصی" : "Privacy", href: "#" },
          { id: "terms", label: l === "fa-IR" ? "شرایط استفاده" : "Terms", href: "#" },
        ]}
      />
    ),
  },
];

export function allBlocks(): BlockDemo[] {
  return [...BLOCKS].sort((a, b) => a.id.localeCompare(b.id));
}

export function blockById(id: string): BlockDemo | undefined {
  return BLOCKS.find((b) => b.id === id);
}
