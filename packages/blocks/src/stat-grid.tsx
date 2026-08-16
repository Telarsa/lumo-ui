import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Badge, Card, CardBody, Grid } from "@lumo-ui/ui";

/**
 * The row of headline figures at the top of a dashboard.
 *
 * The block rule 0 was written for: `StatItem.value` is a `number` NEVER
 * rendered raw (every figure goes through `formatNumber`, and `LumoNode` makes
 * the shortcut TS2322), and `locale` is a REQUIRED prop, not a context with a
 * default. The delta is never colour alone: `strings.increase`/`decrease` are
 * REQUIRED words rendered `sr-only` inside the badge (WCAG 1.4.1).
 *
 * No `"use client"` — a dashboard's first paint is the whole point, and there
 * are no callbacks here.
 */
export interface StatItem {
  /** Stable key. Not rendered. */
  id: string;
  /** What the figure measures, e.g. «درآمد ماه». */
  label: string;
  /** The figure itself. Never rendered raw — see the file header. */
  value: number;
  /** `Intl.NumberFormat` options for THIS stat, e.g. `{style:"currency",currency:"IRR"}`. Runs under the locale's own numbering system. */
  format?: Intl.NumberFormatOptions | undefined;
  /** Change against the previous period, as a FRACTION — `0.12`, not `12` (`Intl` multiplies by 100 itself). */
  delta?: number | undefined;
  /** What the delta is measured against, e.g. «نسبت به ماه گذشته». */
  deltaCaption?: string | undefined;
  /** A trailing glyph or sparkline. Rendered `aria-hidden`. */
  icon?: LumoNode;
}

export interface StatGridStrings {
  /** Announced name of the region wrapping the grid, e.g. «شاخص‌های کلیدی». Required. */
  regionLabel: string;
  /** Announced word for a positive delta. See the file header — colour is not enough. */
  increase: string;
  /** Announced word for a negative delta. */
  decrease: string;
}

export interface StatGridProps {
  strings: StatGridStrings;
  items: readonly StatItem[];
  /** Formats every figure in the grid. Required by design — see progress.tsx. */
  locale: Locale;
  /** Tracks per row. Default `"auto"` — as many 16rem columns as fit. */
  cols?: "2" | "3" | "4" | "auto" | undefined;
  className?: string | undefined;
}

/** Percent options for the delta badge, stated once so the two paths agree. */
const DELTA_FORMAT: Intl.NumberFormatOptions = {
  style: "percent",
  signDisplay: "exceptZero",
  maximumFractionDigits: 1,
};

export function StatGrid({ strings, items, locale, cols = "auto", className }: StatGridProps) {
  return (
    <section aria-label={strings.regionLabel} className={cn("w-full px-4", className)}>
      {/*
       * `Grid`: tracks run along the INLINE axis, so there is no mirroring work at all.
       */}
      <Grid cols={cols} gap="md">
        {items.map((item) => {
          // Read once into a local so the narrowing survives into the JSX below.
          const delta = item.delta;
          const isUp = delta !== undefined && delta > 0;
          const isDown = delta !== undefined && delta < 0;

          return (
            <Card key={item.id} variant="outlined">
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-sm text-fg-muted">{item.label}</span>
                  {item.icon !== undefined ? (
                    <span aria-hidden="true" className="shrink-0 text-fg-subtle [&_svg]:size-4">
                      {item.icon}
                    </span>
                  ) : null}
                </div>

                {/*
                 * The figure is a formatted STRING by the time it reaches JSX. No
                 * `tabular-nums`: theme.css sets `font-variant-numeric: normal` under
                 * `:lang(fa)` because `arabext` digits have no tabular variant.
                 */}
                <p className="text-2xl leading-tight font-semibold text-fg">
                  {formatNumber(item.value, locale, item.format)}
                </p>

                {delta !== undefined ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={isUp ? "positive" : isDown ? "critical" : "neutral"}
                      variant="subtle"
                    >
                      {/*
                       * The direction as a WORD, announced but not shown.
                       */}
                      {isUp || isDown ? (
                        <span className="sr-only">
                          {isUp ? strings.increase : strings.decrease}
                        </span>
                      ) : null}
                      {formatNumber(delta, locale, DELTA_FORMAT)}
                    </Badge>
                    {item.deltaCaption !== undefined ? (
                      <span className="text-xs text-fg-subtle">{item.deltaCaption}</span>
                    ) : null}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          );
        })}
      </Grid>
    </section>
  );
}
