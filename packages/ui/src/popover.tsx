"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Popover as BasePopover } from "@base-ui/react/popover";
// `Placement` is the FULL union, physical spellings included, so the `Exclude`
// below can subtract them. Seven sibling components (menu, select, combobox,
// hover-card, navigation-menu, date-picker, date-range-picker) import
// `LumoPlacement` from here and pass it to their own positioners, so the union
// has to stay exactly what it was — deriving it from anything narrower would
// silently change what they accept.
import {
  cn,
  type FocusWithinEvents,
  type GlobalDOMAttributes,
  type LumoNode,
  type OverlayTriggerProps,
  type Placement,
  type PositionProps,
  type SlotProps,
  type StyleProps,
} from "@lumo-ui/core";
import { attr } from "@lumo-ui/base-ui-ssr";

/**
 * A positioned overlay. **BASE UI ENGINE** — see experiments/measurements/.
 *
 *     <PopoverTrigger>
 *       <Button>گزینه‌ها</Button>
 *       <Popover placement="bottom start">…</Popover>
 *     </PopoverTrigger>
 *
 * ── PLACEMENT IS A CLOSED, LOGICAL UNION (unchanged) ────────────────────────
 *
 * `LumoPlacement` still subtracts the physical spellings with the same
 * template-literal `Exclude`, because the public API may not change and because
 * seven sibling components consume this type. What it subtracts FROM is no
 * longer React Aria's `Placement` — the union is declared in `@lumo-ui/core`
 * now, unchanged member for member, so that a consumer copying this file does
 * not have to install a library it does not run. What changed underneath is
 * bigger: Base UI does not take a single `placement` string. It
 * takes `side` and `align` on `Popover.Positioner`, and its `side` union is
 * ALREADY logical — `'inline-start' | 'inline-end'` are first-class values
 * alongside the four physical ones. So the translation below is lossless in the
 * direction that matters, and Lumo's `Exclude` is doing less work than it did:
 * under RAC the logical spelling was one of two equally-valid options and the
 * wrong one mirrored silently; under Base UI it is a genuine union member.
 *
 * ── data-placement IS NOW data-side, AND THE VARIANTS NOW KNOW THAT ─────────
 *
 * The first pass left `popoverVariants` addressed to React Aria's vocabulary as
 * an experimental control, so the enter/exit transition was dead: the classes
 * were in the string, nothing matched them, and the popover appeared instantly.
 * That is not broken styling — it is styling addressed to an engine that is no
 * longer there, which is the distinction this round exists to establish.
 *
 * The selectors are now Base UI's; the block on `popoverVariants` names each
 * one and flags the one that is a SPLIT rather than a rename.
 *
 * The seven siblings that style against this exported cva were the cost this
 * edit made visible while they were still on React Aria: they received a class
 * string addressing an engine they were not on. They have since moved, so the
 * gap is closed — but the number in
 * `experiments/measurements/state-vocabulary.json` was counted while it was
 * open, and is a floor rather than a ceiling for that reason.
 *
 * ── NO "Dismiss" BUTTONS AT ALL ─────────────────────────────────────────────
 *
 * React Aria bracketed every open popover with two visually-hidden
 * `DismissButton`s labelled from `@react-aria/overlays`'s `dismiss` string, and
 * neither was prop-reachable — the pinned `["Dismiss", "Dismiss"]` in
 * overlays.test.tsx and context-menu.test.tsx. Base UI renders no such element:
 * outside-press dismissal is handled by a listener rather than by a focusable
 * sentinel. Measured on an open Base UI popover: zero English announced
 * attributes. This is the one place the engine swap is a straight win.
 */
export type LumoPlacement = Exclude<
  Placement,
  `${string}left${string}` | `${string}right${string}`
>;

/**
 * The shared overlay surface. Its class string is UNCHANGED from the React Aria
 * build except for the state vocabulary above — deliberately, because the seven
 * components that import it (menu, select, combobox, hover-card,
 * navigation-menu, date-picker, date-range-picker) are all on Base UI now and
 * all take their panel chrome from here. One surface, seven panels.
 */
