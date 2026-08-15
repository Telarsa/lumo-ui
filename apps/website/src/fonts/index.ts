import localFont from "next/font/local";

/**
 * The site's three faces, committed as files (never fetched from Google): anything that can change
 * rendered output arrives as a reviewed diff. Two sans faces because a Persian face's Latin makes the
 * `en-US` half read as an afterthought — globals.css picks the stack by `html[lang]`, Vazirmatn in BOTH.
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
