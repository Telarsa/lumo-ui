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
 * `hover:` ONLY, and `data-hovered:` is gone.
 *
 * It used to carry both, and the reason it did is worth keeping because it was a
 * good reason that stopped being true. React Aria published `data-hovered` on
 * the controls in `pagination.tsx` — pointer-type aware, unlike `:hover`, so it
 * did not stick after a touch tap — while a bare `<a>` in a server-rendered
 * block published nothing. Carrying both let ONE class list serve both
 * spellings, which is the whole point of this module existing.
 *
 * Base UI publishes no hover attribute anywhere. `grep -rl 'data-hovered'` over
 * the whole installed 1.7.0 dist returns zero files (the `data-hovering` it does
 * ship belongs to `ScrollArea.Scrollbar` and means something else). So the
 * second half of every hover rule here now matches no element in any state:
 * present in the emitted CSS, addressed to an engine that is no longer there,
 * and indistinguishable in review from a rule that works.
 *
 * Deleted rather than left as a hedge. The two spellings still both work,
 * because `:hover` is the one that was already carrying the `<a>` case — the
 * pointer-type awareness is what is genuinely lost, and it is lost with the
 * engine rather than with this edit.
 *
 * ── AND THEN THERE WAS NO PRESS RULE AT ALL ────────────────────────────────
 *
 * `button.variants.ts` was carried into this file as "the same defect" —
 * `active:` byte-identical to `hover:`. Measured here, it was WORSE than the
 * report: `grep -o 'active:[^ ]*' pagination.variants.ts` returned NOTHING.
 * Three hover utilities across the base string and the `current` variant, zero
 * active ones. So the byte-identical reading was wrong and the conclusion was
 * right, for a stronger reason: a pager cell had no press treatment to be a
 * copy of.
 *
 * On a pointer that is a missing polish detail. On touch it is the whole
 * feedback budget of the interaction — `:hover` never fires there, so tapping
 * «۳» changed nothing on screen until the results below it re-rendered, which
 * on a slow list is hundreds of milliseconds of a control that looks dead.
 * Pagination is the component where that matters most: it is the one control
 * on a listing page whose entire job is to be tapped repeatedly.
 *
 * The steps are `button.variants.ts`'s, token for token, because a pager cell
 * IS a button-shaped control and inventing a second press vocabulary for it
 * would be the drift that file's header exists to prevent:
 *
 *     resting   hover:bg-surface-hover   active:bg-surface-sunken
 *     current   hover:bg-accent-hover    active:bg-accent-hover + brightness-95
 *
 * The 1px nudge is here too, and WITHOUT button's `not-aria-[haspopup]`
 * carve-out. That exemption exists because Base UI anchors an overlay to its
 * trigger's box, so nudging the trigger jitters the panel as it opens — and no
 * cell in a pager owns an overlay: every one of them is a page link or an
 * arrow, `aria-haspopup` appears nowhere in `pagination.tsx`, and a `<a href>`
 * in a server-rendered block cannot grow one without leaving this file's
 * classes behind. Carrying the carve-out anyway would be a selector guarding
 * against a state this component cannot enter, which is the exact shape of the
 * dead `data-hovered:` rules deleted above.
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
    "hover:bg-surface-hover active:bg-surface-sunken " +
    // Block axis on purpose: a press pushes the cell INTO the page, and the
    // block axis does not mirror. See the header for why there is no
    // `not-aria-[haspopup]` carve-out here. Both disabled rules below already
    // kill pointer events, so a disabled arrow cannot enter `:active`.
    "active:translate-y-px " +
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
        //
        // `brightness-95` over the hover fill rather than a new token: there is
        // no `--accent-active`, and adding one so a pager can dim 5% would be a
        // theme change charged to one component. `button.variants.ts`'s solid
        // variant declined the same token for the same reason.
        true: "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-hover active:brightness-95",
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
