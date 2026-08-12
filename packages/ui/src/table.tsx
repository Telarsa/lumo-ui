"use client";

import {
  Children,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
  useTable,
  type RowData,
} from "@tanstack/react-table";
import { FORMAT_LOCALE, cn, type Locale, type LumoNode } from "@lumo-ui/core";
import { Checkbox, type CheckboxProps } from "./checkbox.tsx";
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
 *
 * ── WHY THE CAST, AND WHY IT IS NOT A HACK ──────────────────────────────────
 *
 * `CheckboxProps` is `Omit<AriaCheckboxFieldProps, …>`, and React Aria's
 * checkbox props never included `tabIndex` — it offered `excludeFromTabOrder`
 * instead, which `checkbox.tsx` accepts and records as UNREACHABLE on Base UI.
 * So the type omits the one prop an ARIA grid needs on a widget inside a cell.
 *
 * The VALUE reaches its destination: `checkbox.tsx` spreads its unrecognised
 * props (`{...(rest as object)}`) straight onto `BaseCheckbox.Root`, and Base
 * UI resolves a conflict between its own props and the caller's in the caller's
 * favour. Verified by rendering — the emitted `<span role="checkbox">` carries
 * `tabindex="-1"`.
 *
 * The cast is therefore a TYPE gap, not a behaviour gap, and it is recorded
 * here rather than papered over in `checkbox.tsx`, which this file does not
 * own. The fix that belongs there is one line: add `tabIndex?: number` to
 * `CheckboxProps`. Until then this is the honest spelling — a named alias with
 * the reason attached beats an inline `as any` at two call sites.
 */
const RovingCheckbox = Checkbox as (
  props: CheckboxProps & { tabIndex?: number | undefined },
) => ReactNode;

