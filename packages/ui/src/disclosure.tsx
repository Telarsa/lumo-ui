"use client";

import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  DisclosurePanel as AriaDisclosurePanel,
  Heading as AriaHeading,
  type ButtonProps as AriaButtonProps,
  type DisclosureGroupProps as AriaDisclosureGroupProps,
  type DisclosurePanelProps as AriaDisclosurePanelProps,
  type DisclosureProps as AriaDisclosureProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A collapsible section, and the accordion that groups several of them.
 *
 *     <DisclosureGroup allowsMultipleExpanded>
 *       <Disclosure id="shipping">
 *         <DisclosureTrigger>هزینه ارسال</DisclosureTrigger>
 *         <DisclosurePanel>…</DisclosurePanel>
 *       </Disclosure>
 *     </DisclosureGroup>
 *
 * ── THE CHEVRON ROTATES 180°, NOT 90° ───────────────────────────────────────
 *
 * The usual accordion affordance is a chevron pointing along the inline axis
 * when collapsed and rotating a quarter turn down when expanded. That is a
 * direction bug in two places at once: the resting glyph points at a physical
 * side, and the rotation has a physical sense — `rotate-90` turns the same way
 * regardless of script, so a mirrored resting state and an unmirrored rotation
 * disagree.
 *
 * A `ChevronDown` flipped a HALF turn has neither problem. 180° is its own
 * mirror image, and a down/up pair reads identically in Persian and English
 * because it lives entirely on the block axis. This is the same reasoning as the
 * Select trigger's chevron, and the opposite conclusion from menu.tsx's submenu
 * arrow — that one genuinely points along the inline axis, so it has to be the
 * bidi-mirrored character `›` rather than any icon.
 *
 * ── THE HEADING IS NOT DECORATION ───────────────────────────────────────────
 *
 * `DisclosureTrigger` renders `<Heading><Button slot="trigger">`. The heading is
 * what puts the section in the document outline so a screen-reader user can jump
 * between panels; the slot is RAC's own wiring, which supplies `aria-expanded`,
 * `aria-controls` and the press handler. Neither is optional, which is why they
 * are inside the component rather than left to the caller.
 */

export const disclosureGroupVariants = cva(
  "flex w-full flex-col divide-y divide-border border-y border-border",
);

export const disclosureVariants = cva("w-full");

export const disclosureHeadingVariants = cva("m-0");

export const disclosureTriggerVariants = cva(
  // `text-start` and `ps-0 pe-0` keep the label hugging the reading edge; the
  // chevron is pushed to the trailing edge by `ms-auto` on the icon itself.
  "flex w-full cursor-pointer items-center gap-3 py-4 text-start text-sm font-medium " +
    "text-fg outline-none " +
    "data-hovered:text-accent " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const disclosureChevronVariants = cva(
  "ms-auto size-4 shrink-0 text-fg-muted transition-transform duration-200 " +
    "group-data-expanded/lumo-disclosure:rotate-180 " +
    "motion-reduce:transition-none",
);

export const disclosurePanelVariants = cva("pb-4 text-sm text-fg-muted");

export interface DisclosureGroupProps
  extends Omit<AriaDisclosureGroupProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DisclosureGroup({ className, ...props }: DisclosureGroupProps) {
  return (
    <AriaDisclosureGroup
      className={cn(disclosureGroupVariants(), className)}
      {...props}
    />
  );
}

/**
 * The `group/lumo-disclosure` class is what lets the chevron read
 * `data-expanded` off this element without any React state. RAC writes the
 * attribute here; the icon is a descendant; Tailwind's named group variant does
 * the rest.
 */
export interface DisclosureProps extends Omit<AriaDisclosureProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Disclosure({ className, ...props }: DisclosureProps) {
  return (
    <AriaDisclosure
      className={cn("group/lumo-disclosure", disclosureVariants(), className)}
      {...props}
    />
  );
}

export interface DisclosureTriggerProps
  extends Omit<AriaButtonProps, "children" | "className" | "slot"> {
  children?: LumoNode;
  className?: string | undefined;
  /** Heading level for the outline entry. Defaults to 3. */
  level?: number;
}

export function DisclosureTrigger({
  className,
  children,
  level = 3,
  ...props
}: DisclosureTriggerProps) {
  return (
    <AriaHeading level={level} className={disclosureHeadingVariants()}>
      <AriaButton
        data-lumo=""
        slot="trigger"
        className={cn(disclosureTriggerVariants(), className)}
        {...props}
      >
        <span className="flex-1">{children}</span>
        <ChevronDown aria-hidden="true" className={disclosureChevronVariants()} />
      </AriaButton>
    </AriaHeading>
  );
}

export interface DisclosurePanelProps
  extends Omit<AriaDisclosurePanelProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DisclosurePanel({ className, children, ...props }: DisclosurePanelProps) {
  return (
    <AriaDisclosurePanel className={cn(disclosurePanelVariants(), className)} {...props}>
      {children}
    </AriaDisclosurePanel>
  );
}
