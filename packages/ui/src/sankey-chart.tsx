"use client";

import { link, rect, text } from "@tanstack/charts";
import { sankeyDiagram } from "@tanstack/charts/network/sankey";
import type { Locale } from "@lumo-ui/core";

import { ChartContainer, defineChart, type ChartConfig } from "./chart.tsx";
import { chartMirror } from "./chart.variants.ts";

export interface SankeyNodeDatum {
  id: string;
  label: string;
  color?: string;
}

export interface SankeyLinkDatum {
  id: string;
  source: string;
  target: string;
  value: number;
}

export interface SankeyChartProps {
  locale: Locale;
  /** The accessible name announced for the chart, and the source column's name. */
  label: string;
  /** The accessible caption of the semantic data table served beside the chart. */
  dataCaption: string;
  /** The target column's name in the data table. */
  targetLabel: string;
  /** The value column's name in the data table. */
  valueLabel: string;
  /** The nodes, each a stable id with a display label. */
  nodes: readonly SankeyNodeDatum[];
  /** The flows: source node, target node, and the value that sizes the ribbon. */
  links: readonly SankeyLinkDatum[];
  /** The drawing height in pixels. */
  height?: number;
  /** The width used for the server render and first frame. */
  initialWidth?: number;
  className?: string;
}

/** A validated proportional-flow diagram with semantic source/target rows. */
export function SankeyChart({
  locale,
  label,
  dataCaption,
  targetLabel,
  valueLabel,
  nodes,
  links,
  height = 320,
  initialWidth,
  className,
}: SankeyChartProps) {
  const nodeRows = nodes.map((node) => ({ ...node }));
  const linkRows = links.map((flow) => ({ ...flow }));
  const labels = new Map(nodeRows.map((node) => [node.id, node.label]));
  /*
   * A flow diagram READS: sources at the reading start, targets at the reading
   * end. The engine's sankey always lays out left-to-right and its `align`
   * speaks physical sides, so the mirror has two halves and both are derived
   * from the same locale contract: the alignment side flips, and every
   * computed x reflects about the plot bounds the marks callback is handed.
   * Under LTR `flip` is the identity, so the mirrored path and the plain path
   * are the same code — the arrangement in which the mirrored one stays
   * working.
   */
  const rtl = chartMirror(locale).direction === "rtl";
  const definition = defineChart({
    marks: [
      sankeyDiagram({
        nodes: nodeRows,
        links: linkRows,
        nodeKey: "id",
        source: "source",
        target: "target",
        value: "value",
        linkKey: "id",
        align: rtl ? "right" : "left",
        nodePadding: 20,
        inset: { left: 18, right: 18, top: 28, bottom: 12 },
        marks: ({ chart, nodes: layoutNodes, links: layoutLinks }) => {
          const flip = (x: number) => (rtl ? 2 * chart.x + chart.width - x : x);
          return [
            link(layoutLinks, {
              id: "sankey-links",
              x1: (flow) => flip(flow.x1),
              y1: "y1",
              x2: (flow) => flip(flow.x2),
              y2: "y2",
              key: "key",
              stroke: "var(--color-accent)",
              strokeOpacity: 0.28,
              strokeWidth: (flow) => Math.max(1, flow.width),
              lineCap: "butt",
            }),
            rect(layoutNodes, {
              id: "sankey-nodes",
              // Reflection reverses edge order, so take lo/hi rather than
              // assuming x0 stays the left edge.
              x1: (node) => Math.min(flip(node.x0), flip(node.x1)),
              x2: (node) => Math.max(flip(node.x0), flip(node.x1)),
              y1: "y0",
              y2: "y1",
              key: "key",
              fill: "var(--color-accent)",
              inset: 0,
              radius: 2,
            }),
            text(layoutNodes, {
              id: "sankey-labels",
              x: (node) => flip(node.x),
              y: (node) => node.y0 - 8,
              text: (node) => node.data.label,
              key: "key",
              fill: "currentColor",
              fontSize: 12,
              fontWeight: 650,
            }),
          ] as const;
        },
      }),
    ],
    x: null,
    y: null,
    guides: false,
    margin: 0,
  });
  const config: ChartConfig = {
    source: { label },
    target: { label: targetLabel },
    value: { label: valueLabel, color: "var(--color-accent)" },
  };
  const tableRows = linkRows.map((flow) => ({
    source: labels.get(flow.source) ?? flow.source,
    target: labels.get(flow.target) ?? flow.target,
    value: flow.value,
  }));

  return (
    <ChartContainer
      className={className}
      config={config}
      locale={locale}
      label={label}
      definition={definition}
      data={tableRows}
      categoryKey="source"
      dataCaption={dataCaption}
      height={height}
      initialWidth={initialWidth}
    />
  );
}
