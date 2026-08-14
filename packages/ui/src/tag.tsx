"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A chip — a filter, a selected value, a keyword — optionally removable.
 *
 * ── NO ENGINE, AND THIS FILE IS THE MIGRATION'S CONTROL GROUP ──────────────
 *
 * Nothing here changed for the Base UI branch, because there was nothing to
 * change: this file imported no component library before the migration and
 * imports none after it. A `<span>`, a `<button type="button">` and an inline
 * `<svg>`, with `cva` and `cn`.
 *
 * That is worth recording rather than skipping past. The engine census that
 * prices this migration counts 77 components; `state-vocabulary.json` measures
 * that 34 of them carry zero state selectors. This one goes further — zero
 * selectors AND zero imports — so its cost on every axis the migration is
 * measured on is exactly nothing, and it is the baseline the expensive files
 * should be read against. `tag-group.tsx`, one file over, is the same idea with
 * a collection under it and was one of the most expensive in the set.
 *
 * `"use client"` is required and is NOT about React Aria: `onRemove` is a
 * function prop, and a function cannot cross the server/client boundary. Left
 * off, a removable Tag rendered from a server component fails at build with
 * "Functions cannot be passed directly to Client Components". The static form
 * would happily be a server component, but splitting the file in two to save a
 * few bytes on the non-removable case is not worth two components that must be
 * kept in sync.
 *
 * ── `removeLabel` is required BY THE TYPE when the tag is removable ─────────
 * The remove control is an icon button: an ✕ glyph with no text. It therefore
 * has no accessible name of its own, and a screen reader announces it as the
 * bare role — "button" — repeated once per tag. That is measured, not
 * hypothetical: a prototype shipped 33 unnamed controls of exactly this shape.
 *
 * A convention ("remember to pass a label") has already failed on this project.
 * A discriminated union does not: `onRemove` present without `removeLabel` is
 * TS2322 in the editor, and `removeLabel` alone is meaningless so it is
 * unrepresentable too. There is no English default, because the library ships
 * none — «حذف برچسب فلان» must come from the consumer, who knows the tag's name
 * and the Persian word order it belongs in.
 */
export const tagVariants = cva(
  "inline-flex w-fit max-w-full items-center rounded-md border border-border " +
    "bg-surface-sunken text-fg align-middle whitespace-nowrap " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /** The tag-size step. */
      size: {
        // `ps-`/`pe-` rather than `px-`: a removable tag needs less padding on
        // the inline END, where the remove button already contributes its own.
        sm: "h-6 gap-1 ps-2 pe-2 text-xs",
        md: "h-7 gap-1.5 ps-2.5 pe-2.5 text-sm",
      },
      removable: {
        // The remove button carries `-me-1`, so the chip's own inline-end
        // padding is trimmed to keep the glyph optically centred in the cap.
        true: "pe-1",
        false: "",
      },
    },
    defaultVariants: { size: "md", removable: false },
  },
);

interface TagBaseProps extends VariantProps<typeof tagVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

interface RemovableTagProps extends Omit<TagBaseProps, "removable"> {
  /** Called when the remove control is activated. */
  onRemove: () => void;
  /**
   * Announced name of the remove control, e.g. «حذف تهران».
   *
   * REQUIRED. See the file header — this is the prop the whole union exists to
   * force. Name the thing being removed, not the action alone: a list of eight
   * filters otherwise announces "remove" eight times with nothing to tell them
   * apart.
   */
  removeLabel: string;
}

interface StaticTagProps extends Omit<TagBaseProps, "removable"> {
  onRemove?: undefined;
  removeLabel?: undefined;
}

export type TagProps = RemovableTagProps | StaticTagProps;

export function Tag(props: TagProps) {
  const { children, size, className } = props;
  // `undefined` is a unit type, so TypeScript treats `onRemove` as a valid
  // discriminant and narrows `props.removeLabel` to `string` inside this
  // branch. That is the whole mechanism: the label cannot be forgotten because
  // the branch that renders the button cannot be entered without it.
  const isRemovable = props.onRemove !== undefined;

  return (
    <span className={cn(tagVariants({ size, removable: isRemovable }), className)}>
      <span className="truncate">{children}</span>
      {props.onRemove !== undefined ? (
        <button
          type="button"
          data-lumo=""
          aria-label={props.removeLabel}
          onClick={props.onRemove}
          className={cn(
            // `ms-0.5 -me-1`: nudged toward the inline end of the chip. In
            // Persian this lands on the LEFT, automatically, because the
            // margins are inline-relative. The `ml-`/`mr-` version of this line
            // is the single most copied RTL defect in chip components.
            "relative -me-1 ms-0.5 inline-flex size-5 shrink-0 items-center justify-center",
            "rounded-sm text-fg-muted transition-colors cursor-pointer",
            "hover:bg-surface-hover hover:text-fg",
            // The press. Not self-answering: the chip is REMOVED, so the
            // element that would have shown a new state is gone.
            "active:translate-y-px",
            // The visible glyph is 20px, which is below the 44px touch floor
            // Khroos specifies. Inflating the chip to 44px would make a row of
            // filters unusable, so the HIT AREA is expanded with a transparent
            // pseudo-element instead — the target grows, the layout does not.
            "after:absolute after:-inset-2.5 after:content-['']",
          )}
        >
          {/*
           * An ✕ drawn inline rather than imported. Two reasons: a copy-in
           * component with no icon dependency is one fewer thing a consuming
           * repo must install, and this particular glyph is diagonally
           * symmetric, so it is identical under mirroring. A chevron or an
           * arrow here would need `rtl:-scale-x-100`; an ✕ needs nothing.
           */}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="size-3"
          >
            <path d="M4 4 12 12M12 4 4 12" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
