/**
 * Two lines of defence, over two different things.
 *
 * This file used to open by saying it was the ONLY one, because recharts serves
 * no bytes and `lumo-gate` grades bytes. That is now half true. The PLOT is
 * still ungraded by the gate and every geometry assertion below is still the
 * only thing standing between a Persian dashboard and a mirrored axis.
 *
 * But the FIGURES are graded, because `ChartContainer` renders `<ChartData>` —
 * a real `<table>` — into the served HTML. The first describe block proves both
 * halves: no `<svg>`, and the rows present anyway.
 *
 * That split matters when reading a failure. A geometry test going red means
 * recharts changed. A `ChartData` test going red means the served bytes changed,
 * which the gate will also have caught on the built site.
 *
 * Each assertion here corresponds to a sentence in `chart.variants.ts`'s header
 * that says "measured". If a recharts upgrade changes one of these numbers, the
 * build fails instead of the dashboard quietly growing an axis of Latin digits.
 */

import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
} from "recharts";

import {
  CHART_PIE_SWEEP,
  CHART_PIE_SWEEP_HALF,
  ChartCategoryAxis,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartPie,
  ChartValueAxis,
  ChartValueLabelList,
  chartColor,
  chartMirror,
  chartStyleSheet,
  chartTickFormatter,
  type ChartConfig,
} from "./chart.tsx";

afterEach(cleanup);

const ASCII_DIGIT = /[0-9]/;
const PERSIAN_DIGIT = /[۰-۹]/;
const LATIN_WORD = /[A-Za-z]{3,}/;

const data = [
  { month: "فروردین", sales: 1200 },
  { month: "اردیبهشت", sales: 2400 },
];

const config = {
  sales: { label: "فروش", color: "oklch(0.6 0.15 250)" },
} satisfies ChartConfig;

function Chart({ locale }: { locale: "fa-IR" | "en-US" }) {
  return (
    <ChartContainer
      config={config}
      locale={locale}
      label="نمودار فروش ماهانه"
      data={data}
      categoryKey="month"
      dataCaption="داده‌های فروش ماهانه"
    >
      <BarChart data={data} width={400} height={200}>
        <ChartCategoryAxis dataKey="month" />
        <ChartValueAxis />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="sales" fill={chartColor("sales")} />
      </BarChart>
    </ChartContainer>
  );
}

/** Every `<text>` the chart drew, as `{ x, orientation, anchor, text }`. */
function ticks(root: ParentNode) {
  return Array.from(root.querySelectorAll("text.recharts-cartesian-axis-tick-value")).map(
    (el) => ({
      x: Number(el.getAttribute("x")),
      orientation: el.getAttribute("orientation"),
      anchor: el.getAttribute("text-anchor"),
      text: el.textContent ?? "",
    }),
  );
}

