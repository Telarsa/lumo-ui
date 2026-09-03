/**
 * The Lumo mark: a square with one corner taken by a radius, and that radius
 * is the only coloured part. Lumo means light, so the rounded corner is the
 * lit one. The body takes `currentColor`, so the same drawing sits on paper
 * and on ink; the lit corner is always the brand lime.
 *
 * The corner is on the reading side: top-start. In a right-to-left document
 * the drawing mirrors with the page, like an arrow would.
 */
export function LogoMark({ className, decorative }: { className?: string; decorative?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : "Lumo UI"}
      data-lumo-latn
      focusable="false"
      data-mark=""
    >
      <path fill="currentColor" d="M50 12 H88 V88 H12 V50 H50 Z" />
      <path d="M12 50 A38 38 0 0 1 50 12 L50 50 Z" fill="var(--lumo-sys-accent-mark)" />
    </svg>
  );
}

/** Mark plus wordmark. The wordmark is Latin in every locale by design, so it is marked rather than translated. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={className} data-logo="">
      <LogoMark decorative />
      <span data-logo-word="" data-lumo-latn dir="ltr">
        Lumo UI
      </span>
    </span>
  );
}
