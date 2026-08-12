/**
 * Two ways a colour can be written, reviewed, shipped — and paint nothing.
 *
 * ── WHY THIS SUITE EXISTS ──────────────────────────────────────────────────
 *
 * `state-vocabulary.test.tsx` is about SELECTORS addressed to an engine that
 * writes a different vocabulary. This one is about the other half of the same
 * failure: a selector that matches, on an element that is styled, with a colour
 * that changes nothing. Both produce a component that renders, type-checks,
 * looks plausible in a screenshot and has a state a reader cannot see.
 *
 * The two shapes, both measured on this branch on 12 Aug 2026:
 *
 *   1. A NAME THE THEME DOES NOT PUBLISH. `icon-tile.tsx` offered a
 *      `tone="warning"` whose classes were `bg-warning/10 text-warning`, and
 *      `packages/theme` publishes `--color-caution` and no `--color-warning` at
 *      all. Tailwind emits nothing for a colour it cannot resolve, so the tile
 *      rendered with no tint and no foreground — untinted, on the docs site,
 *      beside three tones that worked. Nothing errors: a cva variant key is a
 *      string, and an unresolvable utility is silently dropped.
 *
 *   2. TWO TOKENS THAT ARE THE SAME COLOUR. On the light theme `tokens.css`
 *      resolves `--lumo-sys-surface-hover` AND `--lumo-sys-surface-sunken` to
 *      the same `--lumo-ref-neutral-100`, so any component distinguishing two
 *      states with those two tokens has one appearance for both.
 *      `toggle.variants.ts` and `sidebar.variants.ts` carry the earlier
 *      measurements; the assertions below cover the four places found in the
 *      date/board/tree batch.
 *
 * ── WHY THE FIRST ONE READS THE DIRECTORY ──────────────────────────────────
 *
 * Same argument `state-vocabulary.test.tsx` makes for its own sweep, and the
 * same evidence: `icon-tile` was not on anybody's list, which is precisely why
 * a wrong colour lived in it. A suite that checks what someone remembered to add
 * checks the components nobody forgot. So the vocabulary check enumerates
 * `src/`, and a component added tomorrow is covered without anyone editing this
 * file.
 *
 * ── AND WHY THE SECOND ONE CANNOT ──────────────────────────────────────────
 *
 * "Two states must look different" is not decidable from source text in general
 * — a state may be carried by a border, a shadow, a weight or a hue, and any of
 * those is a legitimate answer. What IS decidable is the rule the earlier
 * measurements produced: a state must not be drawn from the neutral SURFACE
 * ramp that the hover fill comes from, because that ramp is where the collision
 * lives and where the next theme edit can recreate it. That is asserted per
 * component, on the token FAMILY rather than on the string, because a
 * string comparison passes on both of the defects above.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { iconTileVariants } from "./icon-tile.tsx";
import {
  calendarNavButtonVariants,
  datePickerTriggerVariants,
  rangeCalendarCellVariants,
  rangeCalendarSelectionVariants,
} from "./calendar.variants.ts";
import { sortableHandleVariants } from "./sortable.tsx";
import { kanbanHandleVariants } from "./kanban.tsx";
import { treeChevronVariants } from "./tree.variants.ts";
import { dateSelectorPresetVariants } from "./date-selector.variants.ts";
import { timelineItemVariants, timelineRailVariants } from "./timeline.tsx";
import { alertIconVariants, alertVariants } from "./alert.tsx";
import { badgeVariants } from "./badge.tsx";

const SRC = import.meta.dirname;
// Through the filesystem, not through an import: these are CSS files with no
// module graph, and `import.meta.url` under vitest is a `/@fs` dev-server URL
// rather than a path.
const THEME = join(SRC, "..", "..", "theme", "src", "theme.css");
const TOKENS = join(SRC, "..", "..", "theme", "src", "tokens.css");

/** Every `--color-*` name `theme.css` publishes to Tailwind. */
function publishedColours(): Set<string> {
  const css = readFileSync(THEME, "utf8");
  return new Set([...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1] as string));
}

