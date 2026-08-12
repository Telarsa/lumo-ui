"use client";

import { useId } from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { CalendarDate } from "@internationalized/date";
import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { fromPickerDate, lumoCalendar, toPickerDate } from "./calendar-datelib.ts";
import {
  calendarCellVariants,
  calendarDayButtonVariants,
  calendarDropdownRootVariants,
  calendarDropdownsVariants,
  calendarDropdownVariants,
  calendarFooterVariants,
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarHeaderVariants,
  calendarHeadingVariants,
  calendarMonthsVariants,
  calendarNavButtonVariants,
  calendarNavVariants,
  calendarVariants,
} from "./calendar.variants.ts";
import { descriptionVariants, fieldErrorVariants } from "./form.tsx";

export {
  calendarCellVariants,
  calendarDayButtonVariants,
  calendarDropdownRootVariants,
  calendarDropdownsVariants,
  calendarDropdownVariants,
  calendarFooterVariants,
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarHeaderVariants,
  calendarHeadingVariants,
  calendarMonthsVariants,
  calendarNavButtonVariants,
  calendarNavVariants,
  calendarVariants,
};

/**
 * A month grid, in the reader's own calendar.
 *
 *     <Calendar
 *       label="تاریخ سفر"
 *       locale={locale}
 *       value={value}
 *       onChange={setValue}
 *     />
 *
 * ═══ WHAT THIS COMPONENT IS, AFTER THE MIGRATION ════════════════════════════
 *
 * React Aria's `Calendar` until 11 Aug 2026, and the LAST component in the
 * library to leave it. It is now `react-day-picker`'s grid driven by
 * `calendar-datelib.ts`, which binds it to `@internationalized/date`'s calendar
 * systems.
 *
 * The division of labour is worth stating because it is the whole design:
 *
 *   react-day-picker    the grid, the roving tab stop, arrow-key navigation
 *                       across weeks and months, focus restored when the month
 *                       changes. Nothing here reimplements any of it.
 *
 *   calendar-datelib    WHICH CALENDAR those days belong to, where the week
 *                       starts, how every visible figure is formatted, and
 *                       every announced string.
 *
 *   this file           the value boundary, the Lumo class names, the
 *                       direction-aware chevrons, and the required-label API.
 *
 * ═══ THE PATCH IS GONE ══════════════════════════════════════════════════════
 *
 * The previous version of this docblock ended: *"The cell names —
 * `aria-label="امروز، ۱۴۰۵ مرداد ۱۹, دوشنبه"` — are NOT prop reachable and were
 * once recorded as a permanent leak. They are closed by
 * `patches/react-aria@3.51.0.patch`, which adds a real `fa-IR` bundle to
 * react-aria's own `calendar` intl package."*
 *
 * That was a 27KB binary patch against `node_modules`, carried because the
 * strings were genuinely unreachable from any prop. Here the same strings are
 * the `labels` prop — a documented, public, per-locale object — so the patch is
 * deleted rather than ported. This component is the reason it existed and is
 * the reason it can go.
 *
 * ═══ THE API CHANGED, AND THE THREE BREAKS ARE STATED ═══════════════════════
 *
 * Unlike the other rebuilds this one could NOT freeze its public API, because
 * the two engines disagree about what a calendar's parts are:
 *
 *   CalendarProps<T extends DateValue>  →  CalendarProps. No generic: the value
 *                                          is a `CalendarDate`, and a
 *                                          `CalendarDateTime` in a day grid was
 *                                          always a time silently ignored.
 *   `locale` is now REQUIRED               It was read from React Aria's
 *                                          `I18nProvider`. There is no such
 *                                          provider here and inferring it from
 *                                          the document is guessing.
 *   CalendarHeader                      →  gone. react-day-picker renders its
 *                                          own nav; `calendarClassNames()` is
 *                                          what the pickers share instead.
 *   renderCell                          →  gone. The grid renders its own cells.
 *
 * ═══ THE VALUE IS A `CalendarDate`, NOT A JS `Date` ═════════════════════════
 *
 * Deliberately: a JS `Date` is an instant with no calendar, so `getMonth()` on
 * one is necessarily Gregorian and «مرداد» is not a question it can answer.
 * `calendar-datelib.ts` converts at the seam — see `toPickerDate`/
 * `fromPickerDate`, the only two places in the library where a Lumo date becomes
 * calendar-less.
 *
 * ═══ `locale` IS REQUIRED, AND THERE IS NO `dir` PROP ═══════════════════════
 *
 * Everything direction- and calendar-sensitive is derived from it: the calendar
 * system, the numbering system, the week start (Persian weeks begin on شنبه),
 * the chevron glyphs and `dir`. There is deliberately no second input that could
 * disagree with it — the rule `virtual-list.tsx` and `LumoProvider` already
 * follow.
 *
 * ═══ `minValue`/`maxValue` ARE DAYS, AND WERE MONTHS UNTIL 12 AUG 2026 ══════
 *
 * The props are documented as days and now behave as days. Between the
 * migration on 11 Aug 2026 and this change on the 12th they did not: they
 * reached the engine ONLY as `startMonth`/`endMonth`, and
 * `helpers/getNavMonth.js` (v10.0.1) opens with
 *
 *     if (startMonth) { startMonth = startOfMonth(startMonth); }
 *
 * so a `minValue` of ۱۵ مرداد was a bound of ۱ مرداد. The fourteen days before
 * it rendered, were enabled, took a click and fired `onChange`. A Persian date
 * picker that accepts dates you told it not to — and it did so in the one month
 * where a screenshot of the grid is indistinguishable from a correct one, which
 * is why it took an audit rather than a review to find. It survived only a day
 * here; the same shape in a consumer's copy would survive indefinitely, because
 * a copy-in library's defects do not get re-reviewed.
 *
 * The bounds are now passed TWICE, because they answer two different questions:
 *
 *   startMonth/endMonth   NAVIGATION. Which months a reader can page to.
 *   disabled matchers     SELECTION. Which days a reader can press.
 *
 * `calendarDisabled` below composes the second, and its docblock carries the
 * upstream reading behind the array shape. Keeping the first is a decision and
 * not inertia: `getNavMonth` rounds to the bound's own month, which is exactly
 * the set of months holding at least one selectable day, so navigation stops
 * where selection stops. Without it a `minValue` of ۱۵ مرداد would let a reader
 * page back through Tir, Khordad, Ordibehesht and on — grid after grid of 31
 * grey cells with nothing pressable and no explanation, which is a worse
 * failure than the one being fixed and is the whole of the argument.
 *
 * Note also that `startMonth`/`endMonth` are what `getYearOptions` reads: the
 * year `<select>` derives its option list from `navStart`/`navEnd` alone, so
 * dropping them would empty the dropdowns the union below requires bounds FOR.
 *
 * ═══ THE CAPTION DROPDOWNS, AND WHY A YEAR LIST NEEDS BOUNDS IN THE TYPE ════
 *
 * `captionLayout` turns the month/year caption into two real `<select>`s. It
 * exists because paging is the only other way to move, and paging is counted in
 * MONTHS: a reader born in ۱۳۶۰ is 540 of them from ۱۴۰۵/۵, so a date of birth
 * was 540 presses of «ماه پیش» and is now two choices. The apparatus to do it —
 * `formatMonthDropdown`, `formatYearDropdown`, `labelMonthDropdown`,
 * `labelYearDropdown`, `eachYearOfInterval` — has been sitting complete and
 * unreachable in `calendar-datelib.ts` since the migration.
 *
 * The prop is a UNION rather than a plain optional, and that is the whole design
 * decision in this change. Read out of `helpers/getNavMonth.js` (v10.0.1):
 *
 *     const hasYearDropdown = props.captionLayout === "dropdown" ||
 *                             props.captionLayout === "dropdown-years";
 *     …
 *     else if (!startMonth && hasYearDropdown) {
 *       startMonth = startOfYear(addYears(props.today ?? today(), -100));
 *     }
 *     …
 *     else if (!endMonth && hasYearDropdown) {
 *       endMonth = endOfYear(props.today ?? today());
 *     }
 *
 * A year dropdown with no bounds therefore derives its OPTION LIST from the
 * clock, during render. That is a hydration hazard of the kind
 * `event-calendar.tsx` and `date-selector.tsx` both made a required prop of
 * (`defaultFocusedDate`, and presets resolved on press): the server that renders
 * at 23:59 on ۲۹ اسفند and the client that hydrates a minute later disagree, and
 * the disagreement is not a highlight this time but the CONTENTS of a `<select>`.
 * It is also a nondeterministic build — the same source produces a different
 * static page tomorrow. Measured, in `dates.test.tsx` («a year list with no
 * bounds is a different list tomorrow»): under two fake clocks a year apart, an
 * unbounded `captionLayout="dropdown"` renders 101 years ending ۱۴۰۵ and then
 * 101 years ending ۱۴۰۶ — 100 of 101 options shared, one silently different.
 *
 * So the two layouts that read the clock cannot be selected without bounds AT
 * ALL, and it is a compile error rather than a warning nobody reads:
 *
 *     <Calendar captionLayout="dropdown" />                    // does not compile
 *     <Calendar captionLayout="dropdown" minValue={…} maxValue={…} />
 *
 * `"dropdown-months"` is deliberately NOT in that half of the union. It renders
 * one `<select>` of the twelve months of the DISPLAYED year — `getMonthOptions`
 * takes `navStart`/`navEnd` only to disable options, and `hasYearDropdown` above
 * excludes it — so it reads no clock, and requiring bounds for it would be a
 * required prop the code cannot justify.
 *
 * ── WHAT THE BOUNDS DO NOT FIX, STATED BECAUSE IT IS STILL TRUE ─────────────
 *
 * `DayPicker.js` opens with `if (!props.today) props = { …props, today:
 * dateLib.today() }`, unconditionally, for the `data-today` modifier. Every
 * calendar in this library has always paid that clock read and still does; what
 * bounds remove is its reach into the SERVED OPTION LIST. Closing the rest means
 * a `today` prop on this component, which is a separate change with a separate
 * argument, and it is not made here.
 */

