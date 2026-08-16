/**
 * The inert-prop gate's self-test.
 *
 * Structured like `gate.test.ts` and for the same reason: a rule that has never
 * been observed failing is decoration, and one that has never been observed
 * PASSING correct code gets switched off the first time it is wrong. So every
 * failing verdict has a poison fixture, the fixture set is enumerated from the
 * directory rather than listed here — an orphan fixture or a verdict with no
 * fixture fails the suite — and `good.tsx` holds the three legitimate reasons a
 * prop can be unreferenced.
 *
 * The adversarial case is `mute-attempt.bad.tsx`. The `@forwarded` tag is this
 * gate's only escape hatch, so the thing most worth proving is that it does NOT
 * work on a prop that is simply dropped.
 */

import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  gradeRootContract,
  gradeSource,
  type RootVerdict,
  type Verdict,
} from "./inert-props.ts";

const FIXTURES = join(import.meta.dirname, "..", "fixtures", "inert-props");
const grade = (name: string) =>
  gradeSource(name, readFileSync(join(FIXTURES, name), "utf8"));

/** The verdicts that fail a build. Kept here as a literal so that adding one to
 *  the source without a fixture fails this suite rather than shipping ungraded. */
const FAILING: Verdict[] = ["dropped", "dom-leak", "unverified", "orphan"];

describe("self-test — every failing verdict has poison, and fires on it", () => {
  const files = readdirSync(FIXTURES).filter((f) => f.endsWith(".bad.tsx"));

  it("there is one poison fixture per failing verdict, plus the mute attempt", () => {
    expect(files.sort()).toEqual(
      [...FAILING.map((v) => `${v}.bad.tsx`), "mute-attempt.bad.tsx"].sort(),
    );
  });

  for (const verdict of FAILING) {
    it(`${verdict} fires on its poison`, () => {
      const v = grade(`${verdict}.bad.tsx`);
      expect(v.length).toBeGreaterThan(0);
      expect(v.map((x) => x.verdict)).toContain(verdict);
    });
  }

  it("the good fixture is clean", () => {
    expect(grade("good.tsx")).toEqual([]);
  });
});

/**
 * The four props this repository actually shipped.
 *
 * They are all fixed in the library now, so the tree is green and none of them
 * can fail a build any more. That is precisely why they are pinned here: the
 * evidence that a gate works must outlive the defects that motivated it.
 */
describe("the historical four", () => {
  const violations = grade("dropped.bad.tsx");
  const named = (prop: string) => violations.find((v) => v.prop.endsWith(`.${prop}`));

  for (const prop of [
    "isPending",
    "preventFocusOnPress",
    "isKeyboardDismissDisabled",
    "elementType",
  ]) {
    it(`catches ${prop}`, () => {
      expect(named(prop)?.verdict).toBe("dropped");
    });
  }

  it("says what to do, naming the component that drops it", () => {
    expect(named("isPending")?.detail).toMatch(/Button\(ButtonProps\) destructures its props/);
    expect(named("isPending")?.detail).toMatch(/make it unrepresentable/);
  });

  it("points a line at the declaration, not at the file", () => {
    expect(named("isPending")?.path).toMatch(/dropped\.bad\.tsx:\d+$/);
  });
});

/**
 * `elementType` twice, because it failed in two different ways in one file.
 *
 * `FieldError` bound no rest, so the prop evaporated; `Label` spread it onto a
 * real `<label>`, so React 19 warned and the served HTML carried
 * `elementType="div"`. Same name, same file, same docblock — different verdicts,
 * and the second is the one that reached readers.
 */
describe("dom-leak is a distinct verdict from dropped", () => {
  it("fires when an unknown name rides a rest onto an intrinsic element", () => {
    const v = grade("dom-leak.bad.tsx");
    expect(v).toHaveLength(1);
    expect(v[0]?.verdict).toBe("dom-leak");
    expect(v[0]?.detail).toMatch(/spreads `\.\.\.props` onto <label>/);
    expect(v[0]?.detail).toMatch(/React 19 warns/);
  });

  it("does NOT fire for a name the DOM knows on the same spread", () => {
    // `children` and `className` ride the identical spread in that fixture.
    expect(grade("dom-leak.bad.tsx").map((v) => v.prop)).toEqual(["LabelProps.elementType"]);
  });
});

