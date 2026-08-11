import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { FolderPlusIcon, InboxIcon, SearchXIcon } from "lucide-react";
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the empty-state page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `empty-state.tsx` has no `"use client"` either — which is
 * only possible because `action` is a SLOT. An `onAction` callback would be a
 * function crossing the server boundary and would make every empty state in the
 * application a client component; a slot lets a server-rendered panel hold a
 * client `<Button>` and stay server-rendered around it.
 *
 * The whole component is centred with `text-center`, which is direction-neutral
 * and correct in both scripts. The trap it exists to prevent is the hand-written
 * `text-left` that a reviewer adds later without noticing it pins Persian prose
 * to the wrong edge; `text-start` is the logical form when centring is not what
 * is wanted.
 */

const t = {
  noResultsTitle: { "fa-IR": "نتیجه‌ای پیدا نشد", "en-US": "No results found" },
  noResultsBody: {
    "fa-IR": "هیچ سفارشی با این فیلترها همخوانی ندارد. بازهٔ تاریخ را گسترده‌تر کنید یا وضعیت را بردارید.",
    "en-US": "No order matches these filters. Widen the date range, or drop the status filter.",
  },
  clearFilters: { "fa-IR": "برداشتن فیلترها", "en-US": "Clear the filters" },

  firstRunTitle: { "fa-IR": "هنوز پروژه‌ای نساخته‌اید", "en-US": "You have not made a project yet" },
  firstRunBody: {
    "fa-IR": "پروژه جایی است که فروشگاه، تیم و گزارش‌هایتان کنار هم می‌نشینند. ساختنش کمتر از یک دقیقه طول می‌کشد.",
    "en-US": "A project is where your storefront, your team and your reporting sit together. Making one takes under a minute.",
  },
  newProject: { "fa-IR": "پروژهٔ تازه", "en-US": "New project" },

  inboxTitle: { "fa-IR": "صندوق خالی است", "en-US": "The inbox is empty" },
  inboxBody: {
    "fa-IR": "پیام تازه‌ای نمانده است.",
    "en-US": "Nothing new is waiting.",
  },

  archiveCardTitle: { "fa-IR": "بایگانی", "en-US": "Archive" },
  archiveTitle: { "fa-IR": "بایگانی خالی است", "en-US": "Nothing is archived" },
  archiveBodyLead: {
    "fa-IR": "از میان",
    "en-US": "Out of",
  },
  archiveBodyTail: {
    "fa-IR": "سفارش این ماه، هیچ‌کدام هنوز بایگانی نشده است.",
    "en-US": "orders this month, none has been archived yet.",
  },
} satisfies Record<string, LocalizedText>;

function NoResultsExample(l: Locale) {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface">
      <EmptyState
        icon={<SearchXIcon aria-hidden="true" />}
        title={t.noResultsTitle[l]}
        description={t.noResultsBody[l]}
        action={<Button variant="outline">{t.clearFilters[l]}</Button>}
      />
    </div>
  );
}

function FirstRunExample(l: Locale) {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface">
      <EmptyState
        size="lg"
        icon={<FolderPlusIcon aria-hidden="true" />}
        title={t.firstRunTitle[l]}
        description={t.firstRunBody[l]}
        action={<Button>{t.newProject[l]}</Button>}
      />
    </div>
  );
}

function InCardExample(l: Locale) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle level={4}>{t.archiveCardTitle[l]}</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <EmptyState
          size="sm"
          level={5}
          icon={<InboxIcon aria-hidden="true" />}
          title={t.archiveTitle[l]}
          description={
            <>
              {t.archiveBodyLead[l]} {formatNumber(148, l)} {t.archiveBodyTail[l]}
            </>
          }
        />
      </CardBody>
    </Card>
  );
}

