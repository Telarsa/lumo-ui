"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { cn, type LumoNode, type ValidationError } from "@lumo-ui/core";
import { popoverVariants } from "./popover.tsx";
import { Description, Field, FieldError, Label, optional, useFieldControl } from "./form.tsx";
import type { AsyncCollectionPresentation } from "./async-collection.ts";
import { Button } from "./button.tsx";

/**
 * A single-select listbox in a popover, rebuilt on Base UI (the React Aria
 * original is `experiments/baseline-rac/select.tsx`; public API unchanged).
 *
 * Load-bearing decisions: `placeholder` is REQUIRED because Base UI ships no
 * string bundle and an empty `<Select.Value>` is invisible in review;
 * `collectItemLabels` derives Base UI's `items` record from `children` so a
 * server-rendered `defaultSelectedKey` shows the label and not the raw key;
 * `SelectItemProps` is a union that requires `textValue` for markup children;
 * `<Field>` sits ABOVE `Select.Root` because `SelectRoot` reads name/disabled/
 * validation from `useFieldRootContext`. Long-form reasoning and measurements:
 * `experiments/measurements/rebuild-collections.json`, `docs/decisions/log.md`.
 */

export const selectVariants = cva("group flex w-full flex-col gap-1.5");

/**
 * The collapsed control. Takes sm/md/lg from the same density-scaled control
 * tokens as every other field control; `lg` meets the 44px touch floor.
 */
