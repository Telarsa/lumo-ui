"use client";

import { useRef, useState } from "react";
import type { Locale } from "@lumo-ui/core";
import {
  Alert,
  Button,
  ChartContainer,
  ChartLegend,
  LumoForm,
  Menu,
  MenuCheckboxItem,
  MenuPopover,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  MultiSelect,
  Pagination,
  Rating,
  TextField,
  TagsInput,
  ToastRegion,
  barY,
  chartCategoryAxis,
  chartColor,
  chartTooltip,
  chartValueAxis,
  createToastQueue,
  defineChart,
  fieldControl,
  lumoValidators,
  scaleBand,
  scaleLinear,
  useLumoForm,
  type ChartConfig,
  type LumoValidatorMessages,
} from "@lumo-ui/ui";

export interface MultiSelectIslandProps {
  locale: Locale;
  label: string;
  placeholder: string;
  suggestionsLabel: string;
  dismissLabel: string;
  removePrefix: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: readonly string[];
}

export function MultiSelectIsland({
  locale,
  label,
  placeholder,
  suggestionsLabel,
  dismissLabel,
  removePrefix,
  options,
  defaultValue,
}: MultiSelectIslandProps) {
  const [value, setValue] = useState<readonly string[]>(defaultValue ?? []);
  return (
    <MultiSelect
      locale={locale}
      label={label}
      placeholder={placeholder}
      suggestionsLabel={suggestionsLabel}
      dismissLabel={dismissLabel}
      removeLabel={(item) => `${removePrefix} ${item}`}
      options={options}
      value={value}
      onValueChange={setValue}
      className="max-w-sm"
    />
  );
}

export interface TagsInputIslandProps {
  label: string;
  placeholder: string;
  suggestionsLabel: string;
  removePrefix: string;
  suggestions: readonly string[];
  defaultValue?: readonly string[];
}

export function TagsInputIsland({
  label,
  placeholder,
  suggestionsLabel,
  removePrefix,
  suggestions,
  defaultValue,
}: TagsInputIslandProps) {
  const [value, setValue] = useState<readonly string[]>(defaultValue ?? []);
  return (
    <TagsInput
      label={label}
      placeholder={placeholder}
      removeLabel={(item) => `${removePrefix} ${item}`}
      suggestions={suggestions}
      suggestionsLabel={suggestionsLabel}
      value={value}
      onValueChange={setValue}
      className="max-w-sm"
    />
  );
}

/**
 * The demos that cannot be written in `demos.tsx`: that module is a SERVER
 * module, and a function (`valueLabel`, `pageLabel`, render props), a class
 * instance (`ToastRegion.queue`, a `CalendarDate`) or a hook (`useLumoTable`)
 * cannot cross the RSC boundary. Every prop below is a STRING or plain data
 * the caller supplies per locale — no copy is authored in this file; `demos.tsx`
 * stays the single place a user-visible string is written, in both locales.
 * These still prerender under the static export, so `lumo-gate` grades them too.
 */

/* rating */

export interface RatingIslandProps {
  locale: Locale;
  /** The read-only summary's score. */
  value: number;
  /** Joins score and maximum: «۴ از ۵». */
  ofWord: string;
  /** Announced name of the interactive group, e.g. «امتیاز شما». */
  groupLabel: string;
  /** The noun one star is counted in: «ستاره». */
  starWord: string;
}

export function RatingIsland({
  locale,
  value,
  ofWord,
  groupLabel,
  starWord,
}: RatingIslandProps) {
  return (
    <div className="flex flex-col gap-4">
      <Rating
        isReadOnly
        value={value}
        locale={locale}
        // Both arguments arrive ALREADY formatted — `rating.tsx` runs them
        // through `formatNumber` first, which is what makes «۴ از ۵» expressible.
        valueLabel={(v, max) => `${v} ${ofWord} ${max}`}
      />
      <Rating
        locale={locale}
        label={groupLabel}
        starLabel={(v) => `${v} ${starWord}`}
        defaultValue={3}
        size="lg"
      />
    </div>
  );
}

/* pagination */

export interface PaginationIslandProps {
  locale: Locale;
  count: number;
  /** Announced name of the `<nav>`, e.g. «صفحه‌بندی نتایج». */
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** The noun a page is called by: «صفحه» → «صفحه ۳». */
  pageWord: string;
}

export function PaginationIsland({
  locale,
  count,
  label,
  previousLabel,
  nextLabel,
  pageWord,
}: PaginationIslandProps) {
  // Constant initial value, so the prerendered bytes are deterministic.
  const [page, setPage] = useState(3);

  return (
    <Pagination
      locale={locale}
      page={page}
      count={count}
      onPageChange={setPage}
      label={label}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      pageLabel={(formattedPage) => `${pageWord} ${formattedPage}`}
    />
  );
}

/* toast */

// Module scope, as `toast.tsx` prescribes: anything can raise a toast without
// being a React component.
const demoToasts = createToastQueue({ maxVisibleToasts: 3 });

export interface ToastIslandProps {
  locale: Locale;
  /** Announced name of the notification landmark, e.g. «اعلان‌ها». */
  regionLabel: string;
  /** Announced name of every toast's ✕. */
  closeLabel: string;
  /** Visible text on the button that raises the positive toast. */
  positiveTrigger: string;
  positiveTitle: string;
  positiveBody: string;
  /** Visible text on the button that raises the critical toast. */
  criticalTrigger: string;
  criticalTitle: string;
  criticalBody: string;
}

export function ToastIsland({
  locale,
  regionLabel,
  closeLabel,
  positiveTrigger,
  positiveTitle,
  positiveBody,
  criticalTrigger,
  criticalTitle,
  criticalBody,
}: ToastIslandProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onPress={() => {
          demoToasts.add(
            { title: positiveTitle, description: positiveBody, tone: "positive" },
            { timeout: 5000 },
          );
        }}
      >
        {positiveTrigger}
      </Button>
      <Button
        variant="outline"
        onPress={() => {
          // No timeout: a failure is something the reader has to act on.
          demoToasts.add({
            title: criticalTitle,
            description: criticalBody,
            tone: "critical",
          });
        }}
      >
        {criticalTrigger}
      </Button>
      {/*
       * Renders `null` until a toast is queued, so it adds nothing to the served bytes.
       */}
      <ToastRegion
        queue={demoToasts}
        locale={locale}
        label={regionLabel}
        closeLabel={closeLabel}
      />
    </div>
  );
}

/* chart */

export interface ChartIslandProps {
  locale: Locale;
  /** The chart's announced name — the plot is `role="img"` with a Tab stop. */
  label: string;
  /** The series' legend and tooltip name, e.g. «فروش». */
  seriesLabel: string;
  /** Names the category column, e.g. «ماه». Heads the table's first column. */
  categoryLabel: string;
  /** The data table's caption — the ONLY figures a no-JS reader receives. */
  dataCaption: string;
  /** Category name and value per bar. Plain data, so it crosses the boundary. */
  data: readonly { readonly month: string; readonly sales: number }[];
}

export function ChartIsland({
  locale,
  label,
  seriesLabel,
  categoryLabel,
  dataCaption,
  data,
}: ChartIslandProps) {
  // `label` is required by `ChartConfig`: without it the legend falls back to
  // the dataKey, an English identifier on a Persian dashboard.
  const config: ChartConfig = {
    month: { label: categoryLabel },
    sales: { label: seriesLabel, color: "oklch(0.62 0.16 255)" },
  };

  const rows = [...data];

  return (
    <ChartContainer
      config={config}
      locale={locale}
      label={label}
      /*
       * `ariaLabel` is required by TanStack's own types. Use the Lumo axis
       * builders, never bare axis options: they reverse the scale's RANGE under
       * RTL and run every tick through `formatNumber`.
       */
      definition={
        defineChart({
          marks: [barY(rows, { id: "sales", x: "month", y: "sales", fill: chartColor("sales") })],
          x: chartCategoryAxis(locale, {
            scale: () => scaleBand<string>().padding(0.2),
          }) as never,
          y: chartValueAxis(locale, { scale: scaleLinear, grid: true }) as never,
          tooltip: chartTooltip(locale, config),
        }) as never
      }
      data={rows}
      categoryKey="month"
      dataCaption={dataCaption}
      className="w-full"
    >
      {/* Chrome AROUND the plot now, not a render-prop inside it. */}
      <ChartLegend hiddenSeries={["month"]} />
    </ChartContainer>
  );
}

/* attachment */

// Imports are hoisted; names already bound at the top are not re-imported.
import {
  Attachment,
  AttachmentContent,
  AttachmentMeta,
  AttachmentName,
  AttachmentRemove,
} from "@lumo-ui/ui";

export interface AttachmentIslandProps {
  locale: Locale;
  /** The verb of the remove phrase: «حذف» → «حذف گزارش فروش مرداد». */
  removeWord: string;
  /** Shown once the last attachment is removed, e.g. «همهٔ پیوست‌ها حذف شد.». */
  emptyText: string;
  /** Plain data, so it crosses the boundary: display name, bytes, translated kind. */
  files: readonly { readonly name: string; readonly size: number; readonly kind: string }[];
}

/**
 * The one attachment demo that cannot live in a server module: removal needs
 * `onPress`, and a function cannot cross the server/client boundary.
 */
export function AttachmentIsland({ locale, removeWord, emptyText, files }: AttachmentIslandProps) {
  const [remaining, setRemaining] = useState(files);

  if (remaining.length === 0) {
    return <p className="text-sm text-fg-muted">{emptyText}</p>;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {remaining.map((file) => (
        <Attachment key={file.name}>
          <AttachmentContent>
            <AttachmentName>{file.name}</AttachmentName>
            <AttachmentMeta locale={locale} size={file.size}>
              <span>{file.kind}</span>
            </AttachmentMeta>
          </AttachmentContent>
          <AttachmentRemove
            label={`${removeWord} ${file.name}`}
            onPress={() => {
              setRemaining((current) => current.filter((f) => f.name !== file.name));
            }}
          />
        </Attachment>
      ))}
    </div>
  );
}

/* resizable */

import { Resizable } from "@lumo-ui/ui";

export interface ResizableIslandProps {
  locale: Locale;
  /** Announced name of the divider, e.g. «تغییر اندازهٔ ستون‌ها». */
  label: string;
  /** The unit noun of the announced size: «درصد» → «۳۰ درصد». The number arrives formatted. */
  percentWord: string;
  /** Visible caption inside the start pane. */
  startTitle: string;
  /** Visible caption inside the end pane. */
  endTitle: string;
  /** Passed through; `vertical` splits on the block axis. */
  orientation?: "horizontal" | "vertical";
}

/**
 * The one resizable demo that cannot live in a server module: `sizeLabel` is a
 * REQUIRED function, and a function cannot cross the server/client boundary.
 */
export function ResizableIsland({
  locale,
  label,
  percentWord,
  startTitle,
  endTitle,
  orientation,
}: ResizableIslandProps) {
  const pane = "flex h-full items-center justify-center p-4 text-sm text-fg-muted";
  return (
    <Resizable
      locale={locale}
      label={label}
      sizeLabel={(v: string) => `${v} ${percentWord}`}
      defaultSize={30}
      {...(orientation === undefined ? {} : { orientation })}
      className={
        orientation === "vertical"
          ? "h-64 w-full max-w-md rounded-lg border border-border"
          : "h-40 w-full max-w-md rounded-lg border border-border"
      }
      startPanel={<div className={pane}>{startTitle}</div>}
      endPanel={<div className={pane}>{endTitle}</div>}
    />
  );
}

/* chart: line and area */

/*
 * No donut island: `@tanstack/charts` 0.9.0 has no pie mark, and `chart.tsx`
 * removed `ChartPie` rather than stub it — the gap is recorded in
 * `bulk-migration-result.json`, not papered over.
 */
import { areaY, lineY, scalePoint } from "@lumo-ui/ui";

/**
 * One plotted row of a two-column series: a category and a figure. A `type`,
 * not an `interface`: only a type alias gets the implicit index signature that
 * makes it assignable to `ChartRow`.
 */
export type SeriesRow = {
  readonly category: string;
  readonly value: number;
};

interface SeriesIslandProps {
  locale: Locale;
  /** The plot's announced name — it is `role="img"` and a Tab stop. */
  label: string;
  /** The series' legend and tooltip name, e.g. «بازدید». */
  seriesLabel: string;
  /** Names the category column, e.g. «روز». Heads the table's first column. */
  categoryLabel: string;
  /** The data table's caption — the only figures a no-JS reader receives. */
  dataCaption: string;
  data: readonly SeriesRow[];
}

/** `label` on every config entry, for chart.variants.ts's reason. */
function seriesConfig(categoryLabel: string, seriesLabel: string): ChartConfig {
  return {
    category: { label: categoryLabel },
    value: { label: seriesLabel, color: "oklch(0.62 0.16 255)" },
  };
}

export function ChartLineIsland({
  locale,
  label,
  seriesLabel,
  categoryLabel,
  dataCaption,
  data,
}: SeriesIslandProps) {
  const config = seriesConfig(categoryLabel, seriesLabel);
  const rows = [...data];

  return (
    <ChartContainer
      config={config}
      locale={locale}
      label={label}
      /*
       * `scalePoint`, not `scaleBand`: a line's vertices sit ON the category;
       * the axis builder still mirrors the RANGE under RTL.
       */
      definition={
        defineChart({
          marks: [
            lineY(rows, {
              id: "value",
              x: "category",
              y: "value",
              stroke: chartColor("value"),
            }),
          ],
          x: chartCategoryAxis(locale, { scale: scalePoint }) as never,
          y: chartValueAxis(locale, { scale: scaleLinear, grid: true }) as never,
          tooltip: chartTooltip(locale, config),
        }) as never
      }
      data={rows}
      categoryKey="category"
      dataCaption={dataCaption}
      className="w-full"
    >
      <ChartLegend hiddenSeries={["category"]} />
    </ChartContainer>
  );
}

