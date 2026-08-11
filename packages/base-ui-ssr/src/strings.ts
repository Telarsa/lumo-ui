import { formatNumber, fa as lumoFa, en as lumoEn, type Locale } from "@lumo-ui/core";

/**
 * The i18n layer Base UI does not have.
 *
 * ── WHY THIS LIVES BESIDE THE SSR FIXES AND NOT IN `@lumo-ui/core` ──────────
 *
 * It was in core first, and that was wrong. `@lumo-ui/core` holds LUMO's
 * invariants — the types, the locale, the phrases Lumo authors about its own
 * components. This file is a catalogue of ANOTHER LIBRARY's English literals,
 * keyed by the file and line that emits each one. It is versioned against Base
 * UI, not against Lumo: when Base UI adds a string, an entry is owed here; when
 * Base UI ships a translations provider, this file is deleted. That is the same
 * lifecycle every other module in this package has, and a different one from
 * anything in core.
 *
 * ── WHAT IS MISSING UPSTREAM, MEASURED ──────────────────────────────────────
 *
 * `@base-ui/react@1.7.0` ships **no** internationalisation of any kind:
 * zero locale bundles, zero strings provider, zero key namespace, zero locale
 * context. `grep -rin 'i18n|localiz|translation'` over all 3240 files in the
 * package returns only CSS `translate` offsets, date-format token names, and the
 * word "translation" inside one toast doc paragraph — recorded in
 * `experiments/measurements/base-ui-i18n.json`. Of its 83 export subpaths exactly
 * two are providers, `./csp-provider` and `./direction-provider`, and neither
 * carries text.
 *
 * The library nevertheless speaks English in eight places. Seven of them are
 * reachable through an ordinary prop; the eighth (Combobox's internal dismiss
 * sentinel) is not, and is drafted for upstream in
 * `experiments/upstream/base-ui-dismiss.md`. **This file is the catalogue of the
 * seven.**
 *
 * ── WHY A CATALOGUE AND NOT SEVEN LITERALS AT SEVEN CALL SITES ──────────────
 *
 * A prop reaches the string. A prop does not stop you forgetting it, and every
 * one of these seven is an ARIA attribute — invisible in review, invisible in a
 * screenshot, wrong only to the person listening. Base UI's own defaults are the
 * proof of how quiet the failure is: `«۲۰ start range»` is HALF localised, the
 * digits obeying `Slider.Root`'s `locale` prop and the words around them not, so
 * a reviewer who does not read Persian sees ۲۰ and moves on.
 *
 * So the seven resolve from ONE locale, the same locale that already drives
 * `formatNumber`, direction, and `LumoStrings`. `satisfies Record<Locale, …>`
 * makes a missing locale a compile error and a missing key a compile error, the
 * same enforcement `strings.ts` uses and for the same reason: a fallback is what
 * produces an English word in a Persian sentence.
 *
 * ── THIS RESOLVES DURING RENDER, WHICH IS THE WHOLE POINT ───────────────────
 *
 * `strings.ts` records why React Aria's `LocalizedStringProvider` cannot do this:
 * it renders no children, it emits a `<script>` that sets a `window` symbol, and
 * so it reaches NOTHING during `renderToStaticMarkup` — measured, zero sentinel
 * hits across eight components. Everything below is a plain function of a
 * `Locale` value. There is no provider to be absent, no effect to not run, and
 * no `window` to be missing: it resolves in the same synchronous pass that emits
 * the first byte. `useBaseUiStrings()` in `packages/ui/src/locale.ts` is the
 * React-side sugar and reads a real context Provider, which crosses the server
 * render for the same reason.
 *
 * No `"use client"`, here or anywhere in this package: everything in this file is
 * pure, so a server component may call it directly.
 *
 * ── THE HOUSE RULE THIS DOES NOT BREAK ──────────────────────────────────────
 *
 * Lumo requires announced strings as PROPS. That rule is about strings which
 * name the CONSUMER's content — a field's label, a dialog's title, a close
 * button on their toast. The library cannot author those and must not guess.
 *
 * The seven here are the opposite kind: they are vocabulary the ENGINE authors
 * about ITSELF. «فیلد عددی» is the same phrase in every application that ever
 * renders a number field, and no product ever wants a different one. Requiring a
 * prop for those would not prevent a defect; it would only relocate the English
 * literal into 107 registry items. Where Lumo's frozen public API already has a
 * required prop for one of them — `NumberField`'s `roleDescription`,
 * `incrementLabel`, `decrementLabel` — **the prop still wins**, and this
 * catalogue is where its value comes from. Precedence is stated once, here, and
 * implemented at each carrier: explicit prop, else catalogue.
 */