/**
 * A data grid.
 *
 *     const table = useLumoTable({
 *       locale,
 *       data: orders,
 *       columns: [{ id: "name", accessorKey: "name" }, { id: "city", accessorKey: "city" }],
 *       enableRowSelection: true,
 *     });
 *
 *     <Table label="سفارش‌ها" locale={locale} table={table}>
 *       <TableHeader>
 *         <TableSelectAllColumn label="انتخاب همه" />
 *         <Column id="name" isRowHeader allowsSorting
 *                 sortAscendingLabel="صعودی مرتب شده"
 *                 sortDescendingLabel="نزولی مرتب شده">نام</Column>
 *         <Column id="city">شهر</Column>
 *       </TableHeader>
 *       <TableBody>
 *         {table.getRowModel().rows.map((row) => (
 *           <Row key={row.id} row={row}>
 *             <TableSelectionCell label="انتخاب ردیف" />
 *             <Cell isRowHeader>{row.getValue("name")}</Cell>
 *             <Cell>{row.getValue("city")}</Cell>
 *           </Row>
 *         ))}
 *       </TableBody>
 *     </Table>
 *
 * ═══ WHY THIS FILE IS THE BIGGEST THING THE MIGRATION MOVED ═════════════════
 *
 * **Base UI has no table.** Not "a table with gaps" — none: there is no `table`
 * subpath among its 83 exports and no grid primitive of any kind. So the
 * component that was renting the most from React Aria had nothing to move to,
 * and what React Aria was supplying has to be enumerated before it can be
 * replaced. It was supplying, measured against a server render of the old file:
 *
 *     role=grid / columnheader / rowheader / gridcell     markup
 *     aria-colindex, aria-rowindex, aria-sort,            markup
 *       aria-selected
 *     arrow navigation across cells, resolved             behaviour
 *       against the document direction
 *     one Tab stop for the whole grid (roving tabindex)   behaviour
 *     typeahead over rows                                 behaviour
 *     sorting / selection / resizing STATE                arithmetic
 *
 * `@tanstack/react-table` 9.1.2 supplies the last line and **nothing else**.
 * That is not a shortfall, it is the reason it is acceptable here: Lumo already
 * has exactly one accessibility dependency, and a second library with an
 * opinion about `role` or focus is how a grid ends up announcing two different
 * things. Verified rather than assumed — `getHeaderGroups()`, `getRowModel()`,
 * `row.getIsSelected()` and `header.getSize()` return data and callbacks; not
 * one of them returns a props object, an element, a `role` or an `aria-*` key.
 *
 * **THE BOUNDARY, STATED SO IT CAN BE ENFORCED:** nothing from TanStack is ever
 * spread onto an element in this file. Every attribute below is written by
 * hand from a scalar TanStack returned. If a future minor starts returning
 * `getHeaderProps()`-shaped objects with `role` in them, that is the signal to
 * keep reading scalars — not to start spreading.
 *
 * The rest — every line of markup, every ARIA attribute, the roving tab stop
 * and the direction-resolved arrow keys — is now Lumo's, and the arrow
 * arithmetic lives in `table.variants.ts` where it can be tested without a DOM.
 *
 * Typeahead over rows is **not** reimplemented, and that is recorded as a
 * capability lost rather than quietly dropped. See "WHAT WAS LOST" below.
 *
 * ═══ WHAT WAS LOST, WITH THE EVIDENCE ═══════════════════════════════════════
 *
 *  1. **Typeahead.** React Aria let a reader jump to a row by typing its first
 *     letters, resolved through a locale-aware collator. Reimplementing it
 *     means owning a keystroke buffer, a timeout, a collation and a wrap-around
 *     search — the thing renting a headless library is supposed to buy. It is
 *     absent, it is listed here, and `gridArrow.step` deliberately returns
 *     `null` for non-arrow keys so a typeahead can be added later without the
 *     grid having already swallowed the keystroke.
 *
 *  2. **The resizer's `aria-valuetext`.** React Aria emitted
 *     `"{value} pixels"` from its own bundle onto a hidden `<input
 *     type="range">`, unreachable by prop, and Lumo carried a 27 KB
 *     `node_modules` patch (`patches/react-aria@3.51.0.patch`) to translate it.
 *     **That patch is no longer load-bearing for this file**: the resizer below
 *     is a `<button>` Lumo renders, its name is a required prop, and there is
 *     no hidden input and no bundle string. A workaround retired by a migration
 *     is worth more than one maintained by it — and this is the strongest
 *     single argument in the table's column of the ledger.
 *
 * ═══ THE FOUR ANNOUNCED STRINGS, ALL STILL REQUIRED PROPS ═══════════════════
 *
 * Under React Aria three of these existed to DISPLACE an English bundle string
 * («Select», «Select All», «Resizer»). There is no bundle any more, so the
 * failure mode inverts exactly as it did for `Select`'s `placeholder`: the
 * control arrives ANONYMOUS rather than English. That is worse, not better — an
 * English word is at least visible to `no-latin-aria` and to a reviewer, and a
 * missing name is visible to neither. Every one of them stays required and the
 * argument for requiring them is stronger than it was.
 *
 * `sortAscendingLabel`/`sortDescendingLabel` were never about a bundle string:
 * `aria-sort` is emitted and localised by the screen reader itself, but Android
 * TalkBack ignores `aria-sort` entirely, so the direction is also stated as
 * `sr-only` text in the reader's own language.
 *
 * ═══ ONE TAB STOP, AND THE ARROW KEYS ══════════════════════════════════════
 *
 * A `role="grid"` takes ONE Tab stop for the whole table — every cell is
 * `tabindex="-1"` except the active one. This is not a nicety: a 20×8 grid with
 * a stop per cell is 160 Tab presses to get past a table.
 *
 * The active cell is tracked as `{row, col}` in `Table`, and navigation reads
 * the target out of the DOM by `data-row-index` / `data-col-index` rather than
 * from a registry. That is deliberate: a registry has to be kept in step with
 * mounting and unmounting, and a virtualised or paginated body unmounts rows
 * constantly. The DOM is the registry that cannot drift from itself.
 *
 * Which arrow means "next column" is `gridArrow(locale)`. See the long note in
 * `table.variants.ts`; the short version is that ArrowLeft advances under
 * `dir="rtl"` and a hand-rolled `switch (e.key)` gets that backwards silently,
 * in Persian only.
 *
 * ═══ SORTING PERSIAN IS NOT `a > b`, AND TANSTACK'S DEFAULT IS ═════════════
 *
 * Measured in the installed dist,
 * `features/row-sorting/sortFns.js` — `sortFn_text` and `sortFn_basic` compare
 * with `dataValueA > dataValueB ? 1 : …`, which is a UTF-16 CODE-UNIT
 * comparison. For Persian that is wrong in a way no reviewer sees:
 *
 *   · ی (U+06CC) and ي (U+064A) are the same letter to a reader and 360 code
 *     points apart to `>`, so an imported dataset sorts into two alphabets.
 *   · ZWNJ (U+200C), which is INSIDE ordinary compound words, sorts before
 *     every letter, so «می‌رود» lands before «مادر».
 *   · Numerals in Persian text are arabext digits, which `>` orders by code
 *     point rather than by value.
 *
 * `Intl.Collator` exists for exactly this, so `useLumoTable` installs a
 * collator-backed comparator as the DEFAULT for every column
 * (`defaultColumn.sortFn`), built from the same `locale` everything else in the
 * component derives from. A column may still name a built-in explicitly; what
 * it cannot do is get the locale-aware one by accident from a global.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE STATE LAYER
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The features Lumo's grid switches on, assembled once at module scope.
 *
 * TanStack 9 made features opt-in, which is the right default for bundle size
 * and the wrong default for a component library: a consumer who forgets
 * `rowSortingFeature` gets a `Column allowsSorting` that renders an arrow and
 * sorts nothing, with no error. Assembling the set here rather than asking for
 * it makes that unrepresentable, and it is the same argument `LumoProvider`
 * makes about `direction`.
 *
 * `sortFns` and `filterFns` are registered so a column may name one as a
 * string. The locale-aware default is NOT registered here, because it is a
 * function of a locale this module does not have — see `localeSortFn`.
 */
export const lumoTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnSizingFeature,
  columnResizingFeature,
  // Switched on for `data-grid.tsx`'s column menu. Opt-in like every other
  // feature in TanStack 9, and opting in HERE rather than at the call site is
  // the same argument this block already makes about `rowSortingFeature`: a
  // consumer who forgets it gets a menu whose toggles tick and hide nothing.
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { basic: sortFn_basic, datetime: sortFn_datetime },
  filterFns: { includesString: filterFn_includesString },
});

