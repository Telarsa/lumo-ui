import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { formatNumber } from "lumo-ui/core";
import { GateFigure } from "@/components/site/gate-figure";
import { Code } from "@/components/site/docs";
import { CHROME } from "@/lib/chrome";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { GITHUB_URL, INSTALL_SPEC, TELARSA_URL, alternatesFor, localePath } from "@/lib/site";

export const generateStaticParams = localeParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = (await params) as { locale: SiteLocale };
  return { alternates: alternatesFor(locale, "/") };
}

const T = {
  "fa": {
    eyebrow: "متن‌باز · MIT · ساختهٔ تلارسا",
    title: "راست‌به‌چپ نیمهٔ آسان است.",
    accent: "Lumo نیمهٔ دیگر را نمره می‌دهد.",
    lead:
      "قرارداد زبانی تایپ‌شده، سیاست lint، و دروازه‌ای که همان بایت‌هایی را می‌خواند که خوانندهٔ فارسی واقعاً دریافت می‌کند: ارقام، تقویم، جهت، و نامی که صفحه‌خوان اعلام می‌کند — پیش از آن‌که هیچ جاوااسکریپتی اجرا شود.",
    start: "شروع کنید",
    source: "کد در گیت‌هاب",
    strip: ["قرارداد locale", "پانزده قانون روی HTML سرو‌شده", "تقویم جلالی برای Calendar خودِ shadcn", "همان لایه در Flutter"],
    proofIndex: "۰۱",
    proofLabel: "سنجیده‌شده",
    proofTitle: "روی بایت‌های سرو‌شده، نه در مرورگر.",
    proofLead:
      "هر عدد این‌جا شمار تخلف‌های دروازه روی خروجی build یک محصول واقعی است، پیش و پس از سیم‌کشی Lumo. نه اسکرین‌شات، نه تست jsdom: همان HTMLی که خزنده و اولین paint می‌گیرند.",
    stats: [
      { before: 306, after: 6, label: "اپ تک‌زبانهٔ فارسی، روی Base UI" },
      { before: 434, after: 4, label: "اپ رزرو سه‌زبانه، با تقویم جلالی" },
      { before: 17797, after: 1, label: "کاتالوگ ۵۹۲ صفحه‌ای؛ آن یکی، نام یک الگوریتم در یک attribute است" },
    ],
    rulesIndex: "۰۲",
    rulesLabel: "آنچه دروازه می‌خواند",
    rulesTitle: "پانزده قانون، هر کدام از یک نقص واقعی.",
    rulesLead: "هیچ‌کدام را axe نمره نمی‌دهد. هر قانون از نقصی آمده که منتشر شد و هیچ ابزاری ندید.",
    groups: [
      {
        title: "خط و ارقام",
        rules: [
          ["no-latin-digits", "رقم لاتین در متن دیدنی یا رشتهٔ اعلانی — ۷۷ سلول از ۷۷ سلول یک تقویم."],
          ["persian-digit-floor", "کفِ ارقام بومی؛ «صفر رقم لاتین» روی صفحهٔ بی‌عدد مجانی است."],
          ["native-script-text", "متن دیدنی بدون یک نویسهٔ خط خواننده — کلید خام «thr» در یک Select."],
          ["native-script-name", "نامِ محاسبه‌شدهٔ کنترل به خطی که خواننده نمی‌خواند."],
          ["no-latin-aria", "رشتهٔ اعلانیِ تماماً لاتین؛ propی که کسی ترجمه‌اش را نداد."],
          ["persian-zwnj", "⟦«می کند»⟧ و «می‌کند» برای هر جست‌وجو دو رشتهٔ متفاوت‌اند."],
        ],
      },
      {
        title: "جهت و تقویم",
        rules: [
          ["lang-dir", "lang و dir سند با locale مسیر نمی‌خواند — صفحه‌خوان موتور گفتارش را از همین می‌گیرد."],
          ["native-calendar", "تاریخی به زبان خواننده ولی در تقویم غلط: ⟦«۲۲ ژوئیه ۲۰۲۴»⟧ برای «۱ مرداد ۱۴۰۳»."],
        ],
      },
      {
        title: "سیم‌کشی‌ای که فقط سیم‌کشی‌شده به نظر می‌رسد",
        rules: [
          ["named-controls", "کنترل تعاملی بی‌نام — ۳۳ تا در یک نمونهٔ اولیه."],
          ["resolved-idrefs", "labelledby یا describedby آویزان: نام یا راهنمایی که هیچ‌کس اعلام نمی‌کند."],
          ["unique-ids", "id تکراری که هر ارجاع را به اولین می‌رساند."],
          ["named-roledescription", "aria-roledescription بی‌نام؛ ده اسلاید که همه «اسلاید» نامیده شدند."],
          ["composite-tab-stop", "ویجت roving-tabindex بدون هیچ tab-stop در بایت‌های سرو‌شده."],
          ["composite-single-tab-stop", "همان ویجت با بیش از یک — ۲، ۳، ۳، ۴ و ۵ در پنج نوار ابزار."],
        ],
      },
      {
        title: "دریچه، خودش نمره می‌گیرد",
        rules: [
          ["latn-island-purity", "جزیرهٔ data-lumo-latn که بیشترش فارسی است. قانونی که ۲۵٪ صفحه را می‌خواند باید ثابت کند ۷۵٪ بقیه همان است که ادعا می‌کند."],
        ],
      },
    ],
    installIndex: "۰۳",
    installLabel: "نصب",
    installTitle: "یک بسته، یک ترتیب، یک نمره.",
    steps: [
      ["نصب", "بسته سورس TypeScript حمل می‌کند و Next خودش ترنسپایل می‌کند. فقط pnpm — workspace از catalog استفاده می‌کند."],
      ["استایل، به ترتیبِ ثابت", "متغیرهای shadcn را در یک بلاک به توکن‌های sys ببندید. همین سایت همین کار را می‌کند."],
      ["نمره بدهید", "خروجی build را به دروازه بدهید. پروندهٔ کف‌ها کنار اپ می‌ماند و عددهایش را یک نفر بازبینی کرده."],
    ],
    piecesIndex: "۰۴",
    piecesLabel: "قطعه‌ها",
    piecesTitle: "هفت قطعه، نه یک کتابخانهٔ کامپوننت.",
    piecesLead: "هرچه این‌جاست چیزی است که کتابخانهٔ کامپوننت نمی‌تواند از بیرون درستش کند. کامپوننت‌ها مال شماست: shadcn در وب، Material در Flutter.",
    pieces: [
      ["core", "قرارداد زبان: جهت از locale، formatNumber، رشته‌های الزامی اعلان، LumoHtml، جزیره‌های لاتین."],
      ["theme", "سه لایهٔ توکن، پل Tailwind، و قواعد تایپوگرافی فارسی."],
      ["dates", "چهار propی که Calendar خودِ shadcn می‌پذیرد و شبکه را جلالی می‌کند."],
      ["gate", "نمره‌ده و CLIاش؛ پانزده قانون روی HTML ساخته‌شده، بدون مرورگر."],
      ["config", "سیاست lint راست‌به‌چپ، بدون هیچ وابستگی."],
      ["base-ui-ssr", "جبران‌های اولین بایت برای Base UI."],
      ["mobile", "همان قرارداد روی لایهٔ ویجت Material، با نمره‌دهِ Semantics خودش."],
    ],
    closeTitle: "همین صفحه، مدرکِ خودش است.",
    closeLead:
      "کامپوننت‌های این سایت کپی‌های shadcn‌اند و این مخزن آن‌ها را مدیریت نمی‌کند. درستی‌اش از core و theme و dates می‌آید، و خروجی استاتیکش در هر build با همین دروازه نمره می‌گیرد.",
    closeDocs: "سند",
    closeViolations: "تخلف",
    closeRules: "قانون",
    docs: "مستندات را بخوانید",
    telarsa: "ساختهٔ تلارسا",
  },
  "en": {
    eyebrow: "Open source · MIT · by Telarsa",
    title: "Right-to-left is the easy half.",
    accent: "Lumo grades the other half.",
    lead:
      "A typed locale contract, a lint policy, and a gate that reads the bytes a Persian reader actually receives: the digits, the calendar, the direction, and the name a screen reader announces — before any JavaScript runs.",
    start: "Get started",
    source: "Source on GitHub",
    strip: ["A locale contract", "Fifteen rules over served HTML", "Jalali dates on shadcn's own Calendar", "The same layer in Flutter"],
    proofIndex: "01",
    proofLabel: "Measured",
    proofTitle: "On served bytes, not in a browser.",
    proofLead:
      "Every number here is the gate's violation count over a real product's build output, before and after the Lumo wiring. No screenshot, no jsdom test: the HTML a crawler and the first paint receive.",
    stats: [
      { before: 306, after: 6, label: "A Persian-only app, on Base UI" },
      { before: 434, after: 4, label: "A trilingual booking app, with Jalali dates" },
      { before: 17797, after: 1, label: "A 592-page catalogue; the one left is an algorithm's name inside an attribute" },
    ],
    rulesIndex: "02",
    rulesLabel: "What the gate reads",
    rulesTitle: "Fifteen rules, each earned by a defect that shipped.",
    rulesLead: "axe grades none of them. Every rule came from something a product served that no other tool saw.",
    groups: [
      {
        title: "Script and digits",
        rules: [
          ["no-latin-digits", "A Latin digit in visible text or an announced string — 77 of 77 calendar cells, once."],
          ["persian-digit-floor", "The native-digit floor: “zero Latin digits” is free on a page with no numbers."],
          ["native-script-text", "Visible text without one character of the reader's script — the raw key “thr” in a Select."],
          ["native-script-name", "A computed accessible name in a script the reader does not read."],
          ["no-latin-aria", "An announced string that is purely Latin; the prop nobody passed a translation for."],
          ["persian-zwnj", "A Persian compound written with a space where the joiner belongs: two strings to every search box."],
        ],
      },
      {
        title: "Direction and calendar",
        rules: [
          ["lang-dir", "The document's lang and dir disagree with the route's locale — a screen reader picks its voice from this."],
          ["native-calendar", "A date in the reader's language but the wrong calendar: ⟦«۲۲ ژوئیه ۲۰۲۴»⟧ for the day Iran calls «۱ مرداد ۱۴۰۳»."],
        ],
      },
      {
        title: "Wiring that only looks wired",
        rules: [
          ["named-controls", "An interactive control with no name — 33 of them in one prototype."],
          ["resolved-idrefs", "A dangling labelledby or describedby: a name or a hint announced by nobody."],
          ["unique-ids", "A duplicated id, resolving every reference to whichever came first."],
          ["named-roledescription", "An aria-roledescription with no name; ten slides all called “slide”."],
          ["composite-tab-stop", "A roving-tabindex widget with no tab stop at all in the served bytes."],
          ["composite-single-tab-stop", "The same widget with more than one — 2, 3, 3, 4 and 5 across five toolbars."],
        ],
      },
      {
        title: "The hatch, graded",
        rules: [
          ["latn-island-purity", "A data-lumo-latn island that is mostly the reader's language. A rule that reads 25% of a page must prove the other 75% is what it claims to be."],
        ],
      },
    ],
    installIndex: "03",
    installLabel: "Install",
    installTitle: "One package, one order, one grade.",
    steps: [
      ["Install", "The package ships TypeScript source and Next transpiles it. pnpm only: the workspace uses catalog:."],
      ["Styles, in the fixed order", "Bind shadcn's variables to the sys tokens in one block. This very site does exactly that."],
      ["Grade", "Hand the build output to the gate. The floors file lives beside the app and its numbers were reviewed by a person."],
    ],
    piecesIndex: "04",
    piecesLabel: "The pieces",
    piecesTitle: "Seven pieces, not a component library.",
    piecesLead: "Everything here is something a component library cannot fix from the outside. The components are yours: shadcn on the web, Material in Flutter.",
    pieces: [
      ["core", "The locale contract: direction from the locale, formatNumber, required announced strings, LumoHtml, the Latin-island helpers."],
      ["theme", "Three token tiers, the Tailwind bridge, and the Persian type rules."],
      ["dates", "The four props shadcn's own Calendar accepts, counting in the reader's calendar."],
      ["gate", "The grader and its CLI: fifteen rules over built HTML, no browser."],
      ["config", "The right-to-left lint policy, with no plugin dependencies."],
      ["base-ui-ssr", "First-byte compensations for Base UI."],
      ["mobile", "The same contract on Material's widget layer, with its own semantics grader."],
    ],
    closeTitle: "This page is its own evidence.",
    closeLead:
      "This site's components are shadcn copies, and this repository does not manage them. Its correctness comes from core, theme and dates, and its static export is graded by this same gate on every build.",
    closeDocs: "documents",
    closeViolations: "violations",
    closeRules: "rules",
    docs: "Read the docs",
    telarsa: "Built by Telarsa",
  },
} as const;

