import { cva } from "class-variance-authority";

/**
 * In a `.variants.ts` companion, not `alert-dialog.tsx`: a `cva()` exported from a
 * `"use client"` module is a client reference, and a server component that calls it
 * crashes the prerender.
 */

// Source order is cancel-then-confirm (safe action first in tab order); `justify-end` puts
// the confirm verb at the reading end. All flex-relative, so it mirrors on its own.
export const alertDialogFooterVariants = cva(
  "mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
);
