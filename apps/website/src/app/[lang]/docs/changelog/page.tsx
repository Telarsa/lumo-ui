import type { Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { Bullets, DocSection, DocsShell, P, Term } from "../docs-shell";

/**
 * /docs/changelog — dated history, derived from `git log`, with no version
 * numbers because nothing has been released.
 *
 * Every entry below corresponds to commits that exist on this branch; the
 * grouping is by author date. The honesty stance is deliberate and stated on
 * the page itself: the first commit (30 July 2026) contained only the plan and
 * the spike evidence, and everything that runs was written across 8–10 August
 * 2026. A changelog that dressed that up as "v0.1.0 … v0.5.0" releases would
 * be inventing a history the repository does not have.
 */

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/** Days, newest first. Both the rail and the `<h2>`s derive from this list. */
const DAYS = ["d20260810", "d20260809", "d20260808", "d20260730"] as const;
type DayId = (typeof DAYS)[number];

/**
 * Page copy as a `Record<Locale, …>` rather than `lang === "fa-IR" ? … : …`.
 * A ternary compiles with a third locale in the union and silently serves it the
 * English branch; this makes the same addition a compile error. See the rule in
 * CONTRIBUTING's "Adding a locale".
 *
 * `railLabel` and `heading` are deliberately SEPARATE here, unlike the other
 * docs pages: the rail wants a short date and the `<h2>` carries the Gregorian
 * equivalent alongside the Jalali one, so the two strings genuinely differ. A
 * page whose heading equals its rail label should carry one string, not two.
 */
interface PageCopy {
  title: string;
  intro: string;
  railLabel: Record<DayId, string>;
  heading: Record<DayId, string>;
  lead: LumoNode;
  /** Bullet bodies per day, keyed as `Bullets` keys them. */
  entries: Record<DayId, readonly { key: string; body: LumoNode }[]>;
}

const COPY = {
  "fa-IR": {
    title: "تاریخچهٔ تغییرات",
    intro: "تاریخ به‌جای شماره‌نسخه — چون هنوز نسخه‌ای منتشر نشده است.",
    railLabel: {
      d20260810: "۱۹ مرداد ۱۴۰۵",
      d20260809: "۱۸ مرداد ۱۴۰۵",
      d20260808: "۱۷ مرداد ۱۴۰۵",
      d20260730: "۸ مرداد ۱۴۰۵",
    },
    heading: {
      d20260810: "۱۹ مرداد ۱۴۰۵ — ۱۰ اوت ۲۰۲۶",
      d20260809: "۱۸ مرداد ۱۴۰۵ — ۹ اوت ۲۰۲۶",
      d20260808: "۱۷ مرداد ۱۴۰۵ — ۸ اوت ۲۰۲۶",
      d20260730: "۸ مرداد ۱۴۰۵ — ۳۰ ژوئیهٔ ۲۰۲۶",
    },
    lead: (
      <>
        این مخزن جوان است و این صفحه وانمود نمی‌کند که نیست. نخستین کامیت — ۸ مرداد ۱۴۰۵،
        برابر ۳۰ ژوئیهٔ ۲۰۲۶ — فقط برنامه و شواهدِ تصمیم‌ها بود؛ همهٔ کدی که امروز اجرا می‌شود
        در سه روز، از ۱۷ تا ۱۹ مرداد، نوشته شده است. آنچه در ادامه می‌آید مستقیم از{" "}
        <Term>git log</Term> استخراج شده، به تفکیک روز — و شماره‌نسخه‌ای در کار نیست، چون
        انتشاری در کار نبوده که شماره‌ای بخواهد.
      </>
    ),
    entries: {
      d20260810: [
        {
          key: "theme",
          body: "پوستهٔ پیش‌فرض بی‌رنگ شد، با تناسبات فشردهٔ نیویورک، و سایت صاحب سه حالت پوسته شد: روشن، تیره، سیستم. بعدتر در همان روز، پالت Nova به لایه‌های توکن راه یافت.",
        },
        {
          key: "provider",
          body: (
            <>
              <Term>LumoProvider</Term> اضافه شد، پس از اندازه‌گیریِ این‌که React Aria روی هر
              صفحهٔ فارسی <Term>en-US/ltr</Term> رندر می‌کرد؛ و بسته‌های زبانی{" "}
              <Term>fa-IR</Term> با یک وصله به بسته‌های intl خودِ react-aria اضافه شد — هر
              رشتهٔ «دست‌نیافتنی» بسته شد.
            </>
          ),
        },
        {
          key: "components",
          body: "کامپوننت‌ها تکمیل شدند: ۹ کامپوننت دادهٔ سنگین (از Table تا SegmentedControl)، وندورکردن chart و carousel و command از shadcn — خامش در یک کامیت، تطبیقش در کامیت دوم — و در پایان روز ButtonGroup و AspectRatio و AlertDialog و InputGroup و ContextMenu.",
        },
        {
          key: "blocks",
          body: "بلوک‌ها بسته شدند: ۸ بلوک باقی‌مانده به‌علاوهٔ پنل نمودار، و جمع به ۲۸ رسید. سنجش هفت کتابخانهٔ نمودار هم ثبت شد — recharts ماند و رقم‌های نمودار به‌صورت یک جدولِ واقعی در بایت‌های سروشده عرضه شد.",
        },
        {
          key: "site",
          body: "سایت نمایشگاه شکل shadcn به خود گرفت: صفحهٔ اختصاصی برای هر بلوک با پیش‌نمایش تمام‌صفحه در هر دو جهت، پالتِ جستجوی ⌘K با نرمال‌سازِ فارسی، زبانه‌های نصبِ متصل به رجیستری، پنل شواهد دسترس‌پذیری که پس از ساخت از خودِ بایت‌های خروجی محاسبه می‌شود، و هایلایتِ کد در زمان ساخت.",
        },
      ],
      d20260809: [
        {
          key: "loop",
          body: (
            <>
              پیش از هر کامپوننتی، حلقهٔ قرمز/سبز ساخته شد: <Term>pnpm verify</Term> روی مخزنِ
              تقریباً خالی سبز بود تا هر چیزِ بعدی زیر دروازه متولد شود.
            </>
          ),
        },
        {
          key: "core",
          body: (
            <>
              <Term>@lumo-ui/core</Term> با ثابت‌هایی که کامپوننت‌ها اجازهٔ بازتعریفش را
              ندارند، و قراردادِ رشته‌های فارسی — ساخته‌شده از یک سنجشِ واقعیِ نشتِ ۲۵
              کامپوننت.
            </>
          ),
        },
        {
          key: "gate",
          body: (
            <>
              <Term>lumo-gate</Term> با فیکسچر سمی برای هر قاعده؛ سپس تم، سیاست لینت، و
              اسکلتِ سایتی که دروازه واقعاً نمره‌اش می‌دهد؛ و تا پیش از نیمه‌شب، ۲۹ کامپوننتِ
              نخست در لایه‌های فرم و نمایش و لایهٔ شناور.
            </>
          ),
        },
        {
          key: "honesty",
          body: "دو تصحیحِ ثبت‌شده در همان روز: سنجش نشت تکرار شد چون لایهٔ شناورِ بسته اصلاً چیزی رندر نمی‌کند و سنجشِ اول کور بود؛ و دروازهٔ پوشش اضافه شد تا کامپوننت‌هایی را بگیرد که کسی یادش نبود تست کند.",
        },
      ],
      d20260808: [
        {
          key: "identity",
          body: "لومو صاحب نشان و نخستین توکن‌های خودش شد.",
        },
        {
          key: "pins",
          body: (
            <>
              قفل‌فایلِ جاافتاده اضافه شد و Node روی نسخهٔ ۲۴ سنجاق شد؛ Renovate و خطِ لولهٔ
              مشترک CI هم سیم‌کشی شدند.
            </>
          ),
        },
      ],
      d20260730: [
        {
          key: "plan",
          body: (
            <>
              نخستین کامیت: برنامه، و تصمیم‌ها با شواهدشان — <Term>THESIS.md</Term>،{" "}
              <Term>PLAN.md</Term>، <Term>DECISIONS.md</Term>. هیچ کد کتابخانه‌ای در کار نبود.
            </>
          ),
        },
        {
          key: "spike",
          body: "اسپایکِ Zag.js در برابر محدودیت‌های واقعی سنجیده شد و تز بر اساس یافته‌ها بازنویسی شد — مسیری که سرانجام، ده روز بعد، به React Aria رسید.",
        },
      ],
    },
  },
  "en-US": {
    title: "Changelog",
    intro: "Dates instead of version numbers — because nothing has been released yet.",
    railLabel: {
      d20260810: "10 August 2026",
      d20260809: "9 August 2026",
      d20260808: "8 August 2026",
      d20260730: "30 July 2026",
    },
    heading: {
      d20260810: "10 August 2026",
      d20260809: "9 August 2026",
      d20260808: "8 August 2026",
      d20260730: "30 July 2026",
    },
    lead: (
      <>
        This repository is young and this page does not pretend otherwise. The first commit —
        30 July 2026 — contained only the plan and the evidence behind the decisions; all of
        the code that runs today was written across three days, 8–10 August. What follows is
        derived directly from <Term>git log</Term>, grouped by day — and there are no version
        numbers, because there has been no release to number.
      </>
    ),
    entries: {
      d20260810: [
        {
          key: "theme",
          body: "The default theme went achromatic at New York proportions, and the site gained its three theme states: light, dark, system. Later the same day, the Nova palette was adopted into the token tiers.",
        },
        {
          key: "provider",
          body: (
            <>
              <Term>LumoProvider</Term> landed, after measuring that React Aria rendered{" "}
              <Term>en-US/ltr</Term> on every Persian page; and <Term>fa-IR</Term> bundles were
              patched into react-aria&rsquo;s own intl packages — every previously unreachable
              string closed.
            </>
          ),
        },
        {
          key: "components",
          body: "The component set filled out: 9 data-heavy components (Table through SegmentedControl), chart/carousel/command vendored from shadcn — raw emit in one commit, the adaptation in a second — and, by the end of the day, ButtonGroup, AspectRatio, AlertDialog, InputGroup and ContextMenu.",
        },
        {
          key: "blocks",
          body: "Blocks closed: the 8 remaining blocks plus the chart panel brought the total to 28. The seven-library chart measurement was recorded — recharts stayed, and the chart's figures ship as a real table in the served bytes.",
        },
        {
          key: "site",
          body: "The showcase took its shadcn shape: a page per block with full-page previews in both directions, the ⌘K search palette with a Persian normaliser, registry-wired install tabs, the accessibility evidence panel computed post-build from the served bytes themselves, and build-time code highlighting.",
        },
      ],
      d20260809: [
        {
          key: "loop",
          body: (
            <>
              Before any component, the red/green loop: <Term>pnpm verify</Term> green on a
              nearly empty repository, so everything after it would be born under the gate.
            </>
          ),
        },
        {
          key: "core",
          body: (
            <>
              <Term>@lumo-ui/core</Term> with the invariants components are not allowed to
              redefine, and the Persian string contract — built from a real 25-component leak
              sweep.
            </>
          ),
        },
        {
          key: "gate",
          body: (
            <>
              <Term>lumo-gate</Term> with a poison fixture per rule; then the theme, the lint
              policy, and the skeleton of a site the gate actually grades; and before midnight,
              the first 29 components across the form, display and overlay tiers.
            </>
          ),
        },
        {
          key: "honesty",
          body: "Two corrections recorded the same day: the leak measurement redone, because a closed overlay renders nothing and the first sweep was blind to it; and the coverage gate added, to catch the components nobody remembered to test.",
        },
      ],
      d20260808: [
        {
          key: "identity",
          body: "Lumo got its mark and its first tokens.",
        },
        {
          key: "pins",
          body: (
            <>
              The missing lockfile landed and Node was pinned to 24; Renovate and the shared CI
              pipeline were wired up.
            </>
          ),
        },
      ],
      d20260730: [
        {
          key: "plan",
          body: (
            <>
              The first commit: the plan, and the decisions with their evidence —{" "}
              <Term>THESIS.md</Term>, <Term>PLAN.md</Term>, <Term>DECISIONS.md</Term>. No
              library code existed.
            </>
          ),
        },
        {
          key: "spike",
          body: "The Zag.js spike was measured against real constraints and the thesis rewritten around what it found — the path that ten days later resolved to React Aria.",
        },
      ],
    },
  },
} as const satisfies Record<Locale, PageCopy>;

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const sections = DAYS.map((id) => ({ id, label: t.railLabel[id] }));

  return (
    <DocsShell lang={lang} slug="changelog" title={t.title} intro={t.intro} sections={sections}>
      <P>{t.lead}</P>

      <DocSection id="d20260810" title={t.heading.d20260810}>
        <Bullets items={t.entries.d20260810} />
      </DocSection>

      <DocSection id="d20260809" title={t.heading.d20260809}>
        <Bullets items={t.entries.d20260809} />
      </DocSection>

      <DocSection id="d20260808" title={t.heading.d20260808}>
        <Bullets items={t.entries.d20260808} />
      </DocSection>

      <DocSection id="d20260730" title={t.heading.d20260730}>
        <Bullets items={t.entries.d20260730} />
      </DocSection>
    </DocsShell>
  );
}
