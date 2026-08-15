"use client";

import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { Children, createContext, Fragment, isValidElement, useContext } from "react";
import { cn, type Key, type LumoNode } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";
import { toggleButtonGroupVariants, toggleButtonVariants } from "./toggle-group.variants.ts";

/**
 * A segmented control, on Base UI's `ToggleGroup` + `Toggle` 1.7.0.
 *
 *     <ToggleButtonGroup selectionMode="single" defaultSelectedKeys={["list"]}>
 *       <ToggleButton id="list">فهرست</ToggleButton>
 *       <ToggleButton id="grid">شبکه</ToggleButton>
 *     </ToggleButtonGroup>
 *
 * Base UI emits `role="group"` + `aria-pressed` in single AND multiple mode (RAC gave
 * `radiogroup`); passing `role="radiogroup"` would be invalid, so the group keeps its
 * toggle semantics and `segmented-control.tsx` moved onto `RadioGroup` instead.
 * `disallowEmptySelection` is honoured via `eventDetails.cancel()` (a compensating prop,
 * not a state mirror). Arrow keys resolve against Base UI's `DirectionContext`, so a
 * Persian page needs a `<DirectionProvider>`. Classes live in `toggle-group.variants.ts`
 * so a server component gets a callable and the RTL codemod can see the logical edges.
 */
export interface ToggleButtonGroupProps {
  /** `"single"` keeps at most one item pressed; `"multiple"` any number. Maps onto Base UI's `multiple`; does NOT change the role. */
  selectionMode?: "single" | "multiple" | undefined;
  /** The pressed keys (controlled). */
  selectedKeys?: Iterable<Key> | undefined;
  /** The initially pressed keys (uncontrolled). */
  defaultSelectedKeys?: Iterable<Key> | undefined;
  /** Called with the full selected-key set after every toggle. */
  onSelectionChange?: ((keys: Set<Key>) => void) | undefined;
  /** Refuse to empty the group. See the file header for how this is honoured. */
  disallowEmptySelection?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** The axis the buttons are laid along. */
  orientation?: "horizontal" | "vertical" | undefined;
  /** Announced name of the group. */
  "aria-label"?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * RAC's `Key` is `string | number`; Base UI's toggle values are `string`. LOSSY one way:
 * a numeric `id={3}` comes back out of `onSelectionChange` as `"3"`.
 */
function toValues(keys: Iterable<Key> | undefined): string[] | undefined {
  return keys === undefined ? undefined : [...keys].map(String);
}

function firstToggleKey(children: LumoNode): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { id?: Key; children?: LumoNode };
    if (child.type === Fragment) {
      const nested = firstToggleKey(props.children);
      if (nested !== undefined) return nested;
    } else if (props.id !== undefined) {
      return String(props.id);
    }
  }
  return undefined;
}

function toggleKeys(children: LumoNode, into = new Map<string, Key>()): Map<string, Key> {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { id?: Key; children?: LumoNode };
    if (child.type === Fragment) {
      toggleKeys(props.children, into);
    } else if (props.id !== undefined) {
      const serialized = String(props.id);
      const previous = into.get(serialized);
      if (previous !== undefined && previous !== props.id) {
        throw new Error(`ToggleButtonGroup keys ${String(previous)} and ${String(props.id)} collide.`);
      }
      into.set(serialized, props.id);
    }
  }
  return into;
}

/**
 * The key that holds the tab stop until hydration — see `useCompositeTabStop`. The first
 * PRESSED item if there is one, otherwise the first item.
 */
const ToggleTabStopContext = createContext<string | undefined>(undefined);

export function ToggleButtonGroup({
  selectionMode,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  disallowEmptySelection,
  isDisabled,
  orientation,
  "aria-label": ariaLabel,
  className,
  children,
}: ToggleButtonGroupProps) {
  const value = toValues(selectedKeys);
  const defaultValue = toValues(defaultSelectedKeys);
  const keyByValue = toggleKeys(children);
  const tabStopKey = value?.[0] ?? defaultValue?.[0] ?? firstToggleKey(children);

  return (
    <BaseToggleGroup
      data-lumo=""
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      multiple={selectionMode === "multiple"}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(orientation === undefined ? {} : { orientation })}
      {...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel })}
      onValueChange={(next, details) => {
        // The `disallowEmptySelection` floor: `cancel()` drops the un-press before it reaches state.
        if (disallowEmptySelection === true && next.length === 0) {
          details.cancel();
          return;
        }
        onSelectionChange?.(new Set(next.map((key) => keyByValue.get(key) ?? key)));
      }}
      className={cn(toggleButtonGroupVariants(), className)}
    >
      <ToggleTabStopContext.Provider value={tabStopKey}>{children}</ToggleTabStopContext.Provider>
    </BaseToggleGroup>
  );
}

export interface ToggleButtonProps extends VariantProps<typeof toggleButtonVariants> {
  /** The item's key inside a group. Maps to Base UI's `value`; it is ALWAYS the key and never reaches the DOM. */
  id?: Key | undefined;
  /** Pressed state for a STANDALONE toggle (controlled). */
  isSelected?: boolean | undefined;
  /** Pressed state for a STANDALONE toggle (uncontrolled). */
  defaultSelected?: boolean | undefined;
  /** Called with the button's new pressed state. */
  onChange?: ((isSelected: boolean) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Announced name. Required for an icon-only toggle — an icon is not a name. */
  "aria-label"?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
  /**
   * NOT for callers: what an outer composite (`<ToolbarItem>`) injects through `render`.
   *
   * @forwarded `...rest` → `Toggle` → the `<button>`, spread LAST so a composite beats this component.
   */
  tabIndex?: number | undefined;
}

/**
 * Usable standalone as well as inside a group — Base UI's `Toggle` falls back to its own
 * `useControlled` without a `ToggleGroupContext`. An icon-only toggle still needs
 * `aria-label`. `rest` is spread LAST, after `tabStop`: an outer composite's `tabIndex`
 * must beat this component's own group-level pre-hydration stop, and dropping the
 * composite's `ref` used to mean no registration and a permanent extra Tab stop.
 */
export function ToggleButton({
  id,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  "aria-label": ariaLabel,
  className,
  size,
  children,
  ...rest
}: ToggleButtonProps) {
  // Both hooks UNCONDITIONAL: `id !== undefined && useContext(…)` short-circuited the hook
  // call and changed the hook count between renders. A standalone toggle already serves
  // `tabindex="0"`, so the hook is asked only when this toggle is the group's holder.
  const groupTabStopId = useContext(ToggleTabStopContext);
  const tabStop = useCompositeTabStop(id !== undefined && groupTabStopId === String(id));
  return (
    <BaseToggle
      data-lumo=""
      {...tabStop}
      {...(id === undefined ? {} : { value: String(id) })}
      {...(isSelected === undefined ? {} : { pressed: isSelected })}
      {...(defaultSelected === undefined ? {} : { defaultPressed: defaultSelected })}
      {...(onChange === undefined ? {} : { onPressedChange: (pressed: boolean) => onChange(pressed) })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel })}
      className={cn(toggleButtonVariants({ size }), className)}
      // LAST: what an outer composite injected must beat this component's own props and `tabStop`.
      {...rest}
    >
      {children}
    </BaseToggle>
  );
}
