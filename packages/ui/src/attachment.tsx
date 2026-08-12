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
 * Distinct from `FileUploadItem` in file-upload.tsx the way `tag.tsx` is
 * distinct from `tag-group.tsx`: that one is a row INSIDE the picker widget,
 * wired to the drop zone's lifecycle; this one is the standalone conversation
 * object, composable into bubbles, messages and composers with no drop zone
 * anywhere in sight. Both format bytes through the same `formatFileSize`.
 *
 * No `"use client"` — every piece here is a styled div or span, so a message
 * history full of attachments renders on the server and costs no hydration.
 * `AttachmentRemove` and `AttachmentProgress` compose client components
 * (IconButton, ProgressBar); rendering those from a server tree is fine because
 * their props are strings and numbers — except `onPress`, which only a client
 * caller can supply, and a remove control is only meaningful where there is a
 * handler to call anyway.
 *
 * ── Vendored shape, rewritten ───────────────────────────────────────────────
 * The anatomy (root / media / content / title / description / actions) is
 * shadcn's `attachment` in the aria-vega style. What upstream got wrong or
 * Lumo does not carry:
 *
 *  1. The vertical card pins its actions with a physical top/right pin — physical, so
 *     in Persian the remove control covers the START of the filename instead
 *     of the trailing corner. Here the overlay is `top-*`/`end-*`: block axis
 *     plus logical inline.
 *  2. Upstream has no formatting story at all: the metadata line is a bare
 *     span the caller fills, which in practice becomes `1.2 MB` in Latin on
 *     every page. `AttachmentMeta` takes the raw byte count and formats it
 *     through `formatFileSize` — Persian digits AND «مگابایت», never a Latin
 *     unit glued to a Persian numeral. The unit is deliberately NOT a prop:
 *     Intl's CLDR data supplies it per locale, which is one fewer string a
 *     caller can get wrong. See file-upload.variants.ts for the measurement.
 *  3. Upstream's five states include `idle` (a picker affordance, not an
 *     attachment fact) and `processing` (styled with a `shimmer` utility Lumo's
 *     theme does not define). Three remain: `uploading`, `error`, `done`.
 *  4. `AttachmentTrigger` — an absolutely positioned button stretched over the
 *     whole card — is dropped: with a remove button inside, it nests one
 *     interactive control inside another's hit area, and a control whose name
 *     would be the entire card is not a control this library wants to default.
 *
 * `state="error"` recolours the chrome, and colour alone is not information
 * (WCAG 1.4.1): put the failure text in `AttachmentMeta`, where it is visible
 * and announced, e.g. «بارگذاری ناموفق».
 */

export const attachmentVariants = cva(
  "group/lumo-attachment relative flex max-w-full min-w-0 rounded-lg border " +
    "border-border bg-surface text-fg " +
    "data-[state=error]:border-critical/40",
  {
    variants: {
      variant: {
        // `ps-3 pe-1.5`: room for the name at the reading edge, tight against
        // the remove control at the trailing edge. The asymmetric pair is
        // exactly where a physical spelling would break Persian.
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
      // Stamped so descendants can restyle per state/shape with group-data
      // variants. Written here rather than inherited: this component has no
      // engine under it at all, so nothing else publishes the state.
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
 * The filename. `dir="auto"` because filenames are the classic mixed-script
 * run: «گزارش-فروش.pdf» starts Persian, "report.pdf" starts Latin, and only
 * the first-strong heuristic gets both right inside the same Persian page.
 * `truncate` then puts the ellipsis on the span's own resolved END, so a long
 * Latin name clips after its extension side and a Persian one after its.
 */
export function AttachmentName({ className, ...props }: AttachmentNameProps) {
  return (
    <span
      dir="auto"
      className={cn("block max-w-full min-w-0 truncate text-sm font-medium", className)}
      {...props}
    />
  );
}

export interface AttachmentMetaProps
  extends Omit<ComponentProps<"span">, "children" | "className"> {
  locale: Locale;
  /**
   * Raw byte count. Formatted through `formatFileSize`, so a Persian page gets
   * «۱٫۲ مگابایت» — digits and unit both localized. Pass the number; never
   * pre-format, and never render `file.size` directly (LumoNode already makes
   * that a compile error).
   */
  size?: number | undefined;
  /**
   * Further metadata, each piece in its own element — the kind («پی‌دی‌اف»),
   * an error line, a duration. Pieces are separated by a middot drawn by CSS
   * on each element after the first, so the visual order is the FLOW order:
   * it mirrors under RTL with no per-piece direction handling.
   */
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
  /**
   * Announced name of the operation, e.g. «بارگذاری گزارش-فروش.pdf».
   *
   * REQUIRED. A progress bar has no text of its own, and the bar this renders
   * is announced with its percentage — an unnamed one is "progress bar, ۴۵٪"
   * with no clue what is at 45%.
   */
  label: string;
  /** Fraction complete, 0–1. Formatted as a percentage in the locale's digits. */
  value: number;
  className?: string | undefined;
}

/**
 * The uploading state's bar. A thin wrapper over ProgressBar with `maxValue`
 * pinned to 1, so the 0–1 fraction every upload API hands out is the value —
 * no ×100 at the call site, and the announced `aria-valuetext` comes out
 * through Intl as «۴۵٪» on a Persian page — `ProgressBar` takes the locale as a
 * prop and formats against it, rather than falling back to whatever locale the
 * browser happens to be set to.
 */
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
  size?: IconButtonProps["size"];
}

/**
 * The ✕. Icon-only, so `label` is REQUIRED by the type it extends — name the
 * file in the phrase («حذف گزارش-فروش.pdf»), because a row of attachments with
 * eight identical «حذف» buttons is the unnamed-controls defect with extra
 * steps. In the card variant it overlays the trailing corner: `top-*` (block
 * axis, direction-invariant) plus `end-*` (logical inline).
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
      {/* Drawn inline like tag-group's: diagonally symmetric, so identical
       * under mirroring, and no icon dependency in a copied file. */}
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

/**
 * A horizontally scrolling rail of attachments, as in a composer. A scroll
 * container's inline axis follows the document direction natively, so there is
 * nothing to mirror — Persian scrolls from the right because the browser says
 * so, not because this file does.
 */
export const attachmentGroupVariants = cva(
  "flex max-w-full min-w-0 snap-x gap-2 overflow-x-auto overscroll-x-contain py-1 " +
    "[&>*]:shrink-0 [&>*]:snap-start",
);

export function AttachmentGroup({ className, ...props }: AttachmentSectionProps) {
  return <div className={cn(attachmentGroupVariants(), className)} {...props} />;
}
