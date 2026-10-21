"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import type { Copy } from "@/content/copy";
import { brandName, docs, home, page, type Locale } from "@/content/site";
import "./navigation.css";

export function HomeLink({ locale, children }: { locale: Locale; children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") + "/";
  const href = `${home(locale)}#top`;
  return <Link className="brand-link" href={href} aria-label={brandName[locale]} {...(locale !== "fa" ? { "data-lumo-latn": "" } : {})} onNavigate={(event) => {
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
  return <nav className={mobile ? "mobile-nav" : "desktop-nav"} aria-label={labels.label}>{links.map(({ label, href }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : href === docs(locale) && pathname.startsWith(href) ? "location" : undefined}>{label}</Link>)}</nav>;
}

export function MobileMenu({ label, children }: { label: string; children: ReactNode }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  useEffect(() => {
    const closeOutside = (event: Event) => { if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false; };
    const close = () => { if (menu.current) menu.current.open = false; };
    const closeOnDesktop = () => { if (window.innerWidth >= 1152) close(); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    window.addEventListener("blur", close);
    window.addEventListener("resize", closeOnDesktop);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("focusin", closeOutside); window.removeEventListener("blur", close); window.removeEventListener("resize", closeOnDesktop); };
  }, []);
  return <details ref={menu} className="mobile-menu" onKeyDown={(event) => {
    if (event.key === "Escape" && event.currentTarget.open) {
      event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; summary.current?.focus();
    }
  }}><summary ref={summary} className="control" aria-label={label}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg></summary><div className="mobile-menu-panel">{children}</div></details>;
}

const names = { en: "English", de: "Deutsch", fa: "فارسی" } as const;

function synchronizeLanguageHrefs(disclosure: HTMLDetailsElement | null) {
  if (!disclosure) return;
  const { pathname, search, hash } = window.location;
  for (const link of disclosure.querySelectorAll<HTMLAnchorElement>("a[hreflang]")) {
    const language = link.hreflang;
    if (language !== "en" && language !== "de" && language !== "fa") continue;
    const path = pathname.replace(/^\/(?:en|de|fa)(?=\/|$)/, `/${language}`).replace(/\/$/, "") + "/";
    link.setAttribute("href", `${path}${search}${hash}`);
  }
}

function revealFocusedDocumentationPermalink(link: HTMLAnchorElement) {
  if (!link.isConnected || document.activeElement !== link || !link.matches(":focus-visible")) return;
  const style = getComputedStyle(link);
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const ring = Math.max(0, (parseFloat(style.outlineWidth) || 0) + (parseFloat(style.outlineOffset) || 0)) * zoom;
  const pixelClearance = zoom; // One CSS pixel of background beyond the ring.
  const pixelRatio = window.devicePixelRatio || 1;
  const header = document.querySelector<HTMLElement>(".site-header");
  const headerBottom = () => Math.max(0, header?.getBoundingClientRect().bottom || 0);
  const rect = link.getBoundingClientRect();
  if (rect.top - ring >= headerBottom() + pixelClearance && rect.bottom + ring <= innerHeight - pixelClearance && rect.left - ring >= 0 && rect.right + ring <= innerWidth) return;
  link.scrollIntoView({ behavior: "instant", block: "nearest", inline: "nearest" });
  // Scroll padding is shared with marketing. Use the real sticky header for
  // residual edge clearance instead of changing the site's global padding.
  // Round away from the edge so native device-pixel rounding cannot clip it.
  const topOverlap = link.getBoundingClientRect().top - ring - headerBottom() - pixelClearance;
  if (topOverlap < 0) window.scrollBy({ top: Math.floor(topOverlap * pixelRatio) / pixelRatio, behavior: "instant" });
  const bottomOverlap = link.getBoundingClientRect().bottom + ring + pixelClearance - innerHeight;
  if (bottomOverlap > 0) window.scrollBy({ top: Math.ceil(bottomOverlap * pixelRatio) / pixelRatio, behavior: "instant" });
}

export function LanguageMenu({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const disclosure = disclosureRef.current;
    if (!disclosure) return;
    let active = true;
    let pendingFocusFrame: number | undefined;
    let focusedColumnObserver: ResizeObserver | undefined;
    let watchedLocation: string | undefined;
    let watchGeneration = 0;
    const cancelPendingFocus = () => {
      if (pendingFocusFrame !== undefined) cancelAnimationFrame(pendingFocusFrame);
      pendingFocusFrame = undefined;
    };
    const stopFocusWatch = () => {
      watchGeneration++;
      focusedColumnObserver?.disconnect();
      focusedColumnObserver = undefined;
      watchedLocation = undefined;
      cancelPendingFocus();
    };
    // The shared header survives client navigation. A new page should not
    // inherit an open language disclosure from the previous page.
    disclosure.open = false;
    const synchronize = () => {
      if (watchedLocation !== undefined && watchedLocation !== window.location.href) stopFocusWatch();
      synchronizeLanguageHrefs(disclosure);
    };
    synchronize();
    const dismissOutside = (event: Event) => {
      if (disclosure.open && !event.composedPath().includes(disclosure)) disclosure.open = false;
    };
    const handleFocus = (event: Event) => {
      dismissOutside(event);
      stopFocusWatch();
      const link = event.target;
      if (!(link instanceof HTMLAnchorElement) || document.activeElement !== link || !link.matches(".doc-section[id] .doc-heading > a.doc-permalink:focus-visible")) return;
      const column = link.closest<HTMLElement>(".docs__main");
      if (!column) return;
      const focusLocation = window.location.href;
      const generation = watchGeneration;
      watchedLocation = focusLocation;
      const currentWatch = () => active && watchGeneration === generation && window.location.href === focusLocation && link.isConnected && document.activeElement === link && link.matches(":focus-visible");
      const scheduleReveal = () => {
        if (!currentWatch()) {
          // A disconnected observer's queued callback cannot revive an old watch
          // or cancel a newer focused link's work.
          if (watchGeneration === generation) stopFocusWatch();
          return;
        }
        if (pendingFocusFrame !== undefined) return;
        pendingFocusFrame = requestAnimationFrame(() => {
          if (watchGeneration !== generation) return;
          pendingFocusFrame = undefined;
          if (!currentWatch()) { stopFocusWatch(); return; }
          revealFocusedDocumentationPermalink(link);
        });
      };
      // Native zoom can narrow the preceding table after its first focus frame.
      // Watch only this reading column, only while this permalink keeps focus.
      focusedColumnObserver = new ResizeObserver(scheduleReveal);
      focusedColumnObserver.observe(column);
      scheduleReveal();
    };
    const dismissOnWindowBlur = () => { disclosure.open = false; };
    document.addEventListener("pointerdown", dismissOutside, true);
    // A focusin event gives the actual new focus target, avoiding the null
    // relatedTarget ambiguity of blur while a language link is being clicked.
    document.addEventListener("focusin", handleFocus, true);
    window.addEventListener("blur", dismissOnWindowBlur);
    window.addEventListener("hashchange", synchronize);
    window.addEventListener("popstate", synchronize);
    window.addEventListener("pageshow", synchronize);
    return () => {
      active = false;
      stopFocusWatch();
      document.removeEventListener("pointerdown", dismissOutside, true);
      document.removeEventListener("focusin", handleFocus, true);
      window.removeEventListener("blur", dismissOnWindowBlur);
      window.removeEventListener("hashchange", synchronize);
      window.removeEventListener("popstate", synchronize);
      window.removeEventListener("pageshow", synchronize);
    };
  }, [pathname]);

  const languagePath = (language: Locale) => pathname.replace(/^\/(?:en|de|fa)(?=\/|$)/, `/${language}`).replace(/\/$/, "") + "/";
  // Capture before the browser consumes an href for a native action. This also
  // covers query-only history changes that emit neither hashchange nor popstate.
  const synchronizeBeforeActivation = () => synchronizeLanguageHrefs(disclosureRef.current);
  return <details ref={disclosureRef} className="language-menu" onFocusCapture={synchronizeBeforeActivation} onPointerDownCapture={synchronizeBeforeActivation} onContextMenuCapture={synchronizeBeforeActivation} onClickCapture={synchronizeBeforeActivation} onAuxClickCapture={synchronizeBeforeActivation} onKeyDown={(event) => {
    if (event.key === "Escape" && event.currentTarget.open) {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.open = false;
      summaryRef.current?.focus();
    }
  }}><summary ref={summaryRef} className="control" aria-label={`${locale.toUpperCase()} — ${label}`}><span data-lumo-latn="" dir="ltr">{locale.toUpperCase()}</span><svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" /></svg></summary><div className="language-options">{(["en", "de", "fa"] as const).map((item) => <a key={item} href={languagePath(item)} hrefLang={item} lang={item} aria-current={locale === item ? "page" : undefined} {...(item !== "fa" ? { "data-lumo-latn": "" } : {})}>{names[item]}</a>)}</div></details>;
}
