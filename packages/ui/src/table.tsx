"use client";

import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronDown } from "lucide-react";
import {
  columnFilteringFeature,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
  useTable,
  type RowData,
} from "@tanstack/react-table";
import { FORMAT_LOCALE, cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { Checkbox, type CheckboxProps } from "./checkbox.tsx";
import {
  presentAsyncCollection,
  useAsyncCollection,
  type AsyncCollectionMessages,
  type AsyncCollectionOptions,
  type AsyncCollectionStatus,
} from "./async-collection.ts";
import { useVirtualWindow } from "./virtualizer.ts";
import {
  executeQuery,
  type FilterQuery,
  type QueryExecutionField,
} from "./filters.shared.ts";
import {
  cellVariants,
  columnResizerVariants,
  columnVariants,
  gridArrow,
  resizableTableContainerVariants,
  rowVariants,
  tableBodyVariants,
  tableFooterVariants,
  tableHeaderVariants,
  tableVariants,
} from "./table.variants.ts";

export {
  cellVariants,
  columnResizerVariants,
  columnVariants,
  gridArrow,
  resizableTableContainerVariants,
  rowVariants,
  tableBodyVariants,
  tableFooterVariants,
  tableHeaderVariants,
  tableVariants,
};
export type { GridArrow, GridStep } from "./table.variants.ts";

/**
 * `<Checkbox>` with a `tabIndex`, which its own public API does not declare.
 * A type gap only: `checkbox.tsx` spreads unrecognised props onto the Base UI
 * root, so the value reaches the DOM. Proper fix is `tabIndex?` in `CheckboxProps`.
 */
const RovingCheckbox = Checkbox as (
  props: CheckboxProps & { tabIndex?: number | undefined },
) => ReactNode;

/**
 * A data grid. Base UI has no table, so every line of markup, every ARIA
 * attribute, the single roving tab stop and the direction-resolved arrow keys
 * are Lumo's; `@tanstack/react-table` supplies STATE only (sorting, selection,
 * sizing) and nothing from it is ever spread onto an element — every attribute
 * is written by hand from a scalar it returned. Navigation reads its target out
 * of the DOM (`data-row-index`/`data-col-index`), not a registry, because a
 * virtualised body unmounts rows constantly. Every announced string is a
 * required prop (an anonymous control is worse than an English one), and the
 * default sort is an `Intl.Collator` because TanStack's default is a UTF-16
 * code-unit compare that splits Persian into two alphabets. Typeahead was lost
 * in the migration and is not reimplemented. Long form: `docs/decisions/log.md`.
 */

/* THE STATE LAYER */

/**
 * The features Lumo's grid switches on, assembled once at module scope.
 * TanStack 9 features are opt-in; a consumer who forgets one gets a column
 * that renders a sort arrow and sorts nothing. The locale-aware default sort
 * is not registered here because it needs a locale — see `localeSortFn`.
 */
export const lumoTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  rowExpandingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnSizingFeature,
  columnResizingFeature,
  // Switched on for `data-grid.tsx`'s column menu.
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnGroupingFeature,
  rowPinningFeature,
  rowAggregationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  sortFns: { basic: sortFn_basic, datetime: sortFn_datetime },
  filterFns: { includesString: filterFn_includesString },
});

export type LumoTableFeatures = typeof lumoTableFeatures;

/**
 * A comparator that sorts the way the reader's language does. `numeric: true`
 * gives natural order for arabext digits; `sensitivity: "base"` folds the ی/ي
 * and ک/ك pairs, the same choice `search-index.ts` makes.
 */
export function localeSortFn(locale: Locale) {
  const collator = new Intl.Collator(FORMAT_LOCALE[locale], {
    numeric: true,
    sensitivity: "base",
  });
  return (rowA: { getValue: (id: string) => unknown }, rowB: { getValue: (id: string) => unknown }, columnId: string) =>
    collator.compare(String(rowA.getValue(columnId) ?? ""), String(rowB.getValue(columnId) ?? ""));
}

/**
 * The grid's state: `useTable` with Lumo's feature set and a locale-aware
 * default comparator. The return value IS TanStack's table instance; selection
 * and sorting options are passed here, not to `<Table>`.
 */
export type LumoTableOptions<TData extends RowData> = Omit<
  Parameters<typeof useTable<LumoTableFeatures, TData>>[0],
  "features"
> & {
  /** The locale whose collation the default sort uses. */
  locale: Locale;
};

export function useLumoTable<TData extends RowData>(options: LumoTableOptions<TData>) {
  const { locale, defaultColumn, ...rest } = options;
  const sortFn = useMemo(() => localeSortFn(locale), [locale]);
  return useTable<LumoTableFeatures, TData>({
    features: lumoTableFeatures,
    // The locale-aware comparator is the DEFAULT, not an override.
    defaultColumn: { sortFn, ...defaultColumn },
    getGroupedRowModel: createGroupedRowModel(),
    ...rest,
  } as Parameters<typeof useTable<LumoTableFeatures, TData>>[0]);
}

export type LumoQueryTableOptions<TData extends RowData> = Omit<
  LumoTableOptions<TData>,
  "data"
> & {
  /** Unfiltered source rows. */
  data: readonly TData[];
  /** The same serializable query model rendered by `Filters`. */
  query: FilterQuery;
  /** Typed field readers and operators used for local execution. */
  queryFields: readonly QueryExecutionField<TData>[];
};

/**
 * Creates a Lumo table from the same typed query tree used by Filters and
 * remote collection adapters, so local DataGrid filtering is not a second DSL.
 */
export function useLumoQueryTable<TData extends RowData>({
  data,
  query,
  queryFields,
  ...options
}: LumoQueryTableOptions<TData>) {
  const queriedData = executeQuery(data, query, queryFields);
  return useLumoTable({ ...options, data: queriedData } as LumoTableOptions<TData>);
}

