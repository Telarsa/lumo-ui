import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { formatNumber, stringsFor } from "@lumo-ui/core";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  ComboBoxItem,
  Container,
  Dialog,
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
  Drawer,
  DrawerOverlay,
  EmptyState,
  Form,
  Grid,
  IconButton,
  Kbd,
  Label,
  Link,
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Meter,
  NumberField,
  Popover,
  PopoverTrigger,
  ProgressBar,
  Radio,
  RadioGroup,
  SearchField,
  Select,
  SelectItem,
  SelectPopover,
  SelectTrigger,
  Separator,
  Skeleton,
  Spinner,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  ToolbarSeparator,
  Tooltip,
  TooltipTrigger,
} from "@lumo-ui/ui";

/**
 * The demo registry — the single source the whole site is generated from.
 *
 * Adding an entry here produces: a page in each locale, a preview-frame route in
 * each locale, a gallery tile, a nav entry and a source panel. Nothing about a
 * component page is hand-authored except the capped intro.
 *
 * `source` is READ FROM DISK at build time rather than retyped into a string.
 * That is the difference between documentation and a claim: the code shown on
 * the page is byte-identical to the code that renders the preview beside it, so
 * it cannot drift the first time someone edits a component.
 *
 * ── THREE RULES EVERY `render` OBEYS, AND WHY ───────────────────────────────
 *
 *  1. Every user-visible string is keyed by locale. There is no English literal
 *     in any demo: `@lumo-ui/gate` grades the prerendered `/fa-IR/` HTML and an
 *     English `aria-label` on a Persian page is a failing build, not a review
 *     comment.
 *  2. No bare numbers. `LumoNode` makes `{5}` a compile error, so a count goes
 *     through `formatNumber(n, locale)` and comes out `۵` on the Persian route.
 *  3. Nothing that needs a client. These render under a static export, so no
 *     `useState` and no function props — which is why the removable `Tag` and
 *     the `Menu`'s `onAction` are absent rather than forgotten: a function
 *     cannot cross the server/client boundary.
 *
 * Overlays (dialog, drawer, popover, menu, tooltip, select, combobox) are shown
 * as their TRIGGER. React Aria's `Overlay` returns `null` during SSR, so a
 * `defaultOpen` overlay would contribute nothing to the graded bytes while
 * covering the component page with a modal after hydration. The trigger is the
 * part that is actually in the first byte, so the trigger is what is shown.
 */

const UI_SRC = join(process.cwd(), "..", "..", "packages", "ui", "src");

function source(file: string): string {
  try {
    return readFileSync(join(UI_SRC, file), "utf8");
  } catch {
    return `// ${file} — source unavailable at build time`;
  }
}

export interface Demo {
  id: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  tier: "form" | "display" | "overlay" | "navigation" | "feedback" | "layout" | "data";
  behaviour: boolean;
  render: (locale: Locale) => LumoNode;
  source: string;
}

export const TIERS = ["form", "display", "overlay", "navigation", "feedback", "layout", "data"] as const;

export const tierLabel: Record<(typeof TIERS)[number], Record<Locale, string>> = {
  form: { "fa-IR": "فرم", "en-US": "Form" },
  display: { "fa-IR": "نمایش", "en-US": "Display" },
  overlay: { "fa-IR": "لایه", "en-US": "Overlay" },
  navigation: { "fa-IR": "ناوبری", "en-US": "Navigation" },
  feedback: { "fa-IR": "بازخورد", "en-US": "Feedback" },
  layout: { "fa-IR": "چیدمان", "en-US": "Layout" },
  data: { "fa-IR": "داده", "en-US": "Data" },
};