/**
 * The authored form of the catalogue: one entry per English string Base UI
 * emits, keyed by the component that carries it.
 *
 * Slider's two entries take an ALREADY-FORMATTED string rather than a number,
 * and that is deliberate. A translator authoring a locale must not be able to
 * reach the raw value, because reaching it means `${value}` — a bare JavaScript
 * number interpolated into an ARIA attribute, in Latin digits, on a Persian
 * page. That is `LumoNode`'s rule 0 defect in the one place `LumoNode` cannot
 * see, since `aria-valuetext` is not a text node. Making the number unavailable
 * at the point of authorship is the enforcement; `baseUiStringsFor` below is the
 * only thing that can supply it, and it supplies it through `formatNumber`.
 */
export interface BaseUiStringTemplates {
  numberField: {
    /**
     * `aria-roledescription` on `NumberField.Input`.
     * Base UI: `"Number field"` — `number-field/input/NumberFieldInput.mjs:111`.
     */
    roleDescription: string;
    /**
     * `aria-label` on `NumberField.Increment`.
     * Base UI: `"Increase"` — `number-field/root/useNumberFieldStepperButton.mjs:104`.
     *
     * A BARE VERB, unlike `LumoStrings.numberField.increase`, which is a function
     * of the field's label because React Aria interpolated one («افزایش بودجه»).
     * Base UI interpolates nothing, so this is the string that matches what the
     * engine actually emits. Lumo's own `NumberField` still requires the
     * interpolated prop and that prop wins — this entry is what a bare
     * `NumberField.Increment` outside Lumo's wrapper needs, and what the
     * conformance test asserts against.
     */
    increase: string;
    /** `aria-label` on `NumberField.Decrement`. Base UI: `"Decrease"`, same line. */
    decrease: string;
  };

  progress: {
    /**
     * `aria-valuetext` on `Progress.Root` while indeterminate.
     * Base UI: `"indeterminate progress"` — `progress/root/ProgressRoot.mjs:43`.
     *
     * Reached through `getAriaValueText`, whose callback receives the empty
     * string as `formattedValue` in this state — the signature does not tell you
     * which state you are in, so the callback must decide from
     * `Progress.Root`'s own `value === null`, not from its argument.
     *
     * `Meter` shares this key only in the sense that it shares the mechanism;
     * a meter is never indeterminate, and Base UI's meter emits a pure formatted
     * number with no prose wrapper to leak.
     */
    indeterminate: string;
  };

  slider: {
    /**
     * `aria-valuetext` on `Slider.Thumb` at index 0 of a RANGE slider.
     * Base UI: `` `${formatNumber(...)} start range` `` —
     * `slider/thumb/SliderThumb.mjs:38`.
     *
     * The trap this closes is recorded in `base-ui-i18n.json`: the override is a
     * THUMB prop, and `getAriaValueText` aimed at `Slider.Root` is not a prop at
     * all — React forwards it to the DOM as an unknown attribute and the English
     * survives with a dev warning nobody reads in production.
     */
    rangeStart: (formattedValue: string) => string;
    /** As `rangeStart`, at the last index. Base UI: `"… end range"`, same line. */
    rangeEnd: (formattedValue: string) => string;
  };

  toast: {
    /**
     * `aria-label` on `Toast.Viewport`.
     * Base UI: `"Notifications"` — `toast/viewport/ToastViewport.mjs:184`.
     *
     * It names a `role="region"` carrying `aria-live="polite"` — the announced
     * name of the live region itself, so it is spoken every time the region
     * gains focus.
     */
    viewport: string;
  };
}

