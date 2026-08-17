import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { LOCALES } from "@lumo-ui/core";
import type { LocalizedText } from "@/examples/_system/types";
import { exampleSlugs, type GeneratedApiGroup } from "@/lib/examples-loader";

/**
 * The MOBILE side of a component page — `/components/<slug>/mobile/`.
 *
 * SERVER-ONLY, like `examples-loader.ts`: it reads generated JSON during
 * `next build` (static export, so "server" means the build). Two GENERATED
 * files, never hand-edited (AGENTS.md rule 6), each owned by another workstream:
 *
 *   1. `src/lib/mobile-demos.generated.json` — `scripts/build-mobile-demos.mjs`
 *      slices the gallery's demo widgets and their Dart source. It decides WHICH
 *      slugs have a Mobile side: a slug has one iff it has demos here. Nothing
 *      is hand-listed.
 *   2. `mobile-api-reference.json` at the repo root — `scripts/build-mobile-api.mjs`
 *      parses `packages/mobile/lib/src/*.dart`. It is the props table.
 *
 * Validation is LOUD and at build time, the same discipline as the web loader:
 * an unknown slug, a demo id that is not `<slug>-<n>`, a duplicate id, or a
 * localized string missing in ANY locale throws rather than degrading. There is
 * no partial locale and no English fallback — see CONTRIBUTING.md.
 *
 * While the two generators are still landing, `LUMO_MOBILE_DOCS_FIXTURE=1`
 * points both reads at `src/lib/__fixtures__/` (two slugs in the exact contract
 * shape), so this side can be built and graded before its inputs exist. Without
 * the flag and without the real files, there is simply no Mobile side: no
 * routes, no phone glyphs, no switch.
 */

const WEBSITE_ROOT = process.cwd();
const REPO_ROOT = join(WEBSITE_ROOT, "..", "..");
const FIXTURES = join(WEBSITE_ROOT, "src", "lib", "__fixtures__");

const DEMOS_FILE = join(WEBSITE_ROOT, "src", "lib", "mobile-demos.generated.json");
const API_FILE = join(REPO_ROOT, "mobile-api-reference.json");
const DEMOS_FIXTURE = join(FIXTURES, "mobile-demos.generated.json");
const API_FIXTURE = join(FIXTURES, "mobile-api-reference.json");

/** The Flutter web gallery, one app for every demo (contract §1). */
export const GALLERY_PATH = "/mobile-preview/index.html";

/** The Dart library the Mobile side documents, and where a consumer pins it from. */
export const MOBILE_PACKAGE = "lumo_ui_mobile";
export const MOBILE_PACKAGE_PATH = "packages/mobile";
export const MOBILE_REPO_URL = "https://github.com/Telarsa/lumo-ui.git";
/** The same repository as a page a reader can open — the evidence links. */
export const MOBILE_REPO_BROWSE = "https://github.com/Telarsa/lumo-ui";

/** The version tag a consumer pins — read from the ROOT package.json, never typed here. */
export const MOBILE_VERSION = (
  JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as { version: string }
).version;

/** `date-field` → `date_field`: the Dart file, test file and widget naming. */
export function snakeOf(slug: string): string {
  return slug.replace(/-/g, "_");
}

/**
 * The handful of families the two libraries NAME DIFFERENTLY.
 *
 * Almost every website slug is its Dart file: `date-field` → `date_field.dart`.
 * These four are not, because the mobile library took the platform's word for
 * the same thing rather than the web's. The mapping is stated rather than
 * guessed, and `mobileFileFor` FAILS CLOSED on a slug that resolves to no file
 * at all — a silent guess here is a page whose props table documents a
 * different component than its demos.
 *
 * Contract §2 keys demos by WEBSITE slug and §3 keys widgets by Dart FILE, and
 * neither carries the join; until one of them does, it lives here.
 */
const MOBILE_FILE_FOR_SLUG: Readonly<Record<string, string>> = {
  // The web's Drawer is the platform's bottom sheet.
  drawer: "sheet.dart",
  // The web's InputOTP is the platform's one-time-code field.
  "input-otp": "otp_field.dart",
  // The web's Tag is Material's Chip.
  tag: "chip.dart",
};

