"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
// The prop SHAPES the public API is pinned to. They were `react-aria-components`
// type imports until those were removed; the surface is unchanged and now owned
// by Lumo. See `@lumo-ui/core`'s `props.ts`.
import {
  type AriaLabelingProps,
  type ButtonPropsBase,
  cn,
  type DOMProps,
  type GlobalDOMAttributes,
  type Key,
  type LumoNode,
  type SlotProps,
  type StyleProps,
} from "@lumo-ui/core";
import { attr } from "@lumo-ui/base-ui-ssr";

/**
 * A collapsible section, and the accordion that groups several of them.
 * **BASE UI ENGINE.**
 *
 *     <DisclosureGroup allowsMultipleExpanded>
 *       <Disclosure id="shipping">
 *         <DisclosureTrigger>هزینه ارسال</DisclosureTrigger>
 *         <DisclosurePanel>…</DisclosurePanel>
 *       </Disclosure>
 *     </DisclosureGroup>
 *
 * Not vendored: `disclosure` has no base-vega counterpart (checked —
 * base-vega-inventory.json lists it among the 29 that are Lumo's to write), and
 * upstream's Base UI accordion recipe is a different public API.
 *
 * ═══ IT IS `Accordion`, NOT `Collapsible`, AND THE PANEL'S ROLE DECIDED IT ══
 *
 * Base UI ships both, and `Collapsible` is the obvious mapping for a single
 * `<Disclosure>` — one trigger, one panel, no group. It is the wrong one, and
 * the difference is exactly one attribute pair. Measured, both open:
 *
 *     Collapsible  <button aria-controls="…" aria-expanded="true">
 *                  <div id="…">                       ← no role, no name
 *
 *     Accordion    <h3><button aria-controls="…" aria-expanded="true" id="T"></h3>
 *                  <div id="…" role="region" aria-labelledby="T">
 *
 * `Collapsible`'s panel is an anonymous generic. A screen-reader user who
 * expands a section and then navigates INTO it has left the trigger behind and
 * has nothing telling them which section they are in — the panel is not a
 * landmark, is not named, and does not appear in a rotor. `Accordion` wires
 * `role="region"` + `aria-labelledby` pointing back at the trigger, which is
 * what the React Aria build got from `DisclosurePanel` and what would have been
 * silently lost by taking the mapping that reads more naturally.
 *
 * So EVERY disclosure is an `Accordion.Root`, including a lone one. A root with
 * one item is not a workaround: `Accordion.Root` renders a bare `<div>` with a
 * `data-orientation`, which is what `disclosureGroupVariants` was styling
 * anyway, and it is the part that owns expansion state in both shapes.
 *
 * `Disclosure` therefore renders its OWN `Accordion.Root` when it is not inside
 * a `DisclosureGroup`, and only an `Accordion.Item` when it is. The flag travels
 * by context — a Lumo-owned React context, which renders on the server and is
 * not the client-only `LocalizedStringProvider` pattern DECISIONS §0.1 rules
 * out. Detecting it by `child.type` instead would pass jsdom and quietly fail
 * when a SERVER component composes the tree; findChildProp's docblock records
 * the build that lesson cost.
 *
 * ── THE CHEVRON ROTATES 180°, NOT 90° (unchanged, and it is not the engine's)
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
 * because it lives entirely on the block axis. Same reasoning as the Select
 * trigger's chevron, and the opposite conclusion from menu.tsx's submenu arrow —
 * that one genuinely points along the inline axis, so it has to be the
 * bidi-mirrored character `›` rather than any icon.
 *
 * What DID change is what the chevron reads. React Aria wrote `data-expanded` on
 * the `<Disclosure>`; Base UI writes `data-open` on the item AND `data-panel-open`
 * on the trigger. The rule is moved onto the TRIGGER's own group rather than
 * renamed onto the item's, because the trigger is the chevron's nearest
 * stateful ancestor and a named group that has to hop two levels is the kind of
 * selector that survives a refactor by accident.
 *
 * ── THE HEADING IS NOT DECORATION (unchanged, and now the engine's) ─────────
 *
 * `DisclosureTrigger` renders `<Accordion.Header><Accordion.Trigger>`. The
 * heading is what puts the section in the document outline so a screen-reader
 * user can jump between panels; `Accordion.Header` defaults to `<h3>`, which is
 * the level the React Aria build defaulted to, so nothing moved. A different
 * level is a `render` override — measured, `render={<h2/>}` serves `<h2>` with
 * every data attribute intact.
 *
 * ── ONE CAPABILITY GAINED, NOT ADOPTED BY DEFAULT ──────────────────────────
 *
 * React Aria rendered NOTHING for a collapsed panel. Base UI's `keepMounted`
 * puts it in the first byte behind `hidden`, and `hiddenUntilFound` makes it
 * findable by browser find-in-page and expandable by the browser itself.
 * Measured at SSR: `<div hidden id="…" role="region" aria-labelledby="…">متن</div>`.
 * That is real value for a no-JS reader and for search engines — an FAQ whose
 * answers are absent from the served HTML is an FAQ nobody can index. It is
 * exposed as a prop rather than switched on, because turning it on changes what
 * every existing consumer ships in their first byte, and this migration swaps the
 * engine rather than the output.
 */

