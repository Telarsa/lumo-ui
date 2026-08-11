import { describe, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { defineChart } from "@tanstack/charts";
import { barY } from "@tanstack/charts/bar";
import { renderChartSvg } from "@tanstack/charts/svg";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";

const data = [
  { month: "فروردین", sales: 1200 },
  { month: "اردیبهشت", sales: 2100 },
  { month: "خرداد", sales: 800 },
  { month: "تیر", sales: 3000 },
];
const nf = new Intl.NumberFormat("fa-IR-u-nu-arabext");

describe("probe", () => {
  it("renders", () => {
    const def = defineChart({
      marks: [barY(data, { id: "sales", x: "month", y: "sales", fill: "#3b82f6" })],
      x: { scale: () => scaleBand<string>().padding(0.2), reverse: true, axis: { tickLabels: { anchor: "middle" } } },
      y: { scale: scaleLinear, nice: true, grid: true, axis: { ticks: { format: (v: number) => nf.format(v) }, tickLabels: { anchor: "start" } } },
    });
    const html = renderToStaticMarkup(
      <Chart
        definition={def}
        ariaLabel="نمودار فروش ماهانه"
        height={200}
        initialWidth={400}
        renderSvg={(scene, options) =>
          renderChartSvg(scene, options).replace('aria-roledescription="chart"', 'aria-roledescription="نمودار"')
        }
      />,
    );
    console.log("LEN", html.length, "svg?", html.includes("<svg"));
    console.log(html.slice(0, 900));
    console.log("ticks", [...html.matchAll(/>([^<>]+)<\/text>/g)].map((m) => m[1]));
  });
});
