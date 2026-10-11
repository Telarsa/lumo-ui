/** Static-page CSP: hash the inline blocks after the owned error shells exist.
 * Charset remains first so a long policy cannot break Persian decoding.
 * Script execution is limited to this origin and the page's exact hashes.
 * React's style attributes remain allowed; style elements require hashes.
 * Framing and the other response headers are enforced by both static hosts.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

export const headers = {
  "Content-Security-Policy": "frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), midi=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

const tags = /<!--[\s\S]*?-->|<(script|style)\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/\1\s*>|<([a-z][^\s/>]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;

export function scan(html) {
  return [...html.matchAll(tags)].filter((match) => !match[0].startsWith("<!--")).map((match) => ({
    name: (match[1] || match[4]).toLowerCase(),
    attributes: match[2] ?? match[5],
    body: match[3],
    start: match.index,
    end: match.index + match[0].length,
  }));
}

export function attributes(text) {
  const found = new Map();
  for (const match of text.matchAll(/([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    found.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return found;
}

export const hash = (text) => `sha256-${createHash("sha256").update(text.replace(/\r\n?/g, "\n")).digest("base64")}`;
const executable = (type) => !type || ["module", "importmap", "speculationrules"].includes(type) || /^(?:application|text)\/(?:x-)?(?:java|ecma)script(?:1\.[0-5])?$/.test(type) || ["text/jscript", "text/livescript"].includes(type);
const isMeta = (tag) => tag.name === "meta" && attributes(tag.attributes).get("http-equiv")?.toLowerCase() === "content-security-policy";

export function policy(html) {
  const scriptHashes = new Set();
  const styleHashes = new Set();
  for (const tag of scan(html)) {
    const attrs = attributes(tag.attributes);
    if (tag.name === "style") styleHashes.add(hash(tag.body));
    if (tag.name === "script" && !attrs.has("src")) {
      const type = (attrs.get("type") ?? (attrs.has("language") ? `text/${attrs.get("language")}` : "")).trim().toLowerCase();
      if (executable(type)) scriptHashes.add(hash(tag.body));
    }
  }
  const sources = (values) => [...values].map((value) => `'${value}'`).join(" ");
  return [
    "default-src 'self'",
    `script-src 'self'${scriptHashes.size ? ` ${sources(scriptHashes)}` : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `style-src-elem 'self'${styleHashes.size ? ` ${sources(styleHashes)}` : ""}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "frame-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join("; ");
}

export function protect(html) {
  const generated = /<meta http-equiv="Content-Security-Policy" content="[^"]*"\/>/g;
  const clean = html.replace(generated, "");
  const list = scan(clean);
  if (list.some(isMeta)) throw new Error("Unexpected hand-authored CSP: policies are generated.");
  const head = list.findIndex((tag) => tag.name === "head");
  if (head < 0) throw new Error("HTML document has no head.");
  const charset = list[head + 1];
  if (charset?.name !== "meta" || !attributes(charset.attributes).has("charset")) throw new Error("Charset must be first in head.");
  return `${clean.slice(0, charset.end)}<meta http-equiv="Content-Security-Policy" content="${policy(clean)}"/>${clean.slice(charset.end)}`;
}

// Decode URL punctuation and ASCII control characters before inspecting it.
const urlText = (text) => text.replace(/&#(?:x([a-f\d]+)|(\d+));?/gi, (_, hex, decimal) => String.fromCodePoint(Number.parseInt(hex || decimal, hex ? 16 : 10))).replace(/&colon;/gi, ":").replace(/[\u0000-\u0020]/g, "");
const onOrigin = (url) => new URL(urlText(url), "https://static.invalid").origin === "https://static.invalid";

export function inspect(html) {
  const faults = [];
  const list = scan(html);
  const metas = list.filter(isMeta);
  if (metas.length !== 1) return ["Expected exactly one policy meta."];
  const head = list.findIndex((tag) => tag.name === "head");
  const meta = metas[0];
  const before = list.slice(head + 1, list.indexOf(meta));
  if (head < 0 || before.length !== 1 || before[0].name !== "meta" || !attributes(before[0].attributes).has("charset")) faults.push("Policy must immediately follow charset.");
  if (attributes(meta.attributes).get("content") !== policy(html)) faults.push("Policy differs from the page's exact inline hashes and restrictions.");
  for (const tag of list) {
    const attrs = attributes(tag.attributes);
    if ([...attrs.keys()].some((name) => /^on[a-z]+$/.test(name))) faults.push("Inline event handler.");
    for (const name of ["href", "src", "action", "formaction"]) if (attrs.has(name) && /^javascript:/i.test(urlText(attrs.get(name)))) faults.push("JavaScript URL.");
    if (tag.name === "script" && attrs.has("src") && !onOrigin(attrs.get("src"))) faults.push("External script source.");
    if (tag.name === "link" && /\bstylesheet\b/i.test(attrs.get("rel") || "") && !onOrigin(attrs.get("href") || "")) faults.push("External stylesheet source.");
  }
  return faults;
}

export function hostFaults(cloudflare, caddy) {
  const faults = [];
  const universal = cloudflare.split(/^\/\*\s*$/m)[1]?.split(/^\S/m)[0] || "";
  const expected = { ...headers, "Strict-Transport-Security": "max-age=31536000; includeSubDomains" };
  for (const [name, value] of Object.entries(expected)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (universal.match(new RegExp(`^\\s+${escaped}:\\s*(.*)$`, "mi"))?.[1].trim() !== value) faults.push(`Cloudflare missing or changed ${name}.`);
    if (name !== "Strict-Transport-Security" && !caddy.includes(`${name} "${value}"`)) faults.push(`Caddy missing or changed ${name}.`);
  }
  if (!caddy.includes("import security_headers")) faults.push("Caddy security headers are not imported.");
  return faults;
}

export function htmlFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? htmlFiles(join(root, entry.name)) : entry.name.endsWith(".html") ? [join(root, entry.name)] : []);
}

function main() {
  const app = resolve(import.meta.dirname, "..");
  const out = join(app, "out");
  const files = htmlFiles(out);
  if (!files.length) throw new Error("No exported HTML documents to protect.");
  const checking = process.argv.includes("--check");
  const faults = [];
  for (const file of files) {
    let html = readFileSync(file, "utf8");
    if (!checking) { html = protect(html); writeFileSync(file, html); }
    for (const fault of inspect(html)) faults.push(`${relative(out, file)}: ${fault}`);
  }
  faults.push(...hostFaults(readFileSync(join(out, "_headers"), "utf8"), readFileSync(join(app, "Caddyfile"), "utf8")));
  if (faults.length) throw new Error(faults.join("\n"));
  console.log(`CSP ${checking ? "verified" : "generated and verified"}: ${files.length} documents; exact script hashes, same-origin resources, Cloudflare/Caddy response headers.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
