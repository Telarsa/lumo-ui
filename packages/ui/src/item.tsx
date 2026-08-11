"use client";

import type { AnchorHTMLAttributes, HTMLAttributes, MouseEvent as ReactMouseEvent } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
// `onPress` hands back a `PressEvent`, the shape the frozen public API promises
// and `base-ui-adapter.ts` builds from a real click.
import { cn, type LumoNode, type PressEvent } from "@lumo-ui/core";
import { pressFromClick } from "./base-ui-adapter.ts";
import { Separator, type SeparatorProps } from "./separator.tsx";
// Class definitions live in item.variants.ts with no "use client", so a
// server-rendered listing can style static rows without dragging this module's
// client boundary along. Deliberately NOT re-exported from here — file-upload.tsx
// records why re-exporting through the directive defeats the split.
import {
  itemActionsVariants,
  itemContentVariants,
  itemDescriptionVariants,
  itemFooterVariants,
  itemGroupVariants,
  itemHeaderVariants,
  itemMediaVariants,
  itemTitleVariants,
  itemVariants,
  type ItemMediaVariantProps,
  type ItemVariantProps,
} from "./item.variants.ts";

/**
 * The generic row: media, content, actions. The workhorse under lists of
 * files, people, settings and search results.
 *
 *     <Item href="/fa/profile" variant="outlined">
 *       <ItemMedia media="icon">…svg…</ItemMedia>
 *       <ItemContent>
 *         <ItemTitle>پروفایل</ItemTitle>
 *         <ItemDescription>نام و نشانی شما</ItemDescription>
 *       </ItemContent>
 *       <ItemActions>…</ItemActions>
 *     </Item>
 *
 * `"use client"` because `onPress` is a function prop and a function cannot
 * cross the server/client boundary. **BASE UI ENGINE** — but only just: see the
 * note below on what this component actually rented.
 *
 * ── THE ENGINE WAS DOING ALMOST NOTHING HERE, AND THAT IS THE FINDING ──────
 *
 * This is the cheapest migration in the family, and the reason is worth stating
 * because it is the exception rather than the rule. React Aria supplied exactly
 * two things: `Link`, which rendered an `<a href>` with press handling, and
 * `Button`, which rendered a `<button>` with `data-pressed`. Neither is a
 * behaviour the platform lacks.
 *
 *   - The LINK is now a plain `<a>`. Base UI ships no Link part at all — 40
 *     export subpaths, none of them a link — and it does not need to: an anchor
 *     with an `href` is already keyboard-operable, middle-clickable and
 *     crawlable. What React Aria added on top was a synthetic press model, and
 *     `onPress` was never in this component's public API.
 *   - The BUTTON is Base UI's `Button`, translated through `pressFromClick` the
 *     same way `button.tsx` does, so the frozen `onPress` signature survives.
 *
 * Recorded because the inventory reads the same for `item` as for `tree`: both
 * are components in a family being migrated. One of them cost two imports.
 *
 * ── WHAT THE ELEMENT IS, IS THE API ─────────────────────────────────────────
 * One row, three renderings, decided by the props' own shape:
 *
 *   - `href`     → RAC `Link`, a real `<a>`: crawlable, middle-clickable.
 *   - `onPress`  → RAC `Button`: press handling for touch/keyboard/mouse,
 *                  `data-pressed` for styling.
 *   - neither    → a plain `<div>` with no role and no tab stop.
 *
 * The union makes the wrong mixtures unrepresentable — `href` with `onPress`
 * is a compile error, and a static row cannot accidentally become focusable.
 * A `<button>` named by its whole content announces title AND description;
 * that is the intended behaviour for a pressable row, and the reason there is
 * no aria-label prop here: the visible text IS the name, in the page's own
 * language.
 *
 * `target`/`rel` are stripped from the link form, as in link.tsx: opening a
 * new tab requires an announced warning, and this component has no slot for
 * one. Wrap a `Link` with `newTab` if a row must do that.
 *
 * ── Vendored shape, and what changed ────────────────────────────────────────
 * The anatomy is shadcn aria-vega `item`. Upstream defects fixed here:
 *
 *  1. `ItemDescription` hardcodes `text-left` — Persian descriptions hug the
 *     wrong edge. Gone; block flow already starts at the reading edge.
 *  2. `ItemGroup` sets `role="list"` while its items render no `listitem` —
 *     measured in the emitted source: VoiceOver announces "list, 0 items" and
 *     skips the content. Wrong semantics are worse than none, so the group
 *     here is a plain div and the test pins the ABSENCE of the role.
 *  3. The `xs` size existed to embed rows in a dropdown-menu package Lumo does
 *     not carry; two sizes remain.
 */