/**
 * THE ESCAPE HATCH, TESTED FROM BOTH SIDES.
 *
 * `@forwarded` is the only way to clear an unverified prop, so it is the only
 * way to weaken this gate. It is admissible when the gate can independently see
 * a delivery path — a rest that carries the prop and is used, or the name being
 * named somewhere else in the file — and refused otherwise.
 */
describe("@forwarded cannot be a mute button", () => {
  it("is refused on a prop with no delivery path at all", () => {
    const v = grade("mute-attempt.bad.tsx");
    expect(v).toHaveLength(1);
    expect(v[0]?.verdict).toBe("dropped");
    expect(v[0]?.detail).toMatch(/appears nowhere else in this file/);
  });

  it("clears a rest ride once the destination is claimed", () => {
    const source = readFileSync(join(FIXTURES, "unverified.bad.tsx"), "utf8");
    expect(grade("unverified.bad.tsx")).toHaveLength(1);
    const claimed = source.replace(
      "  /** A ref to the arrow element, if there is one. */",
      "  /** @forwarded `...rest` → `Popover.Popup`, measured on the open dialog. */",
    );
    expect(source).not.toEqual(claimed);
    expect(gradeSource("unverified.bad.tsx", claimed)).toEqual([]);
  });
});

/**
 * The three legitimate reasons, each pinned on its own so a future tightening
 * that breaks one is named rather than diffuse. All three are shapes the library
 * uses today; `good.tsx` carries them together.
 */
describe("the legitimate reasons a prop is unreferenced", () => {
  const carrier = (type: string) => `
export interface XProps { children?: unknown; quiet?: ${type}; }
export function X({ children }: XProps) { return <div>{children}</div>; }
`;

  it("`?: undefined` passes — the type carrier", () => {
    expect(gradeSource("x.tsx", carrier("undefined"))).toEqual([]);
  });

  it("an intersection reduced to `never` passes", () => {
    expect(gradeSource("x.tsx", carrier("T & never"))).toEqual([]);
  });

  it("a union containing `never` is still passable and must be delivered", () => {
    const v = gradeSource("x.tsx", carrier("boolean | never"));
    expect(v).toHaveLength(1);
    expect(v[0]?.verdict).toBe("dropped");
  });

  it("an optional literal can request behavior and must be delivered", () => {
    const v = gradeSource("x.tsx", carrier("true | undefined"));
    expect(v).toHaveLength(1);
    expect(v[0]?.verdict).toBe("dropped");
  });

  it("but a real type does NOT", () => {
    const v = gradeSource("x.tsx", carrier("boolean | undefined"));
    expect(v).toHaveLength(1);
    expect(v[0]?.verdict).toBe("dropped");
  });
});

describe("renamed destructuring is not delivery", () => {
  it("reports a prop bound only to an underscore discard", () => {
    const src = `
export interface XProps { onOpenChange?: (open: boolean) => void; }
export function X({ onOpenChange: _onOpenChange }: XProps) { return <button />; }
`;
    const v = gradeSource("x.tsx", src);
    expect(v).toHaveLength(1);
    expect(v[0]?.prop).toBe("XProps.onOpenChange");
    expect(v[0]?.verdict).toBe("dropped");
  });
});

describe("module-scope name collisions are not delivery", () => {
  it("does not let a variant key clear a dropped prop of the same name", () => {
    const src = `
const variants = { size: { sm: "small", md: "medium" } };
export interface ProbeProps { size?: string; toneLabel?: string; }
export function Probe({ ...props }: ProbeProps) { return <div />; }
`;
    expect(gradeSource("probe.tsx", src).map((violation) => violation.prop).sort()).toEqual([
      "ProbeProps.size",
      "ProbeProps.toneLabel",
    ]);
  });
});

/**
 * Scope, pinned in both directions.
 *
 * The gate grades what a component file DECLARES. Widening it to inherited props
 * would drown it — `@lumo-ui/core`'s shared shapes are unreferenced by
 * construction — and narrowing it to EXPORTED interfaces only, which is how
 * AUDIT.md §5 item 1.1 words the task, would have missed most of what it found:
 * `NumberFieldPropsBase`, `PopoverPropsBase`, `TreePropsBase` and
 * `DisclosurePanelPropsBase` are all module-private.
 */
