import { cva } from "class-variance-authority";
import { renderChartSvg } from "@tanstack/charts/svg";
import { direction, formatNumber, type Direction, type Locale, type LumoNode } from "@lumo-ui/core";
import type { ComponentType } from "react";

/**
 * Chart's class definitions, its theme stylesheet builder, and — now — the
 * whole CHART SPECIFICATION, in a module with NO `"use client"`.
 *
 * This module carried the direction arithmetic before, for `button.variants.ts`'s
 * reason. It carries much more of the component after the renderer change, and
 * that is the single most important structural consequence of moving to
 * `@tanstack/charts`:
 *
 *   **recharts' axes were CHILD ELEMENTS of a client component. TanStack's are
 *   values in a plain object.** So the thing that decides which way a scale
 *   runs, where a tick label anchors and how a number is formatted is now data
 *   a SERVER component can build, hand to the client island, and — because the
 *   island server-renders — see in the output it produced.
 *
 * That is why `chartCategoryAxis` and `chartValueAxis` are functions here rather
 * than components in `chart.tsx`. See the API-change note in that file.
 *
 * ═══ WHAT WAS MEASURED ABOUT `@tanstack/charts` 0.9.0 ═══════════════════════
 *
 * Full harness output in `experiments/measurements/tanstack-charts.json`; the
 * numbers that decided the switch and the four that constrain this file:
 *
 *  1. **It SERVES A PLOT.** `renderToStaticMarkup` of a 400×200 bar chart is
 *     4,717 bytes with a real `<svg>`, 7 `<text>` nodes and 13 Persian digits.
 *     recharts, measured in the same harness on the same day, is 127 bytes and
 *     no `<svg>` at all — in ANY configuration, including a fixed size with no
 *     wrapper. That is the whole reason for the change: `lumo-gate` grades the
 *     SERVED HTML, so under recharts the most number-dense component in the
 *     library was structurally invisible to it. Graded with the gate's own
 *     rules, a deliberately broken TanStack chart (Latin axis) scores five
 *     violations; a deliberately broken recharts chart scores **zero**, because
 *     there is nothing in the bytes to grade.
 *
 *  2. **Tick formatters run on the server.** `Intl` is a function like any
 *     other; `renderToStaticMarkup` calls it. `۰ ۱٬۰۰۰ ۲٬۰۰۰ ۳٬۰۰۰` in the
 *     first byte, versus `0 1000 2000 3000` without the formatter.
 *
 *  3. **The category scale does not mirror on its own, and the lever is
 *     `x.reverse`.** Measured bar positions: `67, 149.25, 231.5, 313.75` LTR;
 *     `300, 204, 108, 12` with the lever; and WITHOUT the lever under RTL,
 *     identical to LTR. `reverse` acts on the scale's range, so bars, lines,
 *     areas, dots and the grid all mirror with it.
 *
 *  4. **Tick text does not anchor on its own, and the lever is
 *     `axis.tickLabels.anchor`.** Measured: `end` in LTR, `start` under RTL with
 *     the lever, and `end` without it — i.e. the label runs INTO the plot.
 *
 * ═══ THE ONE THING NO LEVER REACHES ═════════════════════════════════════════
 *
 * **The value axis cannot be moved to the trailing edge.** In LTR it is drawn at
 * the physical left, which is the leading edge and correct. Under RTL the
 * leading edge is the right, and there is no option to put it there: measured,
 * the value labels sit at x = 4 in both directions.
 *
 * This is not a lever that was missed. `ChartAxisPresentationOptions` in the
 * installed `dist/types.d.ts` declares exactly `line`, `ticks`, `tickLabels`,
 * `label` and `motion` — there is no `orient`, `side`, `position` or `placement`
 * field anywhere in the axis types, and a grep for those names over the whole
 * type surface returns nothing. recharts had `orientation="right"`; TanStack
 * has no equivalent at 0.9.0.
 *
 * **How it is handled, in four parts, none of which pretends it is fixed:**
 *
 *   1. `CHART_VALUE_AXIS_TRAILING_EDGE` below is a single named constant set to
 *      `false`, with `chartValueAxis` reading it. When upstream adds the option,
 *      exactly one line changes and the tests that pin the current behaviour go
 *      red on purpose. A gap spread across a wrapper is a gap nobody can close.
 *   2. The reachable half IS applied: `tickLabels.anchor` is set to `"start"`
 *      under RTL so the labels read AWAY from the plot rather than across it.
 *      A misplaced axis whose labels also overlap the bars is two defects.
 *   3. The INFORMATION is not lost, because `<ChartData>` carries every figure
 *      in a real `<table>`, in reading order, in the served bytes. That
 *      component was introduced when recharts served no plot at all; it is
 *      still the only thing that carries the DATA rather than the ticks, and it
 *      is now also the mitigation for this.
 *   4. It is a layout defect and not an accessibility one, which is why it is
 *      shipped rather than blocking. A Persian reader meets the value scale on
 *      the far side of the plot: unfamiliar, legible, and identical for every
 *      series. Contrast criterion 3, where the failure is text drawn over data.
 *
 * ═══ AND ONE ENGLISH STRING, WHICH IS REACHABLE ═════════════════════════════
 *
 * `svg-renderer.js:19` builds the root element with a hardcoded
 * `aria-roledescription="chart"` inside a template literal. It is not a prop —
 * but `renderSvg` IS a public, typed prop, `(scene, options) => string`, and
 * `renderChartSvg` is a public export. So `chartRenderSvg(locale)` below wraps
 * the library's own renderer and replaces the one literal.
 *
 * That is the difference between this and `@visx/xychart`'s
 * `aria-label="XYChart"`, which ROADMAP.md records as unfixable: same defect,
 * and this one has an escape hatch.
 */

