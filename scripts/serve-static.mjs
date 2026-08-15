import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

/**
 * Serves the static export the way a host would. `next start` refuses to run
 * under `output: "export"`, and the gate grades `out/**` because those are the
 * bytes a crawler and the first paint receive. Plain `node:http` so it needs no
 * python, no dependency and no network. Two things a naive server gets wrong
 * here: `trailingSlash: true` (an unslashed directory route must 301, not 200),
 * and the 404 route is a real graded Persian document that must be served.
 * Path traversal is checked before anything is opened.
 */

const ROOT = resolve(process.argv[2] ?? "apps/website/out");
const PORT = Number(process.env["PORT"] ?? process.argv[3] ?? 4173);

/**
 * Content types for what a static export contains. `charset=utf-8` on every
 * text type is load-bearing: a sniffed Persian document renders as mojibake.
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
 * Three outcomes so the DIRECTORY case is distinguishable: a host under
 * `trailingSlash: true` answers an unslashed directory with a 301, not a 200.
 * The JSDoc typedef is not decoration: without it `kind` widens to `string`.
 *
 * @typedef {{ kind: "file", path: string } | { kind: "redirect" } | { kind: "none" }} Resolved
 * @param {string} pathname
 * @returns {Promise<Resolved>}
 */
async function resolveRequest(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const target = resolve(join(ROOT, clean));
  // Inside the root, or nothing. `startsWith(ROOT)` alone would admit a sibling directory.
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return { kind: "none" };

  try {
    const info = await stat(target);
    if (info.isFile()) return { kind: "file", path: target };
    if (!info.isDirectory()) return { kind: "none" };

    const index = join(target, "index.html");
    const indexInfo = await stat(index).catch(() => null);
    if (indexInfo?.isFile() !== true) return { kind: "none" };
    // A directory reached WITHOUT a trailing slash is the redirect a host performs.
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
      // Issued only where the slashed form is a real document, so a 404 stays a 404.
      res.writeHead(301, { location: `${pathname}/${url.search}` });
      res.end();
      return;
    }

    if (found.kind === "file") {
      res.writeHead(200, {
        "content-type": TYPES.get(extname(found.path).toLowerCase()) ?? "application/octet-stream",
        // No caching: a preview server must show the build you just made.
        "cache-control": "no-store",
      });
      createReadStream(found.path).pipe(res);
      return;
    }

    // The site's OWN 404 — a prerendered, gate-graded Persian document.
    const notFound = await resolveRequest("/404.html");
    res.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    if (notFound.kind === "file") createReadStream(notFound.path).pipe(res);
    else res.end("404");
  })();
});

server.on("error", (error) => {
  if ("code" in error && error.code === "EADDRINUSE") {
    // Named, because a bare "EADDRINUSE" sends people looking for a bug in the site.
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
      // Says what this IS: `pnpm start` is not a Node server here, and someone
      // who adds a route handler expecting one should be told now.
      process.stdout.write(
        `\n  static export — no Node server (next.config.ts sets output: "export",\n` +
          `  and next start does not run under it). Serving the built bytes:\n\n` +
          `      ${ROOT}\n\n` +
          `      http://localhost:${String(PORT)}/fa/\n` +
          `      http://localhost:${String(PORT)}/en/\n\n`,
      );
    });
  });
