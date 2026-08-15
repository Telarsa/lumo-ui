import { cva } from "class-variance-authority";

/**
 * Class definitions for the whole date family, in a module with NO `"use client"`,
 * so a server block can style with them (a `cva()` from a client module is a client
 * reference in the RSC graph). Not one physical direction in here: the family mirrors
 * from `dir` alone; nav arrows are chosen by `direction(locale)` in the component
 * because no class can flip a glyph, and range corners use logical corner utilities.
 */

/** The outer surface. Sized so a 7-column grid never reflows mid-month. */
export const calendarVariants = cva(
  "flex w-fit flex-col gap-4 text-fg select-none",
);

/**
 * The month header row. react-day-picker emits `nav` as a SIBLING of `month`, so
 * `months` is the positioning context, `nav` is stretched over the caption row, and the
 * caption reserves LOGICAL padding (`px-9` = one control width plus the gap) at both ends.
 */
export const calendarHeaderVariants = cva(
  "flex h-control-sm items-center justify-center px-9",
);

/** The stack that owns the month(s) — and the nav's positioning context (`relative` is load-bearing). */
export const calendarMonthsVariants = cva("relative flex flex-col gap-4");

/**
 * The previous/next pair, stretched across the caption row. `inset-x-0` is symmetric and
 * `justify-between` names no side; WHICH glyph goes where is `calendarChevron`'s job.
 */
export const calendarNavVariants = cva(
  "absolute inset-x-0 top-0 flex h-control-sm items-center justify-between",
);

/**
 * The month/year heading. Text comes from `formatters.formatCaption`. Deliberately NOT
 * given tabular figures: `theme.css` turns those off under Persian for the whole document.
 */
export const calendarHeadingVariants = cva(
  // No `flex-1`: stretching pushed it against the absolutely-positioned nav.
  "text-sm font-medium text-fg",
);

/**
 * A previous/next month button. The press is `active:translate-y-px`, the library's one
 * treatment: on the light theme `surface-hover` and `surface-sunken` resolve to the same
 * token, so a fill press painted nothing (see `button.variants.ts`).
 */
