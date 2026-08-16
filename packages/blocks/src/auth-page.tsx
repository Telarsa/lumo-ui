"use client";

import type { FormEvent } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { SignIn, type SignInStrings } from "./sign-in.tsx";

/**
 * The whole sign-in ROUTE: brand mark above, the `SignIn` card centred in the
 * viewport, a legal footnote below. Paste it as the page — not into one.
 *
 * It composes `SignIn` rather than restating it (the sign-up line ships inside
 * the card), so a missing translation is still TS2741, one interface deeper.
 * `"use client"` only because `onSubmit` is a function prop forwarded through.
 */
export interface AuthPageStrings {
  /** The card's own copy, unchanged — see `SignInStrings`. */
  signIn: SignInStrings;
  /** One quiet line under the card — terms, copyright, a support hint. Omit and nothing renders; there is no English default. */
  footnote?: string | undefined;
}

export interface AuthPageProps {
  strings: AuthPageStrings;
  /** Target of the password-recovery link, forwarded to `SignIn`. */
  forgotHref: string;
  /** Target of the sign-up link, forwarded to `SignIn`. */
  signUpHref: string;
  /** The product mark above the card. A slot rather than a `src`, so a wordmark, an `<svg>` or a `<picture>` all work. */
  brand?: LumoNode;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  /** An authentication failure, already translated — see `SignInProps`. */
  error?: LumoNode;
  /** Disables the submit while a request is in flight. */
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function AuthPage({
  strings,
  forgotHref,
  signUpHref,
  brand,
  onSubmit,
  error,
  isPending = false,
  className,
}: AuthPageProps) {
  return (
    /*
     * `min-h-dvh` (not `h-screen`): centred in the VISIBLE viewport, and `min-`
     * lets it scroll instead of clip when the keyboard is open.
     */
    <div
      className={cn(
        "flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-bg px-4 py-10 text-fg",
        className,
      )}
    >
      {brand !== undefined ? (
        <div className="flex shrink-0 items-center justify-center">{brand}</div>
      ) : null}

      {/*
       * `px-0 py-0` strips SignIn's standalone padding; this page owns the
       * rhythm. `cn` in SignIn merges these last, so they win.
       */}
      <SignIn
        strings={strings.signIn}
        forgotHref={forgotHref}
        signUpHref={signUpHref}
        onSubmit={onSubmit}
        error={error}
        isPending={isPending}
        className="px-0 py-0"
      />

      {strings.footnote !== undefined ? (
        <p className="max-w-sm text-center text-xs text-fg-subtle">{strings.footnote}</p>
      ) : null}
    </div>
  );
}
