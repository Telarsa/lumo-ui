import type { ComponentProps, CSSProperties } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";
import { Skeleton } from "./skeleton.tsx";

/**
 * Composed placeholders — a text block, an avatar row, a card, a form, a table — so a
 * `loading.tsx` reads as a preview of the page. No `"use client"`: the commonest render
 * site is a server `loading.tsx`. NO STRINGS, deliberately: a skeleton is a PICTURE of
 * pending content, so every preset is `aria-hidden` and the loading STATE is the
 * consumer's to announce (`aria-busy`, or a `<Spinner label>`). Every dimension is
 * copied from the component it stands in for so nothing jumps when the data lands;
 * table classes are restated (table.tsx is a client module). Varying widths are
 * DETERMINISTIC cycles, never `Math.random()`, because these render on the server.
 */

export interface SkeletonTextProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "aria-hidden"> {
  /** How many lines of body copy to stand in for. Default `3`. */
  lines?: number | undefined;
  className?: string | undefined;
}

/** A paragraph: `lines` text lines, the last one cut short so it reads as prose. */
export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div {...props} aria-hidden="true" className={cn("flex w-full flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="text" className={i === lines - 1 ? "w-3/5" : undefined} />
      ))}
    </div>
  );
}

/** Mirrors avatar.tsx's size scale so nothing shifts when the portrait lands. */
export const skeletonAvatarVariants = cva("rounded-full", {
  variants: {
    /** The avatar placeholder's diameter step. */
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
  extends Omit<ComponentProps<"div">, "children" | "className" | "aria-hidden">,
    VariantProps<typeof skeletonAvatarVariants> {
  /**
   * Text lines beside the circle — a name and a caption, the classic feed row.
   * `0` for the bare circle. Default `2`.
   */
  lines?: number | undefined;
  className?: string | undefined;
}

/** A round avatar, optionally with the short text lines that usually follow it. */
export function SkeletonAvatar({ size, lines = 2, className, ...props }: SkeletonAvatarProps) {
  return (
    <div {...props} aria-hidden="true" className={cn("flex w-full items-center gap-3", className)}>
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
  extends Omit<ComponentProps<"div">, "children" | "className" | "aria-hidden"> {
  /** A media rectangle above the text, as a thumbnail card has. Default `true`. */
  hasMedia?: boolean | undefined;
  /** Body lines under the heading line. Default `2`. */
  lines?: number | undefined;
  className?: string | undefined;
}

/** A card: card.tsx's outlined shell holding an optional `aspect-video` media rectangle, a heading line and a short body. */
export function SkeletonCard({ hasMedia = true, lines = 2, className, ...props }: SkeletonCardProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("flex w-full flex-col rounded-lg border border-border bg-surface", className)}
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
  extends Omit<ComponentProps<"div">, "children" | "className" | "aria-hidden"> {
  /** Label-and-input pairs. Default `3`. */
  fields?: number | undefined;
  /** A submit-shaped bar at the reading start of the last row. Default `true`. */
  hasAction?: boolean | undefined;
  className?: string | undefined;
}

/** A form: label-above-input pairs on form.tsx's rhythm, each input at `h-control-md`. */
export function SkeletonForm({ fields = 3, hasAction = true, className, ...props }: SkeletonFormProps) {
  const LABEL_WIDTHS = ["w-24", "w-16", "w-20"] as const;
  return (
    <div {...props} aria-hidden="true" className={cn("flex w-full flex-col gap-4", className)}>
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
  extends Omit<ComponentProps<"div">, "children" | "className" | "aria-hidden"> {
  /** Body rows under the header band. Default `4`. */
  rows?: number | undefined;
  /** Columns across. Default `4`. */
  columns?: number | undefined;
  className?: string | undefined;
}

/**
 * A data table: table.tsx's look, restated (header band `h-control-md px-3` on
 * `bg-surface-sunken`, cells `px-3 py-2`, `border-be` rows). Column tracks come from an
 * inline style because a class cannot take a runtime count.
 */
export function SkeletonTable({ rows = 4, columns = 4, className, ...props }: SkeletonTableProps) {
  const CELL_WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-1/3"] as const;
  const tracks: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  return (
    <div {...props} aria-hidden="true" className={cn("w-full text-sm", className)}>
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
