"use client";

import { useState } from "react";
import type { Locale } from "@lumo-ui/core";
import {
  Button,
  ChartContainer,
  ChartLegend,
  LumoForm,
  Pagination,
  Rating,
  TextField,
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

/*
 * `Calendar`'s `isDateUnavailable` is typed `(date: CalendarDate) => boolean`,
 * and `CalendarDate` is not importable in this package — see `isWeekend`'s own
 * note. The cast is the seam between two declarations of one fact, and it
 * narrows rather than widens: the predicate uses one member of a type that has
 * many, so nothing it cannot handle can reach it.
 */
const isWeekendDate = isWeekend as (date: { toDate: (tz: string) => Date }) => boolean as (
  date: Parameters<NonNullable<React.ComponentProps<typeof Calendar>["isDateUnavailable"]>>[0],
) => boolean;

export interface CalendarClosedDaysIslandProps {
  /** Announced name of the calendar. */
  label: string;
  /**
   * Selects the calendar system, the digits, the week start and the direction.
   *
   * Required since the react-day-picker migration: `Calendar` used to read it
   * from React Aria's `I18nProvider`, and there is no such provider now.
   * `previousMonthLabel`/`nextMonthLabel` went the other way — the nav buttons'
   * names are composed by `calendar-datelib.ts` per locale, so they are no
   * longer props anyone can forget.
   */
  locale: Locale;
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
  locale,
  description,
  errorMessage,
}: CalendarClosedDaysIslandProps) {
  return (
    <Calendar
      label={label}
      locale={locale}
      description={description}
      isDateUnavailable={isWeekendDate}
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

/* ─────────────────────────────────────────────────────────────── form state ── */

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
  /** Overrides the default «این فیلد الزامی است» for the name field. */
  nameRequiredMessage: string;
}

/**
 * A real, validating, three-field form.
 *
 * An island for the reason the file header gives — `useLumoForm` is a hook, and
 * `demos.tsx` is a server module — and every string below is still a prop, so
 * no copy lives on this side.
 *
 * It is deliberately the WHOLE loop rather than a screenshot of one: type
 * nothing and submit, and the browser does not intervene (`Form` emits
 * `noValidate`), Lumo's own messages appear in Persian, and focus lands on the
 * first invalid control. That last step is the part a static preview cannot
 * show and the part most likely to be missing from a hand-rolled form.
 *
 * The national-ID and mobile fields accept Persian digits — «۰۴۹۹۳۷۰۸۹۹» is
 * checked, not rejected — which is the single most load-bearing claim
 * `form-state.tsx` makes and the one worth being able to try.
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
}: FormStateIslandProps) {
  const [saved, setSaved] = useState(false);
  const v = lumoValidators(locale);

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

/* ─────────────────────── phone-input, sortable and kanban ── */

/*
 * Appended by the round-5 batch, same append-only contract as the blocks above:
 * import declarations are hoisted, and `useState` and `Locale` are already
 * imported at the top of this file.
 *
 * ── WHY THESE THREE, AND NOT THE OTHER SEVEN IN THE BATCH ───────────────────
 *
 * Seven of the ten components this batch documented needed no island at all,
 * which is worth stating because it is the interesting result: `InputOtp` is a
 * client component whose handlers are all OPTIONAL and whose value is
 * uncontrolled by default, so its examples type real codes while crossing the
 * boundary with nothing but strings. `MessageScroller` and `Scrollspy` are the
 * same shape. These three are here because each requires something React
 * refuses to serialise:
 *
 *  - **PhoneInput** is a CONTROLLED field with no uncontrolled mode. Without an
 *    `onChange` the value is derived from a prop that never changes, so the
 *    second keystroke erases the first — a static demo of it would be a field
 *    that cannot be typed into, which is the one thing this component has to be
 *    watched doing.
 *  - **Sortable** and **Kanban** require `onReorder`/`onColumnsChange`, a
 *    `children` RENDER FUNCTION, and a `strings` object with a function member.
 *
 * ── THE ANNOUNCEMENT CLOSURES, AND WHAT ASSEMBLING THEM COSTS ───────────────
 *
 * `SortableStrings.position` and `KanbanStrings.movedTo` are functions rather
 * than templates precisely so a translator can AUTHOR clause order — the
 * argument `core/src/strings.ts` makes once for the library. Assembling them
 * from word parts here, as `PaginationIsland` and `ResizableIsland` already do
 * for their own single-word cases, is admissible only because these two
 * particular sentences happen to place their figures identically in both
 * locales: «مورد ۳ از ۷» and "item 3 of 7" are the same shape.
 *
 * That is a fact about THESE sentences, not a general licence, and it is the
 * reason the parts are passed rather than the sentence: a real caller writes
 * the closure on their own client, where nothing has to cross a boundary and
 * the whole sentence can be authored per locale. The docs page says so.
 *
 * As everywhere else in this file, there is no copy here — every word arrives
 * as a prop, written in both locales in the examples module.
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
  /**
   * Caption for the read-out below, e.g. «چیزی که ذخیره می‌شود». The E.164
   * string beside it is the component's own output, not copy.
   */
  storedLabel: string;
  /** Shown in place of the E.164 string while the field is empty. */
  emptyText: string;
}