export interface AsyncLumoTableOptions<
  TData extends RowData,
  Query,
  Cursor = string,
> {
  /** Transport-independent loading, paging and identity contract. */
  collection: AsyncCollectionOptions<TData, Query, Cursor>;
  /** Ordinary Lumo table options; rows always come from `collection`. */
  table: Omit<LumoTableOptions<TData>, "data">;
  /** Every announced collection sentence, authored by the caller. */
  messages: AsyncCollectionMessages;
}

/**
 * Projects one shared async collection into a Lumo table and its presentation
 * state. Cancellation, stale results, paging, retry and refresh remain owned by
 * `useAsyncCollection`; the grid receives no second loader state machine.
 */
export function useAsyncLumoTable<
  TData extends RowData,
  Query,
  Cursor = string,
>({
  collection: collectionOptions,
  table: tableOptions,
  messages,
}: AsyncLumoTableOptions<TData, Query, Cursor>) {
  const collection = useAsyncCollection(collectionOptions);
  const table = useLumoTable({
    ...tableOptions,
    data: collection.items,
  } as LumoTableOptions<TData>);
  return {
    table,
    collection,
    asyncState: presentAsyncCollection(collection, messages),
  };
}

/*
 * THE SEAM. `Table` and its parts accept the structural interfaces below, not
 * TanStack's `Table<Features, TData>`: every member returns a scalar or a
 * callback, so a props object, `role` or handler cannot arrive from TanStack
 * without someone widening an interface here and writing down why.
 */

/** What `Column` needs from a TanStack column. */
export interface LumoTableColumn {
  getIsSorted: () => "asc" | "desc" | false;
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
  toggleSorting: () => void;
  getIsResizing: () => boolean;
  getSize: () => number;
  /** Whether this column is currently part of the rendered projection. */
  getIsVisible?: (() => boolean) | undefined;
  columnDef: { minSize?: number | undefined; maxSize?: number | undefined };
  id: string;
}

/** What `Row` and `TableSelectionCell` need from a TanStack row. */
export interface LumoTableRow {
  id: string;
  getIsSelected: () => boolean;
  getCanSelect: () => boolean;
  toggleSelected: () => void;
  depth?: number | undefined;
  getCanExpand?: (() => boolean) | undefined;
  getIsExpanded?: (() => boolean) | undefined;
}

/** The extra scalar state a hierarchical row exposes to `TableTreeCell`. */
export interface LumoExpandableTableRow extends LumoTableRow {
  depth: number;
  getCanExpand: () => boolean;
  getIsExpanded: () => boolean;
  toggleExpanded: () => void;
}

/** What `Table`, `TableSelectAllColumn` and `ColumnResizer` need from a table. */
export interface LumoTableInstance {
  getRowModel: () => { rows: readonly unknown[] };
  getAllColumns: () => readonly unknown[];
  getColumn: (id: string) => LumoTableColumn | undefined;
  getHeaderGroups: () => readonly {
    headers: readonly {
      column: LumoTableColumn;
      getResizeHandler: () => (event: unknown) => void;
    }[];
  }[];
  getIsAllRowsSelected: () => boolean;
  getIsSomeRowsSelected: () => boolean;
  toggleAllRowsSelected: () => void;
  setColumnSizing: (
    updater: (current: Record<string, number>) => Record<string, number>,
  ) => void;
  options: { enableRowSelection?: unknown; enableMultiRowSelection?: unknown };
}

/* THE CONTEXTS — contexts rather than `cloneElement`, which breaks when a caller wraps a cell. */

interface TableContextValue {
  locale: Locale;
  /** Whether the rows form a hierarchy rather than a flat grid. */
  hierarchical: boolean;
  /** `{row, col}` of the one cell that is in the tab order. */
  active: { row: number; col: number };
  /** The TanStack instance, when the caller supplied one. */
  table: LumoTableInstance | undefined;
  /** What the header and body tell the parts rendered after them; see the class. */
  registry: TableRegistry;
}

/**
 * What the header and body register for the parts that render AFTER them, in
 * the SAME pass. One mutable instance per `Table`, written during render, NOT
 * state: `<thead>` renders before `<tbody>` in one synchronous pass (server
 * render included), and state would need a second pass before the first row
 * could be a `rowheader`. Every write is idempotent under StrictMode.
 *
 * - `rowHeaderColumns`: which column indices were declared `isRowHeader`. A body
 *   rendered before its header degrades to gridcells, which is why `Cell` also
 *   accepts an explicit `isRowHeader`.
 * - `hiddenColumns`: column positions hidden by the state layer; written by the
 *   header before the body renders.
 * - `bodyRowCount`: how many rows the body rendered, so `TableFooter` knows its
 *   row index; a footer that guessed wrong would put two cells at one coordinate
 *   and the arrow keys stop short. Written through `setBodyRowCount` — the
 *   registry's writes are explicit operations, never incidental stores.
 */
class TableRegistry {
  readonly rowHeaderColumns = new Set<number>();
  readonly hiddenColumns = new Set<number>();
  bodyRowCount = 0;
  setBodyRowCount(count: number): void {
    this.bodyRowCount = count;
  }
}

const TableContext = createContext<TableContextValue | null>(null);
/** Row 0 is the header row; body rows start at 1. */
const RowContext = createContext<{ index: number; row: unknown } | null>(null);
const ColContext = createContext<number>(0);
const ColumnIdContext = createContext<string | undefined>(undefined);

function useTableContext(): TableContextValue {
  const context = useContext(TableContext);
  if (!context) {
    // Developer error at mount, never a string a reader sees.
    throw new Error("Table parts must be used within a <Table />");
  }
  return context;
}

/**
 * Give each child its column index via a Provider, not `cloneElement` (which
 * would land the prop on a wrapping `<Tooltip>` instead of the `<Cell>`).
 */
