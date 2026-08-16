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
  Link,
  TextField,
  optional,
} from "@lumo-ui/ui";

/**
 * The two screens either side of "forgot your password": request a link, then
 * set a new one. Two components, not one switching on a `stage` prop, because
 * they are two ROUTES.
 *
 * `"use client"`: both take `onSubmit`. See sign-in.tsx for the block contract.
 * `status` is a prop the CALLER flips once the request resolves (same trade as
 * settings-form.tsx), and the confirmation screen reuses otp-verify.tsx's
 * resend mechanic, with `resendIn` a function of the ALREADY-FORMATTED seconds.
 */
export interface RequestPasswordResetStrings {
  /** The screen's heading. Rendered as the page `<h1>`. */
  title: string;
  description?: string | undefined;
  emailLabel: string;
  emailPlaceholder?: string | undefined;
  /** The submit button. */
  submit: string;
  /** Text of the link back to sign-in. Shown on both screens. */
  backToSignIn: string;
  /** Heading shown once the link has been sent. */
  sentTitle: string;
  /** Where the link was sent, e.g. «پیوند بازیابی به example@mail.com ارسال شد». A whole sentence: only the caller knows the address and whether it needs a `dir="ltr"` island. */
  sentDescription?: LumoNode;
  /** The resend control, once it is enabled. */
  resend: string;
  /** The disabled resend control, as a function of the ALREADY-FORMATTED remaining seconds. */
  resendIn: (seconds: string) => string;
}

export type RequestPasswordResetStatus = "idle" | "sent";

export interface RequestPasswordResetProps {
  strings: RequestPasswordResetStrings;
  /** Formats the resend countdown. Required whenever `resendAfterSeconds` is used. */
  locale: Locale;
  /** Target of the "back to sign in" link. */
  signInHref: string;
  /** Which screen to show. Default `"idle"` — see the file header. */
  status?: RequestPasswordResetStatus | undefined;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  /** Seconds until the link can be resent. `0` (or omitted) enables the control. */
  resendAfterSeconds?: number | undefined;
  onResend?: (() => void) | undefined;
  /** A failure — an unknown address, a rate limit — already translated. */
  error?: LumoNode;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function RequestPasswordReset({
  strings,
  locale,
  signInHref,
  status = "idle",
  onSubmit,
  resendAfterSeconds = 0,
  onResend,
  error,
  isPending = false,
  className,
}: RequestPasswordResetProps) {
  const isCountingDown = resendAfterSeconds > 0;

  return (
    <section className={cn("flex w-full justify-center px-4 py-12", className)}>
      <Card variant="outlined" className="w-full max-w-sm">
        {status === "sent" ? (
          <>
            <CardHeader>
              <h1 className="text-lg leading-snug font-semibold text-fg">{strings.sentTitle}</h1>
              {strings.sentDescription !== undefined ? (
                <CardDescription>{strings.sentDescription}</CardDescription>
              ) : null}
            </CardHeader>

            <CardBody className="flex flex-col gap-4">
              <div className="flex justify-center">
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

              <p className="flex flex-wrap items-center justify-center gap-1 text-sm text-fg-muted">
                <Link href={signInHref} size="sm">
                  {strings.backToSignIn}
                </Link>
              </p>
            </CardBody>
          </>
        ) : (
          <>
            <CardHeader>
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
                  label={strings.emailLabel}
                  type="email"
                  name="email"
                  autoComplete="email"
                  isRequired
                  {...optional("placeholder", strings.emailPlaceholder)}
                />

                <Button type="submit" size="lg" isDisabled={isPending} className="w-full">
                  {strings.submit}
                </Button>
              </Form>

              <p className="mbs-4 flex flex-wrap items-center justify-center gap-1 text-sm text-fg-muted">
                <Link href={signInHref} size="sm">
                  {strings.backToSignIn}
                </Link>
              </p>
            </CardBody>
          </>
        )}
      </Card>
    </section>
  );
}

/**
 * Screen two: the reader has followed the emailed link and sets a new
 * password.
 *
 * No resend, no email field — the token in the URL authorises this screen and
 * rejecting an expired one is the caller's job. Field-level errors use the same
 * per-field shape as sign-up.tsx so the caller knows which field to focus.
 */
export interface SetNewPasswordStrings {
  /** The screen's heading. Rendered as the page `<h1>`. */
  title: string;
  description?: string | undefined;
  passwordLabel: string;
  passwordPlaceholder?: string | undefined;
  /** Password rules, shown under the field, e.g. «حداقل ۸ نویسه». */
  passwordHint?: string | undefined;
  confirmLabel: string;
  confirmPlaceholder?: string | undefined;
  /** The submit button. */
  submit: string;
}

export interface SetNewPasswordProps {
  strings: SetNewPasswordStrings;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  /** A server-side failure not tied to one field, already translated. */
  error?: LumoNode;
  /** Per-field errors, already translated. Keys are the field `name`s. */
  fieldErrors?: Readonly<Partial<Record<"password" | "confirm", LumoNode>>> | undefined;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function SetNewPassword({
  strings,
  onSubmit,
  error,
  fieldErrors,
  isPending = false,
  className,
}: SetNewPasswordProps) {
  return (
    <section className={cn("flex w-full justify-center px-4 py-12", className)}>
      <Card variant="outlined" className="w-full max-w-sm">
        <CardHeader>
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
              label={strings.passwordLabel}
              type="password"
              name="password"
              autoComplete="new-password"
              isRequired
              {...optional("placeholder", strings.passwordPlaceholder)}
              {...optional("description", strings.passwordHint)}
              {...optional("errorMessage", fieldErrors?.password)}
            />

            <TextField
              label={strings.confirmLabel}
              type="password"
              name="confirm"
              autoComplete="new-password"
              isRequired
              {...optional("placeholder", strings.confirmPlaceholder)}
              {...optional("errorMessage", fieldErrors?.confirm)}
            />

            <Button type="submit" size="lg" isDisabled={isPending} className="w-full">
              {strings.submit}
            </Button>
          </Form>
        </CardBody>
      </Card>
    </section>
  );
}
