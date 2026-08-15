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
// No `"use client"` in that module, so a SERVER-rendered chart panel can call
// the variants, the direction arithmetic AND — new on this renderer — the axis
// builders. See chart.variants.ts's header.
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
 * Charts, re-verified against `@tanstack/charts` 0.11.1.
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
 *     function returning the tooltip extension plus a Persian `format` and an
 *     `anchor`. The old pair existed to (a) reverse recharts' preferred side
 *     under RTL and (b) replace its content renderer. Neither is needed:
 *     TanStack's tooltip placement is `'auto'` over a candidate list rather than
 *     a physical side, and its `format` hook is a documented option rather than
 *     a component slot.
 *
 *     `anchor` is NOT one of those two, and it is the option this wrapper was
 *     shipped without: TanStack anchors a tooltip on the DATUM by default, so
 *     the box did not follow the pointer in either direction. See
 *     `chartTooltip` for the measurement.
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
 * value axis cannot be moved to the reading edge at 0.11.1 and states how that
 * is handled.
 *
 * ═══ MOTION AND INTERACTION, AGAINST WHAT A RECHARTS READER EXPECTS ═════════
 *
 * The question this section answers is "can it animate and be interactive the
 * way recharts is". The short answer is **yes for interaction, mostly yes for
 * motion, and no in three named places** — and every row below was read in the
 * installed `dist/*.d.ts` and then driven under jsdom, because a type that
 * exists is not a behaviour that runs.
 *
 *     WHAT                        RECHARTS 3.8   TANSTACK 0.9   LUMO SHIPS
 *     ────────────────────────────────────────────────────────────────────────
 *     animate on first paint      yes (default)  NO             yes, in CSS
 *     stagger per datum           no             renderer only  yes, in CSS
 *     animate on data change      yes            yes            yes, default on
 *     enter/exit of a series      yes            yes            yes, default on
 *     named easings               yes            yes            yes
 *     custom easing fn            no             yes            yes
 *     per-part curves             no             renderer only  yes, in CSS
 *     SPRING transitions          no             renderer only  **NO**
 *     morph / rolling paths       no             renderer only  **NO**
 *     hover tooltip + focus ring  yes            yes            yes
 *     KEYBOARD datum navigation   **no**         yes            yes
 *     select a datum              yes            yes            yes
 *     respects reduced motion     no             opt-out flag   **not optional**
 *
 * ── THE TYPE-LEVEL EVIDENCE FOR EACH "NO" ──────────────────────────────────
 *
 *  1. **First paint is not animatable through the React bindings, at all.**
 *     `renderer.js:91` is `animation: hasRendered ? resolveAnimation(…) :
 *     undefined`, so the SVG host's first render is unconditionally un-animated.
 *     The optional motion renderer has its own gate — `motion.js:243` computes
 *     `initial ? motion.initial && !adoptedRoot : …`, and `adoptedRoot` is
 *     `container.firstElementChild?.matches("svg.ts-chart")`, which
 *     `RendererChart.js` makes true on EVERY mount by writing
 *     `adapter.prerender()` into the container before the layout effect calls
 *     `mount`. Its own doc comment concedes it: "Server-rendered SVG is always
 *     adopted." Measured under jsdom with `svgAnimation: {duration: 1000}`: the
 *     bars paint at their final heights with zero frames scheduled.
 *
 *     Lumo animates the first paint in CSS instead, and `chartMotionStyleSheet`
 *     carries the long argument for why that is the RIGHT answer here and not a
 *     workaround: the served bytes already contain the finished plot — that is
 *     the entire reason this library left recharts — so the only honest enter
 *     animation is one that animates markup which is already correct.
 *
 *  2. **Springs, path morphing and per-datum `motion` are unreachable, and the
 *     reason is an accessible name.** All three live behind
 *     `motion()` from `@tanstack/charts/motion`, which returns a `ChartRenderer`
 *     usable only with `RendererChart` — and `RendererChartCommonProps` in
 *     `react/RendererChart.d.ts` **has no `renderSvg`**. `motion()` hardcodes
 *     `createMotionSvgChartRenderer(driver, renderChartSvgWithResources)` and
 *     exports nothing else, so the renderer cannot be handed a localised
 *     serializer either. Adopting it therefore re-introduces
 *     `aria-roledescription="chart"` — English, spoken on every focus of every
 *     Persian chart, the single defect `chartRenderSvg` exists to close.
 *     VERIFIED, not assumed: rendering `<RendererChart renderer={motion()}>`
 *     emits `aria-roledescription="chart"` in the served markup.
 *
 *     A spring is not worth an English accessible name. The trade is declined,
 *     and `ChartMotionDefinition`/`ChartMotionTiming`/`ChartMotionSpringTransition`
 *     are therefore NOT exposed by this wrapper — exposing a type whose only
 *     consumer we refuse to mount would be documentation for a lie.
 *
 *  3. **There is no `onActiveChange`.** A reader coming from a charting library
 *     that has one will look for it; 0.11.1's callbacks are exactly
 *     `onFocusChange`, `onFocusGroupChange`, `onSelect` and `onRender`
 *     (`react/Chart.d.ts`). Lumo surfaces the first and third as
 *     `onActiveDatum` / `onSelectDatum`, in Lumo's own vocabulary and handing
 *     back the caller's ROW rather than a `ChartPoint`.
 *
 * ── THE ONE PLACE TANSTACK IS AHEAD, AND IT IS THE ONE THAT MATTERS HERE ────
 *
 * **Keyboard.** The plot is `tabindex="0"` and `renderer.js:513` wires a
 * `keydown` handler behind `definition.keyboard !== false`: arrow keys walk the
 * datums, Enter/Space fire `onSelect`, Escape clears. Measured under jsdom —
 * focusin selects the first datum and paints the tooltip, two ArrowRights walk
 * to the third, Enter reports it. recharts has no equivalent; its tooltip is
 * pointer-only. A chart that is a Tab stop and does nothing when you press an
 * arrow key is the defect §13 of DECISIONS.md is about, and this engine does
 * not have it.
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
  /** Per-series labels and colors, keyed by the data's series keys. */
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
  /**
   * Motion. **On by default**, and this is the ONE switch that turns it off.
   *
   * `true` (the default) means: the plot animates in on first paint, staggered
   * per datum, with the grid arriving before the marks and the tick labels
   * after them; and every later change of `data` tweens rather than jumping.
   *
   * `false` means neither happens — the attribute the motion stylesheet is keyed
   * on is written `"off"`, AND `svgAnimation` is stripped from the definition on
   * its way to the renderer. Two mechanisms, one prop, because a caller who
   * turns motion off and gets half of it is worse served than one who has no
   * switch at all.
   *
   * It is NOT how you honour `prefers-reduced-motion`. That needs no prop and
   * cannot be undone by one — see `CHART_MOTION_REDUCED_MOTION_IS_TOTAL`. This
   * prop is for the cases motion is wrong for reasons the OS cannot know: a
   * plot inside a virtualised list that mounts as the reader scrolls, a chart
   * repainting on a socket, a print stylesheet.
   */
  animate?: boolean | undefined;
  /**
   * The ACTIVE datum changed — hover moved to another band, or an arrow key did.
   *
   * Receives the caller's own row, not a `ChartPoint`: `point.datum` is the
   * object that went into the mark, so this hands back the same shape `data`
   * holds, and `undefined` when nothing is active. Named `…Datum` rather than
   * `onActiveChange` for two reasons — 0.11.1 HAS no `onActiveChange` (its
   * callback is `onFocusChange`), and `React.ComponentProps<"div">` already has
   * a real DOM `onSelect`, so a prop called `onSelect` here would be a silent
   * collision with an attribute that lands on the wrapper element.
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
   * `animate={false}` reaches the ENGINE half of motion here, because
   * `svgAnimation` is a field of the definition and the definition is the
   * caller's object. `defineChart` returns a plain object in all five of its
   * overloads (`scene.js:24` — it either returns the argument, wraps a function
   * as `{chart: fn}`, or merges two objects), and host options live at the top
   * level in every one of them, so a shallow copy with one key overwritten is
   * safe for the responsive form too.
   *
   * Copied rather than mutated: the caller may be memoising it, and a wrapper
   * that writes into its own props is a bug that shows up three components away.
   */
  /*
   * ── THIS `useMemo` IS NOT AN OPTIMISATION. IT IS THE ANIMATION. ───────────
   *
   * `chartRenderSvg(locale)` returns a NEW closure on every call, and it used
   * to be called inline in the JSX below — so `renderSvg` had a new identity on
   * every render of this component. Three things followed, and none of them was
   * visible until motion was turned on:
   *
   *  1. `react/Chart.js` does `useMemo(() => createSvgChartRenderer(renderSvg),
   *     [renderSvg])`, so the RENDERER was rebuilt every time too.
   *  2. `renderer.js:594` folds `options.renderer !== nextOptions.renderer` into
   *     `layoutChanged`, and `render(…, layoutChanged ? "layout" : …)` reaches
   *     `resolveAnimation`, whose FIRST line is `if (reason === "layout") return
   *     undefined`. Every update was classified as a layout change, so no data
   *     change could ever animate — `svgAnimation` was inert no matter what it
   *     was set to.
   *  3. Worse than the animation: `renderer.js:68` sees `surface.renderer !==
   *     options.renderer` and DESTROYS the surface, calls
   *     `container.replaceChildren()` and mounts a new one. Every re-render of
   *     this component tore down and rebuilt the entire `<svg>`.
   *
   * MEASURED: with the inline call, a data swap wrote the new bar heights
   * synchronously and scheduled zero animation frames — identical to
   * `animate={false}`. With the memo, the same swap tweens. The revert of this
   * one line is what "passes through the midpoint under a linear curve" in
   * chart.test.tsx fails on.
   */
  const renderSvg = React.useMemo(() => chartRenderSvg(locale), [locale]);

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
          // Required by TanStack's own types. See `label`'s doc comment.
          ariaLabel={label}
          height={height}
          initialWidth={initialWidth}
          /*
           * `point.datum` is the caller's ORIGINAL row — TanStack keeps the
           * object it was given rather than a projection of it, which is the
           * same fact `chartTooltip`'s `format` relies on. So these two hand
           * back a `ChartRow`, and the caller never learns what a `ChartPoint`
           * is. `undefined` when focus or selection is cleared, which happens on
           * pointer-leave and on Escape.
           */
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
          /*
           * The library's own renderer with its one English literal localised.
           * A prop-level fix: `renderSvg` is public and typed, `renderChartSvg`
           * is a public export, and nothing here imports an internal path or
           * patches node_modules. See `chartRenderSvg`.
           */
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

