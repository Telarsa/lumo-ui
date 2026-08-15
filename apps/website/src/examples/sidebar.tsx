import type { Locale } from "@lumo-ui/core";
import { Gauge, LifeBuoy, Package, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the sidebar page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * The collapse state is the sidebar's own (uncontrolled), the trigger's two
 * labels are strings, and the badge arrives pre-formatted — «۳» is written
 * HERE, per locale, because a bare 3 is not a LumoNode and does not compile.
 */

const t = {
  nav: { "fa-IR": "ناوبری اصلی", "en-US": "Main navigation" },
  brand: { "fa-IR": "لومو", "en-US": "Lumo" },
  reports: { "fa-IR": "گزارش‌ها", "en-US": "Reports" },
  dashboard: { "fa-IR": "داشبورد", "en-US": "Dashboard" },
  orders: { "fa-IR": "سفارش‌ها", "en-US": "Orders" },
  ordersBadge: { "fa-IR": "۳", "en-US": "3" },
  system: { "fa-IR": "سامانه", "en-US": "System" },
  settings: { "fa-IR": "تنظیمات", "en-US": "Settings" },
  support: { "fa-IR": "پشتیبانی", "en-US": "Support" },
  collapse: { "fa-IR": "جمع‌کردن نوار کناری", "en-US": "Collapse the sidebar" },
  expand: { "fa-IR": "بازکردن نوار کناری", "en-US": "Expand the sidebar" },
} satisfies Record<string, LocalizedText>;

function ExpandedExample(l: Locale) {
  return (
    <div className="flex h-80 overflow-hidden rounded-lg border border-border bg-bg">
      <Sidebar label={t.nav[l]}>
        <SidebarHeader>
          <span className="truncate text-sm font-semibold text-fg">{t.brand[l]}</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup title={t.reports[l]}>
            <SidebarItem href="#dash" icon={<Gauge />} isCurrent="page">
              {t.dashboard[l]}
            </SidebarItem>
            <SidebarItem href="#orders" icon={<Package />} badge={t.ordersBadge[l]}>
              {t.orders[l]}
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup title={t.system[l]}>
            <SidebarItem href="#settings" icon={<Settings />}>
              {t.settings[l]}
            </SidebarItem>
            <SidebarItem href="#support" icon={<LifeBuoy />}>
              {t.support[l]}
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarTrigger collapseLabel={t.collapse[l]} expandLabel={t.expand[l]} />
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 p-4" />
    </div>
  );
}

function RailExample(l: Locale) {
  return (
    <div className="flex h-80 overflow-hidden rounded-lg border border-border bg-bg">
      <Sidebar label={t.nav[l]} defaultCollapsed>
        <SidebarContent>
          <SidebarGroup title={t.reports[l]}>
            <SidebarItem href="#dash2" icon={<Gauge />} isCurrent="page">
              {t.dashboard[l]}
            </SidebarItem>
            <SidebarItem href="#orders2" icon={<Package />} badge={t.ordersBadge[l]}>
              {t.orders[l]}
            </SidebarItem>
            <SidebarItem href="#settings2" icon={<Settings />}>
              {t.settings[l]}
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarTrigger collapseLabel={t.collapse[l]} expandLabel={t.expand[l]} />
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 p-4" />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ناوبری کناری یک برنامه: گروه‌ها، گزینه‌های آیکون‌ونشان‌دار، ریل جمع‌شده.",
        "en-US": "An application's side navigation: groups, icon-and-badge items, a collapsed rail.",
      },
      whenNot: {
        "fa-IR": "ناوبری بالای سایت — `NavigationMenu`. کشویی که روی محتوا باز می‌شود — `Drawer`. فهرست مطالب یک صفحه — `Scrollspy`.",
        "en-US": "Site-top navigation — `NavigationMenu`. A drawer opened over content — `Drawer`. The table of contents of one page — `Scrollspy`.",
      },
    },
    // Page identity — the catalog builds the page from these three fields (see lib/catalog.ts).
    tier: "navigation",
    title: { "fa-IR": "نوار کناری", "en-US": "Sidebar" },
    intro: { "fa-IR": "نوار کناریِ برنامه: گروه‌ها، آیتم‌ها با آیکون و نشان، و حالت جمع‌شده. کامپوننت است، نه بلوک — بلوکِ پوستهٔ برنامه می‌تواند رویش بنشیند.", "en-US": "The app sidebar: groups, icon-and-badge items, and a collapsed rail. A component, not a block — the app-shell block can adopt it." },
    isNew: true,
    composition: [
      `<Sidebar label="…">`,
      `  <SidebarHeader>…</SidebarHeader>`,
      `  <SidebarContent>`,
      `    <SidebarGroup title="…">`,
      `      <SidebarItem href="…" icon="…" badge="…">…</SidebarItem>`,
      `    </SidebarGroup>`,
      `  </SidebarContent>`,
      `  <SidebarFooter>`,
      `    <SidebarTrigger collapseLabel="…" expandLabel="…" />`,
      `  </SidebarFooter>`,
      `</Sidebar>`,
    ].join("\n"),
    parts: [
      {
        name: "Sidebar",
        description: {
          "fa-IR": "نشانگاه nav نام‌دار و مالک حالت جمع‌شدن؛ درز آن با border-e روی لبهٔ پایانی درون‌خطی می‌نشیند — در فارسی سمت چپ.",
          "en-US": "The named nav landmark and owner of the collapse state; its seam sits on the inline-end edge — the left side in Persian.",
        },
      },
      {
        name: "SidebarHeader",
        description: {
          "fa-IR": "ناحیهٔ ثابت بالای نوار، برای نشان یا جست‌وجو.",
          "en-US": "The pinned band atop the rail, for the brand or a search box.",
        },
      },
      {
        name: "SidebarContent",
        description: {
          "fa-IR": "میانهٔ پیمایش‌شونده با همان نوار باریک ScrollArea.",
          "en-US": "The scrolling middle, with the same thin bar as ScrollArea.",
        },
      },
      {
        name: "SidebarGroup",
        description: {
          "fa-IR": "گروه آیتم‌ها؛ عنوانش با aria-labelledby به گروه سیم‌کشی می‌شود و در ریل sr-only می‌ماند.",
          "en-US": "A group of items; its title is wired via aria-labelledby and survives the rail as sr-only.",
        },
      },
      {
        name: "SidebarItem",
        description: {
          "fa-IR": "آیتم ناوبری روی Link با aria-current، آیکون تزیینی و نشانِ ازپیش‌قالب‌بندی‌شده؛ در ریل فقط آیکون دیده می‌شود اما نام می‌ماند.",
          "en-US": "A navigation item on Link with aria-current, a decorative icon and a pre-formatted badge; the rail shows only the icon but keeps the name.",
        },
      },
      {
        name: "SidebarFooter",
        description: {
          "fa-IR": "ناحیهٔ ثابت پایین نوار، جای معمول دکمهٔ جمع‌کردن.",
          "en-US": "The pinned band at the bottom, the usual home of the collapse toggle.",
        },
      },
      {
        name: "SidebarTrigger",
        description: {
          "fa-IR": "دکمهٔ جمع/باز با دو برچسب اجباری — معنای دکمه با حالت وارونه می‌شود — و نویسهٔ آینه‌شوندهٔ گیومه به‌جای آیکون جهت‌دار.",
          "en-US": "The collapse toggle with two required labels — the button's meaning inverts with the state — and a bidi-mirrored glyph instead of a directional icon.",
        },
      },
    ],
  },
  examples: [
    {
      id: "expanded",
      title: { "fa-IR": "نوار کناری باز", "en-US": "Expanded" },
      description: {
        "fa-IR": "دو گروه نام‌دار و صفحهٔ فعلی با aria-current؛ دکمهٔ پایین نوار را به ریل تبدیل می‌کند و برچسبش با حالت عوض می‌شود.",
        "en-US": "Two named groups and the current page stated with aria-current; the footer button collapses to the rail, and its label swaps with the state.",
      },
      render: ExpandedExample,
    },
    {
      id: "rail",
      title: { "fa-IR": "حالت ریل", "en-US": "The rail" },
      description: {
        "fa-IR": "همان نوار، جمع‌شده: فقط آیکون‌ها دیده می‌شوند اما نام‌ها بر جای‌اند — شمار «۳» سفارش هنوز اعلام می‌شود.",
        "en-US": "The same sidebar, collapsed: only the icons remain visible, but the names stay — the order count is still announced.",
      },
      render: RailExample,
    },
  ],
};
