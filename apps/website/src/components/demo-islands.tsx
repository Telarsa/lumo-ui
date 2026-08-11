"use client";

import { useState } from "react";
import type { Locale } from "@lumo-ui/core";
import {
  Button,
  ChartContainer,
  ChartLegend,
  Pagination,
  Rating,
  ToastRegion,
  barY,
  chartCategoryAxis,
  chartColor,
  chartTooltip,
  chartValueAxis,
  createToastQueue,
  defineChart,
  scaleBand,
  scaleLinear,
  type ChartConfig,
} from "@lumo-ui/ui";

/**
 * The four demos that cannot be written in `demos.tsx`, and exactly why.
 *
 * `demos.tsx` is a SERVER module — it reads component sources off disk at build
 * time — so every `render` it holds is a server component. Three kinds of prop
 * cannot cross that boundary, and four components require one:
 *
 *  - **A function.** `Rating.valueLabel`/`starLabel` and `Pagination.pageLabel`
 *    are required functions, and deliberately so: Persian word order has to be
 *    authored rather than assembled (see `tag-group.tsx`'s header, which makes
 *    the argument once for the whole library). React refuses to serialise a
 *    function into the RSC payload, so the closure has to be built on this side.
 *  - **A class instance.** `ToastRegion.queue` is a live `ToastQueue` with a
 *    subscription list. Only plain objects cross.
 *  - **A DEFINITION built from functions.** The charts below were on this side
 *    of the boundary because recharts' chart elements call hooks and threw
 *    during the RSC pass. That reason is GONE — `@tanstack/charts` builds a
 *    plain definition object and `chartCategoryAxis`/`chartValueAxis` live in a
 *    directive-free module, so a server component could now build the whole
 *    spec. What keeps them here is smaller and different: `defineChart`'s marks
 *    hold scale FACTORIES and a tooltip `format` closure, and a function still
 *    cannot cross into the RSC payload. So the island stays and its reason is
 *    restated rather than inherited.
 *
 * So the boundary is drawn here instead, and it is drawn narrowly: every prop
 * below is a STRING the caller supplies per locale. There is no copy in this
 * file — `demos.tsx` remains the single place where a user-visible string is
 * written, in both locales, which is the rule the gate enforces.
 *
 * These still render under the static export. A client component is
 * server-rendered during prerender exactly like any other, so `lumo-gate` grades
 * their first byte too — and **the chart is no longer the exception**. TanStack
 * server-renders a real `<svg>` with real Persian ticks (4,717 bytes against
 * recharts' 127 and its zero digits), so the plot on these pages is graded like
 * everything else.
 */

/* ───────────────────────────────────────────────────────────────── rating ── */

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
        // through `formatNumber` before calling this, which is what makes «۴ از ۵»
        // expressible and `4 از 5` unrepresentable.
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

/* ───────────────────────────────────────────────────────────── pagination ── */

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
  // The one piece of state in this file. It is here rather than in `demos.tsx`
  // for the same reason as everything else: `onPageChange` is a required
  // function. The initial value is a constant, so the prerendered bytes are
  // deterministic and the gate grades the same markup every build.
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

/* ────────────────────────────────────────────────────────────────── toast ── */

/**
 * Module scope, exactly as `toast.tsx` prescribes: the queue is a plain class
 * with a subscription list, so anything can raise a toast without being a React
 * component.
 */
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
          // No timeout: a failure is something the reader has to act on, and
          // `toast.tsx` records why a library-chosen duration for that is wrong.
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
       * Renders `null` until a toast is queued, so it contributes nothing to the
       * served bytes — the same reason every overlay demo shows its trigger.
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

