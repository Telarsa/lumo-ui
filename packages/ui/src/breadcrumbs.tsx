import * as React from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A breadcrumb trail. No engine and no `"use client"`: a trail of links is a picture
 * of the route, so a page header renders it on the server with no hydration.
 *
 *     <Breadcrumbs label="مسیر صفحه">
 *       <Breadcrumb><Link href="/">خانه</Link></Breadcrumb>
 *       <Breadcrumb>تنظیمات</Breadcrumb>
 *     </Breadcrumbs>
 *
 * `label` stays REQUIRED: React Aria defaulted the trail's name to the English
 * "Breadcrumbs"; without an engine an unlabelled trail is anonymous, which is worse
 * because no gate can see it. The default separator `›` (U+203A) carries the Unicode
 * `Bidi_Mirrored` property, so the text engine draws `‹` under RTL with no CSS —
 * override it only with another mirrored character (`»`, `>`). Long form: docs/history/.
 */

export const breadcrumbsVariants = cva(
  "flex flex-wrap items-center gap-1 text-sm text-fg-muted",
);

export const breadcrumbVariants = cva(
  "flex items-center gap-1 " +
    // `data-current` is the last crumb, written by `Breadcrumbs` below.
    "data-current:font-medium data-current:text-fg " +
    "data-disabled:opacity-50",
);

export const breadcrumbSeparatorVariants = cva("px-1 text-fg-subtle");

export const breadcrumbEllipsisVariants = cva("select-none leading-none text-fg-subtle");

export interface BreadcrumbsProps<T extends object> {
  /** Announced name of the trail. Required — see the file header. */
  label: string;
  /**
   * TYPE CARRIER, NOT A PROP: keeps `BreadcrumbsProps<T>` compiling for consumers while
   * making a passed value a compile error. `(Iterable<T> & never) | undefined`, since a
   * bare `never` rejects an explicit `undefined` under `exactOptionalPropertyTypes`.
   */
  items?: (Iterable<T> & never) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Renders the `<ol>` only; wrap in an unlabelled `<nav>` yourself if you want a landmark.
 * The last crumb is marked here via `cloneElement`, which ADDS a prop without needing to
 * know the element's type — so it survives a server component composing the tree.
 */
export function Breadcrumbs<T extends object>({
  label,
  className,
  children,
}: BreadcrumbsProps<T>) {
  const items = React.Children.toArray(children as React.ReactNode);
  const lastIndex = items.length - 1;
  return (
    <ol data-lumo="" aria-label={label} className={cn(breadcrumbsVariants(), className)}>
      {items.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ isCurrent?: boolean }>, {
              key: index,
              // An explicit `isCurrent` on the element wins.
              isCurrent:
                (child as React.ReactElement<{ isCurrent?: boolean }>).props.isCurrent ??
                index === lastIndex,
            })
          : child,
      )}
    </ol>
  );
}

export interface BreadcrumbProps {
  children?: LumoNode;
  /** A mirrored character. See the file header before changing it. */
  separator?: LumoNode;
  /** The page you are already on — the last crumb. Set by `Breadcrumbs` from position. */
  isCurrent?: boolean;
  /** Disabled crumb. Styling only; a crumb is not a control. */
  isDisabled?: boolean;
  /** Stable key. Deliberately NOT rendered as a DOM `id`: two trails on one page would emit duplicates. */
  id?: string | number | undefined;
  className?: string | undefined;
}

export function Breadcrumb({
  className,
  children,
  separator = "›",
  isCurrent = false,
  isDisabled = false,
  id,
}: BreadcrumbProps) {
  return (
    <li
      data-lumo=""
      // `aria-current="page"`: `data-current` only PAINTS the current crumb. On the `<li>`,
      // because the crumb's content is whatever the caller passed.
      {...(isCurrent ? { "data-current": "true", "aria-current": "page" as const } : {})}
      {...(isDisabled ? { "data-disabled": "true" } : {})}
      {...(id === undefined ? {} : { "data-key": id })}
      className={cn(breadcrumbVariants(), className)}
    >
      {children as React.ReactNode}
      {/* The separator is punctuation between links, so it is `aria-hidden`; it disappears
       * on the last crumb because `Breadcrumbs` decided that above. */}
      {isCurrent ? null : (
        <span aria-hidden="true" className={breadcrumbSeparatorVariants()}>
          {separator as React.ReactNode}
        </span>
      )}
    </li>
  );
}

/**
 * The crumbs that were left out — one `…` standing in for a run of them. A hand-written
 * `<Breadcrumb>…</Breadcrumb>` has a one-punctuation-character name, so `label` is
 * REQUIRED. `…` is symmetric and needs no mirroring. Deliberately INERT (no dropdown),
 * which keeps this file server-only; compose a `Menu` yourself if you want one.
 */
export interface BreadcrumbEllipsisProps {
  /** What the `…` stands for, e.g. «خرده‌های میانی». REQUIRED — see above. */
  label: string;
  /** A mirrored character. See the file header before changing it. */
  separator?: LumoNode;
  /** Written by `Breadcrumbs` from position. */
  isCurrent?: boolean;
  className?: string | undefined;
}

export function BreadcrumbEllipsis({
  label,
  separator = "›",
  isCurrent = false,
  className,
}: BreadcrumbEllipsisProps) {
  return (
    <li
      data-lumo=""
      {...(isCurrent ? { "data-current": "true", "aria-current": "page" as const } : {})}
      className={cn(breadcrumbVariants(), className)}
    >
      {/* `aria-hidden` glyph plus `sr-only` text: degrades to readable text if the utility is dropped. */}
      <span aria-hidden="true" className={breadcrumbEllipsisVariants()}>
        …
      </span>
      <span className="sr-only">{label}</span>
      {isCurrent ? null : (
        <span aria-hidden="true" className={breadcrumbSeparatorVariants()}>
          {separator as React.ReactNode}
        </span>
      )}
    </li>
  );
}
