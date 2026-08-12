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
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeSource, type Verdict } from "./inert-props.ts";

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

  it("a `never` type passes — the older spelling, still live at seven sites", () => {
    expect(gradeSource("x.tsx", carrier("T & never"))).toEqual([]);
  });

  it("a single literal passes — a no-op the caller has no choice about", () => {
    expect(gradeSource("x.tsx", carrier("true | undefined"))).toEqual([]);
  });

  it("but a real type does NOT", () => {
    const v = gradeSource("x.tsx", carrier("boolean | undefined"));
    expect(v).toHaveLength(1);
    expect(v[0]?.verdict).toBe("dropped");
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