const INSTALL = `pnpm add -D ${INSTALL_SPEC}
# next.config.ts
transpilePackages: ["lumo-ui"]`;

const CSS = `@import "tailwindcss";
@import "shadcn/tailwind.css";
@import "lumo-ui/theme/tokens.css";
@import "lumo-ui/theme/theme.css";
@import "lumo-ui/theme/script.css";`;

const GRADE = `node node_modules/lumo-ui/scripts/grade-app.mjs \\
  .next/server/app fa gate.floors.json`;

/**
 * A defect quoted in prose is SAMPLE OUTPUT, not the page's own text: «۲۲ ژوئیه»
 * on the Persian page would otherwise be the exact thing native-calendar
 * exists to catch. `⟦…⟧` in the copy renders as <samp>, which the gate already
 * treats as quoted program output.
 */
function Quoted({ text }: { text: string }) {
  const parts = text.split(/⟦(.+?)⟧/);
  return <>{parts.map((part, i) => (i % 2 === 1 ? <samp key={i}>{part}</samp> : part))}</>;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  const c = CHROME[locale];
  const n = (v: number) => formatNumber(v, locale);
  const snippets = [INSTALL, CSS, GRADE];

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero__grid">
            <div>
              <p className="eyebrow">
                {locale === "fa" ? (
                  <span>
                    متن‌باز · <span data-lumo-latn>MIT</span> · ساختهٔ تلارسا
                  </span>
                ) : (
                  t.eyebrow
                )}
              </p>
              <h1 className="display">
                {t.title}
                <span className="display__accent">{t.accent}</span>
              </h1>
              <p className="lead hero__lead">{t.lead}</p>
              <div className="hero__actions">
                <Link href={localePath(locale, "/docs/getting-started")} className="button button--lg">
                  {t.start}
                  <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
                </Link>
                <a href={GITHUB_URL} className="button button--outline button--lg" target="_blank" rel="noreferrer noopener">
                  {t.source}
                  <ArrowUpRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
                </a>
              </div>
            </div>
            <GateFigure locale={locale} />
          </div>
          <ul className="strip" role="list">
            {t.strip.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band band--invert">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">
              <span className="eyebrow__num">{t.proofIndex}</span>
              {t.proofLabel}
            </p>
            <div>
              <h2 className="h2">{t.proofTitle}</h2>
              <p className="lead section-head__lead">{t.proofLead}</p>
            </div>
          </div>
          <dl className="stats">
            {t.stats.map((s) => (
              <div key={s.label} className="stat">
                <dd className="stat__value">
                  <span className="stat__before">{n(s.before)}</span>
                  <ArrowRightIcon className="size-4 text-fg-subtle rtl:-scale-x-100" aria-hidden="true" />
                  <span className="stat__after">{n(s.after)}</span>
                </dd>
                <dt className="stat__label">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="band band--rule-bottom">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">
              <span className="eyebrow__num">{t.rulesIndex}</span>
              {t.rulesLabel}
            </p>
            <div>
              <h2 className="h2">{t.rulesTitle}</h2>
              <p className="lead section-head__lead">{t.rulesLead}</p>
            </div>
          </div>
          <div className="rules">
            {t.groups.map((g) => (
              <div key={g.title} className="rules__group">
                <h3>{g.title}</h3>
                <ul role="list">
                  {g.rules.map(([id, why]) => (
                    <li key={id}>
                      <span className="rule-id" data-lumo-latn dir="ltr">
                        {id}
                      </span>
                      <span>
                        <Quoted text={why} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band band--sunken">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">
              <span className="eyebrow__num">{t.installIndex}</span>
              {t.installLabel}
            </p>
            <h2 className="h2">{t.installTitle}</h2>
          </div>
          <div className="steps">
            {t.steps.map(([title, note], i) => (
              <div key={title} className="step">
                <span className="step__n">{new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(i + 1)}</span>
                <h3>{title}</h3>
                <Code>{snippets[i]!}</Code>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">
              <span className="eyebrow__num">{t.piecesIndex}</span>
              {t.piecesLabel}
            </p>
            <div>
              <h2 className="h2">{t.piecesTitle}</h2>
              <p className="lead section-head__lead">{t.piecesLead}</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {t.pieces.map(([name, desc]) => (
                  <tr key={name}>
                    <td data-mono="">
                      <span data-lumo-latn dir="ltr">{`lumo-ui/${name}`}</span>
                    </td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="band band--invert">
        <div className="container close">
          <div>
            <h2 className="h2">{t.closeTitle}</h2>
            <p className="lead section-head__lead">{t.closeLead}</p>
            <div className="hero__actions">
              <Link href={localePath(locale, "/docs")} className="button button--lg">
                {t.docs}
                <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
              </Link>
              <a href={TELARSA_URL} className="button button--outline button--lg" target="_blank" rel="noreferrer noopener">
                {t.telarsa}
                <ArrowUpRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </div>
          </div>
          <dl className="close__meta">
            <div>
              <dt>{c.docs.onThisSite}</dt>
              <dd>
                {n(18)} {t.closeDocs} · {n(0)} {t.closeViolations} · {n(15)} {t.closeRules}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