export const popoverVariants = cva(
  "z-50 rounded-md border border-border bg-surface text-fg shadow-lg outline-none " +
    "transition duration-150 ease-out " +
    // ── THE TRANSITION AND PLACEMENT VOCABULARY ────────────────────────────
    //
    //     data-entering  → data-starting-style
    //     data-exiting   → data-ending-style
    //     data-placement → data-side, and it is NOT a rename
    //
    // The first two are clean renames. The third is not, and the difference is
    // worth pausing on because it is easy to script the wrong way. React Aria's
    // `data-placement` is a single value that carries BOTH axes — side and
    // alignment together. Base UI splits it in two: `data-side` for the edge,
    // `data-align` for the alignment along it, and each is a separate
    // attribute. Measured in `probe2.state-vocabulary.json → popover.parts`,
    // where the popup carries side and align as two attributes.
    //
    // The two rules below happen to need only the side half, so the split costs
    // nothing HERE. A rule that had keyed on an aligned placement — a bottom
    // edge aligned to the start, say — would have had to become two conditions,
    // and a rename script would have silently produced a selector that matches
    // nothing. Counted as a rename in the measurements because that is what it
    // was in this file, with the caveat recorded alongside it.
    //
    // Both offsets are on the BLOCK axis, which has no logical counterpart to
    // reach for and does not mirror. The inline axis would; there is no rule on
    // it here, deliberately.
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "data-[side=bottom]:data-starting-style:-translate-y-1 " +
    "data-[side=top]:data-starting-style:translate-y-1 " +
    "motion-reduce:transition-none",
  {
    variants: {
      padded: {
        true: "p-4",
        false: "p-0",
      },
    },
    defaultVariants: { padded: true },
  },
);

/**
 * `LumoPlacement` → Base UI's `side` + `align`.
 *
 * RAC packs both axes into one space-separated string; Base UI splits them.
 * `'bottom start'` is side `bottom`, align `start`. `'start top'` is side
 * `inline-start`, align `start` — because on an inline side the cross axis is
 * the BLOCK axis, where RAC spells the ends `top`/`bottom` and Base UI spells
 * them `start`/`end`. That last row is the only lossy-looking one and it is not
 * lossy: the block axis does not mirror, so `top` and `start` name the same edge
 * in every horizontal writing mode.
 *
 * A full `Record<LumoPlacement, …>` rather than a `split(" ")` parser, so adding
 * a value to the union is a compile error listing the work — the same reason
 * site copy is a `Record<Locale, …>` and not a ternary. `menu.tsx` declares an
 * identical table; this is the canonical one and that duplication is recorded.
 */
export interface SideAlign {
  side: "top" | "bottom" | "inline-start" | "inline-end";
  align: "start" | "center" | "end";
}

export const PLACEMENT: Record<LumoPlacement, SideAlign> = {
  bottom: { side: "bottom", align: "center" },
  "bottom start": { side: "bottom", align: "start" },
  "bottom end": { side: "bottom", align: "end" },
  top: { side: "top", align: "center" },
  "top start": { side: "top", align: "start" },
  "top end": { side: "top", align: "end" },
  start: { side: "inline-start", align: "center" },
  "start top": { side: "inline-start", align: "start" },
  "start bottom": { side: "inline-start", align: "end" },
  end: { side: "inline-end", align: "center" },
  "end top": { side: "inline-end", align: "start" },
  "end bottom": { side: "inline-end", align: "end" },
};

/**
 * `PLACEMENT` with React Aria's default applied. The table is the source of
 * truth; this is the call site's convenience, so no component has to restate
 * that RAC's default placement is `'bottom'`.
 */
export function placementToSideAlign(placement: LumoPlacement | undefined): SideAlign {
  return PLACEMENT[placement ?? "bottom"];
}

