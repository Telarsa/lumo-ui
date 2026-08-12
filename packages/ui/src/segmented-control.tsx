"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { Children, createContext, isValidElement, useContext } from "react";
import { cn, type Key, type LumoNode } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";

/**
 * Two to four mutually exclusive options, shown all at once. **BASE UI ENGINE.**
 *
 *     <SegmentedControl label="نمای نتایج" defaultSelectedKeys={["list"]}>
 *       <SegmentedControlItem id="list">فهرست</SegmentedControlItem>
 *       <SegmentedControlItem id="grid">شبکه</SegmentedControlItem>
 *     </SegmentedControl>
 *
 * ═══ THE ENGINE CHANGED AND SO DID THE PRIMITIVE UNDERNEATH ═════════════════
 *
 * React Aria built this on `ToggleButtonGroup`, which emits `role="radiogroup"`
 * when `selectionMode="single"`. The obvious Base UI port is
 * `@base-ui/react/toggle-group` — and it is the WRONG one. Measured, bare
 * libraries, no Lumo code:
 *
 *     Base UI ToggleGroup   <div role="group"><button aria-pressed="true">…
 *     Base UI RadioGroup    <div role="radiogroup"><span role="radio" aria-checked="true">…
 *     React Aria (before)   <div role="radiogroup"><button role="radio" aria-checked="true">…
 *
 * `ToggleGroup.mjs:74` hardcodes `role: 'group'` with no prop to change it, and
 * its children carry `aria-pressed`. That is the exact defect this component's
 * previous header called "the entire accessibility argument for the component":
 * N `aria-pressed` buttons announce as N independent switches, with nothing
 * telling a listener that choosing one un-chooses the others.
 *
 * So the port goes to `RadioGroup` + `Radio` instead, where Base UI emits
 * `role="radiogroup"` / `role="radio"` / `aria-checked` natively. The announced
 * semantics — the thing the component exists for — are BYTE-IDENTICAL to React
 * Aria's. What changed is the ELEMENT: RAC rendered `<button role="radio">`,
 * Base UI renders `<span role="radio">` with an `aria-hidden` proxy
 * `<input type="radio">` beside it. The proxy is the reason `name` now works for
 * real form submission, which React Aria's toggle group never did.
 *
 * `toggle-group.tsx` stayed on `ToggleGroup` and records the same measurement
 * from the other side. Two components that shared one React Aria primitive now
 * sit on two Base UI ones; that split is a finding, not a refactor.
 *
 * ── WHY THIS STILL EXISTS ALONGSIDE `toggle-group.tsx` ─────────────────────
 *
 * `ToggleButtonGroup` is the general case: any number of options, single OR
 * multiple selection, any orientation, drawn as a bordered strip of buttons.
 * This is the narrow one — a small set of alternatives for the SAME thing,
 * exactly one of which is always true — and the two differences are worth a
 * separate component rather than a variant flag:
 *
 *  1. `selectionMode` is fixed to `"single"` and `disallowEmptySelection`
 *     defaults to `true`. "None of these" is not a state a view switcher has.
 *     On this engine that is now FREE rather than a prop: `RadioGroup` has no
 *     way to unselect by pressing the selected option, so an empty group is
 *     unreachable by construction instead of by a flag. See the prop's doc.
 *  2. A different visual model: a sunken track with the selected option raised
 *     out of it, rather than a strip of outlined buttons.
 *
 * ── DIRECTION IS NO LONGER FREE (same gap tabs.tsx records) ─────────────────
 *
 * React Aria resolved the arrow keys against the document direction via
 * `useLocale()`. Base UI's `RadioGroup` wraps a `CompositeRoot`, which resolves
 * them against `useDirection()` — and that returns `'ltr'` when no
 * `<DirectionProvider>` is mounted (`internals/direction-context/
 * DirectionContext.mjs:7`). `LumoProvider` does not mount one today. So on a
 * Persian page ArrowLeft moves to the PREVIOUS option rather than the next one
 * unless the application supplies `<DirectionProvider direction="rtl">`.
 * Nothing renders wrong; the keys are simply backwards.
 *
 * What RAC did NOT do, and Base UI does not either, is name the group — which is
 * why `label` is required: an unnamed `role="radiogroup"` is announced as bare
 * "radio group", and a toolbar with two of them becomes unnavigable by voice.
 */

