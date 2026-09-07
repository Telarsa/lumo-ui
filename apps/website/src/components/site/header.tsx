import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { CHROME } from "@/lib/chrome";
import { DOCS, DOCS_ORDER } from "@/lib/docs-order";
import type { SiteLocale } from "@/lib/locales";
import { GITHUB_URL, localePath } from "@/lib/site";
import { LocaleSwitch } from "./locale-switch";
import { Logo } from "./mark";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ locale }: { locale: SiteLocale }) {
  const c = CHROME[locale];
  const menu = {en: {open:"Open navigation",close:"Close navigation",title:"Navigation",home:"Overview",docs:"Documentation"},de:{open:"Navigation öffnen",close:"Navigation schließen",title:"Navigation",home:"Übersicht",docs:"Dokumentation"},fa:{open:"باز کردن فهرست",close:"بستن فهرست",title:"فهرست راهبری",home:"معرفی",docs:"مستندات"}}[locale];
  return (
    <header className="site-header">
      <div className="shell site-header__row">
        <Link href={localePath(locale)} className="site-header__brand">
          <Logo />
        </Link>
        <nav className="site-header__nav" aria-label={c.nav.docs}>
          <Link href={localePath(locale, "/docs")} className="nav-link">
            {c.nav.docs}
          </Link>
          <Link href={localePath(locale, "/docs/gate")} className="nav-link">
            {c.nav.rules}
          </Link>
          <a href={GITHUB_URL} className="nav-link" target="_blank" rel="noreferrer noopener">
            {c.nav.github}
            <ArrowUpRightIcon className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
          </a>
        </nav>
        <div className="site-header__tools">
          <LocaleSwitch locale={locale} aria={c.switchAria} />
          <ThemeToggle labels={c.theme} />
          <MobileNav brand={c.siteName} openLabel={menu.open} closeLabel={menu.close} title={menu.title} docsLabel={menu.docs} home={{label:menu.home,href:localePath(locale)}} started={{label:DOCS[locale]["getting-started"].label,href:localePath(locale,"/docs/getting-started")}} docs={[{label:c.docs.index,href:localePath(locale,"/docs")},...DOCS_ORDER.filter(slug=>slug!=="getting-started").map(slug=>({label:DOCS[locale][slug].label,href:localePath(locale,`/docs/${slug}`)}))]} source={{label:c.nav.github,href:GITHUB_URL}}/>
        </div>
      </div>
    </header>
  );
}