/* ────────────────────────────────────────────────────────────────── chart ── */

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
  // `label` is required by `ChartConfig` for the reason chart.variants.ts gives:
  // without it the legend falls back to the dataKey, which is an English
  // identifier on a Persian dashboard.
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
       * The plot IS this object now — TanStack is a keyed scene rather than a
       * component tree, so there is no `<BarChart>` child and no `cloneElement`
       * to get a name onto the `<svg>`. `ariaLabel` is required by the library's
       * own types, which is the first dependency here to enforce Lumo's
       * announced-string rule on Lumo's behalf.
       *
       * The Lumo axis builders, never TanStack's bare axis options: they reverse
       * the scale's RANGE under RTL — so bars, ticks and grid mirror together —
       * and run every tick through `formatNumber`. A bare axis emits `0 600
       * 1200` in Latin digits, and unlike under recharts the gate would now SEE
       * that, because these ticks are in the served bytes.
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

/* ───────────────────────────────────────────────────────────── attachment ── */

/*
 * Appended by the round-3 chat batch. Import declarations are hoisted, so
 * placing these here keeps the append-only contract for this file without
 * touching the shared header. `useState` and `Locale` are already imported at
 * the top; re-importing them would be a duplicate-binding error.
 */
import {
  Attachment,
  AttachmentContent,
  AttachmentMeta,
  AttachmentName,
  AttachmentRemove,
} from "@lumo-ui/ui";

export interface AttachmentIslandProps {
  locale: Locale;
  /**
   * The verb of the remove phrase: «حذف» → «حذف گزارش فروش مرداد». The noun is
   * each file's own name, appended on this side of the boundary — the same
   * word-shape RatingIsland's `ofWord` documents.
   */
  removeWord: string;
  /** Shown once the last attachment is removed, e.g. «همهٔ پیوست‌ها حذف شد.». */
  emptyText: string;
  /** Plain data, so it crosses the boundary: display name, bytes, translated kind. */
  files: readonly { readonly name: string; readonly size: number; readonly kind: string }[];
}

/**
 * The one attachment demo that cannot live in a server module: removal needs
 * `onPress`, and a function cannot cross the server/client boundary. Only
 * strings and plain data arrive here; every user-visible word is still written
 * in the examples module, in both locales.
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

/* ────────────────────────────────────────────────────────────── resizable ── */

/*
 * Appended by the round-3 navigation batch, same append-only contract as the
 * attachment block above: the import is hoisted, `Locale` is already imported
 * at the top.
 */
import { Resizable } from "@lumo-ui/ui";

