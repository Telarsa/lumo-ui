import type { ElementType } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Breadcrumb, Breadcrumbs, Link } from "@lumo-ui/ui";

/**
 * The band at the top of a route: trail, title, one-line summary, actions.
 *
 * No `"use client"`: `actions` is a `LumoNode` slot, so the header is
 * server-rendered with a client `<Button>` inside it. `crumbsLabel` is REQUIRED
 * whenever `crumbs` is present (React Aria hard-defaults the trail's name to
 * English), expressed as a discriminated union at the props level because
 * `strings` cannot say "required only when this other prop is present".
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
  /** Buttons, menus, a filter chip row. A slot, placed at the inline END of the title row. */
  actions?: LumoNode;
  /** Rendered under the description: tabs, a stat strip, a search field. */
  children?: LumoNode;
  /** Heading element for the title. Default `1`; `2` for a header inside an already-titled shell. Explicit so the outline never skips a level. */
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
  // Widened to `ElementType` so JSX accepts a variable tag; the `level` union constrains it.
  const Heading: ElementType = level === 1 ? "h1" : "h2";

  return (
    <header className={cn("flex w-full flex-col gap-3 px-4 pbs-6 pbe-4", className)}>
      {/*
       * Testing `props.crumbs` narrows the union to `WithCrumbs`, so `crumbsLabel` is `string` here.
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
       * `flex-wrap` + `justify-between`: title at the reading start, actions at
       * the reading end, dropping to their own line before squeezing a Persian title.
       */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {/*
           * `leading-snug`: theme.css already gives Persian headings `line-height: 1.4`.
           */}
          <Heading className="text-xl leading-snug font-semibold text-fg">
            {strings.title}
          </Heading>
          {strings.description !== undefined ? (
            // `max-w-prose` is in `ch`, so it follows the rendered (Persian) font.
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
