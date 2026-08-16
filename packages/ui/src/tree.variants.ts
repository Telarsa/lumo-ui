import { cva } from "class-variance-authority";
import { direction, type Direction, type Locale, type LumoStrings } from "@lumo-ui/core";

/**
 * Tree's class definitions and chevron arithmetic, in a module with NO
 * `"use client"` so a server-rendered static outline can call them. Shape:
 * `role="treegrid"`, row named from `textValue`, depth as `--tree-item-level`.
 */

/**
 * The two verbs the expand/collapse button announces. Not required props: this
 * is vocabulary the WIDGET authors about itself, and it must be in the served
 * bytes. Since 0.2.0 they are `LumoStrings["tree"]` — authored in `@lumo-ui/core`
 * for the built-in locales and brought by the app for any other language — and
 * the tree reads them through `useLumoStrings()`. No table lives here.
 */
export type TreeStrings = LumoStrings["tree"];

export const treeVariants = cva(
  "flex w-full flex-col overflow-auto rounded-md border border-border bg-surface p-1 " +
    "outline-none " +
    "data-empty:items-center data-empty:justify-center data-empty:p-6",
);

/** One row. The indent is a single logical `padding-inline-start` from `--tree-item-level`. */
export const treeItemVariants = cva(
  "group/lumo-tree-item flex cursor-default select-none items-center gap-1.5 rounded-sm " +
    "py-1.5 pe-2 text-sm text-fg outline-none " +
    "ps-[calc(var(--tree-item-level)_*_1.25rem)] " +
    "hover:bg-surface-hover " +
    "data-selected:bg-accent data-selected:text-accent-fg " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
);

/** The expand/collapse button. The selected-row hover pair is stated explicitly, or the neutral hover erases the glyph. */
export const treeChevronVariants = cva(
  "grid size-5 shrink-0 place-items-center rounded-sm text-fg-muted outline-none " +
    "hover:bg-surface-hover hover:text-fg " +
    "group-data-selected/lumo-tree-item:text-accent-fg " +
    "group-data-selected/lumo-tree-item:hover:bg-accent-hover " +
    "group-data-selected/lumo-tree-item:hover:text-accent-fg",
);

/** The spacer a LEAF row gets where a parent row has its chevron. */
export const treeLeafSpacerVariants = cva("size-5 shrink-0");

/**
 * THE CHEVRON. `›` U+203A is `Bidi_Mirrored` (▸ is NOT), so a collapsed
 * marker mirrors for free; the expanded quarter turn is physical CSS, so its
 * sign comes from the resolved direction — the value the key handler also reads.
 */
export interface TreeChevronTurn {
  /** The class that turns the marker down when its row is expanded. */
  className: string;
  /** Echoed back so a test — or a consumer's own marker — can read it. */
  direction: Direction;
}

export function treeChevronTurn(dir: Direction): TreeChevronTurn {
  return {
    // Written out in full on both branches: Tailwind reads source TEXT, and a concatenated class is never emitted.
    className:
      dir === "rtl"
        ? "group-data-expanded/lumo-tree-item:-rotate-90"
        : "group-data-expanded/lumo-tree-item:rotate-90",
    direction: dir,
  };
}

/** The turn for a locale, for a SERVER component drawing a static outline. */
export function treeChevronTurnFor(locale: Locale): TreeChevronTurn {
  return treeChevronTurn(direction(locale));
}

/** The marker itself: the mirrored glyph, its turn, and the motion opt-out. */
export const treeChevronGlyphVariants = cva(
  "inline-block leading-none transition-transform duration-150 motion-reduce:transition-none",
);

/** The bidi-mirrored character the marker is drawn with. Exported so the test can assert the CODEPOINT. */
export const TREE_CHEVRON_GLYPH = "›";
