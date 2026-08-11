"use client";

import { createContext, useContext } from "react";
import { cva } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants } from "./popover.tsx";
import { FieldLabelContext } from "./form.tsx";
import { useFieldWiring } from "@lumo-ui/base-ui-ssr";

/**
 * EXPERIMENT — this file is the React Aria Select rebuilt on Base UI 1.7.0.
 * The React Aria original is `experiments/baseline-rac/select.tsx`; the public
 * API below is unchanged, and `packages/ui/src/overlays.test.tsx` runs against
 * it UNEDITED. Every divergence found while porting is recorded, with evidence,
 * in `experiments/measurements/rebuild-collections.json`.
 *
 * A single-select listbox in a popover.
 *
 *     <Select placeholder="یک شهر انتخاب کنید" onSelectionChange={…}>
 *       <SelectTrigger />
 *       <SelectPopover>
 *         <SelectItem id="thr">تهران</SelectItem>
 *         <SelectItem id="isf">اصفهان</SelectItem>
 *       </SelectPopover>
 *     </Select>
 *
 * ── WHY `placeholder` IS STILL REQUIRED, FOR A DIFFERENT REASON ─────────────
 *
 * Under React Aria the prop was required because `SelectValue` fell back to
 * RAC's own `selectPlaceholder: "Select an item"` bundle string, which rendered
 * the English phrase into the first byte of a Persian page.
 *
 * Base UI ships **no string bundle at all** — grepped, not assumed: the whole
 * of `@base-ui/react/select` contains zero `aria-label` literals and zero
 * translatable strings (see `rebuild-collections.json`, `english_strings`).
 * `<Select.Value>` with no `placeholder` and no value renders EMPTY.
 *
 * So the failure mode inverts: React Aria shipped the wrong language, Base UI
 * ships nothing. An empty collapsed control is a worse defect than an English
 * one, because it is invisible in review — there is no Latin word for a gate to
 * catch, and a screenshot of an unselected Select looks like a styling bug
 * rather than a missing string. The prop stays required, and the argument for
 * requiring it is now stronger, not weaker.
 *
 * ── ONE CAPABILITY GAP, NOT PAPERED OVER ────────────────────────────────────
 *
 * React Aria resolves a selected KEY to that item's rendered text, because the
 * collection is built before render. Base UI's `<Select.Value>` resolves the
 * label only from the Root's `items` prop (`resolveSelectedLabel` in
 * `internals/resolveValueLabel.mjs` — it never consults mounted items), and the
 * items live inside a portal that is `null` while closed. With
 * `defaultSelectedKey="thr"` and no `items`, this component therefore renders
 * the raw key `thr` where React Aria rendered `تهران`.
 *
 * That is left HONEST rather than patched: the obvious workaround — walking
 * `children` for a matching `id` and pulling its text out — would reimplement a
 * collection builder inside a wrapper, which is the exact thing renting a
 * headless library is supposed to buy. Recorded as
 * `select.selected-key-label-resolution` in the measurements file.
 */

export const selectVariants = cva("group flex w-full flex-col gap-1.5");

export const selectTriggerVariants = cva(
  "flex h-control-md w-full cursor-pointer items-center justify-between gap-2 " +
    "rounded-md border border-border-control bg-surface ps-3 pe-2 text-sm text-fg " +
    // Logical padding, asymmetric on purpose: the value needs breathing room at
    // the reading edge, the chevron sits tight against the trailing edge. In
    // Persian both swap sides, which `pl-3 pr-2` would not.
    //
    // `hover:` replaces RAC's `data-hovered:`. Base UI emits NO hover attribute
    // on any part — its trigger's full set is data-popup-open / data-pressed /
    // data-disabled / data-readonly / data-popup-side / data-required /
    // data-valid / data-invalid / data-touched / data-dirty / data-filled /
    // data-focused / data-placeholder. Keeping `data-hovered:` would have left
    // a class that styles nothing and reviews as if it did.
    "hover:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    // RAC wrote `data-open`; Base UI writes `data-popup-open`.
    "data-popup-open:border-border-strong",
);

