/**
 * The Mobile side of a component page: `/components/<slug>/mobile/` exists for
 * every `examples/_native/<slug>.tsx`. Discovery by existence, like the web
 * examples; the client file beside it holds the renders (React Native
 * components hold state, so they are client components) and is the text the
 * Code tab shows, sliced by function name. Props come from api-reference.json's
 * `native/<module>` entries — generated, never hand-typed.
 *
 * Authoring convention (no README in that folder: the examples loader's dynamic
 * import makes Turbopack bundle everything under src/examples): each
 * `<slug>.client.tsx` is `"use client"` and exports
 * `function <Name>({ locale }: { locale: Locale }) { … }` ending with `}` at
 * column 0; `<slug>.tsx` (server) lists them with `source: "<Name>"`. The
 * provider is the page's (`NativeStage`), as `LumoProvider` is on the web pages.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentType } from "react";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import type { LocalizedText } from "@/examples/_system/types";
import type { GeneratedApiGroup } from "@/lib/examples-loader";

const NATIVE_DIR = join(process.cwd(), "src", "examples", "_native");
const API_REFERENCE = join(process.cwd(), "..", "..", "api-reference.json");

export interface NativeExample {
  /** kebab-case, unique in the file; the section anchor `#example-<id>`. */
  id: string;
  title: LocalizedText;
  description?: LocalizedText | undefined;
  /** A COMPONENT from `<slug>.client.tsx` — `export function <Name>({ locale })`. */
  render: ComponentType<{ locale: Locale }>;
  /**
   * The exported function's NAME in `<slug>.client.tsx`, for the source slice.
   * Written out because a client reference seen from the server does not carry
   * the function's name.
   */
  source: string;
}

export interface NativeExamplesMeta {
  /** The module inside `packages/native/src`, e.g. `button.tsx`. */
  module: string;
  /** One paragraph on what differs on native. Both locales. */
  intro?: LocalizedText | undefined;
  /** Contract notes worth stating beside the examples. Both locales. */
  notes?: LocalizedText | undefined;
}

export interface NativeComponentExamples {
  meta: NativeExamplesMeta;
  examples: readonly NativeExample[];
}

export interface LoadedNativeExample extends NativeExample {
  source: string;
}

export interface LoadedNativeExamples {
  slug: string;
  meta: NativeExamplesMeta;
  examples: readonly LoadedNativeExample[];
  api: readonly GeneratedApiGroup[];
}

/** Every slug that has a Mobile side. */
export function nativeSlugs(): string[] {
  if (!existsSync(NATIVE_DIR)) return [];
  return readdirSync(NATIVE_DIR)
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".client.tsx") && !f.includes(".test."))
    .map((f) => f.slice(0, -".tsx".length))
    .sort();
}

export function hasNative(slug: string): boolean {
  return existsSync(join(NATIVE_DIR, `${slug}.tsx`));
}

/** `export function <Name>(` … up to the first `}` at column 0 — the convention every native example follows. */
function sliceFunction(clientText: string, name: string, file: string): string {
  const match = new RegExp(`^export function ${name}\\([\\s\\S]*?^\\}\\n`, "m").exec(clientText);
  if (match === null) {
    throw new Error(`[native examples] ${file}: no \`export function ${name}(…) { … }\` ending with \`}\` at column 0`);
  }
  return match[0].replace(/^export /, "").trimEnd();
}

const cache = new Map<string, Promise<LoadedNativeExamples>>();

export function loadNativeExamples(slug: string): Promise<LoadedNativeExamples> | undefined {
  if (!hasNative(slug)) return undefined;
  let pending = cache.get(slug);
  if (pending === undefined) {
    pending = (async () => {
      const mod = (await import(`@/examples/_native/${slug}`)) as { default: NativeComponentExamples };
      const { meta, examples } = mod.default;
      const clientFile = `${slug}.client.tsx`;
      const clientText = readFileSync(join(NATIVE_DIR, clientFile), "utf8");
      const ids = new Set<string>();
      const loaded: LoadedNativeExample[] = examples.map((example) => {
        if (ids.has(example.id)) throw new Error(`[native examples] ${slug}: duplicate example id "${example.id}"`);
        ids.add(example.id);
        return { ...example, source: sliceFunction(clientText, example.source, clientFile) };
      });
      const api = JSON.parse(readFileSync(API_REFERENCE, "utf8")) as { modules: Record<string, readonly GeneratedApiGroup[]> };
      const groups = api.modules[`native/${meta.module}`];
      if (groups === undefined) {
        throw new Error(`[native examples] ${slug}: api-reference.json has no module native/${meta.module} — run node scripts/build-api-reference.mjs`);
      }
      return { slug, meta, examples: loaded, api: groups };
    })();
    cache.set(slug, pending);
  }
  return pending;
}