/**
 * The chart's own stylesheet: series colours, and — when `motion` — the
 * first-paint animation.
 *
 * Both halves are scoped by `[data-chart="<id>"]`, so a page with four charts
 * gets four independent sheets and no rule reaches a component that did not ask
 * for one. That does mean the motion block is repeated per chart; it is ~2.8KB
 * of `<style>` each (measured in the built export), it is not graded by `lumo-gate` (`rules.ts` skips `<style>`
 * subtrees entirely), and the alternative — one document-level sheet — has no
 * de-duplication seam in a static export where each island renders alone.
 *
 * `motion={false}` omits the block rather than emitting it and switching it off
 * with the attribute. Both would work; not emitting it means `animate={false}`
 * costs nothing at all in the served bytes, which is what a caller who turned
 * motion off is asking for.
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
  // The CSS text is built in chart.variants.ts, where config keys are filtered
  // against /^[A-Za-z0-9_-]+$/ before they reach a selector or a property name.
  // `id` is built by `ChartContainer` from `React.useId()` or a caller `id` that
  // has already been through the same `data-chart` attribute, and the motion
  // sheet interpolates only that one value.
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
     * ── THE TOOLTIP FOLLOWS THE POINTER, AND THIS ONE WORD IS WHY ────────────
     *
     * `resolveChartTooltipAnchor` (`tooltip-model.js:34`) reads
     * `options?.anchor ?? "point"`, and `"point"` returns `{ x: point.x, y:
     * point.y }` — the DATUM's scene coordinates. Without this option the
     * tooltip is pinned to the top of a bar and never moves while the pointer
     * does.
     *
     * That is only half of it. `renderer.js:422` calls
     * `updateFocus(pointsAtPointer(…), tooltipTracksPointer())`, and
     * `tooltipTracksPointer()` (`renderer.js:819`) is TRUE only when `anchor`
     * is `"pointer"`, a function, or an object naming `"pointer"` on an axis.
     * When it is false, `updateFocus` takes its early return the moment
     * `sameChartPointIdentity(point, focusedPoint)` holds — so no repaint at
     * all is scheduled while the pointer moves inside one datum's catchment.
     * The anchor and the repaint are the same switch; setting either alone
     * fixes nothing.
     *
     * MEASURED, driving the real renderer under jsdom with a stubbed 400×200
     * `getBoundingClientRect` (`chart.test.tsx`, "the tooltip appears AT the
     * pointer"; the docblock here named a `chart-pointer.test.tsx` that was
     * never committed). Two `pointermove`s
     * 140px apart vertically, same band, fa-IR:
     *
     *     without `anchor`   left 341.14px  top 100px   ← both events, identical
     *     with    `anchor`   left 300px     top  30px   then  top 170px
     *
     * en-US measured the same run and was identical apart from the mirrored
     * band, so this was NEVER an RTL defect — it was broken in both directions,
     * which is worth stating because this library's usual finding is the
     * opposite.
     *
     * ── WHY THE FALLBACK IS THE RIGHT ONE, NOT A LEAK ───────────────────────
     *
     * `"pointer"` resolves to `pointer ?? fallback`, and `pointer` is null for
     * a KEYBOARD focus (`renderer.js` nulls `pointerPosition` in
     * `clearKeyboardFocus`). So an arrow-key reader still gets the tooltip on
     * the datum, which is the only place it could sensibly be — there is no
     * cursor to follow. One option covers both input modes.
     *
     * ── AND WHY THIS IS NOT WHAT THE PREVIOUS ATTEMPT FIXED ─────────────────
     *
     * `defineChart`'s `focusGroupX` + `maxFocusDistance: Infinity` (below)
     * decided WHEN a tooltip appears. It did not touch WHERE, and it made the
     * placement defect strictly more visible: with the old 48px radial cap the
     * datum was never more than 48px from the pointer, so the mis-anchoring
     * read as a small offset. Making the whole band live means the pointer can
     * now sit 150px from the datum the tooltip is nailed to.
     */
    anchor: "pointer" as const,
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

