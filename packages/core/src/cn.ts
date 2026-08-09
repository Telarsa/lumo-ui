import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditional classes with Tailwind conflict resolution.
 *
 * `twMerge` is what makes a copy-in component overridable: a consumer passing
 * `className="ms-4"` must beat the component's own `ms-2`, and plain string
 * concatenation would leave both in the class list with the winner decided by
 * stylesheet order rather than by intent.
 *
 * This matters more in RTL than it looks. `tailwind-merge` encodes Tailwind's
 * conflict GROUPS, so it knows `ms-2` and `ms-4` collide but `ms-2` and `me-4`
 * do not. A version that gets those groups wrong produces silently wrong
 * spacing that mirrors incorrectly — see cn.test.ts, which pins the exact case.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
