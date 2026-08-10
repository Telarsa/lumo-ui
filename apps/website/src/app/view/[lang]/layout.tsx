import { LumoHtml } from "@lumo-ui/core";
import { ThemeScript } from "@/components/theme-toggle";
import { assertLocale, localeParams } from "@/lib/locale";
import "../../globals.css";

/**
 * A second root layout for the preview frames.
 *
 * It writes its own `<html lang dir>` via LumoHtml, so an iframe pointing here
 * contains a genuinely Persian (or English) document rather than a styled div
 * pretending to be one. The gate grades these routes exactly like any other.
 */
export function generateStaticParams() {
  return localeParams;
}

export default async function ViewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  return (
    <LumoHtml lang={lang}>
      <head>
        <ThemeScript />
      </head>
      <body className="grid min-h-dvh place-items-center p-6">{children}</body>
    </LumoHtml>
  );
}
