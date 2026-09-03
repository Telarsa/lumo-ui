/**
 * The package's promise, compiled.
 *
 * The README says `lumoCalendar()` returns "the four props `<DayPicker>` already
 * accepts". That sentence was FALSE on `weekStartsOn` — typed `number` against
 * DayPicker's `0 | 1 | 2 | 3 | 4 | 5 | 6` — and the package's own `tsc --noEmit`
 * passed anyway, because nothing inside `src/**` ever consumed the config it
 * exports. A contract nothing assigns to is a contract nothing checks.
 *
 * This file is that missing consumer. It is type-only: no test runner, no
 * render, no runtime cost. `gate:types` fails if the promise stops being true.
 */

import type { DayPickerProps } from "react-day-picker";
import { stringsFor } from "../../core/src/index.ts";
import { lumoCalendar } from "./index.ts";

const strings = stringsFor("fa-IR");
const config = lumoCalendar("fa-IR", strings.calendar);

/*
 * THE ASSERTION. Every one of the four must assign to the real prop it claims,
 * with no cast. If any widens or is renamed upstream, this stops compiling.
 */
export const props: DayPickerProps = {
  mode: "single",
  dateLib: config.dateLib,
  formatters: config.formatters,
  labels: config.labels,
  weekStartsOn: config.weekStartsOn,
};

/*
 * And the value boundary: `toPickerDate` must produce what DayPicker's own
 * date-valued props take, and `fromPickerDate` must return a CalendarDate
 * carrying its calendar — not a bare JS Date.
 */
import { toPickerDate, fromPickerDate, calendarDay } from "./index.ts";

export const selected: Date = toPickerDate(calendarDay("1403-05-01"));
export const roundTrip: number = fromPickerDate(selected, "fa-IR").year;