export function ChartAreaIsland({
  locale,
  label,
  seriesLabel,
  categoryLabel,
  dataCaption,
  data,
}: SeriesIslandProps) {
  const config = seriesConfig(categoryLabel, seriesLabel);
  const rows = [...data];

  return (
    <ChartContainer
      config={config}
      locale={locale}
      label={label}
      // `areaY` fills to the baseline and `stroke` draws its edge, on one mark.
      definition={
        defineChart({
          marks: [
            areaY(rows, {
              id: "value",
              x: "category",
              y: "value",
              fill: chartColor("value"),
              fillOpacity: 0.15,
              stroke: chartColor("value"),
            }),
          ],
          x: chartCategoryAxis(locale, { scale: scalePoint }) as never,
          y: chartValueAxis(locale, { scale: scaleLinear, grid: true }) as never,
          tooltip: chartTooltip(locale, config),
        }) as never
      }
      data={rows}
      categoryKey="category"
      dataCaption={dataCaption}
      className="w-full"
    >
      <ChartLegend hiddenSeries={["category"]} />
    </ChartContainer>
  );
}


/*
 * A calendar needs an island because `isDateUnavailable` is a FUNCTION, which
 * cannot cross into the RSC payload; the predicate is owned here.
 */
import { Calendar } from "@lumo-ui/ui";

/**
 * The Iranian weekend is پنجشنبه and جمعه. Written against the absolute weekday
 * of the underlying instant, not a Persian-week index — the two disagree.
 * Typed structurally because `@internationalized/date` is not a dependency here.
 */
function isWeekend(date: { toDate: (timeZone: string) => Date }) {
  const weekday = date.toDate("UTC").getUTCDay();
  return weekday === 4 || weekday === 5;
}

// `CalendarDate` is not importable in this package, so the cast is the seam
// between two declarations of one fact; it narrows rather than widens.
const isWeekendDate = isWeekend as (date: { toDate: (tz: string) => Date }) => boolean as (
  date: Parameters<NonNullable<React.ComponentProps<typeof Calendar>["isDateUnavailable"]>>[0],
) => boolean;

export interface CalendarClosedDaysIslandProps {
  /** Announced name of the calendar. */
  label: string;
  /** Selects the calendar system, the digits, the week start and the direction. */
  locale: Locale;
  /** Help text under the grid, naming which days are closed. */
  description: string;
  /** Shown when an unavailable day is chosen. Required — the engine's fallback is English. */
  errorMessage: string;
}

export function CalendarClosedDaysIsland({
  label,
  locale,
  description,
  errorMessage,
}: CalendarClosedDaysIslandProps) {
  return (
    <Calendar
      label={label}
      locale={locale}
      today={calendarDay(DEMO_TODAY_ISO)}
      description={description}
      isDateUnavailable={isWeekendDate}
      errorMessage={errorMessage}
    />
  );
}

/* table: state examples */

/*
 * Base UI has no table; `table.tsx` is markup over a TanStack instance from
 * `useLumoTable`, a HOOK, so the stateful table examples live here.
 */
import { Pencil } from "lucide-react";
import {
  Cell,
  Column,
  ColumnResizer,
  IconButton,
  ResizableTableContainer,
  Row,
  Table,
  TableBody,
  TableHeader,
  TableSelectAllColumn,
  TableSelectionCell,
  TableTreeCell,
  TableWidgetCell,
  useLumoTable,
} from "@lumo-ui/ui";

/** One order. Plain data, so it crosses the RSC boundary. */
export type OrderDemoRow = {
  readonly id: string;
  readonly customer: string;
  readonly city: string;
};

export interface TableSelectionIslandProps {
  locale: Locale;
  /** Announced name of the grid. */
  label: string;
  customerHeader: string;
  cityHeader: string;
  selectAllLabel: string;
  /** Announced name of ONE row's checkbox. */
  selectRowLabel: string;
  rows: readonly OrderDemoRow[];
}

