"use client";
import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Link, type LinkProps } from "./link.tsx";
import { useLinkComponent } from "./link-context.ts";

/**
 * The bar of top destinations pinned to the block end of a small viewport —
 * what a phone calls the tab bar.
 *
 * It exists on the WEB because it already existed on mobile
 * (`LumoNavigationBar`), and a family with only one platform has no
 * documentation page at all (decisions §39, §40).
 *
 * The items are LINKS, not buttons with a selection callback, and that is the
 * difference between the two platforms rather than a divergence from the mobile
 * API: on a phone the tab bar swaps a view inside one app, on the web it
 * navigates. `aria-current` — not a colour, not a filled glyph — is what says
 * which one you are on, and it comes from `Link`'s `isCurrent`, so the whole bar
 * inherits the link contract including `linkComponent` for a router.
 *
 * `<nav>` needs a name the moment a page has more than one of them, which a page
 * with a bottom bar always does. `label` is therefore REQUIRED, as everywhere
 * else in this library.
 *
 * The bar is `border-t`: a BLOCK-start border. Top and bottom do not mirror
 * between scripts, so there is nothing directional to get wrong — the item ORDER
 * is what mirrors, and it does so on its own because the row is a flex row.
 */
export const navigationBarVariants = cva(
  "flex w-full items-stretch justify-around gap-1 border-t border-border bg-bg px-1 pb-[env(safe-area-inset-bottom)]",
);

export const navigationBarItemVariants = cva(
  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center text-fg-muted no-underline " +
    "data-[current=true]:text-fg data-[current=true]:font-medium",
);

export const navigationBarIconVariants = cva("flex items-center justify-center [&_svg]:size-5");

/**
 * The count sits ON the glyph but is NOT inside the glyph's `aria-hidden`
 * wrapper: an icon is decoration and a count is information, and burying the
 * count in the decoration is how «سفارش‌ها، ۱۲» becomes «سفارش‌ها». It is placed
 * with `inset-inline-end`, the logical inline edge, so it lands on the correct
 * side of the glyph in both scripts.
 */
export const navigationBarBadgeVariants = cva(
  "absolute top-1 inset-inline-end-2 min-w-4 rounded-full bg-critical px-1 text-[10px] leading-4 font-medium text-bg",
);

export const navigationBarLabelVariants = cva("w-full truncate text-xs leading-none");

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

// `aria-label` is OMITTED, not merely overwritten: the component authors the
// region's name from `label`, and an inherited `aria-label` arriving through the
// consumer spread would silently win. `gate:props` fails on exactly this.
export interface NavigationBarProps extends Omit<ComponentProps<"nav">, "children" | "className" | "aria-label"> {
  /** What this bar navigates, e.g. «ناوبری اصلی». REQUIRED: a page with a bottom bar has more than one `<nav>`. */
  label: string;
  /** The destinations, in reading order — `NavigationBarItem`s. */
  children: LumoNode;
  className?: string | undefined;
}

export function NavigationBar({ label, children, className, ...props }: NavigationBarProps) {
  return (
    <nav aria-label={label} className={cn(navigationBarVariants(), className)} {...props}>
      {children}
    </nav>
  );
}

export type NavigationBarItemProps = DistributiveOmit<LinkProps, "variant" | "size"> & {
  /** The destination's glyph. Decorative and `aria-hidden`: the label under it already says the word. */
  icon?: LumoNode;
  /** A short count parked on the glyph, already formatted — `formatNumber(n, locale)`, never a bare number. */
  badge?: LumoNode;
  /** The destination's name. Shown under the glyph and read as the link's text. */
  children: LumoNode;
};

export function NavigationBarItem(props: NavigationBarItemProps) {
  const { icon, badge, children, className, isCurrent, ...rest } = props;
  const Anchor = useLinkComponent();
  return (
    <Link
      variant="quiet"
      size="sm"
      {...(Anchor === "a" ? {} : { linkComponent: Anchor })}
      className={cn(navigationBarItemVariants(), className)}
      {...(isCurrent === undefined || isCurrent === false ? {} : { isCurrent })}
      {...rest}
    >
      <span aria-hidden="true" className={navigationBarIconVariants()}>
        {icon}
      </span>
      <span className={navigationBarLabelVariants()}>{children}</span>
      {/* The `{" "}` is not cosmetic. Two adjacent spans concatenate in the
          accessible name with nothing between them, so «سفارش‌ها» + «۱۲» is
          announced as one token, «سفارش‌ها۱۲». The separator is what makes the
          count a second word. */}
      {badge == null ? null : (
        <>
          {" "}
          <span className={navigationBarBadgeVariants()}>{badge}</span>
        </>
      )}
    </Link>
  );
}
