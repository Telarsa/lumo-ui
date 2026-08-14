"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ToastManager, ToastObject } from "@base-ui/react/toast";
import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";

/**
 * Transient notifications. **BASE UI ENGINE.**
 *
 *     // module scope — outside React, so any code can raise a toast
 *     export const toasts = createToastQueue();
 *
 *     // once, near the root of the app
 *     <ToastRegion queue={toasts} locale={locale} label="اعلان‌ها" closeLabel="بستن" />
 *
 *     // anywhere
 *     toasts.add({ title: "ذخیره شد", tone: "positive" }, { timeout: 5000 })
 *
 * The public API above is UNCHANGED. Base UI's own store has a different shape
 * — `manager.add({ title, description, timeout, data })`, one flat object — and
 * `createToastQueue` is the adapter over it, because `queue.add(content,
 * options)` is what every call site in this repo and every copy of this file
 * already writes.
 *
 * ═══ THE `dir` DEFECT THIS FILE WAS BUILT AROUND IS GONE ════════════════════
 *
 * Two thirds of the React Aria version of this header was about one bug.
 * `ToastRegion` was one of only two RAC components that stamped a `dir`
 * attribute on the element it rendered, it rendered that element through
 * `createPortal(region, document.body)`, and it wrote `dir` AFTER the prop
 * spread from `useLocale()` — which during SSR is a hardcoded
 * `{locale:'en-US', direction:'ltr'}`. A correct Persian page, viewed on a
 * machine whose browser is set to en-US, laid its toasts out left-to-right: the
 * close button on the far side, the tone stripe on the wrong edge, everything
 * else on the page still RTL. The fix was to mount an `I18nProvider` from a
 * required `locale` prop.
 *
 * Base UI writes no `dir` anywhere. Measured on an open toast region:
 *
 *     <div tabindex="-1" role="region" aria-live="polite" aria-atomic="false"
 *          aria-relevant="additions text" aria-label="اعلان‌ها">
 *
 * — no `dir`, so the portalled node INHERITS `dir="rtl"` from `<html>`, which is
 * what `LumoHtml` put there and what should have happened all along. The
 * `I18nProvider` is deleted along with the `FORMAT_LOCALE` import it needed.
 *
 * `locale` is KEPT as a required prop because the public API may not change, and
 * it is now inert. That is stated rather than hidden: a prop whose docblock still
 * claimed to be "the only way to reach the `dir` RAC writes on its own portal"
 * would be a lie that survives review for years. Recorded as
 * `toast.locale-prop-now-inert`.
 *
 * ── ENGLISH: TWO STRINGS BECAME ONE, AND IT IS STILL REACHABLE ─────────────
 *
 * React Aria leaked two. `useToastRegion` named the landmark
 * `props['aria-label'] || stringFormatter.format('notifications', {count})` →
 * `"1 notification."`, and under the I18nProvider that digit became Persian
 * while the noun did not — measured `aria-label="۱ notification."`, the worst of
 * both. `useToast` set the close button to `"Close"`.
 *
 * Base UI's whole toast module contains exactly ONE user-facing English literal.
 * Grepped, not assumed: `'Notifications'` at
 * `toast/viewport/ToastViewport.mjs:184`, in a `defaultProps` object that is
 * merged BEFORE the caller's, so an `aria-label` wins. Verified by render —
 * «اعلان‌ها» lands. `Toast.Close` has no default name at all.
 *
 * Both props stay REQUIRED anyway. `label` because the fallback is an English
 * name on a `role="region"` that is spoken every time the region takes focus;
 * `closeLabel` because the control is an ✕ and an ✕ is not a name in any
 * language, which is the reason `IconButton` exists. The string is also already
 * catalogued in `@lumo-ui/base-ui-ssr`'s `BASE_UI_STRINGS.toast.viewport`, for
 * consumers who do not make it required.
 *
 * ── WHERE THE ANNOUNCEMENT COMES FROM NOW ──────────────────────────────────
 *
 * React Aria put `role="alert"` + `aria-atomic` on each toast's CONTENT, so
 * every toast announced itself. Base UI puts one polite live region on the
 * VIEWPORT (`aria-live="polite" aria-relevant="additions text"`) and gives each
 * toast `role="dialog"` with `aria-labelledby`/`aria-describedby` wired to its
 * own Title and Description. Measured, both.
 *
 * Same outcome, different mechanism, and the difference matters for one reason:
 * the announcement now depends on the toast being INSIDE the viewport, so a
 * `<Toast>` rendered anywhere else is silent. That is why `ToastRegion` renders
 * the mapping itself rather than exposing the list.
 *
 * `Title` and `Description` are Base UI PARTS, not styled `<p>`s, for the same
 * reason the React Aria build used `Text slot="title"`: they mint the ids the
 * root's `aria-labelledby`/`aria-describedby` point at. A plain element with the
 * same text leaves the root pointing at nothing — the dangling-IDREF class
 * `hydrated.test.tsx` exists to catch.
 *
 * ── THE TIMEOUT DEFAULT IS INVERTED UPSTREAM, AND THAT IS A WCAG PROBLEM ────
 *
 * `ToastObject.timeout` is documented `@default 5000`. Lumo has deliberately had
 * NO default: an auto-dismissing toast is a moving target under WCAG 2.2.1, a
 * library-chosen duration is the one number nobody revisits, and anything a user
 * must act on should have no timeout at all.
 *
 * Adopting Base UI's store as-is would have given every existing `toasts.add(…)`
 * call in every consuming project a five-second fuse, with nothing red anywhere.
 * `createToastQueue` passes `timeout: 0` — Base UI's "never auto-dismiss" — when
 * the caller gives none. The default is restored at the adapter, which is the
 * only place it can be restored without an API change.
 *
 * Base UI does pause every visible timer while the viewport is hovered or
 * focused, exactly as React Aria did, which is what makes an explicit timeout
 * defensible at all.
 */

