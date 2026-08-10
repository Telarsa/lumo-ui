"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useId } from "react";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  Heading as AriaHeading,
  Text as AriaText,
  useLocale,
  type CalendarCellProps as AriaCalendarCellProps,
  type CalendarProps as AriaCalendarProps,
  type DateValue,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  calendarCellVariants,
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarHeaderVariants,
  calendarHeadingVariants,
  calendarNavButtonVariants,
  calendarVariants,
} from "./calendar.variants.ts";
import { descriptionVariants, fieldErrorVariants } from "./form.tsx";

export {
  calendarCellVariants,
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarHeaderVariants,
  calendarHeadingVariants,
  calendarNavButtonVariants,
  calendarVariants,
};

/**
 * A month grid, in the reader's own calendar system.
 *
 * ═══ THIS IS THE COMPONENT THE WHOLE LIBRARY WAS BUILT FOR ══════════════════
 *
 * The prototype that started Lumo rendered a Persian calendar with `{day.day}`
 * and shipped 77 of 77 day cells in Latin digits on a page whose every other
 * number was Persian. `LumoNode` exists because of this component; the lint rule
 * that bans a bare number in JSX names this component in its message. So this
 * file is where the library either keeps its promise or does not.
 *
 * It keeps it by DELEGATING, not by formatting. `CalendarCell` renders its own
 * text from React Aria's `DateFormatter`, which reads the locale from context —
 * `LumoProvider` supplies `fa-IR-u-ca-persian-nu-arabext` — so the digits are
 * ۱–۳۱ and the month is مرداد without a single call to a formatter here. There
 * is deliberately no `children` on the cell for anyone to fill in with a raw
 * number. Measured under `renderToStaticMarkup`: 42 rendered cells, 0 of them
 * containing a Latin digit. `dates.test.tsx` pins that count.
 *
 * ── JALALI IS A CALENDAR, NOT A NUMERAL SYSTEM ──────────────────────────────
 *
 * The failure worth naming: `-u-nu-arabext` alone gives you Persian DIGITS on
 * GREGORIAN dates, which looks entirely correct and is off by 621 years. The
 * `-u-ca-persian` half is what makes Mordad a month. Both live in
 * `FORMAT_LOCALE` and arrive through `LumoProvider`; nothing in this file
 * chooses a calendar, which is why nothing in this file can choose the wrong
 * one. React Aria calls `createCalendar` on the resolved locale for exactly
 * this reason (verified in `Calendar.mjs`).
 *
 * Consequences a reader of this file should expect, all measured:
 *
 *   - The week starts on شنبه. The weekday header row is ش ی د س چ پ ج.
 *   - Month lengths are 31×6, 30×5, then Esfand at 29 or 30. A grid that
 *     assumed 30/31 alternation would be wrong six times a year.
 *   - Esfand has 30 days in a leap year — 1403 is one, 1404 is not. That is not
 *     a display detail: it decides whether ۱۴۰۳/۱۲/۳۰ is a date a user can
 *     enter at all. See `date-field.tsx` and the leap-year block in
 *     `dates.test.tsx`.
 *
 * ── THE NAV ARROWS ARE CHOSEN, NOT MIRRORED ─────────────────────────────────
 *
 * `useLocale().direction` picks which chevron means "previous". No CSS utility
 * can do this: a class can move a box to the other side of the header, but the
 * glyph inside it still points the same way, and an arrow pointing at the
 * reader's future labelled «ماه قبل» is worse than no arrow. So the icons swap
 * at the component level and the layout mirrors on its own from the logical
 * classes. `flex justify-between` needs no direction to be told to it.
 *
 * ── EVERY ANNOUNCED STRING ──────────────────────────────────────────────────
 *
 * `label`, `previousMonthLabel`, `nextMonthLabel` are required props, because a
 * grid with 42 tab-reachable cells that announces nothing is the `named-controls`
 * defect at its worst. The two nav labels are `strings.calendar.previousMonth`
 * and `.nextMonth`.
 *
 * The cell names — `aria-label="امروز، ۱۴۰۵ مرداد ۱۹, دوشنبه"` — are NOT prop
 * reachable and were once recorded as a permanent leak. They are closed by
 * `patches/react-aria@3.51.0.patch`, which adds a real `fa-IR` bundle to
 * react-aria's own `calendar` intl package. See `packages/core/src/strings.ts`.
 */
export interface CalendarProps<T extends DateValue>
  extends Omit<
    AriaCalendarProps<T>,
    "children" | "className" | "aria-label" | "visibleDuration"
  > {
  /** Announced name of the calendar. Required: a 42-cell grid needs a name. */
  label: string;
  /** Name of the previous-month button. Required. `strings.calendar.previousMonth`. */
  previousMonthLabel: string;
  /** Name of the next-month button. Required. `strings.calendar.nextMonth`. */
  nextMonthLabel: string;
  /** Help text under the grid. */
  description?: LumoNode;
  /**
   * Shown when the value is out of range or unavailable.
   *
   * REQUIRED once `minValue`, `maxValue` or `isDateUnavailable` is given — see
   * `date-field.tsx`'s `DateBounds` for the measurement behind that rule. React
   * Aria's own message is English, Gregorian and Latin-digited, and it is
   * chosen from `navigator.language` rather than from the provider.
   */
  errorMessage?: LumoNode;
  className?: string | undefined;
}