export const calendarNavButtonVariants = cva(
  "flex h-control-sm w-control-sm shrink-0 cursor-pointer items-center justify-center " +
    "rounded-md text-fg-muted transition-colors " +
    "hover:bg-surface-hover hover:text-fg " +
    "active:translate-y-px " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

/**
 * @deprecated Lumo Calendar now adapts caption navigation to `SelectField`.
 * Retained for copied registries that styled react-day-picker's native parts.
 */
export const calendarDropdownsVariants = cva("flex items-center gap-1");

/** @deprecated Compatibility styling for react-day-picker's former native root. */
export const calendarDropdownRootVariants = cva(
  "lumo-proxy-focus " +
    "relative inline-flex h-control-sm items-center rounded-md px-2 " +
    "cursor-pointer text-sm font-medium text-fg transition-colors " +
    "hover:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&>span]:inline-flex [&>span]:items-center [&>span]:gap-1 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:text-fg-muted",
);

/** @deprecated Compatibility styling for react-day-picker's former native control. */
export const calendarDropdownVariants = cva(
  "absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0",
);

export const calendarGridVariants = cva("border-collapse");

/**
 * A weekday header cell. Width fixed to the day cell's so columns line up in a script
 * whose weekday letters (ش ی د س چ پ ج) are far narrower than `Mon`/`Tue`.
 */
export const calendarHeaderCellVariants = cva(
  "w-9 pb-1 text-center text-xs font-normal text-fg-subtle",
);

/**
 * One day — the `<td role="gridcell">`, where every state lives. Keyed on
 * react-day-picker's attribute set (`data-selected data-disabled data-hidden data-outside
 * data-focused data-today`): hover is the browser's `hover:`, "unavailable" and "disabled"
 * are one concept, and range ends arrive as CLASS NAMES (see
 * `rangeCalendarSelectionVariants`). `data-outside` matters for Jalali, where month
 * lengths change inside the year.
 */
export const calendarCellVariants = cva(
  "h-9 w-9 p-0 text-center align-middle text-sm text-fg transition-colors " +
    "rounded-md " +
    "hover:bg-surface-hover " +
    "data-selected:bg-accent data-selected:text-accent-fg " +
    "data-selected:hover:bg-accent " +
    "data-disabled:pointer-events-none data-disabled:text-fg-subtle " +
    "data-outside:text-fg-subtle data-outside:opacity-60 " +
    "data-hidden:invisible data-hidden:pointer-events-none " +
    "data-today:font-semibold data-today:text-accent " +
    "data-today:data-selected:text-accent-fg",
);

/**
 * The `<button>` inside the day cell. Carries NO colour of its own — the cell is the
 * painted surface — and owns only the focus ring, because focus lands on the button.
 */
export const calendarDayButtonVariants = cva(
  "h-full w-full cursor-pointer rounded-md bg-transparent text-inherit " +
    // No `disabled:cursor-not-allowed`: `pointer-events-none` means the cursor never resolves here.
    "outline-none disabled:pointer-events-none",
);

/**
 * A day inside a selected range: the middle loses its radius and the two ends round on
 * the LOGICAL corners from the same class string.
 */
export const rangeCalendarCellVariants = cva(
  "h-9 w-9 p-0 text-center align-middle text-sm text-fg transition-colors " +
    "rounded-none " +
    "hover:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:text-fg-subtle " +
    "data-outside:text-fg-subtle data-outside:opacity-60 " +
    "data-hidden:invisible data-hidden:pointer-events-none " +
    "data-today:font-semibold",
);

/**
 * The range's three selection states, as CLASS NAMES rather than attributes: react-day-picker
 * JOINS modifier classes onto the day cell's `className`. Returned as one object so
 * `Calendar` and `RangeCalendar` spread the same map.
 */
export function rangeCalendarSelectionVariants(): Record<string, string> {
  return {
    // An accent tint, not `bg-surface-sunken`: on the light theme that equals the hover fill,
    // so a selected span was indistinguishable from a hovered day.
    range_middle: "bg-accent/15 hover:bg-accent/15",
    range_start:
      "bg-accent text-accent-fg rounded-ss-md rounded-es-md " +
      "hover:bg-accent",
    range_end:
      "bg-accent text-accent-fg rounded-se-md rounded-ee-md " +
      "hover:bg-accent",
    // No `selected` entry: a one-day range sets range_start AND range_end, so all four
    // corners round; a `selected` class would also hit every middle day.
  };
}

/**
 * The box a set of date segments sits in. `w-fit`, because Persian digits are narrower
 * than Latin. Hover/focus are CSS pseudo-classes: `date-input.tsx` renders this element
 * itself and no engine tracks those states, so the browser is the honest source.
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
 * One editable segment — a year, a month, a day, an hour. `data-placeholder` is the empty
 * state; its TEXT is the segment's own name from `strings.ts`. `text-center` because a
 * segment is a fixed-width slot; NO tabular-figure utility, since `theme.css` resets it under Persian.
 */
export const dateSegmentVariants = cva(
  "rounded-sm px-0.5 text-center outline-none transition-colors " +
    "data-focused:bg-accent data-focused:text-accent-fg " +
    "data-placeholder:text-fg-subtle " +
    "data-invalid:text-critical " +
    "data-disabled:text-fg-subtle",
);

/** The literal separators the engine emits between segments. */
export const dateLiteralVariants = cva("px-0.5 text-fg-subtle");

/** The group that fuses a date input with its calendar trigger. */
export const datePickerGroupVariants = cva(
  // `hover:`/`focus-within:`: this is a plain element now, so the browser's pseudo-classes are the source.
  "flex w-fit items-center gap-1 rounded-md border border-border-control bg-surface " +
    "text-fg transition-colors " +
    "hover:border-border-strong " +
    "focus-within:border-accent " +
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

/**
 * The button that opens the calendar. Same press treatment as the nav buttons, plus
 * button's `not-aria-[haspopup]` carve-out: the popover anchors to this box, and nudging
 * it while held would jitter the panel as it appears.
 */
export const datePickerTriggerVariants = cva(
  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm " +
    "text-fg-muted transition-colors " +
    "hover:bg-surface-hover hover:text-fg " +
    "active:not-aria-[haspopup]:translate-y-px " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

/** The dash between a range's two date inputs. */
export const dateRangeSeparatorVariants = cva("px-1 text-fg-subtle");

/**
 * The block under the grid — a description or an error. `w-0 min-w-full` removes the
 * sentence from the `w-fit` wrapper's intrinsic-width calculation (a one-line help text
 * otherwise inflates the box and the grid reads as off-centre) while rendering at the
 * width the GRID decided.
 */
export const calendarFooterVariants = cva("w-0 min-w-full");
