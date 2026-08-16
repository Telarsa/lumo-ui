"use client";

import { useId, type ChangeEvent, type ComponentProps } from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, type DropdownProps } from "react-day-picker";
import type { CalendarDate } from "@internationalized/date";
import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { fromPickerDate, lumoCalendar, toPickerDate } from "./calendar-datelib.ts";
import { useLumoStringsFor } from "./locale.ts";
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
import { SelectField } from "./select.tsx";

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
 *     <Calendar label="تاریخ سفر" locale={locale} today={todayDate} value={value} onChange={setValue} />
 *
 * react-day-picker owns the grid, roving tab stop and arrow keys; `calendar-datelib.ts`
 * owns WHICH calendar, week start, formatting and every announced string; this file owns
 * the value boundary (`CalendarDate`, never a JS `Date`), Lumo class names, direction-aware
 * chevrons and the required-label API. `locale` is REQUIRED and there is no `dir` prop.
 *
 * `minValue`/`maxValue` are DAYS and are passed TWICE: `startMonth`/`endMonth` bound
 * NAVIGATION (upstream rounds them to whole months) and `disabled` matchers bound
 * SELECTION. A year dropdown with no bounds derives its options from the clock during
 * render (a hydration hazard), so `CalendarNavigation` makes bounds REQUIRED for
 * `"dropdown"`/`"dropdown-years"` at the type level. `today` is required for the same
 * reason. Long form: docs/decisions/log.md, docs/history/.
 */

/** How the month and year are shown in the caption. react-day-picker's own names, unrenamed. */
export type CalendarCaptionLayout = "label" | "dropdown" | "dropdown-months" | "dropdown-years";

/**
 * The caption layout together with the bounds it requires — see the header. Shared by
 * `Calendar`, `RangeCalendar` and `DatePicker` so the rule is stated once.
 */
export type CalendarNavigation =
  | {
      /** Paging chevrons only, or a month dropdown — neither reads a clock. */
      captionLayout?: "label" | "dropdown-months" | undefined;
      /** Earliest selectable DAY. Itself selectable; the day before it is not. */
      minValue?: CalendarDate | undefined;
      /** Latest selectable DAY. Itself selectable; the day after it is not. */
      maxValue?: CalendarDate | undefined;
    }
  | {
      /** A year dropdown. Both bounds are REQUIRED — see the header. */
      captionLayout: "dropdown" | "dropdown-years";
      /** Earliest selectable DAY, and the first year in the list. */
      minValue: CalendarDate;
      /** Latest selectable DAY, and the last year in the list. */
      maxValue: CalendarDate;
    };

export interface CalendarBaseProps
  // `aria-describedby` is owned: merged with the description node's id, so it cannot ride the passthrough.
  extends Omit<
    ComponentProps<"div">,
    // `onChange` is Lumo's `(value) => void`, not React's `ChangeEventHandler`.
    "children" | "className" | "aria-describedby" | "onChange"
  > {
  /** Announced name of the calendar. Required: a 42-cell grid needs a name. */
  label: string;
  /**
   * The reader's locale. Selects the calendar system, the digits, the week
   * start, the direction and the announced chrome (`LumoStrings["calendar"]`,
   * the app's own for a language Lumo does not carry). There is no `dir` and no `calendar` prop.
   */
  locale: Locale;
  /** The selected day, in the reader's own calendar. */
  value?: CalendarDate | undefined;
  /** Fires with a `CalendarDate` in the reader's calendar, never a JS `Date`. */
  onChange?: ((value: CalendarDate | undefined) => void) | undefined;
  /** The month to show when uncontrolled. */
  defaultMonth?: CalendarDate | undefined;
  /** The day marked as today. Required so render never reads the clock. */
  today: CalendarDate;
  /** Marks individual days unselectable — holidays, booked days. */
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  isDisabled?: boolean | undefined;
  /** Help text under the grid. */
  description?: LumoNode;
  /**
   * Shown when the value is out of range or unavailable. REQUIRED once `minValue`,
   * `maxValue` or `isDateUnavailable` is given — there is no built-in fallback message.
   */
  errorMessage?: LumoNode;
  className?: string | undefined;
  "aria-describedby"?: string | undefined;
}

/**
 * The grid's props: everything above, plus the caption layout and its bounds. An
 * intersection with a UNION, so bounds are required only for the clock-reading layouts.
 */
export type CalendarProps = CalendarBaseProps & CalendarNavigation;

/**
 * Joins a caller's `aria-describedby` with one this component owns: it takes a LIST, so
 * replacing would drop what already described the grid. Returns a spreadable object
 * because of `exactOptionalPropertyTypes` — "no description" is an absent attribute.
 */
export function describedByWith(
  caller: string | undefined,
  own: string | undefined,
): { "aria-describedby"?: string } {
  const ids = [caller, own].filter((id) => id !== undefined && id !== "");
  return ids.length === 0 ? {} : { "aria-describedby": ids.join(" ") };
}

/**
 * The Lumo class names, mapped onto react-day-picker's element slots. Exported so
 * `RangeCalendar` and both pickers share one map. Keys are the `UI` enum values as
 * string literals so a key that stops existing upstream shows as an unstyled element.
 */
