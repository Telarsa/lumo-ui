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
 * Account creation.
 *
 * `"use client"` for the `onSubmit` callback — see sign-in.tsx for the block
 * contract. The consent row is four separate strings (prefix, terms link,
 * joiner, privacy link) laid out with `flex-wrap` + `gap`, never a template
 * with holes: where the links fall in the sentence is a translation decision.
 */
export interface SignUpStrings {
  /** The screen's heading. Rendered as the page `<h1>`. */
  title: string;
  description?: string | undefined;
  nameLabel: string;
  namePlaceholder?: string | undefined;
  emailLabel: string;
  emailPlaceholder?: string | undefined;
  passwordLabel: string;
  passwordPlaceholder?: string | undefined;
  /** Password rules, shown under the field and wired into `aria-describedby`. */
  passwordHint?: string | undefined;
  confirmLabel: string;
  confirmPlaceholder?: string | undefined;
  /** Sentence opening the consent row, e.g. «می‌پذیرم که». */
  termsPrefix: string;
  /** Text of the terms-of-service link. */
  termsLink: string;
  /** The word joining the two links, e.g. «و». */
  termsJoiner: string;
  /** Text of the privacy-policy link. */
  privacyLink: string;
  submit: string;
  /** Sentence before the sign-in link. See `SignInStrings.signUpPrompt`. */
  signInPrompt: string;
  signInAction: string;
}

export interface SignUpProps {
  strings: SignUpStrings;
  termsHref: string;
  privacyHref: string;
  signInHref: string;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  /** A server-side failure, already translated. */
  error?: LumoNode;
  /** Per-field errors, already translated. Keys are the field `name`s. */
  fieldErrors?:
    | Readonly<Partial<Record<"name" | "email" | "password" | "confirm", LumoNode>>>
    | undefined;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function SignUp({
  strings,
  termsHref,
  privacyHref,
  signInHref,
  onSubmit,
  error,
  fieldErrors,
  isPending = false,
  className,
}: SignUpProps) {
  return (
    <section className={cn("flex w-full justify-center px-4 py-12", className)}>
      <Card variant="outlined" className="w-full max-w-md">
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
              label={strings.nameLabel}
              name="name"
              autoComplete="name"
              isRequired
              {...optional("placeholder", strings.namePlaceholder)}
              {...optional("errorMessage", fieldErrors?.name)}
            />

            <TextField
              label={strings.emailLabel}
              type="email"
              name="email"
              autoComplete="email"
              isRequired
              {...optional("placeholder", strings.emailPlaceholder)}
              {...optional("errorMessage", fieldErrors?.email)}
            />

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

            <Checkbox name="terms" isRequired>
              {/*
               * Four strings, one sentence, assembled by the layout — the reason `Checkbox` takes `children`.
               */}
              <span className="flex flex-wrap items-center gap-1">
                <span>{strings.termsPrefix}</span>
                <Link href={termsHref} size="sm">
                  {strings.termsLink}
                </Link>
                <span>{strings.termsJoiner}</span>
                <Link href={privacyHref} size="sm">
                  {strings.privacyLink}
                </Link>
              </span>
            </Checkbox>

            <Button type="submit" size="lg" isDisabled={isPending} className="w-full">
              {strings.submit}
            </Button>
          </Form>

          <p className="mbs-4 flex flex-wrap items-center justify-center gap-1 text-sm text-fg-muted">
            <span>{strings.signInPrompt}</span>
            <Link href={signInHref} size="sm">
              {strings.signInAction}
            </Link>
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
