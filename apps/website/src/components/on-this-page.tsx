import type { Locale } from "@lumo-ui/core";

/**
 * The rail's own copy, keyed by locale rather than a ternary, so a third locale
 * is a compile error instead of a silent English `aria-label`. One string used
 * twice (`aria-label` and visible heading) so they cannot drift apart.
 */
const COPY = {
  "fa-IR": { onThisPage: "در این صفحه" },
  "en-US": { onThisPage: "On this page" },
} as const satisfies Record<Locale, { onThisPage: string }>;

/**
 * The right-hand rail, rendered on the server: headings are supplied by the
 * page, not scraped from the DOM (static export), so the two cannot disagree.
 * `sticky` inside the grid column, not `fixed` (which overlaps at narrow widths).
 */
export function OnThisPage({
  lang,
  items,
}: {
  lang: Locale;
  items: ReadonlyArray<{ id: string; label: string }>;
}) {
  if (items.length === 0) return null;
  const t = COPY[lang];
  return (
    // `self-start`, or the sticky never sticks: a stretched grid child has zero
    // sticky travel.
    <div className="sticky top-24 hidden self-start xl:block">
      <nav aria-label={t.onThisPage} className="text-xs">
        <h2 className="pbe-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {t.onThisPage}
        </h2>
        <ul className="flex flex-col border-s border-border ps-3">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className="block py-1 text-fg-muted transition-colors hover:text-fg">
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
