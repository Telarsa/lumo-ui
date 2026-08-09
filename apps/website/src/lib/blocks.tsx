import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { EmptyCollection, Faq, Hero, StatGrid } from "@lumo-ui/blocks";

/**
 * The blocks gallery.
 *
 * Deliberately a small, curated set rather than all nineteen. A block is a whole
 * screen, and a gallery that renders nineteen of them stacked is neither
 * reviewable nor honest about how any of them looks in use — the point of
 * showing a block is to see it occupy a page.
 *
 * Every block takes ALL its text as a required `strings` prop, so each entry
 * here supplies a complete Persian and English set. That is the contract working
 * as intended: there is no way to render one of these and accidentally ship
 * English, because there is no default to fall back to.
 */

const BLOCKS_SRC = join(process.cwd(), "..", "..", "packages", "blocks", "src");

function source(file: string): string {
  try {
    return readFileSync(join(BLOCKS_SRC, file), "utf8");
  } catch {
    return `// ${file} — source unavailable at build time`;
  }
}

export interface BlockDemo {
  id: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
  source: string;
}

const BLOCKS: BlockDemo[] = [
  {
    id: "stat-grid",
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
    id: "empty-collection",
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
    id: "faq",
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
    id: "hero",
    title: { "fa-IR": "سربرگ صفحه", "en-US": "Hero" },
    intro: {
      "fa-IR": "نخستین بخش یک صفحهٔ معرفی. بدون «use client» رندر می‌شود، پس متن آن در نخستین بایت است و خزنده آن را می‌بیند.",
      "en-US": "The opening section of a marketing page. Renders without \"use client\", so its text is in the first byte and a crawler sees it.",
    },
    source: source("hero.tsx"),
    render: (l) => (
      <Hero
        strings={{
          title: l === "fa-IR" ? "زیرساخت فروشگاه شما" : "Infrastructure for your shop",
          description:
            l === "fa-IR"
              ? "سفارش، پرداخت و ارسال را از یک جا اداره کنید."
              : "Run orders, payments and delivery from one place.",
          primaryAction: l === "fa-IR" ? "شروع کنید" : "Get started",
          secondaryAction: l === "fa-IR" ? "مستندات" : "Documentation",
        }}
        primaryHref="#"
        secondaryHref="#"
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
