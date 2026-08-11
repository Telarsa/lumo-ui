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
// TYPE-ONLY. The three RUNTIME imports this file used to carry — `FieldError`,
// `Label` and `Text` — are gone; see "THE REACT ARIA FALLBACK, AND WHAT
// REPLACED IT" below. The prop TYPES stay React Aria's because the public API
// may not change, and a type import is erased at build, so nothing of
// react-aria-components reaches a consumer's bundle through this file.
import type {
  FieldErrorProps as AriaFieldErrorProps,
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { useFieldWiring, type FieldWiring, type FieldWiringMode } from "@lumo-ui/base-ui-ssr";

/**
 * The field chrome every form control in Lumo is built from: the wrapper, the
 * label, the help text, the error, and the `<form>` itself.
 *
 * These live in one file rather than being restated per component so the vertical
 * rhythm of a field is decided once. Every other file in this batch imports from
 * here; a registry item that copies `text-field.tsx` copies `form.tsx` with it.
 *
 * ── WHAT THIS FILE BECAME ON THE BASE UI SWAP ───────────────────────────────
 *
 * Under React Aria this file was five wrappers and five cva strings. The label
 * reached the control by MAGIC: RAC's `Label` read `LabelContext`, RAC's
 * `TextField` provided it, and the association was invisible in the source and
 * correct in the bytes.
 *
 * Base UI has the same mechanism and resolves it in a LAYOUT EFFECT — which
 * does not run on the server. Measured on a 442-document static export of this
 * library: 98 controls served with no accessible name, self-healing on
 * hydration, invisible to jsdom, to Testing Library and to axe-in-a-browser.
 * `@lumo-ui/base-ui-ssr`'s `useFieldWiring` resolves it during render instead,
 * from public props only.
 *
 * The FIRST version of the migration called that hook once per component.
 * `checkbox.tsx`, `switch.tsx` and `number-field.tsx` each carry their own
 * `useFieldWiring(...)` plus four prop spreads, and each had to rediscover the
 * same three rules — that an explicit `aria-label` must suppress the naming
 * arm, that an id may only be minted for content that actually renders, and
 * that description and error share one `aria-describedby` in that order. Three
 * files, one argument, three chances to get it wrong.
 *
 * So the wiring moves HERE, to the one file every labelled control already
 * imports. `<Field>` calls the hook once and publishes the result on a Lumo
 * context; `<Label>`, `<Description>` and `<FieldError>` read it and need no
 * props at all; the control reads it with `useFieldControl()`. A component
 * built on `<Field>` is server-named by construction rather than by
 * remembering.
 *
 * ── THE REACT ARIA FALLBACK, AND WHAT REPLACED IT ──────────────────────────
 *
 * The previous version of this paragraph named an expiry: `Label`,
 * `Description` and `FieldError` fell back to React Aria's own components when
 * rendered OUTSIDE a Lumo `<Field>`, because `date-picker.tsx`,
 * `date-range-picker.tsx`, `time-field.tsx` and `date-field.tsx` were React Aria
 * roots that rendered these three as children and relied on RAC's `LabelContext`
 * / `TextContext` / `FieldErrorContext` to associate them.
 *
 * That expiry has arrived. The date family migrated (see
 * `experiments/in-flight/README.md`), and all four now compose
 * `Field.Root`/`Field.Label`/`Field.Description` by hand out of the cva strings
 * below rather than out of these components. Grepped, not assumed: the ONLY
 * caller of `<Label>` outside a Lumo `<Field>` left in the whole repository is
 * `<Select>`, in `select.tsx` and in the site's select examples. There are no
 * callers of `<Description>` or `<FieldError>` outside a `<Field>` at all.
 *
 * So the fallback is no longer React Aria's — it is a PLAIN ELEMENT plus a
 * Lumo-owned context, `FieldLabelContext`, that a non-`<Field>` wrapper uses to
 * hand `<Label>` the `id`/`htmlFor` pair it minted. Two measurements forced that
 * shape rather than "just use Base UI's part everywhere":
 *
 *   1. Base UI's Field parts THROW outside a `Field.Root` — verified by
 *      rendering, not by reading source: `renderToStaticMarkup(<Field.Label/>)`
 *      raises "Base UI: FieldRootContext is missing. Field parts must be placed
 *      within <Field.Root>." Same for `Field.Description` and `Field.Error`. A
 *      `<Select>` has no `Field.Root` — Base UI's Select is its own root — so
 *      the null-chrome branch cannot be a Base UI part.
 *
 *   2. The association still has to be in the SERVED BYTES, so it cannot be
 *      delegated to any layout effect on either engine. The ids arrive as props
 *      from `useFieldWiring`, already resolved during render.
 *
 * `FOCUS_RING` and `FOCUS_RING_SELF` below are still the shape of a library
 * mid-swap — `rating.tsx` needs the first, the form family needs the second —
 * and they say which is which.
 */

/**
 * The field wrapper.
 *
 * `flex-col` and `gap` rather than margins on the children: a stack that never
 * touches the inline axis cannot mirror wrongly, and there is no `mb-1` on a
 * label waiting to become `ml-1` when someone reformats it.
 *
 * The disabled treatment sits HERE, on the wrapper that the engine marks with
 * `data-disabled`, not on each child. One rule dims the label, the control and
 * the description together; stacking `opacity-50` on a child of an already-dimmed
 * parent multiplies to 0.25 and reads as broken rather than disabled.
 *
 * `data-disabled` survived the engine swap unchanged — it is the widest-reaching
 * state in Base UI and reaches `Field.Root`, the label, the control and the
 * description alike (`experiments/measurements/state-vocabulary.json`).
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
 * NOT cover a React Aria Checkbox, Radio or Switch: their focusable element is a
 * visually hidden `<input>` clipped to a 1px box, and an outline on a clipped
 * element is invisible. React Aria surfaces the state on the visible wrapper
 * instead, as `data-focus-visible`, so the ring is re-derived here — from the
 * SAME tokens, so a brand that changes `--lumo-sys-focus` still moves it, and via
 * an arbitrary property so the declaration is character-for-character what
 * theme.css emits.
 *
 * Uses the `group-*` form because the attribute lands on the wrapping `<label>`
 * while the ring belongs on the indicator inside it.
 */
export const FOCUS_RING =
  "group-data-focus-visible:[outline:var(--lumo-sys-focus-width)_solid_var(--lumo-sys-focus)] " +
  "group-data-focus-visible:[outline-offset:var(--lumo-sys-focus-offset)]";

/**
 * The same ring, for a control that IS its own focusable element.
 *
 * ── WHY THE ENGINE SWAP NEEDS A SECOND SPELLING (WCAG 2.4.7) ────────────────
 *
 * `FOCUS_RING` above is built on two facts that are both React Aria's, not the
 * platform's: that the focusable element of a Checkbox/Radio/Switch is a
 * visually hidden `<input>`, and that the modality-filtered state is published
 * as an attribute on the wrapping `<label>`. Base UI inverts BOTH:
 *
 *     Checkbox.Root / Radio.Root /  `tabindex="0"`, `role="checkbox"` /
 *     Switch.Root                   `role="radio"` / `role="switch"` — the
 *                                   VISIBLE box is the focusable element.
 *                                   Measured: probe entries `checkbox.focus`
 *                                   and `switch.focus` in
 *                                   experiments/measurements/probe.state-vocabulary.json.
 *     the hidden `<input>`          `tabindex="-1"`, `aria-hidden="true"` — it
 *                                   exists only to carry the form value.
 *     `data-focus-visible`          does not exist anywhere in the library. A
 *                                   grep of the installed dist finds zero.
 *
 * Base UI does publish `data-focused`, from `Field.Root` — and it is the WRONG
 * state to hang a ring on. `field/root/FieldRoot.mjs:46` sets it from plain
 * focus, with no modality filter, so a ring built on it appears on a MOUSE
 * click. That is the defect `:focus-visible` was standardised to remove, and
 * theme.css's header already states the project's position on it.
 *
 * So the correct Base UI spelling is neither a rename nor the nearest
 * attribute: it is CSS's own pseudo-class, applied to the element itself
 * because that element is now the one that takes focus. Same two declarations,
 * same tokens, same arbitrary-property spelling as theme.css — only the
 * selector moves.
 *
 * `FOCUS_RING` is kept and unchanged: `rating.tsx` is still React Aria and
 * still needs the `group-*` form. `radio-group.tsx` moved to this one with the
 * rest of the form family. The two constants are the shape of the migration
 * itself — a library mid-swap needs both.
 */
export const FOCUS_RING_SELF =
  "focus-visible:[outline:var(--lumo-sys-focus-width)_solid_var(--lumo-sys-focus)] " +
  "focus-visible:[outline-offset:var(--lumo-sys-focus-offset)]";

/**
 * Spread an attribute only when it has a value.
 *
 * `exactOptionalPropertyTypes` is on, and both engines declare their props as
 * `placeholder?: string` — "absent, or a string", NOT "string | undefined". So
 * `<Input placeholder={maybeUndefined} />` is a compile error even though it is
 * harmless at runtime, and the honest fix is to omit the key rather than to widen
 * every declaration with a cast.
 *
 * Every composed component here hoists a few attributes onto an inner element
 * (`placeholder` onto `<Input>`, `invalid` onto the field root), so this shows
 * up often enough to be worth naming once.
 */
export function optional<K extends string, V>(
  key: K,
  value: V | undefined,
): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}

