import Link from "next/link";
import { CHROME } from "@/lib/chrome";
import { DOCS, DOCS_ORDER } from "@/lib/docs-order";
import type { SiteLocale } from "@/lib/locales";
import { GITHUB_URL, companyPath, VERSION, localePath } from "@/lib/site";
import { Logo } from "./mark";

export function SiteFooter({ locale }: { locale: SiteLocale }) {
  const c = CHROME[locale];
  const company={en:{about:"About Telarsa",contact:"Contact",privacy:"Privacy"},de:{about:"Über Telarsa",contact:"Kontakt",privacy:"Datenschutz"},fa:{about:"دربارهٔ تلارسا",contact:"تماس",privacy:"حریم خصوصی"}}[locale];
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div className="site-footer__brand">
          <Logo />
          <p className="site-footer__tagline">{c.tagline}</p>
          <p className="site-footer__licence">
            {c.footer.licence}

          </p>
        </div>
        <div className="site-footer__col">
          <h2 className="site-footer__head">{c.footer.docs}</h2>
          <ul role="list">
            {DOCS_ORDER.map((slug) => (
              <li key={slug}>
                <Link href={localePath(locale, `/docs/${slug}`)} className="link-quiet">
                  {DOCS[locale][slug].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="site-footer__col">
          <h2 className="site-footer__head">{c.footer.source}</h2>
          <ul role="list">
            <li>
              <a href={GITHUB_URL} className="link-quiet" target="_blank" rel="noreferrer noopener">
                {c.nav.github}
              </a>
            </li>
            <li>
              <span className="text-fg-subtle">{c.footer.version} </span>
              <span data-lumo-latn dir="ltr">
                v{VERSION}
              </span>
            </li>

          </ul>
        </div>
        <nav className="site-footer__col" aria-label={c.footer.company}><h2 className="site-footer__head">{c.footer.company}</h2><ul role="list"><li><a className="link-quiet" href={companyPath(locale,"/company/about")}>{company.about}</a></li><li><a className="link-quiet" href={companyPath(locale,"/products")}>{c.allProducts}</a></li><li><a className="link-quiet" href={companyPath(locale,"/contact")}>{company.contact}</a></li><li><a className="link-quiet" href={companyPath(locale,"/legal/privacy")}>{company.privacy}</a></li></ul></nav>
      </div>
      <div className="shell site-footer__family">
        <a href={companyPath(locale)} className="link-quiet">{c.productOf}</a>
        <a href={companyPath(locale, "/products")} className="link-quiet">{c.allProducts}</a>
      </div>
    </footer>
  );
}