/**
 * The trigger's id, so the popup can be named by it.
 *
 * ── A MEASURED NAMING LOSS, CLOSED HERE ────────────────────────────────────
 *
 * Base UI's `Popover.Popup` is `role="dialog"` and carries NO accessible name:
 * measured attribute set `[data-open, data-side, data-align, id, role,
 * tabindex, data-base-ui-focusable, data-lumo, class]` — no `aria-label`, no
 * `aria-labelledby` (`probe.api-shape-detail.json → popover.base.dialog`). An
 * unnamed dialog is announced as bare "dialog", which is the same class of
 * defect as an unnamed checkbox and is invisible to every string count because
 * it leaks no English.
 *
 * React Aria did not leave it unnamed: its Popover pointed `aria-labelledby` at
 * the TRIGGER, so the name was the trigger's visible text — measured resolving
 * to «بیشتر» in the same probe. That is the behaviour reproduced here, and it
 * is reproducible because Base UI forwards an `aria-labelledby` prop on the
 * Popup verbatim (`probe.api-shape-fixability.json → Q3`).
 *
 * The reference cannot dangle: the trigger is in the document whenever the
 * popup is, and unlike the tooltip's popup it is present in the first byte too.
 * A caller who names the popup explicitly wins — see `Popover`.
 */
const PopoverNameContext = React.createContext<string | undefined>(undefined);

/**
 * Splits `[trigger, ...overlay]` and wires the first child as the trigger.
 *
 * MEASURED STRUCTURAL DIFFERENCE, and the reason this helper exists at all.
 * React Aria's `DialogTrigger` takes exactly `[trigger, overlay]` and wires the
 * trigger IMPLICITLY: it publishes a `ButtonContext` carrying `onPress`,
 * `aria-expanded` and `aria-haspopup`, which any RAC `Button` descendant picks
 * up without being told. Base UI has no such context. Its trigger must be a
 * literal `<Popover.Trigger>` element, or a `render={<YourButton/>}`.
 *
 * Lumo's public API is `<PopoverTrigger><Button/><Popover/></PopoverTrigger>`
 * and may not change, so the first child is lifted into `render`. The boundary
 * that cost was measured while the trigger was still an RAC `Button` — Base UI
 * merges `onClick` and RAC drove from `onPress` — and it is closed: `button.tsx`
 * is Base UI's `Button`, so the merged `onClick` is the handler it already uses.
 * Recorded in experiments/measurements/rebuild-overlays.json, and left here
 * because the SHAPE of the difference is what makes this helper necessary at
 * all, whatever the trigger turns out to be.
 */
function splitTrigger(children: LumoNode): {
  trigger: React.ReactNode;
  rest: React.ReactNode[];
} {
  const items = React.Children.toArray(children as React.ReactNode);
  const [first, ...rest] = items;
  return { trigger: first, rest };
}

/**
 * React Aria had no `PopoverTrigger`; `DialogTrigger` owned popover state too.
 * Base UI DOES have `Popover.Root`, so this name is no longer a re-export of
 * something else — the mapping the old header apologised for is gone.
 *
 * It renders no DOM and therefore takes no `className`.
 */
export interface PopoverTriggerProps extends OverlayTriggerProps {
  /** The trigger control, then the `<Popover>`. In that order. */
  children: LumoNode;
  /**
   * Prevents Escape from closing the popover.
   *
   * ── IT MOVED HERE, AND THAT IS THE WHOLE FIX ──────────────────────────────
   *
   * This prop was declared on `<Popover>` — the surface — where it was accepted
   * and INERT. `time-field.tsx` sets the precedent for what to do about that: it
   * deleted `minValue`/`maxValue` rather than accept and ignore them, because a
   * prop that silently does nothing is worse than an absent one — absent is a
   * compile error at the call site, silent is a bug report six months later.
   *
   * But the reason it was inert is not that Base UI lacks the capability. It is
   * that dismissal lives on `Popover.Root`, which THIS component renders and the
   * surface does not, and a child cannot reach up into its parent's props.
   * Measured on the installed 1.7.0: `Popover.Root`'s `onOpenChange` receives an
   * event-details object carrying `reason` and `cancel()`, and popover's Escape
   * path produces exactly one reason — `useDismiss.js` attaches a plain
   * `keydown` listener, checks `event.key !== 'Escape'`, and creates
   * `REASONS.escapeKey`. `close-watcher` is not on this path at all: the only
   * emitter of it in the whole dist is `DrawerRoot.js`. So the cancel below is
   * exact rather than approximate — it intercepts Escape and nothing else.
   *
   * So the prop is not removed, it is RELOCATED to the part that owns the
   * state. Passing it to `<Popover>` is now a compile error, which is the
   * outcome the precedent asks for, and the capability exists for the case that
   * wanted it: a popover holding a half-filled form, where Escape discards
   * typing the reader cannot get back.
   */
  isKeyboardDismissDisabled?: boolean | undefined;
}

