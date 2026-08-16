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
  Link,
  TextField,
  optional,
} from "@lumo-ui/ui";

/**
 * The sign-in card, and THE BLOCK CONTRACT every file in this package obeys:
 *
 *  1. ALL TEXT IS A PROP — a REQUIRED `<Name>Strings` interface, no defaults
 *     (a default would be English).
 *  2. NO RAW NUMBERS — `LumoNode` excludes `number`; figures go through
 *     `formatNumber(n, locale)`, which is why blocks take a `locale` prop.
 *  3. LOGICAL UTILITIES ONLY — a block is copied whole, so a physical class
 *     arrives pre-installed in a whole screen.
 *  4. COMPOSE, NEVER REIMPLEMENT — a missing primitive is a finding, not a `<div>`.
 *
 * `"use client"` is here because `onSubmit` is a FUNCTION prop that cannot
 * cross the server boundary; blocks without callbacks deliberately omit it.
 */
export interface SignInStrings {
  /** The screen's heading. Rendered as the page `<h1>` — see below. */
  title: string;
  /** One explanatory line under the heading. Omit and nothing renders. */
  description?: string | undefined;
  emailLabel: string;
  emailPlaceholder?: string | undefined;
  passwordLabel: string;
  passwordPlaceholder?: string | undefined;
  /** Visible label of the "keep me signed in" checkbox. */
  rememberLabel: string;
  /** Text of the password-recovery link. */
  forgotPassword: string;
  /** The submit button. */
  submit: string;
  /** The sentence before the sign-up link, e.g. «حساب کاربری ندارید؟». Split from `signUpAction` so a translator can place the link in their own clause order. */
  signUpPrompt: string;
  /** The sign-up link's own text. */
  signUpAction: string;
}

export interface SignInProps {
  strings: SignInStrings;
  /** Target of the password-recovery link. */
  forgotHref: string;
  /** Target of the sign-up link. */
  signUpHref: string;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  /** An authentication failure, already translated. `LumoNode` so it can carry a link but still cannot be a bare attempt counter. */
  error?: LumoNode;
  /** Disables the submit while a request is in flight. */
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function SignIn({
  strings,
  forgotHref,
  signUpHref,
  onSubmit,
  error,
  // Defaulted: RAC declares `isDisabled?: boolean` WITHOUT `| undefined`, so
  // under `exactOptionalPropertyTypes` an explicit undefined is a type error.
  isPending = false,
  className,
}: SignInProps) {
  return (
    // `justify-center` resolves against the container's direction; nothing to mirror.
    <section className={cn("flex w-full justify-center px-4 py-12", className)}>
      <Card variant="outlined" className="w-full max-w-sm">
        <CardHeader>
          {/*
           * A raw `<h1>`, not `<CardTitle>` (whose `level` starts at 2): an auth
           * screen IS the page. Classes match CardTitle's so they cannot drift.
           */}
          <h1 className="text-lg leading-snug font-semibold text-fg">{strings.title}</h1>
          {strings.description !== undefined ? (
            <CardDescription>{strings.description}</CardDescription>
          ) : null}
        </CardHeader>

        <CardBody>
          {/*
           * `optional()`: RAC's `onSubmit?: (e) => void` has no `| undefined`,
           * so an explicitly-undefined handler does not compile.
           */}
          <Form {...optional("onSubmit", onSubmit)}>
            {error !== undefined ? (
              /*
               * `live="assertive"`: this alert APPEARS in response to a submit,
               * the one case where interrupting is correct (see alert.tsx).
               */
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

            <TextField
              label={strings.passwordLabel}
              type="password"
              name="password"
              autoComplete="current-password"
              isRequired
              {...optional("placeholder", strings.passwordPlaceholder)}
            />

            {/*
             * `justify-between`: checkbox at the inline START, link at the inline
             * END. `flex-wrap` because Persian runs longer on a 320px viewport.
             */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Checkbox name="remember">{strings.rememberLabel}</Checkbox>
              <Link href={forgotHref} variant="subtle" size="sm">
                {strings.forgotPassword}
              </Link>
            </div>

            <Button type="submit" size="lg" isDisabled={isPending} className="w-full">
              {strings.submit}
            </Button>
          </Form>

          {/*
           * The space between prompt and link is a `gap`, not a `{" "}` text
           * node — a literal space is a string the library would be shipping.
           */}
          <p className="mbs-4 flex flex-wrap items-center justify-center gap-1 text-sm text-fg-muted">
            <span>{strings.signUpPrompt}</span>
            <Link href={signUpHref} size="sm">
              {strings.signUpAction}
            </Link>
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
