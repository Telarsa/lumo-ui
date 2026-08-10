import { cva, type VariantProps } from "class-variance-authority";

/**
 * Pagination's class definitions and its page-window arithmetic, deliberately in
 * a module with NO `"use client"`.
 *
 * The rule is `button.variants.ts`'s, and the reason this component in
 * particular needs it is concrete rather than theoretical. A `cva()` — or ANY
 * function — exported from a client module is a client reference in the RSC
 * graph, and a server component that calls it fails the build:
 *
 *   Attempted to call paginationItemVariants() from the server but
 *   paginationItemVariants is on the client.
 *
 * `packages/blocks/src/listing-grid.tsx` is the block that will reach for these,
 * and its own header states why it must stay server-rendered: "a listing grid is
 * the page a crawler indexes. Every card is a real `<a href>` … One
 * `"use client"` here would remove a whole storefront from the served HTML."
 * Paged results are the same argument one level down — `/محصولات?page=2` has to
 * be a crawlable link, not a `useState` in a client component. So a catalogue
 * renders its pager as anchors on the server:
 *
 *     {paginationRange(page, pageCount).map((slot) =>
 *       slot.type === "gap"
 *         ? <span key={slot.key} aria-hidden="true">…</span>
 *         : <Link key={slot.page} href={`?page=${slot.page}`}
 *                 aria-label={pageLabel(formatNumber(slot.page, locale))}
 *                 aria-current={slot.page === page ? "page" : undefined}
 *                 className={paginationItemVariants({ current: slot.page === page })}>
 *             {formatNumber(slot.page, locale)}
 *           </Link>)}
 *
 * while `pagination.tsx` renders the same classes over buttons for the
 * in-place, JavaScript-driven case. Both spellings, one appearance.
 *
 * The page-window function lives here for exactly the same reason as the
 * `cva()`s: it is data, it is pure, and the server needs to call it.
 */

/**
 * `hover:` AND `data-hovered:` on purpose.
 *
 * React Aria publishes `data-hovered` on the controls in `pagination.tsx` (it is
 * pointer-type aware, which `:hover` is not, so it does not stick after a touch
 * tap). A bare `<a>` in a server-rendered block publishes nothing, and would sit
 * there inert. Carrying both is what lets ONE class list serve both spellings —
 * which is the whole point of this module existing.
 */
export const paginationItemVariants = cva(
  // No `tabular-nums`, tempting as it is on a row of numerals. theme.css resets
  // `font-variant-numeric: normal` under `:lang(fa)` in the `lumo.script` layer,
  // because the `arabext` digits Persian formatting produces have no tabular
  // variant to select and the feature misfires. A utility here would
  // out-specify that reset and re-enable exactly what the theme turned off.
  // `min-w-*` below does the column-alignment job instead, and does it in both
  // scripts. `progress.tsx` records the same decision.
  "inline-flex select-none items-center justify-center rounded-md " +
    "font-medium whitespace-nowrap no-underline " +
    "cursor-pointer outline-none transition-colors " +
    "hover:bg-surface-hover data-hovered:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      size: {
        // Square by construction: `min-w-*` with equal height, so a two-digit
        // page does not make its cell wider than a one-digit neighbour and jump
        // the row. `px-2` keeps ۱۲۳ from touching the edges.
        sm: "h-control-sm min-w-8 px-2 text-sm",
        md: "h-control-md min-w-10 px-2 text-sm",
      },
      current: {
        // The page you are on. `aria-current="page"` is what announces it; this
        // is only the visual half, which is why the announcement is not
        // optional in either spelling.
        true: "bg-accent text-accent-fg hover:bg-accent-hover data-hovered:bg-accent-hover",
        false: "text-fg",
      },
    },
    defaultVariants: { size: "md", current: false },
  },
);

export type PaginationItemVariantProps = VariantProps<typeof paginationItemVariants>;

export const paginationVariants = cva("flex w-full items-center justify-center");

export const paginationListVariants = cva(
  // A plain flex row. Under `dir="rtl"` normal flow already lays the first page
  // out on the RIGHT and walks leftwards, so there is no `flex-row-reverse`
  // anywhere — adding one would double-mirror the row on a Persian page.
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
 * The pages to show, with gaps where pages are skipped.
 *
 * Always keeps the first and last page reachable — a pager that can only step
 * one page at a time is a pager you cannot leave — plus `siblingCount` pages on
 * each side of the current one.
 *
 * Returns NUMBERS, not strings. Formatting is the caller's job precisely because
 * the caller is the one holding the locale: `formatNumber(slot.page, locale)`.
 * A helper that returned pre-formatted digits would have to take a locale, and
 * a helper that took a locale and got it wrong would be invisible.
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
    // A jump of exactly one page is not worth an ellipsis — "1 … 3" hides one
    // page behind a control that is wider than the page it hides.
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
