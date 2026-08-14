/**
 * No "use client": these are layout primitives with no interaction, so they
 * render on the server and cost a consumer no hydration.
 */
import type { ComponentProps, ElementType, Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * Layout primitives: Stack (flex), Grid, Container.
 *
 * No `"use client"` in this file. These wrap page structure, and a client
 * directive on a layout primitive quietly pulls whole route subtrees across the
 * boundary — the most expensive possible place to get rule 1 wrong.
 *
 * ═══ WHY THESE THREE COMPONENTS ARE THE RTL STORY, NOT THE SPACING STORY ════
 *
 * Every mirroring bug this library exists to prevent is a layout bug, and the
 * fix is almost always to stop positioning things and let a layout algorithm do
 * it. Flexbox and Grid resolve `start` and `end` against the container's
 * `direction`, so `justify-end` is the RIGHT edge in English and the LEFT edge
 * in Persian with no `rtl:` variant, no duplicated rule and nothing to keep in
 * sync. That is why Lumo's primitives are flex and grid rather than a `Box`
 * with margin props.
 *
 * Three specific traps, stated because they are what people reach for:
 *
 *  1. **`space-x-*` is physical.** Tailwind implements it as `margin-left` on
 *     every child but the first (`margin-inline-start` is not what it emits),
 *     so a horizontal stack built with `space-x-4` bunches to the wrong side in
 *     Persian. `gap` is axis-relative by construction and is the only spacing
 *     mechanism these components offer — there is deliberately no `space`
 *     variant to pick by mistake.
 *
 *  2. **`items-start` / `justify-end` are already logical.** They compile to
 *     `align-items: flex-start` and `justify-content: flex-end`, and *flex*
 *     start/end follow the flex container's direction. No `-s`/`-e` variant
 *     exists for them because none is needed. Contrast `text-left`, which is
 *     genuinely physical and whose logical form is `text-start`.
 *
 *  3. **`mx-auto` is logical in Tailwind v4** — it emits `margin-inline: auto`,
 *     not `margin-left`/`margin-right`. Verified against tailwindcss 4.3.3,
 *     where the utility table maps `mx → margin-inline`, `my → margin-block`,
 *     `px → padding-inline`. Container relies on it.
 *
 * ── `tag`, not `asChild` ────────────────────────────────────────────────────
 * PLAN.md records the decision: Radix's `asChild` is powerful, type-hostile and
 * a standing source of "where did my ref go". A layout primitive still has to
 * be able to render `<main>` or `<section>` for the document outline, so it
 * takes a `tag` prop constrained to a closed union of container elements. A
 * real element, a real ref, no cloning.
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
    direction: {
      // `flex-row` is the INLINE axis, so it already reverses under
      // `dir="rtl"`. `flex-row-reverse` is deliberately not offered: it reverses
      // against the direction rather than with it, which means it flips twice
      // in Persian and lands back where it started — an "obvious" utility that
      // does the opposite of what a reader of the class name expects.
      row: "flex-row",
      column: "flex-col",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
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
   * The root element, at the widest type that is true of every branch.
   *
   * `ComponentProps<"div">` carries `Ref<HTMLDivElement>`, which is a LIE here:
   * `tag` picks the element, and its values include
   * `section`, `main`, `nav`, `ul` and `li`. `HTMLElement` is what every branch has in
   * common. `ref` is never simply dropped under this library's contract — only
   * ever widened, and the widening is stated. See `props.ts`.
   */
  ref?: Ref<HTMLElement> | undefined;
  children?: LumoNode;
  /** Which element to render. Default `"div"`. */
  tag?: BoxTag | undefined;
  className?: string | undefined;
}

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
  // Widened so JSX accepts a variable tag. The prop type is what constrains the
  // VALUE; this local only exists to satisfy the JSX element-type check without
  // a cast at every call site.
  //
  // Parameterised on `ComponentProps<"div">` rather than left bare, because a
  // bare `ElementType` makes JSX check the attribute bag against EVERY
  // intrinsic at once — and `<form>`'s `ref` is `Ref<HTMLFormElement>`, which
  // no single ref type can satisfy alongside `<div>`'s. Pinning the check to
  // the default tag is what keeps the one cast below to one line.
  const Element = tag as ElementType<ComponentProps<"div">>;
  return (
    <Element
      className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)}
      /*
       * The one cast the widened `ref` costs, and it is contained to this line.
       * The element is chosen at RUN time, so no static type can be right for
       * every branch; the ref itself is passed through untouched and React
       * assigns whatever element it actually created. Widening the prop and
       * narrowing here is the only arrangement in which a consumer is never
       * handed a ref typed as an element this component may not render.
       */
      {...(props as ComponentProps<"div">)}
    >
      {children}
    </Element>
  );
}

