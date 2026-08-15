import type { Locale, LumoNode } from "@lumo-ui/core";
import { ActivityFeed, type ActivityFeedStrings, type ActivityItem } from "./activity-feed.tsx";
import { AppShell, type AppShellNavItem, type AppShellStrings } from "./app-shell.tsx";
import { PageHeader, type PageHeaderStrings } from "./page-header.tsx";
import { StatGrid, type StatGridStrings, type StatItem } from "./stat-grid.tsx";

/**
 * The signed-in landing screen, assembled: `AppShell` around `PageHeader`,
 * `StatGrid`, a main data region and `ActivityFeed` — the composition every
 * dashboard rebuilds from the same four blocks, made one paste.
 *
 * Layout decided once: stats before detail, the feed beside the data region on
 * wide viewports and AFTER it in the DOM. `strings` nests the four blocks' own
 * interfaces (flattening would fork the contract). No `"use client"`: this file
 * takes no callbacks, so `tableRegion` is a slot the caller fills behind their
 * OWN client boundary and everything else is server-rendered.
 */
export interface DashboardPageStrings {
  /** The frame's own strings — nav landmark, skip link. See `AppShellStrings`. */
  shell: AppShellStrings;
  /** The route's heading band. See `PageHeaderStrings`. */
  header: PageHeaderStrings;
  /** The stat row's region label and delta words. See `StatGridStrings`. */
  stats: StatGridStrings;
  /** The feed's heading and empty state. See `ActivityFeedStrings`. */
  feed: ActivityFeedStrings;
}

export interface DashboardPageProps {
  strings: DashboardPageStrings;
  /** Formats every figure in the stats and every timestamp in the feed. */
  locale: Locale;
  nav: readonly AppShellNavItem[];
  /** The headline figures. Raw numbers — `StatGrid` formats them. */
  stats: readonly StatItem[];
  /** The feed items, newest first. `ActivityFeed` formats the dates. */
  activity: readonly ActivityItem[];
  /** Product mark for the sidebar. Forwarded to `AppShell`. */
  brand?: LumoNode;
  /** Inline-start slot of the top bar — a drawer trigger, a search. */
  topBarStart?: LumoNode;
  /** Inline-end slot of the top bar — a user menu, notifications. */
  topBarEnd?: LumoNode;
  /** Pinned under the sidebar nav — a workspace switcher, a plan badge. */
  sidebarFooter?: LumoNode;
  /** Actions at the inline end of the heading band — forwarded to `PageHeader`. */
  headerActions?: LumoNode;
  /** The main data region beside the feed — a `TableView`, a listing, a chart panel. Omit it and the feed takes the full width. */
  tableRegion?: LumoNode;
  /** DOM id of the shell's `<main>`, the skip link's target. Machine text. */
  mainId?: string | undefined;
  className?: string | undefined;
}

export function DashboardPage({
  strings,
  locale,
  nav,
  stats,
  activity,
  brand,
  topBarStart,
  topBarEnd,
  sidebarFooter,
  headerActions,
  tableRegion,
  mainId,
  className,
}: DashboardPageProps) {
  const feed = <ActivityFeed strings={strings.feed} items={activity} locale={locale} />;

  return (
    <AppShell
      strings={strings.shell}
      nav={nav}
      brand={brand}
      topBarStart={topBarStart}
      topBarEnd={topBarEnd}
      sidebarFooter={sidebarFooter}
      {...(mainId === undefined ? {} : { mainId })}
      {...(className === undefined ? {} : { className })}
    >
      <div className="flex w-full flex-col gap-6 pbe-8">
        {/* PageHeader carries its own px-4 pbs-6, so the band and the rows
            below share one gutter. Level 1: this route IS the page. */}
        <PageHeader strings={strings.header} actions={headerActions} />

        <StatGrid strings={strings.stats} items={stats} locale={locale} />

        {tableRegion !== undefined ? (
          /*
           * `items-start` so the feed does not stretch to the table's height.
           * Track 1 is the reading start in both scripts, so nothing mirrors.
           */
          <div className="grid grid-cols-1 items-start gap-6 px-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">{tableRegion}</div>
            <div className="min-w-0">{feed}</div>
          </div>
        ) : (
          <div className="px-4">{feed}</div>
        )}
      </div>
    </AppShell>
  );
}
