"use client";

import type { ReactElement } from "react";
import { cva } from "class-variance-authority";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  Cell as AriaCell,
  Column as AriaColumn,
  ColumnResizer as AriaColumnResizer,
  ResizableTableContainer as AriaResizableTableContainer,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  type CellProps as AriaCellProps,
  type ColumnProps as AriaColumnProps,
  type ColumnResizerProps as AriaColumnResizerProps,
  type ResizableTableContainerProps as AriaResizableTableContainerProps,
  type RowProps as AriaRowProps,
  type TableBodyProps as AriaTableBodyProps,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableProps as AriaTableProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Checkbox } from "./checkbox.tsx";
import { optional } from "./form.tsx";

/**
 * A data grid.
 *
 *     <Table label="سفارش‌ها" selectionMode="multiple"
 *            sortDescriptor={sort} onSortChange={setSort}>
 *       <TableHeader>
 *         <TableSelectAllColumn label="انتخاب همه" />
 *         <Column id="name" isRowHeader
 *                 allowsSorting
 *                 sortAscendingLabel="صعودی مرتب شده"
 *                 sortDescendingLabel="نزولی مرتب شده">نام</Column>
 *         <Column id="city">شهر</Column>
 *       </TableHeader>
 *       <TableBody>
 *         <Row id="1">
 *           <TableSelectionCell label="انتخاب ردیف" />
 *           <Cell>سارا</Cell>
 *           <Cell>تهران</Cell>
 *         </Row>
 *       </TableBody>
 *     </Table>
 *
 * ── IT IS A REAL ARIA GRID, WHICH IS THE ONLY REASON TO RENT IT ─────────────
 *
 * Verified by rendering, not by reading the docs. The server-rendered markup of
 * the composition above carries `role="grid"` on the `<table>`,
 * `role="columnheader"` + `aria-colindex="1|2|3"` on each `<th>`,
 * `role="rowheader"` on the `isRowHeader` cell, `role="gridcell"` elsewhere,
 * `aria-selected` on each `<tr>`, and `aria-sort="ascending|none"` on sortable
 * columns. A hand-written `<table>` has none of that, and no amount of CSS adds
 * it. The keyboard model — arrow navigation across cells, typeahead over rows,
 * one Tab stop for the whole grid — is the other half, and it resolves arrow
 * keys against the document direction, so ArrowLeft moves to the NEXT column
 * under `dir="rtl"`. That is the behaviour a hand-rolled `switch (e.key)` gets
 * backwards invisibly, in Persian only.
 *
 * ── THE THREE ANNOUNCED STRINGS, ALL MEASURED, ALL REQUIRED ─────────────────
 *
 * React Aria's `@react-aria/table` bundle (en-US) contains:
 *
 *     select:      "Select"            → aria-label on a ROW checkbox
 *     selectAll:   "Select All"        → aria-label on the header checkbox
 *     sortable:    "sortable column"   → aria-describedby target, see below
 *     columnSize:  "{value} pixels"    → aria-valuetext on the resizer input
 *     resizerDescription: "Press Enter to start resizing"
 *
 * and `react-aria-components` adds `tableResizer: "Resizer"`.
 *
 * Measured against server output on a `fa-IR` render:
 *
 *   REACHABLE, therefore required props here —
 *     "Select All"  `TableSelectAllColumn`'s `label`. Verified: a local
 *                   `aria-label` on `<Checkbox slot="selection">` replaces
 *                   RAC's, it does not duplicate it.
 *     "Select"      `TableSelectionCell`'s `label`. Same mechanism. Note RAC
 *                   also pairs it with `aria-labelledby` pointing at the row
 *                   header, so the row's own name is still spoken.
 *     "Resizer"     `ColumnResizer`'s `label` — `aria-label` is an explicitly
 *                   declared prop on RAC's ColumnResizer and wins over the
 *                   bundle (`props['aria-label'] || format('tableResizer')`).
 *
 *   UNREACHABLE, recorded rather than papered over —
 *     "sortable column"  `useTableColumnHeader` feeds it to `useDescription`,
 *                        which appends `<div style="display:none">` to
 *                        document.body AFTER mount and points the header's
 *                        `aria-describedby` at it. No prop reaches it. It is
 *                        invisible to the HTML gate (it does not exist in the
 *                        first byte) and it is not an attribute, so it is
 *                        invisible to `no-latin-aria` too. `data-display.test.tsx`
 *                        pins it so a React Aria bump that changes it is loud.
 *
 *                        This is exactly why `Column` requires its own
 *                        `sortAscendingLabel`/`sortDescendingLabel` and renders
 *                        them `sr-only`. `aria-sort` is correct and localised by
 *                        the screen reader itself — but Android TalkBack does
 *                        not support `aria-sort` at all, which is precisely the
 *                        gap RAC papers over with its English description. Lumo
 *                        papers over it in Persian.
 *
 *     "{value} pixels"   `aria-valuetext` on the resizer's hidden
 *                        `<input type="range">`. **This one is a live problem —
 *                        see the ColumnResizer header.**
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
    "data-allows-sorting:cursor-pointer " +
    "data-allows-sorting:data-hovered:text-fg " +
    "[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const tableBodyVariants = cva("data-empty:text-fg-muted");

export const rowVariants = cva(
  "border-bs border-border outline-none " +
    "data-hovered:bg-surface-hover " +
    "data-selected:bg-surface-sunken " +
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
  // do, and RAC already flips `data-resizable-direction` for RTL itself.
  "ms-1 h-4 w-1 shrink-0 cursor-col-resize rounded-full bg-border " +
    "data-hovered:bg-border-strong data-resizing:bg-accent " +
    "data-focus-visible:bg-accent",
);

/**
 * The grid itself.
 *
 * `label` is REQUIRED for the same reason it is on `Toolbar`: `role="grid"`
 * takes ONE Tab stop for the whole table, so an unnamed one announces "grid"
 * and nothing else, and a screen with two of them offers two identical stops.
 * RAC leaks no English here — the table simply arrives anonymous, which is the
 * `named-controls` defect in its quietest form.
 */
