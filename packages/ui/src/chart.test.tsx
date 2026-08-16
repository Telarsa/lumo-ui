/**
 * EXPERIMENT (branch `experiment/base-ui`). Chart, on `@tanstack/charts` 0.9.0.
 *
 * ═══ HOW THIS FILE WAS RESTATED, CASE BY CASE ═══════════════════════════════
 *
 * The rule applied: **a case that pinned a BEHAVIOUR keeps its assertion; a case
 * that pinned RECHARTS' vocabulary is rewritten to pin the same behaviour in the
 * new renderer; a case whose SUBJECT no longer exists is inverted rather than
 * deleted, so the record of the defect survives.**
 *
 *   kept, verbatim behaviour
 *     `<ChartData>` in the served bytes · Persian digits and no Latin ones ·
 *     not `aria-hidden` · the locale reaching the formatter · the category
 *     scale mirroring · the value tick anchor · LTR untouched ·
 *     `chartTickFormatter`'s three cases · one named focusable element · no
 *     Latin word in any spoken attribute · Lumo's legend · the pie sweep
 *     constants · the colour stylesheet's three theme states and its key guard.
 *
 *   INVERTED — and these two are the point of the migration
 *     "recharts still renders no plot on the server" asserted 127 bytes and no
 *     `<svg>`. It is now the opposite claim, with the byte count, because that
 *     is the thing that changed: the gate can see the plot.
 *
 *     "moves the value axis to the trailing edge" PASSED under recharts, which
 *     had `orientation="right"`. TanStack has no such option at 0.9.0. The case
 *     is inverted to pin the GAP — `CHART_VALUE_AXIS_TRAILING_EDGE === false`
 *     and the labels are on the leading edge in both directions — so the day
 *     upstream ships an axis side, this test goes red and says so. A capability
 *     lost silently is worse than one lost loudly.
 *
 *   REMOVED WITH THEIR SUBJECT
 *     `ChartValueLabelList` and `ChartPie`/`ChartPieCenter` are not ported (see
 *     chart.tsx, API change 5), so their cases go with them. The pie SWEEP
 *     cases stay, because the sweep is a decision Lumo owns and the harness
 *     confirmed TanStack's default already matches it.
 *
 *   NEW
 *     The `aria-roledescription` conformance pair, with its poison twin. That
 *     is TanStack's one English literal and it is reachable, so it gets the
 *     same treatment `@lumo-ui/base-ui-ssr` gives Base UI's seven.
 */

import { afterEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Chart as BareTanstackChart } from "@tanstack/charts/react";

import {
  CHART_MOTION_UPDATE_DURATION,
  ChartContainer,
  ChartData,
  ChartLegend,
  barY,
  chartMotion,
  chartTooltip,
  defineChart,
  scaleBand,
  scaleLinear,
} from "./chart.tsx";
import { focusGroupX, focusNearestX } from "@tanstack/charts/focus";
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
  chartColorVar,
  chartMirror,
  chartMotionStyleSheet,
  chartStyleSheet,
  chartTickFormatter,
  chartValueAxis,
  type ChartConfig,
} from "./chart.variants.ts";
import { en, fa, formatNumber, type Locale } from "@lumo-ui/core";

const DATA = [
  { month: "فروردین", sales: 1200 },
  { month: "اردیبهشت", sales: 2100 },
  { month: "خرداد", sales: 800 },
  { month: "تیر", sales: 3000 },
];

const CONFIG = {
  month: { label: "ماه" },
  sales: { label: "فروش", color: "#3b82f6" },
} satisfies ChartConfig;

function definitionFor(locale: Locale) {
  return defineChart({
    marks: [barY(DATA, { id: "sales", x: "month", y: "sales", fill: "#3b82f6" })],
    x: chartCategoryAxis(locale, {
      scale: () => scaleBand<string>().padding(0.2),
    }) as never,
    y: chartValueAxis(locale, { scale: scaleLinear, grid: true }) as never,
  });
}

function chart(locale: Locale = "fa-IR") {
  return renderToStaticMarkup(
    <ChartContainer
      config={CONFIG}
      locale={locale}
      label="فروش ماهانه"
      definition={definitionFor(locale) as never}
      data={DATA}
      categoryKey="month"
      dataCaption="داده‌های نمودار فروش ماهانه"
    />,
  );
}

/** Every `<text>` the renderer emitted, in document order. */
function texts(html: string): string[] {
  return [...html.matchAll(/>([^<>]+)<\/text>/g)].map((m) => m[1] as string);
}

