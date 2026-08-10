import { cn, type LumoNode } from "@lumo-ui/core";
import { Badge, Link, Separator } from "@lumo-ui/ui";

/**
 * The signed-in frame: a sidebar on the reading edge, a top bar, and the route.
 *
 * ── NO `"use client"`, AND THAT IS THE POINT ────────────────────────────────
 *
 * A shell wraps every authenticated route in the application. A client
 * directive here would drag the entire route subtree across the boundary — the
 * single most expensive place in a codebase to get rule 1 wrong. So this block
 * takes NO callbacks: navigation is `href`s, and anything that needs state
 * (a mobile drawer, a user menu, a theme switch) arrives as a `LumoNode` slot
 * that the caller marks `"use client"` on its own terms. That is the same trade
 * `empty-state.tsx` makes with its `action` slot, applied at page scale.
 *
 * ── THE SIDEBAR IS ON THE INLINE START, WHICH IS NOT "the left" ─────────────
 *
 * `flex-row` lays the sidebar out first in READING order, so it sits on the
 * left in English and the right in Persian with no `rtl:` variant anywhere.
 * Its divider is `border-e` — border-inline-end — so the rule always falls
 * between the sidebar and the content, whichever physical side that is.
 * `border-r` would put it on the far edge of the screen in Persian, outside the
 * layout entirely, which looks like a missing border rather than a mirrored one
 * and therefore survives review.
 *
 * ── A MEASURED GAP IN `@lumo-ui/ui`, WORKED AROUND HERE ─────────────────────
 *
 * The current nav item should carry `aria-current="page"`. Lumo's `Link` could not
 * express it: its props derive from React Aria's `AriaLinkProps`, which extends
 * `AriaLabelingProps` only — `aria-current` is declared on `AriaBaseButtonProps`
 * (so `Button` accepts it) and nowhere on the link side. Rather than cast, this
 * block states "you are here" the way the rest of Lumo states everything else:
 * UPDATE 10 August 2026: `Link` now takes a typed `isCurrent` prop. The gap was
 * in React Aria's TYPES, not its runtime — `useLink` writes `aria-current`
 * explicitly and RAC reads it back for `data-current`; `LinkProps` simply never
 * declared it. This block should move to `isCurrent`, which lets the screen
 * reader announce the state in its OWN language rather than reading a phrase we
 * translated. Until then it still uses
 * a REQUIRED, translated `strings.currentPage` rendered `sr-only` inside the
 * active link. It is a worse fit than the attribute and it is reported as a gap
 * — but it is announced, it is Persian, and it does not lie to the type system.
 */
export interface AppShellNavItem {
  /** Stable key. Not rendered. */
  id: string;
  /** The visible link text, from the caller. */
  label: string;
  href: string;
  /**
   * A leading glyph. `aria-hidden` is applied by this block — the label already
   * says what the icon says, and an unnamed graphic inside a link appends a
   * meaningless stop to the link's accessible name.
   */
  icon?: LumoNode;
  /**
   * A trailing count, ALREADY FORMATTED by the caller.
   *
   * `string`, not `number`, and that is enforcement rather than convenience:
   * a `number` here would be rendered straight into a `<Badge>` and produce
   * Latin digits on a Persian page. The caller runs `formatNumber(n, locale)`,
   * which is the decision Lumo wants made explicitly.
   */
  badge?: string | undefined;
  /** Marks this item as the route the reader is on. */
  isCurrent?: boolean | undefined;
}

export interface AppShellStrings {
  /** Announced name of the `<nav>` landmark, e.g. «ناوبری اصلی». */
  navLabel: string;
  /**
   * Text of the skip-to-content link — the first thing a keyboard user reaches.
   * Required: a skip link with no text is a focus stop that announces nothing.
   */
  skipToContent: string;
  /** Announced suffix on the active nav item. See the file header. */
  currentPage: string;
}

export interface AppShellProps {
  strings: AppShellStrings;
  nav: readonly AppShellNavItem[];
  /** Product mark or wordmark, at the top of the sidebar. */
  brand?: LumoNode;
  /**
   * Rendered at the inline START of the top bar — a mobile drawer trigger, a
   * breadcrumb trail, a global search. A slot, so anything stateful in it keeps
   * its own client boundary and this shell stays a server component.
   */
  topBarStart?: LumoNode;
  /** Rendered at the inline END of the top bar — a user menu, notifications. */
  topBarEnd?: LumoNode;
  /** Pinned to the bottom of the sidebar — a workspace switcher, a plan badge. */
  sidebarFooter?: LumoNode;
  /** The route. */
  children?: LumoNode;
  /**
   * DOM id of the `<main>` element, and the skip link's target. Machine text,
   * never announced, so it is not part of `strings`.
   */
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
       * The skip link. `start-2` is inset-inline-start, so it appears at the
       * reading corner in both scripts; `top-2` stays physical because the
       * block axis does not mirror in any horizontal writing mode.
       *
       * `sr-only` until focused, which is why the reveal is keyed on `focus:`
       * rather than a `data-` variant: the element must leave `sr-only` the
       * instant it takes focus, before any React Aria state has settled.
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
       * `hidden md:flex`: below the medium breakpoint the sidebar is gone and
       * the caller is expected to put a Drawer trigger in `topBarStart`. This
       * block does not own that Drawer, because owning it would mean owning its
       * open state — see the file header.
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
                    // `w-full` + `justify-between` puts the icon and label at
                    // the reading start and the badge at the reading end.
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
         * `justify-between` again: start slot at the reading start, end slot at
         * the reading end. `border-be` is border-block-end — logical for the
         * same "no carve-outs to remember" reason card.tsx gives for `border-bs`.
         */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-be border-border bg-surface px-4">
          <div className="flex min-w-0 items-center gap-3">{topBarStart}</div>
          <div className="flex shrink-0 items-center gap-2">{topBarEnd}</div>
        </header>

        {/*
         * `tabIndex={-1}` so the skip link can actually move focus here. Without
         * it the browser scrolls to `#lumo-main` and leaves focus on the link,
         * which means the next Tab returns to the navigation the reader just
         * asked to skip.
         */}
        <main id={mainId} tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
