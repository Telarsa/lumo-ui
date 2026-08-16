"use client";

import * as React from "react";
import { Chart as TanstackChart } from "@tanstack/charts/react";
import { defineChart as defineChartBase } from "@tanstack/charts";
import { focusGroupX } from "@tanstack/charts/focus";
import { tooltip as tooltipExtension } from "@tanstack/charts/tooltip";
import { barY } from "@tanstack/charts/bar";
import { lineY } from "@tanstack/charts/line";
import { areaY } from "@tanstack/charts/area";
import { dot } from "@tanstack/charts/dot";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scalePoint } from "@tanstack/charts/scales/point";
import { scaleLinear } from "@tanstack/charts/scales/linear";

import { cn, formatNumber, type Locale } from "@lumo-ui/core";
import { useLumoStringsFor } from "./locale.ts";
// Directive-free module: a SERVER-rendered chart panel can call the variants,
// the direction arithmetic and the axis builders.
import {
  CHART_KEYBOARD_READING_ORDER,
  CHART_MOTION_ATTRIBUTE,
  CHART_MOTION_GUIDE_DURATION,
  CHART_MOTION_MARK_DURATION,
  CHART_MOTION_REDUCED_MOTION_IS_TOTAL,
  CHART_MOTION_STAGGER,
  CHART_MOTION_STAGGER_STEPS,
  CHART_PIE_SWEEP,
  CHART_PIE_SWEEP_HALF,
  CHART_VALUE_AXIS_TRAILING_EDGE,
  TANSTACK_ROLE_DESCRIPTION,
  chartCategoryAxis,
  chartColor,
  chartColorVar,
  chartContainerVariants,
  chartLegendItemVariants,
  chartLegendVariants,
  chartMirror,
  chartMotionStyleSheet,
  chartPieCenterVariants,
  chartRenderSvg,
  chartStyleSheet,
  chartTickFormatter,
  chartTooltipIndicatorVariants,
  chartTooltipVariants,
  chartValueAxis,
  type ChartAxisSpecOptions,
  type ChartConfig,
  type ChartMirror,
  type ChartPieSweep,
} from "./chart.variants.ts";

export {
  CHART_KEYBOARD_READING_ORDER,
  CHART_MOTION_ATTRIBUTE,
  CHART_MOTION_GUIDE_DURATION,
  CHART_MOTION_MARK_DURATION,
  CHART_MOTION_REDUCED_MOTION_IS_TOTAL,
  CHART_MOTION_STAGGER,
  CHART_MOTION_STAGGER_STEPS,
  CHART_PIE_SWEEP,
  CHART_PIE_SWEEP_HALF,
  CHART_VALUE_AXIS_TRAILING_EDGE,
  TANSTACK_ROLE_DESCRIPTION,
  chartCategoryAxis,
  chartColor,
  chartColorVar,
  chartContainerVariants,
  chartLegendItemVariants,
  chartLegendVariants,
  chartMirror,
  chartMotionStyleSheet,
  chartPieCenterVariants,
  chartRenderSvg,
  chartStyleSheet,
  chartTickFormatter,
  chartTooltipIndicatorVariants,
  chartTooltipVariants,
  chartValueAxis,
};
export type { ChartAxisSpecOptions, ChartConfig, ChartMirror, ChartPieSweep };

/**
 * The marks, re-exported so a caller composes a chart from ONE import. They are
 * TanStack's own, unwrapped; Lumo supplies `chartColor(key)` for the `fill`.
 */
export { areaY, barY, dot, lineY, scaleBand, scaleLinear, scalePoint };

/**
 * Charts on `@tanstack/charts` 0.11.1.
 *
 *     const definition = defineChart({
 *       marks: [barY(data, { id: "sales", x: "month", y: "sales", fill: chartColor("sales") })],
 *       x: chartCategoryAxis(locale, { scale: () => scaleBand<string>().padding(0.2) }),
 *       y: chartValueAxis(locale, { scale: scaleLinear, grid: true }),
 *     });
 *
 *     <ChartContainer config={config} locale={locale} label="فروش ماهانه" definition={definition}
 *       data={data} categoryKey="month" dataCaption="داده‌های نمودار فروش ماهانه" />
 *
 * Load-bearing decisions (long form: docs/decisions/log.md, docs/history/):
 *  - TanStack replaced recharts because it SSRs a real `<svg>` with Persian ticks, so
 *    `lumo-gate` can grade the plot; recharts served no plot bytes at all.
 *  - `<ChartData>` (a real `<table>`) stays and `data`/`categoryKey`/`dataCaption` are
 *    REQUIRED: ticks are not the data, and label thinning can drop ticks.
 *  - Axes and tooltip are definition fragments (`chartCategoryAxis`, `chartValueAxis`,
 *    `chartTooltip`), lower-case because they return objects; a server can build them.
 *  - `ChartLegend` is Lumo's own markup driven by `ChartConfig`; pie is not ported.
 *  - The motion renderer (`motion()`) is NOT adopted: `RendererChart` has no `renderSvg`,
 *    so it would reintroduce the English `aria-roledescription="chart"`. First-paint
 *    motion is CSS (`chartMotionStyleSheet`); update motion is `svgAnimation`.
 *  - Callbacks are `onActiveDatum`/`onSelectDatum` (upstream has no `onActiveChange`).
 *  - Upstream is pre-alpha; expect this wrapper to be rewritten per minor (see the pin
 *    note in `pnpm-workspace.yaml`).
 */

