"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
// The prop SHAPES are Lumo's own, declared in `@lumo-ui/core`'s `props.ts`.
import {
  type AriaLabelingProps,
  type ButtonPropsBase,
  cn,
  type DOMProps,
  type GlobalDOMAttributes,
  type Key,
  type LumoNode,
  type StyleProps,
} from "@lumo-ui/core";
import { attr } from "@lumo-ui/base-ui-ssr";

/**
 * A collapsible section, and the accordion that groups several of them.
 * BASE UI ENGINE.
 *
 *     <DisclosureGroup allowsMultipleExpanded>
 *       <Disclosure id="shipping">
 *         <DisclosureTrigger>هزینه ارسال</DisclosureTrigger>
 *         <DisclosurePanel>…</DisclosurePanel>
 *       </Disclosure>
 *     </DisclosureGroup>
 *
 * EVERY disclosure is an `Accordion.Root`, not a `Collapsible`: only Accordion
 * wires the panel as `role="region"` + `aria-labelledby` back to the trigger.
 * A lone `Disclosure` renders its own root; inside a group it is only an item,
 * and the flag travels by a Lumo context (not `child.type`, which fails across
 * the RSC boundary). The chevron rotates 180° on the block axis, so it needs no
 * mirroring; it reads `data-panel-open` on the TRIGGER's own group. The heading
 * is `Accordion.Header` (`<h3>`; other levels via `render`). `keepMounted` /
 * `hiddenUntilFound` put the panel in the first byte — exposed, not default.
 * Long form: `docs/decisions/log.md`.
 */

export const disclosureGroupVariants = cva(
  "flex w-full flex-col divide-y divide-border border-y border-border",
);

export const disclosureVariants = cva("w-full");

export const disclosureHeadingVariants = cva("m-0");

export const disclosureTriggerVariants = cva(
  // `text-start`; the chevron is pushed to the trailing edge by `ms-auto` on the icon.
  "flex w-full cursor-pointer items-center gap-3 py-4 text-start text-sm font-medium " +
    "text-fg outline-none " +
    // `data-hovered` → `:hover`; Base UI emits no hover attribute.
    "hover:text-accent " +
    // NO ring class here: `DisclosureTrigger` carries `data-lumo`, so theme.css's
    // one rule draws it (the old `outline-accent` utility was inert on layer order).
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const disclosureChevronVariants = cva(
  "ms-auto size-4 shrink-0 text-fg-muted transition-transform duration-200 " +
    // Base UI writes `data-panel-open` on the TRIGGER, the chevron's nearest
    // stateful ancestor.
    "group-data-panel-open/lumo-disclosure-trigger:rotate-180 " +
    "motion-reduce:transition-none",
);

export const disclosurePanelVariants = cva("pb-4 text-sm text-fg-muted");

/** Set by `DisclosureGroup` so a `Disclosure` knows whether it must supply its own `Accordion.Root`. */
const InDisclosureGroup = React.createContext(false);

/**
 * What a disclosure group accepts BESIDES its own expansion props. A caller's
 * `id` is passed to `Accordion.Item` as `value` (a collection key), NOT as a
 * DOM `id` — two accordions offering the same section would emit duplicate ids.
 */
interface DisclosureGroupPropsBase
  extends DOMProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** Whether the whole group is disabled. */
  isDisabled?: boolean;
  /** Whether more than one section may be expanded at a time. */
  allowsMultipleExpanded?: boolean;
}

export interface DisclosureGroupProps extends DisclosureGroupPropsBase {
  /** Expanded section keys. Maps to Base UI's `value`. */
  expandedKeys?: Iterable<string> | undefined;
  /** Initially expanded section keys. Maps to Base UI's `defaultValue`. */
  defaultExpandedKeys?: Iterable<string> | undefined;
  /** Called with the expanded keys. Maps to Base UI's `onValueChange`. */
  onExpandedChange?: ((keys: Set<string>) => void) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function DisclosureGroup({
  className,
  children,
  allowsMultipleExpanded,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  isDisabled,
  ...rest
}: DisclosureGroupProps) {
  return (
    <BaseAccordion.Root
      data-lumo=""
      // `allowsMultipleExpanded` → `multiple`; both default FALSE. Passed
      // explicitly regardless: an engine default is a value that moves in a patch.
      multiple={allowsMultipleExpanded === true}
      {...attr("value", expandedKeys === undefined ? undefined : [...expandedKeys])}
      {...attr(
        "defaultValue",
        defaultExpandedKeys === undefined ? undefined : [...defaultExpandedKeys],
      )}
      {...attr(
        "onValueChange",
        onExpandedChange === undefined
          ? undefined
          : (value: unknown[]) => onExpandedChange(new Set(value as string[])),
      )}
      {...attr("disabled", isDisabled)}
      className={cn(disclosureGroupVariants(), className)}
      {...rest}
    >
      <InDisclosureGroup.Provider value={true}>
        {children as React.ReactNode}
      </InDisclosureGroup.Provider>
    </BaseAccordion.Root>
  );
}

/** One section's own props, minus its children and class. */
interface DisclosurePropsBase
  extends StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** The section's collection key. A `Key`, not a DOM `id`, so it is not spread onto an element. */
  id?: Key;
  /** Whether this section is disabled. */
  isDisabled?: boolean;
  /** Whether the section is expanded (controlled). */
  isExpanded?: boolean;
  /** Whether the section is expanded by default (uncontrolled). */
  defaultExpanded?: boolean;
  /** Handler that is called when the section expands or collapses. */
  onExpandedChange?: (isExpanded: boolean) => void;
}