/**
 * A phone field that can actually be typed into, plus what it stores.
 *
 * The read-out is the demonstration. Type «۰۹۱۲۱۲۳۴۵۶۷» — the number every
 * Iranian knows by heart, leading zero and all — and watch `+989121234567`
 * appear underneath. That trunk zero is a domestic dialling artefact rather
 * than part of the number, and reconciling the two is the entire reason the
 * component exists; neither half of it is visible in a screenshot.
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
           * E.164 is a Latin run by definition, and `data-lumo-latn` is the
           * sanctioned marker for one — the same pair `phone-input.tsx` uses
           * for the dial code. `<bdi>` isolates it so the `+` does not migrate
           * to the wrong end inside an RTL paragraph.
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
 * keys, drop it with Space or put it back with Escape.
 *
 * The numbers reaching `position` are already localised — `sortable.tsx`
 * formats them before the closure built here ever sees them, so this file never
 * hands a translator a raw `number`.
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
 * column and ACROSS columns; Escape puts it back where it started.
 *
 * The horizontal pair is the thing to try on the fa route: columns run
 * right-to-left there, so ArrowLeft advances a card toward «انجام‌شده» and
 * ArrowRight retreats it — the exact opposite of the English mapping, and a
 * difference no screenshot can show.
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

/* ────────────────────────────────────────────────────────────── data-grid ── */

/*
 * Appended by the round-5 batch. Imports are hoisted; `useState` and `Locale`
 * are already imported at the top of this file.
 *
 * `DataGrid` cannot be demonstrated from a server module for three separate
 * reasons, any one of which would be enough: `useLumoTable` is a hook, and
 * `pageLabel` and `rangeLabel` are required FUNCTIONS. As everywhere else in
 * this file, no copy is authored here — every word arrives as a prop, and the
 * numbers arrive as data and go out through `formatNumber`.
 */
