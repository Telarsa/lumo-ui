import { createHighlighter, type Highlighter } from "shiki";

/**
 * Build-time syntax highlighting. Server-only: never import from a `"use client"` file (shiki must
 * stay out of the browser bundle). One highlighter cached per build; dual themes resolved by CSS.
 * The high-contrast GitHub themes: the code panel paints tokens straight on the site surface (its
 * `<pre>` is transparent), and the default themes' comment/punctuation colours measured below
 * 4.5:1 there on ~100 routes (axe, browser evidence job, 15 Aug 2026).
 */
let instance: Promise<Highlighter> | undefined;

function highlighter(): Promise<Highlighter> {
  instance ??= createHighlighter({
    themes: ["github-light-high-contrast", "github-dark-high-contrast"],
    langs: ["tsx", "bash", "json"],
  });
  return instance;
}

export type CodeLang = "tsx" | "bash" | "json";

/**
 * Highlights to an HTML string for `dangerouslySetInnerHTML`; shiki escapes every token, so it is safe.
 */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  const shiki = await highlighter();
  return shiki.codeToHtml(code, {
    lang,
    themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    defaultColor: "light",
  });
}