/**
 * `defineChart`, with the hit-testing a reader actually expects.
 *
 * ── THE DEFECT, WHICH IS A DEFAULT RATHER THAN A BUG ────────────────────────
 *
 * TanStack hit-tests the pointer by NEAREST POINT, radially, capped at
 * `maxFocusDistance ?? 48` pixels (`renderer.js:764`). So a tooltip appears only
 * within 48px of an actual datum and vanishes the moment the pointer drifts off
 * the line vertically. On a tall plot with a shallow series that is most of the
 * chart area, and it reads as the tooltip being broken rather than as a
 * configured radius.
 *
 * recharts — which this library used until 11 Aug 2026 — does something
 * different: it bisects the x scale across the whole plot band, so anywhere in
 * a column is live and every series at that x is reported together. That is
 * what a reader who has used any dashboard expects, and losing it was a
 * regression the chart migration introduced silently.
 *
 * ── THE FIX IS UPSTREAM'S OWN, IT WAS JUST NEVER TURNED ON ──────────────────
 *
 * `focusGroupX` (`@tanstack/charts/focus`) measures distance on the X AXIS
 * ONLY — `Math.abs(point.x - target)`, y ignored entirely — and groups every
 * series sharing that x. That IS recharts' shared-tooltip behaviour, expressed
 * as a strategy object. Pairing it with `maxFocusDistance: Infinity` makes the
 * whole plot band live, which is the other half of what a band-based hit test
 * means.
 *
 * ── WHY THIS IS A DEFAULT AND NOT DOCUMENTATION ─────────────────────────────
 *
 * Same argument `lumoTableFeatures` makes about TanStack Table's opt-in
 * features: a caller who forgets gets degraded behaviour with NO error, and
 * "remember to pass focus" is a rule that is followed on the first chart and
 * forgotten on the fourth. Both remain ordinary options — pass `focus` or
 * `maxFocusDistance` explicitly and yours wins, because the spread is last.
 *
 * `focusGroupX` and not `focusNearestX`: grouped reports every series at that
 * x, which is the whole value of a shared tooltip on a multi-series chart. The
 * ungrouped variant exists for the single-series case and is one prop away.
 *
 * ── THIS DECIDES *WHEN* A TOOLTIP APPEARS. IT DOES NOT DECIDE *WHERE* ───────
 *
 * Worth stating because the two were confused once, in this file. A reader
 * whose tooltip does not appear at all in the middle of a column wants the
 * options here; a reader whose tooltip appears but stays put while the mouse
 * moves wants `chartTooltip`'s `anchor`. Widening the band without the anchor
 * makes the second symptom WORSE, because the datum the box is nailed to can
 * now be the full height of the plot away from the pointer.
 *
 * ── THE SIGNATURE IS BORROWED, NOT RESTATED ────────────────────────────────
 *
 * `defineChart` carries FIVE overloads — static and responsive, with and
 * without a config object. Typing the wrapper as
 * `Parameters<typeof defineChartBase>[0]` selects only the LAST of them, and
 * the first attempt did exactly that: every responsive chart in the library
 * stopped compiling because `marks` is not a property of the overload it had
 * collapsed to.
 *
 * So the whole signature is borrowed with a cast, for the same reason
 * `useLumoForm` borrows `typeof useForm`: restating an overload set badly is
 * worse than not restating it, because the failure is a caller silently losing
 * the shape they were using. The body genuinely produces what `defineChart`
 * produces, with two defaults merged in ahead of the caller's own.
 */