/**
 * A chart's series metadata.
 *
 * `label` is REQUIRED, a deliberate tightening of upstream's optional one.
 * Without it a legend renders an empty swatch and a tooltip falls back to the
 * series key — an English identifier like `desktop` or `revenue`. A legend of
 * English dataKeys on a Persian dashboard is rule 2's defect wearing a chart's
 * clothes, and the only place it can be stopped is here, where the author is
 * already writing the series out by hand.
 *
 * `LumoNode` rather than `string` because a legend entry is visible text and may
 * legitimately be an element; it excludes a bare `number` for the usual reason.
 */
export type ChartConfig = Record<
  string,
  {
    label: LumoNode;
    icon?: ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<"light" | "dark", string> }
  )
>;

/**
 * The container.
 *
 * ── EVERY RECHARTS SELECTOR IN HERE IS GONE, AND THAT IS A REAL SAVING ──────
 *
 * The old value was thirteen `[&_.recharts-*]` escape hatches — restyling
 * another library's internal class names, which is the API recharts offers for
 * theming and is also a promise nobody made. TanStack emits `ts-chart__*` class
 * names AND, measured, `font-family: inherit` everywhere, so Vazirmatn is not
 * overridden — the defect that disqualified victory and MUI's legend in the
 * seven-library round. Two selectors replace thirteen, and both are colour.
 */
export const chartContainerVariants = cva(
  "flex aspect-video justify-center text-xs " +
    "[&_.ts-chart__grid]:text-border/50 " +
    "[&_.ts-chart__axis]:text-fg-muted",
);

export const chartTooltipVariants = cva(
  "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 " +
    "bg-surface px-2.5 py-1.5 text-xs text-fg shadow-xl",
);

/**
 * The little colour chip beside a tooltip or legend row.
 *
 * The custom property is `--lumo-chart-swatch`, not `--color-bg` /
 * `--color-border`. Those two names are Tailwind v4 THEME variables in this
 * workspace — `theme.css` defines `--color-bg` as `var(--lumo-sys-bg)` — so
 * setting them inline would shadow the design tokens for that element and
 * everything under it, and a `border-border` anywhere inside would resolve to a
 * series colour. Upstream gets away with it because its token names differ;
 * Lumo's collide exactly.
 */
