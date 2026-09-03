/**
 * `@lumo-ui/dates` — the gap, and nothing else (decision §50).
 *
 * Lumo no longer ships a component library. It ships the locale contract
 * (`@lumo-ui/core`), the served-byte grader (`@lumo-ui/gate`), the lint policy
 * (`@lumo-ui/config`), and this: the one thing shadcn/ui genuinely cannot do.
 *
 * ## Why this package exists
 *
 * shadcn's `Calendar` is `react-day-picker`. `react-day-picker` v10 removed its
 * `./persian` subpath, `@daypicker/persian` runs at a fraction of a percent of
 * the base package's downloads, and shadcn's own documented Persian example
 * ships Afghan Dari from `fa-AF`. A Persian reader gets a Persian *skin* over a
 * Gregorian grid: «۲۲ ژوئیه ۲۰۲۴» on the day Iran calls «۱ مرداد ۱۴۰۳».
 *
 * ## What it is not
 *
 * Not a Calendar component. `lumoCalendar()` returns the four props
 * `<DayPicker>` already accepts, so shadcn's Calendar — yours, copied, styled
 * however you like — starts counting in the reader's calendar. There is nothing
 * to wrap and nothing to migrate to.
 *
 * ```tsx
 * import { Calendar } from "@/components/ui/calendar";   // shadcn's, untouched
 * import { stringsFor } from "lumo-ui/core";
 * import { lumoCalendar } from "lumo-ui/dates";
 *
 * // `stringsFor` resolves the built-in fa-IR / en-US sets. For any other
 * // language pass your own as the second argument — it throws rather than
 * // falling back, which is the point.
 * const strings = stringsFor(locale);
 * const { dateLib, formatters, labels, weekStartsOn } = lumoCalendar(locale, strings.calendar);
 *
 * <Calendar dateLib={dateLib} formatters={formatters} labels={labels} weekStartsOn={weekStartsOn} />
 * ```
 *
 * There is deliberately no hook here. `useLumoStringsFor` lives in
 * `@lumo-ui/core` (`stringsFor`), which every consumer already depends on — so this package takes
 * strings as an ARGUMENT and leaves the context to the app. Moving the locale
 * context into `@lumo-ui/core` is open work, recorded as §50.2.
 *
 * ## API conventions
 *
 * This package follows **shadcn's naming**, not Lumo's (`disabled`, not
 * `isDisabled`). §0's value-first, `is`-prefixed convention stays with the
 * retired component library and the consumers that already copied it; carrying
 * it into a shadcn-based product would split the API surface of every file that
 * mixes the two. Decision §50, clause 3.
 *
 * ## The announced strings are still required
 *
 * `labels` is built from `LumoStrings["calendar"]`, whose members are required.
 * A language without them is a compile error for the app that brings it — not a
 * silent fall back to English. That is the one guarantee from the old library
 * worth carrying forward, and it costs nothing to carry.
 */

export {
  calendarDay,
  calendarFor,
  fromPickerDate,
  lumoCalendar,
  toPickerDate,
  type LumoCalendarConfig,
} from "./datelib.ts";
