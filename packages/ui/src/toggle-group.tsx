"use client";

import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { Children, createContext, isValidElement, useContext } from "react";
import { cn, type Key, type LumoNode } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";
import { toggleButtonGroupVariants, toggleButtonVariants } from "./toggle-group.variants.ts";

/**
 * A segmented control. **BASE UI ENGINE.**
 *
 *     <ToggleButtonGroup selectionMode="single" defaultSelectedKeys={["list"]}>
 *       <ToggleButton id="list">فهرست</ToggleButton>
 *       <ToggleButton id="grid">شبکه</ToggleButton>
 *     </ToggleButtonGroup>
 *
 * Engine: `@base-ui/react/toggle-group` + `@base-ui/react/toggle` 1.7.0. The
 * React Aria original is `experiments/baseline-rac/toggle-group.tsx`. Every
 * divergence is recorded with evidence in
 * `experiments/measurements/rebuild-collections.json`.
 *
 * ═══ THE ONE THING THAT GOT WORSE, STATED FIRST ═════════════════════════════
 *
 * React Aria's `ToggleButtonGroup` with `selectionMode="single"` emits
 * **`role="radiogroup"`** and `role="radio"` children. Base UI's `ToggleGroup`
 * emits `role="group"` and leaves every child an `aria-pressed` button, in
 * single AND multiple mode alike. Measured, bare libraries, no Lumo code:
 *
 *     Base UI  <div role="group"><button aria-pressed="true">…
 *     RAC      <div role="radiogroup"><button role="radio" aria-checked="true">…
 *
 * `ToggleGroup.mjs:74` hardcodes `const defaultProps = { role: 'group' }` and
 * there is no prop that changes it. Passing `role="radiogroup"` from outside
 * would be worse than the gap: `aria-pressed` on a `role="radio"` is an invalid
 * combination, and the children have no `aria-checked` to supply instead.
 *
 * The consequence is exactly what `segmented-control.tsx`'s header argues about:
 * N `aria-pressed` buttons announce as N independent switches, with nothing
 * telling a listener that choosing one un-chooses the others. So this component
 * keeps Base UI's semantics — a toggle GROUP genuinely is a group of toggles,
 * and multiple-selection was always its main mode — while
 * **`segmented-control.tsx` was moved onto `RadioGroup` instead**, because there
 * the radio semantics are the entire reason the component exists. Two components
 * that used to share one primitive now sit on two, and that split is a finding
 * rather than a refactor.
 *
 * ── `disallowEmptySelection` HAS NO BASE UI EQUIVALENT, AND IS RECOVERABLE ───
 *
 * `ToggleGroup.mjs:52` computes `newGroupValue = nextPressed ? [newValue] : []`
 * with no floor: pressing the pressed item in single mode empties the group.
 * The lever that closes it is the event details object Base UI passes to
 * `onValueChange` — `eventDetails.cancel()`, after which the Root's
 * `if (eventDetails.isCanceled) return;` skips its own `setValueState`. So the
 * prop survives on the public API and is honoured for the controlled and the
 * uncontrolled form alike, without this wrapper keeping a second copy of the
 * selection. That is a compensating PROP, not a state mirror — the distinction
 * rule 5 draws.
 *
 * ── DIRECTION IS NO LONGER FREE (same gap tabs.tsx records) ─────────────────
 *
 * React Aria resolved arrow keys against the document direction via
 * `useLocale()`. Base UI's composite resolves them against its own
 * `DirectionContext`, whose `useDirection()` returns `'ltr'` when no
 * `<DirectionProvider>` is mounted (`internals/direction-context/
 * DirectionContext.mjs:7`). `LumoProvider` does not mount one today. So a
 * horizontal group on a Persian page arrows the wrong way unless the application
 * mounts `<DirectionProvider direction="rtl">`. Nothing is red; the keys are
 * simply backwards. Recorded, not papered over.
 *
 * ── THE CLASSES ARE IN `toggle-group.variants.ts`, AND THAT IS NOT TIDYING ──
 *
 * Both `cva()` calls used to sit in this file, under this `"use client"`
 * directive. Two things that costs, and neither is style: a cva exported from a
 * client module is a client REFERENCE in the RSC graph, so a server component
 * gets a proxy instead of a callable; and `shadcn migrate rtl` walks exactly
 * `cva()`'s first argument, so classes outside a variants module are invisible
 * to the RTL transform — which for THIS component means the logical edges
 * (`border-s`, the group-level `rounded-md`) that are its entire argument. The
 * rounding and divider reasoning moved with the classes; the findings that are
 * about behaviour rather than pixels stayed here.
 */
