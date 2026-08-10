import type { Locale } from "./types";

/**
 * The strings React Aria would otherwise render in English.
 *
 * WHY THIS IS PROPS AND NOT A DICTIONARY — this was measured, not assumed.
 *
 * React Aria ships 34 locale bundles and `fa` is not among them. The obvious
 * fix is `LocalizedStringProvider` with a custom `fa-IR` dictionary. It does not
 * work for server-rendered pages, and the reason is structural:
 *
 *   - `LocalizedStringProvider` renders NO children. It is not a context
 *     provider; it emits a `<script>` that sets
 *     `window[Symbol.for('react-aria.i18n.strings')]`.
 *   - So the dictionary is a CLIENT payload. On the server it reaches nothing.
 *
 * Measured: a dictionary with all 147 keys stamped with a sentinel produced
 * ZERO sentinel hits across ComboBox, Select, Menu, Table, Tree, GridList,
 * NumberField and TagGroup during `renderToStaticMarkup`. Khroos's provider
 * mini-sites must be SEO-indexed, so "correct after hydration" is not correct —
 * the first byte is what a crawler and a no-JS reader get.
 *
 * Props reach the server. So Lumo passes strings as props, and this file is the
 * contract that makes forgetting one a compile error.
 *
 * A second reason to prefer props: function-valued dictionary entries are
 * serialised with `toString()`, so any closure over module scope emits broken
 * JavaScript into the page. Measured — a sentinel closure produced
 * `let A=(...a) => SENTINEL + String(val(...a))`, referencing identifiers that
 * do not exist in the browser.
 *
 * ── SCOPE, and a correction to how it was measured ──────────────────────────
 *
 * The first sweep rendered 25 components in their DEFAULT state and found 8
 * English strings. That method was wrong in a way worth recording, because it
 * is the same shape as the defects this file exists to prevent: **a closed
 * overlay renders `null`**, so Popover, Menu, Select's list and ComboBox's
 * listbox contributed nothing to the sweep, and their leaks were scored as
 * absent rather than as unmeasured.
 *
 * Re-measured with overlays forced open, three more leaks appeared. Two are
 * verified here by rendering, not by report:
 *
 *   Breadcrumbs  `<ol aria-label="Breadcrumbs">` when no label is given —
 *                `useBreadcrumbs` does `ariaLabel || strings.format(...)`.
 *   Select       `"Select an item"` as VISIBLE placeholder text. Worse than an
 *                ARIA leak: a sighted Persian user reads it.
 *   ComboBox     a second `aria-label="Suggestions"` on the ListBox, alongside
 *                the already-known "Show suggestions".
 *
 * One reported leak did NOT reproduce and is recorded as refuted: an open
 * Popover was said to carry two `aria-label="Dismiss"`. Server-rendered output
 * contains none. `DismissButton` does emit that string via `useLabels`, but the
 * components layer only mounts it in some compositions and not during SSR. It
 * may still appear after hydration, which the HTML gate cannot see — so it
 * belongs to the hydrated test tier, not here.
 *
 * The lesson for anyone extending this file: **force the component into the
 * state that renders**, and grep the output. A default-state sweep measures
 * whichever components happen to be visible.
 *
 * ── UPDATE 10 August 2026: the unreachable ones are now reachable ────────────
 *
 * The three leaks below were recorded as unreachable and deferred. They are
 * closed, and not by a prop — by `patches/react-aria@3.51.0.patch`, which adds
 * `fa-IR` bundles to 15 of react-aria's own intl packages.
 *
 * That is where the strings actually live. `LocalizedStringProvider` only emits
 * a client script and never reaches the server render; patching the source of
 * truth reaches both. Verified: Calendar, DateField and Breadcrumbs now announce
 * nothing in English during `renderToStaticMarkup`, with no component change.
 *
 * The prop-based strings below stay props regardless. A prop is a contract a
 * consumer can see and a compiler can enforce; a patch is a repair we own and
 * must re-apply on every upgrade. Props first, patch only for what props cannot
 * reach. See `packages/ui/src/patch.test.tsx` — it fails if the patch still
 * applies but stops working, which is the quieter failure `pnpm patch` misses.
 *
 * Formerly unreachable, NOW CLOSED. The earlier text here deferred these to a
 * future client dictionary; that deferral is obsolete and the sentence has been
 * removed rather than softened, because a stale "we plan to" is how a closed
 * defect gets re-opened by someone tidying up:
 *
 *   Calendar   `aria-label="Today, …"` → «امروز، ۱۴۰۵ مرداد ۱۹, دوشنبه»
 *   Calendar   the composed `aria-label="Next"` → «ماه بعد»
 *   DateField  `aria-valuetext="Empty"` → «خالی», one per segment
 *
 * Still true, and still worth stating: passing `aria-label` to `CalendarCell`
 * or `aria-valuetext` to `DateSegment` changes nothing — RAC composes its own
 * and ignores the prop. The patch is what reaches them, and it reaches them on
 * the server, which the dictionary never could.
 *
 * Evidence, re-measured 10 August 2026 during the date-family build, under
 * `renderToStaticMarkup` with `I18nProvider locale="fa-IR-u-ca-persian-nu-arabext"`:
 *
 *   Calendar · RangeCalendar · DateField · TimeField · DatePicker ·
 *   DateRangePicker → ZERO Latin-word `aria-label`, `aria-valuetext` or
 *   `aria-roledescription` values across all six.
 *
 *   Key parity, `fa-IR` against `en-US`, in the bundles the family reads:
 *     calendar    12/12 keys      datepicker  16/16 keys
 *     spinbutton   1/1  key       (react-aria-components) 4/4 keys
 *
 * `packages/ui/src/dates.test.tsx` pins both, so a react-aria bump that adds a
 * key leaves the parity check red instead of quietly reintroducing English.
 *
 * ── A LEAK NO PATCH CAN REACH: `@react-stately/datepicker` VALIDATION ────────
 *
 * Found while building the date family, and the most consequential of the lot
 * because it is VISIBLE text rather than an ARIA attribute. Give a React Aria
 * date component a `minValue`, let the value fall below it, and an empty
 * `<FieldError>` renders React Aria's own message. On a fully Persian page:
 *
 *     "Value must be 8/23/2026 or later."
 *     "Value must be 3/21/2026 or earlier."
 *     "Start date must be before end date."
 *     "Selected date unavailable."
 *
 * English, under a field reading ۱۴۰۵/۱/۱ — and the interpolated date is
 * GREGORIAN with Latin digits. A Jalali product that is correct everywhere else
 * tells the user about the one date they got wrong in the wrong calendar.
 *
 * The bundle technique does not close it, and the reason is upstream's own
 * comment in `@react-stately/datepicker`'s `utils.mjs`:
 *
 *     // Match browser language setting here, NOT react-aria's I18nProvider, so
 *     // that we match other browser-provided validation messages…
 *     let locale = navigator.language || 'en-US';
 *
 * The locale comes from `navigator`, never from the provider; during server
 * rendering there is no `navigator` at all, so it is `en-US` every time and a
 * patched `fa-IR` bundle would be dead code on the first byte. That is the
 * `LocalizedStringProvider` finding at the top of this file, reached from the
 * opposite direction — and it is why this file's answer is props.
 *
 * So the date family renders `<FieldError>` ONLY when the author supplied a
 * message, and `DateBounds` in `packages/ui/src/date-field.tsx` makes that
 * message a REQUIRED prop the moment any bound exists. Adding a `minValue` to a
 * field is a compile error until its message is written. Not added to
 * `LumoStrings`: these sentences are about a specific product's rules, so the
 * library cannot author them — it can only refuse to let you forget.
 *
 * Note what is NOT in any of these lists: the Persian date itself renders
 * correctly with zero configuration (`۱۴۰۵ مرداد ۱۹, دوشنبه`), as do Persian
 * numerals and the RTL keyboard semantics. Only the English verbs leak.
 */
