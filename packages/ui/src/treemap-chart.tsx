"use client";

import { treemap, type TreemapTile } from "@tanstack/charts/hierarchy/treemap";
import type { Locale } from "@lumo-ui/core";

import { ChartContainer, defineChart, type ChartConfig } from "./chart.tsx";
import { chartMirror } from "./chart.variants.ts";

/** What a tiler actually touches on a hierarchy node: the aggregated value it
 *  reads and the rectangle it writes. Named locally so the mirror below needs
 *  no direct dependency on `d3-hierarchy`'s types. */
interface TileRect {
  value?: number | undefined;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Squarified tiling with the row axis REFLECTED, for RTL treemaps.
 *
 * The engine's tilers have no direction lever — squarify always opens at the
 * physical top-left, which on a Persian page is the reading END. This is the
 * standard squarify algorithm (greedy rows, worst-aspect-ratio stopping rule,
 * golden-ratio target — the same defaults the engine documents), followed by
 * a reflection of each laid row about the parent rectangle's vertical axis.
 * The reflection is exact, so the mirrored layout is the LTR layout flipped,
 * not a different tiling.
 *
 * It is passed as `method` ONLY under RTL: under LTR the engine's own tiler
 * runs untouched, which keeps the identity property every mirror in
 * `chart.variants.ts` maintains.
 */
export function treemapMirroredSquarify<TDatum>(
  ...[parent, x0, y0, x1, y1]: Parameters<TreemapTile<TDatum>>
): void {
  const nodes = (parent.children ?? []) as unknown as TileRect[];
  const n = nodes.length;
  if (n === 0) return;
  const ratio = (1 + Math.sqrt(5)) / 2;
  const val = (node: TileRect) => node.value ?? 0;

  const dice = (row: TileRect[], rowValue: number, rx0: number, ry0: number, rx1: number, ry1: number) => {
    const k = rowValue > 0 ? (rx1 - rx0) / rowValue : 0;
    let x = rx0;
    for (const node of row) {
      node.y0 = ry0;
      node.y1 = ry1;
      node.x0 = x;
      node.x1 = x += val(node) * k;
    }
  };
  const slice = (row: TileRect[], rowValue: number, rx0: number, ry0: number, rx1: number, ry1: number) => {
    const k = rowValue > 0 ? (ry1 - ry0) / rowValue : 0;
    let y = ry0;
    for (const node of row) {
      node.x0 = rx0;
      node.x1 = rx1;
      node.y0 = y;
      node.y1 = y += val(node) * k;
    }
  };

  let value = val(parent as unknown as TileRect);
  let i0 = 0;
  const spanX0 = x0;
  const spanX1 = x1;
  while (i0 < n) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    let i1 = i0;
    let sumValue = 0;
    do sumValue = val(nodes[i1++] as TileRect); while (sumValue === 0 && i1 < n);
    let minValue = sumValue;
    let maxValue = sumValue;
    const alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    let beta = sumValue * sumValue * alpha;
    let minRatio = Math.max(maxValue / beta, beta / minValue);
    for (; i1 < n; ++i1) {
      const nodeValue = val(nodes[i1] as TileRect);
      sumValue += nodeValue;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      const newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = newRatio;
    }
    const row = nodes.slice(i0, i1);
    if (dx < dy) {
      const nextY0 = value > 0 ? y0 + (dy * sumValue) / value : y1;
      dice(row, sumValue, x0, y0, x1, nextY0);
      y0 = nextY0;
    } else {
      const nextX0 = value > 0 ? x0 + (dx * sumValue) / value : x1;
      slice(row, sumValue, x0, y0, nextX0, y1);
      x0 = nextX0;
    }
    value -= sumValue;
    i0 = i1;
  }

  /* The reflection, about the parent rectangle captured at entry — `x0`
   * advances while rows are laid, so the loop's final value is not the frame. */
  for (const node of nodes) {
    const nx0 = node.x0;
    node.x0 = spanX0 + spanX1 - node.x1;
    node.x1 = spanX0 + spanX1 - nx0;
  }
}

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
        // Under LTR this names the engine's own default, so nothing changes;
        // under RTL the same tiling is laid and then reflected, so the first
        // (largest) tile opens at the reading start. See the tiler above.
        method:
          chartMirror(locale).direction === "rtl" ? treemapMirroredSquarify : "squarify",
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
