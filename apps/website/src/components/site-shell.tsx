import { Prose } from "lumo-ui/core";
import { copy } from "@/content/copy";
import { company, docs, github, page, type Locale } from "@/content/site";
import { Brand, Arrow } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { HomeLink, PrimaryNavigation, LanguageMenu } from "./primary-navigation";

export function Header({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <header className="site-header"><div className="container header-row">
    <HomeLink locale={locale}><Brand /></HomeLink>
    <PrimaryNavigation locale={locale} labels={t.nav} />
    <div className="header-controls">
      <LanguageMenu locale={locale} label={t.language} />
      <ThemeToggle labels={t.theme} />
      <a className="button primary header-start" href={docs(locale, "getting-started")}>{t.nav.start}<Arrow /></a>
    </div>
  </div><PrimaryNavigation locale={locale} labels={t.nav} mobile /></header>;
}

export function Footer({ locale }: { locale: Locale }) {
  const t = copy[locale].footer;
  return <footer className="site-footer"><div className="container"><div className="footer-top"><div><Brand /><p>{t.lead}</p></div><div className="footer-links"><a href={docs(locale)}>{copy[locale].nav.docs}</a><a href={github}>{t.source}</a><a href={`${company}/${locale}/`}>{t.by}</a></div></div><div className="footer-bottom"><p><Prose>{t.licence}</Prose></p><div><a href={page(locale, "legal/imprint")}>{t.legal}</a><a href={page(locale, "legal/privacy")}>{t.privacy}</a></div></div></div></footer>;
}