export const defineChart = ((definition: Record<string, unknown>) => {
  const merged: Record<string, unknown> = {
    focus: focusGroupX,
    // A band hit test has no radius; 48px would re-impose one on the axis the
    // strategy above deliberately stopped measuring.
    maxFocusDistance: Number.POSITIVE_INFINITY,
    ...definition,
  };
  /*
   * ── MOTION IS ON, AND ONE OF ITS TERMS IS NOT THE CALLER'S TO SET ────────
   *
   * `focus` and `maxFocusDistance` sit BEFORE the spread, so a caller's value
   * wins — they are opinions, and the docblock above says so. Motion is handled
   * AFTER it instead, because its default and its one non-negotiable term are
   * the same line and separating them is how they drift apart:
   *
   *   absent / true         → `chartMotion()`. **Motion is on by default**, for
   *                           every chart in the library, with no prop passed.
   *   false                 → stays false. Turning motion OFF is always allowed;
   *                           less motion is never the unsafe direction.
   *   an options object     → `respectReducedMotion` is forced to `true`,
   *                           overwriting a caller's `false`.
   *
   * Upstream already defaults reduced-motion respect to true (`renderer.js:873`,
   * `resolveAnimation`'s `configured.respectReducedMotion ?? true`), which is
   * exactly why the third line is here: a DEFAULT is a promise the next person
   * drops by spreading their own options object over it, and this one is not
   * theirs to drop. `CHART_MOTION_REDUCED_MOTION_IS_TOTAL` names the decision;
   * this is the JS half of enforcing it, and the `@media` block in
   * `chartMotionStyleSheet` is the CSS half.
   *
   * It is deliberately not expressible through `chartMotion()` either — that
   * options type has no `respectReducedMotion` field — so writing it at all
   * means hand-authoring an object, and this line then undoes it.
   */
  merged["svgAnimation"] = chartAnimation(merged["svgAnimation"]);
  return (defineChartBase as (d: unknown) => unknown)(merged);
}) as unknown as typeof defineChartBase;