export interface DisclosureProps extends DisclosurePropsBase {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One section. `group/lumo-disclosure` stays on this element: consumers style
 * against the named group, and removing it is a silent break in every copy.
 */
export function Disclosure({
  className,
  children,
  id,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  isDisabled,
  ...rest
}: DisclosureProps) {
  const grouped = React.useContext(InDisclosureGroup);

  const item = (
    <BaseAccordion.Item
      data-lumo=""
      {...attr("value", id === undefined ? undefined : String(id))}
      {...attr("disabled", isDisabled)}
      className={cn("group/lumo-disclosure", disclosureVariants(), className)}
      {...rest}
    >
      {children as React.ReactNode}
    </BaseAccordion.Item>
  );

  if (grouped) return item;

  // A lone disclosure owns its own root, so its expansion props land where the
  // engine keeps expansion state.
  return (
    <BaseAccordion.Root
      multiple={false}
      {...attr("value", isExpanded === undefined ? undefined : isExpanded ? [String(id ?? "")] : [])}
      {...attr(
        "defaultValue",
        defaultExpanded === undefined ? undefined : defaultExpanded ? [String(id ?? "")] : [],
      )}
      {...attr(
        "onValueChange",
        onExpandedChange === undefined
          ? undefined
          : (value: unknown[]) => onExpandedChange(value.length > 0),
      )}
    >
      {item}
    </BaseAccordion.Root>
  );
}

/**
 * Subtracted from `ButtonPropsBase` and NOT redeclared: Base UI types DOM
 * handlers as `BaseUIEvent<…>`, so `onKeyDown`/`onKeyUp` are not assignable
 * through the spread; the press/hover callbacks have no Base UI counterpart.
 */
type UnsupportedDisclosureTriggerProp =
  | "onKeyDown"
  | "onKeyUp"
  | "onPress"
  | "onPressStart"
  | "onPressEnd"
  | "onPressUp"
  | "onPressChange"
  | "onHoverStart"
  | "onHoverEnd"
  | "onHoverChange"
  | "onFocusChange"
  | "excludeFromTabOrder";

interface DisclosureTriggerSupportedProps
  extends Omit<ButtonPropsBase, "slot" | UnsupportedDisclosureTriggerProp> {}

export interface DisclosureTriggerProps extends DisclosureTriggerSupportedProps {
  children?: LumoNode;
  className?: string | undefined;
  /** Heading level for the outline entry. Defaults to 3. */
  level?: number;
}

export function DisclosureTrigger({
  className,
  children,
  level = 3,
  isDisabled,
  // `ButtonPropsBase` carriers; destructured so they do not reach the DOM.
  ...rest
}: DisclosureTriggerProps) {
  // `Accordion.Header` renders `<h3>` and takes no `level`, so the level is a
  // `render` override; `level={3}` renders no override at all.
  const heading =
    level === 3 ? undefined : React.createElement(`h${String(Math.min(Math.max(level, 1), 6))}`);
  return (
    <BaseAccordion.Header
      className={disclosureHeadingVariants()}
      {...attr("render", heading)}
    >
      <BaseAccordion.Trigger
        data-lumo=""
        {...attr("disabled", isDisabled)}
        className={cn(
          "group/lumo-disclosure-trigger",
          disclosureTriggerVariants(),
          className,
        )}
        {...rest}
      >
        <span className="flex-1">{children as React.ReactNode}</span>
        <ChevronDown aria-hidden="true" className={disclosureChevronVariants()} />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

/** The panel's own props, minus its children and class. */
interface DisclosurePanelPropsBase
  extends DOMProps,
    StyleProps,
    AriaLabelingProps,
    GlobalDOMAttributes<HTMLDivElement> {}

export interface DisclosurePanelProps extends DisclosurePanelPropsBase {
  children?: LumoNode;
  className?: string | undefined;
  /**
   * Render the panel into the first byte, hidden, instead of not at all. OFF by
   * default; `"until-found"` also lets browser find-in-page reveal it.
   */
  keepMounted?: boolean | "until-found" | undefined;
}

export function DisclosurePanel({
  className,
  children,
  keepMounted,
  ...rest
}: DisclosurePanelProps) {
  return (
    <BaseAccordion.Panel
      data-lumo=""
      {...attr("keepMounted", keepMounted === undefined ? undefined : keepMounted !== false)}
      {...attr("hiddenUntilFound", keepMounted === "until-found" ? true : undefined)}
      className={cn(disclosurePanelVariants(), className)}
      {...rest}
    >
      {children as React.ReactNode}
    </BaseAccordion.Panel>
  );
}
