import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, type Locale, type LumoNode } from "@lumo-ui/core";
import { IconButton, type IconButtonProps } from "./button.tsx";
import { ProgressBar } from "./progress.tsx";
import { formatFileSize } from "./file-upload.variants.ts";

/**
 * A named file in a conversation: the chip in a composer before sending, the
 * card on a message after.
 *
 *     <Attachment locale="fa-IR" state="done">
 *       <AttachmentMedia>…icon…</AttachmentMedia>
 *       <AttachmentContent>
 *         <AttachmentName>گزارش-فروش.pdf</AttachmentName>
 *         <AttachmentMeta locale={locale} size={1258291}>
 *           <span>پی‌دی‌اف</span>
 *         </AttachmentMeta>
 *       </AttachmentContent>
 *       <AttachmentRemove label="حذف گزارش-فروش.pdf" onPress={drop} />
 *     </Attachment>
 *
 * Distinct from `FileUploadItem` (a row INSIDE the picker widget): this is the
 * standalone conversation object. No `"use client"` — styled divs and spans,
 * so a message history renders on the server. The card's remove overlay is
 * `top-*`/`end-*` (block plus LOGICAL inline); `AttachmentMeta` formats a raw
 * byte count through `formatFileSize` so digits AND unit are localised.
 * `state="error"` recolours only — put the failure text in `AttachmentMeta`.
 */

export const attachmentVariants = cva(
  "group/lumo-attachment relative flex max-w-full min-w-0 rounded-lg border " +
    "border-border bg-surface text-fg " +
    "data-[state=error]:border-critical/40",
  {
    variants: {
      variant: {
        // `ps-3 pe-1.5`: an asymmetric LOGICAL pair, exactly where a physical spelling would break Persian.
        row: "w-fit min-w-56 items-center gap-3 ps-3 pe-1.5 py-2",
        card: "w-32 flex-col gap-1.5 p-2",
      },
    },
    defaultVariants: { variant: "row" },
  },
);

export type AttachmentState = "uploading" | "error" | "done";

export interface AttachmentProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
  /** `row` is the composer chip; `card` is the thumbnail for image-led media. */
  variant?: "row" | "card" | undefined;
  /** Styling state only — pair `error` with visible text in `AttachmentMeta`. */
  state?: AttachmentState | undefined;
}

export function Attachment({
  variant = "row",
  state = "done",
  className,
  ...props
}: AttachmentProps) {
  return (
    <div
      // Stamped so descendants can restyle per state/shape with group-data variants.
      data-variant={variant}
      data-state={state}
      className={cn(attachmentVariants({ variant }), className)}
      {...props}
    />
  );
}

export const attachmentMediaVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden " +
    "rounded-md bg-surface-sunken text-fg-muted " +
    "[&_svg]:pointer-events-none [&_svg]:size-5 " +
    "group-data-[state=error]/lumo-attachment:bg-critical/10 " +
    "group-data-[state=error]/lumo-attachment:text-critical",
  {
    variants: {
      media: {
        icon: "size-10 group-data-[variant=card]/lumo-attachment:h-20 group-data-[variant=card]/lumo-attachment:w-full",
        image:
          "size-10 group-data-[variant=card]/lumo-attachment:h-20 group-data-[variant=card]/lumo-attachment:w-full " +
          "[&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: { media: "icon" },
  },
);

export interface AttachmentMediaProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
  /** `image` crops a child img to the box; `icon` sizes a child svg. */
  media?: "icon" | "image" | undefined;
}

export function AttachmentMedia({ media = "icon", className, ...props }: AttachmentMediaProps) {
  return <div className={cn(attachmentMediaVariants({ media }), className)} {...props} />;
}

export interface AttachmentSectionProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function AttachmentContent({ className, ...props }: AttachmentSectionProps) {
  return (
    <div
      className={cn("flex max-w-full min-w-0 flex-1 flex-col gap-0.5 leading-tight", className)}
      {...props}
    />
  );
}

