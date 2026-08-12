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
 *  1. The month nav arrows are chosen by `direction(locale)` in the component,
 *     not by a class. An arrow is a glyph, and no utility can flip a
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

/**
 * The month header row: previous, the month name, next.
 *
 * ── WHY THE NAV IS POSITIONED OVER THIS ROW RATHER THAN INSIDE IT ───────────
 *
 * React Aria's `CalendarHeader` was ONE element containing all three, so a
 * flex row with `justify-between` put the chevrons at the ends and the month in
 * the middle. react-day-picker's DOM is not that shape: `nav` is a SIBLING of
 * `month`, emitted BEFORE it, so the same classes produced a row of chevrons
 * floating above a separately-centred caption — which is what the first render
 * after the migration actually looked like.
 *
 * The fix is the standard one for this markup: `months` becomes the positioning
 * context, `nav` is stretched across the top of it, and the caption reserves
 * room at both ends with LOGICAL padding so the month name cannot slide under a
 * chevron in either direction. `px-9` is one control width plus the gap.
 */
export const calendarHeaderVariants = cva(
  "flex h-control-sm items-center justify-center px-9",
);

/**
 * The stack that owns the month(s) — and the nav's positioning context.
 *
 * `relative` is load-bearing: `calendarNavVariants` below is absolute, and
 * without a positioned ancestor it would anchor to the page.
 */
export const calendarMonthsVariants = cva("relative flex flex-col gap-4");

/**
 * The previous/next pair, stretched across the caption row.
 *
 * `inset-x-0` and not `left-0 right-0` — symmetric, so there is nothing to
 * mirror; and `justify-between` names no side, so the chevrons land at the
 * reader's own start and end from `dir` alone. WHICH GLYPH goes in which button
 * is still a component decision, because no class can flip a glyph — see
 * `calendarChevron` in `calendar.tsx`.
 */
export const calendarNavVariants = cva(
  "absolute inset-x-0 top-0 flex h-control-sm items-center justify-between",
);

/**
 * The month/year heading.
 *
 * Its text comes from `formatters.formatCaption` in `calendar-datelib.ts`, which
 * asks `@internationalized/date`, so under the persian calendar it reads
 * «۱۴۰۵ مرداد» with no work here. Deliberately NOT given
 * tabular figures: `theme.css` turns those off under the Persian language for
 * the whole document, and a utility on this element would out-specify it.
 */
export const calendarHeadingVariants = cva(
  // No `flex-1`: the caption row centres it, and stretching it made it push
  // against the absolutely-positioned nav rather than sit between the buttons.
  "text-sm font-medium text-fg",
);

/**
 * A previous/next month button. Sized to the touch floor at every breakpoint.
 *
 * ── THE PRESS USED TO BE INVISIBLE ON THE LIGHT THEME ───────────────────────
 *
 * This string carried `hover:bg-surface-hover` beside `active:bg-surface-sunken`,
 * and on the light theme `tokens.css` resolves BOTH `--lumo-sys-surface-hover`
 * and `--lumo-sys-surface-sunken` to the same `--lumo-ref-neutral-100`
 * (oklch 0.970). So a pressed chevron painted the pixel it was already painting:
 * a state written, reviewed and shipped that renders nothing. The same collision
 * `toggle.variants.ts` and `sidebar.variants.ts` record, in a third place.
 *
 * The fix is a different HUE rather than another step on the neutral ramp —
 * `bg-accent/10` + `text-accent`, the pairing `sidebar.variants.ts`,
 * `date-selector.variants.ts` and `badge.tsx` already use — because that ramp is
 * where the collision lives and where the next theme edit can recreate it.
 *
 * `hover:active:` is stated as well as `active:`. A mouse press arrives WITH the
 * pointer, so `hover:bg-surface-hover` (0,2,0) and `active:bg-accent/10` (0,2,0)
 * are the same specificity and which one paints would be decided by the order
 * Tailwind emits its variants in. `.x:hover:active` is (0,3,0) and decides it.
 * The bare `active:` is what a touch press gets, where `:hover` never fires.
 */
