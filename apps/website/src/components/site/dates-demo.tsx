"use client";

import { useMemo, useState } from "react";
import { formatDate, stringsFor, type Locale } from "lumo-ui/core";
import { fromPickerDate, lumoCalendar, toPickerDate } from "lumo-ui/dates";
import { Calendar } from "@/components/ui/calendar";

/**
 * The whole §51 pitch in one component: the Calendar below is shadcn's copy,
 * untouched. The four props from `lumoCalendar()` are what make it count in the
 * reader's own calendar — Jalali on the Persian page you may be reading now.
 *
 * Two things this demo got wrong on first write, both worth keeping as comments
 * because a consumer will hit them too:
 *
 * 1. `lumoCalendar()` MUST be memoised. `props.dateLib` is a dependency of
 *    DayPicker's own `useMemo` (react-day-picker 10.0.1, DayPicker.js:124), so
 *    a fresh object every render re-instantiates its `DateLib` and resets the
 *    calendar's internals — clicking a day appeared to do nothing.
 * 2. State must be seeded in the READER's calendar. `calendarDay("2026-08-31")`
 *    parses to a GREGORIAN `CalendarDate`, so the fields printed `1405/6/9`'s
 *    day as `2026/8/31` until the first click converted it. `fromPickerDate`
 *    is the one conversion, and the seed goes through it like every click does.
 */
export function DatesDemo({ locale, selectedLabel }: { locale: Locale; selectedLabel: string }) {
  const strings = stringsFor(locale);
  const config = useMemo(() => lumoCalendar(locale, strings.calendar), [locale, strings]);

  const [selected, setSelected] = useState(() =>
    fromPickerDate(new Date(2026, 7, 31, 12), locale),
  );
  const selectedDate = toPickerDate(selected);

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="rounded-2xl border border-border bg-surface p-1 shadow-raised">
        <Calendar
          mode="single"
          required
          selected={selectedDate}
          onSelect={(day) => day && setSelected(fromPickerDate(day, locale))}
          dateLib={config.dateLib}
          formatters={config.formatters}
          labels={config.labels}
          weekStartsOn={config.weekStartsOn}
        />
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-fg-subtle">{selectedLabel}</dt>
          <dd className="mt-1 text-xl font-black leading-snug">
            {formatDate(selectedDate, locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-fg-subtle" data-lumo-latn dir="ltr">
            CalendarDate
          </dt>
          <dd className="mt-1 font-mono text-xs text-fg-muted" data-lumo-latn dir="ltr">
            {`{ calendar: "${selected.calendar.identifier}", year: ${selected.year}, month: ${selected.month}, day: ${selected.day} }`}
          </dd>
        </div>
      </dl>
    </div>
  );
}
