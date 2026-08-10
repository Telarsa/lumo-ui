import type { CSSProperties, HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";
import { Skeleton } from "./skeleton.tsx";

/**
 * Composed placeholders: the shapes a real screen actually loses while it
 * loads. `skeleton.tsx` ships the atom; these are the molecules — a text
 * block, an avatar row, a card, a form, a table — so a `loading.tsx` reads as
 * a preview of the page rather than as one grey bar.
 *
 * No `"use client"`, exactly as on `skeleton.tsx`: every preset is spans in
 * divs plus a CSS animation, and the single most common render site is a
 * server `loading.tsx`, where a client directive would be actively wrong.
 *
 * ── NO STRINGS, AND THAT IS A DECISION, NOT AN OMISSION ─────────────────────
 *
 * Everywhere else in this library an announced string is a REQUIRED prop. A
 * skeleton is the one component with nothing to announce: it is a PICTURE of
 * pending content, not the pending state itself. So every preset renders
 * `aria-hidden="true"` on its root and takes no text at all — which is also
 * what keeps the HTML gate quiet about them: the gate grades visible text and
 * spoken attributes, and these have neither. The loading STATE is the
 * consumer's to announce, on the element that owns it: `aria-busy="true"` on
 * the region being replaced, or a `<Spinner label="…" />` beside it (which is
 * what spinner.tsx exists for). A skeleton that announced itself would turn a
 * page of placeholders into a run of unnamed stops in the reading order.
 *
 * ── EVERY DIMENSION HERE IS COPIED FROM THE COMPONENT IT STANDS IN FOR ──────
 *
 * The whole worth of a skeleton is that nothing jumps when the data lands. So
 * `SkeletonAvatar` uses avatar.tsx's size scale, `SkeletonForm` uses
 * form.tsx's field gaps and the `h-control-md` input height, `SkeletonCard`
 * wears card.tsx's outlined border and `p-4` sections, and `SkeletonTable`
 * restates the header band, row rule and cell padding from table.tsx. The
 * table's classes are restated rather than imported: table.tsx is a client
 * module, and a server module must not reach into one for its cva — the
 * coverage suite enforces exactly that. The costs of a restatement are pinned
 * by comments naming the source lines.
 *
 * Widths that "vary" (the last text line, table cells) are DETERMINISTIC — a
 * cycle over the column index, never `Math.random()` — because these render on
 * the server and hydration diffs are a worse defect than a repeating pattern.
 */

export interface SkeletonTextProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
  /** How many lines of body copy to stand in for. Default `3`. */
  lines?: number | undefined;
  className?: string | undefined;
}

/**
 * A paragraph: `lines` full-width text lines, the last one cut short — a block
 * of identical bars reads as a table, not as prose.
 */
export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div aria-hidden="true" className={cn("flex w-full flex-col gap-2", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="text" className={i === lines - 1 ? "w-3/5" : undefined} />
      ))}
    </div>
  );
}

/** Mirrors avatar.tsx's size scale so nothing shifts when the portrait lands. */
export const skeletonAvatarVariants = cva("rounded-full", {
  variants: {
    size: {
      sm: "size-6",
      md: "size-8",
      lg: "size-10",
      xl: "size-14",
    },
  },
  defaultVariants: { size: "md" },
});

export interface SkeletonAvatarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">,
    VariantProps<typeof skeletonAvatarVariants> {
  /**
   * Text lines beside the circle — a name and a caption, the classic feed row.
   * `0` for the bare circle. Default `2`.
   */
  lines?: number | undefined;
  className?: string | undefined;
}

/**
 * A round avatar, optionally with the short text lines that usually follow it.
 * The circle is centred on the text block for the two-line default — the same
 * optical rule the real feed row uses.
 */
