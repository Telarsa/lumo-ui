"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import type { Copy } from "@/content/copy";
import { docs, home, page, type Locale } from "@/content/site";
import "./navigation.css";

export function HomeLink({ locale, children }: { locale: Locale; children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") + "/";
  const href = `${home(locale)}#top`;
  return <Link className="brand-link" href={href} aria-label="Lumo UI" data-lumo-latn="" onNavigate={(event) => {
    // Next does not reliably reapply a consumed hash scroll for the same URL.
    if (pathname === home(locale)) {
      window.scrollTo({ top: 0, behavior: "instant" });
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` === href) event.preventDefault();
    }
  }}>{children}</Link>;
}

export function PrimaryNavigation({ locale, labels, mobile }: { locale: Locale; labels: Copy["nav"]; mobile?: boolean }) {
  const pathname = usePathname().replace(/\/$/, "") + "/";
  const links = [
    { label: labels.how, href: page(locale, "how-it-works") },
    { label: labels.rules, href: page(locale, "checks") },
    { label: labels.docs, href: docs(locale) },
  ];
  return <nav className={mobile ? "mobile-nav container" : "desktop-nav"} aria-label={labels.label}>{links.map(({ label, href }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : href === docs(locale) && pathname.startsWith(href) ? "location" : undefined}>{label}</Link>)}</nav>;
}

const names = { en: "English", de: "Deutsch", fa: "فارسی" } as const;
export function LanguageMenu({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const disclosure = disclosureRef.current;
    if (!disclosure) return;
    // The shared header survives client navigation. A new page should not
    // inherit an open language disclosure from the previous page.
    disclosure.open = false;
    const dismissOutside = (event: Event) => {
      if (disclosure.open && !event.composedPath().includes(disclosure)) disclosure.open = false;
    };
    const dismissOnWindowBlur = () => { disclosure.open = false; };
    document.addEventListener("pointerdown", dismissOutside, true);
    // A focusin event gives the actual new focus target, avoiding the null
    // relatedTarget ambiguity of blur while a language link is being clicked.
    document.addEventListener("focusin", dismissOutside, true);
    window.addEventListener("blur", dismissOnWindowBlur);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside, true);
      document.removeEventListener("focusin", dismissOutside, true);
      window.removeEventListener("blur", dismissOnWindowBlur);
    };
  }, [pathname]);

  const languagePath = (language: Locale) => pathname.replace(/^\/(?:en|de|fa)(?=\/|$)/, `/${language}`).replace(/\/$/, "") + "/";
  return <details ref={disclosureRef} className="language-menu" onKeyDown={(event) => {
    if (event.key === "Escape" && event.currentTarget.open) {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.open = false;
      summaryRef.current?.focus();
    }
  }}><summary ref={summaryRef} className="control" aria-label={label}><span data-lumo-latn="" dir="ltr">{locale.toUpperCase()}</span><svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" /></svg></summary><div className="language-options">{(["en", "de", "fa"] as const).map((item) => <a key={item} href={languagePath(item)} hrefLang={item} lang={item} aria-current={locale === item ? "page" : undefined} {...(item !== "fa" ? { "data-lumo-latn": "" } : {})}>{names[item]}</a>)}</div></details>;
}
