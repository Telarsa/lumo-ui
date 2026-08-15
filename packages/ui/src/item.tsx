"use client";

import type { ComponentProps, MouseEvent as ReactMouseEvent } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cn, type LumoNode, type PressEvent } from "@lumo-ui/core";
import { pressFromClick } from "./base-ui-adapter.ts";
import { Separator, type SeparatorProps } from "./separator.tsx";
// Class definitions live in item.variants.ts (no "use client") for server-rendered
// listings, and are deliberately NOT re-exported through this directive.
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
import { useLinkComponent, type LumoLinkRenderProps } from "./link-context.ts";

/**
 * The generic row: media, content, actions. One row, three renderings decided
 * by the props' own shape — `href` → a plain `<a>`; `onPress` → Base UI
 * `Button` (a real `<button>`, named by its whole content, so no aria-label
 * prop); neither → a static `<div>` with no role and no tab stop. The union
 * makes the wrong mixtures unrepresentable. `target`/`rel` are stripped from
 * the link form (a new tab needs an announced warning; wrap a `Link` instead).
 * `ItemGroup` has no `role="list"`: its items are not `listitem`s.
 */

/** `interactive` is DERIVED from `href`/`onPress`, not forwarded, so a static row cannot light up. */
interface ItemCommonProps extends Omit<ItemVariantProps, "interactive"> {
  children?: LumoNode;
  className?: string | undefined;
}

export interface ItemLinkProps
  extends ItemCommonProps,
    Omit<ComponentProps<"a">, "children" | "className" | "target" | "rel"> {
  /** Renders the row as a real anchor. */
  href: string;
}

export interface ItemButtonProps
  extends ItemCommonProps,
    Omit<ComponentProps<"button">, "children" | "className" | "onClick"> {
  href?: undefined;
  /** Renders the row as a button. Required — a handler-less button is a static row. */
  onPress: (e: PressEvent) => void;
}

export interface ItemStaticProps
  extends ItemCommonProps,
    Omit<ComponentProps<"div">, "children" | "className"> {
  href?: undefined;
  onPress?: undefined;
}

export type ItemProps = ItemLinkProps | ItemButtonProps | ItemStaticProps;

export function Item(props: ItemProps) {
  // The app's router link when LumoProvider provides one; the platform anchor otherwise.
  const Anchor = useLinkComponent();
  if (props.href !== undefined) {
    const { variant, size, className, ...link } = props;
    return (
      <Anchor
        data-lumo=""
        className={cn(itemVariants({ variant, size, interactive: true }), className)}
        {...(link as LumoLinkRenderProps)}
      />
    );
  }
  if (props.onPress !== undefined) {
    const { variant, size, className, href: _href, onPress, ...button } = props;
    return (
      <BaseButton
        data-lumo=""
        className={cn(itemVariants({ variant, size, interactive: true }), className)}
        // The frozen `PressEvent` shape, rebuilt from the real `click`.
        onClick={(event: ReactMouseEvent<HTMLButtonElement>) => onPress(pressFromClick(event))}
        {...button}
      />
    );
  }
  const { variant, size, className, href: _href, onPress: _onPress, ...rest } = props;
  // No `interactive` — a static row must not light up under a pointer.
  return <div className={cn(itemVariants({ variant, size }), className)} {...rest} />;
}

export interface ItemSectionProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ItemGroup({ className, ...props }: ItemSectionProps) {
  // No role: a page that wants list semantics owns a <ul> and puts each Item in an <li>.
  return <div className={cn(itemGroupVariants(), className)} {...props} />;
}

export interface ItemSeparatorProps extends SeparatorProps {}

export function ItemSeparator({ className, ...props }: ItemSeparatorProps) {
  return <Separator className={cn("my-1", className)} {...props} />;
}

export interface ItemMediaProps extends ItemSectionProps {
  /** How the leading media is framed: an icon chip, an image, or unframed. */
  media?: ItemMediaVariantProps["media"];
}

export function ItemMedia({ media, className, ...props }: ItemMediaProps) {
  return <div className={cn(itemMediaVariants({ media }), className)} {...props} />;
}

export function ItemContent({ className, ...props }: ItemSectionProps) {
  return <div className={cn(itemContentVariants(), className)} {...props} />;
}

/** A div, not a heading: a repeated row title would flood the document outline. */
export function ItemTitle({ className, ...props }: ItemSectionProps) {
  return <div className={cn(itemTitleVariants(), className)} {...props} />;
}

export interface ItemDescriptionProps
  extends Omit<ComponentProps<"p">, "children" | "className"> {
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