export const disclosureGroupVariants = cva(
  "flex w-full flex-col divide-y divide-border border-y border-border",
);

export const disclosureVariants = cva("w-full");

export const disclosureHeadingVariants = cva("m-0");

export const disclosureTriggerVariants = cva(
  // `text-start` and no inline padding keep the label hugging the reading edge;
  // the chevron is pushed to the trailing edge by `ms-auto` on the icon itself.
  "flex w-full cursor-pointer items-center gap-3 py-4 text-start text-sm font-medium " +
    "text-fg outline-none " +
    // `data-hovered` → `:hover`. Base UI emits no hover attribute anywhere:
    // grep over the whole 1.7.0 dist returns 0 files. Keeping the old selector
    // would have left a class that styles nothing and reviews as if it did.
    "hover:text-accent " +
    // WCAG 2.4.7. `data-focus-visible` does not exist in Base UI either, and
    // this is the row that gets missed — a ring that silently stops rendering is
    // invisible to everyone who navigates with a pointer, i.e. to every
    // reviewer. `:focus-visible` keeps its unit tier: jsdom DOES match it on a
    // focused element, unlike `:hover` and `:active`.
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const disclosureChevronVariants = cva(
  "ms-auto size-4 shrink-0 text-fg-muted transition-transform duration-200 " +
    // RAC: `group-data-expanded/lumo-disclosure`, read off the Disclosure.
    // Base UI: `data-panel-open`, written on the TRIGGER — see the file header
    // for why the rule moved down a level rather than being renamed in place.
    "group-data-panel-open/lumo-disclosure-trigger:rotate-180 " +
    "motion-reduce:transition-none",
);

export const disclosurePanelVariants = cva("pb-4 text-sm text-fg-muted");

/**
 * Set by `DisclosureGroup` so a `Disclosure` knows whether it must supply its
 * own `Accordion.Root`. See the file header.
 */
const InDisclosureGroup = React.createContext(false);

/**
 * `id` travels the same way. React Aria's `Disclosure` took `id` as a COLLECTION
 * KEY and `DisclosureGroup` addressed items by it (`defaultExpandedKeys`); Base
 * UI's `Accordion.Item` takes `value`, which is the identical idea under another
 * name, but `Accordion.Trigger` also mints DOM ids from it. Passing a caller's
 * key through as `value` is correct and is what happens; it is NOT passed as a
 * DOM `id`, for the reason menu.tsx gives — two accordions offering the same
 * section would then emit duplicate ids.
 */
/**
 * What a disclosure group accepts BESIDES its own expansion props.
 *
 * The three expansion props are redeclared on `DisclosureGroupProps` below with
 * `string` keys rather than inherited, which is why they are absent here.
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
  // ── ACCEPTED BY THE API, UNREACHABLE IN BASE UI ────────────────────────────
  // `render` and `style` are RAC-shaped and collide with Base UI's own props of
  // the same name; the spread below does not type-check without them.
  style: _style,
  ...rest
}: DisclosureGroupProps) {
  return (
    <BaseAccordion.Root
      data-lumo=""
      // `allowsMultipleExpanded` → `multiple`. A rename, and both libraries
      // default it to FALSE — checked in the dist (`AccordionRoot.d.ts:84,
      // @default false`) rather than assumed, because base-vega's vendored
      // accordion spells the same idea `openMultiple` and an inverted default
      // here would silently turn every single-open accordion in every consuming
      // project into a multi-open one, with nothing red anywhere. Passed
      // explicitly regardless: an engine default is a value that moves in a
      // patch release.
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
    SlotProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /**
   * The section's collection key. A `Key`, not a DOM `id` — see the note above
   * `DisclosureGroupProps`, which is also why it is not spread onto an element.
   */
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
 * One section.
 *
 * `group/lumo-disclosure` is kept on this element even though the chevron no
 * longer reads it — `data-open` lands here and consumers style against the named
 * group. Removing a named group is a silent break in every copy of this file
 * that someone has already edited.
 */
export function Disclosure({
  className,
  children,
  id,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  isDisabled,
  slot: _slot,
  style: _style,
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

  /*
   * A lone disclosure owns its own root, so its expansion props land where the
   * engine keeps expansion state. `openMultiple` is irrelevant with one item and
   * is still set false, matching the group default above.
   */
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

export interface DisclosureTriggerProps extends Omit<ButtonPropsBase, "slot"> {
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
  // Base UI's parts type their DOM handlers as `BaseUIEvent<…>`, which carries a
  // `preventBaseUIHandler` escape hatch the handler shapes in `@lumo-ui/core`'s
  // props.ts do not — those restate the vocabulary this API was pinned to, so
  // they are not assignable and the spread does not compile with them in
  // `rest`. Dropped rather than cast: a cast would let a caller pass a handler
  // whose event object lacks `continuePropagation`, which is the shape it would
  // be typed against.
  onKeyDown: _onKeyDown,
  onKeyUp: _onKeyUp,
  onPress: _onPress,
  onPressStart: _onPressStart,
  onPressEnd: _onPressEnd,
  onPressUp: _onPressUp,
  onPressChange: _onPressChange,
  onHoverStart: _onHoverStart,
  onHoverEnd: _onHoverEnd,
  onHoverChange: _onHoverChange,
  onFocusChange: _onFocusChange,
  isPending: _isPending,
  preventFocusOnPress: _preventFocusOnPress,
  excludeFromTabOrder: _excludeFromTabOrder,
  style: _style,
  ...rest
}: DisclosureTriggerProps) {
  /*
   * `Accordion.Header` renders `<h3>` and takes no `level`. The heading level is
   * therefore a `render` override rather than a prop — measured to keep every
   * data attribute. `level={3}` renders no override at all, so the common case
   * emits the engine's own element and nothing is cloned.
   */
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
    GlobalDOMAttributes<HTMLDivElement> {
  /** The content to display as the panel's label. */
  label?: React.ReactNode;
  /** The element type of the label. */
  labelElementType?: React.ElementType;
  /**
   * The landmark role for the panel.
   *
   * @default 'group'
   */
  role?: "group" | "region";
}

export interface DisclosurePanelProps extends DisclosurePanelPropsBase {
  children?: LumoNode;
  className?: string | undefined;
  /**
   * Render the panel into the first byte, hidden, instead of not at all.
   *
   * OFF by default — see the file header. `"until-found"` additionally lets the
   * browser's own find-in-page reveal it, which is the form worth having for an
   * FAQ: the answer becomes indexable and Ctrl-F-able without any JavaScript.
   */
  keepMounted?: boolean | "until-found" | undefined;
}

export function DisclosurePanel({
  className,
  children,
  keepMounted,
  style: _style,
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
