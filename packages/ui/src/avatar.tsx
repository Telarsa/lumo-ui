import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A person or organisation, as a picture or as initials.
 *
 * No `"use client"`: this is an `<img>` inside a `<span>`. See badge.tsx for
 * why the absence of the directive is a decision rather than an omission.
 *
 * ── `alt` is required whenever `src` is given ───────────────────────────────
 * Not "required to be non-empty" — required to be *written*. `alt=""` is the
 * correct value for the overwhelmingly common case where the avatar sits beside
 * the person's name, because the name is already in the accessible tree and
 * repeating it makes a screen reader say it twice. `alt="سارا محمدی"` is correct
 * when the avatar stands alone in a table cell. Both are right; which one is
 * right is a judgement the consumer has to make, and a `string` prop with no
 * default is how the type asks the question. An `alt?: string` would let the
 * attribute vanish entirely, which is the one answer that is always wrong.
 *
 * ── What this component deliberately does NOT do ────────────────────────────
 * There is no `onError` swap from a broken image to the initials. That needs
 * `useState`, which makes every avatar in the application a client component —
 * and avatars appear in lists, tables and cards that must be server-rendered
 * for the same SEO reason described in badge.tsx. The initials layer sits
 * BEHIND the image, so it covers the loading gap and any transparency; a URL
 * that 404s is handled where the URL is produced, not in the view layer.
 */
export const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden " +
    "rounded-full bg-surface-sunken align-middle select-none " +
    // A 1px inset ring rather than a border, so the image is not inset by the
    // border width and the circle stays a circle at every size.
    "ring-1 ring-inset ring-border",
  {
    variants: {
      size: {
        // `size-*` sets width and height together. Neither is direction-aware,
        // so there is nothing to mirror here — worth stating because it is the
        // reason this file has no logical utilities at all.
        sm: "size-6 text-[0.625rem]",
        md: "size-8 text-xs",
        lg: "size-10 text-sm",
        xl: "size-14 text-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

interface AvatarBaseProps extends VariantProps<typeof avatarVariants> {
  className?: string | undefined;
  /**
   * Fallback glyphs, e.g. `"س م"` or `"KN"`.
   *
   * Rendered exactly as given. There is no `uppercase` utility on this element
   * on purpose: Arabic script has no letter case, so `text-transform` is a
   * silent no-op for the library's primary locale while quietly rewriting Latin
   * input — a transformation that behaves differently per script is a bug
   * waiting for a locale switch. The consumer computes the glyphs they want.
   */
  initials?: string | undefined;
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
  const { size, className, initials } = props;

  return (
    <span className={cn(avatarVariants({ size }), className)}>
      {/*
       * The initials sit underneath, always rendered when supplied. They are
       * not `aria-hidden`: with no image they are the only content, and with an
       * image the `<img>` above them owns the accessible name via `alt`, so a
       * screen reader reaches the initials only in the case where they are
       * genuinely the content.
       */}
      {initials !== undefined ? (
        <span className="font-medium text-fg-muted">{initials}</span>
      ) : null}

      {props.src !== undefined ? (
        <img
          src={props.src}
          alt={props.alt}
          // `inset-0` is all four edges at once, which is direction-neutral —
          // the logical `inset-s-0 inset-e-0` pair would compile to the same
          // box. `object-cover` keeps a non-square portrait centred rather than
          // squashed, which matters because most uploaded avatars are not square.
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </span>
  );
}
