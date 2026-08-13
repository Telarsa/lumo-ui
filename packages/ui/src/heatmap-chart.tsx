"use client";

import * as React from "react";
import { cell, colorGradientLegend } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { formatNumber, type Locale } from "@lumo-ui/core";

import { ChartContainer, defineChart, type ChartConfig } from "./chart.tsx";

export interface HeatmapDatum {
  id: string;
  x: string;
  y: string;
  value: number;
}

export interface HeatmapChartProps {
  locale: Locale;
  label: string;
  dataCaption: string;
  xAxisLabel: string;
  yAxisLabel: string;
  valueLabel: string;
  data: readonly HeatmapDatum[];
  height?: number;
  initialWidth?: number;
  lowColor?: string;
  highColor?: string;
  className?: string;
}

/** A labelled ordinal matrix with a semantic table in the served bytes. */
export function HeatmapChart({
  locale,
  label,
  dataCaption,
  xAxisLabel,
  yAxisLabel,
  valueLabel,
  data,
  height = 280,
  initialWidth,
  lowColor = "var(--color-surface-sunken)",
  highColor = "var(--color-accent)",
  className,
}: HeatmapChartProps) {
  const rows = React.useMemo(() => data.map((row) => ({ ...row })), [data]);
  const xDomain = React.useMemo(() => [...new Set(rows.map((row) => row.x))], [rows]);
  const yDomain = React.useMemo(() => [...new Set(rows.map((row) => row.y))], [rows]);
  const values = rows.map((row) => row.value);
  const min = values.length === 0 ? 0 : Math.min(...values);
  const max = values.length === 0 ? 1 : Math.max(...values);
  const definition = React.useMemo(
    () =>
      defineChart({
        marks: [
          cell(rows, {
            id: "heatmap-cells",
            x: "x",
            y: "y",
            color: "value",
            key: "id",
            inset: 1,
            radius: 3,
          }),
        ],
        x: {
          scale: () => scaleBand<string>().domain(xDomain).padding(0.04),
          axis: { label: xAxisLabel },
        },
        y: {
          scale: () => scaleBand<string>().domain(yDomain).padding(0.04),
          axis: { label: yAxisLabel },
        },
        color: {
          domain: [min, max],
          range: [lowColor, highColor],
          legend: colorGradientLegend({
            label: valueLabel,
            format: (value) =>
              typeof value === "number" ? formatNumber(value, locale) : String(value),
          }),
        },
      }),
    [highColor, locale, lowColor, max, min, rows, valueLabel, xAxisLabel, xDomain, yAxisLabel, yDomain],
  );
  const tableRows = rows.map((row) => ({ category: `${row.y} — ${row.x}`, value: row.value }));
  const config: ChartConfig = {
    category: { label: `${yAxisLabel} — ${xAxisLabel}` },
    value: { label: valueLabel, color: highColor },
  };

  return (
    <ChartContainer
      className={className}
      config={config}
      locale={locale}
      label={label}
      definition={definition}
      data={tableRows}
      categoryKey="category"
      dataCaption={dataCaption}
      height={height}
      initialWidth={initialWidth}
    />
  );
}
