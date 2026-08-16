import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Conditional classes with Tailwind conflict resolution: a consumer's `ms-4`
 * beats the component's `ms-2` by intent, not stylesheet order. EXTENDED with
 * Lumo's own spacing scale (`--spacing-control-*`), which a bare `twMerge`
 * cannot see as conflicting; `extend.theme.spacing` (not `classGroups`) covers
 * every spacing-derived group at once.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      // Pinned mirror of `--spacing-control-*` in `packages/theme/src/theme.css`;
      // `cn.test.ts` fails if the two disagree.
      spacing: ["control-sm", "control-md", "control-lg"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
