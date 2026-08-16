import type { BuiltinLocale as Locale } from "@lumo-ui/core";
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

  illustratedTitle: { "fa-IR": "هنوز فروشی ثبت نشده", "en-US": "No sale has been recorded yet" },
  illustratedBody: {
    "fa-IR":
      "وقتی نخستین سفارش پرداخت شود، نمودار فروش همین‌جا ساخته می‌شود. تا آن وقت این قاب خالی می‌ماند.",
    "en-US":
      "Once the first order is paid, the sales chart is built right here. Until then this frame stays empty.",
  },

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

/**
 * `media="bare"` — the slot with no frame around it.
 *
 * The default `media="icon"` wraps whatever it is given in a 40px circle and
 * shrinks any nested `<svg>` to 20px, which is right for a lucide glyph and
 * destroys an ILLUSTRATION. A first-run panel in a real product shows a picture,
 * not a 20px symbol, and before this variant the only way to get one was to stop
 * using the slot and hand-render the artwork above the component — losing the
 * gap rhythm and the centring the panel exists for.
 *
 * The drawing is still `aria-hidden`, exactly as the glyph is: the title says
 * what it says. A picture carrying meaning the title does not is not decoration
 * and does not belong in this slot.
 */
function IllustratedExample(l: Locale) {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface">
      <EmptyState
        size="lg"
        media="bare"
        icon={
          <svg
            viewBox="0 0 120 72"
            aria-hidden="true"
            className="h-20 w-auto text-border"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {/* A bar chart with no bars — the picture of the state itself. */}
            <path d="M12 8v52h96" strokeLinecap="round" />
            <path d="M30 60V44M54 60V32M78 60V50M102 60V26" strokeDasharray="4 5" />
          </svg>
        }
        title={t.illustratedTitle[l]}
        description={t.illustratedBody[l]}
      />
    </div>
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
    usage: {
      when: {
        "fa-IR": "پنل جایی که محتوا باید باشد و هنوز نیست: صندوق خالی، جست‌وجوی بی‌نتیجه، صفحهٔ نخستین اجرا. با یک کنش.",
        "en-US": "The panel where content should be and is not yet: an empty inbox, a search with no results, a first-run screen. With one action.",
      },
      whenNot: {
        "fa-IR": "محتوایی که هنوز در راه است — `Skeleton`. پیامی کنار محتوایی که وجود دارد — `Alert`. عملیاتی در جریان — `Spinner`.",
        "en-US": "Content still on its way — `Skeleton`. A message beside content that exists — `Alert`. An operation in flight — `Spinner`.",
      },
    },
    tier: "feedback",
    title: { "fa-IR": "حالت خالی", "en-US": "Empty state" },
    intro: {
      "fa-IR":
        "پنل «هنوز چیزی اینجا نیست»: آیکون، عنوان، توضیح و یک کنش. کنش یک شکاف است نه یک تابع، و همین یک تصمیم است که این جزء را روی سرور نگه می‌دارد — پاس‌دادن onAction یعنی عبور یک تابع از مرز سرور و کلاینتی‌شدن هر حالت خالی در برنامه. عنوان اجباری است و LumoNode، پس شمارشِ خام درون آن کامپایل نمی‌شود.",
      "en-US":
        "The \"there is nothing here yet\" panel: an icon, a title, an explanation and one action. The action is a SLOT rather than a callback, and that single decision is what keeps the component on the server — an onAction prop would be a function crossing the boundary and would make every empty state in the app a client component. The title is required and typed LumoNode, so a bare count inside it does not compile.",
    },
    composition: [
      `<EmptyState size media level icon title description action>`,
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
      {
        name: "emptyStateMediaVariants",
        description: {
          "fa-IR":
            "قابِ شکافِ تصویر. icon همان دایرهٔ چهل‌پیکسلی است و پیش‌فرض می‌ماند؛ bare هیچ قابی نمی‌کشد و هیچ اندازه‌ای تحمیل نمی‌کند. تفاوت وقتی مهم می‌شود که محتوا یک تصویرسازی باشد نه یک نماد بیست‌پیکسلی — که در پنلِ «نخستین بار» همیشه همین است.",
          "en-US":
            "The media slot's frame. icon is the 40px chip and stays the default; bare frames nothing and constrains nothing. The difference matters the moment the content is an ILLUSTRATION rather than a 20px symbol — which, in a first-run panel, it always is.",
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
      id: "illustrated",
      title: { "fa-IR": "تصویرسازی به‌جای نماد", "en-US": "An illustration instead of a symbol" },
      description: {
        "fa-IR":
          "media=\"bare\" قاب را برمی‌دارد. با پیش‌فرض، همین نقاشی درون دایره‌ای چهل‌پیکسلی بریده می‌شد و هر svg تودرتویش به بیست پیکسل کوچک می‌شد — و تنها راه فرار، رهاکردن خودِ شکاف بود. تصویر همچنان aria-hidden است: عنوان همان را می‌گوید و یک گرافیکِ بی‌نام فقط یک ایستگاهِ بی‌محتوا اضافه می‌کند.",
        "en-US":
          "media=\"bare\" takes the frame off. Under the default this drawing would be cropped into a 40px circle and any nested svg shrunk to 20px, and the only escape was to abandon the slot. The picture is still aria-hidden: the title says what it says, and an unnamed graphic only adds a stop with no content.",
      },
      render: IllustratedExample,
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
