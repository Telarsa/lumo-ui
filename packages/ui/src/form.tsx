"use client";

import {
  createContext,
  useContext,
  type ComponentProps,
  type ComponentPropsWithoutRef,
} from "react";
import { cva } from "class-variance-authority";
import { Field as BaseField } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import { Form as BaseForm } from "@base-ui/react/form";
import {
  cn,
  type DOMProps,
  type GlobalDOMAttributes,
  type LumoNode,
  type StyleProps,
} from "@lumo-ui/core";
import { useFieldWiring, type FieldWiring, type FieldWiringMode } from "@lumo-ui/base-ui-ssr";

/**
 * The field chrome every form control is built from: wrapper, label, help
 * text, error, and the `<form>`. Base UI associates label and control in a
 * LAYOUT EFFECT, which does not run on the server, so `<Field>` calls
 * `useFieldWiring` once during render and publishes it on a context that
 * `<Label>`/`<Description>`/`<FieldError>` and `useFieldControl()` read.
 * Outside a `<Field>` those parts render plain elements with no wiring (Base
 * UI's parts THROW outside `Field.Root`). Long form: `docs/decisions/log.md`.
 */

/**
 * The field wrapper. `gap` rather than child margins (nothing to mirror), and
 * the disabled dimming sits HERE so it is not multiplied on children.
 */
export const fieldVariants = cva("flex flex-col gap-1.5 data-disabled:opacity-50");

export const labelVariants = cva("w-fit text-sm font-medium text-fg select-none");

export const descriptionVariants = cva("text-sm text-fg-muted");

export const fieldErrorVariants = cva("text-sm text-critical");

export const formVariants = cva("flex flex-col gap-4");

/**
 * The focus ring, for a control that IS its own focusable element: the same
 * declarations and tokens as `theme.css`'s `:where([data-lumo]):focus-visible`.
 * `:focus-visible`, not Base UI's `data-focused`, which fires on mouse click;
 * the old `group-data-focus-visible` constant could not render on Base UI and is gone.
 */
export const FOCUS_RING_SELF =
  "focus-visible:[outline:var(--lumo-sys-focus-width)_solid_var(--lumo-sys-focus)] " +
  "focus-visible:[outline-offset:var(--lumo-sys-focus-offset)]";

/** Spread an attribute only when it has a value — `exactOptionalPropertyTypes` rejects an explicit `undefined`. */
export function optional<K extends string, V>(
  key: K,
  value: V | undefined,
): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}

/** The wiring one `<Field>` computed, for the parts inside it. `null` outside a `<Field>`; consumers branch, never throw. */
interface FieldChrome extends FieldWiring {
  /** Whether an error is being rendered, so `FieldError` can render nothing. */
  hasError: boolean;
}

const FieldChromeContext = createContext<FieldChrome | null>(null);

/**
 * The props a control must spread to be named and described in the FIRST BYTE.
 * Empty outside a `<Field>`, where whatever wraps the control owns the association.
 */
export function useFieldControl(): FieldWiring["controlProps"] {
  return useContext(FieldChromeContext)?.controlProps ?? {};
}

/**
 * The `<input>` for a text-shaped field, already wired. Its own component
 * because the component that RENDERS `<Field>` cannot read the context it
 * provides. `data-lumo` here because this is the element that takes focus.
 */
export type FieldInputProps = ComponentProps<typeof BaseInput>;

export function FieldInput(props: FieldInputProps) {
  const control = useFieldControl();
  return <BaseInput data-lumo="" {...control} {...props} />;
}

