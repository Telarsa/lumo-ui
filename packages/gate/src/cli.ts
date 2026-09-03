#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  addCoverage,
  EMPTY_COVERAGE,
  exceedsExemptCeiling,
  format,
  formatCoverage,
  gradeHtml,
  missingDenseDigitFloors,
} from "./index.ts";
import { RULES, persianDigitFloor } from "./rules.ts";

const root = process.argv[2];
if (!root) {
  console.error("usage: lumo-gate <build-output-dir> [floors.json]");
  process.exit(2);
}

// The digit floors are per-path and belong to the SITE, so they arrive as a
// JSON file argument. No file → the floor rule is not constructed, visibly here
// (it once had a factory, fixture and docs and was never in RULES at all).
const floorsPath = process.argv[3];

/**
 * Keys beginning with "//" are comments, not floors — JSON has no other way.
 * Keys beginning with "@" are settings rather than paths; a path is always a
 * locale segment and a filename, so the two can never collide.
 */
async function readFloors(
  path: string,
): Promise<{
  floors: Record<string, number>;
  exemptCeiling: number | undefined;
  minDocuments: number | undefined;
  declaredLocales: ReadonlySet<string> | undefined;
  settings: number;
}> {
  const raw = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  const ceiling = raw["@exempt-ceiling"];
  const minDocuments = raw["@min-documents"];
  const locales = raw["@locales"];
  /*
   * Any `@` key is a SETTING, including ones this file does not read —
   * `@locales` is consumed by `grade-app` before the gate ever runs. Counting
   * only the settings understood here rejected a valid floors file as
   * "declares nothing", which is how `@locales` failed on first use.
   */
  const settings = Object.keys(raw).filter((k) => k.startsWith("@")).length;
  return {
    floors: Object.fromEntries(
      Object.entries(raw).filter(
        ([k, v]) => !k.startsWith("//") && !k.startsWith("@") && typeof v === "number",
      ),
    ) as Record<string, number>,
    exemptCeiling: typeof ceiling === "number" ? ceiling : undefined,
    minDocuments: typeof minDocuments === "number" ? minDocuments : undefined,
    declaredLocales: Array.isArray(locales) ? new Set(locales.filter((l): l is string => typeof l === "string")) : undefined,
    settings,
  };
}

const rules = [...RULES];
let floorCount = 0;
let floorLedger: Record<string, number> = {};
let exemptCeiling: number | undefined;
let minDocuments: number | undefined;
let settings = 0;
let declaredLocales: ReadonlySet<string> | undefined;
if (floorsPath) {
  ({ floors: floorLedger, exemptCeiling, minDocuments, declaredLocales, settings } = await readFloors(floorsPath));
  const entries = Object.keys(floorLedger).length;
  /*
   * A file that declares NOTHING is the vacuous pass this check exists to
   * prevent. A file that declares only settings is not that: `@min-documents`
   * is an assertion in its own right, and an app with no number-dense route has
   * no digit floor to write but still wants its page count guarded. So the
   * refusal is "declares nothing at all", not "declares no floors".
   */
  if (entries === 0 && settings === 0) {
    console.error(`  ${floorsPath} declares no floors and no settings. An empty`);
    console.error("  floors file is the vacuous pass this rule exists to prevent.");
    process.exit(2);
  }
  // The digit-floor rule is constructed only when there are floors to enforce;
  // arming it over an empty ledger is what made it vacuous before.
  if (entries > 0) {
    rules.push(persianDigitFloor(floorLedger));
    console.log(`  persian-digit-floor armed for ${entries} route(s)`);
  }
  floorCount = entries;
  if (exemptCeiling !== undefined) {
    console.log(`  exempt-ceiling armed at ${String(exemptCeiling)}% of characters`);
  }
  if (minDocuments !== undefined) {
    console.log(`  min-documents armed at ${String(minDocuments)} page(s)`);
  }
  if (declaredLocales !== undefined) {
    console.log(`  locales declared: ${Array.from(declaredLocales).join(", ")} — no segment is guessed`);
  }
}