/**
 * The payload of a toast.
 *
 * `title` and `description` are `LumoNode`, so `toasts.add({ title: count })`
 * with a bare number is a compile error here exactly as it is in JSX — a queue
 * is usually filled from an event handler, which is precisely where someone
 * interpolates an unformatted total into "۳ پیام" and ships Latin digits.
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
 * One queued toast, as handed to `Toast`'s `toast` prop.
 *
 * API CHANGE, forced and unavoidable: this was `QueuedToast<LumoToastContent>`
 * from React Aria, whose payload sat under `.content`. Base UI's object is flat
 * — `.title`, `.description`, `.data` — because its store, not Lumo's, owns the
 * shape. A consumer who wrote `toast.content.title` inside their copy of
 * `<Toast>` has to write `toast.title`; a consumer who only ever passed the
 * object through, which is what the documented usage does, changes nothing.
 * Recorded as `toast.queued-toast-shape`.
 */
export type LumoQueuedToast = ToastObject<LumoToastData>;

/**
 * The queue. A plain object with a `subscribe`-backed store underneath, not a
 * hook — and that is the whole point, unchanged from the React Aria build: a
 * fetch wrapper, a route handler's error branch or a service worker message can
 * raise a toast without being a React component and without a context to reach
 * for.
 */
export interface LumoToastQueue {
  /**
   * Raise a toast. Returns its id, which `close` accepts.
   *
   * On `timeout`: pass it per toast. There is deliberately no default — see the
   * file header, and note that this adapter has to ACT to keep it that way.
   */
  add: (content: LumoToastContent, options?: { timeout?: number | undefined }) => string;
  /** Replace visible content/status without moving the toast in the queue. */
  update: (id: string, content: LumoToastContent) => void;
  /** Dismiss one toast, or all of them. */
  close: (id?: string) => void;
  /**
   * The Base UI manager `ToastRegion` mounts. Public because a queue and the
   * component that renders it are separate modules by design; not something a
   * call site should need.
   */
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
        // See the file header. Base UI's own default is 5000; Lumo's is none,
        // and `0` is Base UI's spelling of "never auto-dismiss".
        timeout: addOptions?.timeout ?? 0,
      }),
    update: (id, content) => manager.update(id, contentOptions(content)),
    close: (id) => manager.close(id),
  };
}

/**
 * Where the stack sits.
 *
 * `start`/`end` rather than `left`/`right`: the default `bottom-end` is the
 * bottom-LEFT corner on a Persian page and the bottom-right on an English one,
 * from one class, with no `rtl:` variant to forget. `bottom-*`/`top-*` stay
 * physical on purpose — the block axis does not mirror with reading direction,
 * and inventing a logical spelling for it would only obscure that.
 *
 * These now work by INHERITANCE rather than in spite of the engine: with no
 * `dir` written on the portal root, `end-4` resolves against `<html dir>`.
 *
 * ── `z-100`, AND IT IS THE ONE LAYER IN THE LIBRARY THAT IS NOT `z-50` ──────
 *
 * Every other floating surface here — popover, menu, select, combobox, tooltip,
 * hover card, navigation menu, dialog, drawer — is `z-50`, and that is correct
 * for all of them: they are portalled to `<body>` and OPENED ON DEMAND, so the
 * most recently opened one is last in document order and wins the tie by
 * painting order alone. No number needs to arbitrate between them.
 *
 * The toast region is the exception because it is the only one that is NOT
 * opened on demand. It is mounted once, at the app root, before anything else
 * exists — so at `z-50` it is EARLIER in the document than a dialog that opens
 * later, and the dialog's `fixed inset-0 z-50 bg-scrim` scrim paints over
 * it. The stack is still there, still announced, and completely invisible
 * behind the dim layer.
 *
 * That is the worst possible case for this component in particular: a toast is
 * how a failed save reports itself, and a failed save inside a modal is exactly
 * when one is raised. The bug hides the message precisely when it matters.
 *
 * shadcn reaches the same number from the same reasoning — sonner's toaster
 * sits above the dialog layer rather than beside it.
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
 * `border-s-4` puts the tone stripe on the reader's leading edge — left in
 * English, right in Persian — the same way `alert.tsx` does it.
 *
 * The tone is DECORATION. A `critical` toast whose only signal of failure is a
 * red stripe fails WCAG 1.4.1 for anyone who cannot see it, and a toast is read
 * from its title and description alone. Put the word in the title: «ذخیره نشد»,
 * not «ذخیره» in red.
 *
 * Base UI offers `priority: 'high'`, which promotes the toast to
 * `role="alertdialog"` and an assertive announcement. It is NOT wired to
 * `tone="critical"`: tone is a colour and priority is an interruption, and
 * silently making every red toast interrupt the user's current sentence is the
 * kind of coupling that is discovered in the field. Recorded as available.
 */
