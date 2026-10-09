/**
 * Preserve every exported document before calling Lumo v1's existing grader.
 * Its unsegmented root index otherwise collides with the real en/index.html.
 * No exported bytes are edited; only the temporary directory names differ.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function stageDocuments(source, target, locales = ["en", "fa"], defaultLocale = "en") {
  for (const locale of locales) {
    if (!existsSync(join(source, locale, "index.html"))) {
      throw new Error(`Missing exported ${locale} homepage`);
    }
  }
  const mappings = [];
  const destinations = new Set();
  function walk(folder, prefix = "") {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(folder, entry.name), relative);
      else if (entry.name.endsWith(".html")) {
        const localized = locales.includes(relative.split("/")[0]);
        const destination = localized ? relative : `${defaultLocale}/__unlocalized__/${relative}`;
        if (destinations.has(destination))
          throw new Error(`Duplicate staged document: ${destination}`);
        destinations.add(destination);
        const to = join(target, destination);
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(join(source, relative), to);
        mappings.push({ source: relative, destination });
      }
    }
  }
  walk(source);
  return mappings;
}

function main() {
  const source = resolve(process.argv[2] ?? join(app, "out"));
  const floors = resolve(process.argv[3] ?? join(app, "gate.floors.json"));
  const stage = mkdtempSync(join(tmpdir(), "telarsa-website-grade-"));
  try {
    const config = JSON.parse(readFileSync(floors, "utf8"));
    const locales = config["@locales"];
    if (!Array.isArray(locales) || !locales.length || !locales.includes("en")) {
      throw new Error("Declare the site locales, including default en, in gate.floors.json");
    }
    const mappings = stageDocuments(source, stage, locales);
    console.log(
      `grade-static: ${mappings.length} distinct HTML documents; root cannot overwrite English`,
    );
    const result = spawnSync(
      process.execPath,
      [join(app, "node_modules/lumo-ui/scripts/grade-app.mjs"), stage, "en", floors],
      { stdio: "inherit" },
    );
    process.exitCode = result.status ?? 1;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
