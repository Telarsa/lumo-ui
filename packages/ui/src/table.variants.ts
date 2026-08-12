import { cva } from "class-variance-authority";
import { direction, type Direction, type Locale } from "@lumo-ui/core";

/**
 * Table's class definitions and its keyboard-direction arithmetic —
 * deliberately in a module with NO `"use client"`.
 *
 * Two reasons, and the second is the one that is new on this engine:
 *
 *  1. `button.variants.ts`'s reason. A `cva()` exported from a client module is
 *     a client reference in the RSC graph, and a server component that frames a
 *     grid — a heading, a row count, an empty state — must be able to call
 *     these.
 *
 *  2. **`gridArrowStep()` is the piece that has to be TESTED without a DOM.**
 *     Under React Aria the RTL arrow mapping was the library's; it is Lumo's
 *     now, and a keyboard rule that can only be exercised through a jsdom
 *     `keydown` is a rule whose Persian branch gets asserted once and then
 *     rots. As a pure function of `(locale, key)` it is a table of six cases
 *     that either is or is not right, in both directions, on every run.
 *
 * ═══ THE STATE VOCABULARY CHANGED TWICE, NOT ONCE ═══════════════════════════
 *
 * `experiments/measurements/state-vocabulary.json` maps React Aria's
 * `data-*` attributes onto Base UI's. **Base UI has no table**, so this file is
 * the one place in the migration where the destination is neither React Aria's
 * vocabulary nor Base UI's: Lumo now writes the markup itself, so it also
 * chooses the attributes.
 *
 * The choice made here is to style from **ARIA wherever ARIA already carries
 * the state**, and from a `data-*` attribute only where it does not:
 *
 *     was (React Aria)          is (Lumo's own markup)      why
 *     ────────────────────────  ──────────────────────────  ──────────────────
 *     data-hovered              :hover                      Base UI ships no
 *                                                           hover attribute at
 *                                                           all; the platform
 *                                                           already has one.
 *     data-focus-visible        :focus-visible              same, and jsdom
 *                                                           DOES match this one
 *                                                           so the WCAG 2.4.7
 *                                                           ring keeps its unit
 *                                                           tier.
 *     data-selected (on a row)  aria-selected="true"        THE INTERESTING
 *                                                           ONE — see below.
 *     data-allows-sorting       data-sortable               no ARIA equivalent:
 *                                                           `aria-sort="none"`
 *                                                           says "sorted by
 *                                                           nothing", not
 *                                                           "sortable".
 *     data-resizing             data-resizing               ours either way.
 *     data-disabled             data-disabled               ours either way.
 *
 * **Styling a row from `aria-selected` rather than from a private attribute is
 * not a cosmetic preference.** It makes the highlight and the announcement the
 * SAME fact. Under the old arrangement a row could carry `data-selected` and
 * not `aria-selected` — the row looks selected and is announced as not — and
 * nothing in the library would notice, because the two attributes were written
 * by two different code paths. There is now one attribute and one code path,
 * and a screenshot and a screen reader cannot disagree.
 *
 * The same argument applies to `aria-sort` and the arrow glyph in `Column`.
 */

export const tableVariants = cva(
  // `border-collapse` so the row rules meet instead of doubling; `text-start`
  // on the root rather than per-cell, because `text-align` inherits and
  // `text-left` in one cell is the classic mirroring defect.
  "w-full border-collapse text-start text-sm text-fg outline-none",
);

export const tableHeaderVariants = cva("border-be border-border bg-surface-sunken");

