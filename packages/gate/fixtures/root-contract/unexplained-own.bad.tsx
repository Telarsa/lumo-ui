/*
 * POISON for `unexplained-own` — the contract's floor.
 *
 * `ref` and `id` may be OWNED (the component reads or writes them and a
 * caller's value would replace its own) or WIDENED (the root varies at run
 * time, so the honest type is the common supertype). Both are legitimate and
 * both are one comment. What is not legitimate is the third thing, which is
 * what this file does: subtract them because they were inconvenient, and leave
 * the next reader to guess which of the two it was.
 *
 * The rule grades that a reason was WRITTEN, not that it is a good one — no
 * syntactic pass can grade an argument. That is the same standard `@forwarded`
 * is held to by the rule above it, and for the same reason: the alternative is
 * a check nobody can satisfy honestly, which becomes a check everybody mutes.
 */
import type { ComponentProps } from "react";

export interface GridProps extends Omit<ComponentProps<"table">, "className" | "ref"> {
  className?: string | undefined;
}

export function Grid({ className, ...props }: GridProps) {
  return <table className={className} {...props} />;
}

/** `id` counts too, and for a sharper reason: it is the one a `aria-labelledby`
 *  somewhere else on the page has to be able to point at. */
export interface PanelProps extends Omit<ComponentProps<"section">, "className" | "id"> {
  className?: string | undefined;
}

export function Panel({ className, ...props }: PanelProps) {
  return <section className={className} {...props} />;
}