export function TableSelectionIsland({
  locale,
  label,
  customerHeader,
  cityHeader,
  selectAllLabel,
  selectRowLabel,
  rows,
}: TableSelectionIslandProps) {
  const table = useLumoTable<OrderDemoRow>({
    locale,
    data: [...rows],
    columns: [
      { id: "customer", accessorKey: "customer" },
      { id: "city", accessorKey: "city" },
    ],
    getRowId: (row: OrderDemoRow) => row.id,
    enableRowSelection: true,
    // The pre-selected row: initial STATE now, not an attribute.
    initialState: { rowSelection: { b: true } },
  });

  return (
    <Table label={label} locale={locale} table={table} className="max-w-xl">
      <TableHeader>
        <TableSelectAllColumn label={selectAllLabel} />
        <Column id="customer" isRowHeader>
          {customerHeader}
        </Column>
        <Column id="city">{cityHeader}</Column>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Row key={row.id} row={row}>
            <TableSelectionCell label={selectRowLabel} />
            <Cell isRowHeader>{row.original.customer}</Cell>
            <Cell>{row.original.city}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * The actions column, and the ONLY reason it is an island: `TableWidgetCell`
 * takes a RENDER PROP, and a function cannot cross the RSC boundary (the
 * prerender fails with a build error naming the prop). The buttons carry no
 * handler on purpose; the SHAPE is the subject — one Tab stop for the grid.
 */
export interface TableActionsIslandProps {
  locale: Locale;
  /** Announced name of the grid. */
  label: string;
  customerHeader: string;
  cityHeader: string;
  /** Announced name of the actions COLUMN — a header, not a control. */
  actionsHeader: string;
  /** Announced name of ONE row's edit button. Required: an icon is not a name. */
  editLabel: string;
  rows: readonly OrderDemoRow[];
}

export function TableActionsIsland({
  locale,
  label,
  customerHeader,
  cityHeader,
  actionsHeader,
  editLabel,
  rows,
}: TableActionsIslandProps) {
  return (
    <Table label={label} locale={locale} className="max-w-xl">
      <TableHeader>
        <Column id="customer" isRowHeader>
          {customerHeader}
        </Column>
        <Column id="city">{cityHeader}</Column>
        <Column id="actions">{actionsHeader}</Column>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <Row key={row.id} id={row.id}>
            <Cell isRowHeader>{row.customer}</Cell>
            <Cell>{row.city}</Cell>
            {/*
             * ONE control, and the tab index comes from the cell. A second button here
             * would share the one stop and strand itself; put it behind a menu instead.
             */}
            <TableWidgetCell>
              {(tabIndex) => (
                <IconButton variant="ghost" size="sm" label={editLabel} tabIndex={tabIndex}>
                  <Pencil aria-hidden="true" />
                </IconButton>
              )}
            </TableWidgetCell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

export interface TableSortingIslandProps extends Omit<TableSelectionIslandProps, "selectAllLabel" | "selectRowLabel"> {
  sortAscendingLabel: string;
  sortDescendingLabel: string;
}

export function TableSortingIsland({
  locale,
  label,
  customerHeader,
  cityHeader,
  sortAscendingLabel,
  sortDescendingLabel,
  rows,
}: TableSortingIslandProps) {
  const table = useLumoTable<OrderDemoRow>({
    locale,
    data: [...rows],
    columns: [
      { id: "customer", accessorKey: "customer" },
      { id: "city", accessorKey: "city" },
    ],
    getRowId: (row: OrderDemoRow) => row.id,
    // The sort is REAL: `useLumoTable` compares with `Intl.Collator` over the
    // page's locale, so «اصفهان» precedes «تبریز».
    initialState: { sorting: [{ id: "city", desc: false }] },
  });

  return (
    <Table label={label} locale={locale} table={table} className="max-w-xl">
      <TableHeader>
        <Column id="customer" isRowHeader>
          {customerHeader}
        </Column>
        <Column
          id="city"
          allowsSorting
          sortAscendingLabel={sortAscendingLabel}
          sortDescendingLabel={sortDescendingLabel}
        >
          {cityHeader}
        </Column>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Row key={row.id} row={row}>
            <Cell isRowHeader>{row.original.customer}</Cell>
            <Cell>{row.original.city}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

export interface TableResizingIslandProps {
  locale: Locale;
  /** Announced name of the grid. */
  label: string;
  customerHeader: string;
  cityHeader: string;
  amountHeader: string;
  /** Announced name of the resize handle. */
  resizeLabel: string;
  /** Localized unit announced after the current column width. */
  resizeUnit: string;
  rows: readonly (OrderDemoRow & { readonly amountText: string })[];
}

/**
 * A resize handle is stateful even when the rows are static: `ColumnResizer`
 * needs its TanStack column, or the docs show a handle that resizes nothing.
 */
export function TableResizingIsland({
  locale,
  label,
  customerHeader,
  cityHeader,
  amountHeader,
  resizeLabel,
  resizeUnit,
  rows,
}: TableResizingIslandProps) {
  const table = useLumoTable({
    locale,
    data: [...rows],
    columns: [
      { id: "customer", accessorKey: "customer", size: 200 },
      { id: "city", accessorKey: "city", size: 140 },
      { id: "amountText", accessorKey: "amountText", size: 140 },
    ],
    getRowId: (row) => row.id,
  });

  return (
    <ResizableTableContainer className="max-w-xl">
      <Table label={label} locale={locale} table={table}>
        <TableHeader>
          <Column
            id="customer"
            isRowHeader
            defaultWidth={200}
            resizer={
              <ColumnResizer
                label={resizeLabel}
                valueText={(value) => `${formatNumber(value, locale)} ${resizeUnit}`}
                columnId="customer"
              />
            }
          >
            {customerHeader}
          </Column>
          <Column id="city" defaultWidth={140}>
            {cityHeader}
          </Column>
          <Column id="amountText" defaultWidth={140}>
            {amountHeader}
          </Column>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row}>
              <Cell isRowHeader>{row.original.customer}</Cell>
              <Cell>{row.original.city}</Cell>
              <Cell>{row.original.amountText}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}

/**
 * The table demo on the home page's component list: four columns, a resizable
 * first column, a checkbox column and a sortable one.
 */
export interface TableDemoIslandProps {
  locale: Locale;
  label: string;
  customerHeader: string;
  cityHeader: string;
  amountHeader: string;
  selectAllLabel: string;
  selectRowLabel: string;
  sortAscendingLabel: string;
  sortDescendingLabel: string;
  resizeLabel: string;
  /** Localized unit announced after the current column width. */
  resizeUnit: string;
  /** Rows, with the amount ALREADY formatted — see `Cell`. */
  rows: readonly (OrderDemoRow & { readonly amount: number; readonly amountText: string })[];
}

export function TableDemoIsland({
  locale,
  label,
  customerHeader,
  cityHeader,
  amountHeader,
  selectAllLabel,
  selectRowLabel,
  sortAscendingLabel,
  sortDescendingLabel,
  resizeLabel,
  resizeUnit,
  rows,
}: TableDemoIslandProps) {
  const table = useLumoTable({
    locale,
    data: [...rows],
    columns: [
      { id: "customer", accessorKey: "customer", size: 180 },
      { id: "city", accessorKey: "city", size: 120 },
      // Sorted on the NUMBER, never on `amountText`: a formatted «۱٬۲۵۰٬۰۰۰»
      // collates by its first digit, which is not what "sort by amount" means.
      { id: "amount", accessorKey: "amount", size: 140 },
    ],
    getRowId: (row) => row.id,
    enableRowSelection: true,
    initialState: {
      rowSelection: { b: true },
      sorting: [{ id: "city", desc: false }],
    },
  });

  return (
    <ResizableTableContainer className="max-w-xl">
      <Table label={label} locale={locale} table={table}>
        <TableHeader>
          <TableSelectAllColumn label={selectAllLabel} defaultWidth={48} />
          {/*
           * Lumo's own resize handle: a `<button>` with a required name and a localized value.
           */}
          <Column
            id="customer"
            isRowHeader
            defaultWidth={180}
            resizer={
              <ColumnResizer
                label={resizeLabel}
                valueText={(value) => `${formatNumber(value, locale)} ${resizeUnit}`}
                columnId="customer"
              />
            }
          >
            {customerHeader}
          </Column>
          <Column
            id="city"
            defaultWidth={120}
            allowsSorting
            sortAscendingLabel={sortAscendingLabel}
            sortDescendingLabel={sortDescendingLabel}
          >
            {cityHeader}
          </Column>
          <Column id="amount" defaultWidth={140}>
            {amountHeader}
          </Column>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row}>
              <TableSelectionCell label={selectRowLabel} />
              <Cell isRowHeader>{row.original.customer}</Cell>
              <Cell>{row.original.city}</Cell>
              <Cell>{row.original.amountText}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}

/* command: the palette */

/*
 * `CommandList`/`CommandGroup` take RENDER FUNCTIONS over the filtered set,
 * and a function cannot cross into the RSC payload. Static JSX children would
 * dodge the boundary but are never filtered — do not use them here.
 */
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@lumo-ui/ui";

/** One command. Plain data, so it crosses the boundary. */
export type CommandIslandItem = {
  readonly value: string;
  readonly label: string;
  /** Drawn at the row's inline end. Never part of the filter string. */
  readonly shortcut?: string;
};

/** A titled group of commands, for the grouped `items` shape. */
export type CommandIslandGroup = {
  readonly value: string;
  readonly heading: string;
  readonly items: readonly CommandIslandItem[];
};

export interface CommandPaletteIslandProps {
  /** Announced name of the results list. */
  listLabel: string;
  /** Announced name of the search field — never its placeholder. */
  inputLabel: string;
  inputPlaceholder?: string | undefined;
  /** Flat commands. Mutually exclusive with `groups`. */
  items?: readonly CommandIslandItem[] | undefined;
  /** Grouped commands. Mutually exclusive with `items`. */
  groups?: readonly CommandIslandGroup[] | undefined;
  /** Shown when the filter matches nothing. Omit to render no empty state. */
  emptyText?: string | undefined;
  /** Wraps the palette in a `CommandDialog`. Omit to render it inline. */
  dialog?:
    | {
        readonly title: string;
        readonly description: string;
        readonly closeLabel: string;
        readonly triggerLabel: string;
        readonly isDismissable?: boolean;
      }
    | undefined;
  /** A separator under the list, as the modal example shows. */
  withSeparator?: boolean | undefined;
  className?: string | undefined;
}

function commandRow(item: CommandIslandItem) {
  return (
    <CommandItem key={item.value} id={item.value}>
      {item.label}
      {item.shortcut === undefined ? null : <CommandShortcut>{item.shortcut}</CommandShortcut>}
    </CommandItem>
  );
}

export function CommandPaletteIsland({
  listLabel,
  inputLabel,
  inputPlaceholder,
  items,
  groups,
  emptyText,
  dialog,
  withSeparator,
  className,
}: CommandPaletteIslandProps) {
  const palette = (
    <Command<CommandIslandItem | CommandIslandGroup>
      items={groups ?? items ?? []}
      {...(dialog === undefined && className !== undefined ? { className } : {})}
    >
      <CommandInput
        label={inputLabel}
        {...(inputPlaceholder === undefined ? {} : { placeholder: inputPlaceholder })}
      />
      <CommandList<CommandIslandItem | CommandIslandGroup> label={listLabel}>
        {(entry: CommandIslandItem | CommandIslandGroup) =>
          "items" in entry ? (
            <CommandGroup<CommandIslandItem>
              key={entry.value}
              heading={entry.heading}
              items={entry.items}
            >
              {(item: CommandIslandItem) => commandRow(item)}
            </CommandGroup>
          ) : (
            commandRow(entry)
          )
        }
      </CommandList>
      {/*
       * A SIBLING of the list, not a `renderEmptyState` prop: `CommandEmpty` is a
       * live region that mounts only when the filter emptied the list.
       */}
      {emptyText === undefined ? null : <CommandEmpty>{emptyText}</CommandEmpty>}
      {withSeparator === true ? <CommandSeparator /> : null}
    </Command>
  );

  if (dialog === undefined) return palette;

  return (
    <CommandDialog
      title={dialog.title}
      description={dialog.description}
      closeLabel={dialog.closeLabel}
      {...(dialog.isDismissable === true ? { isDismissable: true } : {})}
      trigger={<Button variant="outline">{dialog.triggerLabel}</Button>}
      {...(className === undefined ? {} : { className })}
    >
      {palette}
    </CommandDialog>
  );
}

/* autocomplete */

// Same boundary as the palette: `AutocompleteListBox` renders the filtered
// items through a render function, which cannot cross into the RSC payload.
import { Autocomplete, AutocompleteInput, AutocompleteItem, AutocompleteListBox } from "@lumo-ui/ui";

export interface AutocompleteIslandProps {
  /** Announced name of the input. Shown visibly as well. */
  inputLabel: string;
  inputPlaceholder?: string | undefined;
  /** Announced name of the list of suggestions. */
  listLabel: string;
  items: readonly CommandIslandItem[];
}

export function AutocompleteIsland({
  inputLabel,
  inputPlaceholder,
  listLabel,
  items,
}: AutocompleteIslandProps) {
  return (
    <Autocomplete items={items}>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <AutocompleteInput
          label={inputLabel}
          showLabel
          {...(inputPlaceholder === undefined ? {} : { placeholder: inputPlaceholder })}
        />
        <AutocompleteListBox
          label={listLabel}
          className="rounded-md border border-border bg-surface"
        >
          {(item: CommandIslandItem) => (
            <AutocompleteItem key={item.value} id={item.value}>
              {item.label}
            </AutocompleteItem>
          )}
        </AutocompleteListBox>
      </div>
    </Autocomplete>
  );
}

/* form state */

export interface FormStateIslandProps {
  locale: Locale;
  /** The three field labels. */
  nameLabel: string;
  nationalIdLabel: string;
  mobileLabel: string;
  /** Help text under the national-ID field, explaining that Persian digits work. */
  nationalIdHelp: string;
  /** The submit button. */
  submitLabel: string;
  /** Announced once the form has been accepted. */
  successMessage: string;
  /** Field-specific required copy for the name field. */
  nameRequiredMessage: string;
  /**
   * Required caller-authored validator copy. Numeric rules interpolate `{n}`
   * on this client side because functions cannot cross the RSC boundary.
   */
  validatorMessages: {
    required: string;
    minLength: string;
    maxLength: string;
    min: string;
    max: string;
    number: string;
    email: string;
    pattern: string;
    nationalId: string;
    mobile: string;
  };
}

/**
 * A real, validating, three-field form. An island because `useLumoForm` is a
 * hook; every string is still a prop. Submit empty: the browser does not
 * intervene (`noValidate`), Lumo's Persian messages appear and focus lands on
 * the first invalid control. Persian digits are accepted in the ID fields.
 */
export function FormStateIsland({
  locale,
  nameLabel,
  nationalIdLabel,
  mobileLabel,
  nationalIdHelp,
  submitLabel,
  successMessage,
  nameRequiredMessage,
  validatorMessages,
}: FormStateIslandProps) {
  const [saved, setSaved] = useState(false);
  const withNumber = (template: string) => (formattedNumber: string) =>
    template.replace("{n}", formattedNumber);
  const messages: LumoValidatorMessages = {
    ...validatorMessages,
    minLength: withNumber(validatorMessages.minLength),
    maxLength: withNumber(validatorMessages.maxLength),
    min: withNumber(validatorMessages.min),
    max: withNumber(validatorMessages.max),
  };
  const v = lumoValidators(locale, messages);

  const form = useLumoForm({
    defaultValues: { fullName: "", nationalId: "", mobile: "" },
    onSubmit: () => {
      setSaved(true);
    },
  });

  return (
    <LumoForm form={form} className="max-w-sm">
      <form.Field
        name="fullName"
        validators={{ onDynamic: v.all(v.required(nameRequiredMessage), v.minLength(3)) }}
      >
        {(field) => <TextField label={nameLabel} {...fieldControl(field, locale)} />}
      </form.Field>

      <form.Field name="nationalId" validators={{ onDynamic: v.all(v.required(), v.nationalId()) }}>
        {(field) => (
          <TextField
            label={nationalIdLabel}
            description={nationalIdHelp}
            {...fieldControl(field, locale)}
          />
        )}
      </form.Field>

      <form.Field name="mobile" validators={{ onDynamic: v.all(v.required(), v.mobile()) }}>
        {(field) => <TextField label={mobileLabel} {...fieldControl(field, locale)} />}
      </form.Field>

      <Button type="submit" className="w-fit">
        {submitLabel}
      </Button>

      {/* Announced, not merely drawn — a form that reports success only in
          pixels reports nothing to a screen reader. */}
      {saved ? (
        <p role="status" className="text-sm text-positive">
          {successMessage}
        </p>
      ) : null}
    </LumoForm>
  );
}

/* phone-input, sortable and kanban */

/*
 * PhoneInput is CONTROLLED-only (no `onChange` means the field cannot be typed
 * into); Sortable and Kanban require `onReorder`/`onColumnsChange`, a render
 * function and a `strings` object with a function member. Assembling
 * `position`/`movedTo` from word parts is admissible only because these
 * sentences place their figures identically in both locales; a real caller
 * authors the closure per locale on their own client. The docs page says so.
 */
import {
  Kanban,
  PhoneInput,
  Sortable,
  type KanbanColumn,
  type PhoneCountry,
  type SortableItem,
} from "@lumo-ui/ui";

export interface PhoneInputIslandProps {
  locale: Locale;
  /** Names the field, e.g. «شمارهٔ موبایل». */
  label: string;
  /** Names the country selector — a second control inside one field. */
  countryLabel: string;
  /** Help text under the row. */
  description?: string;
  /** Placeholder for the number itself. */
  placeholder?: string;
  /** Shown when the number is rejected. */
  errorMessage?: string;
  /** ISO 3166-1 alpha-2 of the country selected first. */
  defaultCountry?: string;
  /** Overrides the shipped country list. Plain data, so it crosses. */
  countries?: readonly PhoneCountry[];
  /** Initial E.164 value, or `""` for an empty field. */
  defaultValue?: string;
  /** Caption for the read-out below, e.g. «چیزی که ذخیره می‌شود». */
  storedLabel: string;
  /** Shown in place of the E.164 string while the field is empty. */
  emptyText: string;
}

/**
 * A phone field that can actually be typed into, plus what it stores: type
 * «۰۹۱۲۱۲۳۴۵۶۷» and watch `+989121234567` appear underneath.
 */
export function PhoneInputIsland({
  locale,
  label,
  countryLabel,
  description,
  placeholder,
  errorMessage,
  defaultCountry,
  countries,
  defaultValue = "",
  storedLabel,
  emptyText,
}: PhoneInputIslandProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <PhoneInput
        locale={locale}
        label={label}
        countryLabel={countryLabel}
        value={value}
        onChange={setValue}
        {...(description === undefined ? {} : { description })}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(errorMessage === undefined ? {} : { errorMessage })}
        {...(defaultCountry === undefined ? {} : { defaultCountry })}
        {...(countries === undefined ? {} : { countries })}
      />
      <div className="rounded-md bg-surface-sunken px-3 py-2 text-xs text-fg-muted">
        <span>{storedLabel}</span>{" "}
        {value === "" ? (
          <span>{emptyText}</span>
        ) : (
          /*
           * E.164 is a Latin run; `data-lumo-latn` is the sanctioned marker and
           * `<bdi>` keeps the `+` at the right end inside an RTL paragraph.
           */
          <bdi data-lumo-latn="" dir="ltr" className="font-medium text-fg">
            {value}
          </bdi>
        )}
      </div>
    </div>
  );
}

export interface SortableIslandProps {
  locale: Locale;
  /** Names the list. */
  label: string;
  /** The rows, in their starting order. Plain data, so it crosses. */
  items: readonly SortableItem[];
  orientation?: "vertical" | "horizontal";
  /** Announced role of the handle, e.g. «دستگیرهٔ جابه‌جایی». */
  handleRoleDescription: string;
  /** Announced name of the handle, e.g. «جابه‌جایی». */
  handleLabel: string;
  /** Announced on pick-up, e.g. «برداشته شد». */
  pickedUp: string;
  /** Announced on drop, e.g. «رها شد». */
  dropped: string;
  /** Announced on Escape, e.g. «لغو شد». */
  cancelled: string;
  /** The noun in «مورد ۳ از ۷» — see the block header on assembling these. */
  itemWord: string;
  /** The joining word in «مورد ۳ از ۷». */
  ofWord: string;
}

/**
 * A working sortable list. Pick a handle up with Space, move it with the arrow
 * keys, drop it with Space or put it back with Escape. The numbers reaching
 * `position` are already localised.
 */
export function SortableIsland({
  locale,
  label,
  items,
  orientation,
  handleRoleDescription,
  handleLabel,
  pickedUp,
  dropped,
  cancelled,
  itemWord,
  ofWord,
}: SortableIslandProps) {
  const [order, setOrder] = useState<SortableItem[]>(() => [...items]);
  return (
    <Sortable
      locale={locale}
      label={label}
      items={order}
      onReorder={setOrder}
      {...(orientation === undefined ? {} : { orientation })}
      strings={{
        handleRoleDescription,
        handleLabel,
        pickedUp,
        dropped,
        cancelled,
        position: (index: string, total: string) => `${itemWord} ${index} ${ofWord} ${total}`,
      }}
      className={orientation === "horizontal" ? "w-full flex-wrap" : "w-full max-w-sm"}
    >
      {(item: SortableItem) => <span className="text-sm text-fg">{item.label}</span>}
    </Sortable>
  );
}

export interface KanbanIslandProps {
  locale: Locale;
  /** Names the board. */
  label: string;
  /** The columns and their cards. Plain data, so it crosses. */
  columns: ReadonlyArray<KanbanColumn>;
  handleRoleDescription: string;
  handleLabel: string;
  pickedUp: string;
  dropped: string;
  cancelled: string;
  /** The noun for a column in the announcement, e.g. «ستون». */
  columnWord: string;
  /** The noun in «مورد ۲ از ۴». */
  itemWord: string;
  /** The joining word in «مورد ۲ از ۴». */
  ofWord: string;
}

/**
 * A working board. Space picks a card up; the arrow keys move it within a
 * column and ACROSS columns; Escape puts it back. On the fa route columns run
 * right-to-left, so ArrowLeft advances toward «انجام‌شده».
 */
export function KanbanIsland({
  locale,
  label,
  columns,
  handleRoleDescription,
  handleLabel,
  pickedUp,
  dropped,
  cancelled,
  columnWord,
  itemWord,
  ofWord,
}: KanbanIslandProps) {
  const [board, setBoard] = useState<Array<KanbanColumn>>(() =>
    columns.map((column) => ({ ...column, cards: [...column.cards] })),
  );
  return (
    <Kanban
      locale={locale}
      label={label}
      columns={board}
      onColumnsChange={setBoard}
      strings={{
        handleRoleDescription,
        handleLabel,
        pickedUp,
        dropped,
        cancelled,
        movedTo: (column: string, index: string, total: string) =>
          `${columnWord} ${column} — ${itemWord} ${index} ${ofWord} ${total}`,
      }}
    >
      {(card) => <span className="text-fg">{card.label}</span>}
    </Kanban>
  );
}

/* data-grid */

// `DataGrid` needs an island: `useLumoTable` is a hook, and `pageLabel` and
// `rangeLabel` are required FUNCTIONS. Only the genuinely new names are imported.
import {
  DataGrid,
  DataGridColumnsMenu,
  DataGridEmpty,
  DataGridPagination,
  DataGridSearch,
  DataGridToolbar,
  PowerSearch,
  executeQuery,
  parseQuery,
  serializeQuery,
  useAsyncLumoTable,
  useLumoQueryTable,
  type AsyncCollectionPage,
  type AsyncCollectionRequest,
  type DataGridAsyncState,
  type DataGridColumnLabel,
  type DataGridTableInstance,
  type FilterQuery,
  type LumoTableInstance,
  type LumoTableRow,
  type PowerSearchField,
  type PowerSearchStrings,
  type QueryExecutionField,
} from "@lumo-ui/ui";
import { formatNumber } from "@lumo-ui/core";

/** One plotted row. Plain data, so it crosses the boundary. */
export interface DataGridIslandRow {
  id: string;
  name: string;
  city: string;
  /** A real number. It reaches the cell through `formatNumber`, never bare. */
  total: number;
}

export interface DataGridAsyncIslandProps {
  locale: Locale;
  label: string;
  nameHeader: string;
  pages: readonly (readonly DataGridIslandRow[])[];
  loadingText: string;
  refreshingText: string;
  loadingMoreText: string;
  emptyText: string;
  retryLabel: string;
  loadMoreLabel: string;
  errorText: string;
}

export interface PowerSearchDataGridRow extends DataGridIslandRow {
  status: string;
}

export interface PowerSearchDataGridLabels {
  gridLabel: string;
  nameHeader: string;
  cityHeader: string;
  totalHeader: string;
  loadingText: string;
  refreshingText: string;
  loadingMoreText: string;
  emptyText: string;
  retryLabel: string;
  loadMoreLabel: string;
  errorText: string;
}

export interface PowerSearchDataGridIslandProps {
  mode: "local" | "remote";
  locale: Locale;
  fields: readonly PowerSearchField[];
  strings: PowerSearchStrings;
  rows: readonly PowerSearchDataGridRow[];
  labels: PowerSearchDataGridLabels;
  defaultQuery?: FilterQuery | undefined;
}

function powerSearchExecutionFields(
  fields: readonly PowerSearchField[],
): readonly QueryExecutionField<PowerSearchDataGridRow>[] {
  const read = (row: PowerSearchDataGridRow, fieldId: string): unknown => {
    if (fieldId === "status") return row.status;
    if (fieldId === "name") return row.name;
    if (fieldId === "city") return row.city;
    if (fieldId === "total") return row.total;
    throw new RangeError(`PowerSearch DataGrid example has no row field "${fieldId}".`);
  };
  const test = (fieldId: string, operatorId: string, value: unknown, values: readonly string[]) => {
    if (operatorId === "empty") return value === null || value === undefined || value === "";
    if (operatorId === "is") return values.some((candidate) => String(value) === candidate);
    if (operatorId === "is-not") return values.every((candidate) => String(value) !== candidate);
    if (operatorId === "contains") {
      return values.some((candidate) =>
        String(value).toLocaleLowerCase().includes(candidate.toLocaleLowerCase()),
      );
    }
    if (fieldId === "total" && operatorId === "gte") {
      return values.length > 0 && Number(value) >= Number(values[0]);
    }
    if (fieldId === "total" && operatorId === "lte") {
      return values.length > 0 && Number(value) <= Number(values[0]);
    }
    throw new RangeError(
      `PowerSearch DataGrid example has no "${operatorId}" adapter for "${fieldId}".`,
    );
  };
  return fields.map((field) => ({
    id: field.id,
    read: (row) => read(row, field.id),
    operators: field.operators.map((operator) => ({
      id: operator.id,
      test: (value, values) => test(field.id, operator.id, value, values),
    })),
  }));
}

interface PowerSearchResultsProps {
  locale: Locale;
  labels: PowerSearchDataGridLabels;
  table: PowerSearchTableInstance;
  asyncState?: DataGridAsyncState | undefined;
}

interface PowerSearchTableRow extends LumoTableRow {
  original: PowerSearchDataGridRow;
}

interface PowerSearchTableInstance extends LumoTableInstance, DataGridTableInstance {
  getRowModel: () => { rows: readonly PowerSearchTableRow[] };
}

function PowerSearchResults({ locale, labels, table, asyncState }: PowerSearchResultsProps) {
  return (
    <DataGrid locale={locale} table={table} asyncState={asyncState}>
      <Table label={labels.gridLabel} locale={locale} table={table}>
        <TableHeader>
          <Column id="name" isRowHeader>{labels.nameHeader}</Column>
          <Column id="city">{labels.cityHeader}</Column>
          <Column id="total">{labels.totalHeader}</Column>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row}>
              <Cell isRowHeader>{row.original.name}</Cell>
              <Cell>{row.original.city}</Cell>
              <Cell>{formatNumber(row.original.total, locale)}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </DataGrid>
  );
}

function LocalPowerSearchDataGrid({
  locale,
  fields,
  strings,
  rows,
  labels,
  defaultQuery = [],
}: Omit<PowerSearchDataGridIslandProps, "mode">) {
  const [query, setQuery] = useState<FilterQuery>(defaultQuery);
  const table = useLumoQueryTable<PowerSearchDataGridRow>({
    locale,
    data: rows,
    query,
    queryFields: powerSearchExecutionFields(fields),
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "city", accessorKey: "city" },
      { id: "total", accessorKey: "total" },
    ],
    getRowId: (row) => row.id,
  });
  return (
    <div className="grid gap-4">
      <PowerSearch
        fields={fields}
        strings={strings}
        value={query}
        onValueChange={setQuery}
        resultCount={formatNumber(table.getRowCount(), locale)}
        name="query"
      />
      <PowerSearchResults locale={locale} labels={labels} table={table} />
    </div>
  );
}

function RemotePowerSearchDataGrid({
  locale,
  fields,
  strings,
  rows,
  labels,
  defaultQuery = [],
}: Omit<PowerSearchDataGridIslandProps, "mode">) {
  const [query, setQuery] = useState<FilterQuery>(defaultQuery);
  const queryFields = powerSearchExecutionFields(fields);
  const queryBytes = serializeQuery(query);
  const grid = useAsyncLumoTable<PowerSearchDataGridRow, FilterQuery>({
    collection: {
      query,
      queryKey: queryBytes,
      getKey: (row) => row.id,
      load: ({ query: remoteQuery, signal }) =>
        new Promise<AsyncCollectionPage<PowerSearchDataGridRow, string>>((resolve, reject) => {
          // The serialize/parse roundtrip is the example's wire boundary. A real
          // product replaces this timer with fetch while keeping the request bytes.
          const bytes = serializeQuery(remoteQuery);
          const timer = globalThis.setTimeout(() => {
            const parsed = parseQuery(bytes);
            if (!parsed.ok) {
              reject(new TypeError("The remote query payload is invalid."));
              return;
            }
            const items = executeQuery(rows, parsed.value, queryFields);
            resolve({ items, totalCount: items.length });
          }, 220);
          signal.addEventListener(
            "abort",
            () => {
              globalThis.clearTimeout(timer);
              reject(signal.reason);
            },
            { once: true },
          );
        }),
    },
    table: {
      locale,
      columns: [
        { id: "name", accessorKey: "name" },
        { id: "city", accessorKey: "city" },
        { id: "total", accessorKey: "total" },
      ],
      getRowId: (row) => row.id,
    },
    messages: {
      loading: labels.loadingText,
      refreshing: labels.refreshingText,
      loadingMore: labels.loadingMoreText,
      empty: labels.emptyText,
      retry: labels.retryLabel,
      loadMore: labels.loadMoreLabel,
      error: () => labels.errorText,
    },
  });
  return (
    <div className="grid gap-4">
      <PowerSearch
        fields={fields}
        strings={strings}
        value={query}
        onValueChange={setQuery}
        resultCount={
          grid.collection.totalCount === undefined
            ? undefined
            : formatNumber(grid.collection.totalCount, locale)
        }
        name="query"
      />
      <PowerSearchResults
        locale={locale}
        labels={labels}
        table={grid.table}
        asyncState={grid.asyncState}
      />
    </div>
  );
}

/** Local execution or an abortable serialized-query adapter, chosen explicitly. */
export function PowerSearchDataGridIsland(props: PowerSearchDataGridIslandProps) {
  return props.mode === "local" ? (
    <LocalPowerSearchDataGrid {...props} />
  ) : (
    <RemotePowerSearchDataGrid {...props} />
  );
}

/** Paged rows through the shared transport-independent collection controller. */
export function DataGridAsyncIsland({
  locale,
  label,
  nameHeader,
  pages,
  loadingText,
  refreshingText,
  loadingMoreText,
  emptyText,
  retryLabel,
  loadMoreLabel,
  errorText,
}: DataGridAsyncIslandProps) {
  const grid = useAsyncLumoTable({
    collection: {
      query: { scope: "recent" },
      queryKey: "recent-orders",
      getKey: (row) => row.id,
      load: ({ cursor, signal }: AsyncCollectionRequest<{ scope: string }, string>) =>
        new Promise<AsyncCollectionPage<DataGridIslandRow, string>>((resolve, reject) => {
          const index = cursor === undefined ? 0 : Number(cursor);
          const timer = globalThis.setTimeout(() => {
            const items = pages[index] ?? [];
            const nextIndex = index + 1;
            resolve({
              items,
              ...(nextIndex < pages.length ? { nextCursor: String(nextIndex) } : {}),
              totalCount: pages.reduce((total, page) => total + page.length, 0),
            });
          }, 350);
          signal.addEventListener(
            "abort",
            () => {
              globalThis.clearTimeout(timer);
              reject(signal.reason);
            },
            { once: true },
          );
        }),
    },
    table: {
      locale,
      columns: [{ id: "name", accessorKey: "name" }],
      getRowId: (row) => row.id,
    },
    messages: {
      loading: loadingText,
      refreshing: refreshingText,
      loadingMore: loadingMoreText,
      empty: emptyText,
      retry: retryLabel,
      loadMore: loadMoreLabel,
      error: () => errorText,
    },
  });

  return (
    <DataGrid locale={locale} table={grid.table} asyncState={grid.asyncState}>
      <Table label={label} locale={locale} table={grid.table} className="max-w-xl">
        <TableHeader>
          <Column id="name" isRowHeader>
            {nameHeader}
          </Column>
        </TableHeader>
        <TableBody>
          {grid.table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row}>
              <Cell isRowHeader>{row.original.name}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </DataGrid>
  );
}

export interface DataGridIslandProps {
  locale: Locale;
  rows: readonly DataGridIslandRow[];
  /** Announced name of the grid itself. */
  label: string;
  /** Column names, for both the headers and the visibility menu. */
  columns: readonly DataGridColumnLabel[];
  searchLabel: string;
  searchClearLabel: string;
  searchPlaceholder: string;
  columnsLabel: string;
  emptyText: string;
  sortAscendingLabel: string;
  sortDescendingLabel: string;
  pagerLabel: string;
  previousLabel: string;
  nextLabel: string;
  /** The noun in «صفحهٔ ۳» — the closure is built here, the word is not. */
  pageWord: string;
  /** The joining word in «۱–۵ از ۱۲». */
  ofWord: string;
  pageSizeLabel: string;
  /** Rows per page. Omit for no size control. */
  pageSizes?: readonly number[];
  /** Starting rows per page. */
  pageSize?: number;
}

export interface DataGridTreeIslandRow {
  id: string;
  name: string;
  total: number;
  expandLabel: string;
  collapseLabel: string;
  children?: readonly DataGridTreeIslandRow[] | undefined;
}

export interface DataGridTreeIslandProps {
  locale: Locale;
  label: string;
  nameHeader: string;
  totalHeader: string;
  rows: readonly DataGridTreeIslandRow[];
}

/** Hierarchical rows through the same table state and keyboard seam. */
export function DataGridTreeIsland({
  locale,
  label,
  nameHeader,
  totalHeader,
  rows,
}: DataGridTreeIslandProps) {
  // TanStack treats a new data reference as a new row structure and resets
  // expanded state, so keep the server-provided snapshot stable.
  const [data] = useState(() => [...rows]);
  const table = useLumoTable({
    locale,
    data,
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "total", accessorKey: "total" },
    ],
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.children === undefined ? undefined : [...row.children]),
  });

  return (
    <DataGrid locale={locale} table={table}>
      <Table label={label} locale={locale} table={table} hierarchical className="max-w-xl">
        <TableHeader>
          <Column id="name" isRowHeader>
            {nameHeader}
          </Column>
          <Column id="total">{totalHeader}</Column>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row}>
              <TableTreeCell
                row={row}
                expandLabel={row.original.expandLabel}
                collapseLabel={row.original.collapseLabel}
              >
                {row.original.name}
              </TableTreeCell>
              <Cell>{formatNumber(row.original.total, locale)}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </DataGrid>
  );
}