export type LumoTableFeatures = typeof lumoTableFeatures;

/**
 * A comparator that sorts the way the reader's language does.
 *
 * `Intl.Collator` over `FORMAT_LOCALE[locale]`, so it inherits the same
 * `-u-nu-arabext` extension every formatter in the library uses. `numeric: true`
 * makes «ردیف ۲» precede «ردیف ۱۰» instead of following it, which is the same
 * natural-order behaviour TanStack's `alphanumeric` provides for Latin digits
 * and provides for no others.
 *
 * `sensitivity: "base"` folds the ی/ي and ک/ك pairs that a mixed-source Persian
 * dataset always contains. That is a judgement call and it is the one this
 * library makes everywhere else: `search-index.ts` folds the identical pairs,
 * and two spellings of one letter reading as two different names is a worse
 * outcome than two genuinely different names collating together.
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
 * The grid's state. A thin, deliberate wrapper over `useTable`.
 *
 * It adds exactly three things and hides nothing:
 *
 *   1. Lumo's feature set (see `lumoTableFeatures`).
 *   2. `locale`, which becomes the default comparator (see `localeSortFn`).
 *   3. Nothing else. The return value IS TanStack's table instance, so every
 *      method in its documentation works and this wrapper cannot become a
 *      second API that has to be kept in step with the first.
 *
 * ── API CHANGE, STATED ──────────────────────────────────────────────────────
 *
 * `Table` used to accept React Aria's `selectionMode`, `selectedKeys`,
 * `onSelectionChange`, `sortDescriptor` and `onSortChange` directly. Those are
 * TanStack's options now (`enableRowSelection`, `state.rowSelection`,
 * `onRowSelectionChange`, `state.sorting`, `onSortingChange`) and they are
 * passed HERE rather than to the element. The move is forced — the state has to
 * exist before the markup that reads it — and it is the one unavoidable break
 * in this file's public API.
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
    // The locale-aware comparator is the DEFAULT, not an override: a column that
    // names a built-in still gets it, and a column that names nothing stops
    // getting code-unit order.
    defaultColumn: { sortFn, ...defaultColumn },
    ...rest,
  } as Parameters<typeof useTable<LumoTableFeatures, TData>>[0]);
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE SEAM — WHICH IS ALSO HOW THE BOUNDARY IS ENFORCED
 *
 * `Table` and its parts do NOT accept `Table<Features, TData>` from TanStack.
 * They accept the three interfaces below, which name exactly the methods this
 * file calls, and which a TanStack instance satisfies structurally.
 *
 * That is not type gymnastics to dodge a variance error, though it does that
 * too. **It is the boundary "TanStack must never own focus or ARIA", made
 * mechanical.** A props object, a `role`, a ref callback or a keydown handler
 * cannot arrive through these types, because there is no member to arrive on —
 * so the day TanStack ships `getHeaderProps()` the compiler will not let it
 * into a Lumo element without someone widening an interface in this file and
 * writing down why.
 *
 * Every member below returns a SCALAR or a callback. Nothing returns markup.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** What `Column` needs from a TanStack column. */
export interface LumoTableColumn {
  getIsSorted: () => "asc" | "desc" | false;
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
  toggleSorting: () => void;
  getIsResizing: () => boolean;
  id: string;
}