export const selectValueVariants = cva(
  // `text-start`, never `text-left`. This is the single most copied physical
  // utility in form controls.
  "flex-1 truncate text-start data-placeholder:text-fg-subtle",
);

export const selectPopoverVariants = cva(
  // RAC wrote the trigger's measured width as `--trigger-width`; Base UI's
  // positioner writes `--anchor-width` (verified in useAnchorPositioning.mjs).
  // The variable name is engine-owned, so this is a forced edit, not a restyle
  // — keeping `--trigger-width` would silently shrink-wrap the panel.
  "w-[var(--anchor-width)] overflow-auto p-0",
);

export const selectListBoxVariants = cva("max-h-[inherit] overflow-auto p-1 outline-none");

export const selectItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    // RAC's one focus cursor was `data-focused`; Base UI calls the same state
    // `data-highlighted`, and drives it for pointer and keyboard alike exactly
    // as RAC did. Same behaviour, different attribute name.
    "data-highlighted:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/**
 * Carries the two strings that React Aria took on the Root and delivered to
 * descendants through its own context: the required `placeholder`, read by
 * `SelectValue`, and `aria-label`, which Base UI expects on `Select.Trigger`
 * rather than on the root.
 *
 * A Lumo-owned React context is the right tool here and NOT the thing DECISIONS
 * §0.1 rules out — that section is about RAC's `LocalizedStringProvider`, which
 * renders no children and only sets a `window` global. A plain React context
 * renders on the server, which is the tier this library is measured at.
 */
interface SelectFieldContextValue {
  placeholder: string;
  label: string | undefined;
  /**
   * The id the consumer's `<Label>` is pointing its `htmlFor` at. See the
   * header section on the twelve.
   */
  triggerId: string | undefined;
}

const SelectFieldContext = createContext<SelectFieldContextValue | null>(null);

export interface SelectProps<T extends object> {
  /**
   * Visible text shown when nothing is selected. REQUIRED — see the file
   * header: Base UI's fallback is an EMPTY control, which is worse than RAC's
   * English one because nothing on screen says a string is missing.
   */
  placeholder: string;
  /** Announced name, when no visible `<Label>` names the control. */
  "aria-label"?: string | undefined;
  /** The selected key. Maps to Base UI's `value`. */
  selectedKey?: string | null | undefined;
  /** The initially selected key. Maps to Base UI's `defaultValue`. */
  defaultSelectedKey?: string | null | undefined;
  /** Called with the newly selected key. Maps to Base UI's `onValueChange`. */
  onSelectionChange?: ((key: string | null) => void) | undefined;
  isDisabled?: boolean | undefined;
  isRequired?: boolean | undefined;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Form field name for the hidden input Base UI renders. */
  name?: string | undefined;
  /**
   * TYPE CARRIER, NOT A PROP — and typed `never` on purpose. React Aria's
   * `SelectProps<T>` fed `T` to `AriaSelectProps<T>`'s `items?: Iterable<T>`.
   * Base UI has no collection builder, so nothing is left for `T` to type.
   * Keeping the field keeps the type PARAMETER, so a `SelectProps<City>`
   * annotation a consumer already wrote still compiles; typing it `never`
   * makes passing a value a compile error rather than a prop that is accepted
   * and silently dropped.
   */
  items?: Iterable<T> & never;
  children?: LumoNode;
  className?: string | undefined;
}