// Only the genuinely new names: `Cell`, `Column`, `Row`, `Table`, `TableBody`,
// `TableHeader` and `useLumoTable` are already imported by the table block
// above, and import declarations are hoisted — re-importing them is a
// duplicate-binding error, not a shadow.
import {
  DataGrid,
  DataGridColumnsMenu,
  DataGridEmpty,
  DataGridPagination,
  DataGridSearch,
  DataGridToolbar,
  type DataGridColumnLabel,
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

/**
 * A working data grid: type in the search box, hide a column, change the page.
 *
 * The three things worth doing are all invisible in a screenshot — filtering
 * returns to page one, the LAST visible column's toggle is disabled so the view
 * cannot be trapped empty, and every figure on the footer is in the reader's
 * own numerals including the rows-per-page options.
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
        pageSizeLabel={pageSizeLabel}
        {...(pageSizes === undefined ? {} : { pageSizes })}
      />
    </DataGrid>
  );
}

/* ──────────────────────────────────────────── autocomplete · rating · tags ── */

/*
 * Appended by the round-6 form batch, same append-only contract as every block
 * above: imports are hoisted, and `useState`, `Locale` and `formatNumber` are
 * already imported at the top of this file. Only the genuinely new names are
 * imported here — `Autocomplete`, `AutocompleteInput`, `AutocompleteItem`,
 * `AutocompleteListBox` and `Rating` are already bound by earlier blocks, and
 * re-importing them is a duplicate-binding error rather than a shadow.
 *
 * Four components in this batch cannot be demonstrated from a server module,
 * each for a reason its own docblock states:
 *
 *  - `Autocomplete` filters a DATA ARRAY and hands the survivors to its list as
 *    a RENDER ARGUMENT. The children are therefore a function, and a static
 *    child list is the worst possible outcome — it renders, type-checks and is
 *    silently never filtered.
 *  - `Rating` requires `valueLabel` / `starLabel`, functions of an
 *    already-formatted number, because «۴ از ۵» and «۴ ستاره» are sentences
 *    Persian has to author rather than assemble.
 *  - `TagGroup`'s removable form requires `onRemove` AND `removeLabel`, and the
 *    union makes half of that pair unrepresentable.
 *  - `FileUpload`'s list requires `onRemove` per row and a `removeLabel` built
 *    from the file's own name.
 *
 * As everywhere else in this file, NO copy is authored here. Every word arrives
 * as a prop, in both locales, from the examples module; every number arrives as
 * data and leaves through the component's own formatter.
 */
import { FileUpload, FileUploadItem, FileUploadList, TagGroup, TagItem, TagList } from "@lumo-ui/ui";

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
   * Replace the built-in filter with a subsequence match, so the example can
   * show what a consumer-supplied filter receives: the RAW text and the RAW
   * query, unfolded, because folding behind a consumer's back would silently
   * change what their own comparison sees.
   */
  subsequence?: boolean | undefined;
  /** Rows that render but cannot be chosen. Still filtered like any other. */
  disabledValues?: readonly string[] | undefined;
  /** Seeds the query so the list arrives already narrowed. */
  defaultInputValue?: string | undefined;
}

/**
 * A working autocomplete: an input and an always-visible list, no popup.
 *
 * The `inline` + `open` pairing that removes Base UI's English «Dismiss»
 * sentinel is inside the component, not here — this island passes no such prop
 * because there is none to pass.
 */
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
  /*
   * A subsequence match: every character of the query, in order, anywhere in
   * the text. It is handed the raw strings deliberately — see the prop's doc.
   */
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

/**
 * The read-only form: a `role="img"` with one authored name, no tab stop and no
 * five-way navigation through information that is not a choice.
 */
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
   * text — «حذف تهران» with a prefix, «تهران را بردارید» with a suffix. The
   * component takes a FUNCTION for exactly this reason; the island supplies the
   * closure and the examples module supplies the words.
   */
  removePrefix?: string | undefined;
  removeSuffix?: string | undefined;
}

/**
 * A working removable tag row. Arrow the chips and listen: each remove control
 * names the tag it drops, which is what makes eight filters eight distinct
 * announcements instead of eight buttons called «حذف».
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
  isDisabled?: boolean | undefined;
  /** Rows the list starts with, so a size boundary can be shown without a picker. */
  initialFiles?: readonly UploadedFile[] | undefined;
}

/**
 * A working uploader: drop files on the area, pick them with the button, or
 * paste them while something inside is focused.
 *
 * The three things worth doing here are all invisible in a screenshot — the
 * drag highlight survives the pointer crossing into the icon (a counter, not a
 * flag), choosing the same file twice in a row still fires, and every size is
 * formatted with its unit in the reader's own language.
 */
export function FileUploadIsland({
  locale,
  label,
  triggerLabel,
  hint,
  removeWord,
  acceptedFileTypes,
  allowsMultiple,
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
          {files.map((file) => (
            <FileUploadItem
              key={file.name}
              name={file.name}
              size={file.size}
              locale={locale}
              removeLabel={(fileName) => `${removeWord} ${fileName}`}
              onRemove={() => {
                setFiles((current) => current.filter((row) => row.name !== file.name));
              }}
            />
          ))}
        </FileUploadList>
      )}
    </div>
  );
}
