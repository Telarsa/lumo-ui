"use client";

import { useForm, revalidateLogic } from "@tanstack/react-form";
import { formatNumber, parseNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Form, type FormProps } from "./form.tsx";

/**
 * Form STATE: values, validity, submission. The chrome is `form.tsx`, which is
 * a shared companion of a dozen controls; the state layer is its own registry
 * item so copying `checkbox` does not install a form library. TanStack Form
 * owns no markup, ARIA, focus or strings (zero bytes in the served HTML), and
 * reads state during render, so `defaultValues` are in the first byte. Lumo
 * adds `lumoValidators` (Persian-digit-safe), `fieldControl` (errors wired via
 * `<Field>`, not drawn beside), and `LumoForm` (focus the first invalid control
 * after a rejected submit, since `noValidate` disables the browser's jump).
 * Long form: `docs/decisions/log.md`.
 */

export { revalidateLogic };

/* THE FORM */

/**
 * The form's state: `useForm` with `revalidateLogic()` as the default, so
 * validation runs on SUBMIT first and revalidates on change. Under it the
 * participating validator key is `onDynamic`, not `onChange`, which never runs.
 * Declared as `typeof useForm` because restating its fifteen inferred type
 * parameters would silently collapse type-checked field names to `any`.
 */
export const useLumoForm = ((options: Parameters<typeof useForm>[0]) =>
  useForm({
    validationLogic: revalidateLogic(),
    ...options,
  } as Parameters<typeof useForm>[0])) as unknown as typeof useForm;

/** What `LumoForm` needs from a form instance. Nothing that returns markup. */
export interface LumoFormInstance {
  handleSubmit: () => Promise<void>;
}

export interface LumoFormProps extends Omit<FormProps, "onSubmit"> {
  /** The instance from `useLumoForm`. */
  form: LumoFormInstance;
  children?: LumoNode;
}

/**
 * A `<form>` wired to a `useLumoForm` instance: `handleSubmit()`, then focus
 * the first invalid control. `currentTarget` is captured BEFORE the await.
 */
export function LumoForm({ form, children, ...props }: LumoFormProps) {
  return (
    <Form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const element = event.currentTarget;
        void form.handleSubmit().then(() => focusFirstInvalid(element));
      }}
    >
      {children}
    </Form>
  );
}

/**
 * Move focus to the first invalid control inside `root`, in DOCUMENT order
 * (not visual: under RTL they differ). Iterates rather than taking the first
 * match, because `data-lumo` + `aria-invalid` also land on wrapper `<div>`s
 * where `.focus()` is a silent no-op; `tabIndex >= 0` is the focusability
 * predicate. Returns whether anything was focused. Safe on the server.
 */
export function focusFirstInvalid(root: HTMLElement | null | undefined): boolean {
  if (!root) return false;
  const candidates = root.querySelectorAll<HTMLElement>('[data-lumo][aria-invalid="true"]');
  for (const candidate of candidates) {
    if (candidate.tabIndex < 0) continue;
    if ((candidate as HTMLElement & { disabled?: boolean }).disabled === true) continue;
    candidate.focus();
    return true;
  }
  return false;
}

/* THE FIELD BRIDGE — the same structural seam as table.tsx: only the members this file reads. */

/** What `fieldControl` needs from a TanStack field. */
export interface LumoFormField<TValue = unknown> {
  name: string;
  state: {
    value: TValue;
    meta: { errors: readonly unknown[]; isTouched: boolean; isBlurred: boolean };
  };
  handleChange: (value: TValue) => void;
  handleBlur: () => void;
}

/** The props a Lumo control takes. Every field control in the library accepts these. */
export interface LumoFieldControl<TValue> {
  name: string;
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
  errorMessage?: string | undefined;
  isInvalid?: boolean | undefined;
}

/**
 * Turn a TanStack field into the props a Lumo control already accepts,
 * INCLUDING `errorMessage` so `<Field>` wires `aria-describedby`/`aria-invalid`
 * during render. Gated on `isBlurred`, not `isTouched`, so the message does not
 * flicker per keystroke after a rejected submit. `locale` formats numeric errors.
 */
export function fieldControl<TValue>(
  field: LumoFormField<TValue>,
  locale: Locale,
): LumoFieldControl<TValue> {
  const message = field.state.meta.isBlurred
    ? firstError(field.state.meta.errors, locale)
    : undefined;
  return {
    name: field.name,
    value: field.state.value,
    onChange: field.handleChange,
    onBlur: field.handleBlur,
    ...(message === undefined ? {} : { errorMessage: message, isInvalid: true }),
  };
}