function withColumnIndexes(children: ReactNode): ReactNode {
  // `Children.toArray`, NOT `Children.map`: `map` calls back for a nullish
  // child too, so `{cond ? <Column/> : null}` consumed index 0 and the roving
  // stop at {0,0} matched nothing — the whole grid was unreachable until hydration.
  return Children.toArray(children).map((child, index) => (
    <ColContext.Provider key={index} value={index}>
      {child}
    </ColContext.Provider>
  ));
}

/* THE GRID */

export interface TableProps
  extends Omit<
    ComponentProps<"table">,
    /* OWNED BY THE GRID: `ref` reads cell coordinates from the DOM and `onKeyDown`
     * IS the arrow-key model; a consumer replacing either killed navigation silently. */
    | "ref"
    | "onKeyDown"
    | "children"
    | "className"
    | "aria-label"
    | "aria-rowcount"
    | "aria-busy"
    | "role"
  > {
  /** Announced name of the grid. REQUIRED — an unnamed grid announces "grid" and nothing else. */
  label: string;
  /** The locale. Drives the arrow-key mapping and the default collation; there is deliberately no `dir` prop. */
  locale: Locale;
  /** Emits `role="treegrid"` and hierarchical row state. */
  hierarchical?: boolean | undefined;
  /** The instance from `useLumoTable`, when this grid has state. */
  table?: LumoTableInstance | undefined;
  /** Total data rows when only a virtual/paged window is mounted. */
  rowCount?: number | undefined;
  /** Remote work state; active loading is exposed on the grid. */
  asyncStatus?: AsyncCollectionStatus | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Table({
  label,
  locale,
  table,
  rowCount,
  asyncStatus,
  hierarchical = false,
  className,
  ...props
}: TableProps) {
  const ref = useRef<HTMLTableElement>(null);
  const [active, setActive] = useState({ row: 0, col: 0 });
  const arrow = useMemo(() => gridArrow(locale), [locale]);
  // One instance for the life of the grid (state for identity, never set).
  const [registry] = useState(() => new TableRegistry());

  /** Move the roving tab stop. Targets are read from the DOM, not a registry; `preventDefault` only for keys the grid claims. */
  function onKeyDown(event: ReactKeyboardEvent<HTMLTableElement>) {
    const treeToggle = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-lumo-tree-toggle]",
    );
    if (hierarchical && treeToggle !== null) {
      const expanded = treeToggle.getAttribute("aria-expanded") === "true";
      const inlineEndKey = arrow.direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const inlineStartKey = arrow.direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      if ((!expanded && event.key === inlineEndKey) || (expanded && event.key === inlineStartKey)) {
        event.preventDefault();
        treeToggle.click();
        return;
      }
    }

    const grid = ref.current;
    if (!grid) return;

    // Jump keys (Home/End/Ctrl+Home/Ctrl+End/PageUp/PageDown), resolved against
    // RENDERED cells so a hidden column or virtual window cannot land on nothing.
    const jump = arrow.jump(event.key, event.ctrlKey || event.metaKey);
    if (jump !== null) {
      const cells = [...grid.querySelectorAll<HTMLElement>("[data-row-index][data-col-index]")];
      const coord = (cell: HTMLElement) => ({
        row: Number(cell.dataset["rowIndex"]),
        col: Number(cell.dataset["colIndex"]),
      });
      const rows = [...new Set(cells.map((cell) => coord(cell).row))].sort((a, b) => a - b);
      const inRow = (row: number) => cells.filter((cell) => coord(cell).row === row).map(coord).sort((a, b) => a.col - b.col);
      let jumpTarget: { row: number; col: number } | undefined;
      const current = inRow(active.row);
      switch (jump) {
        case "row-start": jumpTarget = current[0]; break;
        case "row-end": jumpTarget = current[current.length - 1]; break;
        case "grid-start": jumpTarget = inRow(rows[0] ?? active.row)[0]; break;
        case "grid-end": { const last = inRow(rows[rows.length - 1] ?? active.row); jumpTarget = last[last.length - 1]; break; }
        case "page-up":
        case "page-down": {
          const index = rows.indexOf(active.row);
          const page = Math.max(1, rows.length - 1);
          const rowIndex = Math.min(rows.length - 1, Math.max(0, index + (jump === "page-up" ? -page : page)));
          const row = rows[rowIndex];
          const targetRowCells = row === undefined ? [] : inRow(row);
          jumpTarget = targetRowCells.find((cell) => cell.col === active.col) ?? targetRowCells[0];
          break;
        }
      }
      if (jumpTarget === undefined) return;
      const jumpCell = grid.querySelector<HTMLElement>(
        `[data-row-index="${jumpTarget.row}"][data-col-index="${jumpTarget.col}"]`,
      );
      if (jumpCell === null) return;
      event.preventDefault();
      setActive(jumpTarget);
      focusStop(jumpCell);
      return;
    }

    const step = arrow.step(event.key);
    if (step === null) return;

    let next = { row: active.row + step.row, col: active.col + step.col };
    let target: HTMLElement | null = null;
    const cellCount = grid.querySelectorAll<HTMLElement>(
      "[data-row-index][data-col-index]",
    ).length;

    // A hidden column keeps its source index but is absent from the DOM; walk
    // past the gap. `cellCount` bounds the loop against sparse markup.
    for (let attempt = 0; attempt < cellCount; attempt += 1) {
      if (next.row < 0 || next.col < 0) break;
      target = grid.querySelector<HTMLElement>(
        `[data-row-index="${next.row}"][data-col-index="${next.col}"]`,
      );
      if (target !== null) break;
      next = { row: next.row + step.row, col: next.col + step.col };
    }
    // No wrap-around and no clamping: at an edge the key does nothing.
    if (target === null) return;

    event.preventDefault();
    setActive(next);

    focusStop(target);
  }

  /**
   * The cell if the cell is the focusable thing, the control inside if it is
   * not. Coordinates always live on the CELL; the opt-in `data-lumo-widget-cell`
   * is written by the parts that KNOW they delegate rather than inferred (a
   * `<Column>` with a resizer is itself focusable). Not `[tabindex="0"]`: the
   * re-render has not happened yet, so the control is still at `-1`.
   */
  function focusStop(cell: HTMLElement) {
    const widget = cell.hasAttribute("data-lumo-widget-cell")
      ? cell.querySelector<HTMLElement>("button,a[href],input,select,textarea")
      : null;
    (widget ?? cell).focus();
  }

  const value = useMemo<TableContextValue>(
    () => ({
      locale,
      hierarchical,
      active,
      table,
      registry,
    }),
    [locale, hierarchical, active, table, registry],
  );

  // `aria-multiselectable` is read from TanStack's options rather than accepted
  // as a prop so it cannot disagree with the installed selection model.
  const options = table?.options;
  const multiselectable =
    options !== undefined &&
    options.enableRowSelection !== undefined &&
    options.enableRowSelection !== false &&
    options.enableMultiRowSelection !== false;

  return (
    <TableContext.Provider value={value}>
      <table
        /* `{...props}` FIRST — the reverse of the house order, deliberately: the
         * grid's `ref`/`onKeyDown` must win or arrow navigation dies silently. */
        {...props}
        ref={ref}
        data-lumo=""
        role={hierarchical ? "treegrid" : "grid"}
        aria-label={label}
        /* `aria-rowcount` counts the header row too. Both counts are RAW integers,
         * never `formatNumber`ed — a Persian digit here is an invalid attribute value. */
        {...(table === undefined
          ? {}
          : {
              "aria-rowcount": (rowCount ?? table.getRowModel().rows.length) + 1,
              "aria-colcount": table.getAllColumns().length,
            })}
        {...(multiselectable ? { "aria-multiselectable": true } : {})}
        {...(asyncStatus === "loading" || asyncStatus === "refreshing" || asyncStatus === "loading-more"
          ? { "aria-busy": true }
          : {})}
        onKeyDown={onKeyDown}
        className={cn(tableVariants(), className)}
      />
    </TableContext.Provider>
  );
}

