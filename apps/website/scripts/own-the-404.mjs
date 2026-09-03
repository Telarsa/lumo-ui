/**
 * Own the export's not-found shells.
 *
 * `output: "export"` writes Next's INTERNAL not-found shell to `404.html`,
 * `404/index.html` and `_not-found/index.html` — English, no `lang`, no `dir`.
 * A static export has no server, so those three paths are the whole story here:
 * a host serves whatever bytes sit at them, and this copies the site's own
 * Persian shell over all three after the build.
 *
 * This file used to say "the examples cannot fix it; a static export CAN",
 * which was wrong twice. `_not-found` renders UNDER the root layout, so any app
 * whose root layout emits `<html lang dir>` already ships a clean one — the
 * consumer apps this was measured against always did. And a server build's shells ARE fixable, by
 * rewriting the bytes `pages-manifest.json` points the server at; that is what
 * `scripts/own-error-shells.mjs` does, and it is shipped for consumers.
 *
 * This script stays separate because an export has no `.next/server` tree to
 * rewrite — different layout, same idea.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = join(ROOT, "404-shell.html");
for (const rel of ["404.html", "404/index.html", "_not-found/index.html"]) {
  const dest = join(ROOT, "out", rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(SHELL, dest);
}
console.log("  own-the-404: 3 shell(s) replaced with the site's own");

/*
 * The old locale tags, kept alive.
 *
 * The routes were /en-US and /fa-IR until 3 Sep 2026. A static export cannot
 * answer a redirect, so every page under the new tag gets a twin under the
 * old one: a zero-delay meta refresh to the same path, which the gate skips
 * by design (a redirect's body is never read as a page). Bookmarks and old
 * links land where they always did.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";

const OLD = { en: "en-US", fa: "fa-IR" };
function pages(dir, base = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...pages(full, `${base}${entry}/`));
    else if (entry === "index.html") out.push(base);
  }
  return out;
}
let stubs = 0;
for (const [tag, old] of Object.entries(OLD)) {
  const from = join(ROOT, "out", tag);
  for (const rel of pages(from)) {
    const target = `/${tag}/${rel}`;
    const dest = join(ROOT, "out", old, rel, "index.html");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(
      dest,
      `<!doctype html><html lang="${tag}"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${target}"><title>Lumo UI</title></head><body><a href="${target}">${target}</a></body></html>\n`,
    );
    stubs += 1;
  }
}
console.log(`  own-the-404: ${stubs} redirect stub(s) under the old locale tags`);
