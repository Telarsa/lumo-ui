#!/usr/bin/env node

/**
 * Apply one visual/behavioral mutation to every @lumo-ui/ui implementation
 * module, one process at a time, and require the tests that import that module
 * to kill it. Source is restored byte-for-byte in a finally block after every
 * probe.
 *
 * The kill oracle is `vitest related <module>`: only tests that transitively
 * import the mutated file can grade it. The mutation floor test grades source
 * text with `fs`, not imports, so it can never certify its own mutation — an
 * earlier version of this campaign counted exactly that as a kill, which made
 * every result circular. A module whose mutant no related test observes is
 * reported as `unobserved`, not `killed`: the campaign's job is to name the
 * gap, not to round it away.
 *
 * Not part of the local `verify` chain: a full run spawns one vitest process
 * per module. CI runs it in a separate job so this expensive floor remains
 * enforced without doubling the critical path of the normal verification job.
 * Run it locally as a campaign: `pnpm run mutation:components`.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "..");
const sourceDirectory = join(repository, "packages/ui/src");
const files = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx") && !file.endsWith(".type-test.tsx"))
  .sort();

// The registry is the declared catalogue. A hardcoded count rotted once
// already (asserted 99 against a directory that had grown to 111, which
// meant the campaign could not execute at all and nobody noticed), so the
// invariant is directory ↔ registry agreement, which updates itself.
/** @type {{ items: Array<{ type: string }> }} */
const registry = JSON.parse(readFileSync(join(repository, "registry.json"), "utf8"));
const declared = registry.items.filter((item) => item.type === "registry:ui").length;
if (files.length !== declared) {
  throw new Error(
    `packages/ui/src has ${files.length} implementation modules but ` +
      `registry.json declares ${declared} registry:ui items`,
  );
}

/**
 * @param {string} file
 * @param {string} source
 */
function mutate(file, source) {
  if (file === "form-state.tsx") {
    return {
      operator: "remove submit cancellation",
      source: source.replace("event.preventDefault();", "void event.defaultPrevented;"),
    };
  }
  if (file === "provider.tsx") {
    return {
      operator: "disconnect direction from locale",
      source: source.replace(
        "<DirectionProvider direction={direction(locale)}>",
        '<DirectionProvider direction={"ltr"}>',
      ),
    };
  }
  if (file === "cascader.tsx") {
    return {
      operator: "replace locale-shaped column number with a raw JavaScript number",
      source: source.replace("formatNumber(columnIndex + 1, locale)", "String(columnIndex + 1)"),
    };
  }
  if (file === "data-grid.tsx") {
    return {
      operator: "disconnect the validation reason from its invalid editor",
      source: source.replace(
        "aria-errormessage={error === null ? undefined : errorId}",
        "aria-errormessage={undefined}",
      ),
    };
  }
  if (file === "tree-select.tsx") {
    return {
      operator: "derive multiple-mode parent state from descendants instead of its value",
      source: source.replace(
        'mode === "checkbox" ? state === "checked" : selected.has(node.value)',
        'state === "checked"',
      ),
    };
  }
  if (file === "combobox.tsx" || file === "multi-select.tsx") {
    return {
      operator: "make an already-relabelled dismiss sentinel unreachable on prop updates",
      source: source.replace(', [${ENGINE_DISMISS_MARKER}]', ""),
    };
  }
  return {
    operator: "remove rendered class assignments",
    source: source.replaceAll("className=", "data-lumo-mutant="),
  };
}

/**
 * @type {Array<{
 *   file: string;
 *   operator: string;
 *   status: "killed" | "survived" | "unobserved" | "invalid";
 *   durationMs: number;
 *   stdout?: string;
 *   stderr?: string;
 * }>}
 */
const results = [];
const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]?.split(",")
  : undefined;

for (const file of files) {
  if (only && !only.includes(file)) continue;
  const path = join(sourceDirectory, file);
  const original = readFileSync(path, "utf8");
  const mutant = mutate(file, original);
  if (mutant.source === original) {
    results.push({ file, operator: mutant.operator, status: "invalid", durationMs: 0 });
    continue;
  }

  const started = performance.now();
  /** @type {ReturnType<typeof spawnSync> | undefined} */
  let run;
  try {
    writeFileSync(path, mutant.source);
    run = spawnSync(
      "pnpm",
      ["exec", "vitest", "related", `src/${file}`, "--run", "--reporter=dot"],
      {
        cwd: join(repository, "packages/ui"),
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "0" },
      },
    );
  } finally {
    writeFileSync(path, original);
  }

  const output = `${run?.stdout ?? ""}${run?.stderr ?? ""}`;
  const unobserved = /No test files found/i.test(output);
  const killed = !unobserved && run?.status !== 0;
  const status = unobserved ? "unobserved" : killed ? "killed" : "survived";
  results.push({
    file,
    operator: mutant.operator,
    status,
    durationMs: Math.round(performance.now() - started),
    ...(status === "killed"
      ? {}
      : { stdout: String(run?.stdout ?? ""), stderr: String(run?.stderr ?? "") }),
  });
  process.stdout.write(`${status.toUpperCase()} ${file}\n`);
}

const summary = {
  generatedAt: new Date().toISOString(),
  population: results.length,
  killed: results.filter((result) => result.status === "killed").length,
  survived: results.filter((result) => result.status === "survived").length,
  unobserved: results.filter((result) => result.status === "unobserved").length,
  invalid: results.filter((result) => result.status === "invalid").length,
  results,
};

const outputFlag = process.argv.indexOf("--output");
if (outputFlag >= 0) {
  const output = process.argv[outputFlag + 1];
  if (!output) throw new Error("--output requires a path");
  writeFileSync(resolve(repository, output), `${JSON.stringify(summary, null, 2)}\n`);
}

process.stdout.write(
  `\n${summary.killed}/${summary.population} killed; ${summary.survived} survived; ` +
    `${summary.unobserved} unobserved; ${summary.invalid} invalid\n`,
);

if (summary.survived > 0 || summary.unobserved > 0 || summary.invalid > 0) {
  process.exitCode = 1;
}
