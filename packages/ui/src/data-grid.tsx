"use client";

import { createContext, useContext, useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { ColumnsIcon } from "lucide-react";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { Menu, MenuCheckboxItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { SelectField } from "./select.tsx";
import { Pagination } from "./pagination.tsx";
import { SearchField } from "./search-field.tsx";
import type { AsyncCollectionPresentation } from "./async-collection.ts";
import {
  dataGridEmptyVariants,
  dataGridFooterVariants,
  dataGridPageSizeVariants,
  dataGridRangeVariants,
  dataGridToolbarVariants,
  dataGridVariants,
} from "./data-grid.variants.ts";

export {
  dataGridEmptyVariants,
  dataGridFooterVariants,
  dataGridPageSizeVariants,
  dataGridRangeVariants,
  dataGridToolbarVariants,
  dataGridVariants,
};

export type DataGridPin = "start" | "end";

/** Logical sticky placement: identical bytes in LTR/RTL, mirrored by CSS. */
export function dataGridPinnedStyle(edge: DataGridPin, offset = 0): CSSProperties {
  return edge === "start"
    ? { position: "sticky", insetInlineStart: offset }
    : { position: "sticky", insetInlineEnd: offset };
}

export function reorderDataGridItems<T extends { id: string }>(
  items: readonly T[],
  activeId: string,
  beforeId: string,
): T[] {
  const from = items.findIndex((item) => item.id === activeId);
  const target = items.findIndex((item) => item.id === beforeId);
  if (from < 0 || target < 0 || from === target) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(from < target ? target - 1 : target, 0, item!);
  return next;
}

export type DataGridAggregate = "sum" | "count" | "min" | "max" | "mean" | "unique-count";

export function aggregateDataGrid<Row extends Record<string, unknown>>(
  rows: readonly Row[],
  reducers: Readonly<Partial<Record<keyof Row, DataGridAggregate>>>,
): Partial<Record<keyof Row, number>> {
  const result: Partial<Record<keyof Row, number>> = {};
  for (const key of Object.keys(reducers) as Array<keyof Row>) {
    const reducer = reducers[key];
    if (reducer === undefined) continue;
    const values = rows.map((row) => row[key]);
    const numbers = values.map(Number).filter(Number.isFinite);
    result[key] =
      reducer === "count"
        ? values.length
        : reducer === "unique-count"
          ? new Set(values).size
          : reducer === "sum"
            ? numbers.reduce((sum, value) => sum + value, 0)
            : reducer === "min"
              ? // Spreading an empty array into Math.min yields Infinity — an
                // empty column must aggregate to 0 like mean does, not ±∞.
                numbers.length === 0
                ? 0
                : Math.min(...numbers)
              : reducer === "max"
                ? numbers.length === 0
                  ? 0
                  : Math.max(...numbers)
                : numbers.length === 0
                  ? 0
                  : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }
  return result;
}

export interface DataGridEditableCellProps {
  /** The accessible name of the edit input. */
  label: string;
  /** The accessible name of the control that abandons the edit. */
  cancelLabel: string;
  /** The cell's committed value the editor starts from. */
  value: string;
  /** Called with the new value when the edit is confirmed. */
  onCommit: (value: string) => void;
  /** Returns an error message for a candidate value, or null to accept it. */
  validate?: ((value: string) => string | null) | undefined;
  isDisabled?: boolean | undefined;
  className?: string | undefined;
}

/** Controlled-value cell editor with transactional Enter/Escape semantics. */
export function DataGridEditableCell({
  label,
  cancelLabel,
  value,
  onCommit,
  validate,
  isDisabled,
  className,
}: DataGridEditableCellProps) {
  const errorId = useId();
  const [draft, setDraft] = useState(value);
  // A new committed value replaces the draft. Adjusted during render (React's
  // "storing information from previous renders"), not from an effect.
  const [committed, setCommitted] = useState(value);
  if (committed !== value) {
    setCommitted(value);
    setDraft(value);
  }
  const error = validate?.(draft) ?? null;
  return (
    <>
      <input
        data-lumo=""
        aria-label={label}
        aria-keyshortcuts="Enter Escape"
        aria-description={cancelLabel}
        aria-invalid={error !== null || undefined}
        aria-errormessage={error === null ? undefined : errorId}
        disabled={isDisabled}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(value);
          } else if (event.key === "Enter" && error === null) {
            event.preventDefault();
            onCommit(draft);
          }
        }}
        className={cn("min-w-0 bg-transparent px-2 py-1 outline-none", className)}
      />
      {error === null ? null : (
        <span id={errorId} role="alert" className="mt-1 block text-xs text-critical">
          {error}
        </span>
      )}
    </>
  );
}

