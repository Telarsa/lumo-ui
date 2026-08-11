import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exampleSlugs, loadExamplesFor, sourceOf } from "./examples-loader.ts";

/**
 * THE EXAMPLE-COVERAGE MANIFEST — what the library documents, and what it does
 * not.
 *
 * ═══ WHY THIS EXISTS, AND WHAT IT REPLACES ══════════════════════════════════
 *
 * Round 3 found eleven components with example files and no built page. Round 5
 * found ten components in the registry with no examples at all: shipped,
 * tested, listed — and reachable only by someone who already knew they were
 * there. Both were found by a person reading two lists side by side, which is
 * not a mechanism.
 *
 * This is the mechanism. It reads the REGISTRY — the artifact that is already
 * true about what the library ships — and the examples directory, and reports
 * the difference. Nothing here is hand-maintained, so it cannot go stale the
 * way the list it replaces did.
 *
 * ═══ WHY IT DOES NOT FAIL THE BUILD ═════════════════════════════════════════
 *
 * A component with no examples yet is a normal state on the way to having
 * some, and a gate that forbade it would be a gate people route around by
 * writing one empty example. The manifest's job is to make the gap VISIBLE and
 * countable — on a page, in both locales — not to make it fatal.
 *
 * That is a deliberate split from `lumo-gate`, which does fail the build. The
 * difference: the gate grades a DEFECT in something that shipped, and an
 * undocumented component is an absence. `catalog.ts` already throws on the one
 * shape that IS a defect — an examples file whose meta cannot build a page.
 *
 * SERVER-ONLY: reads the filesystem, runs during `next build`.
 */

const REGISTRY = join(process.cwd(), "..", "..", "registry.json");

/**
 * Only `registry:ui` items can HAVE examples, so only they are counted.
 *
 * ── A MANIFEST THAT REPORTS FALSE GAPS IS WORSE THAN NO MANIFEST ───────────
 *
 * The first cut counted every registry item and reported 79 uncovered, of which
 * 30 were blocks — and a block is not undocumented, it is documented somewhere
 * else. `app/[lang]/blocks/[slug]/page.tsx` renders from `lib/blocks.tsx` and
 * never touches the examples loader: a block's page is a live preview, its
 * install command and its full source, which is the right shape for a
 * composition somebody copies whole. There is no `examples/<block>.tsx` for the
 * same reason there is no API table on a block page.
 *
 * So those 30 were not a backlog; they were the manifest measuring the wrong
 * thing. A number that overstates the gap teaches people to discount it, which
 * costs more than the gap it was inflating.
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
   * Example files that match NO registry item.
   *
   * The inverse gap, and the one nobody looks for: an examples file for a
   * component that was renamed or removed builds a page documenting something
   * the library no longer ships. `catalog.ts` throws when the component's
   * SOURCE is missing; this catches the case where the source exists but the
   * registry does not list it.
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