/**
 * Directories under the export that are EMBEDDED ASSETS, not documentation
 * pages, and are therefore not graded here.
 *
 * This is a scope decision, never an exemption from a rule: every rule still
 * runs, on every page. It is EMPTY as of §53. Its one entry was the Flutter web
 * shell the old component pages embedded in an iframe — a bootstrap document
 * that renders a CANVAS, with no DOM to grade and no locale segment to derive
 * one from, so handing it to the grader produced a crash rather than a
 * violation. The gallery it came from retired with the widget roster.
 *
 * Kept rather than deleted because the mechanism is the right one for the next
 * embedded asset, and because an empty list states the current answer out loud:
 * nothing under the export is exempt.
 */
const EMBEDDED_ASSET_DIRS = new Set<string>([]);

async function htmlFiles(dir: string, relative = ""): Promise<{ files: string[]; skipped: string[] }> {
  const files: string[] = [];
  const skipped: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (relative === "" && EMBEDDED_ASSET_DIRS.has(entry.name)) {
        skipped.push(entry.name);
        continue;
      }
      const nested = await htmlFiles(path, relative === "" ? entry.name : `${relative}/${entry.name}`);
      files.push(...nested.files);
      skipped.push(...nested.skipped);
    } else if (entry.name.endsWith(".html")) files.push(path);
  }
  return { files, skipped };
}

const { files, skipped: skippedAssetDirs } = await htmlFiles(root);
for (const dir of skippedAssetDirs) {
  console.log(`  lumo-gate: skipped ${dir}/ — an embedded application shell, not a documentation page (its canvas is graded by packages/mobile/test/)`);
}

// A gate that grades nothing and prints "clean" is worse than no gate. Refuse loudly.
if (files.length === 0) {
  console.error(`  lumo-gate found no .html under ${root}.`);
  console.error("  Refusing to report success on nothing.");
  process.exit(2);
}

/*
 * The same refusal, for a build that emitted SOME of its pages.
 *
 * "Nothing" was already caught. "Half" was not, and half is the likelier
 * accident: a content error that fails one route, a generator that throws
 * after the first shard, a filter that silently narrows the page list. The
 * gate then grades what survived, finds it clean, and reports success —
 * while the pages that would have failed are the ones that never got built.
 *
 * This is not hypothetical. A content edit here broke MDX parsing, the build
 * emitted zero pages, and the run reported "0 violations": the empty case
 * above caught it, but a build that had emitted 100 of 598 pages would have
 * gone green. `@min-documents` is the committed expectation, and like every
 * other floor in this file it lives in the repo being graded rather than in
 * the gate.
 */

const violations = [];
const graded = new Set<string>();
const pages: Array<{ path: string; html: string }> = [];
let coverage = EMPTY_COVERAGE;
/*
 * A REDIRECT IS NOT A PAGE.
 *
 * `grade-app` already skips Next's 3xx stubs, which it recognises from the
 * `.meta` sidecar beside each document. A STATIC export has no sidecar: a host
 * that cannot send a status expresses the same thing as a zero-delay
 * `<meta http-equiv="refresh">`, and Astro emits exactly that for every
 * configured redirect — 445 bytes, `noindex`, no `<html>` element at all.
 *
 * Grading one is grading a thing no reader reads. `lang-dir` fails it for want
 * of attributes it has no business carrying, and the only available fix is to
 * dress up a redirect as a page.
 *
 * The delay must be ZERO. A refresh after a pause is a real page that happens
 * to move on afterwards — the reader sees it, so the gate must too.
 *
 * Every skip is REPORTED by name. A silent skip is how a gate stops grading
 * something and nobody notices; that is the failure this whole file exists to
 * prevent, and it is not worth reintroducing to save a line of output.
 */
