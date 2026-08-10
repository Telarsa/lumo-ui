import { cva } from "class-variance-authority";

/**
 * Class definitions for the whole date family, in a module with NO `"use client"`.
 *
 * Same reason as `button.variants.ts`: a `cva()` exported from a client module
 * becomes a client reference in the RSC graph, and a server block that styles a
 * link with it fails to prerender. Calendar, RangeCalendar, DateField, TimeField,
 * DatePicker and DateRangePicker all share this file so that a date cell looks
 * the same whether it was reached through a picker or rendered inline.
 *
 * ── WHY THERE IS NOT ONE PHYSICAL DIRECTION IN HERE ─────────────────────────
 *
 * A calendar is the densest concentration of direction-sensitive decisions in
 * any component library: a grid that reads right-to-left, a previous/next pair
 * whose arrows must swap, and a range highlight that has to round its leading
 * corner on the side the reader starts from. Every one of those is expressed on
 * the INLINE axis here, so the whole family mirrors from `dir` alone.
 *
 * The two that would otherwise be silent:
 *
 *  1. The month nav arrows are chosen by `useLocale().direction` in the
 *     component, not by a class. An arrow is a glyph, and no utility can flip a
 *     glyph — a chevron that points to the reader's past is the correct icon in
 *     both scripts and it is a DIFFERENT icon in each.
 *  2. The range highlight rounds its corners with the logical corner utilities,
 *     so the start of a Jalali range rounds on the right where the reader's eye
 *     enters it.
 */

/** The outer surface. Sized so a 7-column grid never reflows mid-month. */
export const calendarVariants = cva(
  "flex w-fit flex-col gap-4 text-fg select-none",
);

/** The month header: previous, the month name, next. */
export const calendarHeaderVariants = cva(
  "flex items-center justify-between gap-2 px-1",
);

/**
 * The month/year heading.
 *
 * Its text comes from React Aria's own `DateFormatter`, so under the persian
 * calendar it reads «۱۴۰۵ مرداد» with no work here. Deliberately NOT given
 * tabular figures: `theme.css` turns those off under the Persian language for
 * the whole document, and a utility on this element would out-specify it.
 */
export const calendarHeadingVariants = cva(
  "flex-1 text-center text-sm font-medium text-fg",
);

