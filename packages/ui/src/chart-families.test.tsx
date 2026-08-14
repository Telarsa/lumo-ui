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

/**
 * The RTL mirror, graded on SERVED GEOMETRY rather than on configuration.
 *
 * Every assertion reads the `x` the SSR pass actually wrote next to a
 * `data-ts-key` that names the datum, and compares the same datum across the
 * two locales. These four families each bypass the shared category-axis
 * builders, which is exactly how all four shipped without the mirror the rest
 * of the chart system has — so the pin is on the output, where a regression
 * cannot hide behind an unwired option.
 */
describe("chart families deliver the caller's classes", () => {
  /*
   * Each family's only `className=` is the caller passthrough onto
   * ChartContainer — every other visible class belongs to chart.tsx. So the
   * one observation that dies with the family's visual mutant is that the
   * passthrough actually lands in the served bytes.
   */
  it("all four passthroughs reach the container", () => {
    const marker = "zz-styling-floor";
    const heat = renderToStaticMarkup(
      <HeatmapChart
        locale="en-US"
        label="Intensity"
        dataCaption="Intensity data"
        xAxisLabel="Quarter"
        yAxisLabel="Team"
        valueLabel="Sales"
        className={marker}
        data={[{ id: "a", x: "Q1", y: "Core", value: 10 }]}
      />,
    );
    const radar = renderToStaticMarkup(
      <RadarChart
        locale="en-US"
        label="Profile"
        dataCaption="Profile data"
        dimensionLabel="Dimension"
        maxValue={100}
        className={marker}
        series={[{ key: "one", label: "One", color: "var(--color-accent)" }]}
        data={[
          { dimension: "A", one: 10 },
          { dimension: "B", one: 20 },
          { dimension: "C", one: 30 },
        ]}
      />,
    );
    const tree = renderToStaticMarkup(
      <TreemapChart
        locale="en-US"
        label="Share"
        dataCaption="Share data"
        parentLabel="Parent"
        valueLabel="Value"
        className={marker}
        data={[
          { id: "root", parentId: null, label: "All", value: 0 },
          { id: "big", parentId: "root", label: "Big", value: 70 },
        ]}
      />,
    );
    const sankey = renderToStaticMarkup(
      <SankeyChart
        locale="en-US"
        label="Flow"
        dataCaption="Flow data"
        targetLabel="Target"
        valueLabel="Value"
        className={marker}
        nodes={[
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ]}
        links={[{ id: "ab", source: "a", target: "b", value: 10 }]}
      />,
    );
    for (const html of [heat, radar, tree, sankey]) {
      // Inside a CLASS attribute specifically — the campaign's mutant renames
      // the attribute and keeps the value, so a bare contains() cannot die.
      expect(html).toMatch(new RegExp(`class="[^"]*${marker}`));
    }
  });
});

