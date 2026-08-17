import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { exampleSlugs, loadExamplesFor } from "./examples-loader.ts";

/**
 * THE component catalog — the one list every routed surface derives from.
 *
 * A component appears here if, and only if, it has an examples file
 * (`src/examples/<slug>.tsx`, discovered by existence — see examples-loader.ts).
 * There is ONE registration system on purpose: the site once merged this list
 * with a hand-kept `demos.tsx`, the two drifted, and eleven components shipped
 * without pages. Every consumer (static params, sidebar, index, search, landing
 * counts) imports THIS module. Long-form: docs/decisions/log.md.
 *
 * `source` is READ FROM DISK at build time, so the code shown in the source
 * panel is byte-identical to the code rendering the preview; `render` is the
 * file's FIRST example, which is therefore the page's preview.
 */

const UI_SRC = join(process.cwd(), "..", "..", "packages", "ui", "src");

export const TIERS = ["form", "display", "overlay", "navigation", "feedback", "layout", "data"] as const;

export type Tier = (typeof TIERS)[number];

export const tierLabel: Record<Tier, Record<Locale, string>> = {
  form: { "fa-IR": "فرم", "en-US": "Form" },
  display: { "fa-IR": "نمایش", "en-US": "Display" },
  overlay: { "fa-IR": "لایه", "en-US": "Overlay" },
  navigation: { "fa-IR": "ناوبری", "en-US": "Navigation" },
  feedback: { "fa-IR": "بازخورد", "en-US": "Feedback" },
  layout: { "fa-IR": "چیدمان", "en-US": "Layout" },
  data: { "fa-IR": "داده", "en-US": "Data" },
};

export interface CatalogEntry {
  id: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  tier: Tier;
  /**
   * Derived from the bytes, not asserted: a directive-free component is
   * server-renderable, and the landing's "with behaviour" count must not guess.
   */
  behaviour: boolean;
  render: (locale: Locale) => LumoNode;
  source: string;
}

/**
 * A family the MOBILE library has and the web library does not — an app bar's
 * phone-only cousins. It has a page, a sidebar row and a Mobile side; its Web
 * side says the web has no such component and points across.
 *
 * Kept in a separate list rather than as a nullable `render`/`source` on
 * `CatalogEntry`: the landing gallery, the `/view/` preview route and the
 * registry resolver all take a catalog entry and immediately render or read its
 * source, and making those fields optional would push a "this cannot happen"
 * branch into four files to describe one that has neither.
 */
export interface MobileOnlyEntry {
  id: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  tier: Tier;
}

let cached: Promise<CatalogEntry[]> | undefined;
let cachedMobileOnly: Promise<MobileOnlyEntry[]> | undefined;

async function build(): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];

  for (const slug of exampleSlugs()) {
    const loaded = await loadExamplesFor(slug);
    if (!loaded) continue;
    // A mobile-only family is registered the same way as any other — one
    // examples file — but it has no web component, so the requirements below
    // (at least one example, a module in packages/ui/src) do not apply to it.
    if (!loaded.platforms.includes("web")) continue;
    if (!loaded.title || !loaded.intro || !loaded.tier) {
      // Loud, with the fix in the message: a component that exists everywhere except the site.
      throw new Error(
        `[catalog] examples/${slug}.tsx: meta must carry title, intro and tier ` +
          `(both locales) — they are the page header and the sidebar group. ` +
          `Missing: ${[
            !loaded.title && "title",
            !loaded.intro && "intro",
            !loaded.tier && "tier",
          ]
            .filter(Boolean)
            .join(", ")}.`,
      );
    }
    const first = loaded.examples[0];
    if (!first) {
      throw new Error(`[catalog] examples/${slug}.tsx has zero examples — nothing to preview.`);
    }
    let source: string;
    try {
      source = readFileSync(join(UI_SRC, loaded.module), "utf8");
    } catch {
      throw new Error(
        `[catalog] examples/${slug}.tsx exists but packages/ui/src/${loaded.module} does ` +
          `not — an examples file for a component that is not in the library ` +
          `(set meta.sourceFile if the component lives in a differently-named module).`,
      );
    }
    entries.push({
      id: slug,
      title: loaded.title,
      intro: loaded.intro,
      tier: loaded.tier,
      behaviour: source.startsWith('"use client"'),
      render: first.render,
      source,
    });
  }

  // Stable order for every consumer; locale-aware sorting is the index page's job.
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return entries;
}

export function allCatalog(): Promise<CatalogEntry[]> {
  cached ??= build();
  return cached;
}

async function buildMobileOnly(): Promise<MobileOnlyEntry[]> {
  const entries: MobileOnlyEntry[] = [];
  for (const slug of exampleSlugs()) {
    const loaded = await loadExamplesFor(slug);
    if (!loaded || loaded.platforms.includes("web")) continue;
    if (!loaded.title || !loaded.intro || !loaded.tier) {
      throw new Error(
        `[catalog] examples/${slug}.tsx declares platforms: ["mobile"] but still needs ` +
          `title, intro and tier (both locales) — they are the page header and the sidebar row.`,
      );
    }
    entries.push({ id: slug, title: loaded.title, intro: loaded.intro, tier: loaded.tier });
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return entries;
}

export function allMobileOnly(): Promise<MobileOnlyEntry[]> {
  cachedMobileOnly ??= buildMobileOnly();
  return cachedMobileOnly;
}

/**
 * Page identity for ANY family, whichever platforms it has — what the header,
 * the `<title>` and the sidebar need. The Web and Mobile pages both read this,
 * so a family that exists on one platform still has one name.
 */
export async function pageIdentity(
  id: string,
): Promise<{ id: string; title: Record<Locale, string>; intro: Record<Locale, string>; tier: Tier } | undefined> {
  return (await allCatalog()).find((e) => e.id === id) ?? (await allMobileOnly()).find((e) => e.id === id);
}

export async function catalogById(id: string): Promise<CatalogEntry | undefined> {
  return (await allCatalog()).find((e) => e.id === id);
}
