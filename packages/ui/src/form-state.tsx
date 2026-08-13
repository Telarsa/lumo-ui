"use client";

import { useForm, revalidateLogic } from "@tanstack/react-form";
import { formatNumber, parseNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Form, type FormProps } from "./form.tsx";

/**
 * Form STATE: values, validity, submission. The chrome is `form.tsx`.
 *
 *     const form = useLumoForm({
 *       defaultValues: { email: "", age: "" },
 *       onSubmit: async ({ value }) => save(value),
 *     });
 *     const v = lumoValidators(locale, messages);
 *
 *     <LumoForm form={form}>
 *       <form.Field name="email" validators={{ onDynamic: v.required() }}>
 *         {(field) => <TextField label="ایمیل" {...fieldControl(field, locale)} />}
 *       </form.Field>
 *       <Button type="submit">ثبت</Button>
 *     </LumoForm>
 *
 * ═══ WHY THIS IS A SEPARATE FILE FROM form.tsx ══════════════════════════════
 *
 * `form.tsx` is a shared companion: `text-field.tsx`, `checkbox.tsx`,
 * `switch.tsx`, `select.tsx` and eight others copy it with them. Putting the
 * state layer there would make `@tanstack/react-form` a declared dependency of
 * every one of those registry items — a consumer who copies `checkbox` to get a
 * checkbox would be told to install a form library. So the state layer is its
 * own item, and it depends on `form.tsx` rather than the other way round.
 *
 * ═══ WHY TANSTACK FORM AND NOT REACT HOOK FORM, FORMIK, OR OUR OWN ══════════
 *
 * The acceptance test is the one `table.tsx` and `virtual-list.tsx` already
 * passed: **a state dependency may not own markup, roles, ARIA or focus,
 * because Lumo has exactly one accessibility dependency and a second one is how
 * a library ends up with two opinions about the same tab stop.**
 *
 * TanStack Form passes it in the strongest available sense. Verified against
 * the published 1.33.4 tarballs, runtime `.js` only (see pnpm-workspace.yaml
 * for the full record):
 *
 *     aria-* attributes emitted        0
 *     role attributes emitted          0
 *     host elements rendered           0   — every jsx() call is a Fragment,
 *                                            a Context.Provider, or one of the
 *                                            library's own components
 *     user-facing English strings      0
 *
 * That last row is the Persian-first argument and it is the exact INVERSE of
 * React Aria's. React Aria ships 34 locale bundles of announced strings, `fa`
 * is not among them, and closing the leaks took a measured sweep and a props
 * contract (`packages/core/src/strings.ts`). TanStack Form ships no announced
 * strings at all — `<form.Field>` renders a Fragment, so it contributes ZERO
 * BYTES to the served HTML and there is nothing to translate.
 *
 * **Nothing to translate is a stronger property than translatable.** A library
 * that ships strings can add one in a patch release, behind our back, in
 * English; a library that renders no text cannot.
 *
 * ═══ SSR ════════════════════════════════════════════════════════════════════
 *
 * The whole Base UI migration exists because Base UI resolves accessibility
 * relationships in a LAYOUT EFFECT, which does not run on the server. So the
 * first thing checked here was whether TanStack Form has the same shape, and it
 * does not:
 *
 *   - `useForm` and `useField` read state from the store DURING RENDER.
 *   - Their `useIsomorphicLayoutEffect` calls only `mount()` and `update()`.
 *     (That hook is `useEffect` on the server, i.e. a no-op, and `useLayoutEffect`
 *     in the browser.)
 *   - The form id comes from React's own `useId`.
 *
 * So `defaultValues` are in the first byte, and a server-rendered form is a
 * filled-in form rather than an empty one. `form-state.test.tsx` pins this by
 * rendering to static markup, not by trusting the reading.
 *
 * ═══ WHAT LUMO ADDS, WHICH IS THE PART TANSTACK DELIBERATELY DOES NOT DO ════
 *
 * Three things, and each closes a defect that is invisible in review:
 *
 *   1. `lumoValidators(locale, messages)` — caller-authored messages in the reader's language, and
 *      numeric comparison that survives Persian digits. `Number("۱۸")` is NaN,
 *      so a `min(18)` written the obvious way rejects every Persian user who
 *      typed their own numerals. See the validators' own docblock.
 *
 *   2. `fieldControl(field, locale)` — turns a TanStack field into the props a
 *      Lumo control already takes, INCLUDING `errorMessage`, so the error is
 *      associated with its input by `<Field>`'s server-safe wiring rather than
 *      merely drawn near it.
 *
 *   3. `LumoForm` — moves focus to the first invalid control after a rejected
 *      submit. This is not a nicety. `Form` emits `noValidate` (Base UI does it
 *      unconditionally, and `form.tsx` explains why that is correct for a
 *      Persian page), which switches OFF the browser's own "jump to the first
 *      invalid field". Without a replacement, submitting a long form leaves
 *      focus on the button while the error appears off-screen above it — WCAG
 *      3.3.1, and completely invisible to a sighted reviewer with a short form.
 */