export interface TableProps
  extends Omit<AriaTableProps, "children" | "className" | "aria-label"> {
  /** Announced name of the grid. Required. */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Table({ label, className, ...props }: TableProps) {
  return (
    <AriaTable
      data-lumo=""
      aria-label={label}
      className={cn(tableVariants(), className)}
      {...props}
    />
  );
}

export interface TableHeaderProps<T extends object>
  extends Omit<AriaTableHeaderProps<T>, "children" | "className"> {
  children?: LumoNode | ((item: T) => ReactElement);
  className?: string | undefined;
}

export function TableHeader<T extends object>({
  className,
  ...props
}: TableHeaderProps<T>) {
  return <AriaTableHeader className={cn(tableHeaderVariants(), className)} {...props} />;
}

/**
 * One column header.
 *
 * ── `allowsSorting` IS A TYPED PAIR, LIKE `Link`'s `newTab` ─────────────────
 *
 * A sortable column announces its direction, and by rule 3 that string cannot
 * have an English default and cannot be optional. So the two shapes are separate
 * members of a union: `allowsSorting` without both labels does not compile, and
 * passing the labels without `allowsSorting` does not either. The same
 * enforcement `link.tsx` uses for `newTab`/`newTabLabel`, for the same reason —
 * a lint rule can be suppressed, a type cannot.
 *
 * Only the ACTIVE direction is announced. An unsorted sortable column already
 * carries `aria-sort="none"`, and adding a third Persian string that says
 * "sortable" would be read on every header of every table.
 *
 * ── THE ARROWS ARE BLOCK-AXIS GLYPHS, DELIBERATELY ─────────────────────────
 *
 * `ArrowUp`/`ArrowDown` point along the block axis, which does not mirror in
 * any horizontal writing mode — so the same icon means the same thing in
 * Persian and English with no `rtl:` variant. This is the same choice select.tsx
 * makes with its `ChevronDown`, and the opposite of menu.tsx's submenu marker,
 * which points along the INLINE axis and therefore has to be a bidi-mirrored
 * character rather than an icon.
 */
interface ColumnBaseProps
  extends Omit<AriaColumnProps, "children" | "className" | "allowsSorting"> {
  children?: LumoNode;
  /**
   * A `<ColumnResizer>`, as its own slot rather than as a child.
   *
   * The resizer must be a DOM descendant of this column — it reads the column
   * off a context that `<Column>` provides — but it must NOT be part of the
   * header's label, and putting it in `children` makes it both. A slot keeps
   * the announced name to the text and the grab handle at the inline end.
   */
  resizer?: LumoNode;
  className?: string | undefined;
}

interface UnsortableColumnProps {
  allowsSorting?: false | undefined;
  sortAscendingLabel?: undefined;
  sortDescendingLabel?: undefined;
}

interface SortableColumnProps {
  /** Lets the reader sort by this column. Requires both labels below. */
  allowsSorting: true;
  /**
   * Announced when this column is the active ascending sort, e.g.
   * «مرتب‌شده صعودی».
   *
   * REQUIRED. `aria-sort="ascending"` is already emitted and most screen
   * readers speak it in their own language — but Android TalkBack ignores
   * `aria-sort` entirely, which is why React Aria appends its own English
   * "sortable column" description. That description is unreachable by prop
   * (see the file header), so Lumo states the direction itself, in Persian.
   */
  sortAscendingLabel: string;
  /** As `sortAscendingLabel`, for the descending state. */
  sortDescendingLabel: string;
}

export type ColumnProps = ColumnBaseProps & (UnsortableColumnProps | SortableColumnProps);

export function Column({
  className,
  children,
  resizer,
  textValue,
  allowsSorting,
  sortAscendingLabel,
  sortDescendingLabel,
  ...props
}: ColumnProps) {
  // RAC derives a column's announced text from a LITERAL string child only, and
  // the sort indicator forces a wrapper around it — the same trap documented at
  // length in menu.tsx and worked around the same way.
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);

  return (
    <AriaColumn
      data-lumo=""
      className={cn(columnVariants(), className)}
      {...optional("textValue", resolvedTextValue)}
      {...(allowsSorting === true ? { allowsSorting: true } : {})}
      {...props}
    >
      {({ sortDirection }) => (
        <span className="flex w-full items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {allowsSorting === true ? (
            <>
              {/*
               * `aria-hidden` on all three: the direction is already in the
               * tree as `aria-sort`, and the sr-only string below carries it
               * for readers that ignore `aria-sort`. An announced icon would
               * make it a third copy.
               */}
              {sortDirection === "ascending" ? (
                <ArrowUp aria-hidden="true" className="text-fg" />
              ) : sortDirection === "descending" ? (
                <ArrowDown aria-hidden="true" className="text-fg" />
              ) : (
                <ChevronsUpDown aria-hidden="true" className="text-fg-subtle" />
              )}
              {sortDirection === undefined ? null : (
                <span className="sr-only">
                  {sortDirection === "ascending" ? sortAscendingLabel : sortDescendingLabel}
                </span>
              )}
            </>
          ) : null}
          {resizer}
        </span>
      )}
    </AriaColumn>
  );
}