export function Select<T extends object>({
  placeholder,
  "aria-label": ariaLabel,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isDisabled,
  isRequired,
  isOpen,
  defaultOpen,
  onOpenChange,
  name,
  className,
  children,
}: SelectProps<T>) {
  const wiring = useFieldWiring({ mode: "native", explicit: { "aria-label": ariaLabel } });
  return (
    <BaseSelect.Root
      {...(selectedKey === undefined ? {} : { value: selectedKey })}
      {...(defaultSelectedKey === undefined ? {} : { defaultValue: defaultSelectedKey })}
      {...(onSelectionChange === undefined
        ? {}
        : { onValueChange: (value: string | null) => onSelectionChange(value) })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(isRequired === undefined ? {} : { required: isRequired })}
      {...(isOpen === undefined ? {} : { open: isOpen })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      {...(onOpenChange === undefined ? {} : { onOpenChange: (open: boolean) => onOpenChange(open) })}
      {...(name === undefined ? {} : { name })}
    >
      <SelectFieldContext.Provider
        value={{ placeholder, label: ariaLabel, triggerId: wiring.controlProps.id }}
      >
        {/*
         * ── THE TWELVE, AND THE SEAM PHASE A SAID DID NOT EXIST ─────────────
         *
         * Every one of `gate:html`'s twelve remaining `named-controls`
         * violations was this component: `<button role="combobox">` with no
         * accessible name, on the six Select instances across the docs site
         * that use a visible `<Label>` instead of `aria-label`, in two locales.
         *
         * `phase-a-result.json` recorded the cause as STRUCTURAL — "the
         * CONSUMER renders the Label, so there is no seam to inject through
         * without either cloning children or making form.tsx's Label
         * context-aware". The second half of that sentence is the answer, and
         * it is now literally what happens: `form.tsx`'s `<Label>` reads
         * `FieldLabelContext`, and this is the only thing that provides it.
         *
         * The FIRST version of the fix did it through React Aria instead —
         * RAC's `Label` already read RAC's `LabelContext`, which is a public
         * export, so providing it here worked without touching `form.tsx`.
         * That was the cheaper edit and it is why it was written first, but it
         * left a RUNTIME `react-aria-components` import in a SHIPPED component
         * for a wiring concern that has nothing to do with React Aria, on a
         * branch whose whole purpose is to delete that dependency. The context
         * is Lumo's now. The mechanism and the served bytes are unchanged —
         * a `<Label>` under a provider carrying `{id, htmlFor}` emits both
         * attributes at the first byte, and an explicit `id` on the element
         * still wins, because the caller's own props are spread last.
         *
         * So the fix is still a PUBLIC-API prop-level fix, with one engine
         * fewer in it. No node_modules, no internal module path.
         *
         * The direction is deliberate and is argued in `FieldWiringMode`: the
         * LABEL points at the control with `htmlFor`, not the reverse. This
         * component cannot know whether the consumer rendered a `<Label>`, and
         * an `aria-labelledby` minted on that guess would dangle. `htmlFor` on
         * an element that does not exist emits nothing.
         *
         * Base UI's Root renders no DOM at all, so the field box React Aria's
         * `<Select>` provided — the thing `className` and `data-lumo` were
         * attached to — has to be a real element here.
         */}
        <FieldLabelContext.Provider value={wiring.labelProps}>
          <div data-lumo="" className={cn(selectVariants(), className)}>
            {children}
          </div>
        </FieldLabelContext.Provider>
      </SelectFieldContext.Provider>
    </BaseSelect.Root>
  );
}

/**
 * The collapsed control. Renders `<SelectValue>` unless you pass your own
 * children, so the common case cannot forget it.
 *
 * The chevron is `ChevronDown` — a BLOCK-axis glyph. A downward arrow means the
 * same thing in both scripts and needs no mirroring, which is why the trigger
 * affordance is an icon here while the submenu affordance in menu.tsx has to be
 * a bidi-mirrored character.
 */
export interface SelectTriggerProps {
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const field = useContext(SelectFieldContext);
  /*
   * `id` is the other end of the `htmlFor` the consumer's `<Label>` is carrying
   * — see the block in `Select`. Overriding Base UI's own generated trigger id
   * is safe: nothing else in the server output references it.
   */
  return (
    <BaseSelect.Trigger
      data-lumo=""
      {...(field?.label === undefined ? {} : { "aria-label": field.label })}
      {...(field?.triggerId === undefined ? {} : { id: field.triggerId })}
      className={cn(selectTriggerVariants(), className)}
    >
      {children ?? <SelectValue />}
      <ChevronDown aria-hidden="true" className="shrink-0 text-fg-muted" />
    </BaseSelect.Trigger>
  );
}

export interface SelectValueProps<T extends object> {
  /** TYPE CARRIER, NOT A PROP — see `SelectProps.items`. */
  selectedItem?: T & never;
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectValue<T extends object>({ className, children }: SelectValueProps<T>) {
  const field = useContext(SelectFieldContext);
  return (
    <BaseSelect.Value
      className={cn(selectValueVariants(), className)}
      {...(field === null ? {} : { placeholder: field.placeholder })}
    >
      {children}
    </BaseSelect.Value>
  );
}

/**
 * The popover AND the list inside it, in one component.
 *
 * Fused deliberately, and Base UI needs the fusion MORE than React Aria did:
 * where RAC wanted one `<ListBox>` between Popover and items, Base UI wants
 * four nested parts — `Portal` → `Positioner` → `Popup` → `List` — none of
 * which carries a styling decision a caller would ever want to make, and every
 * one of which renders nothing at all if omitted.
 *
 * `alignItemWithTrigger={false}` is deliberate. Base UI's default overlaps the
 * popup on the trigger so the selected item's text lines up with the trigger's
 * value text. That is a native-macOS behaviour React Aria never had, and
 * adopting it here would change the component's appearance while the brief is
 * to swap the engine — so it is switched off and the panel drops below the
 * control exactly as before.
 */
export interface SelectPopoverProps<T extends object> {
  children?: LumoNode | ((item: T) => LumoNode);
  /** Class for the popover surface. */
  className?: string | undefined;
  /** Class for the scrolling list inside it. */
  listBoxClassName?: string | undefined;
}

export function SelectPopover<T extends object>({
  className,
  listBoxClassName,
  children,
}: SelectPopoverProps<T>) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        className="isolate z-50"
        side="bottom"
        align="start"
        sideOffset={4}
        alignItemWithTrigger={false}
      >
        <BaseSelect.Popup
          className={cn(popoverVariants({ padded: false }), selectPopoverVariants(), className)}
        >
          <BaseSelect.List
            data-lumo=""
            className={cn(selectListBoxVariants(), listBoxClassName)}
          >
            {children as LumoNode}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

/**
 * One option.
 *
 * The check mark goes at the INLINE END (`ms-auto` pushes it to the trailing
 * edge), so it lands on the right in English and on the left in Persian —
 * beside the item's own trailing edge either way.
 *
 * `textValue` maps onto Base UI's `label`, which is the same idea arrived at
 * from the opposite direction. React Aria DERIVED a typeahead string from a
 * literal string child and lost it the moment a wrapper appeared (the trap
 * documented at length in menu.tsx); Base UI never derives from `children` at
 * all — `SelectItem.label` "defaults to the item text content", read off the
 * DOM after mount — so the wrapper cannot break it. The re-derivation is kept
 * anyway, because it also feeds the SERVER-rendered markup, which has no DOM to
 * read text content from.
 */
export interface SelectItemProps<T extends object = object> {
  /** TYPE CARRIER, NOT A PROP — see `SelectProps.items`. */
  value?: T & never;
  /** The item's key. Maps to Base UI's `value`. */
  id?: string | undefined;
  /** Typeahead string. Required for non-string children. */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectItem<T extends object = object>({
  className,
  children,
  textValue,
  id,
  isDisabled,
}: SelectItemProps<T>) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <BaseSelect.Item
      data-lumo=""
      className={cn(selectItemVariants(), className)}
      {...(id === undefined ? {} : { value: id })}
      {...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
    >
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/*
       * `aria-hidden` on the glyph: selection is already in the tree as
       * `aria-selected`, so the mark would only add noise to the name.
       * `ItemIndicator` renders nothing at all when the item is unselected, so
       * `ms-auto` sits on it rather than on a wrapper that would otherwise
       * reserve trailing space in every row.
       */}
      <BaseSelect.ItemIndicator className="ms-auto flex items-center">
        <Check aria-hidden="true" className="text-accent" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
