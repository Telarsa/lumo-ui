"use client";

import { useMemo, useState } from "react";
import { cn, type Locale, type LumoNode } from "@lumo-ui/core";
import {
  Cell,
  Column,
  EmptyState,
  Pagination,
  Row,
  Table,
  TableBody,
  TableHeader,
  TableSelectAllColumn,
  TableSelectionCell,
  optional,
  useLumoTable,
  type TableProps,
} from "@lumo-ui/ui";
import {
  DataToolbar,
  type DataToolbarStrings,
  type DataToolbarView,
  type SortOption,
} from "./data-toolbar.tsx";

/**
 * A full data screen: `DataToolbar` above a real ARIA grid, with an empty
 * state and an optional pager.
 *
 * ── THE ONE CROSS-BLOCK IMPORT IN THIS PACKAGE, AND WHY IT IS SAFE ──────────
 *
 * `DataToolbar` is not a `@lumo-ui/ui` primitive — it is itself a block, in
 * `./data-toolbar.tsx`. Every other file in this package composes only from
 * `@lumo-ui/ui`; this one reaches one file over instead, because the brief for
 * this block is literally "Table + DataToolbar", and re-deriving DataToolbar's
 * search/sort/view/result-count assembly here would be exactly the
 * "don't hand-write what already exists" mistake this project's own rules
 * exist to prevent. The import is one-directional — `data-toolbar.tsx` does
 * not import this file — so it introduces no cycle.
 *
 * ── TWO SORTS, KEPT DELIBERATELY SEPARATE ────────────────────────────────────
 *
 * `DataToolbar`'s `toolbarSort`/`onToolbarSortChange` choose a named preset
 * from a dropdown ("newest first"). A column's own header sort is the grid's,
 * and it is now REAL — see below. These answer different questions and are kept
 * as different names here rather than forced to share one prop, so a screen can
 * offer either, both, or neither without the two ever colliding.
 *
 * ── THE STATE LAYER MOVED INSIDE THIS BLOCK, AND IT FIXED A DEAD CONTROL ────
 *
 * React Aria's `Table` carried selection and sorting as ELEMENT props, so this
 * block forwarded `selectionMode`, `sortDescriptor` and `onSortChange` straight
 * through and the consumer owned the state. Base UI has no table at all;
 * `@lumo-ui/ui`'s grid is markup and keyboard over a TanStack instance, and
 * that instance has to EXIST BEFORE the markup that reads it. It is built here,
 * from the props this block already had:
 *
 *     rows      → data          rowKey → getRowId
 *     columns   → column defs   selectionMode === "multiple" → enableRowSelection
 *
 * The block's own API therefore does not move: `selectionMode` is declared here
 * instead of inherited, and it means what it always meant.
 *
 * **What changes is that a sortable column now sorts.** Under React Aria a
 * `<Column allowsSorting>` in this block rendered an arrow, emitted `aria-sort`
 * and did nothing at all unless the consumer implemented the sort themselves
 * and passed rows back — and the website's own `TableViewIsland` never did, so
 * the docs shipped four sortable headers that were pure decoration. TanStack
 * owns the comparison now, through `useLumoTable`'s locale-aware collator, so
 * the header sorts Persian text in Persian order with no consumer code.
 *
 * The price is one new required piece of data and it is stated rather than
 * guessed: `TableViewColumn.cell` returns a `LumoNode`, and you cannot sort a
 * `<Badge>`. A sortable column must therefore declare `sortValue`, the plain
 * string or number the row sorts BY, and the type makes that a compile error
 * rather than a silent no-op — the exact defect this section is describing.
 *
 * ── SELECTION CHECKBOXES ARE OPT-IN, VIA `selectionMode="multiple"` ──────────
 *
 * `TableSelectAllColumn`/`TableSelectionCell` render only in that mode. Single
 * selection through a row press needs no checkbox column at all, so rendering
 * one there would be a widget with no matching interaction.
 *
 * `"use client"`: every callback here is a function prop, and `Table` itself
 * requires the directive.
 */
interface TableViewColumnBase<T> {
  /** Stable key. Also the TanStack column id. */
  id: string;
  /** The column's visible heading. */
  header: string;
  /** Renders one cell. `LumoNode`, so a raw number is a compile error. */
  cell: (item: T) => LumoNode;
  /** Marks this column as the row's accessible name. Exactly one column should be. */
  isRowHeader?: boolean | undefined;
  className?: string | undefined;
}