describe("scope", () => {
  it("grades a private base an exported Props extends", () => {
    const src = `
interface XPropsBase { hourCycle?: 12 | 24 | undefined; }
export interface XProps extends XPropsBase { label: string; }
export function X({ label }: XProps) { return <div>{label}</div>; }
`;
    expect(gradeSource("x.tsx", src).map((v) => v.prop)).toEqual(["XPropsBase.hourCycle"]);
  });

  it("ignores props inherited from another module", () => {
    const src = `
import type { DOMProps } from "@lumo-ui/core";
export interface XProps extends DOMProps { label: string; }
export function X({ label }: XProps) { return <div>{label}</div>; }
`;
    expect(gradeSource("x.tsx", src)).toEqual([]);
  });

  it("grades checker-resolved inherited behavior supplied by the CLI", () => {
    const src = `
import type { PressEvents } from "@lumo-ui/core";
export interface XProps extends PressEvents { label: string; }
export function X({ label }: XProps) { return <button>{label}</button>; }
`;
    const v = gradeSource("x.tsx", src, [
      { iface: "XProps", name: "onPress", typeText: "((event: unknown) => void) | undefined", line: 3 },
    ]);
    expect(v).toHaveLength(1);
    expect(v[0]?.prop).toBe("XProps.onPress");
    expect(v[0]?.verdict).toBe("dropped");
  });

  it("follows a discriminated union into each arm", () => {
    // `item.tsx`'s shape: one function, three arms, props declared per arm.
    const src = `
export interface AProps { href: string; }
export interface BProps { href?: undefined; onPress: () => void; }
export type XProps = AProps | BProps;
export function X(props: XProps) {
  if (props.href !== undefined) return <a href={props.href} />;
  return <button onClick={props.onPress} />;
}
`;
    expect(gradeSource("x.tsx", src)).toEqual([]);
  });
});

/**
 * ARMED WHERE IT MATTERS — the check this repository has learned to write twice.
 *
 * `cli.ts`'s header memorialises a rule that had a factory, a poison fixture, a
 * passing self-test, a README paragraph and a docs page, and was never in the
 * array the CLI ran. It then recurred one layer out: the arming moved into a
 * command-line ARGUMENT, and the argument was missing from the only two callers
 * that gate anything. Both times every artifact except the wiring was perfect.
 *
 * This gate has the same exposure and one more: it is a separate binary, so it
 * can be complete, tested, green — and simply not in `verify`. So the wiring is
 * asserted from the manifest, including the DIRECTORIES, because a gate pointed
 * at nothing exits 2 in CI but a gate pointed at one of two packages just
 * quietly grades half the library.
 */
