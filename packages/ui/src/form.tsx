"use client";

import { cva } from "class-variance-authority";
import {
  FieldError as AriaFieldError,
  type FieldErrorProps as AriaFieldErrorProps,
  Form as AriaForm,
  type FormProps as AriaFormProps,
  Label as AriaLabel,
  type LabelProps as AriaLabelProps,
  Text as AriaText,
  type TextProps as AriaTextProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * The field chrome every form control in Lumo is built from: the wrapper, the
 * label, the help text, the error, and the `<form>` itself.
 *
 * These live in one file rather than being restated per component so the vertical
 * rhythm of a field is decided once. Every other file in this batch imports from
 * here; a registry item that copies `text-field.tsx` copies `form.tsx` with it.
 */

/**
 * The field wrapper.
 *
 * `flex-col` and `gap` rather than margins on the children: a stack that never
 * touches the inline axis cannot mirror wrongly, and there is no `mb-1` on a
 * label waiting to become `ml-1` when someone reformats it.
 *
 * The disabled treatment sits HERE, on the wrapper that React Aria marks with
 * `data-disabled`, not on each child. One rule dims the label, the control and
 * the description together; stacking `opacity-50` on a child of an already-dimmed
 * parent multiplies to 0.25 and reads as broken rather than disabled.
 */
export const fieldVariants = cva("flex flex-col gap-1.5 data-disabled:opacity-60");

export const labelVariants = cva("w-fit text-sm font-medium text-fg select-none");

export const descriptionVariants = cva("text-sm text-fg-muted");

export const fieldErrorVariants = cva("text-sm text-critical");

export const formVariants = cva("flex flex-col gap-4");

/**
 * The focus ring, restated for controls that cannot use the shared one.
 *
 * `theme.css` defines the ring once as `:where([data-lumo]):focus-visible`, which
 * covers every control that is itself focusable — a text input, a button. It does
 * NOT cover Checkbox, Radio or Switch: their focusable element is a visually
 * hidden `<input>` clipped to a 1px box, and an outline on a clipped element is
 * invisible. React Aria surfaces the state on the visible wrapper instead, as
 * `data-focus-visible`, so the ring is re-derived here — from the SAME tokens, so
 * a brand that changes `--lumo-sys-focus` still moves it, and via an arbitrary
 * property so the declaration is character-for-character what theme.css emits.
 *
 * Uses the `group-*` form because the attribute lands on the wrapping `<label>`
 * while the ring belongs on the indicator inside it.
 */
export const FOCUS_RING =
  "group-data-focus-visible:[outline:var(--lumo-sys-focus-width)_solid_var(--lumo-sys-focus)] " +
  "group-data-focus-visible:[outline-offset:var(--lumo-sys-focus-offset)]";

/**
 * Spread an attribute only when it has a value.
 *
 * `exactOptionalPropertyTypes` is on, and React Aria declares its props as
 * `placeholder?: string` — "absent, or a string", NOT "string | undefined". So
 * `<Input placeholder={maybeUndefined} />` is a compile error even though it is
 * harmless at runtime, and the honest fix is to omit the key rather than to widen
 * every declaration with a cast.
 *
 * Every composed component here hoists a few attributes onto an inner element
 * (`placeholder` onto `<Input>`, `isInvalid` onto the field root), so this shows
 * up often enough to be worth naming once.
 */
export function optional<K extends string, V>(
  key: K,
  value: V | undefined,
): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}

/**
 * A form.
 *
 * `validationBehavior` defaults to `"aria"`, which deliberately differs from
 * React Aria's own default of `"native"`. Native constraint validation renders
 * the BROWSER's message ("Please fill out this field."), and the browser picks
 * that string from the browser UI language — not from `<html lang>`. A Persian
 * page opened in an English-chrome browser therefore shows an English error under
 * a Persian label, and it is invisible in review because the reviewer's browser is
 * usually set to the same language as the page.
 *
 * The trade-off is stated rather than hidden: `"aria"` marks fields invalid for
 * assistive technology but does not block submission, so validation must come
 * from a `validate` prop or the server. Pass `validationBehavior="native"`
 * explicitly on a route that is English-only and wants the browser's blocking.
 */
export interface FormProps extends Omit<AriaFormProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Form({ className, validationBehavior = "aria", ...props }: FormProps) {
  return (
    <AriaForm
      data-lumo=""
      className={cn(formVariants(), className)}
      validationBehavior={validationBehavior}
      {...props}
    />
  );
}

/**
 * A field label.
 *
 * `w-fit` is not cosmetic. A `<label>` is a block box, so a full-width label makes
 * the whole line clickable — including the empty inline-end run, which in Persian
 * is the LEFT side of the field. Shrinking it to its text keeps the hit area on
 * the words in both directions.
 */
export interface LabelProps extends Omit<AriaLabelProps, "children"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Label({ className, ...props }: LabelProps) {
  return <AriaLabel className={cn(labelVariants(), className)} {...props} />;
}

/**
 * Help text under a control.
 *
 * Rendered through React Aria's `<Text slot="description">` rather than a bare
 * `<p>`: the slot is what wires it into the control's `aria-describedby`, so the
 * text is announced with the field instead of being decorative markup a screen
 * reader never reaches.
 */
export interface DescriptionProps extends Omit<AriaTextProps, "children"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Description({ className, ...props }: DescriptionProps) {
  return (
    <AriaText slot="description" className={cn(descriptionVariants(), className)} {...props} />
  );
}

/**
 * A validation error.
 *
 * React Aria renders this only when the field is invalid, and falls back to the
 * collected `validationErrors` when given no children. That fallback is the reason
 * `Form` defaults to `validationBehavior="aria"`: under `"native"` those strings
 * are the browser's own, in the browser's language.
 */
export interface FieldErrorProps extends Omit<AriaFieldErrorProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function FieldError({ className, ...props }: FieldErrorProps) {
  return <AriaFieldError className={cn(fieldErrorVariants(), className)} {...props} />;
}
