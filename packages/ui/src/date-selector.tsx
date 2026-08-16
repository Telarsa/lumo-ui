"use client";

import { useId, useState } from "react";
import { CalendarIcon } from "lucide-react";
import {
  createCalendar,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toCalendar,
  today as icuToday,
  type CalendarDate,
} from "@internationalized/date";
import { cn, formatDate, type Locale, type LumoNode } from "@lumo-ui/core";
import { calendarFor, toPickerDate } from "./calendar-datelib.ts";
import { useLumoLocale } from "./locale.ts";
import { Popover, PopoverTrigger, type LumoPlacement } from "./popover.tsx";
import { RangeCalendar, type CalendarDateRange } from "./range-calendar.tsx";
import {
  dateSelectorPanelVariants,
  dateSelectorPlaceholderVariants,
  dateSelectorPresetListVariants,
  dateSelectorPresetVariants,
  dateSelectorTriggerVariants,
  dateSelectorValueVariants,
} from "./date-selector.variants.ts";

export {
  dateSelectorPanelVariants,
  dateSelectorPlaceholderVariants,
  dateSelectorPresetListVariants,
  dateSelectorPresetVariants,
  dateSelectorTriggerVariants,
  dateSelectorValueVariants,
};

/**
 * The control in a dashboard's corner: named ranges beside a range grid.
 *
 *     <DateSelector label="بازهٔ گزارش" panelLabel="انتخاب بازهٔ تاریخ"
 *       presetsLabel="بازه‌های آماده" calendarLabel="انتخاب بازهٔ دلخواه"
 *       placeholder="بازه‌ای انتخاب نشده"
 *       formatRange={(from, to) => (to ? `${from} تا ${to}` : from)}
 *       presets={[{ id: "month", label: "این ماه", range: { kind: "thisMonth" } }]}
 *       onChange={setRange} />
 *
 * A PRESET IS ARITHMETIC IN A CALENDAR: «این ماه» is Mordad ۱…۳۱, not the
 * Gregorian month and not today − 30 days; Jalali months are 31/30/29 within a
 * year, so `endOfMonth` is the only honest far end. All arithmetic is
 * `@internationalized/date`'s on values that carry their calendar; the only JS
 * `Date` is handed to `formatDate` at the display edge. Lumo ships the
 * ARITHMETIC (`DateRangeRule`, plain data that crosses the RSC boundary), the
 * caller ships the COPY — no preset list, no default label. v1 does not: type
 * dates, map a value back to a preset (would recompute `today()` in render — a
 * hydration mismatch), stage an Apply/Cancel, clamp presets to min/max, show
 * two months, or carry a time. Long form: `docs/decisions/log.md`.
 */

/* THE ARITHMETIC */

/**
 * A named calendar computation. PLAIN DATA. Every kind is anchored on TODAY in
 * the reader's calendar and inclusive of both ends («۷ روز گذشته» includes today).
 */
export type DateRangeRule =
  /** Today, both ends. */
  | { kind: "today" }
  /** The day before today, both ends. */
  | { kind: "yesterday" }
  /** The last `days` days, ending today and INCLUDING it. Exact in every calendar. */
  | { kind: "lastDays"; days: number }
  /** The current week, from the locale's own first weekday (شنبه under fa-IR). */
  | { kind: "thisWeek" }
  /** The week before the current one, same first weekday. */
  | { kind: "lastWeek" }
  /** The current month in the reader's calendar, first day to last. */
  | { kind: "thisMonth" }
  /** The whole month before this one — 29, 30 or 31 days, asked not assumed. */
  | { kind: "lastMonth" }
  /** The current year in the reader's calendar. Farvardin ۱ … Esfand ۲۹/۳۰. */
  | { kind: "thisYear" }
  /** The whole year before this one. */
  | { kind: "lastYear" }
  /**
   * An escape hatch: a fiscal quarter, anything no kind above names. `anchor` is
   * today IN THE READER'S CALENDAR. Holds a function, so it is the ONE member
   * that cannot cross an RSC boundary.
   */
  | { kind: "custom"; resolve: (anchor: CalendarDate) => CalendarDateRange };

/**
 * Today, in the calendar `locale` counts in. The zone is asked for, not assumed:
 * "which day is it" differs between Tehran and UTC at 21:00 local.
 */
export function todayIn(locale: Locale, anchor?: CalendarDate): CalendarDate {
  const calendar = createCalendar(calendarFor(locale));
  return toCalendar(anchor ?? icuToday(getLocalTimeZone()), calendar);
}

