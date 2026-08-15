import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * Device chrome around a preview — a browser bar or a phone bezel. No `"use client"`:
 * a border with a decorative header, server-renderable.
 *
 *     <Frame device="phone" label="پیش‌نمایش موبایل"><iframe … /></Frame>
 *
 * The chrome is DECORATION and `aria-hidden` (real `<button>` dots would put three
 * unnamed controls into every page's tab order); `label` names what is inside. The
 * browser bar is `dir="ltr"` + `data-lumo-latn` (a URL is an LTR run) while `children`
 * inherit the page's direction. The phone bezel is a speaker slot, not a `clip-path` notch.
 */

export const frameVariants = cva("overflow-hidden border border-border bg-surface", {
  variants: {
    /** The chrome drawn around the content: phone or browser. */
    device: {
      /** A browser window: a bar with dots and an address line. */
      browser: "rounded-lg shadow-raised",
      /** A handset: a thick bezel and a speaker slot. */
      phone: "mx-auto w-[min(22rem,100%)] rounded-[2rem] border-8 border-fg/85 shadow-raised",
      /** No chrome at all — just the bordered surface. */
      plain: "rounded-lg",
    },
  },
  defaultVariants: { device: "browser" },
});

export const frameBarVariants = cva(
  "flex items-center gap-2 border-b border-border bg-surface-sunken px-3 py-2",
);

export const frameDotVariants = cva("size-2.5 rounded-full bg-border-strong");

export const frameAddressVariants = cva(
  "min-w-0 flex-1 truncate rounded-md bg-surface px-2 py-0.5 text-xs text-fg-subtle",
);

export const frameNotchVariants = cva(
  "mx-auto mt-1 mb-2 h-1.5 w-16 rounded-full bg-fg/85",
);

export interface FrameProps
  extends Omit<
      React.ComponentProps<"figure">,
      "children" | "role" | "aria-label" | "aria-labelledby"
    >,
    VariantProps<typeof frameVariants> {
  /** Names what is INSIDE the frame, e.g. «پیش‌نمایش موبایل». Required. A named `<figure>`, not a `role="region"`. */
  label: string;
  /** Shown in the address line. Browser device only; decorative. */
  address?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Frame({ device = "browser", label, address, className, children, ...props }: FrameProps) {
  return (
    <figure
      {...props}
      data-lumo=""
      role={undefined}
      aria-label={label}
      aria-labelledby={undefined}
      className={cn("m-0", frameVariants({ device }), className)}
    >
      {device === "browser" ? (
        // Decoration, entirely.
        <div
          aria-hidden="true"
          dir="ltr"
          data-lumo-latn=""
          className={frameBarVariants()}
        >
          <span className={frameDotVariants()} />
          <span className={frameDotVariants()} />
          <span className={frameDotVariants()} />
          {address === undefined ? null : (
            <span className={frameAddressVariants()}>{address}</span>
          )}
        </div>
      ) : null}

      {device === "phone" ? (
        // A speaker slot, not a notch.
        <span aria-hidden="true" className={cn("block", frameNotchVariants())} />
      ) : null}

      {children as React.ReactNode}
    </figure>
  );
}