export interface ToggleButtonGroupProps {
  /**
   * `"single"` keeps at most one item pressed; `"multiple"` any number.
   *
   * Maps onto Base UI's `multiple` boolean. It does NOT change the group's role
   * — see the file header, which is where the semantic loss is argued.
   */
  selectionMode?: "single" | "multiple" | undefined;
  /** The pressed keys (controlled). */
  selectedKeys?: Iterable<Key> | undefined;
  /** The initially pressed keys (uncontrolled). */
  defaultSelectedKeys?: Iterable<Key> | undefined;
  onSelectionChange?: ((keys: Set<Key>) => void) | undefined;
  /** Refuse to empty the group. See the file header for how this is honoured. */
  disallowEmptySelection?: boolean | undefined;
  isDisabled?: boolean | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  /** Announced name of the group. */
  "aria-label"?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * React Aria's collection `Key` is `string | number`; Base UI's toggle values
 * are `string`. The conversion is confined to this boundary rather than pushed
 * onto the consumer — but it is LOSSY in one direction and that is stated
 * rather than discovered: a numeric `id={3}` comes back out of
 * `onSelectionChange` as the string `"3"`, because there is nothing in the DOM
 * to remember which of the two it was.
 */
function toValues(keys: Iterable<Key> | undefined): string[] | undefined {
  return keys === undefined ? undefined : [...keys].map(String);
}

/**
 * The key that holds the tab stop until hydration — see `useCompositeTabStop`
 * in `@lumo-ui/base-ui-ssr`. A server-rendered `ToggleGroup` has no
 * `tabindex="0"` anywhere in it, so the Tab key cannot reach it before
 * JavaScript loads. The first PRESSED item if there is one, otherwise the first
 * item, which is where the composite puts the stop once it can.
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
  const firstChild = Children.toArray(children).find(isValidElement) as
    | { props?: { id?: unknown } }
    | undefined;
  const tabStopKey =
    value?.[0] ??
    defaultValue?.[0] ??
    (firstChild?.props?.id === undefined ? undefined : String(firstChild.props.id));

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
        // The `disallowEmptySelection` floor. `cancel()` is read by the Root
        // immediately after this returns, so the un-press is dropped before it
        // reaches state — for the controlled and uncontrolled forms alike.
        if (disallowEmptySelection === true && next.length === 0) {
          details.cancel();
          return;
        }
        onSelectionChange?.(new Set(next));
      }}
      className={cn(toggleButtonGroupVariants(), className)}
    >
      <ToggleTabStopContext.Provider value={tabStopKey}>{children}</ToggleTabStopContext.Provider>
    </BaseToggleGroup>
  );
}

export interface ToggleButtonProps extends VariantProps<typeof toggleButtonVariants> {
  /**
   * The item's key inside a group. Maps to Base UI's `value`.
   *
   * API CHANGE, recorded: under React Aria a standalone `ToggleButton` treated
   * `id` as a DOM id, and inside a group as a selection key. Base UI splits the
   * two — `value` is the key, `id` is the DOM id — so this prop is now ALWAYS
   * the key and never reaches the DOM. Pass `aria-label` for naming; there was
   * never a documented use for the DOM id.
   */
  id?: Key | undefined;
  /** Pressed state for a STANDALONE toggle (controlled). */
  isSelected?: boolean | undefined;
  /** Pressed state for a STANDALONE toggle (uncontrolled). */
  defaultSelected?: boolean | undefined;
  onChange?: ((isSelected: boolean) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Announced name. Required for an icon-only toggle — an icon is not a name. */
  "aria-label"?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
  /**
   * NOT for callers, and the reason it has to be declared is a measured defect.
   *
   * When a toggle is placed in an OUTER composite — `<ToolbarItem><ToggleButton/>`
   * — `Toolbar.Button` adopts this component through `render`, and
   * `useRenderElement` hands a COMPONENT render target its merged props as
   * ordinary React props: `ref`, `tabIndex`, `data-focusable`,
   * `data-orientation` and the composite's handlers all arrive here. This
   * function used to destructure a CLOSED list and spread nothing, so every one
   * of them was dropped on the floor. See the header.
   */
  tabIndex?: number | undefined;
}

/**
 * Usable standalone as well as inside a group — Base UI's `Toggle` falls back to
 * its own `useControlled` when there is no `ToggleGroupContext`, exactly as
 * React Aria's fell back to `useToggleState`. Measured: a standalone
 * `<Toggle defaultPressed>` renders `tabindex="0"`, and the same toggle inside a
 * group renders `tabindex="-1"` with the composite owning the one tab stop.
 *
 * An icon-only toggle still needs `aria-label`: there is no `IconToggleButton`
 * here because the underlying `aria-label` is already required by the same rule
 * that gave button.tsx its `IconButton`, and inventing a second spelling of the
 * same prop would let the two drift.
 *
 * ═══ IT NOW FORWARDS WHAT AN OUTER COMPOSITE HANDS IT ══════════════════════
 *
 * Until 12 Aug 2026 this function destructured a closed prop list and spread
 * NOTHING, which made `<ToolbarItem><ToggleButton/></ToolbarItem>` a silent
 * no-op. Measured on the export of the commit before this one, on the library's
 * own first toolbar example (`apps/website/src/examples/toolbar.tsx`,
 * `FormattingExample`), all three toggles served:
 *
 *     <button type="button" data-pressed aria-disabled="false" aria-pressed …>
 *
 * — no `tabindex`, no `data-focusable`, no `data-orientation`. Compare the
 * `IconButton` in the same toolbar, which spreads its rest and served
 * `data-orientation="horizontal" data-focusable="" tabindex="0"`.
 *
 * Two consequences, and only the second is visible from inside a browser:
 *
 *  1. **No registration.** The composite's `ref` was dropped too, so
 *     `useCompositeListItem` never registered the element and the arrow keys
 *     could not reach it. This is precisely the failure `ToolbarItem` was added
 *     to prevent, happening THROUGH `ToolbarItem`.
 *  2. **A permanent extra Tab stop.** A `<button>` with no `tabindex` is
 *     natively tabbable, forever — not a first-byte gap that hydration closes.
 *     Five of the thirty over-stopped composites in that export were this.
 *
 * `rest` is spread LAST, after `tabStop`, on purpose: an outer composite's
 * `tabIndex` must beat this component's own group-level pre-hydration stop.
 * A toggle cannot be the designated stop of two composites at once, and the
 * outer one is the one whose Tab order the reader actually walks.
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
  /*
   * A STANDALONE toggle already serves `tabindex="0"` — measured — because it is
   * a plain `<button>` with no composite over it. The hook is asked only when
   * this toggle is the group's designated holder, so the standalone case is
   * untouched and cannot acquire a second stop.
   */
  const tabStop = useCompositeTabStop(
    id !== undefined && useContext(ToggleTabStopContext) === String(id),
  );
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
      // LAST. See the header: this is what an outer composite injected, and it
      // must beat both this component's own props and `tabStop` above.
      {...rest}
    >
      {children}
    </BaseToggle>
  );
}
