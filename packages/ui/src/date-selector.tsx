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
import { CALENDAR_FOR, toPickerDate } from "./calendar-datelib.ts";
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
 *     <DateSelector
 *       label="بازهٔ گزارش"
 *       panelLabel="انتخاب بازهٔ تاریخ"
 *       presetsLabel="بازه‌های آماده"
 *       calendarLabel="انتخاب بازهٔ دلخواه"
 *       placeholder="بازه‌ای انتخاب نشده"
 *       formatRange={(from, to) => (to ? `${from} تا ${to}` : from)}
 *       presets={[
 *         { id: "today",  label: "امروز",         range: { kind: "today" } },
 *         { id: "d7",     label: "۷ روز گذشته",   range: { kind: "lastDays", days: 7 } },
 *         { id: "month",  label: "این ماه",       range: { kind: "thisMonth" } },
 *         { id: "prev",   label: "ماه گذشته",     range: { kind: "lastMonth" } },
 *       ]}
 *       onChange={setRange}
 *     />
 *
 * ═══ THE POINT OF THE FILE: A PRESET IS ARITHMETIC IN A CALENDAR ════════════
 *
 * «این ماه» on a Persian page means Mordad ۱ … Mordad ۳۱. It does not mean "the
 * Gregorian month containing today", and it is not "today minus thirty days".
 * Measured on this project's Node for 2026-08-11, which is ۱۴۰۵/۵/۲۰:
 *
 *     thisMonth  fa-IR   ۱۴۰۵/۵/۱ … ۱۴۰۵/۵/۳۱   (2026-07-23 … 2026-08-22)
 *     thisMonth  en-US   2026-08-01 … 2026-08-31
 *     lastMonth  fa-IR   ۱۴۰۵/۴/۱ … ۱۴۰۵/۴/۳۱   (2026-06-22 … 2026-07-22)
 *     today − 30 days    ۱۴۰۵/۴/۲۱               — inside Tir, not its start
 *
 * The two `thisMonth` rows share no endpoint at all. A preset engine that adds
 * to a JavaScript `Date` produces the second row on a page that reads the first,
 * and the failure is invisible in every way that matters: the digits are
 * Persian, the month name is Persian, the numbers look plausible, and the only
 * evidence is that a report labelled «این ماه» silently excludes the first
 * eleven days of Mordad and includes nine days of Tir.
 *
 * Jalali month lengths are 31,31,31,31,31,31,30,30,30,30,30,29-or-30. Measured
 * with `@internationalized/date` on this runtime: Esfand ۱۴۰۳ has 30 days,
 * Esfand ۱۴۰۴ has 29. So "a month ago" is not a fixed number of days even
 * within one year, and `endOfMonth` is the only honest way to find the far end.
 * All the arithmetic below is `@internationalized/date`'s, on values that carry
 * their calendar; the only JavaScript `Date` in this file is the one handed to
 * `formatDate`, at the very edge, for display.
 *
 * The week is a third case again, and it is LOCALE data rather than calendar
 * data: Persian weeks begin on شنبه. `startOfWeek(date, locale)` is asked, not
 * tabled — the same derivation `calendar-datelib.ts` makes for `weekStartsOn`.
 *
 * ═══ WHY THE LIBRARY SHIPS NO PRESET LIST ═══════════════════════════════════
 *
 * Every preset picker in every other library ships `["Today", "Last 7 days",
 * "This month"]` and lets you override the labels. That is the exact shape
 * CONTRIBUTING forbids: a default is a promise the library cannot keep in a
 * language it does not speak, and «۷ روز گذشته» is not a translation of "Last 7
 * days" that a library can perform — the digit is `۷`, the noun is inflected,
 * and a caller may reasonably prefer «یک هفتهٔ اخیر».
 *
 * So the split is: **Lumo ships the ARITHMETIC, the caller ships the COPY.** A
 * preset is `{ id, label, range }` where `range` is a plain data rule
 * (`DateRangeRule`) naming a calendar computation, and `label` is a required
 * `string`. The caller never reimplements "last 7 days" — that is
 * `{ kind: "lastDays", days: 7 }` — and the library never invents a word.
 *
 * The rules are DATA, not closures, which buys a second thing: a preset list
 * crosses the React Server Components boundary intact. A server component may
 * build the whole array. The one exception is `{ kind: "custom", resolve }`,
 * which carries a function so a caller can express a fiscal quarter that no
 * enumerated kind covers; it is the only member that cannot cross, and it says
 * so on its own docblock.
 *
 * `resolveDateRangePreset` is exported because the arithmetic is the valuable
 * part and it has no React in it: a server route that has to run the same
 * «این ماه» its dashboard shows should call the same function, not a second
 * implementation that agrees today and drifts in Esfand.
 *
 * ═══ NUMBERS, AND WHY NONE OF THEM ARE IN THIS FILE ═════════════════════════
 *
 * The rule is that every number a reader sees goes through `formatNumber`. This
 * component renders exactly two kinds of text and neither is a bare number: the
 * preset labels are the caller's strings, and the read-out is built from
 * `formatDate` under `FORMAT_LOCALE`, which carries `-u-ca-persian
 * -u-nu-arabext` explicitly. `days` on a `lastDays` rule is arithmetic, never
 * rendered — the `۷` a reader sees is in the label the caller wrote.
 *
 * ═══ WHAT v1 DOES NOT DO ════════════════════════════════════════════════════
 *
 * Listed the way `table.tsx` lists what it lost, because a gap that is written
 * down is a decision and a gap that is not is a bug report:
 *
 *  1. **No typed entry.** There are no `DateInput` segments here. A reader who
 *     wants to type ۱۴۰۵/۰۵/۰۱ wants `DateRangePicker`, which is that component
 *     and composes the same `RangeCalendar`. Putting both in one control would
 *     mean two engines writing one value, which is `date-range-picker.tsx`'s
 *     whole middle section, and it is not the shape a dashboard corner needs.
 *  2. **No reverse mapping from a value to a preset.** The active preset is the
 *     one the reader last PRESSED. A `value` set from outside — a URL query, a
 *     saved view — lights nothing, even when it happens to equal «این ماه».
 *     Deriving it would mean recomputing every rule on every render against a
 *     `today()` that differs between the server and the client, which is a
 *     hydration mismatch dressed as a highlight.
 *  3. **No Apply/Cancel footer.** Every selection commits immediately, and the
 *     panel closes on a preset or on a completed range. A staged edit needs a
 *     third state (pending) that a controlled caller cannot see, and two more
 *     required strings for the buttons.
 *  4. **Presets are not clamped to `minValue`/`maxValue`.** Those bound the
 *     GRID — every day the reader can press in it, since 12 Aug 2026; before
 *     that only the months it could page to, which is the defect
 *     `calendar.tsx`'s header records. «۹۰ روز گذشته» against a `minValue`
 *     of last week produces a range that starts before the minimum, and this
 *     component does not silently truncate the reader's request — a caller who
 *     needs that clamps in `onChange`, where it is visible.
 *  5. **One month grid, no comparison range.** No "vs. previous period" second
 *     range, and no side-by-side two-month view; both are `RangeCalendar`
 *     features this component would only be passing through.
 *  6. **Day granularity only.** No time of day, because `CalendarDateRange` is
 *     two `CalendarDate`s and adding a time would change that type for every
 *     component that shares it.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE ARITHMETIC
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * A named calendar computation. PLAIN DATA — see the header on why.
 *
 * Every kind is anchored on TODAY in the reader's own calendar, and every one
 * of them is inclusive of both ends, because a range a human names is inclusive:
 * «۷ روز گذشته» is seven days including today, not today plus a week's worth of
 * yesterdays. That choice is stated here once so a caller does not have to
 * discover it from an off-by-one in a total.
 */
