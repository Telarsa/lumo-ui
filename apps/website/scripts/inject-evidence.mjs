#!/usr/bin/env node
/**
 * Fills in the accessibility evidence panel on every component page, as a
 * POST-BUILD pass over `next build`'s own static output.
 *
 * See `src/components/evidence-panel.tsx`'s file header for the full account
 * of why this cannot be done inside React: `renderToStaticMarkup`, called a
 * second time from a Server Component, cannot resolve the `"use client"`
 * components nearly every Lumo component is (verified — it throws
 * `Attempted to call RadioGroup() from the server but RadioGroup is on the
 * client` during `next build`, on the very first demo that used one).
 *
 * So instead of rendering the demo a second time, this script reads the demo's
 * REAL rendered markup out of the HTML `next build` already produced — the
 * exact bytes `@lumo-ui/gate` grades — and runs the identical `linkedom` +
 * `dom-accessibility-api` computation `packages/gate/src/rules.ts`'s
 * `namedControls` rule uses.
 *
 * Wired into `package.json`'s own `build` script (`next build && node ...
 * inject-evidence.mjs`): if this throws, or finds nothing to fill in, the
 * whole `&&`-chained command exits non-zero, `pnpm run gate:html` never
 * reaches the gate CLI, and the build fails loudly rather than shipping an
 * empty panel.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { parseHTML } from "linkedom";
import { computeAccessibleName } from "dom-accessibility-api";

const OUT_DIR = new URL("../out/", import.meta.url).pathname;

/**
 * Duplicated from `packages/gate/src/rules.ts`'s `namedControls` rule, not
 * imported: `packages/gate/src/index.ts` re-exports only the five `Rule`
 * objects (`export * from "./rules.ts"`), not this selector or the shim below
 * — they are private to that module, and reaching past a package's public
 * surface (or editing the gate to widen it, for a script the gate itself is
 * not to be modified to accommodate) is out of scope here. Copied verbatim as
 * of this commit; re-sync by hand if the gate's copy changes.
 */
const INTERACTIVE =
  "button,a[href],input:not([type=hidden]),select,textarea,[role=button]," +
  "[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab]," +
  "[role=menuitem],[role=option],[role=combobox],[role=searchbox],[role=slider]," +
  "[role=spinbutton],[role=textbox]";

/**
 * `dom-accessibility-api` reaches for `window.getComputedStyle`, which
 * linkedom does not provide — every call THROWS without this shim. This is
 * the documented trap `packages/gate/src/rules.ts` warns about at length: an
 * earlier version of `namedControls` caught that throw and `continue`d, which
 * made the rule fire on nothing and report green forever. The call below is
 * deliberately not wrapped in try/catch, for the same reason: if the
 * computation throws, this script must crash and fail the build, not emit an
 * empty panel.
 */
const COMPUTED_STYLE_SHIM = {
  getComputedStyle: () => ({
    getPropertyValue: () => "",
    visibility: "visible",
    display: "block",
    content: "",
  }),
  computedStyleSupportsPseudoElements: false,
};

/**
 * A simplified, honestly-approximate implicit-role lookup for plain HTML
 * elements — not a full ARIA-in-HTML resolution, the same "approximation,
 * stated honestly" stance `rules.ts` takes about `dom-accessibility-api`
 * itself. The load-bearing column in the panel is the NAME, not this one.
 */
function describeRole(el) {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit;
  switch (el.tagName) {
    case "BUTTON":
      return "button";
    case "A":
      return "link";
    case "SELECT":
      return "listbox";
    case "TEXTAREA":
      return "textbox";
    case "INPUT": {
      const type = (el.getAttribute("type") ?? "text").toLowerCase();
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "range") return "slider";
      if (type === "number") return "spinbutton";
      if (type === "search") return "searchbox";
      return "textbox";
    }
    default:
      return el.tagName.toLowerCase();
  }
}

/**
 * The numbering system per locale, for the count line. Mirrors
 * `packages/core/src/types.ts`'s `FORMAT_LOCALE` — not imported, because that
 * module's index re-exports `LumoHtml`, a component, and this script runs
 * outside Next's bundler with no JSX transform available to it.
 */
const FORMAT_LOCALE = {
  "fa-IR": "fa-IR-u-ca-persian-nu-arabext",
  "en-US": "en-US",
};

function formatCount(n, locale) {
  return new Intl.NumberFormat(FORMAT_LOCALE[locale]).format(n);
}