export const calendarNavButtonVariants = cva(
  "flex h-control-sm w-control-sm shrink-0 cursor-pointer items-center justify-center " +
    "rounded-md text-fg-muted transition-colors " +
    "hover:bg-surface-hover hover:text-fg " +
    "active:bg-accent/10 active:text-accent " +
    "hover:active:bg-accent/10 hover:active:text-accent " +
    "disabled:pointer-events-none disabled:opacity-40 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

/*
 * ════════════════════════════════════════════════════════════════════════════
 * THE CAPTION DROPDOWNS
 *
 * ── THE MARKUP THESE THREE CLASSES LAND ON, READ OUT OF `Dropdown.js` ───────
 *
 * react-day-picker does NOT render a styled listbox. It renders a real native
 * `<select>` and a separate visible `<span>`, one on top of the other
 * (`dist/esm/components/Dropdown.js`, v10.0.1, reformatted from the emitted
 * `createElement` calls):
 *
 *     <span class={dropdown_root} data-disabled=…>
 *       <select class={dropdown} aria-label=… value=…>…options…</select>
 *       <span class={caption_label} aria-hidden="true">
 *         «مرداد»<Chevron orientation="down" />
 *       </span>
 *     </span>
 *
 * and the pair of them sits inside `<div class={dropdowns}>` (`DropdownNav`),
 * beside a visually-hidden `<span role="status">` carrying the full caption.
 *
 * Two consequences drive every class below, and both are about the two elements
 * AGREEING:
 *
 *  1. The `<span>` is `aria-hidden` and the `<select>` is the only thing a
 *     screen reader or a keyboard ever reaches. So the `<select>` must be
 *     transparent rather than `display:none`/`visibility:hidden`/`w-0` —
 *     each of which removes it from the accessibility tree or from hit
 *     testing, which is the whole control.
 *  2. A `<select>` in flow is as wide as its WIDEST option. Left in flow the
 *     year control would size itself to the longest year string and the month
 *     control to «اردیبهشت», so the box a reader clicks would be wider than
 *     the caption they see, in both scripts and worse in the RTL one where
 *     the overflow lands on the leading edge. Taking it out of flow with
 *     `absolute inset-0` makes the hit area EXACTLY the visible label, with
 *     no width to keep in sync.
 *
 * ── WHY THERE IS NOTHING TO MIRROR HERE ─────────────────────────────────────
 *
 * `inset-0` is symmetric and `gap` names no side, so nothing in this block has
 * a direction to get wrong. The one direction-sensitive part of a dropdown is
 * its chevron, and that is a GLYPH — `calendarChevron` in `calendar.tsx` picks
 * it, because no utility can flip one.
 */

/** The row that holds the month and year controls. */
export const calendarDropdownsVariants = cva("flex items-center gap-1");

/**
 * The box one control occupies: the visible caption, with the `<select>` over it.
 *
 * `relative` is load-bearing — it is what `calendarDropdownVariants`' `inset-0`
 * resolves against; without it the `<select>` would stretch over the page.
 *
 * ── THE FOCUS RING IS ON THIS ELEMENT, NOT ON THE THING THAT HAS FOCUS ──────
 *
 * Focus lands on the `<select>`, and the `<select>` is `opacity-0` — an outline
 * on it is drawn at zero alpha, so a keyboard reader tabbing into the caption
 * would see NOTHING move. `has-[select:focus-visible]:` puts the ring on the
 * parent that is actually painted. This is the same reasoning
 * `calendarDayButtonVariants` states in the other direction: whichever element
 * is painted owns the appearance, and here that is never the focused one.
 *
 * `[&>span]:` reaches the caption span because it is react-day-picker's element,
 * not ours — it carries `caption_label`, which is shared with the label layout,
 * where `inline-flex` would be wrong. Scoping it to a direct child of a dropdown
 * root keeps the chevron on the text's baseline without changing the caption of
 * a calendar that has no dropdowns at all.
 */
export const calendarDropdownRootVariants = cva(
  "relative inline-flex h-control-sm items-center rounded-md px-2 " +
    "cursor-pointer text-sm font-medium text-fg transition-colors " +
    "hover:bg-surface-hover " +
    "has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 " +
    "has-[select:focus-visible]:outline-accent " +
    "data-disabled:pointer-events-none data-disabled:opacity-40 " +
    "[&>span]:inline-flex [&>span]:items-center [&>span]:gap-1 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:text-fg-muted",
);

/**
 * The real `<select>`, transparent and exactly the size of the caption.
 *
 * `opacity-0` and NOT `sr-only`, `hidden` or `w-0`: this element is the control.
 * `appearance-none` removes the platform arrow, which would otherwise widen the
 * intrinsic box the browser reserves inside a control the reader cannot see.
 *
 * ── THE ONE RULE THAT COULD HAVE WON INSTEAD, CHECKED IN THE BUILT CSS ──────
 *
 * Tailwind's preflight resets form controls with a TYPE selector that names
 * `opacity` explicitly — measured in the site's emitted stylesheet
 * (`apps/website/out/_next/static/chunks/*.css`, byte 7891):
 *
 *     button,input,select,optgroup,textarea { … opacity:1; … }
 *
 * `.opacity-0` is (0,1,0) against that rule's (0,0,1) and is emitted 38KB later
 * besides, so it wins on specificity and again on order. This is checked rather
 * than assumed because "a utility beats a reset" is a habit, not a rule: a
 * selector this repo authored on the element itself would tie, and then emission
 * order — which nothing here controls — would decide whether the control is
 * invisible or painted over its own caption.
 */
export const calendarDropdownVariants = cva(
  "absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0",
);

export const calendarGridVariants = cva("border-collapse");

/**
 * A weekday header cell.
 *
 * react-day-picker supplies the abbreviations through `formatters.formatWeekdayName`,
 * which `calendar-datelib.ts` points at `@internationalized/date` — under `fa-IR`
 * that is ش ی د س چ پ ج, one letter each. The width is fixed to the day cell's so
 * the columns line up in a script whose weekday letters are far narrower than
 * `Mon`/`Tue`.
 */
export const calendarHeaderCellVariants = cva(
  "w-9 pb-1 text-center text-xs font-normal text-fg-subtle",
);

/**
 * One day — the `<td role="gridcell">`, which is where every state lives.
 *
 * ── REWRITTEN FOR REACT-DAY-PICKER'S ATTRIBUTE SET, WHICH IS A SMALLER ONE ──
 *
 * Every class here used to be keyed on REACT ARIA's names. Read out of
 * `DayPicker.js` rather than off the docs, v10 emits a different, smaller set on
 * the day cell:
 *
 *     data-day  data-month  data-selected  data-disabled
 *     data-hidden  data-outside  data-focused  data-today
 *
 * Three names the old file relied on are simply gone, and each needed a
 * different answer rather than a rename:
 *
 *   data-hovered              → `hover:`. React Aria tracked hover in JS because
 *                               it unified pointer and touch; RDP does not, and
 *                               the browser's own pseudo-class is then the
 *                               honest source. Same call `dateInputVariants`
 *                               already documents.
 *   data-unavailable          → `data-disabled`. RDP has ONE disabled concept,
 *                               so "unavailable" and "disabled" are no longer
 *                               distinguishable in CSS. The strike-through that
 *                               used to mark unavailable-but-in-range days is
 *                               therefore gone; keeping it would have applied it
 *                               to out-of-range days too, which reads as an
 *                               error rather than as a boundary.
 *   data-outside-visible-range→ `data-hidden`, which RDP sets on days it renders
 *                               but does not show.
 *
 * `data-selection-start`/`-end` have no equivalent AT ALL: RDP delivers range
 * ends as MODIFIER CLASS NAMES joined into this element's `className`, which is
 * why `rangeCalendarSelectionVariants` below is a map of class strings rather
 * than more attribute selectors.
 *
 * `data-outside` is why the trailing days of Tir and the leading days of
 * Shahrivar can be shown without being mistaken for Mordad — a distinction
 * Jalali makes conspicuous, because month lengths change inside the year
 * (31,31,31,31,31,31,30,30,30,30,30,29-or-30).
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
 * The `<button>` inside the day cell.
 *
 * Deliberately carries NO colour of its own. The cell above is the painted
 * surface, so the button is a transparent full-size hit area — which keeps one
 * element responsible for the day's appearance instead of two that can disagree
 * about what "selected" looks like. It owns exactly one thing the cell cannot:
 * the focus ring, because focus lands on the button.
 */
export const calendarDayButtonVariants = cva(
  "h-full w-full cursor-pointer rounded-md bg-transparent text-inherit " +
    "outline-none disabled:pointer-events-none disabled:cursor-not-allowed",
);

/**
 * A day inside a selected range.
 *
 * The middle of a range is a continuous band, so a cell in it loses its own
 * radius and the two ends round on the LOGICAL corners: the start rounds on the
 * side the reader enters from, which is the right in Persian and the left in
 * English, from the same class string.
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
 * The range's three selection states, as CLASS NAMES rather than attributes.
 *
 * This is the shape react-day-picker actually offers. `getClassNamesForModifiers`
 * looks each active modifier up in the `classNames` map and JOINS the result
 * onto the day cell's `className`, so `range_start` is a class this file
 * supplies and never an attribute it can select on. That is the single biggest
 * difference from the React Aria build and the reason the variants had to be
 * rewritten rather than renamed.
 *
 * Returned as a plain object so `Calendar` and `RangeCalendar` spread the same
 * one into `classNames` — a second copy is how the two ends of a range come to
 * round differently.
 */
export function rangeCalendarSelectionVariants(): Record<string, string> {
  return {
    /*
     * ── THE BAND WAS THE HOVER FILL, MEASURED ─────────────────────────────
     *
     * This was `bg-surface-sunken`, and `rangeCalendarCellVariants` above
     * carries `hover:bg-surface-hover`. On the light theme `tokens.css`
     * resolves both tokens to `--lumo-ref-neutral-100` — so every day inside a
     * selected range wore exactly the fill an UNSELECTED day wears under the
     * cursor. A reader could not tell a chosen span from the day their mouse
     * happened to be over, and hovering a middle day changed nothing at all.
     *
     * The middle of an accent range is now a tint of the accent its two ends
     * are drawn in, which is a different hue rather than another step on the
     * neutral ramp — the fix `sidebar.variants.ts` and `toggle.variants.ts`
     * record for the identical collision. `hover:bg-accent/15` holds the band
     * under the pointer, the same way the two ends already hold theirs.
     */
    range_middle: "bg-accent/15 hover:bg-accent/15",
    range_start:
      "bg-accent text-accent-fg rounded-ss-md rounded-es-md " +
      "hover:bg-accent",
    range_end:
      "bg-accent text-accent-fg rounded-se-md rounded-ee-md " +
      "hover:bg-accent",
    // No `selected` entry, deliberately. In `mode="range"` a one-day range sets
    // range_start AND range_end at once, so both corner pairs apply and the cell
    // rounds on all four without a rule of its own — and a `selected` class here
    // would also hit every middle day and break the band.
  };
}

/**
 * The box a set of date segments sits in.
 *
 * `w-fit` rather than a fixed width: a Jalali year is four digits and a month
 * is one or two, and the Persian digits are narrower than the Latin ones, so a
 * width tuned on an English page leaves a visible gap on a Persian one.
 *
 * Hover and focus here are CSS pseudo-classes, and there is no longer any engine
 * they could be attributes of: `date-input.tsx` renders this element itself and
 * writes only the four states it owns — `data-invalid`, `data-disabled`,
 * `data-placeholder`, `data-focused`. The rule is "do not mirror state the
 * engine already tracks"; where nothing tracks it, the browser's own
 * pseudo-class is the honest source, and it needs no JavaScript to be correct
 * before hydration. `datePickerGroupVariants` below says the same thing about
 * the element that used to be React Aria's `<Group>`.
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
 * `data-placeholder` is the empty state `date-input.tsx` writes before a value
 * exists. The placeholder TEXT is the segment's own name («سال», «ماه», «روز»),
 * and it comes from `strings.ts` — authored per locale, because no API produces
 * the NAME of a date part. It used to come from a patched react-aria bundle.
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

/** The literal separators the engine emits between segments. */
export const dateLiteralVariants = cva("px-0.5 text-fg-subtle");

/** The group that fuses a date input with its calendar trigger. */
export const datePickerGroupVariants = cva(
  // `hover:`/`focus-within:` and not `data-hovered`/`data-focus-within`: this
  // group was React Aria's `<Group>`, which tracked both in JS. It is a plain
  // element now, so the browser's own pseudo-classes are the honest source —
  // the same exception `dateInputVariants` documents just above.
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
 * The button that opens the calendar.
 *
 * Same press fix, same measurement, as `calendarNavButtonVariants` above: the
 * `active:bg-surface-sunken` this used to carry was the light theme's
 * `hover:bg-surface-hover` fill exactly, so the press painted nothing.
 */
export const datePickerTriggerVariants = cva(
  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm " +
    "text-fg-muted transition-colors " +
    "hover:bg-surface-hover hover:text-fg " +
    "active:bg-accent/10 active:text-accent " +
    "hover:active:bg-accent/10 hover:active:text-accent " +
    "disabled:pointer-events-none disabled:opacity-40 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

/** The dash between a range's two date inputs. */
export const dateRangeSeparatorVariants = cva("px-1 text-fg-subtle");

/**
 * The block under the grid — a description or an error.
 *
 * ── `w-0 min-w-full` IS NOT A HACK, IT IS THE ONLY CORRECT ANSWER HERE ──────
 *
 * The calendar's outer wrapper is `w-fit`, which sizes to the widest child's
 * MAX-CONTENT. A description is a sentence, and a sentence's max-content is the
 * whole sentence on one line — so a one-line help text made the wrapper several
 * hundred pixels wider than the grid, and the grid then sat at the start of it.
 * On the website that read as "the calendar is not centred"; it was centred, in
 * a box the description had silently inflated.
 *
 * `w-0` removes the text from that intrinsic-width calculation entirely, and
 * `min-w-full` renders it at the resolved width of the container the GRID
 * decided. The pair is the standard CSS answer to "participate in layout but
 * not in sizing", and every alternative is worse: a fixed `max-w` hard-codes
 * seven cell widths into a class, and `items-start` centres nothing.
 */
export const calendarFooterVariants = cva("w-0 min-w-full");
