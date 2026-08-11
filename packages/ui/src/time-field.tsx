"use client";

import { useId, useRef } from "react";
import { Field } from "@base-ui/react/field";
import { attr } from "@lumo-ui/base-ui-ssr";
import { cn, type LumoNode } from "@lumo-ui/core";
import { dateInputVariants } from "./calendar.variants.ts";
import { DateInput, type DateInputHandle, type DateInputSize } from "./date-input.tsx";
import { useTimeFieldState, type TimeFields } from "./date-field-state.ts";
import {
  descriptionVariants,
  fieldErrorVariants,
  fieldVariants,
  labelVariants,
  optional,
} from "./form.tsx";
import { useLumoLocale } from "./locale.ts";

export { dateInputVariants };

/**
 * A time typed segment by segment: ۲۳:۴۵.
 *
 * ═══ OFF REACT ARIA, ONTO THE SAME INPUT THE DATE FIELD USES ════════════════
 *
 * This file used to render React Aria's `<DateInput>` around `renderSegment`,
 * which meant the library shipped two segmented inputs with different keyboard
 * behaviour: Lumo's, inside `date-field.tsx`, and upstream's, here and in both
 * pickers. Now there is one — `date-input.tsx` — and an hour slot and a day
 * slot cannot drift apart because they are the same component.
 *
 * The arithmetic behind it is `useTimeFieldState`, a SECOND engine rather than
 * a `granularity` flag on the date one. They share their interface and almost
 * nothing else: a time has no calendar, no Esfand to be 29 or 30 days long, no
 * leap rule and no `toValue` that can refuse. 24 hours is 24 hours in every
 * calendar system ever built.
 *
 * ═══ THE VALUE IS THREE NUMBERS, NOT A `Time` ══════════════════════════════
 *
 * `onChange` hands back `{ hour, minute, second }` — the structural shape
 * `@internationalized/date`'s `Time` already satisfies, so
 * `new Time(v.hour, v.minute, v.second)` is one line at a call site that wants
 * one. Taking the class as the public type would put a runtime dependency in
 * the signature of a component whose whole job is three integers, and this
 * library's rule for a dependency is that owning it must FIX a defect.
 *
 * ═══ THE HOUR CYCLE IS THE LOCALE'S DECISION ════════════════════════════════
 *
 * Not defaulted here. fa-IR resolves to a 24-hour clock on its own and
 * `useTimeFieldState` asks `Intl` rather than assuming; hard-coding either
 * clock is the same class of mistake as writing `dir` by hand. Pass `hourCycle`
 * only when a product genuinely requires one clock everywhere, and know that
 * doing so overrides a user-visible convention.
 *
 * When a 12-hour cycle IS in force, a `dayPeriod` segment appears. Its VALUES
 * come from `Intl.DateTimeFormat.formatToParts` — «قبل‌ازظهر» / «بعدازظهر» —
 * and its NAME comes from `strings.ts`, because no API produces the name of a
 * part. Typing into it takes the first LETTER of either period in the reader's
 * own script; `date-input.tsx` matches against the texts the engine read out of
 * `Intl`, so neither file knows an alphabet.
 *
 * ═══ BOUNDS ════════════════════════════════════════════════════════════════
 *
 * `minValue`/`maxValue` are not accepted at all any more, rather than being
 * accepted and ignored. React Aria's bounds made an English, Latin-digited
 * `validationErrors` string reachable — the defect `strings.ts` documents at
 * length — and there is no validation engine here to replace it with. A prop
 * that silently does nothing is worse than an absent one: absent is a compile
 * error at the call site, and silent is a bug report six months later.
 * `errorMessage` remains, and it is the caller's own sentence.
 *
 * `"use client"`: the segment values are state.
 */
export interface TimeFieldProps {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** Controlled value. Any `{hour, minute, second}` — a `Time` satisfies it. */
  value?: TimeFields | null | undefined;
  defaultValue?: TimeFields | null | undefined;
  /** Fires with three numbers, or `null` while any segment is empty. */
  onChange?: ((value: TimeFields | null) => void) | undefined;
  /**
   * How much of the time is editable. `minute` by default — a seconds segment
   * nobody asked for is a fourth tab stop on every time field.
   */
  granularity?: "hour" | "minute" | "second" | undefined;
  /** Overrides the locale's own clock. See the header before reaching for it. */
  hourCycle?: 12 | 24 | undefined;
  description?: LumoNode;
  /** Supplying one marks the field invalid. The sentence is yours. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  size?: DateInputSize;
  className?: string | undefined;
  /** Classes for the segment box itself. */
  inputClassName?: string | undefined;
}

export function TimeField({
  label,
  value,
  defaultValue,
  onChange,
  granularity,
  hourCycle,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isReadOnly,
  size,
  className,
  inputClassName,
}: TimeFieldProps) {
  const locale = useLumoLocale();

  const state = useTimeFieldState({
    locale,
    ...optional("value", value),
    ...optional("defaultValue", defaultValue),
    ...optional("onChange", onChange),
    ...optional("granularity", granularity),
    ...optional("hourCycle", hourCycle),
    ...optional("isDisabled", isDisabled),
    ...optional("isReadOnly", isReadOnly),
  });

  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const invalid = isInvalid ?? (errorMessage != null ? true : undefined);
  const inputRef = useRef<DateInputHandle>(null);

  /*
   * Wired by hand, in RENDER. Base UI's `Field` associates its label and
   * description in a LAYOUT EFFECT, so neither association exists in the served
   * bytes — measured on this branch and recorded in `date-field.tsx`'s header.
   */
  const describedBy =
    [description != null ? descriptionId : null, errorMessage != null ? errorId : null]
      .filter((id): id is string => id != null)
      .join(" ") || undefined;

  return (
    <Field.Root
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...attr("disabled", isDisabled)}
      {...attr("invalid", invalid)}
    >
      {/*
       * `nativeLabel={false}` with a `<span>` render, exactly as `date-field.tsx`
       * argues: a `<label for>` may only name a labelable element, and this is a
       * `role="group"` of spinbuttons.
       */}
      <Field.Label
        id={labelId}
        nativeLabel={false}
        render={<span />}
        className={labelVariants()}
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        {label}
      </Field.Label>

      <DateInput
        ref={inputRef}
        state={state}
        locale={locale}
        labelId={labelId}
        {...optional("describedBy", describedBy)}
        {...optional("isDisabled", isDisabled)}
        {...optional("isReadOnly", isReadOnly)}
        {...optional("isInvalid", invalid)}
        {...optional("size", size)}
        {...optional("className", inputClassName)}
      />

      {description != null ? (
        <Field.Description id={descriptionId} className={descriptionVariants()}>
          {description}
        </Field.Description>
      ) : null}

      {/*
       * A plain element rather than `Field.Error`: Base UI's error part matches
       * against a native control's `ValidityState`, and there is no native
       * control here.
       */}
      {errorMessage != null ? (
        <div id={errorId} className={fieldErrorVariants()}>
          {errorMessage}
        </div>
      ) : null}
    </Field.Root>
  );
}
