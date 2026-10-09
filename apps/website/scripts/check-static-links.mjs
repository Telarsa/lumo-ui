import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";

function* htmlFiles(base) {
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const path = join(base, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}
const root = resolve("out");
const failures = [];
let links = 0;
for (const file of htmlFiles(root)) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (!href || /^(?:https?:|mailto:|data:)/.test(href)) continue;
    const [path, fragment] = href.split("#");
    const clean = path.split("?")[0];
    const target = clean ? (clean.startsWith("/") ? resolve(root, `.${clean}`) : resolve(dirname(file), clean)) : file;
    const candidates = [target, join(target, "index.html"), `${target}.html`];
    const found = candidates.find((candidate) => existsSync(candidate) && !readdirMaybe(candidate));
    links += 1;
    if (!found) { failures.push(`${file}: missing ${href}`); continue; }
    if (fragment && found.endsWith(".html")) {
      const targetHtml = found === file ? html : readFileSync(found, "utf8");
      if (!targetHtml.includes(`id="${fragment}"`)) failures.push(`${file}: missing anchor ${href}`);
    }
  }
}
function readdirMaybe(path) { try { readdirSync(path); return true; } catch { return false; } }
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Checked ${links} local asset/navigation links: no missing paths or anchors.`);