/** The Dart file, repo-relative, that a website slug's Mobile side documents. */
export function mobileFileFor(slug: string): string {
  const file = MOBILE_FILE_FOR_SLUG[slug] ?? `${snakeOf(slug)}.dart`;
  return `${MOBILE_PACKAGE_PATH}/lib/src/${file}`;
}

export interface MobileDemo {
  /** `<slug>-<n>`, the gallery's demo id AND the page anchor `#demo-<id>`. */
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  /**
   * The Dart the reader copies, per locale — the generator resolves the demo's
   * copy table into literals, so each page shows a snippet in its own language.
   */
  source: LocalizedText;
}

export interface MobileEnum {
  name: string;
  values: readonly string[];
}

/** One required `String` parameter — the contract's headline, in table form. */
export interface AnnouncedString {
  widget: string;
  name: string;
}

export interface LoadedMobileDemos {
  slug: string;
  demos: readonly MobileDemo[];
  /** `PropsTable`-shaped groups, one per widget the slug's Dart file declares. */
  api: readonly GeneratedApiGroup[];
  /** The widget class names, primary first. */
  widgets: readonly string[];
  /** The widget-level docblocks, keyed by widget name. */
  docs: Readonly<Record<string, string>>;
  /** Every required `String` parameter across the slug's widgets. */
  announced: readonly AnnouncedString[];
  /** The enums the slug's props actually reference, values included. */
  enums: readonly MobileEnum[];
  /** Repo-relative Dart source file(s) the props are generated from. */
  files: readonly string[];
  /** Repo-relative semantics-tree test — the evidence. */
  testPath: string;
  /** False when the family's semantics tests live in a shared file instead. */
  hasOwnTest: boolean;
}

/* ------------------------------------------------------------------ shapes */

interface RawDemo {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  source?: unknown;
}

interface RawManifest {
  version?: unknown;
  generatedFrom?: unknown;
  slugs?: unknown;
}

interface RawApiProp {
  name?: unknown;
  type?: unknown;
  required?: unknown;
  default?: unknown;
  description?: unknown;
}

interface RawApiWidget {
  file?: unknown;
  doc?: unknown;
  props?: unknown;
}

interface RawApiReference {
  version?: unknown;
  generatedFrom?: unknown;
  widgets?: unknown;
  enums?: unknown;
}

/* -------------------------------------------------------------- validation */

const DEMOS = "mobile-demos.generated.json";
const API = "mobile-api-reference.json";

function fail(file: string, message: string): never {
  throw new Error(`[mobile docs] ${file}: ${message}`);
}

function assertLocalizedText(value: unknown, where: string, field: string): LocalizedText {
  if (typeof value !== "object" || value === null) {
    fail(DEMOS, `${where}: ${field} is not an object of locale → string.`);
  }
  const record = value as Record<string, unknown>;
  for (const locale of LOCALES) {
    const text = record[locale];
    if (typeof text !== "string" || text.trim() === "") {
      fail(
        DEMOS,
        `${where}: ${field} is empty or missing for ${locale}. Every visible ` +
          `string exists in every locale — there is no partial locale and no ` +
          `English fallback (contract §2, CONTRIBUTING.md).`,
      );
    }
  }
  return record as LocalizedText;
}

/**
 * The manifest, validated whole. Exported for the loader's test: every failure
 * mode this file documents is observed actually failing, per CONTRIBUTING.md.
 */