export const columnVariants = cva(
  // `px-3` is symmetric so it needs no logical form; `text-start` does.
  "h-control-md px-3 text-start text-xs font-medium text-fg-muted outline-none " +
    // Was `data-allows-sorting:`. The attribute is Lumo's own now, and the name
    // is shorter because nothing else claims it.
    "data-sortable:cursor-pointer " +
    // Was `data-allows-sorting:data-hovered:`. React Aria's hover attribute is
    // gone with React Aria; `:hover` is the platform's and always was.
    "data-sortable:hover:text-fg " +
    "[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const tableBodyVariants = cva("data-empty:text-fg-muted");

/**
 * `<tfoot>`. The summary row — totals, a count, a balance.
 *
 * `border-bs` and not `border-t`, for `card.tsx`'s reason: the block axis does
 * not mirror, and a rule with a carve-out is a rule people get wrong. It is a
 * DOUBLE rule against the body's own row borders on purpose — the footer is not
 * one more row of the same kind, and the heavier line is what says so before
 * the numbers are read.
 *
 * `font-medium` rather than `font-semibold`: a totals row is emphasis inside a
 * table, not a heading, and Vazirmatn's semibold at 14px against a full column
 * of regular reads as a second header row.
 */
export const tableFooterVariants = cva(
  "border-bs border-border bg-surface-sunken font-medium text-fg",
);

export const rowVariants = cva(
  "border-bs border-border outline-none " +
    "hover:bg-surface-hover " +
    // Was `data-selected:`. Now the SAME attribute a screen reader reads — see
    // the header. A row cannot look selected and announce unselected.
    "aria-selected:bg-surface-sunken " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const cellVariants = cva(
  "px-3 py-2 text-start align-middle outline-none " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const resizableTableContainerVariants = cva("w-full overflow-auto");

export const columnResizerVariants = cva(
  // `cursor-col-resize` names the INLINE axis, which is the same axis in both
  // scripts — a column boundary does not mirror, the columns either side of it
  // do.
  "ms-1 h-4 w-1 shrink-0 cursor-col-resize rounded-full border-0 bg-border p-0 " +
    "hover:bg-border-strong data-resizing:bg-accent " +
    "focus-visible:bg-accent",
);

/* ════════════════════════════════════════════════════════════════════════════
 * THE KEYBOARD, WHICH IS NOW LUMO'S
 *
 * React Aria resolved arrow keys against the document direction for us. Base UI
 * has no table, and `@tanstack/react-table` owns no focus and no DOM by design,
 * so this arithmetic moved into the library. It is the single largest thing the
 * migration transferred, and it is the thing a hand-rolled `switch (e.key)`
 * gets backwards INVISIBLY, in Persian only: ArrowLeft moves to the NEXT column
 * under `dir="rtl"`, because "next" means "further along the reading order" and
 * the reading order runs right to left.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** A move in grid coordinates. Rows are the block axis, columns the inline one. */
export interface GridStep {
  row: number;
  col: number;
}

export interface GridArrow {
  /** Derived from the locale. Never passed in. */
  direction: Direction;
  /**
   * The move an arrow key means, or `null` for a key that is not an arrow.
   *
   * `null` rather than a zero step, so a caller can tell "this key is not mine"
   * from "this key means stay put" and only call `preventDefault()` for the
   * former. A grid that swallows every keystroke is a grid a typeahead cannot
   * be added to later.
   */
  step: (key: string) => GridStep | null;
}

/**
 * What each arrow key means in this locale.
 *
 * The BLOCK axis (Up/Down) is deliberately identical in both directions: no
 * horizontal writing mode mirrors it, which is the same fact that lets
 * `select.tsx` use a `ChevronDown` with no `rtl:` variant and lets
 * `virtual-list.variants.ts` leave its vertical branch alone.
 *
 * Under LTR the returned table is the obvious one, so the mirrored path and the
 * plain path are the same code — the only arrangement in which the mirrored one
 * stays working.
 */
export function gridArrow(locale: Locale): GridArrow {
  const dir = direction(locale);
  const inlineForward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const inlineBackward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

  return {
    direction: dir,
    step: (key: string) => {
      switch (key) {
        case inlineForward:
          return { row: 0, col: 1 };
        case inlineBackward:
          return { row: 0, col: -1 };
        case "ArrowDown":
          return { row: 1, col: 0 };
        case "ArrowUp":
          return { row: -1, col: 0 };
        default:
          return null;
      }
    },
  };
}
