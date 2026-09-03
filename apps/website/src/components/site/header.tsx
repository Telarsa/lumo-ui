import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { CHROME } from "@/lib/chrome";
import { DOCS, DOCS_ORDER } from "@/lib/docs-order";
import type { SiteLocale } from "@/lib/locales";
import { GITHUB_URL, localePath } from "@/lib/site";
import { LocaleSwitch } from "./locale-switch";
import { Logo } from "./mark";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ locale }: { locale: SiteLocale }) {
  const c = CHROME[locale];
  return (
    <header className="site-header">
      <div className="container site-header__row">
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
          <LocaleSwitch locale={locale} label={c.switchLabel} aria={c.switchAria} />
          <ThemeToggle labels={c.theme} />
        </div>
      </div>
      {/* Below the breakpoint the nav above is hidden; this rail is how a phone
          reaches the docs at all. A scrolling strip rather than a menu: six
          links, no state, nothing to get stuck open. */}
      <nav className="site-header__rail" aria-label={c.docs.eyebrow}>
        {DOCS_ORDER.map((slug) => (
          <Link key={slug} href={localePath(locale, `/docs/${slug}`)} className="nav-link">
            {DOCS[locale][slug].label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
