import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { Bullets, DocSection, DocsShell, P, Term } from "../docs-shell";

/**
 * /docs/changelog — dated history, derived from `git log`. The first tagged
 * version is v0.1.0 (16 Aug 2026); per-version changes and migration notes live
 * in CHANGELOG.md at the repository root.
 *
 * Every entry below corresponds to commits that exist on this branch. These
 * are selected dated milestones, not an exhaustive transcription of every
 * commit. A changelog that dressed them up as "v0.1.0 … v0.5.0" releases would
 * be inventing a history the repository does not have.
 */

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/** Days, newest first. Both the rail and the `<h2>`s derive from this list. */
const DAYS = ["d20260815", "d20260810", "d20260809", "d20260808", "d20260730"] as const;
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
    intro: "نقطه‌های عطف به تاریخ؛ از نخستین نسخهٔ برچسب‌خورده به بعد، تغییرات هر نسخه با یادداشت‌های مهاجرت در فایل تغییرات مخزن ثبت می‌شود.",
    railLabel: {
      d20260815: "۲۴ مرداد ۱۴۰۵",
      d20260810: "۱۹ مرداد ۱۴۰۵",
      d20260809: "۱۸ مرداد ۱۴۰۵",
      d20260808: "۱۷ مرداد ۱۴۰۵",
      d20260730: "۸ مرداد ۱۴۰۵",
    },
    heading: {
      d20260815: "۲۴ مرداد ۱۴۰۵ — ۱۵ اوت ۲۰۲۶",
      d20260810: "۱۹ مرداد ۱۴۰۵ — ۱۰ اوت ۲۰۲۶",
      d20260809: "۱۸ مرداد ۱۴۰۵ — ۹ اوت ۲۰۲۶",
      d20260808: "۱۷ مرداد ۱۴۰۵ — ۸ اوت ۲۰۲۶",
      d20260730: "۸ مرداد ۱۴۰۵ — ۳۰ ژوئیهٔ ۲۰۲۶",
    },
    lead: (
      <>
        این مخزن جوان است و این صفحه وانمود نمی‌کند که نیست. نخستین کامیت — ۸ مرداد ۱۴۰۵،
        برابر ۳۰ ژوئیهٔ ۲۰۲۶ — فقط برنامه و شواهدِ تصمیم‌ها بود. آنچه در ادامه می‌آید
        گزیده‌ای از نقطه‌های عطفِ ثبت‌شده در <Term>git log</Term> است — نه فهرست همهٔ
        کامیت‌ها و نه نسخه‌های ساختگی. از ۲۵ مرداد ۱۴۰۵ نسخه‌ها برچسب می‌خورند (<Term>v0.1.0</Term>{" "}
        نخستین آن‌هاست) و شکست‌های سازگاری و راه مهاجرت هر نسخه در <Term>CHANGELOG.md</Term> مخزن
        ثبت می‌شود.
      </>
    ),
    entries: {
      d20260815: [
        {
          key: "engines",
          body: "مهاجرت Base UI و TanStack کامل شد، سطح سازگاری React Aria حذف شد، و مجموعه به ۱۱۱ کامپوننت و ۳۰ بلوک رسید؛ از تقویم رویداد و گانت تا شبکهٔ داده، بارگذاری، جست‌وجوی قدرتمند و چهار خانوادهٔ نمودار.",
        },
        {
          key: "verification",
          body: "دروازهٔ بایت خروجی، سنجش پنجره‌های باز، مرجع API و کارزار جهش سراسری سخت‌تر شدند؛ بازبینی‌های مستقل چند ادعای قبلی را رد کردند و نقص‌های اثبات‌شده را با آزمون قرمز/سبز بستند.",
        },
        {
          key: "docs",
          body: "اسناد در یک ساختار واحد ادغام شدند، تز و نقشهٔ راه با وضعیت واقعی بازنویسی شدند، و محدودیت‌های باقی‌مانده — نبود شواهد AT چندسکویی و توزیع خصوصی — صریح ماندند.",
        },
      ],
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
    intro: "Milestones by date; from the first tagged version on, each version's changes and migration notes are recorded in the repository's changelog file.",
    railLabel: {
      d20260815: "15 August 2026",
      d20260810: "10 August 2026",
      d20260809: "9 August 2026",
      d20260808: "8 August 2026",
      d20260730: "30 July 2026",
    },
    heading: {
      d20260815: "15 August 2026",
      d20260810: "10 August 2026",
      d20260809: "9 August 2026",
      d20260808: "8 August 2026",
      d20260730: "30 July 2026",
    },
    lead: (
      <>
        This repository is young and this page does not pretend otherwise. The first commit —
        30 July 2026 — contained only the plan and the evidence behind the decisions. What
        follows is a selection of milestones recorded in <Term>git log</Term>, not every
        commit and not invented releases. Since 16 August 2026 versions are tagged (<Term>v0.1.0</Term>{" "}
        is the first) and each version's breaking changes and migration path are recorded in{" "}
        <Term>CHANGELOG.md</Term> in the repository.
      </>
    ),
    entries: {
      d20260815: [
        {
          key: "engines",
          body: "The Base UI and TanStack migration completed, the React Aria compatibility surface was removed, and the catalogue reached 111 components plus 30 blocks—from EventCalendar and Gantt to DataGrid, upload, PowerSearch, and four chart families.",
        },
        {
          key: "verification",
          body: "The served-byte gate, open-popup sweep, API reference, and repository-wide mutation campaign were hardened; independent reviews rejected several earlier claims and closed proved defects with red/green assertions.",
        },
        {
          key: "docs",
          body: "Documentation was consolidated, the thesis and roadmap were reconciled with the shipped code, and the remaining limits—no cross-platform AT evidence and private distribution—stayed explicit.",
        },
      ],
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

      <DocSection id="d20260815" title={t.heading.d20260815} dualCalendar>
        <Bullets items={t.entries.d20260815} />
      </DocSection>

      <DocSection id="d20260810" title={t.heading.d20260810} dualCalendar>
        <Bullets items={t.entries.d20260810} />
      </DocSection>

      <DocSection id="d20260809" title={t.heading.d20260809} dualCalendar>
        <Bullets items={t.entries.d20260809} />
      </DocSection>

      <DocSection id="d20260808" title={t.heading.d20260808} dualCalendar>
        <Bullets items={t.entries.d20260808} />
      </DocSection>

      <DocSection id="d20260730" title={t.heading.d20260730} dualCalendar>
        <Bullets items={t.entries.d20260730} />
      </DocSection>
    </DocsShell>
  );
}