/**
 * How the month and year are shown in the caption.
 *
 * The names are react-day-picker's own, unrenamed: they are what `captionLayout`
 * accepts upstream, and a Lumo synonym would be a second vocabulary to keep in
 * step with a library whose docs the reader will also be reading.
 */
export type CalendarCaptionLayout = "label" | "dropdown" | "dropdown-months" | "dropdown-years";

/**
 * The caption layout together with the bounds it requires. See the header.
 *
 * Shared by `Calendar`, `RangeCalendar` and `DatePicker` so that the rule is
 * stated once — three copies of a discriminated union is how one of them comes
 * to permit the unbounded case.
 */
export type CalendarNavigation =
  | {
      /** Paging chevrons only, or a month `<select>` — neither reads a clock. */
      captionLayout?: "label" | "dropdown-months" | undefined;
      /** Earliest selectable DAY. Itself selectable; the day before it is not. */
      minValue?: CalendarDate | undefined;
      /** Latest selectable DAY. Itself selectable; the day after it is not. */
      maxValue?: CalendarDate | undefined;
    }
  | {
      /** A year `<select>`. Both bounds are REQUIRED — see the header. */
      captionLayout: "dropdown" | "dropdown-years";
      /** Earliest selectable DAY, and the first year in the list. */
      minValue: CalendarDate;
      /** Latest selectable DAY, and the last year in the list. */
      maxValue: CalendarDate;
    };

