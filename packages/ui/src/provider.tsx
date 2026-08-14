"use client";

import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { direction } from "@lumo-ui/core";
import { LumoLocaleContext } from "./locale.ts";

/**
 * Mount this once, high in every Lumo application. It is not optional.
 *
 * ═══ ONE PROP IN, TWO CONTEXTS OUT ═════════════════════════════════════════
 *
 * `locale` is the ONLY input, and everything else is derived from it inside
 * this function:
 *
 *     locale ──┬─► LumoLocaleContext   the locale and its strings
 *              └─► DirectionProvider   Base UI's direction, direction(locale)
 *
 * **There is no `direction` prop and there will not be one.** That is the whole
 * change in this file, and it is the thing Base UI's own provider gets wrong:
 * `DirectionProvider` takes `direction?: 'ltr' | 'rtl'` with `@default 'ltr'`
 * (`direction-provider/DirectionProvider.mjs:14` — `const { direction = 'ltr' }`).
 * So the two levers a Base UI application actually has — a per-component
 * `locale` prop on `Slider`/`NumberField`, and a global `DirectionProvider` —
 * are unrelated values with nothing tying them together, and the failure when
 * they disagree is Persian digits sliding the wrong way with nothing red
 * anywhere. `base-ui-i18n.json` records it as measured; `direction(locale)` is
 * how Lumo makes it unrepresentable. Passing a wrong direction is not
 * discouraged here, it does not compile.
 *
 * `direction()` asks `Intl.Locale.getTextInfo()` where available and falls back
 * to an exhaustive `Record<Locale, Direction>` on older Android engines. Adding
 * a locale cannot forget its direction because that record then stops compiling.
 *
 * ═══ THE REACT ARIA BRIDGE IS GONE, AND THIS IS WHAT IT WAS FOR ════════════
 *
 * Until 12 Aug 2026 this file also rendered React Aria's `<I18nProvider>`. It
 * was the LAST runtime `react-aria-components` construction in the shipped
 * library, and it survived the date migration because `list-box.tsx` and
 * `tree.tsx` still resolved direction, collation and typeahead order from RAC's
 * `useLocale()` — which read this provider and nothing else.
 *
 * The measurement that kept it alive, taken on `renderToStaticMarkup` of a
 * `<TreeItem>` inside `<LumoProvider locale="fa-IR">`, reading the expand
 * marker's turn class:
 *
 *     with I18nProvider      group-data-expanded/lumo-tree-item:-rotate-90   rtl
 *     without I18nProvider   group-data-expanded/lumo-tree-item:rotate-90    ltr
 *
 * A Persian page served with the marker turning the wrong way and
 * ArrowLeft/ArrowRight swapped with it, because React Aria fell back to
 * `navigator.language || 'en-US'` and there is no `navigator` on a server.
 *
 * Both components are now Lumo's own and read `useLumoLocale()`, so the bridge
 * has nothing left to serve and is deleted rather than kept "just in case".
 *
 * The DEFECT is recorded rather than the workaround, because it is the reason
 * this is a component with a required prop instead of a line of documentation,
 * and because the same shape recurs in every library that resolves i18n from
 * the browser: React Aria resolved its locale from `useDefaultLocale()`, which
 * reads `navigator.language` and falls back to `'en-US'`. Measured on a Slider
 * at value 40:
 *
 *     without a provider   left: 40%      measured from the wrong edge
 *     with fa-IR           left: 60%
 *
 * `lumo-gate` grades attributes and text; that is inline geometry which is
 * individually valid. It renders, it type-checks, and it looks plausible in a
 * screenshot — which is why it shipped for a day.
 *
 * ═══ WHAT `DirectionProvider` BUYS, AND WHAT IT DOES NOT ════════════════════
 *
 * Base UI reads it for keyboard geometry: arrow-key direction in `Menu`,
 * `Select`, `Tabs` and `Slider`, and the side/align resolution in the
 * positioner. It does NOT set `dir` on any element and it does not affect CSS —
 * `LumoHtml` owns the document's `dir`, derived from the same locale, and CSS
 * logical properties do the rest.
 *
 * So the two are not redundant: `LumoHtml` tells the BROWSER, this tells BASE
 * UI's JavaScript, and both read `direction(locale)`. Before this change the
 * Base UI half read nothing at all and defaulted to `ltr` on every Persian
 * page — a defect that never appeared in the served bytes, because it is a
 * keyboard behaviour.
 *
 * ═══ ORDER IS NOT ARBITRARY ═════════════════════════════════════════════════
 *
 * `DirectionProvider` is innermost so that a nested `LumoProvider` — a locale
 * switcher previewing the other direction inside a page, which the docs site
 * does — overrides direction and locale together. Nesting the direction outside
 * the locale would let an inner provider change one and inherit the other,
 * which is exactly the disagreement this file exists to prevent.
 */
export interface LumoProviderProps {
  /**
   * The document's locale. Same value given to `LumoHtml`.
   *
   * There is deliberately no `direction` sibling — see the header. Direction is
   * `direction(locale)` and cannot be overridden.
   */
  locale: Locale;
  children: LumoNode;
}

export function LumoProvider({ locale, children }: LumoProviderProps) {
  return (
    <LumoLocaleContext.Provider value={locale}>
      <DirectionProvider direction={direction(locale)}>{children}</DirectionProvider>
    </LumoLocaleContext.Provider>
  );
}

/* Global modal/command state. Markup remains caller-owned and therefore keeps
 * Dialog/Command's required announced strings at the composition site. */
export interface ManagedSurface<T> {
  id: string;
  value: T;
}

export interface LumoSurfaceManager<T> {
  open: (value: T) => string;
  update: (id: string, value: T) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => readonly ManagedSurface<T>[];
  getServerSnapshot: () => readonly ManagedSurface<T>[];
}

const EMPTY_SURFACES: readonly ManagedSurface<never>[] = [];

function createSurfaceManager<T>(limit?: number): LumoSurfaceManager<T> {
  let sequence = 0;
  let snapshot: readonly ManagedSurface<T>[] = [];
  const listeners = new Set<() => void>();
  const publish = (next: readonly ManagedSurface<T>[]) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  return {
    open(value) {
      const item = { id: `lumo-surface-${++sequence}`, value };
      const next = [...snapshot, item];
      publish(limit === undefined ? next : next.slice(-limit));
      return item.id;
    },
    update(id, value) {
      publish(snapshot.map((item) => (item.id === id ? { id, value } : item)));
    },
    dismiss(id) {
      publish(snapshot.filter((item) => item.id !== id));
    },
    dismissAll() {
      if (snapshot.length > 0) publish([]);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY_SURFACES as readonly ManagedSurface<T>[],
  };
}

/** Stack manager for globally rendered dialogs. */
export function createModalManager<T>(): LumoSurfaceManager<T> {
  return createSurfaceManager<T>();
}

/** Singleton manager for command palettes/spotlights; a new open replaces the old one. */
export function createCommandManager<T>(): LumoSurfaceManager<T> {
  return createSurfaceManager<T>(1);
}

export interface ManagedSurfacesProps<T> {
  /** The surface manager instance owning imperative overlays. */
  manager: LumoSurfaceManager<T>;
  /** The subtree the managed surfaces serve. */
  children: (item: ManagedSurface<T>) => LumoNode;
}

/** SSR-safe renderer: the server snapshot is always empty and deterministic. */
export function ManagedSurfaces<T>({ manager, children }: ManagedSurfacesProps<T>) {
  const items = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getServerSnapshot,
  );
  return items.map((item) => (
    <Fragment key={item.id}>{children(item) as ReactNode}</Fragment>
  ));
}