/**
 * The chrome around a `<Table>` — search, column visibility, paging, emptiness.
 *
 *     const table = useLumoTable({ locale, data, columns, initialState: {…} });
 *
 *     <DataGrid locale={locale} table={table}>
 *       <DataGridToolbar>
 *         <DataGridSearch label="جست‌وجو" clearLabel="پاک کردن" />
 *         <DataGridColumnsMenu label="ستون‌ها" columns={columnLabels} />
 *       </DataGridToolbar>
 *       <Table label="سفارش‌ها" locale={locale} table={table}>…</Table>
 *       <DataGridEmpty>هیچ سفارشی پیدا نشد.</DataGridEmpty>
 *       <DataGridPagination label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی"
 *         pageLabel={(n) => `صفحه ${n}`} pageSizes={[10, 25, 50]} pageSizeLabel="تعداد در هر صفحه"
 *         rangeLabel={(from, to, total) => `${from}–${to} از ${total}`} />
 *     </DataGrid>
 *
 * The unopinionated middle between `<Table>` and the `table-view` block: column
 * visibility has no UI elsewhere, and the range read-out is a bidi trap (`rangeLabel`).
 * Nothing from TanStack is ever spread onto an element; the interfaces below name
 * exactly the members called. State is read from `table.state` (TanStack 9's reactive
 * projection), never `store.state`, which is a snapshot that never re-renders.
 */


/** What the column menu needs from a TanStack column. */
export interface DataGridColumn {
  id: string;
  getIsVisible: () => boolean;
  getCanHide: () => boolean;
  toggleVisibility: (visible?: boolean) => void;
}

/** What the parts below need from a table instance. */
export interface DataGridTableInstance {
  /** TanStack 9's REACTIVE state projection. Not `store.state`, which is a snapshot. */
  state: {
    pagination?: { pageIndex: number; pageSize: number } | undefined;
    globalFilter?: unknown;
  };
  getAllLeafColumns: () => readonly DataGridColumn[];
  getPageCount: () => number;
  getRowCount: () => number;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  setGlobalFilter: (value: string) => void;
}

interface DataGridContextValue {
  locale: Locale;
  table: DataGridTableInstance;
  asyncState: DataGridAsyncState | undefined;
}

const DataGridContext = createContext<DataGridContextValue | null>(null);

function useDataGrid(): DataGridContextValue {
  const context = useContext(DataGridContext);
  if (!context) {
    // Developer error at mount, never a string a reader sees.
    throw new Error("DataGrid parts must be used within a <DataGrid />");
  }
  return context;
}