export interface CalendarBaseProps {
  /** Announced name of the calendar. Required: a 42-cell grid needs a name. */
  label: string;
  /**
   * The reader's locale. Selects the calendar system, the digits, the week
   * start and the direction. There is no `dir` and no `calendar` prop.
   */
  locale: Locale;
  /** The selected day, in the reader's own calendar. */
  value?: CalendarDate | undefined;
  /** Fires with a `CalendarDate` in the reader's calendar, never a JS `Date`. */
  onChange?: ((value: CalendarDate | undefined) => void) | undefined;
  /** The month to show when uncontrolled. */
  defaultMonth?: CalendarDate | undefined;
  /** Marks individual days unselectable — holidays, booked days. */
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  isDisabled?: boolean | undefined;
  /** Help text under the grid. */
  description?: LumoNode;
  /**
   * Shown when the value is out of range or unavailable.
   *
   * REQUIRED once `minValue`, `maxValue` or `isDateUnavailable` is given — see
   * `date-field.tsx`'s `DateBounds` for the measurement behind that rule. There
   * is no built-in message to fall back to any more, which is the point: the one
   * this replaced was English, Gregorian and Latin-digited, and it was chosen
   * from `navigator.language` rather than from the page.
   */
  errorMessage?: LumoNode;
  className?: string | undefined;
  "aria-describedby"?: string | undefined;
}