const COPY = {
  "fa-IR": {
    intro:
      "برای هر کنترل قابل‌تعامل در پیش‌نمایش بالا، نامی که یک صفحه‌خوان واقعاً اعلام می‌کند — محاسبه‌شده در زمان ساخت، از همان بایت‌هایی که سرو می‌شوند، نه در مرورگر.",
    role: "نقش",
    name: "نام دسترس‌پذیر",
    empty: "بدون نام دسترس‌پذیر",
    none: "این نمونه هیچ کنترل قابل‌تعاملی ندارد.",
    count: (n) => `${n} کنترل بررسی شد`,
  },
  "en-US": {
    intro:
      "For every interactive control in the preview above, the name a screen reader actually announces — computed at build time, from the same bytes that are served, not in the browser.",
    role: "Role",
    name: "Accessible name",
    empty: "No accessible name",
    none: "This demo has no interactive controls.",
    count: (n) => `${n} controls checked`,
  },
};

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPanel(controls, locale) {
  const t = COPY[locale];
  if (!t) {
    throw new Error(`inject-evidence: unknown locale ${JSON.stringify(locale)} in an evidence slot.`);
  }

  const body =
    controls.length === 0
      ? `<p class="px-4 py-6 text-sm text-fg-muted">${escapeHtml(t.none)}</p>`
      : `<div class="overflow-x-auto">` +
        `<table class="w-full text-start text-sm"><thead>` +
        `<tr class="border-b border-border text-xs uppercase tracking-wide text-fg-subtle">` +
        `<th scope="col" class="px-4 py-2 text-start font-medium">${escapeHtml(t.role)}</th>` +
        `<th scope="col" class="px-4 py-2 text-start font-medium">${escapeHtml(t.name)}</th>` +
        `</tr></thead><tbody>` +
        controls
          .map(
            (c) =>
              `<tr class="border-b border-border last:border-0">` +
              `<td class="px-4 py-2 align-top">` +
              `<span dir="ltr" lang="en" data-lumo-latn="" class="font-mono text-xs text-fg-muted">${escapeHtml(c.role)}</span>` +
              `</td>` +
              `<td class="px-4 py-2 align-top">` +
              (c.name.trim()
                ? `<span class="text-fg">${escapeHtml(c.name)}</span>`
                : `<span class="font-medium text-critical">${escapeHtml(t.empty)}</span>`) +
              `</td></tr>`,
          )
          .join("") +
        `</tbody></table></div>`;

  return (
    `<div class="overflow-hidden rounded-lg border border-border">` +
    `<div class="border-b border-border bg-surface-sunken px-4 py-3"><p class="text-sm text-fg-muted">${escapeHtml(t.intro)}</p></div>` +
    body +
    `<p class="border-t border-border px-4 py-2 text-xs text-fg-subtle">${escapeHtml(t.count(formatCount(controls.length, locale)))}</p>` +
    `</div>`
  );
}

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

const SLOT_RE = /<div\b[^>]*\bdata-lumo-evidence-slot="[^"]*"[^>]*><\/div>/;
const LOCALE_RE = /data-lumo-evidence-locale="([^"]*)"/;

async function processFile(path) {
  const raw = await readFile(path, "utf8");
  if (!raw.includes("data-lumo-evidence-slot")) return false;

  const slotMatch = raw.match(SLOT_RE);
  if (!slotMatch) {
    throw new Error(
      `inject-evidence: ${relative(OUT_DIR, path)} mentions data-lumo-evidence-slot ` +
        `but the marker element could not be matched. It must be an EMPTY <div>.`,
    );
  }
  const localeMatch = slotMatch[0].match(LOCALE_RE);
  const locale = localeMatch?.[1];
  if (!locale) {
    throw new Error(
      `inject-evidence: ${relative(OUT_DIR, path)}'s evidence slot has no ` +
        `data-lumo-evidence-locale.`,
    );
  }

  const { document } = parseHTML(raw);
  const root = document.querySelector("[data-lumo-demo-root]");
  if (!root) {
    throw new Error(
      `inject-evidence: ${relative(OUT_DIR, path)} has an evidence slot but no ` +
        `[data-lumo-demo-root] to read the demo's markup from — preview-toolbar.tsx ` +
        `should always render one alongside it.`,
    );
  }

  const controls = [];
  for (const el of Array.from(root.querySelectorAll(INTERACTIVE))) {
    // Same ancestor exclusion as `named-controls`, and the same reason: a
    // control under `aria-hidden="true"`/`hidden` never reaches the
    // accessibility tree, so "no name" there is not a defect a screen reader
    // user can ever encounter.
    if (el.closest?.('[aria-hidden="true"],[hidden]')) continue;
    const name = computeAccessibleName(el, COMPUTED_STYLE_SHIM);
    controls.push({ role: describeRole(el), name });
  }

  const panel = renderPanel(controls, locale);
  const next = raw.slice(0, slotMatch.index) + panel + raw.slice(slotMatch.index + slotMatch[0].length);
  await writeFile(path, next, "utf8");
  return true;
}

const files = await htmlFiles(OUT_DIR);
let filled = 0;
for (const file of files) {
  if (await processFile(file)) filled++;
}

// Refusing to report success on nothing is the whole point of this script —
// the same stance `lumo-gate` itself takes (packages/gate/src/cli.ts) on an
// empty build directory.
if (filled === 0) {
  console.error("  inject-evidence: found no evidence slots under apps/website/out.");
  console.error("  Refusing to report success on nothing.");
  process.exit(1);
}

console.log(`  inject-evidence: filled ${filled} evidence panel(s)`);
