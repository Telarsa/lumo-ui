import { cva } from "class-variance-authority";
import { direction, type Direction, type Locale } from "@lumo-ui/core";

/**
 * Tree's class definitions, its chevron arithmetic and its two announced verbs
 * — in a module with NO `"use client"`, the split `button.variants.ts` argues
 * for. A server-rendered file browser that draws a static outline beside the
 * interactive tree has to be able to call these.
 *
 * ═══ THE SHAPE, WHICH IS NOW LUMO'S AND WAS RAC's ═══════════════════════════
 *
 * `tree.tsx` no longer renders `react-aria-components`. It emits, byte for
 * byte, the shape measured out of RAC 1.20 before the migration — the four
 * facts below were RAC's, they are now this library's obligations, and
 * `tree.test.tsx` pins every one of them UNCHANGED across the move. That the
 * same assertions pass against both engines is the evidence that the shape was
 * copied rather than reinvented.
 *
 *  1. **It is a `role="treegrid"`, not a `role="tree"`.** Rows are
 *     `role="row"` and each row's content sits in a `role="gridcell"` with
 *     `display: contents`. Kept on migration rather than "corrected" to
 *     tree/treeitem: it changes what a screen reader announces, and a silent
 *     change in announcement is exactly the class of defect this library
 *     exists to prevent. It also keeps a second column per row possible later.
 *  2. **The row is named from `textValue`.** It is copied to `aria-label` on
 *     the row, which is also what typeahead matches — one string, two jobs, so
 *     a Persian tree gets Persian typeahead and cannot have a name that
 *     disagrees with what typing finds. `tree.tsx` reads the typeahead
 *     candidate back OFF that attribute, so the two cannot drift.
 *  3. **The nesting depth is published as a CSS custom property.** Each row
 *     carries `style="--tree-item-level: N"` alongside `data-level="N"`. That
 *     is what makes the indent ONE logical padding rule instead of a ladder of
 *     `data-level` selectors — and a logical padding mirrors, so a Persian tree
 *     indents from the right with nothing extra said.
 *  4. **The expand button is named «بستن اسناد» — a whole Persian phrase.**
 *     `aria-label` carries the VERB and `aria-labelledby="<the button> <the
 *     row>"` joins it to the row's own name. Under RAC the verb came from
 *     `patches/react-aria@3.51.0.patch`, which added the `fa-IR` bundle to
 *     react-aria's intl packages because no prop reached the string. It now
 *     comes from `TREE_STRINGS` below — a Lumo file, in the repository, in both
 *     languages. **That is the 27 KB patch's last tie to this component cut**,
 *     and the reason is the one `table.tsx` gives about its resizer: a
 *     workaround retired by a migration is worth more than one maintained by it.
 */

/**
 * The two verbs the expand/collapse button announces.
 *
 * ── WHY THESE ARE NOT REQUIRED PROPS, WHICH IS THE HOUSE RULE ───────────────
 *
 * Lumo requires announced strings as props. The carve-out is stated once, in
 * `@lumo-ui/base-ui-ssr`'s `strings.ts`: the rule is about strings that name the
 * CONSUMER's content — a field's label, a dialog's title — which the library
 * cannot author and must not guess. «بستن» is the opposite kind: it is
 * vocabulary the WIDGET authors about ITSELF, identical in every application
 * that ever renders a tree, and requiring a prop for it would only relocate an
 * English literal into every registry item that copies this component.
 *
 * Two further constraints make it the only available answer here. The public
 * API of `Tree`/`TreeItem` is frozen by the migration, so a new required prop is
 * not on the table; and the verb has to be present in the SERVED bytes, where a
 * client-side dictionary reaches nothing — the same argument
 * `packages/core/src/strings.ts` makes against React Aria's
 * `LocalizedStringProvider`.
 *
 * The English pair is measured against RAC 1.20 rather than invented: an
 * `en-US` render of the pre-migration component emitted `aria-label="Expand"`
 * on a collapsed row, because the patch only adds `fa-IR`. Keeping the same two
 * words means an English page announces what it announced before the move.
 *
 * `satisfies Record<Locale, …>` so adding a locale to `Locale` cannot forget
 * this file — a missing locale and a missing key are both compile errors, the
 * same enforcement `core/src/strings.ts` and `base-ui-ssr/src/strings.ts` use.
 *
 * The eventual home for these is `LumoStrings` in `@lumo-ui/core`, beside
 * `datePicker.openCalendar`. They are here because `tree.variants.ts` is the
 * directive-free module this component already owns, and because a server
 * component drawing a static outline needs them without pulling in the client
 * half — the same reason `treeChevronTurnFor` lives here.
 */