describe("chart — the plot is not served, but the figures are", () => {
  it("recharts still renders no plot on the server", () => {
    const html = renderToStaticMarkup(<Chart locale="fa-IR" />);

    // The claim, stated precisely: no <svg>. If a recharts release ever starts
    // server-rendering, THIS test fails — and that is a good failure, because
    // it means the plot itself becomes gradeable.
    expect(html).not.toContain("<svg");
    expect(html).toContain("recharts-wrapper");
    // The plot's own accessible name never lands, because the element carrying
    // it is never emitted.
    expect(html).not.toContain('aria-label="نمودار فروش ماهانه"');
  });

  it("`ChartData` puts the actual rows in the served bytes", () => {
    const html = renderToStaticMarkup(<Chart locale="fa-IR" />);

    // This is what replaced "no gate can see this component". The figures a
    // reader needs are served as a table whether or not the plot ever paints.
    expect(html).toContain("<table");
    expect(html).toContain("<caption>داده‌های فروش ماهانه</caption>");
    expect(html).toContain("فروردین");
    expect(html).toContain("اردیبهشت");
    expect(html).toContain('scope="row"');
    expect(html).toContain('scope="col"');
  });

  it("serves Persian digits, so a chart route can meet the floor honestly", () => {
    const html = renderToStaticMarkup(<Chart locale="fa-IR" />);
    // ۱٬۲۰۰ and ۲٬۴۰۰ — the values, not the axis ticks. An SSR'd <svg> would
    // have given ticks; only the table gives the data.
    expect(html).toContain("۱٬۲۰۰");
    expect(html).toContain("۲٬۴۰۰");
    expect(PERSIAN_DIGIT.test(html)).toBe(true);
  });

  it("serves no Latin digits on a Persian chart — the gate would fail the build", () => {
    const html = renderToStaticMarkup(<Chart locale="fa-IR" />);
    // Mirrors `lumo-gate`'s visibleTextNodes walk: attributes legitimately carry
    // Latin digits (widths, oklch coordinates), and `<style>` is in the rule's
    // NON_TEXT set — ChartStyle emits colour stops, which are numbers and are
    // not prose. Strip both before asserting, exactly as the gate does.
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]*>/g, " ");
    expect(ASCII_DIGIT.test(text)).toBe(false);
  });

  it("is not aria-hidden — that would hide it from the gate AND the reader", () => {
    const html = renderToStaticMarkup(<Chart locale="fa-IR" />);
    // `sr-only` is a layout decision. `aria-hidden` would be a correctness bug:
    // rules.ts skips aria-hidden subtrees, so the table would stop being graded
    // at the same moment it stopped being announced.
    expect(html).not.toContain("aria-hidden");
    expect(html).toContain('class="sr-only"');
  });

  it("formats through the caller's locale, not a fixed one", () => {
    const html = renderToStaticMarkup(<Chart locale="en-US" />);
    expect(html).toContain("1,200");
    expect(PERSIAN_DIGIT.test(html)).toBe(false);
  });
});

describe("chart — the axis is where a Persian reader expects it", () => {
  it("mirrors the category scale, so the first category sits at the reading start", () => {
    const { container: fa } = render(<Chart locale="fa-IR" />);
    const faCategories = ticks(fa).filter((t) => t.orientation === "bottom");
    cleanup();
    const { container: en } = render(<Chart locale="en-US" />);
    const enCategories = ticks(en).filter((t) => t.orientation === "bottom");

    expect(faCategories).toHaveLength(2);
    expect(enCategories).toHaveLength(2);
    // English: first category on the left. Persian: on the right. Same data,
    // same component, opposite geometry — which is the whole point of `reversed`.
    expect(enCategories[0]!.x).toBeLessThan(enCategories[1]!.x);
    expect(faCategories[0]!.x).toBeGreaterThan(faCategories[1]!.x);
  });

  it("moves the value axis to the trailing edge and states its text anchor", () => {
    const { container } = render(<Chart locale="fa-IR" />);
    const values = ticks(container).filter((t) => t.orientation !== "bottom");

    expect(values.length).toBeGreaterThan(0);
    for (const tick of values) {
      expect(tick.orientation).toBe("right");
      /*
       * `text-anchor` is DIRECTION-RELATIVE in SVG: "end" means the end of the
       * text in the inline base direction. recharts computes it as if the world
       * were LTR and would emit "start" for a right-hand axis, which under
       * `direction: rtl` puts the label INSIDE the plot. Stating "end" is the
       * inversion, and it is the one fix here that no amount of moving the axis
       * would have achieved.
       */
      expect(tick.anchor).toBe("end");
    }
  });

  it("leaves LTR alone — the mirrored path and the plain path are one code path", () => {
    const { container } = render(<Chart locale="en-US" />);
    const values = ticks(container).filter((t) => t.orientation !== "bottom");
    for (const tick of values) {
      expect(tick.orientation).toBe("left");
      expect(tick.anchor).toBe("end"); // recharts' own default, untouched
    }
    expect(chartMirror("en-US")).toEqual({
      direction: "ltr",
      mainAxis: {},
      crossAxis: {},
      tooltip: { reverseDirection: { x: false, y: false } },
    });
  });
});

