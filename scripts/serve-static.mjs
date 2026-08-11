import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

/**
 * Serves the static export the way a host would.
 *
 * ═══ WHY `next start` IS NOT THE ANSWER, AND NEVER WILL BE HERE ═════════════
 *
 * `next.config.ts` sets `output: "export"`, and `next start` refuses to run
 * against an exported site — there is no server to start, because the whole
 * point is that there is no server. The gate grades `out/**` precisely because
 * those are the bytes a crawler, a JS-disabled reader and the first paint
 * receive, and a dev server would be grading something else.
 *
 * So `pnpm start` serves the export, and this file is what serves it.
 *
 * ═══ WHY IT IS WRITTEN OUT RATHER THAN INSTALLED ════════════════════════════
 *
 * The script it replaces was `python3 -m http.server -d out`, which works on
 * this machine and is three assumptions deep: that python3 exists, that it is
 * on PATH under that exact name, and that its handler's directory semantics
 * match the site's. The alternatives are a dependency (`serve`, `http-server`)
 * on a repo whose stated constraint is low disk, or `npx`, which needs the
 * network at run time. Sixty lines of `node:http` needs none of the three.
 *
 * ═══ THE TWO THINGS A NAIVE STATIC SERVER GETS WRONG FOR THIS SITE ══════════
 *
 *  1. **`trailingSlash: true`.** Every route is a DIRECTORY with an
 *     `index.html` in it, so `/fa/components/button/` is a directory read and
 *     `/fa/components/button` is a 404 unless it redirects. A host does that
 *     redirect; a naive server does not, and the difference shows up as links
 *     working from the nav and failing when typed.
 *
 *  2. **The 404 route is a real graded document.** `out/404.html` is prerendered
 *     Persian and `lumo-gate` grades it — `localeForPath` names it explicitly as
 *     a root document graded against the primary locale, because a 404 is
 *     user-facing text and is the one route nobody tests. Serving Node's own
 *     bare "Cannot GET" instead would hide the page the gate went out of its way
 *     to cover.
 *
 * ═══ PATH TRAVERSAL ════════════════════════════════════════════════════════
 *
 * The resolved path is checked to be inside the root before anything is opened.
 * This only ever serves a build output on a developer's own machine, but a
 * static server that will read `../../.ssh/id_rsa` when asked is not a thing to
 * leave lying in a repository, and the check is two lines.
 */

const ROOT = resolve(process.argv[2] ?? "apps/website/out");
const PORT = Number(process.env["PORT"] ?? process.argv[3] ?? 4173);

/**
 * Content types for what a static export actually contains.
 *
 * `charset=utf-8` on every text type is load-bearing rather than tidy: without
 * it a browser sniffs, and a sniffed Persian document renders as mojibake — the
 * failure would look exactly like an encoding bug in the site itself.
 */
const TYPES = new Map(
  Object.entries({
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  }),
);

/**
 * What a request resolves to: a file to stream, a redirect to issue, or nothing.
 *
 * Three outcomes rather than a nullable path, because the DIRECTORY case has to
 * be distinguishable from the file case. The first cut returned the directory's
 * `index.html` straight away, which served `/fa/components/calendar` with a 200
 * — convenient, and WRONG in the way that matters: a host running
 * `trailingSlash: true` answers that request with a 301, so local preview would
 * have disagreed with production on every unslashed link, and the redirect
 * branch below would have been dead code that looked live.
 *
 * The JSDoc is not decoration: the root `tsc` checks this file, and without an
 * annotated return the object literals widen `kind` to `string`, so
 * `found.kind === "file"` narrows nothing and `found.path` is `string |
 * undefined` at every use.
 *
 * @typedef {{ kind: "file", path: string } | { kind: "redirect" } | { kind: "none" }} Resolved
 * @param {string} pathname
 * @returns {Promise<Resolved>}
 */
async function resolveRequest(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const target = resolve(join(ROOT, clean));
  // Inside the root, or nothing. `startsWith(ROOT)` alone would admit a
  // sibling directory whose name merely begins with the root's.
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return { kind: "none" };

  try {
    const info = await stat(target);
    if (info.isFile()) return { kind: "file", path: target };
    if (!info.isDirectory()) return { kind: "none" };

    const index = join(target, "index.html");
    const indexInfo = await stat(index).catch(() => null);
    if (indexInfo?.isFile() !== true) return { kind: "none" };
    // A directory reached WITHOUT a trailing slash is the redirect a host
    // performs. With one, it is the document.
    return pathname.endsWith("/") ? { kind: "file", path: index } : { kind: "redirect" };
  } catch {
    return { kind: "none" };
  }
}

const server = createServer((req, res) => {
  void (async () => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;

    const found = await resolveRequest(pathname);

    if (found.kind === "redirect") {
      // The `trailingSlash` redirect, issued only where the slashed form is a
      // real document — so a genuine 404 stays a 404 rather than becoming a
      // redirect to one, which is harder to read.
      res.writeHead(301, { location: `${pathname}/${url.search}` });
      res.end();
      return;
    }

    if (found.kind === "file") {
      res.writeHead(200, {
        "content-type": TYPES.get(extname(found.path).toLowerCase()) ?? "application/octet-stream",
        // No caching. A preview server that caches is a preview server that
        // shows you the build before the one you just made.
        "cache-control": "no-store",
      });
      createReadStream(found.path).pipe(res);
      return;
    }

    // The site's OWN 404 — a prerendered, gate-graded Persian document. See
    // the header.
    const notFound = await resolveRequest("/404.html");
    res.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    if (notFound.kind === "file") createReadStream(notFound.path).pipe(res);
    else res.end("404");
  })();
});

server.on("error", (error) => {
  if ("code" in error && error.code === "EADDRINUSE") {
    // Named, because "EADDRINUSE" on its own sends people looking for a bug in
    // the site rather than for the other server they left running.
    process.stderr.write(
      `\n  Port ${String(PORT)} is already in use. Stop the other server, or:\n` +
        `      PORT=4174 pnpm start\n\n`,
    );
    process.exit(1);
  }
  throw error;
});

stat(join(ROOT, "index.html"))
  .catch(() => {
    process.stderr.write(
      `\n  No build found at ${ROOT}.\n      pnpm build\n\n`,
    );
    process.exit(1);
  })
  .then(() => {
    server.listen(PORT, () => {
      /*
       * Says what this IS, not just that it started.
       *
       * `pnpm start` means `next start` in every other Next project, and
       * `next start` REFUSES to run under `output: "export"` — so this script
       * is standing in for a command that cannot exist here. Someone who types
       * `pnpm start` expecting a Node server, and is not told otherwise, will
       * later be surprised that a route handler they added does nothing. One
       * line now is cheaper than that.
       */
      process.stdout.write(
        `\n  static export — no Node server (next.config.ts sets output: "export",\n` +
          `  and next start does not run under it). Serving the built bytes:\n\n` +
          `      ${ROOT}\n\n` +
          `      http://localhost:${String(PORT)}/fa/\n` +
          `      http://localhost:${String(PORT)}/en/\n\n`,
      );
    });
  });