/** What `Row` and `TableSelectionCell` need from a TanStack row. */
export interface LumoTableRow {
  id: string;
  getIsSelected: () => boolean;
  getCanSelect: () => boolean;
  toggleSelected: () => void;
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
  options: { enableRowSelection?: unknown; enableMultiRowSelection?: unknown };
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE CONTEXTS
 *
 * Three, each carrying exactly one fact, because the alternative is passing an
 * index through `cloneElement` and cloning is what breaks when a caller wraps a
 * cell in anything.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface TableContextValue {
  locale: Locale;
  /** `{row, col}` of the one cell that is in the tab order. */
  active: { row: number; col: number };
  /** The TanStack instance, when the caller supplied one. */
  table: LumoTableInstance | undefined;
  /**
   * Which column indices were declared `isRowHeader`, so a `<Cell>` can be a
   * `<th scope="row">` without the caller repeating the fact on every row.
   *
   * ── WHY A MUTABLE SET AND NOT STATE ─────────────────────────────────────
   *
   * `isRowHeader` is declared where it belongs — on the COLUMN, once — and read
   * where it is needed, on every cell of that column. Passing it down means
   * either repeating it per cell (which is what gets forgotten) or lifting it
   * into state (which is a render-phase write, and would need a second pass
   * before the first row could be correct — so the SERVER render, the tier that
   * matters most here, would emit `role="gridcell"` where a `rowheader`
   * belongs).
   *
   * A ref-held Set works because `<thead>` renders before `<tbody>` in the same
   * synchronous pass, in React and in `renderToStaticMarkup` alike. The write is
   * idempotent, so a double render under StrictMode changes nothing. If a caller
   * ever puts the body BEFORE the header, the row headers degrade to gridcells —
   * which is why `Cell` also accepts an explicit `isRowHeader`.
   */
  rowHeaderColumns: Set<number>;
  /**
   * How many rows `TableBody` rendered, so `TableFooter` knows which row index
   * comes after them.
   *
   * The same render-phase write into a ref as `rowHeaderColumns`, for the same
   * reason and with the same caveat: `<tbody>` renders before `<tfoot>` in one
   * synchronous pass, in React and in `renderToStaticMarkup` alike, and the
   * write is idempotent so StrictMode's double render changes nothing.
   *
   * It has to be a ref rather than a count derived in `Table`, because `Table`
   * writes its own attributes before any child has rendered, and a footer whose
   * coordinates guessed wrong would put two elements at the same
   * `data-row-index`/`data-col-index` — where `querySelector` silently takes
   * the first and the arrow keys stop at the last body row.
   */
  bodyRowCount: { current: number };
}

const TableContext = createContext<TableContextValue | null>(null);
/** Row 0 is the header row; body rows start at 1. */
const RowContext = createContext<{ index: number; row: unknown } | null>(null);
const ColContext = createContext<number>(0);

function useTableContext(): TableContextValue {
  const context = useContext(TableContext);
  if (!context) {
    // Developer error at mount, never a string a reader sees.
    throw new Error("Table parts must be used within a <Table />");
  }
  return context;
}

/**
 * Give each child its column index without touching the child.
 *
 * `Children.map` rather than `cloneElement`: cloning writes a prop onto whatever
 * element happens to be there, so a `<Cell>` wrapped in a `<Tooltip>` receives
 * the index on the Tooltip. A Provider around the child reaches the `<Cell>`
 * however deep it is, which is the same reason `Select` carries its placeholder
 * on a context rather than by cloning.
 */
function withColumnIndexes(children: ReactNode): ReactNode {
  /*
   * `Children.toArray` and NOT `Children.map`, and this is a fix rather than a
   * preference.
   *
   * `Children.map` calls back for a NULLISH child too, so a conditional column
   * — the shape every table with optional selection is written in —
   *
   *     {hasCheckboxColumn ? <TableSelectAllColumn … /> : null}
   *
   * consumed index 0 while rendering nothing, and the real columns started at
   * 1. `Table` puts its roving tab stop on `{row: 0, col: 0}`, which then
   * matched no element at all: the served bytes carried 24 cells, every one at
   * `tabindex="-1"`, and the whole grid was unreachable by keyboard until
   * hydration moved focus for the first time.
   *
   * Measured on `view-block/fa/table-view` — and found by the gate only after
   * `composite-tab-stop` learned about `role="grid"`, which is the argument for
   * widening that rule rather than exempting the components it surprised.
   *
   * `toArray` drops null, undefined and booleans, and flattens fragments — so
   * the index a column receives is its index among the columns that actually
   * render. `list-box.tsx` hit the fragment half of this same distinction.
   */
  return Children.toArray(children).map((child, index) => (
    <ColContext.Provider key={index} value={index}>
      {child}
    </ColContext.Provider>
  ));
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE GRID
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface TableProps
  extends Omit<ComponentProps<"table">, "children" | "className" | "aria-label" | "role"> {
  /**
   * Announced name of the grid. REQUIRED.
   *
   * `role="grid"` takes ONE Tab stop for the whole table, so an unnamed one
   * announces "grid" and nothing else, and a screen with two of them offers two
   * identical stops. Neither engine leaks English here — the table simply
   * arrives anonymous, which is the `named-controls` defect in its quietest
   * form.
   */
  label: string;
  /**
   * The locale. Drives the arrow-key mapping and the default collation. There
   * is deliberately no `dir` prop — see `LumoProvider` for the argument.
   */
  locale: Locale;
  /** The instance from `useLumoTable`, when this grid has state. */
  table?: LumoTableInstance | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Table({ label, locale, table, className, ...props }: TableProps) {
  const ref = useRef<HTMLTableElement>(null);
  const [active, setActive] = useState({ row: 0, col: 0 });
  const arrow = useMemo(() => gridArrow(locale), [locale]);
  const rowHeaderColumns = useRef<Set<number>>(new Set()).current;
  const bodyRowCount = useRef(0);

  /**
   * Move the roving tab stop.
   *
   * The candidate set is read out of the DOM, not out of a registry — see the
   * file header. `preventDefault` fires only for a key this grid claims, so a
   * typeahead or a page-level shortcut can still be added later.
   */
  function onKeyDown(event: ReactKeyboardEvent<HTMLTableElement>) {
    const step = arrow.step(event.key);
    if (step === null) return;

    const grid = ref.current;
    if (!grid) return;

    const next = { row: active.row + step.row, col: active.col + step.col };
    const target = grid.querySelector<HTMLElement>(
      `[data-row-index="${next.row}"][data-col-index="${next.col}"]`,
    );
    // No wrap-around and no clamping: at an edge the key simply does nothing,
    // which is what a grid does. Silently clamping would make Home and End
    // (not implemented) look broken when they arrive.
    if (!target) return;

    event.preventDefault();
    setActive(next);
    target.focus();
  }

  const value = useMemo<TableContextValue>(
    () => ({ locale, active, table, rowHeaderColumns, bodyRowCount }),
    [locale, active, table, rowHeaderColumns, bodyRowCount],
  );

  /*
   * `aria-multiselectable` is a STATEMENT ABOUT THE GRID, not about a row: it
   * tells a reader that more than one row may be selected at once, which changes
   * how the selection keys are announced before any row is touched. React Aria
   * emitted it from `selectionMode="multiple"`; the equivalent fact now lives in
   * TanStack's options, and it is read rather than accepted as a prop so it
   * cannot disagree with the selection model that is actually installed.
   */
  const options = table?.options;
  const multiselectable =
    options !== undefined &&
    options.enableRowSelection !== undefined &&
    options.enableRowSelection !== false &&
    options.enableMultiRowSelection !== false;

  return (
    <TableContext.Provider value={value}>
      <table
        ref={ref}
        data-lumo=""
        role="grid"
        aria-label={label}
        /*
         * `aria-rowcount` counts the HEADER row too, which is what the spec
         * asks for and what a reader expects when it says "row 3 of 21".
         *
         * Both counts are RAW integers, never `formatNumber`ed: a screen reader
         * announces the number in its own language and numbering system, so a
         * Persian digit here is not a localisation, it is an invalid attribute
         * value. Same rule as `aria-setsize` in `virtual-list.tsx` and the
         * opposite of `aria-valuetext` in `progress.tsx`.
         */
        {...(table === undefined
          ? {}
          : {
              "aria-rowcount": table.getRowModel().rows.length + 1,
              "aria-colcount": table.getAllColumns().length,
            })}
        {...(multiselectable ? { "aria-multiselectable": true } : {})}
        onKeyDown={onKeyDown}
        className={cn(tableVariants(), className)}
        {...props}
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
      {/* Row 0. Body rows start at 1, and `aria-rowindex` is 1-based on top. */}
      <RowContext.Provider value={{ index: 0, row: undefined }}>
        <tr role="row" aria-rowindex={1}>
          {withColumnIndexes(children)}
        </tr>
      </RowContext.Provider>
    </thead>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * COLUMNS
 * ═══════════════════════════════════════════════════════════════════════════ */

interface ColumnBaseProps
  extends Omit<ComponentProps<"th">, "children" | "className" | "scope" | "role"> {
  /** The column's key. Matches a TanStack column `id` when there is a table. */
  id?: string | undefined;
  /**
   * The cells in THIS column name their row — they become `<th scope="row">`
   * with `role="rowheader"` instead of `role="gridcell"`.
   *
   * Declared once on the column rather than on every cell, which is the whole
   * reason it survived the engine change unaltered: an affordance repeated per
   * row is one that is eventually missed on one row, and a grid with a row
   * missing its header announces that row by its raw cell values.
   */
  isRowHeader?: boolean | undefined;
  /**
   * The column's initial inline size, e.g. `160` or `"20%"`.
   *
   * ── WHAT THIS IS AND IS NOT, AFTER THE ENGINE CHANGE ────────────────────
   *
   * React Aria's `defaultWidth` fed its own column-sizing model. TanStack owns
   * that model now, and it is configured on the COLUMN DEFINITION (`size`,
   * `minSize`, `maxSize` in `useLumoTable`'s `columns`) rather than on the
   * header element — a header cannot reach back into the table's state to
   * declare a starting width.
   *
   * So this prop survives as what it always was at the DOM level: an initial
   * `inline-size` on the `<th>`. It is honest and it is not the whole story —
   * when a TanStack instance owns sizing, `column.size` is authoritative and
   * this is the pre-hydration hint. Stated rather than removed, because
   * removing it would break every existing table for a fact that is still
   * expressible.
   *
   * `inlineSize`, not `width`: the logical property says which axis it means.
   */
  defaultWidth?: number | string | undefined;
  children?: LumoNode;
  /**
   * A `<ColumnResizer>`, as its own slot rather than as a child.
   *
   * The resizer must be inside this header cell — it is positioned against it —
   * but it must NOT be part of the header's announced name, and putting it in
   * `children` makes it both.
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
   * `aria-sort` entirely. Lumo states the direction itself, in Persian.
   */
  sortAscendingLabel: string;
  /** As `sortAscendingLabel`, for the descending state. */
  sortDescendingLabel: string;
}

export type ColumnProps = ColumnBaseProps & (UnsortableColumnProps | SortableColumnProps);

/**
 * One column header.
 *
 * ── `allowsSorting` IS A TYPED PAIR, LIKE `Link`'s `newTab` ─────────────────
 *
 * A sortable column announces its direction, and by rule 3 that string cannot
 * have an English default and cannot be optional. So the two shapes are separate
 * members of a union: `allowsSorting` without both labels does not compile, and
 * passing the labels without `allowsSorting` does not either.
 *
 * Only the ACTIVE direction is announced. An unsorted sortable column already
 * carries `aria-sort="none"`, and a third Persian string saying "sortable" would
 * be read on every header of every table.
 *
 * ── THE ARROWS ARE BLOCK-AXIS GLYPHS, DELIBERATELY ─────────────────────────
 *
 * `ArrowUp`/`ArrowDown` point along the block axis, which does not mirror in any
 * horizontal writing mode — so the same icon means the same thing in Persian and
 * English with no `rtl:` variant.
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
  const { table, active, rowHeaderColumns } = useTableContext();
  const col = useContext(ColContext);

  // See `TableContextValue.rowHeaderColumns` for why this is a render-phase
  // write into a ref rather than state.
  if (isRowHeader === true) rowHeaderColumns.add(col);
  else rowHeaderColumns.delete(col);

  const column = id === undefined ? undefined : table?.getColumn(id);
  const sorted = column?.getIsSorted() ?? false;
  const sortable = allowsSorting === true;

  /*
   * `aria-sort` is written from TanStack's `getIsSorted()` and the arrow glyph
   * and the sr-only string are written from the SAME expression. There is one
   * source, so the picture, the attribute and the spoken text cannot disagree —
   * the defect the old `data-selected` / `aria-selected` split allowed.
   */
  const ariaSort = !sortable
    ? undefined
    : sorted === "asc"
      ? ("ascending" as const)
      : sorted === "desc"
        ? ("descending" as const)
        : ("none" as const);

  return (
    <th
      data-lumo=""
      role="columnheader"
      scope="col"
      // Column indices are 1-based in ARIA and 0-based in the DOM dataset the
      // keyboard reads. Both are here rather than one being derived at read
      // time, because deriving it is where an off-by-one lives.
      aria-colindex={col + 1}
      data-row-index={0}
      data-col-index={col}
      tabIndex={active.row === 0 && active.col === col ? 0 : -1}
      {...(ariaSort === undefined ? {} : { "aria-sort": ariaSort })}
      {...(sortable ? { "data-sortable": "" } : {})}
      {...(defaultWidth === undefined ? {} : { style: { inlineSize: defaultWidth } })}
      {...(sortable && column !== undefined
        ? {
            onClick: column.getToggleSortingHandler(),
            // A header that sorts on click must sort on Enter/Space too, and it
            // is not a <button>: making it one would put a second name inside
            // the columnheader and change what is announced.
            onKeyDown: (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              column.toggleSorting();
            },
          }
        : {})}
      className={cn(columnVariants(), className)}
      {...props}
    >
      <span className="flex w-full items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {sortable ? (
          <>
            {/*
             * `aria-hidden` on all three: the direction is already in the tree
             * as `aria-sort`, and the sr-only string below carries it for
             * readers that ignore `aria-sort`. An announced icon would make it
             * a third copy.
             */}
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
        {resizer}
      </span>
    </th>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * BODY, ROWS, CELLS
 * ═══════════════════════════════════════════════════════════════════════════ */

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
  const { bodyRowCount } = useTableContext();
  const rows = Children.toArray(children);
  const empty = rows.length === 0;

  // See `TableContextValue.bodyRowCount`. Written here rather than counted in
  // `Table`, which has no access to this list at the time it writes its own
  // attributes.
  bodyRowCount.current = rows.length;

  return (
    <tbody
      className={cn(tableBodyVariants(), className)}
      {...(empty ? { "data-empty": "" } : {})}
      {...props}
    >
      {empty
        ? renderEmptyState
        : rows.map((child, index) => (
            // Body rows are 1-based here because the header occupies row 0 in
            // the same coordinate space the keyboard walks.
            <RowContext.Provider key={index} value={{ index: index + 1, row: undefined }}>
              {child}
            </RowContext.Provider>
          ))}
    </tbody>
  );
}

export interface TableFooterProps
  extends Omit<ComponentProps<"tfoot">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The summary row — totals, a count, a balance.
 *
 * ═══ WHY THIS IS A COMPONENT AND NOT A NOTE IN THE DOCS ═════════════════════
 *
 * A consumer can write `<tfoot><tr><td>` inside `<Table>` today; the grid does
 * not stop them. What they get is a row with none of the grid's markup and none
 * of its keyboard: no `role`, no `aria-rowindex`, no coordinates — so the arrow
 * keys walk down the body and stop dead one row above the number the whole
 * table was built to show. That is the shape of gap worth closing: not a class
 * string anyone could copy, but the coordinate space, which only this file
 * knows.
 *
 * The footer's row index is `bodyRowCount + 1` — read from the ref `TableBody`
 * wrote during the same pass, see `TableContextValue.bodyRowCount` — so a
 * `<Cell>` inside it lands in the same `{row, col}` grid the arrow keys search,
 * one step below the last body row, and Down from the last row reaches the
 * total.
 *
 * ── WHAT IS DELIBERATELY *NOT* CHANGED: `aria-rowcount` ─────────────────────
 *
 * `Table` writes `aria-rowcount` from `getRowModel().rows.length + 1`, and this
 * component does not add itself to it. That is a decision, not an oversight.
 * `aria-rowcount` describes the DATA SET — it is the attribute a reader uses to
 * hear "row 3 of 4,000" while paginated or virtualised, and it is written from
 * the model rather than from what is on screen for exactly that reason. A
 * totals row is not a row of that set; it is a statement about it. Counting it
 * would inflate the announced size of every paged table by one.
 *
 * ── ONE ROW, DELIBERATELY ──────────────────────────────────────────────────
 *
 * `children` is the cells, not rows: a `<tfoot>` with several rows would need
 * its own index arithmetic and there is no product need behind it. A second
 * summary row is a body row.
 */
export function TableFooter({ className, children, ...props }: TableFooterProps) {
  const { bodyRowCount } = useTableContext();
  // Body rows occupy 1…n in the coordinate space the keyboard walks (the header
  // is row 0), so the footer is n+1.
  const index = bodyRowCount.current + 1;

  return (
    <tfoot className={cn(tableFooterVariants(), className)} {...props}>
      <RowContext.Provider value={{ index, row: undefined }}>
        {/*
         * `aria-rowindex` is 1-based on top of a 0-based header row, the same
         * arithmetic `Row` does — written out here rather than reusing `Row`
         * because a footer row is never selectable and must never carry
         * `aria-selected`.
         */}
        <tr data-lumo="" role="row" aria-rowindex={index + 1}>
          {withColumnIndexes(children)}
        </tr>
      </RowContext.Provider>
    </tfoot>
  );
}

export interface RowProps
  extends Omit<ComponentProps<"tr">, "children" | "className" | "role"> {
  /**
   * The TanStack row this `<tr>` renders.
   *
   * Optional, because a grid with no state layer is still a grid. When present
   * it is what `aria-selected` and the selection checkbox read, so those two can
   * never be wired to different sources.
   */
  row?: LumoTableRow | undefined;
  isDisabled?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Row({ row, isDisabled, className, children, ...props }: RowProps) {
  const context = useContext(RowContext);
  const index = context?.index ?? 1;
  const selectable = row?.getCanSelect() ?? false;

  return (
    <RowContext.Provider value={{ index, row }}>
      <tr
        data-lumo=""
        role="row"
        aria-rowindex={index + 1}
        /*
         * Emitted ONLY when the row can be selected. `aria-selected="false"` on
         * a non-selectable row tells a screen reader the grid has a selection
         * model and this row is out of it, which is a different and wrong
         * statement. React Aria made the same distinction; it is restated here
         * because Lumo now writes the attribute.
         */
        {...(selectable ? { "aria-selected": row?.getIsSelected() ?? false } : {})}
        {...(isDisabled === true ? { "data-disabled": "" } : {})}
        className={cn(rowVariants(), className)}
        {...props}
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
   * `role="gridcell"`.
   *
   * Usually unnecessary: declare it once on the `<Column>` and every cell in
   * that column inherits it. This is the per-cell override, and the escape
   * hatch for a body rendered before its header.
   */
  isRowHeader?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Cell({ isRowHeader, className, children, ...props }: CellProps) {
  const { active, rowHeaderColumns } = useTableContext();
  const rowContext = useContext(RowContext);
  const col = useContext(ColContext);
  const rowIndex = rowContext?.index ?? 1;
  // The column's declaration is the default; an explicit prop on the cell wins,
  // which is what makes the ordering caveat in `rowHeaderColumns` recoverable.
  const rowHeader = isRowHeader ?? rowHeaderColumns.has(col);

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
    // A `<th scope="row">` and not a `<td role="rowheader">`: the element and
    // the role agree, so a browser that ignores ARIA still gets the structure.
    <th role="rowheader" scope="row" {...shared} {...(props as ComponentProps<"th">)}>
      {children}
    </th>
  ) : (
    <td role="gridcell" {...shared} {...props}>
      {children}
    </td>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * SELECTION
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The header cell holding the select-all checkbox.
 *
 * Split out rather than left to the caller because a bare `<Column><Checkbox
 * /></Column>` compiles perfectly well with no name at all. As a component the
 * string is a constructor argument and forgetting it is a compile error — the
 * same reason `IconButton` exists separately from `Button`.
 *
 * Under React Aria this component's job was to REPLACE the English
 * `aria-label="Select All"`. There is no bundle now, so its job is to supply a
 * name that would otherwise be absent. The prop is required either way; see the
 * file header on why the second case is worse.
 */
export interface TableSelectAllColumnProps
  extends Omit<ComponentProps<"th">, "children" | "className" | "scope" | "role"> {
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
      data-lumo=""
      role="columnheader"
      scope="col"
      aria-colindex={col + 1}
      data-row-index={0}
      data-col-index={col}
      /*
       * ── A CELL CONTAINING A WIDGET IS NOT ITSELF THE TAB STOP ────────────
       *
       * The ARIA grid pattern says focus lands on the interactive control
       * inside a cell rather than on the cell around it — otherwise Tab reaches
       * the grid, then the reader has to discover that the checkbox needs a
       * second key to reach. So this `<th>` is permanently `-1` and the roving
       * `0` moves onto the `<Checkbox>` below.
       *
       * The `data-row-index`/`data-col-index` pair stays on the `<th>` because
       * that is what the arrow keys search for — but the search then has to end
       * on something focusable, which is why the checkbox carries the tabindex
       * and NOT why it carries the coordinates.
       */
      tabIndex={-1}
      {...(defaultWidth === undefined ? {} : { style: { inlineSize: defaultWidth } })}
      // `w-0` + `whitespace-nowrap` shrink-wraps the checkbox column to its
      // content in a `table-layout:auto` table, on either side of the grid.
      className={cn(columnVariants(), "w-0 whitespace-nowrap", className)}
      {...props}
    >
      <RovingCheckbox
        aria-label={label}
        tabIndex={isActive ? 0 : -1}
        isSelected={table?.getIsAllRowsSelected() ?? false}
        // The indeterminate state is the whole reason this is not a plain
        // boolean: "some rows selected" is a third state, and a checkbox that
        // shows a tick for it lies about what pressing it will do.
        isIndeterminate={table?.getIsSomeRowsSelected() ?? false}
        onChange={() => table?.toggleAllRowsSelected()}
      />
    </th>
  );
}

/** The per-row selection checkbox. See `TableSelectAllColumn`. */
export interface TableSelectionCellProps
  extends Omit<ComponentProps<"td">, "children" | "className" | "role"> {
  /** Announced name of the row checkbox. Required. */
  label: string;
  className?: string | undefined;
}

export function TableSelectionCell({ label, className, ...props }: TableSelectionCellProps) {
  const { active } = useTableContext();
  const rowContext = useContext(RowContext);
  const col = useContext(ColContext);
  const rowIndex = rowContext?.index ?? 1;
  const isActive = active.row === rowIndex && active.col === col;
  const row = rowContext?.row as LumoTableRow | undefined;

  return (
    <td
      data-lumo=""
      role="gridcell"
      aria-colindex={col + 1}
      data-row-index={rowIndex}
      data-col-index={col}
      // Permanently -1; the roving stop is on the checkbox. See
      // `TableSelectAllColumn` for the argument.
      tabIndex={-1}
      className={cn(cellVariants(), "w-0 whitespace-nowrap", className)}
      {...props}
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

/* ════════════════════════════════════════════════════════════════════════════
 * RESIZING
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Wraps a `<Table>` to make it scroll. **This is the scroll container for any
 * wide table, resizable or not.**
 *
 * That sentence is here because the name does not say it, and a screenshot
 * audit (`scratchpad/visual-audit.md`, finding 6) recorded Lumo as having no
 * `table-container` at all next to shadcn's and ReUI's. It has had one since
 * the React Aria days; what it has is a name inherited from
 * `ResizableTableContainer`, which reads as an opt-in for one feature rather
 * than as the answer to "my table is wider than its column". The name is not
 * changed — it is public API and a rename would break every consumer to fix a
 * documentation problem — so the documentation is fixed instead, and the
 * examples now reach for it on a plain wide table as well as on a resizable
 * one.
 *
 * It is also the reason column resizing does not push the page sideways: a
 * resized grid is wider than its container, and a horizontal scrollbar on the
 * DOCUMENT is the one thing that behaves differently under `dir="rtl"` in every
 * engine. Keeping the overflow on a named box keeps it out of that argument
 * entirely — which is the same reason it is worth reaching for on a table that
 * merely has too many columns.
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
 *
 * ═══ THIS IS WHERE A `node_modules` PATCH WENT AWAY ═════════════════════════
 *
 * React Aria's `useTableColumnResize` put `aria-valuetext` on a hidden
 * `<input type="range">`, unconditionally, from its own bundle:
 *
 *     'aria-valuetext': stringFormatter.format('columnSize', {value})
 *     en-US: columnSize: (args) => `${args.value} pixels`
 *
 * No prop reached it — `filterDOMProps(props, {global: true})` does not carry
 * `aria-*` at all — so Lumo shipped `patches/react-aria@3.51.0.patch`, a 27 KB
 * patch adding a `fa-IR` bundle, and the correctness of a Persian page depended
 * on a patch surviving every `pnpm install`.
 *
 * **There is no hidden input here and no bundle.** The handle is a `<button>`
 * this file renders, its name is a required prop, and the only announced string
 * is the one the caller passed. The patch is not needed for this component any
 * more; whether it can be deleted outright depends on the components still on
 * React Aria, which this file does not own.
 *
 * A `<button>` and not a `<div>`: a resize handle must be operable from the
 * keyboard (WCAG 2.1.1), and a button is the one element that is focusable,
 * activatable by Enter AND Space, and announced as operable, with no ARIA at
 * all. `type="button"` because an unadorned `<button>` inside a `<form>`
 * submits it.
 *
 * ── WHAT IS NOT CLAIMED ─────────────────────────────────────────────────────
 *
 * The pointer drag is TanStack's `getResizeHandler()`; the keyboard resize
 * (arrow keys nudging a column's width) is NOT implemented, and is listed with
 * typeahead in the file header as a capability React Aria supplied and this
 * does not. The handle is focusable and named, so it is discoverable and not
 * yet actionable from the keyboard — which is an honest partial rather than a
 * pretend-complete control.
 */
export interface ColumnResizerProps
  extends Omit<ComponentProps<"button">, "children" | "className" | "aria-label" | "type"> {
  /** Announced name of the resize handle. Required. */
  label: string;
  /** The column this handle resizes. */
  columnId?: string | undefined;
  className?: string | undefined;
}

export function ColumnResizer({ label, columnId, className, ...props }: ColumnResizerProps) {
  const { table } = useTableContext();
  const header = columnId === undefined
    ? undefined
    : table
        ?.getHeaderGroups()
        .flatMap((group) => group.headers)
        .find((candidate) => candidate.column.id === columnId);
  const resizing = header?.column.getIsResizing() ?? false;

  return (
    <button
      data-lumo=""
      type="button"
      aria-label={label}
      {...(resizing ? { "data-resizing": "" } : {})}
      {...(header === undefined
        ? {}
        : {
            onMouseDown: header.getResizeHandler(),
            onTouchStart: header.getResizeHandler(),
          })}
      className={cn(columnResizerVariants(), className)}
      {...props}
    />
  );
}