/**
 * Persian. Authored, not translated.
 *
 * `roleDescription` is READ FROM `LumoStrings` rather than re-typed. The phrase
 * «فیلد عددی» already exists there because React Aria emitted the identical
 * English string, and two independently authored Persian phrases for one concept
 * is how a component ends up announcing one word to a screen reader and another
 * one in its documentation.
 *
 * The remaining six are new: React Aria had no equivalent for any of them (see
 * `base-ui-i18n.json` → `react_aria_equivalent: null` on four of them), so there
 * is nothing to reuse and nothing to diverge from.
 */
const fa: BaseUiStringTemplates = {
  numberField: {
    roleDescription: lumoFa.numberField.roleDescription,
    increase: "افزایش",
    decrease: "کاهش",
  },
  progress: { indeterminate: "پیشرفت نامعین" },
  slider: {
    // Word order is Persian, not English word order with a Persian noun dropped
    // in — the same requirement `strings.ts` states for its function entries.
    rangeStart: (v) => `${v} آغاز بازه`,
    rangeEnd: (v) => `${v} پایان بازه`,
  },
  toast: { viewport: "اعلان‌ها" },
};

/**
 * English.
 *
 * These are deliberately NOT byte-identical to Base UI's own defaults in every
 * case, and the difference is the point of having them at all: an `en-US` page
 * that resolves through this catalogue takes the same code path a `fa-IR` page
 * takes. If English were left to fall through to the library's default, the
 * Persian path would be the only one exercised and a regression in the wiring
 * would show up in exactly one locale.
 */
const en: BaseUiStringTemplates = {
  numberField: {
    roleDescription: lumoEn.numberField.roleDescription,
    increase: "Increase",
    decrease: "Decrease",
  },
  progress: { indeterminate: "indeterminate progress" },
  slider: {
    rangeStart: (v) => `${v} start range`,
    rangeEnd: (v) => `${v} end range`,
  },
  toast: { viewport: "Notifications" },
};

/**
 * Every declared locale must have a complete set.
 *
 * `satisfies Record<Locale, BaseUiStringTemplates>` is the enforcement: adding a
 * locale to the union without adding its strings here is a compile error, and so
 * is omitting a single key. There is no partial type and no fallback.
 */
export const BASE_UI_STRINGS = { "fa-IR": fa, "en-US": en } satisfies Record<
  Locale,
  BaseUiStringTemplates
>;

/**
 * The catalogue as a component consumes it: the slider entries now take the
 * NUMBER, and the locale is already bound.
 *
 * This is the shape that makes the defect impossible rather than merely
 * discouraged. A carrier cannot pass the wrong locale to the formatter, because
 * it never sees a locale at the call site — only `slider.rangeStart(value)`.
 */
export interface BaseUiStrings
  extends Omit<BaseUiStringTemplates, "slider"> {
  slider: {
    /**
     * Routed through `formatNumber(value, locale, options)`. Persian digits,
     * always.
     *
     * `options` is the SAME `Intl.NumberFormatOptions` the slider's visible
     * `<output>` is formatted with. It is optional only because a plain slider
     * has none; passing a different one here than the component renders with is
     * the drift this catalogue exists to prevent, so a carrier should thread its
     * one `formatOptions` value through rather than choosing a second.
     */
    rangeStart: (value: number, options?: Intl.NumberFormatOptions) => string;
    rangeEnd: (value: number, options?: Intl.NumberFormatOptions) => string;
  };
}

/**
 * Resolve the catalogue for one locale.
 *
 * Pure and synchronous, so a server component may call it directly. The React
 * sugar is `useBaseUiStrings()` in `packages/ui/src/locale.ts`; it exists so a
 * component with no `locale` prop of its own has one source rather than two, and
 * it resolves the same values through the same function.
 *
 * `formatNumber` is applied HERE and nowhere else, which is what guarantees the
 * slider's digits and the slider's words come out of the same locale. Base UI's
 * own default is the counter-example: it formats the number with `Slider.Root`'s
 * `locale` prop and hardcodes the words, producing «۲۰ start range».
 */
export function baseUiStringsFor(locale: Locale): BaseUiStrings {
  const t = BASE_UI_STRINGS[locale];
  return {
    numberField: t.numberField,
    progress: t.progress,
    toast: t.toast,
    slider: {
      rangeStart: (value, options) =>
        t.slider.rangeStart(formatNumber(value, locale, options)),
      rangeEnd: (value, options) =>
        t.slider.rangeEnd(formatNumber(value, locale, options)),
    },
  };
}
