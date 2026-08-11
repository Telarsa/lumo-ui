import type { Locale } from "@lumo-ui/core";
import {
  ChartAreaIsland,
  ChartIsland,
  ChartLineIsland,
} from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the chart page. Contract: `_system/types.ts` — each render
 * is a named top-level function so the loader can slice its source.
 *
 * Every example goes through an island, because `defineChart` holds scale
 * FACTORIES and a tooltip `format` closure and a function cannot cross into the
 * RSC payload. `demo-islands.tsx` states that boundary once.
 *
 * ── EVERY EXAMPLE CARRIES ITS OWN DATA, ON PURPOSE ──────────────────────────
 *
 * The three charts below plot three different datasets rather than one shared
 * constant, and that is not variety for its own sake: each one becomes its own
 * `<ChartData>` table of real Persian numerals in the bytes the gate grades and
 * a no-JS reader receives. One shared dataset would mean the same rows
 * repeated, and a page that looks richer than it reads.
 *
 * ── THE DONUT EXAMPLE IS GONE ───────────────────────────────────────────────
 *
 * `@tanstack/charts` 0.9.0 has no pie mark — a pie is a composition of `polar`
 * and `radialArc`, so `ChartPie`/`ChartPieCenter`/`ChartValueLabelList` were
 * removed from `chart.tsx` rather than stubbed, and the example goes with them.
 * An example that draws an empty box is a worse artifact than an absent one.
 */

const t = {
  // ── bar ──────────────────────────────────────────────────────────────────
  barLabel: { "fa-IR": "نمودار فروش ماهانه", "en-US": "Monthly sales chart" },
  barCaption: { "fa-IR": "داده‌های فروش ماهانه", "en-US": "Monthly sales data" },
  sales: { "fa-IR": "فروش", "en-US": "Sales" },
  month: { "fa-IR": "ماه", "en-US": "Month" },
  farvardin: { "fa-IR": "فروردین", "en-US": "Farvardin" },
  ordibehesht: { "fa-IR": "اردیبهشت", "en-US": "Ordibehesht" },
  khordad: { "fa-IR": "خرداد", "en-US": "Khordad" },
  tir: { "fa-IR": "تیر", "en-US": "Tir" },
  mordad: { "fa-IR": "مرداد", "en-US": "Mordad" },

  // ── line ─────────────────────────────────────────────────────────────────
  lineLabel: { "fa-IR": "نمودار خطی بازدید روزانه", "en-US": "Daily visits line chart" },
  lineCaption: { "fa-IR": "داده‌های بازدید روزانه", "en-US": "Daily visits data" },
  visits: { "fa-IR": "بازدید", "en-US": "Visits" },
  day: { "fa-IR": "روز", "en-US": "Day" },
  saturday: { "fa-IR": "شنبه", "en-US": "Saturday" },
  sunday: { "fa-IR": "یک‌شنبه", "en-US": "Sunday" },
  monday: { "fa-IR": "دوشنبه", "en-US": "Monday" },
  tuesday: { "fa-IR": "سه‌شنبه", "en-US": "Tuesday" },
  wednesday: { "fa-IR": "چهارشنبه", "en-US": "Wednesday" },

  // ── area ─────────────────────────────────────────────────────────────────
  areaLabel: { "fa-IR": "نمودار سطحی کاربران فعال", "en-US": "Active users area chart" },
  areaCaption: { "fa-IR": "داده‌های کاربران فعال", "en-US": "Active users data" },
  activeUsers: { "fa-IR": "کاربران فعال", "en-US": "Active users" },
  week: { "fa-IR": "هفته", "en-US": "Week" },
  weekOne: { "fa-IR": "هفتهٔ یکم", "en-US": "Week one" },
  weekTwo: { "fa-IR": "هفتهٔ دوم", "en-US": "Week two" },
  weekThree: { "fa-IR": "هفتهٔ سوم", "en-US": "Week three" },
  weekFour: { "fa-IR": "هفتهٔ چهارم", "en-US": "Week four" },
} satisfies Record<string, LocalizedText>;

function BarExample(l: Locale) {
  return (
    <ChartIsland
      locale={l}
      label={t.barLabel[l]}
      seriesLabel={t.sales[l]}
      categoryLabel={t.month[l]}
      dataCaption={t.barCaption[l]}
      data={[
        { month: t.farvardin[l], sales: 1200 },
        { month: t.ordibehesht[l], sales: 2400 },
        { month: t.khordad[l], sales: 1800 },
        { month: t.tir[l], sales: 3100 },
        { month: t.mordad[l], sales: 2650 },
      ]}
    />
  );
}

function LineExample(l: Locale) {
  return (
    <ChartLineIsland
      locale={l}
      label={t.lineLabel[l]}
      seriesLabel={t.visits[l]}
      categoryLabel={t.day[l]}
      dataCaption={t.lineCaption[l]}
      data={[
        { category: t.saturday[l], value: 420 },
        { category: t.sunday[l], value: 610 },
        { category: t.monday[l], value: 580 },
        { category: t.tuesday[l], value: 940 },
        { category: t.wednesday[l], value: 1130 },
      ]}
    />
  );
}