/** Copy used inside demos. Both locales required — no English fallback anywhere. */
const copy = {
  // Actions
  save: { "fa-IR": "ذخیره", "en-US": "Save" },
  cancel: { "fa-IR": "انصراف", "en-US": "Cancel" },
  remove: { "fa-IR": "حذف", "en-US": "Remove" },
  more: { "fa-IR": "گزینه‌های بیشتر", "en-US": "More options" },
  close: { "fa-IR": "بستن", "en-US": "Close" },

  // Alert
  alertInfoTitle: { "fa-IR": "به‌روزرسانی در دسترس است", "en-US": "Update available" },
  alertInfoBody: {
    "fa-IR": "نسخهٔ تازه آمادهٔ نصب است و در نخستین راه‌اندازی بعدی اعمال می‌شود.",
    "en-US": "A new version is ready to install and applies on the next restart.",
  },
  alertOkTitle: { "fa-IR": "تغییرها ذخیره شد", "en-US": "Changes saved" },
  alertOkBody: {
    "fa-IR": "همهٔ ویرایش‌های شما روی سرور ثبت شد.",
    "en-US": "Every edit you made has been stored on the server.",
  },
  alertBadTitle: { "fa-IR": "پرداخت انجام نشد", "en-US": "Payment failed" },
  alertBadBody: {
    "fa-IR": "کارت شما پذیرفته نشد؛ روش دیگری را امتحان کنید.",
    "en-US": "Your card was declined. Try a different method.",
  },

  // Avatar
  initialsA: { "fa-IR": "س م", "en-US": "SM" },
  initialsB: { "fa-IR": "ر ک", "en-US": "RK" },
  initialsC: { "fa-IR": "ن ح", "en-US": "NH" },

  // Badge / Tag
  draft: { "fa-IR": "پیش‌نویس", "en-US": "Draft" },
  active: { "fa-IR": "فعال", "en-US": "Active" },
  expired: { "fa-IR": "منقضی", "en-US": "Expired" },
  edited: { "fa-IR": "ویرایش‌شده", "en-US": "Edited" },

  // Breadcrumbs
  trail: { "fa-IR": "مسیر صفحه", "en-US": "Breadcrumb trail" },
  home: { "fa-IR": "خانه", "en-US": "Home" },
  settings: { "fa-IR": "تنظیمات", "en-US": "Settings" },
  profile: { "fa-IR": "پروفایل", "en-US": "Profile" },

  // Card
  planTitle: { "fa-IR": "طرح حرفه‌ای", "en-US": "Pro plan" },
  planDescription: {
    "fa-IR": "صورت‌حساب ماهانه، هر زمان بخواهید لغو کنید.",
    "en-US": "Billed monthly, cancel whenever you like.",
  },
  planBody: {
    "fa-IR": "تحلیل نامحدود، دامنهٔ اختصاصی و پشتیبانی اولویت‌دار.",
    "en-US": "Unlimited analytics, a custom domain and priority support.",
  },

  // Checkbox
  terms: { "fa-IR": "شرایط استفاده را می‌پذیرم", "en-US": "I accept the terms of use" },
  channels: { "fa-IR": "راه‌های اطلاع‌رسانی", "en-US": "Notification channels" },
  email: { "fa-IR": "ایمیل", "en-US": "Email" },
  sms: { "fa-IR": "پیامک", "en-US": "Text message" },
  inApp: { "fa-IR": "اعلان درون‌برنامه‌ای", "en-US": "In-app notice" },

  // Cities, shared by ComboBox / Select / Tag
  city: { "fa-IR": "شهر", "en-US": "City" },
  cityPlaceholder: { "fa-IR": "نام شهر را بنویسید", "en-US": "Type a city name" },
  selectCity: { "fa-IR": "یک شهر انتخاب کنید", "en-US": "Select a city" },
  suggestions: { "fa-IR": "پیشنهادها", "en-US": "Suggestions" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },

  // Dialog
  editProfile: { "fa-IR": "ویرایش پروفایل", "en-US": "Edit profile" },
  dialogBody: {
    "fa-IR": "نام و نشانی ایمیل شما برای دیگر اعضای فضای کاری دیده می‌شود.",
    "en-US": "Your name and email address are visible to everyone in the workspace.",
  },

  // Disclosure
  shippingQuestion: { "fa-IR": "هزینهٔ ارسال چقدر است؟", "en-US": "How much is shipping?" },
  shippingAnswer: {
    "fa-IR": "ارسال برای سفارش‌های بالای یک میلیون تومان رایگان است.",
    "en-US": "Shipping is free on orders above one million toman.",
  },
  returnsQuestion: { "fa-IR": "مهلت بازگرداندن کالا", "en-US": "The returns window" },
  returnsAnswer: {
    "fa-IR": "تا یک هفته پس از دریافت، بدون پرسش پس گرفته می‌شود.",
    "en-US": "Within one week of delivery, no questions asked.",
  },

  // Drawer
  showFilters: { "fa-IR": "نمایش فیلترها", "en-US": "Show filters" },
  filters: { "fa-IR": "فیلترها", "en-US": "Filters" },
  drawerBody: {
    "fa-IR": "نتیجه‌ها را بر پایهٔ دسته، قیمت و موجودی محدود کنید.",
    "en-US": "Narrow the results by category, price and availability.",
  },

  // Empty state
  emptyTitle: { "fa-IR": "هنوز فاکتوری ثبت نشده", "en-US": "No invoices yet" },
  emptyBody: {
    "fa-IR": "نخستین فاکتور خود را بسازید تا وضعیت پرداخت‌ها را همین‌جا ببینید.",
    "en-US": "Create your first invoice and payment status will show up here.",
  },
  newInvoice: { "fa-IR": "فاکتور تازه", "en-US": "New invoice" },

  // Form / text fields
  fullName: { "fa-IR": "نام و نام خانوادگی", "en-US": "Full name" },
  fullNamePlaceholder: { "fa-IR": "سارا محمدی", "en-US": "Sara Mohammadi" },
  emailHelp: {
    "fa-IR": "برای بازیابی رمز عبور از آن استفاده می‌کنیم.",
    "en-US": "We use it to recover your password.",
  },
  postalCode: { "fa-IR": "کد پستی", "en-US": "Postal code" },
  postalError: {
    "fa-IR": "کد پستی واردشده معتبر نیست.",
    "en-US": "That postal code is not valid.",
  },
  submitDetails: { "fa-IR": "ثبت اطلاعات", "en-US": "Submit details" },

  // Kbd
  quickSearch: { "fa-IR": "جستجوی سریع", "en-US": "Quick search" },
  saveDocument: { "fa-IR": "ذخیرهٔ سند", "en-US": "Save the document" },
  closePanel: { "fa-IR": "بستن پنجره", "en-US": "Close the panel" },

  // Link
  componentGuide: { "fa-IR": "راهنمای کامپوننت‌ها", "en-US": "Component guide" },
  changelog: { "fa-IR": "تاریخچهٔ تغییرها", "en-US": "Changelog" },
  webStandard: { "fa-IR": "استاندارد وب", "en-US": "The web standard" },
  newTab: { "fa-IR": "در برگهٔ تازه باز می‌شود", "en-US": "Opens in a new tab" },

  // Menu
  actions: { "fa-IR": "عملیات", "en-US": "Actions" },
  editSection: { "fa-IR": "ویرایش", "en-US": "Edit" },
  duplicate: { "fa-IR": "رونوشت", "en-US": "Duplicate" },
  rename: { "fa-IR": "تغییر نام", "en-US": "Rename" },

  // Number field
  quantity: { "fa-IR": "تعداد", "en-US": "Quantity" },
  quantityHelp: {
    "fa-IR": "بیشترین تعداد در هر سفارش، ده عدد است.",
    "en-US": "Up to ten per order.",
  },

  // Popover
  orderDetails: { "fa-IR": "جزئیات سفارش", "en-US": "Order details" },
  popoverBody: {
    "fa-IR": "سفارش پس از تأیید پرداخت، همان روز ارسال می‌شود.",
    "en-US": "Once the payment clears, the order ships the same day.",
  },

  // Progress
  uploading: { "fa-IR": "بارگذاری پرونده", "en-US": "Uploading the file" },
  processing: { "fa-IR": "در حال پردازش", "en-US": "Processing" },
  storageUsed: { "fa-IR": "فضای مصرف‌شده", "en-US": "Storage used" },

  // Radio group
  delivery: { "fa-IR": "روش ارسال", "en-US": "Delivery method" },
  deliveryHelp: {
    "fa-IR": "زمان تحویل بر پایهٔ نشانی شما برآورد می‌شود.",
    "en-US": "Delivery time is estimated from your address.",
  },
  standardPost: { "fa-IR": "پست عادی", "en-US": "Standard post" },
  express: { "fa-IR": "پیک تندرو", "en-US": "Express courier" },
  expressHelp: {
    "fa-IR": "تحویل در همان روز، تنها در مرکز شهر.",
    "en-US": "Same-day delivery, city centre only.",
  },
  pickup: { "fa-IR": "تحویل حضوری", "en-US": "Store pickup" },

  // Search field
  searchOrders: { "fa-IR": "جستجو در سفارش‌ها", "en-US": "Search orders" },
  searchPlaceholder: {
    "fa-IR": "شمارهٔ سفارش یا نام مشتری",
    "en-US": "Order number or customer name",
  },

  // Separator
  sectionOne: { "fa-IR": "بخش نخست محتوا", "en-US": "The first section of content" },
  sectionTwo: { "fa-IR": "بخش دوم محتوا", "en-US": "The second section of content" },

  // Spinner
  loading: { "fa-IR": "در حال بارگذاری…", "en-US": "Loading…" },
  saving: { "fa-IR": "در حال ذخیره…", "en-US": "Saving…" },

  // Stack / Grid / Container
  accountSettings: { "fa-IR": "تنظیمات حساب", "en-US": "Account settings" },
  cellOne: { "fa-IR": "نخست", "en-US": "First" },
  cellTwo: { "fa-IR": "دوم", "en-US": "Second" },
  cellThree: { "fa-IR": "سوم", "en-US": "Third" },

  // Switch
  emailNotices: { "fa-IR": "اعلان‌های ایمیلی", "en-US": "Email notifications" },
  autosave: { "fa-IR": "ذخیرهٔ خودکار", "en-US": "Autosave" },
  autosaveHelp: {
    "fa-IR": "هر تغییری بی‌درنگ ثبت می‌شود.",
    "en-US": "Every change is stored immediately.",
  },
  experimental: { "fa-IR": "قابلیت‌های آزمایشی", "en-US": "Experimental features" },

  // Tabs
  accountSections: { "fa-IR": "بخش‌های حساب", "en-US": "Account sections" },
  billing: { "fa-IR": "صورت‌حساب", "en-US": "Billing" },
  security: { "fa-IR": "امنیت", "en-US": "Security" },
  profilePanel: {
    "fa-IR": "نام، نشانی و زبان نمایش را همین‌جا تغییر دهید.",
    "en-US": "Change your name, address and display language here.",
  },
  billingPanel: {
    "fa-IR": "کارت‌های ذخیره‌شده و فاکتورهای پرداخت‌نشده.",
    "en-US": "Saved cards and unpaid invoices.",
  },
  securityPanel: {
    "fa-IR": "رمز عبور، ورود دومرحله‌ای و نشست‌های باز.",
    "en-US": "Password, two-step sign-in and open sessions.",
  },

  // Text area
  yourMessage: { "fa-IR": "پیام شما", "en-US": "Your message" },
  messagePlaceholder: {
    "fa-IR": "مشکل را کوتاه شرح دهید",
    "en-US": "Describe the problem briefly",
  },
  messageHelp: {
    "fa-IR": "تیم پشتیبانی در یک روز کاری پاسخ می‌دهد.",
    "en-US": "Support replies within one business day.",
  },

  // Toggle group
  listView: { "fa-IR": "فهرست", "en-US": "List" },
  gridView: { "fa-IR": "شبکه", "en-US": "Grid" },
  boardView: { "fa-IR": "تخته", "en-US": "Board" },

  // Toolbar
  formatting: { "fa-IR": "قالب‌بندی متن", "en-US": "Text formatting" },
  bold: { "fa-IR": "پررنگ", "en-US": "Bold" },
  italic: { "fa-IR": "کج", "en-US": "Italic" },
  insertLink: { "fa-IR": "افزودن پیوند", "en-US": "Insert a link" },

  // Tooltip
  removeRow: { "fa-IR": "حذف این ردیف", "en-US": "Remove this row" },
  duplicateRow: { "fa-IR": "رونوشت این ردیف", "en-US": "Duplicate this row" },
} as const satisfies Record<string, Record<Locale, string>>;