/** A previous/next month button. Sized to the touch floor at every breakpoint. */
export const calendarNavButtonVariants = cva(
  "flex h-control-sm w-control-sm shrink-0 cursor-pointer items-center justify-center " +
    "rounded-md text-fg-muted transition-colors " +
    "data-hovered:bg-surface-hover data-hovered:text-fg " +
    "data-pressed:bg-surface-sunken " +
    "data-disabled:pointer-events-none data-disabled:opacity-40 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

export const calendarGridVariants = cva("border-collapse");

/**
 * A weekday header cell.
 *
 * React Aria supplies the abbreviations from the locale, which under `fa-IR`
 * are ش ی د س چ پ ج — one letter each. The width is fixed to the day cell's so
 * the columns line up in a script whose weekday letters are far narrower than
 * `Mon`/`Tue`.
 */
export const calendarHeaderCellVariants = cva(
  "w-9 pb-1 text-center text-xs font-normal text-fg-subtle",
);

/**
 * One day.
 *
 * Every visual state is read off React Aria's own attributes rather than
 * mirrored in React state. `data-outside-month` is why the trailing days of
 * Tir and the leading days of Shahrivar can be shown without being mistaken for
 * Mordad — a distinction Jalali makes conspicuous, because month lengths change
 * inside the year (31,31,31,31,31,31,30,30,30,30,30,29-or-30).
 */
export const calendarCellVariants = cva(
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-sm " +
    "text-fg outline-none transition-colors " +
    "data-hovered:bg-surface-hover " +
    "data-pressed:bg-surface-sunken " +
    "data-selected:bg-accent data-selected:text-accent-fg " +
    "data-disabled:pointer-events-none data-disabled:text-fg-subtle " +
    "data-unavailable:pointer-events-none data-unavailable:text-fg-subtle " +
    "data-unavailable:line-through " +
    "data-outside-month:text-fg-subtle data-outside-month:opacity-60 " +
    "data-outside-visible-range:invisible data-outside-visible-range:pointer-events-none " +
    "data-today:font-semibold data-today:text-accent " +
    "data-today:data-selected:text-accent-fg",
);

/**
 * A day inside a selected range.
 *
 * The middle of a range is a continuous band, so the cell loses its own radius
 * and the two ends round on the logical corners: the start rounds on the side
 * the reader enters from, which is the right in Persian and the left in
 * English, from the same class string.
 */
export const rangeCalendarCellVariants = cva(
  "flex h-9 w-9 cursor-pointer items-center justify-center text-sm " +
    "text-fg outline-none transition-colors rounded-none " +
    "data-hovered:bg-surface-hover " +
    "data-selected:bg-surface-sunken " +
    "data-selected:data-selection-start:rounded-ss-md data-selected:data-selection-start:rounded-es-md " +
    "data-selected:data-selection-end:rounded-se-md data-selected:data-selection-end:rounded-ee-md " +
    "data-selected:data-selection-start:bg-accent data-selected:data-selection-start:text-accent-fg " +
    "data-selected:data-selection-end:bg-accent data-selected:data-selection-end:text-accent-fg " +
    "data-disabled:pointer-events-none data-disabled:text-fg-subtle " +
    "data-unavailable:pointer-events-none data-unavailable:text-fg-subtle " +
    "data-unavailable:line-through " +
    "data-outside-month:text-fg-subtle data-outside-month:opacity-60 " +
    "data-outside-visible-range:invisible data-outside-visible-range:pointer-events-none " +
    "data-today:font-semibold",
);

/**
 * The box a set of date segments sits in.
 *
 * `w-fit` rather than a fixed width: a Jalali year is four digits and a month
 * is one or two, and the Persian digits are narrower than the Latin ones, so a
 * width tuned on an English page leaves a visible gap on a Persian one.
 *
 * Hover and focus here are CSS pseudo-classes, NOT React Aria attributes, and
 * that is a measured exception to the house rule rather than a lapse. RAC's
 * `DateInput` renders exactly four state attributes — invalid, disabled,
 * readonly, required — and no hover or focus attribute at all (verified in
 * `DateField.mjs` and in rendered output). `Group`, which the pickers use, does
 * emit both, so `datePickerGroupVariants` below is written the normal way. The
 * rule is "do not mirror state React already tracks"; where React Aria tracks
 * nothing, the browser's own pseudo-class is the honest source.
 */
export const dateInputVariants = cva(
  "flex w-fit min-w-0 items-center rounded-md border border-border-control bg-surface " +
    "text-fg transition-colors " +
    "hover:border-border-strong " +
    "focus-within:border-accent " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
      size: {
        sm: "h-control-sm px-2 text-sm",
        md: "h-control-md px-3 text-sm",
        lg: "h-control-lg px-3 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * One editable segment — a year, a month, a day, an hour.
 *
 * `data-placeholder` is the empty state React Aria marks before a value exists.
 * The placeholder TEXT is the locale's own segment name («سال», «ماه», «روز»)
 * and comes from the patched `datepicker` bundle, not from anything here.
 *
 * `text-center` and not a start/end alignment: a segment is a fixed-width slot
 * inside a formatted date, and centring is the only alignment that does not
 * change meaning when the surrounding literal separators mirror.
 *
 * Deliberately NO tabular-figure utility, for the same reason `num.tsx` omits
 * one: `theme.css` resets `font-variant-numeric` to normal under the Persian
 * language because tabular figures are a Latin-typography idea, and a utility
 * here would out-specify the reset and re-enable exactly what the theme turned
 * off for the arabext digits.
 */
export const dateSegmentVariants = cva(
  "rounded-sm px-0.5 text-center outline-none transition-colors " +
    "data-focused:bg-accent data-focused:text-accent-fg " +
    "data-placeholder:text-fg-subtle " +
    "data-invalid:text-critical " +
    "data-disabled:text-fg-subtle",
);

/** The literal separators React Aria emits between segments. */
export const dateLiteralVariants = cva("px-0.5 text-fg-subtle");

/** The group that fuses a date input with its calendar trigger. */
export const datePickerGroupVariants = cva(
  "flex w-fit items-center gap-1 rounded-md border border-border-control bg-surface " +
    "text-fg transition-colors " +
    "data-hovered:border-border-strong " +
    "data-focus-within:border-accent " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
      size: {
        sm: "h-control-sm ps-2 pe-1 text-sm",
        md: "h-control-md ps-3 pe-1 text-sm",
        lg: "h-control-lg ps-3 pe-1 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** The button that opens the calendar. */
export const datePickerTriggerVariants = cva(
  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm " +
    "text-fg-muted transition-colors " +
    "data-hovered:bg-surface-hover data-hovered:text-fg " +
    "data-pressed:bg-surface-sunken " +
    "data-disabled:pointer-events-none data-disabled:opacity-40 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

/** The dash between a range's two date inputs. */
export const dateRangeSeparatorVariants = cva("px-1 text-fg-subtle");
