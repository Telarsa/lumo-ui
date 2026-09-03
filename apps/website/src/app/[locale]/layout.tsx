import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LumoHtml, LumoLocaleProvider, themeScript } from "lumo-ui/core";
import { isSiteLocale, localeParams } from "@/lib/locales";
import { DOCS_LABEL, DOCS_ORDER } from "@/lib/docs-order";
import { ThemeToggle } from "@/components/site/theme-toggle";
import "../globals.css";

export const metadata: Metadata = {
  title: "Lumo UI",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "16x16" }],
    apple: "/apple-touch-icon.png",
  },
  description:
    "The correctness layer for Persian-first products on shadcn/ui and Material — the locale contract, the design tokens, the Jalali grid, and the served-byte grader.",
};

/* <html> lives HERE, keyed by the locale param — a param is static, a request
 * header is not (the lesson §50.7 records from a multilingual consumer app). */
export function generateStaticParams() {
  return localeParams();
}

const CHROME = {
  "fa-IR": {
    theme: "تغییر پوسته",
    switchLabel: "English",
    switchAria: "تغییر زبان به انگلیسی",
    switchLatn: true,
    switchTo: "en-US",
    footer: "متن‌باز، با پروانهٔ MIT — کامپوننت‌ها را شما از shadcn می‌گیرید؛ درستیِ فارسی را این مخزن تضمین می‌کند.",
  },
  "en-US": {
    theme: "Toggle theme",
    switchLabel: "فارسی",
    switchAria: "Switch to Persian",
    switchLatn: false,
    switchTo: "fa-IR",
    footer: "Open source under the MIT licence — you take components from shadcn; this repo makes them right in Persian.",
  },
} as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSiteLocale(locale)) notFound();
  const c = CHROME[locale];
  /* One list, two consumers: this nav and every page's prev/next. The labels
     used to live here AND in docs-order.ts — two copies of the same five
     strings is exactly the drift §51 argues against, one scale down. */
  const nav = DOCS_ORDER.map((slug) => [`/docs/${slug}`, DOCS_LABEL[locale]![slug]!] as const);

  return (
    <LumoHtml lang={locale} suppressHydrationWarning>
      <head>
        {/* Before first paint, so a dark reader never sees a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body>
        <LumoLocaleProvider locale={locale}>
          <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
              <Link
                href={`/${locale}`}
                className="text-base font-black tracking-widest text-accent"
                data-lumo-latn
                dir="ltr"
              >
                Lumo UI
              </Link>
              <nav className="ms-auto hidden items-center gap-0.5 md:flex">
                {nav.map(([href, label]) => (
                  <Link
                    key={href}
                    href={`/${locale}${href}`}
                    className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="ms-auto flex items-center gap-1 md:ms-0">
                {/* The visible label is the other language's own name; the
                    ANNOUNCED name speaks this page's language — lang="en" is
                    not a hatch here, by the gate's own design. */}
                <Link
                  href={`/${c.switchTo}`}
                  aria-label={c.switchAria}
                  className="rounded-md px-2.5 py-1.5 text-sm text-fg-muted hover:bg-surface-hover hover:text-fg"
                >
                  {c.switchLatn ? (
                    <span data-lumo-latn dir="ltr" lang="en">
                      {c.switchLabel}
                    </span>
                  ) : (
                    <span lang="fa">{c.switchLabel}</span>
                  )}
                </Link>
                <ThemeToggle label={c.theme} />
              </div>
            </div>
            {/* Below md the links above are hidden; this rail is how a phone
                reaches the docs at all. Horizontal scroll rather than a menu:
                six links, no state, nothing to get stuck open. */}
            <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
              {nav.map(([href, label]) => (
                <Link
                  key={href}
                  href={`/${locale}${href}`}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 pb-24">{children}</main>
          <footer className="border-t border-border py-8">
            <p className="mx-auto max-w-5xl px-4 text-sm text-fg-subtle">{c.footer}</p>
          </footer>
        </LumoLocaleProvider>
      </body>
    </LumoHtml>
  );
}

export const dynamicParams = false;