export interface TreeStrings {
  /** `aria-label` on the marker button of a COLLAPSED row. */
  expand: string;
  /** `aria-label` on the marker button of an EXPANDED row. */
  collapse: string;
}

export const TREE_STRINGS = {
  "fa-IR": { expand: "باز کردن", collapse: "بستن" },
  "en-US": { expand: "Expand", collapse: "Collapse" },
} as const satisfies Record<Locale, TreeStrings>;

/** The tree's own two verbs for a locale. */
export function treeStringsFor(locale: Locale): TreeStrings {
  return TREE_STRINGS[locale];
}

export const treeVariants = cva(
  "flex w-full flex-col overflow-auto rounded-md border border-border bg-surface p-1 " +
    "outline-none " +
    "data-empty:items-center data-empty:justify-center data-empty:p-6",
);

/**
 * One row.
 *
 * The indent is a single `padding-inline-start` computed from
 * `--tree-item-level` — see the header, item 3. Because it is the INLINE start,
 * a Persian tree steps in from the right and an English one from the left with
 * one declaration and no direction test anywhere.
 *
 * `hover:` and not `data-hovered:`. RAC set `data-hovered` from a pointer
 * listener, so before hydration a served row did not respond to the mouse at
 * all; the CSS pseudo-class needs no JavaScript and cannot be out of date. This
 * is the same substitution `experiments/in-flight/README.md` records for the
 * calendar cells, made for the same reason. `data-selected`, `data-expanded`
 * and `data-disabled` stay data attributes: they are STATE, not input device,
 * and CSS has no pseudo-class for them.
 */
export const treeItemVariants = cva(
  "group/lumo-tree-item flex cursor-default select-none items-center gap-1.5 rounded-sm " +
    "py-1.5 pe-2 text-sm text-fg outline-none " +
    "ps-[calc(var(--tree-item-level)_*_1.25rem)] " +
    "hover:bg-surface-hover " +
    "data-selected:bg-accent data-selected:text-accent-fg " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
);

/**
 * The expand/collapse button.
 *
 * A real `<button>` carrying `slot="chevron"` — the attribute RAC used to find
 * it, kept because `tree.test.tsx` and every consumer's CSS select on it — and
 * never a click handler on the row: a row that both selects and expands on one
 * press has no way to do either alone, and the keyboard needs them separate
 * anyway.
 */
export const treeChevronVariants = cva(
  "grid size-5 shrink-0 place-items-center rounded-sm text-fg-muted outline-none " +
    "hover:bg-surface-hover hover:text-fg " +
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
 *   - The resolved direction — the very value `tree.tsx`'s key handler reads to
 *     decide which arrow expands a row. Then the marker cannot point one way
 *     while the keyboard works the other, because both are the same number.
 *
 * That source used to be React Aria's `useLocale()`, and it is now
 * `direction(useLumoLocale())`. The substitution is the whole reason
 * `provider.tsx` can drop its `I18nProvider` bridge, and it is not cosmetic:
 * measured on this branch before the migration, deleting that bridge flipped a
 * SERVER-rendered Persian tree from `-rotate-90` to `rotate-90`, because RAC
 * fell back to `navigator.language || 'en-US'` and there is no `navigator` on
 * the server. `useLumoLocale()` is a plain `React.createContext` read during
 * render, so it has no such fallback and no such gap.
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