/**
 * A working data grid: type in the search box, hide a column, change the page.
 * Filtering returns to page one, the LAST visible column's toggle is disabled,
 * and every footer figure is in the reader's own numerals.
 */
export function DataGridIsland({
  locale,
  rows,
  label,
  columns,
  searchLabel,
  searchClearLabel,
  searchPlaceholder,
  columnsLabel,
  emptyText,
  sortAscendingLabel,
  sortDescendingLabel,
  pagerLabel,
  previousLabel,
  nextLabel,
  pageWord,
  ofWord,
  pageSizeLabel,
  pageSizes,
  pageSize = 5,
}: DataGridIslandProps) {
  const [data] = useState(() => [...rows]);
  const table = useLumoTable({
    locale,
    data,
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "city", accessorKey: "city" },
      { id: "total", accessorKey: "total" },
    ],
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const sortStrings = { sortAscendingLabel, sortDescendingLabel } as const;
  const nameOf = (id: string) => columns.find((c) => c.id === id)?.label ?? id;

  return (
    <DataGrid locale={locale} table={table}>
      <DataGridToolbar>
        <DataGridSearch
          label={searchLabel}
          clearLabel={searchClearLabel}
          placeholder={searchPlaceholder}
        />
        <DataGridColumnsMenu label={columnsLabel} columns={columns} />
      </DataGridToolbar>

      <Table label={label} locale={locale} table={table}>
        <TableHeader>
          <Column id="name" isRowHeader allowsSorting {...sortStrings}>
            {nameOf("name")}
          </Column>
          <Column id="city" allowsSorting {...sortStrings}>
            {nameOf("city")}
          </Column>
          <Column id="total" allowsSorting {...sortStrings}>
            {nameOf("total")}
          </Column>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row}>
              <Cell isRowHeader>{String(row.getValue("name"))}</Cell>
              <Cell>{String(row.getValue("city"))}</Cell>
              {/* Through `formatNumber` — a bare {total} is a Latin digit. */}
              <Cell>{formatNumber(Number(row.getValue("total")), locale)}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>

      <DataGridEmpty>{emptyText}</DataGridEmpty>

      <DataGridPagination
        label={pagerLabel}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        pageLabel={(n: string) => `${pageWord} ${n}`}
        rangeLabel={(from: string, to: string, total: string) =>
          `${from}–${to} ${ofWord} ${total}`
        }
        {...(
          /*
           * The two travel TOGETHER: `DataGridPaginationProps` is a union, and a
           * spread that splits them happens to type-check, so the pairing is
           * written out here.
           */
          pageSizes === undefined ? {} : { pageSizes, pageSizeLabel }
        )}
      />
    </DataGrid>
  );
}