export interface TableHeaderProps
  extends Omit<ComponentProps<"thead">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={cn(tableHeaderVariants(), className)} {...props}>
      {/* Row 0; body rows start at 1; `aria-rowindex` is 1-based on top. */}
      <RowContext.Provider value={{ index: 0, row: undefined }}>
        <tr role="row" aria-rowindex={1}>
          {withColumnIndexes(children)}
        </tr>
      </RowContext.Provider>
    </thead>
  );
}

/* COLUMNS */

interface ColumnBaseProps
  extends Omit<
    ComponentProps<"th">,
    "children" | "className" | "scope" | "role" | "aria-colindex" | "aria-sort"
  > {
  /** The column's key. Matches a TanStack column `id` when there is a table. */
  id?: string | undefined;
  /**
   * The cells in THIS column name their row — they become `<th scope="row">`
   * with `role="rowheader"`. Declared once on the column, not per cell.
   */
  isRowHeader?: boolean | undefined;
  /**
   * The column's initial inline size, e.g. `160` or `"20%"`. An `inline-size`
   * on the `<th>` only; when a TanStack instance owns sizing, `column.size`
   * is authoritative and this is the pre-hydration hint.
   */
  defaultWidth?: number | string | undefined;
  children?: LumoNode;
  /** A `<ColumnResizer>`, as its own slot so it is not part of the header's announced name. */
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
   * «مرتب‌شده صعودی». REQUIRED because Android TalkBack ignores `aria-sort`.
   */
  sortAscendingLabel: string;
  /** As `sortAscendingLabel`, for the descending state. */
  sortDescendingLabel: string;
}

export type ColumnProps = ColumnBaseProps & (UnsortableColumnProps | SortableColumnProps);

/**
 * One column header. `allowsSorting` is a typed pair: it does not compile
 * without both direction labels. Only the ACTIVE direction is announced. The
 * arrows are block-axis glyphs, so no `rtl:` variant is needed.
 */
