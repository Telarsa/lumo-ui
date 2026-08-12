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
 *
 * There is also **no avatar group and no overflow count here**, and that is not
 * a gap: `icon-stack.tsx` is exactly that component, with the overlap on the
 * inline axis (`-ms-2`, so the stack leans the reader's way in both scripts),
 * the count through `formatNumber` («+۲», never «+2»), and one required label
 * for the whole row because five faces are one fact. A screenshot audit
 * (`scratchpad/visual-audit.md`, finding 7) recorded the group as missing —
 * it was looking at the avatar page. Shipping a second one here would be
 * shipping the Persian-digit bug back alongside the fix for it.
 *
 * ── THE STATUS DOT, WHICH *IS* A GAP AND IS ADDED BELOW ─────────────────────
 *
 * The same finding's other half is real. A presence dot is two hard things at
 * once: it has to be positioned at the circle's trailing corner without being
 * eaten by the `overflow-hidden` that keeps the portrait round, and it has to
 * SAY something — a state carried by colour alone is a WCAG 1.4.1 failure, and
 * a hand-rolled `<span className="bg-green-500" />` is what a consumer builds
 * and no reviewer flags, because it looks right.
 *
 * So it is props on `Avatar` rather than an `AvatarBadge` part. Two reasons,
 * and the second is the one that decided it:
 *
 *   1. A part would need the avatar's size to size itself and the avatar's
 *      corner to place itself, which is a context or a repeated `size` prop the
 *      caller has to keep in step with the one beside it.
 *   2. **`statusLabel` is a required prop and a part cannot be required.**
 *      `<Avatar>` with a hand-placed unnamed dot compiles; `statusLabel` typed
 *      as `string` on the component that draws the dot does not. That is the
 *      whole argument `IconButton` is split out of `Button` for.
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

/**
 * The box that holds the circle and the dot together.
 *
 * Rendered ONLY when there is a status — see `Avatar`. Its size classes are the
 * same four as `avatarVariants` because a wrapper that did not match would
 * collapse to the dot's own height, and `rounded-full` is here for one case:
 * `icon-stack.tsx` styles its direct children (`[&>*]:ring-2 [&>*]:ring-bg`),
 * so inside a stack the ring lands on this wrapper rather than on the circle,
 * and a square ring around a round portrait is the kind of defect that only
 * appears in the one composition nobody screenshots.
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
 * The presence dot itself.
 *
 * `bottom-0 end-0` — `end`, not `right`, so the dot sits at the reader's
 * trailing corner: bottom-right in English, bottom-LEFT in Persian. This is the
 * whole reason the placement belongs in the library rather than in each app; a
 * hand-rolled dot is written `right-0` and is silently wrong in Persian, which
 * is the one direction this library exists to get right.
 *
 * `ring-2 ring-bg` is the cut-out. Without it the dot's edge meets whatever
 * colour happens to be under that corner of the portrait, and a positive-tone
 * dot on a green jumper vanishes. `ring-bg` and not `ring-surface`: the ring
 * has to match what is BEHIND the avatar, and an avatar sits on the page far
 * more often than on a raised surface — a consumer placing one on a card passes
 * `className` to say so.
 *
 * The tones are the library's four status colours and `neutral`, not
 * "online/away/busy": what a colour MEANS is the product's decision, and a
 * component that names the meanings has decided it for them. The reader is told
 * in words by `statusLabel` either way.
 */
export const avatarStatusVariants = cva(
  "absolute bottom-0 end-0 block rounded-full ring-2 ring-bg",
  {
    variants: {
      size: {
        // Roughly a quarter of the circle at each step, rounded to the spacing
        // scale. Below `sm` a dot stops being legible at all, which is why the
        // smallest is 8px rather than a proportional 6.
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
  /**
   * What the presence dot MEANS, e.g. «آنلاین» or «در دسترس نیست». Required to
   * show one; there is no boolean and no default.
   *
   * It is announced, as `sr-only` text inside the dot rather than as an
   * `aria-label` on it: a `<span>` with a label is a nameless generic to most
   * screen readers, which either drop the name or need `role="img"` to keep it,
   * and real text needs neither. It is announced even when `alt=""` — that is
   * the point, since an empty `alt` says "the name is already beside me", and
   * the STATUS is not.
   */
  statusLabel?: string | undefined;
  /**
   * Which of the library's status colours the dot takes. Default `"neutral"`.
   *
   * Deliberately not `"online" | "away" | "busy"` — see `avatarStatusVariants`.
   * Ignored without a `statusLabel`, because a colour with nothing to say is
   * the defect this pair exists to prevent.
   */
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
  const { size, className, initials, statusLabel, statusTone } = props;

  /*
   * The wrapper is CONDITIONAL, and that is a compatibility decision rather
   * than a saving.
   *
   * `icon-stack.tsx` sizes and rings its DIRECT children (`[&>*]:size-8`,
   * `[&>*]:ring-2`). Wrapping every avatar unconditionally would move the
   * element those selectors land on, and every stack in every consuming app
   * would quietly change size — a break with no error and no failing test,
   * discovered in a screenshot. With no status there is no wrapper and the
   * emitted markup is byte-identical to what it has always been.
   *
   * `className` goes on the OUTERMOST element either way, which is what a
   * caller writing `className="ring-surface"` or a margin means by it.
   */
  const circle = (
    <span
      className={cn(avatarVariants({ size }), statusLabel === undefined ? className : undefined)}
    >
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

  if (statusLabel === undefined) return circle;

  return (
    <span className={cn(avatarStatusWrapperVariants({ size }), className)}>
      {circle}
      <span className={cn(avatarStatusVariants({ size, tone: statusTone ?? "neutral" }))}>
        {/*
         * Real text, not an `aria-label` — see `statusLabel`. It follows the
         * portrait in the DOM, so a reader hears the person and then their
         * state, in that order, which is the order the sentence is in.
         */}
        <span className="sr-only">{statusLabel}</span>
      </span>
    </span>
  );
}
