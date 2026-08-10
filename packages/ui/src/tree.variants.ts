import { cva } from "class-variance-authority";
import { direction, type Direction, type Locale } from "@lumo-ui/core";

/**
 * Tree's class definitions and its chevron arithmetic — in a module with NO
 * `"use client"`, the split `button.variants.ts` argues for. A server-rendered
 * file browser that draws a static outline beside the interactive tree has to be
 * able to call these.
 *
 * ═══ WHAT RAC 1.20's TREE ACTUALLY RENDERS ══════════════════════════════════
 *
 * Measured, not read from the docs — `tree.test.tsx` pins each of these:
 *
 *  1. **It is a `role="treegrid"`, not a `role="tree"`.** Rows are
 *     `role="row"` and each row's content sits in a `role="gridcell"` with
 *     `display: contents`. That is RAC's deliberate choice (a treegrid can hold
 *     several columns per row later) and it changes what a screen reader
 *     announces, so it is pinned rather than assumed.
 *  2. **The row is named from `textValue`.** RAC copies it to `aria-label` on
 *     the row, which is also what typeahead matches — one string, two jobs, so
 *     a Persian tree gets Persian typeahead for free and cannot have a name
 *     that disagrees with what typing finds.
 *  3. **The nesting depth arrives as a CSS custom property.** Each row carries
 *     `style="--tree-item-level: N"` alongside `data-level="N"`. That is what
 *     makes the indent expressible as ONE logical padding rule instead of a
 *     ladder of `data-level` selectors — and a logical padding mirrors, so a
 *     Persian tree indents from the right with nothing extra said.
 *  4. **The expand button's name is already Persian.** RAC composes
 *     `aria-label` from its own `expand`/`collapse` strings and then
 *     `aria-labelledby="<the button> <the row>"`, so the announced name is
 *     «بستن اسناد» — the verb from `patches/react-aria@3.51.0.patch` (which adds
 *     the `fa-IR` tree bundle) and the noun from the row. Nothing in this
 *     component supplies it, and that is the point: the patch is what makes it
 *     work on the SERVER too, where a client dictionary reaches nothing.
 */

export const treeVariants = cva(
  "flex w-full flex-col overflow-auto rounded-md border border-border bg-surface p-1 " +
    "outline-none " +
    "data-empty:items-center data-empty:justify-center data-empty:p-6",
);

/**
 * One row.
 *
 * The indent is a single `padding-inline-start` computed from RAC's own
 * `--tree-item-level` — see the header, item 3. Because it is the INLINE start,
 * a Persian tree steps in from the right and an English one from the left with
 * one declaration and no direction test anywhere.
 */
export const treeItemVariants = cva(
  "group/lumo-tree-item flex cursor-default select-none items-center gap-1.5 rounded-sm " +
    "py-1.5 pe-2 text-sm text-fg outline-none " +
    "ps-[calc(var(--tree-item-level)_*_1.25rem)] " +
    "data-hovered:bg-surface-hover " +
    "data-selected:bg-accent data-selected:text-accent-fg " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
);

/**
 * The expand/collapse button.
 *
 * A real `<button>`, RAC's `slot="chevron"`, never a click handler on the row:
 * a row that both selects and expands on one press has no way to do either
 * alone, and the keyboard needs them separate anyway.
 */
export const treeChevronVariants = cva(
  "grid size-5 shrink-0 place-items-center rounded-sm text-fg-muted outline-none " +
    "data-hovered:bg-surface-hover data-hovered:text-fg " +
    "group-data-selected/lumo-tree-item:text-accent-fg",
);

/** The spacer a LEAF row gets where a parent row has its chevron. */
export const treeLeafSpacerVariants = cva("size-5 shrink-0");

