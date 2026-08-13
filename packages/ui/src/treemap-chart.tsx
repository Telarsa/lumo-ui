"use client";

import { treemap } from "@tanstack/charts/hierarchy/treemap";
import type { Locale } from "@lumo-ui/core";

import { ChartContainer, defineChart, type ChartConfig } from "./chart.tsx";

export interface TreemapDatum {
  id: string;
  parentId: string | null;
  label: string;
  value: number;
  color?: string;
}

export interface TreemapChartProps {
  locale: Locale;
  label: string;
  dataCaption: string;
  parentLabel: string;
  valueLabel: string;
  data: readonly TreemapDatum[];
  height?: number;
  initialWidth?: number;
  className?: string;
}

/** A responsive hierarchical area chart; authored rows are never mutated. */
export function TreemapChart({
  locale,
  label,
  dataCaption,
  parentLabel,
  valueLabel,
  data,
  height = 300,
  initialWidth,
  className,
}: TreemapChartProps) {
  const rows = data.map((row) => ({ ...row }));
  const definition = defineChart({
    marks: [
      treemap(rows, {
        id: "treemap",
        nodeId: "id",
        parentId: "parentId",
        value: "value",
        color: (node) => node.ancestorIds[0] ?? node.id,
        fill: (node) => node.data?.color ?? "var(--color-accent)",
        fillOpacity: 0.82,
        stroke: "var(--color-surface)",
        strokeWidth: 1,
        paddingInner: 2,
        inset: 1,
        radius: 4,
        label: (node) => node.data?.label ?? node.name,
      }),
    ],
    x: null,
    y: null,
    guides: false,
    margin: 0,
  });
  const config: ChartConfig = {
    label: { label },
    parentId: { label: parentLabel },
    value: { label: valueLabel, color: "var(--color-accent)" },
  };
  const labels = new Map(rows.map((row) => [row.id, row.label]));
  const tableRows = rows.map((row) => ({
    label: row.label,
    parentId: row.parentId === null ? "" : (labels.get(row.parentId) ?? row.parentId),
    value: row.value,
  }));

  return (
    <ChartContainer
      className={className}
      config={config}
      locale={locale}
      label={label}
      definition={definition}
      data={tableRows}
      categoryKey="label"
      dataCaption={dataCaption}
      height={height}
      initialWidth={initialWidth}
    />
  );
}