/**
 * The wiring one `<Field>` computed, for the parts inside it.
 *
 * `null` outside a `<Field>`, and every consumer branches on that rather than
 * throwing — see the React Aria fallback in the file header. A throw here would
 * turn a mid-migration composition into a crash at the exact moment the point
 * is to keep both engines renderable in one tree.
 */
interface FieldChrome extends FieldWiring {
  /** Whether an error is being rendered, so `FieldError` can render nothing. */
  hasError: boolean;
}

const FieldChromeContext = createContext<FieldChrome | null>(null);

/**
 * The label wiring published by a wrapper that is NOT a Lumo `<Field>`.
 *
 * One consumer today, `<Select>`, and the direction of its arrow is the reason
 * this is a second context rather than a second `FieldChrome`. A `<Field>` wires
 * `"aria"` mode — the control points at the label — and can do that because it
 * is given the label's CONTENT and therefore knows one will render. A `<Select>`
 * wires `"native"` mode: the CONSUMER renders the `<Label>` as a sibling the
 * wrapper never sees, so the label carries `htmlFor` and the trigger carries the
 * matching `id`, and nothing dangles when no label is rendered at all. See
 * `FieldWiringMode` in `@lumo-ui/base-ui-ssr` for the full argument.
 *
 * Reusing `FieldChromeContext` for this would be worse than verbose, it would be
 * wrong: `<Description>` and `<FieldError>` branch on that context to decide
 * whether to render a Base UI `Field` part, and a Base UI `Field` part inside a
 * `<Select>` throws — there is no `Field.Root` above it. This context carries the
 * label pair and nothing else, so it cannot be mistaken for a field.
 *
 * It is deliberately NOT re-exported from the package barrel. It is the seam
 * between two files that already travel together in the registry, not a public
 * extension point; a consumer wanting this shape composes `useFieldWiring`.
 */
