import { cn, type LumoNode } from "@lumo-ui/core";
import { Badge, Link, Separator } from "@lumo-ui/ui";

/**
 * The signed-in frame: a sidebar on the reading edge, a top bar, and the route.
 *
 * No `"use client"`, on purpose: a shell wraps every authenticated route, so it
 * takes NO callbacks — navigation is `href`s and anything stateful arrives as a
 * `LumoNode` slot the caller marks client on its own terms. The sidebar sits on
 * the inline start (`flex-row`, `border-e`), so it mirrors with no `rtl:` variant.
 * The current item is announced via a translated `strings.currentPage`; `Link`
 * now has a typed `isCurrent`, so this block should move to it (see docs/decisions/log.md).
 */
export interface AppShellNavItem {
  /** Stable key. Not rendered. */
  id: string;
  /** The visible link text, from the caller. */
  label: string;
  href: string;
  /** A leading glyph. `aria-hidden` is applied by this block — the label already says what the icon says. */
  icon?: LumoNode;
  /** A trailing count, ALREADY FORMATTED by the caller (`string`, not `number`, so Latin digits cannot leak in). */
  badge?: string | undefined;
  /** Marks this item as the route the reader is on. */
  isCurrent?: boolean | undefined;
}

export interface AppShellStrings {
  /** Announced name of the `<nav>` landmark, e.g. «ناوبری اصلی». */
  navLabel: string;
  /** Text of the skip-to-content link — the first thing a keyboard user reaches. Required. */
  skipToContent: string;
  /** Announced suffix on the active nav item. See the file header. */
  currentPage: string;
}

export interface AppShellProps {
  strings: AppShellStrings;
  nav: readonly AppShellNavItem[];
  /** Product mark or wordmark, at the top of the sidebar. */
  brand?: LumoNode;
  /** Rendered at the inline START of the top bar. A slot, so anything stateful keeps its own client boundary. */
  topBarStart?: LumoNode;
  /** Rendered at the inline END of the top bar — a user menu, notifications. */
  topBarEnd?: LumoNode;
  /** Pinned to the bottom of the sidebar — a workspace switcher, a plan badge. */
  sidebarFooter?: LumoNode;
  /** The route. */
  children?: LumoNode;
  /** DOM id of the `<main>` element, and the skip link's target. Machine text, never announced. */
  mainId?: string | undefined;
  className?: string | undefined;
}

export function AppShell({
  strings,
  nav,
  brand,
  topBarStart,
  topBarEnd,
  sidebarFooter,
  children,
  mainId = "lumo-main",
  className,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-dvh w-full bg-bg text-fg", className)}>
      {/*
       * The skip link. `start-2` mirrors; `top-2` stays physical. Revealed on
       * `focus:` (not a `data-` variant) so it leaves `sr-only` the instant it takes focus.
       */}
      <Link
        href={`#${mainId}`}
        variant="accent"
        size="sm"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-lg"
      >
        {strings.skipToContent}
      </Link>

      {/*
       * `hidden md:flex`: below md the caller puts a Drawer trigger in `topBarStart`;
       * this block does not own the Drawer because that would mean owning its state.
       */}
      <aside className="hidden w-64 shrink-0 border-e border-border bg-surface md:flex md:flex-col">
        {brand !== undefined ? (
          <div className="flex h-14 shrink-0 items-center px-4">{brand}</div>
        ) : null}

        <nav aria-label={strings.navLabel} className="min-h-0 flex-1 overflow-y-auto p-2">
          {/* `list-none` + `p-0`: the UA marker is inline-start-relative and
              renders on the wrong side of nothing here, since every row is a
              full-width control rather than prose. */}
          <ul className="flex list-none flex-col gap-0.5 p-0">
            {nav.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  variant="quiet"
                  size="sm"
                  className={cn(
                    // icon + label at the reading start, badge at the reading end.
                    "w-full justify-between gap-2 rounded-md px-3 py-2 no-underline",
                    "data-hovered:bg-surface-hover data-hovered:no-underline",
                    item.isCurrent === true
                      ? "bg-surface-sunken font-medium text-fg"
                      : "text-fg-muted",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {item.icon !== undefined ? (
                      <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
                        {item.icon}
                      </span>
                    ) : null}
                    <span className="truncate">{item.label}</span>
                    {/* See the file header: this is `aria-current="page"`
                        spelled as a translated string, because Lumo's Link
                        cannot carry the attribute. */}
                    {item.isCurrent === true ? (
                      <span className="sr-only">{strings.currentPage}</span>
                    ) : null}
                  </span>
                  {item.badge !== undefined ? (
                    <Badge tone="neutral" variant="subtle">
                      {item.badge}
                    </Badge>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {sidebarFooter !== undefined ? (
          <>
            <Separator />
            <div className="shrink-0 p-3">{sidebarFooter}</div>
          </>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
         * `border-be` is border-block-end — logical, same reason as card.tsx.
         */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-be border-border bg-surface px-4">
          <div className="flex min-w-0 items-center gap-3">{topBarStart}</div>
          <div className="flex shrink-0 items-center gap-2">{topBarEnd}</div>
        </header>

        {/*
         * `tabIndex={-1}` so the skip link can actually move focus here rather
         * than only scrolling.
         */}
        <main id={mainId} tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
