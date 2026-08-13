import type { Locale } from "@lumo-ui/core";
import { GanttIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the gantt page. Contract: `_system/types.ts`.
 *
 * Every example is an ISLAND, for three separate reasons that `demo-islands.tsx`
 * spells out beside `GanttIsland`: `strings.barName` and `strings.movedTo` are
 * required FUNCTIONS, a keyboard move needs STATE, and `GanttTask.start` is a
 * `CalendarDate` — a class instance, which no RSC payload can carry, and which
 * this package could not construct anyway because it does not depend on
 * `@internationalized/date`. The dates below are ISO strings and `ganttDate`
 * turns them into calendar fields on the client side of the boundary.
 *
 * ── THE DATES ARE FIXED, AND THEY ARE DAYS RATHER THAN INSTANTS ─────────────
 *
 * Never `new Date()`: a prerendered chart computed from the clock is a
 * different chart on every build machine, and it would change under the
 * reader's cursor on hydration. `2026-03-21` is the Gregorian day Iran calls
 * ۱ فروردین ۱۴۰۵, so the fa route opens on Nowruz and the en route on the
 * twenty-first of March — the SAME seven days, read in two calendars.
 *
 * There is no `timeZone` anywhere in this file, and that is stronger than
 * fixing one rather than weaker: a value that was never an instant cannot
 * disagree between a build machine in UTC and a browser in Tehran. The
 * components that DO hold instants — `examples/description-list.tsx`,
 * `examples/timeline.tsx` — fix `Asia/Tehran` explicitly, and they have to.
 *
 * ── WHAT TO TRY ─────────────────────────────────────────────────────────────
 *
 *     Space / Enter    pick a bar up, or put it down
 *     Left / Right     move it earlier or later — MIRRORED, see below
 *     Up / Down        move between bars
 *     Escape           put the dates back
 *
 * Switch the page between fa and en and drive it with the arrow keys. Time runs
 * toward the reader's END edge, so on the fa route ArrowLeft moves a bar LATER
 * and ArrowRight moves it earlier — the exact opposite of English. The bars'
 * POSITIONS mirror on their own, because they are `inset-inline-start` rather
 * than a computed `left`; the KEY cannot, and that is the one place the
 * component asks `direction(locale)` anything.
 *
 * Then switch to the month scale. The columns are NOT equal: Jalali months are
 * 31, 30 or 29 days inside a single year, so «فروردین» is visibly wider than
 * «اسفند», and on the en route the same code draws February narrower than
 * January. A chart with equal month columns has its bars drifting away from the
 * header that is supposed to explain them, and every digit on the page is still
 * Persian while it happens.
 */

const t = {
  scaleGroup: { "fa-IR": "مقیاس زمان", "en-US": "Time scale" },
  day: { "fa-IR": "روز", "en-US": "Day" },
  week: { "fa-IR": "هفته", "en-US": "Week" },
  month: { "fa-IR": "ماه", "en-US": "Month" },
  quarter: { "fa-IR": "فصل", "en-US": "Quarter" },
  year: { "fa-IR": "سال", "en-US": "Year" },
  taskHeader: { "fa-IR": "کار", "en-US": "Task" },
  timeline: { "fa-IR": "خط زمان", "en-US": "Timeline" },
  barRole: { "fa-IR": "نوار زمان‌بندی", "en-US": "Schedule bar" },
  from: { "fa-IR": "از", "en-US": "from" },
  to: { "fa-IR": "تا", "en-US": "to" },
  separator: { "fa-IR": "، ", "en-US": ", " },
  done: { "fa-IR": "انجام‌شده", "en-US": "complete" },
  pickedUp: { "fa-IR": "برداشته شد،", "en-US": "Picked up," },
  dropped: { "fa-IR": "رها شد،", "en-US": "Dropped," },
  cancelled: { "fa-IR": "جابه‌جایی لغو شد.", "en-US": "The move was cancelled." },
  expand: { "fa-IR": "باز کردن", "en-US": "Expand" },
  collapse: { "fa-IR": "بستن", "en-US": "Collapse" },
  resizeStart: { "fa-IR": "تغییر آغاز", "en-US": "Resize the start of" },
  resizeEnd: { "fa-IR": "تغییر پایان", "en-US": "Resize the end of" },
  resized: { "fa-IR": "بازهٔ تازهٔ", "en-US": "Resized" },

  releaseLabel: { "fa-IR": "برنامهٔ انتشار نسخهٔ بهار", "en-US": "Spring release plan" },
  design: { "fa-IR": "طراحی صفحهٔ پرداخت", "en-US": "Design the checkout page" },
  build: { "fa-IR": "پیاده‌سازی درگاه", "en-US": "Build the payment gateway" },
  content: { "fa-IR": "نگارش متن راهنما", "en-US": "Write the help copy" },
  test: { "fa-IR": "آزمون پذیرش", "en-US": "Acceptance testing" },
  ship: { "fa-IR": "انتشار عمومی", "en-US": "Public release" },
  releaseGroup: { "fa-IR": "نسخهٔ بهار", "en-US": "Spring release" },

  yearLabel: { "fa-IR": "برنامهٔ یک‌سالهٔ محصول", "en-US": "The product year" },
  research: { "fa-IR": "پژوهش کاربر", "en-US": "User research" },
  platform: { "fa-IR": "بازسازی زیرساخت", "en-US": "Rebuild the platform" },
  rollout: { "fa-IR": "استقرار تدریجی", "en-US": "Staged rollout" },
  support: { "fa-IR": "پشتیبانی و نگه‌داری", "en-US": "Support and maintenance" },
} satisfies Record<string, LocalizedText>;

/**
 * A two-week plan on the day scale.
 *
 * `2026-03-21` is ۱ فروردین ۱۴۰۵ — the fa route opens on Nowruz. Fixed, never
 * `new Date()`; see the file header.
 */
function ReleaseExample(l: Locale) {
  return (
    <GanttIsland
      locale={l}
      label={t.releaseLabel[l]}
      scaleGroupLabel={t.scaleGroup[l]}
      dayWord={t.day[l]}
      weekWord={t.week[l]}
      monthWord={t.month[l]}
      quarterWord={t.quarter[l]}
      yearWord={t.year[l]}
      taskColumnHeader={t.taskHeader[l]}
      timelineLabel={t.timeline[l]}
      barRoleDescription={t.barRole[l]}
      fromWord={t.from[l]}
      toWord={t.to[l]}
      separator={t.separator[l]}
      doneWord={t.done[l]}
      pickedUp={t.pickedUp[l]}
      dropped={t.dropped[l]}
      cancelled={t.cancelled[l]}
      expandWord={t.expand[l]}
      collapseWord={t.collapse[l]}
      resizeStartWord={t.resizeStart[l]}
      resizeEndWord={t.resizeEnd[l]}
      resizedWord={t.resized[l]}
      tasks={[
        { id: "release", label: t.releaseGroup[l], start: "2026-03-21", end: "2026-04-07", progress: 0.45 },
        { id: "design", parentId: "release", label: t.design[l], start: "2026-03-21", end: "2026-03-27", progress: 1 },
        { id: "build", parentId: "release", label: t.build[l], start: "2026-03-25", end: "2026-04-04", progress: 0.6 },
        { id: "content", parentId: "release", label: t.content[l], start: "2026-03-28", end: "2026-04-01", progress: 0.25 },
        { id: "test", parentId: "release", label: t.test[l], start: "2026-04-02", end: "2026-04-06" },
        { id: "ship", parentId: "release", label: t.ship[l], start: "2026-04-07", end: "2026-04-07" },
      ]}
    />
  );
}

/**
 * A whole year on the month scale, which is where the columns stop being equal.
 *
 * ۱ فروردین ۱۴۰۵ to ۲۹ اسفند ۱۴۰۵ is 2026-03-21 to 2027-03-20 — three hundred
 * and sixty-five days across twelve Jalali months of 31, 30 and 29 days. Press
 * «ماه» and compare the width of «فروردین» with the width of «اسفند».
 */
function YearExample(l: Locale) {
  return (
    <GanttIsland
      locale={l}
      label={t.yearLabel[l]}
      defaultScale="month"
      scaleGroupLabel={t.scaleGroup[l]}
      dayWord={t.day[l]}
      weekWord={t.week[l]}
      monthWord={t.month[l]}
      quarterWord={t.quarter[l]}
      yearWord={t.year[l]}
      taskColumnHeader={t.taskHeader[l]}
      timelineLabel={t.timeline[l]}
      barRoleDescription={t.barRole[l]}
      fromWord={t.from[l]}
      toWord={t.to[l]}
      separator={t.separator[l]}
      doneWord={t.done[l]}
      pickedUp={t.pickedUp[l]}
      dropped={t.dropped[l]}
      cancelled={t.cancelled[l]}
      expandWord={t.expand[l]}
      collapseWord={t.collapse[l]}
      resizeStartWord={t.resizeStart[l]}
      resizeEndWord={t.resizeEnd[l]}
      resizedWord={t.resized[l]}
      tasks={[
        { id: "research", label: t.research[l], start: "2026-03-21", end: "2026-06-21", progress: 1 },
        { id: "platform", label: t.platform[l], start: "2026-05-22", end: "2026-11-21", progress: 0.55 },
        { id: "rollout", label: t.rollout[l], start: "2026-10-23", end: "2027-01-20", progress: 0.1 },
        { id: "support", label: t.support[l], start: "2026-12-22", end: "2027-03-20" },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "data",
    isNew: true,
    title: { "fa-IR": "نمودار گانت", "en-US": "Gantt" },
    intro: {
      "fa-IR":
        "خط زمانی کارها روی تاریخ‌ها، در تقویم خودِ خواننده. جای هر نوار یک محاسبه است — فاصلهٔ آغاز کار از آغاز بازه، تقسیم بر طول بازه — و همین است که در صفحهٔ راست‌به‌چپ بی‌صدا خراب می‌شود: عددی که به‌دست می‌آید، اگر با left نوشته شود، از لبهٔ اشتباه اندازه‌گیری می‌شود. اینجا جای نوار با inset-inline-start بیان شده تا آینه‌کردن کار مرورگر باشد نه کار یک شاخهٔ if. مقیاس ماه هم ستون‌های نابرابر دارد، چون ماه‌های جلالی درون یک سال ۳۱، ۳۰ و ۲۹ روزه‌اند.",
      "en-US":
        "A timeline of tasks over dates, in the reader's own calendar. A bar's position is arithmetic — how far its start is from the range's start, over the range's length — and that is exactly what breaks silently on an RTL page: the number is right and, written as a left, it is measured from the wrong edge. Here the position is expressed with inset-inline-start so the mirroring is the browser's rather than an if. The month scale has unequal columns too, because Jalali months are 31, 30 and 29 days inside one year.",
    },
    composition: [
      `<Gantt label locale tasks onTasksChange strings>`,
      ``,
      `tasks             [{ id, label, start, end, progress? }]  start/end are CalendarDate,`,
      `                  inclusive at both ends`,
      `strings.barName   a FUNCTION of the task's name, both ends already formatted, and the`,
      `                  progress: a bar is a control, so it needs a name saying WHAT and WHEN`,
      `strings.scaleNames  one word per scale — the library ships no English default for any`,
      ``,
      `ganttGeometry(tasks, scale, locale, range?)   the columns, with the day count each one`,
      `                  really spans — a Jalali month scale is NOT twelve equal columns`,
      `ganttBarPlacement(task, geometry, locale)     { insetInlineStart, inlineSize } and never`,
      `                  { left, width }: the whole point of the component`,
      `moveGanttTask(tasks, id, scale, steps, locale)  the pure move, in the reader's calendar`,
      `ganttDate("2026-03-21")   a day, not an instant — so there is no time zone to fix`,
    ].join("\n"),
    parts: [
      {
        name: "Gantt",
        description: {
          "fa-IR":
            "خودِ نمودار: فهرست کارها کنار یک خط زمانِ پیمایش‌پذیر، با یک ایستگاه Tab و فوکوس چرخشی روی نوارها — و آن ایستگاه در همان بایت اول سرو می‌شود، نه بعد از هیدریت‌شدن. مقیاس روز، هفته و ماه؛ هر تغییر اعلام می‌شود.",
          "en-US":
            "The chart itself: a task list beside a scrollable timeline, with ONE tab stop and roving focus over the bars — and that stop is in the first byte, not added on hydration. Day, week and month scales; every change announced.",
        },
      },
      {
        name: "ganttGeometry",
        description: {
          "fa-IR":
            "بازه را به ستون می‌شکند و طول واقعی هر ستون را از تقویم می‌پرسد. مقیاس ماه در ۱۴۰۵ ستون‌هایی با ۳۱، ۳۰ و ۲۹ روز می‌دهد؛ نموداری که ستون‌ها را برابر فرض کند، سرِ سال دو روز از سرستون‌هایش عقب افتاده است.",
          "en-US":
            "Breaks the range into columns and asks the calendar how long each one really is. On the month scale ۱۴۰۵ yields columns of 31, 30 and 29 days; a chart that assumes equal columns is two days out from its own headers by the end of the year.",
        },
      },
      {
        name: "ganttBarPlacement",
        description: {
          "fa-IR":
            "جای نوار را به‌صورت inset-inline-start و inline-size برمی‌گرداند — نه left و نه width. همین انتخابِ نامِ ویژگی است که آینه‌شدن را به مرورگر می‌سپارد و شاخهٔ isRtl را از محاسبهٔ چیدمان حذف می‌کند.",
          "en-US":
            "Returns a bar's position as inset-inline-start and inline-size — never left, never width. That choice of property name is what hands the mirroring to the browser and takes the isRtl branch out of a layout computation entirely.",
        },
      },
      {
        name: "moveGanttTask",
        description: {
          "fa-IR":
            "کار را جابه‌جا می‌کند و فهرست تازه‌ای برمی‌گرداند. حسابش در تقویم خواننده انجام می‌شود و پایانِ کار از تعداد روزها بازساخته می‌شود، وگرنه افزودن یک ماه به هر دو سر، کاری شش‌روزه را در ماه کوتاه‌تر بی‌صدا پنج‌روزه می‌کند.",
          "en-US":
            "Moves one task and returns a new list. The arithmetic happens in the reader's calendar and the end is re-derived from the day count — adding a month to both ends independently would quietly turn a six-day task into a five-day one in a shorter month.",
        },
      },
      {
        name: "ganttDate",
        description: {
          "fa-IR":
            "یک تاریخ از رشتهٔ YYYY-MM-DD می‌سازد، از روی فیلدهای تقویمی و نه از یک لحظه. چون هیچ لحظه‌ای در کار نیست، هیچ منطقهٔ زمانی‌ای هم برای تثبیت‌کردن نیست و ساخت روی سرور و مرورگر نمی‌توانند سرِ «کدام روز» اختلاف پیدا کنند.",
          "en-US":
            "Builds a date from a YYYY-MM-DD string out of calendar FIELDS rather than an instant. With no instant there is no time zone to fix, and a server build and a browser cannot disagree about which day it is.",
        },
      },
    ],
  },
  examples: [
    {
      id: "release-plan",
      title: { "fa-IR": "برنامه با صفحه‌کلید", "en-US": "The plan by keyboard" },
      description: {
        "fa-IR":
          "با Tab به نوارها برسید — یک ایستگاه بیشتر نیست — و با بالا و پایین بین آن‌ها حرکت کنید. Space یک نوار را برمی‌دارد و کلیدهای چپ و راست تاریخش را جابه‌جا می‌کنند. روی مسیر فارسی ArrowLeft کار را دیرتر می‌برد، چون زمان به سمت لبهٔ پایانیِ خواننده جاری است؛ در انگلیسی دقیقاً برعکس. جای نوارها خودش آینه شده و برای این کار هیچ شاخه‌ای نوشته نشده است.",
        "en-US":
          "Tab to the bars — there is exactly one stop — and move between them with Up and Down. Space picks a bar up and Left and Right move its dates. On the fa route ArrowLeft moves a task LATER, because time runs toward the reader's end edge; in English it is the exact opposite. The bars' positions mirrored themselves, and no branch was written to do it.",
      },
      render: ReleaseExample,
    },
    {
      id: "unequal-months",
      title: { "fa-IR": "ماه‌های نابرابر", "en-US": "The unequal months" },
      description: {
        "fa-IR":
          "یک سال کامل روی مقیاس ماه. ماه‌های جلالی درون یک سال ۳۱، ۳۰ و ۲۹ روزه‌اند، پس عرض «فروردین» با عرض «اسفند» یکی نیست — و نوارها هم از روی شمارِ واقعی روزها جا می‌گیرند، پس با سرستون‌ها می‌خوانند. روی مسیر انگلیسی همین کد، بهمن‌ماهِ گرگوری را باریک‌تر از دی می‌کشد.",
        "en-US":
          "A whole year on the month scale. Jalali months are 31, 30 and 29 days inside one year, so «Farvardin» is not as wide as «Esfand» — and the bars are placed from real day counts, so they line up with the headers. On the en route the same code draws February narrower than January.",
      },
      render: YearExample,
    },
  ],
};
