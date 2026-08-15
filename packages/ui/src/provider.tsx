"use client";

import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { direction } from "@lumo-ui/core";
import { LumoLocaleContext } from "./locale.ts";
import { LumoLinkContext, type LumoLinkComponent } from "./link-context.ts";

/**
 * Mount this once, high in every Lumo application. It is not optional.
 *
 * `locale` is the ONLY input: it feeds `LumoLocaleContext` and Base UI's
 * `DirectionProvider` via `direction(locale)`. There is no `direction` prop and
 * there will not be one — Base UI's own provider defaults to `'ltr'` with
 * nothing tying it to any component's `locale`, and Persian digits sliding the
 * wrong way is the measured failure. `DirectionProvider` governs Base UI's
 * keyboard geometry only; `LumoHtml` owns the document's `dir` from the same
 * locale. It is INNERMOST so a nested `LumoProvider` overrides direction and
 * locale together. The React Aria `I18nProvider` bridge is gone (12 Aug 2026):
 * `list-box.tsx` and `tree.tsx` now read `useLumoLocale()`.
 */
export interface LumoProviderProps {
  /** The document's locale. Same value given to `LumoHtml`. No `direction` sibling: it is `direction(locale)`. */
  locale: Locale;
  /**
   * The app's own link component (Next's `Link`, TanStack Router's `Link`, …),
   * used by every Lumo family that renders an anchor — `Link`, `Item`, `Command`
   * rows, `NavigationMenuLink`. Omit for the platform `<a>`. It receives the
   * anchor's props (`href`, `className`, `aria-*`, `target`/`rel`, handlers).
   */
  linkComponent?: LumoLinkComponent | undefined;
  children: LumoNode;
}

/** The root provider: derives direction from `locale`, mounts Base UI's direction context, and hosts the managed overlay surfaces. */
export function LumoProvider({ locale, linkComponent, children }: LumoProviderProps) {
  return (
    <LumoLocaleContext.Provider value={locale}>
      <LumoLinkContext.Provider value={linkComponent ?? null}>
        <DirectionProvider direction={direction(locale)}>{children}</DirectionProvider>
      </LumoLinkContext.Provider>
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
