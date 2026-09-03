import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import { LumoHtml, themeScript } from "lumo-ui/core";
import { SiteLocaleProvider } from "@/components/site/locale-provider";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { CHROME } from "@/lib/chrome";
import { isSiteLocale, localeParams } from "@/lib/locales";
import { GITHUB_URL, OG_LOCALE, SITE_URL, TELARSA_URL, VERSION, alternatesFor, localePath } from "@/lib/site";
import "../globals.css";

/*
 * The company's type system, self-hosted by next/font at build time.
 *
 * Archivo carries the width axis the display register is set on — wide at
 * headline size, normal for body. JetBrains Mono carries every identifier.
 * Vazirmatn carries Persian, and Lumo's own script.css reads it through the
 * `--lumo-font-persian` knob the stylesheet sets, so `:lang(fa)` never falls
 * to a platform face.
 */
const sans = Archivo({ subsets: ["latin", "latin-ext"], variable: "--font-archivo", display: "swap", weight: "variable", axes: ["wdth"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap", weight: "variable" });
const farsi = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazirmatn", display: "swap" });

/* <html> lives HERE, keyed by the locale param — a param is static, a request
 * header is not. */
export function generateStaticParams() {
  return localeParams();
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSiteLocale(locale)) return {};
  const c = CHROME[locale];
  return {
    ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
    title: { default: `${c.siteName} — ${c.tagline}`, template: `%s · ${c.siteName}` },
    description: c.description,
    applicationName: c.siteName,
    authors: [{ name: "Telarsa", url: TELARSA_URL }],
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
        { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    alternates: alternatesFor(locale, "/"),
    ...(SITE_URL
      ? {
          openGraph: {
            type: "website",
            siteName: c.siteName,
            url: `${SITE_URL}${localePath(locale)}`,
            title: `${c.siteName} — ${c.tagline}`,
            description: c.description,
            locale: OG_LOCALE[locale],
            images: [{ url: `/og/lumo-${locale}.png`, width: 1200, height: 630, alt: `${c.siteName} — ${c.tagline}` }],
          },
          twitter: { card: "summary_large_image", title: `${c.siteName} — ${c.tagline}`, description: c.description, images: [`/og/lumo-${locale}.png`] },
        }
      : {}),
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2efe8" },
    { media: "(prefers-color-scheme: dark)", color: "#101114" },
  ],
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSiteLocale(locale)) notFound();
  const c = CHROME[locale];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "Lumo UI",
    description: c.description,
    codeRepository: GITHUB_URL,
    programmingLanguage: ["TypeScript", "Dart"],
    license: "https://opensource.org/licenses/MIT",
    version: VERSION,
    ...(SITE_URL ? { url: `${SITE_URL}${localePath(locale)}` } : {}),
    author: { "@type": "Organization", name: "Telarsa", url: TELARSA_URL },
  };

  return (
    <LumoHtml lang={locale} className={`${sans.variable} ${mono.variable} ${farsi.variable}`} suppressHydrationWarning>
      <head>
        {/* Before first paint, so a dark reader never sees a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <SiteLocaleProvider locale={locale}>
          <a className="skip-link" href="#main">
            {c.skip}
          </a>
          <SiteHeader locale={locale} />
          <main id="main">{children}</main>
          <SiteFooter locale={locale} />
        </SiteLocaleProvider>
      </body>
    </LumoHtml>
  );
}
