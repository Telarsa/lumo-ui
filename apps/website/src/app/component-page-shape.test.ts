import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * THE SHAPE OF A COMPONENT PAGE, PINNED WHERE IT MATTERS.
 *
 * ═══ WHY THESE TWO FACTS AND NOT A SNAPSHOT ═════════════════════════════════
 *
 * A snapshot of this page would fail on every copy edit and teach people to
 * re-record it, which is how a test stops being read. These are the two facts a
 * reader actually depends on, and both were wrong:
 *
 *   1. **Installation was second-to-LAST**, between the accessibility evidence
 *      and the two-direction render. Established component sites put it
 *      directly under the preview, and they are right for a reason this library
 *      has more of than either: these components are COPIED, not imported, so
 *      the page's job is to get the file into somebody's project. Everything
 *      else is what you read after you have it.
 *
 *   2. **Below 1024px there was no navigation to the other 93 components at
 *      all.** The sidebar is `hidden lg:block` with nothing in its place, so on
 *      a phone the library was reachable only through search or by typing URLs.
 *
 * ═══ WHY IT READS THE SOURCE AND NOT THE BUILT PAGE ═════════════════════════
 *
 * The export is the stronger artifact and this file would rather grade it — but
 * `apps/website` tests run BEFORE `gate:html` builds, so a built page here is
 * whatever the last build left behind, which is a test that passes on a stale
 * artifact. The section order is a literal in one file; that is where it can be
 * checked honestly at this tier.
 */

const PAGE = join(import.meta.dirname, "[lang]", "components", "[slug]", "page.tsx");

describe("the component page's shape", () => {
  const source = readFileSync(PAGE, "utf8");
  /*
   * Comments stripped first. This file's own prose names `id="installation"`
   * while explaining the change, and a check that forbids describing itself is
   * one this repository has now written by accident three times.
   */
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  /*
   * The file holds TWO page shapes since a mobile-only family earned a page
   * (decisions §39, §40): the full component page, and `MobileOnlyWebSide`,
   * whose web side is one sentence saying the web library has no such component
   * and a link across. A file-wide regex splices the two together and grades a
   * page that does not exist — that is exactly what it did when this test first
   * failed, reporting an order of ["preview", "preview"]. Each shape is graded
   * on its own segment instead.
   */
  const segments = code.split(/\n(?=(?:export default )?(?:async )?function )/);
  const segmentOf = (name: string) => {
    const found = segments.find((segment) => new RegExp(`function ${name}\\b`).test(segment));
    if (found === undefined) throw new Error(`no top-level ${name} in the page`);
    return found;
  };
  const fullPage = segmentOf("ComponentPage");
  const mobileOnly = segmentOf("MobileOnlyWebSide");
  const sectionIds = (segment: string) =>
    [...segment.matchAll(/<section id="([a-z]+)"/g)].map((m) => m[1]);

  it("puts installation directly after the preview", () => {
    // Not the whole order — only the claim. A new section between evidence and
    // directions should not fail this test.
    expect(sectionIds(fullPage).slice(0, 2)).toEqual(["preview", "installation"]);
  });

  it("gives the mobile-only web side a preview and nothing to install", () => {
    // There is no web component to install, so the page must not offer a copy
    // command for one. One section, and the reader is sent to the Mobile side.
    expect(sectionIds(mobileOnly)).toEqual(["preview"]);
  });

  it("keeps the rail and the body in the same order", () => {
    /*
     * The invariant `sections()` has always claimed: the rail is built from one
     * list and the body renders the same ids in the same sequence. Moving one
     * and not the other produces a rail that scrolls to the wrong place — which
     * is worse than the original problem, because it looks like navigation.
     */
    // From `sections()`, which is the ONE list the full page's rail is built
    // from — file-wide, this also catches the single-entry rail inside
    // `MobileOnlyWebSide` and compares two different pages' navigation.
    const railIds = [...segmentOf("sections").matchAll(/\{ id: "([a-z]+)", label: c\.rail\./g)].map(
      (m) => m[1],
    );
    const bodyIds = sectionIds(fullPage);
    const inBoth = railIds.filter((id) => bodyIds.includes(id));
    expect(inBoth).toEqual(bodyIds.filter((id) => railIds.includes(id)));
  });

  it("has a component list reachable below the sidebar's breakpoint", () => {
    // `lg:hidden` on a `<details>` that renders the same DocsSidebar — the
    // canonical list, not a second one that can drift from it.
    expect(code).toMatch(/<details[^>]*lg:hidden/);
    const mobile = code.slice(code.indexOf("<details"));
    expect(mobile).toContain("<DocsSidebar");
  });

  it("names that control in both locales", () => {
    // It is the only navigation below 1024px; an unnamed one is an unreachable
    // library. Required copy, so it is a compile error to omit — but a compile
    // error only proves the KEY exists, not that either value is real text.
    for (const literal of ['browseComponents: "همهٔ کامپوننت‌ها"', 'browseComponents: "All components"']) {
      expect(source).toContain(literal);
    }
  });
});