/**
 * The grid's props: everything above, plus the caption layout and its bounds.
 *
 * An intersection with a UNION, so `minValue`/`maxValue` are optional for the
 * two layouts that do not read a clock and REQUIRED for the two that would.
 * TypeScript distributes the intersection, so the error names the missing
 * properties rather than the union: *"is missing the following properties …
 * minValue, maxValue"*.
 */
export type CalendarProps = CalendarBaseProps & CalendarNavigation;

/**
 * Joins a caller's `aria-describedby` with one this component owns.
 *
 * Kept from the React Aria version unchanged, because the reasoning was never
 * about the engine: `aria-describedby` takes a LIST, and replacing a caller's
 * value would silently drop whatever else already described the grid.
 *
 * Returns a SPREADABLE object rather than a string because the repo compiles
 * with `exactOptionalPropertyTypes`, and the honest shape for "no description"
 * is an absent attribute rather than an empty one.
 */
export function describedByWith(
  caller: string | undefined,
  own: string | undefined,
): { "aria-describedby"?: string } {
  const ids = [caller, own].filter((id) => id !== undefined && id !== "");
  return ids.length === 0 ? {} : { "aria-describedby": ids.join(" ") };
}

/**
 * The Lumo class names, mapped onto react-day-picker's element slots.
 *
 * Exported because `RangeCalendar` and both pickers render the same grid, and a
 * second copy of this map is how they drift apart — the same argument the old
 * `CalendarHeader` export made, now expressed as data instead of as markup.
 *
 * The keys are react-day-picker's `UI` enum values, written as string literals
 * rather than imported from the enum so this map needs no runtime import of it.
 * A key that stops existing upstream then shows up as an unstyled element —
 * visible — rather than as a type error in a file nobody is changing.
 */
export function calendarClassNames(): Record<string, string> {
  return {
    root: calendarVariants(),
    // `months` is the POSITIONING CONTEXT and `nav` is stretched across the
    // top of it — react-day-picker emits `nav` as a SIBLING of `month`, not
    // inside the caption, so a plain flex row put the chevrons on their own
    // line above a separately-centred month name. See `calendarHeaderVariants`.
    months: calendarMonthsVariants(),
    month: "flex flex-col gap-4",
    month_caption: calendarHeaderVariants(),
    caption_label: calendarHeadingVariants(),
    nav: calendarNavVariants(),
    button_previous: calendarNavButtonVariants(),
    button_next: calendarNavButtonVariants(),
    /*
     * The caption dropdowns. Present unconditionally, because this map is
     * built once and shared: a calendar rendered with `captionLayout="label"`
     * emits none of these elements, so an entry for one costs nothing, while
     * a map that varied by layout would be a second copy to keep in step.
     * `calendar.variants.ts` documents the markup all three land on.
     */
    dropdowns: calendarDropdownsVariants(),
    dropdown_root: calendarDropdownRootVariants(),
    dropdown: calendarDropdownVariants(),
    month_grid: calendarGridVariants(),
    weekdays: "flex",
    weekday: calendarHeaderCellVariants(),
    week: "flex w-full",
    day: calendarCellVariants(),
    day_button: calendarDayButtonVariants(),
    week_number: calendarHeaderCellVariants(),
  };
}