interface ItemCommonProps extends ItemVariantProps {
  children?: LumoNode;
  className?: string | undefined;
}

export interface ItemLinkProps
  extends ItemCommonProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "target" | "rel"> {
  /** Renders the row as a real anchor. */
  href: string;
}

export interface ItemButtonProps
  extends ItemCommonProps,
    Omit<HTMLAttributes<HTMLButtonElement>, "children" | "className" | "onClick"> {
  href?: undefined;
  /** Renders the row as a button. Required — a handler-less button is a static row. */
  onPress: (e: PressEvent) => void;
}

export interface ItemStaticProps
  extends ItemCommonProps,
    Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
  href?: undefined;
  onPress?: undefined;
}

export type ItemProps = ItemLinkProps | ItemButtonProps | ItemStaticProps;

export function Item(props: ItemProps) {
  if (props.href !== undefined) {
    const { variant, size, className, ...link } = props;
    return (
      <a
        data-lumo=""
        className={cn(itemVariants({ variant, size }), className)}
        {...link}
      />
    );
  }
  if (props.onPress !== undefined) {
    const { variant, size, className, href: _href, onPress, ...button } = props;
    return (
      <BaseButton
        data-lumo=""
        className={cn(itemVariants({ variant, size }), className)}
        // React Aria's `PressEvent` rebuilt from the real `click`. Every field
        // is read from the DOM event and the two that cannot be derived are
        // documented in `base-ui-adapter.ts` rather than filled with a guess.
        onClick={(event: ReactMouseEvent<HTMLButtonElement>) => onPress(pressFromClick(event))}
        {...button}
      />
    );
  }
  const { variant, size, className, href: _href, onPress: _onPress, ...rest } = props;
  return <div className={cn(itemVariants({ variant, size }), className)} {...rest} />;
}

export interface ItemSectionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ItemGroup({ className, ...props }: ItemSectionProps) {
  // No role — see the file header. If real list semantics matter for a page,
  // that page owns a <ul> and puts each Item in an <li>.
  return <div className={cn(itemGroupVariants(), className)} {...props} />;
}

export interface ItemSeparatorProps extends SeparatorProps {}

export function ItemSeparator({ className, ...props }: ItemSeparatorProps) {
  return <Separator className={cn("my-1", className)} {...props} />;
}

export interface ItemMediaProps extends ItemSectionProps {
  media?: ItemMediaVariantProps["media"];
}

export function ItemMedia({ media, className, ...props }: ItemMediaProps) {
  return <div className={cn(itemMediaVariants({ media }), className)} {...props} />;
}

export function ItemContent({ className, ...props }: ItemSectionProps) {
  return <div className={cn(itemContentVariants(), className)} {...props} />;
}

/**
 * A div, not a heading: a repeated row title inside every list entry would
 * flood the document outline with dozens of same-level entries. A page section
 * that IS an outline entry composes CardTitle or its own heading around the
 * list instead.
 */
export function ItemTitle({ className, ...props }: ItemSectionProps) {
  return <div className={cn(itemTitleVariants(), className)} {...props} />;
}

export interface ItemDescriptionProps
  extends Omit<HTMLAttributes<HTMLParagraphElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ItemDescription({ className, ...props }: ItemDescriptionProps) {
  return (
    <p
      // The marker itemMediaVariants keys its two-line alignment on.
      data-lumo-item-description=""
      className={cn(itemDescriptionVariants(), className)}
      {...props}
    />
  );
}

export function ItemActions({ className, ...props }: ItemSectionProps) {
  return <div className={cn(itemActionsVariants(), className)} {...props} />;
}

export function ItemHeader({ className, ...props }: ItemSectionProps) {
  return <div className={cn(itemHeaderVariants(), className)} {...props} />;
}

export function ItemFooter({ className, ...props }: ItemSectionProps) {
  return <div className={cn(itemFooterVariants(), className)} {...props} />;
}
