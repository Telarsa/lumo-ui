import { cva } from "class-variance-authority";
import { direction, formatNumber, type Direction, type Locale, type LumoNode } from "@lumo-ui/core";
import type { ComponentType } from "react";

/**
 * Chart's class definitions, its theme stylesheet builder, and the direction
 * arithmetic — deliberately in a module with NO `"use client"`.
 *
 * The reason is `button.variants.ts`'s reason: a `cva()` exported from a client
 * module is a client reference in the RSC graph, and the "chart panel" block on
 * the roadmap is a SERVER component that frames a chart with a title, a delta
 * and a legend key. It must be able to call these.
 *
 * It also holds `chartMirror()` and `chartTickFormatter()`, which are pure
 * functions of a locale. Keeping them here means a server component can compute
 * the same axis props it will hand to the client island, and means they are
 * testable without a DOM.
 *
 * ═══ WHAT WAS MEASURED ABOUT RECHARTS, BEFORE ANY OF THIS WAS WRITTEN ═══════
 *
 * Rendered `<BarChart>` under `dir="rtl"` in jsdom (recharts 3.8.0) and read the
 * emitted SVG. Every claim below is from that output, not from the docs:
 *
 *  1. **recharts renders NOTHING on the server.** `renderToStaticMarkup` of a
 *     400×200 BarChart produces 148 bytes: `<div class="recharts-wrapper">` and
 *     no `<svg>` at all. The chart is drawn only after the client mounts.
 *
 *     That is the single most important fact about this component for Lumo,
 *     because `lumo-gate` grades the SERVED HTML. A chart contributes zero bytes
 *     to it — no digits to count, no `aria-label` to inspect, no text to check.
 *     `no-latin-digits` and `persian-digit-floor` cannot see a chart, so a chart
 *     that renders `1,200` on a Persian page passes every gate in `verify`.
 *     Chart correctness therefore lives ENTIRELY in `chart.test.tsx`, which
 *     mounts and reads the real SVG. Do not weaken those tests.
 *
 *  2. **Axis ticks are raw numbers.** A default `<YAxis>` emitted
 *     `0 600 1200 1800 2400` — Latin digits, in a Persian document. There is no
 *     `LumoNode` here to stop it: recharts builds the `<text>` itself from the
 *     scale's domain. Only a `tickFormatter` reaches it, which is why
 *     `chartTickFormatter` exists and why `ChartValueAxis` applies it by default.
 *
 *  3. **`text-anchor` is direction-RELATIVE, and recharts computes it as if the
 *     world were LTR.** Measured: a left-oriented `<YAxis>` emits
 *     `text-anchor="end"`, which per SVG means "the END of the text sits at the
 *     anchor point" — and end/start resolve against the inline base direction.
 *     Under `direction: rtl` that flips: the text extends from the tick INTO the
 *     plot area instead of away from it. Both orientations are inverted the same
 *     way, so the fix is to state the anchor explicitly under RTL rather than to
 *     move the axis and hope. Verified that an explicit `textAnchor` prop wins:
 *     `<YAxis orientation="right" textAnchor="end">` emitted `text-anchor="end"`
 *     where recharts' own default for that orientation is `start`.
 *
 *  4. **The scale is LTR.** With no mirroring, the first category sat at x=147.5
 *     and the second at x=312.5 — left to right, in a right-to-left document.
 *     `<XAxis reversed>` moved them to 252.5 and 87.5. `reversed` acts on the
 *     scale's range, so bars, lines, areas and the grid all mirror with it; it
 *     is the whole horizontal flip, not just the axis labels.
 *
 *  5. **recharts' own `<Legend>` is hardcoded LTR and leaks English.** Its
 *     `DefaultLegendContent` emits `<li style="margin-right:10px">`,
 *     `text-align:left`, and — measured — `<svg aria-label="v legend icon">`,
 *     built from the dataKey. That is a Latin-script `aria-label` on a Persian
 *     page, which is exactly what `no-latin-aria` exists to fail. It is also
 *     invisible to that gate, per (1). So `ChartLegendContent` is not a styling
 *     preference: passing `content=` is the only way to keep recharts' default
 *     legend out of the document.
 *
 *  6. **The tooltip leads the cursor on the wrong side.** `getTooltipTranslate`
 *     prefers `coordinate.x + offset` — to the RIGHT of the pointer — and falls
 *     back to the left only on overflow. In RTL, "ahead of the pointer" is the
 *     left. `reverseDirection: {x: true}` swaps the preference.
 */

/**
 * A chart's series metadata.
 *
 * `label` is REQUIRED, which is a deliberate tightening of upstream's optional
 * one. Without it `ChartLegendContent` renders an empty swatch and
 * `ChartTooltipContent` falls back to `item.name` — the dataKey, which is an
 * English identifier like `desktop` or `revenue`. A legend of English dataKeys
 * on a Persian dashboard is rule 2's defect wearing a chart's clothes, and the
 * only place it can be stopped is here, where the author is already writing the
 * series out by hand.
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
 * Upstream's utilities are kept where they name a recharts internal class —
 * those selectors are the API for restyling recharts and rewriting them would
 * break the styling, not improve it. What changed is every token: `bg-background`
 * → `bg-surface`, `text-muted-foreground` → `text-fg-muted`, `fill-muted` →
 * `fill-surface-sunken`. Lumo has no shadcn token names, so upstream's classes
 * would have silently resolved to nothing.
 */
