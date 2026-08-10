import type { Locale } from "@lumo-ui/core";

/**
 * The rail's own copy, keyed by locale rather than picked with a ternary.
 *
 * `lang === "fa-IR" ? … : …` compiles with a third locale in the union and hands
 * it the English branch silently — and this string is an `aria-label`, so the
 * only reader who would notice is the one using a screen reader. A
 * `Record<Locale, …>` makes adding a locale a compile error instead. See the
 * rule in CONTRIBUTING's "Adding a locale".
 *
 * One string, used twice: the `aria-label` and the visible heading say the same
 * thing, and they were two literals free to drift apart.
 */
const COPY = {
  "fa-IR": { onThisPage: "در این صفحه" },
  "en-US": { onThisPage: "On this page" },
} as const satisfies Record<Locale, { onThisPage: string }>;

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
  const t = COPY[lang];
  return (
    /*
     * `self-start`, or the sticky never sticks: as a grid child this div is
     * stretched to the article's full height by default, leaving zero sticky
     * travel — measured on the built page by the design review. Start-aligned,
     * its height is its content and it rides the scroll as intended.
     */
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
