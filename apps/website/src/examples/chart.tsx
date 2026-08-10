import type { Locale } from "@lumo-ui/core";
import {
  ChartAreaIsland,
  ChartDonutIsland,
  ChartIsland,
  ChartLineIsland,
} from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the chart page. Contract: `_system/types.ts` — each render
 * is a named top-level function so the loader can slice its source.
 *
 * Every example goes through an island, because recharts' chart elements call
 * hooks and cannot run during the RSC pass. That is a boundary about the
 * LIBRARY, not about a prop, and `demo-islands.tsx` states it once.
 *
 * ── EVERY EXAMPLE CARRIES ITS OWN DATA, ON PURPOSE ──────────────────────────
 *
 * The four charts below plot four different datasets rather than one shared
 * constant, and that is not variety for its own sake. recharts renders NOTHING
 * on the server, so the only figures this page serves are the ones
 * `ChartContainer` puts in `<ChartData>`'s table — one table per chart. Four
 * datasets mean four tables of real Persian numerals in the bytes the gate
 * grades and a no-JS reader receives; one shared dataset would mean the same
 * four rows repeated, and a page that looks richer than it reads.
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

  // ── donut ────────────────────────────────────────────────────────────────
  donutLabel: { "fa-IR": "سهم دستگاه‌ها از سفارش‌ها", "en-US": "Orders by device" },
  donutCaption: { "fa-IR": "داده‌های سهم دستگاه‌ها", "en-US": "Orders by device data" },
  share: { "fa-IR": "سهم", "en-US": "Share" },
  device: { "fa-IR": "دستگاه", "en-US": "Device" },
  totalOrders: { "fa-IR": "کل سفارش‌ها", "en-US": "Total orders" },
  mobile: { "fa-IR": "موبایل", "en-US": "Mobile" },
  desktop: { "fa-IR": "رایانه", "en-US": "Desktop" },
  tablet: { "fa-IR": "تبلت", "en-US": "Tablet" },
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

function DonutExample(l: Locale) {
  return (
    <ChartDonutIsland
      locale={l}
      label={t.donutLabel[l]}
      seriesLabel={t.share[l]}
      categoryLabel={t.device[l]}
      dataCaption={t.donutCaption[l]}
      centerCaption={t.totalOrders[l]}
      data={[
        { category: t.mobile[l], value: 5840 },
        { category: t.desktop[l], value: 2960 },
        { category: t.tablet[l], value: 720 },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `<ChartContainer config locale label data categoryKey dataCaption>`,
      `  <ChartData />            ← rendered for you. the served figures.`,
      `  <ChartCategoryAxis />    ← mirrors the scale under RTL`,
      `  <ChartValueAxis />       ← formats every tick`,
      `  <ChartTooltip content={<ChartTooltipContent />} />`,
      `  <ChartLegend content={<ChartLegendContent />} />`,
      `  <ChartPie>               ← pie and donut. sweep is fixed.`,
      `    <ChartValueLabelList />`,
      `    <ChartPieCenter />`,
      `  </ChartPie>`,
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
        name: "ChartData",
        description: {
          "fa-IR":
            "همان ردیف‌ها به شکل یک جدول واقعی. تنها چیزی که خوانندهٔ بدون جاوااسکریپت و صفحه‌خوان دریافت می‌کنند.",
          "en-US":
            "The same rows as a real table. The only figures a no-JS reader or a screen reader ever receives.",
        },
      },
      {
        name: "ChartCategoryAxis",
        description: {
          "fa-IR": "محور دسته‌ها. در فارسی مقیاس را آینه می‌کند تا نخستین دسته کنار شروع خواندن بنشیند.",
          "en-US": "The category axis. Mirrors the scale in Persian so the first category sits at the reading start.",
        },
      },
      {
        name: "ChartValueAxis",
        description: {
          "fa-IR": "محور مقدارها. هر برچسب را از formatNumber می‌گذراند، وگرنه ریچارتس رقم لاتین می‌کشد.",
          "en-US": "The value axis. Runs every tick through formatNumber; recharts draws Latin digits otherwise.",
        },
      },
      {
        name: "ChartTooltipContent",
        description: {
          "fa-IR": "محتوای راهنمای شناور؛ عددها با ارقام محلی و بدون ارقام جدولی لاتین.",
          "en-US": "The tooltip body; figures in the reader's own numerals and no Latin tabular figures.",
        },
      },
      {
        name: "ChartLegendContent",
        description: {
          "fa-IR": "جایگزین راهنمای خودِ ریچارتس، که سه ویژگی فیزیکی و یک نام انگلیسی می‌فرستد.",
          "en-US": "The replacement for recharts' own legend, which ships three physical properties and an English name.",
        },
      },
      {
        name: "ChartPie",
        description: {
          "fa-IR":
            "دایره و دونات. جهت چرخش ثابت است: ساعتگرد از بالا، در هر دو جهت خواندن — دلیلش در متن همین صفحه آمده.",
          "en-US":
            "Pie and donut. The sweep is fixed — clockwise from the top in both reading directions; the reason is on this page.",
        },
      },
      {
        name: "ChartValueLabelList",
        description: {
          "fa-IR": "برچسب روی خود نمودار، از همان قالب‌بندِ محورها؛ برچسب و درجه هرگز اختلاف پیدا نمی‌کنند.",
          "en-US": "A label drawn on the plot, through the same formatter as the axes, so a label and a tick cannot disagree.",
        },
      },
      {
        name: "ChartPieCenter",
        description: {
          "fa-IR": "عدد میان دونات. مقدارش رشته است، نه عدد: متن SVG یکی از معدود جاهایی است که عدد خام به DOM می‌رسد.",
          "en-US": "The figure in a donut's hole. Its value is a string, not a number — an SVG text node is one of the few places a raw number reaches the DOM.",
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
          "همان خط با یک ناحیهٔ پرشده. جدول داده هم مثل بقیه ساخته می‌شود، چون ریچارتس روی سرور چیزی نمی‌کشد.",
        "en-US":
          "The same line with a filled region. The data table is built exactly as for the others, because recharts draws nothing on the server.",
      },
      render: AreaExample,
    },
    {
      id: "donut",
      title: { "fa-IR": "دایره‌ای و دونات", "en-US": "Pie and donut" },
      description: {
        "fa-IR":
          "جهت چرخش آینه نمی‌شود: از بالا و ساعتگرد، در فارسی و انگلیسی یکسان. دو دایرهٔ آینه‌ایِ یک داده، دو داده به نظر می‌رسند؛ حال آنکه دو نمودار ستونیِ آینه‌ای همان یک داده‌اند.",
        "en-US":
          "The sweep does not mirror: clockwise from the top, identical in Persian and English. Two mirror-imaged pies of one dataset read as two datasets, where two mirror-imaged bar charts read as one.",
      },
      render: DonutExample,
    },
  ],
};
