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
 * Still not prop-reachable, and both belong to milestone M9 (post-launch,
 * provider tier):
 *
 *   Calendar   `aria-label="Today, ۱۴۰۵ مرداد ۱۸, یکشنبه"`  ← CalendarCell
 *   Calendar   a second internal `aria-label="Next"`          ← composed
 *   DateField  `aria-valuetext="Empty"` (one per segment)     ← DateSegment
 *
 * Verified unreachable: passing `aria-label` to `CalendarCell` and
 * `aria-valuetext` to `DateSegment` changes nothing — RAC composes its own and
 * ignores the prop. Those are announced on interaction rather than read from
 * the first byte, so the client dictionary is the right tool for them; that
 * path is untested and is deliberately not claimed here.
 *
 * Note what is NOT in this list: the Persian date itself renders correctly with
 * zero configuration (`۱۴۰۵ مرداد ۱۸, یکشنبه`), as do Persian numerals and the
 * RTL keyboard semantics. Only the English verbs leak.
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
     * Leak: `aria-label="Next"`. Reachable via `<Button slot="next">` — but note
     * a SECOND internal "Next" survives, composed by RAC. See the file header.
     */
    nextMonth: string;
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
