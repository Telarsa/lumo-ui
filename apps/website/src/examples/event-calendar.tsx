import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import type { EventCalendarEventInput } from "@lumo-ui/ui";
import { EventCalendarIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the event-calendar page. Contract: `_system/types.ts`.
 *
 * ISLANDS, for the three reasons `demo-islands.tsx` lists at the component's
 * block: four announced strings are FUNCTIONS, the view and the focused day are
 * state, and an event's start is a class instance that cannot cross the RSC
 * boundary. The copy lives HERE in both locales; the island only builds the
 * closures and turns ISO strings into calendar fields.
 *
 * ── EVERY DATE BELOW IS FIXED, AND THAT IS THE COMPONENT'S OWN RULE ─────────
 *
 * `defaultFocusedDate` is a REQUIRED prop; the component never calls `today()`.
 * A page prerendered at 23:59 and hydrated at 00:01 would otherwise disagree
 * about which month is on screen, and the symptom is a calendar that silently
 * jumps a day on mount. There is no `new Date()` in this file and none in the
 * island.
 *
 * There is also no time zone to state, which is stronger than stating one: the
 * strings below are calendar FIELDS — `2026-08-11T09:00` is nine o'clock, full
 * stop — and `CalendarDateTime` is a wall time with no zone attached. Nothing
 * in the path is ever an instant, so nothing can be converted wrongly.
 *
 * ── THE SAME EVENTS, TWO CALENDARS ─────────────────────────────────────────
 *
 * Note what the event data does NOT restate per locale: only the TITLES are
 * translated. `2026-08-11T09:00` lands on «۲۰ مرداد ۱۴۰۵» on the Persian route
 * and on "11 August 2026" on the English one, from the same string, because the
 * grid is built in the calendar the reader counts in rather than in
 * milliseconds. That is the entire point of the component, and it is visible on
 * this page by switching the language.
 *
 * In the timed views press C on a focused day, or double-click its time column,
 * to create a snapped event. Arrow keys on an event move it in logical time;
 * Shift+Arrow resizes it and Delete removes it. Each mutation is reflected in
 * the example's controlled state and announced in the page's language.
 */

const t = {
  team: { "fa-IR": "تقویم تیم", "en-US": "Team calendar" },
  clinic: { "fa-IR": "تقویم درمانگاه", "en-US": "Clinic calendar" },
  release: { "fa-IR": "تقویم انتشار", "en-US": "Release calendar" },
  travel: { "fa-IR": "تقویم سفرها", "en-US": "Travel calendar" },

  month: { "fa-IR": "ماه", "en-US": "Month" },
  week: { "fa-IR": "هفته", "en-US": "Week" },
  day: { "fa-IR": "روز", "en-US": "Day" },
  days: { "fa-IR": "روزه", "en-US": "days" },
  agenda: { "fa-IR": "فهرست", "en-US": "Agenda" },
  switcher: { "fa-IR": "نمای تقویم", "en-US": "Calendar view" },
  previous: { "fa-IR": "دورهٔ پیش", "en-US": "Previous period" },
  next: { "fa-IR": "دورهٔ بعد", "en-US": "Next period" },
  allDay: { "fa-IR": "تمام‌روز", "en-US": "All day" },
  empty: { "fa-IR": "این ماه رویدادی ندارد", "en-US": "Nothing scheduled this month" },
  continued: { "fa-IR": "ادامهٔ", "en-US": "Continued:" },
  join: { "fa-IR": "تا", "en-US": "to" },
  separator: { "fa-IR": "، ", "en-US": ", " },
  events: { "fa-IR": "رویداد", "en-US": "events" },
  more: { "fa-IR": "رویداد دیگر", "en-US": "more" },
  today: { "fa-IR": "امروز", "en-US": "Today" },
  moved: { "fa-IR": "جابجا شد", "en-US": "Moved" },
  resized: { "fa-IR": "تغییر اندازه یافت", "en-US": "Resized" },
  deleted: { "fa-IR": "حذف شد", "en-US": "Deleted" },
  created: { "fa-IR": "ساخته شد", "en-US": "Created" },
  newEvent: { "fa-IR": "رویداد تازه", "en-US": "New event" },

  standup: { "fa-IR": "جلسهٔ روزانه", "en-US": "Standup" },
  review: { "fa-IR": "بازبینی طراحی", "en-US": "Design review" },
  oneToOne: { "fa-IR": "جلسهٔ دونفره", "en-US": "One to one" },
  retro: { "fa-IR": "بازنگری اسپرینت", "en-US": "Sprint retro" },
  interview: { "fa-IR": "مصاحبه", "en-US": "Interview" },
  onCall: { "fa-IR": "کشیک", "en-US": "On call" },
  workshop: { "fa-IR": "کارگاه", "en-US": "Workshop" },
  release1: { "fa-IR": "انتشار نسخه", "en-US": "Ship the release" },
  freeze: { "fa-IR": "توقف تغییرات", "en-US": "Code freeze" },
  holiday: { "fa-IR": "تعطیل رسمی", "en-US": "Public holiday" },
  offsite: { "fa-IR": "اردوی تیم", "en-US": "Team offsite" },
  conference: { "fa-IR": "همایش", "en-US": "Conference" },
} satisfies Record<string, LocalizedText>;

/** The week the whole page is anchored on. ۲۰ مرداد ۱۴۰۵ is 2026-08-11. */
const ANCHOR = "2026-08-11";

/**
 * A working week. The TITLES are locale data; the times are not.
 *
 * Three of these clash on purpose — see the week example — because a calendar
 * that never shows two things at once has not answered the question a week view
 * is asked.
 */
function workWeek(l: Locale): readonly EventCalendarEventInput[] {
  return [
    { id: "s1", title: t.standup[l], start: "2026-08-10T09:00", end: "2026-08-10T09:15" },
    { id: "s2", title: t.standup[l], start: "2026-08-11T09:00", end: "2026-08-11T09:15" },
    { id: "s3", title: t.standup[l], start: "2026-08-12T09:00", end: "2026-08-12T09:15" },
    {
      id: "review",
      title: t.review[l],
      start: "2026-08-11T10:00",
      end: "2026-08-11T12:00",
      tone: "accent",
    },
    {
      id: "one",
      title: t.oneToOne[l],
      start: "2026-08-11T11:00",
      end: "2026-08-11T11:30",
      tone: "positive",
    },
    {
      id: "interview",
      title: t.interview[l],
      start: "2026-08-11T11:15",
      end: "2026-08-11T12:15",
      tone: "caution",
    },
    { id: "retro", title: t.retro[l], start: "2026-08-13T15:00", end: "2026-08-13T16:00" },
    {
      id: "workshop",
      title: t.workshop[l],
      start: "2026-08-12T14:00",
      end: "2026-08-12T17:00",
      tone: "neutral",
    },
  ];
}

function MonthExample(l: Locale) {
  return (
    <EventCalendarIsland
      label={t.team[l]}
      monthView={t.month[l]}
      weekView={t.week[l]}
      dayView={t.day[l]}
      daysWord={t.days[l]}
      agendaView={t.agenda[l]}
      viewSwitcherLabel={t.switcher[l]}
      previous={t.previous[l]}
      next={t.next[l]}
      allDay={t.allDay[l]}
      empty={t.empty[l]}
      continued={t.continued[l]}
      joinWord={t.join[l]}
      separator={t.separator[l]}
      eventsWord={t.events[l]}
      moreWord={t.more[l]}
      todayWord={t.today[l]}
      eventMovedWord={t.moved[l]}
      eventResizedWord={t.resized[l]}
      eventDeletedWord={t.deleted[l]}
      eventCreatedWord={t.created[l]}
      newEventTitle={t.newEvent[l]}
      focusedDay={ANCHOR}
      todayDay={ANCHOR}
      events={workWeek(l)}
    />
  );
}

function WeekExample(l: Locale) {
  return (
    <EventCalendarIsland
      label={t.clinic[l]}
      monthView={t.month[l]}
      weekView={t.week[l]}
      dayView={t.day[l]}
      daysWord={t.days[l]}
      agendaView={t.agenda[l]}
      viewSwitcherLabel={t.switcher[l]}
      previous={t.previous[l]}
      next={t.next[l]}
      allDay={t.allDay[l]}
      empty={t.empty[l]}
      continued={t.continued[l]}
      joinWord={t.join[l]}
      separator={t.separator[l]}
      eventsWord={t.events[l]}
      moreWord={t.more[l]}
      todayWord={t.today[l]}
      eventMovedWord={t.moved[l]}
      eventResizedWord={t.resized[l]}
      eventDeletedWord={t.deleted[l]}
      eventCreatedWord={t.created[l]}
      newEventTitle={t.newEvent[l]}
      focusedDay={ANCHOR}
      todayDay={ANCHOR}
      defaultView="week"
      events={workWeek(l)}
    />
  );
}

function DayExample(l: Locale) {
  return (
    <EventCalendarIsland
      label={t.clinic[l]}
      monthView={t.month[l]}
      weekView={t.week[l]}
      dayView={t.day[l]}
      daysWord={t.days[l]}
      agendaView={t.agenda[l]}
      viewSwitcherLabel={t.switcher[l]}
      previous={t.previous[l]}
      next={t.next[l]}
      allDay={t.allDay[l]}
      empty={t.empty[l]}
      continued={t.continued[l]}
      joinWord={t.join[l]}
      separator={t.separator[l]}
      eventsWord={t.events[l]}
      moreWord={t.more[l]}
      todayWord={t.today[l]}
      eventMovedWord={t.moved[l]}
      eventResizedWord={t.resized[l]}
      eventDeletedWord={t.deleted[l]}
      eventCreatedWord={t.created[l]}
      newEventTitle={t.newEvent[l]}
      focusedDay={ANCHOR}
      todayDay={ANCHOR}
      defaultView="day"
      events={workWeek(l)}
    />
  );
}

function DaysExample(l: Locale) {
  return (
    <EventCalendarIsland
      label={t.clinic[l]}
      monthView={t.month[l]}
      weekView={t.week[l]}
      dayView={t.day[l]}
      daysWord={t.days[l]}
      agendaView={t.agenda[l]}
      viewSwitcherLabel={t.switcher[l]}
      previous={t.previous[l]}
      next={t.next[l]}
      allDay={t.allDay[l]}
      empty={t.empty[l]}
      continued={t.continued[l]}
      joinWord={t.join[l]}
      separator={t.separator[l]}
      eventsWord={t.events[l]}
      moreWord={t.more[l]}
      todayWord={t.today[l]}
      eventMovedWord={t.moved[l]}
      eventResizedWord={t.resized[l]}
      eventDeletedWord={t.deleted[l]}
      eventCreatedWord={t.created[l]}
      newEventTitle={t.newEvent[l]}
      focusedDay={ANCHOR}
      todayDay={ANCHOR}
      defaultView="days"
      dayCount={3}
      events={workWeek(l)}
    />
  );
}

function AgendaExample(l: Locale) {
  return (
    <EventCalendarIsland
      label={t.release[l]}
      monthView={t.month[l]}
      weekView={t.week[l]}
      dayView={t.day[l]}
      daysWord={t.days[l]}
      agendaView={t.agenda[l]}
      viewSwitcherLabel={t.switcher[l]}
      previous={t.previous[l]}
      next={t.next[l]}
      allDay={t.allDay[l]}
      empty={t.empty[l]}
      continued={t.continued[l]}
      joinWord={t.join[l]}
      separator={t.separator[l]}
      eventsWord={t.events[l]}
      moreWord={t.more[l]}
      todayWord={t.today[l]}
      eventMovedWord={t.moved[l]}
      eventResizedWord={t.resized[l]}
      eventDeletedWord={t.deleted[l]}
      eventCreatedWord={t.created[l]}
      newEventTitle={t.newEvent[l]}
      focusedDay={ANCHOR}
      defaultView="agenda"
      events={[
        { id: "freeze", title: t.freeze[l], start: "2026-08-10", end: "2026-08-12", tone: "caution" },
        {
          id: "ship",
          title: t.release1[l],
          start: "2026-08-13T16:00",
          end: "2026-08-13T18:00",
          tone: "positive",
        },
        { id: "oncall", title: t.onCall[l], start: "2026-08-14", end: "2026-08-16", tone: "neutral" },
      ]}
    />
  );
}

function AllDayExample(l: Locale) {
  return (
    <EventCalendarIsland
      label={t.travel[l]}
      monthView={t.month[l]}
      weekView={t.week[l]}
      dayView={t.day[l]}
      daysWord={t.days[l]}
      agendaView={t.agenda[l]}
      viewSwitcherLabel={t.switcher[l]}
      previous={t.previous[l]}
      next={t.next[l]}
      allDay={t.allDay[l]}
      empty={t.empty[l]}
      continued={t.continued[l]}
      joinWord={t.join[l]}
      separator={t.separator[l]}
      eventsWord={t.events[l]}
      moreWord={t.more[l]}
      todayWord={t.today[l]}
      eventMovedWord={t.moved[l]}
      eventResizedWord={t.resized[l]}
      eventDeletedWord={t.deleted[l]}
      eventCreatedWord={t.created[l]}
      newEventTitle={t.newEvent[l]}
      focusedDay={ANCHOR}
      todayDay={ANCHOR}
      maxEventsPerDay={2}
      events={[
        { id: "holiday", title: t.holiday[l], start: "2026-08-11", end: "2026-08-11", tone: "critical" },
        { id: "offsite", title: t.offsite[l], start: "2026-08-17", end: "2026-08-19", tone: "positive" },
        { id: "conf", title: t.conference[l], start: "2026-08-24", end: "2026-08-26" },
        ...workWeek(l),
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "رویدادها روی روزها و ساعت‌ها: زمان‌بندی، رزرو، برنامهٔ شیفت — در نمای ماه، هفته، روز و دستور کار.",
        "en-US": "Events laid on days and hours: scheduling, bookings, shift plans — in month, week, day and agenda views.",
      },
      whenNot: {
        "fa-IR": "برداشتن یک تاریخ — `Calendar` یا `DatePicker`. کارها روی بازهٔ تاریخ به‌شکل میله — `Gantt`. کارت‌هایی که میان وضعیت‌ها جابه‌جا می‌شوند — `Kanban`.",
        "en-US": "Picking a date — `Calendar` or `DatePicker`. Tasks over a date range as bars — `Gantt`. Cards moved between states — `Kanban`.",
      },
    },
    tier: "data",
    isNew: true,
    title: { "fa-IR": "تقویم رویداد", "en-US": "Event calendar" },
    intro: {
      "fa-IR":
        "شبکه‌ای برای زمان‌بندی، در تقویم خودِ خواننده. ماهش مرداد است، هفته‌اش از شنبه شروع می‌شود و یک رویداد روی همان روزی می‌نشیند که خواننده به آن اشاره می‌کند — همان داده، دو تقویم. پنج نما دارد: ماه، هفته، روز، چندروز و فهرست.",
      "en-US":
        "A scheduling grid in the reader's own calendar. Its month is Mordad, its week starts on Saturday, and an event lands on the day the reader would point at — same data, two calendars. Five views: month, week, day, N-day and agenda.",
    },
    composition: [
      `<EventCalendar label               ← names the grid`,
      `               strings             ← every announced word, all required`,
      `               events              ← occurrences; no recurrence in v1`,
      `               defaultFocusedDate  ← required: the component reads no clock`,
      `               todayDate           ← optional, also passed in`,
      `               defaultView dayCount> ← month | week | day | days | agenda`,
      `  …the toolbar, the grid or the list   ← rendered for you`,
      `</EventCalendar>`,
    ].join("\n"),
    parts: [
      {
        name: "EventCalendar",
        description: {
          "fa-IR":
            "خودِ تقویم. یک نقطهٔ توقف Tab برای کل شبکه با تمرکز چرخشی، و کلیدهای جهت به ترتیب خواندن حرکت می‌کنند نه به ترتیب صفحه؛ روی صفحهٔ فارسی فلش چپ یعنی فردا.",
          "en-US":
            "The calendar itself. One Tab stop for the whole grid with roving focus, and the arrow keys move in reading order rather than screen order: on a Persian page ArrowLeft is tomorrow.",
        },
      },
      {
        name: "eventCalendarEvent",
        description: {
          "fa-IR":
            "یک رویداد را از دادهٔ ساده می‌سازد. رشتهٔ بدون ساعت یعنی رویداد تمام‌روز و رشتهٔ ساعت‌دار یعنی رویداد زمان‌دار؛ هیچ‌جای مسیر لحظهٔ مطلق وجود ندارد، پس منطقهٔ زمانی هم وارد مسئله نمی‌شود.",
          "en-US":
            "Builds one event from plain data. A string without a time is an all-day event and one with a time is a timed event; nothing in the path is ever an instant, so no time zone enters the problem.",
        },
      },
      {
        name: "layoutDayEvents",
        description: {
          "fa-IR":
            "چیدمان رویدادهای هم‌پوشان یک روز، فقط از روی ساعت. خروجی‌اش شمارهٔ ستون و تعداد ستون است و هیچ نشانی از چپ و راست ندارد؛ جای‌گذاری با ویژگی‌های منطقی انجام می‌شود.",
          "en-US":
            "Packs one day's overlapping events into lanes, from clock time alone. It returns a lane index and a lane count and knows nothing about left or right; placement is done with logical properties.",
        },
      },
      {
        name: "indexEvents",
        description: {
          "fa-IR":
            "رویدادها را به قطعه‌های روزانه می‌برد و با کلید روز در تقویم خواننده فهرست می‌کند. تنها جایی که یک مقدار از تقویمی به تقویم دیگر می‌رود، و این کار صریح انجام می‌شود.",
          "en-US":
            "Cuts events into per-day segments keyed by day in the reader's calendar. The one place a value crosses calendars, and it crosses explicitly.",
        },
      },
    ],
  },
  examples: [
    {
      id: "month",
      title: { "fa-IR": "نمای ماه", "en-US": "Month view" },
      description: {
        "fa-IR":
          "پاسخ به «کدام روزها شلوغ است». ستون اول شنبه است، شماره‌های روز از تقویم جلالی می‌آید و روزهای ماه‌های همسایه پاک نمی‌شوند — چون طول ماه‌ها در یک سال جلالی یکسان نیست و خواننده باید مرز ماه را ببیند.",
        "en-US":
          "Answers «which days are busy». The first column is Saturday, the day numbers come from the Jalali calendar, and the neighbouring months' days are shown rather than blanked — month lengths vary inside a Jalali year, so a reader needs to see where the month ends.",
      },
      render: MonthExample,
    },
    {
      id: "week",
      title: { "fa-IR": "نمای هفته", "en-US": "Week view" },
      description: {
        "fa-IR":
          "تنها نمایی که محور زمان دارد، پس تنها نمایی که به هندسهٔ هم‌پوشانی نیاز دارد. سه جلسهٔ هم‌زمان هر کدام یک ستون می‌گیرند و رویدادِ بعدازظهر باریک نمی‌شود؛ پهنا خاصیتِ خوشه است نه خاصیتِ روز.",
        "en-US":
          "The only view with a time axis, therefore the only one that needs overlap geometry. Three clashing meetings take one lane each and the afternoon event stays full width: width is a property of the cluster, not of the day.",
      },
      render: WeekExample,
    },
    {
      id: "day",
      title: { "fa-IR": "نمای روز", "en-US": "Day view" },
      description: {
        "fa-IR":
          "همان محور ساعت و هندسهٔ هم‌پوشانیِ نمای هفته را برای یک روزِ متمرکز با پهنای خواناتر نشان می‌دهد. دکمه‌های دوره یک روز جابه‌جا می‌شوند و دادهٔ روزهای دیگر وارد شبکه نمی‌شود.",
        "en-US":
          "Uses the week view's same time axis and overlap geometry for one focused day at a more readable width. Period navigation moves one day, and events from other days do not enter the grid.",
      },
      render: DayExample,
    },
    {
      id: "days",
      title: { "fa-IR": "نمای سه‌روزه", "en-US": "Three-day view" },
      description: {
        "fa-IR":
          "پنجره‌ای فشرده برای سه روزِ پیاپی که هندسهٔ زمانیِ نمای هفته را نگه می‌دارد. دکمه‌های دوره دقیقاً سه روز جابه‌جا می‌شوند؛ پس برنامهٔ کاریِ لغزان مجبور نیست خود را در مرزِ هفته بشکند.",
        "en-US":
          "A compact window over three consecutive days that keeps the week view's time geometry. Period navigation advances exactly three days, so a rolling work schedule does not have to break at a week boundary.",
      },
      render: DaysExample,
    },
    {
      id: "agenda",
      title: { "fa-IR": "نمای فهرست", "en-US": "Agenda view" },
      description: {
        "fa-IR":
          "پاسخ به «بعدی چیست». نه شبکه، نه تمرکز چرخشی، نه هندسه — ترتیب خواندن خودش پاسخ است، و همین آن را روی گوشی و برای صفحه‌خوان بهترین نما می‌کند. ماهی که چیزی ندارد جملهٔ خالیِ نویسنده را نشان می‌دهد.",
        "en-US":
          "Answers «what is next». No grid, no roving focus, no geometry — reading order is the answer, which makes it the best view on a phone and for a screen reader. A month with nothing in it shows the author's own empty sentence.",
      },
      render: AgendaExample,
    },
    {
      id: "all-day",
      title: { "fa-IR": "رویداد تمام‌روز و چندروزه", "en-US": "All-day and multi-day" },
      description: {
        "fa-IR":
          "رویداد تمام‌روز هر دو سرش شامل است — «یکم تا سوم» یعنی سه روز — و رویداد چندروزه روی هر روزش یک تراشه دارد که از روز دوم به بعد «ادامهٔ» را هم اعلام می‌کند. وقتی خانه جا کم بیاورد، جملهٔ «بیشتر» را نویسنده نوشته است.",
        "en-US":
          "An all-day event is inclusive at both ends — «the 1st to the 3rd» is three days — and a multi-day event gets one chip per day, announcing «continued» from the second onward. When a cell runs out of room, the «more» sentence is the author's own.",
      },
      render: AllDayExample,
    },
  ],
};
