"use client";

import { angleGrid, polar, radialArea, radialGrid, radialLine } from "@tanstack/charts/polar";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { type Locale } from "@lumo-ui/core";

import { ChartContainer, ChartLegend, defineChart, type ChartConfig } from "./chart.tsx";
import { chartMirror } from "./chart.variants.ts";

export interface RadarSeries {
  key: string;
  label: string;
  color: string;
}

export interface RadarDatum {
  dimension: string;
  [series: string]: string | number;
}

export interface RadarChartProps {
  locale: Locale;
  /** The accessible name announced for the chart. */
  label: string;
  /** The accessible caption of the semantic data table served beside the chart. */
  dataCaption: string;
  /** The dimension column's name in the data table. */
  dimensionLabel: string;
  /** One row per dimension, each carrying a value under every series key. */
  data: readonly RadarDatum[];
  /** The profiles drawn, each a key into the rows with a label and color. */
  series: readonly RadarSeries[];
  /** The radial scale's maximum; every ring is a quarter of it. */
  maxValue: number;
  /** The drawing height in pixels. */
  height?: number;
  /** The width used for the server render and first frame. */
  initialWidth?: number;
  className?: string;
}

/** A comparative radar profile with explicit domains and tabular parity. */
export function RadarChart({
  locale,
  label,
  dataCaption,
  dimensionLabel,
  data,
  series,
  maxValue,
  height = 320,
  initialWidth,
  className,
}: RadarChartProps) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    throw new RangeError("RadarChart maxValue must be a positive finite number");
  }
  /*
   * The angular axis carries CATEGORIES, so it mirrors like every category
   * axis in this library — but on a circle the reflection is about the
   * vertical axis, not a reversal of the whole ring: the first dimension
   * stays at the top (a cycle has no reading start to move it to) and the
   * remaining dimensions proceed the other way round. Reversing the entire
   * domain instead would also rotate the polygon one step, which is not a
   * mirror. Under LTR the branch is the identity, as chartMirror requires.
   */
  const authored = data.map((row) => row.dimension);
  const dimensions =
    chartMirror(locale).direction === "rtl" && authored.length > 1
      ? [authored[0] as string, ...authored.slice(1).reverse()]
      : authored;
  const marks = series.flatMap((entry) => {
    const profile = data.map((row, index) => ({
      id: `${entry.key}-${index}`,
      dimension: row.dimension,
      value: Number(row[entry.key]),
    }));
    return [
      radialArea(profile, {
        id: `${entry.key}-area`,
        angle: "dimension",
        radius: "value",
        fill: entry.color,
        fillOpacity: 0.16,
      }),
      radialLine(profile, {
        id: `${entry.key}-line`,
        angle: "dimension",
        radius: "value",
        stroke: entry.color,
        strokeWidth: 2,
        points: true,
      }),
    ] as const;
  });
  const definition = defineChart({
    marks: [
      polar({
        radiusRatio: 0.72,
        angle: { scale: scalePoint<string>().domain(dimensions), wrap: true },
        radius: { scale: scaleLinear().domain([0, maxValue]) },
        guides: [
          radialGrid({ values: [maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue], shape: "polygon" }),
          angleGrid({ values: dimensions, labels: true }),
        ],
        marks,
      }),
    ],
    x: null,
    y: null,
    guides: false,
  });
  const config: ChartConfig = {
    dimension: { label: dimensionLabel },
    ...Object.fromEntries(series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])),
  };

  return (
    <ChartContainer
      className={className}
      config={config}
      locale={locale}
      label={label}
      definition={definition}
      data={data.map((row) => ({ ...row }))}
      categoryKey="dimension"
      dataCaption={dataCaption}
      height={height}
      initialWidth={initialWidth}
    >
      <ChartLegend />
    </ChartContainer>
  );
}
