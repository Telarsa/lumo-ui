"use client";

import type { ComponentProps } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";
import {
  paginationGapVariants,
  paginationItemVariants,
  paginationListVariants,
  paginationRange,
  paginationVariants,
  type PaginationItemVariantProps,
  type PaginationSlot,
} from "./pagination.variants.ts";

export {
  paginationGapVariants,
  paginationItemVariants,
  paginationListVariants,
  paginationRange,
  paginationVariants,
};
export type { PaginationItemVariantProps, PaginationSlot };

/**
 * A page selector.
 *
 *     <Pagination
 *       locale={locale}
 *       page={page}
 *       count={pageCount}
 *       onPageChange={setPage}
 *       label="صفحه‌بندی نتایج"
 *       previousLabel="صفحه قبل"
 *       nextLabel="صفحه بعد"
 *       pageLabel={(n) => `صفحه ${n}`}
 *     />
 *
 * `"use client"` because `onPageChange` is a function prop. The class
 * definitions and the page-window arithmetic live in `pagination.variants.ts`
 * with no directive, so a SERVER-rendered listing can render the identical pager
 * as real `<a href>` links — see that file's header, which is where the argument
 * is made.
 *
 * ═══ NO ENGINE HERE EITHER, AND THE BUTTON IS THE ONLY REASON ONE IS IMPORTED
 *
 * The brief for this batch asked whether the navigation-chrome components need
 * an engine. Pagination is the marginal case and the answer is "barely".
 *
 * base-vega DOES ship a `pagination`, and vendoring it settles the question: its
 * emit contains no Base UI import at all — `<nav>`, `<ul>`, `<li>`, `<a>`, and a
 * `Button` used only for its classes. There is no pagination primitive in
 * `@base-ui/react@1.7.0`, and there was none in React Aria either. A pager is a
 * list of destinations; the arithmetic is `paginationRange` and the layout is
 * normal flow.
 *
 * Upstream's emit also happens to be a compact demonstration of rule 3. Every
 * announced string in it is an English literal with a default:
 * `aria-label="pagination"`, `aria-label="Go to previous page"`,
 * `aria-label="Go to next page"`, `text = "Previous"`, `text = "Next"`,
 * `<span className="sr-only">More pages</span>` — six, all optional, all
 * unreachable on a Persian page except by remembering. Lumo's five required
 * props are the same six strings with the defaults removed, which is why the
 * vendored file could not simply be adopted.
 *
 * What DID change: the controls were React Aria `Button`s, imported purely for
 * `isDisabled` and `onPress`. They are now `@base-ui/react/button`, imported
 * purely for one attribute — Base UI's Button emits `data-disabled` alongside
 * the native `disabled`, and `paginationItemVariants` styles the disabled arrows
 * with `data-disabled:`. A bare `<button disabled>` would have been simpler and
 * would have silently dropped that rule, which is the shape of edit this
 * migration is meant to catch rather than make. `onPress` becomes `onClick`: a
 * native button already fires it for Space and Enter, so nothing is lost.
 *
 * ═══ EVERY VISIBLE THING HERE IS A NUMBER ═══════════════════════════════════
 *
 * That is the whole risk profile of this component. `<button>{page}</button>`
 * type-checks under a normal `ReactNode`, renders, looks right in review, and
 * ships `1 2 3` into a page whose every other number is `۱ ۲ ۳`. It is the exact
 * shape of the measured defect that produced `LumoNode` — 77 of 77 calendar
 * cells in Latin digits, two lines under a comment explaining that failure.
 *
 * So no number reaches JSX unformatted. `formatNumber(n, locale)` runs once per
 * cell and the result is a string by the time it is a child, which is also what
 * gets it past the `LumoNode` ban. `locale` is required for the reason
 * `progress.tsx` argues at length: a context would have a default, and a page
 * that forgot the provider would render confidently in the wrong numbering
 * system with nothing red anywhere.
 *
 * ── AND SO IS THE ACCESSIBLE NAME, WHICH IS EASIER TO MISS ─────────────────
 *
 * `aria-label` is not visible text, so `LumoNode` cannot reach it — the same
 * blind spot `progress.tsx` found on `aria-valuetext`. A page button named
 * «صفحه 3» is Latin-digit output that no reviewer sees and that `lumo-gate`
 * fails the build over. `pageLabel` therefore receives the ALREADY-FORMATTED
 * string:
 *
 *     pageLabel: (formattedPage: string) => string
 *
 * so ``(n) => `صفحه ${n}` `` cannot be wrong: there is no raw number in scope to
 * interpolate. Handing it the integer instead would make the wrong thing the
 * convenient thing, which is the failure mode `num.tsx` was written to close.
 * The function form is also what lets Persian word order be authored rather than
 * assembled — «صفحه ۳» and «برگهٔ ۳» are both fine and neither is a template the
 * library could pick.
 *
 * ── THE PREVIOUS/NEXT GLYPHS MIRROR THEMSELVES ─────────────────────────────
 *
 * `‹` (U+2039) and `›` (U+203A) are a Unicode `Bidi_Mirrored` pair, so the text
 * engine draws each as the other when the resolved bidi direction is RTL. Under
 * `dir="rtl"` the previous control also MOVES to the right, because a flex row
 * follows `direction` — so both the position and the arrowhead flip, from
 * nothing but normal flow and one codepoint each.
 *
 * An SVG chevron would need `rtl:-scale-x-100`, which is a class someone has to
 * remember on every copy, which `shadcn migrate rtl` cannot add for them, and
 * which silently does nothing if the icon is swapped for one that already points
 * the right way. `breadcrumbs.tsx` uses U+203A for the same reason and
 * `overlays.test.tsx` pins it. If you replace these, replace them with another
 * mirrored pair (`«`/`»` U+00AB/U+00BB) or you have re-introduced the bug.
 *
 * The glyphs are `aria-hidden`: `previousLabel`/`nextLabel` are the names, and
 * an angle bracket read aloud between them is noise.
 */

