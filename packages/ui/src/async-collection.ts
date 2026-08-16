"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** A page returned by an async collection loader. */
export interface AsyncCollectionPage<T, Cursor> {
  items: readonly T[];
  /** Omit this on the final page. Cursor values themselves must not be `undefined`. */
  nextCursor?: Cursor | undefined;
  /** The remote corpus size when the source knows it. */
  totalCount?: number | undefined;
}

export interface AsyncCollectionRequest<Query, Cursor> {
  query: Query;
  cursor?: Cursor | undefined;
  signal: AbortSignal;
}

export type AsyncCollectionStatus =
  | "loading"
  | "refreshing"
  | "loading-more"
  | "ready"
  | "error";

export interface AsyncCollectionOptions<T, Query, Cursor> {
  /** The complete request model handed to `load`. */
  query: Query;
  /**
   * Stable identity for the request model. A changed key aborts the old generation,
   * clears its rows and starts the new one; object identity is deliberately ignored.
   */
  queryKey: string | number;
  load: (
    request: AsyncCollectionRequest<Query, Cursor>,
  ) => Promise<AsyncCollectionPage<T, Cursor>>;
  /** Stable identity used to merge overlapping pages without duplicating rows. */
  getKey: (item: T) => string | number;
  /** Optional first paint. A following automatic load is reported as refreshing. */
  initialItems?: readonly T[] | undefined;
  /** Set false when loading is driven only by `refresh`. Defaults to true. */
  autoLoad?: boolean | undefined;
}

