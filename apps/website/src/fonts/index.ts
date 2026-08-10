import localFont from "next/font/local";

/**
 * The site's three faces, committed as files rather than fetched from Google.
 *
 * Committed because the catalog's rule applies to fonts too: anything that can
 * change rendered output arrives as a reviewed diff, never as a silent
 * difference between two builds. `next/font/google` re-downloads at build time,
 * which is a network dependency in CI and an unreviewed upstream change at
 * home. These three files are the exact bytes every build serves. Licences sit
 * beside them (OFL, all three).
 *
 * Why two sans faces and not one: Vazirmatn's Latin is serviceable, but a
 * docs site whose `en-US` half is set in a Persian face's Latin reads as an
 * afterthought — the mirror of the defect this library exists to prevent. So
 * each locale gets a face designed for it, selected in globals.css by
 * `html[lang]`, not by a component prop nobody remembers to pass:
 *
 *     html[lang="en-US"] { --font-sans: var(--font-inter), … }
 *     html[lang="fa-IR"] { --font-sans: var(--font-vazirmatn), … }
 *
 * Vazirmatn stays in BOTH stacks: on an English page it covers any embedded
 * Persian glyphs; on a Persian page Inter is the Latin fallback for code and
 * `data-lumo-latn` islands.
 */
export const vazirmatn = localFont({
  src: "./Vazirmatn-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-vazirmatn",
});

export const inter = localFont({
  src: "./InterVariable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

export const mono = localFont({
  src: "./JetBrainsMono-Variable.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-jbmono",
});

/** One class string carrying all three CSS variables; goes on `<html>`. */
export const fontVariables = `${vazirmatn.variable} ${inter.variable} ${mono.variable}`;