/**
 * A rule, resolved against a calendar. No React, no DOM, no `Date`. `anchor`
 * makes it testable and lets a server resolve the same range; it is converted
 * into the reader's calendar first. `startOfMonth(anchor).subtract({months:1})`
 * rather than `anchor.subtract(…)`, which would CLAMP on a 31st.
 */
export function resolveDateRangePreset(
  rule: DateRangeRule,
  locale: Locale,
  anchor?: CalendarDate,
): CalendarDateRange {
  const now = todayIn(locale, anchor);

  switch (rule.kind) {
    case "today":
      return { from: now, to: now };

    case "yesterday": {
      const day = now.subtract({ days: 1 });
      return { from: day, to: day };
    }

    case "lastDays":
      // Inclusive of today, hence `days - 1`. See `DateRangeRule.lastDays`.
      return { from: now.subtract({ days: Math.max(rule.days, 1) - 1 }), to: now };

    case "thisWeek":
      // The locale decides the first weekday; nothing here names Saturday.
      return { from: startOfWeek(now, locale), to: endOfWeek(now, locale) };

    case "lastWeek": {
      const day = startOfWeek(now, locale).subtract({ weeks: 1 });
      return { from: startOfWeek(day, locale), to: endOfWeek(day, locale) };
    }

    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };

    case "lastMonth": {
      // Normalised to the first before moving — see the docblock.
      const day = startOfMonth(now).subtract({ months: 1 });
      return { from: startOfMonth(day), to: endOfMonth(day) };
    }

    case "thisYear":
      return { from: startOfYear(now), to: endOfYear(now) };

    case "lastYear": {
      const day = startOfYear(now).subtract({ years: 1 });
      return { from: startOfYear(day), to: endOfYear(day) };
    }

    case "custom":
      return rule.resolve(now);
  }
}

/* THE COMPONENT */

/** One named range in the panel's list. */
export interface DateSelectorPreset {
  /** Distinguishes this preset from its siblings. Never announced. */
  id: string;
  /** The reader's own words for this range. REQUIRED and not derivable from `range`. */
  label: string;
  /** The calendar computation this preset performs. */
  range: DateRangeRule;
}

export interface DateSelectorProps {
  /**
   * What the whole control is FOR, e.g. «بازهٔ گزارش». REQUIRED. Rendered
   * `sr-only` inside the trigger (content, not `aria-label`, for label-in-name),
   * so the button's name is this string followed by the read-out.
   */
  label: string;
  /**
   * Names the popover, e.g. «انتخاب بازهٔ تاریخ». REQUIRED — the trigger's name
   * changes with every pick, and a dialog named by its own value announces the
   * answer instead of the question.
   */
  panelLabel: string;
  /** Names the list of presets, e.g. «بازه‌های آماده». REQUIRED. */
  presetsLabel: string;
  /** Names the grid, e.g. «انتخاب بازهٔ دلخواه». REQUIRED — `RangeCalendar.label`. */
  calendarLabel: string;
  /** The trigger's read-out while nothing is chosen. REQUIRED. */
  placeholder: string;
  /**
   * Builds the trigger's read-out from ALREADY-FORMATTED ends. REQUIRED. `to` is
   * `undefined` while only the first end is picked. A FUNCTION, not a template:
   * clause order differs per language, and a neutral dash between two number
   * runs can render the ends swapped under bidi — the caller places «تا» or U+200F.
   */
  formatRange: (from: string, to: string | undefined) => string;
  /** The named ranges, in reading order. An empty list renders no list at all. */
  presets?: readonly DateSelectorPreset[] | undefined;
  /** How each end is formatted for the read-out. An `Intl` options bag, so it may have a default. */
  dateFormatOptions?: Intl.DateTimeFormatOptions | undefined;
  /** The range, when controlled. */
  value?: CalendarDateRange | null | undefined;
  /** Clock input for the popup calendar. Required for deterministic rendering. */
  today: CalendarDate;
  /** The initial range, when uncontrolled. */
  defaultValue?: CalendarDateRange | null | undefined;
  /** Called with the committed range, or null when cleared. */
  onChange?: ((value: CalendarDateRange | null) => void) | undefined;
  /** Earliest and latest selectable DAY in the grid, forwarded to `RangeCalendar`. Presets are not clamped. */
  minValue?: CalendarDate | undefined;
  /** The latest selectable date. */
  maxValue?: CalendarDate | undefined;
  /** Marks individual dates unselectable in the grid. */
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  isDisabled?: boolean | undefined;
  /** Logical only. `LumoPlacement` subtracts the physical spellings. */
  placement?: LumoPlacement;
  /** The control-height variant shared across form controls. */
  size?: "sm" | "md" | "lg" | undefined;
  /** Shown under the grid, inside the panel. */
  description?: LumoNode;
  className?: string | undefined;
}

