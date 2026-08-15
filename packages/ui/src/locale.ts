/**
 * EXPERIMENT ONLY (branch `experiment/base-ui`). The locale context Base UI
 * does not have.
 *
 * ── THE GAP, MEASURED ───────────────────────────────────────────────────────
 *
 * `@base-ui/react@1.7.0` exposes 40 subpaths. One of them is
 * `direction-provider`, and it carries exactly one value: `"ltr" | "rtl"`.
 * There is no locale provider, no `useLocale`, and no formatter context
 * anywhere in the package — direction is the only piece of internationalisation
 * Base UI models, because direction is the only piece its own components need.
 *
 * React Aria's `I18nProvider` is the thing being removed, and it is what
 * `dates.test.tsx` mounts around every case. A date field built on Base UI
 * cannot see it. So the locale has to come from somewhere Lumo owns, and this
 * is that somewhere.
 *
 * ── THE DEFAULT IS LOAD-BEARING AND IT IS NOT FREE ──────────────────────────
 *
 * The default is `fa-IR`, which is a real decision and not a convenience:
 *
 *  • It matches the library's premise. Lumo is Persian-first; a component that
 *    silently falls back to `en-US` is the shape of every defect the project
 *    exists to prevent, and React Aria's `navigator.language || 'en-US'`
 *    fallback is the specimen (see `provider.tsx`).
 *
 *  • It is also the reason `dates.test.tsx`'s DateField cases still pass. They
 *    pass because the DEFAULT is Persian, not because the `I18nProvider` they
 *    mount was read — that provider is invisible to this component. The
 *    assertion survives; the mechanism behind it does not. That distinction is
 *    recorded in `experiments/measurements/date-field-cost.json` rather than
 *    left for a reader to discover, because a green test that is green for a
 *    different reason is worse evidence than a red one.
 *
 * A real application still mounts `LumoProvider`, which sets this context and
 * derives Base UI's direction from the same locale.
 */

import { createContext, useContext } from "react";
import { type Locale } from "@lumo-ui/core";
import { baseUiStringsFor, type BaseUiStrings } from "@lumo-ui/base-ui-ssr";

export const LumoLocaleContext = createContext<Locale>("fa-IR");

/** The locale every Base UI-based Lumo component formats and announces in. */
export function useLumoLocale(): Locale {
  return useContext(LumoLocaleContext);
}

/**
 * The seven English strings Base UI emits, resolved for the current locale.
 *
 * ── WHY THIS IS A HOOK OVER A CONTEXT AND NOT A SECOND PROVIDER ─────────────
 *
 * There is exactly one locale lever in Lumo and it is `LumoLocaleContext`. A
 * `LumoStringsProvider` beside it would be a SECOND lever, and two levers that
 * can disagree is the precise failure `base-ui-i18n.json` records against Base
 * UI itself: a per-component `locale` prop and a global `DirectionProvider` with
 * nothing tying them together, so a page that sets one and forgets the other
 * renders Persian digits sliding the wrong way with nothing red anywhere. The
 * strings are DERIVED from the locale, never passed alongside it — the same rule
 * `direction()` follows in `@lumo-ui/core`.
 *
 * ── IT RESOLVES ON THE SERVER, WHICH IS WHY IT IS A CONTEXT AT ALL ──────────
 *
 * `React.createContext` + a real Provider is read during render, so the value is
 * present in the first byte. That is the distinction `core/src/strings.ts`
 * measured against React Aria's `LocalizedStringProvider`, which renders no
 * children and only sets `window[Symbol.for('react-aria.i18n.strings')]` — zero
 * reach during `renderToStaticMarkup`. Nothing here touches `window`, and
 * nothing here runs in an effect, which is the same defect in the other organ:
 * `useRegisteredLabelId` and `useAriaLabelledBy` are both layout effects, which
 * is why `useFieldWiring` exists in `@lumo-ui/base-ui-ssr`.
 *
 * ── WHERE IT IS USED, AND WHERE THE PROP IS USED INSTEAD ────────────────────
 *
 * A component whose frozen public API already carries a required `locale` prop —
 * `Slider`, `ProgressBar`, `Meter`, `ToastRegion` — must call
 * `baseUiStringsFor(locale)` with THAT prop, not this hook. Same reason again:
 * one source per component. This hook is for components with no locale prop of
 * their own, such as `NumberField` and `DateField`.
 */
export function useBaseUiStrings(): BaseUiStrings {
  return baseUiStringsFor(useContext(LumoLocaleContext));
}
