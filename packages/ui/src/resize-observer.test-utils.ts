/** Installs a controllable ResizeObserver for measurement-driven component tests. */
export function resizeObserverHarness() {
  const original = globalThis.ResizeObserver;
  const observers = new Set<TestResizeObserver>();

  class TestResizeObserver implements ResizeObserver {
    readonly targets = new Set<Element>();

    constructor(readonly callback: ResizeObserverCallback) {
      observers.add(this);
    }

    observe(target: Element) {
      this.targets.add(target);
    }

    unobserve(target: Element) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
      observers.delete(this);
    }
  }

  globalThis.ResizeObserver = TestResizeObserver;

  return {
    trigger(target?: Element) {
      for (const observer of observers) {
        if (target !== undefined && !observer.targets.has(target)) continue;
        observer.callback([], observer);
      }
    },
    restore() {
      for (const observer of observers) observer.disconnect();
      if (original === undefined) Reflect.deleteProperty(globalThis, "ResizeObserver");
      else globalThis.ResizeObserver = original;
    },
  };
}
