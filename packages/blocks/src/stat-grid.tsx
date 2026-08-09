import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Badge, Card, CardBody, Grid } from "@lumo-ui/ui";

/**
 * The row of headline figures at the top of a dashboard.
 *
 * ═══ THE BLOCK THAT RULE 0 WAS WRITTEN FOR ══════════════════════════════════
 *
 * A stat grid is nothing BUT numbers, which makes it the likeliest place in an
 * application to ship `12,480` to a Persian reader who expects `۱۲٬۴۸۰`. The
 * defect renders, type-checks under a normal `ReactNode`, and looks right in
 * review — the exact shape of the calendar that shipped 77 of 77 Latin day
 * cells (packages/core/src/types.ts records it).
 *
 * Two things prevent it here, and they are types rather than diligence:
 *
 *  1. `StatItem.value` is a `number` and is NEVER rendered. Every figure goes
 *     through `formatNumber(value, locale, options)`, which applies
 *     `fa-IR-u-ca-persian-nu-arabext` and produces Persian digits with U+066C
 *     grouping. `<CardBody>{item.value}</CardBody>` would be TS2322, because
 *     `children` is `LumoNode`.
 *
 *  2. `locale` is a REQUIRED prop, not a context with a default. progress.tsx
 *     makes the whole argument: a context has a default value, and whatever
 *     that default is, a page that forgot the Provider renders confidently in
 *     the wrong numbering system with nothing red anywhere.
 *
 * ── THE DELTA IS NOT COMMUNICATED BY COLOUR ALONE ──────────────────────────
 *
 * A green `+12%` and a red `−4%` differ only in hue, which fails WCAG 1.4.1 and
 * is invisible to a screen reader entirely. So `strings.increase` /
 * `strings.decrease` are REQUIRED translated words, rendered `sr-only` inside
 * the badge. `signDisplay: "exceptZero"` puts a visible sign on the number for
 * the sighted case; the word is what makes it announced.
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
  /**
   * `Intl.NumberFormat` options for THIS stat: `{style:"currency",currency:"IRR"}`,
   * `{style:"percent"}`, `{notation:"compact"}`. Whatever is passed runs under
   * the locale's own numbering system, so the digits stay Persian either way.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * Change against the previous period, as a FRACTION — `0.12`, not `12`.
   *
   * A fraction because it is formatted with `{style:"percent"}`, and `Intl`
   * multiplies by 100 itself. Passing `12` would render «۱٬۲۰۰٪».
   */
  delta?: number | undefined;
  /** What the delta is measured against, e.g. «نسبت به ماه گذشته». */
  deltaCaption?: string | undefined;
  /** A trailing glyph or sparkline. Rendered `aria-hidden`. */
  icon?: LumoNode;
}

export interface StatGridStrings {
  /**
   * Announced name of the region wrapping the grid, e.g. «شاخص‌های کلیدی».
   * Required: a landmark with no name is a rotor entry that says "region".
   */
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
       * `Grid` rather than a hand-rolled flex row: grid tracks are laid out
       * along the INLINE axis, so track 1 is the reader's first column in both
       * scripts and there is no mirroring work at all. stack.tsx has the long
       * version of this argument.
       */}
      <Grid cols={cols} gap="md">
        {items.map((item) => {
          // Read once into a local so the narrowing survives into the JSX
          // below — `item.delta` is a property access and TypeScript re-widens
          // it across the callback boundary.
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
                 * The figure. A formatted STRING by the time it reaches JSX,
                 * which is what gets it past the `LumoNode` ban — and past the
                 * gate's `no-latin-digits` rule, which walks visible text nodes
                 * on every RTL route.
                 *
                 * No `tabular-nums`: theme.css sets `font-variant-numeric:
                 * normal` under `:lang(fa)` because `arabext` digits have no
                 * tabular variant, and a utility here would out-specify it.
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
                       * The direction as a WORD, announced but not shown. The
                       * sign and the colour carry it visually; this is what
                       * carries it to a screen reader and to a reader who
                       * cannot distinguish the two hues.
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