export interface FieldProps {
  /** The label's CONTENT, not a rendered label — an id is minted only for content that renders. */
  label?: LumoNode;
  /** The description's content, on the same terms. */
  description?: LumoNode;
  /** The error's content, on the same terms. */
  errorMessage?: LumoNode;
  /** The caller's own props, read for `aria-label`/`aria-labelledby`/`aria-describedby`; an explicit name suppresses the wiring. */
  explicit?: Record<string, unknown> | undefined;
  /** `"aria"` (default) when THIS component renders the label; `"native"` when the consumer does. See `FieldWiringMode`. */
  mode?: FieldWiringMode | undefined;
  isDisabled?: boolean | undefined;
  /** Overrides the validity Base UI derives. Left undefined, a supplied `errorMessage` marks the field invalid. */
  isInvalid?: boolean | undefined;
  /** Identifies the field when a form is submitted. */
  name?: string | undefined;
  /** Custom validation. Returns the message(s), or `null` when valid. */
  validate?:
    | ((value: unknown) => string | string[] | null | Promise<string | string[] | null>)
    | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One field: Base UI `Field.Root` (validity, disabled state) fused with the
 * server-safe wiring (first-byte names and descriptions).
 */
export function Field({
  label,
  description,
  errorMessage,
  explicit,
  mode,
  isDisabled,
  isInvalid,
  name,
  validate,
  className,
  children,
}: FieldProps) {
  const wiring = useFieldWiring({
    label,
    description,
    errorMessage,
    explicit,
    ...optional("mode", mode),
  });

  return (
    <FieldChromeContext.Provider value={{ ...wiring, hasError: errorMessage != null }}>
      <BaseField.Root
        data-lumo=""
        className={cn(fieldVariants(), className)}
        disabled={isDisabled ?? false}
        {...optional("name", name)}
        {...optional("invalid", isInvalid ?? (errorMessage != null ? true : undefined))}
        {...optional(
          "validate",
          validate === undefined ? undefined : (value: unknown) => validate(value),
        )}
      >
        {children}
      </BaseField.Root>
    </FieldChromeContext.Provider>
  );
}

/**
 * A form. `"aria"` (default) emits `noValidate`, because native constraint
 * validation shows the BROWSER's message in the browser's UI language — an
 * English error under a Persian label. `"native"` re-enables it. `"aria"` does
 * not block submission; validation comes from `validate` or the server.
 */
export type FormValidationBehavior = "aria" | "native";

export interface FormProps
  extends Omit<ComponentPropsWithoutRef<"form">, "children" | "className" | "noValidate"> {
  children?: LumoNode;
  className?: string | undefined;
  /** See the docblock. `"aria"` by default; `"native"` re-enables the browser. */
  validationBehavior?: FormValidationBehavior | undefined;
}

export function Form({ className, validationBehavior = "aria", ...props }: FormProps) {
  return (
    <BaseForm
      data-lumo=""
      className={cn(formVariants(), className)}
      noValidate={validationBehavior === "aria"}
      {...props}
    />
  );
}

/**
 * A field label. `w-fit` keeps the hit area on the words, not the empty
 * inline-end run. Inside a `<Field>` it is `Field.Label` carrying the wiring;
 * outside, a bare `<label>` with none.
 */
export interface LabelProps
  extends Omit<ComponentProps<"label">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
  /** `false` when there is no single labelable control (a radio group); renders a `<span>` named via `aria-labelledby`. */
  nativeLabel?: boolean | undefined;
}

export function Label({
  className,
  nativeLabel,
  ...props
}: LabelProps) {
  const chrome = useContext(FieldChromeContext);
  if (chrome === null) {
    // A plain element, not a Base UI part: `Field.Label` throws outside `Field.Root`.
    if (nativeLabel === false) {
      return <span className={cn(labelVariants(), className)} {...props} />;
    }
    return <label className={cn(labelVariants(), className)} {...props} />;
  }
  return (
    <BaseField.Label
      className={cn(labelVariants(), className)}
      {...(nativeLabel === false ? { nativeLabel: false as const, render: <span /> } : {})}
      {...chrome.labelProps}
      {...props}
    />
  );
}

/**
 * Help text under a control. Its id is minted by `<Field>` and pushed into
 * `aria-describedby` during RENDER; Base UI publishes the reference from a
 * layout effect, so a server-rendered description would be announced by nothing.
 */
export interface DescriptionProps
  extends Omit<ComponentProps<"p">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Description({ className, ...props }: DescriptionProps) {
  const chrome = useContext(FieldChromeContext);
  if (chrome === null) {
    return <span className={cn(descriptionVariants(), className)} {...props} />;
  }
  return (
    <BaseField.Description
      className={cn(descriptionVariants(), className)}
      {...chrome.descriptionProps}
      {...props}
    />
  );
}

/**
 * A validation error. `match` is passed because the caller has already
 * decided; without it an authored message is absent from the first byte.
 * Returns `null` for absent children so no empty `<div>` shifts the layout.
 */
export interface FieldErrorProps
  extends DOMProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  children?: LumoNode;
  className?: string | undefined;
}

// Caller DOM props are spread BEFORE the owned error wiring, so its id cannot be replaced.
export function FieldError({
  className,
  children,
  ...props
}: FieldErrorProps) {
  const chrome = useContext(FieldChromeContext);
  if (chrome === null) {
    return null;
  }
  if (children == null) return null;
  return (
    <BaseField.Error
      match
      className={cn(fieldErrorVariants(), className)}
      {...props}
      {...chrome.errorProps}
    >
      {children}
    </BaseField.Error>
  );
}