export function PopoverTrigger({
  children,
  isOpen,
  defaultOpen,
  onOpenChange,
  isKeyboardDismissDisabled,
}: PopoverTriggerProps) {
  const { trigger, rest } = splitTrigger(children);
  const triggerId = React.useId();
  /*
   * One handler rather than two paths, because the two features overlap: a
   * caller can set both, and a cancelled Escape must ALSO not reach the
   * caller's `onOpenChange` — it did not happen. `attr()` still decides whether
   * the prop is emitted at all, so a popover that sets neither passes nothing
   * and Base UI's own default handling is untouched.
   */
  const handleOpenChange =
    onOpenChange === undefined && isKeyboardDismissDisabled !== true
      ? undefined
      : (open: boolean, details: BasePopover.Root.ChangeEventDetails) => {
          if (isKeyboardDismissDisabled === true && !open && details.reason === "escape-key") {
            details.cancel();
            return;
          }
          onOpenChange?.(open);
        };
  return (
    // RAC spells the controlled prop `isOpen`; Base UI spells it `open`. The
    // public name stays RAC's because the API may not change.
    <BasePopover.Root
      {...attr("open", isOpen)}
      {...attr("defaultOpen", defaultOpen)}
      {...attr("onOpenChange", handleOpenChange)}
    >
      {React.isValidElement(trigger) ? (
        <BasePopover.Trigger
          id={triggerId}
          render={trigger as React.ReactElement<Record<string, unknown>>}
        />
      ) : (
        trigger
      )}
      <PopoverNameContext.Provider value={triggerId}>{rest}</PopoverNameContext.Provider>
    </BasePopover.Root>
  );
}

/**
 * The popover surface's own props, minus its children, class and `placement` —
 * the last is redeclared below as the logical-only `LumoPlacement`.
 */
interface PopoverPropsBase
  /*
   * `isOpen` goes with `placement`, and `OverlayTriggerProps` is gone from this
   * list entirely — see `OverlayOpenStateKeys` in `props.ts`. Open state under
   * Base UI belongs to `Popover.Root`, which `PopoverTrigger` renders and this
   * SURFACE is rendered inside; all three props were destructured into `_`
   * discards below and did nothing. `PositionProps` carries a fourth spelling
   * of the same idea (`isOpen`, "whether the overlay is currently open") and it
   * was equally inert, so it is subtracted here rather than left as the one
   * survivor of a removed set.
   */
  extends Omit<PositionProps, "placement" | "isOpen">,
    FocusWithinEvents,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /**
   * @forwarded `...rest` → `Popover.Popup` → the `role="dialog"` element.
   *
   * Verified by rendering rather than assumed, which is the whole point of the
   * tag: `<Popover aria-describedby="d1" aria-details="d2">` opened under
   * Testing Library produces
   * `<div role="dialog" aria-labelledby="_r_0_" aria-describedby="d1" …
   * aria-details="d2">`. The two neighbours above are read out of `rest` by
   * name in the component (the trigger-name fallback checks them), so only these
   * two needed a claim — and the four props below this pair, declared in the
   * same style and equally unread, turned out to reach the same `<div>` as
   * INVALID attributes. Same spread, opposite outcome: that is why a spread is
   * not evidence.
   */
  "aria-describedby"?: string;
  /** @forwarded `...rest` → `Popover.Popup`. See `aria-describedby`. */
  "aria-details"?: string;
  /** A ref to the element the popover is positioned against. */
  triggerRef?: React.RefObject<Element | null>;
  /** A ref to the arrow element, if there is one. */
  arrowRef?: React.RefObject<Element | null>;
  /** A ref to the scrollable region the popover repositions inside. */
  scrollRef?: React.RefObject<Element | null>;
  /** The element the popover is constrained to. */
  boundaryElement?: Element;
  /** Whether the popover keeps repositioning after it opens. */
  shouldUpdatePosition?: boolean;
  /** The largest height the popover may take. */
  maxHeight?: number;
  /** Offset applied to the arrow's own boundary. */
  arrowBoundaryOffset?: number;
  /** Overrides the rect the popover positions against. */
  getTargetRect?: (target: Element) => DOMRect | null | undefined;
  /** Whether the popover leaves the rest of the page interactive. */
  isNonModal?: boolean;
  /** Decides, per element, whether an outside interaction should close it. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** The slot name of the trigger this popover belongs to. */
  trigger?: string;
  /** Whether the popover is currently performing an entry animation. */
  isEntering?: boolean;
  /** Whether the popover is currently performing an exit animation. */
  isExiting?: boolean;
  /** Whether the open/close animation is skipped. */
  shouldSkipAnimation?: boolean;
  /** The container the popover portals into. */
  UNSTABLE_portalContainer?: Element;
}