export function SkeletonAvatar({ size, lines = 2, className, ...props }: SkeletonAvatarProps) {
  return (
    <div aria-hidden="true" className={cn("flex w-full items-center gap-3", className)} {...props}>
      <Skeleton shape="circle" className={cn("shrink-0", skeletonAvatarVariants({ size }))} />
      {lines > 0 ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} shape="text" className={i === 0 ? "h-4 w-2/5" : "h-3 w-1/4"} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export interface SkeletonCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
  /** A media rectangle above the text, as a thumbnail card has. Default `true`. */
  hasMedia?: boolean | undefined;
  /** Body lines under the heading line. Default `2`. */
  lines?: number | undefined;
  className?: string | undefined;
}

/**
 * A card: the outlined shell from card.tsx (`rounded-lg border bg-surface`,
 * `p-4` sections), holding an optional media rectangle, a heading line and a
 * short body. `aspect-video` on the media because a fixed height would jump
 * the moment the real image's ratio wins.
 */
export function SkeletonCard({ hasMedia = true, lines = 2, className, ...props }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex w-full flex-col rounded-lg border border-border bg-surface", className)}
      {...props}
    >
      <div className="flex flex-col gap-3 p-4">
        {hasMedia ? <Skeleton shape="rect" className="aspect-video w-full" /> : null}
        <Skeleton shape="heading" />
        {lines > 0 ? <SkeletonText lines={lines} /> : null}
      </div>
    </div>
  );
}

export interface SkeletonFormProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
  /** Label-and-input pairs. Default `3`. */
  fields?: number | undefined;
  /** A submit-shaped bar at the reading start of the last row. Default `true`. */
  hasAction?: boolean | undefined;
  className?: string | undefined;
}

/**
 * A form: label-above-input pairs on form.tsx's own rhythm — `gap-1.5` inside
 * a field, `gap-4` between fields — with each input at `h-control-md`, the
 * height every real `md` control in this library shares. Label widths cycle
 * deterministically so the column does not read as one repeated stamp.
 */
export function SkeletonForm({ fields = 3, hasAction = true, className, ...props }: SkeletonFormProps) {
  const LABEL_WIDTHS = ["w-24", "w-16", "w-20"] as const;
  return (
    <div aria-hidden="true" className={cn("flex w-full flex-col gap-4", className)} {...props}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton shape="text" className={cn("h-4", LABEL_WIDTHS[i % LABEL_WIDTHS.length])} />
          <Skeleton shape="rect" className="h-control-md w-full" />
        </div>
      ))}
      {hasAction ? <Skeleton shape="rect" className="h-control-md w-24" /> : null}
    </div>
  );
}

export interface SkeletonTableProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
  /** Body rows under the header band. Default `4`. */
  rows?: number | undefined;
  /** Columns across. Default `4`. */
  columns?: number | undefined;
  className?: string | undefined;
}

/**
 * A data table: table.tsx's look, restated. The header band is
 * `h-control-md px-3` on `bg-surface-sunken` with a `border-be` rule (its cva
 * around table.tsx:119–127); body cells are `px-3 py-2` and each row rules its
 * block-start edge (around table.tsx:131–141) — here the row keeps `border-be`
 * with `last:border-be-0`, which is what those collapsed borders resolve to
 * visually. Column tracks are equal `1fr`s from an inline style, because a
 * class cannot take a runtime count; the tracks repeat per row, so header and
 * body stay aligned. Cell widths cycle on (row+column) so the grid shimmers
 * like data rather than like wallpaper.
 */
export function SkeletonTable({ rows = 4, columns = 4, className, ...props }: SkeletonTableProps) {
  const CELL_WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-1/3"] as const;
  const tracks: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  return (
    <div aria-hidden="true" className={cn("w-full text-sm", className)} {...props}>
      <div className="grid border-be border-border bg-surface-sunken" style={tracks}>
        {Array.from({ length: columns }, (_, col) => (
          <div key={col} className="flex h-control-md items-center px-3">
            <Skeleton shape="text" className="h-3 w-16" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid border-be border-border last:border-be-0" style={tracks}>
          {Array.from({ length: columns }, (_, col) => (
            <div key={col} className="flex items-center px-3 py-2">
              <Skeleton
                shape="text"
                className={CELL_WIDTHS[(row + col) % CELL_WIDTHS.length]}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