/** The `text-anchor` of every tick label. */
function anchors(html: string): string[] {
  return [...html.matchAll(/text-anchor="([^"]+)"/g)].map((m) => m[1] as string);
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE MEASUREMENT THAT MOVED THE RENDERER
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — the plot IS served now, and so are the figures", () => {
  it("INVERTED: the served bytes contain a real <svg> with real ticks", () => {
    /*
     * The previous version of this case asserted the opposite, about recharts:
     * 127 bytes, no `<svg>`, no `<text>`. That was the blind spot `lumo-gate`
     * could not see past — a chart contributed nothing to the graded HTML, so a
     * chart drawing `1,200` on a Persian page passed every gate in `verify`.
     */
    const html = chart();
    expect(html).toContain("<svg");
    expect(html.length).toBeGreaterThan(3000);
    expect(texts(html).length).toBeGreaterThan(4);
  });

  it("the axis ticks are Persian, in the FIRST byte", () => {
    // `Intl` is a function like any other and `renderToStaticMarkup` calls it.
    // This is the assertion that the tick formatter runs on the server.
    const rendered = texts(chart()).join(" ");
    expect(rendered).toMatch(/[۰-۹]/);
    expect(rendered).toContain(formatNumber(3000, "fa-IR"));
  });

  it("`ChartData` puts the actual ROWS in the served bytes", () => {
    // An axis is not the data. A tick says the scale runs to ۳٬۰۰۰; only this
    // table says فروردین was ۱٬۲۰۰.
    const html = chart();
    expect(html).toContain("داده‌های نمودار فروش ماهانه");
    expect(html).toContain("فروردین");
    for (const row of DATA) {
      expect(html).toContain(formatNumber(row.sales, "fa-IR"));
    }
  });

  it("serves NO Latin digits anywhere — the gate would fail the build", () => {
    const html = chart();
    // Attributes are full of geometry, so grade the text nodes the gate grades.
    const visible = [...texts(html), ...(html.match(/<t[dh][^>]*>([^<]*)</g) ?? [])];
    // Vacuity guard: an empty render has no digits either.
    expect(visible.length).toBeGreaterThan(3);
    expect(visible.join(" ")).toMatch(/[۰-۹]/);
    expect(visible.join(" ")).not.toMatch(/[0-9]/);
  });

  it("the data table is not aria-hidden", () => {
    // `sr-only` is a decision about sighted layout. `aria-hidden` would remove
    // the table from the gate AND from the screen reader at once, which is the
    // difference between an equivalent and a hiding place.
    const html = chart();
    const at = html.indexOf('data-slot="chart-data"');
    expect(at, "the data table is rendered at all").toBeGreaterThan(-1);
    const table = html.slice(at);
    expect(table.slice(0, 200)).not.toContain("aria-hidden");
  });

  it("formats through the CALLER's locale, not a fixed one", () => {
    const html = renderToStaticMarkup(
      <ChartData
        config={CONFIG}
        locale="en-US"
        data={DATA}
        categoryKey="month"
        caption="Monthly sales data"
      />,
    );
    expect(html).toContain("1,200");
    expect(html).not.toMatch(/[۰-۹]/);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * DIRECTION
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — the axis is where a Persian reader expects it", () => {
  it("mirrors the category scale, so the first category sits at the reading start", () => {
    // `reverse` acts on the scale's RANGE, so bars, lines, areas, dots and the
    // grid all mirror with it — one lever, not one per element.
    expect(chartMirror("fa-IR").categoryAxis).toEqual({ reverse: true });
    expect(chartMirror("en-US").categoryAxis).toEqual({});

    const rtl = [...chart("fa-IR").matchAll(/<rect[^>]*\sx="([\d.]+)"/g)].map((m) =>
      Number(m[1]),
    );
    const ltr = [...chart("en-US").matchAll(/<rect[^>]*\sx="([\d.]+)"/g)].map((m) =>
      Number(m[1]),
    );
    expect(rtl.length).toBeGreaterThan(1);
    // The first bar starts near the RIGHT edge under RTL and near the left in
    // LTR. Asserting the direction of the inequality rather than the pixel
    // values keeps this from breaking on a layout tweak.
    expect((rtl[0] as number) > (rtl[rtl.length - 1] as number)).toBe(true);
    expect((ltr[0] as number) < (ltr[ltr.length - 1] as number)).toBe(true);
  });

  it("states the value axis's tick anchor, which TanStack computes as if LTR", () => {
    // Measured: `end` in LTR and, without the lever, `end` under RTL too — which
    // runs the label INTO the plot. This is the half of criterion 2 that IS
    // reachable.
    expect(chartMirror("fa-IR").valueTickAnchor).toBe("start");
    expect(chartMirror("en-US").valueTickAnchor).toBe("end");
    expect(anchors(chart("fa-IR"))).toContain("start");
  });

  it("INVERTED: the value axis CANNOT move to the trailing edge at 0.9.0", () => {
    /*
     * This case PASSED under recharts, which had `orientation="right"`.
     * `ChartAxisPresentationOptions` in TanStack 0.9.0 declares `line`, `ticks`,
     * `tickLabels`, `label` and `motion` — and no side, orient, position or
     * placement field anywhere in the axis types.
     *
     * Pinned as a gap rather than deleted: when upstream ships the option,
     * `CHART_VALUE_AXIS_TRAILING_EDGE` flips and this test goes red on purpose.
     * See chart.variants.ts for the four-part handling.
     */
    expect(CHART_VALUE_AXIS_TRAILING_EDGE).toBe(false);
    expect(chartMirror("fa-IR").valueAxisAtTrailingEdge).toBe(false);
    expect(chartMirror("en-US").valueAxisAtTrailingEdge).toBe(false);

    // And the observable consequence: the numeric labels sit at the same, small
    // x in both directions.
    const x = (html: string) =>
      [...html.matchAll(/<text[^>]*\sx="([\d.]+)"[^>]*>[۰-۹0-9٬,]+<\/text>/g)].map((m) =>
        Number(m[1]),
      );
    const rtl = x(chart("fa-IR"));
    expect(rtl.length).toBeGreaterThan(0);
    expect(Math.max(...rtl)).toBeLessThan(120);
  });

  it("leaves LTR alone — the mirrored path and the plain path are one code path", () => {
    const mirror = chartMirror("en-US");
    expect(mirror.direction).toBe("ltr");
    expect(mirror.categoryAxis).toEqual({});
    expect(anchors(chart("en-US"))).not.toContain("start");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * NUMBERS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — every number the renderer draws is in the reader's digits", () => {
  it("formats the value axis, which the renderer builds from the scale alone", () => {
    // There is no `LumoNode` in the way: the `<text>` is built inside the
    // renderer from the scale's domain, so a formatter is the only seam.
    expect(texts(chart("fa-IR")).join(" ")).toMatch(/[۰-۹]/);
  });

  it("under en-US the same axis is Latin, so the formatter is doing work", () => {
    const rendered = texts(chart("en-US")).join(" ");
    expect(rendered).toMatch(/[0-9]/);
    expect(rendered).not.toMatch(/[۰-۹]/);
  });

  it("chartTickFormatter formats numbers, passes strings through, refuses NaN", () => {
    const fa = chartTickFormatter("fa-IR");
    expect(fa(1200)).toBe(formatNumber(1200, "fa-IR"));
    // A category axis's ticks are already authored strings; re-formatting them
    // would be wrong.
    expect(fa("فروردین")).toBe("فروردین");
    // "NaN" is an English word in a Persian document.
    expect(fa(Number.NaN)).toBe("");
    expect(fa(null)).toBe("");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE ONE FOCUSABLE ELEMENT, AND THE ONE ENGLISH STRING
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — the focusable plot is named, and described in Persian", () => {
  it("names the <svg> that carries role=img and tabindex=0", () => {
    const html = chart();
    expect(html).toContain('role="img"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="فروش ماهانه"');
  });

  it("announces no Latin word from any attribute a screen reader speaks", () => {
    const html = chart();
    const spoken = [...html.matchAll(/(?:aria-label|aria-roledescription)="([^"]*)"/g)].map(
      (m) => m[1] as string,
    );
    expect(spoken.length).toBeGreaterThan(0);
    expect(spoken.filter((v) => /[A-Za-z]{3,}/.test(v))).toEqual([]);
  });

  it("replaces aria-roledescription=\"chart\" with «نمودار»", () => {
    const html = chart();
    expect(html).toContain(`aria-roledescription="${fa.chart.roleDescription}"`);
    expect(html).not.toContain(TANSTACK_ROLE_DESCRIPTION);
  });

  it("POISON TWIN — bare TanStack still emits the English literal", () => {
    /*
     * Rendered WITHOUT `renderSvg`, i.e. the library as shipped. If this goes
     * red, upstream has changed or removed the literal and `chartRenderSvg` is
     * silently replacing nothing — a green build with an English word in an
     * ARIA attribute on every Persian chart.
     */
    const html = renderToStaticMarkup(
      <ChartContainerWithoutTheFix />,
    );
    expect(html).toContain(TANSTACK_ROLE_DESCRIPTION);
  });

  it("en-US takes the same code path rather than falling through", () => {
    // If English fell through to the library default, the Persian branch would
    // be the only one exercised and a regression would show up in exactly one
    // locale.
    expect(chart("en-US")).toContain(
      `aria-roledescription="${en.chart.roleDescription}"`,
    );
  });
});

/** The bare renderer, for the poison twin above. */
function ChartContainerWithoutTheFix() {
  // Deliberately NOT `<ChartContainer>`: the point is to render what the
  // library does with no Lumo prop applied — no `renderSvg`, no wrapper.
  return (
    <BareTanstackChart
      definition={definitionFor("fa-IR") as never}
      ariaLabel="فروش ماهانه"
      height={200}
      initialWidth={400}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * TOOLTIP
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — a tooltip figure is formatted like every other figure", () => {
  const { format } = chartTooltip("fa-IR", CONFIG);

  it("formats the plotted number through the locale", () => {
    // A tooltip value is a number the renderer stringifies, and a stringified
    // JavaScript number is Latin digits. It is not a JSX child, so `LumoNode`
    // cannot see it, and it appears only on hover, so no server render and no
    // gate can either. `format` is the only place it can be caught.
    expect(format({ markId: "sales", yValue: 1200 })).toBe(
      `فروش: ${formatNumber(1200, "fa-IR")}`,
    );
    expect(format({ markId: "sales", yValue: 1200 })).not.toMatch(/[0-9]/);
  });

  it("reads yValue, which is the field ChartPoint actually has", () => {
    // Guards the exact mistake this was written with first: `ChartPoint` has no
    // `value`, and reading one yields undefined, which the formatter turns into
    // the empty string — a tooltip with a label and no number, visible only on
    // hover.
    expect(format({ markId: "sales", yValue: 0 })).toContain(
      formatNumber(0, "fa-IR"),
    );
    expect(format({ markId: "sales" })).not.toContain("undefined");
  });

  it("falls back to the bare number when a series is missing from config", () => {
    // Left visible rather than papered over with the raw key: an English
    // identifier in a Persian tooltip is the defect `ChartConfig.label` is
    // required to prevent, and printing it would hide the omission.
    expect(format({ markId: "unknown", yValue: 42 })).toBe(formatNumber(42, "fa-IR"));
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * LEGEND
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — the legend is Lumo's markup, driven by ChartConfig", () => {
  it("renders the configured Persian label and no aria-label at all", () => {
    /*
     * The defect this replaces was measured on recharts' DEFAULT legend under
     * `dir="rtl"`: `<li style="margin-right:10px">` inside a
     * `<ul style="text-align:left">`, each swatch an
     * `<svg aria-label="v legend icon">` built from the dataKey. Three physical
     * properties and a Latin `aria-label` no prop reached.
     *
     * TanStack's legend is opt-in rather than default, so nothing has to be
     * displaced — but the replacement is unchanged, because the reasons for it
     * were never about recharts.
     */
    const html = renderToStaticMarkup(
      <ChartContainer
        config={CONFIG}
        locale="fa-IR"
        label="فروش ماهانه"
        definition={definitionFor("fa-IR") as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار"
      >
        <ChartLegend />
      </ChartContainer>,
    );
    expect(html).toContain("فروش");
    expect(html).not.toContain("legend icon");
    expect(html).not.toContain("margin-right");
    expect(html).not.toContain("text-align:left");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE PIE SWEEP — A DECISION, NOT A RENDERER SETTING
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — the pie's sweep is a decision, and the decision is not to mirror", () => {
  it("starts at the block start and winds clockwise", () => {
    // 90° is 12 o'clock in the counter-clockwise-from-3-o'clock convention both
    // renderers use; -270 is a full turn later, going clockwise.
    expect(CHART_PIE_SWEEP).toEqual({ startAngle: 90, endAngle: -270 });
  });

  it("the constants are a full turn and a half turn of the SAME winding", () => {
    const sweep = (s: { startAngle: number; endAngle: number }) => s.endAngle - s.startAngle;
    expect(sweep(CHART_PIE_SWEEP)).toBe(-360);
    expect(sweep(CHART_PIE_SWEEP_HALF)).toBe(-180);
    // Same sign — a half pie that wound the other way would be a different
    // convention wearing the same name.
    expect(Math.sign(sweep(CHART_PIE_SWEEP))).toBe(Math.sign(sweep(CHART_PIE_SWEEP_HALF)));
  });

  it("takes no locale, deliberately", () => {
    // A function that accepted a locale and ignored it would read as a bug
    // waiting to be "fixed". These are constants, and the argument for them is
    // in chart.variants.ts.
    expect(typeof CHART_PIE_SWEEP).toBe("object");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE COLOUR STYLESHEET
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("chart — the colour stylesheet fits Lumo's theme rather than shadcn's", () => {
  const css = chartStyleSheet("chart-x", {
    sales: { label: "فروش", theme: { light: "#111", dark: "#eee" } },
  });

  it("namespaces the custom property so it cannot shadow a Tailwind theme token", () => {
    // `--color-bg` and `--color-border` ARE theme variables in this workspace,
    // so upstream's names would repaint every token-styled element inside the
    // chart.
    expect(chartColorVar("sales")).toBe("--lumo-chart-sales");
    expect(css).toContain("--lumo-chart-sales");
    expect(css).not.toContain("--color-");
  });

  it("targets all three of Lumo's theme states, not shadcn's single `.dark`", () => {
    expect(css).toContain('[data-chart="chart-x"] {');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(':root:not([data-theme="light"])');
    expect(css).toContain('[data-theme="dark"]');
    // A `.dark` selector matches nothing in this system, so upstream's dark
    // palette would simply never have applied.
    expect(css).not.toMatch(/(^|\s)\.dark\b/);
  });

  it("refuses a config key that could break out of the declaration", () => {
    // Config often comes from an API response, and the key reaches a <style>
    // element through `dangerouslySetInnerHTML`.
    const injected = chartStyleSheet("chart-x", {
      "sales}html{display:none": { label: "x", color: "#000" },
    });
    expect(injected).not.toContain("display:none");
  });
});

/**
 * The pointer hit test — the one thing a reader touches on every chart.
 *
 * These assert a DEFAULT rather than a behaviour: the failure this closed was
 * never "the hit test is subtly wrong", it was "nobody passed `focus`, so it
 * stayed radial", and that is visible in the definition object alone.
 *
 * **The reason originally given for stopping there was wrong, and it cost a
 * round trip.** It said the behaviour "is not reachable from jsdom, since it
 * needs a laid-out plot and real pointer coordinates". A laid-out plot is not
 * needed — `clientToScene` reads ONE `getBoundingClientRect` and divides — and
 * the block below drives the shipped renderer end to end on a stub of exactly
 * that. Had this file done so at the time, it would have caught the tooltip
 * sitting on the datum in the same run that made the whole band live, which is
 * what the reader actually reported next. The block below is that measurement.
 */
describe("charts hit-test by band, the way every dashboard does", () => {
  it("defaults to grouped-by-x with no radius", () => {
    /*
     * Measured in TanStack's `renderer.js:764`: the radial nearest-point search
     * is capped at `maxFocusDistance ?? 48`, so a tooltip appears only within
     * 48px of a datum and dies when the pointer drifts off the line vertically.
     * On a tall plot that is most of the chart area, and it reads as a broken
     * tooltip rather than as a configured radius. recharts — which this library
     * used until 11 Aug 2026 — bisects the x scale across the whole band.
     */
    const definition = defineChart({ marks: [], x: null, y: null } as never) as unknown as Record<
      string,
      unknown
    >;
    expect(definition["maxFocusDistance"]).toBe(Number.POSITIVE_INFINITY);
    // The strategy object itself: `focusGroupX` measures `Math.abs(point.x -
    // target)` with y ignored, and groups every series sharing that x.
    expect(definition["focus"]).toBe(focusGroupX);
  });

  it("lets a caller override both, because they are ordinary options", () => {
    const definition = defineChart({
      marks: [],
      x: null,
      y: null,
      focus: focusNearestX,
      maxFocusDistance: 12,
    } as never) as unknown as Record<string, unknown>;
    expect(definition["focus"]).toBe(focusNearestX);
    expect(definition["maxFocusDistance"]).toBe(12);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE TOOLTIP FOLLOWS THE POINTER
 *
 * ── WHAT THIS HARNESS PROVES, AND WHAT IT DOES NOT ──────────────────────────
 *
 * The block above this one asserts a DEFAULT — that `defineChart` carries
 * `focus` — and its own docblock says the behaviour "is not reachable from
 * jsdom". That claim was TOO STRONG, and believing it is why the reported
 * defect survived a fix: a chart shipped with the right hit-test strategy and
 * a tooltip that still would not move.
 *
 * jsdom has no layout, but `@tanstack/charts` does not ask it for any. Every
 * step from a pointer event to a placed tooltip is arithmetic over ONE
 * measurement:
 *
 *   `clientToScene` (`canvas.js:140`, `svg-surface.js:75`) is
 *   `(clientX - rect.left) / rect.width * scene.width` — one
 *   `getBoundingClientRect`, then division.
 *   `resolveChartTooltipAnchor` (`tooltip-model.js:34`) picks a coordinate.
 *   `placeTooltip` (`tooltip-position.js`) writes `style.left`/`style.top`.
 *
 * So stubbing `getBoundingClientRect` to a fixed 400×200 box makes the whole
 * chain deterministic and REAL — this drives TanStack's shipped renderer, not
 * a model of it.
 *
 * What it does NOT prove: anything about pixels. `offsetWidth`/`offsetHeight`
 * are 0 in jsdom, so the tooltip's own size contributes nothing to the
 * placement arithmetic and the candidate-flipping near an edge is untested.
 * It also cannot see z-order, clipping, or whether the box is visible at all.
 * Per DECISIONS §15, a green suite here is not evidence about `apps/website/out`
 * — what it IS evidence of is that the anchor coordinate equals the pointer
 * coordinate and that a repaint happens on every move, which are exactly the
 * two things that were wrong.
 * ═══════════════════════════════════════════════════════════════════════════ */

const SURFACE_WIDTH = 400;
const SURFACE_HEIGHT = 200;

let restoreLayout: (() => void) | undefined;

afterEach(() => {
  restoreLayout?.();
  restoreLayout = undefined;
});

/**
 * Give jsdom the ONE measurement TanStack asks it for, and a `ResizeObserver`
 * so the responsive path does not take its no-op branch.
 */
function stubLayout() {
  const view = globalThis as unknown as { ResizeObserver?: unknown };
  const previousObserver = view.ResizeObserver;
  const previousRect = Element.prototype.getBoundingClientRect;

  view.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: SURFACE_WIDTH,
      height: SURFACE_HEIGHT,
      right: SURFACE_WIDTH,
      bottom: SURFACE_HEIGHT,
      toJSON() {},
    } as DOMRect;
  };

  restoreLayout = () => {
    view.ResizeObserver = previousObserver;
    Element.prototype.getBoundingClientRect = previousRect;
  };
}

interface Placement {
  left: number;
  top: number;
  text: string;
}

/** Mounts a live chart and returns a "move the pointer here, read the box" probe. */
function mountLiveChart(locale: Locale) {
  stubLayout();

  const definition = defineChart({
    marks: [barY(DATA, { id: "sales", x: "month", y: "sales", fill: "#3b82f6" })],
    x: chartCategoryAxis(locale, {
      scale: () => scaleBand<string>().padding(0.2),
    }) as never,
    y: chartValueAxis(locale, { scale: scaleLinear, grid: true }) as never,
    tooltip: chartTooltip(locale, CONFIG),
  });

  const { container } = render(
    <ChartContainer
      config={CONFIG}
      locale={locale}
      label="فروش ماهانه"
      definition={definition as never}
      data={DATA}
      categoryKey="month"
      dataCaption="داده‌های نمودار فروش ماهانه"
      height={SURFACE_HEIGHT}
      initialWidth={SURFACE_WIDTH}
    />,
  );

  const surface = container.querySelector("svg");
  if (!surface) throw new Error("no plot mounted");

  return function pointerAt(clientX: number, clientY: number): Placement {
    // `MouseEvent`, not `PointerEvent`: jsdom 30 has no `PointerEvent`
    // constructor, and the renderer only ever reads `clientX`/`clientY` and
    // `target` off the event. `bubbles` matters — the listener is on the
    // renderer's container `<div>`, not on the `<svg>`.
    const event = new window.MouseEvent("pointermove", { bubbles: true });
    Object.defineProperty(event, "clientX", { value: clientX });
    Object.defineProperty(event, "clientY", { value: clientY });
    act(() => {
      surface.dispatchEvent(event);
    });

    const tip = container.querySelector<HTMLElement>(".ts-chart-tooltip");
    if (!tip) throw new Error("no tooltip painted");
    return {
      left: Number.parseFloat(tip.style.left),
      top: Number.parseFloat(tip.style.top),
      text: tip.textContent ?? "",
    };
  };
}

describe("chart — the tooltip appears AT the pointer, and follows it", () => {
  /*
   * The reported defect, twice, and the second report is the one that matters:
   * "the charts still are not, they don't follow the mouse. It doesn't pop up
   * where the mouse is."
   *
   * MEASURED before `anchor: "pointer"`, fa-IR, two moves 140px apart in the
   * SAME band:
   *
   *     pointer (300, 40)    left 341.14px   top 100px
   *     pointer (300,180)    left 341.14px   top 100px      ← byte-identical
   *
   * 341.14 is the bar's own x. The tooltip was nailed to the datum, and no
   * repaint was even scheduled: `renderer.js:422` passes
   * `tooltipTracksPointer()` as `forcePaint`, and `updateFocus` returns early
   * when the focused point has not changed.
   */
  const OFFSET = 10; // `tooltip-placement.js`: the default gap, and `top` wins here.

  it("tracks the pointer on the BLOCK axis inside one band — fa-IR", () => {
    const pointerAt = mountLiveChart("fa-IR");
    const high = pointerAt(300, 40);
    const low = pointerAt(300, 180);

    // The datum did not change — same band, same series, same figure. Only the
    // pointer moved, and before the fix that was precisely the case in which
    // nothing was repainted.
    expect(high.text).toBe(low.text);
    expect(high.top).not.toBe(low.top);
    expect(high.top).toBeCloseTo(40 - OFFSET, 5);
    expect(low.top).toBeCloseTo(180 - OFFSET, 5);
  });

  it("tracks the pointer on the INLINE axis — fa-IR", () => {
    const pointerAt = mountLiveChart("fa-IR");
    expect(pointerAt(300, 100).left).toBeCloseTo(300, 5);
    expect(pointerAt(310, 100).left).toBeCloseTo(310, 5);
    expect(pointerAt(100, 100).left).toBeCloseTo(100, 5);
  });

  it("tracks the pointer in BOTH directions — this was never an RTL defect", () => {
    /*
     * Stated explicitly because this library's usual finding is the opposite,
     * and a reader who knows the thesis will assume RTL. It is not: the anchor
     * default is `"point"` in `tooltip-model.js` with no direction in it, scene
     * coordinates are measured from the rect's PHYSICAL left in
     * `clientToScene`, and `placeTooltip` writes the PHYSICAL `left`. Three
     * physical quantities that agree with each other, so the mirror never
     * enters the arithmetic. Measured identical in both locales.
     */
    const rtl = mountLiveChart("fa-IR")(300, 40);
    const ltr = mountLiveChart("en-US")(300, 40);
    expect(rtl.left).toBeCloseTo(300, 5);
    expect(ltr.left).toBeCloseTo(300, 5);
    expect(rtl.top).toBeCloseTo(ltr.top, 5);
  });

  it("mirrors WHICH datum is reported, which is the part that is direction-aware", () => {
    // The companion assertion to the one above: placement is physical and
    // identical, but the band under a given x is mirrored — so the same
    // physical pointer meets the FIRST month under RTL and the LAST under LTR.
    // If these two ever agree, `chartCategoryAxis`'s `reverse` has stopped
    // working and the previous case would not notice.
    const rtl = mountLiveChart("fa-IR")(340, 100).text;
    const ltr = mountLiveChart("en-US")(340, 100).text;
    expect(rtl).toContain(formatNumber(1200, "fa-IR"));
    expect(ltr).toContain(formatNumber(3000, "en-US"));
  });

  it("carries the anchor as an ordinary, overridable option", () => {
    // The switch itself, asserted where a reader greps for it. `"pointer"`
    // resolves to `pointer ?? datum` in `tooltip-model.js:36`, so a KEYBOARD
    // focus — which nulls `pointerPosition` — still anchors on the datum.
    expect(chartTooltip("fa-IR", CONFIG).anchor).toBe("pointer");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * MOTION
 *
 * ── WHAT THIS HARNESS PROVES, AND WHAT IT DOES NOT ──────────────────────────
 *
 * It drives the SHIPPED renderer, not a model of it, on the same argument the
 * pointer block above makes: `reconcile.js` is arithmetic over attribute
 * strings and `runTweens` asks the document only for `requestAnimationFrame`.
 * So `requestAnimationFrame` is REPLACED here with a queue this file drains at
 * timestamps it chooses, which makes every frame deterministic — no timers, no
 * flake, and an exact expected value at every sample.
 *
 * What that PROVES: which attribute is written, on which element, at which
 * progress; that the first render schedules no frame at all; that a reduced
 * -motion window schedules none either and lands on the final value in the same
 * tick; that an exiting element survives until its tween finishes and is then
 * removed.
 *
 * What it does NOT prove, stated plainly rather than left to be discovered:
 *
 *  1. **Nothing about the CSS half.** jsdom parses `<style>` but implements no
 *     `@keyframes`, no `animation-delay` and no `prefers-reduced-motion`
 *     evaluation. The first-paint animation is therefore asserted as TEXT — the
 *     stylesheet the component serves — and as an ABSENCE of anything else. A
 *     test that claimed to have watched a bar grow in jsdom would be the same
 *     false claim about untestability this file already carries a correction
 *     for, pointed the other way.
 *  2. **Nothing about pixels, paint order or whether motion looks right.** Per
 *     DECISIONS §15 a green suite here is not evidence about `apps/website/out`;
 *     what the built export is checked for is the served TEXT being unchanged
 *     by motion, which is the property the gate depends on and which IS
 *     mechanically checkable — see "the served bytes are motion-blind" below.
 *  3. **Nothing about `window.matchMedia` in a real browser.** jsdom's own
 *     `matchMedia` always reports `matches: false`, so the reduced-motion cases
 *     replace it. That proves TanStack reads the query and honours the answer;
 *     it does not prove the OS setting reaches the browser, which is not this
 *     library's code.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** A frame queue, drained at timestamps the test picks. */
interface FrameDriver {
  run: (timestamp: number) => void;
  pending: () => number;
}

let restoreMotion: (() => void) | undefined;
let frames: FrameDriver;

afterEach(() => {
  restoreMotion?.();
  restoreMotion = undefined;
});

function stubMotionEnvironment(options: { reducedMotion: boolean }) {
  const view = globalThis as unknown as { ResizeObserver?: unknown };
  const previousObserver = view.ResizeObserver;
  const previousRect = Element.prototype.getBoundingClientRect;
  const previousMatchMedia = window.matchMedia;
  const previousRequest = window.requestAnimationFrame;
  const previousCancel = window.cancelAnimationFrame;

  view.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: SURFACE_WIDTH,
      height: SURFACE_HEIGHT,
      right: SURFACE_WIDTH,
      bottom: SURFACE_HEIGHT,
      toJSON() {},
    } as DOMRect;
  };
  // jsdom's own implementation answers `false` to everything, so the reduced
  // -motion cases would be indistinguishable from the ordinary ones without
  // this. `renderer.js:873` calls `matchMedia("(prefers-reduced-motion: reduce)")`
  // on `container.ownerDocument.defaultView`, which is this `window`.
  window.matchMedia = ((query: string) => ({
    matches: options.reducedMotion && query.includes("reduce"),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  const queue = new Map<number, FrameRequestCallback>();
  let handle = 0;
  window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    handle += 1;
    queue.set(handle, callback);
    return handle;
  }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = ((id: number) => {
    queue.delete(id);
  }) as typeof window.cancelAnimationFrame;

  frames = {
    run(timestamp) {
      const due = [...queue.values()];
      queue.clear();
      act(() => {
        for (const callback of due) callback(timestamp);
      });
    },
    pending: () => queue.size,
  };

  restoreMotion = () => {
    view.ResizeObserver = previousObserver;
    Element.prototype.getBoundingClientRect = previousRect;
    window.matchMedia = previousMatchMedia;
    window.requestAnimationFrame = previousRequest;
    window.cancelAnimationFrame = previousCancel;
  };
}

const LATER = [
  { month: "فروردین", sales: 300 },
  { month: "اردیبهشت", sales: 900 },
  { month: "خرداد", sales: 2600 },
  { month: "تیر", sales: 1400 },
];

/** The bar heights, as numbers, in document order. */
function barHeights(container: HTMLElement): number[] {
  return [...container.querySelectorAll("rect")].map((rect) =>
    Number(rect.getAttribute("height")),
  );
}

/** The concrete row shape these cases plot; `ChartRow` is too wide for `barY`. */
type MotionRow = { month: string; sales: number };

function motionDefinition(
  rows: MotionRow[],
  locale: Locale,
  options: Record<string, unknown> = {},
  extraSeries = false,
) {
  const marks = [barY(rows, { id: "sales", x: "month", y: "sales", fill: "#3b82f6" })];
  if (extraSeries) {
    marks.push(barY(rows, { id: "target", x: "month", y: "sales", fill: "#f43f5e" }));
  }
  return defineChart({
    marks,
    x: chartCategoryAxis(locale, {
      scale: () => scaleBand<string>().padding(0.2),
    }) as never,
    y: chartValueAxis(locale, { scale: scaleLinear, grid: true }) as never,
    ...options,
  } as never);
}

/** Mounts an animated chart and hands back a "swap the data" control. */
function mountAnimatedChart(options?: {
  reducedMotion?: boolean;
  animate?: boolean;
  chartMotionOptions?: Parameters<typeof chartMotion>[0];
}) {
  stubMotionEnvironment({ reducedMotion: options?.reducedMotion ?? false });
  const animate = options?.animate ?? true;

  const element = (rows: MotionRow[], extraSeries: boolean) => (
    <ChartContainer
      config={CONFIG}
      locale="fa-IR"
      label="فروش ماهانه"
      animate={animate}
      definition={
        motionDefinition(
          rows,
          "fa-IR",
          options?.chartMotionOptions ? { svgAnimation: chartMotion(options.chartMotionOptions) } : {},
          extraSeries,
        ) as never
      }
      data={rows}
      categoryKey="month"
      dataCaption="داده‌های نمودار فروش ماهانه"
      height={SURFACE_HEIGHT}
      initialWidth={SURFACE_WIDTH}
    />
  );

  const { container, rerender } = render(element(DATA, false));
  return {
    container,
    swap(rows: MotionRow[], extraSeries = false) {
      act(() => {
        rerender(element(rows, extraSeries));
      });
    },
  };
}

describe("chart motion — the defaults, and the one that is not negotiable", () => {
  it("defineChart turns motion ON, with no option passed", () => {
    const definition = defineChart({ marks: [], x: null, y: null } as never) as unknown as Record<
      string,
      unknown
    >;
    expect(definition["svgAnimation"]).toEqual({
      duration: CHART_MOTION_UPDATE_DURATION,
      easing: "ease-out",
      respectReducedMotion: true,
    });
  });

  it("a caller can turn motion OFF — less motion is never the unsafe direction", () => {
    const definition = defineChart({
      marks: [],
      x: null,
      y: null,
      svgAnimation: false,
    } as never) as unknown as Record<string, unknown>;
    expect(definition["svgAnimation"]).toBe(false);
  });

  it("a caller CANNOT turn reduced-motion respect off — it is re-pinned after the spread", () => {
    /*
     * The whole point of `CHART_MOTION_REDUCED_MOTION_IS_TOTAL`. Upstream's
     * `resolveAnimation` reads `configured.respectReducedMotion ?? true`, so
     * upstream's DEFAULT is already right — and a default is exactly what a
     * caller spreading their own options object drops without noticing. This is
     * the line that makes it not theirs to drop.
     */
    const definition = defineChart({
      marks: [],
      x: null,
      y: null,
      svgAnimation: { duration: 900, easing: "linear", respectReducedMotion: false },
    } as never) as unknown as Record<string, unknown>;
    expect(definition["svgAnimation"]).toEqual({
      duration: 900,
      easing: "linear",
      respectReducedMotion: true,
    });
    expect(CHART_MOTION_REDUCED_MOTION_IS_TOTAL).toBe(true);
  });

  it("chartMotion carries duration and easing, and nothing that could weaken it", () => {
    expect(chartMotion()).toEqual({
      duration: CHART_MOTION_UPDATE_DURATION,
      easing: "ease-out",
      respectReducedMotion: true,
    });
    const custom = (progress: number) => progress * progress;
    expect(chartMotion({ duration: 900, easing: custom })).toEqual({
      duration: 900,
      easing: custom,
      respectReducedMotion: true,
    });
    // `resize` is absent on purpose: `resolveAnimation` returns undefined for a
    // resize unless `configured.resize === true`, so leaving it out means a plot
    // does not re-animate while the reader drags their window.
    expect(Object.keys(chartMotion()).sort()).toEqual([
      "duration",
      "easing",
      "respectReducedMotion",
    ]);
  });
});

describe("chart motion — the first paint is never animated by the ENGINE", () => {
  it("paints final geometry and schedules no frame", () => {
    /*
     * `renderer.js:91` — `animation: hasRendered ? resolveAnimation(…) :
     * undefined`. This is the measurement chart.tsx's header cites, and it is
     * the reason the enter animation is CSS: the engine will not do it, and the
     * served bytes must stay the finished plot regardless.
     */
    const { container } = mountAnimatedChart();
    expect(barHeights(container)).toEqual([67, 117.25, 44.67, 167.5]);
    expect(frames.pending()).toBe(0);
  });
});

describe("chart motion — a data change tweens, and lands exactly", () => {
  it("passes through the midpoint under a linear curve", () => {
    const { container, swap } = mountAnimatedChart({
      chartMotionOptions: { duration: 1000, easing: "linear" },
    });
    const before = barHeights(container);
    swap(LATER);

    // The rerender alone changes nothing on screen: the tween owns the
    // attribute until a frame runs. Without `svgAnimation` this line would
    // already read the new heights — that is what the `animate={false}` case
    // below asserts.
    expect(barHeights(container)).toEqual(before);

    frames.run(0);
    frames.run(500);
    const halfway = barHeights(container);
    frames.run(1000);
    const after = barHeights(container);

    expect(after).toEqual([16.75, 50.25, 145.17, 78.17]);
    for (const [index, value] of halfway.entries()) {
      expect(value).toBeCloseTo(((before[index] as number) + (after[index] as number)) / 2, 5);
    }
    // It ends. A tween that keeps requesting frames is a battery defect.
    expect(frames.pending()).toBe(0);
  });

  it("honours a custom easing FUNCTION, which is a thing recharts has no form of", () => {
    const { container, swap } = mountAnimatedChart({
      chartMotionOptions: { duration: 1000, easing: (progress) => progress * progress },
    });
    const before = barHeights(container)[0] as number;
    swap(LATER);
    frames.run(0);
    frames.run(500);
    // Quadratic: progress 0.5 eases to 0.25, so the first bar is a QUARTER of
    // the way from 67 to 16.75 — 54.44 — not the 41.88 a linear curve gives.
    // Precision 2, not 5: `reconcile.js`'s own `formatNumber` rounds every
    // interpolated value to three decimals before it reaches the attribute.
    expect(barHeights(container)[0]).toBeCloseTo(before + (16.75 - before) * 0.25, 2);
  });

  it("fades a series IN when it appears and OUT before removing it", () => {
    const { container, swap } = mountAnimatedChart({
      chartMotionOptions: { duration: 1000, easing: "linear" },
    });
    const seriesGroups = () =>
      [...container.querySelectorAll("g.ts-chart__bar")].map((group) =>
        group.getAttribute("opacity"),
      );

    expect(container.querySelectorAll("rect")).toHaveLength(4);

    swap(DATA, true);
    frames.run(0);
    frames.run(500);
    // `addEnterTween` sets the NEW group's opacity to 0 and interpolates to its
    // target, so at the halfway frame of a linear tween it reads 0.5. The
    // retained group has no opacity attribute at all, which is how a
    // never-animated element differs from one at full opacity.
    expect(seriesGroups()).toEqual([null, "0.5"]);
    frames.run(1000);
    expect(seriesGroups()).toEqual([null, null]);

    swap(DATA, false);
    // The exiting group is STILL IN THE DOM — `addExitTween` marks it
    // `removeOnFinish`, so removal is the tween's last act rather than its
    // first. This is the assertion that distinguishes an exit animation from a
    // deletion followed by nothing.
    expect(container.querySelectorAll("rect")).toHaveLength(8);
    frames.run(0);
    frames.run(500);
    expect(seriesGroups()).toEqual([null, "0.5"]);
    frames.run(1000);
    expect(container.querySelectorAll("rect")).toHaveLength(4);
  });
});

describe("chart motion — prefers-reduced-motion means NO motion, not less", () => {
  it("lands on the final value in the same tick, with no frame scheduled", () => {
    /*
     * Not a shorter tween, not a cross-fade: `resolveAnimation` returns
     * `undefined` and `reconcileChartSvg` is called with no animation at all, so
     * `syncAttributes` writes the target straight onto the element.
     * `frames.pending() === 0` is the assertion that says "nothing was even
     * scheduled" — a reduced-duration animation would still queue a frame here.
     */
    const { container, swap } = mountAnimatedChart({
      reducedMotion: true,
      chartMotionOptions: { duration: 1000, easing: "linear" },
    });
    swap(LATER);
    expect(barHeights(container)).toEqual([16.75, 50.25, 145.17, 78.17]);
    expect(frames.pending()).toBe(0);
  });

  it("the CSS half says the same thing, in a query no prop can reach", () => {
    // The JS half above is enforced by `defineChart`. This is the other half —
    // and it is the stronger one, because a media query is evaluated by the
    // browser and there is no flag in Lumo's code to forget.
    const css = chartMotionStyleSheet("chart-x");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("animation: none;");
    expect(reduced).toContain("transform: none;");
    // Every selector the motion sheet animates is named in the reduce block. A
    // block that silences two of three rules is the defect this asserts against.
    for (const part of [".ts-chart__marks", ".ts-chart__grid", ".ts-chart__axes"]) {
      expect(reduced).toContain(part);
    }
  });
});

describe("chart motion — the first paint IS animated, in CSS, and only in CSS", () => {
  it("the served stylesheet staggers the marks and moves the guides separately", () => {
    const css = chartMotionStyleSheet("chart-x");
    // Scoped to this chart alone, and to the `on` state.
    expect(css).toContain(`[data-chart="chart-x"][${CHART_MOTION_ATTRIBUTE}="on"]`);
    expect(css).toContain("@keyframes lumo-chart-mark-enter");
    expect(css).toContain("@keyframes lumo-chart-guide-enter");
    // The stagger: one rule per datum position, the second one delayed by
    // exactly one step, and the last one open-ended so a long series does not
    // enter in two waves.
    expect(css).toContain(`:nth-child(2) { animation-delay: ${CHART_MOTION_STAGGER}ms; }`);
    expect(css).toContain(`:nth-child(n + ${CHART_MOTION_STAGGER_STEPS})`);
    expect(css.match(/animation-delay:/g)).toHaveLength(CHART_MOTION_STAGGER_STEPS + 1);
    // Per-part motion — the thing `svgAnimation` cannot express, because it is
    // ONE options object for the whole scene. Three selectors, two keyframes,
    // and the guides deliberately arrive after the marks.
    expect(css).toContain(`${CHART_MOTION_MARK_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`);
    expect(css).toContain(`${CHART_MOTION_GUIDE_DURATION}ms ease-out`);
  });

  it("moves on the BLOCK axis only — a transform has no logical form", () => {
    const css = chartMotionStyleSheet("chart-x");
    expect(css).toContain("scaleY(");
    expect(css).toContain("translateY(");
    // The inline axis is where this library's whole thesis lives. A `scaleX` or
    // `translateX` here would be a physical direction baked into a component
    // that mirrors, and nothing else in the build would catch it.
    expect(css).not.toContain("scaleX(");
    expect(css).not.toContain("translateX(");
    // Without `fill-box` every bar scales about the SVG origin and the plot
    // slides across the canvas instead of growing in place.
    expect(css).toContain("transform-box: fill-box;");
  });

  it("is served, and marks the container, only when animation is on", () => {
    const on = renderToStaticMarkup(
      <ChartContainer
        config={CONFIG}
        locale="fa-IR"
        label="فروش ماهانه"
        definition={definitionFor("fa-IR") as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار فروش ماهانه"
      />,
    );
    const off = renderToStaticMarkup(
      <ChartContainer
        config={CONFIG}
        locale="fa-IR"
        label="فروش ماهانه"
        animate={false}
        definition={definitionFor("fa-IR") as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار فروش ماهانه"
      />,
    );
    expect(on).toContain(`${CHART_MOTION_ATTRIBUTE}="on"`);
    expect(on).toContain("@keyframes lumo-chart-mark-enter");
    expect(off).toContain(`${CHART_MOTION_ATTRIBUTE}="off"`);
    expect(off).not.toContain("@keyframes");
  });
});

describe("chart motion — the served bytes are motion-BLIND", () => {
  it("every text node and every plotted coordinate is identical with motion on and off", () => {
    /*
     * THE PROPERTY THE GATE DEPENDS ON, and the reason a CSS enter animation is
     * admissible at all in this library. `lumo-gate` grades the SERVED HTML: if
     * turning motion on changed one tick, one figure or one bar, the thing the
     * gate graded would not be the thing on screen.
     *
     * The `<style>` element differs — that is the animation — and `<style>` is
     * one of the two subtrees `rules.ts` skips outright, so it is invisible to
     * every rule including `no-latin-digits`. Everything the gate DOES read is
     * compared here byte for byte.
     */
    const strip = (html: string) =>
      html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
        .replace(new RegExp(`\\s${CHART_MOTION_ATTRIBUTE}="(on|off)"`, "g"), "");

    const on = renderToStaticMarkup(
      <ChartContainer
        config={CONFIG}
        locale="fa-IR"
        label="فروش ماهانه"
        id="fixed"
        definition={definitionFor("fa-IR") as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار فروش ماهانه"
      />,
    );
    const off = renderToStaticMarkup(
      <ChartContainer
        config={CONFIG}
        locale="fa-IR"
        label="فروش ماهانه"
        id="fixed"
        animate={false}
        definition={definitionFor("fa-IR") as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار فروش ماهانه"
      />,
    );
    expect(strip(on)).toBe(strip(off));
    // And the plot really is in there — a pair of empty strings would satisfy
    // the line above.
    expect(texts(strip(on)).length).toBeGreaterThan(4);
  });
});

describe("chart motion — animate={false} is ONE switch that reaches both halves", () => {
  it("strips svgAnimation from the definition, so a data change jumps", () => {
    /*
     * The CSS half is asserted above (no `@keyframes` served). This is the
     * ENGINE half: `animate={false}` copies the definition with
     * `svgAnimation: false`, so `resolveAnimation` returns undefined and
     * `reconcileChartSvg` writes the target attributes synchronously. A caller
     * who turns motion off and still gets a 320ms tween on every data change is
     * worse served than one with no switch at all.
     */
    const { container, swap } = mountAnimatedChart({ animate: false });
    swap(LATER);
    expect(barHeights(container)).toEqual([16.75, 50.25, 145.17, 78.17]);
    expect(frames.pending()).toBe(0);
  });

  it("does not mutate the definition it was handed", () => {
    // The caller may be memoising it. A wrapper that writes into its own props
    // is a bug that surfaces three components away.
    const definition = motionDefinition(DATA, "fa-IR") as unknown as Record<string, unknown>;
    const before = definition["svgAnimation"];
    stubMotionEnvironment({ reducedMotion: false });
    render(
      <ChartContainer
        config={CONFIG}
        locale="fa-IR"
        label="فروش ماهانه"
        animate={false}
        definition={definition as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار فروش ماهانه"
      />,
    );
    expect(definition["svgAnimation"]).toBe(before);
  });
});

describe("chart interaction — keyboard, which recharts has no equivalent of", () => {
  /**
   * Walks a mounted chart with the keyboard and reports the ROWS it visited.
   *
   * `focusin`, then whichever keys the case names. Every value it collects came
   * back through `onActiveDatum`/`onSelectDatum`, so this is also the assertion
   * that those two hand back the caller's own row rather than a `ChartPoint`.
   */
  function walkWithKeyboard(locale: Locale, keys: readonly string[]) {
    stubMotionEnvironment({ reducedMotion: false });
    const active: (string | undefined)[] = [];
    const selected: (string | undefined)[] = [];
    const { container } = render(
      <ChartContainer
        config={CONFIG}
        locale={locale}
        label="فروش ماهانه"
        definition={motionDefinition(DATA, locale) as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار فروش ماهانه"
        height={SURFACE_HEIGHT}
        initialWidth={SURFACE_WIDTH}
        onActiveDatum={(row) => active.push(row?.["month"] as string | undefined)}
        onSelectDatum={(row) => selected.push(row?.["month"] as string | undefined)}
      />,
    );
    const plot = container.querySelector("svg");
    if (!plot) throw new Error("no plot mounted");
    act(() => {
      plot.dispatchEvent(new window.FocusEvent("focusin", { bubbles: true }));
    });
    for (const key of keys) {
      act(() => {
        plot.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true }));
      });
    }
    return { plot, active, selected };
  }

  it("is a Tab stop that answers its arrow keys — recharts' tooltip is pointer-only", () => {
    const { plot, active, selected } = walkWithKeyboard("en-US", ["ArrowRight", "Enter"]);
    expect(plot.getAttribute("tabindex")).toBe("0");
    expect(active).toEqual(["فروردین", "اردیبهشت"]);
    // Enter reports a SELECTION, separately from the focus that moved to it.
    expect(selected).toEqual(["اردیبهشت"]);
  });

  it("moves the ARROWS the right way under RTL, which is the half that is correct", () => {
    /*
     * In an RTL horizontal widget ArrowRight moves to the PREVIOUS item, and
     * that is exactly what happens: focus enters on تیر at the physical left and
     * ArrowRight walks rightwards — خرداد, اردیبهشت — which is backwards through
     * the data, i.e. towards the start of the reading order. Asserted before the
     * inverted case below so that a regression in the half that WORKS cannot
     * hide behind the half that does not.
     */
    const { active } = walkWithKeyboard("fa-IR", ["ArrowRight", "ArrowRight", "ArrowLeft"]);
    expect(active).toEqual(["تیر", "خرداد", "اردیبهشت", "خرداد"]);
  });

  it("INVERTED: Home, End and the entry point are physical under RTL, and pin the gap", () => {
    /*
     * `CHART_KEYBOARD_READING_ORDER` — see chart.variants.ts for the evidence and
     * for why reversing `focus.navigation()` trades this defect for a worse one.
     * This case asserts the WRONG behaviour on purpose, exactly as the value-axis
     * case above it does: the day upstream separates arrow order from Home/End
     * order, this goes red and says so.
     *
     * Read it against the en-US line below, which is right in every position.
     */
    expect(CHART_KEYBOARD_READING_ORDER).toBe(false);

    const rtl = walkWithKeyboard("fa-IR", ["Home", "End"]);
    // Entry lands on the LAST month; Home is already there so nothing is
    // reported, and End goes to the FIRST. Both keys name the wrong end.
    expect(rtl.active).toEqual(["تیر", "فروردین"]);

    // The same three keys in en-US, where every one of them is right.
    const ltr = walkWithKeyboard("en-US", ["Home", "End"]);
    expect(ltr.active).toEqual(["فروردین", "تیر"]);
  });

  it("does not attach a listener at all when no callback is given", () => {
    // `exactOptionalPropertyTypes` makes this a real distinction rather than a
    // stylistic one: the props are spread in conditionally, so an absent
    // callback means TanStack is never handed `undefined` to call.
    stubMotionEnvironment({ reducedMotion: false });
    const { container } = render(
      <ChartContainer
        config={CONFIG}
        locale="fa-IR"
        label="فروش ماهانه"
        definition={motionDefinition(DATA, "fa-IR") as never}
        data={DATA}
        categoryKey="month"
        dataCaption="داده‌های نمودار فروش ماهانه"
        height={SURFACE_HEIGHT}
        initialWidth={SURFACE_WIDTH}
      />,
    );
    const plot = container.querySelector("svg");
    expect(() => {
      act(() => {
        plot?.dispatchEvent(
          new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
      });
    }).not.toThrow();
  });
});
