import { describe, expect, it } from "vitest";
import { stringsFor } from "../../core/src/index.ts";
import { lumoCalendar } from "./index.ts";

/*
 * THE README'S EXAMPLE, EXECUTED.
 *
 * Added after review found that both README.md and index.ts documented
 * `useLumoStringsFor` from `@lumo-ui/core` — a function that does not exist
 * there. It lives in `@lumo-ui/core` as `stringsFor`, so
 * the documented entry point named a symbol from the thing being removed.
 *
 * A documented usage that does not run is a lie. This runs it.
 */
describe("the documented usage", () => {
  it("resolves built-in strings and builds a config, with no hook and no retired package", () => {
    const strings = stringsFor("fa-IR");
    const { dateLib, formatters, labels, weekStartsOn } = lumoCalendar("fa-IR", strings.calendar);
    expect(typeof weekStartsOn).toBe("number");
    expect(Object.keys(dateLib).length).toBeGreaterThan(10);
    expect(Object.keys(formatters).length).toBeGreaterThan(3);
    expect(Object.keys(labels).length).toBeGreaterThan(5);
  });
  it("throws rather than falling back for a language it carries nothing for", () => {
    expect(() => stringsFor("de-DE")).toThrow();
  });
});
