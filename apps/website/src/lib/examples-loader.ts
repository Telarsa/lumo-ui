import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, type Locale, type LumoNode } from "@lumo-ui/core";
import type {
  ComponentExamples,
  ExamplePart,
  LocalizedText,
} from "@/examples/_system/types";
import {
  assertKnownParts,
  compositionTags,
  extractExampleSource,
  parseExportedNames,
} from "@/examples/_system/extract";

/**
 * The example-file loader. SERVER-ONLY — it reads directories and file text,
 * and it runs during `next build` (this site is a static export, so "server"
 * means the build, exactly as `lib/highlight.ts`'s header puts it).
 *
 * Discovery is BY EXISTENCE: `exampleSlugs()` lists `src/examples/*.tsx` off
 * the filesystem, so a teammate shipping examples for a new component creates
 * one file and appears everywhere — the component page, the rail, the
 * sidebar's "new" dot — with no hand-kept list to forget. Names starting with
 * an underscore are the system's own (`_system/`), never examples.
 *
 * Loading VALIDATES, loudly. Everything the contract in
 * `examples/_system/types.ts` promises is checked here at build time, and a
 * violation throws — which fails the build — rather than degrading:
 *
 *   - the file must export `EXAMPLES` with at least one example;
 *   - ids must be kebab-case and unique (they become page anchors);
 *   - every localized string must be present and non-empty in EVERY locale —
 *     the site has no fallback locale, per CONTRIBUTING.md;
 *   - every example's source must be extractable (see `_system/extract.ts` —
 *     an example whose code cannot be shown is a broken page, not a warning);
 *   - every part named in `meta.composition` or `meta.parts` must be a real
 *     `packages/ui/src/index.ts` export, read off disk here the same way the
 *     slug page reads `registry.json`: derived from the artifact that is
 *     already true, never restated by hand.
 *
 * The module cache is per-build, like the registry cache in the slug page and
 * the highlighter in `lib/highlight.ts`.
 */

const EXAMPLES_DIR = join(process.cwd(), "src", "examples");
const UI_INDEX = join(process.cwd(), "..", "..", "packages", "ui", "src", "index.ts");

export interface LoadedExample {
  id: string;
  title: LocalizedText;
  description?: LocalizedText | undefined;
  render: (locale: Locale) => LumoNode;
  /** The render function's own text, sliced from the example file. Never empty. */
  source: string;
}

export interface LoadedComponentExamples {
  slug: string;
  /** Page identity, for components with no demos.tsx entry (see catalog.ts). */
  title?: Record<Locale, string> | undefined;
  intro?: Record<Locale, string> | undefined;
  tier?: "form" | "display" | "overlay" | "navigation" | "feedback" | "layout" | "data" | undefined;
  isNew: boolean;
  composition?: string | undefined;
  /** Value exports of the component's own module — the derived parts list. */
  moduleParts: readonly string[];
  parts?: readonly ExamplePart[] | undefined;
  examples: readonly LoadedExample[];
}

/** Every component slug that has an examples file, alphabetical. */
export function exampleSlugs(): string[] {
  if (!existsSync(EXAMPLES_DIR)) return [];
  return readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() &&
        e.name.endsWith(".tsx") &&
        !e.name.startsWith("_") &&
        !e.name.includes(".test."),
    )
    .map((e) => e.name.slice(0, -".tsx".length))
    .sort((a, b) => a.localeCompare(b));
}

function assertLocalizedText(value: LocalizedText, file: string, field: string): void {
  for (const locale of LOCALES) {
    const text = value[locale];
    if (typeof text !== "string" || text.trim() === "") {
      throw new Error(
        `[examples] ${file}: ${field} is empty or missing for ${locale}. There is ` +
          `no partial locale and no fallback — see CONTRIBUTING.md.`,
      );
    }
  }
}

let cachedExports: ReturnType<typeof parseExportedNames> | undefined;
function uiExports() {
  cachedExports ??= parseExportedNames(readFileSync(UI_INDEX, "utf8"));
  return cachedExports;
}

const cache = new Map<string, Promise<LoadedComponentExamples>>();

/**
 * Loads, validates and source-slices one component's examples file.
 * Returns `undefined` when the component has none — the caller falls back to
 * its single `demos.tsx` demo, which is the contract's stated default.
 */
export function loadExamplesFor(slug: string): Promise<LoadedComponentExamples> | undefined {
  const file = `${slug}.tsx`;
  if (!existsSync(join(EXAMPLES_DIR, file))) return undefined;
  let pending = cache.get(slug);
  if (pending === undefined) {
    pending = loadAndValidate(slug, file);
    cache.set(slug, pending);
  }
  return pending;
}

/**
 * The transitional file shape the loader also accepts — separate `meta` and
 * `examples` exports, with `intro` standing in for `description` — so files
 * written against the loose early brief keep building while they migrate to
 * the canonical `EXAMPLES` export. Everything still validates identically.
 */
interface TransitionalExample {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  intro?: LocalizedText;
  render: (locale: Locale) => LumoNode;
}

