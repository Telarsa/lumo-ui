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
  /*
   * The promo card renders ONLY when the page actually rendered an `#evidence`
   * section — the same "the page passes exactly what it rendered" contract the
   * list itself has. A blocks page has no evidence section, and a card linking
   * to a fragment that does not exist would be the rail disagreeing with the
   * page, which is the one thing this component exists to make impossible.
   */
  const hasEvidence = items.some((i) => i.id === "evidence");
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
      {hasEvidence && (
        /*
         * The promo-style card: the differentiator, teased where docs sites
         * put their ads. The whole card is one link, so its accessible name is
         * its own visible, per-locale text.
         */
        <a
          href="#evidence"
          className="mt-6 block rounded-lg border border-border bg-surface-sunken p-3 transition-colors hover:bg-surface-hover"
        >
          <span className="block text-xs font-medium text-fg">
            {lang === "fa-IR"
              ? "این صفحه شواهدش را منتشر می‌کند"
              : "This page publishes its evidence"}
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-fg-muted">
            {lang === "fa-IR"
              ? "نام دسترس‌پذیر هر کنترل، محاسبه‌شده از همان بایت‌هایی که سرو می‌شوند."
              : "Every control's accessible name, computed from the same bytes that are served."}
          </span>
        </a>
      )}
    </div>
  );
}