/* autocomplete · rating · tags */

/*
 * Autocomplete's list children are a render function (a static child list is
 * silently never filtered); Rating requires `valueLabel`/`starLabel`; TagGroup's
 * removable form and FileUpload's list require `onRemove` and a `removeLabel`
 * closure. Every word still arrives as a prop, in both locales.
 */
import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  reorderUploadItems,
  TagGroup,
  TagItem,
  TagList,
  type FileUploadLifecycle,
} from "@lumo-ui/ui";

/** One filterable row. Plain data, so it crosses the boundary. */
export interface AutocompleteRow {
  value: string;
  label: string;
}

export interface AutocompleteExampleIslandProps {
  /** Announced name of the query field. Also shown above it. */
  inputLabel: string;
  inputPlaceholder?: string | undefined;
  /** Announced name of the results list — Base UI names it nothing. */
  listLabel: string;
  items: readonly AutocompleteRow[];
  /** Which collator comparison the built-in filter uses. */
  match?: "contains" | "startsWith" | "endsWith" | undefined;
  /**
   * Replace the built-in filter with a subsequence match: a consumer-supplied
   * filter receives the RAW text and the RAW query, unfolded.
   */
  subsequence?: boolean | undefined;
  /** Rows that render but cannot be chosen. Still filtered like any other. */
  disabledValues?: readonly string[] | undefined;
  /** Seeds the query so the list arrives already narrowed. */
  defaultInputValue?: string | undefined;
}

/** A working autocomplete: an input and an always-visible list, no popup. */
export function AutocompleteExampleIsland({
  inputLabel,
  inputPlaceholder,
  listLabel,
  items,
  match,
  subsequence,
  disabledValues,
  defaultInputValue,
}: AutocompleteExampleIslandProps) {
  // A subsequence match, handed the raw strings deliberately — see the prop's doc.
  const fuzzy = (textValue: string, inputValue: string) => {
    let at = 0;
    for (const char of inputValue) {
      at = textValue.indexOf(char, at) + 1;
      if (at === 0) return false;
    }
    return true;
  };

  return (
    <Autocomplete
      items={items}
      {...(match === undefined ? {} : { match })}
      {...(subsequence === true ? { filter: fuzzy } : {})}
      {...(defaultInputValue === undefined ? {} : { defaultInputValue })}
    >
      <div className="flex w-full max-w-xs flex-col gap-2">
        <AutocompleteInput
          label={inputLabel}
          showLabel
          {...(inputPlaceholder === undefined ? {} : { placeholder: inputPlaceholder })}
        />
        <AutocompleteListBox
          label={listLabel}
          className="max-h-56 rounded-md border border-border bg-surface"
        >
          {(item: AutocompleteRow) => (
            <AutocompleteItem
              key={item.value}
              id={item.value}
              {...(disabledValues?.includes(item.value) === true ? { isDisabled: true } : {})}
            >
              {item.label}
            </AutocompleteItem>
          )}
        </AutocompleteListBox>
      </div>
    </Autocomplete>
  );
}

export interface RatingSummaryIslandProps {
  locale: Locale;
  /** The score. Fractional values clip the fill from the reading edge. */
  value: number;
  maxValue?: number | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  /** The joining word in «۴٫۵ از ۵». Both numbers arrive already formatted. */
  ofWord: string;
}

/** The read-only form: a `role="img"` with one authored name and no tab stop. */
export function RatingSummaryIsland({
  locale,
  value,
  maxValue,
  size,
  ofWord,
}: RatingSummaryIslandProps) {
  return (
    <Rating
      isReadOnly
      value={value}
      locale={locale}
      {...(maxValue === undefined ? {} : { maxValue })}
      {...(size === undefined ? {} : { size })}
      valueLabel={(v, max) => `${v} ${ofWord} ${max}`}
    />
  );
}

export interface RatingInputIslandProps {
  locale: Locale;
  /** Announced name of the `role="radiogroup"`. */
  label: string;
  /** The noun one star is counted in: «ستاره» → «۳ ستاره». */
  starWord: string;
  defaultValue?: number | undefined;
  maxValue?: number | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  isDisabled?: boolean | undefined;
}

/** The interactive form: five stars with one checked IS a radio group. */
export function RatingInputIsland({
  locale,
  label,
  starWord,
  defaultValue,
  maxValue,
  size,
  isDisabled,
}: RatingInputIslandProps) {
  return (
    <Rating
      locale={locale}
      label={label}
      starLabel={(v) => `${v} ${starWord}`}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(maxValue === undefined ? {} : { maxValue })}
      {...(size === undefined ? {} : { size })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
    />
  );
}

/** One chip. Plain data, so it crosses the boundary. */
export interface TagRow {
  id: string;
  text: string;
}

export interface TagGroupIslandProps {
  /** Announced name of the `role="toolbar"`. */
  label: string;
  tags: readonly TagRow[];
  size?: "sm" | "md" | undefined;
  /**
   * The remove control's name is assembled from these two around the tag's own
   * text — «حذف تهران» with a prefix, «تهران را بردارید» with a suffix.
   */
  removePrefix?: string | undefined;
  removeSuffix?: string | undefined;
}

/**
 * A working removable tag row: each remove control names the tag it drops,
 * so eight filters are eight distinct announcements.
 */
export function TagGroupIsland({
  label,
  tags,
  size,
  removePrefix,
  removeSuffix,
}: TagGroupIslandProps) {
  const [remaining, setRemaining] = useState(tags);
  return (
    <TagGroup
      label={label}
      removeLabel={(tag) => `${removePrefix ?? ""}${tag}${removeSuffix ?? ""}`}
      onRemove={(keys) => {
        const dropped = new Set([...keys].map(String));
        setRemaining((current) => current.filter((tag) => !dropped.has(tag.id)));
      }}
    >
      <TagList>
        {remaining.map((tag) => (
          <TagItem key={tag.id} id={tag.id} textValue={tag.text} {...(size === undefined ? {} : { size })}>
            {tag.text}
          </TagItem>
        ))}
      </TagList>
    </TagGroup>
  );
}

/** One row of the attachment list. A real `File` cannot be built on a server. */
export interface UploadedFile {
  name: string;
  /** Size in BYTES. A number — the component formats it, nothing interpolates it. */
  size: number;
  lifecycle?:
    | {
        status: "uploading";
        statusText: string;
        progress: number;
        progressText: string;
      }
    | {
        status: "queued" | "success" | "error";
        statusText: string;
        actionLabel?: string | undefined;
        actionResultText?: string | undefined;
      }
    | undefined;
}

export interface FileUploadIslandProps {
  locale: Locale;
  /** Announced name of the `role="group"` drop area. */
  label: string;
  /** Visible text on the picker button. */
  triggerLabel: string;
  /** The hint under the button — a size limit, an accepted-formats line. */
  hint?: string | undefined;
  /** The verb of the remove phrase: «حذف» → «حذف گزارش.pdf». */
  removeWord: string;
  acceptedFileTypes?: readonly string[] | undefined;
  allowsMultiple?: boolean | undefined;
  capture?: "user" | "environment" | undefined;
  allowsDirectories?: boolean | undefined;
  moveEarlierWord?: string | undefined;
  moveLaterWord?: string | undefined;
  maxFileSize?: number | undefined;
  maxFiles?: number | undefined;
  isDisabled?: boolean | undefined;
  /** Rows the list starts with, so a size boundary can be shown without a picker. */
  initialFiles?: readonly UploadedFile[] | undefined;
}

/**
 * A working uploader: drop files on the area, pick them with the button, or
 * paste them while something inside is focused.
 */
export function FileUploadIsland({
  locale,
  label,
  triggerLabel,
  hint,
  removeWord,
  acceptedFileTypes,
  allowsMultiple,
  capture,
  allowsDirectories,
  moveEarlierWord,
  moveLaterWord,
  maxFileSize,
  maxFiles,
  isDisabled,
  initialFiles,
}: FileUploadIslandProps) {
  const [files, setFiles] = useState<readonly UploadedFile[]>(() => initialFiles ?? []);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <FileUpload
        label={label}
        triggerLabel={triggerLabel}
        {...(acceptedFileTypes === undefined ? {} : { acceptedFileTypes })}
        {...(allowsMultiple === undefined ? {} : { allowsMultiple })}
        {...(capture === undefined ? {} : { capture })}
        {...(allowsDirectories === undefined ? {} : { allowsDirectories })}
        {...(maxFileSize === undefined ? {} : { maxFileSize })}
        {...(maxFiles === undefined ? {} : { maxFiles })}
        currentFileCount={files.length}
        {...(isDisabled === undefined ? {} : { isDisabled })}
        onSelectFiles={(chosen) => {
          const rows = chosen.map((file) => ({ name: file.name, size: file.size }));
          setFiles((current) => (allowsMultiple === true ? [...current, ...rows] : rows));
        }}
      >
        {hint === undefined ? null : <p className="text-xs text-fg-muted">{hint}</p>}
      </FileUpload>
      {files.length === 0 ? null : (
        <FileUploadList>
          {files.map((file, index) => {
            const lifecycle: FileUploadLifecycle | undefined =
              file.lifecycle === undefined
                ? undefined
                : file.lifecycle.status === "uploading"
                  ? file.lifecycle
                  : {
                      status: file.lifecycle.status,
                      statusText: file.lifecycle.statusText,
                      ...(file.lifecycle.actionLabel === undefined
                        ? {}
                        : {
                            action: {
                              label: file.lifecycle.actionLabel,
                              onPress: () => {
                                setFiles((current) =>
                                  current.map((row) =>
                                    row.name === file.name
                                      ? {
                                          ...row,
                                          lifecycle: {
                                            status: "success",
                                            statusText:
                                              file.lifecycle?.status === "uploading"
                                                ? file.lifecycle.statusText
                                                : (file.lifecycle?.actionResultText ?? file.lifecycle?.statusText ?? ""),
                                          },
                                        }
                                      : row,
                                  ),
                                );
                              },
                            },
                          }),
                    };
            return (
              <FileUploadItem
                key={file.name}
                name={file.name}
                size={file.size}
                locale={locale}
                {...(lifecycle === undefined ? {} : { lifecycle })}
                {...(moveEarlierWord === undefined || moveLaterWord === undefined
                  ? {}
                  : {
                      order: {
                        earlierLabel: `${moveEarlierWord} ${file.name}`,
                        laterLabel: `${moveLaterWord} ${file.name}`,
                        isEarlierDisabled: index === 0,
                        isLaterDisabled: index === files.length - 1,
                        onEarlier: () =>
                          setFiles((current) => {
                            const keyed = current.map((row) => ({ ...row, id: row.name }));
                            return reorderUploadItems(keyed, file.name, keyed[index - 1]?.id ?? null).map(
                              ({ id: _id, ...row }) => row,
                            );
                          }),
                        onLater: () =>
                          setFiles((current) => {
                            const keyed = current.map((row) => ({ ...row, id: row.name }));
                            return reorderUploadItems(keyed, file.name, keyed[index + 2]?.id ?? null).map(
                              ({ id: _id, ...row }) => row,
                            );
                          }),
                      },
                    })}
                removeLabel={(fileName) => `${removeWord} ${fileName}`}
                onRemove={() => {
                  setFiles((current) => current.filter((row) => row.name !== file.name));
                }}
              />
            );
          })}
        </FileUploadList>
      )}
    </div>
  );
}

