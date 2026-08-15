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
 *     <Pagination locale={locale} page={page} count={pageCount} onPageChange={setPage}
 *       label="صفحه‌بندی نتایج" previousLabel="صفحه قبل" nextLabel="صفحه بعد"
 *       pageLabel={(n) => `صفحه ${n}`} />
 *
 * `"use client"` because `onPageChange` is a function prop; the classes and the
 * page-window arithmetic live in `pagination.variants.ts` so a SERVER-rendered
 * listing can render the same pager as `<a href>` links. No engine: a pager is
 * a list of destinations; `@base-ui/react/button` is imported only because it
 * emits `data-disabled`, which `paginationItemVariants` styles. Every visible
 * thing here is a NUMBER, so `formatNumber` runs once per cell and `pageLabel`
 * receives the ALREADY-FORMATTED string — no raw integer in scope. `‹`/`›` are
 * a Unicode `Bidi_Mirrored` pair; replace only with another mirrored pair.
 */

export interface PaginationProps
  // `aria-label` is owned: built from the REQUIRED `label`. `id` stays the
  // caller's — a page with a top AND bottom pager needs to point `aria-controls`.
  extends Omit<ComponentProps<"nav">, "children" | "className" | "aria-label"> {
  /** The locale every page number is formatted in. Required — see the header. */
  locale: Locale;
  /** The current page, 1-based. */
  page: number;
  /** How many pages there are in total. */
  count: number;
  /** Called with the 1-based page to move to. */
  onPageChange: (page: number) => void;
  /** Announced name of the navigation landmark, e.g. «صفحه‌بندی نتایج». REQUIRED — a top and bottom pager would be two unnamed `<nav>`s. */
  label: string;
  /** Announced name of the previous-page control, e.g. «صفحه قبل». REQUIRED. */
  previousLabel: string;
  /** Announced name of the next-page control, e.g. «صفحه بعد». REQUIRED. */
  nextLabel: string;
  /**
   * Builds a page button's announced name from the FORMATTED page number, e.g.
   * ``(n) => `صفحه ${n}` `` → «صفحه ۳». REQUIRED; takes a string, not the integer.
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
      {/* A real `<ul>`: "list, 7 items" tells a reader how far the results go. */}
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
              {/* U+2026, `aria-hidden`: an elision mark, not content. Hidden pages stay reachable. */}
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
  // Formatted ONCE for both the visible cell and the announced name, so they cannot drift.
  const formatted = formatNumber(page, locale);
  return (
    <BaseButton
      data-lumo=""
      aria-label={pageLabel(formatted)}
      // `aria-current="page"` is the announcement; the fill alone would be colour-only (WCAG 1.4.1).
      {...(isCurrent ? { "aria-current": "page" as const } : {})}
      onClick={() => onPress(page)}
      className={cn(paginationItemVariants({ size, current: isCurrent }))}
    >
      {formatted}
    </BaseButton>
  );
}
