import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A person or organisation, as a picture or as initials.
 *
 * No `"use client"`: an `<img>` inside a `<span>`, rendered on the server so
 * lists, tables and cards stay server-rendered. `alt` is REQUIRED whenever `src`
 * is given — required to be *written*: `alt=""` is right beside the name,
 * `alt="سارا محمدی"` when the avatar stands alone. No `onError` swap to
 * initials (that needs state); the initials sit BEHIND the image instead. No
 * avatar group here — `icon-stack.tsx` is that component. The status dot is
 * props on `Avatar`, not a part, because `statusLabel` is required and a part
 * cannot be required (WCAG 1.4.1: colour alone says nothing).
 */
export const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden " +
    "rounded-full bg-surface-sunken align-middle select-none " +
    // A 1px inset ring rather than a border, so the circle stays a circle.
    "ring-1 ring-inset ring-border",
  {
    variants: {
      /** The avatar's diameter step. */
      size: {
        sm: "size-6 text-[0.625rem]",
        md: "size-8 text-xs",
        lg: "size-10 text-sm",
        xl: "size-14 text-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * The box that holds the circle and the dot together. Rendered ONLY when there
 * is a status; same sizes as `avatarVariants`, and `rounded-full` because
 * `icon-stack.tsx` rings its direct children.
 */
export const avatarStatusWrapperVariants = cva("relative inline-flex shrink-0 align-middle", {
  variants: {
    size: {
      sm: "size-6 rounded-full",
      md: "size-8 rounded-full",
      lg: "size-10 rounded-full",
      xl: "size-14 rounded-full",
    },
  },
  defaultVariants: { size: "md" },
});

/**
 * The presence dot. `bottom-0 end-0` — `end`, not `right`, so it sits at the
 * reader's trailing corner (bottom-LEFT in Persian). `ring-2 ring-bg` is the
 * cut-out against the portrait; `ring-bg` because an avatar usually sits on the
 * page. Tones are the library's status colours, not "online/away/busy": what a
 * colour MEANS is the product's decision; `statusLabel` says it in words.
 */
export const avatarStatusVariants = cva(
  "absolute bottom-0 end-0 block rounded-full ring-2 ring-bg",
  {
    variants: {
      size: {
        // Roughly a quarter of the circle at each step; below 8px a dot is illegible.
        sm: "size-2",
        md: "size-2.5",
        lg: "size-3",
        xl: "size-3.5",
      },
      tone: {
        neutral: "bg-fg-muted",
        positive: "bg-positive",
        caution: "bg-caution",
        critical: "bg-critical",
      },
    },
    defaultVariants: { size: "md", tone: "neutral" },
  },
);

interface AvatarBaseProps
  // The rest lands on the OUTERMOST element (a `<span>` in both branches), as
  // `className` does. `children` is Omitted and not redeclared: content is
  // `src`/`alt` or `initials`, and a third way would let name and content disagree.
  extends Omit<ComponentProps<"span">, "children" | "className">,
    VariantProps<typeof avatarVariants> {
  className?: string | undefined;
  /**
   * Fallback glyphs, e.g. `"س م"` or `"KN"`. Rendered exactly as given — no
   * `uppercase`: Arabic script has no letter case.
   */
  initials?: string | undefined;
  /**
   * What the presence dot MEANS, e.g. «آنلاین». Required to show one; no boolean,
   * no default. Announced as `sr-only` text inside the dot, even when `alt=""`.
   */
  statusLabel?: string | undefined;
  /** Which of the library's status colours the dot takes. Default `"neutral"`. Ignored without a `statusLabel`. */
  statusTone?: "neutral" | "positive" | "caution" | "critical" | undefined;
}

interface AvatarImageProps extends AvatarBaseProps {
  /** URL of the portrait. */
  src: string;
  /** See the file header. `""` is a legitimate, and usually correct, value. */
  alt: string;
}

interface AvatarInitialsProps extends AvatarBaseProps {
  src?: undefined;
  alt?: undefined;
  /** With no `src`, the initials are the whole component and cannot be omitted. */
  initials: string;
}

export type AvatarProps = AvatarImageProps | AvatarInitialsProps;

export function Avatar(props: AvatarProps) {
  const { size, className, initials, statusLabel, statusTone, ...rest } = props;
  // `src` and `alt` belong to the `<img>` below, never to the wrapper's passthrough.
  const { src, alt, ...dom } = rest;

  // The wrapper is CONDITIONAL: `icon-stack.tsx` sizes and rings its DIRECT
  // children, so wrapping unconditionally would silently resize every stack.
  // `className` goes on the OUTERMOST element either way.
  const circle = (
    <span
      {...(statusLabel === undefined ? dom : {})}
      className={cn(avatarVariants({ size }), statusLabel === undefined ? className : undefined)}
    >
      {/*
       * The initials sit underneath, not `aria-hidden`: with an image the
       * `<img>` owns the name via `alt`; without one they are the content.
       */}
      {initials !== undefined ? (
        <span className="font-medium text-fg-muted">{initials}</span>
      ) : null}

      {src !== undefined ? (
        <img
          src={src}
          alt={alt}
          // `inset-0` is direction-neutral; `object-cover` keeps a non-square portrait centred.
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </span>
  );

  if (statusLabel === undefined) return circle;

  return (
    <span {...dom} className={cn(avatarStatusWrapperVariants({ size }), className)}>
      {circle}
      <span className={cn(avatarStatusVariants({ size, tone: statusTone ?? "neutral" }))}>
        {/* Real text, not an `aria-label`; follows the portrait so the reader hears person, then state. */}
        <span className="sr-only">{statusLabel}</span>
      </span>
    </span>
  );
}