/**
 * The popover's supporting prose, and — the point of the part — the string a
 * screen reader reads AFTER the name when focus enters.
 *
 * ── THE SAME GAP `DialogDescription` CLOSED, ONE COMPONENT OVER ────────────
 *
 * `Popover.Popup` is `role="dialog"`, and the header above records the work
 * already done on its NAME: Base UI leaves the popup unnamed, so this file
 * points `aria-labelledby` at the trigger, reproducing what React Aria did.
 * Nothing published `aria-describedby`. So a popover announced its trigger's
 * text and then went silent, and every example in the workspace hand-rolled the
 * body as `<p className="text-sm text-fg-muted">` — which looks identical, sits
 * in the right place, and is announced to nobody. That is the shape that
 * propagates: consumers copy what they can see.
 *
 * `Popover.Description` writes its id into the same root store the popup reads
 * (`descriptionElementId` → `aria-describedby` in `PopoverPopup.js`), so the
 * wiring costs one part and no prop. It does not collide with the trigger-name
 * fallback: that fallback is on `aria-labelledby`, a different attribute, and
 * the two are read in sequence rather than in competition.
 *
 * ── WHY THERE IS NO `PopoverTitle`, WHICH SHADCN HAS AND BASE UI SHIPS ─────
 *
 * Declined, and not for cost — `Popover.Title` is right there in the parts list.
 * A popover's name is ALREADY solved here and solved better than a part can
 * solve it: `aria-labelledby` points at the trigger, so a popover cannot be
 * unnamed, because a trigger cannot be. `IconButton.label` is required, so even
 * the ellipsis case has a real name. An optional `<PopoverTitle>` would replace
 * a guarantee with a convention, and the failure would be silent — the popup
 * still has a name, just the wrong one, in the one composition (icon trigger,
 * headed panel) where the two differ. A visible heading is ordinary markup and
 * needs no part; a NAME is the thing worth guaranteeing, and it already is.
 *
 * ── WHY IT TAKES `render` ─────────────────────────────────────────────────
 *
 * `DialogDescription`'s reason verbatim: Base UI renders a `<p>`, and block
 * content inside a `<p>` is invalid HTML that browsers silently repair by
 * splitting the paragraph. `<PopoverDescription render={<div />}>` is Base UI's
 * own escape hatch, passed through rather than re-invented.
 *
 * Not required, for `DialogDescription`'s reason too: the text is visible, so
 * its absence is a hole a reviewer can see, and requiring it would push callers
 * toward filler written for an attribute's sake.
 */
export interface PopoverDescriptionProps
  extends Omit<React.ComponentProps<"p">, "children" | "className"> {
  /** Swap the rendered element, e.g. `render={<div />}` for block content. */
  render?: React.ReactElement<Record<string, unknown>> | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function PopoverDescription({
  className,
  render,
  ...rest
}: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      className={cn("text-sm text-fg-muted", className)}
      {...attr("render", render)}
      {...rest}
    />
  );
}

