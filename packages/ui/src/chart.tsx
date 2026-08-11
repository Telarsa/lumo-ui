"use client";

import * as React from "react";
import { Chart as TanstackChart } from "@tanstack/charts/react";
import { defineChart } from "@tanstack/charts";
import { tooltip as tooltipExtension } from "@tanstack/charts/tooltip";
import { barY } from "@tanstack/charts/bar";
import { lineY } from "@tanstack/charts/line";
import { areaY } from "@tanstack/charts/area";
import { dot } from "@tanstack/charts/dot";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scalePoint } from "@tanstack/charts/scales/point";
import { scaleLinear } from "@tanstack/charts/scales/linear";

import { cn, formatNumber, type Locale } from "@lumo-ui/core";
// No `"use client"` in that module, so a SERVER-rendered chart panel can call
// the variants, the direction arithmetic AND — new on this renderer — the axis
// builders. See chart.variants.ts's header.
import {
  CHART_PIE_SWEEP,
  CHART_PIE_SWEEP_HALF,
  CHART_ROLE_DESCRIPTION,
  CHART_VALUE_AXIS_TRAILING_EDGE,
  TANSTACK_ROLE_DESCRIPTION,
  chartCategoryAxis,
  chartColor,
  chartColorVar,
  chartContainerVariants,
  chartLegendItemVariants,
  chartLegendVariants,
  chartMirror,
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
  CHART_PIE_SWEEP,
  CHART_PIE_SWEEP_HALF,
  CHART_ROLE_DESCRIPTION,
  CHART_VALUE_AXIS_TRAILING_EDGE,
  TANSTACK_ROLE_DESCRIPTION,
  chartCategoryAxis,
  chartColor,
  chartColorVar,
  chartContainerVariants,
  chartLegendItemVariants,
  chartLegendVariants,
  chartMirror,
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
 * The marks, re-exported so a caller composes a chart from ONE import.
 *
 * They are TanStack's own and are deliberately not wrapped: a wrapper that only
 * forwards options is a second name for one thing, and `barY(data, {…})` takes
 * a plain object with no direction and no number in it — nothing for Lumo to
 * correct. What Lumo supplies is `chartColor(key)` for the `fill`, so a mark
 * takes its colour from `ChartConfig` and the theme stylesheet rather than from
 * a literal.
 */
export { areaY, barY, dot, lineY, scaleBand, scaleLinear, scalePoint };

/**
 * Charts, on `@tanstack/charts` 0.9.0.
 *
 *     const definition = defineChart({
 *       marks: [barY(data, { id: "sales", x: "month", y: "sales", fill: chartColor("sales") })],
 *       x: chartCategoryAxis(locale, { scale: () => scaleBand<string>().padding(0.2) }),
 *       y: chartValueAxis(locale, { scale: scaleLinear, grid: true }),
 *     });
 *
 *     <ChartContainer
 *       config={config} locale={locale} label="فروش ماهانه"
 *       definition={definition}
 *       data={data} categoryKey="month" dataCaption="داده‌های نمودار فروش ماهانه"
 *     />
 *
 * ═══ THE MEASUREMENT THAT MOVED THE RENDERER ════════════════════════════════
 *
 *     recharts 3.8.0    127 bytes, NO <svg>, 0 <text>, 0 digits
 *     TanStack 0.9.0  4,717 bytes,  a <svg>, 7 <text>, 13 PERSIAN digits
 *
 * Same harness, same day, `renderToStaticMarkup`, control arm installed beside
 * the subject (`experiments/measurements/tanstack-charts.json`). recharts had
 * no configuration that put a plot in the served bytes — not with a fixed size,
 * not without `ResponsiveContainer`.
 *
 * **The consequence was never about pixels. It was about the GATE.** `lumo-gate`
 * grades the SERVED HTML, so a recharts chart contributed nothing for it to
 * grade: no digits to count, no text to check. Graded with the gate's own
 * rules, a deliberately broken chart (Latin axis) scores
 *
 *     recharts, correct   0 violations
 *     recharts, BROKEN    0 violations      ← the blind spot, as a number
 *     TanStack, correct   0 violations
 *     TanStack, BROKEN    5 violations
 *
 * That is the whole argument, and it is the reason the header of this file used
 * to say "THE GATE CANNOT SEE THE PLOT". **It can now.**
 *
 * ═══ `<ChartData>` STAYS, AND THE REASON IS UNCHANGED ═══════════════════════
 *
 * An SSR'd `<svg>` puts axis TICKS in the served bytes. It does not put the
 * DATA there — bar heights are geometry. Measured on the same run, TanStack's
 * collision-aware label thinning DROPPED one of four category labels from the
 * served text, so not even every tick is guaranteed.
 *
 * So `ChartContainer` still renders `<ChartData>` — a real `<table>` with
 * `<th scope>` — and `data`, `categoryKey` and `dataCaption` are still REQUIRED
 * props. A no-JS reader and a screen reader get the figures, related to their
 * categories, in reading order. Two lines of defence over different things: the
 * gate now grades the ticks AND the figures.
 *
 * ═══ API CHANGES, ALL FORCED BY THE GRAMMAR ═════════════════════════════════
 *
 * recharts is a component tree; TanStack is a KEYED SCENE built from a plain
 * definition object. Nothing wraps that difference away, so:
 *
 *  1. **`ChartContainer` takes `definition`, not a chart element child.** Its
 *     `children: React.ReactElement` prop is gone, and with it
 *     `React.cloneElement` — the old file had to clone the child to get
 *     `aria-label` onto the `<svg>`, because that was the only element recharts
 *     forwarded unknown props to. `ariaLabel` is a first-class REQUIRED prop of
 *     TanStack's `<Chart>`; the house rule this library enforces by hand on
 *     every wrapper is enforced by the library's own types here.
 *
 *  2. **`ChartCategoryAxis` / `ChartValueAxis` are `chartCategoryAxis` /
 *     `chartValueAxis`** — functions returning an axis options object, in the
 *     directive-free module. They could not stay components: TanStack's axes are
 *     values in the definition, not children. The rename to lower case is
 *     deliberate rather than cosmetic, because a capitalised function that
 *     returns a plain object reads as a component and will be written as `<X/>`
 *     by the next person. **What is gained is worth the break**: a SERVER
 *     component can now build the entire spec — scales, mirroring, tick
 *     formatters — and hand it to the client island as data.
 *
 *  3. **`ChartTooltip` / `ChartTooltipContent` are `chartTooltip(locale)`**, one
 *     function returning the tooltip extension plus a Persian `format`. The old
 *     pair existed to (a) reverse recharts' preferred side under RTL and (b)
 *     replace its content renderer. Neither is needed: TanStack's tooltip
 *     placement is `'auto'` with a mirrored candidate list, and its `format` hook
 *     is a documented option rather than a component slot.
 *
 *  4. **`ChartLegend` + `ChartLegendContent` are one `<ChartLegend>`** taking
 *     `config` directly. Under recharts the pair existed because recharts OWNED
 *     the legend and Lumo had to displace it with `content=`; the measured
 *     defects were `<li style="margin-right:10px">`, `text-align:left` and
 *     `<svg aria-label="v legend icon">` — three physical properties and a Latin
 *     `aria-label` no prop reached. TanStack's legend is opt-in
 *     (`color.legend`), so there is nothing to displace: Lumo simply renders its
 *     own, which it was doing anyway, and the payload comes from `ChartConfig`
 *     instead of from a render-prop.
 *
 *  5. **`ChartPie`, `ChartPieCenter` and `ChartValueLabelList` are NOT PORTED in
 *     this pass, and are removed rather than stubbed.** TanStack has no `<Pie>`:
 *     a pie is a composition of `polar` + `radialArc` and a donut is the same
 *     with an inner radius, so porting them is authoring a composition rather
 *     than translating a component. Shipping a stub that renders nothing would
 *     be worse than an honest absence — a chart that silently draws no sectors
 *     is exactly the class of defect this library measures itself against.
 *     `CHART_PIE_SWEEP`, `CHART_PIE_SWEEP_HALF` and `chartPieCenterVariants`
 *     are KEPT, because the sweep decision and its argument outlive any
 *     renderer, and the harness confirmed TanStack's default already matches it.
 *
 * ═══ THE ONE ENGLISH STRING, AND THE ONE UNFIXABLE RTL CRITERION ════════════
 *
 * Both live in `chart.variants.ts` with their evidence:
 * `chartRenderSvg(locale)` closes `aria-roledescription="chart"` through the
 * public `renderSvg` prop; `CHART_VALUE_AXIS_TRAILING_EDGE` records that the
 * value axis cannot be moved to the reading edge at 0.9.0 and states how that
 * is handled.
 *
 * ═══ WHAT THIS COSTS ═══════════════════════════════════════════════════════
 *
 * The upstream repo was 13 days old with 19 releases at adoption, self-describes
 * its API as pre-alpha, and has already REPLACED the axis configuration surface
 * once — the exact surface `chartCategoryAxis`/`chartValueAxis` sit on. Expect
 * this wrapper to be REWRITTEN, not re-pinned, on roughly every minor until 1.0.
 * That is stated in `pnpm-workspace.yaml` beside the pin, and it is the price of
 * a chart the gate can see.
 */

interface ChartContextProps {
  config: ChartConfig;
  locale: Locale;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    // Not user-facing: a developer error thrown at mount, never a string a
    // reader sees. The library's no-English rule is about announced strings.
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

/** One plotted row. Values are the series figures; the category is a label. */
export type ChartRow = Record<string, string | number | null | undefined>;

export interface ChartContainerProps
  extends Omit<React.ComponentProps<"div">, "children" | "className" | "aria-label"> {
  /**
   * Chrome AROUND the plot — a `<ChartLegend>`, a caption, a footnote.
   *
   * NOT the chart itself, which is `definition`. Under recharts this prop was
   * `React.ReactElement` and held the chart element, which is why the old file
   * had to `cloneElement` it to get an `aria-label` onto the `<svg>`. It holds
   * siblings now, and it is optional because the plot and its data table are
   * complete without one.
   */
  children?: import("@lumo-ui/core").LumoNode;
  config: ChartConfig;
  /** The numbering system every tick, tooltip and legend figure is formatted in. */
  locale: Locale;
  /**
   * The chart's announced name, e.g. «فروش ماهانه به تفکیک دسته».
   *
   * REQUIRED. The plot is a `role="img"` with `tabindex="0"` — a keyboard stop —
   * and an unnamed one announces "chart" and nothing else. TanStack types its
   * own `ariaLabel` as required too, which is the first dependency in this
   * library to enforce Lumo's rule 3 on Lumo's behalf.
   */
  label: string;
  /** The definition from `defineChart`. See the file header for the shape. */
  definition: React.ComponentProps<typeof TanstackChart>["definition"];
  /**
   * The same rows the marks plot.
   *
   * REQUIRED, and yes — passed twice, once here and once to the marks. That
   * redundancy is deliberate: the alternative is an optional prop, and an
   * optional data table is one nobody adds. See the header on why an SSR'd
   * `<svg>` does not retire it.
   */
  data: ChartRow[];
  /** Which column names the row, e.g. `"month"`. Becomes each `<th scope="row">`. */
  categoryKey: string;
  /**
   * The table's `<caption>`, e.g. «داده‌های نمودار فروش ماهانه».
   *
   * Distinct from `label`: `label` names the interactive plot, this names the
   * tabular equivalent. A screen reader meets both, and «نمودار» twice with no
   * distinction is worse than no caption.
   */
  dataCaption: string;
  /** Plot height in pixels. */
  height?: number | undefined;
  /**
   * The width the SERVER render lays out against, before `ResizeObserver` has
   * measured anything. TanStack's documented "deterministic fallback for server
   * output"; this is what puts real ticks in the first byte.
   */
  initialWidth?: number | undefined;
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
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config, locale }}>
      <div
        data-lumo=""
        data-slot="chart"
        data-chart={chartId}
        className={cn(chartContainerVariants(), className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ChartData
          config={config}
          locale={locale}
          data={data}
          categoryKey={categoryKey}
          caption={dataCaption}
        />
        <TanstackChart
          definition={definition}
          // Required by TanStack's own types. See `label`'s doc comment.
          ariaLabel={label}
          height={height}
          initialWidth={initialWidth}
          /*
           * The library's own renderer with its one English literal localised.
           * A prop-level fix: `renderSvg` is public and typed, `renderChartSvg`
           * is a public export, and nothing here imports an internal path or
           * patches node_modules. See `chartRenderSvg`.
           */
          renderSvg={chartRenderSvg(locale) as never}
        />
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export interface ChartDataProps {
  config: ChartConfig;
  locale: Locale;
  data: ChartRow[];
  categoryKey: string;
  caption: string;
}

/**
 * The chart's figures, as a table, in the served bytes.
 *
 * `ChartContainer` renders this itself, so most callers never touch it. It is
 * exported for the case the container cannot cover: a plot composed outside the
 * container, or a panel showing one table for several charts.
 *
 * ── ITS REASON SURVIVED THE RENDERER CHANGE, AND ONE HALF OF IT DID NOT ─────
 *
 * The half that is CLOSED: "the gate can see nothing at all". TanStack serves a
 * real `<svg>` with real Persian ticks, so the plot is graded now.
 *
 * The half that SURVIVES, and it was always the stronger half: **an axis is not
 * the data.** A tick tells a reader the scale runs to ۳٬۰۰۰; it does not tell
 * them فروردین was ۱٬۲۰۰. Bar heights are geometry, and geometry is not text.
 * Measured on the adoption run, TanStack's collision-aware thinning also dropped
 * one of four category labels, so even the ticks are not a promise.
 *
 * ── WHY A TABLE AND NOT A LIST OF `<Num>` ───────────────────────────────────
 *
 * A bag of numbers with no stated relationship is not an equivalent. A `<table>`
 * with `<th scope>` is what lets a screen reader say "فروردین, فروش, ۱٬۲۰۰"
 * instead of reading twelve unattached figures.
 *
 * ── WHY `sr-only` IS NOT HIDING FROM THE GATE ───────────────────────────────
 *
 * `rules.ts` has no CSS model and reports every text node visible, skipping only
 * `aria-hidden`/`hidden` subtrees and `<script>`/`<style>`. So this table is
 * graded by `no-latin-digits` and counted by `persian-digit-floor` exactly like
 * prose. A Latin digit in here fails the build. `sr-only` is a decision about
 * sighted layout, not about grading — and critically it is NOT `aria-hidden`,
 * which would remove it from both the gate and the screen reader at once.
 */
export function ChartData({ config, locale, data, categoryKey, caption }: ChartDataProps) {
  // The category column is a label, not a series, so it must not become a
  // numeric column of its own. Anything else in `config` is a plotted series.
  const series = Object.keys(config).filter((key) => key !== categoryKey);

  // A number reaches the DOM only through `formatNumber`. `LumoNode` cannot
  // catch these — they arrive as `unknown` from a caller's data array, not as a
  // JSX child the type system sees — so the check is here, at the one place
  // every cell passes through.
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
          // The category value is the stable identity here; the index is the
          // fallback for data that repeats one, which is legitimate in a time
          // series.
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

export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const css = chartStyleSheet(id, config);
  if (!css) return null;
  // The CSS text is built in chart.variants.ts, where config keys are filtered
  // against /^[A-Za-z0-9_-]+$/ before they reach a selector or a property name.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/* ════════════════════════════════════════════════════════════════════════════
 * TOOLTIP
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The tooltip, as a definition fragment.
 *
 *     defineChart({ marks: [...], x: …, y: …, tooltip: chartTooltip(locale, config) })
 *
 * ── WHAT TWO RECHARTS COMPONENTS USED TO DO HERE, AND WHY NEITHER IS NEEDED ─
 *
 * `ChartTooltip` existed for ONE measured reason: recharts' `getTooltipTranslate`
 * prefers `coordinate.x + offset` — the space to the RIGHT of the pointer — and
 * only falls back left on overflow. In Persian the space AHEAD of the pointer is
 * the left, so a tooltip that led the cursor in English trailed it in Persian,
 * and `reverseDirection.x` had to be derived from the locale. TanStack's
 * `placement` defaults to `'auto'` over a candidate list rather than to a
 * physical side, so there is no preference to reverse.
 *
 * `ChartTooltipContent` existed to replace recharts' content renderer wholesale.
 * TanStack exposes `format` as an ordinary option, so the number goes through
 * `formatNumber` at the one seam rather than by substituting a component.
 *
 * ── THE NUMBER IS THE POINT ─────────────────────────────────────────────────
 *
 * A tooltip value is a number the renderer stringifies, and a stringified
 * JavaScript number is Latin digits. It is not a JSX child, so `LumoNode` cannot
 * see it, and it appears only on hover, so no server render and no gate can
 * either. `format` is the only place it can be caught.
 */
export function chartTooltip(locale: Locale, config: ChartConfig) {
  const format = chartTickFormatter(locale);
  return {
    use: tooltipExtension,
    /*
     * `point.datum` is the caller's original row — TanStack keeps it, which is
     * what makes a series LABEL reachable at all. The series key falls back to
     * the mark id, and `ChartConfig.label` is what turns that English identifier
     * into Persian; the fallback is the defect `ChartConfig.label` is required
     * to prevent, so it is left visible rather than papered over with the key.
     */
    format: (point: { yValue?: unknown; markId?: string }) => {
      /*
       * `yValue`, not `value` — `ChartPoint` has no `value` field. Verified
       * against the installed `dist/types.d.ts`: the interface is
       * `{ key, markId, group, groupLabel, datum, datumIndex, xValue, yValue,
       * x, y, color }`. Reading a field that does not exist would have produced
       * `undefined`, which `chartTickFormatter` turns into the EMPTY STRING —
       * a tooltip with a label and no number, on hover only, which no server
       * render and no gate can see.
       */
      const label = point.markId === undefined ? undefined : config[point.markId]?.label;
      const value = format(point.yValue);
      return typeof label === "string" ? `${label}: ${value}` : value;
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * LEGEND
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface ChartLegendProps
  extends Omit<React.ComponentProps<"div">, "className" | "children"> {
  /** Where the legend sits relative to the plot. */
  verticalAlign?: "top" | "bottom" | "middle" | undefined;
  /**
   * Series to omit, e.g. one drawn only as a reference line.
   *
   * NOT `hidden`, which is a real HTML attribute of type `boolean` on every
   * element — a name collision that would have made `<ChartLegend hidden>`
   * mean two contradictory things and would only have surfaced as a type error
   * at the call site.
   */
  hiddenSeries?: readonly string[] | undefined;
  className?: string | undefined;
}

/**
 * The legend. Lumo's own markup, driven by `ChartConfig`.
 *
 * ── THIS WAS NEVER OPTIONAL STYLING, AND STILL IS NOT ───────────────────────
 *
 * Measured on recharts' DEFAULT legend under `dir="rtl"`: every item was an
 * `<li style="display:inline-block;margin-right:10px">` inside a
 * `<ul style="text-align:left">`, and each swatch was
 * `<svg aria-label="v legend icon">` — the dataKey, in English, in an attribute
 * a screen reader speaks. Three physical properties and a Latin `aria-label`,
 * none of which any prop reached; passing `content=` was the only way to keep it
 * out of the document.
 *
 * TanStack's legend is opt-in rather than default, so nothing has to be
 * displaced — but the replacement is unchanged, because the reasons for it were
 * never about recharts. A flex row mirrors from `direction` alone, and its
 * swatches are `aria-hidden` decoration beside real text.
 *
 * The payload now comes from `ChartConfig` instead of from a render-prop, which
 * removes the one case the old version could not name: a series present in the
 * plot and absent from `config` fell back to `item.value`, i.e. the raw key.
 * There is no fallback here because there is no second source.
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

/* ════════════════════════════════════════════════════════════════════════════
 * THE DEFINITION BUILDER
 * ═══════════════════════════════════════════════════════════════════════════ */

export { defineChart };