function redirectTarget(html: string): string | undefined {
  const tag = /<meta[^>]+http-equiv=["']?refresh["']?[^>]*>/i.exec(html)?.[0];
  if (tag === undefined) return undefined;
  const content = /content=["']([^"']*)["']/i.exec(tag)?.[1];
  if (content === undefined) return undefined;
  const [delay, ...rest] = content.split(";");
  if (Number(delay?.trim()) !== 0) return undefined;
  return /url=(.+)/i.exec(rest.join(";"))?.[1]?.trim();
}

/** @type {string[]} */
const redirects: string[] = [];
for (const file of files) {
  const rel = relative(root, file);
  const html = await readFile(file, "utf8");
  const target = redirectTarget(html);
  if (target !== undefined) {
    redirects.push(`${rel} -> ${target}`);
    continue;
  }
  graded.add(rel);
  pages.push({ path: rel, html });
  violations.push(...gradeHtml(rel, html, rules, { declaredLocales }));
  // Coverage prints, it never fails.
  coverage = addCoverage(coverage, rel, html, { declaredLocales });
}
for (const line of redirects) {
  console.log(`  lumo-gate: skipped ${line} — a zero-delay redirect, not a page`);
}

/*
 * The empty refusal again, now that skipping exists.
 *
 * The check above counts FILES, and passes the moment the directory holds any
 * .html at all. A directory of nothing but redirect stubs clears it, grades
 * zero documents, and reports clean — reintroducing, through the skip, exactly
 * the vacuous pass the file-count check was written to stop. A skip has to be
 * paired with this or it is a loophole.
 */
if (graded.size === 0) {
  console.error(`  lumo-gate graded no documents under ${root}.`);
  console.error(
    `  ${String(files.length)} file(s) were found and every one was skipped as a redirect.`,
  );
  console.error("  Refusing to report success on nothing.");
  process.exit(2);
}

/*
 * The floor counts documents actually GRADED, not files found. Redirect stubs
 * are skipped above, so counting files would let a build that emitted nothing
 * but redirects satisfy a floor it never really met.
 */
if (typeof minDocuments === "number" && graded.size < minDocuments) {
  console.error(
    `  lumo-gate graded ${String(graded.size)} document(s) under ${root}, ` +
      `below the committed floor of ${String(minDocuments)}.`,
  );
  console.error(
    "  A build that emits fewer pages than it used to has not got cleaner — it has got smaller.",
  );
  console.error(
    "  If the drop is deliberate, lower @min-documents in the floors file in the same commit.",
  );
  process.exit(2);
}


// A floor keyed to a path that no longer exists is a rule that silently stopped grading.
if (floorsPath) {
  for (const declared of Object.keys(floorLedger)) {
    if (!graded.has(declared)) {
      violations.push({
        rule: "persian-digit-floor",
        path: declared,
        detail: "floor declared for a path the build did not produce — stale floors file",
      });
    }
  }
  for (const missing of missingDenseDigitFloors(pages, floorLedger, 30, { declaredLocales })) {
    violations.push({
      rule: "persian-digit-floor",
      path: missing.path,
      detail:
        `number-dense route has ${String(missing.found)} visible native digits but no committed floor; ` +
        "add a reviewed baseline at about 55% of this count",
    });
  }
}

// The exemption's own anti-vacuity check. Run-level rather than per-document,
// like the stale-floor sweep above: one attribute on one page can exempt a
// subtree, but the question "how much of this site does the gate still read?"
// only has an answer across the whole build.
const over = exceedsExemptCeiling(coverage, exemptCeiling);
if (over) {
  violations.push({
    rule: "exempt-ceiling",
    path: "(whole build)",
    detail:
      `${over.fraction.toFixed(1)}% of characters in non-latn documents are exempt via ` +
      `data-lumo-latn, above the committed ceiling of ${String(over.ceiling)}%. ` +
      "Either the new islands are wrong, or the ceiling needs raising ON PURPOSE — " +
      "a number a person signed, not one that drifted.",
  });
}

console.log(format(violations));

/*
 * DISTINCT, alongside the instance count.
 *
 * Site chrome repeats on every page, so an instance count measures the size of
 * the export rather than the size of the problem. Measured on a live
 * six-language product, graded on first contact: 750 violations were 182
 * distinct defects, and one rule's 225 instances were TEN strings: a header,
 * a nav and a logo, on 44 routes. Reporting only the first number tells a
 * reader they have 750 things to fix and invites them to turn the gate off.
 *
 * The pair is the honest summary: the instance count is what a reader
 * encounters, the distinct count is what someone has to change.
 */
const distinct = new Set(violations.map((v) => `${v.rule}\u0000${v.detail ?? ""}`)).size;
const summary =
  distinct === violations.length
    ? `${violations.length} violation(s)`
    : `${violations.length} violation(s), ${distinct} distinct`;
// `graded.size`, not `files.length`: skipped redirects are found but not
// graded, and a summary that counts them overstates what was checked.
console.log(`  ${graded.size} document(s) graded, ${summary}`);
const scope = formatCoverage(coverage, floorCount);
if (scope) console.log(scope);
process.exit(violations.length ? 1 : 0);
