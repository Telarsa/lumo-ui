import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, type BuiltinLocale as Locale, type LumoNode } from "@lumo-ui/core";
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
 * The example-file loader. SERVER-ONLY — it reads directories and file text
 * during `next build` (static export, so "server" means the build).
 *
 * Discovery is BY EXISTENCE (`src/examples/*.tsx`; underscore names are the
 * system's own). Loading VALIDATES loudly at build time — `EXAMPLES` present,
 * kebab-case unique ids, every localized string in EVERY locale, extractable
 * source, every named part a real `packages/ui/src/index.ts` export — and a
 * violation throws rather than degrading. The module cache is per-build.
 */

const EXAMPLES_DIR = join(process.cwd(), "src", "examples");
const UI_INDEX = join(process.cwd(), "..", "..", "packages", "ui", "src", "index.ts");
const API_REFERENCE = join(process.cwd(), "..", "..", "api-reference.json");

export interface GeneratedApiProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface GeneratedApiGroup {
  name: string;
  props: readonly GeneratedApiProp[];
}

interface GeneratedApiReference {
  version: number;
  modules: Record<string, readonly GeneratedApiGroup[]>;
}

const generatedApi = JSON.parse(readFileSync(API_REFERENCE, "utf8")) as GeneratedApiReference;
if (generatedApi.version !== 1) {
  throw new Error(`[examples] unsupported api-reference.json version ${generatedApi.version}`);
}

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
  /** Page identity — title and intro become the page header, tier places it in the sidebar (see catalog.ts). */
  title?: Record<Locale, string> | undefined;
  intro?: Record<Locale, string> | undefined;
  tier?: "form" | "display" | "overlay" | "navigation" | "feedback" | "layout" | "data" | undefined;
  isNew: boolean;
  usage?: { when: Record<Locale, string>; whenNot: Record<Locale, string> } | undefined;
  /**
   * The component's module inside `packages/ui/src` — `meta.sourceFile` when
   * set, else `<slug>.tsx`. The catalog reads the source panel's bytes from it.
   */
  module: string;
  composition?: string | undefined;
  /** Value exports of the component's own module — the derived parts list. */
  moduleParts: readonly string[];
  /** Exported props and their resolved types, generated from the TypeScript checker. */
  api: readonly GeneratedApiGroup[];
  parts?: readonly ExamplePart[] | undefined;
  examples: readonly LoadedExample[];
}

/**
 * Every component slug that has examples, alphabetical.
 *
 * Two shapes are accepted — `examples/button.tsx` (a FILE) or
 * `examples/button/index.tsx` (a DIRECTORY, for a component whose examples
 * outgrow one file); `sourceOf` resolves either. A slug in BOTH forms throws:
 * which one won would depend on directory-read order.
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
 * Returns `undefined` when the component has none — and a component with no
 * examples file has no page (see catalog.ts).
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
      usage?: ComponentExamples["meta"]["usage"];
    };
    return {
      meta: {
        ...(m.usage !== undefined ? { usage: m.usage } : {}),
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
  // A dynamic import with a static prefix and extension — the shape bundlers
  // turn into a directory context, so discovery-by-existence still bundles.
  /*
   * TWO specifiers: one covering both shapes would need a variable middle
   * segment, which defeats the directory context, so the branch is here.
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
  /*
   * Throws, never `?? []`: a module the barrel does not re-export (or exports
   * in a form `parseExportedNames` cannot read — only `export { … } from` is
   * parsed; `examples-loader.test.ts` pins that the barrel has nothing else)
   * would otherwise render a page as though the component had no parts.
   */
  const moduleExports = exported.byModule.get(moduleName);
  if (moduleExports === undefined) {
    throw new Error(
      `[examples] ${file}: nothing in packages/ui/src/index.ts re-exports ` +
        `"./${moduleName}". Either the component is not exported from the ` +
        `barrel — in which case no consumer can import it — or the barrel ` +
        `exports it in a form parseExportedNames cannot read (it matches ` +
        `\`export { … } from "./module"\` and nothing else). Fix the barrel, or ` +
        `set meta.sourceFile if the parts live in a differently-named module.`,
    );
  }
  const moduleParts = moduleExports.filter((n) => /^[A-Z]/.test(n));
  const api = generatedApi.modules[moduleName];
  if (api === undefined || api.length === 0) {
    throw new Error(
      `[examples] ${file}: api-reference.json has no exported Props group for ` +
        `${moduleName}. Run \`node scripts/build-api-reference.mjs\`; if it stays ` +
        `empty, export the component's public Props type from packages/ui/src/index.ts.`,
    );
  }

  return {
    slug,
    title: spec.meta.title,
    intro: spec.meta.intro,
    tier: spec.meta.tier,
    isNew: spec.meta.isNew === true,
    usage: spec.meta.usage,
    module: moduleName,
    composition: spec.meta.composition,
    moduleParts,
    api,
    parts: spec.meta.parts,
    examples,
  };
}

/**
 * The slugs whose example files carry `isNew: true` — drives the sidebar's
 * "new" dot. Reads ONLY the flag, not the full `loadExamplesFor` validation,
 * so one component's half-merged exports cannot break every page's sidebar.
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
