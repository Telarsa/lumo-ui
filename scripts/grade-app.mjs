#!/usr/bin/env node
/**
 * Grade a PRODUCT app's served bytes — the harness §50.5 said was owed.
 *
 *   node scripts/grade-app.mjs <built-html-dir> <locale> [floors.json]
 *
 *   node scripts/grade-app.mjs ../my-app/.next/server/app fa-IR
 *
 * The gate's CLI derives each document's locale from a PATH SEGMENT and throws
 * on a route it cannot derive — deliberately: an ungraded page is an
 * unprotected page, and trusting `<html lang>` instead would hide the founding
 * defect (`lang="en"` served on 55 Persian pages reads as "an English page,
 * nothing to check"). A single-locale product app has no locale segments at
 * all, so its operator DECLARES the locale here, and the declaration is made
 * physical: every document is staged under `<locale>/…` in a temp directory and
 * the unmodified CLI runs over the stage. `lang-dir` then grades each page's
 * own `<html lang>` AGAINST the declaration — on first contact this caught
 * Next's global-error shell shipping no `lang` and no `dir` at all.
 *
 * Every document with no locale segment of its own — the root stubs and error
 * shells included — is staged under the declared locale: an error page is
 * served to the same reader as every other page, and the gate's fa-IR default
 * for bare root documents must not override a declaration of `en`.
 *
 * Works on either build shape: a static export's `out/` or a default
 * `next build`'s `.next/server/app/` (the prerendered documents of a streaming
 * build — `gradeHtml` normalises React's `<div hidden id="S:n">` segment
 * containers itself, so streamed content is graded, not skipped).
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [dir, locale, floors] = process.argv.slice(2);
if (!dir || !locale) {
  console.error("usage: grade-app <built-html-dir> <locale> [floors.json]");
  console.error("  e.g. grade-app path/to/.next/server/app fa-IR");
  process.exit(2);
}


/**
 * True when a path segment already names a language (`fa`, `en-US`, `de`,
 * `zh-Hant-TW`) — the same shape test the gate's own `localeForPath` applies.
 * Such a document keeps its path: staging it under the DECLARED locale would
 * override its own segment (the outer segment wins), so a multi-locale app's
 * `/en/` pages would silently be graded as the declared language.
 * @param {string} rel
 */
function carriesLocaleSegment(rel) {
  return rel.split("/").slice(0, -1).some(isLanguageTag);
}

/** Built once; constructing an Intl.DisplayNames per call is expensive. */
const LANGUAGE_NAMES = new Intl.DisplayNames(["en"], { type: "language", fallback: "none" });

/**
 * THE APP'S OWN LOCALES, WHEN IT DECLARES THEM — because guessing has a floor.
 *
 * `isLanguageTag` below asks ICU whether a segment is an assigned language, and
 * that fixed `/how`, `/map`, `/job` and `/api`. It cannot fix `/pro`: `pro` IS
 * an assigned code — Old Provençal — so a pricing page was staged as its own
 * locale and then failed `lang-dir` for declaring `en` when the route "said"
 * `pro`. `/kept`, `/search` and `/offline` are safe only by being too long.
 *
 * No amount of cleverness distinguishes a product route from a rare language,
 * because nothing in the PATH does. The app knows, so let it say:
 *
 *     { "@locales": ["en", "de", "fa"] }
 *
 * Declared, the list is exhaustive and the guess never runs. Absent, behaviour
 * is exactly as before — this is a way out of the ambiguity, not a new
 * requirement.
 * @type {Set<string> | undefined}
 */
let declaredLocales;
if (floors) {
  try {
    const raw = JSON.parse(readFileSync(resolve(floors), "utf8"));
    if (Array.isArray(raw["@locales"])) declaredLocales = new Set(raw["@locales"]);
  } catch {
    // A malformed floors file is the gate's problem to report, not this script's.
  }
}

/**
 * Same test the gate applies, and for the same reason: BCP-47's grammar accepts
 * every well-formed 2-3 letter subtag, so `/how`, `/map`, `/job` and `/api`
 * were all being staged as their own "locale" instead of under the declared
 * one. The code must also be ASSIGNED — `fallback: "none"` returns undefined
 * when ICU has no language for it. See packages/gate/src/index.ts.
 * @param {string} seg
 */