/* date-input · pagination · toast · virtual-list */

/*
 * DateInput takes a STATE OBJECT from a hook; VirtualList's `children` is a
 * function of the row index (a static child list is never virtualised);
 * Pagination requires `onPageChange` and `pageLabel`; ToastRegion's queue is a
 * live object. Every word still arrives as a prop, in both locales.
 */
import { useId } from "react";
import {
  DateInput,
  ListBox,
  ListBoxItem,
  VirtualList,
  useDateFieldState,
  useTimeFieldState,
  type LumoToastQueue,
  type TimeFields,
} from "@lumo-ui/ui";

/* date-input */

export interface DateInputIslandProps {
  locale: Locale;
  /**
   * The group's visible name. Rendered as a real element here and reaches the
   * component as an IDREF, the only shape `DateInput` accepts (`labelId`).
   */
  label: string;
  /** `"time"` builds the state with `useTimeFieldState` instead. */
  kind?: "date" | "time" | undefined;
  granularity?: "hour" | "minute" | "second" | undefined;
  hourCycle?: 12 | 24 | undefined;
  /** Three plain numbers, so a starting time crosses the boundary intact. */
  defaultTime?: TimeFields | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  isReadOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
  bare?: boolean | undefined;
}

/**
 * A working segmented input. BOTH hooks are called on every render and one
 * result is chosen — a hook behind a branch is a rules-of-hooks violation.
 */
export function DateInputIsland({
  locale,
  label,
  kind,
  granularity,
  hourCycle,
  defaultTime,
  size,
  isReadOnly,
  isDisabled,
  bare,
}: DateInputIslandProps) {
  const labelId = useId();
  const dateState = useDateFieldState({ locale });
  const timeState = useTimeFieldState({
    locale,
    ...(granularity === undefined ? {} : { granularity }),
    ...(hourCycle === undefined ? {} : { hourCycle }),
    ...(defaultTime === undefined ? {} : { defaultValue: defaultTime }),
  });
  const state = kind === "time" ? timeState : dateState;
  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium text-fg">
        {label}
      </span>
      <DateInput
        state={state}
        locale={locale}
        labelId={labelId}
        {...(size === undefined ? {} : { size })}
        {...(isReadOnly === undefined ? {} : { isReadOnly })}
        {...(isDisabled === undefined ? {} : { isDisabled })}
        {...(bare === undefined ? {} : { bare })}
      />
    </div>
  );
}

/* pagination */

export interface PaginationExampleIslandProps {
  locale: Locale;
  count: number;
  /** Where the pager starts. A constant, so the prerendered bytes are stable. */
  defaultPage?: number | undefined;
  siblingCount?: number | undefined;
  size?: "sm" | "md" | undefined;
  /** Announced name of the `<nav>` landmark. */
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** The noun a page is called by: «صفحه» → «صفحه ۳». */
  pageWord: string;
}

/** A working pager. The window arithmetic is `paginationRange`, not this file. */
export function PaginationExampleIsland({
  locale,
  count,
  defaultPage,
  siblingCount,
  size,
  label,
  previousLabel,
  nextLabel,
  pageWord,
}: PaginationExampleIslandProps) {
  const [page, setPage] = useState(defaultPage ?? 1);
  return (
    <Pagination
      locale={locale}
      page={page}
      count={count}
      onPageChange={setPage}
      label={label}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      pageLabel={(formattedPage) => `${pageWord} ${formattedPage}`}
      {...(siblingCount === undefined ? {} : { siblingCount })}
      {...(size === undefined ? {} : { size })}
    />
  );
}

/* toast */

/**
 * The queues, at MODULE SCOPE, keyed so each example owns one: every mounted
 * viewport subscribes to the manager it is given, so a shared queue would show
 * one `add` four times.
 */
const exampleQueues = new Map<string, LumoToastQueue>();

function queueFor(key: string): LumoToastQueue {
  let queue = exampleQueues.get(key);
  if (queue === undefined) {
    queue = createToastQueue({ maxVisibleToasts: 3 });
    exampleQueues.set(key, queue);
  }
  return queue;
}

/** One button and the toast it raises. Plain data, so it crosses the boundary. */
export interface ToastButtonSpec {
  key: string;
  /** Visible text on the button. */
  trigger: string;
  title: string;
  description?: string | undefined;
  tone?: "neutral" | "positive" | "critical" | "caution" | undefined;
  /** Milliseconds. Omitted means never auto-dismiss, which is Lumo's default. */
  timeout?: number | undefined;
}

/** NOT a component, and not a hook — an ordinary function that raises a toast. */
function raiseToast(queueKey: string, spec: ToastButtonSpec): void {
  queueFor(queueKey).add(
    {
      title: spec.title,
      ...(spec.description === undefined ? {} : { description: spec.description }),
      ...(spec.tone === undefined ? {} : { tone: spec.tone }),
    },
    ...(spec.timeout === undefined ? [] : [{ timeout: spec.timeout }]),
  );
}

export interface ToastExampleIslandProps {
  locale: Locale;
  /** Distinguishes this example's queue from its neighbours' — see `queueFor`. */
  queueKey: string;
  /** Announced name of the notification landmark. */
  regionLabel: string;
  /** Announced name of every toast's ✕. */
  closeLabel: string;
  placement?: "bottom-end" | "bottom-start" | "top-end" | "top-start" | undefined;
  buttons: readonly ToastButtonSpec[];
}

/**
 * The buttons, and the region they fill. The region renders an empty landmark
 * until something is queued, so it contributes no strings to grade.
 */
export function ToastExampleIsland({
  locale,
  queueKey,
  regionLabel,
  closeLabel,
  placement,
  buttons,
}: ToastExampleIslandProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {buttons.map((spec) => (
        <Button
          key={spec.key}
          variant="outline"
          onPress={() => {
            raiseToast(queueKey, spec);
          }}
        >
          {spec.trigger}
        </Button>
      ))}
      <ToastRegion
        queue={queueFor(queueKey)}
        locale={locale}
        label={regionLabel}
        closeLabel={closeLabel}
        {...(placement === undefined ? {} : { placement })}
      />
    </div>
  );
}

/* virtual-list */

export interface VirtualListIslandProps {
  locale: Locale;
  /** Announced name of the scroller, which is the list's single tab stop. */
  label: string;
  /** How many rows EXIST. Reaches every row as a raw `aria-setsize` integer. */
  count: number;
  /** A row's main-axis size in pixels before it is measured. */
  rowSize: number;
  /** Makes the estimate a function of the index instead of a constant. */
  varyingSizes?: boolean | undefined;
  /** The viewport size the SERVER render lays out against. */
  initialSize: number;
  orientation?: "vertical" | "horizontal" | undefined;
  gap?: number | undefined;
  /** The noun a row is called by: «ردیف» → «ردیف ۱٬۰۰۰». */
  rowWord: string;
  className?: string | undefined;
  itemClassName?: string | undefined;
  /** When present, reaching the end grows the remote corpus up to this count. */
  loadToCount?: number | undefined;
  loadedWord?: string | undefined;
}

/**
 * A working virtualised list. `aria-setsize`/`aria-posinset` come from the
 * component on every row, from `count` and the row's TRUE index.
 */
export function VirtualListIsland({
  locale,
  label,
  count,
  rowSize,
  varyingSizes,
  initialSize,
  orientation,
  gap,
  rowWord,
  className,
  itemClassName,
  loadToCount,
  loadedWord,
}: VirtualListIslandProps) {
  const [loadedCount, setLoadedCount] = useState(count);
  const effectiveCount = loadToCount === undefined ? count : loadedCount;
  return (
    <div className="flex w-full flex-col gap-2">
      <VirtualList
        label={label}
        locale={locale}
        count={effectiveCount}
        estimateSize={
          varyingSizes === true
            ? (index) => (index % 3 === 0 ? rowSize + 28 : rowSize)
            : rowSize
        }
        initialSize={initialSize}
        {...(orientation === undefined ? {} : { orientation })}
        {...(gap === undefined ? {} : { gap })}
        {...(className === undefined ? {} : { className })}
        {...(itemClassName === undefined ? {} : { itemClassName })}
        {...(loadToCount === undefined
          ? {}
          : {
              endReachedThreshold: 2,
              onEndReached: () =>
                setLoadedCount((current) => Math.min(loadToCount, current + 20)),
            })}
      >
        {(index) => (
          <div className="flex h-full items-center gap-2 px-3 text-sm">
            <span className="text-fg-muted">{rowWord}</span>
            {/* Through `formatNumber` — a bare {index} is a Latin digit. */}
            <span className="font-medium text-fg">{formatNumber(index + 1, locale)}</span>
          </div>
        )}
      </VirtualList>
      {loadedWord === undefined ? null : (
        <p role="status" className="text-xs text-fg-muted">
          {loadedWord} {formatNumber(effectiveCount, locale)}
        </p>
      )}
    </div>
  );
}

export interface AsyncListBoxIslandProps {
  label: string;
  errorText: string;
  retryLabel: string;
  emptyText: string;
  items: readonly { id: string; label: string }[];
}

/** Remote state is adjacent to the composite, never a fake selectable option. */
export function AsyncListBoxIsland({
  label,
  errorText,
  retryLabel,
  emptyText,
  items,
}: AsyncListBoxIslandProps) {
  const [failed, setFailed] = useState(true);
  return (
    <ListBox
      label={label}
      selectionMode="single"
      asyncState={
        failed
          ? {
              status: "error",
              text: errorText,
              action: { label: retryLabel, onPress: () => setFailed(false) },
            }
          : { status: "ready", emptyText }
      }
      className="max-w-xs rounded-md border border-border bg-surface"
    >
      {failed
        ? null
        : items.map((item) => (
            <ListBoxItem key={item.id} id={item.id} textValue={item.label}>
              {item.label}
            </ListBoxItem>
          ))}
    </ListBox>
  );
}

/* date-selector */

/*
 * `DateSelector`'s `formatRange` is a required FUNCTION (a range read-out is a
 * bidi trap, so the whole sentence belongs to the author) and the selector
 * OWNS a range, so it needs state. The `presets` list is plain data and passes
 * straight through from the examples module.
 */
import { DateSelector, type CalendarDateRange, type DateSelectorPreset } from "@lumo-ui/ui";

/**
 * NO `locale` PROP: `DateSelector` reads `LumoLocaleContext` instead, and a
 * locale beside it would be a SECOND lever that can disagree with the first.
 */
export interface DateSelectorIslandProps {
  /** Names the whole control; rendered `sr-only` inside the trigger. */
  label: string;
  /** Names the popover dialog. */
  panelLabel: string;
  /** Names the list of preset buttons. */
  presetsLabel: string;
  /** Names the range grid. */
  calendarLabel: string;
  /** The trigger's read-out before anything is chosen. */
  placeholder: string;
  /**
   * The WORD between the two ends — «تا», "to". A word rather than a dash: a
   * neutral between two Arabic-number runs can flip the range under RTL.
   */
  joinWord: string;
  /** Plain data all the way down, so the whole list crosses the boundary. */
  presets: readonly DateSelectorPreset[];
  size?: "sm" | "md" | "lg" | undefined;
  isDisabled?: boolean | undefined;
}

/**
 * A working selector. No `defaultValue`: a read-out computed from `today()`
 * differs between the build machine and the reader's browser and would change
 * on hydration; the placeholder is stable in every byte.
 */
