import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, direction } from "@lumo-ui/core";
import { LOCALE_NAMES, oppositeDirectionLocale, site } from "./locale.ts";
import { DOCS_PAGES } from "./docs-pages.ts";

const SRC = join(import.meta.dirname, "..");

/**
 * THE RATCHET ON BINARY LOCALE TERNARIES.
 *
 * `lang === "fa-IR" ? persian : english` is the defect this file exists to
 * prevent, and it is the repository's own defect shape: it type-checks with a
 * third locale in the union, it renders, it looks right in review — and it hands
 * the new locale the ENGLISH branch. The HTML gate cannot catch it either,
 * because the branch it wrongly serves is Latin script exactly like the branch
 * it should have served. `Record<Locale, …>` moves that to compile time.
 *
 * CONTRIBUTING's "Adding a locale" states the rule. This is the part that makes
 * it a rule rather than a note nobody reads — the same argument the gate's
 * poison fixtures make about gate rules.
 *
 * It is a BUDGET, not a ban, because the sweep that introduced it could not
 * reach every file: the three below were owned by concurrent work. Their counts
 * are recorded so they cannot grow, and the budget is checked in BOTH
 * directions — a file that drops below its number fails too, so the number
 * comes down as the work lands instead of sitting stale and permissive.
 */
const BUDGET: Record<string, number> = {
  // The block registry: 28 blocks' worth of copy, by far the largest remaining
  // pocket and the obvious next sweep.
  "lib/blocks.tsx": 434,
  "components/demo-frame.tsx": 3,
};

/**
 * Strips comments so the rule's own prose does not count as a violation — this
 * file, and several of the swept modules, quote the anti-pattern to explain it.
 * String literals are preserved: a ternary hiding in a template is still one.
 */
function stripComments(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; ) {
    const c = s[i]!;
    if (c === '"' || c === "'" || c === "`") {
      out += c;
      i += 1;
      while (i < s.length) {
        if (s[i] === "\\") {
          out += s.slice(i, i + 2);
          i += 2;
          continue;
        }
        out += s[i];
        i += 1;
        if (s[i - 1] === c) break;
      }
      continue;
    }
    if (s.startsWith("//", i)) {
      const j = s.indexOf("\n", i);
      i = j < 0 ? s.length : j;
      continue;
    }
    if (s.startsWith("/*", i)) {
      const j = s.indexOf("*/", i);
      i = j < 0 ? s.length : j + 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/** A conditional that branches on the locale tag itself. */
const TERNARY = /===\s*"(?:fa-IR|en-US)"\s*\n?\s*\?/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      // `examples/` is out of scope by contract — those files are authored
      // against `Record<Locale>` types already (see _system/types.ts) and are
      // added by whoever adds a component.
      if (e.name === "examples" || e.name === "node_modules") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

describe("site copy is a Record<Locale> map, never a binary ternary", () => {
  const counts = new Map<string, number>();
  for (const file of walk(SRC)) {
    const rel = relative(SRC, file);
    const n = (stripComments(readFileSync(file, "utf8")).match(TERNARY) ?? []).length;
    if (n > 0) counts.set(rel, n);
  }

  it("no file outside the recorded budget branches on the locale tag", () => {
    const offenders = [...counts]
      .filter(([rel]) => BUDGET[rel] === undefined)
      .map(([rel, n]) => `${rel}: ${n}`);
    expect(
      offenders,
      "Pick copy out of a `Record<Locale, …>` map instead — a ternary compiles " +
        "with a third locale and silently serves it the English branch. See " +
        "CONTRIBUTING's \"Adding a locale\".",
    ).toEqual([]);
  });

  it("the budgeted files have not grown", () => {
    for (const [rel, max] of Object.entries(BUDGET)) {
      expect(counts.get(rel) ?? 0, `${rel} gained locale ternaries`).toBeLessThanOrEqual(max);
    }
  });

  it("no budget entry is stale", () => {
    // A budget that outlives the work it excused is a permission nobody
    // revisits. When a file is swept, its line here must go — and this is what
    // says so, in the one place the sweeper is already looking.
    for (const [rel, max] of Object.entries(BUDGET)) {
      expect(
        counts.get(rel) ?? 0,
        `${rel} is below its budget of ${max} — lower the number or delete the entry`,
      ).toBe(max);
    }
  });
});

describe("every declared locale is completely wired", () => {
  it("has site copy, an endonym, and a resolvable direction", () => {
    for (const lang of LOCALES) {
      expect(Object.keys(site[lang]).length, `${lang} has no site copy`).toBeGreaterThan(0);
      for (const [key, value] of Object.entries(site[lang])) {
        expect(value.trim(), `site.${lang}.${key} is empty`).not.toBe("");
      }
      expect(LOCALE_NAMES[lang].trim(), `${lang} has no endonym`).not.toBe("");
      expect(["rtl", "ltr"]).toContain(direction(lang));
    }
  });

  it("names each locale in its own language, not in one shared language", () => {
    // An endonym table that repeated one spelling would be a menu that only
    // helps readers who already found their locale.
    const names = LOCALES.map((l) => LOCALE_NAMES[l]);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every docs page is labelled and introduced in every locale", () => {
    for (const page of DOCS_PAGES) {
      for (const lang of LOCALES) {
        expect(page.label[lang]?.trim(), `${page.slug} has no ${lang} label`).not.toBe("");
        expect(page.intro[lang]?.trim(), `${page.slug} has no ${lang} intro`).not.toBe("");
      }
    }
  });
});

describe("the side-by-side comparison locale is derived, not paired by hand", () => {
  for (const lang of LOCALES) {
    it(`${lang} mirrors against a locale of the opposite direction`, () => {
      expect(direction(oppositeDirectionLocale(lang))).not.toBe(direction(lang));
    });
  }
});
