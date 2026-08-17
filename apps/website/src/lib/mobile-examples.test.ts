import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mobileFileFor, validateApiReference, validateManifest } from "./mobile-examples";

/**
 * The Mobile side's two generated inputs, exercised from both ends: every
 * documented failure mode observed ACTUALLY failing (a rule that has never been
 * seen failing is decoration, per CONTRIBUTING.md), and the committed fixtures
 * parsed by the real validators, so the fixture cannot drift out of the contract
 * shape while it is standing in for the generators.
 */

const KNOWN = new Set(["button", "checkbox"]);

function manifest(slugs: Record<string, unknown>): unknown {
  return { version: 2, generatedFrom: [], locales: ["fa-IR", "en-US"], slugs };
}

const DEMO = {
  id: "button-1",
  title: { "fa-IR": "یک", "en-US": "One" },
  description: { "fa-IR": "شرح", "en-US": "Description" },
  source: { "fa-IR": "LumoButton(child: Text('ذخیره'))", "en-US": "LumoButton(child: Text('Save'))" },
};

describe("validateManifest", () => {
  it("accepts the contract shape", () => {
    const out = validateManifest(manifest({ button: [DEMO] }), KNOWN);
    expect([...out.keys()]).toEqual(["button"]);
    expect(out.get("button")?.[0]?.id).toBe("button-1");
  });

  it("refuses a version it does not read", () => {
    // v1 is the shape whose `source` was a bare string, before the snippet was
    // localized; reading it as v2 would hand the page a string where it indexes
    // by locale. Refusing loudly is the point of carrying a version at all.
    expect(() => validateManifest({ version: 1, slugs: {} }, KNOWN)).toThrow(/unsupported version/);
    expect(() => validateManifest({ version: 3, slugs: {} }, KNOWN)).toThrow(/unsupported version/);
  });

  it("refuses a slug with no component page", () => {
    expect(() => validateManifest(manifest({ nowhere: [DEMO] }), KNOWN)).toThrow(/unknown slug/);
  });

  it("refuses an empty slug — a route with nothing to show", () => {
    expect(() => validateManifest(manifest({ button: [] }), KNOWN)).toThrow(/no demos/);
  });

  it("refuses a demo id that is not <slug>-<n>", () => {
    expect(() =>
      validateManifest(manifest({ button: [{ ...DEMO, id: "button-primary" }] }), KNOWN),
    ).toThrow(/is not "<slug>-<n>"/);
    // The right shape under the WRONG slug is the same defect.
    expect(() =>
      validateManifest(manifest({ checkbox: [{ ...DEMO, id: "button-1" }] }), KNOWN),
    ).toThrow(/is not "<slug>-<n>"/);
  });

  it("refuses two demos sharing an anchor", () => {
    expect(() => validateManifest(manifest({ button: [DEMO, DEMO] }), KNOWN)).toThrow(/duplicate/);
  });

  it("refuses a string missing in ANY locale — there is no fallback", () => {
    const half = { ...DEMO, title: { "fa-IR": "یک" } };
    expect(() => validateManifest(manifest({ button: [half] }), KNOWN)).toThrow(/en-US/);
    const blank = { ...DEMO, description: { "fa-IR": "  ", "en-US": "One" } };
    expect(() => validateManifest(manifest({ button: [blank] }), KNOWN)).toThrow(/fa-IR/);
  });

  it("refuses an empty source slice", () => {
    expect(() => validateManifest(manifest({ button: [{ ...DEMO, source: { "fa-IR": "", "en-US": "x" } }] }), KNOWN)).toThrow(
      /source is empty/,
    );
  });
});

