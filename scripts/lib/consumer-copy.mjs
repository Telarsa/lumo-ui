/**
 * Shared by `lumo` (scripts/lumo-cli.mjs) and the consumer smoke test
 * (scripts/smoke-consumer.mjs): how a registry file becomes a consumer's copy.
 * One implementation, so the smoke test proves the same bytes `lumo add` writes.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ROOT = new URL("../..", import.meta.url).pathname;

/**
 * Exact versions of the npm packages the copies import, read from THIS
 * checkout's `pnpm-workspace.yaml` catalog (shipped with the dev dependency), so
 * the consumer installs what Lumo was verified against — not "latest".
 * @returns {Promise<Map<string, string>>}
 */
export async function catalogVersions() {
  const text = await readFile(join(ROOT, "pnpm-workspace.yaml"), "utf8").catch(() => "");
  /** @type {Map<string, string>} */
  const out = new Map();
  let inCatalog = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "").trimEnd();
    if (/^catalog:\s*$/.test(line)) { inCatalog = true; continue; }
    if (inCatalog && /^\S/.test(line)) inCatalog = false;
    if (!inCatalog) continue;
    const m = /^\s+['"]?(@?[^'":\s]+)['"]?:\s*['"]?([^'"\s]+)['"]?\s*$/.exec(line);
    if (m?.[1] !== undefined && m[2] !== undefined) out.set(m[1], m[2]);
  }
  return out;
}

/**
 * Where a registry file lands in the consumer: `<dir>/ui/<basename>` for ui items,
 * `<dir>/blocks/<basename>` for blocks (the registry's `target` says which, with
 * `components/` as its root, which `--dir` replaces).
 */
export function targetOf(/** @type {{ path: string; target?: string }} */ file, /** @type {string} */ to, /** @type {string} */ dir) {
  const target = file.target ?? `components/ui/${file.path.split("/").pop()}`;
  return join(to, dir, target.replace(/^components\//, ""));
}

/**
 * `@lumo-ui/ui` symbol → source module, from packages/ui/src/index.ts, so a block's
 * `import { Button, type ButtonProps } from "@lumo-ui/ui"` can be rewritten to the
 * consumer's copies. Consumers cannot install `@lumo-ui/ui` (a workspace package).
 * @returns {Promise<Map<string, string>>}
 */
export async function uiSymbolMap() {
  const text = await readFile(join(ROOT, "packages/ui/src/index.ts"), "utf8");
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"\.\/([^"]+)"/g)) {
    const [, list, module] = m;
    if (list === undefined || module === undefined) continue;
    for (const spec of list.split(",")) {
      const name = spec.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
      if (name) map.set(name, module);
    }
  }
  return map;
}

/** Registry item that owns a ui source file. */
export function itemForModule(/** @type {string} */ module, /** @type {any} */ registry) {
  return registry.items.find((/** @type {any} */ i) => (i.files ?? []).some((/** @type {any} */ f) => f.path === `packages/ui/src/${module}`))?.name;
}

/** The ui items and sibling blocks a block imports (registry.json records none for blocks). */
export async function blockDependencies(/** @type {any} */ item, /** @type {any} */ registry) {
  const symbols = await uiSymbolMap();
  /** @type {Set<string>} */
  const deps = new Set();
  for (const file of item.files ?? []) {
    const text = await readFile(join(ROOT, file.path), "utf8");
    for (const m of text.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"@lumo-ui\/ui"/g)) {
      for (const spec of (m[1] ?? "").split(",")) {
        const name = spec.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]?.trim();
        const module = name ? symbols.get(name) : undefined;
        const owner = module ? itemForModule(module, registry) : undefined;
        if (owner) deps.add(owner);
      }
    }
    for (const m of text.matchAll(/from\s+"\.\/([a-z0-9-]+)\.tsx?"/g)) {
      const sibling = m[1];
      if (sibling !== undefined && registry.items.some((/** @type {any} */ i) => i.name === sibling)) deps.add(sibling);
    }
  }
  return [...deps];
}

/** Rewrite a block's `@lumo-ui/ui` imports to relative imports of the copies (`../ui/<module>`), preserving `type` modifiers and aliases. */
export async function rewriteBlockImports(/** @type {string} */ text) {
  const symbols = await uiSymbolMap();
  return text.replace(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+"@lumo-ui\/ui";?/g, (_all, typeOnly, list) => {
    /** @type {Map<string, string[]>} */
    const byModule = new Map();
    for (const raw of list.split(",")) {
      const spec = raw.trim();
      if (!spec) continue;
      const name = spec.replace(/^type\s+/, "").split(/\s+as\s+/)[0]?.trim() ?? "";
      const module = symbols.get(name);
      if (!module) throw new Error(`block imports ${name} from @lumo-ui/ui, which packages/ui/src/index.ts does not export`);
      const arr = byModule.get(module) ?? [];
      arr.push(spec);
      byModule.set(module, arr);
    }
    return [...byModule.entries()].map(([module, specs]) => `import ${typeOnly ?? ""}{ ${specs.join(", ")} } from "../ui/${module}";`).join("\n");
  });
}

