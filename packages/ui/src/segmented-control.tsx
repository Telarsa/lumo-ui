"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { Children, createContext, Fragment, isValidElement, useContext } from "react";
import { cn, type Key, type LumoNode } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";

/**
 * Two to four mutually exclusive options, shown all at once. On Base UI's
 * `RadioGroup` + `Radio`, NOT `ToggleGroup`: the latter hardcodes
 * `role="group"` with `aria-pressed` children, which announce as N independent
 * switches. `RadioGroup` also makes an empty selection unreachable by
 * construction and gives `name` real form submission via its proxy `<input>`.
 * Arrow keys resolve against Base UI's `useDirection()`, which needs a
 * `<DirectionProvider>` under RTL. `label` is required — nothing names the group.
 */

export const segmentedControlVariants = cva(
  // The rounding lives on the TRACK, not on `first:`/`last:` children, which
  // would round the wrong corners under RTL.
  "inline-flex w-fit items-center gap-1 rounded-md border border-border " +
    "bg-surface-sunken p-1 " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

/**
 * One option. Styled on `data-checked` (Base UI's name; it lands on the
 * `role="radio"` element itself), never on `data-composite-item-active`, which
 * is the roving-focus cursor and would raise whichever option the arrows last passed.
 */
export const segmentedControlItemVariants = cva(
  "inline-flex flex-1 cursor-pointer select-none items-center justify-center gap-2 " +
    "rounded-sm font-medium whitespace-nowrap text-fg-muted outline-none " +
    "transition-colors " +
    "hover:text-fg " +
    "data-checked:bg-surface data-checked:text-fg data-checked:shadow-raised " +
    // A press on the already-checked option changes nothing, and on touch there
    // is no hover, so the nudge is the only response the device can see.
    "active:translate-y-px " +
    // NO ring class: the `role="radio"` element carries `data-lumo`, so theme.css rings it.
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      /** The size step on the shared control scale. */
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
  /** Announced name of the group, e.g. «نمای نتایج». REQUIRED — nothing names the `role="radiogroup"`. */
  label: string;
  /** The selected key, as a one-element iterable. */
  selectedKeys?: Iterable<Key> | undefined;
  /** The initially selected key, as a one-element iterable. */
  defaultSelectedKeys?: Iterable<Key> | undefined;
  /** Called with the newly selected key. */
  onSelectionChange?: ((keys: Set<Key>) => void) | undefined;
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

function firstChildKey(children: LumoNode): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { id?: Key; children?: LumoNode };
    if (child.type === Fragment) {
      const nested = firstChildKey(props.children);
      if (nested !== undefined) return nested;
    } else if (props.id !== undefined) {
      return String(props.id);
    }
  }
  return undefined;
}

/**
 * The key that holds the tab stop until hydration (see `useCompositeTabStop`):
 * Base UI serves every radio at `tabindex="-1"`. The CHECKED option holds it.
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
  // The checked option if there is one, otherwise the first.
  const tabStopKey = value ?? defaultValue ?? firstChildKey(children);

  return (
    <BaseRadioGroup
      data-lumo=""
      aria-label={label}
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(name === undefined ? {} : { name })}
      // The public API promised a Set-shaped callback; a radio group has exactly one member.
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