export const chartTooltipIndicatorVariants = cva(
  "shrink-0 rounded-[2px] border-(--lumo-chart-swatch) bg-(--lumo-chart-swatch)",
  {
    variants: {
      indicator: {
        dot: "h-2.5 w-2.5",
        line: "w-1",
        dashed: "w-0 border-[1.5px] border-dashed bg-transparent",
      },
      nested: { true: "", false: "" },
    },
    compoundVariants: [{ indicator: "dashed", nested: true, class: "my-0.5" }],
    defaultVariants: { indicator: "dot", nested: false },
  },
);

/**
 * The legend row.
 *
 * `flex` and nothing else on the inline axis: a flex row follows the resolved
 * `direction`, so the series order mirrors itself under `dir="rtl"` with no
 * class to remember. Lumo renders its own legend for the same reason it did
 * under recharts — a library legend is a box of physical margins and
 * library-authored `aria-label`s — and the reason survived the renderer change
 * unaltered.
 */
export const chartLegendVariants = cva("flex items-center justify-center gap-4", {
  variants: {
    verticalAlign: { top: "pb-3", bottom: "pt-3", middle: "" },
  },
  defaultVariants: { verticalAlign: "bottom" },
});

export const chartLegendItemVariants = cva(
  "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-fg-muted",
);

/**
 * The custom property a series colour is published under.
 *
 * Namespaced `--lumo-chart-*` rather than `--color-*` for the reason
 * `chartTooltipIndicatorVariants` documents: `--color-*` is Tailwind v4's theme
 * namespace here, and a config key called `bg`, `fg`, `border` or `accent`
 * would silently repaint every token-styled element inside the chart.
 */
export function chartColorVar(key: string): string {
  return `--lumo-chart-${key}`;
}

/** `var(--lumo-chart-<key>)`, for a mark's `fill` or `stroke`. */
export function chartColor(key: string): string {
  return `var(${chartColorVar(key)})`;
}

/**
 * Config keys reach a `<style>` element through `dangerouslySetInnerHTML`, so
 * they are restricted to characters that cannot terminate a declaration or a
 * rule. A key containing `}` there is a stylesheet-injection primitive, and
 * config often comes from an API response.
 */
const SAFE_KEY = /^[A-Za-z0-9_-]+$/;

/**
 * Builds the per-chart colour stylesheet.
 *
 * Lumo's theme has THREE states, not two — `tokens.css` defines light on bare
 * `:root`, dark under `@media (prefers-color-scheme: dark)
 * :root:not([data-theme="light"])`, and dark again under `[data-theme="dark"]`
 * so an explicit choice wins in both directions. A `.dark` selector matches
 * nothing in this system.
 */
export function chartStyleSheet(id: string, config: ChartConfig): string {
  const entries = Object.entries(config).filter(
    ([key, item]) => SAFE_KEY.test(key) && (item.theme ?? item.color),
  );
  if (entries.length === 0) return "";

  const declarations = (theme: "light" | "dark") =>
    entries
      .map(([key, item]) => {
        const color = item.theme?.[theme] ?? item.color;
        return color ? `  ${chartColorVar(key)}: ${color};` : "";
      })
      .filter(Boolean)
      .join("\n");

  const scope = `[data-chart="${id}"]`;
  const dark = declarations("dark");

  return (
    `${scope} {\n${declarations("light")}\n}\n` +
    `@media (prefers-color-scheme: dark) {\n` +
    `  :root:not([data-theme="light"]) ${scope} {\n${dark}\n  }\n}\n` +
    `[data-theme="dark"] ${scope} {\n${dark}\n}\n`
  );
}

