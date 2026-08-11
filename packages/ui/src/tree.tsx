"use client";

import {
  Button as AriaButton,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  TreeItemContent as AriaTreeItemContent,
  useLocale,
  type TreeItemProps as AriaTreeItemProps,
  type TreeProps as AriaTreeProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
// No `"use client"` in that module, so the classes and the chevron arithmetic
// stay callable from a server component. See tree.variants.ts's header, which
// also records everything measured about RAC's Tree.
import {
  TREE_CHEVRON_GLYPH,
  treeChevronGlyphVariants,
  treeChevronTurn,
  treeChevronTurnFor,
  treeChevronVariants,
  treeItemVariants,
  treeLeafSpacerVariants,
  treeVariants,
} from "./tree.variants.ts";

export {
  TREE_CHEVRON_GLYPH,
  treeChevronGlyphVariants,
  treeChevronTurn,
  treeChevronTurnFor,
  treeChevronVariants,
  treeItemVariants,
  treeLeafSpacerVariants,
  treeVariants,
};

/**
 * A nested outline: folders, a category hierarchy, an org chart's reporting line.
 *
 * ═══ STILL REACT ARIA, AND THIS IS THE MOST EXPENSIVE BLOCKAGE IN THE SET ═══
 *
 * Base UI 1.7.0 ships no tree, no treegrid and no disclosure-collection of any
 * kind. Unlike the listbox there is not even an open issue to point at: 83
 * export subpaths, and the nearest neighbours are `accordion` (a flat list of
 * panels, no nesting, no roving focus over a flattened order) and `navigation-
 * menu` (a menu, not a persistent outline).
 *
 * ── WHY THIS IS A DIFFERENT ANSWER FROM `file-upload.tsx` ─────────────────
 *
 * Both files can say "Base UI has no primitive". `file-upload.tsx` rebuilt in an
 * afternoon because what it rented was four DOM events. What THIS file rents,
 * measured against `react-aria-components@1.20.0` rather than described:
 *
 *     ArrowUp / ArrowDown    move between VISIBLE rows, skipping collapsed
 *                            subtrees — the FLATTENED order, which is not the
 *                            DOM order and changes on every expand
 *     ArrowRight / ArrowLeft expand / collapse, and they SWAP under RTL, so on
 *                            a Persian page ArrowLeft opens a folder
 *     typeahead              jump to the row whose `textValue` starts with what
 *                            was typed, in the reader's own script
 *     selection              single / multiple over that same flattened order
 *     role=treegrid + row / gridcell / aria-level / aria-expanded /
 *       aria-posinset / aria-setsize, all recomputed as the tree opens
 *
 * `aria-level` and `aria-posinset` alone are the part nobody remembers: they are
 * how a screen reader says «سطح ۲، مورد ۳ از ۷», and they have to be recomputed
 * against the flattened order every time a branch opens. Nothing in this 173-line
 * file participates in any of it. What Lumo owns here is the chevron glyph, its
 * rotation, and the leaf spacer — all three in `tree.variants.ts`, all three
 * engine-independent, and all three worth keeping whatever happens underneath.
 *
 * ── AND `CompositeRoot` DOES NOT CLOSE IT, WHERE IT ALMOST CLOSES A LISTBOX ─
 *
 * `@base-ui/react/internals/composite` is a real export and its `CompositeRoot`
 * is a roving-tabindex machine over a FLAT list of registered items. A tree's
 * navigation order is not flat and is not static: it is the flattened set of
 * visible rows, which changes on every expand and collapse. `gridNavigation` is
 * exported beside it and models a 2-D grid, which is a different shape again.
 * So even accepting the internal import — which `list-box.tsx` argues against —
 * the piece that would have to be written is the whole thing.
 *
 * **Recommendation: this component stays on React Aria, and it is the single
 * strongest argument in the family for keeping React Aria installed at all.**
 * If Lumo wants a Base UI-only dependency tree, `tree.tsx` is the component that
 * has to be either dropped from the library or written from scratch, and it is
 * the one that should be priced before that decision is made rather than after.

 *
 *     <Tree label="پرونده‌های پروژه" defaultExpandedKeys={["docs"]}>
 *       <TreeItem id="docs" textValue="اسناد" title="اسناد">
 *         <TreeItem id="report" textValue="گزارش فروش" title="گزارش فروش" />
 *       </TreeItem>
 *     </Tree>
 *
 * `"use client"` because `react-aria-components` is client-only.
 *
 * ── WHAT IS RENTED, AND WHY THAT IS THE POINT ───────────────────────────────
 *
 * Everything hard about a tree is keyboard behaviour that has to know which way
 * the page reads, and RAC resolves all of it from `useLocale()`:
 *
 *     ArrowUp / ArrowDown     move between VISIBLE rows, skipping collapsed
 *                             subtrees — the flattened order, not the DOM order
 *     ArrowRight / ArrowLeft  expand / collapse — and they SWAP under RTL, so
 *                             on a Persian page ArrowLeft opens a folder
 *     typeahead               jumps to the row whose `textValue` starts with
 *                             what you typed, in the user's own script
 *
 * A hand-written `onKeyDown` gets the third one wrong by omission and the second
 * one wrong by hardcoding. Nothing in this file implements any of it; the file
 * exists to make sure the parts around it are correct in Persian.
 *
 * ── THE THREE THINGS THIS FILE ACTUALLY DECIDES ─────────────────────────────
 *
 *  1. **`label` is required.** RAC leaves the `role="treegrid"` unnamed, and an
 *     unnamed grid is announced as bare "tree grid" — with nothing to say which
 *     of a page's two trees a reader has landed in.
 *  2. **`textValue` is required, and it is the row's name.** RAC already
 *     requires it, and copies it onto the row as `aria-label` — so it is both
 *     the announced name and the typeahead key. `title` (what is drawn) is
 *     separate because a row often draws an icon, a count or a badge beside its
 *     name, and none of that should end up in what typing matches.
 *  3. **The chevron.** A mirrored glyph plus a turn derived from the resolved
 *     direction — the whole argument, including the measured fact that the
 *     geometric triangles do NOT mirror, is in `tree.variants.ts`.
 *
 * ── THE LEAF SPACER IS NOT DECORATION ───────────────────────────────────────
 *
 * A row with no children renders an empty box the width of a chevron. Without
 * it, leaf names and parent names start at different insets inside the same
 * level and the outline stops reading as a hierarchy — the indent is the ONLY
 * thing communicating depth to a sighted reader, and half a step of noise on it
 * is enough to break it. `aria-hidden`, because it says nothing.
 */

export interface TreeProps<T extends object>
  extends Omit<AriaTreeProps<T>, "children" | "className" | "aria-label"> {
  /**
   * Announced name of the tree, e.g. «پرونده‌های پروژه».
   *
   * REQUIRED — see the file header. RAC does not name the treegrid.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Tree<T extends object>({ label, className, ...props }: TreeProps<T>) {
  return (
    <AriaTree
      data-lumo=""
      aria-label={label}
      className={cn(treeVariants(), className)}
      {...(props as AriaTreeProps<T>)}
    />
  );
}

export interface TreeItemProps<T extends object = object>
  extends Omit<AriaTreeItemProps<T>, "children" | "className" | "title"> {
  /**
   * The row's announced name AND its typeahead key. Required by RAC; kept
   * required here rather than derived from `title`, because `title` may be an
   * element and a name may not.
   */
  textValue: string;
  /** What the row draws: the name, plus any icon or count beside it. */
  title: LumoNode;
  /** Nested `<TreeItem>`s. A row with none renders the leaf spacer instead. */
  children?: LumoNode;
  className?: string | undefined;
}

export function TreeItem<T extends object = object>({
  title,
  children,
  className,
  ...props
}: TreeItemProps<T>) {
  // RAC's own resolved direction — the same value `useTreeItem` reads to decide
  // which arrow key expands a row, so the marker cannot point one way while the
  // keyboard works the other. See tree.variants.ts.
  const { direction: dir } = useLocale();
  const turn = treeChevronTurn(dir);

  return (
    <AriaTreeItem
      data-lumo=""
      className={cn(treeItemVariants(), className)}
      {...(props as AriaTreeItemProps<T>)}
    >
      <AriaTreeItemContent>
        {({ hasChildItems }) =>
          hasChildItems ? (
            <>
              {/*
               * No `aria-label` here on purpose. RAC has already composed one —
               * «بستن» / «باز کردن» from the patched fa-IR bundle, joined by
               * `aria-labelledby` to the row's own name, so the button
               * announces «بستن اسناد». Adding a name would replace a correct
               * two-part phrase with a one-part one.
               */}
              <AriaButton slot="chevron" className={treeChevronVariants()}>
                <span aria-hidden="true" className={cn(treeChevronGlyphVariants(), turn.className)}>
                  {TREE_CHEVRON_GLYPH}
                </span>
              </AriaButton>
              {title}
            </>
          ) : (
            <>
              <span aria-hidden="true" className={treeLeafSpacerVariants()} />
              {title}
            </>
          )
        }
      </AriaTreeItemContent>
      {children}
    </AriaTreeItem>
  );
}
