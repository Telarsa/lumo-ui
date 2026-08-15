import { cn, formatDate, type Locale, type LumoNode } from "@lumo-ui/core";
import { Avatar, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@lumo-ui/ui";

/**
 * A reverse-chronological list of what happened: who did what, and when.
 *
 * `at` is a `Date` and `locale` is REQUIRED: `formatDate` selects the locale's
 * own calendar (Jalali under `fa-IR`), so the caller never hands in a
 * pre-rendered date. `<time dateTime>` stays ISO-8601 (a machine value, not
 * visible text); the visible child is the localized string.
 *
 * No `"use client"` — a feed is server-rendered content with no callbacks.
 */
export interface ActivityItem {
  /** Stable key. Not rendered. */
  id: string;
  /** Who acted, e.g. «سارا محمدی». */
  actor: string;
  /** Fallback glyphs for the avatar, e.g. «س م». Required even with a portrait: `Avatar` layers them behind the image. */
  initials: string;
  /** Portrait URL. Omit for an initials-only avatar. */
  avatarSrc?: string | undefined;
  /** What they did. `LumoNode` so it can carry a link but still cannot be a bare count. */
  description: LumoNode;
  /** When it happened. Formatted by this block, in the locale's own calendar. */
  at: Date;
}

export interface ActivityFeedStrings {
  /** The card's heading, e.g. «فعالیت اخیر». */
  title: string;
  /** Shown in place of the list when `items` is empty. */
  emptyTitle: string;
  emptyDescription?: string | undefined;
}

export interface ActivityFeedProps {
  strings: ActivityFeedStrings;
  items: readonly ActivityItem[];
  /** Formats every timestamp. Required by design — see the file header. */
  locale: Locale;
  /** `Intl.DateTimeFormat` options for the timestamps. Defaults to a short date-and-time; always runs under the locale's own calendar. */
  dateFormat?: Intl.DateTimeFormatOptions | undefined;
  /** Heading level for the card title. Default `2`. */
  level?: 2 | 3 | 4 | 5 | 6 | undefined;
  className?: string | undefined;
}

const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function ActivityFeed({
  strings,
  items,
  locale,
  dateFormat = DEFAULT_DATE_FORMAT,
  level = 2,
  className,
}: ActivityFeedProps) {
  return (
    <Card variant="outlined" className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle level={level}>{strings.title}</CardTitle>
      </CardHeader>

      <CardBody>
        {items.length === 0 ? (
          <EmptyState
            size="sm"
            title={strings.emptyTitle}
            {...(strings.emptyDescription === undefined
              ? {}
              : { description: strings.emptyDescription })}
          />
        ) : (
          <ul className="flex list-none flex-col gap-4 p-0">
            {items.map((item) => (
              // `gap` not `me-3`: mirrored by the layout algorithm, not by hand.
              <li key={item.id} className="flex items-start gap-3">
                {item.avatarSrc === undefined ? (
                  <Avatar size="sm" initials={item.initials} />
                ) : (
                  // `alt=""`: the actor's name is already in the accessible tree one element away.
                  <Avatar size="sm" src={item.avatarSrc} alt="" initials={item.initials} />
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-sm text-fg">
                    <span className="font-medium">{item.actor}</span>
                  </p>
                  <div className="text-sm text-fg-muted">{item.description}</div>
                  {/* See the file header for why the attribute and the child
                      disagree about numbering system, and why that is right. */}
                  <time
                    dateTime={item.at.toISOString()}
                    className="text-xs text-fg-subtle"
                  >
                    {formatDate(item.at, locale, dateFormat)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