interface ChartContextProps {
  config: ChartConfig;
  locale: Locale;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    // Developer error, never announced — outside the no-English rule.
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

/** One plotted row. Values are the series figures; the category is a label. */
export type ChartRow = Record<string, string | number | null | undefined>;

export interface ChartContainerProps
  extends Omit<React.ComponentProps<"div">, "children" | "className" | "aria-label"> {
  /** Chrome AROUND the plot — a `<ChartLegend>`, a caption, a footnote. Not the chart itself, which is `definition`. */
  children?: import("@lumo-ui/core").LumoNode;
  /** Per-series labels and colors, keyed by the data's series keys. */
  config: ChartConfig;
  /** The numbering system every tick, tooltip and legend figure is formatted in — and whose `LumoStrings["chart"]` names the SVG (`aria-roledescription`). */
  locale: Locale;
  /**
   * The chart's announced name, e.g. «فروش ماهانه به تفکیک دسته». REQUIRED: the plot
   * is a `role="img"` keyboard stop, and an unnamed one announces "chart" and nothing else.
   */
  label: string;
  /** The definition from `defineChart`. See the file header for the shape. */
  definition: React.ComponentProps<typeof TanstackChart>["definition"];
  /** The same rows the marks plot. REQUIRED (passed twice, deliberately): an optional data table is one nobody adds. */
  data: ChartRow[];
  /** Which column names the row, e.g. `"month"`. Becomes each `<th scope="row">`. */
  categoryKey: string;
  /**
   * The table's `<caption>`, e.g. «داده‌های نمودار فروش ماهانه». Distinct from `label`,
   * which names the interactive plot; this names the tabular equivalent.
   */
  dataCaption: string;
  /** Plot height in pixels. */
  height?: number | undefined;
  /** The width the SERVER render lays out against, before `ResizeObserver` has measured — what puts real ticks in the first byte. */
  initialWidth?: number | undefined;
  /**
   * Motion, on by default; the ONE switch that turns it off. `false` writes the motion
   * attribute `"off"` AND strips `svgAnimation` from the definition. Not how you honour
   * `prefers-reduced-motion` — see `CHART_MOTION_REDUCED_MOTION_IS_TOTAL`.
   */
  animate?: boolean | undefined;
  /**
   * The ACTIVE datum changed — hover moved to another band, or an arrow key did. Receives
   * the caller's own row (`point.datum`), `undefined` when nothing is active. Not named
   * `onSelect`: `React.ComponentProps<"div">` already has a DOM `onSelect`.
   */
  onActiveDatum?: ((row: ChartRow | undefined) => void) | undefined;
  /** The reader PICKED a datum: a click, or Enter/Space on the focused one. */
  onSelectDatum?: ((row: ChartRow | undefined) => void) | undefined;
  className?: string | undefined;
}

const INITIAL_WIDTH = 320;
const HEIGHT = 200;

export function ChartContainer({
  id,
  className,
  children,
  config,
  locale,
  label,
  definition,
  data,
  categoryKey,
  dataCaption,
  height = HEIGHT,
  initialWidth = INITIAL_WIDTH,
  animate = true,
  onActiveDatum,
  onSelectDatum,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  /*
   * `renderSvg` MUST be memoised: `react/Chart.js` rebuilds the renderer on identity change,
   * which classifies every update as "layout" (never animated) and tears down the `<svg>`.
   * `plotted` is a shallow COPY of the caller's definition (they may memoise it); host
   * options live at the top level in every `defineChart` overload, so one key overwritten is safe.
   */
  const strings = useLumoStringsFor(locale);
  const renderSvg = React.useMemo(() => chartRenderSvg(strings.chart), [strings]);

  const plotted = React.useMemo(
    () =>
      animate
        ? definition
        : ({ ...(definition as object), svgAnimation: false } as typeof definition),
    [animate, definition],
  );

  return (
    <ChartContext.Provider value={{ config, locale }}>
      <div
        data-lumo=""
        data-slot="chart"
        data-chart={chartId}
        {...{ [CHART_MOTION_ATTRIBUTE]: animate ? "on" : "off" }}
        className={cn(chartContainerVariants(), className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} motion={animate} />
        <ChartData
          config={config}
          locale={locale}
          data={data}
          categoryKey={categoryKey}
          caption={dataCaption}
        />
        <TanstackChart
          definition={plotted}
          ariaLabel={label}
          height={height}
          initialWidth={initialWidth}
          /* `point.datum` is the caller's ORIGINAL row, so these hand back a `ChartRow`; `undefined` on clear. */
          {...(onActiveDatum === undefined
            ? {}
            : {
                onFocusChange: (point: { datum?: unknown } | null) =>
                  onActiveDatum(point?.datum as ChartRow | undefined),
              })}
          {...(onSelectDatum === undefined
            ? {}
            : {
                onSelect: (point: { datum?: unknown } | null) =>
                  onSelectDatum(point?.datum as ChartRow | undefined),
              })}
          /* The library's own renderer with its one English literal localised — see `chartRenderSvg`. */
          renderSvg={renderSvg as never}
        />
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export interface ChartDataProps {
  /** Per-series labels and colors, keyed by the data's series keys. */
  config: ChartConfig;
  locale: Locale;
  /** The rows the table serves — the same data the chart draws. */
  data: ChartRow[];
  /** The row-heading column's key in the data. */
  categoryKey: string;
  /** The accessible caption of the semantic data table. */
  caption: string;
}

/**
 * The chart's figures, as a table, in the served bytes. `ChartContainer` renders this
 * itself; exported for a plot composed outside the container.
 *
 * An axis is not the data: ticks give the scale, not the figures, and TanStack's label
 * thinning can drop ticks. A `<table>` with `<th scope>` relates each figure to its
 * category. `sr-only` (NOT `aria-hidden`) keeps it graded by the gate and read by AT.
 */
export function ChartData({ config, locale, data, categoryKey, caption }: ChartDataProps) {
  // The category column is a label, not a series.
  const series = Object.keys(config).filter((key) => key !== categoryKey);

  // A number reaches the DOM only through `formatNumber`; `LumoNode` cannot see data-array values.
  const cell = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    return typeof value === "number" ? formatNumber(value, locale) : value;
  };

  return (
    <table className="sr-only" data-slot="chart-data">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{config[categoryKey]?.label ?? caption}</th>
          {series.map((key) => (
            <th key={key} scope="col">
              {config[key]?.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          // Category value is the identity; index breaks ties for repeated categories.
          <tr key={`${String(row[categoryKey] ?? "")}-${index}`}>
            <th scope="row">{cell(row[categoryKey])}</th>
            {series.map((key) => (
              <td key={key}>{cell(row[key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The chart's own stylesheet: series colours, and — when `motion` — the first-paint
 * animation. Both scoped by `[data-chart="<id>"]`, so four charts get four independent
 * sheets. `motion={false}` omits the block so `animate={false}` costs nothing in bytes.
 */
export function ChartStyle({
  id,
  config,
  motion = false,
}: {
  id: string;
  config: ChartConfig;
  motion?: boolean;
}) {
  const css = chartStyleSheet(id, config) + (motion ? chartMotionStyleSheet(id) : "");
  if (!css) return null;
  // Safe: config keys are filtered against /^[A-Za-z0-9_-]+$/ in chart.variants.ts and
  // `id` comes from `useId()` or the same value already in `data-chart`.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/**
 * The tooltip, as a definition fragment.
 *
 *     defineChart({ marks: [...], x: …, y: …, tooltip: chartTooltip(locale, config) })
 *
 * `format` is the only seam where the hover-only number can go through `formatNumber`;
 * TanStack's `placement` is `'auto'`, so there is no physical side to reverse under RTL.
 */
export function chartTooltip(locale: Locale, config: ChartConfig) {
  const format = chartTickFormatter(locale);
  return {
    use: tooltipExtension,
    /*
     * `"pointer"` is what makes the tooltip FOLLOW the pointer: upstream anchors on the datum
     * by default and skips the repaint while the pointer stays inside one datum's catchment
     * (`tooltipTracksPointer()`); anchor and repaint are the same switch. Keyboard focus
     * has no pointer, so it falls back to the datum. Broken in BOTH directions, not RTL.
     */
    anchor: "pointer" as const,
    /* `point.datum` is the caller's original row; the series LABEL comes from `ChartConfig`,
     * and a missing label is left visible rather than papered over with the key. */
    format: (point: { yValue?: unknown; markId?: string }) => {
      /* `yValue`, not `value` — `ChartPoint` has no `value` field; a wrong field is an
       * empty tooltip nothing server-side can see. */
      const label = point.markId === undefined ? undefined : config[point.markId]?.label;
      const value = format(point.yValue);
      return typeof label === "string" ? `${label}: ${value}` : value;
    },
  };
}

export interface ChartLegendProps
  extends Omit<React.ComponentProps<"div">, "className" | "children"> {
  /** Where the legend sits relative to the plot. */
  verticalAlign?: "top" | "bottom" | "middle" | undefined;
  /** Series to omit, e.g. one drawn only as a reference line. Not `hidden`, which is a real HTML boolean attribute. */
  hiddenSeries?: readonly string[] | undefined;
  className?: string | undefined;
}

/**
 * The legend. Lumo's own markup, driven by `ChartConfig`: a flex row that mirrors from
 * `direction` alone, swatches `aria-hidden` beside real text. Replaces the engine legend,
 * whose measured defects were physical margins, `text-align:left` and a Latin `aria-label`.
 */
export function ChartLegend({
  verticalAlign = "bottom",
  hiddenSeries,
  className,
  ...props
}: ChartLegendProps) {
  const { config } = useChart();
  const skip = new Set(hiddenSeries ?? []);
  const entries = Object.entries(config).filter(([key]) => !skip.has(key));
  if (entries.length === 0) return null;

  return (
    <div className={cn(chartLegendVariants({ verticalAlign }), className)} {...props}>
      {entries.map(([key, item]) => (
        <div key={key} className={cn(chartLegendItemVariants())}>
          {item.icon ? (
            <item.icon />
          ) : (
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-[2px] bg-(--lumo-chart-swatch)"
              style={{ "--lumo-chart-swatch": chartColor(key) } as React.CSSProperties}
            />
          )}
          {item.label}
        </div>
      ))}
    </div>
  );
}

/**
 * `defineChart`, with the hit-testing a reader actually expects.
 *
 * Upstream hit-tests by nearest point within 48px, so the tooltip vanishes off the line.
 * `focusGroupX` + `maxFocusDistance: Infinity` makes the whole x band live and reports
 * every series at that x (recharts' shared-tooltip behaviour). Defaults, not docs: the
 * caller's `focus`/`maxFocusDistance` win because the spread is last. This decides WHEN a
 * tooltip appears; `chartTooltip`'s `anchor` decides WHERE.
 *
 * The signature is borrowed with a cast: `defineChart` has five overloads and
 * `Parameters<…>[0]` collapses to the last one, which broke every responsive chart.
 */
export const defineChart = ((definition: Record<string, unknown>) => {
  const merged: Record<string, unknown> = {
    focus: focusGroupX,
    // A band hit test has no radius.
    maxFocusDistance: Number.POSITIVE_INFINITY,
    ...definition,
  };
  /*
   * Motion is on by default and `respectReducedMotion` is forced `true` AFTER the spread:
   * a default is a promise the next options object drops, and this one is not the caller's
   * to drop (`CHART_MOTION_REDUCED_MOTION_IS_TOTAL`; the CSS half is `chartMotionStyleSheet`).
   */
  merged["svgAnimation"] = chartAnimation(merged["svgAnimation"]);
  return (defineChartBase as (d: unknown) => unknown)(merged);
}) as unknown as typeof defineChartBase;

/**
 * The easing curves a Lumo chart's UPDATE animation may use. Upstream's own union plus a
 * function, honoured verbatim; restated rather than re-exported so no spring is advertised.
 */
export type ChartEasing =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | ((progress: number) => number);

/** What `chartMotion` accepts. Two fields, and neither of them is an escape. */
export interface ChartMotionOptions {
  /** How long an UPDATE takes, in ms. Not the first-paint animation, which is CSS. */
  duration?: number | undefined;
  /** The curve. A function is genuinely honoured — see `ChartEasing`. */
  easing?: ChartEasing | undefined;
}

/**
 * What a Lumo chart's `svgAnimation` is. `respectReducedMotion` is the literal `true` so
 * overriding it is a type error as well as a runtime overwrite; `resize` is absent on purpose.
 */
export interface ChartAnimation {
  duration: number;
  easing: ChartEasing;
  respectReducedMotion: true;
}

/** The default UPDATE duration, in ms. */
export const CHART_MOTION_UPDATE_DURATION = 320;

/**
 * The UPDATE animation, as a definition fragment; `defineChart` installs `chartMotion()`
 * already, so this is written only when the defaults are not wanted.
 *
 *     defineChart({ marks: […], x: …, y: …, svgAnimation: chartMotion({ duration: 600 }) })
 */
export function chartMotion(options?: ChartMotionOptions): ChartAnimation {
  return {
    duration: options?.duration ?? CHART_MOTION_UPDATE_DURATION,
    easing: options?.easing ?? "ease-out",
    respectReducedMotion: true,
  };
}

/** The default AND the pin in one function — see the note in `defineChart`. */
function chartAnimation(value: unknown): unknown {
  if (value === false) return false;
  if (value === true || value === undefined || value === null) return chartMotion();
  if (typeof value !== "object") return chartMotion();
  return { ...(value as Record<string, unknown>), respectReducedMotion: true };
}
