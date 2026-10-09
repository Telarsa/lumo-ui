import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { GENERATED, PRIVATE_MODULE, FALLBACK_MODULE } from "./prepare-private-fonts.mjs";

const app = fileURLToPath(new URL("../", import.meta.url));
const required = {
  "src/styles/tokens.css": "stylesheet",
  "src/assets/fonts/InterVariable.woff2": "font",
  "src/assets/fonts/private/IRANSansXVF.woff2": "font",
  "src/assets/fonts/Inter-LICENSE.txt": "notice",
  "src/assets/fonts/private/IRANSansX-LICENSE-NOTE.txt": "notice",
};
const fontNotices = {
  "src/assets/fonts/InterVariable.woff2": "src/assets/fonts/Inter-LICENSE.txt",
  "src/assets/fonts/private/IRANSansXVF.woff2": "src/assets/fonts/private/IRANSansX-LICENSE-NOTE.txt",
};
/** Proprietary: verified when present, never committed (git-ignored directory). */
const privatePaths = new Set(["src/assets/fonts/private/IRANSansXVF.woff2", "src/assets/fonts/private/IRANSansX-LICENSE-NOTE.txt"]);

/**
 * Check the actual local files and notices; ordinary builds never read another checkout.
 * Public files must always be present. The private Persian font and its note are
 * verified byte for byte when present; when absent, the generated module must be
 * the documented system-font fallback.
 */
export async function checkSiteAssets(root = app) {
  const json = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
  const consumer = await json("package.json");
  const assets = await json("docs/site-assets.json");
  assert.equal(consumer.private, true, "The website package is not published");
  assert.equal(consumer.license, "MIT", "The website's source is MIT, like the repository it lives in");
  assert(!Object.hasOwn(consumer.dependencies ?? {}, "@telarsa/web-foundation"), "Website styles must be owned locally");
  assert.equal(assets.ownership, "site-local");
  assert.equal(assets.privateAssets?.directory, "src/assets/fonts/private");
  assert.deepEqual(assets.files.map((file) => file.path).sort(), Object.keys(required).sort(), "Retain the complete adopted style/font/notice set");
  let verified = 0;
  let persianPresent = false;
  for (const file of assets.files) {
    const destination = resolve(root, file.path);
    const pathWithinRoot = relative(resolve(root), destination);
    assert(!pathWithinRoot.startsWith("..") && !isAbsolute(pathWithinRoot), "An asset path must remain inside this website");
    assert.equal(file.role, required[file.path]);
    assert.equal(file.private === true, privatePaths.has(file.path), `Only the proprietary font and its note are private: ${file.path}`);
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    if (file.role === "font") {
      assert.equal(file.notice, fontNotices[file.path], `Use the matching font notice: ${file.path}`);
      assert(assets.files.some((notice) => notice.path === file.notice && notice.role === "notice"), `Missing font notice: ${file.path}`);
    }
    if (file.private && !existsSync(destination)) continue;
    const data = await readFile(destination);
    assert(data.length > 0, `Empty site asset: ${file.path}`);
    assert.equal(createHash("sha256").update(data).digest("hex"), file.sha256, `Local site asset changed without updating its reviewed checksum: ${file.path}`);
    if (file.private && file.role === "font") {
      persianPresent = true;
      await readFile(resolve(root, file.notice));
    }
    verified += 1;
  }
  const css = await readFile(resolve(root, "src/app/globals.css"), "utf8");
  const layout = await readFile(resolve(root, "src/app/[locale]/layout.tsx"), "utf8");
  assert(css.includes('@import "../styles/tokens.css";'), "Use this website's local tokens");
  assert(layout.includes("../../assets/fonts/InterVariable.woff2"), "Load local font: InterVariable.woff2");
  assert(layout.includes('from "@/assets/fonts/private/persian-font"'), "Load the Persian font through the generated private module");
  assert(!layout.includes("IRANSansX"), "The layout must not name the private font file; only the generated module does");
  assert(css.includes("var(--font-persian, var(--lumo-web-font-persian-fallback))"), "Persian text needs the documented system-font fallback");
  const generated = resolve(root, GENERATED);
  assert(existsSync(generated), "Run scripts/prepare-private-fonts.mjs first");
  assert.equal(await readFile(generated, "utf8"), persianPresent ? PRIVATE_MODULE : FALLBACK_MODULE, "The generated Persian font module does not match the private font's presence; rerun scripts/prepare-private-fonts.mjs");
  assert(!`${css}\n${layout}`.includes("@telarsa/web-foundation"), "Remove shared styling/font imports");
  return { verified, persian: persianPresent ? "private" : "fallback" };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { verified, persian } = await checkSiteAssets();
  console.log(`Site-owned assets: ${verified} local stylesheet/font/notice files verified; Persian font: ${persian}.`);
}
