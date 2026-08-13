#!/usr/bin/env node

/**
 * Apply one visual/behavioral mutation to every @lumo-ui/ui implementation
 * module, one process at a time, and require the mutation floor to kill it.
 * Source is restored byte-for-byte in a finally block after every probe.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "..");
const sourceDirectory = join(repository, "packages/ui/src");
const testFile = "src/component-mutation-floor.test.ts";
const files = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
  .sort();

if (files.length !== 98) {
  throw new Error(`Expected 98 implementation modules, found ${files.length}`);
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
  return {
    operator: "remove rendered class assignments",
    source: source.replaceAll("className=", "data-lumo-mutant="),
  };
}

/**
 * @type {Array<{
 *   file: string;
 *   operator: string;
 *   status: "killed" | "survived" | "invalid";
 *   durationMs: number;
 *   stdout?: string;
 *   stderr?: string;
 * }>}
 */
const results = [];
for (const file of files) {
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
      ["exec", "vitest", "run", testFile, "--reporter=dot"],
      {
        cwd: join(repository, "packages/ui"),
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "0" },
      },
    );
  } finally {
    writeFileSync(path, original);
  }

  const killed = run?.status !== 0;
  results.push({
    file,
    operator: mutant.operator,
    status: killed ? "killed" : "survived",
    durationMs: Math.round(performance.now() - started),
    ...(killed
      ? {}
      : {
          stdout: String(run?.stdout ?? ""),
          stderr: String(run?.stderr ?? ""),
        }),
  });
  process.stdout.write(`${killed ? "KILLED" : "SURVIVED"} ${file}\n`);
}

const summary = {
  generatedAt: new Date().toISOString(),
  population: files.length,
  killed: results.filter((result) => result.status === "killed").length,
  survived: results.filter((result) => result.status === "survived").length,
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
  `\n${summary.killed}/${summary.population} killed; ` +
    `${summary.survived} survived; ${summary.invalid} invalid\n`,
);

if (summary.survived > 0 || summary.invalid > 0) process.exitCode = 1;
