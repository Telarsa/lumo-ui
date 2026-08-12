import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from "@lumo-ui/ui";

/**
 * A titled card around a chart, with the figures that survive when the chart
 * does not.
 *
 * ═══ WHY THE PLOT IS A SLOT AND NOT AN IMPORT ═══════════════════════════════
 *
 * `@lumo-ui/blocks` has no `recharts` dependency and this file adds none. The
 * chart arrives as a `chart: LumoNode` slot, the same way `AppShellNavItem.icon`
 * takes an icon rather than the blocks package taking an icon library.
 *
 * That is not tidiness, it is the only arrangement that keeps this block a
 * server component. recharts is `"use client"` and renders nothing on the
 * server (measured: 127 bytes, no `<svg>`, in every configuration — see
 * chart.tsx's header). If this file imported it, the whole panel — title,
 * description, summary figures, footer — would become a client island and the
 * first paint of a dashboard would be an empty box. With a slot, only the
 * caller's plot is client-side; everything around it is in the first byte.
 *
 * ── WHAT THE SUMMARY FIGURES ARE FOR ────────────────────────────────────────
 *
 * They are not decoration, and they are not a duplicate of the chart. A plot
 * that has not hydrated yet, or never will because JavaScript failed, leaves
 * the reader with a heading and nothing else. `summary` is the answer to "what
 * does this panel say" in the served bytes.
 *
 * `ChartContainer` also renders `<ChartData>` — the full table — inside the
 * caller's chart, so the complete rows are served too. The summary is the
 * glanceable version of the same truth: a table is what you read, a headline
 * figure is what you see. Both are graded by `lumo-gate`; neither depends on
 * the plot painting.
 *
 * ── THE FIGURES ARE NEVER RENDERED RAW ──────────────────────────────────────
 *
 * `ChartPanelSummaryItem.value` is a `number` and passes through
 * `formatNumber(value, locale, format)`. `<span>{item.value}</span>` would be
 * TS2322, because `children` is `LumoNode` — the same rule stat-grid.tsx exists
 * to demonstrate, and for the same reason: a panel of numbers is where Latin
 * digits reach a Persian reader most easily.
 *
 * No `"use client"`. A dashboard's first paint is the whole point.
 */
export interface ChartPanelStrings {
  /** Names the panel, e.g. «فروش ماهانه». Becomes the card's heading. */
  title: string;
  /** What the chart shows and over what period. Optional. */
  description?: string | undefined;
  /**
   * Shown INSTEAD of the chart when `isEmpty`, e.g. «داده‌ای برای این بازه نیست».
   *
   * Required whenever `isEmpty` can be true. A chart with no data otherwise
   * renders an axis pair around nothing, which reads as a loading state that
   * never resolves.
   */
  emptyLabel?: string | undefined;
}

export interface ChartPanelSummaryItem {
  /** Stable key. Not rendered. */
  id: string;
  /** What the figure measures, e.g. «مجموع فصل». */
  label: string;
  /** The figure. Never rendered raw — see the file header. */
  value: number;
  /**
   * `Intl.NumberFormat` options for this figure — `{style:"currency",
   * currency:"IRR"}`, `{notation:"compact"}`. Applied under the locale's own
   * numbering system, so digits stay Persian whatever the style.
   */
  format?: Intl.NumberFormatOptions | undefined;
}

export interface ChartPanelProps {
  /** The numbering system every summary figure is formatted in. Required. */
  locale: Locale;
  strings: ChartPanelStrings;
  /**
   * The chart itself, normally a `<ChartContainer>` inside a client component.
   *
   * Not typed as a specific element: this block deliberately knows nothing
   * about the renderer, which is what lets the chart library change without
   * touching this file. See the file header.
   */
  chart: LumoNode;
  /** Headline figures, served whether or not the plot ever paints. */
  summary?: readonly ChartPanelSummaryItem[] | undefined;
  /**
   * Controls above the plot — a period selector, a series toggle.
   *
   * A slot rather than props because those controls are stateful, and owning
   * that state here would make the panel a client component for the sake of one
   * dropdown, costing the first paint of everything else.
   */
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
         * `me-`/`ms-` never appear here: the header is a flex row and the gap
         * does the spacing, so there is no physical edge to name. A block that
         * needs a directional margin usually needs a different layout.
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
                 * `tabular-nums` so a column of figures does not jitter as the
                 * data changes. Persian digits are proportional by default in
                 * most faces, and a dashboard that reflows on every poll is
                 * harder to read than one that does not.
                 */}
                <dd className="text-lg font-medium tabular-nums text-fg">
                  {formatNumber(item.value, locale, item.format)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/*
         * `role="status"`: the panel usually empties because a filter changed,
         * and a sighted reader sees the plot vanish while a screen reader user
         * gets nothing. Announcing it is the only way the two agree.
         *
         * ── THE REGION IS MOUNTED ALWAYS; ITS CHILDREN ARE THE CONDITIONAL ──
         *
         * Until 12 Aug 2026 this was `isEmpty ? <p role="status"> : chart`, so
         * the live region came into existence at the same moment it acquired
         * its sentence. That is the arrangement least likely to be heard: a
         * live region is a promise about mutations to a node the reader's
         * software is ALREADY watching, and a node that arrives with its text
         * in it is a mutation of its parent instead. Base UI states the rule in
         * `combobox/empty/ComboboxEmpty.mjs:11-15` — the root "must remain
         * mounted… Avoid… conditional rendering. Prefer… conditionally
         * rendering its children instead" — and implements exactly that.
         *
         * `sr-only` rather than `hidden` for the populated case: content inside
         * `display: none` is not announced at all, so that would be the same
         * defect with a different attribute. `sr-only` is `position: absolute`,
         * which also means the node is NOT a flex item of the `gap-4` column
         * around it — a panel with a chart in it gains no stray 16px gap.
         *
         * `data-grid.tsx`'s `DataGridEmpty` carries the long version of this
         * argument, including the residue neither fix addresses: a panel that
         * is empty in its FIRST byte still mounts with its text already there,
         * and a live region present at load is not announced.
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