export type DateRangeRule =
  /** Today, both ends. */
  | { kind: "today" }
  /** The day before today, both ends. */
  | { kind: "yesterday" }
  /**
   * The last `days` days, ending today and INCLUDING it — `days: 7` spans today
   * and the six days before it. Day arithmetic is the one kind that is the same
   * in every calendar, so this rule is exact rather than approximate; it is the
   * MONTH rules below that a JavaScript `Date` gets wrong.
   */
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
   * An escape hatch: a fiscal quarter, a school term, anything no kind above
   * names. `anchor` arrives as today IN THE READER'S CALENDAR, so
   * `anchor.add({ months: 3 })` is Jalali arithmetic without the caller
   * arranging it.
   *
   * THE ONE MEMBER THAT CANNOT CROSS AN RSC BOUNDARY, because it holds a
   * function. A preset list built in a server component must use the enumerated
   * kinds; one built in a client component may use this.
   */
  | { kind: "custom"; resolve: (anchor: CalendarDate) => CalendarDateRange };

/**
 * Today, in the calendar `locale` counts in.
 *
 * `today(getLocalTimeZone())` returns a Gregorian `CalendarDate`; `toCalendar`
 * is what makes it ۱۴۰۵/۵/۲۰. The zone is asked for rather than assumed because
 * "which day is it" is a question with different answers in Tehran and in UTC
 * at 21:00 local — and a dashboard whose «امروز» is yesterday's data for three
 * and a half hours every evening is the sort of defect nobody reports as a bug.
 */
