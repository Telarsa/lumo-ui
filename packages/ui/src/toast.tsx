"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ToastManager, ToastObject } from "@base-ui/react/toast";
import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";

/**
 * Transient notifications. BASE UI ENGINE.
 *
 *     export const toasts = createToastQueue();            // module scope
 *     <ToastRegion queue={toasts} locale={locale} label="اعلان‌ها" closeLabel="بستن" />
 *     toasts.add({ title: "ذخیره شد", tone: "positive" }, { timeout: 5000 })
 *
 * Public API unchanged; `createToastQueue` adapts `queue.add(content, options)`
 * onto Base UI's flat `manager.add(...)`. Base UI writes no `dir` on its portal,
 * so the region inherits `<html dir>` — the RAC `dir` defect is gone and `locale`
 * is KEPT but INERT (`toast.locale-prop-now-inert`). `label` and `closeLabel`
 * stay REQUIRED (Base UI's only English literal is `'Notifications'`; an ✕ is
 * not a name). Announcement comes from ONE live region on the viewport, so a
 * `<Toast>` outside it is silent; `Title`/`Description` are Base UI parts because
 * they mint the ids the root points at. NO timeout default: the adapter passes
 * `timeout: 0` (never auto-dismiss) — Base UI's 5000 would be a WCAG 2.2.1
 * moving target. Long form: `docs/decisions/log.md`.
 */

/**
 * The payload of a toast. `title` and `description` are `LumoNode`, so a bare
 * number is a compile error here exactly as it is in JSX.
 */
export interface LumoToastContent {
  title: LumoNode;
  description?: LumoNode | undefined;
  /** Optional visible action, such as Undo or Retry. */
  action?: { label: string; onAction: () => void } | undefined;
  /** Colour of the tone stripe. See `toastVariants` before relying on it. */
  tone?: ToastTone | undefined;
}

export type ToastTone = "neutral" | "positive" | "critical" | "caution";

/** Custom data Lumo attaches to a Base UI toast. Only the tone needs carrying. */
interface LumoToastData extends Record<string, unknown> {
  tone: ToastTone;
  action?: { label: string; onAction: () => void } | undefined;
}

/**
 * One queued toast, as handed to `Toast`'s `toast` prop. Flat (`.title`, not
 * `.content.title`) because Base UI's store owns the shape (`toast.queued-toast-shape`).
 */
export type LumoQueuedToast = ToastObject<LumoToastData>;

/**
 * The queue. A plain object over a `subscribe`-backed store, not a hook, so a
 * fetch wrapper or a route handler can raise a toast without a context.
 */
export interface LumoToastQueue {
  /** Raise a toast. Returns its id, which `close` accepts. No default `timeout` — pass it per toast. */
  add: (content: LumoToastContent, options?: { timeout?: number | undefined }) => string;
  /** Replace visible content/status without moving the toast in the queue. */
  update: (id: string, content: LumoToastContent) => void;
  /** Dismiss one toast, or all of them. */
  close: (id?: string) => void;
  /** The Base UI manager `ToastRegion` mounts. Public because queue and region are separate modules. */
  readonly manager: ToastManager<LumoToastData>;
  /** How many toasts are on screen at once. Read by `ToastRegion`. */
  readonly maxVisibleToasts: number | undefined;
}

/**
 * Creates the queue. Call this at MODULE scope, not inside a component:
 *
 *     export const toasts = createToastQueue();
 */
export function createToastQueue(options?: {
  /** How many toasts are on screen at once. The rest wait. */
  maxVisibleToasts?: number | undefined;
}): LumoToastQueue {
  const manager = BaseToast.createToastManager<LumoToastData>();
  const contentOptions = (content: LumoToastContent) => ({
    title: content.title as React.ReactNode,
    ...(content.description === undefined
      ? {}
      : { description: content.description as React.ReactNode }),
    data: {
      tone: content.tone ?? "neutral",
      ...(content.action === undefined ? {} : { action: content.action }),
    },
  });
  return {
    manager,
    maxVisibleToasts: options?.maxVisibleToasts,
    add: (content, addOptions) =>
      manager.add({
        ...contentOptions(content),
        // Base UI's own default is 5000; Lumo's is none, and `0` is "never auto-dismiss".
        timeout: addOptions?.timeout ?? 0,
      }),
    update: (id, content) => manager.update(id, contentOptions(content)),
    close: (id) => manager.close(id),
  };
}

/**
 * Where the stack sits. `start`/`end` rather than `left`/`right`, so `bottom-end`
 * is the bottom-LEFT corner on a Persian page; `bottom-*`/`top-*` stay physical
 * because the block axis does not mirror. `z-100`, the one layer that is not
 * `z-50`: the region is mounted once at the root, EARLIER in the document than
 * any dialog opened later, whose `z-50` scrim would otherwise paint over it —
 * hiding a failed-save toast exactly when it matters.
 */
export const toastRegionVariants = cva(
  "fixed z-100 flex w-[min(24rem,90vw)] flex-col gap-2 outline-none",
  {
    variants: {
      /** The viewport corner the stack anchors to; logical, so it mirrors under RTL. */
      placement: {
        "bottom-end": "bottom-4 end-4",
        "bottom-start": "bottom-4 start-4",
        "top-end": "top-4 end-4",
        "top-start": "top-4 start-4",
      },
    },
    defaultVariants: { placement: "bottom-end" },
  },
);