export interface LumoStrings {
  comboBox: {
    /**
     * The trigger button that opens the suggestion list.
     * Leak: `aria-label="Show suggestions"`. Reachable via `aria-label` on the
     * ComboBox's `<Button>`.
     */
    showSuggestions: string;
  };

  searchField: {
    /**
     * The clear button.
     * Leak: `aria-label="Clear search"`. Reachable via `aria-label` on the
     * SearchField's `<Button>`.
     */
    clear: string;
  };

  numberField: {
    /**
     * Leak: `aria-label="Decrease <field label>"`. RAC interpolates the field's
     * own label, which is why this is a function — the result must read as
     * Persian word order, not English word order with a Persian noun dropped in.
     * Reachable via `aria-label` on `<Button slot="decrement">`.
     */
    decrease: (fieldLabel: string) => string;
    /** As `decrease`. Reachable via `<Button slot="increment">`. */
    increase: (fieldLabel: string) => string;
    /**
     * Leak: `aria-roledescription="Number field"`.
     *
     * This one is placed on the `<input>`, NOT on `<Group>`. Passing it to
     * `Group` emits BOTH values — yours and RAC's — and the English one
     * survives as a duplicate attribute. Reachable via `aria-roledescription`
     * on `<Input>`.
     */
    roleDescription: string;
  };