export { revalidateLogic };

/* ════════════════════════════════════════════════════════════════════════════
 * THE FORM
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The form's state. A thin, deliberate wrapper over `useForm`.
 *
 * Like `useLumoTable`, it adds exactly one thing and hides nothing: the return
 * value IS TanStack's form API, so `form.Field`, `form.Subscribe`,
 * `form.handleSubmit` and everything else in TanStack's documentation works
 * unchanged, and this wrapper cannot drift into a second API that has to be
 * kept in step with the first. **Field names stay type-checked against
 * `defaultValues`**, which is the main reason the field bridge below is a plain
 * function rather than a `<FormField>` component — a component would have to
 * re-declare TanStack's generics, and would lose exactly that.
 *
 * ── THE ONE ADDITION: `revalidateLogic()` AS THE DEFAULT ───────────────────
 *
 * TanStack's default validation logic runs `onChange` validators from the first
 * keystroke, so a required-field error appears while the user is still typing
 * the first letter of a field they have not finished. `revalidateLogic()`
 * validates on SUBMIT first and only then revalidates on change — the
 * behaviour every usability guideline asks for, and TanStack ships it as an
 * opt-in.
 *
 * Making it the default here is the same argument `lumoTableFeatures` makes: a
 * consumer who forgets to opt in gets wrong behaviour with no error. Pass
 * `validationLogic` explicitly to choose otherwise; it is a normal option and
 * this only supplies a default.
 *
 * **It renames the validator key.** Under `revalidateLogic` the validator that
 * participates is `onDynamic` (and `onDynamicAsync`), not `onChange` — that is
 * TanStack's design, not Lumo's, and it is stated here because a validator
 * written as `onChange` under this default simply never runs, silently. Every
 * example in this file and in `examples/form-state.tsx` uses `onDynamic`.
 *
 * ── WHY IT IS DECLARED AS `typeof useForm` RATHER THAN AS A FUNCTION ───────
 *
 * `useForm` carries FIFTEEN type parameters — the form data plus a pair
 * (sync/async) for each of `onMount`, `onChange`, `onBlur`, `onSubmit`,
 * `onDynamic` and the server-side ones — and every one of them is inferred from
 * the `validators` object at the call site. Writing this as an ordinary generic
 * function means restating all fifteen, and the first attempt did not compile
 * (TS2344 / TS2635): the constraint cannot be expressed without reproducing
 * TanStack's own declaration.
 *
 * Restating them badly would be worse than not restating them, because the
 * failure mode is silent — a collapsed generic turns `name="emial"` from a
 * compile error into `any`, and type-checked field names are most of what a
 * typed form library is for. So the signature is BORROWED whole. The body is
 * cast because a cast is the honest way to say "the types here are TanStack's,
 * not this file's"; the value it produces is genuinely `useForm`'s, with one
 * extra default merged in.
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
 * A `<form>` wired to a `useLumoForm` instance.
 *
 * `preventDefault` then `handleSubmit()`, then focus the first invalid control
 * — see the file header for why that last step is required rather than nice.
 *
 * The element is captured into a local BEFORE the await. `currentTarget` is
 * only meaningful during dispatch, and reading it after an `await` is the
 * classic way to get `null` here in a way that fails only for forms slow
 * enough to validate asynchronously.
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
 * Move focus to the first invalid control inside `root`, in DOCUMENT order.
 *
 * Document order and not visual order, deliberately. Under `dir="rtl"` the two
 * differ for anything laid out in a row, and the reading order a keyboard and a
 * screen reader both follow is the DOM's. Sorting by bounding box would be the
 * plausible-looking wrong answer.
 *
 * Matches `[data-lumo][aria-invalid="true"]`: `data-lumo` is the marker every
 * Lumo control carries, and `aria-invalid` is what `<Field invalid>` puts
 * there. It finds them by the same attribute assistive technology uses rather
 * than by a private class.
 *
 * ── WHY IT ITERATES INSTEAD OF TAKING THE FIRST MATCH ──────────────────────
 *
 * The first version took `querySelector` and focused it. That is wrong, and the
 * test written to catch it did:
 *
 *     <div data-lumo aria-invalid="true">     ← matched, and focused NOTHING
 *       <input data-lumo aria-invalid="true"> ← the element that should focus
 *
 * `data-lumo` rides on the WRAPPER as well as the control in several components
 * (`text-field.tsx` puts it on both, deliberately — see `form.tsx`'s note on
 * `FieldInput`), and Base UI propagates `aria-invalid` down the whole field. So
 * the first match is routinely a `<div>`, `.focus()` on an element with no
 * tabindex is a silent no-op, and the symptom is indistinguishable from "the
 * form had no errors". A defect that presents as the feature simply not running
 * is the kind this repository writes poison twins for.
 *
 * `tabIndex >= 0` is the predicate rather than a list of tag names, because the
 * browser already computes exactly this: an `<input>` reports 0 without any
 * attribute, a bare `<div>` reports -1, and a `<div tabindex="0">` — which a
 * custom control legitimately is — reports 0. A hand-maintained tag list would
 * be wrong for the third case and would need editing every time a control
 * changes its host element.
 *
 * Returns whether anything was focused, so a caller can fall back to its own
 * summary. Safe to call on the server: it does nothing without an element.
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

/* ════════════════════════════════════════════════════════════════════════════
 * THE FIELD BRIDGE
 *
 * The same enforcement seam as table.tsx: the interface below names exactly the
 * members this file reads, and a TanStack field satisfies it structurally. A
 * props object, a `role`, a ref callback or a keydown handler cannot arrive
 * through it, because there is no member for one to arrive on.
 * ═══════════════════════════════════════════════════════════════════════════ */

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
 * Turn a TanStack field into the props a Lumo control already accepts.
 *
 *     {(field) => <TextField label="ایمیل" {...fieldControl(field, locale)} />}
 *
 * ── `errorMessage`, NOT AN ERROR RENDERED BESIDE THE CONTROL ───────────────
 *
 * The whole reason this returns `errorMessage` rather than the caller drawing
 * the error themselves: `<Field>` threads it into the control's
 * `aria-describedby` and sets `aria-invalid` DURING RENDER, so a
 * server-rendered invalid field is announced as invalid in the first byte. An
 * error drawn as a sibling `<p>` looks identical and is announced by nothing —
 * the half of the defect that has a violation count of zero in every instrument
 * this project owns (see `form.tsx`'s note on `Description`).
 *
 * ── ONLY AFTER THE USER HAS LEFT THE FIELD ─────────────────────────────────
 *
 * `isBlurred` gates the message. `revalidateLogic` already delays the first
 * validation until submit, but after a rejected submit it revalidates on every
 * keystroke, and an error that flickers on and off mid-word is both a poor
 * experience and a live-region announcement per character for anyone using a
 * screen reader. Gating on blur keeps the announcement to one per field.
 *
 * `isTouched` would be the wrong gate: it goes true on the first change, which
 * is exactly the flicker this avoids.
 *
 * ── THE LOCALE ARGUMENT ────────────────────────────────────────────────────
 *
 * Taken and currently used only to normalise errors that arrive as numbers.
 * `LumoNode` bans a bare number from JSX precisely because `{count}` renders
 * Latin digits on a Persian page, and a validator returning a number instead of
 * a message is a real (if unusual) way for one to get there. It is formatted
 * rather than rejected, because refusing to render a validation error is worse
 * than rendering it in the wrong script.
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
 * The first error in a TanStack error array, as a string.
 *
 * TanStack does not constrain what a validator returns — it collects whatever
 * came back. So this handles the three shapes that actually occur: a plain
 * string (what `lumoValidators` returns), a Standard Schema issue (`{ message }`,
 * what Zod/Valibot/ArkType return through `standardSchemaValidators`), and
 * anything else, which is stringified rather than dropped.
 *
 * Exported because a caller rendering their own error summary needs the same
 * normalisation, and two spellings of it would drift.
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

/* ════════════════════════════════════════════════════════════════════════════
 * ENTERPRISE FORM ADAPTERS
 * ═══════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════════
 * THE VALIDATORS
 * ═══════════════════════════════════════════════════════════════════════════ */

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
 * Characters that are present in Persian text and are not characters a reader
 * would count.
 *
 * U+200C ZERO WIDTH NON-JOINER is the big one: it separates the parts of
 * «می‌رود» and «کتاب‌ها» and appears in ordinary Persian prose at a rate of
 * roughly one per several words. `"می‌رود".length` is 6, and a reader counting
 * the letters they typed gets 5. A `minLength(5)` that a Persian user passes
 * and an English user fails for the same visible input is the kind of defect
 * nobody reports because it looks like the rule simply being strict.
 *
 * The bidi marks are here for the same reason and a second one: they are
 * INVISIBLE, so a value that is nothing but direction marks would otherwise
 * satisfy `required`.
 */
const UNCOUNTED = /[‌‎‏؜‪-‮⁦-⁩]/g;

/**
 * The visible length of a string, in the units a reader counts.
 *
 * `Array.from` and not `.length`: `.length` counts UTF-16 code units, so an
 * emoji or any astral character counts as two. That is wrong in every language
 * and is simply never noticed in English prose.
 */
export function visibleLength(value: string): number {
  return Array.from(value.replace(UNCOUNTED, "")).length;
}

/**
 * Interpolates `{n}` with a locale-formatted number — never a Latin digit on a
 * Persian page.
 *
 * `formatNumber` and not a bare `new Intl.NumberFormat(locale)`: `format.ts`
 * states the reason and it applies here unchanged. `FORMAT_LOCALE` carries an
 * explicit `-u-nu-arabext`, so «۲٬۰۰۰» is guaranteed rather than left to
 * whichever numbering system the host runtime happens to default `fa-IR` to.
 * The failure it prevents — «Must be at least 2,000» rendered in ASCII under a
 * Persian label — is exactly the kind that appears on one deployment target and
 * not another.
 */
/**
 * Iranian national ID (کد ملی) check digit.
 *
 * Ten digits, weighted sum of the first nine against 10…2, remainder mod 11.
 * A remainder under 2 must equal the check digit; otherwise the check digit is
 * `11 − r`. Ten repetitions of one digit satisfy the arithmetic and are not
 * issued, so they are rejected explicitly — the one case a naive implementation
 * always accepts.
 *
 * Shorter inputs are LEFT-PADDED rather than rejected: codes beginning with a
 * zero are real, and are routinely stored and pasted without it.
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
 * Validators that speak the reader's language and survive the reader's digits.
 *
 * ═══ THE DIGIT PROBLEM, WHICH IS THE REASON THIS EXISTS ════════════════════
 *
 * A Persian user with a Persian keyboard types «۱۸». `Number("۱۸")` is `NaN`.
 * So `min(18)` written the obvious way — `Number(value) < 18` — rejects the
 * value, and reports «نباید کمتر از ۱۸ باشد» under an input that visibly
 * contains ۱۸. It is not a rounding error or an edge case: it is every numeric
 * field, for every user who types in their own numerals, and it passes review
 * because the reviewer's keyboard produces ASCII.
 *
 * Every numeric validator below goes through `parseNumber` from
 * `@lumo-ui/core`, which builds its digit map by ASKING the formatter which
 * characters it produces rather than hardcoding U+06F0–06F9, and which also
 * folds the U+066C thousands separator and U+066B decimal mark that
 * `formatNumber` emits. So a value this library formatted is a value this
 * library can read back.
 *
 * ═══ WHAT THESE ARE NOT ════════════════════════════════════════════════════
 *
 * Not a schema library, and deliberately not competing with one. TanStack Form
 * speaks Standard Schema, so Zod, Valibot and ArkType all plug straight into
 * `validators` with no adapter. These exist for the cases a schema library
 * handles in English and cannot handle for Persian at all: the digit folding
 * above, and the two national formats below.
 *
 * Each takes an optional per-field override that wins over the required
 * caller-authored catalogue.
 */
export function lumoValidators(locale: Locale, messages: LumoValidatorMessages) {
  const empty = (value: unknown) =>
    value == null ||
    value === false ||
    (typeof value === "string" && visibleLength(value.trim()) === 0) ||
    (Array.isArray(value) && value.length === 0);

  /**
   * Runs `check` only on a value that is present.
   *
   * Every rule except `required` is vacuously true for an empty field, so that
   * an optional field does not report «قالب واردشده معتبر نیست» merely for
   * being left alone. Composing `required` alongside is how a field becomes
   * mandatory, which keeps the two decisions separate at the call site.
   */
/**
   * Runs `check` only on a value that is present.
   *
   * `unknown` and not a generic the caller pins to `string`, which is what the
   * first version did. A form field's value is genuinely `string | null |
   * undefined` — TanStack hands over whatever `defaultValues` declared, and a
   * field with no default is `undefined` — so a validator typed to take a
   * `string` is a validator that does not type-check against the values it will
   * actually receive. Found by a test that passed `null` through every rule.
   *
   * Each rule coerces with `String(value)` after the guard, which only ever
   * sees a value the guard already called present.
   */
  const whenPresent =
    (check: (value: unknown) => string | undefined): LumoValidator =>
    ({ value }) =>
      empty(value) ? undefined : check(value);

  const digits = (value: unknown) =>
    String(value ?? "")
      .replace(UNCOUNTED, "")
      // Persian and Arabic-Indic digits to ASCII, plus the separators a phone
      // number is pasted with. `parseNumber` is the right tool for a QUANTITY;
      // an ID is a digit STRING, where grouping means nothing and a leading
      // zero is significant.
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

    /** A parseable number, in EITHER numbering system. See the header. */
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

    /**
     * An email address.
     *
     * One `@`, something before it, and a dot-bearing domain after — the same
     * shape the HTML specification's own `type="email"` regex accepts, and
     * deliberately not stricter. An address is validated by sending mail to it;
     * a regex that rejects a real address is a worse failure than one that
     * accepts a fake one, and the ones that reject tend to reject
     * newer TLDs and tagged addresses.
     */
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

    /**
     * Iranian national ID (کد ملی).
     *
     * Persian digits are folded first, so a user typing «۰۰۱۲۳۴۵۶۷۸» on a
     * Persian keyboard is checked rather than rejected — the digit problem in
     * the header, in the field where it bites hardest, because a national ID is
     * the one number an Iranian user is most likely to type in Persian
     * numerals.
     */
    nationalId: (message?: string) =>
      whenPresent((value) =>
        isValidNationalId(digits(value)) ? undefined : (message ?? messages.nationalId),
      ),

    /**
     * Iranian mobile number.
     *
     * Accepts `09xxxxxxxxx`, `+989xxxxxxxxx` and `00989xxxxxxxxx`, in either
     * numbering system, with or without the spaces and dashes people paste. All
     * three normalise to the same eleven digits; which one the user typed is
     * not information worth failing over.
     */
    mobile: (message?: string) =>
      whenPresent((value) => {
        const normalised = digits(value).replace(/^(98|0098)/, "0");
        return /^09\d{9}$/.test(normalised) ? undefined : (message ?? messages.mobile);
      }),

    /**
     * Every rule in order, first message wins.
     *
     * TanStack runs ONE validator per event, so composing is the caller's job
     * and this is the composition. Order is the order the messages should be
     * reported in — `required` first, or an empty field reports its format.
     */
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
