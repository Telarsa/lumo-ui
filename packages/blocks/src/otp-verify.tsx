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
 * Three Persian-specific decisions are baked in: the input is `type="text"` +
 * `inputMode="numeric"` (`type="number"` silently REJECTS Persian digits); the
 * resend countdown is a function of the formatted number, not a template; and
 * the code is `text-start`, not letter-spaced/centred, because letter-spacing
 * misplaces the caret under `dir="rtl"`.
 *
 * `"use client"`: `onSubmit` and `onResend` are function props. See sign-in.tsx.
 */
export interface OtpVerifyStrings {
  /** The screen's heading. Rendered as the page `<h1>`. */
  title: string;
  /** Where the code was sent, e.g. «کد به ۰۹۱۲… پیامک شد». A whole sentence: only the caller knows whether the destination is a phone number or an email. */
  description?: LumoNode;
  codeLabel: string;
  codePlaceholder?: string | undefined;
  /** Help text under the field, e.g. «۶ رقم». */
  codeHint?: string | undefined;
  submit: string;
  /** The resend control, once it is enabled. */
  resend: string;
  /** The disabled resend control, as a function of the ALREADY-FORMATTED remaining seconds. */
  resendIn: (seconds: string) => string;
}

export interface OtpVerifyProps {
  strings: OtpVerifyStrings;
  /** Formats the countdown. Required by design — see progress.tsx. */
  locale: Locale;
  /** How many characters the code has. Drives `maxLength`, nothing visible. */
  length?: number | undefined;
  /** Seconds until the code can be resent. `0` (or omitted) enables the control. A number: this block owns the formatting. */
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
              // `type="text"` is load-bearing: `type="number"` discards Persian digits.
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
           * The resend control is OUTSIDE the `<Form>`: a second action, not a second submit.
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
