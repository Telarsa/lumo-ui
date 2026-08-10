import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allDemos, type Demo } from "./demos.tsx";
import { exampleSlugs, loadExamplesFor } from "./examples-loader.ts";

/**
 * THE component catalog — the one list every routed surface derives from.
 *
 * Found the hard way in round 3: eleven components shipped with example files
 * and no pages. Routes, the sidebar, the A–Z index and the search index all
 * derived from `allDemos()` (the demos.tsx registry), while the new components
 * registered themselves only in the examples directory — two registries, each
 * complete in its own eyes, and the gap between them was invisible to every
 * gate because a page that is never built is a page that is never graded.
 *
 * So: ONE merge, here. A component appears in the catalog if it has a
 * demos.tsx entry OR an examples file. When it has only an examples file, the
 * page identity (title, intro, tier) comes from the file's `meta` — the
 * loader validates those fields exist — the shown source is the component's
 * real module read off disk, `behaviour` is derived from the source itself
 * (`"use client"` present or not — measured, not asserted), and the page's
 * preview is its first example.
 *
 * Every consumer — `generateStaticParams` on both the docs and /view/ routes,
 * the sidebar, the index page, the search index, the landing counts — imports
 * THIS module. Importing `allDemos` directly for navigation is the bug this
 * file exists to end.
 */

const UI_SRC = join(process.cwd(), "..", "..", "packages", "ui", "src");

export type CatalogEntry = Demo & {
  /** True when the entry was synthesized from an examples file alone. */
  fromExamples: boolean;
};

let cached: Promise<CatalogEntry[]> | undefined;

async function build(): Promise<CatalogEntry[]> {
  const demos = allDemos();
  const demoIds = new Set(demos.map((d) => d.id));
  const entries: CatalogEntry[] = demos.map((d) => ({ ...d, fromExamples: false }));

  for (const slug of exampleSlugs()) {
    if (demoIds.has(slug)) continue;
    const loaded = await loadExamplesFor(slug);
    if (!loaded) continue;
    if (!loaded.title || !loaded.intro || !loaded.tier) {
      // Loud, with the fix in the message — the alternative is the round-3
      // failure again: a component that exists everywhere except the site.
      throw new Error(
        `[catalog] examples/${slug}.tsx has no demos.tsx entry, so its meta must ` +
          `carry title, intro and tier (both locales) to have a page at all. ` +
          `Missing: ${[
            !loaded.title && "title",
            !loaded.intro && "intro",
            !loaded.tier && "tier",
          ]
            .filter(Boolean)
            .join(", ")}.`,
      );
    }
    const first = loaded.examples[0];
    if (!first) {
      throw new Error(`[catalog] examples/${slug}.tsx has zero examples — nothing to preview.`);
    }
    let source: string;
    try {
      source = readFileSync(join(UI_SRC, `${slug}.tsx`), "utf8");
    } catch {
      throw new Error(
        `[catalog] examples/${slug}.tsx exists but packages/ui/src/${slug}.tsx does ` +
          `not — an examples file for a component that is not in the library.`,
      );
    }
    entries.push({
      id: slug,
      title: loaded.title,
      intro: loaded.intro,
      tier: loaded.tier,
      // Derived from the bytes, not asserted: a directive-free component is
      // server-renderable and the landing's "with behaviour" count should not
      // inflate itself by guessing.
      behaviour: source.startsWith('"use client"'),
      render: first.render,
      source,
      fromExamples: true,
    });
  }

  // One alphabetical order for every consumer; locale-aware sorting is the
  // INDEX PAGE's job (it re-sorts with Intl.Collator per locale) — this order
  // only needs to be stable.
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return entries;
}

export function allCatalog(): Promise<CatalogEntry[]> {
  cached ??= build();
  return cached;
}

export async function catalogById(id: string): Promise<CatalogEntry | undefined> {
  return (await allCatalog()).find((e) => e.id === id);
}