/**
 * A sortable column, which must say what it sorts BY.
 *
 * `cell` renders a `LumoNode` — a `<Badge>`, a `<time>`, a formatted currency
 * string — and none of those is comparable. `sortValue` is the plain value
 * underneath: `(row) => row.placedAt.getTime()` for a date column,
 * `(row) => row.amount` for a money column. It is what `useLumoTable`'s
 * collator compares, so a Persian text column sorts in Persian order.
 *
 * A typed pair rather than two optional props, for the reason `ColumnProps`
 * makes about `sortAscendingLabel`: the failure mode of forgetting it is a
 * header that looks sortable and silently is not.
 */
interface SortableTableViewColumn<T> extends TableViewColumnBase<T> {
  allowsSorting: true;
  /** The comparable value behind `cell`. See above. */
  sortValue: (item: T) => string | number;
}

interface UnsortableTableViewColumn<T> extends TableViewColumnBase<T> {
  allowsSorting?: false | undefined;
  sortValue?: undefined;
}

export type TableViewColumn<T> = SortableTableViewColumn<T> | UnsortableTableViewColumn<T>;

/**
 * TanStack's row-selection record, spelled out rather than imported.
 *
 * `@lumo-ui/blocks` has no `@tanstack/react-table` dependency and this port adds
 * none — the state layer arrives through `useLumoTable`, which is
 * `@lumo-ui/ui`'s. `Record<string, true>` keyed by `rowKey` is the whole shape,
 * and naming it here keeps the boundary this package holds everywhere else: it
 * composes Lumo, and Lumo owns the engine.
 *
 * `true` and not `boolean`, matching TanStack's own `RowSelectionState`: a row
 * is selected by being PRESENT, so there is no `false` to mean "deselected" and
 * no second way to spell an empty selection.
 */
type RowSelection = Record<string, true>;

export interface TableViewPagination {
  /** The current page, 1-based. */
  page: number;
  /** How many pages there are in total. */
  count: number;
  onPageChange: (page: number) => void;
  /** Announced name of the pager landmark. */
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** Builds a page button's name from the ALREADY-FORMATTED page number. */
  pageLabel: (formattedPage: string) => string;
}

export interface TableViewStrings {
  /** Passed straight through to `DataToolbar`. */
  toolbar: DataToolbarStrings;
  /** Announced name of the grid. Required — see `table.tsx`. */
  tableLabel: string;
  /** Announced name of the select-all checkbox. Required whenever selection is on. */
  selectAllLabel: string;
  /**
   * Announced name of a row's checkbox, as a function of that row's own
   * identity — e.g. ``(name) => `انتخاب ${name}` ``. Required whenever
   * selection is on; the argument comes from `rowLabel` below.
   */
  selectRow: (rowLabel: string) => string;
  /** Announced on an ascending sortable column. Required whenever any column sorts. */
  sortAscendingLabel: string;
  sortDescendingLabel: string;
  /** Shown when `rows` is empty. */
  emptyTitle: string;
  emptyDescription?: string | undefined;
}

export interface TableViewProps<T extends object>
  // `table` is omitted, not forwarded: this block BUILDS the instance from the
  // props below, so accepting a second one would give the grid two sources of
  // selection and sort state that could disagree. A screen that needs to own
  // the instance composes `<Table>` directly — that is what the primitive is
  // for, and it is one import away.
  extends Omit<TableProps, "children" | "label" | "className" | "table"> {
  strings: TableViewStrings;
  /** Formats the result count and every pager number. Required by design. */
  locale: Locale;
  columns: readonly TableViewColumn<T>[];
  rows: readonly T[];
  /** Stable identity for the TanStack row id and the list's React key. */
  rowKey: (item: T) => string;
  /** The row's human identity, fed to `strings.selectRow`. */
  rowLabel: (item: T) => string;
  /**
   * Turns on the checkbox column. Declared here now rather than inherited from
   * `TableProps`, which no longer carries it — see the file header.
   */
  selectionMode?: "none" | "multiple" | undefined;
  /** The selected `rowKey`s, whenever the checkbox column is on. */
  onSelectionChange?: ((keys: readonly string[]) => void) | undefined;

  // DataToolbar, forwarded under its own names — see the file header for why
  // `toolbarSort`/`onToolbarSortChange` are not `sort`/`onSortChange`, which
  // is what a column header owns.
  search?: string | undefined;
  sortOptions?: readonly SortOption[] | undefined;
  toolbarSort?: string | undefined;
  view?: DataToolbarView | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  onToolbarSortChange?: ((sortId: string | null) => void) | undefined;
  onViewChange?: ((view: DataToolbarView) => void) | undefined;
  /** One primary action, rendered inside the toolbar — see `data-toolbar.tsx`. */
  toolbarAction?: LumoNode;

  /** Rendered above the toolbar — a `<PageHeader>`, a heading. */
  header?: LumoNode;
  /** Omit to render no pager. */
  pagination?: TableViewPagination | undefined;
  className?: string | undefined;
}

