/** Existing Lumo lit-corner mark from the public docs app, read 5 Oct 2026.
 * Source MIT: https://github.com/Telarsa/lumo-ui. Its palette stays product-owned. */
export function Brand() {
  return <span className="brand"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path fill="currentColor" d="M50 12H88V88H12V50H50Z" /><path d="M12 50A38 38 0 0 1 50 12L50 50Z" fill="var(--lumo-mark)" /></svg><span data-lumo-latn="" dir="ltr">Lumo UI</span></span>;
}

export function Arrow() {
  return <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}
