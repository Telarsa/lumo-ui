"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { I18nProvider } from "react-aria-components";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { FORMAT_LOCALE, direction } from "@lumo-ui/core";
import { LumoLocaleContext } from "./locale.ts";

/**
 * Mount this once, high in every Lumo application. It is not optional.
 *
 * ═══ ONE PROP IN, THREE CONTEXTS OUT ════════════════════════════════════════
 *
 * `locale` is the ONLY input, and everything else is derived from it inside
 * this function:
 *
 *     locale ──┬─► LumoLocaleContext   the Base UI half's locale + strings
 *              ├─► I18nProvider        the React Aria half, FORMAT_LOCALE[locale]
 *              └─► DirectionProvider   Base UI's direction, direction(locale)
 *
 * **There is no `direction` prop and there will not be one.** That is the whole
 * change in this file, and it is the thing Base UI's own provider gets wrong:
 * `DirectionProvider` takes `direction?: 'ltr' | 'rtl'` with `@default 'ltr'`
 * (`direction-provider/DirectionProvider.mjs:14` — `const { direction = 'ltr' }`).
 * So the two levers a Base UI application actually has — a per-component
 * `locale` prop on `Slider`/`NumberField`, and a global `DirectionProvider` —
 * are unrelated values with nothing tying them together, and the failure when
 * they disagree is Persian digits sliding the wrong way with nothing red
 * anywhere. `base-ui-i18n.json` records it as measured; `direction(locale)` is
 * how Lumo makes it unrepresentable. Passing a wrong direction is not
 * discouraged here, it does not compile.
 *
 * `direction()` reads `Intl.Locale.getTextInfo()` rather than a table, so
 * adding a locale to `Locale` cannot forget to add its direction — the same
 * argument CONTRIBUTING.md's "Adding a locale" step 1 makes.
 *
 * ═══ WHY REACT ARIA'S PROVIDER IS STILL HERE ════════════════════════════════
 *
 * Because 58 source modules in this package still import
 * `react-aria-components` against 24 on Base UI. The migration is mid-flight,
 * and removing `I18nProvider` while `calendar`, `slider`, `toolbar`, `tree` and
 * fifty others resolve their locale from it would put every one of them back on
 * `navigator.language || 'en-US'`. It goes when the last RAC import goes, and
 * `provider.test.tsx` is the thing that will fail loudly if it goes early.
 *
 * The defect it exists for is worth restating, because it is the reason this is
 * a component with a required prop rather than a line of documentation. React
 * Aria resolves its locale from `useDefaultLocale()`, which reads
 * `navigator.language` and falls back to **`'en-US'`** — and during server
 * rendering there is no `navigator`. Measured on a Slider at value 40:
 *
 *     without a provider   left: 40%      ← measured from the wrong edge
 *     with fa-IR           left: 60%
 *
 * `lumo-gate` grades attributes and text; this is inline geometry that is
 * individually valid. It renders, it type-checks, it looks plausible in a
 * screenshot.
 *
 * `FORMAT_LOCALE` rather than the bare tag: the `-u-ca-persian-nu-arabext`
 * extensions are what make React Aria's own formatters produce Jalali dates and
 * Persian digits.
 *
 * ═══ WHAT `DirectionProvider` BUYS, AND WHAT IT DOES NOT ════════════════════
 *
 * Base UI reads it for keyboard geometry: arrow-key direction in `Menu`,
 * `Select`, `Tabs` and `Slider`, and the side/align resolution in the
 * positioner. It does NOT set `dir` on any element and it does not affect CSS —
 * `LumoHtml` owns the document's `dir`, derived from the same locale, and CSS
 * logical properties do the rest.
 *
 * So the two are not redundant: `LumoHtml` tells the BROWSER, this tells BASE
 * UI's JavaScript, and both read `direction(locale)`. Before this change the
 * Base UI half read nothing at all and defaulted to `ltr` on every Persian
 * page — a defect that never appeared in the served bytes, because it is a
 * keyboard behaviour.
 *
 * ═══ ORDER IS NOT ARBITRARY ═════════════════════════════════════════════════
 *
 * `DirectionProvider` is innermost so that a nested `LumoProvider` — a locale
 * switcher previewing the other direction inside a page, which the docs site
 * does — overrides direction and locale together. Nesting the direction outside
 * the locale would let an inner provider change one and inherit the other,
 * which is exactly the disagreement this file exists to prevent.
 */
export interface LumoProviderProps {
  /**
   * The document's locale. Same value given to `LumoHtml`.
   *
   * There is deliberately no `direction` sibling — see the header. Direction is
   * `direction(locale)` and cannot be overridden.
   */
  locale: Locale;
  children: LumoNode;
}

export function LumoProvider({ locale, children }: LumoProviderProps) {
  return (
    <LumoLocaleContext.Provider value={locale}>
      <I18nProvider locale={FORMAT_LOCALE[locale]}>
        <DirectionProvider direction={direction(locale)}>{children}</DirectionProvider>
      </I18nProvider>
    </LumoLocaleContext.Provider>
  );
}