/* ════════════════════════════════════════════════════════════════════════════
 * MOTION
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The easing curves a Lumo chart's UPDATE animation may use.
 *
 * The five names are `ChartAnimationOptions['easing']`'s own union, and the
 * function form is upstream's too — `reconcile.js`'s `easing(name)` returns
 * `name` unchanged when it is a function, so `(progress) => number` is honoured
 * verbatim. Restated here rather than re-exported because this is the ONE
 * animation type Lumo actually mounts; the motion-renderer types next to it in
 * `dist/types.d.ts` are not, and re-exporting the lot would advertise a spring
 * this wrapper cannot produce.
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
 * What a Lumo chart's `svgAnimation` is. Deliberately not `ChartAnimationOptions`.
 *
 * `respectReducedMotion` is `true` — the literal type, not `boolean` — so a
 * caller who writes `{...chartMotion(), respectReducedMotion: false}` gets a
 * type error at the call site as well as being overwritten at runtime by
 * `defineChart`. `resize` is absent, which is upstream's own switch for "animate
 * when the chart is merely RESIZED": `resolveAnimation` returns undefined for a
 * resize unless `configured.resize === true`, and a plot that re-animates while
 * the reader drags their window is motion nobody asked for.
 */
export interface ChartAnimation {
  duration: number;
  easing: ChartEasing;
  respectReducedMotion: true;
}