describe("chart — every number recharts draws is in the reader's own digits", () => {
  it("formats the value axis, which recharts builds from the scale and nothing else reaches", () => {
    const { container } = render(<Chart locale="fa-IR" />);
    const values = ticks(container).filter((t) => t.orientation !== "bottom");

    expect(values.length).toBeGreaterThan(1);
    for (const tick of values) {
      expect(tick.text).not.toBe("");
      // The measured defect, inverted into an assertion: an unformatted axis
      // emitted `0 600 1200 1800 2400` on this exact chart.
      expect(ASCII_DIGIT.test(tick.text), `tick ${JSON.stringify(tick.text)}`).toBe(false);
      expect(PERSIAN_DIGIT.test(tick.text), `tick ${JSON.stringify(tick.text)}`).toBe(true);
    }
  });

  it("under en-US the same axis is Latin, so the formatter is doing work rather than nothing", () => {
    const { container } = render(<Chart locale="en-US" />);
    const values = ticks(container).filter((t) => t.orientation !== "bottom");
    expect(values.some((t) => ASCII_DIGIT.test(t.text))).toBe(true);
  });

  it("chartTickFormatter formats numbers, passes strings through, and refuses NaN", () => {
    const fa = chartTickFormatter("fa-IR");
    expect(ASCII_DIGIT.test(fa(1234))).toBe(false);
    expect(PERSIAN_DIGIT.test(fa(1234))).toBe(true);
    // A category tick is already an authored string; re-formatting it would be
    // wrong, and `String(NaN)` is the English word "NaN" in a Persian document.
    expect(fa("فروردین")).toBe("فروردین");
    expect(fa(Number.NaN)).toBe("");
    expect(fa(null)).toBe("");
  });
});