describe("the gate is wired into verify", () => {
  const root = JSON.parse(
    readFileSync(join(import.meta.dirname, "..", "..", "..", "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };

  it("verify runs gate:props", () => {
    expect(root.scripts["verify"] ?? "").toContain("gate:props");
  });

  it("gate:props runs before gate:test — an inert prop makes tests PASS", () => {
    const verify = root.scripts["verify"] ?? "";
    expect(verify.indexOf("gate:props")).toBeGreaterThan(-1);
    expect(verify.indexOf("gate:props")).toBeLessThan(verify.indexOf("gate:test"));
  });

  it("gate:props grades both source packages", () => {
    const script = root.scripts["gate:props"] ?? "";
    expect(script).toContain("inert-props-cli.ts");
    expect(script).toContain("packages/ui/src");
    expect(script).toContain("packages/blocks/src");
  });

  it("the CLI resolves and rejects inherited core behavior", () => {
    const repo = join(import.meta.dirname, "..", "..", "..");
    const fixture = join(import.meta.dirname, "..", "fixtures", "inherited-props");
    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        join(import.meta.dirname, "inert-props-cli.ts"),
        fixture,
      ],
      { cwd: repo, encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("InheritedButtonProps.onPress");
  }, 30_000);
});

/**
 * The vacuity guard, at the level the CLI cannot check for itself.
 *
 * `gradeSource` returning `[]` is the success signal, and a parse that finds no
 * props returns `[]` too. This asserts the analyser actually sees a prop surface
 * in a real component file shape, so "clean" means graded rather than skipped.
 */
describe("not vacuous", () => {
  it("finds the prop surface of a file it reports clean", () => {
    const src = `
export interface XProps { label: string; tone?: "a" | "b"; }
export function X({ label, tone }: XProps) { return <div data-tone={tone}>{label}</div>; }
`;
    expect(gradeSource("x.tsx", src)).toEqual([]);
    // …and the same file with one prop unhandled is NOT clean, which is what
    // proves the empty result above was a decision rather than a no-op.
    const broken = src
      .replace("{ label, tone }", "{ label }")
      .replace("data-tone={tone}", 'data-tone="a"');
    expect(gradeSource("x.tsx", broken).map((v) => v.prop)).toEqual(["XProps.tone"]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE ROOT CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Same shape of self-test as the one above, and for the same reasons: the
 * fixture set is enumerated from the directory rather than listed, so a verdict
 * with no poison and a poison with no verdict both fail here; and `good.tsx`
 * carries every legal shape, because a rule that accuses correct code gets
 * switched off rather than loosened.
 */
const ROOT_FIXTURES = join(import.meta.dirname, "..", "fixtures", "root-contract");
const gradeRoot = (name: string) =>
  gradeRootContract(name, readFileSync(join(ROOT_FIXTURES, name), "utf8"));

const ROOT_FAILING: RootVerdict[] = [
  "no-ref-story",
  "undelivered-root",
  "unexplained-own",
  "overridable-owned",
];

describe("root contract — self-test", () => {
  it("there is one poison fixture per verdict, and no orphans", () => {
    const files = readdirSync(ROOT_FIXTURES).filter((f) => f.endsWith(".bad.tsx"));
    expect(files.sort()).toEqual(ROOT_FAILING.map((v) => `${v}.bad.tsx`).sort());
  });

  for (const verdict of ROOT_FAILING) {
    it(`${verdict} fires on its poison`, () => {
      const v = gradeRoot(`${verdict}.bad.tsx`);
      expect(v.length).toBeGreaterThan(0);
      expect(v.map((x) => x.verdict)).toContain(verdict);
    });
  }

  it("the good fixture is clean", () => {
    expect(gradeRoot("good.tsx")).toEqual([]);
  });
});

describe("root contract — the distinctions that make it usable", () => {
  it("fires on BOTH ways of not delivering", () => {
    // No rest at all, and a rest that is bound and abandoned. They are the same
    // defect to a consumer, and only the first is visible in a diff.
    expect(gradeRoot("undelivered-root.bad.tsx").map((v) => v.shape).sort()).toEqual([
      "PaginationProps",
      "ScrollAreaProps",
    ]);
  });

  it("fires on the element-specific `*HTMLAttributes` siblings too", () => {
    // `AnchorHTMLAttributes` was `link.tsx`'s and `item.tsx`'s base. A rule that
    // matched only the bare name would have cleared both.
    expect(gradeRoot("no-ref-story.bad.tsx").map((v) => v.shape).sort()).toEqual([
      "CardLinkProps",
      "CardProps",
    ]);
  });

  it("accepts an explanation in EITHER of the two places the house puts it", () => {
    // Inside the `Omit`'s key union (`table.tsx`), before `extends`
    // (`gantt.tsx`), and on the redeclared member (`stack.tsx`). All three are
    // in `good.tsx` and all three are clean; the assertion here is that
    // stripping the comment is what makes them fire, so the pass is about the
    // comment rather than about the shape.
    const good = readFileSync(join(ROOT_FIXTURES, "good.tsx"), "utf8");
    const stripped = good
      .replace(/\/\* `ref` and `onKeyDown` are the grid's own machinery[\s\S]*?\*\/\n/, "")
      .replace(/\/\* `ref` is owned: the pointer route hit-tests against it\. \*\/\n/, "")
      .replace(/ {2}\/\*\*\n {3}\* The root at the widest type[\s\S]*?\*\/\n/, "");
    expect(gradeRootContract("good.tsx", stripped).map((v) => v.shape).sort()).toEqual([
      "GanttProps",
      "StackProps",
      "TableProps",
    ]);
  });

  it("says nothing about a props type with no DOM base", () => {
    // The over-fire this rule is most likely to commit. Half the library's
    // props types are pure vocabulary — a `useLumoTable` options bag, a
    // `LumoStrings` slice — and none of them has a root to deliver anything to.
    const src = `
export interface OptionsProps { locale: string; count: number }
export function use(o: OptionsProps) { return o.locale + String(o.count); }
`;
    expect(gradeRootContract("o.tsx", src)).toEqual([]);
  });
});

/**
 * The wiring assertion, matching the one the inert-prop rule already has.
 *
 * Both rules run from one binary. A second rule that is written, tested, and
 * never invoked is the fourth incident in this repository's ledger of
 * "exists, self-tests, grades nothing" — three of which were only found later.
 */
describe("the root contract is actually invoked", () => {
  it("the CLI calls it and reports it", () => {
    const cli = readFileSync(join(import.meta.dirname, "inert-props-cli.ts"), "utf8");
    expect(cli).toContain("gradeRootContract");
    expect(cli).toContain("formatRootViolations");
  });

  it("and its violations decide the exit code", () => {
    const cli = readFileSync(join(import.meta.dirname, "inert-props-cli.ts"), "utf8");
    // Not `process.exit(violations.length …)` — that spelling would print the
    // root violations and exit 0, which is the exact shape of the three dead
    // rules AUDIT §7 records.
    expect(cli).toMatch(/const total = violations\.length \+ roots_\.length/);
    expect(cli).toContain("process.exit(total ? 1 : 0)");
  });
});

/**
 * The property-access hole, closed after controlled probes on `gantt.tsx`
 * measured it: a dead prop named `zzprobelumo` fired, dead `variant` and
 * `tone` fired, and dead `size` was silently cleared by `barIndexById.size`
 * — `Map.prototype.size`, a property of a different object entirely. The
 * mute set was not a word list but every name that appears as a property
 * access anywhere in the file: `size`, `count`, `type`, `value`, `length`.
 */
describe("a property accessed on something else is not delivery", () => {
  it("does not let Map.prototype.size clear a dropped prop named size", () => {
    const src = `
export interface ProbeProps { size?: string; }
export function Probe({ ...props }: ProbeProps) {
  const barIndexById = new Map<string, number>();
  const total = barIndexById.size;
  return <div data-total={total} />;
}
`;
    const v = gradeSource("probe.tsx", src);
    expect(v.map((x) => x.prop)).toContain("ProbeProps.size");
  });

  it("still clears a prop read off the props binding itself", () => {
    const src = `
export interface ProbeProps { size?: string; }
export function Probe(props: ProbeProps) {
  return <div data-size={props.size} />;
}
`;
    expect(gradeSource("probe.tsx", src)).toEqual([]);
  });

  it("element access follows the same rule: props['size'] clears, lookup['size'] does not", () => {
    const cleared = `
export interface ProbeProps { size?: string; }
export function Probe(props: ProbeProps) {
  return <div data-size={props["size"]} />;
}
`;
    const notCleared = `
const lookup: Record<string, number> = {};
export interface ProbeProps { size?: string; }
export function Probe({ ...props }: ProbeProps) {
  return <div data-size={lookup["size"]} />;
}
`;
    expect(gradeSource("probe.tsx", cleared)).toEqual([]);
    expect(gradeSource("probe.tsx", notCleared).map((x) => x.prop)).toContain("ProbeProps.size");
  });
});

/**
 * Anchor-only attributes inherited by a non-anchor. PROVED by the post-4eaf8ec
 * reevaluation: `<Tab hrefLang="fa">` served `<button … hrefLang="fa">`. Two
 * holes stacked — `LinkDOMProps` was not among the graded core owners at all,
 * and inherited-and-transported passed regardless of destination. Both are
 * closed; this fixture pins the second (the first is a CLI list).
 */
describe("anchor-only names inherited by a non-anchor are leaks, however transported", () => {
  const src = `
export interface XProps { label: string; }
export function X({ label, ...rest }: XProps) {
  const merged = { role: "tab", ...rest };
  return <Engine.Item {...merged}>{label}</Engine.Item>;
}
`;
  const inherited = [{ iface: "XProps", name: "hrefLang", typeText: "string | undefined", line: 2 }];

  it("flags hrefLang riding a rest into an object spread that reaches an engine component", () => {
    const v = gradeSource("x.tsx", src, inherited);
    expect(v.map((x) => `${x.verdict}:${x.prop}`)).toEqual(["dom-leak:XProps.hrefLang"]);
  });

  it("does not flag an ordinary inherited DOM global on the same path", () => {
    const v = gradeSource("x.tsx", src, [{ iface: "XProps", name: "id", typeText: "string | undefined", line: 2 }]);
    expect(v).toEqual([]);
  });
});
