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

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Chart as BareTanstackChart } from "@tanstack/charts/react";

import {
  ChartContainer,
  ChartData,
  ChartLegend,
  barY,
  chartTooltip,
  defineChart,
  scaleBand,
  scaleLinear,
} from "./chart.tsx";
import { focusGroupX, focusNearestX } from "@tanstack/charts/focus";
import {
  CHART_PIE_SWEEP,
  CHART_PIE_SWEEP_HALF,
  CHART_ROLE_DESCRIPTION,
  CHART_VALUE_AXIS_TRAILING_EDGE,
  TANSTACK_ROLE_DESCRIPTION,
  chartCategoryAxis,
  chartColorVar,
  chartMirror,
  chartStyleSheet,
  chartTickFormatter,
  chartValueAxis,
  type ChartConfig,
} from "./chart.variants.ts";
import { formatNumber, type Locale } from "@lumo-ui/core";

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
    expect(visible.join(" ")).not.toMatch(/[0-9]/);
  });

  it("the data table is not aria-hidden", () => {
    // `sr-only` is a decision about sighted layout. `aria-hidden` would remove
    // the table from the gate AND from the screen reader at once, which is the
    // difference between an equivalent and a hiding place.
    const html = chart();
    const table = html.slice(html.indexOf('data-slot="chart-data"'));
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
    expect(html).toContain(`aria-roledescription="${CHART_ROLE_DESCRIPTION["fa-IR"]}"`);
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
      `aria-roledescription="${CHART_ROLE_DESCRIPTION["en-US"]}"`,
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
 * These assert a DEFAULT rather than a behaviour, which is unusual here and
 * deliberate: the behaviour lives in TanStack's renderer and is not reachable
 * from jsdom, since it needs a laid-out plot and real pointer coordinates.
 * What IS reachable, and what actually regressed, is whether the definition
 * carries the strategy at all — the failure was never "the hit test is subtly
 * wrong", it was "nobody passed `focus`, so it stayed radial".
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