export interface ResizableIslandProps {
  locale: Locale;
  /** Announced name of the divider, e.g. «تغییر اندازهٔ ستون‌ها». */
  label: string;
  /**
   * The unit noun of the announced size: «درصد» → «۳۰ درصد». The number is
   * formatted by resizable.tsx before the closure built here ever sees it —
   * the same contract as PaginationIsland's `pageWord`.
   */
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
 * REQUIRED function — word order is authored, not assembled (tag-group.tsx
 * makes the argument once for the library) — and a function cannot cross the
 * server/client boundary. Only strings arrive here; every user-visible word is
 * still written in the examples module, in both locales.
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

/* ──────────────────────────────────────────────── chart: line and area ── */

/*
 * Appended by the round-4 misc batch, same append-only contract as the blocks
 * above: import declarations are hoisted, and `Locale`, `ChartConfig`,
 * `ChartContainer`, `ChartLegend`, `chartCategoryAxis`, `chartValueAxis`,
 * `chartTooltip`, `chartColor`, `defineChart` and `scaleLinear` are already
 * imported at the top of this file. Only the genuinely new names are here.
 *
 * ── THE DONUT IS GONE, AND THAT IS AN HONEST ABSENCE ────────────────────────
 *
 * `ChartDonutIsland` used `ChartPie`, `ChartPieCenter` and
 * `ChartValueLabelList`, and `chart.tsx` removed all three rather than stub
 * them: `@tanstack/charts` 0.9.0 has no pie mark at all — a pie is a
 * composition of `polar` + `radialArc`, and a donut is that with an inner
 * radius, so porting it is AUTHORING a chart type rather than translating a
 * component. The island and its example are deleted here for the same reason
 * the components were: a donut that renders an empty box, or a wrapper that
 * silently draws no sectors, is exactly the defect class this site measures
 * itself against, and a docs page is the worst place to keep one. The gap is
 * recorded in `bulk-migration-result.json` as a capability gap with the
 * evidence, not papered over.
 */
import { areaY, lineY, scalePoint } from "@lumo-ui/ui";

/**
 * One plotted row of a two-column series: a category and a figure.
 *
 * A `type` rather than an `interface`, and the difference is load-bearing here:
 * TypeScript gives a type alias an implicit index signature and an interface
 * none, so only this spelling is assignable to `ChartRow` — the
 * `Record<string, …>` that `ChartContainer` requires for the data table.
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
       * `scalePoint`, not `scaleBand`: a line's vertices sit ON the category
       * rather than across a band, and the axis builder still does the whole
       * mirror — it reverses the scale's RANGE, so the curve moves with its
       * categories and there is nothing on the mark itself to remember.
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
      /*
       * `areaY` fills to the baseline and `stroke` draws its edge — two options
       * on one mark, where recharts needed `<Area stroke fill fillOpacity>` and
       * a separate opacity to stop the fill swallowing the line.
       */
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
 * Appended by the round-4 integration, same append-only contract as the blocks
 * above.
 *
 * WHY A CALENDAR NEEDS AN ISLAND AT ALL. `isDateUnavailable` is a FUNCTION, and
 * the examples files are server modules — React refuses to serialise a function
 * into the RSC payload, so the calendar page's prerender died on it with
 * «Functions cannot be passed directly to Client Components». It is the first
 * reason `ChartIsland`'s header lists, applied to a component nobody expected to
 * need one: a calendar looks like pure markup right up until a rule decides
 * which days it closes.
 *
 * The predicate is therefore OWNED here rather than passed in, and every
 * user-visible string still arrives as a prop, in both locales, from the
 * examples file.
 */
import { Calendar } from "@lumo-ui/ui";

/**
 * The Iranian weekend is پنجشنبه and جمعه.
 *
 * Written against the absolute weekday of the underlying instant rather than
 * against a "day of week" index counted from the start of the Persian week —
 * those two disagree, and a rule written against the wrong one closes the wrong
 * two days while looking entirely reasonable.
 *
 * Typed structurally rather than as `DateValue` on purpose: this package depends
 * on `@lumo-ui/ui` and not on `@internationalized/date`, so the date type is not
 * importable here. The one member actually used is declared, which is a smaller
 * surface than the real type and cannot silently accept less.
 */
function isWeekend(date: { toDate: (timeZone: string) => Date }) {
  const weekday = date.toDate("UTC").getUTCDay();
  return weekday === 4 || weekday === 5;
}

export interface CalendarClosedDaysIslandProps {
  /** Announced name of the calendar. */
  label: string;
  /** Name of the previous-month button. */
  previousMonthLabel: string;
  /** Name of the next-month button. */
  nextMonthLabel: string;
  /** Help text under the grid, naming which days are closed. */
  description: string;
  /**
   * Shown when an unavailable day is chosen. Required here for the reason
   * `calendar.tsx` states: a constraint without an authored message hands the
   * reader React Aria's English, Gregorian, Latin-digited sentence.
   */
  errorMessage: string;
}

export function CalendarClosedDaysIsland({
  label,
  previousMonthLabel,
  nextMonthLabel,
  description,
  errorMessage,
}: CalendarClosedDaysIslandProps) {
  return (
    <Calendar
      label={label}
      previousMonthLabel={previousMonthLabel}
      nextMonthLabel={nextMonthLabel}
      description={description}
      isDateUnavailable={isWeekend}
      errorMessage={errorMessage}
    />
  );
}

/* ──────────────────────────────────────────────── table: state examples ── */

/*
 * Appended by the Base UI integration pass, same append-only contract.
 *
 * ── WHY A TABLE NEEDS AN ISLAND NOW, WHEN IT DID NOT BEFORE ─────────────────
 *
 * React Aria's `Table` carried `selectionMode`, `defaultSelectedKeys` and
 * `sortDescriptor` as ELEMENT props, so a selectable, sortable grid was pure
 * markup and lived happily in a server module. Base UI has no table at all;
 * `table.tsx` is markup and keyboard over a TanStack instance, and that
 * instance comes from `useLumoTable` — a HOOK. A hook cannot run in a server
 * component, so the two stateful examples move here beside the chart and the
 * calendar, for the same class of reason and a new instance of it.
 *
 * This is the honest cost of the migration at the docs layer and it is worth
 * stating rather than hiding: the *component* is no worse, but "a sorted table
 * is static markup" stopped being true.
 *
 * Every user-visible string still arrives as a prop, in both locales.
 */
import {
  Cell,
  Column,
  ColumnResizer,
  ResizableTableContainer,
  Row,
  Table,
  TableBody,
  TableHeader,
  TableSelectAllColumn,
  TableSelectionCell,
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
    // The pre-selected row the React Aria example showed with
    // `defaultSelectedKeys`. It is initial STATE now rather than an attribute,
    // which is the whole shape of this migration in one line.
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
    /*
     * The sort is REAL now. React Aria's `sortDescriptor` only announced a
     * state and left the sorting to the consumer, so this example used to show
     * `aria-sort="ascending"` over rows in their original order. `useLumoTable`
     * compares with `Intl.Collator` over the page's own locale, so «اصفهان»
     * precedes «تبریز» because Persian says so.
     */
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

/**
 * The table demo on the home page's component list: four columns, a resizable
 * first column, a checkbox column and a sortable one.
 *
 * Everything it shows is state, so all of it is here rather than in
 * `demos.tsx` — see the boundary note above the two islands before it.
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
           * The resizer's own announced value USED to be React Aria's English
           * "75 pixels", closed by a 27 KB patch of `node_modules` that shipped
           * an `fa-IR` table bundle. The patch is retired: this handle is Lumo's
           * own `<button>` with a required Persian `label` and no value string
           * at all to leak. One workaround the migration DELETED rather than
           * translated.
           */}
          <Column
            id="customer"
            isRowHeader
            defaultWidth={180}
            resizer={<ColumnResizer label={resizeLabel} columnId="customer" />}
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

/* ─────────────────────────────────────────────── command: the palette ── */

/*
 * ── WHY THE PALETTE NEEDS AN ISLAND NOW, AND IT IS THE SAME OLD REASON ──────
 *
 * `CommandList` and `CommandGroup` take RENDER FUNCTIONS over the filtered set
 * on this engine: Base UI filters the `items` ARRAY inside its combobox root,
 * so what a row renders and what it is matched on are structurally separate
 * (which is exactly what retired React Aria's `textValue` derivation trap). A
 * render prop is a FUNCTION, and this file's header lists a function as the
 * first thing that cannot cross into the RSC payload — the prerender fails with
 * «Functions cannot be passed directly to Client Components».
 *
 * A palette built from static JSX children compiles and would dodge the
 * boundary. It must not be used here: static children on this engine are
 * rendered and never filtered, so the demo would be a search box that returns
 * everything for every query — the precise defect `command.tsx` made `items`
 * required to prevent, shipped on the page that documents it.
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
       * A SIBLING of the list, not a `renderEmptyState` prop. `CommandEmpty`
       * renders Base UI's `Autocomplete.Empty`, which is `role="status"
       * aria-live="polite"` and mounts only when the filter emptied the list —
       * so "no results" is announced, where React Aria's was merely drawn.
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

/* ────────────────────────────────────────────────────────── autocomplete ── */

/*
 * Same boundary as the palette above, and it arrives for the same reason:
 * `AutocompleteListBox` renders the FILTERED items through a render function,
 * because Base UI filters the `items` array on the root rather than a JSX
 * collection. A function cannot cross into the RSC payload.
 */
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