export const chartContainerVariants = cva(
  "flex aspect-video justify-center text-xs " +
    "[&_.recharts-cartesian-axis-tick_text]:fill-fg-muted " +
    "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 " +
    "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border " +
    "[&_.recharts-dot[stroke='#fff']]:stroke-transparent " +
    "[&_.recharts-layer]:outline-hidden " +
    "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border " +
    "[&_.recharts-radial-bar-background-sector]:fill-surface-sunken " +
    "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-surface-sunken " +
    "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border " +
    "[&_.recharts-sector]:outline-hidden " +
    "[&_.recharts-sector[stroke='#fff']]:stroke-transparent " +
    "[&_.recharts-surface]:outline-hidden",
);

export const chartTooltipVariants = cva(
  "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 " +
    "bg-surface px-2.5 py-1.5 text-xs text-fg shadow-xl",
);

/**
 * The little colour chip beside a tooltip row.
 *
 * The custom property is `--lumo-chart-swatch`, not upstream's `--color-bg` /
 * `--color-border`. Those two names are Tailwind v4 THEME variables in this
 * workspace — `theme.css` defines `--color-bg` as `var(--lumo-sys-bg)` and
 * `--color-border` as `var(--lumo-sys-border)`. Setting them inline on the chip
 * would have shadowed the design tokens for that element and everything under
 * it, so a `border-border` anywhere inside would resolve to a series colour.
 * Upstream gets away with it because its token names differ; Lumo's collide
 * exactly.
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
 * class to remember. That is the whole reason Lumo renders its own legend rather
 * than recharts' — see the header, item 5.
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
 * Namespaced `--lumo-chart-*` rather than upstream's `--color-*` for the reason
 * `chartTooltipIndicatorVariants` documents: `--color-*` is Tailwind v4's theme
 * namespace here, and a config key called `bg`, `fg`, `border` or `accent`
 * would silently repaint every token-styled element inside the chart.
 */
export function chartColorVar(key: string): string {
  return `--lumo-chart-${key}`;
}

/** `var(--lumo-chart-<key>)`, for a `fill=` or `stroke=` on a recharts series. */
export function chartColor(key: string): string {
  return `var(${chartColorVar(key)})`;
}

/**
 * Config keys reach a `<style>` element through `dangerouslySetInnerHTML`, so
 * they are restricted to characters that cannot terminate a declaration or a
 * rule. Upstream interpolates the key unescaped; a key containing `}` there is a
 * stylesheet-injection primitive, and config often comes from an API response.
 */
const SAFE_KEY = /^[A-Za-z0-9_-]+$/;

/**
 * Builds the per-chart colour stylesheet.
 *
 * Upstream emits two blocks keyed by `{ light: "", dark: ".dark" }`. Lumo's
 * theme has THREE states, not two — `tokens.css` defines light on bare `:root`,
 * dark under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`,
 * and dark again under `[data-theme="dark"]` so an explicit choice wins in both
 * directions. A `.dark` selector matches nothing in this system, so upstream's
 * dark palette would simply never have applied.
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
 * ═══ THE PIE'S SWEEP DOES NOT MIRROR. THIS IS A DECISION, NOT AN OVERSIGHT ═══
 *
 * ROADMAP.md listed the winding direction of a pie under RTL as open. It is
 * closed here, and the answer is: **clockwise from the block start (12
 * o'clock), in both directions, always.** `CHART_PIE_SWEEP` is a constant and
 * takes no locale — deliberately, because a function that accepted a locale and
 * ignored it would read as a bug waiting to be "fixed".
 *
 * The reasoning, because the opposite choice is the intuitive one:
 *
 *  1. **A pie's sweep is not layout.** Everything else this file mirrors is a
 *     position along the INLINE axis — a scale's range, an axis's orientation, a
 *     tooltip's preferred side. Those mirror because reading order runs along
 *     that axis, so "first" means "at the start of the line". A pie has no
 *     inline axis. Its sectors are ordered by ANGLE around a centre, and angle
 *     has no reading order to agree with.
 *
 *  2. **Two mirror-imaged pies of the same data read as different data.** This
 *     is the decisive one. Mirror a bar chart and every bar keeps its height —
 *     the quantity survives the flip, only its position moves. Mirror a pie and
 *     each sector keeps its area but changes its NEIGHBOURS and its side: the
 *     40% slice that sat to the right of the 25% slice now sits to its left.
 *     Put a Persian dashboard and its English translation side by side and a
 *     reader comparing them sees two different pictures of one dataset, with
 *     nothing in either one saying which is the mirror. That is a worse failure
 *     than any asymmetry, because it is invisible in each document alone.
 *
 *  3. **Clocks do not mirror.** A pie is read as a clock face; Persian, Arabic
 *     and Hebrew documents all render analogue clocks running clockwise, and
 *     Persian calendars, gauges and progress rings do the same. Mirroring the
 *     sweep would make Lumo's pies disagree with every other round thing on a
 *     Persian page. (Contrast the linear progress bar, which DOES fill from the
 *     inline start, because that one is a line and lines are read.)
 *
 *  4. **What mirrors instead is everything textual around it.** The legend is a
 *     flex row and follows `direction` for free; the tooltip flips its preferred
 *     side; `<ChartData>`'s table is a real RTL table. So the Persian reader gets
 *     the sequence in reading order where sequence is meaningful — in the words —
 *     and gets the same picture as everyone else where it is not.
 *
 * The 12 o'clock start is the other half of the decision and is not free either:
 * recharts' own default is `startAngle: 0`, i.e. 3 o'clock, sweeping
 * COUNTER-clockwise (its angles are measured counter-clockwise from the positive
 * x-axis, so a default `0 → 360` pie runs backwards past 12). Nobody reads a pie
 * that way in either script. `90 → -270` is the same full turn starting at the
 * top and running clockwise.
 */