/**
 * The utilities in `classes` under one variant prefix, sorted and joined.
 *
 * Sorted so the comparison is of the SET of rules, not of the order somebody
 * typed them in — the same normalisation `state-vocabulary.test.tsx` uses on
 * `toggleVariants`.
 */
function utilities(classes: string, prefix: string): string {
  return classes
    .split(/\s+/)
    .filter((c) => c.startsWith(prefix))
    .map((c) => c.slice(prefix.length))
    .sort()
    .join(" ");
}

/* ════════════════════════════════════════════════════════════════════════════
 * 1. NO CLASS NAMES A COLOUR THE THEME DOES NOT PUBLISH
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("every colour utility names a token theme.css publishes", () => {
  /**
   * Tailwind's own non-colour values for the three utilities that take one.
   *
   * These are the vocabularies where `bg-`, `text-` and `border-` mean something
   * other than a colour — a size, a side, a border style, an alignment. They are
   * finite, they are Tailwind's rather than ours, and they move on a major
   * version. Listing them is what lets the check flag EVERYTHING else rather
   * than needing a list of the colours we expect to find, which is the list that
   * would have had `warning` in it.
   */
  const KEYWORDS: Record<string, ReadonlySet<string>> = {
    bg: new Set([
      "transparent", "current", "inherit", "black", "white", "none", "clip",
      "origin", "repeat", "size", "position", "fixed", "local", "scroll",
      "auto", "cover", "contain", "center", "top", "bottom", "left", "right",
      "blend",
    ]),
    text: new Set([
      "transparent", "current", "inherit", "xs", "sm", "base", "lg", "xl",
      "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl", "start", "end",
      "center", "left", "right", "justify", "wrap", "nowrap", "balance",
      "pretty", "ellipsis", "clip", "shadow",
    ]),
    border: new Set([
      "transparent", "current", "inherit", "solid", "dashed", "dotted",
      "double", "hidden", "none", "collapse", "separate", "spacing",
      // The logical and physical SIDES, which take a width rather than a colour.
      "s", "e", "t", "b", "x", "y", "bs", "be",
    ]),
  };

  /** Strips comments so prose naming a colour that was removed cannot fail this. */
  function code(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  }

  const sources = readdirSync(SRC).filter(
    (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes(".test."),
  );

  it("has sources to sweep (guards against a vacuous pass)", () => {
    expect(sources.length).toBeGreaterThan(80);
  });

  it.each(sources.map((f) => [f] as const))("%s names no unpublished colour", (file) => {
    const colours = publishedColours();
    const source = code(readFileSync(`${SRC}/${file}`, "utf8"));
    // `bg-accent/10`, `border-s-critical`, `group-hover:text-fg-muted` — the
    // optional side segment is consumed so `border-s-critical` is read as the
    // colour `critical`, and the trailing lookahead keeps `./text-field.tsx`
    // out of the match.
    const utility = /(?<![\w-])(bg|text|border)-((?:[sextyb]|bs|be)-)?([a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*)(?:\/\d+)?(?![\w[/.-])/g;
    const unknown: string[] = [];
    for (const match of source.matchAll(utility)) {
      const util = match[1] as string;
      const name = match[3] as string;
      if (KEYWORDS[util]?.has(name) === true) continue;
      if (colours.has(name)) continue;
      unknown.push(match[0]);
    }
    expect(
      [...new Set(unknown)],
      `${file} styles a colour packages/theme publishes no --color-* for; ` +
        `Tailwind emits nothing for it and the state renders untinted`,
    ).toEqual([]);
  });

  it("catches an unpublished colour (mutation check, so the sweep is not vacuous)", () => {
    // The exact defect measured in `icon-tile.tsx`: `caution` is a token,
    // `warning` reads like one and is not.
    const colours = publishedColours();
    expect(colours.has("caution")).toBe(true);
    expect(colours.has("warning")).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 2. NO STATE IS DRAWN FROM THE RAMP ITS OWN HOVER COMES FROM
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the neutral surface ramp", () => {
  it("still resolves hover and sunken to ONE colour on the light theme", () => {
    /*
     * The premise every assertion below rests on, read from the theme rather
     * than restated from memory. If a future theme edit genuinely separates the
     * two, this fails FIRST — and the right response is to read this header and
     * decide deliberately, not to weaken the rules underneath it. The rules
     * would still be right: an ON state one step along the hover ramp is one
     * edit away from being invisible again.
     */
    const css = readFileSync(TOKENS, "utf8");
    const light = css.slice(css.indexOf(":root,"), css.indexOf("@media (prefers-color-scheme"));
    const hover = /--lumo-sys-surface-hover:\s*var\(([^)]+)\)/.exec(light)?.[1];
    const sunken = /--lumo-sys-surface-sunken:\s*var\(([^)]+)\)/.exec(light)?.[1];
    expect(hover).toBeDefined();
    expect(sunken).toBe(hover);
  });

  /**
   * A press that repaints the pixel the pointer already painted.
   *
   * Both of these carried `hover:bg-surface-hover` beside
   * `active:bg-surface-sunken`, which is one colour on the light theme. The
   * assertion is on the token family and on the SET of utilities, because the
   * two strings were never equal — `bg-surface-hover` and `bg-surface-sunken`
   * compare as different text and render as the same paint.
   */
  it.each([
    ["calendar nav button", calendarNavButtonVariants()],
    ["date picker trigger", datePickerTriggerVariants()],
  ])("%s presses to a different HUE, not another step on the ramp", (_name, classes) => {
    const hover = utilities(classes, "hover:");
    const press = utilities(classes, "active:");
    expect(hover, "no hover treatment").not.toBe("");
    expect(press, "no press treatment").not.toBe("");
    expect(press, "the press repeats the hover").not.toBe(hover);
    expect(press, "the press fill is on the ramp the hover comes from").not.toMatch(
      /bg-surface/,
    );
    /*
     * ── WHAT REPLACED THE `hover:active:` REQUIREMENT, AND WHY IT IS BETTER ──
     *
     * This used to demand `hover:active:bg-` on both strings. The reasoning was
     * exactly right for the press these components then had: a mouse press
     * arrives WITH the pointer, `hover:bg-surface-hover` and
     * `active:bg-accent/10` are both (0,2,0), and which one paints would have
     * been decided by the order Tailwind emits its variants in. `.x:hover:active`
     * is (0,3,0) and settled it.
     *
     * The requirement is gone because the CONFLICT is gone. The library's press
     * is `active:translate-y-px`, and `translate` is not a property any hover,
     * selected, current or highlighted rule in this library writes — so the two
     * compose and there is nothing left to out-specify. That orthogonality is
     * one of the three reasons the nudge won; `button.variants.ts` has the other
     * two and the measurements.
     *
     * The assertion therefore becomes the general form of what the old one was
     * defending: the press must not write a declaration the hover also writes.
     */
    const property = (utility: string) => utility.replace(/-.*$/, "");
    const hoverProperties = new Set(hover.split(" ").filter(Boolean).map(property));
    for (const utility of press.split(" ").filter(Boolean)) {
      expect(
        hoverProperties.has(property(utility)),
        `the press and the hover both write \`${property(utility)}\`, so at equal ` +
          `specificity the winner is Tailwind's emission order`,
      ).toBe(false);
    }
  });

  it("a selected range's middle is not the day-cell hover fill", () => {
    const middle = rangeCalendarSelectionVariants()["range_middle"] ?? "";
    const cell = rangeCalendarCellVariants();
    expect(middle, "no fill on the middle of a range").not.toBe("");
    // The band and an idle day under the cursor were both neutral-100 on light.
    expect(middle, "the range band is on the neutral surface ramp").not.toMatch(
      /bg-surface/,
    );
    expect(cell, "the cell has no hover fill to collide with").toContain(
      "hover:bg-surface-hover",
    );
    // And the band survives the pointer: without its own hover rule the cell's
    // neutral fill repaints every middle day the mouse crosses, breaking the
    // continuous band the component exists to draw.
    expect(middle, "the band breaks under the pointer").toMatch(/hover:bg-/);
  });

  it.each([
    ["sortable", sortableHandleVariants()],
    ["kanban", kanbanHandleVariants()],
  ])("%s's HELD grip does not look like a hovered one", (_name, classes) => {
    const hover = utilities(classes, "hover:");
    const held = utilities(classes, "data-held:");
    expect(hover, "no hover treatment").not.toBe("");
    expect(held, "no held treatment").not.toBe("");
    // These two were character-for-character identical: `bg-surface-hover` and
    // `text-fg` under both prefixes, on both themes.
    expect(held.replace(/cursor-\S+\s*/g, "").trim(), "the held state is a copy of the hover").not.toBe(
      hover,
    );
    expect(held, "the held fill is on the ramp the hover comes from").not.toMatch(
      /bg-surface/,
    );
    // A pointer drag keeps the cursor on the handle for its whole duration, so
    // this is the rule that decides what a dragging reader actually sees.
    expect(classes, "the held state loses to hover while dragging").toContain(
      "data-held:hover:bg-",
    );
  });

  it("the tree's marker keeps its glyph on a SELECTED row under the pointer", () => {
    const classes = treeChevronVariants();
    // A selected row is `bg-accent text-accent-fg`; the unconditional neutral
    // hover painted near-white behind near-white.
    expect(classes, "no selected-row hover rule").toContain(
      "group-data-selected/lumo-tree-item:hover:bg-",
    );
    const onSelected = utilities(classes, "group-data-selected/lumo-tree-item:hover:");
    expect(onSelected, "the selected row's marker hovers to a neutral surface").not.toMatch(
      /bg-surface/,
    );
    // Both halves, or the fill changes and the glyph does not follow it.
    expect(onSelected).toMatch(/text-/);
  });

  it("the date selector's chosen preset keeps its tint under the pointer", () => {
    const active = dateSelectorPresetVariants({ active: true });
    const idle = dateSelectorPresetVariants({ active: false });
    expect(idle, "no hover treatment to collide with").toContain("hover:bg-surface-hover");
    expect(active, "the chosen preset has no tint").toContain("bg-accent/10");
    // Keyed to the attribute the component already writes, at (0,3,0), so the
    // neutral hover cannot win by emission order — and so the tint cannot
    // outlive the announcement.
    expect(active, "the chosen preset's tint is repainted by its own hover").toContain(
      "aria-pressed:hover:bg-",
    );
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 3. A VARIANT THAT PROMISES TWO THINGS AND DELIVERS ONE
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("Timeline's tone reaches the rail, not only the dot", () => {
  /**
   * `timelineItemVariants`' docblock says the tone is "the rail's colour BELOW
   * this item, AND the dot's fill", and the rail was a flat `bg-border` reading
   * no custom property at all. Half a variant, documented as whole.
   */
  it.each(["neutral", "accent", "positive", "critical"] as const)(
    "%s sets both the dot and the rail",
    (tone) => {
      const classes = timelineItemVariants({ tone });
      expect(classes, `${tone} sets no dot colour`).toContain("--lumo-timeline-dot:");
      expect(classes, `${tone} sets no rail colour`).toContain("--lumo-timeline-rail:");
    },
  );

  it("the rail reads the property the item sets", () => {
    // The half that was missing. Asserted on the rail rather than only on the
    // item, because four items setting a property nothing reads is exactly what
    // shipped.
    expect(timelineRailVariants()).toContain("var(--lumo-timeline-rail");
  });

  it("a toned rail is a different colour from a neutral one", () => {
    const neutral = /--lumo-timeline-rail:([^\]]+)/.exec(timelineItemVariants({ tone: "neutral" }));
    const positive = /--lumo-timeline-rail:([^\]]+)/.exec(
      timelineItemVariants({ tone: "positive" }),
    );
    expect(neutral?.[1]).toBeDefined();
    expect(positive?.[1]).not.toBe(neutral?.[1]);
  });
});

describe("IconTile's tones are all real", () => {
  const TONES = ["neutral", "accent", "positive", "critical", "caution"] as const;
  const VARIANTS = ["subtle", "solid"] as const;

  it.each(TONES.flatMap((tone) => VARIANTS.map((variant) => [tone, variant] as const)))(
    "%s/%s paints a background and a foreground",
    (tone, variant) => {
      const classes = iconTileVariants({ tone, variant });
      // Both, always: a tone that sets one is how a tile ends up with an
      // accessible-looking background and a foreground nobody adjusted.
      expect(classes, `${tone}/${variant} has no background`).toMatch(/\bbg-/);
      expect(classes, `${tone}/${variant} has no foreground`).toMatch(/\btext-/);
    },
  );

  it("has ten reachable appearances, where it used to have six", () => {
    /*
     * The arithmetic of the split, asserted rather than claimed. `solid` sat in
     * the tone axis until 12 Aug 2026, so it consumed one of six slots and the
     * other five meanings had no solid form: a tile could be a critical TINT or
     * an accent FILL, never a critical fill. Crossing the two axes is 5 × 2.
     */
    const painted = new Set(
      TONES.flatMap((tone) => VARIANTS.map((variant) => iconTileVariants({ tone, variant }))),
    );
    expect(painted.size).toBe(10);
  });

  it("paints the migrated call site exactly as `tone=\"solid\"` did", () => {
    // The old value's classes, character for character. A rename that changes
    // pixels is a behaviour change hiding inside a compile error.
    const classes = iconTileVariants({ tone: "accent", variant: "solid" });
    expect(classes).toContain("bg-accent");
    expect(classes).toContain("text-accent-fg");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * Alert's ramp — the one that was spelled differently from every other
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `alert.tsx` was the only file in the library calling the accent tone `info`,
 * and it had no `neutral` at all — so an untinted alert was unrepresentable and
 * `<Alert tone="accent">` was a type error naming a tone the library plainly
 * has. Both are fixed; these are the assertions that keep them fixed.
 *
 * The class-level checks below sit here rather than in `composition-gaps.test.tsx`
 * because that file's header states it asserts no colours — which is right for
 * it and wrong for this question, where the colour IS the fact.
 */
describe("Alert speaks the library's ramp", () => {
  const RAMP = ["neutral", "accent", "positive", "critical", "caution"] as const;

  it.each(RAMP)("%s paints an edge, a leading bar and a fill", (tone) => {
    const classes = alertVariants({ tone });
    // All three, always. The hairline is what stops the alert dissolving into a
    // surface that is not the default page ground; the bar is the tone marker
    // on the reader's leading edge; the fill is the tint.
    expect(classes, `${tone} has no hairline`).toMatch(/\bborder-(?!s-)[a-z]/);
    expect(classes, `${tone} has no leading bar`).toMatch(/\bborder-s-[a-z]/);
    expect(classes, `${tone} has no fill`).toMatch(/\bbg-/);
    expect(alertIconVariants({ tone }), `${tone} icon has no colour`).toMatch(/\btext-/);
  });

  it("gives `neutral` no status colour at all, which is the point of it", () => {
    /*
     * The tone that exists so a message with nothing to claim does not have to
     * borrow a claim. If any status hue appears here, `neutral` has become a
     * sixth flavour of accent and the untinted alert is unrepresentable again.
     */
    const classes = `${alertVariants({ tone: "neutral" })} ${alertIconVariants({ tone: "neutral" })}`;
    expect(classes).not.toMatch(/\b(bg|text|border|border-s)-(accent|positive|critical|caution)/);
  });

  it("tints at the same alpha as the badge it sits beside", () => {
    /*
     * The variance this pass closed: both files carried the same four tones
     * with the same `/25` hairline and DIFFERENT fills — badge at 10%, alert at
     * 8% — which is roughly half a percent of lightness and was chosen by
     * nobody. Asserted as a RELATIONSHIP rather than as the literal `/10`, so
     * moving the tint later moves both or fails here.
     */
    const alpha = (classes: string, prefix: string) =>
      new RegExp(`${prefix}-accent/(\\d+)`).exec(classes)?.[1];
    expect(alpha(alertVariants({ tone: "accent" }), "bg")).toBe(
      alpha(badgeVariants({ tone: "accent", variant: "subtle" }), "bg"),
    );
    expect(alpha(alertVariants({ tone: "accent" }), "border")).toBe(
      alpha(badgeVariants({ tone: "accent", variant: "subtle" }), "border"),
    );
  });
});
