import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { hash, inspect, policy, protect, hostFaults } from "./csp.mjs";

const document = (body = "") => `<!doctype html><html><head><meta charset="utf-8"><script>window.theme="dark";</script></head><body>${body}</body></html>`;

test("charset survives before a strict policy and regeneration is idempotent", () => {
  const html = protect(document('<style>p{color:green}</style><p>فارسی</p>'));
  assert.deepEqual(inspect(html), []);
  assert.equal(protect(html), html);
  assert.match(html, /<head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy"/);
  assert(!policy(html).split(";")[1].includes("unsafe-inline"));
});

test("HTML comments cannot authorize a script; script text containing comment markers is intact", () => {
  const body = '<!--<script>alert("comment")</script>--><script>window.example="<!--kept-->";</script><script type="application/ld+json">{}</script>';
  const value = policy(document(body));
  assert(value.includes(hash('window.example="<!--kept-->";')));
  assert(!value.includes(hash('alert("comment")')));
  assert(!value.includes(hash("{}")));
  assert.equal(hash("a\r\nb\rc"), hash("a\nb\nc"));
});

test("a changed payload, weak policy and late policy all fail", () => {
  const html = protect(document());
  assert(inspect(html.replace('window.theme="dark"', 'window.theme="light"')).length);
  assert(inspect(html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")).length);
  assert(inspect(html.replace('<meta charset="utf-8">', '<meta charset="utf-8"><script src="/early.js"></script>')).length);
  assert(inspect(document()).length);
});

test("owned style elements need exact hashes, not weaker element policy", () => {
  const html = protect(document('<style>p{color:green}</style><p>Read</p>'));
  assert.deepEqual(inspect(html), []);
  const elementPolicy = policy(html).split(";").find((directive) => directive.trim().startsWith("style-src-elem"));
  assert(elementPolicy.includes(hash("p{color:green}")) && !elementPolicy.includes("unsafe-inline"));
  assert(inspect(html.replace("p{color:green}", "p{color:red}")).length);
  assert(inspect(html.replace("style-src-elem 'self'", "style-src-elem 'self' 'unsafe-inline'")).length);
});

test("event handlers, encoded JavaScript URLs and external executable assets fail", () => {
  for (const body of [
    '<button onclick="alert(1)">Go</button>',
    '<a href="java&#x09;script&#58;alert(1)">Go</a>',
    '<script src="//elsewhere.invalid/a.js"></script>',
    '<link rel="stylesheet" href="https://elsewhere.invalid/a.css">',
  ]) assert(inspect(protect(document(body))).length, body);
  assert.deepEqual(inspect(protect(document('<script src="/_next/static/a.js"></script><a href="https://github.com/Telarsa/lumo-ui">Source</a>'))), []);
});

test("the actual two host policies hold and dropping a response header fails", () => {
  const cloudflare = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
  const caddy = readFileSync(new URL("../Caddyfile", import.meta.url), "utf8");
  assert.deepEqual(hostFaults(cloudflare, caddy), []);
  assert(hostFaults(cloudflare.replace(/  X-Frame-Options: DENY\n/, ""), caddy).length);
  assert(hostFaults(cloudflare, caddy.replace("import security_headers", "")).length);
  assert(hostFaults(cloudflare.replace("/_next/static/*", "/assets/*"), caddy).length);
  assert(hostFaults(cloudflare.replace("31536000, immutable", "0, must-revalidate"), caddy).length);
  assert(hostFaults(cloudflare, caddy.replace("@immutable path /_next/static/*", "@immutable path /*")).length);
});