function BareExample(l: Locale) {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface">
      <EmptyState title={t.inboxTitle[l]} description={t.inboxBody[l]} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "feedback",
    title: { "fa-IR": "حالت خالی", "en-US": "Empty state" },
    intro: {
      "fa-IR":
        "پنل «هنوز چیزی اینجا نیست»: آیکون، عنوان، توضیح و یک کنش. کنش یک شکاف است نه یک تابع، و همین یک تصمیم است که این جزء را روی سرور نگه می‌دارد — پاس‌دادن onAction یعنی عبور یک تابع از مرز سرور و کلاینتی‌شدن هر حالت خالی در برنامه. عنوان اجباری است و LumoNode، پس شمارشِ خام درون آن کامپایل نمی‌شود.",
      "en-US":
        "The \"there is nothing here yet\" panel: an icon, a title, an explanation and one action. The action is a SLOT rather than a callback, and that single decision is what keeps the component on the server — an onAction prop would be a function crossing the boundary and would make every empty state in the app a client component. The title is required and typed LumoNode, so a bare count inside it does not compile.",
    },
    composition: [
      `<EmptyState size level icon title description action>`,
      `                          ← icon is aria-hidden: the title already says it`,
      `                          ← action is a NODE, so a client Button fits inside`,
      `                             a server-rendered panel`,
    ].join("\n"),
    parts: [
      {
        name: "EmptyState",
        description: {
          "fa-IR":
            "کل جزء. size فقط لایه‌گذاری محور بلوکی را عوض می‌کند، پس چیزی برای قرینه‌شدن ندارد؛ level همان عددِ سرفصل است که در card.tsx توضیح داده شده و برای حالتی که پنل درون کارتی دیگر می‌نشیند لازم می‌شود.",
          "en-US":
            "The whole component. size changes only block-axis padding, so it has nothing to mirror; level is the same heading number card.tsx argues for, and it earns its keep the moment the panel sits inside another card.",
        },
      },
    ],
  },
  examples: [
    {
      id: "no-results",
      title: { "fa-IR": "جست‌وجوی بی‌نتیجه", "en-US": "A search that found nothing" },
      description: {
        "fa-IR":
          "کنش یک «Button» کامل است که از بیرون تزریق می‌شود؛ خودِ پنل هیچ چیزی دربارهٔ آن نمی‌داند و روی سرور رندر می‌شود. توضیح می‌گوید چه کاری باید کرد — «نتیجه‌ای نیست» بدون راه بازگشت، بن‌بستی است که کاربر را به دکمهٔ بازگشت مرورگر می‌فرستد.",
        "en-US":
          "The action is a whole «Button» injected from outside; the panel knows nothing about it and renders on the server regardless. The description says what to DO — \"no results\" with no way back is a dead end that sends the reader to the browser's back button.",
      },
      render: NoResultsExample,
    },
    {
      id: "first-run",
      title: { "fa-IR": "نخستین بار", "en-US": "The first run" },
      description: {
        "fa-IR":
          "همان جزء با size بزرگ‌تر. تفاوت میان «خالی چون چیزی پیدا نشد» و «خالی چون هنوز شروع نکرده‌اید» در نوشته است، نه در چیدمان: اولی فیلترها را مقصر می‌داند و دومی باید بگوید این چیز به چه درد می‌خورد.",
        "en-US":
          "The same component at a larger size. The difference between \"empty because nothing matched\" and \"empty because you have not started\" is in the WORDS, not the layout: the first blames the filters, the second has to say what the thing is for.",
      },
      render: FirstRunExample,
    },
    {
      id: "in-a-card",
      title: { "fa-IR": "درون یک کارت", "en-US": "Inside a card" },
      description: {
        "fa-IR":
          "دو نکته اینجا نامرئی‌اند. اول level که به پنج می‌رسد، چون عنوان کارت سطح چهار است و پرش سطح فهرست سرفصل‌ها را می‌شکند. دوم شمارش درون توضیح که از formatNumber می‌گذرد — description هم LumoNode است و عدد خام را نمی‌پذیرد.",
        "en-US":
          "Two things here are invisible. First level, pushed to five because the card's own title is a four and a skipped level breaks the outline. Second the count inside the description, which goes through formatNumber — description is LumoNode too and refuses a bare number.",
      },
      render: InCardExample,
    },
    {
      id: "bare",
      title: { "fa-IR": "بدون آیکون و بدون کنش", "en-US": "No icon, no action" },
      description: {
        "fa-IR":
          "برای وضعیتی که کاری برای انجام‌دادن ندارد، این شکل درست است. آیکون در حالت‌های دیگر aria-hidden است و چیزی به درخت دسترس‌پذیری اضافه نمی‌کند؛ نبودنش هم دقیقاً به همان اندازه بی‌صداست.",
        "en-US":
          "For a state with nothing to do about it, this is the right shape. In the other examples the icon is aria-hidden and adds nothing to the accessibility tree; leaving it out is exactly as silent.",
      },
      render: BareExample,
    },
  ],
};
