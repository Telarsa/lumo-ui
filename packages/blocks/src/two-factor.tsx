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
 * Not `otp-verify.tsx` renamed: a TOTP code is derived on the reader's own
 * device, so there is NO resend, no countdown and no `locale`. `mode` is a
 * controlled prop (only the caller knows whether recovery codes are enabled),
 * and "remember this device" has TRUST semantics, distinct from SignIn's
 * "keep me signed in". The TOTP field keeps `type="text" inputMode="numeric"`.
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
                    // Same digit-safety treatment as OtpVerify: `type="number"` rejects Persian digits.
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
