import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function workerConfigFaults(config) {
  const faults = [];
  if (config.main !== "apps/website/worker.mjs") faults.push("Production Worker entry is missing or changed.");
  if (config.assets?.binding !== "ASSETS") faults.push("ASSETS binding is missing or changed.");
  if (config.assets?.run_worker_first !== true) faults.push("Worker must run before matching static assets.");
  if (config.assets?.directory !== "./apps/website/out") faults.push("Static export directory is missing or changed.");
  if (config.assets?.html_handling !== "auto-trailing-slash") faults.push("Canonical static page handling is missing or changed.");
  if (config.assets?.not_found_handling !== "404-page") faults.push("Static 404 handling is missing or changed.");
  return faults;
}

export function readWorkerConfig() {
  const source = readFileSync(new URL("../../../wrangler.jsonc", import.meta.url), "utf8");
  return JSON.parse(source.replace(/^\s*\/\/.*$/gm, ""));
}

function main() {
  const faults = workerConfigFaults(readWorkerConfig());
  if (!existsSync(new URL("../worker.mjs", import.meta.url))) faults.push("Production Worker source is missing.");
  if (faults.length) throw new Error(faults.join("\n"));
  console.log("Worker verified: production origin guard runs before ASSETS; static slash/404 handling retained.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