/**
 * `border-s-4` puts the tone stripe on the reader's leading edge, as `alert.tsx`
 * does. The tone is DECORATION (WCAG 1.4.1): put the word in the title. Base UI's
 * `priority: 'high'` (alertdialog + assertive) is deliberately NOT wired to
 * `tone="critical"` — a colour is not an interruption.
 */
export const toastVariants = cva(
  "pointer-events-auto flex items-start gap-3 rounded-md border border-border " +
    "border-s-4 bg-surface p-4 text-sm text-fg shadow-overlay outline-none " +
    // data-starting-style / data-ending-style; the offset is on the BLOCK axis.
    "transition-[opacity,transform] duration-200 ease-out " +
    "data-starting-style:opacity-0 data-starting-style:-translate-y-2 " +
    "data-ending-style:opacity-0 " +
    "motion-reduce:transition-none",
  {
    variants: {
      /** The notification's semantic color. */
      tone: {
        neutral: "border-s-border-strong",
        positive: "border-s-positive",
        critical: "border-s-critical",
        caution: "border-s-caution",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type ToastVariantProps = VariantProps<typeof toastVariants>;

export interface ToastProps {
  /** The queued toast handed to the region's render function. */
  toast: LumoQueuedToast;
  /**
   * Announced name of the dismiss control, e.g. «بستن». REQUIRED: icon-only
   * button, and Base UI supplies no default — the failure is a NAMELESS button.
   */
  closeLabel: string;
  className?: string | undefined;
}

/**
 * One toast. Exported separately because Lumo components are COPIED: a consumer
 * who wants an action button edits this function (`Toast.Action` is the part).
 */
export function Toast({ toast, closeLabel, className }: ToastProps) {
  const tone = toast.data?.tone ?? "neutral";
  return (
    // `data-lumo`: the toast root is a real focus stop (`role="dialog"`, F6).
    <BaseToast.Root
      toast={toast}
      data-lumo=""
      className={cn(toastVariants({ tone }), className)}
    >
      {/*
       * A plain layout box: `Toast.Content` carries no role or aria (the live
       * region is on the viewport). `min-w-0` keeps a long unbroken token from
       * pushing the toast wider than the region — in RTL that overflow escapes LEFT.
       */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/*
         * `Toast.Title`/`Toast.Description` mint the ids the root points at and
         * read the toast's own fields when given no children.
         */}
        <BaseToast.Title className="font-semibold" />
        {toast.description === undefined ? null : (
          <BaseToast.Description className="text-fg-muted" />
        )}
      </div>

      {toast.data?.action === undefined ? null : (
        <BaseToast.Action
          type="button"
          onClick={toast.data.action.onAction}
          className="shrink-0 rounded-sm px-2 py-1 font-medium text-accent hover:bg-surface-hover"
        >
          {toast.data.action.label}
        </BaseToast.Action>
      )}

      {/*
       * `Toast.Close` merges its `onClick` onto the element it is given.
       * `-me-1 -mt-1`: the inline nudge is logical, the block nudge cannot mirror.
       */}
      <BaseToast.Close
        render={
          <IconButton
            label={closeLabel}
            variant="ghost"
            size="sm"
            className="-me-1 -mt-1 shrink-0"
          >
            {/* Drawn inline: no icon dependency, and an ✕ is symmetric under mirroring. */}
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
        }
      />
    </BaseToast.Root>
  );
}

export interface ToastRegionProps extends VariantProps<typeof toastRegionVariants> {
  /** The queue from `createToastQueue()`. */
  queue: LumoToastQueue;
  /**
   * The locale the region is rendered for: Base UI writes no `dir` on its
   * portal, so the region sets `dir={direction(locale)}` itself — a toast that
   * arrives from outside the provider tree still reads in the right direction.
   */
  locale: Locale;
  /** Announced name of the notification landmark, e.g. «اعلان‌ها». REQUIRED — Base UI's default is English. */
  label: string;
  /** Announced name of every toast's dismiss control, e.g. «بستن». REQUIRED. */
  closeLabel: string;
  className?: string | undefined;
}

/** The mapping, split out so it can call `useToastManager` inside the Provider. */
function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = BaseToast.useToastManager<LumoToastData>();
  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} closeLabel={closeLabel} />
      ))}
    </>
  );
}

/** Mount ONCE, near the root. Costs the served HTML a single empty region element. */
export function ToastRegion({
  queue,
  locale,
  label,
  closeLabel,
  placement,
  className,
}: ToastRegionProps) {
  return (
    <BaseToast.Provider
      toastManager={queue.manager}
      // React Aria's `maxVisibleToasts` is Base UI's `limit`; same meaning.
      {...(queue.maxVisibleToasts === undefined ? {} : { limit: queue.maxVisibleToasts })}
    >
      <BaseToast.Portal>
        <BaseToast.Viewport
          data-lumo=""
          dir={direction(locale)}
          aria-label={label}
          className={cn(toastRegionVariants({ placement }), className)}
        >
          <ToastList closeLabel={closeLabel} />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
