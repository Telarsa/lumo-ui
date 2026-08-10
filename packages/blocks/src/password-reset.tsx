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
 * they are two ROUTES — the link emailed to the reader points at a different
 * URL than the form that asked for it, and a single component pretending
 * otherwise would force both screens into one client bundle for no reason.
 *
 * `"use client"`: both take `onSubmit`. See sign-in.tsx for the block contract
 * this file obeys and for why the directive sits here rather than being
 * assumed.
 *
 * ── `RequestPasswordReset` OWNS A `status` PROP, LIKE `SettingsForm` ────────
 *
 * The email form and the "check your inbox" confirmation are the same screen
 * at the same URL — a reader who mistypes their address needs to see the
 * request form again without a client-side redirect happening first. So
 * `status` is a prop the CALLER flips once the request resolves, exactly the
 * trade `settings-form.tsx` makes for `"saved"`, rather than state this block
 * would otherwise have to invent and own itself.
 *
 * ── THE CONFIRMATION SCREEN GETS `OtpVerify`'S RESEND MECHANIC ──────────────
 *
 * A link can land in spam or simply never arrive, and "resend in 30s" is the
 * same affordance `otp-verify.tsx` ships for the identical reason: a disabled
 * control with no stated wait time reads as broken. See that file for why
 * `resendIn` is a function of the ALREADY-FORMATTED seconds rather than a
 * template with a hole in it.
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
  /**
   * Where the link was sent, e.g. «پیوند بازیابی به example@mail.com ارسال شد».
   *
   * A whole sentence from the caller, exactly as `OtpVerify.description` is —
   * only the caller knows the address, and whether it needs a `dir="ltr"`
   * island if it is written in Latin characters.
   */
  sentDescription?: LumoNode;
  /** The resend control, once it is enabled. */
  resend: string;
  /**
   * The disabled resend control, as a function of the ALREADY-FORMATTED
   * remaining seconds. See the file header.
   */
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
 * No resend, no email field — the token in the URL is what authorises this
 * screen, and rejecting an expired one before rendering it is the caller's
 * job, never this block's. Field-level errors use the same
 * `Readonly<Partial<Record<…, LumoNode>>>` shape `sign-up.tsx` uses for its
 * own two password fields, for the identical reason: "too weak" belongs on
 * `password`, "does not match" belongs on `confirm`, and folding both into one
 * `error` string loses which field to focus.
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
