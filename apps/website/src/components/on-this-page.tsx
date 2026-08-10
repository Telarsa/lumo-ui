import type { Locale } from "@lumo-ui/core";

/**
 * The right-hand rail.
 *
 * Its headings are supplied rather than scraped from the DOM: this is a static
 * export, so there is no client pass to walk headings, and a rail built from a
 * hardcoded list would drift from the page the moment a section is renamed. The
 * page passes exactly the sections it rendered, so the two cannot disagree.
 *
 * `position: sticky` inside a grid column, not `fixed` — fixed positioning takes
 * the rail out of flow and it then overlaps content at narrow widths, in the
 * direction nobody tests.
 */
export function OnThisPage({
  lang,
  items,
}: {
  lang: Locale;
  items: ReadonlyArray<{ id: string; label: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label={lang === "fa-IR" ? "در این صفحه" : "On this page"}
      className="sticky top-24 hidden text-sm xl:block"
    >
      <h2 className="pbe-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {lang === "fa-IR" ? "در این صفحه" : "On this page"}
      </h2>
      <ul className="flex flex-col gap-2 border-s border-border ps-3">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="text-fg-muted hover:text-fg">
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