export function Column({
  id,
  isRowHeader,
  defaultWidth,
  className,
  children,
  resizer,
  allowsSorting,
  sortAscendingLabel,
  sortDescendingLabel,
  ...props
}: ColumnProps) {
  const { table, active, registry } = useTableContext();
  const col = useContext(ColContext);

  const column = id === undefined ? undefined : table?.getColumn(id);
  const visible = column?.getIsVisible?.() !== false;

  // The header is the single source for a column's projection; it renders
  // before every body/footer row.
  if (visible) registry.hiddenColumns.delete(col);
  else registry.hiddenColumns.add(col);

  // Render-phase registry write; see `TableRegistry`.
  if (isRowHeader === true) registry.rowHeaderColumns.add(col);
  else registry.rowHeaderColumns.delete(col);

  if (!visible) return null;

  const sorted = column?.getIsSorted() ?? false;
  const sortable = allowsSorting === true;
  const onHeaderKeyDown = (event: ReactKeyboardEvent<HTMLTableCellElement>) => {
    if (event.key === "F2") {
      const handle = event.currentTarget.querySelector<HTMLElement>("[data-column-resizer]");
      if (handle !== null) {
        event.preventDefault();
        handle.focus();
      }
      return;
    }
    if (!sortable || column === undefined || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    column.toggleSorting();
  };

  // `aria-sort`, the glyph and the sr-only string all derive from `sorted`, so they cannot disagree.
  const ariaSort = !sortable
    ? undefined
    : sorted === "asc"
      ? ("ascending" as const)
      : sorted === "desc"
        ? ("descending" as const)
        : ("none" as const);

  return (
    <th
      {...props}
      data-lumo=""
      role="columnheader"
      scope="col"
      // 1-based in ARIA, 0-based in the dataset the keyboard reads.
      aria-colindex={col + 1}
      data-row-index={0}
      data-col-index={col}
      tabIndex={active.row === 0 && active.col === col ? 0 : -1}
      {...(ariaSort === undefined ? {} : { "aria-sort": ariaSort })}
      {...(sortable ? { "data-sortable": "" } : {})}
      {...(defaultWidth === undefined ? {} : { style: { inlineSize: defaultWidth } })}
      onKeyDown={onHeaderKeyDown}
      {...(sortable && column !== undefined ? { onClick: column.getToggleSortingHandler() } : {})}
      className={cn(columnVariants(), className)}
    >
      <span className="flex w-full items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {sortable ? (
          <>
            {/* `aria-hidden` on all three: `aria-sort` and the sr-only string already carry the direction. */}
            {sorted === "asc" ? (
              <ArrowUp aria-hidden="true" className="text-fg" />
            ) : sorted === "desc" ? (
              <ArrowDown aria-hidden="true" className="text-fg" />
            ) : (
              <ChevronsUpDown aria-hidden="true" className="text-fg-subtle" />
            )}
            {sorted === false ? null : (
              <span className="sr-only">
                {sorted === "asc" ? sortAscendingLabel : sortDescendingLabel}
              </span>
            )}
          </>
        ) : null}
        <ColumnIdContext.Provider value={id}>{resizer}</ColumnIdContext.Provider>
      </span>
    </th>
  );
}

/* BODY, ROWS, CELLS */

export interface TableBodyProps
  extends Omit<ComponentProps<"tbody">, "children" | "className"> {
  children?: LumoNode;
  /** Rendered instead of the rows when there are none. */
  renderEmptyState?: LumoNode;
  className?: string | undefined;
}

export function TableBody({
  className,
  children,
  renderEmptyState,
  ...props
}: TableBodyProps) {
  const { registry } = useTableContext();
  const rows = Children.toArray(children);
  const empty = rows.length === 0;

  // See `TableRegistry`.
  registry.setBodyRowCount(rows.length);

  return (
    <tbody
      className={cn(tableBodyVariants(), className)}
      {...(empty ? { "data-empty": "" } : {})}
      {...props}
    >
      {empty
        ? renderEmptyState
        : rows.map((child, index) => (
            // Body rows are 1-based; the header occupies row 0.
            <RowContext.Provider key={index} value={{ index: index + 1, row: undefined }}>
              {child}
            </RowContext.Provider>
          ))}
    </tbody>
  );
}

export interface VirtualTableBodyProps<TRow extends LumoTableRow>
  extends Omit<ComponentProps<"tbody">, "children" | "className"> {
  /** The full data set; only the visible window is rendered. */
  rows: readonly TRow[];
  /** The scrolling element, owned by the caller so the table can share it. */
  scrollRef: RefObject<HTMLElement | null>;
  /** A row's pixel height before measurement, fixed or per index. */
  estimateSize: number | ((index: number) => number);
  /** The viewport's pixel height for the server render and first frame. */
  initialSize: number;
  /** Rows rendered beyond the visible window on each side. */
  overscan?: number | undefined;
  /** Stable identity per row; keys survive scrolling so selection can. */
  getRowKey: (row: TRow) => string | number;
  /** The shared async-collection status driving the loading and error rows. */
  asyncStatus?: AsyncCollectionStatus | undefined;
  /** Called when scrolling approaches the end; the load-more hook. */
  onEndReached?: (() => void) | undefined;
  /** How many rows before the end onEndReached fires. */
  endReachedThreshold?: number | undefined;
  /** Renders one row from its datum and ABSOLUTE index — the index in the full data set, not the window. */
  children: (row: TRow, absoluteIndex: number) => LumoNode;
  /** Rendered instead of rows when the data set is empty. */
  renderEmptyState?: LumoNode;
  className?: string | undefined;
}

/**
 * Native-table virtualization: spacer rows preserve table layout while the
 * mounted rows keep their absolute `aria-rowindex` coordinates and row keys.
 */
export function VirtualTableBody<TRow extends LumoTableRow>({
  rows,
  scrollRef,
  estimateSize,
  initialSize,
  overscan = 6,
  getRowKey,
  asyncStatus,
  onEndReached,
  endReachedThreshold = 2,
  children,
  renderEmptyState,
  className,
  ...props
}: VirtualTableBodyProps<TRow>) {
  const { registry } = useTableContext();
  registry.setBodyRowCount(rows.length);
  const estimate = useMemo(
    () => (typeof estimateSize === "number" ? () => estimateSize : estimateSize),
    [estimateSize],
  );
  const virtual = useVirtualWindow({
    count: rows.length,
    estimateSize: estimate,
    scrollRef,
    initialSize,
    overscan,
    getItemKey: (index) => getRowKey(rows[index]!),
  });
  const first = virtual.items[0];
  const last = virtual.items.at(-1);
  const before = first?.start ?? 0;
  const after = last === undefined ? 0 : Math.max(0, virtual.totalSize - last.start - last.size);
  const requestedCount = useRef<number | null>(null);
  useEffect(() => {
    if (
      onEndReached === undefined ||
      rows.length === 0 ||
      last === undefined ||
      last.index < rows.length - 1 - endReachedThreshold ||
      requestedCount.current === rows.length ||
      asyncStatus === "loading" ||
      asyncStatus === "loading-more" ||
      asyncStatus === "refreshing"
    ) {
      return;
    }
    requestedCount.current = rows.length;
    onEndReached();
  }, [asyncStatus, endReachedThreshold, last, onEndReached, rows.length]);

  return (
    <tbody
      className={cn(tableBodyVariants(), className)}
      {...(rows.length === 0 ? { "data-empty": "" } : {})}
      {...props}
    >
      {rows.length === 0 ? renderEmptyState : null}
      {before > 0 ? (
        <tr aria-hidden="true" role="presentation">
          <td role="presentation" style={{ height: before, padding: 0, border: 0 }} />
        </tr>
      ) : null}
      {virtual.items.map((item) => {
        const row = rows[item.index]!;
        return (
          <RowContext.Provider key={item.key} value={{ index: item.index + 1, row }}>
            <Row ref={virtual.measureElement} row={row} data-index={item.index}>
              {children(row, item.index)}
            </Row>
          </RowContext.Provider>
        );
      })}
      {after > 0 ? (
        <tr aria-hidden="true" role="presentation">
          <td role="presentation" style={{ height: after, padding: 0, border: 0 }} />
        </tr>
      ) : null}
    </tbody>
  );
}

