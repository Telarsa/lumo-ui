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

/**
 * Every component slug that has examples, alphabetical.
 *
 * ── TWO SHAPES, AND WHY BOTH ARE ACCEPTED ───────────────────────────────────
 *
 *     examples/button.tsx              a FILE
 *     examples/button/index.tsx        a DIRECTORY
 *
 * The directory form is what a component with twenty examples needs: `index.tsx`
 * still exports `EXAMPLES`, and it may import render functions from siblings
 * beside it, so a page's worth of examples stops being one file that only grows.
 *
 * Both are accepted rather than the file form being migrated away, and that is
 * deliberate. A component with three examples is not improved by a directory
 * containing one file, and a flag day across forty-three files buys nothing
 * except a large diff — `sourceOf` below resolves either shape, so a component
 * moves when it has a reason to.
 *
 * A slug may not exist in BOTH forms. That would be two files claiming one
 * page, and which one wins would depend on directory-read order — so it throws
 * rather than picking.
 */
export function exampleSlugs(): string[] {
  if (!existsSync(EXAMPLES_DIR)) return [];
  const entries = readdirSync(EXAMPLES_DIR, { withFileTypes: true });
  const named = (name: string) => !name.startsWith("_") && !name.includes(".test.");

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".tsx") && named(e.name))
    .map((e) => e.name.slice(0, -".tsx".length));

  const dirs = entries
    .filter(
      (e) =>
        e.isDirectory() && named(e.name) && existsSync(join(EXAMPLES_DIR, e.name, "index.tsx")),
    )
    .map((e) => e.name);

  const both = files.filter((slug) => dirs.includes(slug));
  if (both.length > 0) {
    throw new Error(
      `[examples] ${both.join(", ")}: both examples/<slug>.tsx and ` +
        `examples/<slug>/index.tsx exist. Two files claiming one page, with the ` +
        `winner decided by directory-read order. Delete one.`,
    );
  }

  return [...files, ...dirs].sort((a, b) => a.localeCompare(b));
}

/**
 * The path of a slug's entry module, whichever shape it is in.
 *
 * Returns `undefined` when the component has no examples at all — which is not
 * an error, it is the `coverage.ts` manifest's whole subject.
 */
export function sourceOf(slug: string): string | undefined {
  const flat = join(EXAMPLES_DIR, `${slug}.tsx`);
  if (existsSync(flat)) return flat;
  const nested = join(EXAMPLES_DIR, slug, "index.tsx");
  if (existsSync(nested)) return nested;
  return undefined;
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
  const path = sourceOf(slug);
  if (path === undefined) return undefined;
  // The name used in every error message: the shape the author actually wrote.
  const file = path.endsWith(`${slug}.tsx`) && !path.includes(`/${slug}/`)
    ? `${slug}.tsx`
    : `${slug}/index.tsx`;
  let pending = cache.get(slug);
  if (pending === undefined) {
    pending = loadAndValidate(slug, file, path);
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

async function loadAndValidate(
  slug: string,
  file: string,
  path: string,
): Promise<LoadedComponentExamples> {
  // A dynamic import whose specifier keeps a static prefix and a static
  // extension — the shape bundlers turn into a directory context, which is
  // what lets discovery-by-existence still be bundled statically.
  /*
   * TWO specifiers, both with a static prefix and a static extension — the
   * shape a bundler turns into a directory context. One dynamic specifier
   * covering both shapes would need a variable segment in the middle, which
   * defeats that, so the branch is here rather than in the string.
   */
  const mod = (
    file.endsWith("/index.tsx")
      ? await import(`../examples/${slug}/index.tsx`)
      : await import(`../examples/${slug}.tsx`)
  ) as Parameters<typeof normalizeModule>[0];
  const spec = normalizeModule(mod, file);
  if (spec.examples.length === 0) {
    throw new Error(
      `[examples] ${file}: the examples array is empty. A file with nothing to ` +
        `show should not exist — delete it and the page falls back to its demo.`,
    );
  }

  const fileText = readFileSync(path, "utf8");
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
      const nested = sourceOf(slug)?.endsWith("/index.tsx") === true;
      const mod = (
        nested
          ? await import(`../examples/${slug}/index.tsx`)
          : await import(`../examples/${slug}.tsx`)
      ) as {
        EXAMPLES?: ComponentExamples;
        meta?: { isNew?: boolean };
      };
      const isNew = mod.EXAMPLES?.meta.isNew ?? mod.meta?.isNew;
      return isNew === true ? slug : undefined;
    }),
  );
  return new Set(flags.filter((s): s is string => s !== undefined));
}