export function DateSelector({
  label,
  panelLabel,
  presetsLabel,
  calendarLabel,
  placeholder,
  formatRange,
  presets,
  dateFormatOptions,
  value,
  today,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  isDisabled,
  placement,
  size,
  description,
  className,
}: DateSelectorProps) {
  const locale = useLumoLocale();
  const presetsId = useId();

  const [uncontrolled, setUncontrolled] = useState<CalendarDateRange | null>(defaultValue ?? null);
  const selected = value !== undefined ? value : uncontrolled;

  // Which preset is lit — the one the reader PRESSED, never derived from the
  // value (that would recompute `today()` in render: hydration mismatch).
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const [isOpen, setOpen] = useState(false);

  const commit = (next: CalendarDateRange | null) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  // The one JS `Date` in this file, at the last moment. `toPickerDate` converts
  // through calendar FIELDS at local noon, never an instant.
  const formatEnd = (date: CalendarDate) =>
    formatDate(
      toPickerDate(date),
      locale,
      dateFormatOptions ?? { year: "numeric", month: "long", day: "numeric" },
    );

  const readout =
    selected == null
      ? null
      : formatRange(
          formatEnd(selected.from),
          selected.to ? formatEnd(selected.to) : undefined,
        );

  return (
    <PopoverTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <button
        type="button"
        data-lumo=""
        {...(isDisabled === true ? { disabled: true } : {})}
        className={cn(dateSelectorTriggerVariants({ size }), className)}
      >
        {/*
          The name, then the value. Hidden visually because the field already
          sits under a heading on a dashboard and a second visible caption reads
          as a second question — the same call `date-range-picker.tsx` makes for
          its two halves. The NAME still has to exist; see the `label` docblock.
        */}
        <span className="sr-only">{label}</span>
        {readout === null ? (
          <span className={dateSelectorPlaceholderVariants()}>{placeholder}</span>
        ) : (
          <span className={dateSelectorValueVariants()}>{readout}</span>
        )}
        <CalendarIcon aria-hidden="true" />
      </button>

      <Popover placement={placement ?? "bottom start"} aria-label={panelLabel} padded>
        <div className={dateSelectorPanelVariants()}>
          {presets !== undefined && presets.length > 0 ? (
            <>
              <span id={presetsId} className="sr-only">
                {presetsLabel}
              </span>
              {/*
                A real list of real buttons, not a `role="listbox"` of options.
                A preset is an ACTION — it writes a value and closes the panel —
                and `option` semantics would promise arrow-key navigation and a
                selection model that nothing here implements. `aria-pressed`
                carries "this is the range currently applied", which is the one
                fact a listbox would have carried for free and is cheap to state.
              */}
              <ul aria-labelledby={presetsId} className={dateSelectorPresetListVariants()}>
                {presets.map((preset) => {
                  const active = activePreset === preset.id;
                  return (
                    <li key={preset.id}>
                      <button
                        type="button"
                        data-lumo=""
                        aria-pressed={active}
                        {...(isDisabled === true ? { disabled: true } : {})}
                        className={dateSelectorPresetVariants({ active })}
                        onClick={() => {
                          // Resolved on PRESS, not during render: `today()` at
                          // render time is a hydration mismatch across midnight.
                          commit(resolveDateRangePreset(preset.range, locale));
                          setActivePreset(preset.id);
                          setOpen(false);
                        }}
                      >
                        {preset.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          <RangeCalendar
            label={calendarLabel}
            locale={locale}
            today={today}
            {...(selected ? { value: selected } : {})}
            {...(selected?.from ? { defaultMonth: selected.from } : {})}
            {...(minValue ? { minValue } : {})}
            {...(maxValue ? { maxValue } : {})}
            {...(isDateUnavailable ? { isDateUnavailable } : {})}
            {...(isDisabled === true ? { isDisabled: true } : {})}
            {...(description != null ? { description } : {})}
            onChange={(next) => {
              commit(next ?? null);
              // A custom range is no longer any preset, the moment the first end moves.
              setActivePreset(null);
              // BOTH ends, or the panel stays open: a lone `from` is half a gesture.
              if (next?.from && next.to) setOpen(false);
            }}
          />
        </div>
      </Popover>
    </PopoverTrigger>
  );
}
