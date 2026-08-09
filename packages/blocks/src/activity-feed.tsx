import { cn, formatDate, type Locale, type LumoNode } from "@lumo-ui/core";
import { Avatar, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@lumo-ui/ui";

/**
 * A reverse-chronological list of what happened: who did what, and when.
 *
 * ═══ THE "WHEN" IS THE ENTIRE DIFFICULTY ════════════════════════════════════
 *
 * Under `fa-IR` a date is not "a Gregorian date written in Persian digits" — it
 * is a JALALI date, in a different year. `formatDate` from `@lumo-ui/core`
 * carries the `-u-ca-persian` extension that selects the calendar, and
 * format.ts states the failure mode precisely: omitting it produces a
 * plausible-looking date that is simply the wrong year, and that failure is
 * invisible to anyone who cannot read the calendar. A feed is where it shows up
 * first, because a feed is mostly timestamps.
 *
 * So `at` is a `Date` and `locale` is REQUIRED. The block formats; the caller
 * does not get the chance to hand it a pre-rendered "2026-08-09".
 *
 * ── `<time dateTime>` CARRIES LATIN DIGITS ON PURPOSE ──────────────────────
 *
 * The `dateTime` attribute is a MACHINE value and must stay ISO-8601: it is
 * what a parser, a crawler and a copy-paste read. It is not visible text, and
 * it is not one of the spoken attributes, so neither `LumoNode` nor the gate's
 * `no-latin-digits` (visible text nodes) nor `no-latin-aria` (aria-label,
 * aria-roledescription, aria-valuetext) applies to it. The VISIBLE child of the
 * same element is the Jalali string. Both are correct; they are different
 * audiences.
 *
 * No `"use client"` — a feed is server-rendered content with no callbacks.
 */
export interface ActivityItem {
  /** Stable key. Not rendered. */
  id: string;
  /** Who acted, e.g. «سارا محمدی». */
  actor: string;
  /**
   * Fallback glyphs for the avatar, e.g. «س م». Always required, even when a
   * portrait is supplied: `Avatar` layers the initials BEHIND the image, so
   * they cover the loading gap and any transparency (avatar.tsx explains why
   * there is no `onError` swap).
   */
  initials: string;
  /** Portrait URL. Omit for an initials-only avatar. */
  avatarSrc?: string | undefined;
  /**
   * What they did. `LumoNode` so it can carry a link to the affected record —
   * and `LumoNode` rather than `ReactNode` so it still cannot be a bare count.
   */
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
  /**
   * `Intl.DateTimeFormat` options for the timestamps. Defaults to a short
   * date-and-time. Whatever is passed runs under the locale's own CALENDAR, so
   * `fa-IR` stays Jalali regardless.
   */
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
              // `flex-row` + `gap`: the avatar takes the reading start and the
              // text column follows, mirrored by the layout algorithm. A
              // `me-3` on the avatar would have to be un-mirrored by hand.
              <li key={item.id} className="flex items-start gap-3">
                {item.avatarSrc === undefined ? (
                  <Avatar size="sm" initials={item.initials} />
                ) : (
                  /*
                   * `alt=""` and not `alt={item.actor}`. The actor's name is in
                   * the accessible tree one element away; repeating it makes a
                   * screen reader say it twice. avatar.tsx requires `alt` to be
                   * WRITTEN precisely so this judgement gets made rather than
                   * skipped.
                   */
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
