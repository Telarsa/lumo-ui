import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { LumoHtml, themeScript } from "lumo-ui/core";
import { copy } from "@/content/copy";
import { isLocale, localeParams, marketingOrigin, siteUrl, github, company, version } from "@/content/site";
import { socialFor } from "@/lib/site";
import { Header, Footer } from "@/components/site-shell";
// Generated and git-ignored: the private Persian font declaration, or the system
// Persian fallback in a public build (scripts/prepare-private-fonts.mjs).
import { persian } from "@/assets/fonts/private/persian-font";
import "../globals.css";

const inter = localFont({ src: "../../assets/fonts/InterVariable.woff2", variable: "--font-inter", display: "block", weight: "100 900", adjustFontFallback: false });

export const generateStaticParams = localeParams;
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = `Lumo UI — ${copy[locale].hero.eyebrow}`;
  return {
    title,
    description: copy[locale].description,
    metadataBase: new URL(siteUrl),
    // Static files in public/ (scripts/render-brand-images.mjs renders the rasters).
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48" }, { url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/site.webmanifest",
    // The home page's card; every other page sets its own through pageMetadata.
    ...socialFor(locale, "/", title, copy[locale].description),
    ...(marketingOrigin ? {
      alternates: { canonical: `${marketingOrigin}/${locale}/`, languages: { en: `${marketingOrigin}/en/`, de: `${marketingOrigin}/de/`, fa: `${marketingOrigin}/fa/`, "x-default": `${marketingOrigin}/en/` } },
    } : {}),
    // No marketing-domain cutover is claimed by this local implementation.
    robots: { index: Boolean(marketingOrigin), follow: true },
  };
}

/** Browser chrome follows the site background of src/app/globals.css in each scheme. */
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8f7f3" }, { media: "(prefers-color-scheme: dark)", color: "#101114" }],
};

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "SoftwareSourceCode", name: "Lumo UI", description: copy[locale].description, codeRepository: github, programmingLanguage: ["TypeScript", "Dart"], license: "https://opensource.org/licenses/MIT", version, ...(marketingOrigin ? { url: `${marketingOrigin}/${locale}/` } : {}), author: { "@type": "Organization", name: "Telarsa", url: company } };
  return <LumoHtml lang={locale} suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${persian.variable}`}><head><script dangerouslySetInnerHTML={{ __html: themeScript() }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /></head><body id="top"><a className="skip-link" href="#main">{copy[locale].skip}</a><Header locale={locale} /><main id="main">{children}</main><Footer locale={locale} /></body></LumoHtml>;
}