/**
 * The two chevrons, chosen by DIRECTION rather than rotated by a class.
 *
 * "Previous" points at the reader's PAST, which is the right of the screen in an
 * RTL script. The icon IS the state; no utility can flip a glyph, which is why
 * this is a component decision and not a CSS one — the same call `sortable.tsx`
 * makes for its arrow keys and `table.variants.ts` for its grid.
 *
 * Exported so both pickers build their grids the same way.
 *
 * ── "down" IS NOT A DIRECTION THIS FUNCTION MAY MIRROR ──────────────────────
 *
 * This used to be `orientation === "left" ? Previous : Next`, i.e. every
 * orientation that was not "left" got the Next glyph. That was true of the
 * only two react-day-picker emitted while there were no dropdowns, and it
 * became wrong the moment `captionLayout` was reachable: `Dropdown.js` renders
 * `<Chevron orientation="down" size={18} />` beside the caption, so a Persian
 * calendar's month `<select>` was marked with «‹» — the PREVIOUS-month glyph in
 * an RTL script, on a control that opens a list. A chevron on a select is the
 * one that is not direction-sensitive at all: a list opens downward in every
 * script, so `down` is a third case and not a side.
 *
 * v10.0.1 emits exactly three orientations — "left" and "right" from
 * `Nav.js`/`DayPicker.js`, "down" from `Dropdown.js`. Its own `Chevron.js` also
 * draws an "up", which nothing in the library passes; if that changes it lands
 * on `Next` here, which is visible rather than silent.
 */
export function calendarChevron(locale: Locale) {
  const rtl = direction(locale) === "rtl";
  const Previous = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const Next = rtl ? ChevronLeftIcon : ChevronRightIcon;
  return function Chevron({ orientation }: { orientation?: string }) {
    const Icon =
      orientation === "down" ? ChevronDownIcon : orientation === "left" ? Previous : Next;
    return <Icon aria-hidden="true" className="size-4" />;
  };
}

/**
 * One matcher in react-day-picker's `disabled` prop, as this file uses it.
 *
 * Three shapes and no more: a predicate (the caller's `isDateUnavailable`), and
 * the two half-open intervals `dateMatchModifiers` understands. Deliberately
 * NOT `Matcher` imported from upstream — the union there is eight cases wide
 * and includes `{ before, after }`, which is the one this file must never
 * construct. See `calendarDisabled` below.
 */
export type CalendarDisabledMatcher = ((date: Date) => boolean) | { before: Date } | { after: Date };