describe("chart families mirror under RTL", () => {
  const xOf = (html: string, keyPart: string): number => {
    const tag = [...html.matchAll(/<(?:rect|text)\b[^>]*>/g)]
      .map((m) => m[0])
      .find((t) => t.includes(keyPart));
    const x = /\bx="([-\d.]+)"/.exec(tag ?? "");
    expect(x, `no x found for ${keyPart}`).toBeTruthy();
    return Number(x?.[1]);
  };

  it("sankey: sources sit at the reading start — right under fa-IR, left under en-US", () => {
    const render = (locale: "en-US" | "fa-IR") =>
      renderToStaticMarkup(
        <SankeyChart
          locale={locale}
          label="Flow"
          dataCaption="Flow data"
          targetLabel="Target"
          valueLabel="Value"
          initialWidth={400}
          nodes={[
            { id: "a", label: "AlphaNode" },
            { id: "b", label: "BetaNode" },
          ]}
          links={[{ id: "ab", source: "a", target: "b", value: 10 }]}
        />,
      );
    const ltr = render("en-US");
    const rtl = render("fa-IR");
    expect(xOf(ltr, "sankey-nodes") !== undefined).toBe(true);
    expect(xOf(ltr, ":a")).toBeLessThan(xOf(ltr, ":b"));
    expect(xOf(rtl, ":a")).toBeGreaterThan(xOf(rtl, ":b"));
    // The reflection is exact: the source node lands where the target was.
    expect(xOf(rtl, ":a")).toBeCloseTo(xOf(ltr, ":b"), 3);
    expect(xOf(rtl, ":b")).toBeCloseTo(xOf(ltr, ":a"), 3);
  });

  it("heatmap: the first x category sits at the reading start in both directions", () => {
    const render = (locale: "en-US" | "fa-IR") =>
      renderToStaticMarkup(
        <HeatmapChart
          locale={locale}
          label="Intensity"
          dataCaption="Intensity data"
          xAxisLabel="Quarter"
          yAxisLabel="Team"
          valueLabel="Sales"
          initialWidth={400}
          data={[
            { id: "first-col", x: "Q1", y: "Core", value: 10 },
            { id: "second-col", x: "Q2", y: "Core", value: 20 },
          ]}
        />,
      );
    const ltr = render("en-US");
    const rtl = render("fa-IR");
    expect(xOf(ltr, ":first-col")).toBeLessThan(xOf(ltr, ":second-col"));
    expect(xOf(rtl, ":first-col")).toBeGreaterThan(xOf(rtl, ":second-col"));
  });

  it("treemap: the largest tile opens at the reading start in both directions", () => {
    const render = (locale: "en-US" | "fa-IR") =>
      renderToStaticMarkup(
        <TreemapChart
          locale={locale}
          label="Share"
          dataCaption="Share data"
          parentLabel="Parent"
          valueLabel="Value"
          initialWidth={400}
          data={[
            { id: "root", parentId: null, label: "All", value: 0 },
            { id: "big", parentId: "root", label: "Big", value: 70 },
            { id: "small", parentId: "root", label: "Small", value: 30 },
          ]}
        />,
      );
    const ltr = render("en-US");
    const rtl = render("fa-IR");
    expect(xOf(ltr, ":big")).toBeLessThan(xOf(ltr, ":small"));
    expect(xOf(rtl, ":big")).toBeGreaterThan(xOf(rtl, ":small"));
  });

  it("radar: dimensions proceed the other way round while the first stays on top", () => {
    const render = (locale: "en-US" | "fa-IR") =>
      renderToStaticMarkup(
        <RadarChart
          locale={locale}
          label="Profile"
          dataCaption="Profile data"
          dimensionLabel="Dimension"
          maxValue={100}
          initialWidth={400}
          series={[{ key: "one", label: "One", color: "var(--color-accent)" }]}
          data={[
            { dimension: "Top", one: 50 },
            { dimension: "Second", one: 50 },
            { dimension: "Third", one: 50 },
          ]}
        />,
      );
    const angleLabelX = (html: string, label: string): number => {
      const tag = [...html.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].find((m) => m[1] === label);
      const x = /\bx="([-\d.]+)"/.exec(tag?.[0] ?? "");
      expect(x, `no angle label ${label}`).toBeTruthy();
      return Number(x?.[1]);
    };
    const ltr = render("en-US");
    const rtl = render("fa-IR");
    // Clockwise in LTR: the second dimension sits on the right of the third.
    expect(angleLabelX(ltr, "Second")).toBeGreaterThan(angleLabelX(ltr, "Third"));
    // Mirrored in RTL: the second dimension now sits on the left of the third.
    expect(angleLabelX(rtl, "Second")).toBeLessThan(angleLabelX(rtl, "Third"));
    // The first dimension does not move: a cycle's mirror fixes its axis.
    expect(angleLabelX(rtl, "Top")).toBeCloseTo(angleLabelX(ltr, "Top"), 1);
  });
});
