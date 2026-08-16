import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";
import type { LumoLinkComponent, LumoLinkRenderProps } from "./link-context.ts";

/**
 * A navigational link. NO ENGINE and NO `"use client"`: Base UI has no link
 * primitive, and a real `<a href>` gets press handling from the PLATFORM, so
 * this file is server-renderable — a link in prose or a footer costs the
 * consumer no hydration. `hover:`/`active:`/`:focus-visible` replace RAC's
 * attributes; `data-current` ("true") is still emitted because
 * `navigation-menu.tsx`, `breadcrumbs.tsx` and `sidebar.test.tsx` rely on it.
 *
 * `underline-offset-4` because Arabic-script tails (ی ج ح ع ژ) sit where a
 * default underline cuts. `newTab` is a typed pair (`newTabLabel` required —
 * WCAG 3.2.5) and `target`/`rel` are removed from the prop type, so a new tab
 * is reachable only with an announced warning.
 */
export const linkVariants = cva(
  "inline-flex items-center gap-1 rounded-sm underline-offset-4 " +
    "transition-colors cursor-pointer " +
    // THE press treatment, stated once for all three variants (see button.variants.ts).
    "active:translate-y-px " +
    // `data-disabled` stays an ATTRIBUTE: an `<a>` has no platform disabled state.
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      /** How strongly the link is styled against surrounding prose. */
      variant: {
        // The default: coloured AND underlined (WCAG 1.4.1). `active:` is the shared
        // `translate-y-px` above, not a copy of the hover — `translate` does not
        // reflow, so a word inside a sentence never rewraps.
        accent: "text-accent underline decoration-accent/40 hover:decoration-accent",
        // Dense secondary navigation: the underline appears on hover.
        subtle: "text-fg-muted no-underline hover:text-fg hover:underline",
        // Inherits the surrounding colour, for a link wrapping a whole card.
        quiet: "text-current no-underline hover:underline",
      },
      /** The text-size step. */
      size: {
        sm: "text-sm",
        md: "text-base",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

/**
 * The values ARIA defines for `aria-current`. A closed union rather than
 * `string`: a typo is silently ignored by the browser.
 */
export type LinkCurrent = true | "page" | "step" | "location" | "date" | "time";

interface LinkBaseProps
  extends Omit<
      ComponentProps<"a">,
      | "children"
      | "className"
      | "target"
      | "rel"
      | "role"
      | "aria-disabled"
      | "aria-current"
    >,
    VariantProps<typeof linkVariants> {
  /**
   * The app's own link component (Next's `Link`, a router's) rendered instead
   * of `<a>`. `Link` is a SERVER component and cannot read `LumoProvider
   * linkComponent`; pass it here in server-rendered trees — client families
   * (`Item`, `Command` rows, `MenuItem href`, `NavigationMenuLink`, `SidebarItem`) inject it from the
   * provider themselves.
   */
  linkComponent?: LumoLinkComponent | undefined;
  children?: LumoNode;
  className?: string | undefined;
  /**
   * Marks this link as the resource the reader is currently on — `"page"` for a
   * navigation item, `"step"` inside a wizard. Emits `aria-current` AND `data-current`.
   */
  isCurrent?: LinkCurrent | false | undefined;
  /** Renders a non-navigating link: no `href`, not in the tab order, styled as unavailable. */
  isDisabled?: boolean | undefined;
}

/** The ordinary case: navigation stays in the current tab. */
interface SameTabProps {
  newTab?: false | undefined;
  newTabLabel?: undefined;
}

interface NewTabProps {
  /** Opens the target in a new browsing context (`target="_blank"`). */
  newTab: true;
  /**
   * Announced warning that a new tab will open, e.g. «در برگه جدید باز می‌شود».
   * REQUIRED by the type (WCAG 3.2.5); no default because it would be English.
   */
  newTabLabel: string;
}

/**
 * The typed pair on its own, for wrappers that forward it: build a value of THIS
 * type and spread it, rather than spreading a conditional object literal — the
 * literal widens to `{ newTab?: true | undefined; newTabLabel?: string }` under a
 * consumer's plain `strict` (no `exactOptionalPropertyTypes`) and fits neither arm.
 */
export type LinkTabProps = SameTabProps | NewTabProps;

export type LinkProps = LinkBaseProps & LinkTabProps;

export function Link({
  variant,
  size,
  className,
  children,
  newTab,
  newTabLabel,
  isCurrent,
  isDisabled,
  href,
  linkComponent,
  ...props
}: LinkProps) {
  const classes = cn(linkVariants({ variant, size }), className);
  const current =
    isCurrent === undefined || isCurrent === false
      ? {}
      : { "aria-current": isCurrent, "data-current": "true" as const };

  // Appended AFTER the visible text: an accessible name is concatenated in DOM
  // order, which bidi never reorders, so no `dir` island is needed.
  const content = (
    <>
      {children}
      {href !== undefined && isDisabled !== true && newTabLabel !== undefined ? (
        <span className="sr-only">{newTabLabel}</span>
      ) : null}
    </>
  );

  // No `href`, or disabled: a `<span role="link">` — an `<a>` without `href` is
  // a generic to a screen reader. No `tabindex="0"` when disabled.
  if (href === undefined || isDisabled === true) {
    return (
      <span
        {...props}
        data-lumo=""
        role="link"
        className={classes}
        {...(isDisabled === true
          ? { "aria-disabled": true, "data-disabled": "" }
          : { tabIndex: 0 })}
        {...current}
      >
        {content}
      </span>
    );
  }

  const Anchor: LumoLinkComponent | "a" = linkComponent ?? "a";
  return (
    <Anchor
      {...(props as LumoLinkRenderProps)}
      data-lumo=""
      role={undefined}
      aria-disabled={undefined}
      href={href}
      className={classes}
      {...current}
      // `rel` travels with `target` and is not separately settable.
      {...(newTab === true ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {})}
    >
      {content}
    </Anchor>
  );
}
