import { cva } from "class-variance-authority";

/**
 * In a `.variants.ts` companion, not `alert-dialog.tsx`, for the reason
 * `button.variants.ts` states: that module carries `"use client"`, and a
 * `cva()` exported from a client module is a client REFERENCE — a server
 * component that calls it crashes the prerender. Nothing server-side calls
 * this today; the correctness review flagged it as the latent version of the
 * exact break `buttonVariants` shipped once. The registry generator carries
 * `*.variants.ts` companions with their component automatically.
 */

/*
 * The footer's source order is cancel-then-confirm — the safe action first in
 * tab order — while `justify-end` places the confirm verb at the reading end,
 * where a primary action sits in either script. `flex-col-reverse` stacks the
 * confirm verb on top on narrow viewports for the same reason. Every one of
 * these properties is flex-relative, so the pair mirrors with the locale on
 * its own and there is nothing physical to get wrong.
 */
export const alertDialogFooterVariants = cva(
  "mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
);
