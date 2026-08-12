import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allBlocks } from "../lib/blocks.tsx";

/**
 * THE LANDING PAGE'S FIGURES MUST BE DERIVED, NOT TYPED.
 *
 * ═══ WHAT THIS CAUGHT ═══════════════════════════════════════════════════════
 *
 * `/[lang]/page.tsx` shows four figures. Three came from `allCatalog()` and a
 * date; the fourth was `formatNumber(28, lang)`. The registry holds THIRTY
 * blocks, so the landing page under-reported its own inventory by two — sitting
 * directly above a section whose entire argument is that a claim and its test
 * should be the same bytes.
 *
 * ═══ WHY A SOURCE ASSERTION AND NOT A RENDER ONE ════════════════════════════
 *
 * The obvious test — render the page, read the number, compare — passes the
 * moment someone updates the literal to 30, and then rots again at 31. It tests
 * the VALUE, and the value was never really the bug; the bug was that a
 * hand-kept number sat next to derived ones looking exactly as authoritative
 * while nothing failed when it drifted.
 *
 * So this asserts the SHAPE instead: no numeric literal reaches `formatNumber`
 * on that page. A figure that cannot be typed cannot go stale. The count check
 * below then pins the other half — that the two inventories the site reads from
 * agree with each other.
 *
 * The regex is deliberately narrow: `formatNumber(` followed by digits. It does
 * not try to parse TypeScript, because a test that needs a parser to state its
 * rule is a test whose rule is too clever to hold.
 */

const PAGE = join(import.meta.dirname, "[lang]", "page.tsx");

describe("the landing page's figures", () => {
  it("passes no numeric literal to formatNumber", () => {
    /*
     * Comments are stripped first, and the first cut of this test did not do
     * that — so it failed on the very comment in `page.tsx` explaining the
     * literal it had just replaced. A check that forbids describing the bug it
     * fixed is a check that quietly deletes the reason.
     *
     * The strip is a regex and therefore approximate: a `//` inside a string
     * literal would truncate that line. That is the right amount of machinery
     * here — this is a tripwire over one file we own, not a compiler, and the
     * failure mode of the approximation is a FALSE PASS on a line nobody has
     * written, not a false failure on one somebody did.
     */
    const source = readFileSync(PAGE, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    const literals = [...source.matchAll(/formatNumber\(\s*(\d[\d_]*)/g)].map((m) => m[1]);
    // Named in the failure so the message says WHICH number was typed in.
    expect(literals).toEqual([]);
  });

  it("counts blocks from the same source the registry is built from", () => {
    const registry = JSON.parse(
      // Same hop `lib/coverage.ts` makes, and for the same file.
      readFileSync(join(process.cwd(), "..", "..", "registry.json"), "utf8"),
    ) as { items: { type: string }[] };
    const inRegistry = registry.items.filter((i) => i.type === "registry:block").length;
    /*
     * `allBlocks()` is what the landing figure, the blocks index and the search
     * index all read; `registry.json` is what `shadcn add` reads. They are two
     * derivations of one inventory, and the site claiming a different number
     * than the tool installs is the same defect one layer up.
     */
    expect(allBlocks().length).toBe(inRegistry);
  });
});