/**
 * The first error in a TanStack error array, as a string: a plain string, a
 * Standard Schema issue (`{ message }`), or anything else stringified.
 */
export function firstError(errors: readonly unknown[], locale: Locale): string | undefined {
  for (const error of errors) {
    if (error == null) continue;
    if (typeof error === "string") return error === "" ? undefined : error;
    if (typeof error === "number") return formatNumber(error, locale);
    if (typeof error === "object" && "message" in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === "string" && message !== "") return message;
    }
    return String(error);
  }
  return undefined;
}

/* ENTERPRISE FORM ADAPTERS */

export interface LumoFormSubmissionState {
  isDirty: boolean;
  isTouched: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
}

/** Stable projection for `<form.Subscribe selector={formSubmissionState}>`. */
export function formSubmissionState(state: LumoFormSubmissionState): LumoFormSubmissionState {
  return {
    isDirty: state.isDirty,
    isTouched: state.isTouched,
    isSubmitting: state.isSubmitting,
    canSubmit: state.canSubmit,
  };
}

export interface LumoListField<TItem> {
  name: string;
  state: { value: readonly TItem[] };
  pushValue: (value: TItem) => void;
  removeValue: (index: number) => void;
  moveValue: (from: number, to: number) => void;
}

export interface LumoListFieldControl<TItem> {
  name: string;
  items: readonly TItem[];
  append: (value: TItem) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
}

/** Typed list/nested-field bridge; operations stay owned by TanStack Form. */
export function listFieldControl<TItem>(field: LumoListField<TItem>): LumoListFieldControl<TItem> {
  return {
    name: field.name,
    items: field.state.value,
    append: field.pushValue,
    remove: field.removeValue,
    move: field.moveValue,
  };
}

export interface LumoStandardSchemaIssue {
  message: string;
  path?: readonly unknown[] | undefined;
}

export interface LumoStandardSchema<TInput> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: TInput,
    ) =>
      | { value: unknown; issues?: undefined }
      | { issues: readonly LumoStandardSchemaIssue[] }
      | Promise<
          | { value: unknown; issues?: undefined }
          | { issues: readonly LumoStandardSchemaIssue[] }
        >;
  };
}

/** Standard Schema adapter that returns its caller-authored issues unchanged. */
export function lumoStandardSchema<TInput>(schema: LumoStandardSchema<TInput>) {
  return async ({ value }: { value: TInput }): Promise<readonly LumoStandardSchemaIssue[] | undefined> => {
    const result = await schema["~standard"].validate(value);
    return "issues" in result && result.issues !== undefined ? result.issues : undefined;
  };
}

export type LumoLatestAsyncValidator<TValue> = (context: {
  value: TValue;
  signal: AbortSignal;
}) => Promise<string | undefined>;

/**
 * Cancels the preceding remote field check and suppresses stale completion.
 * Transport and prose remain caller-owned; Lumo owns only request ordering.
 */
export function createLatestAsyncValidator<TValue>(
  validate: LumoLatestAsyncValidator<TValue>,
): (context: { value: TValue }) => Promise<string | undefined> {
  let active: AbortController | undefined;
  let generation = 0;
  return async ({ value }) => {
    active?.abort();
    const controller = new AbortController();
    active = controller;
    const ownGeneration = ++generation;
    const result = await validate({ value, signal: controller.signal });
    return ownGeneration === generation && !controller.signal.aborted ? result : undefined;
  };
}

/* THE VALIDATORS */

/**
 * Every entry is required because every returned error may be announced. The
 * library supplies validation arithmetic, digit folding and formatted numeric
 * inputs; the caller supplies all application prose.
 */
export interface LumoValidatorMessages {
  required: string;
  minLength: (formattedMinimum: string) => string;
  maxLength: (formattedMaximum: string) => string;
  min: (formattedMinimum: string) => string;
  max: (formattedMaximum: string) => string;
  number: string;
  email: string;
  pattern: string;
  nationalId: string;
  mobile: string;
}

/** A TanStack validator: given the field's value, a message or nothing. */
export type LumoValidator<TValue = unknown> = (context: {
  value: TValue;
}) => string | undefined;

/**
 * Characters present in Persian text that a reader would not count: ZWNJ
 * (inside ordinary compound words) and the invisible bidi marks, which would
 * otherwise satisfy `required` on their own.
 */
const UNCOUNTED = /[‌‎‏؜‪-‮⁦-⁩]/g;