export function validateManifest(
  raw: unknown,
  knownSlugs: ReadonlySet<string>,
): Map<string, readonly MobileDemo[]> {
  if (typeof raw !== "object" || raw === null) {
    fail(DEMOS, "the file is not a JSON object.");
  }
  const manifest = raw as RawManifest;
  if (manifest.version !== 2) {
    fail(
      DEMOS,
      `unsupported version ${JSON.stringify(manifest.version)} — this site reads ` +
        `version 2, in which \`source\` is localized per locale like \`title\` and ` +
        `\`description\` (a reader on the English page copies English Dart). ` +
        `Rebuild with scripts/build-mobile-demos.mjs.`,
    );
  }
  if (typeof manifest.slugs !== "object" || manifest.slugs === null) {
    fail(DEMOS, "`slugs` is missing — nothing declares which components have a Mobile side.");
  }

  const out = new Map<string, readonly MobileDemo[]>();
  for (const [slug, value] of Object.entries(manifest.slugs as Record<string, unknown>)) {
    if (!knownSlugs.has(slug)) {
      fail(
        DEMOS,
        `unknown slug "${slug}" — there is no component page at ` +
          `/components/${slug}/ for it to be the Mobile side of. The Web page is ` +
          `discovered from src/examples/${slug}.tsx; either add that, or rename ` +
          `the gallery's demo file to the slug the site already uses.`,
      );
    }
    if (!Array.isArray(value) || value.length === 0) {
      fail(
        DEMOS,
        `"${slug}" has no demos. A slug has a Mobile side IFF it has demos here ` +
          `(contract §4); an empty array is a route with nothing to show.`,
      );
    }
    const pattern = new RegExp(`^${slug}-([1-9][0-9]*)$`);
    const seen = new Set<string>();
    const demos: MobileDemo[] = [];
    for (const [index, entry] of (value as RawDemo[]).entries()) {
      const where = `slugs["${slug}"][${String(index)}]`;
      if (typeof entry !== "object" || entry === null) {
        fail(DEMOS, `${where}: not an object.`);
      }
      const id = entry.id;
      if (typeof id !== "string" || !pattern.test(id)) {
        fail(
          DEMOS,
          `${where}: demo id ${JSON.stringify(id)} is not "<slug>-<n>" for slug ` +
            `"${slug}" (contract §1 addresses the gallery by this id, and the page ` +
            `anchors #demo-<id> on it).`,
        );
      }
      if (seen.has(id)) {
        fail(DEMOS, `${where}: duplicate demo id "${id}" — two demos would share one anchor.`);
      }
      seen.add(id);
      // v2: the snippet is localized too. The generator resolves the demo's
      // copy table into literals per locale, so the English page shows Dart an
      // English reader can paste — not a reference to a `t['save']` lookup that
      // exists only inside the gallery.
      const source = assertLocalizedText(entry.source, where, "source");
      for (const [locale, dart] of Object.entries(source)) {
        if (dart.trim() === "") {
          fail(
            DEMOS,
            `${where}: source["${locale}"] is empty. It is sliced between ` +
              `"// BEGIN ${id}" and "// END ${id}" in the gallery's demo file — the ` +
              `markers are missing or enclose nothing.`,
          );
        }
      }
      demos.push({
        id,
        title: assertLocalizedText(entry.title, where, "title"),
        description: assertLocalizedText(entry.description, where, "description"),
        source: Object.fromEntries(
          Object.entries(source).map(([locale, dart]) => [locale, dart.replace(/\s+$/, "")]),
        ) as LocalizedText,
      });
    }
    out.set(slug, demos);
  }
  return out;
}

interface ValidatedApi {
  widgets: Map<string, { file: string; doc: string; props: GeneratedApiGroup["props"]; announced: string[] }>;
  enums: Map<string, readonly string[]>;
}

/**
 * The generated Dart API, validated whole. The `default` the contract carries is
 * folded into the TYPE column — `LumoButtonVariant = LumoButtonVariant.solid`,
 * which is how a Dart reader reads a defaulted parameter — because `PropsTable`
 * is the web pages' table and grows no fifth column for one platform.
 */
