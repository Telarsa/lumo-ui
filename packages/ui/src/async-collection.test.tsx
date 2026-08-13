import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  groupCollection,
  presentAsyncCollection,
  useAsyncCollection,
  type AsyncCollectionPage,
} from "./async-collection.ts";

interface Row {
  id: string;
  label: string;
  group?: string;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const rowKey = (row: Row) => row.id;

describe("useAsyncCollection", () => {
  it("loads pages once, replaces overlapping keys, and preserves their first position", async () => {
    const first = deferred<AsyncCollectionPage<Row, string>>();
    const second = deferred<AsyncCollectionPage<Row, string>>();
    const load = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const { result } = renderHook(() =>
      useAsyncCollection({ query: "open", queryKey: "open", getKey: rowKey, load }),
    );

    expect(result.current.status).toBe("loading");
    expect(result.current.items).toEqual([]);
    expect(load).toHaveBeenCalledWith({ query: "open", signal: expect.any(AbortSignal) });

    await act(async () => {
      first.resolve({
        items: [
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
        ],
        nextCursor: "page-2",
        totalCount: 3,
      });
      await first.promise;
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalCount).toBe(3);

    let loadMore!: Promise<void>;
    act(() => {
      loadMore = result.current.loadMore();
      void result.current.loadMore();
    });
    expect(result.current.status).toBe("loading-more");
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenLastCalledWith({
      query: "open",
      cursor: "page-2",
      signal: expect.any(AbortSignal),
    });

    await act(async () => {
      second.resolve({
        items: [
          { id: "b", label: "Beta updated" },
          { id: "c", label: "Gamma" },
        ],
        totalCount: 3,
      });
      await loadMore;
    });

    expect(result.current.items).toEqual([
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta updated" },
      { id: "c", label: "Gamma" },
    ]);
    expect(result.current.hasMore).toBe(false);

    await act(() => result.current.loadMore());
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("aborts the superseded request and ignores its result even when the loader ignores abort", async () => {
    const oldPage = deferred<AsyncCollectionPage<Row, string>>();
    const newPage = deferred<AsyncCollectionPage<Row, string>>();
    const signals: AbortSignal[] = [];
    const load = vi.fn(({ query, signal }: { query: string; signal: AbortSignal }) => {
      signals.push(signal);
      return query === "old" ? oldPage.promise : newPage.promise;
    });

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useAsyncCollection({ query, queryKey: query, getKey: rowKey, load }),
      { initialProps: { query: "old" } },
    );

    rerender({ query: "new" });
    expect(signals[0]?.aborted).toBe(true);

    await act(async () => {
      oldPage.resolve({ items: [{ id: "old", label: "Stale" }] });
      await oldPage.promise;
    });
    expect(result.current.status).toBe("loading");
    expect(result.current.items).toEqual([]);

    await act(async () => {
      newPage.resolve({ items: [{ id: "new", label: "Current" }] });
      await newPage.promise;
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.items).toEqual([{ id: "new", label: "Current" }]);
  });

  it("retries the failed operation and refreshes without discarding visible rows", async () => {
    const initialFailure = new Error("offline");
    const retryPage = deferred<AsyncCollectionPage<Row, string>>();
    const refreshPage = deferred<AsyncCollectionPage<Row, string>>();
    const load = vi
      .fn()
      .mockRejectedValueOnce(initialFailure)
      .mockImplementationOnce(() => retryPage.promise)
      .mockImplementationOnce(() => refreshPage.promise);

    const { result } = renderHook(() =>
      useAsyncCollection({ query: null, queryKey: "all", getKey: rowKey, load }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe(initialFailure);

    let retry!: Promise<void>;
    act(() => {
      retry = result.current.retry();
    });
    await act(async () => {
      retryPage.resolve({ items: [{ id: "a", label: "Alpha" }] });
      await retry;
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeUndefined();

    let refresh!: Promise<void>;
    act(() => {
      refresh = result.current.refresh();
    });
    expect(result.current.status).toBe("refreshing");
    expect(result.current.items).toEqual([{ id: "a", label: "Alpha" }]);

    await act(async () => {
      refreshPage.resolve({ items: [{ id: "b", label: "Beta" }] });
      await refresh;
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.items).toEqual([{ id: "b", label: "Beta" }]);
  });
});

describe("async collection presentation and grouping", () => {
  const messages = {
    loading: "Loading orders",
    loadingMore: "Loading more orders",
    refreshing: "Refreshing orders",
    empty: "No orders",
    retry: "Try again",
    loadMore: "Load more",
    error: (reason: unknown) => (reason instanceof Error ? reason.message : "Unknown error"),
  };

  it("maps controller state to caller-authored collection announcements and actions", () => {
    const retry = vi.fn();
    const loadMore = vi.fn();

    expect(
      presentAsyncCollection(
        { status: "error", error: new Error("Offline"), hasMore: false, retry, loadMore },
        messages,
      ),
    ).toEqual({ status: "error", text: "Offline", action: { label: "Try again", onPress: retry } });

    expect(
      presentAsyncCollection(
        { status: "ready", error: undefined, hasMore: true, retry, loadMore },
        messages,
      ),
    ).toEqual({ status: "ready", emptyText: "No orders", loadMore: { label: "Load more", onPress: loadMore } });

    expect(
      presentAsyncCollection(
        { status: "loading-more", error: undefined, hasMore: true, retry, loadMore },
        messages,
      ),
    ).toEqual({ status: "loading", text: "Loading more orders" });
  });

  it("groups in first-seen group order without reordering rows", () => {
    const groups = groupCollection(
      [
        { id: "1", label: "One", group: "b" },
        { id: "2", label: "Two", group: "a" },
        { id: "3", label: "Three", group: "b" },
      ],
      (row) => row.group ?? "none",
    );

    expect(groups).toEqual([
      { key: "b", items: [{ id: "1", label: "One", group: "b" }, { id: "3", label: "Three", group: "b" }] },
      { key: "a", items: [{ id: "2", label: "Two", group: "a" }] },
    ]);
  });
});
