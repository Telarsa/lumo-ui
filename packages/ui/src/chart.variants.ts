import { cva } from "class-variance-authority";
import { renderChartSvg } from "@tanstack/charts/svg";
import { direction, formatNumber, type Direction, type Locale, type LumoNode, type LumoStrings } from "@lumo-ui/core";
import type { ComponentType } from "react";

/**
 * Chart's class definitions, theme stylesheet builder and the whole CHART
 * SPECIFICATION (axes, mirroring, tick formatting) in a module with NO
 * `"use client"`, so a server component can build the spec and hand it to the
 * client island. TanStack's axes are values in a plain object, not children.
 *
 * Measured at 0.11.1 (record in `docs/history/base-ui-migration/`): the
 * plot is in the served bytes; tick formatters run on the server; the category
 * scale mirrors via `x.reverse`; tick text anchors via `axis.tickLabels.anchor`.
 * The value axis CANNOT be moved to the trailing edge (no `orient`/`side`
 * option exists) — see `CHART_VALUE_AXIS_TRAILING_EDGE`. The one English
 * string, `aria-roledescription="chart"`, is reachable through `renderSvg` —
 * see `chartRenderSvg`. Long form: docs/decisions/log.md, docs/i18n-and-rtl.md.
 */

/**
 * A chart's series metadata. `label` is REQUIRED (tighter than upstream): without
 * it a legend/tooltip falls back to the English series key. `LumoNode`, not
 * `string`, because a legend entry is visible text and may be an element.
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
 * The container. Two colour selectors on TanStack's `ts-chart__*` classes replace
 * thirteen recharts escape hatches; `font-family: inherit` upstream keeps Vazirmatn.
 */
export const chartContainerVariants = cva(
  // No `aspect-video`: the renderer already receives an explicit height, and the
  // aspect ratio turned it into a minimum width that broke phone viewports.
  "flex w-full min-w-0 justify-center text-xs " +
    "[&_.ts-chart__grid]:text-border/50 " +
    "[&_.ts-chart__axis]:text-fg-muted",
);

export const chartTooltipVariants = cva(
  "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 " +
    "bg-surface px-2.5 py-1.5 text-xs text-fg shadow-overlay",
);

/**
 * The little colour chip beside a tooltip or legend row. The custom property is
 * `--lumo-chart-swatch`, NOT `--color-bg`/`--color-border`: those are Tailwind v4
 * theme variables here, and setting them inline would shadow the design tokens.
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
 * The legend row. `flex` on the inline axis so the series order mirrors from the
 * resolved `direction` with no class to remember.
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
 * The custom property a series colour is published under. Namespaced
 * `--lumo-chart-*` rather than `--color-*`, which is Tailwind v4's theme namespace.
 */
export function chartColorVar(key: string): string {
  return `--lumo-chart-${key}`;
}

/** `var(--lumo-chart-<key>)`, for a mark's `fill` or `stroke`. */
export function chartColor(key: string): string {
  return `var(${chartColorVar(key)})`;
}

// Config keys reach a `<style>` via `dangerouslySetInnerHTML`; a key containing `}`
// would be a stylesheet-injection primitive, and config often comes from an API.
const SAFE_KEY = /^[A-Za-z0-9_-]+$/;

/**
 * Builds the per-chart colour stylesheet. Lumo's theme has THREE states (bare
 * `:root`, `prefers-color-scheme: dark` guarded by `:not([data-theme="light"])`,
 * and `[data-theme="dark"]`); a `.dark` selector matches nothing here.
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
 * The tick formatter every numeric axis needs: numbers go through `formatNumber`,
 * strings pass untouched, non-finite renders as "" rather than "NaN". A chart
 * library builds its own `<text>` from a scale domain, so this is the only seam.
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

/**
 * The one RTL criterion `@tanstack/charts` 0.11.1 cannot meet: the value axis
 * cannot sit at the trailing edge. A named constant so the day upstream ships an
 * axis-side option this is the single line that changes.
 */
export const CHART_VALUE_AXIS_TRAILING_EDGE = false as const;

export interface ChartAxisMirror {
  /** `reverse` on the axis that carries the CATEGORIES. */
  reverse?: boolean;
  /** `axis.tickLabels.anchor` on the axis that carries the VALUES. */
  tickLabelAnchor: "start" | "middle" | "end";
}

