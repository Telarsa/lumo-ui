"use client";

import { useId } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { CalendarDate } from "@internationalized/date";
import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { fromPickerDate, lumoCalendar, toPickerDate } from "./calendar-datelib.ts";
import {
  calendarCellVariants,
  calendarDayButtonVariants,
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
  calendarDayButtonVariants,
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarHeaderVariants,
  calendarHeadingVariants,
  calendarNavButtonVariants,
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
 */

export interface CalendarProps {
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
  /** Earliest selectable day. */
  minValue?: CalendarDate | undefined;
  /** Latest selectable day. */
  maxValue?: CalendarDate | undefined;
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
    months: "flex flex-col gap-4",
    month: "flex flex-col gap-4",
    month_caption: calendarHeaderVariants(),
    caption_label: calendarHeadingVariants(),
    nav: "flex items-center gap-1",
    button_previous: calendarNavButtonVariants(),
    button_next: calendarNavButtonVariants(),
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
 */
export function calendarChevron(locale: Locale) {
  const rtl = direction(locale) === "rtl";
  const Previous = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const Next = rtl ? ChevronLeftIcon : ChevronRightIcon;
  return function Chevron({ orientation }: { orientation?: string }) {
    const Icon = orientation === "left" ? Previous : Next;
    return <Icon aria-hidden="true" className="size-4" />;
  };
}

export function Calendar({
  label,
  locale,
  value,
  onChange,
  defaultMonth,
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
        {...(value ? { selected: toPickerDate(value) } : {})}
        {...(defaultMonth ? { defaultMonth: toPickerDate(defaultMonth) } : {})}
        {...(minValue ? { startMonth: toPickerDate(minValue) } : {})}
        {...(maxValue ? { endMonth: toPickerDate(maxValue) } : {})}
        {...(isDisabled === true
          ? { disabled: true }
          : isDateUnavailable
            ? { disabled: (date: Date) => isDateUnavailable(fromPickerDate(date, locale)) }
            : {})}
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
        <div id={descriptionId} className={descriptionVariants()}>
          {description}
        </div>
      ) : null}
      {errorMessage != null ? (
        // `role="alert"` rather than a slot: react-day-picker has no error slot,
        // and an error a reader is never told about is the defect `form.tsx`
        // describes at length.
        <div role="alert" className={fieldErrorVariants()}>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
