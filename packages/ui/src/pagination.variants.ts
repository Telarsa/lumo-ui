import { cva, type VariantProps } from "class-variance-authority";

/**
 * Pagination's class definitions and its page-window arithmetic, in a module
 * with NO `"use client"`: a server-rendered listing (`blocks/listing-grid.tsx`)
 * renders its pager as crawlable `<a href>`s with these same classes and
 * `paginationRange`, while `pagination.tsx` renders buttons. Both spellings,
 * one appearance. Press steps are `button.variants.ts`'s token for token; no
 * `not-aria-[haspopup]` carve-out because no pager cell owns an overlay.
 */
export const paginationItemVariants = cva(
  // No `tabular-nums`: theme.css resets it under `:lang(fa)` because arabext
  // digits have no tabular variant. `min-w-*` aligns the column instead.
  "inline-flex select-none items-center justify-center rounded-md " +
    "font-medium whitespace-nowrap no-underline " +
    "cursor-pointer outline-none transition-colors " +
    "hover:bg-surface-hover " +
    // Block axis on purpose: a press pushes the cell INTO the page.
    "active:translate-y-px " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        // `min-w-*` with equal height, so a two-digit page does not jump the row.
        sm: "h-control-sm min-w-8 px-2 text-sm",
        md: "h-control-md min-w-10 px-2 text-sm",
      },
      /** Marks the page the reader is on. */
      current: {
        // Only the visual half; `aria-current="page"` is what announces it.
        true: "bg-accent text-accent-fg hover:bg-accent-hover",
        false: "text-fg",
      },
    },
    defaultVariants: { size: "md", current: false },
  },
);

export type PaginationItemVariantProps = VariantProps<typeof paginationItemVariants>;

export const paginationVariants = cva("flex w-full items-center justify-center");

export const paginationListVariants = cva(
  // No `flex-row-reverse`: normal flow already mirrors under `dir="rtl"`.
  "flex list-none items-center gap-1 p-0",
);

export const paginationGapVariants = cva(
  "inline-flex h-control-md min-w-8 select-none items-center justify-center text-fg-subtle",
);

/** One cell in the pager: a page to render, or the elision between two. */
export type PaginationSlot =
  | { type: "page"; page: number }
  | { type: "gap"; key: string };

/**
 * The pages to show, with gaps where pages are skipped. First and last are
 * always reachable, plus `siblingCount` each side of the current. Returns
 * NUMBERS: formatting is the caller's job, since the caller holds the locale.
 */
export function paginationRange(
  page: number,
  count: number,
  siblingCount = 1,
): PaginationSlot[] {
  const total = Math.max(1, Math.floor(count));
  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const siblings = Math.max(0, Math.floor(siblingCount));

  const shown = new Set<number>([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= total) shown.add(p);
  }

  const slots: PaginationSlot[] = [];
  let previous = 0;
  for (const p of [...shown].sort((a, b) => a - b)) {
    // A jump of exactly one page is not worth an ellipsis.
    if (previous !== 0 && p - previous === 2) {
      slots.push({ type: "page", page: previous + 1 });
    } else if (previous !== 0 && p - previous > 2) {
      slots.push({ type: "gap", key: `gap-${previous}` });
    }
    slots.push({ type: "page", page: p });
    previous = p;
  }
  return slots;
}