function isLanguageTag(seg) {
  if (declaredLocales !== undefined) return declaredLocales.has(seg);
  const TAG = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?$/;
  if (!TAG.test(seg)) return false;
  try {
    if (Intl.getCanonicalLocales(seg).length !== 1) return false;
    return LANGUAGE_NAMES.of(new Intl.Locale(seg).language) !== undefined;
  } catch {
    return false;
  }
}

/**
 * @param {string} base
 * @param {string} [prefix]
 * @returns {Generator<string>}
 */
function* htmlFiles(base, prefix = "") {
  for (const entry of readdirSync(join(base, prefix), { withFileTypes: true })) {
    const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) yield* htmlFiles(base, rel);
    else if (entry.name.endsWith(".html")) yield rel;
  }
}

/**
 * A prerendered document whose route answers with a REDIRECT.
 *
 * `redirect()` in a page leaves an `.html` artifact behind, but no reader ever
 * receives its body: Next writes a `.meta` sidecar carrying the status and
 * `location`, and the server answers 307 from that. One consumer app's
 * `/console/services` is one — fifteen lines that forward to
 * `/console/catalog` — and its leftover body is Next's error shell, so grading
 * it reported two `lang-dir` violations against a page nobody can see.
 *
 * This is the same rule as everywhere else in this tool, pointed the other way:
 * grade what a reader RECEIVES. Rewriting a copy that is never served would be
 * a green gate over a broken site; grading a body that is never served is a red
 * gate over a working one.
 *
 * Skipped documents are COUNTED and reported, never silently dropped — an
 * ungraded page is an unprotected page, and a skip nobody is told about is how
 * a gate grades 3 pages of 55 and calls it green.
 * @param {string} base absolute path to the document, minus `.html`
 */
function redirectsAway(base) {
  try {
    const meta = JSON.parse(readFileSync(`${base}.meta`, "utf8"));
    return typeof meta.status === "number" && meta.status >= 300 && meta.status < 400;
  } catch {
    return false;
  }
}

const source = resolve(dir);
const stage = mkdtempSync(join(tmpdir(), "lumo-grade-"));
let staged = 0;
/** @type {string[]} */
const redirected = [];
for (const rel of htmlFiles(source)) {
  // EVERY unsegmented document goes under the declared locale — the root stubs
  // (index.html, 404, _not-found, _global-error) included. The gate's own
  // default grades bare root docs as fa-IR, which is wrong the moment the
  // declared locale is anything else (a trilingual consumer defaults to `en`);
  // staging them under the declaration makes the operator's word the single
  // source.
  /*
   * Next emits a locale's ROOT page as a bare `<locale>.html` (`de.html` for
   * `/de`) — no directory segment, so it would be staged under the DECLARED
   * locale and graded as the wrong language. A basename that is itself a
   * language tag stages as that locale's index document instead.
   */
  const base = rel.replace(/\.html$/, "");
  if (redirectsAway(join(source, base))) {
    redirected.push(rel);
    continue;
  }
  const dest = carriesLocaleSegment(rel)
    ? join(stage, rel)
    : !rel.includes("/") && isLanguageTag(base)
      ? join(stage, base, "index.html")
      : join(stage, locale, rel);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(source, rel), dest);
  staged += 1;
}
if (staged === 0) {
  console.error(`  grade-app found no .html under ${source}.`);
  console.error('  A standalone server build emits none — this needs a static export or a prerendering build.');
  process.exit(2);
}
console.log(`  grade-app: staged ${staged} document(s) from ${relative(process.cwd(), source)} as ${locale}`);
if (redirected.length) {
  console.log(`  grade-app: skipped ${redirected.length} redirect stub(s) — the route answers 3xx, so the body is never served: ${redirected.join(", ")}`);
}

// The COMMITTED JavaScript build, not the TypeScript source — the same reason
// `lumo-cli.mjs` gives four files away and the same fix. Node refuses to strip
// types under node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), which
// is exactly where a consumer's copy of this checkout lives: the documented
// install is a git dependency, so `node ./node_modules/lumo-ui/scripts/grade-app.mjs`
// printed its own success line and then died in Node internals for EVERY
// consumer, on the one command README, llms.txt, the skill and
// docs/agent-consumer.md all name as how you grade a product.
//
// It worked here and only here, because a checkout is not under node_modules.
// `gate:dist` in verify keeps dist fresh, which is what makes this safe.
const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "gate", "dist", "cli.js");
const result = spawnSync(
  process.execPath,
  [cli, stage, ...(floors ? [resolve(floors)] : [])],
  { stdio: "inherit" },
);
rmSync(stage, { recursive: true, force: true });
process.exit(result.status ?? 1);