export const toastVariants = cva(
  "pointer-events-auto flex items-start gap-3 rounded-md border border-border " +
    "border-s-4 bg-surface p-4 text-sm text-fg shadow-overlay outline-none " +
    // Transition vocabulary, same two renames as every other overlay in this
    // migration: data-entering → data-starting-style, data-exiting →
    // data-ending-style. The offset is on the BLOCK axis, which does not mirror.
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
   * Announced name of the dismiss control, e.g. «بستن».
   *
   * REQUIRED. It is an icon-only button, so there is no visible text to fall
   * back on. Base UI supplies no default here — unlike React Aria's "Close" —
   * which makes the unlabelled failure mode a NAMELESS button rather than an
   * English one: worse, because nothing on screen says a string is missing.
   */
  closeLabel: string;
  className?: string | undefined;
}

/**
 * One toast.
 *
 * Exported separately from `ToastRegion` because Lumo components are COPIED, not
 * imported — a consumer who wants an action button or an icon in the body edits
 * this function rather than waiting for a `renderToast` prop that would have to
 * anticipate them. `Toast.Action` is the Base UI part for that.
 */
export function Toast({ toast, closeLabel, className }: ToastProps) {
  const tone = toast.data?.tone ?? "neutral";
  return (
    // `data-lumo` because Base UI's toast root is a real focus stop
    // (`role="dialog"`, and the viewport moves focus into it on F6), so it needs
    // the system focus ring.
    <BaseToast.Root
      toast={toast}
      data-lumo=""
      className={cn(toastVariants({ tone }), className)}
    >
      {/*
       * A plain layout box. Base UI's `Toast.Content` exists but carries no role
       * and no aria — the live region is on the viewport now, not per toast (see
       * the file header) — so there is nothing to rent here, and a `<div>` says
       * that honestly.
       *
       * `min-w-0` keeps a long unbroken token — a filename, an order reference —
       * from pushing the toast wider than the region. In RTL that overflow
       * escapes to the LEFT, which is the side nobody checks at 320px.
       */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/*
         * `Toast.Title`/`Toast.Description` render the queued values and mint
         * the ids the root points `aria-labelledby`/`aria-describedby` at. With
         * no children they read the toast's own fields, which is why nothing is
         * interpolated here — the values were already `LumoNode` at `add()`.
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
       * `Toast.Close` merges its `onClick` onto the element it is given, which
       * replaces React Aria's `slot="close"` context wiring. `IconButton`'s
       * `label` is the name; there is no engine-supplied string to beat here.
       *
       * `-me-1 -mt-1`: pulled toward the toast's inline END and block start.
       * The inline nudge is logical, so it lands on the left in Persian without
       * a second rule; the block nudge cannot mirror and does not need to.
       */}
      <BaseToast.Close
        render={
          <IconButton
            label={closeLabel}
            variant="ghost"
            size="sm"
            className="-me-1 -mt-1 shrink-0"
          >
            {/*
             * Drawn inline: a copy-in component with no icon dependency is one
             * fewer install for a consuming repo, and an ✕ is diagonally
             * symmetric so it is identical under mirroring. Same reasoning as
             * `tag.tsx`.
             */}
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
   * The locale the region is rendered for.
   *
   * NOW INERT — see the file header. Base UI writes no `dir` on its portal, so
   * the region inherits direction from `<html>` and there is nothing for this
   * prop to fix. Kept required because the public API may not change, and kept
   * documented as inert because a stale justification is worse than no prop.
   */
  locale: Locale;
  /**
   * Announced name of the notification landmark, e.g. «اعلان‌ها».
   *
   * REQUIRED — Base UI's default is the English `"Notifications"`. See the file
   * header for the grep that establishes it is the module's only one.
   */
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

/**
 * Mount ONCE, near the root. It renders a portal root and an empty region; the
 * region has no toasts in it until one is queued, so it costs the served HTML a
 * single element.
 */
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
      // React Aria called this `maxVisibleToasts` on the queue's constructor;
      // Base UI calls it `limit` on the provider. Same meaning — the rest wait —
      // and the value still arrives from `createToastQueue`, so the public API
      // keeps it where it was.
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