export function validateApiReference(raw: unknown): ValidatedApi {
  if (typeof raw !== "object" || raw === null) {
    fail(API, "the file is not a JSON object.");
  }
  const api = raw as RawApiReference;
  if (api.version !== 1) {
    fail(
      API,
      `unsupported version ${JSON.stringify(api.version)} — this site reads version 1 ` +
        `(contract §3). Rebuild with scripts/build-mobile-api.mjs.`,
    );
  }
  if (typeof api.widgets !== "object" || api.widgets === null) {
    fail(API, "`widgets` is missing — there are no props to table.");
  }

  const widgets: ValidatedApi["widgets"] = new Map();
  for (const [name, value] of Object.entries(api.widgets as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null) fail(API, `widgets["${name}"]: not an object.`);
    const widget = value as RawApiWidget;
    if (typeof widget.file !== "string" || widget.file.trim() === "") {
      fail(API, `widgets["${name}"]: no \`file\` — the slug a widget documents is derived from it.`);
    }
    if (!Array.isArray(widget.props)) {
      fail(API, `widgets["${name}"]: \`props\` is not an array.`);
    }
    const props: GeneratedApiGroup["props"][number][] = [];
    const announced: string[] = [];
    for (const [index, entry] of (widget.props as RawApiProp[]).entries()) {
      const where = `widgets["${name}"].props[${String(index)}]`;
      if (typeof entry !== "object" || entry === null) fail(API, `${where}: not an object.`);
      if (typeof entry.name !== "string" || entry.name.trim() === "") {
        fail(API, `${where}: no \`name\`.`);
      }
      if (typeof entry.type !== "string" || entry.type.trim() === "") {
        fail(API, `${where}: no \`type\` — an untyped row tells a reader nothing.`);
      }
      if (typeof entry.required !== "boolean") {
        fail(
          API,
          `${where}: \`required\` is not a boolean. It is Dart's \`required\` keyword, ` +
            `and on this library it is the whole headline: an announced string is a ` +
            `required parameter.`,
        );
      }
      const fallback = entry.default;
      if (fallback !== null && typeof fallback !== "string") {
        fail(API, `${where}: \`default\` must be the literal source text or null.`);
      }
      if (typeof entry.description !== "string") {
        fail(
          API,
          `${where}: \`description\` must be a string — the /// docblock, or "" when ` +
            `there is none. It is never invented (contract §3).`,
        );
      }
      props.push({
        name: entry.name,
        type: fallback === null ? entry.type : `${entry.type} = ${fallback}`,
        required: entry.required,
        description: entry.description,
      });
      if (entry.required && entry.type === "String") announced.push(entry.name);
    }
    widgets.set(name, {
      file: widget.file,
      doc: typeof widget.doc === "string" ? widget.doc : "",
      props,
      announced,
    });
  }

  const enums = new Map<string, readonly string[]>();
  if (api.enums !== undefined) {
    if (typeof api.enums !== "object" || api.enums === null) fail(API, "`enums` is not an object.");
    for (const [name, values] of Object.entries(api.enums as Record<string, unknown>)) {
      if (!Array.isArray(values) || values.some((v) => typeof v !== "string")) {
        fail(API, `enums["${name}"]: not an array of strings.`);
      }
      enums.set(name, values as string[]);
    }
  }
  return { widgets, enums };
}

/* ------------------------------------------------------------------ reading */

function usingFixture(): boolean {
  return process.env["LUMO_MOBILE_DOCS_FIXTURE"] === "1";
}

/**
 * The real generated file when it exists; the fixture ONLY under the env flag.
 * Never a silent invented default: with neither, there is no Mobile side at all.
 */
function resolveFile(real: string, fixture: string): string | undefined {
  if (existsSync(real)) return real;
  if (usingFixture() && existsSync(fixture)) return fixture;
  return undefined;
}

interface MobileData {
  demos: Map<string, readonly MobileDemo[]>;
  api: ValidatedApi;
}

let cached: MobileData | null | undefined;

function data(): MobileData | null {
  if (cached !== undefined) return cached;
  const demosPath = resolveFile(DEMOS_FILE, DEMOS_FIXTURE);
  if (demosPath === undefined) {
    cached = null;
    return cached;
  }
  const demos = validateManifest(
    JSON.parse(readFileSync(demosPath, "utf8")),
    new Set(exampleSlugs()),
  );
  const apiPath = resolveFile(API_FILE, API_FIXTURE);
  if (apiPath === undefined) {
    /*
     * Loud, not lenient: the demos exist, so the Mobile routes exist, and a
     * component page without its generated props table is half a page.
     */
    fail(
      API,
      `${DEMOS} declares ${String(demos.size)} slug(s) with a Mobile side, but the ` +
        `generated Dart API reference is not at ${API_FILE}. Run ` +
        `\`node scripts/build-mobile-api.mjs\` (contract §3).`,
    );
  }
  cached = { demos, api: validateApiReference(JSON.parse(readFileSync(apiPath, "utf8"))) };
  return cached;
}

