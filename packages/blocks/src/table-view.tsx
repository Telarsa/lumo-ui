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
 * The one cross-block import in this package (`./data-toolbar.tsx`, one-way, no
 * cycle). Two sorts stay separate: `toolbarSort` picks a named preset, a column
 * header sorts the grid — and that sort is REAL now: the TanStack instance is
 * built here via `useLumoTable` from `rows`/`columns`/`rowKey`, so a sortable
 * column must declare `sortValue` (you cannot sort a `<Badge>`). Selection
 * checkboxes render only under `selectionMode="multiple"`.
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
 * A sortable column, which must say what it sorts BY: `cell` renders a
 * `LumoNode`, and none of those is comparable. A typed pair rather than two
 * optional props, so a header cannot look sortable and silently not be.
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
 * TanStack's row-selection record, spelled out rather than imported — this
 * package has no `@tanstack/react-table` dependency. `true`, not `boolean`:
 * a row is selected by being PRESENT.
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
  /** Announced name of a row's checkbox, as a function of that row's own identity (from `rowLabel`). Required whenever selection is on. */
  selectRow: (rowLabel: string) => string;
  /** Announced on an ascending sortable column. Required whenever any column sorts. */
  sortAscendingLabel: string;
  sortDescendingLabel: string;
  /** Shown when `rows` is empty. */
  emptyTitle: string;
  emptyDescription?: string | undefined;
}

export interface TableViewProps<T extends object>
  // `table` is omitted, not forwarded: this block BUILDS the instance, and a
  // second one would give the grid two sources of selection/sort state.
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
  /** Turns on the checkbox column. Declared here rather than inherited from `TableProps`, which no longer carries it. */
  selectionMode?: "none" | "multiple" | undefined;
  /** The selected `rowKey`s, whenever the checkbox column is on. */
  onSelectionChange?: ((keys: readonly string[]) => void) | undefined;

  // DataToolbar, forwarded under its own names — a column header owns `sort`.
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
   * The state layer. Memoised on its inputs (TanStack rebuilds row models on
   * identity change). `accessorFn` exists only for a sortable column.
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
    // The row's TanStack id IS its `rowKey`, so a selection reports the caller's strings.
    getRowId: (row: T) => rowKey(row),
    enableRowSelection: hasCheckboxColumn,
    /*
     * Selection is CONTROLLED here, and it has to be: TanStack treats an
     * `onRowSelectionChange` without a matching `state` entry as caller-owned.
     */
    state: { rowSelection },
    onRowSelectionChange: (updater: RowSelection | ((old: RowSelection) => RowSelection)) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      // Presence IS selection — see `RowSelection`.
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
               * `table.getRowModel().rows`, not `rows`: that is the sorted, selection-aware
               * model; iterating the raw prop is how a sortable header ends up doing nothing.
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
