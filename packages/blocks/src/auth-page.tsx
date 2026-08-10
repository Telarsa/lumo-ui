"use client";

import type { FormEvent } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { SignIn, type SignInStrings } from "./sign-in.tsx";

/**
 * The whole sign-in ROUTE: brand mark above, the `SignIn` card centred in the
 * viewport, a legal footnote below. Paste it as the page — not into one.
 *
 * ── WHY THIS EXISTS WHEN `SignIn` ALREADY DOES ──────────────────────────────
 *
 * `SignIn` is the card; a real auth route is the card plus everything a team
 * re-derives around it every single time: the `min-h-dvh` centring, the brand
 * mark that anchors "where am I signing into", and the one quiet line of legal
 * text under the card. Those three are exactly the parts that look too trivial
 * to share and therefore get hand-rolled — with `h-screen` (wrong under mobile
 * browser chrome; `dvh` tracks the visible viewport) or with a physical
 * `margin-left: auto` centring that a logical layout gets for free. This block
 * is those decisions made once.
 *
 * The sign-up line — «حساب کاربری ندارید؟ ثبت‌نام کنید» — ships INSIDE the
 * `SignIn` card (`signUpPrompt`/`signUpAction` in `SignInStrings`), so this
 * page has it by composition rather than by restating it. Composing, never
 * reimplementing, is contract rule 4 (sign-in.tsx's header): this file renders
 * no form control of its own, and every string it forwards keeps `SignIn`'s
 * own typed contract — a missing translation is still TS2741, now one
 * interface deeper.
 *
 * `"use client"` for the same single reason as sign-in.tsx: `onSubmit` is a
 * function prop, forwarded straight through. The `brand` slot stays a
 * `LumoNode`, so a plain `<img>` or `<svg>` mark costs nothing extra.
 */
export interface AuthPageStrings {
  /** The card's own copy, unchanged — see `SignInStrings`. */
  signIn: SignInStrings;
  /**
   * One quiet line under the card — terms, copyright, a support hint. Omit
   * and nothing renders; there is no default, because a default would be
   * English.
   */
  footnote?: string | undefined;
}

export interface AuthPageProps {
  strings: AuthPageStrings;
  /** Target of the password-recovery link, forwarded to `SignIn`. */
  forgotHref: string;
  /** Target of the sign-up link, forwarded to `SignIn`. */
  signUpHref: string;
  /**
   * The product mark above the card. A slot rather than a `src`, so a text
   * wordmark, an `<svg>` or a themed `<picture>` all work unchanged.
   */
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
     * `min-h-dvh` + flex centring: the column sits in the middle of the VISIBLE
     * viewport on every device, and grows past it when a small screen plus an
     * open keyboard leaves less height than the card needs — `min-`, not `h-`,
     * is what lets it scroll instead of clip. `justify-center` and
     * `items-center` resolve against the container, so nothing here mirrors.
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
       * SignIn's own section already handles the inline centring and the card's
       * max width; `py-0 px-0` strips its standalone-use padding because this
       * page owns the vertical rhythm now. `cn` in SignIn merges these last,
       * so they win.
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
