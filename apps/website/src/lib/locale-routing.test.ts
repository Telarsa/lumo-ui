import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@lumo-ui/core";
import { segmentFor } from "./locale";

/**
 * A URL IS BUILT FROM A SEGMENT, NEVER FROM A LOCALE TAG.
 *
 * ═══ WHAT THIS CAUGHT ═══════════════════════════════════════════════════════
 *
 * Routes are `/fa/…` and `/en/…`; the locales are `fa-IR` and `en-US`.
 * `segmentFor()` exists to convert one to the other, and SIX call sites did not
 * use it — they interpolated the locale straight into the path. Measured on the
 * built export: **202 dead links**, every one a 404, because no `/fa-IR/` route
 * is ever generated.
 *
 * The user found it by clicking the language menu in the site header.
 *
 * ═══ WHY THIS IS A SOURCE CHECK AND NOT A GATE RULE ═════════════════════════
 *
 * `lumo-gate` grades the served bytes, which is normally the stronger place to
 * stand — it cannot be fooled by what the source appears to say. It would have
 * caught 202 of these.
 *
 * It would NOT have caught the one that was reported. The header's language
 * menu is a Base UI popup, and Base UI renders popup content only once open, so
 * those `<a href>`s exist in no static document at all. A served-bytes rule
 * would have reported the preview toolbar's links and stayed silent about the
 * control the user actually pressed.
 *
 * So the check goes where the defect is written rather than where it is
 * usually visible. That is the opposite of this repository's normal instinct,
 * and it is deliberate.
 *
 * ═══ THE WEAKNESS, STATED ═══════════════════════════════════════════════════
 *
 * It matches interpolations of identifiers NAMED like a locale. A variable
 * called something else would slip past. That is a real hole and the honest
 * alternative — parsing TypeScript and resolving types — is a compiler, which
 * is more machinery than this deserves. The names below are the ones the
 * codebase actually uses; a new one is a two-line addition here, and the test
 * that follows pins the conversion itself so at least the helper cannot drift.
 */

const SRC = join(import.meta.dirname, "..");
const LOCALE_IDENTIFIERS = ["locale", "lang", "l", "otherLang", "otherLocale"];

/** Every `.ts`/`.tsx` under `src`, recursively. */
function sources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sources(path));
    } else if (/\.tsx?$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(path);
    }
  }
  return out;
}

describe("locale routing", () => {
  it("builds no path from a bare locale identifier", () => {
    // `/${locale}` and friends, but NOT `/${segmentFor(locale)}`.
    const bare = new RegExp(`/\\$\\{(?:${LOCALE_IDENTIFIERS.join("|")})\\}`, "g");
    const offenders: string[] = [];
    for (const file of sources(SRC)) {
      const text = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      if (bare.test(text)) offenders.push(file.slice(SRC.length + 1));
      bare.lastIndex = 0;
    }
    expect(offenders).toEqual([]);
  });

  it("maps every locale to a segment that is not the locale itself", () => {
    /*
     * The other half. If `segmentFor` ever became the identity function the
     * check above would pass while every URL went back to being wrong — the
     * call sites would all be "correct" and all still broken.
     */
    for (const locale of LOCALES) {
      const segment = segmentFor(locale);
      expect(segment).not.toBe(locale);
      expect(segment).toMatch(/^[a-z]{2}$/);
    }
  });
});
