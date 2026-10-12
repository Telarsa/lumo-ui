import Image from "next/image";
import { brandName, type Locale } from "@/content/site";

/** Original folded-L masters with outlined wordmarks; the footer uses the
 * same paths and fixed theme colours in a vertical arrangement. */
export function Brand({ locale, vertical = false }: { locale: Locale; vertical?: boolean }) {
  const name = `${vertical ? "lumo-lockup-vertical" : "lumo-lockup"}${locale === "fa" ? "-fa" : ""}`;
  return <span className={vertical ? "brand brand-vertical" : "brand"} dir="ltr" {...(locale !== "fa" ? { "data-lumo-latn": "" } : {})}>
    <Image className="brand-paper" src={`/brand/${name}-on-paper.svg`} alt={brandName[locale]} width={168} height={vertical ? 88 : 40} unoptimized />
    <Image className="brand-ink" src={`/brand/${name}-on-ink.svg`} alt={brandName[locale]} width={168} height={vertical ? 88 : 40} unoptimized />
  </span>;
}

export function Arrow() {
  return <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}