export interface ChartMirror {
  /** Derived from the closed locale contract. Never passed in. */
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
 */
export function chartMirror(locale: Locale): ChartMirror {
  const dir = direction(locale);
  const rtl = dir === "rtl";

  return {
    direction: dir,
    categoryAxis: rtl ? { reverse: true } : {},
    // Measured: TanStack keeps computing `end` under RTL, which runs the label INTO
    // the plot. Stating it explicitly is the fix; moving the axis is not available.
    valueTickAnchor: rtl ? "start" : "end",
    valueAxisAtTrailingEdge: CHART_VALUE_AXIS_TRAILING_EDGE,
  };
}

// The axes, as spec fragments: builders rather than components because TanStack's
// axes are values in a definition object, so a server component can build them.

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
 * The axis that carries the CATEGORIES. Under RTL the scale reverses (`reverse`
 * acts on the RANGE, so bars, lines, dots and grid mirror with it). Ticks still go
 * through `chartTickFormatter` to catch a NUMERIC category such as a year.
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
      // Categories sit UNDER their band: centred in both directions, deliberately not mirrored.
      tickLabels: { anchor: "middle" as const },
    },
  };
}

/**
 * The axis that carries the VALUES. Ticks are always numbers, so the formatter is
 * the only thing reaching TanStack's `<text>`. `anchor` is the mirrored half; the
 * axis's SIDE is the half no lever reaches — see the file header.
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

/**
 * The exact literal `@tanstack/charts` 0.11.1 writes into its root `<svg>`.
 * Named so the conformance test can assert BARE TanStack still emits it (the
 * poison-twin discipline `@lumo-ui/base-ui-ssr` uses); if that goes red,
 * upstream changed the string and `chartRenderSvg` is silently doing nothing.
 */
export const TANSTACK_ROLE_DESCRIPTION = 'aria-roledescription="chart"';

/**
 * TanStack's own SVG renderer, with its one English literal localised. Pass as the
 * `renderSvg` prop — a prop-level fix, no patch, no fork. ONE bounded replacement on
 * the root element; `en-US` goes through the same path so every locale exercises it.
 * `strings` is `LumoStrings["chart"]` — the word for what a chart IS, spoken on every
 * focus via `aria-roledescription`: engine vocabulary, so not a required prop, but no
 * table here either. `ChartContainer` resolves it with `useLumoStringsFor(locale)`
 * (built-in, or the app's own for a language Lumo does not carry) and hands it in;
 * this module stays hook-free so a server component may call it.
 */
export function chartRenderSvg(strings: LumoStrings["chart"]) {
  const replacement = `aria-roledescription="${strings.roleDescription}"`;
  return (scene: never, options: never): string =>
    renderChartSvg(scene, options).replace(TANSTACK_ROLE_DESCRIPTION, replacement);
}

/**
 * THE PIE'S SWEEP DOES NOT MIRROR — a decision, not an oversight, and at TanStack
 * also the measured default (sector paths are byte-identical in both directions).
 * A pie has no inline axis; two mirror-imaged pies of the same data read as
 * different data; clocks do not mirror. What mirrors is the text around it (legend,
 * `<ChartData>`). Kept as constants so the convention outlives a dependency default.
 */
export interface ChartPieSweep {
  /** Degrees, counter-clockwise from 3 o'clock — so 90 is the top. */
  startAngle: number;
  /** 360° later, going clockwise. */
  endAngle: number;
}

/** The one winding every Lumo pie and donut uses, in every locale. */
export const CHART_PIE_SWEEP: ChartPieSweep = { startAngle: 90, endAngle: -270 };

/** A half pie — the gauge shape — on the same convention: 9 o'clock clockwise through 12 to 3. */
export const CHART_PIE_SWEEP_HALF: ChartPieSweep = { startAngle: 180, endAngle: 0 };

/**
 * The class a pie/donut centre label sits in: colour and weight only, since it is
 * the one place Lumo puts real text inside the plot.
 */
export const chartPieCenterVariants = cva("select-none", {
  variants: {
    // `slot`, not `tone`: `value` and `caption` are the two TEXT ROLES a donut centre has.
    slot: {
      value: "fill-fg text-2xl font-semibold",
      caption: "fill-fg-muted text-xs font-normal",
    },
  },
  defaultVariants: { slot: "value" },
});

/**
 * The FIRST-PAINT animation, as a stylesheet — CSS, not `svgAnimation`.
 *
 * `@tanstack/charts` 0.11.1 never animates a first paint (`renderer.js` gates on
 * `hasRendered`; the motion renderer treats server markup as always adopted), and
 * that refusal is right: the served bytes already contain the finished plot, which
 * is why this library chose the renderer. CSS animates the PRESENTATION of markup
 * that is already final, so served bytes are byte-identical with motion on and off.
 * The cascade also buys stagger (`:nth-child`), per-part curves and a reduced-motion
 * media query no caller can bypass. There is no spring in a Lumo chart.
 */

/** Enter duration for the marks themselves, in ms. */
export const CHART_MOTION_MARK_DURATION = 460;
/** Per-datum delay, in ms. `:nth-child(n)` × this. */
export const CHART_MOTION_STAGGER = 45;
/** How many `:nth-child()` rules are emitted; past this every datum shares the last delay. */
export const CHART_MOTION_STAGGER_STEPS = 12;
/** Grid and tick-label duration, in ms. Deliberately not the marks' duration. */
export const CHART_MOTION_GUIDE_DURATION = 300;

