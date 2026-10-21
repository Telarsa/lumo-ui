import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { themeScript } from "../src/lib/site-theme.mjs";

test("prepaint accepts only explicit binary choices and defaults to light even when storage throws", () => {
  for (const stored of [null, "system", "invalid", "light", "dark", "denied"]) {
    const attrs = {};
    const storage = { getItem() { if (stored === "denied") throw Error("denied"); return stored; } };
    runInNewContext(themeScript(), { localStorage: storage, document: { documentElement: { setAttribute(k, v) { attrs[k] = v; } }, querySelector() { return null; } } });
    assert.equal(attrs["data-theme"], stored === "dark" ? "dark" : "light", String(stored));
  }
});

test("runtime changes update the document and metadata when storage is denied", async () => {
  const { getSiteTheme, setSiteTheme } = await import("../src/lib/site-theme.mjs");
  const attrs = {};
  const meta = {};
  globalThis.document = {
    documentElement: { setAttribute(k, v) { attrs[k] = v; }, getAttribute(k) { return attrs[k]; } },
    querySelector() { return { setAttribute(k, v) { meta[k] = v; } }; },
  };
  globalThis.localStorage = { setItem() { throw Error("denied"); } };
  try {
    assert.equal(getSiteTheme(), "light");
    setSiteTheme("dark");
    assert.equal(getSiteTheme(), "dark");
    assert.equal(meta.content, "#101114");
    setSiteTheme("light");
    assert.equal(getSiteTheme(), "light");
    assert.equal(meta.content, "#f8f7f3");
  } finally {
    delete globalThis.document;
    delete globalThis.localStorage;
  }
});

test("server-rendered theme control stays hidden and unfocusable until its saved theme is synchronized", async () => {
  const { readFile } = await import("node:fs/promises");
  const { createRequire } = await import("node:module");
  const { pathToFileURL } = await import("node:url");
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const source = await readFile(new URL("../src/components/theme-toggle.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
    .replace('"react/jsx-runtime"', JSON.stringify(pathToFileURL(require.resolve("react/jsx-runtime")).href))
    .replace('"react"', JSON.stringify(pathToFileURL(require.resolve("react")).href))
    .replace('"@/lib/site-theme.mjs"', JSON.stringify(new URL("../src/lib/site-theme.mjs", import.meta.url).href));
  const { ThemeToggle } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
  const html = renderToStaticMarkup(React.createElement(ThemeToggle, { labels: { light: "Light", dark: "Dark" } }));
  assert.match(html, /disabled=""/, "the unsynchronized button cannot be focused or activated");
  assert.match(html, /aria-hidden="true"/, "the unsynchronized button is absent from the accessibility tree");
  assert.match(html, /visibility:hidden/, "the unsynchronized button is not displayed");
  assert.doesNotMatch(html, /aria-label="Light"/, "a saved dark theme must not be described as light before hydration");
});
