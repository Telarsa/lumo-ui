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
    /*
     * `self-start`, or the sticky never sticks: as a grid child this div is
     * stretched to the article's full height by default, leaving zero sticky
     * travel — measured on the built page by the design review. Start-aligned,
     * its height is its content and it rides the scroll as intended.
     */
    <div className="sticky top-24 hidden self-start xl:block">
      <nav
        aria-label={lang === "fa-IR" ? "در این صفحه" : "On this page"}
        className="text-xs"
      >
        <h2 className="pbe-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {lang === "fa-IR" ? "در این صفحه" : "On this page"}
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
