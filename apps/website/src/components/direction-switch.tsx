import Link from "next/link";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { direction } from "@lumo-ui/core";
import { oppositeDirectionLocale } from "@/lib/locale";

/**
 * The preview's direction control — and it is a LOCALE LINK, not a direction
 * flag.
 *
 * That distinction is the whole design. Every Lumo component derives its
 * direction from the locale (`LumoProvider` on the web, `LumoScope` on mobile)
 * and there is deliberately no `dir` prop anywhere in either library. A control
 * that flipped direction while the language stayed put would be the one thing
 * the contract refuses — and `<html lang>` would still say the page's locale
 * while the content mirrored under it. So this navigates to the same route in
 * the mirrored locale, which is a separately prerendered document with its own
 * genuine `lang`/`dir`.
 *
 * Extracted from `preview-toolbar.tsx` on 18 Aug 2026 so the Mobile page can
 * carry the same control: it had none at all, and the Flutter gallery reads
 * direction from its `?lang=` exactly as the web reads it from the route — same
 * rule, same control, one copy table.
 */

export interface DirectionSwitchProps {
  lang: Locale;
  /** Where the mirrored locale's copy of THIS page lives, anchor included. */
  href: string;
}

const COPY: Record<Locale, { directionGroup: string; rtl: string; ltr: string }> = {
  "fa-IR": {
    directionGroup: "جهت پیش‌نمایش",
    rtl: "راست‌به‌چپ",
    ltr: "چپ‌به‌راست",
  },
  "en-US": {
    directionGroup: "Preview direction",
    rtl: "Right to left",
    ltr: "Left to right",
  },
};

export function DirectionSwitch({ lang, href }: DirectionSwitchProps) {
  const t = COPY[lang];
  const otherLang = oppositeDirectionLocale(lang);
  const dir = direction(lang);
  const otherDir = direction(otherLang);

  return (
    <div
      role="group"
      aria-label={t.directionGroup}
      className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-surface-sunken p-1"
    >
      {/*
       * "RTL"/"LTR" are technical identifiers: Latin islands, `aria-hidden`,
       * decoration over the sr-only per-locale name.
       */}
      <span
        aria-current="true"
        className="inline-flex h-6 select-none items-center rounded-sm bg-surface px-2 text-xs font-medium text-fg shadow-sm"
      >
        <span aria-hidden="true" dir="ltr" lang="en" data-lumo-latn="">
          {dir === "rtl" ? "RTL" : "LTR"}
        </span>
        <span className="sr-only">{dir === "rtl" ? t.rtl : t.ltr}</span>
      </span>
      {/* A real navigation — see the file header. */}
      <Link
        href={href}
        hrefLang={otherLang}
        aria-label={otherDir === "rtl" ? t.rtl : t.ltr}
        className="inline-flex h-6 items-center rounded-sm px-2 text-xs text-fg-muted transition-colors hover:text-fg"
      >
        <span aria-hidden="true" dir="ltr" lang="en" data-lumo-latn="">
          {otherDir === "rtl" ? "RTL" : "LTR"}
        </span>
      </Link>
    </div>
  );
}
