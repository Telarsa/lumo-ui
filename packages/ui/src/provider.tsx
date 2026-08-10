"use client";

import { I18nProvider } from "react-aria-components";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { FORMAT_LOCALE } from "@lumo-ui/core";
import { LumoLocaleContext } from "./locale.ts";

/**
 * Mount this once, high in every Lumo application. It is not optional.
 *
 * React Aria resolves its locale from `useDefaultLocale()`, which reads
 * `navigator.language` and falls back to **`'en-US'`** — and during server
 * rendering there is no `navigator`, so *every* React Aria component renders as
 * `en-US`/`ltr` regardless of what `<html lang dir>` says.
 *
 * That is not a cosmetic difference. Measured on a Slider at value 40:
 *
 *     without a provider   left: 40%      ← measured from the wrong edge
 *     with fa-IR           left: 60%
 *
 * The thumb sits at the mirror image of where it belongs on every Persian page.
 * The same resolution drives arrow-key direction, popover placement and
 * collection navigation, so the failure is not confined to sliders.
 *
 * **Why no gate catches this.** `lumo-gate` grades attributes and text; this
 * defect is inline geometry that is individually valid. It renders, it
 * type-checks, it looks plausible in a screenshot — the exact profile of every
 * other defect this library exists to prevent, which is why the provider is a
 * component with a required prop rather than a line in the documentation.
 *
 * `FORMAT_LOCALE` is passed rather than the bare tag: the
 * `-u-ca-persian-nu-arabext` extensions are what make React Aria's own
 * formatters produce Jalali dates and Persian digits.
 */
export interface LumoProviderProps {
  /** The document's locale. Same value given to `LumoHtml`. */
  locale: Locale;
  children: LumoNode;
}

export function LumoProvider({ locale, children }: LumoProviderProps) {
  /*
   * TWO providers while two libraries are present.
   *
   * `I18nProvider` serves the components still on React Aria. `LumoLocaleContext`
   * serves the ones rebuilt on Base UI, which cannot see React Aria's context at
   * all — Base UI ships a direction provider and nothing else. See `locale.ts`.
   *
   * They carry the same locale by construction, so the two halves of the library
   * cannot disagree during the migration.
   */
  return (
    <LumoLocaleContext.Provider value={locale}>
      <I18nProvider locale={FORMAT_LOCALE[locale]}>{children}</I18nProvider>
    </LumoLocaleContext.Provider>
  );
}