export const FieldLabelContext = createContext<FieldWiring["labelProps"] | null>(null);

/**
 * The props a control must spread to be named and described in the FIRST BYTE.
 *
 * Returns an empty object outside a `<Field>` — spreading nothing is exactly
 * right there, because whatever wraps the control owns the association instead.
 *
 *     const control = useFieldControl();
 *     <Input {...control} />
 */
export function useFieldControl(): FieldWiring["controlProps"] {
  return useContext(FieldChromeContext)?.controlProps ?? {};
}

/**
 * The `<input>` for a text-shaped field, already wired.
 *
 * It exists as its own component for a reason that is React's rather than the
 * engine's: a hook cannot be called by the component that RENDERS `<Field>` and
 * still read the context `<Field>` provides, because the provider is in the
 * returned tree rather than above the caller. One child is the cheapest seam
 * that keeps the wiring automatic instead of threaded by hand — and `TextField`,
 * `SearchField` and `InputGroup` are three components that would otherwise each
 * thread it, which is exactly the repetition this file exists to end.
 *
 * `data-lumo` here and not only on the wrapper: the wrapper is a `<div>` that
 * never receives focus, so the shared `:where([data-lumo]):focus-visible` rule
 * would never fire on it. The element that takes focus is the element that must
 * carry the marker.
 */