export interface TableFooterProps
  extends Omit<ComponentProps<"tfoot">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The summary row — totals, a count, a balance. Its row index is
 * `bodyRowCount + 1` so a `<Cell>` in it joins the coordinate space the arrow
 * keys walk. It deliberately does NOT add itself to `aria-rowcount`, which
 * describes the data set. `children` is the cells of ONE row.
 */
export function TableFooter({ className, children, ...props }: TableFooterProps) {
  const { registry } = useTableContext();
  // Body rows occupy 1…n (header is 0), so the footer is n+1.
  const index = registry.bodyRowCount + 1;

  return (
    <tfoot className={cn(tableFooterVariants(), className)} {...props}>
      <RowContext.Provider value={{ index, row: undefined }}>
        {/* Not `Row`: a footer row is never selectable and must never carry `aria-selected`. */}
        <tr data-lumo="" role="row" aria-rowindex={index + 1}>
          {withColumnIndexes(children)}
        </tr>
      </RowContext.Provider>
    </tfoot>
  );
}

export interface RowProps
  extends Omit<
    ComponentProps<"tr">,
    "children" | "className" | "role" | "aria-rowindex" | "aria-selected"
  > {
  /** The TanStack row this `<tr>` renders. Optional — a grid with no state layer is still a grid. */
  row?: LumoTableRow | undefined;
  isDisabled?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Row({ row, isDisabled, className, children, ...props }: RowProps) {
  const { hierarchical, table } = useTableContext();
  const context = useContext(RowContext);
  const index = context?.index ?? 1;
  const selectionEnabled =
    table?.options.enableRowSelection !== undefined && table.options.enableRowSelection !== false;
  const selectable = selectionEnabled && (row?.getCanSelect() ?? false);
  const expandable = hierarchical && (row?.getCanExpand?.() ?? false);

  return (
    <RowContext.Provider value={{ index, row }}>
      <tr
        {...props}
        data-lumo=""
        role="row"
        aria-rowindex={index + 1}
        {...(hierarchical ? { "aria-level": Math.max(0, row?.depth ?? 0) + 1 } : {})}
        {...(expandable ? { "aria-expanded": row?.getIsExpanded?.() ?? false } : {})}
        // Emitted ONLY when the row can be selected: `aria-selected="false"` on
        // a non-selectable row is a different and wrong statement.
        {...(selectable ? { "aria-selected": row?.getIsSelected() ?? false } : {})}
        {...(isDisabled === true ? { "data-disabled": "" } : {})}
        className={cn(rowVariants(), className)}
      >
        {withColumnIndexes(children)}
      </tr>
    </RowContext.Provider>
  );
}

export interface CellProps
  extends Omit<ComponentProps<"td">, "children" | "className" | "role"> {
  /**
   * Makes this the cell that NAMES the row — `role="rowheader"` instead of
   * `role="gridcell"`. Usually inherited from the `<Column>`; this is the per-cell override.
   */
  isRowHeader?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Cell({ isRowHeader, className, children, ...props }: CellProps) {
  const { active, registry } = useTableContext();
  const rowContext = useContext(RowContext);
  const col = useContext(ColContext);
  const rowIndex = rowContext?.index ?? 1;
  // The column's declaration is the default; an explicit prop on the cell wins.
  const rowHeader = isRowHeader ?? registry.rowHeaderColumns.has(col);

  if (registry.hiddenColumns.has(col)) return null;

  const shared = {
    "data-lumo": "",
    "aria-colindex": col + 1,
    "data-row-index": rowIndex,
    "data-col-index": col,
    // The roving tab stop. Exactly one cell in the whole grid is 0.
    tabIndex: active.row === rowIndex && active.col === col ? 0 : -1,
    className: cn(cellVariants(), className),
  };

  return rowHeader ? (
    // A `<th scope="row">`, not `<td role="rowheader">`: element and role agree.
    <th role="rowheader" scope="row" {...shared} {...(props as ComponentProps<"th">)}>
      {children}
    </th>
  ) : (
    <td role="gridcell" {...shared} {...props}>
      {children}
    </td>
  );
}

/* SELECTION */

/**
 * The header cell holding the select-all checkbox. A component rather than
 * `<Column><Checkbox/></Column>` so that forgetting the name is a compile error.
 */
export interface TableSelectAllColumnProps
  extends Omit<
    ComponentProps<"th">,
    "children" | "className" | "scope" | "role" | "aria-colindex"
  > {
  /** Announced name of the select-all checkbox. Required. */
  label: string;
  /** See `ColumnProps.defaultWidth`. Rarely needed — the column shrink-wraps. */
  defaultWidth?: number | string | undefined;
  className?: string | undefined;
}

export function TableSelectAllColumn({
  label,
  defaultWidth,
  className,
  ...props
}: TableSelectAllColumnProps) {
  const { table, active } = useTableContext();
  const col = useContext(ColContext);
  const isActive = active.row === 0 && active.col === col;

  return (
    <th
      {...props}
      data-lumo=""
      role="columnheader"
      scope="col"
      aria-colindex={col + 1}
      data-row-index={0}
      data-col-index={col}
      // Read by `Table`'s arrow-key handler: focus lands on the checkbox, not this `<th>`.
      data-lumo-widget-cell=""
      // Widget-focus model: the cell is permanently -1 and the roving 0 moves
      // onto the checkbox. The coordinates stay on the `<th>` — that is what the
      // arrow keys search for.
      tabIndex={-1}
      {...(defaultWidth === undefined ? {} : { style: { inlineSize: defaultWidth } })}
      // `w-0` + `whitespace-nowrap` shrink-wraps the checkbox column to its content.
      className={cn(columnVariants(), "w-0 whitespace-nowrap", className)}
    >
      <RovingCheckbox
        aria-label={label}
        tabIndex={isActive ? 0 : -1}
        isSelected={table?.getIsAllRowsSelected() ?? false}
        isIndeterminate={table?.getIsSomeRowsSelected() ?? false}
        onChange={() => table?.toggleAllRowsSelected()}
      />
    </th>
  );
}

/** The per-row selection checkbox. See `TableSelectAllColumn`. */
export interface TableSelectionCellProps
  extends Omit<ComponentProps<"td">, "children" | "className" | "role" | "aria-colindex"> {
  /** Announced name of the row checkbox. Required. */
  label: string;
  className?: string | undefined;
}

export function TableSelectionCell({ label, className, ...props }: TableSelectionCellProps) {
  const { active, registry } = useTableContext();
  const rowContext = useContext(RowContext);
  const col = useContext(ColContext);
  const rowIndex = rowContext?.index ?? 1;
  const isActive = active.row === rowIndex && active.col === col;
  const row = rowContext?.row as LumoTableRow | undefined;

  if (registry.hiddenColumns.has(col)) return null;

  return (
    <td
      {...props}
      data-lumo=""
      role="gridcell"
      aria-colindex={col + 1}
      data-row-index={rowIndex}
      data-col-index={col}
      // See `TableSelectAllColumn`: permanently -1, the roving stop is on the checkbox.
      data-lumo-widget-cell=""
      tabIndex={-1}
      className={cn(cellVariants(), "w-0 whitespace-nowrap", className)}
    >
      <RovingCheckbox
        aria-label={label}
        tabIndex={isActive ? 0 : -1}
        isSelected={row?.getIsSelected() ?? false}
        onChange={() => row?.toggleSelected()}
        {...(row?.getCanSelect() === false ? { isDisabled: true as boolean } : {})}
      />
    </td>
  );
}

/* A CELL WHOSE CONTENT IS A CONTROL */

/**
 * A `gridcell` that hands the grid's roving Tab stop to the control inside it:
 * `<TableWidgetCell>{(tabIndex) => <IconButton label="…" tabIndex={tabIndex} />}</TableWidgetCell>`.
 * Without it `<Cell><IconButton/></Cell>` serves one extra Tab stop PER ROW.
 * A render prop rather than DOM detection (effects do not run on the server)
 * or `cloneElement` (lands on a wrapping `<MenuTrigger>`); the price is that
 * the call site must be a client module. Exactly ONE control per cell — no
 * inner-navigation mode is implemented. No `label`: the control names itself.
 */
export interface TableWidgetCellProps
  extends Omit<ComponentProps<"td">, "children" | "className" | "role" | "aria-colindex"> {
  /** Renders the cell's single control, given the tab index it must carry (`0` when active, `-1` otherwise). */
  children: (tabIndex: 0 | -1) => LumoNode;
  /** Uses a native row header while preserving the widget-focus model. */
  isRowHeader?: boolean | undefined;
  className?: string | undefined;
}

export function TableWidgetCell({ isRowHeader, className, children, ...props }: TableWidgetCellProps) {
  const { active, registry } = useTableContext();
  const rowContext = useContext(RowContext);
  const col = useContext(ColContext);
  const rowIndex = rowContext?.index ?? 1;
  const isActive = active.row === rowIndex && active.col === col;
  const rowHeader = isRowHeader ?? registry.rowHeaderColumns.has(col);

  if (registry.hiddenColumns.has(col)) return null;

  const shared = {
    "data-lumo": "",
    "aria-colindex": col + 1,
    "data-row-index": rowIndex,
    "data-col-index": col,
    // See `TableSelectAllColumn`.
    "data-lumo-widget-cell": "",
    tabIndex: -1,
    className: cn(cellVariants(), "w-0 whitespace-nowrap", className),
  } as const;
  const content = children(isActive ? 0 : -1);

  return rowHeader ? (
    <th {...(props as ComponentProps<"th">)} {...shared} role="rowheader" scope="row">
      {content}
    </th>
  ) : (
    <td {...props} {...shared} role="gridcell">
      {content}
    </td>
  );
}

export interface TableTreeCellProps
  extends Omit<TableWidgetCellProps, "children" | "isRowHeader"> {
  /** The TanStack row whose expansion state this cell controls. */
  row: LumoExpandableTableRow;
  /** Whole announced phrase for the collapsed state. */
  expandLabel: string;
  /** Whole announced phrase for the expanded state. */
  collapseLabel: string;
  /** Logical indentation per depth level, in pixels. */
  indent?: number | undefined;
  children?: LumoNode;
}

/**
 * The row-header cell for hierarchical data.
 *
 * Parent rows use the widget-focus model: the grid's single Tab stop lands on
 * the disclosure button, whose state and name come from the same row object.
 * Leaves render a normal focusable row-header cell, so they never delegate the
 * stop to a control that does not exist. Indentation uses `paddingInlineStart`
 * and therefore follows the document direction without a physical-side prop.
 */
export function TableTreeCell({
  row,
  expandLabel,
  collapseLabel,
  indent = 20,
  className,
  children,
  ...props
}: TableTreeCellProps) {
  const { locale } = useTableContext();
  const canExpand = row.getCanExpand();
  const expanded = row.getIsExpanded();
  const content = (
    <span
      className="flex min-w-0 items-center gap-2"
      style={{ paddingInlineStart: `${Math.max(0, row.depth) * Math.max(0, indent)}px` }}
    >
      {canExpand ? null : <span aria-hidden="true" className="size-6 shrink-0" />}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );

  if (!canExpand) {
    return (
      <Cell isRowHeader className={className} {...props}>
        {content}
      </Cell>
    );
  }

  return (
    <TableWidgetCell
      isRowHeader
      className={cn("w-auto whitespace-normal", className)}
      {...props}
    >
      {(tabIndex) => (
        <span
          className="flex min-w-0 items-center gap-2"
          style={{ paddingInlineStart: `${Math.max(0, row.depth) * Math.max(0, indent)}px` }}
        >
          <button
            data-lumo=""
            data-lumo-tree-toggle=""
            type="button"
            tabIndex={tabIndex}
            aria-label={expanded ? collapseLabel : expandLabel}
            aria-expanded={expanded}
            onClick={() => row.toggleExpanded()}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm border-0 bg-transparent p-0 text-fg-muted hover:bg-surface-hover hover:text-fg"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "transition-transform motion-reduce:transition-none",
                expanded ? "" : direction(locale) === "rtl" ? "-rotate-90" : "rotate-90",
              )}
            />
          </button>
          <span className="min-w-0 truncate">{children}</span>
        </span>
      )}
    </TableWidgetCell>
  );
}