export const gridVariants = cva("grid", {
  variants: {
    cols: {
      // Grid tracks are laid out along the inline axis, so column 1 is the
      // reader's first column in both scripts. This is the reason a card grid
      // needs no RTL work at all while a float- or absolute-positioned one
      // needs it everywhere.
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
      "4": "grid-cols-4",
      "6": "grid-cols-6",
      "12": "grid-cols-12",
      /**
       * Responsive without breakpoints: as many columns as fit at 16rem or
       * wider. `auto-fill` rather than `auto-fit` so a single item does not
       * stretch across the whole row.
       */
      auto: "grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
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
   * The root element, at the widest type that is true of every branch.
   *
   * `ComponentProps<"div">` carries `Ref<HTMLDivElement>`, which is a LIE here:
   * `tag` picks the element, and its values include
   * `section`, `main`, `nav`, `ul` and `li`. `HTMLElement` is what every branch has in
   * common. `ref` is never simply dropped under this library's contract — only
   * ever widened, and the widening is stated. See `props.ts`.
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
      /*
       * The one cast the widened `ref` costs, and it is contained to this line.
       * The element is chosen at RUN time, so no static type can be right for
       * every branch; the ref itself is passed through untouched and React
       * assigns whatever element it actually created. Widening the prop and
       * narrowing here is the only arrangement in which a consumer is never
       * handed a ref typed as an element this component may not render.
       */
      {...(props as ComponentProps<"div">)}
    >
      {children}
    </Element>
  );
}

export const containerVariants = cva(
  // `mx-auto` → `margin-inline: auto`; `px-*` → `padding-inline`. Both logical
  // in v4, so a centred page gutter is symmetric and script-agnostic.
  "mx-auto w-full",
  {
    variants: {
      size: {
        // Tailwind v4's `--container-*` scale. `max-w-screen-*` was removed in
        // v4 and would silently emit nothing.
        sm: "max-w-2xl",
        md: "max-w-4xl",
        lg: "max-w-6xl",
        xl: "max-w-7xl",
        full: "max-w-none",
      },
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
   * The root element, at the widest type that is true of every branch.
   *
   * `ComponentProps<"div">` carries `Ref<HTMLDivElement>`, which is a LIE here:
   * `tag` picks the element, and `tag="main"` is the case the
   * prop's own docblock recommends. `HTMLElement` is what every branch has in
   * common. `ref` is never simply dropped under this library's contract — only
   * ever widened, and the widening is stated. See `props.ts`.
   */
  ref?: Ref<HTMLElement> | undefined;
  children?: LumoNode;
  /**
   * Which element to render. Default `"div"` — but a page's main content
   * container should be `tag="main"`, which is what makes "skip to content"
   * work and what a screen reader's landmark rotor lists.
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
      /*
       * The one cast the widened `ref` costs, and it is contained to this line.
       * The element is chosen at RUN time, so no static type can be right for
       * every branch; the ref itself is passed through untouched and React
       * assigns whatever element it actually created. Widening the prop and
       * narrowing here is the only arrangement in which a consumer is never
       * handed a ref typed as an element this component may not render.
       */
      {...(props as ComponentProps<"div">)}
    >
      {children}
    </Element>
  );
}
