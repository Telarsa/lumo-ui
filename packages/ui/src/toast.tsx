"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  I18nProvider,
  Text as AriaText,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
  type QueuedToast,
} from "react-aria-components";
import { FORMAT_LOCALE, cn, type Locale, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";

/**
 * Transient notifications.
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
 * `"use client"` because `react-aria-components` is client-only, and because the
 * queue is a live subscription — a toast is by definition something that appears
 * after the first byte.
 *
 * ═══ THE PORTAL WRITES ITS OWN `dir`, AND YOU CANNOT PASS IT ONE ════════════
 *
 * `ToastRegion` is one of only two RAC components that stamps a `dir` attribute
 * on the element it renders — and it renders that element through
 * `createPortal(region, document.body)`, outside the app's own tree. Verified in
 * react-aria-components 1.20.0, `private/Toast.mjs`:
 *
 *     let {direction} = useLocale();
 *     ...
 *     <div {...mergeProps(DOMProps, renderProps, regionProps, focusProps, hoverProps)}
 *          dir={direction} ... />
 *     return state.visibleToasts.length > 0 && portalContainer
 *       ? createPortal(region, portalContainer) : null;
 *
 * Two facts follow, and both are load-bearing:
 *
 *  1. **`dir` is applied AFTER the prop spread**, so a `dir` passed into this
 *     component is silently discarded. There is no prop-shaped fix. (Lumo would
 *     refuse to expose one anyway — rule 3, there is no `dir` prop in this
 *     library — but it is worth knowing the door is bolted from the other side.)
 *
 *  2. **`useLocale()` is the only input.** With no `I18nProvider` mounted it
 *     falls back to `useDefaultLocale()`, which is `navigator.language` in the
 *     browser and, verified in `i18n/useDefaultLocale.mjs`, a hardcoded
 *     `{locale: 'en-US', direction: 'ltr'}` during SSR.
 *
 * A portaled `<div>` in `document.body` would normally INHERIT `dir="rtl"` from
 * `<html>` — `dir` is an inherited attribute, and `LumoHtml` puts it there. RAC
 * then overwrites that inheritance with its own guess. So a correct Persian page,
 * viewed on a machine whose browser is set to en-US, lays its toasts out
 * left-to-right: the close button jumps to the far side, the tone stripe moves
 * to the wrong edge, and everything else on the page is still RTL. Measured in
 * this repo's test run — `dir="ltr"` on the region with no provider,
 * `dir="rtl"` with one.
 *
 * The fix is the only one available: this component mounts an `I18nProvider`
 * around the region, from the SAME required `locale` prop the rest of Lumo
 * threads. Direction is still derived rather than passed — `I18nProvider`
 * computes it with `Intl.Locale.maximize().getTextInfo()`, the same source
 * `direction()` in `@lumo-ui/core` uses — so rule 3 holds.
 *
 * ── `label` IS REQUIRED, AND THE DEFAULT IS WORSE THAN PLAIN ENGLISH ────────
 *
 * `useToastRegion` names the landmark `props['aria-label'] ||
 * stringFormatter.format('notifications', {count})`, and the `en-US` bundle is:
 *
 *     "notifications": (args, formatter) => `${formatter.plural(args.count, {
 *        one: () => `${formatter.number(args.count)} notification`, ... })}.`
 *
 * So an unlabelled region announces `"1 notification."` — English, and with a
 * NUMBER formatted by RAC's own formatter. Under the `I18nProvider` above that
 * digit becomes Persian and the noun does not: measured `aria-label="۱
 * notification."`, which is the worst of both and exactly the kind of half-right
 * output that survives review. Persian is not among RAC's 34 bundles and will
 * not be, so `label` is a required prop.
 *
 * `closeLabel` is required for the same reason: `useToast` sets
 * `closeButtonProps['aria-label'] = stringFormatter.format('close')` → `"Close"`.
 * That one IS reachable — the value arrives through `ButtonContext`, and
 * `useContextProps` merges context first and local props second, so an
 * `aria-label` on the close button wins. Measured: `aria-label="بستن"`.
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
  /** Colour of the tone stripe. See `toastVariants` before relying on it. */
  tone?: ToastTone | undefined;
}

export type ToastTone = "neutral" | "positive" | "critical" | "caution";

/** The queue type, aliased so consumers never have to spell `UNSTABLE_`. */
export type LumoToastQueue = AriaToastQueue<LumoToastContent>;

/**
 * Creates the queue.
 *
 * Call this at MODULE scope, not inside a component:
 *
 *     export const toasts = createToastQueue();
 *
 * `ToastQueue` is a plain class with a subscription list, not a hook, and that
 * is the whole point — a fetch wrapper, a route handler's error branch or a
 * service worker message can raise a toast without being a React component and
 * without a context to reach for. `<ToastRegion>` subscribes to it.
 *
 * On `timeout`: pass it per toast, `toasts.add(content, { timeout: 5000 })`.
 * There is deliberately no default. An auto-dismissing toast is a moving target
 * under WCAG 2.2.1, and a library-chosen duration would be the one number nobody
 * revisits; RAC does pause every visible timer while the region is hovered or
 * focused (`useToastRegion` → `state.pauseAll()`), which is what makes a timeout
 * defensible at all. Anything a user must act on should have NO timeout.
 */
export function createToastQueue(options?: {
  /** How many toasts are on screen at once. The rest wait. */
  maxVisibleToasts?: number | undefined;
}): LumoToastQueue {
  return new AriaToastQueue<LumoToastContent>({
    ...(options?.maxVisibleToasts !== undefined
      ? { maxVisibleToasts: options.maxVisibleToasts }
      : {}),
  });
}