export type FieldInputProps = ComponentProps<typeof BaseInput>;

export function FieldInput(props: FieldInputProps) {
  const control = useFieldControl();
  return <BaseInput data-lumo="" {...control} {...props} />;
}

export interface FieldProps {
  /**
   * The label's CONTENT, not a rendered label. The hook needs to know whether a
   * label exists before deciding to point at one — an `aria-labelledby` minted
   * on a guess is a dangling idref, which is a different defect rather than a
   * fix.
   */
  label?: LumoNode;
  /** The description's content, on the same terms. */
  description?: LumoNode;
  /** The error's content, on the same terms. */
  errorMessage?: LumoNode;
  /**
   * The caller's own props, read for `aria-label`, `aria-labelledby` and
   * `aria-describedby`. Naming a control the caller already named is the one
   * way this can make things WORSE, so it never does.
   */
  explicit?: Record<string, unknown> | undefined;
  /**
   * `"aria"` (the default) when THIS component renders the label; `"native"`
   * when the consumer does and the arrow has to reverse. See `FieldWiringMode`
   * in `@lumo-ui/base-ui-ssr`.
   */
  mode?: FieldWiringMode | undefined;
  isDisabled?: boolean | undefined;
  /**
   * Overrides the validity Base UI derives. Left undefined, a supplied
   * `errorMessage` marks the field invalid on its own — a field carrying an
   * error message and reporting itself valid is a contradiction the caller
   * should not have to resolve by hand.
   */
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
 * One field: the Base UI `Field.Root` plus the server-safe wiring for
 * everything inside it.
 *
 * The two responsibilities are deliberately fused. `Field.Root` alone gives a
 * control its validity and disabled state and gives the label a DOM
 * association that only exists after hydration; the wiring alone gives the
 * first byte its names and descriptions but knows nothing about validity. A
 * component that took one and forgot the other would look right in every
 * instrument this repository owns.
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
 * A form.
 *
 * ── THE ENGLISH-ERROR ARGUMENT SURVIVED THE SWAP AND GOT CHEAPER ───────────
 *
 * Under React Aria this component overrode `validationBehavior` to `"aria"`,
 * against RAC's own default of `"native"`. Native constraint validation renders
 * the BROWSER's message ("Please fill out this field."), and the browser picks
 * that string from the browser UI language — not from `<html lang>`. A Persian
 * page opened in an English-chrome browser therefore shows an English error
 * under a Persian label, and it is invisible in review because the reviewer's
 * browser is usually set to the same language as the page.
 *
 * Base UI's `Form` emits `noValidate` unconditionally in its own default props
 * (`form/Form.mjs:91`), so the browser's messages are off by construction and
 * the override is no longer needed. The prop is KEPT rather than deleted, for
 * two reasons: consumers already pass it, and `"native"` is still reachable —
 * `noValidate` sits before the caller's props in Base UI's merge, so passing
 * `noValidate={false}` genuinely re-enables the browser. That is the honest
 * mapping, and it is the one route by which an English string can still reach a
 * Persian page from this component.
 *
 * The trade-off is stated rather than hidden: `"aria"` marks fields invalid for
 * assistive technology but does not block submission, so validation must come
 * from a `validate` prop or the server.
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
 * A field label.
 *
 * `w-fit` is not cosmetic. A `<label>` is a block box, so a full-width label makes
 * the whole line clickable — including the empty inline-end run, which in Persian
 * is the LEFT side of the field. Shrinking it to its text keeps the hit area on
 * the words in both directions.
 *
 * Inside a `<Field>` this is Base UI's `Field.Label` carrying the id the control
 * points at, so the name is in the served HTML. Outside one it is a plain
 * `<label>` carrying whatever `FieldLabelContext` published — see the file
 * header for why it cannot be a Base UI part there, and which one component
 * that branch is for.
 */
export interface LabelProps extends Omit<AriaLabelProps, "children" | "render"> {
  children?: LumoNode;
  className?: string | undefined;
  /**
   * `false` when there is no single labelable control to point a `<label for>`
   * at — a radio group, a checkbox group. The name then reaches the group
   * through `aria-labelledby` alone, and the element rendered is a `<span>`,
   * because Base UI errors in development on a `<label>` with
   * `nativeLabel={false}` and vice versa.
   */
  nativeLabel?: boolean | undefined;
}

export function Label({ className, nativeLabel, ...props }: LabelProps) {
  const chrome = useContext(FieldChromeContext);
  const external = useContext(FieldLabelContext);
  if (chrome === null) {
    /*
     * A plain element, not a Base UI part: `Field.Label` outside a `Field.Root`
     * throws (measured — see the file header), and a `<Select>` has no
     * `Field.Root` above it.
     *
     * `htmlFor` is dropped on the `<span>` arm. `nativeLabel={false}` is the
     * "there is no single labelable control" case, and `for` is only valid on a
     * `<label>`; emitting it on a span would be an attribute the parser drops
     * and a reader of the source would believe.
     *
     * The caller's own props go LAST so an explicit `id`/`htmlFor` still wins,
     * which is the behaviour RAC's `LabelContext` had through `useContextProps`.
     */
    const { htmlFor, ...idOnly } = external ?? {};
    if (nativeLabel === false) {
      return <span className={cn(labelVariants(), className)} {...idOnly} {...props} />;
    }
    return (
      <label
        className={cn(labelVariants(), className)}
        {...idOnly}
        {...optional("htmlFor", htmlFor)}
        {...props}
      />
    );
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
 * Help text under a control.
 *
 * The description's id is minted by `<Field>` and pushed into the control's
 * `aria-describedby` during RENDER. Base UI mints an id here too — it just
 * publishes the REFERENCE from a layout effect, so a server-rendered
 * description is announced by nothing. That half of the defect has a violation
 * count of zero in every instrument this project owns, because an
 * accessible-name rule grades names; the loss is real all the same (WCAG 1.3.1
 * / 4.1.2) and it is the half nobody was counting.
 */
export interface DescriptionProps extends Omit<AriaTextProps, "children"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Description({ className, ...props }: DescriptionProps) {
  const chrome = useContext(FieldChromeContext);
  if (chrome === null) {
    /*
     * Unreachable from anything in this repository — grepped, there is no
     * `<Description>` outside a `<Field>` — and kept as a plain `<span>` rather
     * than deleted, because deleting it would make a composition that used to
     * render text render a crash instead. A `<span>` is the element React Aria's
     * `<Text slot="description">` rendered, so a consumer who was already doing
     * this gets the same box and the same class. It carries NO id and nothing
     * points at it: outside a `<Field>` there is no wiring to read, and minting
     * an id here would produce a described-by target nobody references.
     */
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
 * A validation error.
 *
 * `match` is passed because the caller has already decided: this component is
 * rendered with an authored `errorMessage` or not at all, and Base UI's default
 * would additionally require its own validity machinery to have run — which on
 * the server it has not. Without `match`, an authored Persian error message is
 * simply absent from the first byte.
 *
 * Returning `null` for absent children keeps the call site
 * `<FieldError>{errorMessage}</FieldError>`, which every component in the
 * library already writes. React Aria rendered nothing for a valid field; Base
 * UI with `match` renders an empty `<div>`, and an empty error element under
 * every field is a visible layout shift rather than a no-op.
 */
export interface FieldErrorProps
  extends Omit<AriaFieldErrorProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/*
 * No rest parameter, unlike `Label` and `Description`. The Base UI arm below
 * never forwarded one — `BaseField.Error` is given `match`, the class and the
 * wiring and nothing else — and the React Aria arm that did forward it is gone.
 * Binding a `...props` nobody spreads would read as forwarding.
 */
export function FieldError({ className, children }: FieldErrorProps) {
  const chrome = useContext(FieldChromeContext);
  if (chrome === null) {
    /*
     * `null`, and that is BYTE-IDENTICAL to what React Aria did here rather than
     * a simplification of it. `FieldError.mjs` opens with
     * `if (!validation?.isInvalid) return null;` against a `FieldErrorContext`
     * that is `null` outside a RAC field or form — so outside a Lumo `<Field>`
     * this component has always rendered nothing at all, authored children
     * included. Unreachable from anything in this repository either way.
     */
    return null;
  }
  if (children == null) return null;
  return (
    <BaseField.Error
      match
      className={cn(fieldErrorVariants(), className)}
      {...chrome.errorProps}
    >
      {children}
    </BaseField.Error>
  );
}
