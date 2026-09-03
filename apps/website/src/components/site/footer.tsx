import Link from "next/link";
import { CHROME } from "@/lib/chrome";
import { DOCS, DOCS_ORDER } from "@/lib/docs-order";
import type { SiteLocale } from "@/lib/locales";
import { GITHUB_URL, INSTALL_SPEC, TELARSA_URL, VERSION, localePath } from "@/lib/site";
import { Logo } from "./mark";

export function SiteFooter({ locale }: { locale: SiteLocale }) {
  const c = CHROME[locale];
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div className="site-footer__brand">
          <Logo />
          <p className="site-footer__tagline">{c.tagline}</p>
          <p className="site-footer__licence">
            {c.footer.licence}
            {" · "}
            {c.footer.built}{" "}
            <a href={TELARSA_URL} target="_blank" rel="noreferrer noopener" className="link-quiet">
              {locale === "fa" ? c.footer.company : <span data-lumo-latn>Telarsa</span>}
            </a>
          </p>
        </div>
        <div className="site-footer__col">
          <p className="site-footer__head">{c.footer.docs}</p>
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
          <p className="site-footer__head">{c.footer.source}</p>
          <ul role="list">
            <li>
              <a href={GITHUB_URL} className="link-quiet" target="_blank" rel="noreferrer noopener">
                <span data-lumo-latn dir="ltr">github.com/Telarsa/lumo-ui</span>
              </a>
            </li>
            <li>
              <span className="text-fg-subtle">{c.footer.version} </span>
              <span data-lumo-latn dir="ltr">
                v{VERSION}
              </span>
            </li>
            <li>
              <code data-lumo-latn dir="ltr">{INSTALL_SPEC}</code>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