export interface DataGridProps {
  /** Formats every number the grid shows. Required — see `formatNumber`. */
  locale: Locale;
  /** The instance from `useLumoTable`. The grid never creates one. */
  table: DataGridTableInstance;
  /** Shared loading/error/paging presentation from `useAsyncLumoTable`. */
  asyncState?: DataGridAsyncState | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The shell. A plain box that carries the locale and the table on a context. Not a
 * `role="region"`: the `<Table>` inside is already a named `role="grid"`.
 */
export type DataGridAsyncState = AsyncCollectionPresentation;

export function DataGrid({ locale, table, asyncState, children, className }: DataGridProps) {
  const rowCount = table.getRowCount();
  const stateText =
    asyncState?.status === "loading" || asyncState?.status === "error"
      ? asyncState.text
      : asyncState?.status === "ready" && rowCount === 0
        ? asyncState.emptyText
        : null;
  const stateAction =
    asyncState?.status === "ready" ? asyncState.loadMore : asyncState?.action;
  return (
    <DataGridContext.Provider value={{ locale, table, asyncState }}>
      <div
        data-lumo=""
        {...(asyncState?.status === "loading" ? { "aria-busy": true } : {})}
        className={cn(dataGridVariants(), className)}
      >
        {children as ReactNode}
        {asyncState === undefined ? null : (
          <div
            className={cn(
              "mt-2 flex items-center justify-between gap-2 text-sm text-fg-muted",
              stateText === null && stateAction === undefined ? "sr-only" : undefined,
            )}
          >
            <span role="status" aria-live="polite">
              {stateText}
            </span>
            {stateAction === undefined ? null : (
              <Button variant="outline" size="sm" onPress={stateAction.onPress}>
                {stateAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </DataGridContext.Provider>
  );
}

export interface DataGridToolbarProps {
  children?: LumoNode;
  className?: string | undefined;
}

/** The row above the table. `justify-between`, so no side is named. */
export function DataGridToolbar({ children, className }: DataGridToolbarProps) {
  return <div className={cn(dataGridToolbarVariants(), className)}>{children as ReactNode}</div>;
}


export interface DataGridSearchProps {
  /** Announced and displayed name, e.g. «جست‌وجو در سفارش‌ها». REQUIRED. */
  label: string;
  /** The clear button's name. REQUIRED — a default would be English. */
  clearLabel: string;
  /** Text shown in the empty search input. */
  placeholder?: string | undefined;
  className?: string | undefined;
}

/**
 * The global filter, wired to `setGlobalFilter`. The value is read from
 * `table.state.globalFilter` rather than mirrored in state; `String(… ?? "")` because
 * TanStack types it `unknown`.
 */
export function DataGridSearch({
  label,
  clearLabel,
  placeholder,
  className,
}: DataGridSearchProps) {
  const { table } = useDataGrid();
  return (
    <SearchField
      label={label}
      clearLabel={clearLabel}
      value={String(table.state.globalFilter ?? "")}
      onChange={(value) => {
        table.setGlobalFilter(value);
        // Filtering changes what page one MEANS; stay on page four and the grid is empty.
        table.setPageIndex(0);
      }}
      {...(placeholder === undefined ? {} : { placeholder })}
      className={cn("min-w-56 flex-1", className)}
    />
  );
}


export interface DataGridColumnLabel {
  /** The column's `id`, exactly as the table was given it. */
  id: string;
  /** The column's name in the reader's language. */
  label: string;
}

export interface DataGridColumnsMenuProps {
  /** Names BOTH the trigger and the menu, e.g. «ستون‌ها». REQUIRED: the trigger is a glyph. */
  label: string;
  /** The columns offered, with their names. A list rather than a lookup: a header is a `LumoNode`. */
  columns: readonly DataGridColumnLabel[];
  className?: string | undefined;
}

/**
 * A menu of `role="menuitemcheckbox"` toggles, one per column. The last visible column
 * cannot be hidden: a grid with no columns has no way back. `closeOnClick={false}` so
 * hiding three columns is one open.
 */
export function DataGridColumnsMenu({ label, columns, className }: DataGridColumnsMenuProps) {
  const { table } = useDataGrid();
  const all = table.getAllLeafColumns();
  const offered = columns
    .map((entry) => ({ entry, column: all.find((c) => c.id === entry.id) }))
    .filter((pair): pair is { entry: DataGridColumnLabel; column: DataGridColumn } =>
      pair.column !== undefined && pair.column.getCanHide(),
    );
  const visibleCount = offered.filter((pair) => pair.column.getIsVisible()).length;

  return (
    <MenuTrigger>
      <Button variant="outline" aria-label={label} className={className}>
        <ColumnsIcon aria-hidden="true" className="size-4" />
      </Button>
      <MenuPopover>
        <Menu aria-label={label}>
          {offered.map(({ entry, column }) => {
            const isVisible = column.getIsVisible();
            return (
              <MenuCheckboxItem
                key={entry.id}
                isSelected={isVisible}
                // The trap guard — see the docblock above.
                isDisabled={isVisible && visibleCount === 1}
                onChange={(next) => column.toggleVisibility(next)}
                textValue={entry.label}
              >
                {entry.label}
              </MenuCheckboxItem>
            );
          })}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}


export interface DataGridEmptyProps {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Shown when the current filter matches nothing. `role="status"`: emptiness is the
 * RESULT of the reader's last keystroke. The root is ALWAYS mounted and only its
 * children are conditional — a live region is a promise about MUTATIONS to a node
 * already being watched (Base UI's `ComboboxEmpty` states the same rule). `sr-only`,
 * not `hidden`, when populated. An invisible U+2060 is appended on mount and removed
 * after 200ms so an initially empty grid still produces a mutation.
 */
export function DataGridEmpty({ children, className }: DataGridEmptyProps) {
  const { table, asyncState } = useDataGrid();
  // Async emptiness belongs to the shared state on the shell; avoid two live regions.
  const isEmpty = asyncState === undefined && table.getRowCount() === 0;
  // The marker goes on whenever emptiness (re)appears — adjusted during render, not
  // from an effect — and a timer takes it off again 200ms later.
  const [mutationMarker, setMutationMarker] = useState(isEmpty);
  const [markedEmpty, setMarkedEmpty] = useState(isEmpty);
  if (markedEmpty !== isEmpty) {
    setMarkedEmpty(isEmpty);
    setMutationMarker(isEmpty);
  }
  useEffect(() => {
    if (!mutationMarker) return;
    const timeout = globalThis.setTimeout(() => setMutationMarker(false), 200);
    return () => globalThis.clearTimeout(timeout);
  }, [mutationMarker]);
  return (
    <div role="status" className={cn(isEmpty ? dataGridEmptyVariants() : "sr-only", className)}>
      {isEmpty ? (children as ReactNode) : null}
      {isEmpty && mutationMarker ? "\u2060" : null}
    </div>
  );
}


interface DataGridPaginationBaseProps {
  /** Names the pager's `<nav>` landmark, e.g. «صفحه‌بندی سفارش‌ها». REQUIRED. */
  label: string;
  /** Names the previous-page control. REQUIRED. */
  previousLabel: string;
  /** Names the next-page control. REQUIRED. */
  nextLabel: string;
  /** Builds a page button's name from the FORMATTED number. REQUIRED. */
  pageLabel: (formattedPage: string) => string;
  /**
   * Builds the range read-out from three ALREADY-FORMATTED numbers, e.g.
   * ``(from, to, total) => `${from}–${to} از ${total}` `` → «۱–۱۰ از ۴۸». A function,
   * not a template: clause order differs per language, and `۱–۱۰` is a bidi trap
   * (a neutral between two AN runs takes the paragraph direction), so only the caller
   * can place a U+200F where their wording needs one.
   */
  rangeLabel: (from: string, to: string, total: string) => string;
  className?: string | undefined;
}

/** No rows-per-page control, so there is nothing to name. */
interface NoPageSizesProps {
  pageSizes?: undefined;
  pageSizeLabel?: undefined;
}

/** A rows-per-page control, which is a control and therefore has a name. */
interface WithPageSizesProps {
  /** The rows-per-page choices, e.g. `[10, 25, 50]`. */
  pageSizes: readonly number[];
  /** Names the rows-per-page control, e.g. «تعداد در هر صفحه». */
  pageSizeLabel: string;
}

/**
 * The two props are a PAIR: sizes offered without a name used to make the control
 * silently disappear. The union, rather than a required `pageSizeLabel`, so a grid with
 * no size control need not invent a name for a dropdown that never renders.
 */
export type DataGridPaginationProps = DataGridPaginationBaseProps &
  (NoPageSizesProps | WithPageSizesProps);

/** The footer: how many rows you are looking at, and how to move. Every integer goes through `formatNumber`. */
export function DataGridPagination(props: DataGridPaginationProps) {
  // `props` is kept whole: destructuring collapses the union's `pageSizes`/`pageSizeLabel` pairing.
  const { label, previousLabel, nextLabel, pageLabel, rangeLabel, className } = props;
  const { locale, table } = useDataGrid();
  const pageIndex = table.state.pagination?.pageIndex ?? 0;
  const pageSize = table.state.pagination?.pageSize ?? 10;
  const total = table.getRowCount();
  const pageCount = table.getPageCount();

  // `from` clamps so an empty result reads «۰–۰ از ۰»; `to` clamps so the last page stays in range.
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className={cn(dataGridFooterVariants(), className)}>
      <div className="flex flex-wrap items-center gap-4">
        <span className={dataGridRangeVariants()}>
          {rangeLabel(
            formatNumber(from, locale),
            formatNumber(to, locale),
            formatNumber(total, locale),
          )}
        </span>

        {/* `props.pageSizes`, not a destructured local: this narrowing types `props.pageSizeLabel`. */}
        {props.pageSizes !== undefined && props.pageSizes.length > 0 ? (
          <div className={dataGridPageSizeVariants()}>
            <SelectField
              label={props.pageSizeLabel}
              placeholder={props.pageSizeLabel}
              size="sm"
              selectedKey={String(pageSize)}
              onSelectionChange={(key) => {
                if (key === null) return;
                table.setPageSize(Number(key));
                // Row 11 is on page two at ten-per-page and page one at fifty.
                table.setPageIndex(0);
              }}
              className="w-auto"
              triggerClassName="w-auto min-w-20"
              options={props.pageSizes.map((size) => ({
                // The key stays ASCII because it is parsed straight back by Number().
                value: String(size),
                label: formatNumber(size, locale),
              }))}
            />
          </div>
        ) : null}
      </div>

      {pageCount > 1 ? (
        <Pagination
          locale={locale}
          label={label}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          pageLabel={pageLabel}
          // `Pagination` is 1-based and TanStack is 0-based; converted HERE, once.
          page={pageIndex + 1}
          count={pageCount}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      ) : null}
    </div>
  );
}