function normalizeModule(
  mod: {
    EXAMPLES?: ComponentExamples;
    meta?: Record<string, unknown>;
    examples?: readonly TransitionalExample[];
  },
  file: string,
): ComponentExamples {
  if (mod.EXAMPLES !== undefined) return mod.EXAMPLES;
  if (Array.isArray(mod.examples)) {
    const m = (mod.meta ?? {}) as {
      isNew?: boolean;
      composition?: string;
      parts?: ComponentExamples["meta"]["parts"];
      sourceFile?: string;
      title?: Record<Locale, string>;
      intro?: Record<Locale, string>;
      tier?: ComponentExamples["meta"]["tier"];
    };
    return {
      meta: {
        ...(m.title !== undefined ? { title: m.title } : {}),
        ...(m.intro !== undefined ? { intro: m.intro } : {}),
        ...(m.tier !== undefined ? { tier: m.tier } : {}),
        ...(m.isNew !== undefined ? { isNew: m.isNew } : {}),
        ...(m.composition !== undefined ? { composition: m.composition } : {}),
        ...(m.parts !== undefined ? { parts: m.parts } : {}),
        ...(m.sourceFile !== undefined ? { sourceFile: m.sourceFile } : {}),
      },
      examples: mod.examples.map((e) => ({
        id: e.id,
        title: e.title,
        ...((e.description ?? e.intro) !== undefined
          ? { description: e.description ?? e.intro }
          : {}),
        render: e.render,
      })),
    };
  }
  throw new Error(
    `[examples] ${file}: no \`export const EXAMPLES\` (and no transitional ` +
      `meta/examples pair). The contract in examples/_system/types.ts requires ` +
      `the EXAMPLES named export.`,
  );
}

async function loadAndValidate(slug: string, file: string): Promise<LoadedComponentExamples> {
  // A dynamic import whose specifier keeps a static prefix and a static
  // extension — the shape bundlers turn into a directory context, which is
  // what lets discovery-by-existence still be bundled statically.
  const mod = (await import(`../examples/${slug}.tsx`)) as Parameters<
    typeof normalizeModule
  >[0];
  const spec = normalizeModule(mod, file);
  if (spec.examples.length === 0) {
    throw new Error(
      `[examples] ${file}: the examples array is empty. A file with nothing to ` +
        `show should not exist — delete it and the page falls back to its demo.`,
    );
  }

  const fileText = readFileSync(join(EXAMPLES_DIR, file), "utf8");
  const seen = new Set<string>();
  const examples: LoadedExample[] = [];
  for (const example of spec.examples) {
    if (!/^[a-z][a-z0-9-]*$/.test(example.id)) {
      throw new Error(
        `[examples] ${file}: example id "${example.id}" is not kebab-case. Ids ` +
          `become page anchors (#example-<id>) and rail fragments.`,
      );
    }
    if (seen.has(example.id)) {
      throw new Error(`[examples] ${file}: duplicate example id "${example.id}".`);
    }
    seen.add(example.id);
    assertLocalizedText(example.title, file, `examples["${example.id}"].title`);
    if (example.description !== undefined) {
      assertLocalizedText(example.description, file, `examples["${example.id}"].description`);
    }
    examples.push({
      id: example.id,
      title: example.title,
      description: example.description,
      render: example.render,
      // Throws loudly when the convention is broken — see _system/extract.ts.
      source: extractExampleSource(fileText, file, example.id),
    });
  }

  const exported = uiExports();
  if (spec.meta.composition !== undefined) {
    assertKnownParts(
      compositionTags(spec.meta.composition),
      exported.all,
      file,
      "meta.composition",
    );
  }
  if (spec.meta.parts !== undefined) {
    for (const part of spec.meta.parts) {
      assertLocalizedText(part.description, file, `meta.parts["${part.name}"].description`);
    }
    assertKnownParts(
      spec.meta.parts.map((p) => p.name),
      exported.all,
      file,
      "meta.parts",
    );
  }

  const moduleName = spec.meta.sourceFile ?? `${slug}.tsx`;
  const moduleParts = (exported.byModule.get(moduleName) ?? []).filter((n) =>
    /^[A-Z]/.test(n),
  );

  return {
    slug,
    title: spec.meta.title,
    intro: spec.meta.intro,
    tier: spec.meta.tier,
    isNew: spec.meta.isNew === true,
    composition: spec.meta.composition,
    moduleParts,
    parts: spec.meta.parts,
    examples,
  };
}

/**
 * The slugs whose example files carry `isNew: true` — what drives the
 * sidebar's "new" dot. Reads ONLY the flag, deliberately not the full
 * `loadExamplesFor` validation: the sidebar renders on every page, and full
 * validation includes cross-file state (parts against index.ts exports) that
 * belongs to the component's own page — where it still fails the build
 * loudly. The sidebar asking "is it new" must not make every page hostage to
 * one component's half-merged exports.
 */
export async function newExampleSlugs(): Promise<ReadonlySet<string>> {
  const flags = await Promise.all(
    exampleSlugs().map(async (slug) => {
      const mod = (await import(`../examples/${slug}.tsx`)) as {
        EXAMPLES?: ComponentExamples;
        meta?: { isNew?: boolean };
      };
      const isNew = mod.EXAMPLES?.meta.isNew ?? mod.meta?.isNew;
      return isNew === true ? slug : undefined;
    }),
  );
  return new Set(flags.filter((s): s is string => s !== undefined));
}
