import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import worker from "../worker.mjs";
import { HEADERS, TLS_HEADERS } from "../response-security.mjs";
import { readWorkerConfig, workerConfigFaults } from "./check-worker.mjs";

const expectedHeaders = { ...HEADERS, ...TLS_HEADERS };
const noAssets = { ASSETS: { fetch() { assert.fail("A production origin redirect must precede static assets."); } } };

test("HTTP and www production requests redirect permanently without changing encoded paths/queries", async () => {
  for (const origin of ["http://lumo-ui.com", "http://www.lumo-ui.com", "https://www.lumo-ui.com:8443"]) {
    for (const path of ["/", "/fa/", "/en/docs/a%2Fb/%252F/?q=a%2Bb&next=%2Ffa%2F&empty=&q=two+words"]) {
      const response = await worker.fetch(new Request(origin + path), noAssets);
      assert.equal(response.status, 308);
      assert.equal(response.headers.get("location"), "https://lumo-ui.com" + path);
      for (const [name, value] of Object.entries(expectedHeaders)) assert.equal(response.headers.get(name), value);
    }
  }
});

test("production redirects use method-preserving 308 and do not consume request bodies", async () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD"]) {
    const hasBody = method !== "HEAD";
    const request = new Request("http://lumo-ui.com/en/?keep=1", { method, ...(hasBody ? { body: "unsent=example" } : {}) });
    const response = await worker.fetch(request, noAssets);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), "https://lumo-ui.com/en/?keep=1");
    assert.equal(request.method, method);
    if (hasBody) assert.equal(await request.text(), "unsent=example");
  }
});

test("canonical production, workers.dev, local previews and lookalike hosts pass the original request to ASSETS", async () => {
  for (const origin of [
    "https://lumo-ui.com", "http://lumo-ui-website.example.workers.dev",
    "https://preview.lumo-ui-website.example.workers.dev", "http://localhost:3113",
    "http://127.0.0.1:3113", "http://lumo-ui.com.evil.example", "http://www.lumo-ui.com.evil.example",
  ]) {
    const request = new Request(origin + "/en/?keep=%2F");
    let calls = 0;
    const response = await worker.fetch(request, { ASSETS: { fetch(input) {
      calls++;
      assert.equal(input, request);
      return new Response("asset", { headers: { "content-type": "text/html", "cache-control": "public, max-age=0, must-revalidate", etag: '"asset-tag"' } });
    } } });
    assert.equal(calls, 1);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("cache-control"), "public, max-age=0, must-revalidate");
    assert.equal(response.headers.get("etag"), '"asset-tag"');
    assert.equal(await response.text(), "asset");
  }
});

test("static page, binary/range, slash-redirect, 404 and bodyless responses keep their status/body/asset headers", async () => {
  for (const fixture of [
    { status: 200, statusText: "OK", body: "<h1>Page</h1>", headers: { "content-type": "text/html; charset=utf-8" } },
    { status: 206, statusText: "Partial Content", body: new Uint8Array([0, 31, 255]), headers: { "content-type": "font/woff2", "content-range": "bytes 0-2/10" } },
    { status: 307, statusText: "Temporary Redirect", body: null, headers: { location: "/en/" } },
    { status: 404, statusText: "Not Found", body: "<h1>Not found</h1>", headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } },
    { status: 304, statusText: "Not Modified", body: null, headers: {} },
  ]) {
    const source = new Response(fixture.body, { status: fixture.status, statusText: fixture.statusText, headers: {
      ...expectedHeaders, ...fixture.headers, "cache-control": "public, max-age=3600", etag: '"original-tag"', vary: "Accept-Encoding", "cf-cache-status": "HIT",
    } });
    const expectedBody = new Uint8Array(await source.clone().arrayBuffer());
    const response = await worker.fetch(new Request("https://lumo-ui.com/en/missing/"), { ASSETS: { fetch: () => source } });
    assert.equal(response.status, fixture.status);
    assert.equal(response.statusText, fixture.statusText);
    for (const [name, value] of source.headers) assert.equal(response.headers.get(name), value);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), expectedBody);
  }
});

test("Worker protections cover assets even when the binding omits static _headers", async () => {
  const response = await worker.fetch(new Request("https://lumo-ui.com/en/"), {
    ASSETS: { fetch: () => new Response("asset", { headers: { "content-type": "text/html" } }) },
  });
  for (const [name, value] of Object.entries(expectedHeaders)) assert.equal(response.headers.get(name), value);
  const staticHeaders = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
  for (const [name, value] of Object.entries(expectedHeaders)) assert(staticHeaders.includes(`${name}: ${value}`));
});

test("the production config actually routes matching assets through the Worker and preserves static routing", () => {
  const config = readWorkerConfig();
  assert.deepEqual(workerConfigFaults(config), []);
  for (const mutate of [
    (c) => { delete c.main; }, (c) => { delete c.assets.binding; },
    (c) => { c.assets.run_worker_first = false; }, (c) => { c.assets.not_found_handling = "single-page-application"; },
  ]) {
    const poison = structuredClone(config);
    mutate(poison);
    assert(workerConfigFaults(poison).length > 0);
  }
});

test("the runtime Worker dependency graph imports no Node-only build modules", () => {
  for (const file of ["../worker.mjs", "../response-security.mjs"]) {
    assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), "utf8"), /(?:from\s*["']node:|import\s*\(["']node:|require\s*\(["']node:)/);
  }
});
