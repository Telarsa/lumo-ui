import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeatmapChart } from "./heatmap-chart.tsx";
import { RadarChart } from "./radar-chart.tsx";
import { TreemapChart } from "./treemap-chart.tsx";
import { SankeyChart } from "./sankey-chart.tsx";

describe("advanced chart families", () => {
  it("serves heatmap geometry and the complete semantic matrix in Persian", () => {
    const html = renderToStaticMarkup(
      <HeatmapChart
        locale="fa-IR"
        label="نقشهٔ شدت فروش"
        dataCaption="داده‌های شدت فروش"
        xAxisLabel="فصل"
        yAxisLabel="تیم"
        valueLabel="فروش"
        data={[
          { id: "core-q1", x: "بهار", y: "هسته", value: 72 },
          { id: "cloud-q1", x: "بهار", y: "ابر", value: 94 },
        ]}
      />,
    );

    expect(html).toContain("<svg");
    expect(html).toContain("داده‌های شدت فروش");
    expect(html).toContain("هسته");
    const host = document.createElement("div");
    host.innerHTML = html;
    const tableText = host.querySelector("table")?.textContent;
    expect(tableText).toContain("۷۲");
    expect(tableText).not.toContain("72");
    const chartClass = host.querySelector('[data-slot="chart"]')?.getAttribute("class") ?? "";
    expect(chartClass).toContain("w-full");
    expect(chartClass).toContain("min-w-0");
    expect(chartClass).not.toContain("aspect-video");
  });

  it("serves every radar series as semantic table data", () => {
    const html = renderToStaticMarkup(
      <RadarChart
        locale="en-US"
        label="Product capability profile"
        dataCaption="Product capability data"
        dimensionLabel="Capability"
        maxValue={100}
        series={[
          { key: "lumo", label: "Lumo", color: "var(--color-accent)" },
          { key: "other", label: "Other", color: "var(--color-info)" },
        ]}
        data={[
          { dimension: "Accessibility", lumo: 96, other: 74 },
          { dimension: "RTL", lumo: 99, other: 60 },
          { dimension: "SSR", lumo: 95, other: 68 },
        ]}
      />,
    );

    expect(html).toContain("<svg");
    expect(html).toContain("Product capability data");
    expect(html).toContain("Accessibility");
    expect(html).toContain(">96<");
    expect(html).toContain(">74<");
  });

  it("keeps treemap input immutable and exposes hierarchy in the data table", () => {
    const rows = [
      { id: "root", parentId: null, label: "محصول", value: 0 },
      { id: "ui", parentId: "root", label: "رابط", value: 65 },
      { id: "data", parentId: "root", label: "داده", value: 35 },
    ] as const;
    const before = JSON.stringify(rows);

    const html = renderToStaticMarkup(
      <TreemapChart
        locale="fa-IR"
        label="سهم محصول"
        dataCaption="داده‌های سهم محصول"
        parentLabel="والد"
        valueLabel="سهم"
        data={rows}
      />,
    );

    expect(JSON.stringify(rows)).toBe(before);
    expect(html).toContain("<svg");
    expect(html).toContain("رابط");
    expect(html).toContain("۶۵");
    const host = document.createElement("div");
    host.innerHTML = html;
    expect(host.querySelector("table")?.textContent).not.toContain("root");
  });

  it("rejects a broken Sankey graph before rendering misleading geometry", () => {
    expect(() =>
      renderToStaticMarkup(
        <SankeyChart
          locale="en-US"
          label="Broken flow"
          dataCaption="Broken flow data"
          targetLabel="Target"
          valueLabel="Flow"
          nodes={[{ id: "source", label: "Source" }]}
          links={[{ id: "missing", source: "source", target: "absent", value: 10 }]}
        />,
      ),
    ).toThrow(/absent|endpoint|node/i);
  });

  it("serves Sankey node labels, flow values, and geometry", () => {
    const html = renderToStaticMarkup(
      <SankeyChart
        locale="fa-IR"
        label="جریان سفارش"
        dataCaption="داده‌های جریان سفارش"
        targetLabel="مقصد"
        valueLabel="جریان"
        nodes={[
          { id: "orders", label: "سفارش‌ها" },
          { id: "paid", label: "پرداخت‌شده" },
        ]}
        links={[{ id: "paid-flow", source: "orders", target: "paid", value: 42 }]}
      />,
    );

    expect(html).toContain("<svg");
    expect(html).toContain("سفارش‌ها");
    expect(html).toContain("پرداخت‌شده");
    expect(html).toContain("۴۲");
  });
});
