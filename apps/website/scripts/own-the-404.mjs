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