/* RESIZING */

/**
 * Wraps a `<Table>` to make it scroll. **This is the scroll container for any
 * wide table, resizable or not** — the name is inherited public API. Keeping
 * overflow on a named box keeps it off the document, whose horizontal
 * scrollbar behaves differently under `dir="rtl"` in every engine.
 */
export interface ResizableTableContainerProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ResizableTableContainer({
  className,
  ...props
}: ResizableTableContainerProps) {
  return (
    <div className={cn(resizableTableContainerVariants(), className)} {...props} />
  );
}

/**
 * The drag handle on a column boundary. Goes in `Column`'s `resizer` slot.
 * A `<button>` Lumo renders — no hidden input, no bundle string, so the old
 * `patches/react-aria` translation is not load-bearing here. Both its name and
 * `aria-valuetext` are required (VoiceOver announces only "vertical splitter"
 * from `aria-valuenow`). It is `tabIndex={-1}`: the grid is ONE stop and the
 * handle lives inside a header that is itself the stop; F2 enters it,
 * arrows/Home/End resize, Escape returns to the header.
 */
export interface ColumnResizerProps
  extends Omit<
    ComponentProps<"button">,
    | "children"
    | "className"
    | "aria-label"
    | "type"
    | "role"
    | "aria-orientation"
    | "aria-valuenow"
    | "aria-valuemin"
    | "aria-valuemax"
    | "aria-valuetext"
  > {
  /** Announced name of the resize handle. Required. */
  label: string;
  /** Human-readable current width, e.g. `value => `${formatNumber(value, locale)} پیکسل``. Required — VoiceOver does not expose the raw `aria-valuenow`. */
  valueText: (value: number) => string;
  /** The column this handle resizes. */
  columnId?: string | undefined;
  className?: string | undefined;
}

