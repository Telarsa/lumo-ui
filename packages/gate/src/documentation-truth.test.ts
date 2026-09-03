import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = import.meta.dirname;

const ROOT = join(import.meta.dirname, "..", "..", "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");

/**
 * Public documentation must describe the architecture that EXISTS.
 *
 * The original version of this file checked that the docs had stopped
 * describing the Preact/Zag scaffold and the React Aria engine after each was
 * retired. Both of those documents (`docs/architecture.md`, `docs/codebase.md`)
 * retired with the component library in §50.6, so every
 * assertion here was reading a path that no longer existed — the test failed,
 * and `verify` had been red on it since that commit.
 *
 * Retargeted 31 Aug 2026 rather than deleted, because the discipline is the
 * point and the failure mode just repeated one architecture later: a repo that
 * stops being a component library while its README still sells one.
 */
describe("the CLI a consumer is told to run", () => {
  /*
   * `lumo doctor` is the first command in `docs/agent-consumer.md`, so the
   * likeliest place anyone runs it for the first time is right here, inside
   * this repository, to see what it does. It used to answer:
   *
   *     @lumo-ui/core   MISSING — add it as a git dependency pinned to v0.3.0
   *
   * — advising you to install the package you are standing in. A tool whose
   * entire job is telling you the truth about your pins should not open by
   * getting that wrong.
   */
  it("knows when it is standing in its own repository", () => {
    const cli = readFileSync(join(SRC, "..", "..", "..", "scripts", "lumo-cli.mjs"), "utf8");
    expect(cli, "the self-recognition guard is gone").toContain('pkg.name === "lumo-ui"');
    // The guard must come BEFORE the pin check, or it reports first and
    // explains afterwards, which is the defect with an apology attached.
    expect(cli.indexOf('pkg.name === "lumo-ui"')).toBeLessThan(cli.indexOf('deps["lumo-ui"]'));
  });

  it("checks the ONE pin that exists, not the five that do not", () => {
    // `doctor` walked `@lumo-ui/core`, `@lumo-ui/theme`, `@lumo-ui/dates` and
    // `@lumo-ui/base-ui-ssr` until §60 collapsed the install, and then reported
    // the first two MISSING against a CORRECT 0.4.x consumer — telling them to
    // add two packages that are not published any more.
    const cli = readFileSync(join(SRC, "..", "..", "..", "scripts", "lumo-cli.mjs"), "utf8");
    expect(cli, "doctor is iterating the retired scoped names again").not.toMatch(
      /for \(const name of \[[^\]]*"@lumo-ui\/core"/,
    );
    expect(cli, "doctor no longer reads the one specifier there is").toContain('deps["lumo-ui"]');
  });

  it("names a version that is actually tagged in this repository", () => {
    // `doctor` tells a consumer to pin `v<version from package.json>`. If no
    // such tag exists the advice cannot be followed — which was true of every
    // install instruction in this repo until v0.3.0 was cut.
    const version = JSON.parse(
      readFileSync(join(SRC, "..", "..", "..", "package.json"), "utf8"),
    ).version as string;
    const tags = execFileSync("git", ["tag", "--list"], {
      cwd: join(SRC, "..", "..", ".."),
      encoding: "utf8",
    }).split("\n");
    expect(tags, `package.json is ${version} but no v${version} tag exists`).toContain(`v${version}`);
  });
});

describe("the report tells a reader how much work there is", () => {
  /*
   * The CLI prints an instance count AND a distinct count, and the second is
   * what someone has to act on.
   *
   * Site chrome repeats on every page, so an instance count measures the size
   * of the export. Measured on a live six-language product graded on
   * first contact: 750 violations were 182 distinct defects, and one rule's 225
   * instances were TEN strings — a header, a nav and a logo, on 44 routes.
   * "750 problems" invites a reader to turn the gate off; "750 occurrences of
   * 182 problems" invites them to fix the nav.
   *
   * Tested through the source rather than by running the binary, because the
   * thing worth pinning is that the two numbers are computed differently — a
   * `distinct` that is just `violations.length` under another name would print
   * happily and mean nothing.
   */
  it("counts distinct defects by rule AND detail, not by occurrence", () => {
    const cli = readFileSync(join(SRC, "cli.ts"), "utf8");
    const line = /const distinct = new Set\(([\s\S]{0,160}?)\)\.size;/.exec(cli);
    expect(line, "the distinct count is gone from cli.ts").not.toBeNull();
    // Both parts, or repeats of one rule with different details collapse into
    // one and the number becomes a rule count wearing the wrong label.
    expect(line![1]).toContain("v.rule");
    expect(line![1]).toContain("v.detail");
  });

  it("says only the instance count when nothing repeats", () => {
    // A clean run must not print "0 violation(s), 0 distinct", and a run where
    // every violation is unique must not print the same number twice.
    const cli = readFileSync(join(SRC, "cli.ts"), "utf8");
    expect(cli).toContain("distinct === violations.length");
  });
});

describe("public documentation describes what exists", () => {
  const PUBLIC = [
    "README.md",
    "AGENTS.md",
    "llms.txt",
    "docs/thesis.md",
    "docs/README.md",
    "skills/lumo-ui/SKILL.md",
  ] as const;

  it("does not point at packages, scripts or artifacts §50.6 deleted", () => {
    /*
     * Paths only — prose ABOUT the retirement is what these documents are
     * supposed to contain ("`packages/ui` is retired", "`lumo add` is gone"),
     * so the check is that a reader is never sent TO one of them.
     */
    const GONE = [
      "packages/ui/src",
      "packages/blocks/src",
      "apps/website/src/examples",
      "scripts/build-registry.mjs",
      "scripts/build-api-reference.mjs",
      "scripts/smoke-consumer.mjs",
      "docs/rubric.md",
      "docs/architecture.md",
      "docs/codebase.md",
    ];
    const offenders: string[] = [];
    for (const file of PUBLIC) {
      const text = read(file);
      for (const path of GONE) {
        if (text.includes(path)) offenders.push(`${file} → ${path}`);
      }
    }
    expect(offenders, "public docs send a reader to a deleted path").toEqual([]);
  });

  it("does not present Lumo as a component library", () => {
    /*
     * The single claim §50 reversed. A doc may say it USED to be one; what it
     * may not do is advertise the workflow — `lumo add <component>` is the
     * tell, because that command no longer exists.
     */
    const offenders: string[] = [];
    for (const file of PUBLIC) {
      const text = read(file);
      if (/`lumo (add|search|list|deps|upgrade|diff)\b/.test(text) && !/gone|retired|no longer/i.test(text)) {
        offenders.push(file);
      }
    }
    expect(offenders, "a doc still advertises a retired CLI command").toEqual([]);
  });

  it("states the gate count the scripts actually define", () => {
    /*
     * `docs/verification.md` publishes the number of gates in `verify`. It has
     * drifted before — the counts in this repo's own docs were stale on five
     * separate figures the day §50 was written.
     */
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    const actual = pkg.scripts.verify!.split("&&").filter((s) => s.includes("gate:")).length;
    const doc = read("docs/verification.md");
    const claimed = /The chain is (\w+) gates/.exec(doc)?.[1];
    const WORDS: Record<string, number> = {
      twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    };
    expect(claimed, "verification.md no longer states a gate count").toBeDefined();
    expect(WORDS[claimed!], `verification.md says "${claimed}"`).toBe(actual);
  });
});
