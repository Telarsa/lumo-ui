import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allDemos, type Demo } from "./demos.tsx";
import { exampleSlugs, loadExamplesFor } from "./examples-loader.ts";

/**
 * THE component catalog — the one list every routed surface derives from.
 *
 * A component appears here if it has a demos.tsx entry OR an examples file; the two
 * registries once drifted apart and eleven components shipped without pages. Every
 * consumer (static params, sidebar, index, search, landing counts) imports THIS module —
 * importing `allDemos` directly for navigation is the bug this file exists to end.
 * Long-form: docs/decisions/log.md.
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
      // Loud, with the fix in the message: a component that exists everywhere except the site.
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
      // server-renderable and the landing's "with behaviour" count must not guess.
      behaviour: source.startsWith('"use client"'),
      render: first.render,
      source,
      fromExamples: true,
    });
  }

  // Stable order for every consumer; locale-aware sorting is the index page's job.
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