export const selectTriggerVariants = cva(
  "flex w-full cursor-pointer items-center justify-between gap-2 " +
    "rounded-md border border-border-control bg-surface ps-3 pe-2 text-sm text-fg " +
    // Logical padding, asymmetric on purpose (value at the reading edge, chevron
    // tight at the trailing edge); mirrors in Persian where `pl-3 pr-2` would not.
    // `hover:` not `data-hovered:` — Base UI emits no hover attribute.
    "hover:bg-surface-hover " +
    // `data-invalid` on the TRIGGER: `Select.Trigger` spreads the field's state
    // into its own. Same declaration as `inputVariants`.
    "data-invalid:border-critical " +
    // `pointer-events-none` only: the dimming lives on the `Field.Root` wrapper,
    // and Base UI writes `data-disabled` on BOTH, so `opacity-50` here would multiply.
    "data-disabled:pointer-events-none " +
    // RAC wrote `data-open`; Base UI writes `data-popup-open`.
    "data-popup-open:border-border-strong",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        sm: "h-control-sm text-sm",
        md: "h-control-md text-sm",
        lg: "h-control-lg text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>;

export const selectValueVariants = cva(
  // `text-start`, never `text-left`.
  "flex-1 truncate text-start data-placeholder:text-fg-subtle",
);

export const selectPopoverVariants = cva(
  // `--anchor-width` is Base UI's positioner variable (RAC's was `--trigger-width`);
  // the name is engine-owned.
  "flex w-[var(--anchor-width)] max-h-[min(20rem,var(--available-height))] flex-col overflow-hidden p-0",
);

export const selectListBoxVariants = cva(
  "min-h-0 flex-1 max-h-[inherit] overflow-auto p-1 outline-none " +
    "[scrollbar-width:thin] " +
    "[scrollbar-color:var(--color-border-strong)_var(--color-surface-sunken)] " +
    "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-surface-sunken " +
    "[&::-webkit-scrollbar-thumb]:rounded-full " +
    "[&::-webkit-scrollbar-thumb]:bg-border-strong",
);

export const selectGroupLabelVariants = cva(
  // `px-2` matches the item's inline padding; block padding is asymmetric on purpose.
  "px-2 pt-1.5 pb-1 text-xs font-medium text-fg-subtle",
);

export const selectSeparatorVariants = cva(
  // `-mx-1` bleeds the rule through the list's own `p-1`; logical so it mirrors.
  "-mx-1 my-1 h-px bg-border",
);

export const selectItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    // `data-highlighted` is Base UI's name for RAC's `data-focused`.
    "data-highlighted:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/**
 * Carries `placeholder` and `aria-label` from the Root to descendants (Base UI
 * wants `aria-label` on the Trigger). The trigger's id and `aria-describedby`
 * come from the `<Field>` above via `useFieldControl()`, not from here.
 */
interface SelectFieldContextValue {
  placeholder: string;
  label: string | undefined;
  asyncState: AsyncCollectionPresentation | undefined;
  itemCount: number;
}

const SelectFieldContext = createContext<SelectFieldContextValue | null>(null);

/**
 * Every `SelectItem` reachable from `node`, as `{ [id]: label }` — the record
 * `Select.Root`'s `items` prop wants. Recurses because items sit inside
 * `<SelectPopover>` and `<SelectGroup>`; `Children.forEach` flattens fragments.
 *
 * The predicate is `props`-shaped and NOT `child.type === SelectItem`: across
 * the RSC boundary a revived element's `type` is a client reference, so the
 * identity test is false for every server-rendered page (measured 12 Aug 2026).
 */
function isItemProps(props: unknown): props is SelectItemProps & { id: string } {
  if (props === null || typeof props !== "object") return false;
  const p = props as { id?: unknown; textValue?: unknown; children?: unknown };
  if (typeof p.id !== "string") return false;
  return typeof p.textValue === "string" || typeof p.children === "string";
}

function collectItemLabels(node: LumoNode, into: Record<string, string>): void {
  Children.forEach(node as ReactNode, (child) => {
    if (!isValidElement(child)) return;
    if (isItemProps(child.props)) {
      const props = child.props;
      // `textValue` first: an explicit label wins over a string child.
      into[props.id] =
        typeof props.textValue === "string" ? props.textValue : (props.children as string);
      return;
    }
    const inner = (child.props as { children?: LumoNode }).children;
    if (inner !== undefined) collectItemLabels(inner, into);
  });
}

export interface SelectProps<T extends object> {
  /**
   * Visible text shown when nothing is selected. REQUIRED — Base UI's fallback
   * is an EMPTY control, and nothing on screen says a string is missing.
   */
  placeholder: string;
  /** Announced name, when no visible `<Label>` names the control. */
  "aria-label"?: string | undefined;
  /**
   * Help text under the control, wired into the trigger's `aria-describedby`
   * during render. Rendered by this component, below `children`.
   */
  description?: LumoNode;
  /** An error to display. Supplying one marks the field invalid, as `TextField` does. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  /** Returns a caller-authored error for the selected key, or `true` when valid. */
  validate?: ((key: string | null) => ValidationError | true | null | undefined) | undefined;
  /** The selected key. Maps to Base UI's `value`. */
  selectedKey?: string | null | undefined;
  /** The initially selected key. Maps to Base UI's `defaultValue`. */
  defaultSelectedKey?: string | null | undefined;
  /** Called with the newly selected key. Maps to Base UI's `onValueChange`. */
  onSelectionChange?: ((key: string | null) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Marks the field required for form submission and announces it as such. */
  isRequired?: boolean | undefined;
  /** Caller-authored loading/error/empty state from the shared async controller. */
  asyncState?: AsyncCollectionPresentation | undefined;
  /** Whether the popup is open, when controlled. */
  isOpen?: boolean | undefined;
  /** Opens the popup on first render, when open state is uncontrolled. */
  defaultOpen?: boolean | undefined;
  /** Called when the popup opens or closes. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Form field name for the hidden input Base UI renders. */
  name?: string | undefined;
  /**
   * TYPE CARRIER, NOT A PROP. Keeps `T` so an existing `SelectProps<City>` still
   * compiles, and makes passing a value a compile error. Spelled
   * `(Iterable<T> & never) | undefined` so an explicit `items: undefined` in a
   * spread compiles under `exactOptionalPropertyTypes` (bare `& never` rejects it).
   */
  items?: (Iterable<T> & never) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Select<T extends object>({
  placeholder,
  "aria-label": ariaLabel,
  description,
  errorMessage,
  isInvalid,
  validate,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isDisabled,
  isRequired,
  asyncState,
  isOpen,
  defaultOpen,
  onOpenChange,
  name,
  className,
  children,
}: SelectProps<T>) {
  const [uncontrolledKey, setUncontrolledKey] = useState<string | null>(
    defaultSelectedKey ?? null,
  );
  const validationKey = selectedKey !== undefined ? selectedKey : uncontrolledKey;
  const validationResult = validate?.(validationKey);
  const validationMessage =
    validationResult === true || validationResult == null
      ? undefined
      : Array.isArray(validationResult)
        ? validationResult[0]
        : validationResult;
  const effectiveError = errorMessage ?? validationMessage;
  /*
   * The `value → label` record `Select.Value` reads, derived from `children` on
   * every render path including the server's. `useMemo` is load-bearing:
   * `SelectRoot` writes `items` into its store from a layout effect keyed on
   * identity, so a fresh object every render would queue a store write every render.
   */
  const itemLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    collectItemLabels(children, labels);
    return labels;
  }, [children]);

  return (
    /*
     * `<Field>` is ABOVE `Select.Root` (forced: `SelectRoot` reads the field
     * context from above; Base UI's Root renders no DOM). `mode="native"`: the
     * consumer's `<Label>` points at the trigger with `htmlFor` — this component
     * cannot know whether one was rendered, so an `aria-labelledby` would dangle.
     */
    <Field
      mode="native"
      description={description}
      errorMessage={effectiveError}
      explicit={{ "aria-label": ariaLabel }}
      className={cn(selectVariants(), className)}
      {...optional("isDisabled", isDisabled)}
      {...optional("isInvalid", isInvalid)}
      {...optional("name", name)}
      {...optional(
        "validate",
        validate === undefined
          ? undefined
          : (fieldValue: unknown) => {
              const key = fieldValue == null || fieldValue === "" ? null : String(fieldValue);
              const result = validate(key);
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      {/*
       * `name` goes to BOTH roots deliberately: the second copy feeds
       * `useRegisterFieldControl`, which is how `<Form>` maps a server error here.
       */}
      <BaseSelect.Root
        items={itemLabels}
        {...(selectedKey === undefined ? {} : { value: selectedKey })}
        {...(defaultSelectedKey === undefined ? {} : { defaultValue: defaultSelectedKey })}
        {...(onSelectionChange === undefined && validate === undefined
          ? {}
          : {
              onValueChange: (value: string | null) => {
                setUncontrolledKey(value);
                onSelectionChange?.(value);
              },
            })}
        {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
        {...(isRequired === undefined ? {} : { required: isRequired })}
        {...(isOpen === undefined ? {} : { open: isOpen })}
        {...(defaultOpen === undefined ? {} : { defaultOpen })}
        {...(onOpenChange === undefined
          ? {}
          : { onOpenChange: (open: boolean) => onOpenChange(open) })}
        {...(name === undefined ? {} : { name })}
      >
        <SelectFieldContext.Provider
          value={{
            placeholder,
            label: ariaLabel,
            asyncState,
            itemCount: Object.keys(itemLabels).length,
          }}
        >
          {children}
          {/*
           * Rendered here rather than left to the consumer: a part cannot be
           * required. Description before error so DOM and announced order agree.
           */}
          {description != null ? <Description>{description}</Description> : null}
          <FieldError>{effectiveError}</FieldError>
        </SelectFieldContext.Provider>
      </BaseSelect.Root>
    </Field>
  );
}

/**
 * The collapsed control. Renders `<SelectValue>` unless you pass your own
 * children. `ChevronDown` is a block-axis glyph and needs no mirroring.
 */
export interface SelectTriggerProps extends SelectTriggerVariantProps {
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectTrigger({ className, size, children }: SelectTriggerProps) {
  const field = useContext(SelectFieldContext);
  /*
   * `id` (the other end of the consumer's `<Label htmlFor>`) and
   * `aria-describedby` both arrive from the `<Field>` above. `aria-invalid` is
   * NOT set here: `Select.Trigger` reads it from `useFieldRootContext` during render.
   */
  const control = useFieldControl();
  return (
    <BaseSelect.Trigger
      data-lumo=""
      {...control}
      {...(field?.label === undefined ? {} : { "aria-label": field.label })}
      {...(field?.asyncState?.status === "loading" ? { "aria-busy": true } : {})}
      className={cn(selectTriggerVariants({ size }), className)}
    >
      {children ?? <SelectValue />}
      <ChevronDown aria-hidden="true" className="shrink-0 text-fg-muted" />
    </BaseSelect.Trigger>
  );
}

export interface SelectValueProps<T extends object> {
  /** TYPE CARRIER, NOT A PROP — see `SelectProps.items`, including why the
   *  spelling is `(T & never) | undefined` and not `T & never`. */
  selectedItem?: (T & never) | undefined;
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

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectFieldProps extends SelectTriggerVariantProps {
  /** The accessible name of the field, rendered as its visible label unless showLabel hides it. */
  label: string;
  /** Text shown on the trigger before any option is chosen. */
  placeholder: string;
  /** The options offered, each a stable string key with a display label. */
  options: readonly SelectFieldOption[];
  /** The selected key, when selection is controlled. */
  selectedKey?: string | null | undefined;
  /** The initially selected key, when selection is uncontrolled. */
  defaultSelectedKey?: string | null | undefined;
  /** Called with the newly selected key, or null when cleared. */
  onSelectionChange?: ((key: string | null) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Overrides the invalid state derived from errorMessage. */
  isInvalid?: boolean | undefined;
  /** The validation message rendered and announced when the field is invalid. */
  errorMessage?: LumoNode;
  /** Submitted field name when the control sits inside a form. */
  name?: string | undefined;
  /** Renders the label visibly; when false the name is announced only. */
  showLabel?: boolean | undefined;
  className?: string | undefined;
  /** Additional classes merged onto the trigger button. */
  triggerClassName?: string | undefined;
  /** Additional classes merged onto the popup surface. */
  popoverClassName?: string | undefined;
  /** Additional classes merged onto the option list. */
  listBoxClassName?: string | undefined;
  /** Additional classes merged onto every option row. */
  itemClassName?: string | undefined;
}

/**
 * The compact spelling of Lumo's full Select composition for product widgets.
 * It owns no state or keyboard model; those remain in the public Select parts.
 */
export function SelectField({
  label,
  placeholder,
  options,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isDisabled,
  isInvalid,
  errorMessage,
  name,
  showLabel = false,
  size,
  className,
  triggerClassName,
  popoverClassName,
  listBoxClassName,
  itemClassName,
}: SelectFieldProps) {
  return (
    <Select<object>
      placeholder={placeholder}
      aria-label={label}
      {...(selectedKey === undefined ? {} : { selectedKey })}
      {...(defaultSelectedKey === undefined ? {} : { defaultSelectedKey })}
      {...(onSelectionChange === undefined ? {} : { onSelectionChange })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(isInvalid === undefined ? {} : { isInvalid })}
      {...(errorMessage == null ? {} : { errorMessage })}
      {...(name === undefined ? {} : { name })}
      {...(className === undefined ? {} : { className })}
    >
      {showLabel ? <Label>{label}</Label> : null}
      <SelectTrigger size={size} className={triggerClassName} />
      <SelectPopover className={popoverClassName} listBoxClassName={listBoxClassName}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            id={option.value}
            className={itemClassName}
            {...(option.disabled === undefined ? {} : { isDisabled: option.disabled })}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectPopover>
    </Select>
  );
}

/**
 * The popover AND the list inside it, in one component: Base UI's Portal →
 * Positioner → Popup → List carry no styling decision a caller would make.
 * `alignItemWithTrigger={false}` keeps the panel dropping below the control.
 */
export interface SelectPopoverProps<T extends object> {
  /**
   * The options. STATIC ONLY — Base UI's `Select.List` has no render-function
   * arm (unlike `Combobox.List`), so a function child renders an empty listbox.
   */
  children?: LumoNode;
  /** TYPE CARRIER, NOT A PROP — see `SelectProps.items`. Keeps `<T>` on this interface. */
  items?: (Iterable<T> & never) | undefined;
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
  const field = useContext(SelectFieldContext);
  const stateText =
    field?.asyncState?.status === "loading" || field?.asyncState?.status === "error"
      ? field.asyncState.text
      : field?.asyncState?.status === "ready" && field.itemCount === 0
        ? field.asyncState.emptyText
        : null;
  const stateAction =
    field?.asyncState?.status === "ready"
      ? field.asyncState.loadMore
      : field?.asyncState?.action;
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
            {/* No cast. `children` is `LumoNode` now that the function arm is
                gone, and the cast was what let the two disagree. */}
            {children}
          </BaseSelect.List>
          {stateText === null && stateAction === undefined ? null : (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-fg-muted">
              <span role="status" aria-live="polite">
                {stateText}
              </span>
              {stateAction === undefined ? null : (
                <Button variant="outline" size="sm" onPress={stateAction.onPress}>
                  {stateAction.label}
                </Button>
              )}
            </div>
          )}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

/**
 * One option. The check mark sits at the inline end (`ms-auto`) so it mirrors.
 * `textValue` maps onto Base UI's `label`; it is re-derived from a string child
 * so the SERVER-rendered markup, which has no DOM to read, carries it too.
 */
interface SelectItemBaseProps<T extends object = object> {
  /** TYPE CARRIER, NOT A PROP — see `SelectProps.items`, including why the
   *  spelling is `(T & never) | undefined` and not `T & never`. */
  value?: (T & never) | undefined;
  /** The item's key. Maps to Base UI's `value`. */
  id?: string | undefined;
  isDisabled?: boolean | undefined;
  className?: string | undefined;
}

/** The ordinary option: its visible text IS its label. */
interface StringChildProps {
  children: string;
  textValue?: undefined;
}

/** An option whose row is markup — a city beside a «تکمیل ظرفیت» note. */
interface RichChildProps {
  children?: LumoNode;
  /**
   * Typeahead string, AND the text the collapsed control reads when this item
   * is selected. REQUIRED in this arm: markup children offer no label to derive.
   */
  textValue: string;
}

export type SelectItemProps<T extends object = object> = SelectItemBaseProps<T> &
  (StringChildProps | RichChildProps);

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
      className={cn(selectItemVariants(), className)}
      {...(id === undefined ? {} : { value: id })}
      {...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
    >
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/*
       * `aria-hidden`: selection is already announced via `aria-selected`.
       * `ms-auto` sits on the indicator because it renders nothing when unselected.
       */}
      <BaseSelect.ItemIndicator className="ms-auto flex items-center">
        <Check aria-hidden="true" className="text-accent" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

/**
 * A named block of related options. One part with a required `label` rather
 * than shadcn's Group + Label split: a part cannot be required, and an unnamed
 * `role="group"` is worse than none. `aria-labelledby` is minted here from
 * `useId` rather than waited for — Base UI publishes the label id from a layout
 * effect, and `Select.Group` merges caller props after its defaults, so the
 * explicit id wins on the first render.
 */
export interface SelectGroupProps {
  /**
   * Announced name of the group, e.g. «استان تهران». REQUIRED — an unnamed
   * group is a node every option inside it reports membership of.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
  /** Classes for the visible heading, when the group box is not what you mean. */
  labelClassName?: string | undefined;
}

export function SelectGroup({ label, className, labelClassName, children }: SelectGroupProps) {
  const labelId = useId();
  return (
    <BaseSelect.Group
      data-lumo=""
      aria-labelledby={labelId}
      {...(className === undefined ? {} : { className })}
    >
      <BaseSelect.GroupLabel
        id={labelId}
        className={cn(selectGroupLabelVariants(), labelClassName)}
      >
        {label}
      </BaseSelect.GroupLabel>
      {children}
    </BaseSelect.Group>
  );
}

export interface SelectSeparatorProps {
  className?: string | undefined;
}

/**
 * A rule between two groups. Decoration only: Base UI renders
 * `role="presentation"` so screen readers do not count it as a listbox child.
 * Not a substitute for a group.
 */
export function SelectSeparator({ className }: SelectSeparatorProps) {
  return <BaseSelect.Separator className={cn(selectSeparatorVariants(), className)} />;
}
