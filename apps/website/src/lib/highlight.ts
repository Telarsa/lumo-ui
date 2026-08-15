import { createHighlighter, type Highlighter } from "shiki";

/**
 * Build-time syntax highlighting. Server-only: never import from a `"use client"` file (shiki must
 * stay out of the browser bundle). One highlighter cached per build; dual themes resolved by CSS.
 */
let instance: Promise<Highlighter> | undefined;

function highlighter(): Promise<Highlighter> {
  instance ??= createHighlighter({
    themes: ["github-light-default", "github-dark-default"],
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
    themes: { light: "github-light-default", dark: "github-dark-default" },
    defaultColor: "light",
  });
}
