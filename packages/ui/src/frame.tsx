import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * Device chrome around a preview — a browser bar or a phone bezel.
 *
 *     <Frame device="phone" label="پیش‌نمایش موبایل">
 *       <iframe … />
 *     </Frame>
 *
 * No `"use client"`: it is a border with a decorative header, so it is
 * server-renderable and a page of previews ships none of it.
 *
 * ═══ THE CHROME IS DECORATION AND IS MARKED AS SUCH ═════════════════════════
 *
 * The three dots on a browser bar are not buttons, the notch on a phone is not
 * a control, and the address bar is not a field. They are a drawing of a device
 * — so the whole chrome is `aria-hidden="true"` and the frame's own `label`
 * names what is inside it.
 *
 * This matters more than it sounds. A "browser mockup" built from real
 * `<button>` elements puts three unnamed controls into the tab order of every
 * page that shows a preview, and `lumo-gate`'s `named-controls` fails the build
 * on each one — which is how this rule was arrived at rather than assumed.
 *
 * ═══ THE BAR IS `dir="ltr"`, THE CONTENT IS NOT ═════════════════════════════
 *
 * A browser's own chrome is not part of the document it frames, and a URL is a
 * left-to-right run. So the bar carries `dir="ltr"` and `data-lumo-latn` — the
 * sanctioned escape hatch — while `children` inherit the page's own direction
 * untouched. The alternative, mirroring the traffic-light dots on a Persian
 * page, draws a browser that does not exist.
 *
 * `file-upload.tsx` and `phone-input.tsx` make the same call for a filename and
 * a phone number.
 *
 * ═══ THE PHONE BEZEL DOES NOT FAKE A NOTCH WITH A GRADIENT ══════════════════
 *
 * Rounded corners, a thick border and a speaker slot. The notch shapes that
 * need `clip-path` or a stack of pseudo-elements are a rendering of one
 * manufacturer's hardware from one year, and they date the frame faster than
 * anything else in it.
 */

export const frameVariants = cva("overflow-hidden border border-border bg-surface", {
  variants: {
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
  extends Omit<React.ComponentProps<"div">, "children">,
    VariantProps<typeof frameVariants> {
  /**
   * Names what is INSIDE the frame, e.g. «پیش‌نمایش موبایل». Required.
   *
   * The chrome is hidden, so without this the frame is an anonymous group
   * around its content. It is a `<figure>` with a name rather than a
   * `role="region"`: a preview is illustrative content, and a landmark for
   * every mockup on a page clutters the landmark list.
   */
  label: string;
  /** Shown in the address line. Browser device only; decorative. */
  address?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Frame({ device = "browser", label, address, className, children, ...props }: FrameProps) {
  return (
    <figure
      data-lumo=""
      aria-label={label}
      className={cn("m-0", frameVariants({ device }), className)}
      {...props}
    >
      {device === "browser" ? (
        // Decoration, entirely. Real <button>s here would put three unnamed
        // controls into the tab order of every page showing a preview.
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
        // A speaker slot, not a notch: the clip-path shapes are a rendering of
        // one manufacturer's hardware from one year.
        <span aria-hidden="true" className={cn("block", frameNotchVariants())} />
      ) : null}

      {children as React.ReactNode}
    </figure>
  );
}