/** The attribute the motion stylesheet is keyed on. `off` is a thing the markup SAYS. */
export const CHART_MOTION_ATTRIBUTE = "data-lumo-chart-motion";

/**
 * Under `prefers-reduced-motion: reduce`, a Lumo chart has NO motion at all — the
 * final state, immediately, on both paths. The CSS half is the `@media` block in
 * `chartMotionStyleSheet`; the JS half is `respectReducedMotion: true` pinned by `defineChart`.
 */
export const CHART_MOTION_REDUCED_MOTION_IS_TOTAL = true as const;

/**
 * Builds the per-chart motion stylesheet, scoped by `[data-chart]` like `chartStyleSheet`.
 * Transforms are BLOCK-AXIS ONLY (`scaleY`/`translateY`): CSS transforms have no logical
 * form, so an X transform would be a physical direction baked into a mirroring library.
 * `transform-box: fill-box` makes `transform-origin: 50% 100%` mean the bottom of the rect.
 */
export function chartMotionStyleSheet(id: string): string {
  const scope = `[data-chart="${id}"][${CHART_MOTION_ATTRIBUTE}="on"]`;
  const marks = `${scope} .ts-chart__marks > g > *`;
  const grid = `${scope} .ts-chart__grid > *`;
  const guides = `${scope} .ts-chart__axes > *`;

  const stagger = Array.from({ length: CHART_MOTION_STAGGER_STEPS }, (_, index) => {
    const nth = index + 1;
    // The last rule is `:nth-child(n + STEPS)` so later datums share the last delay.
    const selector =
      nth === CHART_MOTION_STAGGER_STEPS
        ? `${marks}:nth-child(n + ${nth})`
        : `${marks}:nth-child(${nth})`;
    return `${selector} { animation-delay: ${index * CHART_MOTION_STAGGER}ms; }`;
  }).join("\n");

  return (
    `@keyframes lumo-chart-mark-enter {\n` +
    `  from { opacity: 0; transform: scaleY(0); }\n` +
    `  to { opacity: 1; transform: scaleY(1); }\n` +
    `}\n` +
    `@keyframes lumo-chart-guide-enter {\n` +
    `  from { opacity: 0; transform: translateY(6px); }\n` +
    `  to { opacity: 1; transform: translateY(0); }\n` +
    `}\n` +
    `${marks} {\n` +
    `  transform-box: fill-box;\n` +
    `  transform-origin: 50% 100%;\n` +
    `  animation: lumo-chart-mark-enter ${CHART_MOTION_MARK_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) both;\n` +
    `}\n` +
    `${stagger}\n` +
    // Grid FIRST, marks, then tick labels LAST — the per-part order `svgAnimation` cannot express.
    `${grid} {\n` +
    `  animation: lumo-chart-guide-enter ${CHART_MOTION_GUIDE_DURATION}ms ease-out both;\n` +
    `  transform-box: fill-box;\n` +
    `}\n` +
    `${guides} {\n` +
    `  animation: lumo-chart-guide-enter ${CHART_MOTION_GUIDE_DURATION}ms ease-out both;\n` +
    `  animation-delay: ${CHART_MOTION_MARK_DURATION - CHART_MOTION_GUIDE_DURATION}ms;\n` +
    `  transform-box: fill-box;\n` +
    `}\n` +
    // `CHART_MOTION_REDUCED_MOTION_IS_TOTAL` as CSS: `animation: none` paints the final state on frame one.
    `@media (prefers-reduced-motion: reduce) {\n` +
    `  ${marks}, ${grid}, ${guides} {\n` +
    `    animation: none;\n` +
    `    transform: none;\n` +
    `  }\n` +
    `}\n`
  );
}

/**
 * `Home`/`End` are LOGICAL as of 19 Aug 2026: the container swaps the two keys
 * at the capture phase under RTL (see `ChartContainer`), which fixes them
 * without touching the arrows — reversing the engine's one
 * `focus.navigation(points)` array would have fixed these and inverted those.
 *
 * The keyboard ENTRY POINT is still physical at 0.11.1: entering the plot
 * lands on the physically-first (reading-LAST) datum under RTL. Correcting it
 * in the wrapper would need a second focus move after the engine's, and the
 * reader would hear two data announced on entry — a worse defect than the one
 * being fixed. Recorded here; the data is still in reading order in
 * `<ChartData>`. Named like `CHART_VALUE_AXIS_TRAILING_EDGE`.
 */
export const CHART_KEYBOARD_ENTRY_READING_ORDER = false as const;