describe("mobileFileFor", () => {
  it("is the slug's own Dart file by default", () => {
    expect(mobileFileFor("date-field")).toBe("packages/mobile/lib/src/date_field.dart");
  });

  it("states the families the two libraries name differently", () => {
    // Every alias points at a file that EXISTS: an alias to nothing is a page
    // documenting a component that is not there.
    for (const [slug, file] of [
      ["drawer", "sheet.dart"],
      ["input-otp", "otp_field.dart"],
      ["tag", "chip.dart"],
    ] as const) {
      const path = mobileFileFor(slug);
      expect(path).toBe(`packages/mobile/lib/src/${file}`);
      expect(existsSync(join(process.cwd(), "..", "..", path))).toBe(true);
    }
  });
});

const WIDGET = {
  file: "packages/mobile/lib/src/button.dart",
  doc: "",
  props: [{ name: "child", type: "Widget", required: true, default: null, description: "" }],
};

describe("validateApiReference", () => {
  it("folds a default into the type, the way a Dart reader reads one", () => {
    const out = validateApiReference({
      version: 1,
      widgets: {
        LumoButton: {
          ...WIDGET,
          props: [
            { name: "variant", type: "LumoButtonVariant", required: false, default: "LumoButtonVariant.solid", description: "" },
          ],
        },
      },
      enums: { LumoButtonVariant: ["solid"] },
    });
    expect(out.widgets.get("LumoButton")?.props[0]?.type).toBe(
      "LumoButtonVariant = LumoButtonVariant.solid",
    );
  });

  it("collects the required Strings — the announced ones", () => {
    const out = validateApiReference({
      version: 1,
      widgets: {
        LumoIconButton: {
          ...WIDGET,
          props: [
            { name: "label", type: "String", required: true, default: null, description: "" },
            { name: "hint", type: "String?", required: false, default: null, description: "" },
          ],
        },
      },
    });
    expect(out.widgets.get("LumoIconButton")?.announced).toEqual(["label"]);
  });

  it("refuses a version it does not read", () => {
    expect(() => validateApiReference({ version: 2, widgets: {} })).toThrow(/unsupported version/);
  });

  it("refuses a widget with no file — the slug is derived from it", () => {
    expect(() =>
      validateApiReference({ version: 1, widgets: { LumoButton: { props: [] } } }),
    ).toThrow(/no `file`/);
  });

  it("refuses a non-boolean `required` — it is the whole headline", () => {
    expect(() =>
      validateApiReference({
        version: 1,
        widgets: { LumoButton: { ...WIDGET, props: [{ ...WIDGET.props[0], required: "yes" }] } },
      }),
    ).toThrow(/required. is not a boolean/);
  });

  it("refuses an invented description — it must be the docblock or empty", () => {
    expect(() =>
      validateApiReference({
        version: 1,
        widgets: { LumoButton: { ...WIDGET, props: [{ ...WIDGET.props[0], description: null }] } },
      }),
    ).toThrow(/description/);
  });
});

describe("the committed fixtures", () => {
  const dir = join(process.cwd(), "src", "lib", "__fixtures__");
  const read = (name: string): unknown => JSON.parse(readFileSync(join(dir, name), "utf8"));

  it("are the contract shape the real generators must produce", () => {
    const demos = validateManifest(read("mobile-demos.generated.json"), KNOWN);
    expect([...demos.keys()].sort()).toEqual(["button", "checkbox"]);

    const api = validateApiReference(read("mobile-api-reference.json"));
    // Both branches of the announced-strings section have a fixture behind them.
    expect(api.widgets.get("LumoIconButton")?.announced).toEqual(["label"]);
    expect(api.widgets.get("LumoCheckbox")?.announced).toEqual([]);
  });

  it("give every demoed slug a widget in the matching Dart file", () => {
    const demos = validateManifest(read("mobile-demos.generated.json"), KNOWN);
    const api = validateApiReference(read("mobile-api-reference.json"));
    for (const slug of demos.keys()) {
      const file = `packages/mobile/lib/src/${slug.replace(/-/g, "_")}.dart`;
      expect([...api.widgets.values()].some((w) => w.file === file)).toBe(true);
    }
  });
});