describe("chart — the one focusable element has a Persian name", () => {
  it("names the <svg> recharts makes a role=application tab stop", () => {
    const { container } = render(<Chart locale="fa-IR" />);
    const surface = container.querySelector("svg.recharts-surface[role]");

    // recharts' accessibility layer turns the plot into a keyboard-reachable
    // application region. Unnamed, it is announced as bare "application".
    expect(surface?.getAttribute("role")).toBe("application");
    expect(surface?.getAttribute("tabindex")).toBe("0");
    expect(surface?.getAttribute("aria-label")).toBe("نمودار فروش ماهانه");
  });

  it("announces no Latin word from any attribute a screen reader speaks", () => {
    const { container } = render(<Chart locale="fa-IR" />);
    const spoken: string[] = [];
    for (const el of container.querySelectorAll(
      "[aria-label],[aria-roledescription],[aria-valuetext],[title]",
    )) {
      for (const attr of ["aria-label", "aria-roledescription", "aria-valuetext", "title"]) {
        const v = el.getAttribute(attr);
        if (v) spoken.push(v);
      }
    }
    expect(spoken.filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });
});

describe("chart — recharts' OWN legend is the thing being replaced, not restyled", () => {
  it("the default legend leaks an English aria-label built from the dataKey", () => {
    /*
     * Pinned rather than fixed, exactly as `strings.ts` pins React Aria's
     * unreachable leaks. `DefaultLegendContent` composes
     * `aria-label={`${dataKey} legend icon`}` with no prop in front of it, so
     * the only cure is to not render it. The day recharts localises this, this
     * test goes red and `ChartLegendContent`'s justification can shrink.
     */
    const { container } = render(
      <ChartContainer
        config={config}
        locale="fa-IR"
        label="نمودار فروش ماهانه"
        data={data}
        categoryKey="month"
        dataCaption="داده‌های فروش ماهانه"
      >
        <BarChart data={data} width={400} height={200}>
          <Legend />
          <Bar dataKey="sales" fill={chartColor("sales")} />
        </BarChart>
      </ChartContainer>,
    );
    const leaked = Array.from(container.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label") ?? "")
      .filter((v) => LATIN_WORD.test(v));
    expect(leaked).toEqual(["sales legend icon"]);
  });

  it("Lumo's legend renders the configured Persian label and no aria-label at all", () => {
    const { container } = render(<Chart locale="fa-IR" />);
    const legend = container.querySelector(".recharts-legend-wrapper");
    expect(legend?.textContent).toContain("فروش");
    expect(legend?.querySelectorAll("[aria-label]")).toHaveLength(0);
    // recharts' default markup, which we are NOT rendering: an <li> carrying an
    // inline `margin-right`. Its absence is the assertion.
    expect(legend?.querySelector("li")).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE OTHER THREE SHAPES
 *
 * Bar was the first. Line, area and pie arrive with one new question each:
 * does the curve mirror with the axis (it does, and nothing extra says so), and
 * does the pie's sweep mirror (it does not, and that is a decision — see
 * `chart.variants.ts` above `CHART_PIE_SWEEP`).
 * ═══════════════════════════════════════════════════════════════════════════ */

const pieData = [
  { category: "خوراک", value: 50 },
  { category: "پوشاک", value: 50 },
];

const pieConfig = {
  category: { label: "دسته" },
  value: { label: "سهم", color: "oklch(0.6 0.15 250)" },
} satisfies ChartConfig;

/** The first `M x,y` of a path, which for a sector is where the sweep begins. */
function firstPoint(d: string): { x: number; y: number } {
  const m = /M\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/.exec(d);
  if (!m) throw new Error(`no move-to in ${JSON.stringify(d)}`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

/**
 * The final `L x,y` of a sector path — recharts closes a sector by drawing back
 * to the pie's centre, so this is the centre without having to compute it.
 */
function centrePoint(d: string): { x: number; y: number } {
  const tail = d.slice(d.lastIndexOf("L"));
  const m = /L\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/.exec(tail);
  if (!m) throw new Error(`no closing line-to in ${JSON.stringify(d)}`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

/**
 * The `sweep-flag` of a path's first arc. SVG defines 1 as "the arc is drawn in
 * the direction of increasing angle" — clockwise, in a y-down coordinate system.
 */
function sweepFlag(d: string): number {
  const a = /A\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([01])\s*,\s*([01])\s*,/.exec(
    d.replace(/\s+/g, " "),
  );
  if (!a) throw new Error(`no arc in ${JSON.stringify(d)}`);
  return Number(a[2]);
}

function sectorPaths(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll("path.recharts-sector")).map(
    (p) => p.getAttribute("d") ?? "",
  );
}

function LineDemo({ locale }: { locale: "fa-IR" | "en-US" }) {
  return (
    <ChartContainer
      config={config}
      locale={locale}
      label="نمودار خطی فروش"
      data={data}
      categoryKey="month"
      dataCaption="داده‌های فروش ماهانه"
    >
      <LineChart data={data} width={400} height={200}>
        <ChartCategoryAxis dataKey="month" />
        <ChartValueAxis />
        <Line dataKey="sales" stroke={chartColor("sales")} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
}

function AreaDemo({ locale }: { locale: "fa-IR" | "en-US" }) {
  return (
    <ChartContainer
      config={config}
      locale={locale}
      label="نمودار سطحی فروش"
      data={data}
      categoryKey="month"
      dataCaption="داده‌های فروش ماهانه"
    >
      <AreaChart data={data} width={400} height={200}>
        <ChartCategoryAxis dataKey="month" />
        <ChartValueAxis />
        <Area
          dataKey="sales"
          stroke={chartColor("sales")}
          fill={chartColor("sales")}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function PieDemo({ locale }: { locale: "fa-IR" | "en-US" }) {
  return (
    <ChartContainer
      config={pieConfig}
      locale={locale}
      label="سهم دسته‌ها از سبد خرید"
      data={pieData}
      categoryKey="category"
      dataCaption="داده‌های سهم دسته‌ها"
    >
      <PieChart width={320} height={200}>
        <ChartPie
          data={pieData}
          dataKey="value"
          nameKey="category"
          outerRadius={100}
          isAnimationActive={false}
        />
      </PieChart>
    </ChartContainer>
  );
}

describe("chart — line and area mirror through the axis and need nothing else", () => {
  it("the first plotted point sits at the reading start, in both shapes", () => {
    const { container: faLine } = render(<LineDemo locale="fa-IR" />);
    const faCurve = faLine.querySelector(".recharts-line-curve")?.getAttribute("d") ?? "";
    cleanup();
    const { container: enLine } = render(<LineDemo locale="en-US" />);
    const enCurve = enLine.querySelector(".recharts-line-curve")?.getAttribute("d") ?? "";

    expect(faCurve).not.toBe("");
    expect(enCurve).not.toBe("");
    // The claim in chart.tsx's header, made checkable: `reversed` acts on the
    // scale's RANGE, so the curve mirrors with the category axis and there is
    // no second thing for an author to remember. Persian starts on the right.
    expect(firstPoint(faCurve).x).toBeGreaterThan(firstPoint(enCurve).x);
  });

  it("the area's fill mirrors with its own curve rather than staying behind", () => {
    const { container: fa } = render(<AreaDemo locale="fa-IR" />);
    const faArea = fa.querySelector(".recharts-area-area")?.getAttribute("d") ?? "";
    cleanup();
    const { container: en } = render(<AreaDemo locale="en-US" />);
    const enArea = en.querySelector(".recharts-area-area")?.getAttribute("d") ?? "";

    expect(faArea).not.toBe("");
    expect(firstPoint(faArea).x).toBeGreaterThan(firstPoint(enArea).x);
  });

  it("still serves the figures, because ChartContainer renders the table for every shape", () => {
    const html = renderToStaticMarkup(<AreaDemo locale="fa-IR" />);
    expect(html).toContain("<table");
    expect(html).toContain("۱٬۲۰۰");
    expect(html).not.toContain("<svg");
  });
});

describe("chart — the pie's sweep is a decision, and the decision is not to mirror", () => {
  it("starts at the block start and winds clockwise", () => {
    const { container } = render(<PieDemo locale="fa-IR" />);
    const [first] = sectorPaths(container);
    expect(first).toBeTruthy();

    // cy − outerRadius: 12 o'clock. The centre is at the chart's own midpoint,
    // so the assertion is "the sweep begins directly above the centre".
    const start = firstPoint(first!);
    const centre = centrePoint(first!);
    expect(start.x).toBeCloseTo(centre.x, 5);
    expect(start.y).toBeLessThan(centre.y);
    // 1 = increasing angle = clockwise in SVG's y-down space.
    expect(sweepFlag(first!)).toBe(1);
  });

  it("draws IDENTICAL geometry under fa-IR and en-US — the whole argument, as an assertion", () => {
    const { container: fa } = render(<PieDemo locale="fa-IR" />);
    const faSectors = sectorPaths(fa);
    cleanup();
    const { container: en } = render(<PieDemo locale="en-US" />);
    const enSectors = sectorPaths(en);

    expect(faSectors.length).toBe(2);
    /*
     * Two mirror-imaged pies of one dataset read as two datasets — a sector
     * changes its neighbours and its side under a flip, where a bar only changes
     * its position and keeps its height. So the pie is the ONE place in this
     * file where equality between the directions is the correct result, and
     * this test is what stops a well-meaning future reader from "fixing" it.
     */
    expect(faSectors).toEqual(enSectors);
  });

  it("recharts' own default is neither: 3 o'clock, counter-clockwise", () => {
    const { container } = render(
      <ChartContainer
        config={pieConfig}
        locale="fa-IR"
        label="سهم دسته‌ها از سبد خرید"
        data={pieData}
        categoryKey="category"
        dataCaption="داده‌های سهم دسته‌ها"
      >
        <PieChart width={320} height={200}>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="category"
            outerRadius={100}
            isAnimationActive={false}
          />
        </PieChart>
      </ChartContainer>,
    );
    const [first] = sectorPaths(container);
    const start = firstPoint(first!);
    const centre = centrePoint(first!);
    // Starts level with the centre and to its right — 3 o'clock — and winds the
    // other way. Pinned rather than merely described: if a recharts release
    // changes its default, CHART_PIE_SWEEP's justification changes with it.
    expect(start.y).toBeCloseTo(centre.y, 5);
    expect(start.x).toBeGreaterThan(centre.x);
    expect(sweepFlag(first!)).toBe(0);
  });

  it("the sweep constants are a full turn and a half turn of the same winding", () => {
    expect(CHART_PIE_SWEEP.startAngle - CHART_PIE_SWEEP.endAngle).toBe(360);
    expect(CHART_PIE_SWEEP_HALF.startAngle - CHART_PIE_SWEEP_HALF.endAngle).toBe(180);
    // Decreasing angle in recharts' counter-clockwise degree space is clockwise
    // on screen. Both constants have to agree about that or a donut and a gauge
    // in one dashboard would wind opposite ways.
    expect(CHART_PIE_SWEEP.endAngle).toBeLessThan(CHART_PIE_SWEEP.startAngle);
    expect(CHART_PIE_SWEEP_HALF.endAngle).toBeLessThan(CHART_PIE_SWEEP_HALF.startAngle);
  });

  it("is not a second, unnameable tab stop", () => {
    const { container } = render(<PieDemo locale="fa-IR" />);
    const root = container.querySelector(".recharts-pie");
    // recharts' `defaultPieProps` sets `rootTabIndex: 0` on a <g> that receives
    // no other prop — verified in `PieImpl`, which passes it only `tabIndex` and
    // `className`. A tab stop that cannot be named is removed from the tab order
    // instead; the named `role="application"` surface is the way in.
    expect(root?.getAttribute("tabindex")).toBe("-1");
    // And no sector claims the chart's name: forwarding `aria-label` put the
    // SAME name on every sector path, which is worse than none.
    expect(container.querySelectorAll("path.recharts-sector[aria-label]")).toHaveLength(0);
  });
});

describe("chart — a figure drawn on the plot is formatted like every other figure", () => {
  const withList = (list: ReactNode) => (
    <ChartContainer
      config={config}
      locale="fa-IR"
      label="نمودار فروش ماهانه"
      data={data}
      categoryKey="month"
      dataCaption="داده‌های فروش ماهانه"
    >
      <BarChart data={data} width={400} height={200}>
        <Bar dataKey="sales" fill={chartColor("sales")} isAnimationActive={false}>
          {list}
        </Bar>
      </BarChart>
    </ChartContainer>
  );

  it("ChartValueLabelList draws Persian digits", () => {
    const { container } = render(
      withList(<ChartValueLabelList dataKey="sales" position="top" />),
    );
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent ?? "");
    expect(texts).toContain("۱٬۲۰۰");
    expect(texts.some((t) => ASCII_DIGIT.test(t))).toBe(false);
  });

  it("a bare recharts LabelList draws Latin ones — the defect being replaced", () => {
    const { container } = render(withList(<LabelList dataKey="sales" position="top" />));
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent ?? "");
    // Measured: `1200`, `2400`. The value never passes through JSX, so LumoNode
    // cannot catch it and no gate can see it — recharts serves no bytes.
    expect(texts).toContain("1200");
  });
});

describe("chart — the colour stylesheet fits Lumo's theme rather than shadcn's", () => {
  const css = chartStyleSheet("chart-x", {
    sales: { label: "فروش", theme: { light: "#111111", dark: "#eeeeee" } },
  });

  it("namespaces the custom property so it cannot shadow a Tailwind theme token", () => {
    // `--color-sales` would be fine; `--color-border` would repaint every
    // token-styled element inside the chart, and config keys come from callers.
    expect(css).toContain("--lumo-chart-sales:");
    expect(css).not.toContain("--color-");
  });

  it("targets all three of Lumo's theme states, not shadcn's single `.dark`", () => {
    expect(css).not.toContain(".dark ");
    expect(css).toContain('[data-chart="chart-x"]');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(':root:not([data-theme="light"])');
    expect(css).toContain('[data-theme="dark"]');
  });

  it("refuses a config key that could break out of the declaration", () => {
    // The key reaches a <style> through dangerouslySetInnerHTML, and config is
    // routinely built from an API response.
    const hostile = chartStyleSheet("chart-x", {
      "a} :root {--lumo-sys-bg: red": { label: "x", color: "#000" },
    });
    expect(hostile).toBe("");
  });
});
