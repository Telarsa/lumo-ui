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
 * ════════════════════════════════════════════════════════════════════════════
 * THE BLOCK CONTRACT. Read this once; every other file in this package obeys it.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A block is a whole screen section assembled from shipped `@lumo-ui/ui`
 * components. It is the layer that lets someone start a project on Monday
 * instead of re-deriving what a sign-in screen is.
 *
 * It is also the layer most likely to smuggle English into a Persian product,
 * and that is what this file's shape is defending against.
 *
 *  1. **ALL TEXT IS A PROP.** Not one user-facing string literal lives in this
 *     package — not a heading, not a button label, not a placeholder. Each block
 *     declares a `<Name>Strings` interface and takes it as a REQUIRED `strings`
 *     prop, so forgetting a string is TS2741 in the editor rather than an
 *     English word discovered by a Persian reader. `@lumo-ui/ui` already does
 *     this per control (`IconButton.label`, `Select.placeholder`); a block is
 *     where the temptation to write `<h1>Sign in</h1>` actually lives, so the
 *     rule is restated at whole-screen scale.
 *
 *     The corollary: a default value for a string is forbidden, because a
 *     default would be English. `strings.title` has no `??` behind it anywhere.
 *
 *  2. **NO RAW NUMBERS.** `children` is `LumoNode`, which excludes `number`.
 *     Any figure goes through `formatNumber(n, locale)` and any date through
 *     `formatDate(d, locale)`, which is why every block that shows a figure
 *     takes a `locale: Locale` prop rather than reading a context with a
 *     default. See `packages/ui/src/progress.tsx` for the full argument.
 *
 *  3. **LOGICAL UTILITIES ONLY.** `ms-/me-/ps-/pe-/start-/end-/border-s/
 *     border-bs/text-start`. A physical utility in a block is worse than one in
 *     a primitive: a block is copied whole, so the defect arrives pre-installed
 *     in a whole screen.
 *
 *  4. **COMPOSE, NEVER REIMPLEMENT.** If a block appears to need a primitive
 *     that `@lumo-ui/ui` does not ship, that is a finding to report, not a
 *     `<div>` to hand-roll.
 *
 * ── WHY `"use client"` IS HERE AND NOT IN, SAY, hero.tsx ────────────────────
 *
 * `onSubmit` is a FUNCTION prop. A function cannot cross the server/client
 * boundary, so a server component that rendered this block and passed a handler
 * would fail at build with "Functions cannot be passed directly to Client
 * Components". The directive is about the callback, not about React Aria —
 * every block in this package that takes a callback carries it, and every block
 * that does not (hero, feature-grid, faq, stat-grid…) deliberately does not, so
 * that a marketing page stays in the server-rendered first byte where the
 * crawler and the no-JS reader can see it.
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
  /**
   * The sentence before the sign-up link, e.g. «حساب کاربری ندارید؟».
   *
   * Split from `signUpAction` rather than interpolated. A single template with
   * a `{link}` hole forces Persian into English clause order, and the two
   * fragments are what let a translator put the link where it belongs in their
   * own sentence.
   */
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
  /**
   * An authentication failure, already translated by the caller.
   *
   * `LumoNode` rather than `string` so it can carry a link ("your account is
   * locked, contact support") — and `LumoNode` rather than `ReactNode` so it
   * still cannot be a bare attempt counter.
   */
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
  // Defaulted rather than passed through as `boolean | undefined`: RAC declares
  // `isDisabled?: boolean` WITHOUT `| undefined`, so under
  // `exactOptionalPropertyTypes` an explicit undefined is a type error. A
  // default is cheaper than a conditional spread for a boolean.
  isPending = false,
  className,
}: SignInProps) {
  return (
    // `justify-center` is flex centring, which resolves against the container's
    // direction — so it is correct in both scripts with nothing to mirror.
    // `px-*`/`py-*` are padding-inline/padding-block in Tailwind v4.
    <section className={cn("flex w-full justify-center px-4 py-12", className)}>
      <Card variant="outlined" className="w-full max-w-sm">
        <CardHeader>
          {/*
           * A raw `<h1>`, not `<CardTitle>`. CardTitle's `level` union starts at
           * 2 on purpose — "a card is never the page" — but an auth screen IS
           * the page, and a document whose highest heading is an h2 has a hole
           * in the outline that a screen-reader user navigates by. The classes
           * match CardTitle's so the two cannot drift visually.
           */}
          <h1 className="text-lg leading-snug font-semibold text-fg">{strings.title}</h1>
          {strings.description !== undefined ? (
            <CardDescription>{strings.description}</CardDescription>
          ) : null}
        </CardHeader>

        <CardBody>
          {/*
           * `optional()` from @lumo-ui/ui, not `onSubmit={onSubmit}`. React
           * Aria's shared FormProps declares `onSubmit?: (e) => void` without
           * `| undefined`, so passing an explicitly-undefined handler does not
           * compile. Omitting the key is the honest fix.
           */}
          <Form {...optional("onSubmit", onSubmit)}>
            {error !== undefined ? (
              /*
               * `live="assertive"`. This alert APPEARS in response to a submit,
               * which is the one case where interrupting the screen reader is
               * correct — see alert.tsx for why the default is `"off"` and why
               * a page full of load-time `role="alert"` callouts is a defect.
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
             * `justify-between` on a flex row puts the checkbox at the inline
             * START and the link at the inline END — right-to-left in Persian,
             * left-to-right in English, from one class. `flex-wrap` because
             * Persian renders these two strings longer than English does and a
             * 320px viewport must not overflow.
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
           * `mbs-*` is the logical block-start margin, never `mt-*`.
           *
           * The space between the prompt and the link is a `gap`, not a `{" "}`
           * text node. A literal space is a string the library would be
           * shipping — trivial in English, and wrong in a script where the
           * spacing around a link is the renderer's business, not ours.
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
