import test from "node:test";
import assert from "node:assert/strict";
import { languageForRequest } from "../language-routing.mjs";

test("saved explicit selection takes precedence over browser language and country", () => {
  assert.equal(languageForRequest("site-language=en", "fa-IR,fa;q=0.9", "IR"), "en");
  assert.equal(languageForRequest("site-language=fa", "de-DE", "DE"), "fa");
});

test("Persian and German browser preferences win; English browsers can use country fallback", () => {
  assert.equal(languageForRequest("", "fa-IR,fa;q=0.9,en;q=0.8", "DE"), "fa");
  assert.equal(languageForRequest("", "de-DE,de;q=0.9,en;q=0.8", "IR"), "de");
  assert.equal(languageForRequest("", "en-US,en;q=0.9", "IR"), "fa");
  assert.equal(languageForRequest("", "en-US,en;q=0.9", "DE"), "de");
  assert.equal(languageForRequest("", "en-US,en;q=0.9", "LI"), "de");
  assert.equal(languageForRequest("", "en-US,en;q=0.9", "US"), "en");
  assert.equal(languageForRequest("", "en;q=0.6,de;q=0.9", "IR"), "de");
  assert.equal(languageForRequest("", "", "IR"), "fa");
  assert.equal(languageForRequest("", "", ""), "en");
});

test("invalid cookies and q=0 languages do not select a language", () => {
  assert.equal(languageForRequest("site-language=other", "fa;q=0,de;q=0.8", "US"), "de");
  assert.equal(languageForRequest("site-language=fa%0a", "fr-FR", "US"), "en");
  assert.equal(languageForRequest("", "en;q=1,fa;q=0", "IR"), "en");
  assert.equal(languageForRequest("", "en;q=1,*;q=0", "DE"), "en");
});
