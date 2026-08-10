"use client";

import type { FormEvent } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  Checkbox,
  Form,
  TextField,
  optional,
} from "@lumo-ui/ui";

/**
 * The authenticator-app challenge: a TOTP code, or a printed recovery code.
 *
 * ═══ READ `otp-verify.tsx` FIRST — THIS IS NOT THAT SCREEN RENAMED ══════════
 *
 * `OtpVerify` is the SMS/email step: the SERVER generated a code and sent it
 * somewhere, so "resend" is a real, useful control and `resendAfterSeconds` is
 * the whole point of that file. Nothing here is server-issued. A TOTP code is
 * derived independently, on the reader's own device, from a shared secret and
 * the current time — there is nothing to resend, and a "didn't get a code?"
 * affordance on this screen would be actively misleading. So this component:
 *
 *  1. Has NO resend, NO countdown and NO `locale` prop — there is no number to
 *     format anywhere on this screen, unlike `OtpVerify`'s formatted seconds.
 *  2. Offers a SECOND, mutually exclusive input mode: a printed recovery code
 *     for the reader who has lost the device the authenticator app was on.
 *     `mode` is a controlled prop rather than internal state — the same trade
 *     `settings-form.tsx` makes for `status` — because it is the CALLER who
 *     knows whether recovery codes are even enabled for this account.
 *  3. Carries a "remember this device" checkbox with TRUST semantics, not
 *     `SignIn.rememberLabel`'s "keep me signed in": the two controls persist
 *     different things (a device fingerprint that skips this whole screen next
 *     time, versus a session cookie's lifetime), and a product legitimately
 *     ships both, on different screens, in the same flow.
 *
 * The TOTP field keeps `OtpVerify`'s digit treatment — `type="text"
 * inputMode="numeric"`, see that file for why `type="number"` silently
 * discards Persian digits before React ever sees them. The recovery field
 * does not: a recovery code is typically alphanumeric, not a decimal number.
 *
 * `"use client"`: `onSubmit` is a callback.
 */
export type TwoFactorMode = "totp" | "recovery";

export interface TwoFactorStrings {
  /** The screen's heading. Rendered as the page `<h1>`. */
  title: string;
  description?: LumoNode;
  codeLabel: string;
  codePlaceholder?: string | undefined;
  /** Help text under the code field, e.g. «۶ رقم برنامهٔ احرازهویت را وارد کنید». */
  codeHint?: string | undefined;
  recoveryLabel: string;
  recoveryPlaceholder?: string | undefined;
  recoveryHint?: string | undefined;
  /** The submit button. */
  submit: string;
  /** Visible label of the "trust this device" checkbox. */
  rememberDevice: string;
  /** Switches the form to the recovery-code field. */
  useRecoveryCode: string;
  /** Switches the form back to the authenticator-code field. */
  useAuthenticatorApp: string;
}

export interface TwoFactorProps {
  strings: TwoFactorStrings;
  /** Which field is showing. Default `"totp"`. See the file header. */
  mode?: TwoFactorMode | undefined;
  onModeChange?: ((mode: TwoFactorMode) => void) | undefined;
  /** How many characters the TOTP code has. Drives `maxLength`. Default 6. */
  length?: number | undefined;
  rememberDevice?: boolean | undefined;
  onRememberDeviceChange?: ((remember: boolean) => void) | undefined;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  /** A wrong or expired code, already translated. */
  error?: LumoNode;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function TwoFactor({
  strings,
  mode = "totp",
  onModeChange,
  length = 6,
  rememberDevice,
  onRememberDeviceChange,
  onSubmit,
  error,
  isPending = false,
  className,
}: TwoFactorProps) {
  const isRecovery = mode === "recovery";

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

            {isRecovery ? (
              <TextField
                label={strings.recoveryLabel}
                name="recoveryCode"
                type="text"
                autoComplete="off"
                size="lg"
                isRequired
                {...optional("placeholder", strings.recoveryPlaceholder)}
                {...optional("description", strings.recoveryHint)}
              />
            ) : (
              <TextField
                label={strings.codeLabel}
                name="code"
                // See the file header: the same digit-safety treatment as
                // OtpVerify, and for the same reason — `type="number"` rejects
                // Persian digits outright.
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={length}
                size="lg"
                isRequired
                {...optional("placeholder", strings.codePlaceholder)}
                {...optional("description", strings.codeHint)}
              />
            )}

            <Checkbox
              name="rememberDevice"
              {...optional("isSelected", rememberDevice)}
              onChange={(checked) => onRememberDeviceChange?.(checked)}
            >
              {strings.rememberDevice}
            </Checkbox>

            <Button type="submit" size="lg" isDisabled={isPending} className="w-full">
              {strings.submit}
            </Button>
          </Form>

          <div className="mbs-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onModeChange?.(isRecovery ? "totp" : "recovery")}
            >
              {isRecovery ? strings.useAuthenticatorApp : strings.useRecoveryCode}
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
