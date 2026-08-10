"use client";

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
 * from a dropdown ("newest first"). `sortDescriptor`/`onSortChange` (inherited
 * from `Table`, i.e. from React Aria) are the grid's OWN column-header sort.
 * These answer different questions and are kept as different names here
 * rather than forced to share one prop, so a screen can offer either, both, or
 * neither without the two ever colliding.
 *
 * ── SELECTION CHECKBOXES ARE OPT-IN, VIA `selectionMode="multiple"` ──────────
 *
 * `TableSelectAllColumn`/`TableSelectionCell` render only in that mode. Single
 * selection in a React Aria table works by pressing a row directly and needs
 * no checkbox column at all, so rendering one there would be a widget with no
 * matching interaction.
 *
 * `"use client"`: every callback here is a function prop, and `Table` itself
 * requires the directive.
 */
export interface TableViewColumn<T> {
  /** Stable key. Also the RAC column `id`. */
  id: string;
  /** The column's visible heading. */
  header: string;
  /** Renders one cell. `LumoNode`, so a raw number is a compile error. */
  cell: (item: T) => LumoNode;
  /** Marks this column as the row's accessible name. Exactly one column should be. */
  isRowHeader?: boolean | undefined;
  /** Lets the reader sort by this column. Uses the shared direction labels below. */
  allowsSorting?: boolean | undefined;
  className?: string | undefined;
}

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
  extends Omit<TableProps, "children" | "label" | "className"> {
  strings: TableViewStrings;
  /** Formats the result count and every pager number. Required by design. */
  locale: Locale;
  columns: readonly TableViewColumn<T>[];
  rows: readonly T[];
  /** Stable identity for `Row`'s `id` and the list's React key. */
  rowKey: (item: T) => string;
  /** The row's human identity, fed to `strings.selectRow`. */
  rowLabel: (item: T) => string;

  // DataToolbar, forwarded under its own names — see the file header for why
  // `toolbarSort`/`onToolbarSortChange` are not `sort`/`onSortChange`, which
  // this interface already carries for the grid's own column sort.
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
  ...tableProps
}: TableViewProps<T>) {
  const hasCheckboxColumn = selectionMode === "multiple";

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
          <Table
            label={strings.tableLabel}
            {...optional("selectionMode", selectionMode)}
            {...tableProps}
          >
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
              {rows.map((row) => (
                <Row key={rowKey(row)} id={rowKey(row)}>
                  {hasCheckboxColumn ? (
                    <TableSelectionCell label={strings.selectRow(rowLabel(row))} />
                  ) : null}
                  {columns.map((column) => (
                    <Cell key={column.id}>{column.cell(row)}</Cell>
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
