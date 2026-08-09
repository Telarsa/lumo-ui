"use client";

import { cva } from "class-variance-authority";
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  type BreadcrumbProps as AriaBreadcrumbProps,
  type BreadcrumbsProps as AriaBreadcrumbsProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A breadcrumb trail.
 *
 *     <Breadcrumbs label="مسیر صفحه">
 *       <Breadcrumb><Link href="/">خانه</Link></Breadcrumb>
 *       <Breadcrumb>تنظیمات</Breadcrumb>
 *     </Breadcrumbs>
 *
 * ── A FIRST-BYTE ENGLISH LEAK THAT IS NOT IN core/strings.ts ────────────────
 *
 * `label` is REQUIRED because React Aria hard-defaults the trail's accessible
 * name. From `react-aria/private/breadcrumbs/useBreadcrumbs.mjs`:
 *
 *     'aria-label': ariaLabel || strings.format('breadcrumbs')
 *
 * and the `en-US` bundle carries `"@react-aria/breadcrumbs": {breadcrumbs:
 * "Breadcrumbs"}`. Persian is not among RAC's 34 locales, so an unlabelled
 * Lumo breadcrumb ships `<ol aria-label="Breadcrumbs">` on every Persian page.
 *
 * Worth noting precisely because it is NOT in the eight strings recorded in
 * `@lumo-ui/core`'s strings.ts. That sweep rendered components in their default
 * state, and every overlay in this batch renders `null` while closed — so the
 * sweep could not see the popover-borne leaks. Breadcrumbs are never closed.
 * This one was always in the served HTML and the measurement's shape hid it.
 * The lesson is about the method, not the string: "measured zero" means "zero
 * in the states we rendered".
 *
 * ── THE SEPARATOR MIRRORS ITSELF ────────────────────────────────────────────
 *
 * The default separator is `›` (U+203A). That character has the Unicode
 * `Bidi_Mirrored` property — it is half of the mirroring pair 2039/203A — so the
 * text engine draws it as `‹` when the resolved bidi direction is RTL. The trail
 * therefore points from the root toward the current page in both scripts with no
 * CSS, no `rtl:` variant, no `scale-x-[-1]`, and nothing for the RTL codemod to
 * have to catch.
 *
 * An SVG chevron cannot do this, and neither can `/`, which is unmirrored and
 * ends up leaning the wrong way against Persian text. If you override
 * `separator`, override it with another mirrored character (`»`/`«` U+00BB, or
 * `>` U+003E) or you have re-introduced the bug this default exists to avoid.
 */

export const breadcrumbsVariants = cva(
  "flex flex-wrap items-center gap-1 text-sm text-fg-muted",
);

export const breadcrumbVariants = cva(
  "flex items-center gap-1 " +
    // `data-current` is the last crumb: the page you are already on.
    "data-current:font-medium data-current:text-fg " +
    "data-disabled:opacity-50",
);

export const breadcrumbSeparatorVariants = cva("px-1 text-fg-subtle");

export interface BreadcrumbsProps<T extends object>
  extends Omit<AriaBreadcrumbsProps<T>, "children" | "className" | "aria-label"> {
  /**
   * Announced name of the trail. Required — see the file header: the fallback
   * is RAC's English "Breadcrumbs", in the server-rendered HTML.
   */
  label: string;
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

/**
 * Renders the `<ol>` only. If you want a `<nav>` landmark around it, wrap it
 * yourself and leave the wrapper unlabelled — two labelled ancestors announce
 * the trail's name twice.
 */
export function Breadcrumbs<T extends object>({
  label,
  className,
  ...props
}: BreadcrumbsProps<T>) {
  return (
    <AriaBreadcrumbs
      aria-label={label}
      className={cn(breadcrumbsVariants(), className)}
      {...props}
    />
  );
}

export interface BreadcrumbProps extends Omit<AriaBreadcrumbProps, "children" | "className"> {
  children?: LumoNode;
  /** A mirrored character. See the file header before changing it. */
  separator?: LumoNode;
  className?: string | undefined;
}

export function Breadcrumb({
  className,
  children,
  separator = "›",
  ...props
}: BreadcrumbProps) {
  return (
    <AriaBreadcrumb className={cn(breadcrumbVariants(), className)} {...props}>
      {({ isCurrent }) => (
        <>
          {children}
          {/*
           * `isCurrent` comes from RAC's own render props — it is derived from
           * the crumb's position in the collection, so the trailing separator
           * disappears without anyone having to know which child is last.
           *
           * `aria-hidden` because the separator is punctuation between links,
           * not content: without it a screen reader reads a bare angle bracket
           * between every crumb.
           */}
          {isCurrent ? null : (
            <span aria-hidden="true" className={breadcrumbSeparatorVariants()}>
              {separator}
            </span>
          )}
        </>
      )}
    </AriaBreadcrumb>
  );
}
