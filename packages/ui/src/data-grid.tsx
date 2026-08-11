"use client";

import { createContext, useContext, type ReactNode } from "react";
import { ColumnsIcon } from "lucide-react";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { Menu, MenuCheckboxItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { NativeSelect } from "./native-select.tsx";
import { Pagination } from "./pagination.tsx";
import { SearchField } from "./search-field.tsx";
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
 *
 *       <Table label="سفارش‌ها" locale={locale} table={table}>…</Table>
 *       <DataGridEmpty>هیچ سفارشی پیدا نشد.</DataGridEmpty>
 *
 *       <DataGridPagination
 *         label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی"
 *         pageLabel={(n) => `صفحه ${n}`}
 *         pageSizeLabel="تعداد در هر صفحه"
 *         rangeLabel={(from, to, total) => `${from}–${to} از ${total}`}
 *       />
 *     </DataGrid>
 *
 * ═══ WHY THIS EXISTS WHEN `table.tsx` AND `table-view` ALREADY DO ═══════════
 *
 * `<Table>` is the grid: roles, roving focus, direction-resolved arrows,
 * sorting and selection. The `table-view` BLOCK already composes it with a
 * toolbar and a pager. So the bar for a third thing is high, and it is cleared
 * by exactly one capability neither of them has and one defect neither can fix:
 *
 *  1. **Column visibility has no UI anywhere in the library.**
 *     `columnVisibilityFeature` was not even switched on in `lumoTableFeatures`
 *     until this file needed it. A table wide enough to need hiding is the
 *     normal case for an admin screen, and «ستون‌ها» is the control that makes
 *     one usable on a laptop.
 *  2. **The range read-out is a bidi trap**, and it is the reason this file is
 *     worth reading. See the note on `rangeLabel` below.
 *
 * `table-view` stays what it is — a screen, opinionated, one import. This is
 * the unopinionated middle: parts you arrange, over a table instance you own.
 *
 * ═══ THE BOUNDARY, INHERITED FROM `table.tsx` VERBATIM ══════════════════════
 *
 * Nothing from TanStack is ever spread onto an element here. The interfaces
 * below name exactly the members this file calls and nothing else, so a future
 * minor that starts returning `getPaginationProps()`-shaped objects cannot get
 * a `role` into a Lumo element without someone widening a type in this file and
 * writing down why. Every member returns a scalar or a callback.
 *
 * State is read from `table.state`, which is TanStack 9's reactive projection —
 * verified in `dist/useTable.js`, where `useSelector(rootSource, selector)` is
 * what re-renders the tree. `useLumoTable` passes no selector, so every
 * registered slice is subscribed and `table.state.pagination` is live. Reading
 * `table.store.state` instead would be a snapshot that never re-renders, which
 * is the subtle way a pager ends up frozen on page one.
 *
 * `"use client"`: every part here reads live table state.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE SEAM
 * ═══════════════════════════════════════════════════════════════════════════ */

/** What the column menu needs from a TanStack column. */
export interface DataGridColumn {
  id: string;
  getIsVisible: () => boolean;
  getCanHide: () => boolean;
  toggleVisibility: (visible?: boolean) => void;
}

/** What the parts below need from a table instance. */
export interface DataGridTableInstance {
  /**
   * TanStack 9's REACTIVE state projection. Not `store.state`, which is a
   * snapshot — see the file header.
   */
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

/* ════════════════════════════════════════════════════════════════════════════
 * THE SHELL
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DataGridProps {
  /** Formats every number the grid shows. Required — see `formatNumber`. */
  locale: Locale;
  /** The instance from `useLumoTable`. The grid never creates one. */
  table: DataGridTableInstance;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The shell. A plain box that carries the locale and the table on a context.
 *
 * Deliberately NOT a `role="region"` and deliberately unnamed: the `<Table>`
 * inside it is already a named `role="grid"`, and wrapping it in a landmark
 * would announce the same collection twice and put a second entry in every
 * screen reader's landmark list. `frame.tsx` makes the same call for the same
 * reason.
 */
export function DataGrid({ locale, table, children, className }: DataGridProps) {
  return (
    <DataGridContext.Provider value={{ locale, table }}>
      <div data-lumo="" className={cn(dataGridVariants(), className)}>
        {children as ReactNode}
      </div>
    </DataGridContext.Provider>
  );
}

export interface DataGridToolbarProps {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The row above the table.
 *
 * `justify-between` rather than `ms-auto` on the last child: naming no side at
 * all is one fewer logical property to get wrong, and it keeps working when a
 * caller puts three things in here instead of two.
 */
export function DataGridToolbar({ children, className }: DataGridToolbarProps) {
  return <div className={cn(dataGridToolbarVariants(), className)}>{children as ReactNode}</div>;
}

/* ════════════════════════════════════════════════════════════════════════════
 * SEARCH
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DataGridSearchProps {
  /** Announced and displayed name, e.g. «جست‌وجو در سفارش‌ها». REQUIRED. */
  label: string;
  /** The clear button's name. REQUIRED — a default would be English. */
  clearLabel: string;
  placeholder?: string | undefined;
  className?: string | undefined;
}

/**
 * The global filter, wired to `setGlobalFilter`.
 *
 * The value is read from `table.state.globalFilter` rather than held here, so
 * a caller who resets the filter from a "clear all" button elsewhere sees this
 * field empty — the rule `table.tsx` states as "no `useState` mirrors what the
 * DOM (or the store) already says".
 *
 * `String(… ?? "")` and not a cast: TanStack types `globalFilter` as `unknown`
 * because a consumer may filter on any shape, and a `<SearchField>` takes a
 * string. Coercing at the boundary is honest; asserting a type it does not
 * have is how an object reaches `value` and React warns at runtime.
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
        // Filtering changes what page one MEANS. Without this, filtering while
        // on page four leaves the reader looking at an empty grid with a pager
        // that says there is nothing wrong.
        table.setPageIndex(0);
      }}
      {...(placeholder === undefined ? {} : { placeholder })}
      className={cn("min-w-56 flex-1", className)}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * COLUMN VISIBILITY
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DataGridColumnLabel {
  /** The column's `id`, exactly as the table was given it. */
  id: string;
  /** The column's name in the reader's language. */
  label: string;
}

export interface DataGridColumnsMenuProps {
  /**
   * Names BOTH the trigger and the menu, e.g. «ستون‌ها». REQUIRED.
   *
   * The trigger carries an icon, so without this it is an unnamed button and
   * `named-controls` fails the build. The menu takes the same string because
   * Base UI otherwise names the popup from the trigger's visible text — which
   * is nothing at all when the trigger is a glyph.
   */
  label: string;
  /**
   * The columns offered, with their names.
   *
   * A list rather than a lookup INTO the table, because a column's header is a
   * `LumoNode` — it may be an icon, or a header with a sort arrow in it — and
   * there is no honest way to derive a string from one. Naming them here also
   * means the menu shows only the columns worth offering: an id absent from
   * this list is simply not in the menu.
   */
  columns: readonly DataGridColumnLabel[];
  className?: string | undefined;
}

/**
 * A menu of `role="menuitemcheckbox"` toggles, one per column.
 *
 * ── WHY THE LAST VISIBLE COLUMN CANNOT BE HIDDEN ────────────────────────────
 *
 * A grid with every column hidden is a grid with no cells, no row headers and
 * nothing for a screen reader to announce — and no way back, because the only
 * control that could restore a column is the one the reader just used to
 * destroy the view. So the final visible toggle is `isDisabled`. That is not a
 * styling nicety: it is the difference between a recoverable state and a
 * trapped one.
 *
 * `closeOnClick={false}` is inherited from `MenuCheckboxItem`'s default:
 * hiding three columns should not mean opening the menu three times.
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

/* ════════════════════════════════════════════════════════════════════════════
 * EMPTINESS
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DataGridEmptyProps {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Shown when the current filter matches nothing.
 *
 * `role="status"`, because emptiness is the RESULT of the reader's last
 * keystroke in the search field. Without a live region the grid silently
 * becomes blank and a screen reader user is given no reason for it — the same
 * argument `sortable.tsx` makes about a move with no visible affordance.
 *
 * It renders NOTHING when there are rows, rather than rendering hidden: an
 * empty live region that exists on every page is a region that announces the
 * moment it is filled, which is what makes this useful, and a `hidden` node
 * with text in it is a string some screen readers will still reach.
 */
export function DataGridEmpty({ children, className }: DataGridEmptyProps) {
  const { table } = useDataGrid();
  if (table.getRowCount() > 0) return null;
  return (
    <div role="status" className={cn(dataGridEmptyVariants(), className)}>
      {children as ReactNode}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * PAGING
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DataGridPaginationProps {
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
   * ``(from, to, total) => `${from}–${to} از ${total}` `` → «۱–۱۰ از ۴۸».
   *
   * ── THIS PROP IS THE REASON THIS FILE EXISTS ────────────────────────────
   *
   * A function and not a `"{from}–{to} of {total}"` template, and not a string
   * this file assembles, for two independent reasons that happen to have the
   * same fix.
   *
   * The first is the one `core/src/strings.ts` makes for the whole library:
   * «۱–۱۰ از ۴۸» and "1–10 of 48" do not place their figures in the same
   * clause positions once a translator is given a real sentence, and a
   * template with three holes forces one language into the other's grammar.
   *
   * The second is BIDI, and it is specific to this read-out. `۱–۱۰` is two
   * Arabic-number runs with a neutral character between them. Under the
   * Unicode bidi algorithm a neutral between two AN runs inside an RTL
   * paragraph takes the PARAGRAPH's direction, so the dash resolves
   * right-to-left and the range can render as «۱۰–۱» — the same numbers,
   * reversed, silently, and only in Persian. Every screenshot an English
   * reviewer takes is correct.
   *
   * Handing the whole sentence to the caller is what lets them place a
   * U+200F or a `<bdi>`-equivalent if their wording needs one, rather than
   * this file guessing at a separator it cannot see. `phone-input.tsx`
   * records the same class of failure for a dial code.
   */
  rangeLabel: (from: string, to: string, total: string) => string;
  /**
   * Names the rows-per-page control, e.g. «تعداد در هر صفحه». REQUIRED.
   *
   * Omitting `pageSizes` removes the control; omitting this while supplying
   * sizes would leave a `<select>` with no name, which is the quietest form of
   * the `named-controls` defect.
   */
  pageSizeLabel?: string | undefined;
  /** The rows-per-page choices. Omit to render no size control. */
  pageSizes?: readonly number[] | undefined;
  className?: string | undefined;
}

/**
 * The footer: how many rows you are looking at, and how to move.
 *
 * Every integer on this row goes through `formatNumber` — the page numbers
 * inside `Pagination`, the range read-out, and each option in the size select.
 * A bare `{pageSize}` in the `<option>` is the exact defect `LumoNode` exists
 * for, and an `<option>` is one of the few places it can still hide, because
 * option text is not JSX children that `LumoNode` can refuse.
 */
export function DataGridPagination({
  label,
  previousLabel,
  nextLabel,
  pageLabel,
  rangeLabel,
  pageSizeLabel,
  pageSizes,
  className,
}: DataGridPaginationProps) {
  const { locale, table } = useDataGrid();
  const pageIndex = table.state.pagination?.pageIndex ?? 0;
  const pageSize = table.state.pagination?.pageSize ?? 10;
  const total = table.getRowCount();
  const pageCount = table.getPageCount();

  /*
   * The read-out's arithmetic, which is where an off-by-one is invisible.
   *
   * `from` is clamped to `total` so an empty result reads «۰–۰ از ۰» rather
   * than «۱–۰ از ۰», and `to` is clamped so the last page does not claim rows
   * past the end. Both are one `Math.min` and both are wrong in every
   * hand-written pager the first time.
   */
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

        {pageSizes !== undefined && pageSizes.length > 0 && pageSizeLabel !== undefined ? (
          <div className={dataGridPageSizeVariants()}>
            <NativeSelect
              label={pageSizeLabel}
              // Hidden, not absent: the footer already reads as one row and a
              // second visible label would read as a second question. The name
              // still has to exist — see `phone-input.tsx`, same call.
              labelHidden
              size="sm"
              value={String(pageSize)}
              onChange={(event) => {
                table.setPageSize(Number(event.target.value));
                // Row 11 is on page two at ten-per-page and page one at fifty.
                // Keeping the index would land the reader past the end.
                table.setPageIndex(0);
              }}
              className="w-auto"
            >
              {pageSizes.map((size) => (
                // Through `formatNumber`. The VALUE stays ASCII because it is
                // parsed straight back by `Number()` — the same in/out split
                // `input-otp.tsx` and `phone-input.tsx` draw.
                <option key={size} value={String(size)}>
                  {formatNumber(size, locale)}
                </option>
              ))}
            </NativeSelect>
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
          // `Pagination` is 1-based and TanStack is 0-based. The conversion is
          // done HERE, once, rather than being a rule every caller remembers.
          page={pageIndex + 1}
          count={pageCount}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      ) : null}
    </div>
  );
}
