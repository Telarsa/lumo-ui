/**
 * No "use client": these are layout primitives with no interaction, so they
 * render on the server and cost a consumer no hydration.
 */
import type { ComponentProps, ElementType, Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * Layout primitives: Stack (flex), Grid, Container. No `"use client"`: a
 * client directive on a layout primitive pulls whole route subtrees across the
 * boundary.
 *
 * Flexbox and Grid resolve `start`/`end` against `direction`, so these need no
 * `rtl:` variants. Traps: `space-x-*` is PHYSICAL (`margin-left`), so `gap` is
 * the only spacing offered; `items-start`/`justify-end` are already logical;
 * `mx-auto` is logical in Tailwind v4 (`margin-inline`), which Container relies
 * on. `tag`, not `asChild`: a real element, a real ref, no cloning (PLAN.md).
 */

/** Elements a layout primitive may render. Closed on purpose — see the header. */
export type BoxTag =
  | "div"
  | "span"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "main"
  | "nav"
  | "ul"
  | "ol"
  | "li"
  | "dl"
  | "form"
  | "fieldset";

export const stackVariants = cva("flex", {
  variants: {
    /** Main axis: a logical row that mirrors under RTL, or a column. */
    direction: {
      // `flex-row` is the INLINE axis and reverses under `dir="rtl"`;
      // `flex-row-reverse` is deliberately not offered (it flips twice in Persian).
      row: "flex-row",
      column: "flex-col",
    },
    /** The spacing step between children, from the spacing scale. */
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
    /** Cross-axis alignment of the children. */
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    /** Main-axis distribution of the children. */
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    /** Lets the row wrap instead of overflowing. */
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: "sm",
    align: "stretch",
    justify: "start",
    wrap: false,
  },
});

export interface StackProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "ref">,
    VariantProps<typeof stackVariants> {
  /**
   * The root element, at the widest type that is true of every branch: `tag`
   * picks the element, so `Ref<HTMLDivElement>` would be a lie. Widened, never dropped.
   */
  ref?: Ref<HTMLElement> | undefined;
  children?: LumoNode;
  /** Which element to render. Default `"div"`. */
  tag?: BoxTag | undefined;
  className?: string | undefined;
}

/** A one-axis flex layout: a logical row that mirrors under RTL, or a column, with a gap from the spacing scale. */
export function Stack({
  tag = "div",
  direction,
  gap,
  align,
  justify,
  wrap,
  className,
  children,
  ...props
}: StackProps) {
  // Widened so JSX accepts a variable tag; parameterised on `ComponentProps<"div">`
  // so JSX does not check the attribute bag against EVERY intrinsic at once.
  const Element = tag as ElementType<ComponentProps<"div">>;
  return (
    <Element
      className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)}
      // The one cast the widened `ref` costs: the element is chosen at RUN time,
      // and the ref is passed through untouched.
      {...(props as ComponentProps<"div">)}
    >
      {children}
    </Element>
  );
}

export const gridVariants = cva("grid", {
  variants: {
    /** The column template: a fixed count or the auto-fill preset. */
    cols: {
      // Grid tracks run along the inline axis, so column 1 is the reader's first in both scripts.
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
      "4": "grid-cols-4",
      "6": "grid-cols-6",
      "12": "grid-cols-12",
      /** As many columns as fit at 16rem; `auto-fill` so a single item does not stretch. */
      auto: "grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]",
    },
    /** The spacing step between tracks, from the spacing scale. */
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
    /** Cross-axis alignment of grid items. */
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
  },
  defaultVariants: { cols: "auto", gap: "md", align: "stretch" },
});

export interface GridProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "ref">,
    VariantProps<typeof gridVariants> {
  /**
   * The root element, at the widest type that is true of every branch: `tag`
   * picks the element, so `Ref<HTMLDivElement>` would be a lie. Widened, never dropped.
   */
  ref?: Ref<HTMLElement> | undefined;
  children?: LumoNode;
  /** The element rendered as the grid container. */
  tag?: BoxTag | undefined;
  className?: string | undefined;
}

export function Grid({ tag = "div", cols, gap, align, className, children, ...props }: GridProps) {
  const Element = tag as ElementType<ComponentProps<"div">>;
  return (
    <Element
      className={cn(gridVariants({ cols, gap, align }), className)}
      // The one cast the widened `ref` costs; the ref is passed through untouched.
      {...(props as ComponentProps<"div">)}
    >
      {children}
    </Element>
  );
}

export const containerVariants = cva(
  // `mx-auto` → `margin-inline: auto`; `px-*` → `padding-inline`. Both logical in v4.
  "mx-auto w-full",
  {
    variants: {
      /** The max-width preset the content column is clamped to. */
      size: {
        // Tailwind v4's `--container-*` scale; `max-w-screen-*` would emit nothing.
        sm: "max-w-2xl",
        md: "max-w-4xl",
        lg: "max-w-6xl",
        xl: "max-w-7xl",
        full: "max-w-none",
      },
      /** Adds the page gutter padding on the inline edges. */
      padded: {
        true: "px-4",
        false: "",
      },
    },
    defaultVariants: { size: "lg", padded: true },
  },
);

export interface ContainerProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "ref">,
    VariantProps<typeof containerVariants> {
  /**
   * The root element, at the widest type that is true of every branch: `tag`
   * picks the element, so `Ref<HTMLDivElement>` would be a lie. Widened, never dropped.
   */
  ref?: Ref<HTMLElement> | undefined;
  children?: LumoNode;
  /**
   * Which element to render. Default `"div"` — a page's main content container
   * should be `tag="main"`, which makes "skip to content" and the landmark rotor work.
   */
  tag?: BoxTag | undefined;
  className?: string | undefined;
}

export function Container({
  tag = "div",
  size,
  padded,
  className,
  children,
  ...props
}: ContainerProps) {
  const Element = tag as ElementType<ComponentProps<"div">>;
  return (
    <Element
      className={cn(containerVariants({ size, padded }), className)}
      // The one cast the widened `ref` costs; the ref is passed through untouched.
      {...(props as ComponentProps<"div">)}
    >
      {children}
    </Element>
  );
}