/**
 * Where the stack sits.
 *
 * `start`/`end` rather than `left`/`right`: the default `bottom-end` is the
 * bottom-LEFT corner on a Persian page and the bottom-right on an English one,
 * from one class, with no `rtl:` variant to forget. `bottom-*`/`top-*` stay
 * physical on purpose — the block axis does not mirror with reading direction,
 * and inventing a logical spelling for it would only obscure that.
 */
export const toastRegionVariants = cva(
  "fixed z-50 flex w-[min(24rem,90vw)] flex-col gap-2 outline-none",
  {
    variants: {
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
 * aloud by its text alone (RAC wraps the body in `role="alert"`). Put the word
 * in the title: «ذخیره نشد», not «ذخیره» in red.
 */
export const toastVariants = cva(
  "pointer-events-auto flex items-start gap-3 rounded-md border border-border " +
    "border-s-4 bg-surface p-4 text-sm text-fg shadow-lg outline-none",
  {
    variants: {
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
  toast: QueuedToast<LumoToastContent>;
  /**
   * Announced name of the dismiss control, e.g. «بستن».
   *
   * REQUIRED. RAC's own value is the English `"Close"` — see the file header.
   * It is an icon-only button, so there is no visible text to fall back on.
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
 * anticipate them.
 */
export function Toast({ toast, closeLabel, className }: ToastProps) {
  const { title, description, tone } = toast.content;
  return (
    // `data-lumo` because RAC gives the toast root `tabIndex={0}` — it is a real
    // focus stop (`role="alertdialog"`), so it needs the system focus ring.
    <AriaToast
      toast={toast}
      data-lumo=""
      className={cn(toastVariants({ tone: tone ?? "neutral" }), className)}
    >
      {/*
       * `ToastContent` carries `role="alert"` + `aria-atomic`, which is what
       * makes a toast announce itself on arrival. Everything meant to be spoken
       * has to be INSIDE it; the close button deliberately is not, or every
       * toast would announce its own dismiss control as part of the message.
       *
       * `min-w-0` keeps a long unbroken token — a filename, an order reference —
       * from pushing the toast wider than the region. In RTL that overflow
       * escapes to the LEFT, which is the side nobody checks at 320px.
       */}
      <AriaToastContent className="flex min-w-0 flex-1 flex-col gap-1">
        {/*
         * `Text`, not a bare `<p slot="title">`. The slot is not an HTML slot:
         * `useToast` mints a `titleId` and publishes it through `TextContext`,
         * and the toast root carries `aria-labelledby={titleId}` unconditionally.
         * A plain element with a `slot` attribute claims nothing, so the id is
         * never rendered and the toast points its accessible name at an element
         * that does not exist — the dangling-IDREF class `hydrated.test.tsx`
         * exists to catch. `form.tsx` uses `Text` for the same reason.
         */}
        <AriaText slot="title" elementType="p" className="font-semibold">
          {title}
        </AriaText>
        {description !== undefined ? (
          <AriaText slot="description" elementType="p" className="text-fg-muted">
            {description}
          </AriaText>
        ) : null}
      </AriaToastContent>

      {/*
       * `slot="close"` is how RAC wires `onPress` to `state.close(key)`. The
       * `label` prop of `IconButton` becomes `aria-label` and beats the "Close"
       * that arrives on the same slot through `ButtonContext`.
       *
       * `-me-1 -mt-1`: pulled toward the toast's inline END and block start.
       * The inline nudge is logical, so it lands on the left in Persian without
       * a second rule; the block nudge cannot mirror and does not need to.
       */}
      <IconButton
        slot="close"
        label={closeLabel}
        variant="ghost"
        size="sm"
        className="-me-1 -mt-1 shrink-0"
      >
        {/*
         * Drawn inline: a copy-in component with no icon dependency is one
         * fewer install for a consuming repo, and an ✕ is diagonally symmetric
         * so it is identical under mirroring. Same reasoning as `tag.tsx`.
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
    </AriaToast>
  );
}

export interface ToastRegionProps extends VariantProps<typeof toastRegionVariants> {
  /** The queue from `createToastQueue()`. */
  queue: LumoToastQueue;
  /**
   * The locale the region is rendered for.
   *
   * REQUIRED, and it does more here than format anything: it is the only way to
   * reach the `dir` RAC writes on its own portal root. See the file header.
   */
  locale: Locale;
  /**
   * Announced name of the notification landmark, e.g. «اعلان‌ها».
   *
   * REQUIRED — RAC's default is `"1 notification."`. See the file header.
   */
  label: string;
  /** Announced name of every toast's dismiss control, e.g. «بستن». REQUIRED. */
  closeLabel: string;
  className?: string | undefined;
}

/**
 * Mount ONCE, near the root. It renders nothing until a toast is queued —
 * `ToastRegion` returns `null` while `visibleToasts` is empty, so it costs the
 * served HTML nothing.
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
    // The provider must sit OUTSIDE the region: `useLocale()` is read during the
    // region's own render, and React context crosses `createPortal` (it follows
    // the React tree, not the DOM tree) — which is what makes this reach the
    // portaled node in `document.body` at all.
    //
    // `FORMAT_LOCALE`, not the bare tag: it carries `-u-ca-persian-nu-arabext`,
    // so any number RAC formats for itself lands in the same numbering system as
    // everything `formatNumber` produces. `isRTL()` maximizes the tag before
    // asking `getTextInfo()`, so the extensions do not disturb the direction.
    <I18nProvider locale={FORMAT_LOCALE[locale]}>
      <AriaToastRegion<LumoToastContent>
        queue={queue}
        aria-label={label}
        className={cn(toastRegionVariants({ placement }), className)}
      >
        {({ toast }) => <Toast toast={toast} closeLabel={closeLabel} />}
      </AriaToastRegion>
    </I18nProvider>
  );
}
