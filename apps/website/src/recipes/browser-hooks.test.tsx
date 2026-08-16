import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue, useMediaQuery } from "./browser-hooks";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("copyable browser hook recipes", () => {
  it("debounces updates and cancels the superseded timer", () => {
    vi.useFakeTimers();
    const view = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: "a" },
    });
    view.rerender({ value: "ab" });
    act(() => vi.advanceTimersByTime(199));
    expect(view.result.current).toBe("a");
    view.rerender({ value: "abc" });
    act(() => vi.advanceTimersByTime(200));
    expect(view.result.current).toBe("abc");
  });

  it("uses the caller's deterministic server snapshot and subscribes to changes", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({
      get matches() { return matches; },
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    }));
    const view = renderHook(() => useMediaQuery("(min-width: 60rem)", false));
    expect(view.result.current).toBe(false);
    act(() => {
      matches = true;
      for (const listener of listeners) listener();
    });
    expect(view.result.current).toBe(true);
  });
});
