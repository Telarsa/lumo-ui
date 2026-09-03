"use client";

/**
 * The locale context, and the provider that mounts it. A CLIENT module — the
 * context is read during render on the server too (Next renders client
 * components server-side), but `createContext` may only be LOADED from a
 * client module, which the first RSC consumer (apps/website) discovered.
 *
 * MOVED HERE 30 Aug 2026 (decision §50.2). It lived in `packages/ui/src/locale.ts`
 * — inside the package §50 clause 1 retires — which meant the locale contract,
 * the thing Lumo actually is now, could not be used without installing the
 * component library it is replacing. `@lumo-ui/dates`' own documented entry point
 * named `useLumoStringsFor` from this package before it existed here.
 *
 * WHAT DELIBERATELY DID NOT COME WITH IT: Base UI's `DirectionProvider`.
 * `packages/ui`'s provider mounted it because every Lumo component rents Base
 * UI's keyboard geometry. A product on shadcn/ui does not, so requiring a Base
 * UI dependency to read a locale would be exactly the coupling §50 removes. An
 * app whose components DO use Base UI wraps this provider's children in Base
 * UI's own `DirectionProvider` with `direction(locale)` — one line, from the
 * same source of truth, and visible rather than hidden.
 *
 * The engine strings (`LumoAppStrings["engine"]`) did not come either: they exist
 * to patch the English Base UI leaks in Lumo's own components, and those are the
 * components being retired. They stay in `@lumo-ui/base-ui-ssr`.
 */

import { createContext, useContext, useMemo } from "react";
import { stringsFor, type LumoStrings } from "./strings.ts";
import type { BuiltinLocale, Locale, LumoNode } from "./types.ts";

export interface LumoLocaleValue {
  locale: Locale;
  /**
   * The app's own strings for a language Lumo does not carry; `undefined` for a
   * built-in locale.
   *
   * Typed as `LumoStrings` — the FLOOR every reader can rely on. A layer above
   * may carry more (`@lumo-ui/base-ui-ssr` adds `engine`) and narrows on read;
   * that narrowing is safe only because the provider which accepts the wider
   * type is the one that set the value.
   */
  strings: LumoStrings | undefined;
}

/**
 * The default is `fa-IR`, deliberately: a silent `en-US` fallback is the defect
 * this project exists to prevent. A plain `createContext` read during render, so
 * it resolves on the server.
 */
export const LumoLocaleContext = createContext<LumoLocaleValue>({
  locale: "fa-IR",
  strings: undefined,
});

/** The locale the tree formats and announces in. */
export function useLumoLocale(): Locale {
  return useContext(LumoLocaleContext).locale;
}

/** Lumo's own strings for the current locale — built-in, or the app's. */
export function useLumoStrings(): LumoStrings {
  const { locale, strings } = useContext(LumoLocaleContext);
  return stringsFor(locale, strings);
}

/**
 * The provider's `strings` as they apply to ONE tag: a component's own `locale`
 * prop may differ from the provider's, and the app's German strings must not
 * become a French slider's. A built-in tag resolves itself; the provider's
 * `strings` serve a tag only when the provider speaks THAT tag. Anything else is
 * `undefined`, and `stringsFor` then throws — the defect this library exists to
 * prevent must not happen quietly.
 */
export function useLumoStringsFor(locale: Locale): LumoStrings {
  const context = useContext(LumoLocaleContext);
  const own = context.locale === locale ? context.strings : undefined;
  return stringsFor(locale, own);
}

/**
 * `locale` is any BCP-47 tag (decision §28). A built-in locale (`fa-IR`,
 * `en-US`) needs nothing else; ANY OTHER language must bring `strings` — the
 * type requires it, because the alternative is announcing another language.
 * Same value as `LumoHtml`'s `lang`.
 *
 * There is no `direction` prop and there will not be one: direction is
 * `direction(locale)`, and a wrong direction should be unrepresentable rather
 * than discouraged.
 */
export type LumoLocaleProviderProps = { children: LumoNode } & (
  | {
      /** A locale Lumo carries strings for: `fa-IR` or `en-US`. */
      locale: BuiltinLocale;
      /** The app's own complete strings for a built-in locale — its own wording, in that language; omit for Lumo's. */
      strings?: LumoStrings | undefined;
    }
  | {
      /** Any other BCP-47 tag (`de`, `ar-EG`, `zh-Hant-TW`). */
      locale: Locale;
      /** REQUIRED for a language Lumo does not carry, complete. There is no fallback. */
      strings: LumoStrings;
    }
);

/**
 * Mount once, high in the application. Locale and strings only — see the module
 * docblock for why Base UI's direction context is not mounted here.
 */
export function LumoLocaleProvider({ locale, strings, children }: LumoLocaleProviderProps) {
  const value = useMemo<LumoLocaleValue>(() => ({ locale, strings }), [locale, strings]);
  return <LumoLocaleContext.Provider value={value}>{children}</LumoLocaleContext.Provider>;
}
