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
 * React Aria's together for as long as both libraries are present.
 */

import { createContext, useContext } from "react";
import type { Locale } from "@lumo-ui/core";

export const LumoLocaleContext = createContext<Locale>("fa-IR");

/** The locale every Base UI-based Lumo component formats and announces in. */
export function useLumoLocale(): Locale {
  return useContext(LumoLocaleContext);
}
