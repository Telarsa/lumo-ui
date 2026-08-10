import { createHighlighter, type Highlighter } from "shiki";

/**
 * Build-time syntax highlighting. Server-only — this module must never be
 * imported from a `"use client"` file, because shiki plus two grammars is
 * megabytes of tokenizer that has no business in a browser bundle. The site is
 * a static export, so "server" means "during `next build`", and the cost is
 * paid once per build rather than once per visitor.
 *
 * One highlighter, created once and cached at module scope — the same argument
 * `site-shell.tsx` makes for the search index. `createHighlighter` loads
 * grammars and themes from disk; doing that per code block would turn a
 * 200-page export into a grammar-parsing benchmark.
 *
 * Dual themes, resolved by CSS rather than by rendering twice: every token gets
 * `color` (light) plus `--shiki-dark`, and globals.css flips which one applies
 * under the SAME three-state selectors the token system uses. One DOM, both
 * themes, no flash — and the dark palette obeys the visitor's stored choice
 * because it keys off `data-theme`, not only the media query.
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
 * Highlights to an HTML string for `dangerouslySetInnerHTML`.
 *
 * Safe against injection BY CONSTRUCTION, not by trust: shiki HTML-escapes
 * every token's text — the only markup in its output is the markup it wrote.
 * The sources fed through here are the repo's own files read off disk, but the
 * escaping means that property is not load-bearing.
 */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  const shiki = await highlighter();
  return shiki.codeToHtml(code, {
    lang,
    themes: { light: "github-light-default", dark: "github-dark-default" },
    defaultColor: "light",
  });
}