/**
 * ═══ THE CHEVRON: A MIRRORED GLYPH PLUS A TURN THAT KNOWS WHICH WAY IS ON ═══
 *
 * The marker is `›` — U+203A, whose Unicode `Bidi_Mirrored` property is true, so
 * the text engine draws `‹` when the resolved direction is RTL. No CSS, no
 * variant, nothing for the RTL codemod to miss. `menu.tsx` makes the same choice
 * for its submenu arrow and states the same reason.
 *
 * Measured while choosing it, because the obvious alternative looks equivalent
 * and is not: the geometric triangles — U+25B8 ▸ and its partners U+25B6, U+25BA
 * — have `Bidi_Mirrored` **false**. They look like a mirrored pair and the text
 * engine treats them as ordinary symbols, so a tree drawn with them points the
 * wrong way in Persian and nothing anywhere says so. The angle quotation marks
 * (U+2039/U+203A, U+276E/U+276F) are the only chevron-shaped characters in this
 * range that actually mirror.
 *
 * A collapsed marker points along the INLINE axis, which is what makes it a
 * mirroring problem at all. An EXPANDED one points down the block axis, and the
 * quarter turn that gets it there is where the free mirroring runs out:
 *
 *     LTR   `›` rotated a quarter turn clockwise  → points down ✓
 *     RTL   `‹` rotated a quarter turn clockwise  → points UP  ✗
 *
 * CSS has no logical rotation — `rotate` is physical, always — so the sign has
 * to come from somewhere. Two candidates, and the rejected one is instructive:
 *
 *   - A `[dir=rtl]`-scoped variant pair. Correct, and invisible: it is a second
 *     class in a string that reviewers read as one class, and it is exactly the
 *     kind of statement this library keeps finding written once for an English
 *     page and never revisited.
 *   - The resolved direction from RAC's own `useLocale()` — the very value
 *     `useTreeItem` reads to decide which arrow key expands a row. Then the
 *     marker cannot point one way while the keyboard works the other, because
 *     both are the same number.
 *
 * The second. `treeChevronTurn()` takes that `Direction` rather than a `Locale`,
 * which is the one place in this library where a direction is a legitimate
 * argument: `Tree` has no `locale` prop to derive one from (it formats no
 * numbers), and inventing one would create a second source of truth that could
 * disagree with the keyboard. `chartMirror(locale)` takes the other branch for
 * the opposite reason — a chart already has a required `locale`, because every
 * tick it draws is a number.
 */
export interface TreeChevronTurn {
  /** The class that turns the marker down when its row is expanded. */
  className: string;
  /** Echoed back so a test — or a consumer's own marker — can read it. */
  direction: Direction;
}

export function treeChevronTurn(dir: Direction): TreeChevronTurn {
  return {
    // Written out in full on both branches rather than assembled from a sign,
    // because Tailwind reads source TEXT: a class name built by string
    // concatenation is one Tailwind never emits, i.e. a rule that silently does
    // nothing. The same reason `chartStyleSheet` builds whole declarations.
    className:
      dir === "rtl"
        ? "group-data-expanded/lumo-tree-item:-rotate-90"
        : "group-data-expanded/lumo-tree-item:rotate-90",
    direction: dir,
  };
}

/**
 * The turn for a locale, for a SERVER component drawing a static outline beside
 * the interactive tree — it has a locale and no `useLocale()` to call.
 */
export function treeChevronTurnFor(locale: Locale): TreeChevronTurn {
  return treeChevronTurn(direction(locale));
}

/** The marker itself: the mirrored glyph, its turn, and the motion opt-out. */
export const treeChevronGlyphVariants = cva(
  "inline-block leading-none transition-transform duration-150 motion-reduce:transition-none",
);

/**
 * The bidi-mirrored character the marker is drawn with.
 *
 * Exported so `tree.test.tsx` can assert the CODEPOINT rather than a rendered
 * pixel: jsdom does no bidi layout, so the honest test is that the character
 * carrying the mirror is the one with the property — plus the absence of any
 * direction-scoped class doing the job in CSS instead.
 */
export const TREE_CHEVRON_GLYPH = "›";