/** The default UPDATE duration, in ms. */
export const CHART_MOTION_UPDATE_DURATION = 320;

/**
 * The UPDATE animation, as a definition fragment.
 *
 *     defineChart({ marks: […], x: …, y: …, svgAnimation: chartMotion({ duration: 600 }) })
 *
 * `defineChart` already installs `chartMotion()`, so this is only written when
 * the defaults are not wanted. It is the same shape as `chartTooltip(locale,
 * config)`: a small typed function returning ONE option of the definition
 * object, not a parallel API and not a pass-through.
 *
 * ── WHAT IT ANIMATES, MEASURED ──────────────────────────────────────────────
 *
 * `reconcile.js` interpolates a fixed set of SVG attributes — `d`, `height`,
 * `width`, `x`, `y`, `cx`, `cy`, `r`, `opacity`, `transform` and seven more —
 * between the previous scene's markup and the next. So a bar's height tweens, a
 * line's `d` tweens, and an element with no counterpart in the other scene gets
 * an opacity ENTER or EXIT tween instead (`addEnterTween`/`addExitTween`), with
 * the exiting node removed only when its tween finishes.
 *
 * Driven under jsdom with a stubbed `requestAnimationFrame` and
 * `{duration: 1000, easing: "linear"}`, 1200→300 on the first bar:
 *
 *     frame 0ms      height 67        ← the OLD value; the tween has not run
 *     frame 500ms    height 43.48     ← exactly the midpoint of 67 and 19.96
 *     frame 1000ms   height 19.96     ← the new value, exactly, and no frame left
 *
 * and with `easing: (p) => p * p`, the same 500ms frame reads 55.24 — which is
 * 67 + (19.96 − 67) × 0.25. The custom easing is not decorative.
 */
export function chartMotion(options?: ChartMotionOptions): ChartAnimation {
  return {
    duration: options?.duration ?? CHART_MOTION_UPDATE_DURATION,
    easing: options?.easing ?? "ease-out",
    respectReducedMotion: true,
  };
}

/**
 * The default AND the pin, in one function — see the long note in `defineChart`.
 *
 * One function rather than a default in the object literal plus a separate
 * normaliser, because the literal's default would be dead code: this already
 * turns `undefined` into `chartMotion()`, so a second default is a line that can
 * be deleted with no test going red. Verified by deleting it.
 */
function chartAnimation(value: unknown): unknown {
  if (value === false) return false;
  if (value === true || value === undefined || value === null) return chartMotion();
  if (typeof value !== "object") return chartMotion();
  return { ...(value as Record<string, unknown>), respectReducedMotion: true };
}