export interface AttachmentNameProps
  extends Omit<ComponentProps<"span">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The filename. `dir="auto"`: filenames are the classic mixed-script run, and
 * only first-strong gets both right. A name whose letters are all Latin declares
 * itself an island — the same rule `FileUploadItem` applies — so `photo.png` is
 * graded as the Latin content it is and «گزارش.pdf» is not forced LTR.
 */
export function AttachmentName({ className, children, ...props }: AttachmentNameProps) {
  const latin = typeof children === "string" && !/(?=\p{L})[^\p{Script=Latin}]/u.test(children);
  return (
    <span
      dir="auto"
      {...(latin ? { "data-lumo-latn": "" } : {})}
      className={cn("block max-w-full min-w-0 truncate text-sm font-medium", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AttachmentMetaProps
  extends Omit<ComponentProps<"span">, "children" | "className"> {
  locale: Locale;
  /** Raw byte count, formatted through `formatFileSize` («۱٫۲ مگابایت»). Pass the number; never pre-format. */
  size?: number | undefined;
  /** Further metadata, each piece in its own element; the CSS middot separator follows FLOW order and so mirrors. */
  children?: LumoNode;
  className?: string | undefined;
}

export const attachmentMetaVariants = cva(
  "flex max-w-full min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 " +
    "text-xs text-fg-muted " +
    "group-data-[state=error]/lumo-attachment:text-critical " +
    "[&>*+*]:before:me-1.5 [&>*+*]:before:content-['·']",
);

export function AttachmentMeta({ locale, size, className, children, ...props }: AttachmentMetaProps) {
  return (
    <span className={cn(attachmentMetaVariants(), className)} {...props}>
      {size !== undefined ? <span>{formatFileSize(size, locale)}</span> : null}
      {children}
    </span>
  );
}

export interface AttachmentProgressProps {
  locale: Locale;
  /** Announced name of the operation, e.g. «بارگذاری گزارش-فروش.pdf». REQUIRED — an unnamed bar is "progress bar, ۴۵٪". */
  label: string;
  /** Fraction complete, 0–1. Formatted as a percentage in the locale's digits. */
  value: number;
  className?: string | undefined;
}

/** The uploading state's bar: `ProgressBar` with `maxValue` pinned to 1, so the 0–1 fraction is the value. */
export function AttachmentProgress({ locale, label, value, className }: AttachmentProgressProps) {
  return (
    <ProgressBar
      locale={locale}
      label={label}
      value={value}
      maxValue={1}
      size="sm"
      className={cn("w-full", className)}
    />
  );
}

export interface AttachmentRemoveProps extends Omit<IconButtonProps, "children" | "size"> {
  /** The size step on the shared control scale. */
  size?: IconButtonProps["size"];
}

/**
 * The ✕. Icon-only, so `label` is REQUIRED — name the file in the phrase.
 * In the card variant it overlays the trailing corner via `top-*`/`end-*`.
 */
export function AttachmentRemove({
  variant = "ghost",
  size = "sm",
  className,
  ...props
}: AttachmentRemoveProps) {
  return (
    <IconButton
      variant={variant}
      size={size}
      className={cn(
        "ms-auto shrink-0 text-fg-muted " +
          "group-data-[variant=card]/lumo-attachment:absolute " +
          "group-data-[variant=card]/lumo-attachment:top-1 " +
          "group-data-[variant=card]/lumo-attachment:end-1 " +
          "group-data-[variant=card]/lumo-attachment:bg-surface/80",
        className,
      )}
      {...props}
    >
      {/* Drawn inline like tag-group's: symmetric under mirroring, no icon dependency. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="size-3.5"
      >
        <path d="M4 4 12 12M12 4 4 12" />
      </svg>
    </IconButton>
  );
}

/** A horizontally scrolling rail of attachments. A scroll container's inline axis follows the document direction natively. */
export const attachmentGroupVariants = cva(
  "flex max-w-full min-w-0 snap-x gap-2 overflow-x-auto overscroll-x-contain py-1 " +
    "[&>*]:shrink-0 [&>*]:snap-start",
);

export function AttachmentGroup({ className, ...props }: AttachmentSectionProps) {
  return <div className={cn(attachmentGroupVariants(), className)} {...props} />;
}