export function DateSelectorIsland({
  label,
  panelLabel,
  presetsLabel,
  calendarLabel,
  placeholder,
  joinWord,
  presets,
  size,
  isDisabled,
}: DateSelectorIslandProps) {
  const [range, setRange] = useState<CalendarDateRange | null>(null);
  return (
    <DateSelector
      label={label}
      panelLabel={panelLabel}
      presetsLabel={presetsLabel}
      calendarLabel={calendarLabel}
      today={calendarDay(DEMO_TODAY_ISO)}
      placeholder={placeholder}
      presets={presets}
      value={range}
      onChange={setRange}
      formatRange={(from, to) => (to === undefined ? from : `${from} ${joinWord} ${to}`)}
      {...(size === undefined ? {} : { size })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
    />
  );
}

/* gantt */

/*
 * A gantt needs an island for functions (`strings.barName`/`movedTo`), state
 * (`onTasksChange`) and a CLASS INSTANCE: `GanttTask.start` is a `CalendarDate`,
 * which cannot cross the boundary and which `apps/website` could not construct
 * anyway. Dates arrive as ISO strings and `ganttDate` turns them into calendar
 * FIELDS with no instant and therefore no time zone.
 */
import { Gantt, ganttDate, type GanttScale, type GanttTask } from "@lumo-ui/ui";

/** One row, as data a server module can hand across the boundary. */
export interface GanttIslandTask {
  id: string;
  parentId?: string;
  /** The task's name, in the page's locale. */
  label: string;
  /** `YYYY-MM-DD`. A DAY, not an instant — see the block above. */
  start: string;
  /** `YYYY-MM-DD`, inclusive. */
  end: string;
  /** `0…1`. Omitted means the task reports no progress at all. */
  progress?: number;
  baselineStart?: string;
  baselineEnd?: string;
}

export interface GanttIslandProps {
  locale: Locale;
  /** Names the whole chart. */
  label: string;
  tasks: readonly GanttIslandTask[];
  dependencies?: readonly { from: string; to: string; type: "finish-to-start" }[];
  /** Names the group of scale buttons. */
  scaleGroupLabel: string;
  /** The five scale names. No English default exists for these. */
  dayWord: string;
  weekWord: string;
  monthWord: string;
  quarterWord: string;
  yearWord: string;
  /** Heads the task-name column. */
  taskColumnHeader: string;
  /** Names the timeline region. */
  timelineLabel: string;
  /** What a bar IS, e.g. «نوار زمان‌بندی». */
  barRoleDescription: string;
  /**
   * The words that JOIN the two ends of a range. Words rather than a dash, for
   * the reason `DateSelectorIsland` states: a neutral between two Arabic-number
   * runs can render the ends swapped in Persian.
   */
  fromWord: string;
  toWord: string;
  /**
   * What separates the clauses — «، » in Persian, ", " in English. A prop
   * because the Arabic comma U+060C is not the ASCII one.
   */
  separator: string;
  /** Closes the progress clause, e.g. «انجام‌شده». */
  doneWord: string;
  pickedUp: string;
  dropped: string;
  cancelled: string;
  expandWord: string;
  collapseWord: string;
  resizeStartWord: string;
  resizeEndWord: string;
  resizedWord: string;
  zoomLabel: string;
  resizeSplit: string;
  defaultScale?: GanttScale;
}

/**
 * A working chart. Space picks a bar up, the arrow keys move it, Escape puts
 * the dates back. On the fa route ArrowLeft moves a bar LATER; the bars'
 * positions mirror because they are `inset-inline-start`, not `left`.
 */
export function GanttIsland({
  locale,
  label,
  tasks,
  dependencies,
  scaleGroupLabel,
  dayWord,
  weekWord,
  monthWord,
  quarterWord,
  yearWord,
  taskColumnHeader,
  timelineLabel,
  barRoleDescription,
  fromWord,
  toWord,
  separator,
  doneWord,
  pickedUp,
  dropped,
  cancelled,
  expandWord,
  collapseWord,
  resizeStartWord,
  resizeEndWord,
  resizedWord,
  zoomLabel,
  resizeSplit,
  defaultScale,
}: GanttIslandProps) {
  const [rows, setRows] = useState<GanttTask[]>(() =>
    tasks.map((task) => ({
      id: task.id,
      ...(task.parentId === undefined ? {} : { parentId: task.parentId }),
      label: task.label,
      start: ganttDate(task.start),
      end: ganttDate(task.end),
      ...(task.progress === undefined ? {} : { progress: task.progress }),
      ...(task.baselineStart === undefined ? {} : { baselineStart: ganttDate(task.baselineStart) }),
      ...(task.baselineEnd === undefined ? {} : { baselineEnd: ganttDate(task.baselineEnd) }),
    })),
  );
  return (
    <Gantt
      locale={locale}
      label={label}
      tasks={rows}
      onTasksChange={setRows}
      {...(defaultScale === undefined ? {} : { defaultScale })}
      strings={{
        scaleGroupLabel,
        scaleNames: {
          day: dayWord,
          week: weekWord,
          month: monthWord,
          quarter: quarterWord,
          year: yearWord,
        },
        taskColumnHeader,
        timelineLabel,
        barRoleDescription,
        barName: (name, from, to, progress) =>
          progress === undefined
            ? `${name}${separator}${fromWord} ${from} ${toWord} ${to}`
            : `${name}${separator}${fromWord} ${from} ${toWord} ${to}${separator}${progress} ${doneWord}`,
        pickedUp,
        dropped,
        cancelled,
        movedTo: (name, from, to) => `${name}${separator}${fromWord} ${from} ${toWord} ${to}`,
        expandTask: (name) => `${expandWord} ${name}`,
        collapseTask: (name) => `${collapseWord} ${name}`,
        resizeStart: (name) => `${resizeStartWord} ${name}`,
        resizeEnd: (name) => `${resizeEndWord} ${name}`,
        resizedTo: (name, from, to) =>
          `${resizedWord} ${name}${separator}${fromWord} ${from} ${toWord} ${to}`,
        zoomLabel,
        resizeSplit,
      }}
      {...(dependencies === undefined ? {} : { dependencies })}
    />
  );
}

/*
 * EVENT CALENDAR. An island for the Gantt's three reasons: four members of
 * `EventCalendarStrings` are functions, the view and focused day are state,
 * and `EventCalendarEvent.start` is a `CalendarDate`/`CalendarDateTime` —
 * `eventCalendarEvent`/`eventCalendarDay` turn ISO strings into calendar FIELDS.
 */
import {
  EventCalendar,
  eventCalendarDay,
  eventCalendarEvent,
  schedulerDraftEvent,
  type EventCalendarEventInput,
  type EventCalendarEvent,
  type EventCalendarView,
} from "@lumo-ui/ui";

export interface EventCalendarIslandProps {
  /** Names the grid. */
  label: string;
  /** The five view buttons, in the caller's own words. */
  monthView: string;
  weekView: string;
  dayView: string;
  daysWord: string;
  agendaView: string;
  /** Names the group the five sit in. */
  viewSwitcherLabel: string;
  previous: string;
  next: string;
  /** The all-day strip's caption. */
  allDay: string;
  /** Shown when the agenda's month holds nothing. */
  empty: string;
  /** Prefixed to an event on every day after its first. */
  continued: string;
  /**
   * The WORD between two ends — «تا», "to". A word rather than a dash: a
   * neutral between two Arabic-number runs can render the range reversed.
   */
  joinWord: string;
  /** What separates a date from what follows it — «، », ", ". */
  separator: string;
  /** The noun after a count in a day's announced name — «رویداد», "events". */
  eventsWord: string;
  /** The word after a count in the overflow chip — «رویداد دیگر», "more". */
  moreWord: string;
  /** The word marking `todayDay` — «امروز», "Today". See `EventCalendarStrings.todayLabel`. */
  todayWord: string;
  eventMovedWord: string;
  eventResizedWord: string;
  eventDeletedWord: string;
  eventCreatedWord: string;
  newEventTitle: string;
  /** Plain data all the way down. `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`. */
  events: readonly EventCalendarEventInput[];
  /** `YYYY-MM-DD`. FIXED — a prerendered grid must not depend on a clock. */
  focusedDay: string;
  /** `YYYY-MM-DD`, marked as today. Also fixed, for the same reason. */
  todayDay?: string;
  defaultView?: EventCalendarView;
  dayCount?: number;
  maxEventsPerDay?: number;
}

/**
 * A working calendar. No `today()` anywhere: the component requires an opening
 * day so the prerendered page and the hydrating browser cannot disagree.
 */
export function EventCalendarIsland({
  label,
  monthView,
  weekView,
  dayView,
  daysWord,
  agendaView,
  viewSwitcherLabel,
  previous,
  next,
  allDay,
  empty,
  continued,
  joinWord,
  separator,
  eventsWord,
  moreWord,
  todayWord,
  eventMovedWord,
  eventResizedWord,
  eventDeletedWord,
  eventCreatedWord,
  newEventTitle,
  events,
  focusedDay,
  todayDay,
  defaultView,
  dayCount,
  maxEventsPerDay,
}: EventCalendarIslandProps) {
  const [scheduled, setScheduled] = useState<readonly EventCalendarEvent[]>(() =>
    events.map(eventCalendarEvent),
  );
  const createdId = useRef(0);
  return (
    <EventCalendar
      label={label}
      defaultFocusedDate={eventCalendarDay(focusedDay)}
      {...(todayDay === undefined ? {} : { todayDate: eventCalendarDay(todayDay) })}
      {...(defaultView === undefined ? {} : { defaultView })}
      {...(dayCount === undefined ? {} : { dayCount })}
      {...(maxEventsPerDay === undefined ? {} : { maxEventsPerDay })}
      events={scheduled}
      onEventCreate={(draft) =>
        setScheduled((current) => [
          ...current,
          schedulerDraftEvent(draft, {
            id: `created-${++createdId.current}`,
            title: newEventTitle,
          }),
        ])
      }
      onEventChange={(changed) =>
        setScheduled((current) => current.map((event) => (event.id === changed.id ? changed : event)))
      }
      onEventDelete={(id) => setScheduled((current) => current.filter((event) => event.id !== id))}
      strings={{
        monthView,
        weekView,
        dayView,
        daysView: (count) => `${count} ${daysWord}`,
        agendaView,
        viewSwitcherLabel,
        previous,
        next,
        allDay,
        empty,
        continued,
        dayLabel: (date, count) => `${date}${separator}${count} ${eventsWord}`,
        todayLabel: (day) => `${todayWord}${separator}${day}`,
        eventLabel: (title, when) => `${title}${separator}${when}`,
        range: (from, to) => `${from} ${joinWord} ${to}`,
        moreEvents: (count) => `${count} ${moreWord}`,
        eventMoved: (name) => `${eventMovedWord}${separator}${name}`,
        eventResized: (name) => `${eventResizedWord}${separator}${name}`,
        eventDeleted: (title) => `${eventDeletedWord}${separator}${title}`,
        eventCreated: (when) => `${eventCreatedWord}${separator}${when}`,
      }}
    />
  );
}

/*
 * ALERT — DISMISSAL. `Alert` itself stays a SERVER component; `alert.tsx`
 * renders the dismiss button only when `onClose` is present, and a function
 * cannot cross the RSC boundary, so the one example with a handler lives here.
 */

export interface AlertDismissIslandProps {
  title: string;
  body: string;
  /** Announced name of the dismiss button. Required by `Alert`, not defaulted here. */
  closeLabel: string;
  /** Shown after the alert has been dismissed, so the demo can be replayed. */
  restoreLabel: string;
}

export function AlertDismissIsland({
  title,
  body,
  closeLabel,
  restoreLabel,
}: AlertDismissIslandProps) {
  const [open, setOpen] = useState(true);

  // Dismissal is the CALLER's to own — `Alert` unmounts nothing and remembers
  // nothing, the same division `Dialog` makes.
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {open ? (
        <Alert
          tone="accent"
          title={title}
          onClose={() => setOpen(false)}
          closeLabel={closeLabel}
        >
          {body}
        </Alert>
      ) : (
        <Button variant="outline" onPress={() => setOpen(true)}>
          {restoreLabel}
        </Button>
      )}
    </div>
  );
}

/* menu choice */

/**
 * The two selectable menu item kinds, both CONTROLLED-ONLY by design, so a
 * demo needs state on this side. Both in ONE island because the pairing is
 * the point: `menuitemradio` inside a named group versus `menuitemcheckbox`,
 * with their gutters lined up to the same inset.
 */
export interface MenuChoiceIslandProps {
  /** Announced name of the menu, e.g. «نمایش». */
  menuLabel: string;
  /** Visible label of the trigger button. */
  triggerText: string;
  /** Visible AND announced name of the radio group, e.g. «ترتیب نمایش». */
  sortLabel: string;
  /** The three sort options, in order. */
  sortOptions: readonly { value: string; text: string }[];
  /** Visible title of the checkbox section, e.g. «ستون‌ها». */
  columnsLabel: string;
  /** The toggleable columns. */
  columns: readonly { value: string; text: string }[];
}

