"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A chip — a filter, a selected value, a keyword — optionally removable. No
 * engine: a `<span>`, a `<button>` and an inline `<svg>`. `"use client"` only
 * because `onRemove` is a function prop. `removeLabel` is required BY THE TYPE
 * when the tag is removable: the ✕ has no name of its own, and a convention has
 * already failed on this project.
 */
export const tagVariants = cva(
  "inline-flex w-fit max-w-full items-center rounded-md border border-border " +
    "bg-surface-sunken text-fg align-middle whitespace-nowrap " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /** The tag-size step. */
      size: {
        // `ps-`/`pe-` rather than `px-`: the removable form trims the inline END.
        sm: "h-6 gap-1 ps-2 pe-2 text-xs",
        md: "h-7 gap-1.5 ps-2.5 pe-2.5 text-sm",
      },
      removable: {
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
  /** Announced name of the remove control, e.g. «حذف تهران». REQUIRED — name the thing being removed, not the action alone. */
  removeLabel: string;
}

interface StaticTagProps extends Omit<TagBaseProps, "removable"> {
  onRemove?: undefined;
  removeLabel?: undefined;
}

export type TagProps = RemovableTagProps | StaticTagProps;

export function Tag(props: TagProps) {
  const { children, size, className } = props;
  // `onRemove` is the discriminant; the button branch cannot be entered without `removeLabel`.
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
            // `ms-0.5 -me-1`: inline-relative, so it lands on the LEFT in Persian automatically.
            "relative -me-1 ms-0.5 inline-flex size-5 shrink-0 items-center justify-center",
            "rounded-sm text-fg-muted transition-colors cursor-pointer",
            "hover:bg-surface-hover hover:text-fg",
            "active:translate-y-px",
            // The HIT AREA is expanded with a transparent pseudo-element: the target grows, the layout does not.
            "after:absolute after:-inset-2.5 after:content-['']",
          )}
        >
          {/* An ✕ drawn inline: no icon dependency, and symmetric under mirroring. */}
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