/**
 * The tick formatter every numeric axis needs.
 *
 * Numbers go through `formatNumber`; anything else is left alone, because a
 * category axis's ticks are already authored strings and re-formatting them
 * would be wrong. A non-finite value renders as the empty string rather than
 * "NaN", which is an English word in a Persian document.
 *
 * Unchanged from the recharts era, and that is worth noting: this function was
 * never about recharts. It is about the fact that a chart library builds its own
 * `<text>` nodes from a scale domain, so `LumoNode` cannot reach them and a
 * formatter is the only seam. Every renderer has that property.
 */
export function chartTickFormatter(
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): (value: unknown) => string {
  return (value: unknown) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? formatNumber(value, locale, options) : "";
    }
    return value == null ? "" : String(value);
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * DIRECTION
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * **The one RTL criterion `@tanstack/charts` 0.9.0 cannot meet.** See the long
 * note in this file's header for the evidence and for the four-part handling.
 *
 * A named constant rather than an inline `false`, so the day upstream ships an
 * axis-side option this is the single line that changes — and so a reader who
 * greps for why a Persian chart's value axis is on the wrong side finds a name
 * rather than an absence.
 */
export const CHART_VALUE_AXIS_TRAILING_EDGE = false as const;

export interface ChartAxisMirror {
  /** `reverse` on the axis that carries the CATEGORIES. */
  reverse?: boolean;
  /** `axis.tickLabels.anchor` on the axis that carries the VALUES. */
  tickLabelAnchor: "start" | "middle" | "end";
}

export interface ChartMirror {
  /** Derived from the locale via `Intl.Locale.getTextInfo()`. Never passed in. */
  direction: Direction;
  /** Spread into the category axis's options object. */
  categoryAxis: { reverse?: boolean };
  /** The anchor the value axis's tick labels take. */
  valueTickAnchor: "start" | "end";
  /**
   * Whether the value axis sits at the trailing edge, as it should under RTL.
   * Always `false` at this version — see `CHART_VALUE_AXIS_TRAILING_EDGE`.
   */
  valueAxisAtTrailingEdge: boolean;
}

/**
 * Everything the chart spec needs told about direction, derived from the locale.
 *
 * There is no `dir` argument, for the reason `LumoProvider` gives at length: a
 * wrong direction should be unrepresentable rather than discouraged.
 *
 * Under LTR every field is the identity — `reverse` absent, anchor `"end"` —
 * so the mirrored path and the plain path are the same code, which is the only
 * arrangement in which the mirrored one stays working.
 */
