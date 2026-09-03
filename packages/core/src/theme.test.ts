import { describe, expect, it } from "vitest";
import { themeScript } from "./theme.ts";

/**
 * The trap these tests exist for: an ABSENT `data-theme` does not mean light,
 * it means follow the OS. A consumer that wants a light-by-default product and
 * expresses light by leaving the attribute off silently hands every token it
 * has not overridden back to `prefers-color-scheme`.
 */
describe("themeScript", () => {
  it("removes the attribute for the system default, so the media query decides", () => {
    const s = themeScript();
    expect(s).toContain('"system"');
    expect(s).toContain("removeAttribute");
    expect(s).toContain("setAttribute");
  });

  it("writes the attribute for a light default, so the OS reaches nothing", () => {
    const s = themeScript({ defaultTheme: "light" });
    expect(s).toContain('||"light"');
  });

  it("uses the storage key it is given", () => {
    expect(themeScript({ storageKey: "acme-theme" })).toContain('"acme-theme"');
    expect(themeScript()).toContain('"lumo-theme"');
  });

  it("cannot throw the page down when localStorage is unavailable", () => {
    // Privacy modes THROW on access rather than returning null.
    expect(themeScript()).toMatch(/^try\{/);
    expect(themeScript()).toContain("catch");
  });

  it("is valid JavaScript", () => {
    for (const d of ["system", "light", "dark"] as const) {
      expect(() => new Function(themeScript({ defaultTheme: d }))).not.toThrow();
    }
  });

  it("actually applies the policy it claims", () => {
    const run = (script: string, stored: string | null) => {
      const el = { attr: null as string | null };
      const fn = new Function(
        "localStorage",
        "document",
        script.replace(/document\.documentElement/g, "document.documentElement"),
      );
      fn(
        { getItem: () => stored },
        {
          documentElement: {
            setAttribute: (_: string, v: string) => { el.attr = v; },
            removeAttribute: () => { el.attr = null; },
          },
        },
      );
      return el.attr;
    };
    // system default, nothing stored -> attribute absent, OS decides
    expect(run(themeScript(), null)).toBeNull();
    // light default, nothing stored -> pinned light, OS reaches nothing
    expect(run(themeScript({ defaultTheme: "light" }), null)).toBe("light");
    // a stored choice always wins over the default
    expect(run(themeScript({ defaultTheme: "light" }), "dark")).toBe("dark");
    expect(run(themeScript({ defaultTheme: "system" }), "light")).toBe("light");
    expect(run(themeScript({ defaultTheme: "light" }), "system")).toBeNull();
  });
});