export function todayIn(locale: Locale, anchor?: CalendarDate): CalendarDate {
  const calendar = createCalendar(CALENDAR_FOR[locale]);
  return toCalendar(anchor ?? icuToday(getLocalTimeZone()), calendar);
}

/**
 * A rule, resolved against a calendar. No React, no DOM, no `Date`.
 *
 * `anchor` exists so this is TESTABLE and so a server can resolve the same
 * range for a query it is about to run. Omitted, it is today in `locale`'s
 * calendar. Supplied, it is converted into that calendar first — passing a
 * Gregorian `CalendarDate` and getting Gregorian month boundaries back would be
 * the exact defect this file is about.
 *
 * Note `startOfMonth(anchor).subtract({ months: 1 })` rather than
 * `anchor.subtract({ months: 1 })`. Subtracting a month from ۱۴۰۵/۵/۳۱ lands in
 * Tir, which also has 31 days, so it looks fine — until Aban ۳۰ minus a month,
 * where the target month has to CLAMP and the result is a day that quietly is
 * not the one the reader meant. Normalising to the first of the month before
 * moving removes the clamp from the problem entirely.
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

/* ════════════════════════════════════════════════════════════════════════════
 * THE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

/** One named range in the panel's list. */
export interface DateSelectorPreset {
  /** Distinguishes this preset from its siblings. Never announced. */
  id: string;
  /**
   * The reader's own words for this range. REQUIRED, and deliberately not
   * derivable from `range` — see the header. It is both the visible text and
   * the accessible name of a real `<button>`.
   */
  label: string;
  /** The calendar computation this preset performs. */
  range: DateRangeRule;
}

