/*
 * POISON for `undelivered-root` — the exit criterion in AUDIT §5 item 2.1,
 * stated literally: "a component root which accepts `id`/`ref` and does not
 * deliver them fails".
 *
 * This is the defect that survives the FIRST rule in this file. Every prop
 * below is inherited, not declared, so `gradeSource` sees nothing to grade and
 * reports clean — while `<Pagination id="pager-bottom">` type-checks, renders,
 * and produces no `id` at all. A page with a pager at the top and the bottom
 * then has two `<nav>` landmarks nothing can tell apart, and no test anywhere
 * goes red.
 *
 * Both shapes below are graded, because both ways of not delivering are the
 * same defect to a consumer.
 */
import type { ComponentProps } from "react";

/** Binds no rest at all: 300 attributes accepted and discarded. */
export interface PaginationProps extends Omit<ComponentProps<"nav">, "className"> {
  label: string;
  className?: string | undefined;
}

export function Pagination({ label, className }: PaginationProps) {
  return <nav aria-label={label} className={className} />;
}

/** Binds one and never uses it, which is the same thing with more ceremony. */
export interface ScrollAreaProps extends Omit<ComponentProps<"div">, "className"> {
  label: string;
  className?: string | undefined;
}

export function ScrollArea({ label, className, ...rest }: ScrollAreaProps) {
  // The rest is bound and then abandoned. Nothing reads it, nothing spreads it.
  return <div aria-label={label} className={className} />;
}