export const segmentedControlVariants = cva(
  // The rounding lives on the TRACK, not on `first:`/`last:` children. `first:`
  // is the item at the inline START, which is the RIGHT one in Persian — and the
  // usual `first:rounded-l-md last:rounded-r-md` rounds the wrong two corners
  // there. One uniform radius on the container, plus the items' own smaller
  // radius, is correct in both directions with no rule to get wrong when someone
  // reorders the options. `toggle-group.tsx` reaches the same conclusion from
  // the same starting point.
  "inline-flex w-fit items-center gap-1 rounded-md border border-border " +
    "bg-surface-sunken p-1 " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

/**
 * ── THE SELECTED STATE IS NOT SPELLED `data-selected` ANY MORE ─────────────
 *
 * Measured on the rendered radio group (`state-vocabulary.json` calls this row
 * "resubject + rename" for checkbox and switch; a radio is the same shape):
 *
 *     data-hovered  → NONE. CSS `:hover` (grep of the dist: 0 files).
 *     data-selected → data-checked, with a matching data-unchecked. It lands on
 *                     the `role="radio"` element itself, which is also the
 *                     element this class string sits on — so unlike checkbox
 *                     and switch this is a rename with no resubject.
 *     data-pressed  → NONE at all on a radio. It was only ever the transient
 *                     pointer-down state here and the rule that used it was
 *                     already the wrong one to style.
 *     data-disabled → data-disabled. No edit.
 *
 * `data-composite-item-active` travels separately as the roving-focus cursor —
 * the same trap `tabs.tsx` documents. Styling it instead would raise whichever
 * option the arrow keys last passed over rather than the chosen one.
 */
export const segmentedControlItemVariants = cva(
  "inline-flex flex-1 cursor-pointer select-none items-center justify-center gap-2 " +
    "rounded-sm font-medium whitespace-nowrap text-fg-muted outline-none " +
    "transition-colors " +
    "hover:text-fg " +
    "data-checked:bg-surface data-checked:text-fg data-checked:shadow-sm " +
    /*
     * ── A PRESS HERE CAN PERMANENTLY PRODUCE NOTHING, BY CONSTRUCTION ────────
     *
     * `toggle.variants.ts` declines an `active:` rule because a toggle's press
     * changes its state and therefore answers itself. A radio group is the case
     * that breaks that reasoning outright: pressing the ALREADY-CHECKED option
     * re-checks it, and Base UI's `RadioGroup` has no path to any other outcome
     * — which is the same fact `disallowEmptySelection`'s doc turns into a
     * feature. So one of the two-to-four options in every segmented control is
     * permanently unable to respond to being pressed.
     *
     * On a pointer, hover already said something. On TOUCH there is no hover, so
     * tapping the selected option is byte-for-byte the `button` defect: the only
     * event the device can produce, spent on nothing. That is why this rule is
     * an adoption of the FINDING rather than of the shape.
     *
     * `brightness-95` over whichever fill is showing, so one rule covers checked
     * and unchecked and no token is invented. No `translate-y-px`: the checked
     * option is already raised out of the track with `shadow-sm`, and nudging it
     * on the block axis fights the elevation the component's whole visual model
     * rests on.
     */
    "active:brightness-95 " +
    // WCAG 2.4.7. Base UI inverts React Aria's arrangement: the `role="radio"`
    // element is itself focusable (the `<input>` beside it is tabindex="-1" and
    // aria-hidden), so the ring goes here directly and the `group-` hop
    // `FOCUS_RING` was built for disappears. `:focus-visible` and not
    // `data-focused` — the latter is unfiltered plain focus and would ring on a
    // mouse click, which is the defect `:focus-visible` was standardised to fix.
    "focus-visible:[outline:var(--lumo-sys-focus-width)_solid_var(--lumo-sys-focus)] " +
    "focus-visible:[outline-offset:var(--lumo-sys-focus-offset)] " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        sm: "h-7 px-3 text-xs",
        md: "h-8 px-4 text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SegmentedControlVariantProps = VariantProps<
  typeof segmentedControlItemVariants
>;

export interface SegmentedControlProps {
  /**
   * Announced name of the group, e.g. «نمای نتایج».
   *
   * REQUIRED — see the file header. Neither engine names the `role="radiogroup"`.
   */
  label: string;
  /** The selected key, as a one-element iterable. */
  selectedKeys?: Iterable<Key> | undefined;
  /** The initially selected key, as a one-element iterable. */
  defaultSelectedKeys?: Iterable<Key> | undefined;
  onSelectionChange?: ((keys: Set<Key>) => void) | undefined;
  /**
   * KEPT FOR API STABILITY, AND IT IS NOW A NO-OP THAT CANNOT LIE.
   *
   * Base UI's `RadioGroup` has no path to an empty selection at all — pressing
   * the checked radio re-checks it. So `true` (the default) is what the
   * component does, and `false` cannot be honoured: there is no un-check to
   * allow. Typed `true | undefined` rather than `boolean` so asking for the
   * behaviour Base UI cannot provide is a COMPILE ERROR instead of a prop that
   * is accepted and silently ignored. Recorded as an API change.
   */
  disallowEmptySelection?: true | undefined;
  isDisabled?: boolean | undefined;
  /** Form field name for the proxy `<input type="radio">` Base UI renders. */
  name?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/** The first key of an iterable, or undefined. A radio group holds exactly one. */
function firstKey(keys: Iterable<Key> | undefined): string | undefined {
  if (keys === undefined) return undefined;
  for (const key of keys) return String(key);
  return undefined;
}

/**
 * The key that holds the tab stop until hydration.
 *
 * See `useCompositeTabStop` in `@lumo-ui/base-ui-ssr`: a server-rendered Base UI
 * `RadioGroup` carries `tabindex="-1"` on every radio and `tabindex="0"` on
 * none, so the Tab key cannot reach the control at all before JavaScript loads.
 * The CHECKED option is the right holder rather than the first one — that is
 * where a roving tabindex belongs in a radio group, and it is where Base UI
 * itself puts it once it can.
 */
const SegmentedTabStopContext = createContext<string | undefined>(undefined);

export function SegmentedControl({
  label,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  isDisabled,
  name,
  className,
  children,
}: SegmentedControlProps) {
  const value = firstKey(selectedKeys);
  const defaultValue = firstKey(defaultSelectedKeys);
  // The checked option if there is one, otherwise the first — a group with no
  // selection still has to be reachable.
  const firstChild = Children.toArray(children).find(isValidElement) as
    | { props?: { id?: unknown } }
    | undefined;
  const tabStopKey =
    value ??
    defaultValue ??
    (firstChild?.props?.id === undefined ? undefined : String(firstChild.props.id));

  return (
    <BaseRadioGroup
      data-lumo=""
      aria-label={label}
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(name === undefined ? {} : { name })}
      // The Set is rebuilt here rather than pushed onto the consumer: the public
      // API promised a collection-shaped callback and a radio group has exactly
      // one member, so the conversion is total and lossless in this direction.
      onValueChange={(next: unknown) => {
        onSelectionChange?.(new Set(next === null || next === undefined ? [] : [String(next)]));
      }}
      className={cn(segmentedControlVariants(), className)}
    >
      <SegmentedTabStopContext.Provider value={tabStopKey}>
        {children}
      </SegmentedTabStopContext.Provider>
    </BaseRadioGroup>
  );
}

export interface SegmentedControlItemProps extends SegmentedControlVariantProps {
  /** The option's key. Maps to Base UI's `value`. REQUIRED — a radio needs one. */
  id: Key;
  isDisabled?: boolean | undefined;
  /** Announced name, when the option draws an icon rather than text. */
  "aria-label"?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function SegmentedControlItem({
  id,
  isDisabled,
  "aria-label": ariaLabel,
  size,
  className,
  children,
}: SegmentedControlItemProps) {
  const tabStop = useCompositeTabStop(useContext(SegmentedTabStopContext) === String(id));
  return (
    <BaseRadio.Root
      data-lumo=""
      value={String(id)}
      {...tabStop}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel })}
      className={cn(segmentedControlItemVariants({ size }), className)}
    >
      {children}
    </BaseRadio.Root>
  );
}