export function calendarClassNames(): Record<string, string> {
  return {
    root: calendarVariants(),
    // `months` is the positioning context; `nav` is a SIBLING of `month` and is stretched
    // across the top of it — see `calendarHeaderVariants`.
    months: calendarMonthsVariants(),
    month: "flex flex-col gap-4",
    month_caption: calendarHeaderVariants(),
    caption_label: calendarHeadingVariants(),
    nav: calendarNavVariants(),
    button_previous: calendarNavButtonVariants(),
    button_next: calendarNavButtonVariants(),
    // Caption dropdowns, present unconditionally: a `label` layout emits none of these elements.
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
 * The two chevrons, chosen by DIRECTION rather than rotated by a class: "previous" points
 * at the reader's PAST, which is the right of the screen in RTL, and no utility can flip a
 * glyph. `"down"` (the caption dropdown's chevron) is a third case, not a side: a list
 * opens downward in every script. Exported so both pickers build their grids the same way.
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

/** Adapts react-day-picker's numeric dropdown contract to Lumo's Select. */
export function CalendarDropdown({ options = [], value, onChange, disabled, "aria-label": label }: DropdownProps) {
  const accessibleLabel = label ?? "";
  return (
    <SelectField
      label={accessibleLabel}
      placeholder={accessibleLabel}
      options={options.map((option) => ({
        value: String(option.value),
        label: option.label,
        disabled: option.disabled,
      }))}
      selectedKey={value === undefined ? null : String(value)}
      onSelectionChange={(key) => {
        if (key === null || onChange === undefined) return;
        onChange({ target: { value: key } } as ChangeEvent<HTMLSelectElement>);
      }}
      isDisabled={disabled}
      size="sm"
      className="relative z-[1] w-auto"
      triggerClassName="w-auto min-w-20 px-2 text-xs"
      popoverClassName="max-h-64"
      itemClassName="gap-1.5 px-1.5 py-1 text-xs [&_svg]:size-3.5"
    />
  );
}

/**
 * One matcher in react-day-picker's `disabled` prop, as this file uses it. Deliberately
 * NOT upstream's `Matcher`: that union includes `{ before, after }`, the one shape this
 * file must never construct — see `calendarDisabled`.
 */
export type CalendarDisabledMatcher = ((date: Date) => boolean) | { before: Date } | { after: Date };

/**
 * The `disabled` prop for the grid: the caller's unavailable days AND the bounds.
 *
 * `startMonth`/`endMonth` alone round to whole months, so a `minValue` of ۱۵ مرداد let
 * fourteen earlier days be selected. Bounds are ADDED beside `isDateUnavailable` (any
 * matcher disables), as two SEPARATE entries and never one `{ before, after }` object:
 * upstream flips a closed interval to `&&`, so inverted bounds would enable only the
 * out-of-range days instead of selecting nothing. `isDisabled` short-circuits first.
 * Returns `undefined`, not `[]`, when nothing is disabled — `[]` is truthy upstream and
 * costs a matcher call per cell.
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
    // Back into the reader's own calendar before the caller's predicate sees it.
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
  today,
  captionLayout,
  minValue,
  maxValue,
  isDateUnavailable,
  isDisabled,
  description,
  errorMessage,
  className,
  "aria-describedby": describedBy,
  ...props
}: CalendarProps) {
  const descriptionId = useId();
  // The announced chrome for THIS `locale`: built-in, or the app's own for a language Lumo does not carry.
  const strings = useLumoStringsFor(locale);
  const config = lumoCalendar(locale, strings.calendar);
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
      {...props}
      data-lumo=""
      className={cn("flex w-fit flex-col gap-2", className)}
      {...describedByWith(describedBy, description != null ? descriptionId : undefined)}
    >
      <DayPicker
        mode="single"
        dir={dir}
        // `lang` explicitly: react-day-picker otherwise stamps `locale.code` (`lang="en-US"`) on a Persian grid.
        lang={locale}
        // Neighbouring months' days are SHOWN, greyed: Jalali month lengths change inside the
        // year, so a reader near a boundary needs to see where the month ends (`data-outside`).
        showOutsideDays
        aria-label={label}
        // The whole calendar system, in four props. See `calendar-datelib.ts`.
        dateLib={config.dateLib as never}
        formatters={config.formatters as never}
        labels={config.labels as never}
        weekStartsOn={config.weekStartsOn as never}
        classNames={calendarClassNames()}
        components={{ Chevron: calendarChevron(locale), Dropdown: CalendarDropdown }}
        // Omitted when absent rather than passed as `"label"`, so served markup stays identical.
        {...(captionLayout ? { captionLayout } : {})}
        {...(value ? { selected: toPickerDate(value) } : {})}
        {...(defaultMonth ? { defaultMonth: toPickerDate(defaultMonth) } : {})}
        today={toPickerDate(today)}
        // The bounds are passed TWICE, on purpose: these bound NAVIGATION (and feed the year
        // dropdown's option list); the `disabled` matchers below bound SELECTION.
        {...(minValue ? { startMonth: toPickerDate(minValue) } : {})}
        {...(maxValue ? { endMonth: toPickerDate(maxValue) } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(onChange
          ? {
              // Back into the reader's calendar before it leaves this file.
              onSelect: (selected: Date | undefined) => {
                onChange(selected ? fromPickerDate(selected, locale) : undefined);
              },
            }
          : {})}
      />
      {description != null ? (
        // `calendarFooterVariants` keeps a sentence from inflating the `w-fit` wrapper past the grid.
        <div id={descriptionId} className={cn(calendarFooterVariants(), descriptionVariants())}>
          {description}
        </div>
      ) : null}
      {errorMessage != null ? (
        // `role="alert"`: react-day-picker has no error slot.
        <div role="alert" className={cn(calendarFooterVariants(), fieldErrorVariants())}>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
