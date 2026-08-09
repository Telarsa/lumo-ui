"use client";

import type { FormEvent } from "react";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  Form,
  TextField,
  optional,
} from "@lumo-ui/ui";

/**
 * One-time-code entry: the SMS step every Iranian sign-in flow ends with.
 *
 * ═══ WHY THIS BLOCK EXISTS RATHER THAN "a TextField on a page" ══════════════
 *
 * Three Persian-specific decisions are baked in here, and every one of them is
 * something a hand-rolled OTP screen gets wrong:
 *
 *  1. **The input is `type="text"` with `inputMode="numeric"`, never
 *     `type="number"`.** `<input type="number">` REJECTS Persian digits: a user
 *     typing ۱۲۳۴ on a Persian keyboard produces an empty value, silently, with
 *     no validation message because the browser never accepted the keystrokes.
 *     `packages/core/src/format.ts` records the same finding and ships
 *     `parseNumber` for the round trip. React Aria's NumberField already does
 *     this internally; a raw numeric input does not.
 *
 *  2. **The resend countdown is a FUNCTION of the formatted number, not a
 *     template with a hole in it.** `resendIn: (seconds: string) => string`.
 *     This is the same shape `packages/core/src/strings.ts` uses for
 *     `numberField.decrease(label)`, and for the same reason: «۳۰ ثانیه دیگر»
 *     does not place its number where "Resend in 30s" places its own, so a
 *     `"Resend in {n}"` template forces Persian into English clause order. The
 *     argument is already a STRING because `formatNumber` has run — the block
 *     never hands a translator a raw `number` to render.
 *
 *  3. **The code is not centred with `text-center` and letter-spaced.** The
 *     usual OTP treatment (`tracking-[1em] text-center`) pushes the caret to a
 *     visually wrong position under `dir="rtl"`, because letter-spacing is
 *     applied after the trailing character in the physical writing direction.
 *     `text-start` plus the field's own padding is correct in both scripts, and
 *     the thing an OTP screen actually needs — big, unambiguous digits — comes
 *     from `size="lg"`.
 *
 * `"use client"`: `onSubmit` and `onResend` are function props. See sign-in.tsx.
 */
export interface OtpVerifyStrings {
  /** The screen's heading. Rendered as the page `<h1>`. */
  title: string;
  /**
   * Where the code was sent, e.g. «کد به ۰۹۱۲… پیامک شد».
   *
   * A whole sentence from the caller rather than a template plus a destination,
   * because the caller is the only party that knows whether the destination is
   * a phone number (which must be wrapped in `data-lumo-latn dir="ltr"` if it
   * is written in Latin digits) or an email address.
   */
  description?: LumoNode;
  codeLabel: string;
  codePlaceholder?: string | undefined;
  /** Help text under the field, e.g. «۶ رقم». */
  codeHint?: string | undefined;
  submit: string;
  /** The resend control, once it is enabled. */
  resend: string;
  /**
   * The disabled resend control, as a function of the ALREADY-FORMATTED
   * remaining seconds. See the file header for why this is a function.
   */
  resendIn: (seconds: string) => string;
}

export interface OtpVerifyProps {
  strings: OtpVerifyStrings;
  /** Formats the countdown. Required by design — see progress.tsx. */
  locale: Locale;
  /** How many characters the code has. Drives `maxLength`, nothing visible. */
  length?: number | undefined;
  /**
   * Seconds until the code can be resent. `0` (or omitted) enables the control.
   *
   * A number, not a formatted string, because this block owns the formatting —
   * that is the point of taking `locale`.
   */
  resendAfterSeconds?: number | undefined;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  onResend?: (() => void) | undefined;
  /** A wrong-code or expired-code failure, already translated. */
  error?: LumoNode;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function OtpVerify({
  strings,
  locale,
  length = 6,
  resendAfterSeconds = 0,
  onSubmit,
  onResend,
  error,
  isPending = false,
  className,
}: OtpVerifyProps) {
  const isCountingDown = resendAfterSeconds > 0;

  return (
    <section className={cn("flex w-full justify-center px-4 py-12", className)}>
      <Card variant="outlined" className="w-full max-w-sm">
        <CardHeader>
          {/* See sign-in.tsx: an auth screen is the page, so it owns the h1. */}
          <h1 className="text-lg leading-snug font-semibold text-fg">{strings.title}</h1>
          {strings.description !== undefined ? (
            <CardDescription>{strings.description}</CardDescription>
          ) : null}
        </CardHeader>

        <CardBody>
          <Form {...optional("onSubmit", onSubmit)}>
            {error !== undefined ? (
              <Alert tone="critical" live="assertive">
                {error}
              </Alert>
            ) : null}

            <TextField
              label={strings.codeLabel}
              name="code"
              // `type="text"` is load-bearing. See the file header: `type="number"`
              // discards Persian digits before React ever sees them.
              type="text"
              inputMode="numeric"
              // Lets iOS and Android offer the code straight from the SMS.
              autoComplete="one-time-code"
              maxLength={length}
              size="lg"
              isRequired
              {...optional("placeholder", strings.codePlaceholder)}
              {...optional("description", strings.codeHint)}
            />

            <Button type="submit" size="lg" isDisabled={isPending} className="w-full">
              {strings.submit}
            </Button>
          </Form>

          {/*
           * The resend control is OUTSIDE the `<Form>`: it is a second action,
           * not a second submit, and a `<button>` inside a form with no explicit
           * `type` submits it. `Button` from @lumo-ui/ui defaults RAC's
           * `type="button"`, but placing it outside makes the intent readable
           * without knowing that.
           */}
          <div className="mbs-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              isDisabled={isCountingDown}
              {...optional("onPress", onResend)}
            >
              {isCountingDown
                ? strings.resendIn(formatNumber(resendAfterSeconds, locale))
                : strings.resend}
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