export interface TableBodyProps<T extends object>
  extends Omit<AriaTableBodyProps<T>, "children" | "className"> {
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function TableBody<T extends object>({ className, ...props }: TableBodyProps<T>) {
  return <AriaTableBody className={cn(tableBodyVariants(), className)} {...props} />;
}

export interface RowProps<T extends object>
  extends Omit<AriaRowProps<T>, "children" | "className"> {
  children?: LumoNode | ((item: T) => ReactElement);
  className?: string | undefined;
}

export function Row<T extends object>({ className, ...props }: RowProps<T>) {
  return <AriaRow data-lumo="" className={cn(rowVariants(), className)} {...props} />;
}

export interface CellProps extends Omit<AriaCellProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One cell. Deliberately NOT wrapped in anything: RAC reads a cell's typeahead
 * text from a literal string child, and unlike `Column` there is nothing here
 * that needs a sibling element, so leaving `children` untouched keeps that
 * derivation working with no `textValue` to remember.
 */
export function Cell({ className, ...props }: CellProps) {
  return <AriaCell data-lumo="" className={cn(cellVariants(), className)} {...props} />;
}

/**
 * The header cell holding the select-all checkbox.
 *
 * Split out rather than left to the caller because `<Column><Checkbox
 * slot="selection" /></Column>` compiles perfectly well with no `aria-label`,
 * and then RAC's `aria-label="Select All"` is what a Persian reader hears. As a
 * component the string is a constructor argument and forgetting it is a compile
 * error — the same reason `IconButton` exists separately from `Button`.
 */
export interface TableSelectAllColumnProps
  extends Omit<AriaColumnProps, "children" | "className"> {
  /** Announced name of the select-all checkbox. Required. Replaces "Select All". */
  label: string;
  className?: string | undefined;
}

export function TableSelectAllColumn({
  label,
  className,
  ...props
}: TableSelectAllColumnProps) {
  return (
    <AriaColumn
      data-lumo=""
      // `w-0` + `whitespace-nowrap` shrink-wraps the checkbox column to its
      // content in a `table-layout:auto` table, on either side of the grid.
      className={cn(columnVariants(), "w-0 whitespace-nowrap", className)}
      {...props}
    >
      <Checkbox slot="selection" aria-label={label} />
    </AriaColumn>
  );
}

/** The per-row selection checkbox. See `TableSelectAllColumn`. */
export interface TableSelectionCellProps
  extends Omit<AriaCellProps, "children" | "className"> {
  /** Announced name of the row checkbox. Required. Replaces "Select". */
  label: string;
  className?: string | undefined;
}

export function TableSelectionCell({ label, className, ...props }: TableSelectionCellProps) {
  return (
    <AriaCell
      data-lumo=""
      className={cn(cellVariants(), "w-0 whitespace-nowrap", className)}
      {...props}
    >
      <Checkbox slot="selection" aria-label={label} />
    </AriaCell>
  );
}

/**
 * Wraps a `<Table>` to enable column resizing.
 *
 * Also the scroll container: RAC switches the table to `table-layout: fixed`
 * with `width: min-content` inside this element, so without `overflow-auto`
 * here a resized-wide table pushes the page sideways — and a horizontal
 * scrollbar on the document is the one thing that behaves differently under
 * `dir="rtl"` in every engine.
 */
export interface ResizableTableContainerProps
  extends Omit<AriaResizableTableContainerProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ResizableTableContainer({
  className,
  ...props
}: ResizableTableContainerProps) {
  return (
    <AriaResizableTableContainer
      className={cn(resizableTableContainerVariants(), className)}
      {...props}
    />
  );
}

/**
 * The drag handle on a column boundary. Goes in `Column`'s `resizer` slot.
 *
 * ═══ SHIPPING THIS ALSO SHIPS ONE ENGLISH STRING NOBODY CAN REACH ═══════════
 *
 * `useTableColumnResize` puts `aria-valuetext` on the resizer's hidden
 * `<input type="range">`, unconditionally, from its own bundle:
 *
 *     'aria-valuetext': stringFormatter.format('columnSize', {value})
 *     en-US: columnSize: (args) => `${args.value} pixels`
 *
 * Verified by rendering on a `fa-IR` page: the first byte contains
 * `aria-valuetext="75 pixels"`. Verified unreachable: passing `aria-valuetext`
 * to `<ColumnResizer>` changes nothing, because RAC builds the input's props
 * inside the hook and `filterDOMProps(props, {global: true})` — which is what
 * local props go through — does not carry `aria-*` at all.
 *
 * That string is BOTH an English word and Latin digits, in an attribute a
 * screen reader speaks. `@lumo-ui/gate`'s `no-latin-aria` rule grades exactly
 * `aria-valuetext`, so **a Persian route that renders a ColumnResizer fails the
 * HTML gate.** That is not a bug in the gate; the gate is right.
 *
 * It is shipped anyway, and the precedent is deliberate: `@lumo-ui/core`'s
 * strings.ts already records three unreachable React Aria leaks (CalendarCell,
 * DateSegment) and defers them to the client-dictionary tier in milestone M9
 * rather than withholding the components. This is the same class. What is NOT
 * acceptable is discovering it in production, so:
 *
 *   - the leak is pinned by a test in `data-display.test.tsx`, which fails when
 *     React Aria changes it in either direction;
 *   - do not put a `ColumnResizer` in a `fa-IR` demo until it is closed.
 *
 * Everything else here IS reachable: `label` becomes the resizer's own
 * `aria-label`, replacing RAC's "Resizer".
 */
export interface ColumnResizerProps
  extends Omit<AriaColumnResizerProps, "children" | "className" | "aria-label"> {
  /** Announced name of the resize handle. Required. Replaces "Resizer". */
  label: string;
  className?: string | undefined;
}

export function ColumnResizer({ label, className, ...props }: ColumnResizerProps) {
  return (
    <AriaColumnResizer
      data-lumo=""
      aria-label={label}
      className={cn(columnResizerVariants(), className)}
      {...props}
    />
  );
}
