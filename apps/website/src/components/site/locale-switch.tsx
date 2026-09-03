"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteLocale } from "@/lib/locales";

/**
 * One button, because there are exactly two languages: it shows the one you
 * are not reading, in that language's own name, and keeps you on the page you
 * were reading rather than sending you home.
 *
 * The visible label is the other language's own name; the ANNOUNCED name
 * speaks this page's language. `lang="en"` is not a hatch — the Latin label on
 * the Persian page carries the island marker the gate reads.
 */
export function LocaleSwitch({ locale, label, aria }: { locale: SiteLocale; label: string; aria: string }) {
  const pathname = usePathname();
  const target: SiteLocale = locale === "fa" ? "en" : "fa";
  const segments = pathname.split("/");
  segments[1] = target;
  const href = segments.join("/") || `/${target}/`;

  return (
    <Link href={href} hrefLang={target} aria-label={aria} className="control control--text">
      {target === "en" ? (
        <span lang="en" dir="ltr" data-lumo-latn>
          {label}
        </span>
      ) : (
        <span lang="fa" dir="rtl">
          {label}
        </span>
      )}
    </Link>
  );
}