/**
 * The `disabled` prop for the grid: the caller's unavailable days AND the bounds.
 *
 * ═══ THE DEFECT THIS FUNCTION EXISTS TO CLOSE ═══════════════════════════════
 *
 * `minValue`/`maxValue` have always been documented as DAYS — *"Earliest
 * selectable day"* — and before 12 Aug 2026 they reached react-day-picker as
 * `startMonth`/`endMonth` and nothing else. Read out of the installed
 * `helpers/getNavMonth.js` (v10.0.1):
 *
 *     if (startMonth) { startMonth = startOfMonth(startMonth); }
 *     …
 *     if (endMonth)   { endMonth   = endOfMonth(endMonth); }
 *
 * So a `minValue` of ۱۵ مرداد was a bound of ۱ مرداد. The fourteen days before
 * it rendered, were enabled, took a click and fired `onChange` — a date picker
 * that accepts a date the caller has already said is out of range, in the ONE
 * month where a screenshot of the grid looks entirely correct. It is the same
 * shape as every other defect in this repository's ledger: the wrong thing and
 * the right thing are pixel-identical.
 *
 * ═══ WHY AN ARRAY, AND WHY NOT ONE `{ before, after }` OBJECT ═══════════════
 *
 * `utils/dateMatchModifiers.js` reduces with `.some()` over an array, so a day
 * is disabled if ANY matcher claims it — which is exactly the composition
 * wanted: the caller's holidays UNION the out-of-range days. That is verified
 * against the installed source rather than assumed, and it is the reason the
 * bounds are added BESIDE `isDateUnavailable` and never in place of it. A
 * caller who passes both keeps both; replacing would silently bring their own
 * refused days back to life.
 *
 * The two bounds are two SEPARATE entries and never one `{ before, after }`
 * object. That distinction is real but NARROWER than it first looks, and the
 * narrow version is the one worth writing down, because the wide version was
 * written here first and measured false. `utils/typeguards.js`:
 *
 *     isDateInterval = "before" in matcher && "after" in matcher
 *
 * and `dateMatchModifiers` then branches on whether the interval is CLOSED:
 *
 *     const isClosedInterval = isAfter(matcher.before, matcher.after);
 *     if (isClosedInterval) return isDayAfter && isDayBefore;
 *     else                  return isDayBefore || isDayAfter;
 *
 * With `minValue` before `maxValue` — every sane call — the `else` branch runs
 * and the single object is EXACTLY equivalent to the two entries. Reverting to
 * it broke no test until one was written with the bounds the wrong way round;
 * that is the whole difference and «bounds the wrong way round select NOTHING,
 * rather than everything» in `dates.test.tsx` is it. Inverted bounds are an
 * empty range, and an empty range must render a grid with nothing pressable;
 * the interval form flips to `&&` and disables only the days BETWEEN them,
 * enabling every day outside — a calendar where the only pressable days are
 * the out-of-range ones.
 *
 * Two entries also keep the min-only and max-only cases from needing a shape of
 * their own. Each hits `isDateBeforeType`/`isDateAfterType`, both strict —
 * `differenceInCalendarDays(matcher.before, date) > 0` — so `minValue` and
 * `maxValue` are themselves selectable.
 *
 * ═══ `isDisabled` SHORT-CIRCUITS, AND STAYS FIRST ═══════════════════════════
 *
 * A grid the caller switched off is `disabled: true` — a boolean matcher, which
 * `dateMatchModifiers` answers `true` for on every day. Bounds beneath it would
 * be dead weight, and an array that somehow re-enabled a day would be a bound
 * overriding an explicit `isDisabled`.
 *
 * Returns `undefined` — not an empty array — when there is nothing to disable,
 * so the prop is OMITTED rather than passed empty. `createGetModifiers.js`
 * guards with `Boolean(disabled && …)` and `[]` is truthy, so an empty array
 * costs a `dateMatchModifiers` call per cell, 42 per month, for a question
 * whose answer is already known.
 */
export function calendarDisabled(options: {
  locale: Locale;
  isDisabled?: boolean | undefined;
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  minValue?: CalendarDate | undefined;
  maxValue?: CalendarDate | undefined;
}): true | CalendarDisabledMatcher[] | undefined {
  const { locale, isDisabled, isDateUnavailable, minValue, maxValue } = options;
  if (isDisabled === true) return true;

  const matchers: CalendarDisabledMatcher[] = [];
  if (isDateUnavailable) {
    // Back into the reader's own calendar before the caller's predicate sees
    // it, exactly as `onChange` does: a caller asking `date.month === 5` means
    // مرداد, and a JS `Date` would answer May.
    matchers.push((date: Date) => isDateUnavailable(fromPickerDate(date, locale)));
  }
  if (minValue) matchers.push({ before: toPickerDate(minValue) });
  if (maxValue) matchers.push({ after: toPickerDate(maxValue) });
  return matchers.length > 0 ? matchers : undefined;
}

