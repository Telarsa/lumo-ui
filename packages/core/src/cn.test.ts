import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cn } from "./cn";

/**
 * These are version-skew detectors, not unit tests of clsx.
 *
 * `tailwind-merge` ships Tailwind's conflict groups as data. A minor release
 * that mis-groups the logical spacing utilities would produce silently wrong
 * RTL spacing — the class list would look right in review and mirror wrong on
 * screen. The catalog pins tailwind-merge exactly; this is what makes that pin
 * mean something when someone bumps it.
 */
describe("cn — logical utility conflict groups", () => {
  it("resolves a logical inline-start conflict, last wins", () => {
    expect(cn("ms-2", "ms-4")).toBe("ms-4");
  });

  it("does NOT treat inline-start and inline-end as conflicting", () => {
    // The whole point of logical properties: these are different edges.
    expect(cn("ms-2", "me-4").split(" ").sort()).toEqual(["me-4", "ms-2"]);
  });

  it("keeps logical and physical separate — they are not interchangeable", () => {
    // If a future version merged these, a physical class would silently win
    // over a logical one and RTL would break in exactly one direction.
    const out = cn("ms-2", "ml-4").split(" ").sort();
    expect(out).toEqual(["ml-4", "ms-2"]);
  });

  it("resolves logical border and radius conflicts", () => {
    expect(cn("border-s-2", "border-s-4")).toBe("border-s-4");
    expect(cn("rounded-ss-sm", "rounded-ss-lg")).toBe("rounded-ss-lg");
  });

  it("does not merge across rtl:/ltr: variant boundaries", () => {
    // A variant-prefixed class targets a different state; merging it into the
    // bare class would drop the direction-specific override entirely.
    const out = cn("ms-2", "rtl:ms-4").split(" ").sort();
    expect(out).toEqual(["ms-2", "rtl:ms-4"]);
  });

  it("lets a caller override the component's own class", () => {
    // The copy-in contract: consumer className must win.
    expect(cn("px-3 py-2 ms-2", "ms-8")).toContain("ms-8");
    expect(cn("px-3 py-2 ms-2", "ms-8")).not.toContain("ms-2");
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * THE NAMESPACE LUMO INVENTED, AND THAT `twMerge` COULD NOT SEE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `cn` ran as a bare `twMerge`, which knows Tailwind's own scales and nothing
 * else. `--spacing-control-sm|md|lg` is Lumo's, so `h-control-md` and
 * `h-control-lg` read as unrelated arbitrary values and BOTH survived — the
 * winner then decided by stylesheet order, which is the exact failure this
 * function exists to prevent.
 *
 * Measured on the built export at the time: 1,766 elements carried two
 * conflicting `h-control-*` classes and 2 rendered against the author's intent
 * (36px where `h-control-lg` asked for 44px, under the touch-target floor).
 * The other 1,764 were correct only because `sm` happens to be emitted last.
 */
describe("the control-* namespace", () => {
  it("resolves a conflict the same way it resolves a Tailwind one", () => {
    // The control case, and its Tailwind twin beside it — if the twin ever
    // stops working the extension has broken the base behaviour, not fixed it.
    expect(cn("h-4", "h-8")).toBe("h-8");
    expect(cn("h-control-md", "h-control-lg")).toBe("h-control-lg");
    expect(cn("w-control-sm", "w-control-lg")).toBe("w-control-lg");
    expect(cn("min-h-control-sm", "min-h-control-lg")).toBe("min-h-control-lg");
  });

  it("does not collapse across axes, which is the RTL-relevant half", () => {
    // Height and width are different groups; a resolver that merged them would
    // silently drop one dimension of every icon button in the library.
    expect(cn("h-control-md", "w-control-md")).toBe("h-control-md w-control-md");
  });

  it("lets a consumer's plain height beat a component's control height", () => {
    // The whole point of `cn` for a copy-in library: the caller wins.
    expect(cn("h-control-md", "h-12")).toBe("h-12");
    expect(cn("h-12", "h-control-md")).toBe("h-control-md");
  });

  it("knows exactly the control sizes theme.css publishes", () => {
    /*
     * The one thing that can rot here: this file names three sizes and
     * `theme.css` publishes the real set. If a `control-xl` is added there and
     * not here, its conflicts go back to being decided by byte offset — the
     * original bug, in a new size, and invisible.
     *
     * So the scale is read from the stylesheet rather than trusted.
     */
    const theme = readFileSync(
      join(import.meta.dirname, "..", "..", "theme", "src", "theme.css"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    const published = [...theme.matchAll(/--spacing-control-([\w-]+)\s*:/g)].map((m) => m[1]).sort();
    expect(published).toEqual(["lg", "md", "sm"]);

    // And each one actually resolves, rather than merely being listed.
    for (const size of published) {
      expect(cn(`h-control-${size}`, `h-control-${size}`)).toBe(`h-control-${size}`);
    }
  });
});