export interface ChartPieSweep {
  /** Degrees, counter-clockwise from 3 o'clock — so 90 is the top. */
  startAngle: number;
  /** 360° later, going clockwise. */
  endAngle: number;
}

/**
 * The one winding every Lumo pie and donut uses, in every locale.
 *
 * Exported as data rather than hidden inside `ChartPie` so a composition this
 * file does not cover — a radial bar, a gauge, a half pie — can start from the
 * same convention instead of re-deciding it.
 */
export const CHART_PIE_SWEEP: ChartPieSweep = { startAngle: 90, endAngle: -270 };

/**
 * A half pie — the gauge shape — on the same convention: it starts at the inline
 * side that is "up and over" in a clock's sense (9 o'clock) and sweeps clockwise
 * through 12 to 3. Same argument as the full turn: the sweep is a clock, not a
 * line, so it does not mirror.
 */
export const CHART_PIE_SWEEP_HALF: ChartPieSweep = { startAngle: 180, endAngle: 0 };

/**
 * The class the pie/donut centre label sits in.
 *
 * The centre of a donut is the one place in a chart where Lumo puts real text
 * inside the plot, so it is the one place a `font-variant-numeric` or a physical
 * text alignment could sneak into an SVG. `text-anchor` is set by recharts on
 * the `<text>` itself; this only carries colour and weight.
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

/**
 * The axis the scale runs ALONG — X in the default layout, Y when the chart is
 * `layout="vertical"`. Reversing it mirrors the scale's range, and with it every
 * bar, line, area and grid line.
 */
export interface ChartMainAxisMirror {
  reversed?: boolean;
}

/**
 * The axis that sits BESIDE the plot — Y in the default layout. Its tick text
 * runs alongside the plot rather than under it, which is what makes the
 * `text-anchor` inversion (header, item 3) visible.
 */
export interface ChartCrossAxisMirror {
  orientation?: "left" | "right";
  textAnchor?: "start" | "end";
}

export interface ChartMirror {
  /** Derived from the locale via `Intl.Locale.getTextInfo()`. Never passed in. */
  direction: Direction;
  /** Spread onto `<XAxis>` in the default layout, `<YAxis>` when vertical. */
  mainAxis: ChartMainAxisMirror;
  /** Spread onto `<YAxis>` in the default layout, `<XAxis>` when vertical. */
  crossAxis: ChartCrossAxisMirror;
  /** Spread onto recharts' `<Tooltip>`. */
  tooltip: { reverseDirection: { x: boolean; y: boolean } };
}

/**
 * Everything recharts needs told about direction, derived from the locale.
 *
 * There is no `dir` argument, for rule 4's reason: a wrong direction should be
 * unrepresentable rather than discouraged.
 *
 * The fields are named for the GEOMETRY (main/cross) rather than for the data
 * (category/value), because which one carries the categories depends on the
 * chart's `layout` while what needs mirroring does not. `ChartCategoryAxis` and
 * `ChartValueAxis` do that mapping once, in one place.
 *
 * Under LTR every field is absent, so spreading this is a no-op in English — the
 * mirrored path and the plain path are the same code, which is the only way the
 * mirrored one stays working.
 */
export function chartMirror(locale: Locale): ChartMirror {
  const dir = direction(locale);
  const rtl = dir === "rtl";

  return {
    direction: dir,
    mainAxis: rtl ? { reversed: true } : {},
    // Under RTL the cross axis moves to the trailing (right) edge AND states its
    // anchor, because recharts' computed anchor inverts under `direction: rtl`.
    crossAxis: rtl ? { orientation: "right", textAnchor: "end" } : {},
    tooltip: { reverseDirection: { x: rtl, y: false } },
  };
}
