import { cva, type VariantProps } from "class-variance-authority";

/**
 * The event calendar's chrome, as cva. Directive-free so a server component can call
 * it, and so `shadcn migrate rtl` (which walks `cva()`'s first argument) sees every class.
 *
 * The densest direction-sensitive layout in the library, and it names NO physical
 * inline direction: separators are `gap-px` over `bg-border` (gaps have no sides), the
 * time gutter's rule is `border-e` (the one handed edge), overlap offsets are logical
 * inline style (`insetInlineStart`/`inlineSize`, computed from clock time; `top`/`height`
 * are block-axis), and titles use `text-start`. The focus ring lives in `theme.css`.
 */

export const eventCalendarVariants = cva("flex w-full flex-col gap-3");

export const eventCalendarToolbarVariants = cva(
  // `justify-between` rather than `ms-auto`: two clusters, ordered by `dir`, neither edge named.
  "flex flex-wrap items-center justify-between gap-2",
);

export const eventCalendarNavVariants = cva("flex items-center gap-1");

export const eventCalendarNavButtonVariants = cva(
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md " +
    "border border-border-control bg-surface text-fg transition-colors " +
    "hover:border-border-strong hover:bg-surface-hover " +
    // The press: arrows are tapped repeatedly, and on touch the hover never fires.
    "active:translate-y-px " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

/** The period read-out: «مرداد ۱۴۰۵», or a week's two ends joined by the caller. */
export const eventCalendarPeriodVariants = cva("text-sm font-medium text-fg");

export const eventCalendarViewSwitchVariants = cva(
  "flex items-center gap-0.5 rounded-md border border-border bg-surface-sunken p-0.5",
);

export const eventCalendarViewButtonVariants = cva(
  "cursor-pointer rounded-sm px-2.5 py-1 text-sm text-fg-muted transition-colors " +
    "hover:text-fg",
  {
    variants: {
      // Driven from the same boolean that writes `aria-pressed`.
      /** Marks the selected view. */
      active: {
        true: "bg-surface font-medium text-fg shadow-raised",
        false: "",
      },
    },
    defaultVariants: { active: false },
  },
);

export type EventCalendarViewButtonVariantProps = VariantProps<
  typeof eventCalendarViewButtonVariants
>;

/**
 * Seven columns, separated by GAPS rather than borders. `role="row"` elements inside carry
 * `contents`, so the seven columns are ONE grid and rows exist only for a screen reader.
 */
export const eventCalendarGridVariants = cva(
  "grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border",
);

export const eventCalendarWeekdayVariants = cva(
  "bg-surface-sunken px-2 py-1.5 text-center text-xs font-medium text-fg-muted",
);

export const eventCalendarDayCellVariants = cva(
  "flex min-h-24 cursor-default flex-col gap-1 bg-surface p-1.5 text-start transition-colors",
  {
    variants: {
      /** A day from a neighbouring month, SHOWN rather than blanked — Jalali month lengths change inside a year. */
      outside: { true: "bg-surface-sunken/60 text-fg-subtle", false: "" },
      /** Marks the reader's current day. */
      today: { true: "bg-accent/5", false: "" },
    },
    defaultVariants: { outside: false, today: false },
  },
);

export type EventCalendarDayCellVariantProps = VariantProps<typeof eventCalendarDayCellVariants>;

export const eventCalendarDayNumberVariants = cva(
  "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
  {
    variants: {
      today: { true: "bg-accent font-medium text-fg-on-accent", false: "text-fg-muted" },
    },
    defaultVariants: { today: false },
  },
);

/** The gutter column plus seven day columns. `auto` for the gutter so an `Intl`-sized hour label decides its width. */
export const eventCalendarWeekGridVariants = cva(
  // ONE scroller for the whole body: a separate gutter scroller drifts. The header is `sticky` inside it.
  "grid max-h-[34rem] grid-cols-[auto_repeat(7,minmax(0,1fr))] overflow-y-auto " +
    "rounded-lg border border-border bg-surface",
);

/** The gutter's own cell. Its rule is the one handed edge in the file — rule 2. */
export const eventCalendarGutterVariants = cva(
  "flex flex-col border-e border-border bg-surface-sunken",
);

/** One hour's label. `h-12` × 24 is the `h-[72rem]` the day columns are, so nothing measures anything. */
export const eventCalendarHourVariants = cva(
  "block h-12 px-2 text-end text-[0.625rem] leading-none text-fg-subtle",
);

/** The all-day strip: a fixed height so the gutter's caption lines up with it. */
export const eventCalendarAllDayVariants = cva(
  "flex h-14 flex-col gap-0.5 overflow-hidden border-b border-border p-1",
);

/** The gutter's «تمام‌روز» caption, the same height as the strip beside it. */
export const eventCalendarAllDayCaptionVariants = cva(
  "flex h-14 items-start border-b border-border px-2 py-1 text-[0.625rem] leading-tight text-fg-subtle",
);

/** A day column in the week view: 24 hours at `h-12`. `relative` for the absolutely positioned timed events. */
export const eventCalendarTimedColumnVariants = cva("relative h-[72rem] list-none");

/** The hour lines behind the events. Block-axis only; nothing here mirrors. */
export const eventCalendarHourLineVariants = cva("h-12 border-b border-border/60");

/** The week view's head, sticky inside the one scroller. See the grid above. */
export const eventCalendarWeekHeadVariants = cva(
  "sticky top-0 z-10 flex flex-col items-center gap-0.5 border-b border-border " +
    "bg-surface-sunken px-1 py-1.5",
);

export const eventCalendarWeekHeadDayVariants = cva("text-sm tabular-nums", {
  variants: {
    today: { true: "font-medium text-accent", false: "text-fg" },
  },
  defaultVariants: { today: false },
});

/** A week-view day cell. One `gridcell` per DAY — see the component header. */
export const eventCalendarWeekCellVariants = cva("flex flex-col bg-surface", {
  variants: {
    today: { true: "bg-accent/5", false: "" },
  },
  defaultVariants: { today: false },
});

export const eventCalendarChipVariants = cva(
  // `truncate` and `text-start`: a phrase runs out at the reader's END edge.
  "block w-full truncate rounded-sm px-1.5 py-0.5 text-start text-[0.6875rem] leading-tight",
  {
    variants: {
      /** The event's semantic color. */
      tone: {
        accent: "bg-accent/15 text-accent",
        positive: "bg-positive/15 text-positive",
        caution: "bg-caution/15 text-caution",
        critical: "bg-critical/15 text-critical",
        neutral: "bg-surface-sunken text-fg-muted",
      },
      /** A timed event in the week view fills the box it was positioned into. */
      filled: { true: "absolute overflow-hidden", false: "" },
    },
    defaultVariants: { tone: "accent", filled: false },
  },
);

export type EventCalendarChipVariantProps = VariantProps<typeof eventCalendarChipVariants>;

/** «+۳ بیشتر» under a month cell that ran out of room. */
export const eventCalendarMoreVariants = cva(
  "block w-full truncate px-1.5 text-start text-[0.625rem] text-fg-subtle",
);

export const eventCalendarAgendaVariants = cva(
  "flex list-none flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface",
);

export const eventCalendarAgendaDayVariants = cva("flex flex-col gap-1.5 p-3");

export const eventCalendarAgendaDateVariants = cva("text-xs font-medium text-fg-muted");

export const eventCalendarAgendaRowVariants = cva(
  // «زمان — عنوان»: `gap` and source order do the placement; neither side is named.
  "flex list-none items-baseline gap-2 text-sm text-fg",
);

export const eventCalendarAgendaTimeVariants = cva(
  "shrink-0 text-xs tabular-nums text-fg-muted",
);

export const eventCalendarEmptyVariants = cva(
  "rounded-lg border border-border bg-surface p-6 text-center text-sm text-fg-muted",
);
