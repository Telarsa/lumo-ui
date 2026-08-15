import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exampleSlugs, loadExamplesFor, sourceOf } from "./examples-loader.ts";

/**
 * THE EXAMPLE-COVERAGE MANIFEST — what the library documents, and what it does not.
 * Reads the REGISTRY and the examples directory and reports the difference; nothing is
 * hand-maintained. Deliberately NOT a build gate: an undocumented component is an absence,
 * not a defect (docs/decisions/log.md). SERVER-ONLY: reads the filesystem during `next build`.
 */

const REGISTRY = join(process.cwd(), "..", "..", "registry.json");

/**
 * Only `registry:ui` items can HAVE examples; blocks are documented by their own pages.
 */
const ELIGIBLE = "registry:ui";

export interface CoverageRow {
  /** The registry item's name, which is also the page slug. */
  slug: string;
  /** Always `registry:ui` — see `ELIGIBLE` on why blocks are not counted. */
  type: string;
  /** How many worked examples the component has. Zero is the interesting case. */
  examples: number;
  /** Which shape the examples are in, or `none`. */
  shape: "file" | "directory" | "none";
}

export interface Coverage {
  rows: readonly CoverageRow[];
  /** Registry items with at least one example. */
  covered: number;
  /** Registry items with none. The number this manifest exists to show. */
  uncovered: number;
  /** Every worked example on the site. */
  totalExamples: number;
  /**
   * Example files that match NO registry item — a page for something the library no longer ships.
   */
  orphans: readonly string[];
}

let cached: Promise<Coverage> | undefined;

async function build(): Promise<Coverage> {
  const registry = JSON.parse(readFileSync(REGISTRY, "utf8")) as {
    items: { name: string; type: string }[];
  };
  const slugs = new Set(exampleSlugs());

  const items = registry.items.filter((i) => i.type === ELIGIBLE);

  const rows: CoverageRow[] = [];
  for (const item of items) {
    const path = sourceOf(item.name);
    if (path === undefined) {
      rows.push({ slug: item.name, type: item.type, examples: 0, shape: "none" });
      continue;
    }
    const loaded = await loadExamplesFor(item.name);
    rows.push({
      slug: item.name,
      type: item.type,
      examples: loaded?.examples.length ?? 0,
      shape: path.endsWith(`${item.name}/index.tsx`) ? "directory" : "file",
    });
  }
  rows.sort((a, b) => a.slug.localeCompare(b.slug));

  const registryNames = new Set(items.map((i) => i.name));
  const orphans = [...slugs].filter((s) => !registryNames.has(s)).sort();

  return {
    rows,
    covered: rows.filter((r) => r.examples > 0).length,
    uncovered: rows.filter((r) => r.examples === 0).length,
    totalExamples: rows.reduce((sum, r) => sum + r.examples, 0),
    orphans,
  };
}

export function coverage(): Promise<Coverage> {
  cached ??= build();
  return cached;
}
