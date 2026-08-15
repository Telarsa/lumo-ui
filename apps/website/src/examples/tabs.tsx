import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Badge, Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";
import { CreditCard, ShieldCheck, User } from "lucide-react";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the tabs page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 */

const t = {
  accountSections: { "fa-IR": "بخش‌های حساب", "en-US": "Account sections" },
  profile: { "fa-IR": "پروفایل", "en-US": "Profile" },
  billing: { "fa-IR": "صورتحساب", "en-US": "Billing" },
  security: { "fa-IR": "امنیت", "en-US": "Security" },
  profilePanel: {
    "fa-IR": "نام، تصویر و نشانی ایمیل شما اینجا ویرایش می‌شود.",
    "en-US": "Your name, picture and email address are edited here.",
  },
  billingPanel: {
    "fa-IR": "روش پرداخت و تاریخچهٔ صورتحساب‌ها اینجاست.",
    "en-US": "Your payment method and billing history live here.",
  },
  securityPanel: {
    "fa-IR": "گذرواژه و ورود دومرحله‌ای را اینجا مدیریت کنید.",
    "en-US": "Manage your password and two-step sign-in here.",
  },
  inbox: { "fa-IR": "صندوق ورودی", "en-US": "Inbox" },
  drafts: { "fa-IR": "پیش‌نویس‌ها", "en-US": "Drafts" },
  spam: { "fa-IR": "هرزنامه", "en-US": "Spam" },
  mailboxes: { "fa-IR": "صندوق‌های نامه", "en-US": "Mailboxes" },
  unreadCounted: { "fa-IR": "پیام خوانده‌نشده", "en-US": "unread messages" },
  draftsCounted: { "fa-IR": "پیش‌نویس ذخیره‌شده", "en-US": "saved drafts" },
  inboxPanel: {
    "fa-IR": "نامه‌های رسیده که هنوز بایگانی نشده‌اند.",
    "en-US": "Mail that has arrived and has not been archived yet.",
  },
  draftsPanel: {
    "fa-IR": "نوشته‌هایی که ذخیره شده‌اند و هنوز فرستاده نشده‌اند.",
    "en-US": "Messages you saved and have not sent.",
  },
  spamPanel: {
    "fa-IR": "پیام‌هایی که فیلتر جدا کرده است.",
    "en-US": "Messages the filter set aside.",
  },
  archived: { "fa-IR": "بایگانی‌شده", "en-US": "Archived" },
  archivedPanel: {
    "fa-IR": "بایگانی برای این حساب هنوز فعال نشده است.",
    "en-US": "Archiving is not enabled for this account yet.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Tabs className="w-full max-w-md">
      <TabList label={t.accountSections[l]}>
        <Tab id="profile">{t.profile[l]}</Tab>
        <Tab id="billing">{t.billing[l]}</Tab>
        <Tab id="security">{t.security[l]}</Tab>
      </TabList>
      <TabPanel id="profile">
        <p className="text-sm text-fg-muted">{t.profilePanel[l]}</p>
      </TabPanel>
      <TabPanel id="billing">
        <p className="text-sm text-fg-muted">{t.billingPanel[l]}</p>
      </TabPanel>
      <TabPanel id="security">
        <p className="text-sm text-fg-muted">{t.securityPanel[l]}</p>
      </TabPanel>
    </Tabs>
  );
}

function WithIconsExample(l: Locale) {
  return (
    <Tabs className="w-full max-w-md">
      <TabList label={t.accountSections[l]}>
        <Tab id="profile">
          <span className="flex items-center gap-2">
            <User aria-hidden="true" className="size-4" />
            {t.profile[l]}
          </span>
        </Tab>
        <Tab id="billing">
          <span className="flex items-center gap-2">
            <CreditCard aria-hidden="true" className="size-4" />
            {t.billing[l]}
          </span>
        </Tab>
        <Tab id="security">
          <span className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4" />
            {t.security[l]}
          </span>
        </Tab>
      </TabList>
      <TabPanel id="profile">
        <p className="text-sm text-fg-muted">{t.profilePanel[l]}</p>
      </TabPanel>
      <TabPanel id="billing">
        <p className="text-sm text-fg-muted">{t.billingPanel[l]}</p>
      </TabPanel>
      <TabPanel id="security">
        <p className="text-sm text-fg-muted">{t.securityPanel[l]}</p>
      </TabPanel>
    </Tabs>
  );
}

