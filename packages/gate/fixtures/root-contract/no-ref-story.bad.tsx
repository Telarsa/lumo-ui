/*
 * POISON for `no-ref-story` — and it is not invented, it is `card.tsx` as it
 * stood until 12 Aug 2026.
 *
 * `HTMLAttributes<T>` does not carry `ref` under React 19; `ComponentProps<E>`
 * does. Twenty-one files in this library reached for the first and ten for the
 * second, which is why `<Card ref={r}>` compiled and `<Frame ref={r}>` did not,
 * with nothing anywhere recording the difference. The whole `ref` story is this
 * one token, which is what makes the contract cheap and what makes this rule
 * worth having: the difference is invisible in review and total for a consumer.
 */
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  className?: string | undefined;
}

export function Card({ className, ...props }: CardProps) {
  return <div className={className} {...props} />;
}

/** The element-specific siblings are the same defect and must fire too. */
export interface CardLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  className?: string | undefined;
}

export function CardLink({ className, ...props }: CardLinkProps) {
  return <a className={className} {...props} />;
}