/** A decorative glyph. Always `aria-hidden` — an icon is never a name. */
function LinkGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M6.5 9.5 9.5 6.5M7 4.5 8.5 3a3 3 0 0 1 4.5 4.5L11.5 9M9 11.5 7.5 13A3 3 0 0 1 3 8.5L4.5 7" />
    </svg>
  );
}

function EmptyGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2.5h6.5L13 6v7.5H3z" />
      <path d="M9.5 2.5V6H13" />
    </svg>
  );
}

const DEMOS: Demo[] = [
  {
    id: "button",
    title: { "fa-IR": "دکمه", "en-US": "Button" },
    intro: {
      "fa-IR": "کنش اصلی. چهار گونه و چهار اندازه، با فاصله‌گذاری منطقی که در راست‌چین قرینه می‌شود.",
      "en-US": "The primary action. Four variants and four sizes, with logical spacing that mirrors under RTL.",
    },
    tier: "form",
    behaviour: true,
    source: source("button.tsx"),
    render: (l) => (
      <div className="flex flex-wrap items-center gap-3">
        <Button>{copy.save[l]}</Button>
        <Button variant="outline">{copy.cancel[l]}</Button>
        <Button variant="ghost">{copy.cancel[l]}</Button>
        <Button variant="critical">{copy.remove[l]}</Button>
      </div>
    ),
  },
  {
    id: "icon-button",
    title: { "fa-IR": "دکمهٔ آیکونی", "en-US": "Icon button" },
    intro: {
      "fa-IR": "دکمه‌ای که فقط آیکون دارد. چون آیکون نام نیست، ویژگی label اجباری است و کامپایلر آن را الزام می‌کند.",
      "en-US": "A button whose content is only an icon. Because an icon is not a name, the label prop is required and the compiler enforces it.",
    },
    tier: "form",
    behaviour: true,
    source: source("button.tsx"),
    render: (l) => (
      <div className="flex items-center gap-3">
        <IconButton label={copy.more[l]} variant="outline">
          <span aria-hidden="true">⋯</span>
        </IconButton>
        <IconButton label={copy.remove[l]} variant="ghost">
          <span aria-hidden="true">×</span>
        </IconButton>
      </div>
    ),
  },
  {
    id: "alert",
    title: { "fa-IR": "هشدار", "en-US": "Alert" },
    intro: {
      "fa-IR": "پیام درون‌صفحه‌ای با چهار لحن. نوار رنگی روی لبهٔ خواندن می‌نشیند و در راست‌چین خودبه‌خود قرینه می‌شود.",
      "en-US": "An inline message in four tones. The accent bar sits on the reading edge and mirrors itself under RTL.",
    },
    tier: "feedback",
    behaviour: false,
    source: source("alert.tsx"),
    render: (l) => (
      <div className="flex w-full max-w-lg flex-col gap-3">
        <Alert tone="info" title={copy.alertInfoTitle[l]}>
          {copy.alertInfoBody[l]}
        </Alert>
        <Alert tone="positive" title={copy.alertOkTitle[l]}>
          {copy.alertOkBody[l]}
        </Alert>
        <Alert tone="critical" title={copy.alertBadTitle[l]}>
          {copy.alertBadBody[l]}
        </Alert>
      </div>
    ),
  },
  {
    id: "avatar",
    title: { "fa-IR": "آواتار", "en-US": "Avatar" },
    intro: {
      "fa-IR": "تصویر یا حروف نخست یک شخص. هرجا src داده شود، نوشتن alt اجباری است — حتی وقتی پاسخ درست رشتهٔ خالی باشد.",
      "en-US": "A person as a picture or as initials. Wherever src is given, writing alt is required — even when the right answer is an empty string.",
    },
    tier: "display",
    behaviour: false,
    source: source("avatar.tsx"),
    render: (l) => (
      <div className="flex items-center gap-3">
        <Avatar size="sm" initials={copy.initialsA[l]} />
        <Avatar initials={copy.initialsB[l]} />
        <Avatar size="lg" initials={copy.initialsC[l]} />
        <Avatar size="xl" initials={copy.initialsA[l]} />
      </div>
    ),
  },
  {
    id: "badge",
    title: { "fa-IR": "نشان", "en-US": "Badge" },
    intro: {
      "fa-IR": "نشانگر وضعیت. چون پرکاربردترین محتوایش یک شمارش است، فرزندانش LumoNode هستند و عدد خام کامپایل نمی‌شود.",
      "en-US": "A status marker. Its most common content is a count, so children are LumoNode and a bare number does not compile.",
    },
    tier: "display",
    behaviour: false,
    source: source("badge.tsx"),
    render: (l) => (
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{copy.draft[l]}</Badge>
        <Badge tone="positive">{copy.active[l]}</Badge>
        <Badge tone="critical" variant="solid">
          {copy.expired[l]}
        </Badge>
        <Badge tone="accent">{formatNumber(12, l)}</Badge>
      </div>
    ),
  },
  {
    id: "breadcrumbs",
    title: { "fa-IR": "مسیر راهنما", "en-US": "Breadcrumbs" },
    intro: {
      "fa-IR": "مسیر رسیدن به این صفحه. label اجباری است، وگرنه ری‌اکت‌آریا نام انگلیسی خودش را می‌گذارد؛ جداکنندهٔ › خودش قرینه می‌شود.",
      "en-US": "The trail to this page. label is required, or React Aria supplies its own English name; the › separator mirrors itself.",
    },
    tier: "navigation",
    behaviour: true,
    source: source("breadcrumbs.tsx"),
    render: (l) => (
      <Breadcrumbs label={copy.trail[l]}>
        <Breadcrumb id="home">{copy.home[l]}</Breadcrumb>
        <Breadcrumb id="settings">{copy.settings[l]}</Breadcrumb>
        <Breadcrumb id="profile">{copy.profile[l]}</Breadcrumb>
      </Breadcrumbs>
    ),
  },
  {
    id: "card",
    title: { "fa-IR": "کارت", "en-US": "Card" },
    intro: {
      "fa-IR": "سطحی با سربرگ، بدنه و پاورقی. کنش‌ها به لبهٔ پایانی می‌روند: راست در انگلیسی، چپ در فارسی.",
      "en-US": "A surface with a header, a body and a footer. Actions sit at the inline end: right in English, left in Persian.",
    },
    tier: "layout",
    behaviour: false,
    source: source("card.tsx"),
    render: (l) => (
      <Card variant="elevated" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{copy.planTitle[l]}</CardTitle>
          <CardDescription>{copy.planDescription[l]}</CardDescription>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-fg-muted">{copy.planBody[l]}</p>
        </CardBody>
        <CardFooter>
          <Button variant="ghost" size="sm">
            {copy.cancel[l]}
          </Button>
          <Button size="sm">{copy.save[l]}</Button>
        </CardFooter>
      </Card>
    ),
  },
  {
    id: "checkbox",
    title: { "fa-IR": "چک‌باکس", "en-US": "Checkbox" },
    intro: {
      "fa-IR": "چک‌باکس تکی و گروه چک‌باکس. برچسب گروه اجباری است و نشانگر با خط متن هم‌تراز می‌ماند، نه با بالای آن.",
      "en-US": "A single checkbox and a checkbox group. The group's label is required, and the indicator centres on the line rather than its top.",
    },
    tier: "form",
    behaviour: true,
    source: source("checkbox.tsx"),
    render: (l) => (
      <div className="flex flex-col gap-5">
        <Checkbox defaultSelected>{copy.terms[l]}</Checkbox>
        <CheckboxGroup label={copy.channels[l]} defaultValue={["email"]}>
          <Checkbox value="email">{copy.email[l]}</Checkbox>
          <Checkbox value="sms">{copy.sms[l]}</Checkbox>
          <Checkbox value="in-app">{copy.inApp[l]}</Checkbox>
        </CheckboxGroup>
      </div>
    ),
  },
  {
    id: "combobox",
    title: { "fa-IR": "جعبهٔ ترکیبی", "en-US": "Combo box" },
    intro: {
      "fa-IR": "ورودی متنی که فهرست را فیلتر می‌کند. دو نام انگلیسی ری‌اکت‌آریا با دو ویژگی اجباری بسته می‌شوند.",
      "en-US": "A text input that filters a list. Two required props close the two English names React Aria would otherwise ship.",
    },
    tier: "form",
    behaviour: true,
    source: source("combobox.tsx"),
    render: (l) => (
      <ComboBox
        className="max-w-xs"
        label={copy.city[l]}
        placeholder={copy.cityPlaceholder[l]}
        showSuggestionsLabel={stringsFor(l).comboBox.showSuggestions}
        suggestionsLabel={copy.suggestions[l]}
      >
        <ComboBoxItem id="thr">{copy.tehran[l]}</ComboBoxItem>
        <ComboBoxItem id="isf">{copy.isfahan[l]}</ComboBoxItem>
        <ComboBoxItem id="tbz">{copy.tabriz[l]}</ComboBoxItem>
        <ComboBoxItem id="shz">{copy.shiraz[l]}</ComboBoxItem>
      </ComboBox>
    ),
  },
  {
    id: "dialog",
    title: { "fa-IR": "گفت‌وگو", "en-US": "Dialog" },
    intro: {
      "fa-IR": "پنجرهٔ مودال در چهار لایه. نام دکمهٔ بستن ویژگی اجباری است، چون یک ✕ نام نیست.",
      "en-US": "A modal dialog in four layers. The close button's name is a required prop, because an ✕ is not a name.",
    },
    tier: "overlay",
    behaviour: true,
    source: source("dialog.tsx"),
    render: (l) => (
      <DialogTrigger>
        <Button>{copy.editProfile[l]}</Button>
        <DialogOverlay>
          <DialogModal size="md">
            <Dialog closeLabel={copy.close[l]}>
              <DialogHeading>{copy.editProfile[l]}</DialogHeading>
              <p className="text-sm text-fg-muted">{copy.dialogBody[l]}</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" slot="close">
                  {copy.cancel[l]}
                </Button>
                <Button slot="close">{copy.save[l]}</Button>
              </div>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>
    ),
  },
  {
    id: "disclosure",
    title: { "fa-IR": "بخش تاشو", "en-US": "Disclosure" },
    intro: {
      "fa-IR": "بخشی که باز و بسته می‌شود، و آکاردئونی که چند تا را کنار هم می‌گذارد. پیکان نیم‌دور می‌چرخد، نه ربع‌دور.",
      "en-US": "A section that opens and closes, and the accordion that groups several. The chevron turns a half turn, never a quarter.",
    },
    tier: "display",
    behaviour: true,
    source: source("disclosure.tsx"),
    render: (l) => (
      <DisclosureGroup defaultExpandedKeys={["shipping"]} className="w-full max-w-md">
        <Disclosure id="shipping">
          <DisclosureTrigger>{copy.shippingQuestion[l]}</DisclosureTrigger>
          <DisclosurePanel>{copy.shippingAnswer[l]}</DisclosurePanel>
        </Disclosure>
        <Disclosure id="returns">
          <DisclosureTrigger>{copy.returnsQuestion[l]}</DisclosureTrigger>
          <DisclosurePanel>{copy.returnsAnswer[l]}</DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>
    ),
  },
  {
    id: "drawer",
    title: { "fa-IR": "کشو", "en-US": "Drawer" },
    intro: {
      "fa-IR": "پنلی که از لبهٔ خواندن می‌آید. حرکتش با inset-inline انجام می‌شود، نه translate، تا خودِ حرکت هم قرینه شود.",
      "en-US": "A panel that slides in from the reading edge. It animates inset-inline rather than translate, so the motion mirrors too.",
    },
    tier: "overlay",
    behaviour: true,
    source: source("drawer.tsx"),
    render: (l) => (
      <DialogTrigger>
        <Button variant="outline">{copy.showFilters[l]}</Button>
        <DrawerOverlay>
          <Drawer side="start" size="sm">
            <Dialog closeLabel={copy.close[l]}>
              <DialogHeading>{copy.filters[l]}</DialogHeading>
              <p className="text-sm text-fg-muted">{copy.drawerBody[l]}</p>
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>
    ),
  },
  {
    id: "empty-state",
    title: { "fa-IR": "حالت خالی", "en-US": "Empty state" },
    intro: {
      "fa-IR": "پنل «هنوز چیزی اینجا نیست»: آیکون، عنوان، توضیح و یک کنش. متن وسط‌چین است، پس در هر دو جهت درست می‌نشیند.",
      "en-US": "The nothing-here panel: icon, title, explanation, one action. The text is centred, so it reads correctly in both directions.",
    },
    tier: "display",
    behaviour: false,
    source: source("empty-state.tsx"),
    render: (l) => (
      <EmptyState
        className="max-w-md"
        icon={<EmptyGlyph />}
        title={copy.emptyTitle[l]}
        description={copy.emptyBody[l]}
        action={<Button size="sm">{copy.newInvoice[l]}</Button>}
      />
    ),
  },
  {
    id: "form",
    title: { "fa-IR": "فرم", "en-US": "Form" },
    intro: {
      "fa-IR": "چهارچوب فیلد: برچسب، راهنما و خطا. اعتبارسنجی از نوع aria است تا پیام مرورگر به زبان مرورگر نشت نکند.",
      "en-US": "Field chrome: label, help text, error. Validation is aria rather than native, so the browser's own language never leaks in.",
    },
    tier: "form",
    behaviour: true,
    source: source("form.tsx"),
    render: (l) => (
      <Form className="w-full max-w-sm">
        <TextField
          label={copy.fullName[l]}
          placeholder={copy.fullNamePlaceholder[l]}
          isRequired
        />
        <TextField label={copy.email[l]} type="email" description={copy.emailHelp[l]} />
        <TextField label={copy.postalCode[l]} errorMessage={copy.postalError[l]} />
        <Button type="submit" className="w-fit">
          {copy.submitDetails[l]}
        </Button>
      </Form>
    ),
  },
  {
    id: "kbd",
    title: { "fa-IR": "کلید میان‌بر", "en-US": "Keyboard key" },
    intro: {
      "fa-IR": "میان‌بر صفحه‌کلید. کل آکورد در یک جزیرهٔ چپ‌چین می‌نشیند، وگرنه بند راست‌چین آن را وارونه می‌چیند.",
      "en-US": "A keyboard shortcut. The whole chord sits inside one LTR island; otherwise an RTL paragraph reorders it into nonsense.",
    },
    tier: "display",
    behaviour: false,
    source: source("kbd.tsx"),
    render: (l) => (
      <div className="flex flex-col gap-3 text-sm text-fg-muted">
        <span className="flex items-center gap-2">
          {copy.quickSearch[l]} <Kbd keys={["Ctrl", "K"]} />
        </span>
        <span className="flex items-center gap-2">
          {copy.saveDocument[l]} <Kbd keys={["⌘", "S"]} />
        </span>
        <span className="flex items-center gap-2">
          {copy.closePanel[l]} <Kbd size="sm" keys={["Esc"]} />
        </span>
      </div>
    ),
  },
  {
    id: "link",
    title: { "fa-IR": "پیوند", "en-US": "Link" },
    intro: {
      "fa-IR": "پیوند ناوبری. خط زیر با فاصله کشیده می‌شود تا دنبالهٔ حروف فارسی را نبرد؛ باز شدن در برگهٔ تازه هشدار می‌خواهد.",
      "en-US": "A navigational link. The underline is offset so it clears Persian descenders, and opening a new tab requires a spoken warning.",
    },
    tier: "navigation",
    behaviour: true,
    source: source("link.tsx"),
    render: (l) => (
      <div className="flex flex-wrap items-center gap-5">
        <Link href={`/${l}/components/`}>{copy.componentGuide[l]}</Link>
        <Link href={`/${l}/`} variant="subtle">
          {copy.changelog[l]}
        </Link>
        <Link
          href="https://developer.mozilla.org/"
          newTab
          newTabLabel={copy.newTab[l]}
        >
          {copy.webStandard[l]}
        </Link>
      </div>
    ),
  },
  {
    id: "menu",
    title: { "fa-IR": "منو", "en-US": "Menu" },
    intro: {
      "fa-IR": "منوی کنش‌ها با بخش و جداکننده. پیکان زیرمنو نویسهٔ › است تا موتور متن خودش آن را قرینه کند.",
      "en-US": "A menu of actions with sections and separators. The submenu arrow is the character ›, which the text engine mirrors itself.",
    },
    tier: "overlay",
    behaviour: true,
    source: source("menu.tsx"),
    render: (l) => (
      <MenuTrigger>
        <Button variant="outline">{copy.actions[l]}</Button>
        <MenuPopover>
          <Menu>
            <MenuSection title={copy.editSection[l]}>
              <MenuItem id="duplicate">{copy.duplicate[l]}</MenuItem>
              <MenuItem id="rename">{copy.rename[l]}</MenuItem>
            </MenuSection>
            <MenuSeparator />
            <MenuItem id="remove">{copy.remove[l]}</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    ),
  },
  {
    id: "number-field",
    title: { "fa-IR": "ورودی عددی", "en-US": "Number field" },
    intro: {
      "fa-IR": "ورودی عدد با سه رشتهٔ اجباری: نام دکمهٔ کاهش، نام دکمهٔ افزایش، و توضیح نقش روی خودِ ورودی.",
      "en-US": "A number input with three required strings: the decrement name, the increment name and the input's own role description.",
    },
    tier: "form",
    behaviour: true,
    source: source("number-field.tsx"),
    render: (l) => (
      <NumberField
        className="max-w-xs"
        label={copy.quantity[l]}
        description={copy.quantityHelp[l]}
        decrementLabel={stringsFor(l).numberField.decrease(copy.quantity[l])}
        incrementLabel={stringsFor(l).numberField.increase(copy.quantity[l])}
        roleDescription={stringsFor(l).numberField.roleDescription}
        minValue={1}
        maxValue={10}
      />
    ),
  },
  {
    id: "popover",
    title: { "fa-IR": "پاپ‌اور", "en-US": "Popover" },
    intro: {
      "fa-IR": "لایهٔ شناور با جای‌گیری منطقی. املای فیزیکی left و right اصلاً قابل نوشتن نیست.",
      "en-US": "A positioned overlay with logical placement. The physical spellings left and right are not expressible at all.",
    },
    tier: "overlay",
    behaviour: true,
    source: source("popover.tsx"),
    render: (l) => (
      <PopoverTrigger>
        <Button variant="outline">{copy.orderDetails[l]}</Button>
        <Popover placement="bottom start" className="max-w-xs">
          <p className="text-sm text-fg-muted">{copy.popoverBody[l]}</p>
        </Popover>
      </PopoverTrigger>
    ),
  },
  {
    id: "progress",
    title: { "fa-IR": "پیشرفت", "en-US": "Progress" },
    intro: {
      "fa-IR": "نوار پیشرفت و سنجه. عدد با formatNumber ساخته می‌شود، پس آنچه دیده و آنچه شنیده می‌شود هرگز از هم جدا نمی‌شوند.",
      "en-US": "A progress bar and a meter. The number is built with formatNumber, so what is seen and what is announced cannot drift.",
    },
    tier: "feedback",
    behaviour: true,
    source: source("progress.tsx"),
    render: (l) => (
      <div className="flex w-full max-w-sm flex-col gap-6">
        <ProgressBar label={copy.uploading[l]} locale={l} value={45} showValue />
        <ProgressBar label={copy.processing[l]} locale={l} isIndeterminate />
        <Meter label={copy.storageUsed[l]} locale={l} value={82} tone="caution" showValue />
      </div>
    ),
  },
  {
    id: "radio-group",
    title: { "fa-IR": "گروه رادیویی", "en-US": "Radio group" },
    intro: {
      "fa-IR": "گزینه‌های ناسازگار زیر یک پرسش. محور کلیدهای پیکان با محور چیدمان یکی است، چون یک ویژگی هر دو را می‌راند.",
      "en-US": "Mutually exclusive options under one question. The arrow-key axis matches the layout axis, because one prop drives both.",
    },
    tier: "form",
    behaviour: true,
    source: source("radio-group.tsx"),
    render: (l) => (
      <RadioGroup
        label={copy.delivery[l]}
        description={copy.deliveryHelp[l]}
        defaultValue="standard"
      >
        <Radio value="standard">{copy.standardPost[l]}</Radio>
        <Radio value="express" description={copy.expressHelp[l]}>
          {copy.express[l]}
        </Radio>
        <Radio value="pickup">{copy.pickup[l]}</Radio>
      </RadioGroup>
    ),
  },
  {
    id: "search-field",
    title: { "fa-IR": "جستجو", "en-US": "Search field" },
    intro: {
      "fa-IR": "ورودی جستجو. نام دکمهٔ پاک کردن اجباری است، وگرنه ری‌اکت‌آریا نام انگلیسی خودش را روی صفحهٔ فارسی می‌گذارد.",
      "en-US": "A search input. The clear button's name is required, or React Aria puts its own English name on a Persian page.",
    },
    tier: "form",
    behaviour: true,
    source: source("search-field.tsx"),
    render: (l) => (
      <SearchField
        className="max-w-xs"
        label={copy.searchOrders[l]}
        placeholder={copy.searchPlaceholder[l]}
        clearLabel={stringsFor(l).searchField.clear}
        defaultValue={copy.tehran[l]}
      />
    ),
  },
  {
    id: "select",
    title: { "fa-IR": "انتخابگر", "en-US": "Select" },
    intro: {
      "fa-IR": "فهرست تک‌انتخابی درون یک پاپ‌اور. متن جای‌نما اجباری است، چون پیش‌فرض ری‌اکت‌آریا یک عبارت انگلیسیِ دیدنی است.",
      "en-US": "A single-select listbox in a popover. The placeholder is required, because React Aria's fallback is a visible English phrase.",
    },
    tier: "form",
    behaviour: true,
    source: source("select.tsx"),
    render: (l) => (
      <Select className="max-w-xs" placeholder={copy.selectCity[l]}>
        <Label>{copy.city[l]}</Label>
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">{copy.tehran[l]}</SelectItem>
          <SelectItem id="isf">{copy.isfahan[l]}</SelectItem>
          <SelectItem id="tbz">{copy.tabriz[l]}</SelectItem>
          <SelectItem id="shz">{copy.shiraz[l]}</SelectItem>
        </SelectPopover>
      </Select>
    ),
  },
  {
    id: "separator",
    title: { "fa-IR": "جداکننده", "en-US": "Separator" },
    intro: {
      "fa-IR": "خطی میان دو گروه محتوا. حالت افقی hr است و حالت عمودی یک div با نقش جداکننده، چون hr شکستِ بند است.",
      "en-US": "A rule between two groups of content. Horizontal renders an hr; vertical renders a div, because an hr is a paragraph break.",
    },
    tier: "layout",
    behaviour: true,
    source: source("separator.tsx"),
    render: (l) => (
      <div className="w-full max-w-sm">
        <p className="text-sm text-fg-muted">{copy.sectionOne[l]}</p>
        <Separator className="my-4" />
        <p className="text-sm text-fg-muted">{copy.sectionTwo[l]}</p>
        <div className="mt-4 flex h-6 items-center gap-3 text-sm text-fg-muted">
          <span>{copy.draft[l]}</span>
          <Separator orientation="vertical" />
          <span>{copy.edited[l]}</span>
        </div>
      </div>
    ),
  },
  {
    id: "skeleton",
    title: { "fa-IR": "اسکلت", "en-US": "Skeleton" },
    intro: {
      "fa-IR": "جای‌گیرِ محتوایی که هنوز نرسیده. تپش به‌جای درخشش، چون گرادیان و کی‌فریم شکل منطقی ندارند و در راست‌چین وارونه می‌دوند.",
      "en-US": "A placeholder for content that has not arrived. A pulse rather than a shimmer: gradients and keyframes have no logical form.",
    },
    tier: "feedback",
    behaviour: false,
    source: source("skeleton.tsx"),
    render: () => (
      <div className="flex w-full max-w-sm items-start gap-3">
        <Skeleton shape="circle" className="size-10" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton shape="heading" />
          <Skeleton />
          <Skeleton className="w-2/3" />
        </div>
      </div>
    ),
  },
  {
    id: "spinner",
    title: { "fa-IR": "چرخنده", "en-US": "Spinner" },
    intro: {
      "fa-IR": "نشانگر انتظار که خودش را اعلام می‌کند. برچسب اجباری است و متنِ واقعی است، نه aria-label روی ناحیهٔ زنده.",
      "en-US": "A busy indicator that says so out loud. The label is required, and it is real text in a live region, not an aria-label.",
    },
    tier: "feedback",
    behaviour: false,
    source: source("spinner.tsx"),
    render: (l) => (
      <div className="flex items-center gap-6">
        <Spinner label={copy.loading[l]} />
        <Spinner label={copy.loading[l]} size="lg" tone="accent" />
        <Spinner label={copy.saving[l]} tone="muted" showLabel />
      </div>
    ),
  },
  {
    id: "stack",
    title: { "fa-IR": "چیدمان", "en-US": "Stack" },
    intro: {
      "fa-IR": "سه ابتداییِ چیدمان: Stack و Grid و Container. فاصله همیشه gap است، چون space-x فیزیکی است و در فارسی به سمت غلط جمع می‌شود.",
      "en-US": "Three layout primitives: Stack, Grid and Container. Spacing is always gap, because space-x is physical and bunches to the wrong side.",
    },
    tier: "layout",
    behaviour: false,
    source: source("stack.tsx"),
    render: (l) => (
      <Container size="sm" padded={false}>
        <Stack gap="md">
          <Stack direction="row" justify="between" align="center" gap="sm">
            <span className="text-sm font-medium text-fg">{copy.accountSettings[l]}</span>
            <Button size="sm" variant="outline">
              {copy.save[l]}
            </Button>
          </Stack>
          <Grid cols="3" gap="sm">
            <div className="rounded-md bg-surface-sunken p-3 text-sm text-fg-muted">
              {copy.cellOne[l]}
            </div>
            <div className="rounded-md bg-surface-sunken p-3 text-sm text-fg-muted">
              {copy.cellTwo[l]}
            </div>
            <div className="rounded-md bg-surface-sunken p-3 text-sm text-fg-muted">
              {copy.cellThree[l]}
            </div>
          </Grid>
        </Stack>
      </Container>
    ),
  },
  {
    id: "switch",
    title: { "fa-IR": "کلید", "en-US": "Switch" },
    intro: {
      "fa-IR": "کلید روشن و خاموش. انگشتی با inset-inline-start جابه‌جا می‌شود، نه translate-x، که در فارسی به‌سوی آغاز خط برمی‌گشت.",
      "en-US": "An on/off switch. The thumb moves with inset-inline-start, not translate-x, which would slide it backwards in Persian.",
    },
    tier: "form",
    behaviour: true,
    source: source("switch.tsx"),
    render: (l) => (
      <div className="flex flex-col gap-5">
        <Switch defaultSelected>{copy.emailNotices[l]}</Switch>
        <Switch description={copy.autosaveHelp[l]}>{copy.autosave[l]}</Switch>
        <Switch isDisabled>{copy.experimental[l]}</Switch>
      </div>
    ),
  },
  {
    id: "tabs",
    title: { "fa-IR": "زبانه‌ها", "en-US": "Tabs" },
    intro: {
      "fa-IR": "زبانه‌ها. نام فهرست زبانه اجباری است، و کلیدهای پیکان را ری‌اکت‌آریا با جهت سند حل می‌کند.",
      "en-US": "Tabs. The tab list's name is required, and React Aria resolves the arrow keys against the document direction.",
    },
    tier: "navigation",
    behaviour: true,
    source: source("tabs.tsx"),
    render: (l) => (
      <Tabs className="w-full max-w-md">
        <TabList label={copy.accountSections[l]}>
          <Tab id="profile">{copy.profile[l]}</Tab>
          <Tab id="billing">{copy.billing[l]}</Tab>
          <Tab id="security">{copy.security[l]}</Tab>
        </TabList>
        <TabPanel id="profile">
          <p className="text-sm text-fg-muted">{copy.profilePanel[l]}</p>
        </TabPanel>
        <TabPanel id="billing">
          <p className="text-sm text-fg-muted">{copy.billingPanel[l]}</p>
        </TabPanel>
        <TabPanel id="security">
          <p className="text-sm text-fg-muted">{copy.securityPanel[l]}</p>
        </TabPanel>
      </Tabs>
    ),
  },
  {
    id: "tag",
    title: { "fa-IR": "برچسب", "en-US": "Tag" },
    intro: {
      "fa-IR": "چیپی برای یک فیلتر یا مقدار انتخاب‌شده. اگر حذف‌شدنی باشد، تایپ نامِ دکمهٔ حذف را اجباری می‌کند.",
      "en-US": "A chip for a filter or a selected value. If it is removable, the type makes the remove button's name mandatory.",
    },
    tier: "display",
    behaviour: true,
    source: source("tag.tsx"),
    render: (l) => (
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{copy.tehran[l]}</Tag>
        <Tag>{copy.isfahan[l]}</Tag>
        <Tag size="sm">{copy.tabriz[l]}</Tag>
        <Tag size="sm">{copy.shiraz[l]}</Tag>
      </div>
    ),
  },
  {
    id: "text-area",
    title: { "fa-IR": "ناحیهٔ متن", "en-US": "Text area" },
    intro: {
      "fa-IR": "ورودی چندخطی. تغییر اندازه فقط روی محور بلوک باز است، چون کشیدن روی محور خطی در راست‌چین به مرورگر بستگی دارد.",
      "en-US": "A multi-line input. Resizing is limited to the block axis, because inline resizing inside an RTL container is browser-dependent.",
    },
    tier: "form",
    behaviour: true,
    source: source("text-area.tsx"),
    render: (l) => (
      <TextArea
        className="w-full max-w-sm"
        label={copy.yourMessage[l]}
        placeholder={copy.messagePlaceholder[l]}
        description={copy.messageHelp[l]}
        rows={4}
      />
    ),
  },
  {
    id: "text-field",
    title: { "fa-IR": "ورودی متن", "en-US": "Text field" },
    intro: {
      "fa-IR": "ورودی تک‌خطی. برچسبِ رشته‌ای اجباری است، چون قرارداد «هر فیلد برچسب دارد» پیش‌تر شکست خورده است.",
      "en-US": "A single-line input. The label is a required string, because the convention that every field has one has already failed.",
    },
    tier: "form",
    behaviour: true,
    source: source("text-field.tsx"),
    render: (l) => (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <TextField label={copy.fullName[l]} placeholder={copy.fullNamePlaceholder[l]} />
        <TextField label={copy.email[l]} description={copy.emailHelp[l]} />
        <TextField label={copy.postalCode[l]} errorMessage={copy.postalError[l]} />
      </div>
    ),
  },
  {
    id: "toggle-group",
    title: { "fa-IR": "گروه دکمهٔ حالتی", "en-US": "Toggle group" },
    intro: {
      "fa-IR": "کنترل بخش‌بندی‌شده. گِردی گوشه‌ها به گروه سپرده شده تا در هر دو جهت و هر دو راستا درست بماند.",
      "en-US": "A segmented control. The corner radius belongs to the group, so it stays correct in both directions and both orientations.",
    },
    tier: "form",
    behaviour: true,
    source: source("toggle-group.tsx"),
    render: (l) => (
      <ToggleButtonGroup selectionMode="single" defaultSelectedKeys={["list"]}>
        <ToggleButton id="list">{copy.listView[l]}</ToggleButton>
        <ToggleButton id="grid">{copy.gridView[l]}</ToggleButton>
        <ToggleButton id="board">{copy.boardView[l]}</ToggleButton>
      </ToggleButtonGroup>
    ),
  },
  {
    id: "toolbar",
    title: { "fa-IR": "نوار ابزار", "en-US": "Toolbar" },
    intro: {
      "fa-IR": "گروهی از کنترل‌ها با ناوبری پیکانی و یک ایست تبی. نام نوار اجباری است تا آن ایست قابل تشخیص باشد.",
      "en-US": "A group of controls with arrow-key navigation and one tab stop. The toolbar's name is required to make that stop identifiable.",
    },
    tier: "navigation",
    behaviour: true,
    source: source("toolbar.tsx"),
    render: (l) => (
      <Toolbar label={copy.formatting[l]}>
        <ToggleButtonGroup selectionMode="multiple" defaultSelectedKeys={["bold"]}>
          <ToggleButton id="bold" size="sm">
            {copy.bold[l]}
          </ToggleButton>
          <ToggleButton id="italic" size="sm">
            {copy.italic[l]}
          </ToggleButton>
        </ToggleButtonGroup>
        <ToolbarSeparator />
        <IconButton label={copy.insertLink[l]} variant="ghost" size="sm">
          <LinkGlyph />
        </IconButton>
      </Toolbar>
    ),
  },
  {
    id: "tooltip",
    title: { "fa-IR": "راهنمای ابزار", "en-US": "Tooltip" },
    intro: {
      "fa-IR": "توضیحی که با نشانگر یا فوکوس ظاهر می‌شود. راهنما نام نیست: دکمهٔ آیکونی همچنان label خودش را لازم دارد.",
      "en-US": "A description shown on hover or focus. A tooltip is not a name: an icon button still needs its own label.",
    },
    tier: "overlay",
    behaviour: true,
    source: source("tooltip.tsx"),
    render: (l) => (
      <div className="flex items-center gap-3">
        <TooltipTrigger>
          <IconButton label={copy.remove[l]} variant="outline">
            <span aria-hidden="true">×</span>
          </IconButton>
          <Tooltip>{copy.removeRow[l]}</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger>
          <IconButton label={copy.duplicate[l]} variant="outline">
            <span aria-hidden="true">⧉</span>
          </IconButton>
          <Tooltip placement="bottom">{copy.duplicateRow[l]}</Tooltip>
        </TooltipTrigger>
      </div>
    ),
  },
];

export function allDemos(): Demo[] {
  return [...DEMOS].sort((a, b) => a.id.localeCompare(b.id));
}

export function demoById(id: string): Demo | undefined {
  return DEMOS.find((d) => d.id === id);
}
