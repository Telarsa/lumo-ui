"use client";

import { useMemo, useState } from "react";
import { formatDate, stringsFor, type Locale } from "lumo-ui/core";
import { fromPickerDate, lumoCalendar, toPickerDate } from "lumo-ui/dates";
import { Calendar } from "@/components/ui/calendar";

/**
 * The whole pitch in one component: the Calendar below is shadcn's copy,
 * untouched. The four props from `lumoCalendar()` are what make it count in the
 * reader's own calendar — Jalali on the Persian page you may be reading now.
 *
 * Two things this demo got wrong on first write, both worth keeping because a
 * consumer will hit them too:
 *
 * 1. `lumoCalendar()` MUST be memoised. `props.dateLib` is a dependency of
 *    DayPicker's own `useMemo` (react-day-picker 10.0.1, DayPicker.js:124), so
 *    a fresh object every render re-instantiates its `DateLib` and resets the
 *    calendar's internals — clicking a day appeared to do nothing.
 * 2. State must be seeded in the READER's calendar. `calendarDay("2026-08-31")`
 *    parses to a GREGORIAN `CalendarDate`, so the fields printed the day as
 *    `2026/8/31` until the first click converted it. `fromPickerDate` is the
 *    one conversion, and the seed goes through it like every click does.
 */
export function DatesDemo({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { selected: string; fields: string };
}) {
  const strings = stringsFor(locale);
  const config = useMemo(() => lumoCalendar(locale, strings.calendar), [locale, strings]);

  const [selected, setSelected] = useState(() => fromPickerDate(new Date(2026, 7, 31, 12), locale));
  const selectedDate = toPickerDate(selected);

  return (
    <div className="dates-demo">
      <div className="dates-demo__calendar lit">
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
      <dl className="dates-demo__readout">
        <div>
          <dt>{labels.selected}</dt>
          <dd className="dates-demo__date">
            {formatDate(selectedDate, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </dd>
        </div>
        <div>
          <dt>{labels.fields}</dt>
          <dd>
            <code data-lumo-latn dir="ltr">
              {`{ calendar: "${selected.calendar.identifier}", year: ${selected.year}, month: ${selected.month}, day: ${selected.day} }`}
            </code>
          </dd>
        </div>
      </dl>
    </div>
  );
}
