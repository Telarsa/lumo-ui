import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from "@lumo-ui/ui";

/**
 * A titled card around a chart, with the figures that survive when the chart
 * does not.
 *
 * The plot is a `chart: LumoNode` slot, not a recharts import — recharts is
 * client-only, so importing it would make the whole panel a client island.
 * `summary` figures are served regardless and always pass through `formatNumber`.
 *
 * No `"use client"`. A dashboard's first paint is the whole point.
 */
export interface ChartPanelStrings {
  /** Names the panel, e.g. «فروش ماهانه». Becomes the card's heading. */
  title: string;
  /** What the chart shows and over what period. Optional. */
  description?: string | undefined;
  /** Shown INSTEAD of the chart when `isEmpty`, e.g. «داده‌ای برای این بازه نیست». Required whenever `isEmpty` can be true. */
  emptyLabel?: string | undefined;
}

export interface ChartPanelSummaryItem {
  /** Stable key. Not rendered. */
  id: string;
  /** What the figure measures, e.g. «مجموع فصل». */
  label: string;
  /** The figure. Never rendered raw — see the file header. */
  value: number;
  /** `Intl.NumberFormat` options for this figure, applied under the locale's own numbering system. */
  format?: Intl.NumberFormatOptions | undefined;
}

export interface ChartPanelProps {
  /** The numbering system every summary figure is formatted in. Required. */
  locale: Locale;
  strings: ChartPanelStrings;
  /** The chart itself, normally a `<ChartContainer>` inside a client component. Untyped on purpose: this block knows nothing about the renderer. */
  chart: LumoNode;
  /** Headline figures, served whether or not the plot ever paints. */
  summary?: readonly ChartPanelSummaryItem[] | undefined;
  /** Controls above the plot — a period selector, a series toggle. A slot, so their state never makes this panel a client component. */
  toolbar?: LumoNode | undefined;
  /** Notes below the plot: a source, a caveat, a last-updated line. */
  footer?: LumoNode | undefined;
  /** Renders `strings.emptyLabel` in place of the chart. */
  isEmpty?: boolean | undefined;
  className?: string | undefined;
}

export function ChartPanel({
  locale,
  strings,
  chart,
  summary,
  toolbar,
  footer,
  isEmpty = false,
  className,
}: ChartPanelProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{strings.title}</CardTitle>
          {strings.description ? <CardDescription>{strings.description}</CardDescription> : null}
        </div>
        {/*
         * No `me-`/`ms-` here: the flex gap does the spacing, so there is no physical edge to name.
         */}
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        {summary && summary.length > 0 ? (
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            {summary.map((item) => (
              <div key={item.id} className="flex flex-col gap-0.5">
                <dt className="text-xs text-fg-muted">{item.label}</dt>
                {/*
                 * `tabular-nums` so a column of figures does not jitter as the data changes.
                 */}
                <dd className="text-lg font-medium tabular-nums text-fg">
                  {formatNumber(item.value, locale, item.format)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/*
         * `role="status"` announces the plot vanishing. The region is MOUNTED
         * ALWAYS and its children are the conditional — a live region that
         * arrives with its text is not announced. `sr-only`, not `hidden`, when
         * populated (`display:none` is never announced; absolute adds no flex gap).
         * data-grid.tsx's `DataGridEmpty` carries the long version.
         */}
        <p
          role="status"
          className={
            isEmpty
              ? "grid min-h-40 place-items-center rounded-md border border-dashed border-border p-6 text-center text-sm text-fg-muted"
              : "sr-only"
          }
        >
          {isEmpty ? strings.emptyLabel : null}
        </p>
        {isEmpty ? null : chart}
      </CardBody>

      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