function VerticalExample(l: Locale) {
  return (
    <Tabs orientation="vertical" className="w-full max-w-md">
      <TabList label={t.accountSections[l]}>
        <Tab id="profile">{t.profile[l]}</Tab>
        <Tab id="billing">{t.billing[l]}</Tab>
        <Tab id="security">{t.security[l]}</Tab>
      </TabList>
      <TabPanel id="profile">
        <p className="text-sm text-fg-muted">{t.profilePanel[l]}</p>
      </TabPanel>
      <TabPanel id="billing">
        <p className="text-sm text-fg-muted">{t.billingPanel[l]}</p>
      </TabPanel>
      <TabPanel id="security">
        <p className="text-sm text-fg-muted">{t.securityPanel[l]}</p>
      </TabPanel>
    </Tabs>
  );
}

function DisabledTabExample(l: Locale) {
  return (
    <Tabs className="w-full max-w-md">
      <TabList label={t.accountSections[l]}>
        <Tab id="profile">{t.profile[l]}</Tab>
        <Tab id="archived" isDisabled>
          {t.archived[l]}
        </Tab>
        <Tab id="security">{t.security[l]}</Tab>
      </TabList>
      <TabPanel id="profile">
        <p className="text-sm text-fg-muted">{t.profilePanel[l]}</p>
      </TabPanel>
      <TabPanel id="archived">
        <p className="text-sm text-fg-muted">{t.archivedPanel[l]}</p>
      </TabPanel>
      <TabPanel id="security">
        <p className="text-sm text-fg-muted">{t.securityPanel[l]}</p>
      </TabPanel>
    </Tabs>
  );
}