export function TableView<T extends object>({
  strings,
  locale,
  columns,
  rows,
  rowKey,
  rowLabel,
  search,
  sortOptions,
  toolbarSort,
  view,
  onSearchChange,
  onToolbarSortChange,
  onViewChange,
  toolbarAction,
  header,
  pagination,
  className,
  selectionMode,
  onSelectionChange,
  ...tableProps
}: TableViewProps<T>) {
  const hasCheckboxColumn = selectionMode === "multiple";

  /*
   * The state layer. Memoised on the props it is derived from, because TanStack
   * rebuilds its row models when `data` or `columns` change identity and a new
   * array literal on every render would do that on every keystroke.
   *
   * `accessorFn` exists only for a sortable column: an unsortable one has
   * nothing to compare and giving it an accessor would invite a future header
   * to sort by a value nobody declared.
   */
  const [rowSelection, setRowSelection] = useState<RowSelection>({});
  const data = useMemo(() => [...rows], [rows]);
  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: column.id,
        ...(column.sortValue === undefined ? {} : { accessorFn: column.sortValue }),
      })),
    [columns],
  );
  const table = useLumoTable<T>({
    locale,
    data,
    columns: tableColumns,
    // The row's TanStack id IS its `rowKey`, so a selection reports the same
    // strings the caller handed in rather than TanStack's positional indices.
    getRowId: (row: T) => rowKey(row),
    enableRowSelection: hasCheckboxColumn,
    /*
     * Selection is CONTROLLED here, and it has to be: TanStack treats an
     * `onRowSelectionChange` without a matching `state` entry as "the caller
     * owns this", and the checkboxes would then toggle nothing. Holding the
     * record in React state is also what lets this block report the caller's
     * own row keys — `getRowId` above put them there.
     */
    state: { rowSelection },
    onRowSelectionChange: (updater: RowSelection | ((old: RowSelection) => RowSelection)) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      // Presence IS selection — see `RowSelection`. Filtering on the value
      // would be a second, disagreeing definition of the same fact.
      onSelectionChange?.(Object.keys(next));
    },
  });

  return (
    <section className={cn("flex w-full flex-col", className)}>
      {header}

      <DataToolbar
        strings={strings.toolbar}
        locale={locale}
        total={rows.length}
        search={search}
        sortOptions={sortOptions}
        sort={toolbarSort}
        view={view}
        onSearchChange={(value) => onSearchChange?.(value)}
        onSortChange={(sortId) => onToolbarSortChange?.(sortId)}
        onViewChange={(next) => onViewChange?.(next)}
        action={toolbarAction}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={strings.emptyTitle}
          {...optional("description", strings.emptyDescription)}
        />
      ) : (
        <div className="w-full overflow-auto border-bs border-border">
          <Table label={strings.tableLabel} locale={locale} table={table} {...tableProps}>
            <TableHeader>
              {hasCheckboxColumn ? <TableSelectAllColumn label={strings.selectAllLabel} /> : null}
              {columns.map((column) =>
                column.allowsSorting === true ? (
                  <Column
                    key={column.id}
                    id={column.id}
                    allowsSorting
                    sortAscendingLabel={strings.sortAscendingLabel}
                    sortDescendingLabel={strings.sortDescendingLabel}
                    {...optional("isRowHeader", column.isRowHeader)}
                    {...optional("className", column.className)}
                  >
                    {column.header}
                  </Column>
                ) : (
                  <Column
                    key={column.id}
                    id={column.id}
                    {...optional("isRowHeader", column.isRowHeader)}
                    {...optional("className", column.className)}
                  >
                    {column.header}
                  </Column>
                ),
              )}
            </TableHeader>
            <TableBody>
              {/*
               * `table.getRowModel().rows`, not `rows`: that is the sorted,
               * selection-aware model, and iterating the raw prop instead is
               * precisely how a sortable header ends up doing nothing. Each
               * row's `original` is the caller's item, unchanged.
               */}
              {table.getRowModel().rows.map((row) => (
                <Row key={row.id} row={row}>
                  {hasCheckboxColumn ? (
                    <TableSelectionCell label={strings.selectRow(rowLabel(row.original))} />
                  ) : null}
                  {columns.map((column) => (
                    <Cell key={column.id}>{column.cell(row.original)}</Cell>
                  ))}
                </Row>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination !== undefined ? (
        <div className="flex justify-center border-bs border-border p-3">
          <Pagination
            locale={locale}
            page={pagination.page}
            count={pagination.count}
            onPageChange={pagination.onPageChange}
            label={pagination.label}
            previousLabel={pagination.previousLabel}
            nextLabel={pagination.nextLabel}
            pageLabel={pagination.pageLabel}
          />
        </div>
      ) : null}
    </section>
  );
}