export interface AsyncCollectionResult<T> {
  items: readonly T[];
  status: AsyncCollectionStatus;
  error: unknown;
  hasMore: boolean;
  totalCount: number | undefined;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

interface CollectionState<T, Cursor> {
  items: readonly T[];
  status: AsyncCollectionStatus;
  error: unknown;
  nextCursor: Cursor | undefined;
  totalCount: number | undefined;
}

type Operation<Cursor> =
  | { kind: "initial" | "refresh" }
  | { kind: "more"; cursor: Cursor };

function mergePage<T>(
  current: readonly T[],
  incoming: readonly T[],
  getKey: (item: T) => string | number,
): readonly T[] {
  const next = [...current];
  const indexByKey = new Map(next.map((item, index) => [getKey(item), index] as const));
  for (const item of incoming) {
    const key = getKey(item);
    const existing = indexByKey.get(key);
    if (existing === undefined) {
      indexByKey.set(key, next.length);
      next.push(item);
    } else {
      next[existing] = item;
    }
  }
  return next;
}

/**
 * Owns cancellation, stale-result rejection, pagination, retry and refresh for
 * any remote Lumo collection without owning its transport or announced copy.
 */
export function useAsyncCollection<T, Query, Cursor = string>({
  query,
  queryKey,
  load,
  getKey,
  initialItems = [],
  autoLoad = true,
}: AsyncCollectionOptions<T, Query, Cursor>): AsyncCollectionResult<T> {
  const initialStatus: AsyncCollectionStatus = autoLoad
    ? initialItems.length === 0
      ? "loading"
      : "refreshing"
    : "ready";
  const [state, setState] = useState<CollectionState<T, Cursor>>({
    items: [...initialItems],
    status: initialStatus,
    error: undefined,
    nextCursor: undefined,
    totalCount: undefined,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const queryRef = useRef(query);
  const loadRef = useRef(load);
  const keyRef = useRef(getKey);
  queryRef.current = query;
  loadRef.current = load;
  keyRef.current = getKey;

  // Read by the reset effect below but NOT part of its identity (`queryKey` is the
  // explicit seam; a caller's inline `[]` must not reload). Kept current by an effect
  // declared BEFORE that one, so it has run by the time the reset reads it.
  const initialItemsRef = useRef(initialItems);
  useEffect(() => {
    initialItemsRef.current = initialItems;
  });

  const active = useRef<AbortController | null>(null);
  const failed = useRef<Operation<Cursor> | null>(null);

  const run = useCallback(async (operation: Operation<Cursor>) => {
    const controller = new AbortController();
    active.current = controller;
    const cursor = operation.kind === "more" ? operation.cursor : undefined;

    try {
      const page = await loadRef.current({
        query: queryRef.current,
        ...(cursor === undefined ? {} : { cursor }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      failed.current = null;
      setState((current) => ({
        items:
          operation.kind === "more"
            ? mergePage(current.items, page.items, keyRef.current)
            : [...page.items],
        status: "ready",
        error: undefined,
        nextCursor: page.nextCursor,
        totalCount: page.totalCount ?? current.totalCount,
      }));
    } catch (reason) {
      if (controller.signal.aborted) return;
      failed.current = operation;
      setState((current) => ({ ...current, status: "error", error: reason }));
    } finally {
      if (active.current === controller) active.current = null;
    }
  }, []);

  useEffect(() => {
    active.current?.abort();
    active.current = null;
    failed.current = null;
    const initial = initialItemsRef.current;
    const status: AsyncCollectionStatus = autoLoad
      ? initial.length === 0
        ? "loading"
        : "refreshing"
      : "ready";
    setState({
      items: [...initial],
      status,
      error: undefined,
      nextCursor: undefined,
      totalCount: undefined,
    });
    if (autoLoad) void run({ kind: "initial" });

    return () => {
      active.current?.abort();
      active.current = null;
    };
    // `queryKey` is the explicit identity seam. Callers do not need to memoize
    // query objects, loaders, key functions or initial arrays to avoid reloads.
  }, [autoLoad, queryKey, run]);

  const loadMore = useCallback((): Promise<void> => {
    const cursor = stateRef.current.nextCursor;
    if (active.current !== null || cursor === undefined) return Promise.resolve();
    setState((current) => ({ ...current, status: "loading-more", error: undefined }));
    return run({ kind: "more", cursor });
  }, [run]);

  const refresh = useCallback((): Promise<void> => {
    active.current?.abort();
    active.current = null;
    failed.current = null;
    const status = stateRef.current.items.length === 0 ? "loading" : "refreshing";
    setState((current) => ({ ...current, status, error: undefined }));
    return run({ kind: "refresh" });
  }, [run]);

  const retry = useCallback((): Promise<void> => {
    if (active.current !== null || failed.current === null) return Promise.resolve();
    const operation = failed.current;
    setState((current) => ({
      ...current,
      status:
        operation.kind === "more"
          ? "loading-more"
          : current.items.length === 0
            ? "loading"
            : "refreshing",
      error: undefined,
    }));
    return run(operation);
  }, [run]);

  return useMemo(
    () => ({
      items: state.items,
      status: state.status,
      error: state.error,
      hasMore: state.nextCursor !== undefined,
      totalCount: state.totalCount,
      loadMore,
      refresh,
      retry,
    }),
    [loadMore, refresh, retry, state],
  );
}

export interface AsyncCollectionAction {
  label: string;
  onPress: () => void;
}

export type AsyncCollectionPresentation =
  | { status: "loading" | "error"; text: string; action?: AsyncCollectionAction | undefined }
  | {
      status: "ready";
      emptyText: string;
      loadMore?: AsyncCollectionAction | undefined;
    };

export interface AsyncCollectionMessages {
  loading: string;
  refreshing: string;
  loadingMore: string;
  empty: string;
  retry: string;
  loadMore: string;
  error: (reason: unknown) => string;
}

/** Converts behavior state to required, caller-authored collection copy. */
export function presentAsyncCollection(
  collection: Pick<
    AsyncCollectionResult<unknown>,
    "status" | "error" | "hasMore" | "retry" | "loadMore"
  >,
  messages: AsyncCollectionMessages,
): AsyncCollectionPresentation {
  if (collection.status === "error") {
    return {
      status: "error",
      text: messages.error(collection.error),
      action: { label: messages.retry, onPress: collection.retry },
    };
  }
  if (collection.status === "loading") {
    return { status: "loading", text: messages.loading };
  }
  if (collection.status === "refreshing") {
    return { status: "loading", text: messages.refreshing };
  }
  if (collection.status === "loading-more") {
    return { status: "loading", text: messages.loadingMore };
  }
  return {
    status: "ready",
    emptyText: messages.empty,
    ...(collection.hasMore
      ? { loadMore: { label: messages.loadMore, onPress: collection.loadMore } }
      : {}),
  };
}

export interface CollectionGroup<T, GroupKey extends string | number> {
  key: GroupKey;
  items: readonly T[];
}

/** Groups rows in first-seen group order and preserves row order within each group. */
export function groupCollection<T, GroupKey extends string | number>(
  items: readonly T[],
  getGroupKey: (item: T) => GroupKey,
): readonly CollectionGroup<T, GroupKey>[] {
  const groups = new Map<GroupKey, T[]>();
  for (const item of items) {
    const key = getGroupKey(item);
    const group = groups.get(key);
    if (group === undefined) groups.set(key, [item]);
    else group.push(item);
  }
  return Array.from(groups, ([key, groupedItems]) => ({ key, items: groupedItems }));
}

/**
 * The shape of a TanStack Query result (`useQuery` / `useInfiniteQuery`), structurally — no dependency on
 * either library. `fetchStatus` (TanStack) tells a background refetch from a
 * first load; without it a refetch reads as a first load.
 */
export interface QueryLikeResult {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  data?: unknown;
  fetchStatus?: "fetching" | "paused" | "idle" | undefined;
  refetch: () => unknown;
  /** Infinite queries: whether another page exists and how to ask for it. */
  hasNextPage?: boolean | undefined;
  fetchNextPage?: (() => unknown) | undefined;
  isFetchingNextPage?: boolean | undefined;
}

/**
 * The adapter for apps that already own their data layer: a TanStack Query (or
 * `useInfiniteQuery`-shaped) result becomes the `asyncState` every Lumo collection accepts,
 * with the same required, caller-authored copy `presentAsyncCollection` takes.
 * Use it where `useAsyncCollection` would double-fetch what the app has.
 */
export function presentQueryResult(
  query: QueryLikeResult,
  messages: AsyncCollectionMessages,
): AsyncCollectionPresentation {
  const hasData = query.data !== undefined;
  const status: AsyncCollectionStatus = query.isError
    ? "error"
    : query.isFetchingNextPage === true
      ? "loading-more"
      : query.isPending || (!hasData && query.fetchStatus === "fetching")
        ? "loading"
        : query.fetchStatus === "fetching"
          ? "refreshing"
          : "ready";
  return presentAsyncCollection(
    {
      status,
      error: query.error,
      hasMore: query.hasNextPage === true,
      retry: async () => {
        await query.refetch();
      },
      loadMore: async () => {
        await query.fetchNextPage?.();
      },
    },
    messages,
  );
}
