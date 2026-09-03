"use client";

import { LumoLocaleProvider, stringsFor, type LumoNode } from "lumo-ui/core";
import { BUILTIN, type SiteLocale } from "@/lib/locales";

/**
 * The provider, resolved on the client. A short tag such as `fa` is not one
 * of Lumo's built-in tags, so the strings must be stated — and a strings table
 * carries functions (the calendar's «امروز، …» sentence), which cannot cross
 * from a server component into a client one. Resolving them here, inside the
 * client boundary, keeps the layout a server component and the rule intact.
 */
export function SiteLocaleProvider({ locale, children }: { locale: SiteLocale; children: LumoNode }) {
  return (
    <LumoLocaleProvider locale={locale} strings={stringsFor(BUILTIN[locale])}>
      {children}
    </LumoLocaleProvider>
  );
}
