import type { Locale } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";
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

export const EXAMPLES: ComponentExamples = {
  meta: {
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