export function ColumnResizer({
  label,
  valueText,
  columnId,
  className,
  ...props
}: ColumnResizerProps) {
  const { table, locale } = useTableContext();
  const rtl = direction(locale) === "rtl";
  const contextualColumnId = useContext(ColumnIdContext);
  const resolvedColumnId = columnId ?? contextualColumnId;
  const header = resolvedColumnId === undefined
    ? undefined
    : table
        ?.getHeaderGroups()
        .flatMap((group) => group.headers)
        .find((candidate) => candidate.column.id === resolvedColumnId);
  const resizing = header?.column.getIsResizing() ?? false;
  const size = header?.column.getSize();
  const minSize = header?.column.columnDef.minSize ?? 20;
  const maxSize = header?.column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER;
  const resizeBy = (delta: number) => {
    if (header === undefined || table === undefined) return;
    const next = Math.min(maxSize, Math.max(minSize, header.column.getSize() + delta));
    table.setColumnSizing((current) => ({ ...current, [header.column.id]: next }));
  };

  return (
    <button
      {...props}
      data-lumo=""
      type="button"
      aria-label={label}
      data-column-resizer=""
      {...(size === undefined
        ? {}
        : {
            role: "separator" as const,
            "aria-orientation": "vertical" as const,
            "aria-valuenow": size,
            "aria-valuemin": minSize,
            "aria-valuemax": maxSize,
            "aria-valuetext": valueText(size),
          })}
      // Not a sequential tab stop; the consumer cannot override it. See the docblock.
      tabIndex={-1}
      {...(resizing ? { "data-resizing": "" } : {})}
      {...(header === undefined
        ? {}
        : {
            onMouseDown: header.getResizeHandler(),
            onTouchStart: header.getResizeHandler(),
          })}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.closest<HTMLElement>('[role="columnheader"]')?.focus();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          resizeBy(rtl ? -10 : 10);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          resizeBy(rtl ? 10 : -10);
        } else if (event.key === "Home") {
          event.preventDefault();
          resizeBy(minSize - (size ?? minSize));
        } else if (event.key === "End") {
          event.preventDefault();
          resizeBy(maxSize - (size ?? maxSize));
        }
      }}
      className={cn(columnResizerVariants(), className)}
    />
  );
}