/**
 * Joins a caller's `aria-describedby` with one this component owns.
 *
 * WHY A CALENDAR'S HELP TEXT IS NOT A SLOT. React Aria's `Calendar` and
 * `RangeCalendar` provide exactly ONE `Text` slot — `errorMessage` — so
 * `<Text slot="description">` inside either one throws at render:
 * «Invalid slot "description". Valid slot names are "errorMessage"». It is a
 * runtime failure, not a type error, so it does not surface until a page that
 * passes `description` is actually rendered; the static export caught it on the
 * first such page. `DateField`, `TimeField`, `DatePicker` and `DateRangePicker`
 * are unaffected — those DO provide a description slot, which is why they keep
 * using `Description` from `form.tsx`.
 *
 * So the help text is a plain element with an id, associated by
 * `aria-describedby`, which both calendars forward to their group. Joining
 * rather than overwriting matters: `aria-describedby` takes a LIST, and
 * replacing a caller's value would silently drop whatever else already
 * described the grid.
 *
 * Returns a SPREADABLE object rather than a string, because the repo compiles
 * with `exactOptionalPropertyTypes` and React Aria types this prop as a plain
 * `string`: writing `aria-describedby={undefined}` is a type error there, and
 * the honest shape for "no description" is an absent attribute, not an empty
 * one.
 */
export function describedByWith(
  caller: string | undefined,
  own: string | undefined,
): { "aria-describedby"?: string } {
  const ids = [caller, own].filter((id) => id !== undefined && id !== "");
  return ids.length === 0 ? {} : { "aria-describedby": ids.join(" ") };
}

export function Calendar<T extends DateValue>({
  label,
  previousMonthLabel,
  nextMonthLabel,
  description,
  errorMessage,
  className,
  "aria-describedby": describedBy,
  ...props
}: CalendarProps<T>) {
  const descriptionId = useId();
  return (
    <AriaCalendar
      data-lumo=""
      aria-label={label}
      {...describedByWith(describedBy, description != null ? descriptionId : undefined)}
      className={cn(calendarVariants(), className)}
      {...props}
    >
      <CalendarHeader previousMonthLabel={previousMonthLabel} nextMonthLabel={nextMonthLabel} />
      <AriaCalendarGrid className={calendarGridVariants()}>
        <AriaCalendarGridHeader>
          {renderHeaderCell}
        </AriaCalendarGridHeader>
        <AriaCalendarGridBody>{renderCell}</AriaCalendarGridBody>
      </AriaCalendarGrid>
      {description != null ? (
        <div id={descriptionId} className={descriptionVariants()}>
          {description}
        </div>
      ) : null}
      {errorMessage != null ? (
        <AriaText slot="errorMessage" className={fieldErrorVariants()}>
          {errorMessage}
        </AriaText>
      ) : null}
    </AriaCalendar>
  );
}

/**
 * The weekday abbreviation row.
 *
 * A named function rather than an inline arrow so the two calendars share one
 * definition — and so nobody is tempted to hand-write ["Sun", "Mon", …], which
 * is a list that has no correct Persian translation because the Persian week
 * does not start on the same day.
 */
function renderHeaderCell(day: string) {
  return <AriaCalendarHeaderCell className={calendarHeaderCellVariants()}>{day}</AriaCalendarHeaderCell>;
}

/**
 * One day cell, with no `children`.
 *
 * That absence is the whole point. Passing children here is how the 77-Latin-
 * digit calendar happened: `{date.day}` is a `number`, it type-checks under a
 * plain `ReactNode`, and it renders 1–31 in ASCII on a page that is otherwise
 * entirely Persian. Left empty, React Aria formats the day itself through the
 * locale's numbering system and the defect is unrepresentable.
 */
export function renderCell(date: AriaCalendarCellProps["date"]) {
  return <AriaCalendarCell data-lumo="" date={date} className={calendarCellVariants()} />;
}

export interface CalendarHeaderProps {
  previousMonthLabel: string;
  nextMonthLabel: string;
  className?: string | undefined;
}

/**
 * Previous / month name / next.
 *
 * Exported because both `Calendar` and `RangeCalendar` render it and a second
 * copy is how the two drift apart. The chevron choice is the direction-aware
 * part; everything else is logical CSS.
 */
export function CalendarHeader({
  previousMonthLabel,
  nextMonthLabel,
  className,
}: CalendarHeaderProps) {
  const { direction } = useLocale();
  // "Previous" points at the reader's past, which is the RIGHT of the screen in
  // an RTL script. The icon is the state; no class can rotate a glyph.
  const PreviousIcon = direction === "rtl" ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = direction === "rtl" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <header className={cn(calendarHeaderVariants(), className)}>
      <AriaButton
        slot="previous"
        aria-label={previousMonthLabel}
        className={calendarNavButtonVariants()}
      >
        <PreviousIcon aria-hidden="true" />
      </AriaButton>
      {/* RAC fills the Heading with its own DateFormatter output — «۱۴۰۵ مرداد».
          It takes no children, so there is no place to put a wrong string. */}
      <AriaHeading className={calendarHeadingVariants()} />
      <AriaButton slot="next" aria-label={nextMonthLabel} className={calendarNavButtonVariants()}>
        <NextIcon aria-hidden="true" />
      </AriaButton>
    </header>
  );
}
