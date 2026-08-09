import type { ElementType } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Breadcrumb, Breadcrumbs, Link } from "@lumo-ui/ui";

/**
 * The band at the top of a route: trail, title, one-line summary, actions.
 *
 * No `"use client"`. The actions arrive as a `LumoNode` slot rather than as
 * `{label, onPress}` pairs, so a page header can be server-rendered with a
 * client `<Button>` inside it — the same trade `empty-state.tsx` makes, and the
 * reason it is a slot and not a callback.
 *
 * ── THE BREADCRUMB LABEL IS PAIRED WITH THE CRUMBS BY THE TYPE ──────────────
 *
 * `Breadcrumbs.label` is REQUIRED in `@lumo-ui/ui` because React Aria
 * hard-defaults the trail's name to the English literal "Breadcrumbs" — in the
 * server-rendered HTML, on every Persian page (breadcrumbs.tsx records the
 * source line). So a page header that renders crumbs MUST supply the name, and
 * one that renders none must not be forced to invent it.
 *
 * A discriminated union says exactly that: `crumbs` without `crumbsLabel` does
 * not compile, and `crumbsLabel` alone is unrepresentable. This is the same
 * mechanism `Link`'s `newTab`/`newTabLabel` pair uses, and it is why the label
 * sits at the props level instead of inside `strings` — `strings` cannot
 * express "required only when this other prop is present".
 */
export interface PageHeaderCrumb {
  /** Stable key. Not rendered. */
  id: string;
  /** Visible crumb text. */
  label: string;
  /** Omit on the final crumb: the page you are already on is not a link. */
  href?: string | undefined;
}

export interface PageHeaderStrings {
  /** The route's heading. Rendered as the page `<h1>` by default. */
  title: string;
  /** One line under the heading. */
  description?: string | undefined;
}

interface PageHeaderBaseProps {
  strings: PageHeaderStrings;
  /**
   * Buttons, menus, a filter chip row. A slot — see the file header.
   * Placed at the inline END of the title row.
   */
  actions?: LumoNode;
  /** Rendered under the description: tabs, a stat strip, a search field. */
  children?: LumoNode;
  /**
   * Heading element for the title. Default `1`.
   *
   * A page header is normally the page's h1. `2` is offered for the case where
   * the header sits inside an already-titled shell — a settings sub-page under
   * a `<h1>Settings`. Skipping a level is a real navigation defect for a screen
   * reader user, so the choice is explicit rather than guessed.
   */
  level?: 1 | 2 | undefined;
  className?: string | undefined;
}

interface WithCrumbs {
  crumbs: readonly PageHeaderCrumb[];
  /** Announced name of the trail. Required whenever `crumbs` is present. */
  crumbsLabel: string;
}

interface WithoutCrumbs {
  crumbs?: undefined;
  crumbsLabel?: undefined;
}

export type PageHeaderProps = PageHeaderBaseProps & (WithCrumbs | WithoutCrumbs);

export function PageHeader(props: PageHeaderProps) {
  const { strings, actions, children, level = 1, className } = props;
  // Widened to `ElementType` so JSX accepts a variable tag, exactly as card.tsx
  // does. The `level` union is what constrains the value.
  const Heading: ElementType = level === 1 ? "h1" : "h2";

  return (
    <header className={cn("flex w-full flex-col gap-3 px-4 pbs-6 pbe-4", className)}>
      {/*
       * `undefined` is a unit type, so testing `props.crumbs` narrows the union
       * to its `WithCrumbs` arm and `props.crumbsLabel` becomes `string`. The
       * label cannot be forgotten because the branch that renders the trail
       * cannot be entered without it.
       */}
      {props.crumbs !== undefined && props.crumbs.length > 0 ? (
        <Breadcrumbs label={props.crumbsLabel}>
          {props.crumbs.map((crumb) => (
            <Breadcrumb key={crumb.id}>
              {crumb.href === undefined ? (
                crumb.label
              ) : (
                <Link href={crumb.href} variant="subtle" size="sm">
                  {crumb.label}
                </Link>
              )}
            </Breadcrumb>
          ))}
        </Breadcrumbs>
      ) : null}

      {/*
       * `flex-wrap` + `justify-between`: the title takes the reading start and
       * the actions the reading end, and on a narrow viewport the actions drop
       * to their own line rather than squeezing a Persian title — which runs
       * measurably longer than the same English string — into two characters
       * per line.
       */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {/*
           * `leading-snug`, matching card.tsx: theme.css already gives Persian
           * headings `line-height: 1.4`, and a tighter utility would fight it.
           */}
          <Heading className="text-xl leading-snug font-semibold text-fg">
            {strings.title}
          </Heading>
          {strings.description !== undefined ? (
            // `max-w-prose` caps the measure in `ch`, which resolves against
            // the rendered font — Vazirmatn under `:lang(fa)` — rather than
            // against a Latin one.
            <p className="max-w-prose text-sm text-fg-muted">{strings.description}</p>
          ) : null}
        </div>

        {actions !== undefined ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {children}
    </header>
  );
}
