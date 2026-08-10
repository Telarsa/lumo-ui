import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A scroll container with styled scrollbars.
 *
 *     <ScrollArea label="فهرست تراکنش‌ها" className="h-64">
 *       …
 *     </ScrollArea>
 *
 * Deliberately server-renderable: NO `"use client"`, no React Aria, no state.
 * This is a plain overflow container styled with the two CSS scrollbar
 * properties (`scrollbar-width`, `scrollbar-color`), via Tailwind arbitrary
 * properties in the cva below — vendored from shadcn's aria-vega `scroll-area`,
 * which made the same call, and rewritten for the house rules.
 *
 * ── WHY NOT A JS THUMB, STATED AS A TRADE RATHER THAN A TASTE ───────────────
 *
 * The Radix-style implementation re-draws the scrollbar as positioned divs and
 * re-implements dragging, paging and RTL thumb math in JavaScript. What that
 * buys is per-pixel visual control (rounded floating thumbs, overlay bars).
 * What it costs: a hydration dependency for something that must work at first
 * byte, a hand-rolled RTL branch for the thumb position — exactly the class of
 * silent mirroring defect this library exists to remove — and a second scroll
 * model for assistive tech to disagree with. The CSS properties restyle the
 * ENGINE's own scrollbar: native wheel/touch/keyboard behaviour, native RTL.
 * The trade is accepted: Lumo's scrollbars are the platform's shape, thinner
 * and recoloured to the border token, not a custom-drawn thumb.
 *
 * ── RTL: VERIFIED BEHAVIOUR, NOT ASSUMPTION ─────────────────────────────────
 *
 * The vertical scrollbar's edge follows the element's resolved direction — on
 * an RTL box every engine lays the block-axis scrollbar on the LEFT edge and
 * starts horizontal overflow from the right (CSS Overflow: the scrollbar goes
 * on the inline-END side of the scrollport). Nothing here needs to mirror, and
 * the component's own contribution to that is checked rather than assumed:
 * scroll-area.test.tsx asserts this file sets no `dir` of its own and styles
 * with no physical utility, so the container always inherits the document
 * direction that `LumoHtml` derived from the locale.
 *
 * ── WHY `label` IS REQUIRED ─────────────────────────────────────────────────
 *
 * A scrollable region must be keyboard-reachable to be keyboard-scrollable.
 * Chrome (125+) and Firefox make a childless scroller focusable on their own;
 * Safari still does not, so `tabIndex={0}` is set explicitly — and a focusable
 * element with no name announces as nothing. `role="region"` plus a required
 * `label` names the stop, which is the same reasoning as `Toolbar` and
 * `Table`: the tab stop exists, so it must say what it holds. `data-lumo`
 * gives that stop the shared theme.css focus ring.
 */
export const scrollAreaVariants = cva(
  "relative outline-none " +
    "[scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]",
  {
    variants: {
      orientation: {
        // `overflow-x-hidden` rather than leaving it `visible`: a too-wide
        // child in a vertical list should clip, not push the page sideways —
        // a horizontal scrollbar on the document is the one thing that behaves
        // differently under RTL in every engine (see table.tsx).
        vertical: "overflow-y-auto overflow-x-hidden",
        horizontal: "overflow-x-auto overflow-y-hidden",
        both: "overflow-auto",
      },
    },
    defaultVariants: { orientation: "vertical" },
  },
);

export interface ScrollAreaProps extends VariantProps<typeof scrollAreaVariants> {
  /**
   * Announced name of the scrollable region, e.g. «فهرست تراکنش‌ها».
   * REQUIRED: the container is a Tab stop (see the header), and an unnamed
   * region announces as a bare "region" with no indication of what scrolls.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function ScrollArea({ label, orientation, className, children }: ScrollAreaProps) {
  return (
    <div
      data-lumo=""
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(scrollAreaVariants({ orientation }), className)}
    >
      {children}
    </div>
  );
}