export function MenuChoiceIsland({
  menuLabel,
  triggerText,
  sortLabel,
  sortOptions,
  columnsLabel,
  columns,
}: MenuChoiceIslandProps) {
  const [sort, setSort] = useState(sortOptions[0]?.value ?? "");
  const [hidden, setHidden] = useState<readonly string[]>([]);
  return (
    <MenuTrigger>
      <Button variant="outline">{triggerText}</Button>
      <MenuPopover>
        <Menu aria-label={menuLabel}>
          <MenuRadioGroup label={sortLabel} value={sort} onChange={setSort}>
            {sortOptions.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                {option.text}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuSection title={columnsLabel}>
            {columns.map((column) => (
              <MenuCheckboxItem
                key={column.value}
                isSelected={!hidden.includes(column.value)}
                onChange={(isSelected) =>
                  setHidden((current) =>
                    isSelected
                      ? current.filter((value) => value !== column.value)
                      : [...current, column.value],
                  )
                }
              >
                {column.text}
              </MenuCheckboxItem>
            ))}
          </MenuSection>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

/* calendar: the caption dropdowns */

/*
 * `captionLayout="dropdown"` makes `minValue`/`maxValue` REQUIRED, and a
 * `CalendarDate` is a class instance that cannot cross the RSC boundary
 * («Only plain objects … can be passed to Client Components»). The dates
 * therefore arrive as ISO STRINGS and are constructed here by `calendarDay`.
 */
import { calendarDay, DatePicker, DateRangePicker, RangeCalendar } from "@lumo-ui/ui";

/** Fixed documentation clock: 21 Mordad 1405 / 12 August 2026. */
const DEMO_TODAY_ISO = "2026-08-12";

export interface CalendarIslandProps {
  label: string;
  locale: Locale;
  description?: string | undefined;
  isDisabled?: boolean | undefined;
  captionLayout?: "label" | "dropdown-months" | undefined;
}

export function CalendarIsland({
  label,
  locale,
  description,
  isDisabled,
  captionLayout,
}: CalendarIslandProps) {
  return (
    <Calendar
      label={label}
      locale={locale}
      today={calendarDay(DEMO_TODAY_ISO)}
      {...(description === undefined ? {} : { description })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(captionLayout === undefined ? {} : { captionLayout })}
    />
  );
}

export interface RangeCalendarIslandProps {
  label: string;
  locale: Locale;
  description?: string | undefined;
  isDisabled?: boolean | undefined;
}

export function RangeCalendarIsland({
  label,
  locale,
  description,
  isDisabled,
}: RangeCalendarIslandProps) {
  return (
    <RangeCalendar
      label={label}
      locale={locale}
      today={calendarDay(DEMO_TODAY_ISO)}
      {...(description === undefined ? {} : { description })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
    />
  );
}

export interface DatePickerIslandProps {
  label: string;
  openCalendarLabel: string;
  description?: string | undefined;
  errorMessage?: string | undefined;
  isDisabled?: boolean | undefined;
  size?: "sm" | "md" | "lg" | undefined;
}

export function DatePickerIsland({
  label,
  openCalendarLabel,
  description,
  errorMessage,
  isDisabled,
  size,
}: DatePickerIslandProps) {
  return (
    <DatePicker
      className="w-full max-w-sm"
      label={label}
      openCalendarLabel={openCalendarLabel}
      today={calendarDay(DEMO_TODAY_ISO)}
      {...(description === undefined ? {} : { description })}
      {...(errorMessage === undefined ? {} : { errorMessage })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(size === undefined ? {} : { size })}
    />
  );
}

export interface DateRangePickerIslandProps {
  label: string;
  openCalendarLabel: string;
  startLabel: string;
  endLabel: string;
  description?: string | undefined;
  errorMessage?: string | undefined;
  isDisabled?: boolean | undefined;
}

export function DateRangePickerIsland({
  label,
  openCalendarLabel,
  startLabel,
  endLabel,
  description,
  errorMessage,
  isDisabled,
}: DateRangePickerIslandProps) {
  return (
    <DateRangePicker
      className="w-full max-w-md"
      label={label}
      openCalendarLabel={openCalendarLabel}
      startLabel={startLabel}
      endLabel={endLabel}
      today={calendarDay(DEMO_TODAY_ISO)}
      {...(description === undefined ? {} : { description })}
      {...(errorMessage === undefined ? {} : { errorMessage })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
    />
  );
}

export interface CalendarDropdownIslandProps {
  /** Announced name of the calendar. */
  label: string;
  /** Selects the calendar system, the digits, the week start and the direction. */
  locale: Locale;
  /** Help text under the grid. */
  description: string;
  /**
   * The earliest selectable day, ISO `YYYY-MM-DD`, and the first year in the
   * list. A STRING — see the header for the prerender error a value produces.
   */
  minDay: string;
  /** The latest selectable day, and the last year in the list. */
  maxDay: string;
  /** The month the grid opens on. Stated, so no clock decides it. */
  openOn: string;
}

export function CalendarDropdownIsland({
  label,
  locale,
  description,
  minDay,
  maxDay,
  openOn,
}: CalendarDropdownIslandProps) {
  return (
    <Calendar
      label={label}
      locale={locale}
      today={calendarDay(DEMO_TODAY_ISO)}
      description={description}
      captionLayout="dropdown"
      minValue={calendarDay(minDay)}
      maxValue={calendarDay(maxDay)}
      defaultMonth={calendarDay(openOn)}
    />
  );
}

/**
 * The picker's version, and it takes NO `locale`: `DatePicker` reads it from
 * `LumoProvider`, so `Omit` states that difference.
 */
export interface DatePickerDropdownIslandProps
  extends Omit<CalendarDropdownIslandProps, "locale"> {
  /** Name of the button that opens the calendar. An icon has no name of its own. */
  openCalendarLabel: string;
}

export function DatePickerDropdownIsland({
  label,
  openCalendarLabel,
  description,
  minDay,
  maxDay,
  openOn,
}: DatePickerDropdownIslandProps) {
  return (
    <DatePicker
      className="w-full max-w-sm"
      label={label}
      openCalendarLabel={openCalendarLabel}
      description={description}
      today={calendarDay(DEMO_TODAY_ISO)}
      captionLayout="dropdown"
      minValue={calendarDay(minDay)}
      maxValue={calendarDay(maxDay)}
      /*
       * `placeholderValue`, not `defaultValue`: the field stays EMPTY while the
       * segments and grid start from a month a reader born in ۱۳۶۰ is near.
       */
      placeholderValue={calendarDay(openOn)}
    />
  );
}

/* chart: motion */

import { chartMotion } from "@lumo-ui/ui";

/**
 * ONE demo of everything `@tanstack/charts` 0.9.0 can be made to do in Lumo,
 * one island rather than five because the behaviours COMBINE. Every string is
 * a required prop in ONE `strings` object (the `ChartPanelStrings` shape), and
 * the live region's figure goes through `formatNumber` — the third seam where
 * a Latin digit could enter a chart, after the axis and the tooltip.
 */
export interface ChartMotionStrings {
  /** The plot's announced name — it is `role="img"` and a Tab stop. */
  label: string;
  /** The data table's caption. Distinct from `label`; a reader meets both. */
  dataCaption: string;
  /** Names the category column, e.g. «ماه». */
  categoryLabel: string;
  /** The first series, e.g. «فروش». Legend and tooltip both use it. */
  seriesLabel: string;
  /** The second series, e.g. «هدف». Shown only while it is switched on. */
  targetLabel: string;
  /** Names the control group, e.g. «کنترل‌های نمودار». */
  controlsLabel: string;
  /** Picks the first dataset, e.g. «نیمهٔ نخست». */
  firstRangeLabel: string;
  /** Picks the second dataset, e.g. «نیمهٔ دوم». */
  secondRangeLabel: string;
  /** Adds the second series, e.g. «افزودن سری هدف». */
  addSeriesLabel: string;
  /** Removes it again, e.g. «حذف سری هدف». */
  removeSeriesLabel: string;
  /** Selects the named curve, e.g. «منحنی استاندارد». */
  namedEasingLabel: string;
  /** Selects the authored curve, e.g. «منحنی سفارشی». */
  customEasingLabel: string;
  /** Turns motion off, e.g. «خاموش‌کردن حرکت». */
  motionOffLabel: string;
  /** Turns it back on, e.g. «روشن‌کردن حرکت». */
  motionOnLabel: string;
  /** Prefixes the live region, e.g. «انتخاب‌شده». */
  selectedWord: string;
  /** Stands in when nothing is selected yet, e.g. «هنوز چیزی انتخاب نشده». */
  nothingSelectedWord: string;
}

/** One plotted month: the figure, and the figure it was measured against. */
export type MotionRow = {
  readonly month: string;
  readonly sales: number;
  readonly target: number;
};

export interface ChartMotionIslandProps {
  locale: Locale;
  strings: ChartMotionStrings;
  /** The two datasets the reader switches between. Plain data, so it crosses. */
  firstRange: readonly MotionRow[];
  secondRange: readonly MotionRow[];
}

/**
 * An authored "back" easing curve: it overshoots past 1 and settles, which no
 * named easing can express. Module scope on purpose — a new function identity
 * per render would make the definition a new object per render, and the
 * definition's identity is what tells the renderer whether anything changed.
 */
const chartBackOut = (progress: number): number => {
  const overshoot = 1.70158;
  const t = progress - 1;
  return t * t * ((overshoot + 1) * t + overshoot) + 1;
};

export function ChartMotionIsland({
  locale,
  strings,
  firstRange,
  secondRange,
}: ChartMotionIslandProps) {
  const [isSecondRange, setIsSecondRange] = useState(false);
  const [hasTarget, setHasTarget] = useState(false);
  const [isCustomEasing, setIsCustomEasing] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [selected, setSelected] = useState<MotionRow | undefined>(undefined);

  const rows = [...(isSecondRange ? secondRange : firstRange)];

  const config: ChartConfig = {
    month: { label: strings.categoryLabel },
    sales: { label: strings.seriesLabel, color: "oklch(0.62 0.16 255)" },
    ...(hasTarget ? { target: { label: strings.targetLabel, color: "oklch(0.66 0.15 25)" } } : {}),
  };

  const marks = [
    barY(rows, { id: "sales", x: "month", y: "sales", fill: chartColor("sales") }),
    ...(hasTarget
      ? [barY(rows, { id: "target", x: "month", y: "target", fill: chartColor("target") })]
      : []),
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      {/*
       * `role="group"` with a name: four controls that act on one plot are a unit.
       */}
      <div role="group" aria-label={strings.controlsLabel} className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={isSecondRange ? "outline" : "solid"}
          onPress={() => setIsSecondRange(false)}
        >
          {strings.firstRangeLabel}
        </Button>
        <Button
          size="sm"
          variant={isSecondRange ? "solid" : "outline"}
          onPress={() => setIsSecondRange(true)}
        >
          {strings.secondRangeLabel}
        </Button>
        <Button size="sm" variant="outline" onPress={() => setHasTarget((on) => !on)}>
          {hasTarget ? strings.removeSeriesLabel : strings.addSeriesLabel}
        </Button>
        <Button size="sm" variant="outline" onPress={() => setIsCustomEasing((on) => !on)}>
          {isCustomEasing ? strings.namedEasingLabel : strings.customEasingLabel}
        </Button>
        <Button size="sm" variant="outline" onPress={() => setAnimate((on) => !on)}>
          {animate ? strings.motionOffLabel : strings.motionOnLabel}
        </Button>
      </div>

      <ChartContainer
        config={config}
        locale={locale}
        label={strings.label}
        /*
         * `animate` is the ONE switch: it writes the enter-stylesheet attribute
         * AND strips `svgAnimation`, so the button turns off both halves.
         */
        animate={animate}
        definition={
          defineChart({
            marks,
            x: chartCategoryAxis(locale, {
              scale: () => scaleBand<string>().padding(0.2),
            }) as never,
            y: chartValueAxis(locale, { scale: scaleLinear, grid: true }) as never,
            tooltip: chartTooltip(locale, config),
            // 700ms rather than the 320ms default: this is a DEMONSTRATION of the
            // transition, and the default is tuned to be felt rather than watched.
            svgAnimation: chartMotion({
              duration: 700,
              easing: isCustomEasing ? chartBackOut : "ease-out",
            }),
          }) as never
        }
        data={rows}
        categoryKey="month"
        dataCaption={strings.dataCaption}
        onSelectDatum={(row) => setSelected(row as MotionRow | undefined)}
        className="w-full"
      >
        <ChartLegend hiddenSeries={["month"]} />
      </ChartContainer>

      {/*
       * `role="status"` — polite, and announced on SELECTION rather than on the
       * active datum, which changes on every pixel of pointer movement.
       */}
      <p role="status" className="text-sm text-fg-muted">
        {selected === undefined
          ? strings.nothingSelectedWord
          : `${strings.selectedWord}: ${selected.month} — ${formatNumber(selected.sales, locale)}`}
      </p>
    </div>
  );
}

/* overflow-list · transfer-list */

import { OverflowList, TransferList } from "@lumo-ui/ui";

export interface OverflowListIslandProps {
  locale: Locale;
  items: readonly string[];
  moreWord: string;
  collapseFrom?: "start" | "end" | undefined;
}

/** The render callbacks stay inside the client boundary; the example passes plain copy. */
export function OverflowListIsland({
  locale,
  items,
  moreWord,
  collapseFrom,
}: OverflowListIslandProps) {
  return (
    <OverflowList
      items={items}
      getKey={(item) => item}
      initialVisibleItems={3}
      minVisibleItems={1}
      maxVisibleItems={5}
      {...(collapseFrom === undefined ? {} : { collapseFrom })}
      renderItem={(item) => (
        <Button size="sm" variant="outline">
          {item}
        </Button>
      )}
      renderOverflow={(hidden) => (
        <Button size="sm" variant="outline">
          +{formatNumber(hidden.length, locale)} {moreWord}
        </Button>
      )}
      className="w-full max-w-lg"
    />
  );
}

export interface TransferListIslandProps {
  locale: Locale;
  availableLabel: string;
  selectedLabel: string;
  addSelected: string;
  removeSelected: string;
  moveUp: string;
  moveDown: string;
  movedWord: string;
  destinationWord: string;
  items: readonly { id: string; label: string; isLocked?: boolean | undefined }[];
  defaultValue: readonly string[];
}

/** A working ordered selector. Every announced word arrives from the examples file. */
export function TransferListIsland({
  locale,
  availableLabel,
  selectedLabel,
  addSelected,
  removeSelected,
  moveUp,
  moveDown,
  movedWord,
  destinationWord,
  items,
  defaultValue,
}: TransferListIslandProps) {
  return (
    <TransferList
      items={items.map((item) => ({
        id: item.id,
        textValue: item.label,
        children: item.label,
        ...(item.isLocked === undefined ? {} : { isLocked: item.isLocked }),
      }))}
      defaultValue={defaultValue}
      strings={{
        availableLabel,
        selectedLabel,
        addSelected,
        removeSelected,
        moveUp,
        moveDown,
        moved: (count, destination) =>
          `${count} ${movedWord} ${destinationWord} ${destination}`,
      }}
      className="max-w-3xl"
      data-locale={locale}
    />
  );
}