export interface PopoverProps
  extends PopoverPropsBase,
    VariantProps<typeof popoverVariants> {
  /**
   * Logical only — see `LumoPlacement`. Defaults to `'bottom'`.
   *
   * Deliberately NOT `| undefined`: RAC declares `placement?: Placement`, and
   * under `exactOptionalPropertyTypes` widening ours to include `undefined`
   * makes the whole props object unassignable on the spread below. The prop is
   * omittable; it is not settable to `undefined`.
   */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

export function Popover({
  className,
  padded,
  placement,
  // — translated onto Popover.Positioner —
  offset,
  crossOffset,
  // ── ACCEPTED BY THE API, UNREACHABLE IN BASE UI ────────────────────────────
  // Destructured so they cannot reach the DOM as unknown attributes, and NOT
  // emulated. Each is a recorded gap in rebuild-overlays.json.
  //
  //   isNonModal / shouldCloseOnInteractOutside
  //     dismissal lives on Popover.Root under Base UI, not on the surface.
  //     `isKeyboardDismissDisabled` was in this list and is GONE from the type:
  //     it moved to `PopoverTrigger`, which renders the Root, and is implemented
  //     there. See its docblock. Passing it here is now a compile error, which
  //     is the point — `time-field.tsx` sets the precedent for preferring that
  //     over accept-and-ignore.
  //   isEntering / isExiting / shouldSkipAnimation
  //     RAC animation flags; Base UI drives transitions off data-starting-style
  //   maxHeight / scrollRef
  //     RAC clamped the popover to the viewport itself; Base UI leaves it to CSS
  //   arrowRef / getTargetRect
  //     ADDED 12 Aug 2026 by the inert-prop gate, and they are the argument for
  //     having one. This block's comment said these props "cannot reach the
  //     DOM", and it was true of the eleven names in it and false of these two,
  //     which were declared six lines apart from `triggerRef` and `scrollRef`
  //     and were never destructured — so they rode `...rest` onto
  //     `Popover.Popup`, which forwards what it does not recognise to a real
  //     `<div>`. `AUDIT.md` §3.1 predicted exactly this: the hand-maintained
  //     banner listed five of eleven, because a list in a comment does not move
  //     when the code does. Base UI positions the arrow with a `Popover.Arrow`
  //     PART and the target rect with `Popover.Positioner`'s own anchor, so
  //     neither has a prop to translate to here.
  arrowRef: _arrowRef,
  getTargetRect: _getTargetRect,
  isNonModal: _isNonModal,
  shouldFlip: _shouldFlip,
  triggerRef: _triggerRef,
  isEntering: _isEntering,
  isExiting: _isExiting,
  shouldSkipAnimation: _shouldSkipAnimation,
  containerPadding: _containerPadding,
  boundaryElement: _boundaryElement,
  scrollRef: _scrollRef,
  maxHeight: _maxHeight,
  shouldUpdatePosition: _shouldUpdatePosition,
  arrowBoundaryOffset: _arrowBoundaryOffset,
  shouldCloseOnInteractOutside: _shouldCloseOnInteractOutside,
  UNSTABLE_portalContainer: _portalContainer,
  trigger: _trigger,
  // `render`, `slot` and `style` are RAC-shaped and collide with Base UI's own
  // props of the same name — the spread below does not type-check without them.
  slot: _slot,
  style: _style,
  ...rest
}: PopoverProps) {
  const { side, align } = PLACEMENT[placement ?? "bottom"];
  // Name the dialog by its trigger, as React Aria did — unless the caller named
  // it, in which case relabelling would be the one way this can make things
  // worse. See `PopoverNameContext`.
  const triggerId = React.useContext(PopoverNameContext);
  const named =
    (rest as Record<string, unknown>)["aria-label"] !== undefined ||
    (rest as Record<string, unknown>)["aria-labelledby"] !== undefined;
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        {...attr("sideOffset", offset)}
        {...attr("alignOffset", crossOffset)}
        className="isolate z-50"
      >
        <BasePopover.Popup
          data-lumo=""
          {...attr("aria-labelledby", named ? undefined : triggerId)}
          className={cn(popoverVariants({ padded }), className)}
          {...rest}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
