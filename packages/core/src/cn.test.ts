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
