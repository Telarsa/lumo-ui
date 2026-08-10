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
  /** Names the category column, e.g. «ماه». Heads the table's first column. */
  categoryLabel: string;
  /** The data table's caption — the ONLY figures a no-JS reader receives. */
  dataCaption: string;
  /** Category name and value per bar. Plain data, so it crosses the boundary. */
  data: readonly { readonly month: string; readonly sales: number }[];
}

export function ChartIsland({
  locale,
  label,
  seriesLabel,
  categoryLabel,
  dataCaption,
  data,
}: ChartIslandProps) {
  // `label` is required by `ChartConfig` for the reason chart.variants.ts gives:
  // without it the legend falls back to the dataKey, which is an English
  // identifier on a Persian dashboard.
  const config: ChartConfig = {
    month: { label: categoryLabel },
    sales: { label: seriesLabel, color: "oklch(0.62 0.16 255)" },
  };

  return (
    <ChartContainer
      config={config}
      locale={locale}
      label={label}
      data={[...data]}
      categoryKey="month"
      dataCaption={dataCaption}
      className="w-full"
    >
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

/* ───────────────────────────────────────────────────────────── attachment ── */

/*
 * Appended by the round-3 chat batch. Import declarations are hoisted, so
 * placing these here keeps the append-only contract for this file without
 * touching the shared header. `useState` and `Locale` are already imported at
 * the top; re-importing them would be a duplicate-binding error.
 */
import {
  Attachment,
  AttachmentContent,
  AttachmentMeta,
  AttachmentName,
  AttachmentRemove,
} from "@lumo-ui/ui";

export interface AttachmentIslandProps {
  locale: Locale;
  /**
   * The verb of the remove phrase: «حذف» → «حذف گزارش فروش مرداد». The noun is
   * each file's own name, appended on this side of the boundary — the same
   * word-shape RatingIsland's `ofWord` documents.
   */
  removeWord: string;
  /** Shown once the last attachment is removed, e.g. «همهٔ پیوست‌ها حذف شد.». */
  emptyText: string;
  /** Plain data, so it crosses the boundary: display name, bytes, translated kind. */
  files: readonly { readonly name: string; readonly size: number; readonly kind: string }[];
}

/**
 * The one attachment demo that cannot live in a server module: removal needs
 * `onPress`, and a function cannot cross the server/client boundary. Only
 * strings and plain data arrive here; every user-visible word is still written
 * in the examples module, in both locales.
 */
export function AttachmentIsland({ locale, removeWord, emptyText, files }: AttachmentIslandProps) {
  const [remaining, setRemaining] = useState(files);

  if (remaining.length === 0) {
    return <p className="text-sm text-fg-muted">{emptyText}</p>;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {remaining.map((file) => (
        <Attachment key={file.name}>
          <AttachmentContent>
            <AttachmentName>{file.name}</AttachmentName>
            <AttachmentMeta locale={locale} size={file.size}>
              <span>{file.kind}</span>
            </AttachmentMeta>
          </AttachmentContent>
          <AttachmentRemove
            label={`${removeWord} ${file.name}`}
            onPress={() => {
              setRemaining((current) => current.filter((f) => f.name !== file.name));
            }}
          />
        </Attachment>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── resizable ── */

/*
 * Appended by the round-3 navigation batch, same append-only contract as the
 * attachment block above: the import is hoisted, `Locale` is already imported
 * at the top.
 */
import { Resizable } from "@lumo-ui/ui";

export interface ResizableIslandProps {
  locale: Locale;
  /** Announced name of the divider, e.g. «تغییر اندازهٔ ستون‌ها». */
  label: string;
  /**
   * The unit noun of the announced size: «درصد» → «۳۰ درصد». The number is
   * formatted by resizable.tsx before the closure built here ever sees it —
   * the same contract as PaginationIsland's `pageWord`.
   */
  percentWord: string;
  /** Visible caption inside the start pane. */
  startTitle: string;
  /** Visible caption inside the end pane. */
  endTitle: string;
  /** Passed through; `vertical` splits on the block axis. */
  orientation?: "horizontal" | "vertical";
}

/**
 * The one resizable demo that cannot live in a server module: `sizeLabel` is a
 * REQUIRED function — word order is authored, not assembled (tag-group.tsx
 * makes the argument once for the library) — and a function cannot cross the
 * server/client boundary. Only strings arrive here; every user-visible word is
 * still written in the examples module, in both locales.
 */
export function ResizableIsland({
  locale,
  label,
  percentWord,
  startTitle,
  endTitle,
  orientation,
}: ResizableIslandProps) {
  const pane = "flex h-full items-center justify-center p-4 text-sm text-fg-muted";
  return (
    <Resizable
      locale={locale}
      label={label}
      sizeLabel={(v: string) => `${v} ${percentWord}`}
      defaultSize={30}
      {...(orientation === undefined ? {} : { orientation })}
      className={
        orientation === "vertical"
          ? "h-64 w-full max-w-md rounded-lg border border-border"
          : "h-40 w-full max-w-md rounded-lg border border-border"
      }
      startPanel={<div className={pane}>{startTitle}</div>}
      endPanel={<div className={pane}>{endTitle}</div>}
    />
  );
}