/** Every slug that has a Mobile side, alphabetical. Derived, never hand-listed. */
export function mobileSlugs(): string[] {
  const loaded = data();
  if (loaded === null) return [];
  return [...loaded.demos.keys()].sort((a, b) => a.localeCompare(b));
}

/** Whether `/components/<slug>/mobile/` exists — the sidebar glyph and the Web page's switch. */
export function hasMobile(slug: string): boolean {
  return data()?.demos.has(slug) === true;
}

/**
 * One slug's Mobile side: its demos, and the widgets its Dart FILE declares.
 * The file is the join, not the name — `button.dart` declares `LumoButton` and
 * `LumoIconButton`, and both belong on the Button page.
 */
export function loadMobileDemos(slug: string): LoadedMobileDemos | undefined {
  const loaded = data();
  const demos = loaded?.demos.get(slug);
  if (loaded === null || loaded === undefined || demos === undefined) return undefined;

  /*
   * The join is the FILE, not the name: `button.dart` declares `LumoButton` AND
   * `LumoIconButton`, and both belong on the Button page. The file must EXIST —
   * that is what fails closed when a slug has no counterpart in the library at
   * all, and no alias has been stated for it.
   */
  const path = mobileFileFor(slug);
  const file = basename(path);
  if (!existsSync(join(REPO_ROOT, path))) {
    fail(
      DEMOS,
      `"${slug}" has ${String(demos.length)} demo(s), but ${path} does not exist. ` +
        `The website slug and the Dart file usually match; when the two libraries ` +
        `name the same family differently, state it in MOBILE_FILE_FOR_SLUG in ` +
        `this file — the page must never guess which widget its demos are of.`,
    );
  }
  /*
   * ZERO widgets in a file that DOES exist is a legitimate state, not a defect:
   * `toast.dart`'s public API is the function `showLumoToast`, and the generated
   * reference tables widget constructors. The page says so and links the file
   * rather than printing an empty table or refusing to render.
   */
  const matches = [...loaded.api.widgets.entries()].filter(([, w]) => basename(w.file) === file);
  // The family's own widget first — it is the group `PropsTable` opens.
  const primary = `Lumo${slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}`;
  matches.sort(([a], [b]) => {
    if (a === primary) return -1;
    if (b === primary) return 1;
    return a.localeCompare(b);
  });

  const api: GeneratedApiGroup[] = matches.map(([name, w]) => ({ name, props: w.props }));
  const announced = matches.flatMap(([name, w]) => w.announced.map((prop) => ({ widget: name, name: prop })));
  const docs = Object.fromEntries(matches.map(([name, w]) => [name, w.doc]));

  // Only the enums this slug's own props reference — the page is not the whole library.
  const types = matches.flatMap(([, w]) => w.props.map((p) => p.type));
  const enums = [...loaded.api.enums.entries()]
    .filter(([name]) => types.some((t) => new RegExp(`\\b${name}\\b`).test(t)))
    .map(([name, values]) => ({ name, values }))
    .sort((a, b) => a.name.localeCompare(b.name));

  /*
   * The evidence link. Most families have `test/<name>_test.dart`; a few are
   * covered inside the package-wide suite instead, and the page must not link
   * at a file that is not there — it says which one it is linking to.
   */
  const own = `${MOBILE_PACKAGE_PATH}/test/${snakeOf(slug)}_test.dart`;
  const hasOwnTest = existsSync(join(REPO_ROOT, own));

  return {
    slug,
    demos,
    api,
    widgets: matches.map(([name]) => name),
    docs,
    announced,
    enums,
    // The file the props came from — stated even when it declared no widget.
    files: matches.length > 0 ? [...new Set(matches.map(([, w]) => w.file))] : [path],
    testPath: hasOwnTest ? own : `${MOBILE_PACKAGE_PATH}/test/`,
    hasOwnTest,
  };
}

/**
 * The gallery URL for one demo (contract §1) — built HERE so the locale, the
 * theme and the id cannot be spelled three different ways across the page.
 */
export function galleryUrl(demoId: string, locale: string, theme: "light" | "dark"): string {
  return `${GALLERY_PATH}?demo=${encodeURIComponent(demoId)}&lang=${encodeURIComponent(locale)}&theme=${theme}`;
}