export interface PaginationProps
  /*
   * `aria-label` is owned: it is built from the REQUIRED `label` prop, and a
   * second one on the same `<nav>` would be the "two names, one value" defect
   * AUDIT §3.4 names. Everything else the element accepts is the caller's —
   * `id` above all, which is what a page with a top AND a bottom pager needs to
   * point `aria-controls` at the right one.
   */
  extends Omit<ComponentProps<"nav">, "children" | "className" | "aria-label"> {
  /** The locale every page number is formatted in. Required — see the header. */
  locale: Locale;
  /** The current page, 1-based. */
  page: number;
  /** How many pages there are in total. */
  count: number;
  /** Called with the 1-based page to move to. */
  onPageChange: (page: number) => void;
  /**
   * Announced name of the navigation landmark, e.g. «صفحه‌بندی نتایج».
   *
   * REQUIRED. A page with a pager at the top and the bottom otherwise has two
   * identically unnamed `<nav>` landmarks, which is worse than one.
   */
  label: string;
  /** Announced name of the previous-page control, e.g. «صفحه قبل». REQUIRED. */
  previousLabel: string;
  /** Announced name of the next-page control, e.g. «صفحه بعد». REQUIRED. */
  nextLabel: string;
  /**
   * Builds a page button's announced name from the FORMATTED page number, e.g.
   * ``(n) => `صفحه ${n}` `` → «صفحه ۳». REQUIRED — see the file header for why
   * it takes a string rather than the integer.
   */
  pageLabel: (formattedPage: string) => string;
  /** Pages shown on each side of the current one. Default 1. */
  siblingCount?: number | undefined;
  /** The size step on the shared control scale. */
  size?: PaginationItemVariantProps["size"];
  className?: string | undefined;
}

export function Pagination({
  locale,
  page,
  count,
  onPageChange,
  label,
  previousLabel,
  nextLabel,
  pageLabel,
  siblingCount = 1,
  size = "md",
  className,
  ...props
}: PaginationProps) {
  if (count <= 0) return null;
  const total = Math.max(1, Math.floor(count));
  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const slots = paginationRange(current, total, siblingCount);

  return (
    <nav aria-label={label} className={cn(paginationVariants(), className)} {...props}>
      {/*
       * A real `<ul>`. The pager is a list of destinations, and a screen reader
       * announcing "list, 7 items" before walking them is the difference between
       * knowing how far the results go and guessing.
       */}
      <ul className={cn(paginationListVariants())}>
        <li>
          <BaseButton
            data-lumo=""
            aria-label={previousLabel}
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
            className={cn(paginationItemVariants({ size }))}
          >
            <span aria-hidden="true">‹</span>
          </BaseButton>
        </li>

        {slots.map((slot) =>
          slot.type === "gap" ? (
            <li key={slot.key} aria-hidden="true" className={cn(paginationGapVariants())}>
              {/*
               * U+2026, and `aria-hidden` because it is an elision mark rather
               * than content: read aloud it is "dot dot dot" between two page
               * numbers. The pages it hides stay reachable — `paginationRange`
               * always keeps the first and last page in the row.
               */}
              …
            </li>
          ) : (
            <li key={slot.page}>
              <PaginationPage
                locale={locale}
                page={slot.page}
                isCurrent={slot.page === current}
                pageLabel={pageLabel}
                onPress={onPageChange}
                size={size}
              />
            </li>
          ),
        )}

        <li>
          <BaseButton
            data-lumo=""
            aria-label={nextLabel}
            disabled={current >= total}
            onClick={() => onPageChange(current + 1)}
            className={cn(paginationItemVariants({ size }))}
          >
            <span aria-hidden="true">›</span>
          </BaseButton>
        </li>
      </ul>
    </nav>
  );
}

interface PaginationPageProps {
  locale: Locale;
  page: number;
  isCurrent: boolean;
  pageLabel: (formattedPage: string) => string;
  onPress: (page: number) => void;
  size: PaginationItemVariantProps["size"];
}

function PaginationPage({
  locale,
  page,
  isCurrent,
  pageLabel,
  onPress,
  size,
}: PaginationPageProps) {
  // Formatted ONCE and used for both the visible cell and the announced name,
  // so the two cannot drift — the same discipline `progress.tsx` applies to
  // `valueLabel`.
  const formatted = formatNumber(page, locale);
  return (
    <BaseButton
      data-lumo=""
      aria-label={pageLabel(formatted)}
      // `aria-current="page"` is the announcement, and it is not optional: the
      // fill colour from `current: true` is invisible to a screen reader and,
      // on its own, would be colour as the sole carrier of meaning (WCAG 1.4.1).
      {...(isCurrent ? { "aria-current": "page" as const } : {})}
      onClick={() => onPress(page)}
      className={cn(paginationItemVariants({ size, current: isCurrent }))}
    >
      {formatted}
    </BaseButton>
  );
}