export interface DateSelectorProps {
  /**
   * What the whole control is FOR, e.g. «بازهٔ گزارش». REQUIRED.
   *
   * Rendered `sr-only` inside the trigger, so the button's accessible name is
   * this string followed by the read-out — «بازهٔ گزارش ۱ مرداد تا ۳۱ مرداد».
   * A trigger showing only a date range is a button whose name is a date, which
   * tells a screen-reader user what it SAYS and not what it DOES.
   *
   * It is content rather than `aria-label` on purpose: WCAG's label-in-name
   * asks that the accessible name contain the visible text, and a name computed
   * from contents contains it by construction.
   */
  label: string;
  /**
   * Names the popover, e.g. «انتخاب بازهٔ تاریخ». REQUIRED.
   *
   * Base UI's `Popover.Popup` is a `role="dialog"` with no name of its own —
   * `popover.tsx` measures that and falls back to naming it by the trigger. The
   * fallback would work here, but the trigger's name changes every time the
   * reader picks a range, and a dialog whose name is its own current value is
   * a dialog that announces the answer instead of the question.
   */
  panelLabel: string;
  /** Names the list of presets, e.g. «بازه‌های آماده». REQUIRED. */
  presetsLabel: string;
  /** Names the grid, e.g. «انتخاب بازهٔ دلخواه». REQUIRED — `RangeCalendar.label`. */
  calendarLabel: string;
  /** The trigger's read-out while nothing is chosen. REQUIRED. */
  placeholder: string;
  /**
   * Builds the trigger's read-out from ALREADY-FORMATTED ends. REQUIRED.
   *
   * `to` is `undefined` while the reader has picked only the first end, which
   * is a real intermediate state `RangeCalendar` produces — not an error — so
   * the caller writes both sentences.
   *
   * ── A FUNCTION, NOT A TEMPLATE, AND THE SECOND REASON IS BIDI ────────────
   *
   * The first reason is the library's: «۱ مرداد تا ۳۱ مرداد» and "1 Mordad –
   * 31 Mordad" do not place their pieces in the same clause positions, and a
   * two-hole template forces one language into the other's grammar.
   *
   * The second is specific to a range read-out and is the same trap
   * `DataGridPagination.rangeLabel` documents at length. Two Arabic-number runs
   * with a neutral character between them — a dash, an en dash, a slash — put
   * that neutral under the PARAGRAPH's direction by the Unicode bidi algorithm,
   * so it resolves right-to-left inside an RTL paragraph and the range can
   * render with its ends swapped. Same digits, reversed, silently, and only in
   * Persian; every screenshot an English reviewer takes is correct. Handing the
   * caller the whole sentence is what lets them place a U+200F, or use a word
   * («تا») instead of a neutral, rather than this file guessing at a separator
   * it cannot see resolve.
   */
  formatRange: (from: string, to: string | undefined) => string;
  /**
   * The named ranges. Order is the reading order.
   *
   * An empty list is legal and renders no list at all — a custom-range-only
   * selector is a `RangeCalendar` in a popover, and there is no reason to
   * forbid it here.
   */
  presets?: readonly DateSelectorPreset[] | undefined;
  /**
   * How each end is formatted for the read-out. Not an announced string — an
   * `Intl` options bag — so it may have a default. It goes through `formatDate`
   * under `FORMAT_LOCALE`, so the calendar and the digits are stated rather
   * than inherited from whichever ICU build the host happens to have.
   */
  dateFormatOptions?: Intl.DateTimeFormatOptions | undefined;
  value?: CalendarDateRange | null | undefined;
  defaultValue?: CalendarDateRange | null | undefined;
  onChange?: ((value: CalendarDateRange | null) => void) | undefined;
  /**
   * Earliest and latest selectable DAY in the grid, forwarded to `RangeCalendar`.
   *
   * Days, not months — see `calendar.tsx`'s header for the version of these
   * props that rounded to a month and let a reader anchor a range on an
   * out-of-range day. PRESETS are still not clamped to them: see item 4.
   */
  minValue?: CalendarDate | undefined;
  maxValue?: CalendarDate | undefined;
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  isDisabled?: boolean | undefined;
  /** Logical only. `LumoPlacement` subtracts the physical spellings. */
  placement?: LumoPlacement;
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

  /*
   * Which preset is lit — the one the reader PRESSED, never one derived from
   * the value. Header item 2 has the argument; the short version is that
   * deriving it would recompute `today()` during render and disagree between
   * the server pass and the client one.
   */
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const [isOpen, setOpen] = useState(false);

  const commit = (next: CalendarDateRange | null) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  /*
   * The one JS `Date` in this file, at the last possible moment.
   *
   * `toPickerDate` converts through calendar FIELDS at local noon — never
   * through an instant — so no zone and no DST edge can move the day by one.
   * `calendar-datelib.ts`'s header carries the full measurement; the reason it
   * matters HERE is that this string is the only thing most readers ever see of
   * the value.
   */
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
                          // Resolved on PRESS, not during render: `today()` read
                          // at render time is a different day on a server that
                          // rendered at 23:59 than on the client that hydrated
                          // at 00:01, which is a hydration mismatch that looks
                          // like a flicker.
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
            {...(selected ? { value: selected } : {})}
            {...(selected?.from ? { defaultMonth: selected.from } : {})}
            {...(minValue ? { minValue } : {})}
            {...(maxValue ? { maxValue } : {})}
            {...(isDateUnavailable ? { isDateUnavailable } : {})}
            {...(isDisabled === true ? { isDisabled: true } : {})}
            {...(description != null ? { description } : {})}
            onChange={(next) => {
              commit(next ?? null);
              // A custom range is no longer any preset, the moment the first
              // end moves. Clearing here rather than on close means the lit row
              // and the grid never disagree while both are on screen.
              setActivePreset(null);
              // BOTH ends, or the panel stays open. A grid click that produced
              // only a `from` is the reader half way through one gesture, and
              // closing on it would make a two-click interaction impossible.
              if (next?.from && next.to) setOpen(false);
            }}
          />
        </div>
      </Popover>
    </PopoverTrigger>
  );
}