export function Calendar({
  label,
  locale,
  value,
  onChange,
  defaultMonth,
  captionLayout,
  minValue,
  maxValue,
  isDateUnavailable,
  isDisabled,
  description,
  errorMessage,
  className,
  "aria-describedby": describedBy,
}: CalendarProps) {
  const descriptionId = useId();
  const config = lumoCalendar(locale);
  const dir = direction(locale);
  const disabled = calendarDisabled({
    locale,
    isDisabled,
    isDateUnavailable,
    minValue,
    maxValue,
  });

  return (
    <div
      data-lumo=""
      className={cn("flex w-fit flex-col gap-2", className)}
      {...describedByWith(describedBy, description != null ? descriptionId : undefined)}
    >
      <DayPicker
        mode="single"
        dir={dir}
        /*
         * `lang` explicitly, because react-day-picker otherwise stamps
         * `locale.code` on the grid — measured as `lang="en-US"` sitting inside
         * a Persian document, which tells a screen reader to read «مرداد» with
         * an English voice. The gate's `lang-dir` rule grades the document; a
         * nested wrong `lang` is the version of that defect it cannot see.
         */
        lang={locale}
        /*
         * The neighbouring months' days are SHOWN, greyed, rather than blanked.
         *
         * react-day-picker hides them by default; React Aria showed them, and
         * showing them is the right call for a Jalali grid specifically —
         * `calendar.variants.ts` argues it on `data-outside`. Month lengths
         * change INSIDE a Jalali year (31,31,31,31,31,31,30,30,30,30,30,29-or-30),
         * so a reader checking a date near a boundary needs to see where the
         * month actually ends rather than inferring it from a gap. Blanking them
         * would also make every `data-outside` rule in the variants dead code.
         */
        showOutsideDays
        aria-label={label}
        // The whole calendar system, in four props. See `calendar-datelib.ts`.
        dateLib={config.dateLib as never}
        formatters={config.formatters as never}
        labels={config.labels as never}
        weekStartsOn={config.weekStartsOn as never}
        classNames={calendarClassNames()}
        components={{ Chevron: calendarChevron(locale) }}
        /*
         * Omitted entirely when absent rather than passed as `"label"`:
         * `captionLayout?.startsWith("dropdown")` is what upstream branches on,
         * so `undefined` and `"label"` render the same caption, and forwarding
         * only what the caller stated keeps the served markup identical to what
         * every existing calendar in the library already emits.
         */
        {...(captionLayout ? { captionLayout } : {})}
        {...(value ? { selected: toPickerDate(value) } : {})}
        {...(defaultMonth ? { defaultMonth: toPickerDate(defaultMonth) } : {})}
        /*
         * ═══ THE BOUNDS ARE PASSED TWICE, ON PURPOSE ══════════════════════
         *
         * `startMonth`/`endMonth` bound NAVIGATION; the `disabled` matchers
         * below bound SELECTION. They are different questions and both need
         * answering, which is why the fix for the day/month defect ADDS to
         * this pair rather than replacing it.
         *
         * Kept because `getNavMonth.js` rounds them to `startOfMonth` /
         * `endOfMonth`, and that rounding is exactly right for navigation:
         * the month CONTAINING the bound holds selectable days and stays
         * reachable, and the month before it holds none and does not. Drop
         * these and a reader with a `minValue` of ۱۵ مرداد could page back
         * through Tir, Khordad, Ordibehesht — an unbounded run of grids where
         * all 31 cells are grey and nothing says why. Paging is also how a
         * keyboard reader moves, so it would be an unbounded run for them too.
         *
         * They are also load-bearing for `captionLayout`: `getYearOptions`
         * derives the year `<select>`'s options from `navStart`/`navEnd`
         * alone, so removing them would empty the dropdowns the union in
         * `CalendarNavigation` requires bounds FOR. `dates.test.tsx` pins
         * both halves — the ۱۳۰۰…۱۴۰۵ option list, and the disabled ۱۴ مرداد.
         */
        {...(minValue ? { startMonth: toPickerDate(minValue) } : {})}
        {...(maxValue ? { endMonth: toPickerDate(maxValue) } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(onChange
          ? {
              // Back into the reader's calendar before it leaves this file, so a
              // caller never handles a Gregorian value by accident.
              onSelect: (selected: Date | undefined) => {
                onChange(selected ? fromPickerDate(selected, locale) : undefined);
              },
            }
          : {})}
      />
      {description != null ? (
        // `calendarFooterVariants` keeps a sentence from inflating the `w-fit`
        // wrapper past the grid — see its docblock; this is what made the
        // calendar look off-centre on the website.
        <div id={descriptionId} className={cn(calendarFooterVariants(), descriptionVariants())}>
          {description}
        </div>
      ) : null}
      {errorMessage != null ? (
        // `role="alert"` rather than a slot: react-day-picker has no error slot,
        // and an error a reader is never told about is the defect `form.tsx`
        // describes at length.
        <div role="alert" className={cn(calendarFooterVariants(), fieldErrorVariants())}>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