/** The visible length of a string, in the units a reader counts (code points, not UTF-16 units). */
export function visibleLength(value: string): number {
  return Array.from(value.replace(UNCOUNTED, "")).length;
}

/**
 * Iranian national ID (کد ملی) check digit: weighted sum of the first nine
 * digits mod 11. Ten repetitions of one digit are rejected explicitly; shorter
 * inputs are LEFT-PADDED because codes beginning with zero are real.
 */
export function isValidNationalId(digits: string): boolean {
  if (!/^\d{1,10}$/.test(digits)) return false;
  const id = digits.padStart(10, "0");
  if (/^(\d)\1{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(id[i]) * (10 - i);
  const remainder = sum % 11;
  const check = Number(id[9]);
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

/**
 * Validators that speak the reader's language and survive the reader's
 * digits: `Number("۱۸")` is NaN, so every numeric rule goes through
 * `parseNumber`. Not a schema library — Standard Schema plugs in directly;
 * these cover what a schema library cannot do for Persian. Each takes an
 * optional per-field message override.
 */
export function lumoValidators(locale: Locale, messages: LumoValidatorMessages) {
  const empty = (value: unknown) =>
    value == null ||
    value === false ||
    (typeof value === "string" && visibleLength(value.trim()) === 0) ||
    (Array.isArray(value) && value.length === 0);

  // Runs `check` only on a present value: every rule except `required` is
  // vacuously true for an empty field. `unknown`, not `string` — a field's
  // value is genuinely `string | null | undefined`.
  const whenPresent =
    (check: (value: unknown) => string | undefined): LumoValidator =>
    ({ value }) =>
      empty(value) ? undefined : check(value);

  const digits = (value: unknown) =>
    String(value ?? "")
      .replace(UNCOUNTED, "")
      // Digits to ASCII plus pasted separators. Not `parseNumber`: an ID is a
      // digit STRING where a leading zero is significant.
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\s\-()+.]/g, "");

  return {
    required:
      (message?: string): LumoValidator =>
      ({ value }) =>
        empty(value) ? (message ?? messages.required) : undefined,

    minLength: (n: number, message?: string) =>
      whenPresent((value) =>
        visibleLength(String(value)) < n
          ? (message ?? messages.minLength(formatNumber(n, locale)))
          : undefined,
      ),

    maxLength: (n: number, message?: string) =>
      whenPresent((value) =>
        visibleLength(String(value)) > n
          ? (message ?? messages.maxLength(formatNumber(n, locale)))
          : undefined,
      ),

    /** A parseable number, in EITHER numbering system. */
    number: (message?: string) =>
      whenPresent((value) =>
        Number.isNaN(parseNumber(String(value), locale))
          ? (message ?? messages.number)
          : undefined,
      ),

    min: (n: number, message?: string) =>
      whenPresent((value) => {
        const parsed = parseNumber(String(value), locale);
        if (Number.isNaN(parsed)) return messages.number;
        return parsed < n ? (message ?? messages.min(formatNumber(n, locale))) : undefined;
      }),

    max: (n: number, message?: string) =>
      whenPresent((value) => {
        const parsed = parseNumber(String(value), locale);
        if (Number.isNaN(parsed)) return messages.number;
        return parsed > n ? (message ?? messages.max(formatNumber(n, locale))) : undefined;
      }),

    /** An email address: the HTML `type="email"` shape, deliberately not stricter. */
    email: (message?: string) =>
      whenPresent((value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
          ? undefined
          : (message ?? messages.email),
      ),

    pattern: (expression: RegExp, message?: string) =>
      whenPresent((value) =>
        expression.test(String(value)) ? undefined : (message ?? messages.pattern),
      ),

    /** Iranian national ID (کد ملی). Persian digits are folded first. */
    nationalId: (message?: string) =>
      whenPresent((value) =>
        isValidNationalId(digits(value)) ? undefined : (message ?? messages.nationalId),
      ),

    /** Iranian mobile number: `09…`, `+989…` or `00989…`, in either numbering system. */
    mobile: (message?: string) =>
      whenPresent((value) => {
        const normalised = digits(value).replace(/^(98|0098)/, "0");
        return /^09\d{9}$/.test(normalised) ? undefined : (message ?? messages.mobile);
      }),

    /** Every rule in order, first message wins. TanStack runs ONE validator per event; put `required` first. */
    all:
      <TValue,>(...rules: LumoValidator<TValue>[]): LumoValidator<TValue> =>
      (context) => {
        for (const rule of rules) {
          const message = rule(context);
          if (message !== undefined) return message;
        }
        return undefined;
      },
  };
}
