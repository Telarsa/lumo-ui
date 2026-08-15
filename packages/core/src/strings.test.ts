import { describe, expect, it } from "vitest";
import { LOCALES } from "./types.ts";
import { STRINGS, stringsFor, type LumoStrings } from "./strings.ts";

/**
 * Structural parity, checked at runtime as well as by `satisfies`.
 *
 * The type system already makes a missing key a compile error. These tests
 * catch the things a type cannot see: a key present but empty, a Persian value
 * that is silently still English, and a function that ignores its argument.
 *
 * Deliberately NOT written as "some Arabic-range character appears somewhere" —
 * a sibling project ships exactly that assertion and it passes on a calendar
 * whose day cells render Latin digits, because the Persian weekday headers
 * satisfy it on their own. An assertion that cannot fail is worse than none.
 */

function leaves(o: unknown, path = ""): [string, unknown][] {
  if (o && typeof o === "object") {
    return Object.entries(o).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [[path, o]];
}

const PERSIAN = /[؀-ۿ]/;
const LATIN_WORD = /[A-Za-z]{3,}/;

describe("strings — structural parity", () => {
  it("every declared locale has a string set", () => {
    for (const l of LOCALES) expect(stringsFor(l)).toBeDefined();
  });

  it("all locales share exactly the same key paths", () => {
    const keysOf = (s: LumoStrings) => leaves(s).map(([k]) => k).sort();
    const reference = keysOf(STRINGS["en-US"]);
    for (const l of LOCALES) expect(keysOf(STRINGS[l])).toEqual(reference);
  });

  it("all locales agree on which keys are functions", () => {
    const shape = (s: LumoStrings) =>
      leaves(s).map(([k, v]) => `${k}:${typeof v}`).sort();
    const reference = shape(STRINGS["en-US"]);
    for (const l of LOCALES) expect(shape(STRINGS[l])).toEqual(reference);
  });

  it("no value is empty or whitespace", () => {
    for (const l of LOCALES) {
      for (const [key, v] of leaves(STRINGS[l])) {
        const rendered = typeof v === "function" ? v("نمونه") : v;
        expect(String(rendered).trim(), `${l} → ${key}`).not.toBe("");
      }
    }
  });
});

describe("strings — fa-IR is genuinely Persian", () => {
  it("every static Persian value contains Persian script", () => {
    for (const [key, v] of leaves(STRINGS["fa-IR"])) {
      if (typeof v === "function") continue;
      expect(String(v), `fa-IR → ${key}`).toMatch(PERSIAN);
    }
  });

  it("no Persian value contains a Latin word", () => {
    // This is the assertion that actually bites: a half-translated string like
    // "Decrease مبلغ" is exactly what React Aria produces, and it is what Lumo
    // exists to replace.
    for (const [key, v] of leaves(STRINGS["fa-IR"])) {
      const rendered = typeof v === "function" ? v("مبلغ") : v;
      expect(String(rendered), `fa-IR → ${key}`).not.toMatch(LATIN_WORD);
    }
  });

  it("function-valued strings actually interpolate their argument", () => {
    // A function that ignores its input would pass every check above while
    // announcing the wrong field.
    const marker = "خدمات‌رسانی";
    for (const [key, v] of leaves(STRINGS["fa-IR"])) {
      if (typeof v !== "function") continue;
      expect(String((v as (s: string) => string)(marker)), `fa-IR → ${key}`).toContain(marker);
    }
  });

  it("differs from English everywhere", () => {
    for (const [key, faV] of leaves(STRINGS["fa-IR"])) {
      const enV = leaves(STRINGS["en-US"]).find(([k]) => k === key)?.[1];
      const render = (x: unknown) => (typeof x === "function" ? (x as (s: string) => string)("X") : String(x));
      expect(render(faV), `fa-IR → ${key} was left as English`).not.toBe(render(enV));
    }
  });
});
