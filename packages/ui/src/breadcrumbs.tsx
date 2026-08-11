import * as React from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A breadcrumb trail.
 *
 *     <Breadcrumbs label="مسیر صفحه">
 *       <Breadcrumb><Link href="/">خانه</Link></Breadcrumb>
 *       <Breadcrumb>تنظیمات</Breadcrumb>
 *     </Breadcrumbs>
 *
 * ═══ THIS ONE NEEDED NO ENGINE, AND THAT IS THE MEASUREMENT ═════════════════
 *
 * The brief for this batch asked whether the navigation-chrome components need
 * an engine at all. Breadcrumbs is the clearest no.
 *
 * Base UI ships no breadcrumbs primitive — checked, not assumed: 48 export
 * subpaths in `@base-ui/react@1.7.0` and none of them is one, and base-vega has
 * no `breadcrumbs` item either (`vendor-from-shadcn.mjs` → 404). React Aria's
 * `Breadcrumbs`/`Breadcrumb` supplied exactly three things: an `<ol>`/`<li>`
 * pair, a `data-current` flag on the last crumb, and an English `aria-label`
 * default that this file existed to override.
 *
 * All three are cheaper without it. The list is markup. "Last child" is
 * `Children.count`. And the English default is GONE rather than overridden,
 * which turns a required prop from a workaround into a plain requirement.
 *
 * The win that pays for the rewrite is on the other axis: **there is no
 * `"use client"` in this file any more.** A trail of links is a picture of the
 * route — nothing here is pressable, nothing holds state, nothing subscribes.
 * Under React Aria it had to be a client component because `Breadcrumbs` is a
 * collection component; now a page header renders its breadcrumbs on the server
 * and a reader pays no hydration for the one part of the page that is pure
 * navigation. That is the same call `steps.tsx` and `alert.tsx` make.
 *
 * ── THE ENGLISH LEAK THAT IS NOW SIMPLY ABSENT ─────────────────────────────
 *
 * Worth keeping the record, because the LESSON is about method rather than about
 * this string. React Aria hard-defaulted the trail's name —
 * `'aria-label': ariaLabel || strings.format('breadcrumbs')` in
 * `useBreadcrumbs.mjs`, with `en-US` carrying `{breadcrumbs: "Breadcrumbs"}` —
 * so an unlabelled Lumo breadcrumb shipped `<ol aria-label="Breadcrumbs">` on
 * every Persian page.
 *
 * That string was NOT among the eight recorded in `@lumo-ui/core`'s strings.ts.
 * The sweep that produced those rendered components in their DEFAULT state, and
 * every overlay in that batch renders `null` while closed — so the sweep could
 * not see the popover-borne leaks and, having found none here either, moved on.
 * Breadcrumbs are never closed. This one was always in the served HTML and the
 * measurement's shape hid it. "Measured zero" means "zero in the states we
 * rendered", and that is the sentence worth carrying forward into every Base UI
 * string count in this migration.
 *
 * `label` stays REQUIRED. The failure mode inverted — an unlabelled trail is now
 * anonymous rather than English — and that is the WORSE of the two, for the
 * reason select.tsx gives about its placeholder: an English word is something a
 * gate can catch and a reviewer can see; a missing accessible name leaks no
 * string, shows nothing on screen, and passes every count.
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
    // `data-current` is the last crumb: the page you are already on. Written by
    // `Breadcrumbs` below rather than by a collection builder, so the attribute
    // — and every consumer stylesheet keyed to it — survives the engine's
    // removal unchanged.
    "data-current:font-medium data-current:text-fg " +
    "data-disabled:opacity-50",
);

export const breadcrumbSeparatorVariants = cva("px-1 text-fg-subtle");

export interface BreadcrumbsProps<T extends object> {
  /**
   * Announced name of the trail. Required — see the file header.
   */
  label: string;
  /**
   * TYPE CARRIER, NOT A PROP — and typed `never` on purpose. React Aria's
   * `BreadcrumbsProps<T>` fed `T` to a collection builder's `items`. There is no
   * collection here, so nothing is left for `T` to type. Keeping the field keeps
   * the type PARAMETER, so a `BreadcrumbsProps<Crumb>` annotation a consumer
   * already wrote still compiles; typing it `never` makes passing a value a
   * compile error rather than a prop that is accepted and silently dropped.
   * (`select.tsx` does the same for the same reason.)
   */
  items?: Iterable<T> & never;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Renders the `<ol>` only. If you want a `<nav>` landmark around it, wrap it
 * yourself and leave the wrapper unlabelled — two labelled ancestors announce
 * the trail's name twice.
 *
 * The last crumb is marked here rather than discovered by each crumb, because a
 * crumb cannot see its siblings and a React context would put this file back on
 * the client. `cloneElement` is safe where a `child.type` test would not be: it
 * ADDS a prop to whatever element it is given without needing to know what that
 * element is, so it survives a server component composing the tree — the
 * boundary `findChildProp`'s docblock records at length.
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
              // An explicit `isCurrent` on the element wins: a trail whose last
              // crumb is a link to a sibling page is unusual but legal, and
              // overriding a caller's stated intent is never the right default.
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
  /**
   * The page you are already on — the last crumb. Set by `Breadcrumbs` from the
   * child's position; pass it explicitly only to override that.
   */
  isCurrent?: boolean;
  /** Disabled crumb. Styling only; a crumb is not a control. */
  isDisabled?: boolean;
  /**
   * Stable key. Accepted because every existing call site passes one — React
   * Aria used it as the COLLECTION key — and deliberately NOT rendered as a DOM
   * `id`: two trails on one page offering the same crumb would emit duplicate
   * ids. menu.tsx makes the same call for the same reason.
   */
  id?: string | number | undefined;
  className?: string | undefined;
}

export function Breadcrumb({
  className,
  children,
  separator = "›",
  isCurrent = false,
  isDisabled = false,
  id: _id,
}: BreadcrumbProps) {
  return (
    <li
      data-lumo=""
      {...(isCurrent ? { "data-current": "true" } : {})}
      {...(isDisabled ? { "data-disabled": "true" } : {})}
      className={cn(breadcrumbVariants(), className)}
    >
      {children as React.ReactNode}
      {/*
       * The trailing separator disappears on the last crumb without anyone
       * having to know which child is last — `Breadcrumbs` decided that above.
       *
       * `aria-hidden` because the separator is punctuation between links, not
       * content: without it a screen reader reads a bare angle bracket between
       * every crumb.
       */}
      {isCurrent ? null : (
        <span aria-hidden="true" className={breadcrumbSeparatorVariants()}>
          {separator as React.ReactNode}
        </span>
      )}
    </li>
  );
}
