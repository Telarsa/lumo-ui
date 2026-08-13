"use client";

import { link, rect, text } from "@tanstack/charts";
import { sankeyDiagram } from "@tanstack/charts/network/sankey";
import type { Locale } from "@lumo-ui/core";

import { ChartContainer, defineChart, type ChartConfig } from "./chart.tsx";

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
  label: string;
  dataCaption: string;
  targetLabel: string;
  valueLabel: string;
  nodes: readonly SankeyNodeDatum[];
  links: readonly SankeyLinkDatum[];
  height?: number;
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
        align: "left",
        nodePadding: 20,
        inset: { left: 18, right: 18, top: 28, bottom: 12 },
        marks: ({ nodes: layoutNodes, links: layoutLinks }) =>
          [
            link(layoutLinks, {
              id: "sankey-links",
              x1: "x1",
              y1: "y1",
              x2: "x2",
              y2: "y2",
              key: "key",
              stroke: "var(--color-accent)",
              strokeOpacity: 0.28,
              strokeWidth: (flow) => Math.max(1, flow.width),
              lineCap: "butt",
            }),
            rect(layoutNodes, {
              id: "sankey-nodes",
              x1: "x0",
              x2: "x1",
              y1: "y0",
              y2: "y1",
              key: "key",
              fill: "var(--color-accent)",
              inset: 0,
              radius: 2,
            }),
            text(layoutNodes, {
              id: "sankey-labels",
              x: "x",
              y: (node) => node.y0 - 8,
              text: (node) => node.data.label,
              key: "key",
              fill: "currentColor",
              fontSize: 12,
              fontWeight: 650,
            }),
          ] as const,
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
