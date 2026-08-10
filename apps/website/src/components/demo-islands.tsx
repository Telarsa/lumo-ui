"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid } from "recharts";
import type { Locale } from "@lumo-ui/core";
import {
  Button,
  ChartCategoryAxis,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartValueAxis,
  Pagination,
  Rating,
  ToastRegion,
  chartColor,
  createToastQueue,
  type ChartConfig,
} from "@lumo-ui/ui";

/**
 * The four demos that cannot be written in `demos.tsx`, and exactly why.
 *
 * `demos.tsx` is a SERVER module — it reads component sources off disk at build
 * time — so every `render` it holds is a server component. Three kinds of prop
 * cannot cross that boundary, and four components require one:
 *
 *  - **A function.** `Rating.valueLabel`/`starLabel` and `Pagination.pageLabel`
 *    are required functions, and deliberately so: Persian word order has to be
 *    authored rather than assembled (see `tag-group.tsx`'s header, which makes
 *    the argument once for the whole library). React refuses to serialise a
 *    function into the RSC payload, so the closure has to be built on this side.
 *  - **A class instance.** `ToastRegion.queue` is a live `ToastQueue` with a
 *    subscription list. Only plain objects cross.
 *  - **A component that is not marked `"use client"` and cannot run on the
 *    server.** recharts is that: its chart elements call hooks, so constructing
 *    `<BarChart>` in a server module renders it during the RSC pass and throws.
 *
 * So the boundary is drawn here instead, and it is drawn narrowly: every prop
 * below is a STRING the caller supplies per locale. There is no copy in this
 * file — `demos.tsx` remains the single place where a user-visible string is
 * written, in both locales, which is the rule the gate enforces.
 *
 * These still render under the static export. A client component is
 * server-rendered during prerender exactly like any other, so `lumo-gate` grades
 * their first byte too — with the one documented exception of the chart, which
 * recharts renders as an empty box on the server (see `chart.tsx`).
 */

/* ───────────────────────────────────────────────────────────────── rating ── */

export interface RatingIslandProps {
  locale: Locale;
  /** The read-only summary's score. */
  value: number;
  /** Joins score and maximum: «۴ از ۵». */
  ofWord: string;
  /** Announced name of the interactive group, e.g. «امتیاز شما». */
  groupLabel: string;
  /** The noun one star is counted in: «ستاره». */
  starWord: string;
}

export function RatingIsland({
  locale,
  value,
  ofWord,
  groupLabel,
  starWord,
}: RatingIslandProps) {
  return (
    <div className="flex flex-col gap-4">
      <Rating
        isReadOnly
        value={value}
        locale={locale}
        // Both arguments arrive ALREADY formatted — `rating.tsx` runs them
        // through `formatNumber` before calling this, which is what makes «۴ از ۵»
        // expressible and `4 از 5` unrepresentable.
        valueLabel={(v, max) => `${v} ${ofWord} ${max}`}
      />
      <Rating
        locale={locale}
        label={groupLabel}
        starLabel={(v) => `${v} ${starWord}`}
        defaultValue={3}
        size="lg"
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── pagination ── */

export interface PaginationIslandProps {
  locale: Locale;
  count: number;
  /** Announced name of the `<nav>`, e.g. «صفحه‌بندی نتایج». */
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** The noun a page is called by: «صفحه» → «صفحه ۳». */
  pageWord: string;
}

export function PaginationIsland({
  locale,
  count,
  label,
  previousLabel,
  nextLabel,
  pageWord,
}: PaginationIslandProps) {
  // The one piece of state in this file. It is here rather than in `demos.tsx`
  // for the same reason as everything else: `onPageChange` is a required
  // function. The initial value is a constant, so the prerendered bytes are
  // deterministic and the gate grades the same markup every build.
  const [page, setPage] = useState(3);

  return (
    <Pagination
      locale={locale}
      page={page}
      count={count}
      onPageChange={setPage}
      label={label}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      pageLabel={(formattedPage) => `${pageWord} ${formattedPage}`}
    />
  );
}

/* ────────────────────────────────────────────────────────────────── toast ── */

/**
 * Module scope, exactly as `toast.tsx` prescribes: the queue is a plain class
 * with a subscription list, so anything can raise a toast without being a React
 * component.
 */
const demoToasts = createToastQueue({ maxVisibleToasts: 3 });

export interface ToastIslandProps {
  locale: Locale;
  /** Announced name of the notification landmark, e.g. «اعلان‌ها». */
  regionLabel: string;
  /** Announced name of every toast's ✕. */
  closeLabel: string;
  /** Visible text on the button that raises the positive toast. */
  positiveTrigger: string;
  positiveTitle: string;
  positiveBody: string;
  /** Visible text on the button that raises the critical toast. */
  criticalTrigger: string;
  criticalTitle: string;
  criticalBody: string;
}

export function ToastIsland({
  locale,
  regionLabel,
  closeLabel,
  positiveTrigger,
  positiveTitle,
  positiveBody,
  criticalTrigger,
  criticalTitle,
  criticalBody,
}: ToastIslandProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onPress={() => {
          demoToasts.add(
            { title: positiveTitle, description: positiveBody, tone: "positive" },
            { timeout: 5000 },
          );
        }}
      >
        {positiveTrigger}
      </Button>
      <Button
        variant="outline"
        onPress={() => {
          // No timeout: a failure is something the reader has to act on, and
          // `toast.tsx` records why a library-chosen duration for that is wrong.
          demoToasts.add({
            title: criticalTitle,
            description: criticalBody,
            tone: "critical",
          });
        }}
      >
        {criticalTrigger}
      </Button>
      {/*
       * Renders `null` until a toast is queued, so it contributes nothing to the
       * served bytes — the same reason every overlay demo shows its trigger.
       */}
      <ToastRegion
        queue={demoToasts}
        locale={locale}
        label={regionLabel}
        closeLabel={closeLabel}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── chart ── */

export interface ChartIslandProps {
  locale: Locale;
  /** The chart's announced name — recharts makes the plot a focusable region. */
  label: string;
  /** The series' legend and tooltip name, e.g. «فروش». */
  seriesLabel: string;
  /** Category name and value per bar. Plain data, so it crosses the boundary. */
  data: readonly { readonly month: string; readonly sales: number }[];
}

export function ChartIsland({ locale, label, seriesLabel, data }: ChartIslandProps) {
  // `label` is required by `ChartConfig` for the reason chart.variants.ts gives:
  // without it the legend falls back to the dataKey, which is an English
  // identifier on a Persian dashboard.
  const config: ChartConfig = {
    sales: { label: seriesLabel, color: "oklch(0.62 0.16 255)" },
  };

  return (
    <ChartContainer config={config} locale={locale} label={label} className="w-full">
      <BarChart data={[...data]}>
        <CartesianGrid vertical={false} />
        {/*
         * The Lumo axes, never recharts' bare `XAxis`/`YAxis`: these mirror the
         * scale under RTL and run every tick through `formatNumber`. A bare axis
         * emits `0 600 1200` in Latin digits and no gate can see it, because
         * recharts renders nothing on the server.
         */}
        <ChartCategoryAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartValueAxis tickLine={false} axisLine={false} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="sales" fill={chartColor("sales")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
