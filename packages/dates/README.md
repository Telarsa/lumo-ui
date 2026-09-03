# lumo-ui/dates

A Jalali grid for shadcn/ui's Calendar.

shadcn's `Calendar` is `react-day-picker`. Left alone, its `fa-IR` locale is a
Persian *skin* over a Gregorian grid — «۲۲ ژوئیه ۲۰۲۴» on the day Iran calls
«۱ مرداد ۱۴۰۳». This package makes the grid count in the reader's own calendar.

It is the whole of what Lumo ships as components now. See `docs/decisions/log.md §50`.

---

## Why it exists

| | |
| --- | --- |
| `react-day-picker` v10 | removed its `./persian` subpath |
| `@daypicker/persian` | a standalone scope at a fraction of a percent of the base package's downloads |
| shadcn's documented Persian example | ships Afghan Dari from `fa-AF` |
| React Aria Components | 34 built-in locales; Persian is not one |

The gap is real and nobody else fills it.

## What it is not

**Not a Calendar component.** There is nothing to wrap, nothing to migrate to,
and no second component library. `lumoCalendar()` returns the four props
`<DayPicker>` already accepts, so *your* shadcn Calendar — copied, styled,
owned — starts counting in Jalali.

```tsx
import { Calendar } from "@/components/ui/calendar";   // shadcn's, untouched
import { stringsFor } from "lumo-ui/core";
import { lumoCalendar } from "lumo-ui/dates";

// Built-in fa-IR / en-US resolve themselves; any other language passes its own
// strings as the second argument. It throws rather than falling back.
const strings = stringsFor(locale);
const { dateLib, formatters, labels, weekStartsOn } = lumoCalendar(locale, strings.calendar);

<Calendar
  dateLib={dateLib}
  formatters={formatters}
  labels={labels}
  weekStartsOn={weekStartsOn}
/>;
```

`lumoCalendar` is hook-free and pure, so a server component may build the config
and hand it down.

There is deliberately **no hook** in this package. `useLumoStringsFor` lives in
`lumo-ui/core` (`stringsFor`) — so strings are an
argument and the context stays with the app. Moving the locale context into
`lumo-ui/core` is open work, recorded as **§50.2**.

## API conventions

This package follows **shadcn's naming** — `disabled`, not `isDisabled`.

Decision §0's value-first, `is`-prefixed convention stays with the retired
component library and the consumers that already copied it. Carrying it into a
shadcn-based product would split the API surface of every file that mixes the
two, permanently. (One consumer app alone holds 271 `isDisabled` /
`isInvalid` / `isReadOnly` / `isRequired` occurrences — that is the cost of the old choice,
already paid, and not one to pay twice.)

## The announced strings stay required

`labels` is built from `LumoStrings["calendar"]`, whose members are **required
props**, not a locale bundle. A bundle can be partial and fall back to English
silently; a required member is a compile error for the app that brings it.

`today` is a whole sentence per language, punctuation included — a shared
separator once put the Arabic comma into the English announcement.

That is the one guarantee from the old library worth carrying forward, and it
costs nothing to carry.

## What is proved

`pnpm --filter @lumo-ui/dates test` — 33 tests. (The workspace name is still
`@lumo-ui/dates`; the CONSUMER specifier is `lumo-ui/dates`.)

- **The 40-year sweep.** Every civil day from 1990-01-01 to 2030-01-01 converted
  and compared against `Intl` as the oracle: **0 mismatches** over 14,611 days.
  Anti-vacuity guarded (a sweep that compared nothing would pass silently).
- **The leap rule.** Esfand's length across 1390–1420, asked of the same
  calendar object the grid uses, then checked against `Intl` from both sides —
  the last day must *be* Esfand *n*, and the next must be Farvardin 1. Both 29
  and 30 must occur, or the assertions above are worthless.
- **Both digit surfaces.** `formatters.formatWeekNumber` *and*
  `dateLib.formatNumber` — these are different functions, and react-day-picker
  calls the second for dropdown years and grid week numbers.

### Mutation record

Two operators, both killed:

| mutant | result |
| --- | --- |
| `calendarFor` always returns `"gregory"` | **killed** — 7 failures |
| `dateLib.formatNumber` → `String(value)` (Latin digits) | **killed** — 1 failure |

The second mutant **survived the suite as promoted** and is why the
`dateLib.formatNumber` tests exist. The code had been in production in a
consumer app with that surface untested. A test that has never been seen to
fail is not a test.
