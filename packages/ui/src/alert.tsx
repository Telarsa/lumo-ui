import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * An inline message: plain, informational, success, failure, warning.
 * No `"use client"` — a `<div>` with tokens, so it renders on the server.
 * `role="alert"` is opt-in via `live`, and the default is NO live region: an
 * assertive region already in the first byte is announced at load, out of
 * context, so `live="assertive"` is for a message that APPEARS in response to
 * an event. Tint vocabulary (/10 fill, /25 edge) is shared with `badge.tsx`
 * and `icon-tile.tsx`; a tint token is deliberately not minted yet.
 */
export const alertVariants = cva(
  // Flex, not grid: the icon and text column mirror for free. `border-s-4` is
  // the reader's leading edge; `border` before `border-s-4` so per-side wins.
  "flex w-full items-start gap-3 rounded-md border border-s-4 p-4 text-sm text-fg",
  {
    variants: {
      // Ordered neutral-first, matching `badge.tsx`; `neutral` is badge's own neutral subtle.
      tone: {
        neutral: "border-border border-s-border-strong bg-surface-sunken",
        accent: "border-accent/25 border-s-accent bg-accent/10",
        positive: "border-positive/25 border-s-positive bg-positive/10",
        critical: "border-critical/25 border-s-critical bg-critical/10",
        caution: "border-caution/25 border-s-caution bg-caution/10",
      },
    },
    defaultVariants: { tone: "accent" },
  },
);

/**
 * The icon keeps the tone colour while the body text stays `text-fg`: tinted
 * prose sits near 4.5:1 with no headroom, an icon needs only 3:1.
 */
export const alertIconVariants = cva("mbs-0.5 flex size-5 shrink-0 items-center justify-center", {
  variants: {
    /** The semantic color: neutral, accent, positive, caution, or critical. */
    tone: {
      neutral: "text-fg-muted",
      accent: "text-accent",
      positive: "text-positive",
      critical: "text-critical",
      caution: "text-caution",
    },
  },
  defaultVariants: { tone: "accent" },
});

/**
 * The dismiss control. A bare `<button>`, not `IconButton`: `button.tsx` is
 * `"use client"` and would drag every alert into the client graph.
 */
export const alertCloseVariants = cva(
  "mbs-0.5 -me-1 inline-flex h-control-sm w-control-sm shrink-0 cursor-pointer " +
    "items-center justify-center rounded-md border-0 bg-transparent p-0 " +
    "text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg " +
    "active:translate-y-px " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
);

/** How assistive technology is told about this alert. */
export type AlertLive = "off" | "polite" | "assertive";

const ROLE_FOR_LIVE = {
  off: undefined,
  polite: "status",
  assertive: "alert",
} as const;

interface AlertBaseProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "title" | "role">,
    VariantProps<typeof alertVariants> {
  /** The semantic color: neutral, accent, positive, caution, or critical. */
  tone?: VariantProps<typeof alertVariants>["tone"];
  /** Optional leading icon, rendered `aria-hidden`. A slot, not a per-tone default, so no icon set is bundled. */
  icon?: LumoNode;
  /** Short summary line, rendered above the body. */
  title?: LumoNode;
  children?: LumoNode;
  /** How assistive technology is told about this alert. Default `"off"` — see the file header. */
  live?: AlertLive | undefined;
  className?: string | undefined;
}

/**
 * The dismiss half of the props, as a discriminated pair: `closeLabel` has no
 * default (an icon is not a name) and cannot be passed without `onClose`. No
 * action slot: an action is CONTENT and belongs in `children`.
 */
interface DismissibleAlertProps {
  /** Called when the reader dismisses the alert. Owning the removal is the caller's. */
  onClose: () => void;
  /** Announced name of the dismiss button, e.g. «بستن». Required whenever `onClose` is passed. */
  closeLabel: string;
}

interface StaticAlertProps {
  onClose?: undefined;
  closeLabel?: undefined;
}

export type AlertDismissProps = DismissibleAlertProps | StaticAlertProps;

/** The whole public surface. An intersection with a union, so a wrapper inherits the pairing rule. */
export type AlertProps = AlertBaseProps & AlertDismissProps;

export function Alert({
  tone = "accent",
  icon,
  title,
  children,
  live = "off",
  className,
  onClose,
  closeLabel,
  ...props
}: AlertProps) {
  return (
    <div
      role={ROLE_FOR_LIVE[live]}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {icon !== undefined ? (
        <span aria-hidden="true" className={cn(alertIconVariants({ tone }))}>
          {icon}
        </span>
      ) : null}

      {/* `min-w-0` is load-bearing: a long unbroken token would otherwise widen the alert. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* A `<p>`, not a heading: a transient message does not belong in the outline. */}
        {title !== undefined ? <p className="font-semibold">{title}</p> : null}
        {children !== undefined ? <div className="text-fg-muted">{children}</div> : null}
      </div>

      {/* Rendered only when there is something to call; a server component cannot pass a function. */}
      {onClose !== undefined ? (
        <button
          data-lumo=""
          type="button"
          // `type="button"`: an unadorned <button> inside a <form> submits it.
          aria-label={closeLabel}
          onClick={onClose}
          className={cn(alertCloseVariants())}
        >
          {/* An inline SVG rather than an icon package: no server-renderable module imports `lucide-react`. */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6 18 18M18 6 6 18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
