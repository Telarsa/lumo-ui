import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Static hosts need a useful owned English fallback. Reuse the generated
// stylesheet/font resources and font classes, rather than shipping a browser-
// serif error screen. The root redirect stays usable without JavaScript too.
if (!existsSync("out/en/index.html")) throw new Error("Expected static English homepage is missing.");
const homepage = readFileSync("out/en/index.html", "utf8");
const rootClass = homepage.match(/<html[^>]*\bclass="([^"]+)"/)?.[1];
const head = homepage.match(/<head>([\s\S]*?)<\/head>/)?.[1] || "";
const links = [...head.matchAll(/<link\b[^>]*>/g)].map((match) => match[0]).filter((link) => /rel="stylesheet"/.test(link) || (/rel="preload"/.test(link) && /as="font"/.test(link))).join("");
const bootScript = [...head.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].find((match) => match[1].includes('localStorage.getItem("lumo-theme")'))?.[1];
if (!rootClass || !links.includes('rel="stylesheet"') || !bootScript) throw new Error("Could not preserve generated error-page fonts/styles/theme boot.");
const shell = `<!doctype html><html lang="en" dir="ltr" class="${rootClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page unavailable · Lumo UI</title>${links}<script>${bootScript}</script></head><body><main class="container section error-shell"><a class="brand-link" href="/en/"><span class="brand"><svg viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M50 12H88V88H12V50H50Z"/><path fill="var(--lumo-mark)" d="M12 50A38 38 0 0 1 50 12L50 50Z"/></svg><span>Lumo UI</span></span></a><h1>This page is unavailable.</h1><p>Return to the Lumo UI website or read the documentation.</p><div class="actions"><a class="button primary" href="/en/">Lumo UI website</a><a class="text-link" href="/en/docs/">Documentation</a></div></main></body></html>`;
for (const file of ["404.html", "404/index.html", "_not-found/index.html", "_global-error.html"]) {
  const path = join("out", file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, shell);
}
writeFileSync("out/index.html", '<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/en/"><title>Lumo UI</title></head><body><a href="/en/">Continue to Lumo UI</a></body></html>');

// Prevent an error-route duplicate from retaining Next's generic ungraded shell.
if (existsSync("out/_global-error/index.html")) writeFileSync("out/_global-error/index.html", shell);
// next/font emits hashed binary resources. Keep their supplied notices beside
// the static deployment too. The IRANSansX note ships only with a private build
// that actually serves the font; its source stays in the git-ignored directory.
mkdirSync("out/font-licenses", { recursive: true });
copyFileSync("src/assets/fonts/Inter-LICENSE.txt", "out/font-licenses/Inter-LICENSE.txt");
if (existsSync("src/assets/fonts/private/IRANSansXVF.woff2")) {
  copyFileSync("src/assets/fonts/private/IRANSansX-LICENSE-NOTE.txt", "out/font-licenses/IRANSansX-LICENSE-NOTE.txt");
}
console.log("Owned root and error documents written.");