function CountsExample(l: Locale) {
  /*
   * A count in a tab is not decoration — it lands inside the tab's ACCESSIBLE
   * NAME, because a tab is named by its contents. Two consequences follow, and
   * both are why this example exists rather than a screenshot of a number in a
   * pill:
   *
   *  1. The digits are announced, so they must be the page's digits.
   *     `formatNumber` is what makes them ۱۲ rather than the Latin pair — and a
   *     bare number child would not have compiled anyway.
   *  2. «Inbox ۱۲» is not a sentence. What the twelve COUNTS has to be in the
   *     name, or a listener hears a figure with no noun. The visible badge
   *     stays a bare figure, and an `sr-only` span supplies the noun, so the
   *     tab reads «صندوق ورودی ۱۲ پیام خوانده‌نشده» while the pill still shows
   *     just the figure.
   *
   * The badge is `subtle`: a solid fill inside a selected tab puts two filled
   * surfaces on top of each other.
   */
  return (
    <Tabs className="w-full max-w-md">
      <TabList label={t.mailboxes[l]}>
        <Tab id="inbox">
          <span className="flex items-center gap-2">
            {t.inbox[l]}
            <Badge tone="accent" variant="subtle">
              {formatNumber(12, l)}
              <span className="sr-only"> {t.unreadCounted[l]}</span>
            </Badge>
          </span>
        </Tab>
        <Tab id="drafts">
          <span className="flex items-center gap-2">
            {t.drafts[l]}
            <Badge tone="neutral" variant="subtle">
              {formatNumber(3, l)}
              <span className="sr-only"> {t.draftsCounted[l]}</span>
            </Badge>
          </span>
        </Tab>
        <Tab id="spam">{t.spam[l]}</Tab>
      </TabList>
      <TabPanel id="inbox">
        <p className="text-sm text-fg-muted">{t.inboxPanel[l]}</p>
      </TabPanel>
      <TabPanel id="drafts">
        <p className="text-sm text-fg-muted">{t.draftsPanel[l]}</p>
      </TabPanel>
      <TabPanel id="spam">
        <p className="text-sm text-fg-muted">{t.spamPanel[l]}</p>
      </TabPanel>
    </Tabs>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    title: { "fa-IR": "زبانه‌ها", "en-US": "Tabs" },
    intro: {
      "fa-IR": "زبانه‌ها. نام فهرست زبانه اجباری است، و کلیدهای پیکان را ری‌اکت‌آریا با جهت سند حل می‌کند.",
      "en-US": "Tabs. The tab list's name is required, and React Aria resolves the arrow keys against the document direction.",
    },
    tier: "navigation",
    composition: [
      `<Tabs orientation="…">`,
      `  <TabList label="…">`,
      `    <Tab id="…">…</Tab>`,
      `  </TabList>`,
      `  <TabPanel id="…">…</TabPanel>`,
      `</Tabs>`,
    ].join("\n"),
    parts: [
      {
        name: "Tabs",
        description: {
          "fa-IR": "ریشه؛ جهت‌گیری افقی یا عمودی را همین‌جا می‌گیرد.",
          "en-US": "The root; horizontal or vertical orientation is set here.",
        },
      },
      {
        name: "TabList",
        description: {
          "fa-IR": "ردیف زبانه‌ها؛ نامش اجباری است تا فهرست بی‌نام اعلام نشود.",
          "en-US": "The row of tabs; its name is required so the list is never announced nameless.",
        },
      },
      {
        name: "Tab",
        description: {
          "fa-IR": "یک زبانه؛ پیکان‌ها با جهت سند حل می‌شوند، نه با چپ و راست فیزیکی.",
          "en-US": "One tab; arrow keys resolve against the document direction, not physical left/right.",
        },
      },
      {
        name: "TabPanel",
        description: {
          "fa-IR": "محتوای زبانهٔ انتخاب‌شده؛ وقتی فرزند فوکوس‌پذیر ندارد خودش ایست تب می‌شود.",
          "en-US": "The selected tab's content; it becomes a tab stop itself when nothing inside is focusable.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "سه زبانه با یک نام اجباری برای فهرست؛ زیرخط انتخاب روی لبهٔ بلوک می‌نشیند.",
        "en-US": "Three tabs behind one required list name; the selection underline sits on the block edge.",
      },
      render: BasicExample,
    },
    {
      id: "with-icons",
      title: { "fa-IR": "با آیکون", "en-US": "With icons" },
      description: {
        "fa-IR": "آیکون تزئین است و aria-hidden؛ نام زبانه همان متن دیدنی می‌ماند.",
        "en-US": "The icon is decoration and aria-hidden; the tab's name stays its visible text.",
      },
      render: WithIconsExample,
    },
    {
      id: "counts",
      title: { "fa-IR": "شمارنده روی زبانه", "en-US": "A count on the tab" },
      description: {
        "fa-IR":
          "شمارنده تزئین نیست: زبانه با محتوایش نام می‌گیرد، پس عدد داخل نام اعلام‌شده می‌نشیند. دو نتیجه دارد. نخست، رقم‌ها خوانده می‌شوند و باید رقم‌های همین صفحه باشند — formatNumber همین را تضمین می‌کند و عدد خام اصلاً کامپایل نمی‌شد. دوم، «صندوق ورودی ۱۲» جمله نیست: باید معلوم باشد دوازده، شمارِ چیست، وگرنه شنونده عددی بی‌اسم می‌شنود. نشانِ دیداری همان رقم تنها می‌ماند و اسم را یک span پنهان می‌آورد، پس زبانه «صندوق ورودی ۱۲ پیام خوانده‌نشده» خوانده می‌شود و حباب همچنان فقط رقم را نشان می‌دهد. نشان subtle است چون پرکردنِ توپر داخل زبانهٔ انتخاب‌شده دو سطح پرشده را روی هم می‌گذارد.",
        "en-US":
          "The count is not decoration: a tab is named by its contents, so the figure lands inside the announced name. Two things follow. First, the digits are spoken, so they must be the page's digits — formatNumber guarantees that, and a bare number child would not have compiled. Second, «Inbox ۱۲» is not a sentence: what the twelve counts has to be in the name, or a listener hears a figure with no noun. The visible badge stays the bare figure and an sr-only span supplies the noun, so the tab reads «Inbox ۱۲ unread messages» while the pill still shows only the figure. The badge is subtle because a solid fill inside a selected tab stacks two filled surfaces.",
      },
      render: CountsExample,
    },
    {
      id: "vertical",
      title: { "fa-IR": "عمودی", "en-US": "Vertical" },
      description: {
        "fa-IR": "در حالت عمودی، خط انتخاب به لبهٔ خطی پایانی می‌رود و در فارسی خودش قرینه می‌شود.",
        "en-US": "Vertically the selection rule moves to the inline end and mirrors itself in Persian.",
      },
      render: VerticalExample,
    },
    {
      id: "disabled-tab",
      title: { "fa-IR": "زبانهٔ غیرفعال", "en-US": "Disabled tab" },
      description: {
        "fa-IR": "زبانهٔ غیرفعال از ناوبری پیکانی هم بیرون می‌ماند، نه فقط از کلیک.",
        "en-US": "A disabled tab is skipped by arrow-key navigation too, not only by the pointer.",
      },
      render: DisabledTabExample,
    },
  ],
};