export function chartMirror(locale: Locale): ChartMirror {
  const dir = direction(locale);
  const rtl = dir === "rtl";

  return {
    direction: dir,
    categoryAxis: rtl ? { reverse: true } : {},
    // Measured: TanStack computes `end` in LTR and keeps computing `end` under
    // RTL, which runs the label INTO the plot. Stating it explicitly is the fix;
    // moving the axis, which would be the other fix, is not available.
    valueTickAnchor: rtl ? "start" : "end",
    valueAxisAtTrailingEdge: CHART_VALUE_AXIS_TRAILING_EDGE,
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE AXES, AS SPEC FRAGMENTS
 *
 * These were COMPONENTS under recharts (`<ChartCategoryAxis />`). They are
 * builders now, because TanStack's axes are values in a definition object
 * rather than children of a chart element. The API change is recorded in
 * chart.tsx; the gain is that a server component can build the whole spec.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** A scale factory or instance, passed straight through to TanStack. */
export interface ChartAxisSpecOptions {
  /** The scale. `scaleBand`/`scalePoint` for categories, `scaleLinear` for values. */
  scale: unknown;
  /** `Intl.NumberFormat` options for numeric ticks. */
  numberFormat?: Intl.NumberFormatOptions | undefined;
  /** Draw grid lines from this axis's ticks. */
  grid?: boolean | undefined;
  /** Round the inferred domain outward. */
  nice?: boolean | undefined;
}

/**
 * The axis that carries the CATEGORIES.
 *
 * Under RTL the scale reverses, so the first category sits at the reading
 * start — and because `reverse` acts on the scale's RANGE, the bars, the line,
 * the area, the dots and the grid mirror with it. There is no second thing to
 * remember, which is the same property recharts' `reversed` had and the reason
 * both libraries only need one lever here.
 *
 * Ticks go through `chartTickFormatter` even though a category is usually a
 * string: the formatter passes strings through untouched and catches the case
 * that is actually dangerous — a NUMERIC category, e.g. a year, which would
 * otherwise print `2026` on a Persian page.
 */
export function chartCategoryAxis(locale: Locale, options: ChartAxisSpecOptions) {
  const mirror = chartMirror(locale);
  const format = chartTickFormatter(locale, options.numberFormat);
  return {
    scale: options.scale,
    ...mirror.categoryAxis,
    ...(options.nice === undefined ? {} : { nice: options.nice }),
    ...(options.grid === undefined ? {} : { grid: options.grid }),
    axis: {
      ticks: { format },
      // Categories sit UNDER their band, so the label is centred in both
      // directions and this is deliberately not mirrored.
      tickLabels: { anchor: "middle" as const },
    },
  };
}

/**
 * The axis that carries the VALUES.
 *
 * Its ticks are ALWAYS numbers, which is why the formatter is not optional in
 * practice: it is the only thing that reaches the `<text>` TanStack builds from
 * the scale domain.
 *
 * `anchor` is the mirrored half. The axis's SIDE is the half no lever reaches —
 * see the file header.
 */
export function chartValueAxis(locale: Locale, options: ChartAxisSpecOptions) {
  const mirror = chartMirror(locale);
  const format = chartTickFormatter(locale, options.numberFormat);
  return {
    scale: options.scale,
    nice: options.nice ?? true,
    ...(options.grid === undefined ? {} : { grid: options.grid }),
    axis: {
      ticks: { format },
      tickLabels: { anchor: mirror.valueTickAnchor },
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE ONE ENGLISH STRING
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The exact literal `@tanstack/charts` 0.9.0 writes into its root `<svg>`.
 *
 * `svg-renderer.js:19`, inside a template literal, after the class and before
 * `aria-label`. Kept as a named constant so the conformance test can assert
 * that BARE TanStack still emits it — the poison-twin discipline
 * `@lumo-ui/base-ui-ssr` uses. If that assertion goes red, upstream has changed
 * the string and `chartRenderSvg` is silently doing nothing.
 */
export const TANSTACK_ROLE_DESCRIPTION = 'aria-roledescription="chart"';

/**
 * The Persian and English words for what a chart IS.
 *
 * `aria-roledescription` replaces the role a screen reader announces, so this is
 * spoken on every focus of every chart. It is engine vocabulary, not consumer
 * content — «نمودار» is the same word in every application — so it lives in a
 * `Record<Locale, …>` here rather than being a required prop, on exactly the
 * argument `@lumo-ui/base-ui-ssr`'s catalogue header makes for Base UI's seven.
 *
 * `satisfies Record<Locale, string>` makes a new locale a compile error here.
 */
export const CHART_ROLE_DESCRIPTION = {
  "fa-IR": "نمودار",
  "en-US": "chart",
} satisfies Record<Locale, string>;

/**
 * TanStack's own SVG renderer, with its one English literal localised.
 *
 * Pass as the `renderSvg` prop. `renderChartSvg` is a public export and
 * `renderSvg` is a public typed prop, so this is a prop-level fix with no
 * patch, no fork and no internal import — the same bar `@lumo-ui/base-ui-ssr`
 * holds itself to.
 *
 * A string replacement on markup is a blunt instrument and it is bounded on
 * purpose: ONE occurrence, of a full `attribute="value"` pair, on the root
 * element the renderer builds two lines above. `String.replace` with a string
 * pattern replaces only the first match, which is the one we want; the same
 * attribute cannot legitimately appear earlier in the output because the root
 * element IS the output's first tag.
 *
 * `en-US` goes through this path too and lands on the same word TanStack would
 * have emitted. That is deliberate: if English fell through to the library
 * default, the Persian branch would be the only one exercised and a regression
 * in the wiring would show up in exactly one locale.
 */
export function chartRenderSvg(locale: Locale) {
  const replacement = `aria-roledescription="${CHART_ROLE_DESCRIPTION[locale]}"`;
  return (scene: never, options: never): string =>
    renderChartSvg(scene, options).replace(TANSTACK_ROLE_DESCRIPTION, replacement);
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE PIE'S SWEEP — NOW A CONFIRMATION RATHER THAN AN OVERRIDE
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ═══ THE PIE'S SWEEP DOES NOT MIRROR. THIS IS A DECISION, NOT AN OVERSIGHT ═══
 *
 * **And under TanStack it is also, measured, the default.** The harness rendered
 * a four-sector pie under both directions and the four `<path d="…">` strings
 * are BYTE-IDENTICAL, starting at 0 rad at 12 o'clock and winding clockwise —
 * which is exactly what `CHART_PIE_SWEEP` encodes. Under recharts these
 * constants were an override of a wrong default (`startAngle: 0`, i.e. 3
 * o'clock, sweeping counter-clockwise). They are now a statement of a decision
 * that the renderer happens to agree with, and they are kept for that reason:
 * a convention that is only true because a dependency's default is true is a
 * convention that changes in a patch release.
 *
 * The reasoning, because the opposite choice is the intuitive one:
 *
 *  1. **A pie's sweep is not layout.** Everything else this file mirrors is a
 *     position along the INLINE axis — a scale's range, a tick anchor. Those
 *     mirror because reading order runs along that axis. A pie has no inline
 *     axis; its sectors are ordered by ANGLE around a centre, and angle has no
 *     reading order to agree with.
 *
 *  2. **Two mirror-imaged pies of the same data read as different data.** This
 *     is the decisive one. Mirror a bar chart and every bar keeps its height —
 *     the quantity survives the flip, only its position moves. Mirror a pie and
 *     each sector keeps its area but changes its NEIGHBOURS and its side. Put a
 *     Persian dashboard and its English translation side by side and a reader
 *     comparing them sees two different pictures of one dataset, with nothing in
 *     either one saying which is the mirror.
 *
 *  3. **Clocks do not mirror.** Persian, Arabic and Hebrew documents all render
 *     analogue clocks running clockwise, and Persian gauges and progress rings
 *     do the same. (Contrast the linear progress bar, which DOES fill from the
 *     inline start, because that one is a line and lines are read.)
 *
 *  4. **What mirrors instead is everything textual around it.** The legend is a
 *     flex row and follows `direction` for free; `<ChartData>`'s table is a real
 *     RTL table. The Persian reader gets the sequence in reading order where
 *     sequence is meaningful — in the words — and the same picture as everyone
 *     else where it is not.
 */
export interface ChartPieSweep {
  /** Degrees, counter-clockwise from 3 o'clock — so 90 is the top. */
  startAngle: number;
  /** 360° later, going clockwise. */
  endAngle: number;
}

/** The one winding every Lumo pie and donut uses, in every locale. */
export const CHART_PIE_SWEEP: ChartPieSweep = { startAngle: 90, endAngle: -270 };

/**
 * A half pie — the gauge shape — on the same convention: it starts at 9 o'clock
 * and sweeps clockwise through 12 to 3. Same argument as the full turn.
 */
export const CHART_PIE_SWEEP_HALF: ChartPieSweep = { startAngle: 180, endAngle: 0 };

/**
 * The class a pie/donut centre label sits in.
 *
 * The centre of a donut is the one place in a chart where Lumo puts real text
 * inside the plot, so it is the one place a `font-variant-numeric` or a physical
 * text alignment could sneak into an SVG. This carries colour and weight only.
 */
export const chartPieCenterVariants = cva("select-none", {
  variants: {
    tone: {
      value: "fill-fg text-2xl font-semibold",
      caption: "fill-fg-muted text-xs font-normal",
    },
  },
  defaultVariants: { tone: "value" },
});