  calendar: {
    /** Reachable via `aria-label` on `<Button slot="previous">`. */
    previousMonth: string;
    /**
     * Leak: `aria-label="Next"`. Reachable via `<Button slot="next">`.
     *
     * The SECOND, composed "Next" that once survived alongside it is closed by
     * the patch — the bundle it came from now answers in Persian. Both routes
     * are kept: the prop is the contract, the bundle is the backstop, and they
     * carry the same words so a reader never hears two different ones.
     */
    nextMonth: string;
  };

  datePicker: {
    /**
     * The button that opens a DatePicker's or DateRangePicker's calendar.
     *
     * Leak: `aria-label="Calendar"` — composed by RAC from the `calendar` key
     * of its datepicker bundle and appended to the field's own name, so the
     * unpatched announcement is «تاریخ سفر, Calendar»: a Persian noun inside an
     * English name, which is the half-translated shape this file exists to
     * prevent.
     *
     * Reachable via `aria-label` on the trigger `<Button>`, and it REPLACES
     * rather than duplicates — verified by rendering: with the prop set, the
     * word appears exactly once in the output. That is worth stating because
     * the same move on NumberField's `<Group>` emits BOTH values and English
     * wins; which element accepts an override is a per-component fact, and the
     * only way to know it is to render and grep.
     */
    openCalendar: string;
  };
}

/**
 * Persian. Authored, not translated.
 *
 * Word order matters more than vocabulary here: `decrease` must read as Persian
 * ("کاهش <label>"), which happens to match the English shape, but the function
 * form exists so a locale whose grammar does not match can reorder freely.
 */
export const fa: LumoStrings = {
  comboBox: { showSuggestions: "نمایش پیشنهادها" },
  searchField: { clear: "پاک کردن جستجو" },
  numberField: {
    decrease: (l) => `کاهش ${l}`,
    increase: (l) => `افزایش ${l}`,
    roleDescription: "فیلد عددی",
  },
  calendar: { previousMonth: "ماه قبل", nextMonth: "ماه بعد" },
  datePicker: { openCalendar: "باز کردن تقویم" },
};

export const en: LumoStrings = {
  comboBox: { showSuggestions: "Show suggestions" },
  searchField: { clear: "Clear search" },
  numberField: {
    decrease: (l) => `Decrease ${l}`,
    increase: (l) => `Increase ${l}`,
    roleDescription: "Number field",
  },
  calendar: { previousMonth: "Previous month", nextMonth: "Next month" },
  datePicker: { openCalendar: "Open calendar" },
};

/**
 * Every declared locale must have a complete string set.
 *
 * `satisfies Record<Locale, LumoStrings>` is the enforcement: adding a locale to
 * the union without adding its strings here is a compile error, and so is
 * omitting a single key. There is no partial type and no fallback — a fallback
 * is what produces an English word in a Persian sentence, which is the defect
 * this whole file exists to prevent.
 */
export const STRINGS = { "fa-IR": fa, "en-US": en } satisfies Record<
  Locale,
  LumoStrings
>;

export function stringsFor(locale: Locale): LumoStrings {
  return STRINGS[locale];
}
