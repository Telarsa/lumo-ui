/**
 * The only line of defence this component has.
 *
 * Every other component in Lumo is graded twice: once here and once by
 * `lumo-gate`, which reads the bytes the server actually sent. A chart is graded
 * ONCE, because recharts sends nothing — measured below, and asserted first so
 * the reason this file is paranoid is the first thing anyone reads.
 *
 * So each assertion here corresponds to a sentence in `chart.variants.ts`'s
 * header that says "measured". If a recharts upgrade changes one of these
 * numbers, the build fails instead of a Persian dashboard quietly growing an
 * axis of Latin digits.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bar, BarChart, Legend } from "recharts";

import {
  ChartCategoryAxis,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartValueAxis,
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
    <ChartContainer config={config} locale={locale} label="نمودار فروش ماهانه">
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

describe("chart — the served HTML contains no chart at all", () => {
  it("recharts renders nothing on the server, so no gate can grade it", () => {
    const html = renderToStaticMarkup(<Chart locale="fa-IR" />);

    // The claim, stated precisely: a wrapper div and no <svg>. If a recharts
    // release ever starts server-rendering, THIS test fails — and that is a
    // good failure, because it means `lumo-gate` gains a chart to grade and the
    // warnings in chart.tsx's header can be deleted.
    expect(html).not.toContain("<svg");
    expect(html).toContain("recharts-wrapper");
    // Not one datum, not one category name, not one tick. The only thing served
    // is the colour stylesheet and an empty box.
    expect(html).not.toContain("فروردین");
    expect(html).not.toContain("فروش ماهانه"); // the aria-label never lands either
  });

  it("and therefore serves no Persian digits either — the floor cannot be met by a chart", () => {
    const html = renderToStaticMarkup(<Chart locale="fa-IR" />);
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
      <ChartContainer config={config} locale="fa-IR" label="نمودار فروش ماهانه">
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