function AreaExample(l: Locale) {
  return (
    <ChartAreaIsland
      locale={l}
      label={t.areaLabel[l]}
      seriesLabel={t.activeUsers[l]}
      categoryLabel={t.week[l]}
      dataCaption={t.areaCaption[l]}
      data={[
        { category: t.weekOne[l], value: 3400 },
        { category: t.weekTwo[l], value: 5200 },
        { category: t.weekThree[l], value: 4750 },
        { category: t.weekFour[l], value: 7300 },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `const definition = defineChart({`,
      `  marks: [barY(data, { id: "sales", x: "month", y: "sales", fill: chartColor("sales") })],`,
      `  x: chartCategoryAxis(locale, { scale: () => scaleBand().padding(0.2) }),`,
      `  y: chartValueAxis(locale, { scale: scaleLinear, grid: true }),`,
      `  tooltip: chartTooltip(locale, config),`,
      `})`,
      ``,
      `<ChartContainer config locale label definition data categoryKey dataCaption>`,
      `  <ChartData />            ← rendered for you. the served figures.`,
      `  <ChartLegend />          ← chrome around the plot, driven by config`,
      `</ChartContainer>`,
    ].join("\n"),
    parts: [
      {
        name: "ChartContainer",
        description: {
          "fa-IR":
            "قاب نمودار. زبان و نامِ خوانده‌شده و داده‌ها را الزامی می‌گیرد و خودش جدول داده را در بایت‌های ارسالی می‌سازد.",
          "en-US":
            "The chart frame. Takes locale, announced name and the rows as required props, and renders the data table into the served bytes itself.",
        },
      },
      {
        name: "defineChart",
        description: {
          "fa-IR":
            "خودِ نمودار، به شکل یک شیء و نه یک درخت کامپوننت. نشانه‌ها، محورها و راهنمای شناور همگی داده‌اند.",
          "en-US":
            "The plot itself, as an object rather than a component tree: marks, axes and tooltip are all data.",
        },
      },
      {
        name: "ChartData",
        description: {
          "fa-IR":
            "همان ردیف‌ها به شکل یک جدول واقعی. متنی که صفحه‌خوان می‌خواند و خوانندهٔ بدون جاوااسکریپت دریافت می‌کند.",
          "en-US":
            "The same rows as a real table — what a screen reader reads and a no-JS reader receives.",
        },
      },
      {
        name: "chartCategoryAxis",
        description: {
          "fa-IR":
            "محور دسته‌ها؛ یک تابع، نه یک کامپوننت. در فارسی مقیاس را آینه می‌کند تا نخستین دسته کنار شروع خواندن بنشیند.",
          "en-US":
            "The category axis — a function now, not a component. Mirrors the scale in Persian so the first category sits at the reading start.",
        },
      },
      {
        name: "chartValueAxis",
        description: {
          "fa-IR": "محور مقدارها. هر برچسب را از formatNumber می‌گذراند، وگرنه رقم لاتین روی صفحهٔ فارسی می‌نشیند.",
          "en-US": "The value axis. Runs every tick through formatNumber; a bare axis draws Latin digits.",
        },
      },
      {
        name: "chartTooltip",
        description: {
          "fa-IR":
            "راهنمای شناور با قالب‌بندِ فارسی. عدد راهنما فرزند JSX نیست، پس تنها همین‌جا می‌توان جلوی رقم لاتین را گرفت.",
          "en-US":
            "The tooltip with a Persian formatter. Its number is not a JSX child, so this is the only place a Latin digit can be caught.",
        },
      },
      {
        name: "ChartLegend",
        description: {
          "fa-IR": "راهنمای رنگ‌ها، از روی ChartConfig. نامِ سری از پیکربندی می‌آید، نه از کلیدِ انگلیسی داده.",
          "en-US": "The colour key, driven by ChartConfig — a series is named from config, never from its English data key.",
        },
      },
    ],
  },
  examples: [
    {
      id: "bar",
      title: { "fa-IR": "ستونی", "en-US": "Bar" },
      description: {
        "fa-IR":
          "محورها از زبان صفحه جهت می‌گیرند: نخستین ماه سمت راست می‌نشیند و محور مقدار به لبهٔ پایانی می‌رود.",
        "en-US":
          "The axes take their direction from the page's language: the first month sits at the start edge and the value axis moves to the trailing one.",
      },
      render: BarExample,
    },
    {
      id: "line",
      title: { "fa-IR": "خطی", "en-US": "Line" },
      description: {
        "fa-IR":
          "خط چیزی جز محورها لازم ندارد؛ وارونه‌کردن مقیاس، خودِ منحنی و شبکه را هم با خود می‌برد.",
        "en-US":
          "A line needs nothing beyond the axes: reversing the scale carries the curve and the grid with it.",
      },
      render: LineExample,
    },
    {
      id: "area",
      title: { "fa-IR": "سطحی", "en-US": "Area" },
      description: {
        "fa-IR":
          "همان خط با یک ناحیهٔ پرشده. جدول داده هم مثل بقیه ساخته می‌شود، ولی این‌بار خودِ نمودار هم روی سرور کشیده می‌شود.",
        "en-US":
          "The same line with a filled region. The data table is built as for the others — but now the plot itself is server-rendered too.",
      },
      render: AreaExample,
    },
  ],
};
