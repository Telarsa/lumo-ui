import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

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
 *
 * ═══ WHY THIS IS EXTENDED, AND WHAT WAS WRONG BEFORE ════════════════════════
 *
 * It ran as a bare `twMerge`, which knows Tailwind's OWN scales and nothing
 * else. Lumo adds a scale of its own — `--spacing-control-sm/md/lg` in
 * `theme.css`, the density-aware control heights — and to an unextended
 * `twMerge` those read as unknown arbitrary values that cannot conflict:
 *
 *     h-4          + h-8          →  h-8                         ✓
 *     h-control-md + h-control-lg →  h-control-md h-control-lg    ✗
 *
 * Both survive, and the winner is then decided by stylesheet order — the exact
 * failure this function exists to prevent, in the one namespace the library
 * invented for itself.
 *
 * ── THE MEASUREMENT, AND WHY THE HEADLINE NUMBER IS THE SMALL ONE ──────────
 *
 * Across the built export: **1,766 elements carry two conflicting
 * `h-control-*` classes, and 2 actually render against the author's intent** —
 * a large icon button on the Button page asking for `h-control-lg` and getting
 * `md`, 36px where 44px was written, quietly defeating the touch-target floor
 * `tokens.css` argues for at length.
 *
 * The other 1,764 are correct BY ACCIDENT. Emission order is `lg`(17556) →
 * `md`(17604) → `sm`(17652), so `sm` beats `md` beats `lg` — the reverse of
 * size order — and most of those elements happen to want `sm` last. So the
 * defect to fix is not "2 broken elements"; it is 1,766 elements whose
 * correctness depends on the byte offset at which Tailwind emitted a rule.
 *
 * ── WHY THE THEME SCALE AND NOT THE CLASS GROUPS ───────────────────────────
 *
 * `extend.classGroups` would mean listing `h`, `w`, `min-h`, `size`… and every
 * spacing-derived group a future component reaches for. `extend.theme.spacing`
 * instead teaches the resolver that `control-sm|md|lg` ARE spacing values, so
 * every group Tailwind already derives from the spacing scale inherits the
 * knowledge — including ones nothing uses yet. The emitted set today is
 * `h-control-*`, `w-control-*` and `min-h-control-*`; a `p-control-md` added
 * tomorrow is covered without editing this file, which is the difference
 * between a fix and a list that will drift.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      // Keep in step with `--spacing-control-*` in `packages/theme/src/theme.css`.
      // `cn.test.ts` reads that file and fails if the two disagree, so this is a
      // pinned mirror rather than a second source of truth.
      spacing: ["control-sm", "control-md", "control-lg"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
