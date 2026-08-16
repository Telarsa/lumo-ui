import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";

const OUT = fileURLToPath(new URL("../../apps/website/out/", import.meta.url));

/** Every built route as a URL path (`/fa/components/dialog/`), from the export on disk. */
export function routes(prefix = ""): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "index.html") {
        const rel = relative(OUT, dir).split("\\").join("/");
        found.push(rel === "" ? "/" : `/${rel}/`);
      }
    }
  };
  walk(OUT);
  return found.filter((r) => r.startsWith("/" + prefix)).sort();
}

/** A word of Latin letters (three or more), the way the HTML gate spells it. */
export const LATIN_WORD = /\p{Script=Latin}{3,}/u;

/** The attributes a screen reader speaks. */
export const SPOKEN = ["aria-label", "aria-roledescription", "aria-valuetext", "aria-placeholder", "title"] as const;

/** Spoken attributes inside `root` (or its own) whose value contains a Latin word, outside `data-lumo-latn` islands. */
export async function latinSpoken(root: Locator): Promise<string[]> {
  return root.evaluate((el, spoken) => {
    const out: string[] = [];
    const all = [el, ...Array.from(el.querySelectorAll("*"))];
    for (const node of all) {
      if (node.closest("[data-lumo-latn]")) continue;
      for (const attr of spoken) {
        const value = node.getAttribute(attr);
        if (value && /\p{Script=Latin}{3,}/u.test(value)) out.push(`${attr}="${value}"`);
      }
    }
    return out;
  }, SPOKEN as unknown as string[]);
}

/** The first example's stage on a component page. */
export function demoRoot(page: Page): Locator {
  return page.locator("[data-lumo-demo-root]").first();
}
